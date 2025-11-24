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

    // Get ALL locations using pagination on warehouse_products query
    // This is a workaround since locations query doesn't support pagination
    console.log('Fetching ALL locations via warehouse_products...')
    
    const allLocations = new Map() // Use Map to deduplicate locations
    let cursor: string | null = null
    let hasMore = true
    let pageCount = 0

    while (hasMore && pageCount < 100) {
      pageCount++
      
      const query = `
        query ($cursor: String) {
          warehouse_products(active: true) {
            complexity
            data(first: 50, after: $cursor) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  locations(first: 50) {
                    edges {
                      node {
                        location {
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
        body: JSON.stringify({ 
          query,
          variables: { cursor }
        })
      });

      if (!response.ok) {
        const text = await response.text()
        console.error('ShipHero error:', text.substring(0, 500))
        return NextResponse.json({ 
          success: false, 
          error: `HTTP ${response.status} on page ${pageCount}`
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

      const products = result.data?.warehouse_products?.data?.edges || []
      
      // Extract unique locations from all products
      products.forEach(({ node: product }: any) => {
        const locationEdges = product.locations?.edges || []
        locationEdges.forEach(({ node: itemLoc }: any) => {
          const loc = itemLoc.location
          if (loc && loc.id && !allLocations.has(loc.id)) {
            allLocations.set(loc.id, loc)
          }
        })
      })

      console.log(`Page ${pageCount}: ${allLocations.size} unique locations so far, complexity: ${result.data?.warehouse_products?.complexity}`)

      hasMore = result.data?.warehouse_products?.data?.pageInfo?.hasNextPage || false
      cursor = result.data?.warehouse_products?.data?.pageInfo?.endCursor

      // Pause between pages
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    const locations = Array.from(allLocations.values())
    console.log(`✅ Fetched ${locations.length} unique locations total from ${pageCount} pages`)

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

