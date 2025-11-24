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
    const body = await request.json().catch(() => ({}))
    const customerAccountId = body.customer_account_id || null

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    console.log('=== INVENTORY SNAPSHOT SYNC STARTED ===')
    console.log('Customer Account ID:', customerAccountId || 'All customers')

    // Step 1: Request snapshot generation using EXACT ShipHero mutation structure
    const generateMutation = `
      mutation GenerateInventorySnapshot(
        $customer_account_id: String
        $has_inventory: Boolean
        $new_format: Boolean
      ) {
        inventory_generate_snapshot(
          data: {
            customer_account_id: $customer_account_id
            has_inventory: $has_inventory
            new_format: $new_format
          }
        ) {
          request_id
          complexity
          snapshot {
            snapshot_id
            status
            snapshot_url
            snapshot_expiration
            error
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
      body: JSON.stringify({ 
        query: generateMutation,
        variables: {
          customer_account_id: customerAccountId || null,
          has_inventory: true, // Only include products with inventory
          new_format: true // Use new snapshot format
        }
      })
    });

    console.log('Mutation variables:', {
      customer_account_id: customerAccountId,
      has_inventory: true,
      new_format: true
    })

    if (!generateResponse.ok) {
      throw new Error(`Failed to generate snapshot: ${generateResponse.status}`)
    }

    const generateResult = await generateResponse.json()

    if (generateResult.errors) {
      throw new Error(`GraphQL error: ${generateResult.errors[0].message}`)
    }

    const snapshotId = generateResult.data?.inventory_generate_snapshot?.snapshot?.snapshot_id
    
    if (!snapshotId) {
      console.error('Generate result:', JSON.stringify(generateResult))
      throw new Error('No snapshot ID returned')
    }

    console.log(`✅ Snapshot requested: ${snapshotId}`)

    // Step 2: Poll until snapshot is ready (using exact ShipHero structure)
    let snapshotUrl: string | null = null
    let attempts = 0
    const maxAttempts = 60 // 30 minutes max (30 second intervals)

    while (!snapshotUrl && attempts < maxAttempts) {
      attempts++
      
      await new Promise(resolve => setTimeout(resolve, 30000)) // Wait 30 seconds (snapshots take time!)
      
      const statusQuery = `
        query GetSnapshotStatus($snapshot_id: String!) {
          inventory_snapshot(snapshot_id: $snapshot_id) {
            request_id
            complexity
            snapshot {
              snapshot_id
              status
              snapshot_url
              snapshot_expiration
              error
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
        body: JSON.stringify({ 
          query: statusQuery,
          variables: { snapshot_id: snapshotId }
        })
      });

      const statusResult = await statusResponse.json()
      const snapshot = statusResult.data?.inventory_snapshot?.snapshot

      console.log(`Poll ${attempts}/60: Status = ${snapshot?.status}`)

      if (snapshot?.status === 'success' && snapshot?.snapshot_url) {
        snapshotUrl = snapshot.snapshot_url
        console.log('✅ Snapshot ready for download!')
      } else if (snapshot?.status === 'error') {
        throw new Error(`Snapshot failed: ${snapshot?.error}`)
      } else {
        console.log('Still processing... will check again in 30s')
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

