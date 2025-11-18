import { NextRequest, NextResponse } from "next/server";
import { getShipHeroClient, getCustomerAccountId } from "@/lib/shiphero";
import type { QueryResult, Connection, Product } from "@/lib/shiphero/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get("q") || "";
    const warehouseId = searchParams.get("warehouse_id");
    const customerAccountId = getCustomerAccountId(); // From environment variable

    const client = getShipHeroClient();

    // Search products by SKU or name
    const query = `
      query SearchProducts(
        $sku: String
        $customer_account_id: String
        $first: Int
      ) {
        products(
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
                name
                barcode
                dimensions {
                  weight
                  height
                  width
                  length
                }
                warehouse_products {
                  warehouse_id
                  warehouse_identifier
                  on_hand
                  available
                  allocated
                  inventory_bin
                  reorder_level
                  reorder_amount
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
      sku: searchQuery || undefined,
      customer_account_id: customerAccountId,
      first: 50,
    };

    const response = await client.query<{
      products: QueryResult<Connection<Product>>;
    }>(query, variables);

    // Transform and filter results
    const inventoryData = response.products.data.edges
      .map(({ node }) => {
        // Filter warehouse products if warehouse_id is specified
        const warehouseProducts = warehouseId
          ? node.warehouse_products?.filter(wp => wp.warehouse_id === warehouseId)
          : node.warehouse_products;

        return warehouseProducts?.map(wp => ({
          id: node.id,
          sku: node.sku,
          name: node.name,
          quantity: wp.on_hand,
          available: wp.available,
          allocated: wp.allocated,
          warehouse: wp.warehouse_identifier,
          location: wp.inventory_bin || "Unassigned",
          reorderLevel: wp.reorder_level,
          reorderAmount: wp.reorder_amount,
          barcode: node.barcode,
          dimensions: node.dimensions,
        })) || [];
      })
      .flat()
      .filter(item => 
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return NextResponse.json({
      success: true,
      data: inventoryData,
      meta: {
        request_id: response.products.request_id,
        complexity: response.products.complexity,
        hasNextPage: response.products.data.pageInfo.hasNextPage,
        endCursor: response.products.data.pageInfo.endCursor,
      },
    });
  } catch (error: any) {
    console.error("Inventory search error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to search inventory",
        type: error.type || 'unknown'
      },
      { status: 500 }
    );
  }
}
