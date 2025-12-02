import { NextRequest, NextResponse } from "next/server";

/**
 * Scheduler API - Triggers inventory query and emails report
 * Can be called by:
 * 1. Vercel Cron Jobs (configured in vercel.json)
 * 2. External cron services (e.g., cron-job.org)
 * 3. Manual trigger from frontend
 */

interface ScheduleFilters {
  warehouse?: string
  sellable?: 'all' | 'sellable' | 'non-sellable'
  pickable?: 'all' | 'pickable' | 'non-pickable'
  sku?: string
  location?: string
}

interface ScheduleConfig {
  customerAccountId: string
  email: string
  scheduleName?: string
  filters?: ScheduleFilters
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerAccountId, email, scheduleName, filters } = body as ScheduleConfig

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

    // Step 1.5: Apply filters if specified
    let filteredInventory = allInventory
    
    if (filters) {
      console.log(`🔍 [SCHEDULER] Applying filters:`, filters)
      
      filteredInventory = allInventory.filter(item => {
        // Warehouse filter
        if (filters.warehouse && item.warehouse !== filters.warehouse) {
          return false
        }
        
        // Sellable filter
        if (filters.sellable === 'sellable' && !item.sellable) {
          return false
        }
        if (filters.sellable === 'non-sellable' && item.sellable) {
          return false
        }
        
        // Pickable filter
        if (filters.pickable === 'pickable' && !item.pickable) {
          return false
        }
        if (filters.pickable === 'non-pickable' && item.pickable) {
          return false
        }
        
        // SKU filter (case-insensitive partial match)
        if (filters.sku && !item.sku?.toLowerCase().includes(filters.sku.toLowerCase())) {
          return false
        }
        
        // Location filter (case-insensitive partial match)
        if (filters.location && !item.location?.toLowerCase().includes(filters.location.toLowerCase())) {
          return false
        }
        
        return true
      })
      
      console.log(`✅ [SCHEDULER] Filtered to ${filteredInventory.length} items (from ${allInventory.length})`)
    }

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

    // Step 3: Generate and email CSV + PDF reports (using filtered data)
    console.log(`📧 [SCHEDULER] Generating and emailing reports...`)
    
    const emailResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scheduler/email-report`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          inventory: filteredInventory,
          customerAccountId,
          scheduleName: scheduleName || 'Scheduled Inventory Report',
          filters
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
      itemsTotal: allInventory.length,
      itemsFiltered: filteredInventory.length,
      itemsProcessed: filteredInventory.length,
      pagesProcessed: pageCount,
      filtersApplied: filters || null
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

