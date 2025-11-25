import { NextRequest, NextResponse } from "next/server";

/**
 * Fetch ONE PAGE of warehouse_products from ShipHero
 * Frontend handles pagination loop
 */
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
      customer_account_id: customerAccountId,
      cursor
    }

    console.log(`📤 Fetching ONE page (cursor: ${cursor ? cursor.substring(0, 20) + '...' : 'first page'})`)

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

    const result = await response.json()

    if (result.errors) {
      console.error('GraphQL errors:', result.errors)
      return NextResponse.json({ 
        success: false, 
        error: result.errors[0].message,
        errors: result.errors
      }, { status: 500 });
    }

    const warehouseProducts = result.data?.warehouse_products
    if (!warehouseProducts) {
      throw new Error('No warehouse_products in response')
    }

    const elapsed = ((Date.now() - requestStartTime) / 1000).toFixed(2)
    console.log(`✅ Page fetched in ${elapsed}s | Complexity: ${warehouseProducts.complexity}`)

    // Return the single page of data
    return NextResponse.json({
      success: true,
      data: warehouseProducts.data,
      complexity: warehouseProducts.complexity,
      request_id: warehouseProducts.request_id,
      pageInfo: warehouseProducts.data.pageInfo,
      fetch_time: elapsed
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
