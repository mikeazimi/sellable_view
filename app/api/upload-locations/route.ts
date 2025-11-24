import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Upload locations CSV and seed Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { locations } = body

    if (!locations || !Array.isArray(locations)) {
      return NextResponse.json({ 
        success: false, 
        error: "locations array required" 
      }, { status: 400 });
    }

    console.log(`💾 Uploading ${locations.length} locations to Supabase...`)

    // Clear existing data
    const { error: deleteError } = await supabaseAdmin
      .from('locations')
      .delete()
      .neq('id', 0) // Delete all

    if (deleteError) {
      console.error('Delete error:', deleteError)
    }

    // Insert in batches of 1000
    const batchSize = 1000
    let inserted = 0
    
    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize)
      
      const { error } = await supabaseAdmin
        .from('locations')
        .insert(batch)

      if (error) {
        console.error('Insert error:', error)
        throw new Error(`Failed at record ${i}: ${error.message}`)
      }

      inserted += batch.length
      console.log(`Inserted ${inserted}/${locations.length}`)
    }

    console.log(`✅ Successfully inserted ${inserted} locations`)

    return NextResponse.json({
      success: true,
      message: `Uploaded ${inserted} locations to Supabase`,
      total: inserted
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

