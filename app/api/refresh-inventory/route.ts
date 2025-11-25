import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// In-memory storage for logs (temporary, per-instance)
const logStore: Record<string, string[]> = {};

/**
 * Triggered by manual button click
 * Runs live ShipHero query and updates Supabase cache
 */
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now()
  const startTimestamp = new Date().toLocaleString()
  const jobId = `job_${Date.now()}`
  logStore[jobId] = []
  
  const log = (message: string) => {
    console.log(message) // Server logs
    logStore[jobId].push(message) // Store for browser polling
  }
  
  try {
    const body = await request.json()
    const { customer_account_id, access_token, poll } = body
    
    // If this is a polling request, return accumulated logs
    if (poll && body.job_id) {
      const logs = logStore[body.job_id] || []
      return NextResponse.json({ logs, job_id: body.job_id })
    }
    
    if (!access_token || !customer_account_id) {
      return NextResponse.json({ 
        success: false, 
        error: "access_token and customer_account_id required" 
      }, { status: 400 });
    }

    log('⏱️ ================================================')
    log(`⏱️ REFRESH REQUEST STARTED: ${startTimestamp}`)
    log('⏱️ ================================================')
    log(`Customer Account ID: ${customer_account_id}`)

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

    // Optimized delay strategy: Complete in <5 minutes
    // 0.8s base + 3s every 5th + 5s every 10th = ~3.3 minutes total
    const getDelay = (pageNum: number) => {
      const baseDelay = 800 // 0.8 seconds between ALL pages
      
      if (pageNum % 10 === 0) {
        // Every 10th page: 0.8s + 5s = 5.8s total
        return baseDelay + 5000
      } else if (pageNum % 5 === 0) {
        // Every 5th page: 0.8s + 3s = 3.8s total
        return baseDelay + 3000
      }
      return baseDelay // 0.8s for all other pages
    }

    while (hasNextPage) {
      pageCount++
      const pageStart = Date.now()
      
      // Apply delay before fetching (except first page)
      if (pageCount > 1) {
        const delayMs = getDelay(pageCount - 1) // Check previous page
        const delaySec = (delayMs / 1000).toFixed(1)
        
        if (delayMs > 800) {
          // Log extra delay info for 5th/10th pages
          const extraInfo = (pageCount - 1) % 10 === 0 ? ' (10th page)' : ' (5th page)'
          log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] ⏸️  Waiting ${delaySec}s${extraInfo}`)
        }
        
        await delay(delayMs)
      }
    
      const query = `
        query ($customer_account_id: String, $cursor: String) {
          warehouse_products(customer_account_id: $customer_account_id, active: true) {
            request_id
            complexity
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

      log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] 📤 Fetching page ${pageCount}...`)

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
          log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] ⚠️  Rate limited - waiting 3s and retrying...`)
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
      
      log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] ✅ Page ${pageCount} complete (${pageElapsed}s)`)
      log(`   📊 Items: ${allItems.length} total | Used: ${complexity} credits | Remaining: ${creditsRemaining} credits`)
      log(`   💳 Total used: ${totalCreditsUsed} credits | Request ID: ${requestId}`)

      hasNextPage = data.pageInfo.hasNextPage
      cursor = data.pageInfo.endCursor
    }

    log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] 📊 Total items fetched: ${allItems.length}`)

    // Delete old inventory for this customer
    log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] 🗑️ Deleting old inventory...`)
    const { error: deleteError } = await supabaseAdmin
      .from('inventory_locations')
      .delete()
      .eq('account_id', customer_account_id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
    } else {
      log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] ✅ Old inventory deleted`)
    }

    // Insert new inventory
    log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] 💾 Inserting ${allItems.length} items...`)
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

    log('⏱️ ================================================')
    log(`⏱️ REFRESH COMPLETE: ${endTimestamp}`)
    log(`⏱️ Total Duration: ${totalElapsed}s`)
    log(`⏱️ Pages: ${pageCount}`)
    log(`⏱️ Records: ${allItems.length}`)
    log(`💳 Total credits used: ${totalCreditsUsed}`)
    log('⏱️ ================================================')

    // Clean up log store after 10 minutes
    setTimeout(() => delete logStore[jobId], 600000)

    return NextResponse.json({
      success: true,
      items_synced: allItems.length,
      pages_fetched: pageCount,
      duration_seconds: parseFloat(totalElapsed),
      total_credits_used: totalCreditsUsed,
      job_id: jobId,
      logs: logStore[jobId]
    });

  } catch (error: any) {
    const totalElapsed = ((Date.now() - requestStartTime) / 1000).toFixed(2)
    console.error(`⏱️ [${totalElapsed}s] 💥 Refresh error:`, error)
    log(`❌ Error: ${error.message}`)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      job_id: jobId,
      logs: logStore[jobId]
    }, { status: 500 });
  }
}
