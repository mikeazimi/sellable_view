import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Generate ShipHero inventory snapshot and sync to Supabase
 * Run this nightly via cron job
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    console.log('=== INVENTORY SNAPSHOT SYNC STARTED ===')

    // Step 1: Request snapshot generation
    const generateMutation = `
      mutation {
        inventory_generate_snapshot(data: {}) {
          request_id
          complexity
          snapshot {
            id
            status
            snapshot_url
            created_at
          }
        }
      }
    `;

    console.log('📤 Requesting inventory snapshot generation...')

    const generateResponse = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query: generateMutation })
    });

    if (!generateResponse.ok) {
      throw new Error(`Failed to generate snapshot: ${generateResponse.status}`)
    }

    const generateResult = await generateResponse.json()

    if (generateResult.errors) {
      throw new Error(`GraphQL error: ${generateResult.errors[0].message}`)
    }

    const snapshotId = generateResult.data?.inventory_generate_snapshot?.snapshot?.id
    
    if (!snapshotId) {
      throw new Error('No snapshot ID returned')
    }

    console.log(`✅ Snapshot requested: ${snapshotId}`)

    // Step 2: Poll until snapshot is ready
    let snapshotUrl: string | null = null
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max

    while (!snapshotUrl && attempts < maxAttempts) {
      attempts++
      
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      
      const statusQuery = `
        query {
          inventory_snapshot(snapshot_id: "${snapshotId}") {
            snapshot {
              id
              status
              snapshot_url
            }
          }
        }
      `;

      const statusResponse = await fetch('https://public-api.shiphero.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ query: statusQuery })
      });

      const statusResult = await statusResponse.json()
      const snapshot = statusResult.data?.inventory_snapshot?.snapshot

      console.log(`Poll ${attempts}: Status = ${snapshot?.status}`)

      if (snapshot?.status === 'completed' && snapshot?.snapshot_url) {
        snapshotUrl = snapshot.snapshot_url
      } else if (snapshot?.status === 'error') {
        throw new Error('Snapshot generation failed')
      }
    }

    if (!snapshotUrl) {
      throw new Error('Snapshot generation timed out')
    }

    console.log(`✅ Snapshot ready: ${snapshotUrl}`)

    // Step 3: Download snapshot JSON
    console.log('📥 Downloading snapshot...')
    
    const downloadResponse = await fetch(snapshotUrl)
    const snapshotData = await downloadResponse.json()

    console.log(`✅ Downloaded snapshot`)

    // Step 4: Get location metadata from our cache
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

    console.log(`📦 Loaded ${locationMap.size} locations from cache`)

    // Step 5: Transform and prepare for insert
    const inventoryRecords: any[] = []

    // Process snapshot data structure (SKUs with warehouse inventory)
    Object.entries(snapshotData).forEach(([sku, skuData]: [string, any]) => {
      Object.entries(skuData.warehouse || {}).forEach(([warehouseId, warehouseData]: [string, any]) => {
        const locations = warehouseData.locations || {}
        
        Object.entries(locations).forEach(([locationName, quantity]: [string, any]) => {
          const locationMeta = locationMap.get(locationName) || { sellable: true, pickable: true }
          
          inventoryRecords.push({
            sku: sku,
            location_name: locationName,
            quantity: parseInt(quantity) || 0,
            sellable: locationMeta.sellable,
            pickable: locationMeta.pickable,
            warehouse_id: warehouseId,
            warehouse_identifier: warehouseData.warehouse_name || 'Unknown',
            product_name: skuData.name || sku,
            barcode: skuData.barcode || null,
            account_id: null, // You can add customer account filtering if needed
            last_synced_at: new Date().toISOString()
          })
        })
      })
    })

    console.log(`📊 Prepared ${inventoryRecords.length} inventory records`)

    // Step 6: Clear old data and insert new
    console.log('🗑️  Clearing old inventory...')
    
    const { error: deleteError } = await supabaseAdmin
      .from('inventory_locations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
      console.warn('Delete warning:', deleteError)
    }

    // Step 7: Bulk insert in chunks
    console.log('💾 Inserting new inventory...')
    
    const chunkSize = 1000
    let inserted = 0

    for (let i = 0; i < inventoryRecords.length; i += chunkSize) {
      const chunk = inventoryRecords.slice(i, i + chunkSize)
      
      const { error } = await supabaseAdmin
        .from('inventory_locations')
        .insert(chunk)

      if (error) {
        console.error(`Error at chunk ${i}:`, error)
        throw new Error(`Failed to insert chunk: ${error.message}`)
      }

      inserted += chunk.length
      console.log(`Inserted ${inserted}/${inventoryRecords.length}`)
    }

    console.log('✅ SYNC COMPLETE!')

    return NextResponse.json({
      success: true,
      message: `Synced ${inserted} inventory records`,
      meta: {
        total_records: inserted,
        snapshot_id: snapshotId,
        synced_at: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

