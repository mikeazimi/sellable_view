import { NextRequest, NextResponse } from "next/server";
import { getShipHeroClient, getCustomerAccountId } from "@/lib/shiphero";
import type { QueryResult, Connection, WarehouseProduct } from "@/lib/shiphero/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get("warehouse_id");
    const sku = searchParams.get("sku");
    const customerAccountId = getCustomerAccountId(); // From environment variable

    const client = getShipHeroClient();

    // Query warehouse products (inventory) from ShipHero
    const query = `
      query GetWarehouseProducts(
        $warehouse_id: String
        $sku: String
        $customer_account_id: String
        $first: Int
      ) {
        warehouse_products(
          warehouse_id: $warehouse_id
          sku: $sku
          customer_account_id: $customer_account_id
          first: $first
        ) {
          request_id
          complexity
          data {
            edges {
              node {
                id
                legacy_id
                sku
                warehouse_id
                warehouse_identifier
                on_hand
                available
                allocated
                inventory_bin
                reserve_inventory
                reorder_level
                reorder_amount
                updated_at
                product {
                  name
                  barcode
                  dimensions {
                    weight
                    height
                    width
                    length
                  }
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;

    const variables = {
      warehouse_id: warehouseId || undefined,
      sku: sku || undefined,
      customer_account_id: customerAccountId,
      first: 50,
    };

    const response = await client.query<{
      warehouse_products: QueryResult<Connection<WarehouseProduct & { product: any }>>;
    }>(query, variables);

    // Transform ShipHero data to our format
    const inventoryData = response.warehouse_products.data.edges.map(({ node }) => ({
      id: node.id,
      sku: node.sku,
      name: node.product?.name || node.sku,
      quantity: node.on_hand,
      available: node.available,
      allocated: node.allocated,
      warehouse: node.warehouse_identifier,
      location: node.inventory_bin || "Unassigned",
      lastUpdated: node.updated_at,
      reorderLevel: node.reorder_level,
      reorderAmount: node.reorder_amount,
      barcode: node.product?.barcode,
      dimensions: node.product?.dimensions,
    }));

    return NextResponse.json({
      success: true,
      data: inventoryData,
      meta: {
        request_id: response.warehouse_products.request_id,
        complexity: response.warehouse_products.complexity,
        hasNextPage: response.warehouse_products.data.pageInfo.hasNextPage,
        endCursor: response.warehouse_products.data.pageInfo.endCursor,
      },
    });
  } catch (error: any) {
    console.error("Inventory list error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to fetch inventory",
        type: error.type || 'unknown'
      },
      { status: 500 }
    );
  }
}
