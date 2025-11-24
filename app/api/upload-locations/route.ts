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

    console.log(`💾 Upserting ${locations.length} locations to Supabase...`)

    // Use UPSERT to automatically handle duplicates
    // Unique constraint on (warehouse, location) will merge duplicates
    const batchSize = 1000
    let upserted = 0
    
    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize)
      
      // UPSERT: Insert new, update existing - no duplicates!
      const { error, count } = await supabaseAdmin
        .from('locations')
        .upsert(batch, { 
          onConflict: 'warehouse,location',
          ignoreDuplicates: false // Update existing records
        })

      if (error) {
        console.error('Upsert error:', error)
        throw new Error(`Failed at record ${i}: ${error.message}`)
      }

      upserted += batch.length
      console.log(`Processed ${upserted}/${locations.length} (upsert handles duplicates automatically)`)
    }

    console.log(`✅ Successfully upserted ${upserted} locations (duplicates merged)`)

    return NextResponse.json({
      success: true,
      message: `Uploaded ${upserted} locations to Supabase (duplicates automatically merged)`,
      total: upserted
    });

  } catch (error: any) {
    console.error("💥", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

