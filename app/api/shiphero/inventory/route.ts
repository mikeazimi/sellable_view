import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")

    console.log('=== INVENTORY API (Reduced Complexity) ===')

    if (!accessToken || !customerAccountId) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 400 });
    }

    // Reduced complexity query - NO locations to start, just basic inventory
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
                warehouse_identifier
                on_hand
                inventory_bin
                product {
                  name
                }
              }
            }
          }
        }
      }
    `;

    const variables = { customer_account_id: customerAccountId }

    console.log('📤 Simple query without locations')

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
      console.error('Error:', text.substring(0, 500))
      return NextResponse.json({ 
        success: false, 
        error: `HTTP ${response.status}`,
        details: text.substring(0, 500)
      }, { status: 500 });
    }

    const result = await response.json()

    if (result.errors) {
      console.error('Errors:', result.errors)
      return NextResponse.json({ 
        success: false, 
        error: result.errors[0].message,
        errors: result.errors
      }, { status: 500 });
    }

    console.log('Complexity:', result.data?.warehouse_products?.complexity)

    const products = result.data?.warehouse_products?.data?.edges?.map(({ node }: any) => node) || []
    console.log(`✅ Products: ${products.length}`)

    // Transform to items - use inventory_bin since we're not querying locations
    const items = products
      .filter((p: any) => p.on_hand > 0)
      .map((product: any) => ({
        sku: product.sku,
        productName: product.product?.name || product.sku,
        quantity: product.on_hand,
        location: product.inventory_bin || 'General Stock',
        locationId: product.inventory_bin || 'general',
        zone: product.inventory_bin?.split('-')[0] || 'General',
        pickable: true,
        sellable: true,
        warehouse: product.warehouse_identifier,
        type: 'Bin',
        barcode: ''
      }))

    console.log(`🎉 Items: ${items.length}`)

    return NextResponse.json({
      success: true,
      data: items,
      meta: { 
        total: items.length,
        complexity: result.data?.warehouse_products?.complexity
      },
    });
  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
