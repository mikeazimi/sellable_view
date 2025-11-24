import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")

    console.log('=== INVENTORY API ===')
    console.log('Customer ID:', customerAccountId)

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    if (!customerAccountId) {
      return NextResponse.json({ success: false, error: "customer_account_id required" }, { status: 400 });
    }

    // CORRECT: locations is a CONNECTION type - needs edges/node
    const query = `
      query ($customer_account_id: String) {
        warehouse_products(
          customer_account_id: $customer_account_id
          active: true
        ) {
          request_id
          complexity
          data {
            edges {
              node {
                sku
                warehouse_id
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
                      location_id
                      location_name
                      quantity
                      pickable
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

    console.log('📤 Query with edges/node for locations')

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

    const products = result.data?.warehouse_products?.data?.edges?.map(({ node }: any) => node) || []
    console.log(`✅ Products: ${products.length}`)

    const items: any[] = []

    products.forEach((product: any) => {
      const locationEdges = product.locations?.edges || []
      
      if (locationEdges.length > 0) {
        // Has locations - dynamic slotting
        locationEdges.forEach(({ node: loc }: any) => {
          if (loc.quantity > 0) {
            items.push({
              sku: product.sku,
              productName: product.product?.name || product.sku,
              quantity: loc.quantity,
              location: loc.location_name,
              locationId: loc.location_id,
              zone: loc.location_name?.split('-')[0] || 'Zone',
              pickable: loc.pickable,
              sellable: true,
              warehouse: product.warehouse_identifier,
              type: 'Bin',
              barcode: product.product?.barcode
            })
          }
        })
      } else if (product.on_hand > 0) {
        // No locations
        items.push({
          sku: product.sku,
          productName: product.product?.name || product.sku,
          quantity: product.on_hand,
          location: product.inventory_bin || 'General',
          locationId: product.inventory_bin || 'general',
          zone: product.inventory_bin?.split('-')[0] || 'General',
          pickable: true,
          sellable: true,
          warehouse: product.warehouse_identifier,
          type: 'Bin',
          barcode: product.product?.barcode
        })
      }
    })

    console.log(`🎉 Items: ${items.length}`)

    return NextResponse.json({
      success: true,
      data: items,
      meta: { total: items.length },
    });
  } catch (error: any) {
    console.error("💥 Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
