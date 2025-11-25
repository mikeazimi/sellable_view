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
    
    // Track credit pool (ShipHero max: 4004 credits)
    let creditsRemaining = 4004
    let totalCreditsUsed = 0

    // Helper to delay between requests (rate limiting)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Delay strategy: 1.5s base + 5s every 5 pages + 8s every 10 pages
    const getDelay = (pageNum: number) => {
      const baseDelay = 1500 // 1.5 seconds between ALL pages
      
      if (pageNum % 10 === 0) {
        // Every 10th page: 1.5s + 8s = 9.5s total
        return baseDelay + 8000
      } else if (pageNum % 5 === 0) {
        // Every 5th page: 1.5s + 5s = 6.5s total
        return baseDelay + 5000
      }
      return baseDelay // 1.5s for all other pages
    }

    while (hasNextPage) {
      pageCount++
      const pageStart = Date.now()
      
      // Apply delay before fetching (except first page)
      if (pageCount > 1) {
        const delayMs = getDelay(pageCount - 1) // Check previous page
        const delaySec = (delayMs / 1000).toFixed(1)
        
        if (delayMs > 1500) {
          // Log extra delay info for 5th/10th pages
          const extraInfo = (pageCount - 1) % 10 === 0 ? ' (10th page)' : ' (5th page)'
          console.log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] ⏸️  Waiting ${delaySec}s${extraInfo}`)
        }
        
        await delay(delayMs)
      }
      
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
        const errorMsg = result.errors[0].message
        // If rate limited, wait and retry
        if (errorMsg.includes('not enough credits')) {
          console.log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] ⚠️  Rate limited - waiting 3s and retrying...`)
          await delay(3000)
          // Retry this same page
          pageCount--
          continue
        }
        throw new Error(errorMsg)
      }

      const warehouseProducts = result.data?.warehouse_products
      if (!warehouseProducts) {
        throw new Error('No warehouse_products in response')
      }
      
      const data = warehouseProducts.data
      if (!data) {
        throw new Error('No data returned from ShipHero')
      }

      // Extract complexity/credits info from response
      const complexity = warehouseProducts.complexity || 0
      const requestId = warehouseProducts.request_id || 'N/A'

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
      
      // Update credit tracking
      totalCreditsUsed += complexity
      creditsRemaining = Math.max(0, 4004 - totalCreditsUsed)
      
      console.log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] ✅ Page ${pageCount} complete (${pageElapsed}s)`)
      console.log(`   📊 Items: ${allItems.length} total | Used: ${complexity} credits | Remaining: ${creditsRemaining} credits`)
      console.log(`   💳 Total used: ${totalCreditsUsed} credits | Request ID: ${requestId}`)

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
      duration_seconds: parseFloat(totalElapsed),
      total_credits_used: totalCreditsUsed
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

