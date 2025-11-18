import { NextRequest, NextResponse } from "next/server";
import { getShipHeroClient, getCustomerAccountId } from "@/lib/shiphero";
import type { QueryResult, Warehouse } from "@/lib/shiphero/types";

/**
 * GET /api/shiphero/warehouses
 * Retrieve all warehouses for the account
 */
export async function GET(request: NextRequest) {
  try {
    const customerAccountId = getCustomerAccountId();
    const client = getShipHeroClient();

    const query = `
      query GetWarehouses {
        account {
          request_id
          complexity
          data {
            id
            legacy_id
            warehouses {
              id
              legacy_id
              identifier
              address {
                name
                address1
                address2
                city
                state
                country
                zip
                phone
              }
              profile {
                name
              }
            }
          }
        }
      }
    `;

    const response = await client.query<{
      account: QueryResult<{
        id: string;
        legacy_id: number;
        warehouses: Warehouse[];
      }>;
    }>(query, {}, customerAccountId);

    return NextResponse.json({
      success: true,
      data: response.account.data.warehouses,
      meta: {
        request_id: response.account.request_id,
        complexity: response.account.complexity,
        account_id: response.account.data.id,
      },
    });
  } catch (error: any) {
    console.error("Warehouses fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch warehouses",
        type: error.type || 'unknown'
      },
      { status: 500 }
    );
  }
}

