import { NextRequest, NextResponse } from "next/server";
import { getShipHeroClient, getCustomerAccountId } from "@/lib/shiphero";
import type { QueryResult, Warehouse } from "@/lib/shiphero/types";

/**
 * GET /api/shiphero/warehouses
 * Retrieve all warehouses for the account
 */
export async function GET(request: NextRequest) {
  try {
    // Check environment variable first
    const refreshToken = process.env.SHIPHERO_REFRESH_TOKEN;
    if (!refreshToken) {
      console.error('SHIPHERO_REFRESH_TOKEN not set in environment');
      return NextResponse.json({
        success: false,
        error: "SHIPHERO_REFRESH_TOKEN environment variable not set",
        hint: "Add the refresh token to your Vercel environment variables"
      }, { status: 500 });
    }

    const customerAccountId = getCustomerAccountId();
    const client = getShipHeroClient();

    console.log('Fetching warehouses...');
    console.log('Refresh token configured:', refreshToken.substring(0, 10) + '...');
    console.log('Customer account ID:', customerAccountId || 'Not set');

    // Simplified warehouses query - exact match to ShipHero docs
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

    const response = await client.query<{
      account: QueryResult<{
        warehouses: Warehouse[];
      }>;
    }>(query, {}, customerAccountId);

    console.log('Warehouses fetched successfully:', response.account.data.warehouses.length);

    return NextResponse.json({
      success: true,
      data: response.account.data.warehouses,
      meta: {
        request_id: response.account.request_id,
        complexity: response.account.complexity,
        customer_account_id: customerAccountId || 'All customers'
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

