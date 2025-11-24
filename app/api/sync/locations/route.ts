import { NextRequest, NextResponse } from "next/server";

/**
 * Background sync job - Run this periodically (every 4-6 hours)
 * Fetches ALL locations from ShipHero and caches in Supabase
 * This is expensive but runs infrequently
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    console.log('=== LOCATION SYNC JOB STARTED ===')

    // Simple locations query - gets ALL locations for caching
    const query = `
      query {
        locations {
          request_id
          complexity
          data {
            edges {
              node {
                id
                name
                sellable
                pickable
                warehouse_id
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const text = await response.text()
      console.error('ShipHero error:', text.substring(0, 500))
      return NextResponse.json({ 
        success: false, 
        error: `HTTP ${response.status}`
      }, { status: 500 });
    }

    const result = await response.json()

    if (result.errors) {
      console.error('GraphQL errors:', result.errors)
      return NextResponse.json({ 
        success: false, 
        error: result.errors[0].message
      }, { status: 500 });
    }

    const locations = result.data?.locations?.data?.edges?.map(({ node }: any) => node) || []
    console.log(`✅ Fetched ${locations.length} locations from ShipHero`)

    // Save to Supabase
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    const locationsToUpsert = locations.map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      sellable: loc.sellable || false,
      pickable: loc.pickable || false,
      warehouse_id: loc.warehouse_id,
      zone: loc.name?.split('-')[0] || 'Unknown',
      last_updated: new Date().toISOString()
    }))

    console.log(`💾 Saving ${locationsToUpsert.length} locations to Supabase...`)

    // Batch upsert in chunks of 100
    const chunkSize = 100
    let saved = 0
    
    for (let i = 0; i < locationsToUpsert.length; i += chunkSize) {
      const chunk = locationsToUpsert.slice(i, i + chunkSize)
      
      const { error } = await supabaseAdmin
        .from('locations')
        .upsert(chunk, { onConflict: 'id' })

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Failed to save chunk: ${error.message}`)
      }

      saved += chunk.length
      console.log(`Saved ${saved}/${locationsToUpsert.length} locations`)
    }

    console.log('✅ All locations synced to Supabase!')

    return NextResponse.json({
      success: true,
      message: `Synced ${saved} locations to Supabase`,
      meta: {
        total_locations: locations.length,
        complexity: result.data?.locations?.complexity,
        synced_at: new Date().toISOString()
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

