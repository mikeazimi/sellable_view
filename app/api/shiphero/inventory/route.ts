import { NextRequest, NextResponse } from "next/server";

/**
 * Fetch ONE PAGE of warehouse_products from ShipHero
 * Frontend handles pagination loop
 */
/**
 * Helper to parse wait time from ShipHero error message
 * Example: "In 2 seconds you will have enough credits" -> 2
 */
function parseWaitTime(errorMessage: string): number {
  const match = errorMessage.match(/In (\d+) seconds?/)
  return match ? parseInt(match[1]) : 2
}

export async function GET(request: NextRequest) {
  const requestStartTime = Date.now()
  
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id") || 'Q3VzdG9tZXJBY2NvdW50Ojg4Nzc0'
    const cursor = searchParams.get("cursor") || null

    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: "Authorization required" 
      }, { status: 401 });
    }

    const query = `
      query GetWarehouseProducts($customer_account_id: String, $cursor: String) {
        warehouse_products(customer_account_id: $customer_account_id, active: true) {
          request_id
          complexity
          data(first: 20, after: $cursor) {
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
                locations(first: 199) {
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
      customer_account_id: customerAccountId,
      cursor
    }

    console.log(`📤 Fetching ONE page (cursor: ${cursor ? cursor.substring(0, 20) + '...' : 'first page'})`)

    // Retry logic for credit throttling (code 30)
    let retryCount = 0
    const maxRetries = 3
    let result: any = null
    let wasThrottled = false
    let throttleWaitTime = 0
    let remainingCredits: number | null = null

    while (retryCount <= maxRetries) {
      const response = await fetch('https://public-api.shiphero.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ query, variables })
      })

      if (!response.ok) {
        throw new Error(`ShipHero API error: ${response.status}`)
      }

      result = await response.json()

      // Check for credit throttling error (code 30)
      if (result.errors && result.errors[0]?.code === 30) {
        const error = result.errors[0]
        const errorMsg = error.message
        
        // Fixed 30 second wait on credit throttle
        const waitTime = 30
        wasThrottled = true
        throttleWaitTime = waitTime
        remainingCredits = error.remaining_credits || null
        
        console.log(`⚠️  Credit throttle hit (attempt ${retryCount + 1}/${maxRetries + 1})`)
        console.log(`⚠️  Required: ${error.required_credits} credits | Available: ${error.remaining_credits}`)
        console.log(`⏱️  Credit throttle detected. Waiting ${waitTime}s to allow credits to replenish...`)
        
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
          retryCount++
          continue // Retry the request
        } else {
          // Max retries exceeded
          return NextResponse.json({ 
            success: false, 
            error: `Max retries exceeded. ${errorMsg}`,
            code: 30
          }, { status: 429 });
        }
      }

      // Check for other errors
      if (result.errors) {
        console.error('GraphQL errors:', result.errors)
        return NextResponse.json({ 
          success: false, 
          error: result.errors[0].message,
          errors: result.errors
        }, { status: 500 });
      }

      // Success - break out of retry loop
      break
    }

    const warehouseProducts = result.data?.warehouse_products
    if (!warehouseProducts) {
      throw new Error('No warehouse_products in response')
    }

    const elapsed = ((Date.now() - requestStartTime) / 1000).toFixed(2)
    const creditsUsed = warehouseProducts.complexity || 0
    
    console.log(`✅ Page fetched in ${elapsed}s | Complexity: ${creditsUsed} | Retries: ${retryCount}`)
    if (wasThrottled) {
      console.log(`⚠️  Was throttled - waited ${throttleWaitTime}s`)
    }

    // Return the single page of data with credit monitoring info
    return NextResponse.json({
      success: true,
      data: warehouseProducts.data,
      complexity: creditsUsed,
      request_id: warehouseProducts.request_id,
      pageInfo: warehouseProducts.data.pageInfo,
      fetch_time: elapsed,
      credits_used: creditsUsed,
      remaining_credits: remainingCredits,
      was_throttled: wasThrottled,
      throttle_wait_time: throttleWaitTime
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
