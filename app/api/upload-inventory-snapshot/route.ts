import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Upload inventory snapshot CSV to Supabase
 * CSV format: Item,Sku,Warehouse,Client,Location,Type,Units,Active Item,Pickable,Sellable,...
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chunk, customer_account_id, is_first_chunk = false } = body

    if (!chunk || !Array.isArray(chunk)) {
      return NextResponse.json({ success: false, error: "chunk array required" }, { status: 400 });
    }

    console.log(`💾 Uploading ${chunk.length} inventory records to Supabase... (first: ${is_first_chunk})`)

    // Delete old data on first chunk for clean slate
    if (is_first_chunk) {
      console.log(`🗑️  Deleting old inventory for customer ${customer_account_id}...`)
      const { error: deleteError } = await supabaseAdmin
        .from('inventory_locations')
        .delete()
        .eq('account_id', customer_account_id)

      if (deleteError) {
        console.error('Delete error:', deleteError)
      } else {
        console.log('✅ Old inventory deleted - starting fresh')
      }
    }

    // Transform CSV data to inventory_locations format
    const records = chunk.map((row: any) => ({
      sku: row.Sku,
      location_name: row.Location,
      quantity: parseInt(row.Units) || 0,
      sellable: row.Sellable?.toLowerCase() === 'yes',
      pickable: row.Pickable?.toLowerCase() === 'yes',
      warehouse_identifier: row.Warehouse,
      product_name: row.Item,
      barcode: null,
      account_id: customer_account_id,
      last_synced_at: new Date().toISOString()
    }))

    // Filter out zero quantity
    const validRecords = records.filter(r => r.quantity > 0)

    // Insert fresh data
    const { error } = await supabaseAdmin
      .from('inventory_locations')
      .insert(validRecords)

    if (error) {
      console.error('Upload error:', error)
      throw new Error(error.message)
    }

    console.log(`✅ Uploaded ${validRecords.length} records`)

    return NextResponse.json({
      success: true,
      uploaded: validRecords.length
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

