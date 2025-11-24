import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")
    const filterSellable = searchParams.get("filter_sellable") || 'all'
    const filterPickable = searchParams.get("filter_pickable") || 'all'

    console.log('=== INVENTORY API (locations query) ===')
    console.log('Customer:', customerAccountId)
    console.log('Filters:', { sellable: filterSellable, pickable: filterPickable })

    if (!accessToken || !customerAccountId) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 400 });
    }

    // Use LOCATIONS query which DOES support sellable/pickable filtering!
    // This way we only fetch the locations we care about
    const sellableArg = filterSellable === 'sellable' ? 'sellable: true' : filterSellable === 'non-sellable' ? 'sellable: false' : ''
    const pickableArg = filterPickable === 'pickable' ? 'pickable: true' : filterPickable === 'non-pickable' ? 'pickable: false' : ''
    const filterArgs = [sellableArg, pickableArg].filter(a => a).join(', ')

    const query = `
      query ($customer_account_id: String) {
        locations(${filterArgs}) {
          request_id
          complexity
          data {
            edges {
              node {
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

    console.log('📤 Query locations with filters (gets ONLY matching locations!)')

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
      console.error('GraphQL errors:', result.errors)
      return NextResponse.json({ 
        success: false, 
        error: result.errors[0].message,
        errors: result.errors
      }, { status: 500 });
    }

    console.log('Complexity:', result.data?.locations?.complexity)

    const locations = result.data?.locations?.data?.edges?.map(({ node }: any) => node) || []
    console.log(`✅ Locations (filtered): ${locations.length}`)

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

    // Transform
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
            zone: location.name?.split('-')[0] || 'Zone',
            pickable: location.pickable,
            sellable: location.sellable,
            warehouse: warehouseMap.get(location.warehouse_id) || 'Unknown',
            type: 'Bin',
            barcode: ''
          })
        }
      })
    })

    console.log(`🎉 Items: ${items.length}`)

    return NextResponse.json({
      success: true,
      data: items,
      meta: { 
        total: items.length,
        locations_queried: locations.length,
        filters_applied: filterSellable !== 'all' || filterPickable !== 'all'
      },
    });
  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
