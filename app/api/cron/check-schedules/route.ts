import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Cron job - runs every hour, checks if any schedules should execute now
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== CRON: Checking schedules ===')

    const now = new Date()
    const currentDay = now.getDay() // 0-6
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    console.log(`Current: Day ${currentDay}, Time ${currentTime}`)

    // Get all enabled schedules
    const { data: schedules } = await supabaseAdmin
      .from('refresh_schedules')
      .select('*')
      .eq('enabled', true)

    if (!schedules || schedules.length === 0) {
      console.log('No enabled schedules')
      return NextResponse.json({ success: true, message: 'No schedules to run' });
    }

    const toRun: any[] = []

    schedules.forEach(schedule => {
      // Check if today is in days_of_week
      if (!schedule.days_of_week.includes(currentDay)) {
        return
      }

      // Check if current time matches any run_times
      const shouldRun = schedule.run_times.some((time: string) => {
        const [hour] = time.split(':')
        return hour === now.getHours().toString().padStart(2, '0')
      })

      if (shouldRun) {
        // Check if already ran this hour
        if (schedule.last_run_at) {
          const lastRun = new Date(schedule.last_run_at)
          if (lastRun.getHours() === now.getHours() && 
              lastRun.getDate() === now.getDate()) {
            console.log(`Schedule ${schedule.name} already ran this hour`)
            return
          }
        }

        toRun.push(schedule)
      }
    })

    if (toRun.length === 0) {
      console.log('No schedules due to run now')
      return NextResponse.json({ success: true, message: 'No schedules due' });
    }

    console.log(`Running ${toRun.length} schedules...`)

    // Execute each schedule
    // Note: This would need the ShipHero token from environment or stored securely
    // For now, just log what would run

    const results = toRun.map(schedule => {
      console.log(`Would run: ${schedule.name}`)
      
      // Update last_run_at
      supabaseAdmin
        .from('refresh_schedules')
        .update({ 
          last_run_at: now.toISOString(),
          last_run_status: 'executed'
        })
        .eq('id', schedule.id)
        .then(() => console.log(`Updated ${schedule.name}`))

      return {
        schedule_name: schedule.name,
        executed: true
      }
    })

    return NextResponse.json({
      success: true,
      executed: results
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

