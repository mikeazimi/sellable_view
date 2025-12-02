import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Schedules API - Manage inventory refresh schedules in Supabase
 */

// GET - Load all schedules
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('refresh_schedules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Handle empty table
    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        schedules: []
      })
    }

    // Transform from database format to frontend format
    const schedules = data.map(schedule => ({
      id: schedule.id,
      name: schedule.name,
      days: schedule.days || [],
      time: schedule.time,
      email: schedule.email,
      enabled: schedule.enabled,
      filters: {
        warehouse: schedule.filter_warehouse,
        sellable: schedule.filter_sellable || 'all',
        pickable: schedule.filter_pickable || 'all',
        sku: schedule.filter_sku,
        location: schedule.filter_location
      },
      customer_account_id: schedule.customer_account_id,
      last_run_at: schedule.last_run_at,
      last_run_status: schedule.last_run_status
    }))

    return NextResponse.json({
      success: true,
      schedules
    })

  } catch (error: any) {
    console.error('❌ [SCHEDULES] Error loading:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Save schedules (upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schedules } = body

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json(
        { success: false, error: 'schedules array required' },
        { status: 400 }
      )
    }

    console.log(`💾 [SCHEDULES] Saving ${schedules.length} schedules to Supabase...`)

    const records = schedules.map(schedule => ({
      id: schedule.id?.startsWith('temp_') ? undefined : schedule.id, // Don't save temp IDs
      name: schedule.name || `Schedule at ${schedule.time}`,
      customer_account_id: schedule.customer_account_id,
      email: schedule.email,
      days: schedule.days || [],
      time: schedule.time,
      enabled: schedule.enabled !== false,
      filter_warehouse: schedule.filters?.warehouse || null,
      filter_sellable: schedule.filters?.sellable || 'all',
      filter_pickable: schedule.filters?.pickable || 'all',
      filter_sku: schedule.filters?.sku || null,
      filter_location: schedule.filters?.location || null,
      updated_at: new Date().toISOString()
    }))

    // Delete all existing schedules for this account and insert new ones
    const customerAccountId = schedules[0]?.customer_account_id

    if (customerAccountId) {
      await supabaseAdmin
        .from('refresh_schedules')
        .delete()
        .eq('customer_account_id', customerAccountId)
    }

    // Insert new schedules
    const { data, error } = await supabaseAdmin
      .from('refresh_schedules')
      .insert(records)
      .select()

    if (error) throw error

    console.log(`✅ [SCHEDULES] Saved ${data.length} schedules`)

    return NextResponse.json({
      success: true,
      schedules: data
    })

  } catch (error: any) {
    console.error('❌ [SCHEDULES] Error saving:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a schedule
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const scheduleId = searchParams.get('id')

    if (!scheduleId) {
      return NextResponse.json(
        { success: false, error: 'schedule id required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('refresh_schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted'
    })

  } catch (error: any) {
    console.error('❌ [SCHEDULES] Error deleting:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
