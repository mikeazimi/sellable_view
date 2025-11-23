import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")

    console.log('=== SIMPLE INVENTORY TEST ===')

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    // SIMPLEST possible query - just get locations first
    const query = `
      query {
        locations {
          request_id
          data {
            edges {
              node {
                id
                name
                pickable
                sellable
              }
            }
          }
        }
      }
    `;

    console.log('📤 Testing basic locations query...')

    const response = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query })
    });

    console.log('📥 Response:', response.status)

    const text = await response.text()
    console.log('Response text:', text.substring(0, 500))

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: `HTTP ${response.status}`,
        body: text.substring(0, 500)
      }, { status: 500 });
    }

    const result = JSON.parse(text)

    if (result.errors) {
      console.error('Errors:', result.errors)
      return NextResponse.json({ 
        success: false, 
        error: 'GraphQL error',
        errors: result.errors
      }, { status: 500 });
    }

    const locations = result.data?.locations?.data?.edges?.map(({ node }: any) => node) || []
    console.log(`✅ Got ${locations.length} locations`)

    // Return simple test data
    const items = locations.slice(0, 10).map((loc: any) => ({
      sku: 'TEST-SKU',
      productName: 'Test Product',
      quantity: 1,
      location: loc.name,
      zone: loc.name.split('-')[0] || 'A',
      pickable: loc.pickable,
      sellable: loc.sellable,
      warehouse: 'Primary',
      type: 'Bin',
      barcode: ''
    }))

    return NextResponse.json({
      success: true,
      data: items,
      meta: { total: items.length, test: true },
    });
  } catch (error: any) {
    console.error("💥 Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
