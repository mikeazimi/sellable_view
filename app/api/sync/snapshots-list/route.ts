import { NextRequest, NextResponse } from "next/server";

/**
 * List all recent snapshots for a customer
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    const query = `
      query ($customer_account_id: String) {
        inventory_snapshots(customer_account_id: $customer_account_id) {
          request_id
          complexity
          snapshots(first: 10) {
            edges {
              node {
                snapshot_id
                status
                error
                created_at
                snapshot_url
                warehouse_id
                customer_account_id
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ 
        query,
        variables: { customer_account_id: customerAccountId }
      })
    });

    const result = await response.json()

    if (result.errors) {
      throw new Error(result.errors[0].message)
    }

    const snapshots = result.data?.inventory_snapshots?.snapshots?.edges?.map(({ node }: any) => node) || []

    return NextResponse.json({
      success: true,
      snapshots: snapshots
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

