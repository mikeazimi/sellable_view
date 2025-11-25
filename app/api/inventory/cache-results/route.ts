import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Cache inventory results to Supabase as they're fetched from ShipHero
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customer_account_id, is_final = false } = body

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: "items array required" }, { status: 400 });
    }

    console.log(`💾 Caching ${items.length} items to Supabase... (final: ${is_final})`)

    // If this is the final save, delete old data first for clean slate
    if (is_final) {
      console.log(`🗑️  Deleting old inventory for customer ${customer_account_id}...`)
      const { error: deleteError } = await supabaseAdmin
        .from('inventory_locations')
        .delete()
        .eq('account_id', customer_account_id)

      if (deleteError) {
        console.error('Delete error:', deleteError)
        // Don't throw - continue with insert even if delete fails
      } else {
        console.log('✅ Old inventory deleted')
      }
    }

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

    // Insert fresh data
    const { error } = await supabaseAdmin
      .from('inventory_locations')
      .insert(records)

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

