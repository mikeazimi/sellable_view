import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * CHECK snapshot status and download/process when ready
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const body = await request.json()
    const snapshotId = body.snapshot_id

    if (!accessToken || !snapshotId) {
      return NextResponse.json({ success: false, error: "Auth and snapshot_id required" }, { status: 400 });
    }

    console.log('Checking snapshot:', snapshotId)

    const statusQuery = `
      query GetSnapshotStatus($snapshot_id: String!) {
        inventory_snapshot(snapshot_id: $snapshot_id) {
          snapshot {
            snapshot_id
            status
            snapshot_url
            error
          }
        }
      }
    `;

    const response = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ 
        query: statusQuery,
        variables: { snapshot_id: snapshotId }
      })
    });

    const result = await response.json()
    
    console.log('Full status response:', JSON.stringify(result, null, 2))
    
    const snapshot = result.data?.inventory_snapshot?.snapshot

    console.log('Snapshot status:', snapshot?.status)
    console.log('Snapshot URL:', snapshot?.snapshot_url || 'Not ready yet')
    console.log('Error:', snapshot?.error || 'None')

    if (snapshot?.status === 'error') {
      throw new Error(`Snapshot failed: ${snapshot.error}`)
    }

    if (snapshot?.status !== 'success') {
      // Still processing
      return NextResponse.json({
        success: true,
        status: snapshot?.status || 'processing',
        message: 'Snapshot still generating...'
      });
    }

    // Snapshot is ready! Download and process
    console.log('📥 Downloading snapshot...')
    
    const downloadResponse = await fetch(snapshot.snapshot_url)
    const snapshotData = await downloadResponse.json()

    console.log('✅ Downloaded')

    // Get location cache
    const { data: locationCache } = await supabaseAdmin
      .from('locations')
      .select('location, sellable, pickable')

    const locationMap = new Map()
    locationCache?.forEach(loc => {
      locationMap.set(loc.location, {
        sellable: loc.sellable,
        pickable: loc.pickable
      })
    })

    console.log(`📦 Loaded ${locationMap.size} locations`)

    // Transform snapshot
    const records: any[] = []

    Object.entries(snapshotData).forEach(([sku, skuData]: [string, any]) => {
      Object.entries(skuData.warehouse || {}).forEach(([warehouseId, whData]: [string, any]) => {
        Object.entries(whData.locations || {}).forEach(([locName, qty]: [string, any]) => {
          const locMeta = locationMap.get(locName) || { sellable: true, pickable: true }
          
          records.push({
            sku,
            location_name: locName,
            quantity: parseInt(qty) || 0,
            sellable: locMeta.sellable,
            pickable: locMeta.pickable,
            warehouse_identifier: whData.warehouse_name || 'Unknown',
            product_name: skuData.name || sku,
            barcode: skuData.barcode || null
          })
        })
      })
    })

    console.log(`📊 Prepared ${records.length} records`)

    // Clear old and insert new
    await supabaseAdmin.from('inventory_locations').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const chunkSize = 1000
    let inserted = 0

    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize)
      await supabaseAdmin.from('inventory_locations').insert(chunk)
      inserted += chunk.length
      console.log(`Inserted ${inserted}/${records.length}`)
    }

    console.log('✅ SYNC COMPLETE!')

    return NextResponse.json({
      success: true,
      status: 'complete',
      message: `Synced ${inserted} inventory records`,
      total: inserted
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

