import { NextRequest, NextResponse } from "next/server";

/**
 * Fetch ONE page of inventory data
 * Frontend will loop and call this multiple times
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")
    const cursor = searchParams.get("cursor") || null

    console.log('=== INVENTORY API (Single Page) ===')
    console.log('Customer ID:', customerAccountId)
    console.log('Cursor:', cursor ? cursor.substring(0, 20) + '...' : 'null (first page)')

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    if (!customerAccountId) {
      return NextResponse.json({ success: false, error: "customer_account_id required" }, { status: 400 });
    }

    const query = `
      query ($customer_account_id: String, $cursor: String) {
        warehouse_products(
          customer_account_id: $customer_account_id
          active: true
        ) {
          request_id
          complexity
          data(first: 40, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                sku
                warehouse_identifier
                product {
                  name
                  barcode
                }
                locations(first: 40) {
                  edges {
                    node {
                      quantity
                      location {
                        name
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

    const response = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query, variables })
    });

    console.log('ShipHero response:', response.status)

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

    // Return the FULL ShipHero response - frontend will handle it
    console.log('✅ Returning one page of data')
    
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
