import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")
    const cursor = searchParams.get("cursor") || null
    const filterSellable = searchParams.get("filter_sellable") || 'all'
    const filterPickable = searchParams.get("filter_pickable") || 'all'

    console.log('=== INVENTORY API (locations with inventory) ===')
    console.log('Customer:', customerAccountId)
    console.log('Cursor:', cursor || 'null (first page)')
    console.log('Filters:', { sellable: filterSellable, pickable: filterPickable })

    if (!accessToken || !customerAccountId) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 400 });
    }

    // Build filter arguments for locations query
    const filters: string[] = []
    if (filterSellable === 'sellable') filters.push('sellable: true')
    if (filterSellable === 'non-sellable') filters.push('sellable: false')
    if (filterPickable === 'pickable') filters.push('pickable: true')
    if (filterPickable === 'non-pickable') filters.push('pickable: false')
    
    const filterString = filters.length > 0 ? filters.join(', ') + ',' : ''

    // Query locations with filters, get inventory for each location
    const query = `
      query ($customer_account_id: String, $cursor: String) {
        locations(
          ${filterString}
          first: 250,
          after: $cursor
        ) {
          request_id
          complexity
          data {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                name
                warehouse_id
                pickable
                sellable
                inventory(first: 100) {
                  edges {
                    node {
                      sku
                      on_hand
                      product {
                        name
                        active
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

    console.log('📤 Fetching locations (250 per page)')

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

    console.log('✅ Page fetched successfully')

    // Return the ShipHero data structure - frontend will process
    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        complexity: result.data?.locations?.complexity,
        request_id: result.data?.locations?.request_id
      }
    });
  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
