import { NextRequest, NextResponse } from "next/server";

/**
 * START snapshot generation (returns immediately with snapshot ID)
 * Frontend will poll separate endpoint to check when ready
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const body = await request.json().catch(() => ({}))
    const customerAccountId = body.customer_account_id || null
    const warehouseId = body.warehouse_id || null

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    console.log('Starting snapshot')
    console.log('Customer:', customerAccountId)
    console.log('Warehouse:', warehouseId || 'All')

    const generateMutation = `
      mutation GenerateInventorySnapshot(
        $customer_account_id: String
        $warehouse_id: String
        $has_inventory: Boolean
        $new_format: Boolean
      ) {
        inventory_generate_snapshot(
          data: {
            customer_account_id: $customer_account_id
            warehouse_id: $warehouse_id
            has_inventory: $has_inventory
            new_format: $new_format
          }
        ) {
          request_id
          complexity
          snapshot {
            snapshot_id
            status
            created_at
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
        query: generateMutation,
        variables: {
          customer_account_id: customerAccountId,
          warehouse_id: warehouseId,
          has_inventory: true,
          new_format: true
        }
      })
    });

    console.log('Variables:', {
      customer_account_id: customerAccountId,
      warehouse_id: warehouseId,
      has_inventory: true,
      new_format: true
    })

    const result = await response.json()

    if (result.errors) {
      throw new Error(result.errors[0].message)
    }

    const snapshotId = result.data?.inventory_generate_snapshot?.snapshot?.snapshot_id

    if (!snapshotId) {
      throw new Error('No snapshot ID returned')
    }

    console.log('✅ Snapshot requested:', snapshotId)

    return NextResponse.json({
      success: true,
      snapshot_id: snapshotId,
      message: 'Snapshot generation started. Poll status endpoint to check progress.'
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

