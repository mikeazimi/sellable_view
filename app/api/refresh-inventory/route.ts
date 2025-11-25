import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// In-memory storage for logs and job status
const jobStore: Record<string, {
  logs: string[]
  status: 'running' | 'completed' | 'failed'
  result?: any
  error?: string
}> = {};

/**
 * GET - Poll for job status and logs
 */
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('job_id')
  
  if (!jobId || !jobStore[jobId]) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  
  return NextResponse.json(jobStore[jobId])
}

/**
 * POST - Start refresh job
 */
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now()
  const startTimestamp = new Date().toLocaleString()
  const jobId = `job_${Date.now()}`
  
  // Initialize job storage
  jobStore[jobId] = {
    logs: [],
    status: 'running'
  }
  
  const log = (message: string) => {
    console.log(message) // Server logs
    jobStore[jobId].logs.push(message) // Store for polling
  }
  
  // Start job in background (non-blocking)
  (async () => {
    try {
      const body = await request.json()
      const { customer_account_id, access_token } = body
      
      if (!access_token || !customer_account_id) {
        log('❌ Error: access_token and customer_account_id required')
        jobStore[jobId].status = 'failed'
        jobStore[jobId].error = 'Missing credentials'
        return
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
      let totalCreditsUsed = 0

      // Helper to delay between requests (rate limiting)
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

      // ULTRA-AGGRESSIVE timing: Must complete in <4:45 to avoid timeout
      // 85 pages × 2.5s avg = 212s + 17s delays = ~229s (3.8 min) with buffer
      const getDelay = (pageNum: number) => {
        const baseDelay = 200 // 0.2 seconds between ALL pages
        
        // No extra delays - base delay is enough with reduced locations
        return baseDelay
      }

      while (hasNextPage) {
        pageCount++
        const pageStart = Date.now()
        
        // Apply delay before fetching (except first page)
        if (pageCount > 1) {
          const delayMs = getDelay(pageCount - 1)
          const delaySec = (delayMs / 1000).toFixed(1)
          
          // No extra logging for delays since they're all the same now
          
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
                    locations(first: 18) {
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
          if (errorMsg.includes('not enough credits')) {
            log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] ⚠️  Rate limited - waiting 3s and retrying...`)
            await delay(3000)
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
        
        log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] ✅ Page ${pageCount} complete (${pageElapsed}s)`)
        log(`   📊 Items: ${allItems.length} total | Page used: ${complexity} credits | Total used: ${totalCreditsUsed} credits`)

        hasNextPage = data.pageInfo.hasNextPage
        cursor = data.pageInfo.endCursor
      }

      log(`⏱️ [${((Date.now() - requestStartTime) / 1000).toFixed(2)}s] 📊 Total items fetched: ${allItems.length}`)
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

      jobStore[jobId].status = 'completed'
      jobStore[jobId].result = {
        items_synced: allItems.length,
        pages_fetched: pageCount,
        duration_seconds: parseFloat(totalElapsed),
        total_credits_used: totalCreditsUsed
      }

      // Clean up after 10 minutes
      setTimeout(() => delete jobStore[jobId], 600000)

    } catch (error: any) {
      const totalElapsed = ((Date.now() - requestStartTime) / 1000).toFixed(2)
      console.error(`⏱️ [${totalElapsed}s] 💥 Refresh error:`, error)
      log(`❌ Error: ${error.message}`)
      jobStore[jobId].status = 'failed'
      jobStore[jobId].error = error.message
    }
  })()
  
  // Return job ID immediately so frontend can start polling
  return NextResponse.json({ job_id: jobId, status: 'started' })
}
