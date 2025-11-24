import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Get filtered location names from Supabase cache
 * Super fast - no ShipHero API calls needed!
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sellableFilter = searchParams.get("sellable") || 'all'
    const pickableFilter = searchParams.get("pickable") || 'all'

    console.log('=== SUPABASE LOCATION FILTER ===')
    console.log('Filters:', { sellable: sellableFilter, pickable: pickableFilter })

    let query = supabaseAdmin
      .from('locations')
      .select('location, warehouse, sellable, pickable')

    // Apply filters
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
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    console.log(`✅ Found ${data.length} matching locations in cache`)

    // Create Set of location names for fast filtering
    const locationNames = new Set(data.map(loc => loc.location))

    return NextResponse.json({
      success: true,
      locationNames: Array.from(locationNames),
      total: locationNames.size,
      filters_applied: { sellable: sellableFilter, pickable: pickableFilter }
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

