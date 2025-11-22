import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/shiphero/inventory
 * Get inventory with bin locations for dynamic slotting warehouse
 * Filtered by customer account ID for 3PL operations
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")

    console.log('=== INVENTORY API (Dynamic Slotting) ===')
    console.log('Auth token:', accessToken ? accessToken.substring(0, 30) + '...' : 'MISSING')
    console.log('Customer account ID (UUID):', customerAccountId || 'NOT PROVIDED')

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    if (!customerAccountId) {
      return NextResponse.json({ 
        success: false, 
        error: "customer_account_id required for 3PL operations" 
      }, { status: 400 });
    }

    // Simplified query for dynamic slotting - use products query which supports locations
    const query = `
      query GetInventory($customer_account_id: String, $first: Int, $after: String) {
        products(
          customer_account_id: $customer_account_id
          first: $first
          after: $after
        ) {
          request_id
          complexity
          data {
            edges {
              node {
                id
                sku
                name
                barcode
                inventory(customer_account_id: $customer_account_id) {
                  warehouse_id
                  warehouse_identifier
                  on_hand
                  available
                  locations {
                    location_id
                    location_name
                    quantity
                    pickable
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

    console.log('📤 Fetching inventory for customer:', customerAccountId)

    const allProducts: any[] = []
    let hasNextPage = true
    let afterCursor: string | undefined = undefined
    let pageCount = 0
    const maxPages = 20

    while (hasNextPage && pageCount < maxPages) {
      pageCount++
      
      const variables = {
        customer_account_id: customerAccountId,
        first: 100,
        after: afterCursor
      }

      console.log(`📄 Page ${pageCount}, variables:`, JSON.stringify(variables))

      const response = await fetch('https://public-api.shiphero.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ query, variables })
      });

      console.log(`📥 Page ${pageCount} response:`, response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ ShipHero error:', errorText)
        return NextResponse.json({ 
          success: false, 
          error: `ShipHero API ${response.status}`,
          details: errorText.substring(0, 200)
        }, { status: 500 });
      }

      const result = await response.json()

      if (result.errors) {
        console.error('❌ GraphQL errors:', result.errors)
        return NextResponse.json({ 
          success: false, 
          error: result.errors[0].message,
          graphql_errors: result.errors
        }, { status: 500 });
      }

      const edges = result.data?.products?.data?.edges || []
      console.log(`✅ Page ${pageCount}: ${edges.length} products`)
      
      allProducts.push(...edges.map(({ node }: any) => node))

      hasNextPage = result.data?.products?.data?.pageInfo?.hasNextPage || false
      afterCursor = result.data?.products?.data?.pageInfo?.endCursor

      // Small delay between pages
      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    console.log(`🎉 Total products fetched: ${allProducts.length}`)

    // Transform to flat inventory items
    const inventoryItems: any[] = []

    allProducts.forEach(product => {
      // Each product has inventory array with warehouse-specific data
      if (!product.inventory || product.inventory.length === 0) {
        return // Skip products with no inventory
      }

      product.inventory.forEach((inv: any) => {
        if (inv.locations && inv.locations.length > 0) {
          // Dynamic slotting - use locations array
          inv.locations.forEach((location: any) => {
            if (location.quantity > 0) {
              inventoryItems.push({
                sku: product.sku,
                productName: product.name || product.sku,
                quantity: location.quantity,
                location: location.location_name,
                locationId: location.location_id,
                pickable: location.pickable,
                sellable: true,
                warehouse: inv.warehouse_identifier,
                barcode: product.barcode,
              })
            }
          })
        } else if (inv.on_hand > 0) {
          // Warehouse total (no specific locations)
          inventoryItems.push({
            sku: product.sku,
            productName: product.name || product.sku,
            quantity: inv.on_hand,
            location: 'General Stock',
            locationId: inv.warehouse_id,
            pickable: true,
            sellable: true,
            warehouse: inv.warehouse_identifier,
            barcode: product.barcode,
          })
        }
      })
    })

    console.log(`📦 Inventory items created: ${inventoryItems.length}`)

    return NextResponse.json({
      success: true,
      data: inventoryItems,
      meta: {
        total_items: inventoryItems.length,
        customer_account_id: customerAccountId,
        pages_fetched: pageCount,
      },
    });
  } catch (error: any) {
    console.error("💥 Inventory API error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

