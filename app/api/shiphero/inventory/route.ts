import { NextRequest, NextResponse } from "next/server";

/**
 * Correct implementation per ShipHero API documentation
 * Uses warehouse_products with proper pagination structure
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")
    const cursor = searchParams.get("cursor") || null

    console.log('=== INVENTORY API (warehouse_products) ===')
    console.log('Customer:', customerAccountId)
    console.log('Cursor:', cursor || 'first page')

    if (!accessToken || !customerAccountId) {
      return NextResponse.json({ 
        success: false, 
        error: "Auth and customer_account_id required" 
      }, { status: 400 });
    }

    // CORRECT query structure per ShipHero docs
    const query = `
      query ($customer_account_id: String, $cursor: String) {
        warehouse_products(
          customer_account_id: $customer_account_id
          active: true
        ) {
          request_id
          complexity
          data(first: 50, after: $cursor) {
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
                locations(first: 30) {
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
    `;

    const variables = {
      customer_account_id: customerAccountId,
      cursor: cursor
    }

    console.log('📤 Fetching page...')

    const response = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query, variables })
    });

    console.log('📥 Status:', response.status)

    if (!response.ok) {
      const text = await response.text()
      console.error('HTTP error:', text.substring(0, 500))
      return NextResponse.json({ 
        success: false, 
        error: `HTTP ${response.status}`,
        details: text.substring(0, 500)
      }, { status: 500 });
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

    console.log('✅ Page fetched')

    // Return full ShipHero response for frontend processing
    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        complexity: result.data?.warehouse_products?.complexity,
        request_id: result.data?.warehouse_products?.request_id
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
