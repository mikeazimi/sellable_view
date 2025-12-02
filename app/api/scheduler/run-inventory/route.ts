import { NextRequest, NextResponse } from "next/server";

/**
 * Scheduler API - Triggers inventory query and emails report
 * Can be called by:
 * 1. Vercel Cron Jobs (configured in vercel.json)
 * 2. External cron services (e.g., cron-job.org)
 * 3. Manual trigger from frontend
 */

interface ScheduleConfig {
  customerAccountId: string
  email: string
  scheduleName?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerAccountId, email, scheduleName } = body as ScheduleConfig

    if (!customerAccountId || !email) {
      return NextResponse.json(
        { success: false, error: 'customerAccountId and email are required' },
        { status: 400 }
      )
    }

    console.log(`📅 [SCHEDULER] Starting scheduled inventory query for ${customerAccountId}`)
    console.log(`📧 [SCHEDULER] Report will be emailed to: ${email}`)

    // Get auth token from environment or request header
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '') || process.env.SHIPHERO_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Step 1: Fetch all inventory data (paginated)
    console.log(`📥 [SCHEDULER] Fetching inventory data...`)
    
    const allInventory: any[] = []
    let hasNextPage = true
    let cursor: string | null = null
    let pageCount = 0

    while (hasNextPage) {
      pageCount++
      console.log(`📄 [SCHEDULER] Fetching page ${pageCount}...`)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/shiphero/inventory?customer_account_id=${customerAccountId}${cursor ? `&cursor=${cursor}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        allInventory.push(...result.data)
        hasNextPage = result.pageInfo?.hasNextPage || false
        cursor = result.pageInfo?.endCursor || null
      } else {
        break
      }

      // Add delay between pages (35 seconds for credit management)
      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 35000))
      }
    }

    console.log(`✅ [SCHEDULER] Fetched ${allInventory.length} inventory items across ${pageCount} pages`)

    // Step 2: Cache to Supabase
    console.log(`💾 [SCHEDULER] Caching to Supabase...`)
    
    const cacheResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/inventory/cache-results`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: customerAccountId,
          inventory: allInventory
        })
      }
    )

    if (!cacheResponse.ok) {
      console.error(`⚠️ [SCHEDULER] Failed to cache to Supabase`)
    } else {
      console.log(`✅ [SCHEDULER] Cached to Supabase successfully`)
    }

    // Step 3: Generate and email CSV + PDF reports
    console.log(`📧 [SCHEDULER] Generating and emailing reports...`)
    
    const emailResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scheduler/email-report`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          inventory: allInventory,
          customerAccountId,
          scheduleName: scheduleName || 'Scheduled Inventory Report'
        })
      }
    )

    if (!emailResponse.ok) {
      console.error(`⚠️ [SCHEDULER] Failed to send email report`)
      throw new Error('Failed to send email report')
    }

    console.log(`✅ [SCHEDULER] Report emailed successfully to ${email}`)

    return NextResponse.json({
      success: true,
      message: `Inventory query completed and report sent to ${email}`,
      itemsProcessed: allInventory.length,
      pagesProcessed: pageCount
    })

  } catch (error: any) {
    console.error(`❌ [SCHEDULER] Error:`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Scheduler failed'
      },
      { status: 500 }
    )
  }
}

// Allow GET for health checks / manual triggers
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ready',
    message: 'Scheduler endpoint is active. Use POST to trigger inventory query.'
  })
}

