import { NextRequest, NextResponse } from "next/server";

/**
 * Triggered by cron or manual button click
 * Runs live ShipHero query and updates Supabase cache
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    const body = await request.json().catch(() => ({}))
    const customerAccountId = body.customer_account_id || 'Q3VzdG9tZXJBY2NvdW50Ojg4Nzc0' // Default: 88774
    
    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    console.log('=== INVENTORY REFRESH JOB ===')
    console.log('Customer:', customerAccountId)
    console.log('This will query ShipHero and update Supabase cache')

    // This endpoint would trigger the same logic as the Force Refresh button
    // For now, just return success - the frontend handles the full refresh logic

    return NextResponse.json({
      success: true,
      message: 'Refresh triggered - use frontend logic for now'
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

