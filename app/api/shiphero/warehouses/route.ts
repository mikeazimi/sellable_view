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

    // Get customer account ID from query params (for 3PL filtering)
    const searchParams = request.nextUrl.searchParams
    const customerAccountId = searchParams.get("customer_account_id")

    console.log('=== WAREHOUSES API CALLED ===')
    console.log('Auth header:', authHeader ? 'Present' : 'MISSING')
    console.log('Access token:', accessToken ? accessToken.substring(0, 30) + '...' : 'MISSING')
    console.log('Customer account ID filter:', customerAccountId || 'All customers')

    if (!accessToken) {
      console.error('No access token in Authorization header')
      return NextResponse.json({
        success: false,
        error: "Authorization header missing",
        hint: "Please authenticate in Settings first"
      }, { status: 401 });
    }

    console.log('Using client token:', accessToken.substring(0, 20) + '...');

    // Direct API call using client-provided token with optional customer filter
    const query = `
      query GetWarehouses($customer_account_id: String) {
        account {
          request_id
          complexity
          data {
            warehouses(customer_account_id: $customer_account_id) {
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

    const variables = customerAccountId ? { customer_account_id: customerAccountId } : {};

    console.log('📤 Sending query to ShipHero...')
    console.log('Variables:', JSON.stringify(variables, null, 2))
    
    const requestBody = { query, variables }

    const response = await fetch('https://public-api.shiphero.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 ShipHero response status:', response.status);
    
    const responseText = await response.text();
    console.log('Raw response:', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      console.error('Response body:', responseText);
      return NextResponse.json({
        success: false,
        error: `ShipHero API HTTP ${response.status}`,
        details: responseText.substring(0, 200)
      }, { status: 500 });
    }

    let result
    try {
      result = JSON.parse(responseText);
      console.log('✅ Parsed response:', JSON.stringify(result, null, 2));
    
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

