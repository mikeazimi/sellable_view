import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Triggered by manual button click
 * Runs live ShipHero query and updates Supabase cache
 */
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now()
  const startTimestamp = new Date().toLocaleString()
  
  try {
    const body = await request.json()
    const { customer_account_id, access_token } = body
    
    if (!access_token || !customer_account_id) {
      return NextResponse.json({ 
        success: false, 
        error: "access_token and customer_account_id required" 
      }, { status: 400 });
    }

    console.log('⏱️ ================================================')
    console.log(`⏱️ REFRESH REQUEST STARTED: ${startTimestamp}`)
    console.log('⏱️ ================================================')
    console.log('Customer Account ID:', customer_account_id)

    // Query ShipHero warehouse_products with pagination
    let allItems: any[] = []
    let cursor: string | null = null
    let hasNextPage = true
    let pageCount = 0

    while (hasNextPage) {
      pageCount++
      const pageStart = Date.now()
      
      const query = `
        query ($customer_account_id: String, $cursor: String) {
          warehouse_products(customer_account_id: $customer_account_id, active: true) {
            data(first: 45, after: $cursor) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  sku
                  active
                  warehouse_identifier
                  product {
                    name
                  }
                  locations(first: 20) {
                    edges {
                      node {
                        quantity
                        location {
                          name
                          warehouse_id
                          pickable
                          sellable
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `

      const variables = {
        customer_account_id,
        cursor
      }

      console.log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] 📤 Fetching page ${pageCount}...`)

      const response = await fetch('https://public-api.shiphero.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({ query, variables })
      })

      if (!response.ok) {
        throw new Error(`ShipHero API error: ${response.status}`)
      }

      const result = await response.json()

      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      const data = result.data?.warehouse_products?.data
      if (!data) {
        throw new Error('No data returned from ShipHero')
      }

      // Process this page
      const products = data.edges || []
      for (const edge of products) {
        const product = edge.node
        const locations = product.locations?.edges || []
        
        for (const locEdge of locations) {
          const loc = locEdge.node
          if (loc.quantity > 0) {
            allItems.push({
              sku: product.sku,
              productName: product.product?.name || product.sku,
              quantity: loc.quantity,
              location: loc.location.name,
              pickable: loc.location.pickable,
              sellable: loc.location.sellable,
              warehouse: product.warehouse_identifier,
              type: 'Bin',
              barcode: ''
            })
          }
        }
      }

      const pageElapsed = ((Date.now() - pageStart) / 1000).toFixed(2)
      console.log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] ✅ Page ${pageCount} complete (${pageElapsed}s) - ${allItems.length} items so far`)

      hasNextPage = data.pageInfo.hasNextPage
      cursor = data.pageInfo.endCursor
    }

    console.log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] 📊 Total items fetched: ${allItems.length}`)

    // Delete old inventory for this customer
    console.log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] 🗑️ Deleting old inventory...`)
    const { error: deleteError } = await supabaseAdmin
      .from('inventory_locations')
      .delete()
      .eq('account_id', customer_account_id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
    } else {
      console.log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] ✅ Old inventory deleted`)
    }

    // Insert new inventory
    console.log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] 💾 Inserting ${allItems.length} items...`)
    const records = allItems.map(item => ({
      sku: item.sku,
      location_name: item.location,
      quantity: item.quantity,
      sellable: item.sellable,
      pickable: item.pickable,
      warehouse_identifier: item.warehouse,
      product_name: item.productName,
      barcode: item.barcode || null,
      account_id: customer_account_id,
      last_synced_at: new Date().toISOString()
    }))

    const { error } = await supabaseAdmin
      .from('inventory_locations')
      .insert(records)

    if (error) {
      throw new Error(error.message)
    }

    const totalElapsed = ((Date.now() - requestStartTime) / 1000).toFixed(2)
    const endTimestamp = new Date().toLocaleString()

    console.log('⏱️ ================================================')
    console.log(`⏱️ REFRESH COMPLETE: ${endTimestamp}`)
    console.log(`⏱️ Total Duration: ${totalElapsed}s`)
    console.log(`⏱️ Pages: ${pageCount}`)
    console.log(`⏱️ Records: ${allItems.length}`)
    console.log('⏱️ ================================================')

    return NextResponse.json({
      success: true,
      items_synced: allItems.length,
      pages_fetched: pageCount,
      duration_seconds: parseFloat(totalElapsed)
    });

  } catch (error: any) {
    const totalElapsed = ((Date.now() - requestStartTime) / 1000).toFixed(2)
    console.error(`⏱️ [${totalElapsed}s] 💥 Refresh error:`, error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

