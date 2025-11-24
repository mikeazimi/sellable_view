import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")

    console.log('=== INVENTORY API ===')
    console.log('Customer:', customerAccountId)

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    if (!customerAccountId) {
      return NextResponse.json({ success: false, error: "customer_account_id required" }, { status: 400 });
    }

    // Get locations with products - NOW ADD REAL DATA
    const query = `
      query ($customer_account_id: String) {
        locations {
          request_id
          complexity
          data {
            edges {
              node {
                id
                name
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

    console.log('📤 Fetching with customer filter')

    const response = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query, variables })
    });

    console.log('📥 Status:', response.status)

    const text = await response.text()

    if (!response.ok) {
      console.error('HTTP error:', text.substring(0, 300))
      return NextResponse.json({ 
        success: false, 
        error: `HTTP ${response.status}`,
        details: text.substring(0, 300)
      }, { status: 500 });
    }

    const result = JSON.parse(text)

    if (result.errors) {
      console.error('GraphQL errors:', result.errors)
      return NextResponse.json({ 
        success: false, 
        error: result.errors[0].message,
        errors: result.errors
      }, { status: 500 });
    }

    // Get warehouses
    const whQuery = `query { account { data { warehouses { id identifier } } } }`;
    const whRes = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query: whQuery })
    });

    const whResult = await whRes.json()
    const warehouseMap = new Map()
    whResult.data?.account?.data?.warehouses?.forEach((wh: any) => {
      warehouseMap.set(wh.id, wh.identifier)
    })

    const locations = result.data?.locations?.data?.edges?.map(({ node }: any) => node) || []
    console.log(`✅ Locations: ${locations.length}`)

    // Build real inventory items
    const items: any[] = []

    locations.forEach((location: any) => {
      const productEdges = location.products?.edges || []
      
      productEdges.forEach(({ node: prod }: any) => {
        if (prod.quantity > 0) {
          items.push({
            sku: prod.sku,
            productName: prod.product?.name || prod.sku,
            quantity: prod.quantity,
            location: location.name,
            zone: location.name.split('-')[0] || 'Zone',
            pickable: location.pickable,
            sellable: location.sellable,
            warehouse: warehouseMap.get(location.warehouse_id) || 'Primary',
            type: 'Bin',
            barcode: prod.product?.barcode
          })
        }
      })
    })

    console.log(`🎉 Real items: ${items.length}`)

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
