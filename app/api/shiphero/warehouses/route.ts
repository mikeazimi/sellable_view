import { NextRequest, NextResponse } from "next/server";
import { getShipHeroClient, getCustomerAccountId } from "@/lib/shiphero";
import type { QueryResult, Warehouse } from "@/lib/shiphero/types";

/**
 * GET /api/shiphero/warehouses
 * Retrieve all warehouses for the account
 */
export async function GET(request: NextRequest) {
  try {
    // Get access token from Authorization header (client-side auth)
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')

    console.log('Warehouses API called')
    console.log('Auth header present:', !!authHeader)
    console.log('Access token extracted:', !!accessToken)

    if (!accessToken) {
      console.error('No access token in Authorization header')
      return NextResponse.json({
        success: false,
        error: "Authorization header missing",
        hint: "Please authenticate in Settings first"
      }, { status: 401 });
    }

    console.log('Using client token:', accessToken.substring(0, 20) + '...');

    // Direct API call using client-provided token
    const query = `
      query GetWarehouses {
        account {
          request_id
          complexity
          data {
            warehouses {
              id
              legacy_id
              identifier
              address {
                name
                address1
                city
                state
                country
                zip
              }
            }
          }
        }
      }
    `;

    console.log('Fetching warehouses with client token:', accessToken.substring(0, 20) + '...');

    const response = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query })
    });

    console.log('ShipHero API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ShipHero API error:', errorText);
      throw new Error(`ShipHero API error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Raw ShipHero response:', JSON.stringify(result, null, 2));
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message);
    }

    if (!result.data?.account?.data) {
      console.error('No account data in response:', result);
      throw new Error('No account data returned from ShipHero API');
    }

    console.log('Warehouses fetched successfully:', result.data.account.data.warehouses.length);

    return NextResponse.json({
      success: true,
      data: result.data.account.data.warehouses,
      meta: {
        request_id: result.data.account.request_id,
        complexity: result.data.account.complexity,
        auth_method: 'client_token'
      },
    });
  } catch (error: any) {
    console.error("Warehouses fetch error:", error);
    
    // More detailed error handling
    let errorMessage = error.message || "Failed to fetch warehouses";
    let hint = "Check your ShipHero API credentials";
    
    if (error.message?.includes('token') || error.message?.includes('Authentication')) {
      errorMessage = "Authentication failed";
      hint = "Check your SHIPHERO_REFRESH_TOKEN environment variable";
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      hint = "Check network connectivity to ShipHero API";
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        type: error.type || 'unknown',
        hint: hint,
        debug: {
          refresh_token_set: !!process.env.SHIPHERO_REFRESH_TOKEN,
          customer_account_id: process.env.SHIPHERO_CUSTOMER_ACCOUNT_ID || 'Not set'
        }
      },
      { status: 500 }
    );
  }
}

