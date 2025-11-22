import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")

    console.log('=== INVENTORY API (Dynamic Slotting) ===')
    console.log('Customer ID:', customerAccountId)

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    if (!customerAccountId) {
      return NextResponse.json({ success: false, error: "customer_account_id required" }, { status: 400 });
    }

    // Correct query structure per ShipHero docs for dynamic slotting
    // locations query returns locations, products field on Location is a connection
    const query = `
      query GetInventoryLocations($customer_account_id: String) {
        locations {
          request_id
          complexity
          data {
            edges {
              node {
                id
                name
                zone
                pickable
                sellable
                warehouse_id
                products(customer_account_id: $customer_account_id) {
                  edges {
                    node {
                      sku
                      quantity
                      product {
                        name
                        barcode
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

    const variables = { customer_account_id: customerAccountId }

    console.log('📤 Query locations with products for customer:', customerAccountId)

    const response = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query, variables })
    });

    console.log('📥 ShipHero response:', response.status)

    if (!response.ok) {
      const text = await response.text()
      console.error('❌ HTTP error:', text.substring(0, 500))
      return NextResponse.json({ 
        success: false, 
        error: `HTTP ${response.status}`,
        details: text.substring(0, 500)
      }, { status: 500 });
    }

    const result = await response.json()

    if (result.errors) {
      console.error('❌ GraphQL errors:', JSON.stringify(result.errors))
      return NextResponse.json({ 
        success: false, 
        error: result.errors[0].message,
        errors: result.errors
      }, { status: 500 });
    }

    const locations = result.data?.locations?.data?.edges?.map(({ node }: any) => node) || []
    console.log(`✅ Locations fetched: ${locations.length}`)

    // Get warehouse mapping
    const warehouseQuery = `
      query {
        account {
          data {
            warehouses {
              id
              identifier
            }
          }
        }
      }
    `;

    const whResponse = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query: warehouseQuery })
    });

    const whResult = await whResponse.json()
    const warehouseMap = new Map()
    
    if (whResult.data?.account?.data?.warehouses) {
      whResult.data.account.data.warehouses.forEach((wh: any) => {
        warehouseMap.set(wh.id, wh.identifier)
      })
    }

    // Transform locations with products to flat inventory items
    const items: any[] = []

    locations.forEach((location: any) => {
      const productEdges = location.products?.edges || []
      
      productEdges.forEach(({ node: product }: any) => {
        if (product.quantity > 0) {
          items.push({
            sku: product.sku,
            productName: product.product?.name || product.sku,
            quantity: product.quantity,
            location: location.name,
            zone: location.zone,
            pickable: location.pickable,
            sellable: location.sellable,
            warehouse: warehouseMap.get(location.warehouse_id) || 'Unknown',
            warehouseId: location.warehouse_id,
            barcode: product.product?.barcode,
            type: 'Bin'
          })
        }
      })
    })

    console.log(`🎉 Inventory items created: ${items.length}`)

    return NextResponse.json({
      success: true,
      data: items,
      meta: { 
        total: items.length,
        locations: locations.length
      },
    });
  } catch (error: any) {
    console.error("💥 Exception:", error.message);
    console.error("Stack:", error.stack);
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
