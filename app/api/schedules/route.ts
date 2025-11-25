import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Manage refresh schedules
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('refresh_schedules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      schedules: data || []
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, customer_account_id, warehouse_id, days_of_week, run_times, enabled } = body

    const { data, error } = await supabaseAdmin
      .from('refresh_schedules')
      .insert({
        name,
        customer_account_id,
        warehouse_id,
        days_of_week,
        run_times,
        enabled: enabled !== false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      schedule: data
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    const { data, error } = await supabaseAdmin
      .from('refresh_schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      schedule: data
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('refresh_schedules')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

