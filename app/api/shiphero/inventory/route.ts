import { NextRequest, NextResponse } from "next/server";

/**
 * Get inventory for dynamic slotting warehouse filtered by customer account
 * Per ShipHero docs: warehouse_products query with customer_account_id parameter
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")

    console.log('=== INVENTORY API (warehouse_products query) ===')
    console.log('Customer Account ID:', customerAccountId)
    console.log('Token present:', !!accessToken)

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    if (!customerAccountId) {
      return NextResponse.json({ success: false, error: "customer_account_id required" }, { status: 400 });
    }

    // EXACT query from ShipHero docs section 2354-2433 (warehouse_products query)
    const query = `
      query GetWarehouseProducts(
        $warehouse_id: String
        $customer_account_id: String
        $sku: String
      ) {
        warehouse_products(
          warehouse_id: $warehouse_id
          customer_account_id: $customer_account_id
          sku: $sku
          active: true
        ) {
          request_id
          complexity
          data {
            edges {
              node {
                id
                sku
                warehouse_id
                warehouse_identifier
                on_hand
                inventory_bin
                active
                product {
                  name
                  barcode
                }
                locations {
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
    `;

    const variables = {
      customer_account_id: customerAccountId,
      warehouse_id: null,
      sku: null
    }

    console.log('📤 Sending warehouse_products query')
    console.log('Variables:', JSON.stringify(variables))

    const response = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query, variables })
    });

    console.log('📥 Response status:', response.status)

    if (!response.ok) {
      const text = await response.text()
      console.error('❌ HTTP error:', text)
      return NextResponse.json({ 
        success: false, 
        error: `HTTP ${response.status}`,
        details: text
      }, { status: 500 });
    }

    const result = await response.json()
    console.log('Result keys:', Object.keys(result))
    console.log('Result:', JSON.stringify(result).substring(0, 500))

    if (result.errors) {
      console.error('❌ GraphQL errors:', JSON.stringify(result.errors))
      return NextResponse.json({ 
        success: false, 
        error: result.errors[0].message,
        errors: result.errors,
        query_sent: query.substring(0, 200)
      }, { status: 500 });
    }

    const products = result.data?.warehouse_products?.data?.edges?.map(({ node }: any) => node) || []
    console.log(`✅ Products received: ${products.length}`)

    // Transform to inventory items
    const items: any[] = []

    products.forEach((product: any) => {
      // Check if product has locations array (dynamic slotting)
      if (product.locations && Array.isArray(product.locations) && product.locations.length > 0) {
        console.log(`Product ${product.sku} has ${product.locations.length} locations`)
        
        product.locations.forEach((location: any) => {
          if (location.quantity > 0) {
            items.push({
              sku: product.sku,
              productName: product.product?.name || product.sku,
              quantity: location.quantity,
              location: location.location_name,
              locationId: location.location_id,
              zone: location.location_name?.split('-')[0] || 'Zone',
              pickable: location.pickable,
              sellable: true,
              warehouse: product.warehouse_identifier,
              warehouseId: product.warehouse_id,
              type: 'Bin',
              barcode: product.product?.barcode
            })
          }
        })
      } else if (product.on_hand > 0) {
        // Fallback: product has on_hand but no location details
        console.log(`Product ${product.sku} - no locations, on_hand: ${product.on_hand}`)
        
        items.push({
          sku: product.sku,
          productName: product.product?.name || product.sku,
          quantity: product.on_hand,
          location: product.inventory_bin || 'Unassigned',
          locationId: product.inventory_bin || 'unassigned',
          zone: product.inventory_bin?.split('-')[0] || 'General',
          pickable: true,
          sellable: true,
          warehouse: product.warehouse_identifier,
          warehouseId: product.warehouse_id,
          type: 'Bin',
          barcode: product.product?.barcode
        })
      }
    })

    console.log(`🎉 Total inventory items: ${items.length}`)

    return NextResponse.json({
      success: true,
      data: items,
      meta: { 
        total: items.length,
        products_queried: products.length,
        query_type: 'warehouse_products with customer_account_id'
      },
    });
  } catch (error: any) {
    console.error("💥 Exception:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
