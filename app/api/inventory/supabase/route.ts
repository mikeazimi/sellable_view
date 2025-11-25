import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Query inventory from Supabase cache (INSTANT - no ShipHero API calls!)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")
    const sellableFilter = searchParams.get("sellable") || 'all'
    const pickableFilter = searchParams.get("pickable") || 'all'

    console.log('=== SUPABASE INVENTORY QUERY ===')
    console.log('Filters:', { sellable: sellableFilter, pickable: pickableFilter })

    // Check if database has data
    const { count } = await supabaseAdmin
      .from('inventory_locations')
      .select('*', { count: 'exact', head: true })

    if (count === 0) {
      return NextResponse.json({
        success: false,
        error: 'No inventory data in cache. Please run snapshot sync in Admin first.',
        empty_database: true
      }, { status: 404 });
    }

    console.log(`Database has ${count} records`)

    // Fetch ALL records using pagination (Supabase has 1000 row limit per query)
    const pageSize = 1000
    const totalPages = Math.ceil((count || 0) / pageSize)
    let allData: any[] = []

    console.log(`Fetching ${totalPages} pages...`)

    for (let page = 0; page < totalPages; page++) {
      const start = page * pageSize
      const end = start + pageSize - 1

      let query = supabaseAdmin
        .from('inventory_locations')
        .select('*')
        .range(start, end)

      if (sellableFilter === 'sellable') {
        query = query.eq('sellable', true)
      } else if (sellableFilter === 'non-sellable') {
        query = query.eq('sellable', false)
      }

      if (pickableFilter === 'pickable') {
        query = query.eq('pickable', true)
      } else if (pickableFilter === 'non-pickable') {
        query = query.eq('pickable', false)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      if (data) {
        allData = allData.concat(data)
        console.log(`Fetched page ${page + 1}/${totalPages}: ${data.length} records (total: ${allData.length})`)
      }
    }

    console.log(`✅ Query returned ${allData.length} records (instant!)`)
    
    const data = allData

    // Transform to match frontend format
    const items = data.map(record => ({
      sku: record.sku,
      productName: record.product_name || record.sku,
      quantity: record.quantity,
      location: record.location_name,
      zone: record.location_name?.split('-')[0] || 'Zone',
      pickable: record.pickable,
      sellable: record.sellable,
      warehouse: record.warehouse_identifier || 'Unknown',
      type: 'Bin',
      barcode: record.barcode || ''
    }))

    return NextResponse.json({
      success: true,
      data: items,
      meta: {
        total: items.length,
        source: 'supabase_cache',
        filters_applied: { sellable: sellableFilter, pickable: pickableFilter }
      }
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

