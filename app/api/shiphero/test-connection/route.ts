import { NextResponse } from "next/server";
import { getShipHeroClient, getCustomerAccountId } from "@/lib/shiphero";

/**
 * GET /api/shiphero/test-connection
 * Test the ShipHero API connection and authentication
 */
export async function GET() {
  try {
    const customerAccountId = getCustomerAccountId();
    
    // Check if environment variable is set
    const refreshToken = process.env.SHIPHERO_REFRESH_TOKEN;
    if (!refreshToken) {
      return NextResponse.json({
        success: false,
        error: "SHIPHERO_REFRESH_TOKEN environment variable not set",
        hint: "Add the refresh token to your Vercel environment variables"
      }, { status: 500 });
    }

    const client = getShipHeroClient();

    // Simple query to test authentication
    const query = `
      query TestConnection {
        account {
          request_id
          complexity
          data {
            id
            legacy_id
            email
            username
            status
            is_3pl
            dynamic_slotting
          }
        }
      }
    `;

    console.log('Testing ShipHero API connection...');
    console.log('Refresh token configured:', refreshToken.substring(0, 10) + '...');
    console.log('Customer account ID:', customerAccountId || 'Not set');

    const response = await client.query<{
      account: {
        request_id: string;
        complexity: number;
        data: {
          id: string;
          legacy_id: number;
          email: string;
          username: string;
          status: string;
          is_3pl: boolean;
          dynamic_slotting: boolean;
        };
      };
    }>(query, {}, customerAccountId);

    return NextResponse.json({
      success: true,
      message: "Successfully connected to ShipHero API",
      data: {
        account_id: response.account.data.id,
        legacy_id: response.account.data.legacy_id,
        username: response.account.data.username,
        email: response.account.data.email,
        status: response.account.data.status,
        is_3pl: response.account.data.is_3pl,
        dynamic_slotting: response.account.data.dynamic_slotting,
        customer_account_id_filter: customerAccountId || 'Not set (will show all customers)',
      },
      meta: {
        request_id: response.account.request_id,
        complexity: response.account.complexity,
      },
    });
  } catch (error: any) {
    console.error("ShipHero connection test failed:", error);
    
    // Detailed error logging
    if (error.message?.includes('Authentication') || error.message?.includes('token')) {
      console.error('Authentication error - check refresh token');
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to connect to ShipHero API",
        type: error.type || 'unknown',
        hint: error.message?.includes('token') 
          ? "Check your SHIPHERO_REFRESH_TOKEN environment variable"
          : "Verify your ShipHero API credentials and network connectivity",
        debug: {
          refresh_token_set: !!process.env.SHIPHERO_REFRESH_TOKEN,
          customer_account_id: process.env.SHIPHERO_CUSTOMER_ACCOUNT_ID || 'Not set'
        }
      },
      { status: 500 }
    );
  }
}
