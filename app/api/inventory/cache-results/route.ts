import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Cache inventory results to Supabase as they're fetched from ShipHero
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customer_account_id } = body

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: "items array required" }, { status: 400 });
    }

    console.log(`💾 Caching ${items.length} items to Supabase...`)

    // Transform and prepare for upsert
    const records = items.map((item: any) => ({
      sku: item.sku,
      location_name: item.location,
      quantity: item.quantity,
      sellable: item.sellable,
      pickable: item.pickable,
      warehouse_identifier: item.warehouse,
      product_name: item.productName,
      barcode: item.barcode || null,
      account_id: customer_account_id,
      last_synced_at: new Date().toISOString()
    }))

    // Upsert to Supabase (merge with existing)
    const { error } = await supabaseAdmin
      .from('inventory_locations')
      .upsert(records, { 
        onConflict: 'sku,location_name,account_id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Cache error:', error)
      throw new Error(error.message)
    }

    console.log(`✅ Cached ${records.length} items`)

    return NextResponse.json({
      success: true,
      cached: records.length
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

