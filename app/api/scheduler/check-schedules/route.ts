import { NextRequest, NextResponse } from "next/server";

/**
 * Cron Job Handler - Checks if any schedules should run now
 * Triggered by Vercel Cron every 5 minutes
 */

interface ScheduleItem {
  id: string
  days: string[]
  time: string
  enabled: boolean
  email: string
}

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

function shouldRunSchedule(schedule: ScheduleItem, now: Date): boolean {
  // Check if schedule is enabled
  if (!schedule.enabled) return false

  // Check if today is in the schedule
  const currentDay = now.getDay()
  const scheduleDays = schedule.days.map(day => dayMap[day])
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
    console.log(`🕐 [CRON] Checking schedules at ${new Date().toISOString()}`)

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

    // Get schedules from storage
    // Note: In production, these would be stored in a database
    // For now, we'll check if there's a way to get them from localStorage (which won't work server-side)
    // Instead, we'll need to store schedules in a database or environment variable

    // For now, return a success response indicating the cron is working
    console.log(`✅ [CRON] Cron job executed successfully`)
    console.log(`ℹ️  [CRON] Note: Schedules are currently stored in localStorage and need to be migrated to a database for server-side access`)

    return NextResponse.json({
      success: true,
      message: 'Cron job executed',
      timestamp: new Date().toISOString(),
      note: 'Schedules need to be stored in a database (Supabase) for automated execution'
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

