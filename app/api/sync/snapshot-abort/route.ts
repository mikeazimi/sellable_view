import { NextRequest, NextResponse } from "next/server";

/**
 * Abort a running snapshot
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const body = await request.json()
    const snapshotId = body.snapshot_id
    const reason = body.reason || 'Manual abort'

    if (!accessToken || !snapshotId) {
      return NextResponse.json({ success: false, error: "Auth and snapshot_id required" }, { status: 400 });
    }

    console.log('Aborting snapshot:', snapshotId)

    const abortMutation = `
      mutation {
        inventory_abort_snapshot(
          data: { 
            snapshot_id: "${snapshotId}", 
            reason: "${reason}" 
          }
        ) {
          request_id
          complexity
          snapshot {
            snapshot_id
            status
            error
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
      body: JSON.stringify({ query: abortMutation })
    });

    const result = await response.json()

    if (result.errors) {
      throw new Error(result.errors[0].message)
    }

    console.log('✅ Snapshot aborted')

    return NextResponse.json({
      success: true,
      message: 'Snapshot aborted',
      snapshot: result.data?.inventory_abort_snapshot?.snapshot
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

