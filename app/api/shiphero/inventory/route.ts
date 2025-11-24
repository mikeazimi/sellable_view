import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")

    console.log('=== INVENTORY API (Paginated) ===')

    if (!accessToken || !customerAccountId) {
      return NextResponse.json({ success: false, error: "Auth and customer_account_id required" }, { status: 400 });
    }

    // Paginated query to stay under complexity limit (4004 credits)
    const query = `
      query ($customer_account_id: String, $after: String) {
        warehouse_products(
          customer_account_id: $customer_account_id
          active: true
          after: $after
        ) {
          request_id
          complexity
          data {
            edges {
              node {
                sku
                warehouse_identifier
                on_hand
                inventory_bin
                product {
                  name
                  barcode
                }
                locations {
                  edges {
                    node {
                      quantity
                      location {
                        id
                        name
                        pickable
                        sellable
                      }
                    }
                  }
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;

    console.log('📤 Fetching with pagination for customer:', customerAccountId)

    const allProducts: any[] = []
    let hasNextPage = true
    let afterCursor: string | undefined = undefined
    let pageCount = 0
    const maxPages = 50

    while (hasNextPage && pageCount < maxPages) {
      pageCount++
      
      const variables = {
        customer_account_id: customerAccountId,
        after: afterCursor
      }

      console.log(`📄 Page ${pageCount}`)

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

      const edges = result.data?.warehouse_products?.data?.edges || []
      const pageProducts = edges.map(({ node }: any) => node)
      
      console.log(`✅ Page ${pageCount}: ${edges.length} products, complexity: ${result.data.warehouse_products.complexity}`)
      
      allProducts.push(...pageProducts)

      hasNextPage = result.data?.warehouse_products?.data?.pageInfo?.hasNextPage || false
      afterCursor = result.data?.warehouse_products?.data?.pageInfo?.endCursor

      // Delay between pages
      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log(`📦 Total products: ${allProducts.length}`)

    // Transform to items
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
            locationId: itemLoc.location?.id || 'unknown',
            zone: itemLoc.location?.name?.split('-')[0] || 'Zone',
            pickable: itemLoc.location?.pickable || false,
            sellable: itemLoc.location?.sellable || false,
            warehouse: product.warehouse_identifier,
            type: 'Bin',
            barcode: product.product?.barcode
          })
        }
      })
      
      if (locationEdges.length === 0 && product.on_hand > 0) {
        items.push({
          sku: product.sku,
          productName: product.product?.name || product.sku,
          quantity: product.on_hand,
          location: product.inventory_bin || 'General',
          locationId: 'general',
          zone: 'General',
          pickable: true,
          sellable: true,
          warehouse: product.warehouse_identifier,
          type: 'Bin',
          barcode: product.product?.barcode
        })
      }
    })

    console.log(`🎉 Final items: ${items.length}`)

    return NextResponse.json({
      success: true,
      data: items,
      meta: { 
        total: items.length,
        pages: pageCount
      },
    });
  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
