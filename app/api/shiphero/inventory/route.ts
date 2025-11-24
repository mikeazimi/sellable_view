import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")

    console.log('=== INVENTORY API (Reduced Batch Size) ===')

    if (!accessToken || !customerAccountId) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 400 });
    }

    // Reduced batch size: 25 products x 25 locations = stays under 4004 credits
    const query = `
      query ($customer_account_id: String, $cursor: String) {
        warehouse_products(
          customer_account_id: $customer_account_id
          active: true
        ) {
          request_id
          complexity
          data(first: 25, after: $cursor) {
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
                locations(first: 25) {
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

    console.log('📤 Fetching with reduced batch size (25x25)')

    const allProducts: any[] = []
    let hasNextPage = true
    let cursor: string | undefined = undefined
    let pageCount = 0

    while (hasNextPage && pageCount < 200) {
      pageCount++
      
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

      if (!response.ok) {
        const text = await response.text()
        console.error('HTTP error page', pageCount, ':', text.substring(0, 300))
        return NextResponse.json({ 
          success: false, 
          error: `HTTP ${response.status} on page ${pageCount}`,
          details: text.substring(0, 300)
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

      const edges = result.data?.warehouse_products?.data?.edges || []
      const complexity = result.data?.warehouse_products?.complexity || 0
      
      console.log(`✅ Page ${pageCount}: ${edges.length} products, complexity: ${complexity}`)
      
      allProducts.push(...edges.map(({ node }: any) => node))

      hasNextPage = result.data?.warehouse_products?.data?.pageInfo?.hasNextPage || false
      cursor = result.data?.warehouse_products?.data?.pageInfo?.endCursor

      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 400))
      }
    }

    console.log(`📦 Total: ${allProducts.length} products in ${pageCount} pages`)

    // Transform
    const items: any[] = []

    allProducts.forEach((product: any) => {
      const locationEdges = product.locations?.edges || []
      
      locationEdges.forEach(({ node: itemLoc }: any) => {
        if (itemLoc.quantity > 0) {
          items.push({
            sku: product.sku,
            productName: product.product?.name || product.sku,
            quantity: itemLoc.quantity,
            location: itemLoc.location?.name || 'Unknown',
            zone: itemLoc.location?.name?.split('-')[0] || 'Zone',
            pickable: itemLoc.location?.pickable || false,
            sellable: itemLoc.location?.sellable || false,
            warehouse: product.warehouse_identifier,
            type: 'Bin',
            barcode: product.product?.barcode || ''
          })
        }
      })
    })

    console.log(`🎉 Items: ${items.length}`)

    return NextResponse.json({
      success: true,
      data: items,
      meta: { total: items.length, pages: pageCount },
    });
  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
