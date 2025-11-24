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
    const filterSellable = searchParams.get("filter_sellable") || 'all'
    const filterPickable = searchParams.get("filter_pickable") || 'all'
    
    console.log('=== INVENTORY API (Pre-Filtered) ===')
    console.log('Customer ID:', customerAccountId)
    console.log('Cursor:', cursor ? cursor.substring(0, 20) + '...' : 'null (first page)')
    console.log('Pre-filters:', { sellable: filterSellable, pickable: filterPickable })

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    if (!customerAccountId) {
      return NextResponse.json({ success: false, error: "customer_account_id required" }, { status: 400 });
    }

    // Fetch all locations, filter server-side after (locations field doesn't accept filter args)
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
    
    console.log('Will filter sellable/pickable server-side after fetch')

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

    // Apply server-side filters to reduce data sent to client
    const rawData = result.data
    
    if (filterSellable !== 'all' || filterPickable !== 'all') {
      console.log('Applying server-side filters...')
      
      const edges = rawData?.warehouse_products?.data?.edges || []
      const filteredEdges = edges.map((edge: any) => {
        const product = edge.node
        const locationEdges = product.locations?.edges || []
        
        // Filter locations based on sellable/pickable
        const filteredLocationEdges = locationEdges.filter(({ node: itemLoc }: any) => {
          if (filterSellable === 'sellable' && !itemLoc.location?.sellable) return false
          if (filterSellable === 'non-sellable' && itemLoc.location?.sellable) return false
          if (filterPickable === 'pickable' && !itemLoc.location?.pickable) return false
          if (filterPickable === 'non-pickable' && itemLoc.location?.pickable) return false
          return true
        })
        
        return {
          ...edge,
          node: {
            ...product,
            locations: {
              edges: filteredLocationEdges
            }
          }
        }
      })
      
      // Update the data with filtered locations
      rawData.warehouse_products.data.edges = filteredEdges
      
      console.log(`✅ Filtered server-side - reduced data transfer`)
    }
    
    return NextResponse.json({
      success: true,
      data: rawData,
      meta: {
        complexity: rawData?.warehouse_products?.complexity,
        request_id: rawData?.warehouse_products?.request_id,
        filters_applied: filterSellable !== 'all' || filterPickable !== 'all'
      }
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
