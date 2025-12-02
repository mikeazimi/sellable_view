import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Cron Job Handler - Checks Supabase for schedules that should run now
 * Triggered by Vercel Cron every 5 minutes
 */

// Map day abbreviations to JavaScript day numbers
const dayMap: { [key: string]: number } = {
  'Sun': 0,
  'Mon': 1,
  'Tue': 2,
  'Wed': 3,
  'Thu': 4,
  'Fri': 5,
  'Sat': 6
}

function shouldRunSchedule(schedule: any, now: Date): boolean {
  // Check if schedule is enabled
  if (!schedule.enabled) return false

  // Check if today is in the schedule
  const currentDay = now.getDay()
  const scheduleDays = (schedule.days || []).map((day: string) => dayMap[day])
  if (!scheduleDays.includes(currentDay)) return false

  // Check if current time matches schedule time (within 5-minute window)
  const [scheduleHour, scheduleMinute] = schedule.time.split(':').map(Number)
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  // Match if within 5-minute window
  const scheduleTimeInMinutes = scheduleHour * 60 + scheduleMinute
  const currentTimeInMinutes = currentHour * 60 + currentMinute
  const timeDiff = Math.abs(scheduleTimeInMinutes - currentTimeInMinutes)

  return timeDiff < 5
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    console.log(`🕐 [CRON] Checking schedules at ${now.toISOString()}`)

    // Verify cron authorization (Vercel sends this header)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn(`⚠️ [CRON] Unauthorized cron request`)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all enabled schedules from Supabase
    const { data: schedules, error } = await supabaseAdmin
      .from('refresh_schedules')
      .select('*')
      .eq('enabled', true)

    if (error) {
      console.error(`❌ [CRON] Error fetching schedules:`, error)
      throw error
    }

    if (!schedules || schedules.length === 0) {
      console.log(`ℹ️  [CRON] No enabled schedules found`)
      return NextResponse.json({
        success: true,
        message: 'No schedules to run',
        timestamp: now.toISOString()
      })
    }

    console.log(`📋 [CRON] Found ${schedules.length} enabled schedules`)

    // Check which schedules should run now
    const schedulesToRun = schedules.filter(schedule => shouldRunSchedule(schedule, now))

    if (schedulesToRun.length === 0) {
      console.log(`ℹ️  [CRON] No schedules match current time`)
      return NextResponse.json({
        success: true,
        message: 'No schedules to run at this time',
        timestamp: now.toISOString(),
        checked: schedules.length
      })
    }

    console.log(`🚀 [CRON] Running ${schedulesToRun.length} schedule(s)...`)

    // Trigger each schedule
    const results = []
    
    for (const schedule of schedulesToRun) {
      try {
        console.log(`▶️ [CRON] Triggering schedule: ${schedule.name}`)

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scheduler/run-inventory`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SHIPHERO_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
              customerAccountId: schedule.customer_account_id,
              email: schedule.email,
              scheduleName: schedule.name,
              filters: {
                warehouse: schedule.filter_warehouse,
                sellable: schedule.filter_sellable || 'all',
                pickable: schedule.filter_pickable || 'all',
                sku: schedule.filter_sku,
                location: schedule.filter_location
              }
            })
          }
        )

        const result = await response.json()

        // Update last run timestamp
        await supabaseAdmin
          .from('refresh_schedules')
          .update({
            last_run_at: now.toISOString(),
            last_run_status: result.success ? 'success' : 'failed'
          })
          .eq('id', schedule.id)

        results.push({
          schedule_id: schedule.id,
          schedule_name: schedule.name,
          success: result.success,
          message: result.message || result.error
        })

        console.log(`✅ [CRON] Schedule ${schedule.name} completed`)

      } catch (error: any) {
        console.error(`❌ [CRON] Schedule ${schedule.name} failed:`, error)
        
        // Update as failed
        await supabaseAdmin
          .from('refresh_schedules')
          .update({
            last_run_at: now.toISOString(),
            last_run_status: 'failed'
          })
          .eq('id', schedule.id)

        results.push({
          schedule_id: schedule.id,
          schedule_name: schedule.name,
          success: false,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Executed ${schedulesToRun.length} schedule(s)`,
      timestamp: now.toISOString(),
      results
    })

  } catch (error: any) {
    console.error(`❌ [CRON] Error:`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Cron job failed'
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual testing
export async function POST(request: NextRequest) {
  return GET(request)
}

