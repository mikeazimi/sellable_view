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

    // TODO: Save to Supabase
    // For now, return the data so you can verify the structure
    
    console.log('Sample location:', locations[0])

    return NextResponse.json({
      success: true,
      message: `Fetched ${locations.length} locations ready for Supabase`,
      data: locations.slice(0, 5), // Show first 5 as sample
      meta: {
        total_locations: locations.length,
        complexity: result.data?.locations?.complexity,
        next_step: 'Add Supabase connection to save this data'
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

