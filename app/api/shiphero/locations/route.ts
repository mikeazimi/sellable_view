import { NextRequest, NextResponse } from "next/server";
import { getShipHeroClient } from "@/lib/shiphero";
import type { QueryResult, Connection } from "@/lib/shiphero/types";

interface LocationNode {
  id: string;
  legacy_id: number;
  name: string;
  zone: string;
  pickable: boolean;
  sellable: boolean;
  warehouse_id: string;
  products: {
    edges: Array<{
      node: {
        sku: string;
        quantity: number;
        product: {
          name: string;
          barcode?: string;
        };
      };
    }>;
  };
}

/**
 * Decode base64 location name if it's encoded
 */
function decodeLocationName(name: string): string {
  try {
    // Check if it looks like base64 (only contains base64 chars)
    if (/^[A-Za-z0-9+/=]+$/.test(name) && name.length > 10) {
      const decoded = Buffer.from(name, 'base64').toString('utf-8');
      // Verify it decoded to readable text
      if (/^[\x20-\x7E]+$/.test(decoded)) {
        return decoded;
      }
    }
  } catch (e) {
    // If decode fails, return original
  }
  return name;
}

/**
 * Fetch all locations with pagination
 */
async function fetchAllLocations(
  client: any,
  variables: any,
  customerAccountId: string
): Promise<LocationNode[]> {
  const allLocations: LocationNode[] = [];
  let hasNextPage = true;
  let afterCursor: string | undefined = undefined;
  let pageCount = 0;
  const maxPages = 100; // Safety limit to prevent infinite loops

  const query = `
    query GetLocations(
      $warehouse_id: String
      $sku: String
      $pickable: Boolean
      $sellable: Boolean
      $customer_account_id: String
      $first: Int
      $after: String
    ) {
      locations(
        warehouse_id: $warehouse_id
        sku: $sku
        pickable: $pickable
        sellable: $sellable
        first: $first
        after: $after
      ) {
        request_id
        complexity
        data {
          edges {
            node {
              id
              legacy_id
              name
              zone
              pickable
              sellable
              warehouse_id
              products(customer_account_id: $customer_account_id) {
                edges {
                  node {
                    sku
                    quantity
                    product {
                      name
                      barcode
                    }
                  }
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

  console.log(`Starting paginated fetch for customer: ${customerAccountId}`);

  while (hasNextPage && pageCount < maxPages) {
    pageCount++;
    
    const pageVariables = {
      ...variables,
      first: 50, // Fetch 50 locations per page
      after: afterCursor,
      customer_account_id: customerAccountId,
    };

    console.log(`Fetching page ${pageCount}${afterCursor ? ` (cursor: ${afterCursor.substring(0, 20)}...)` : ''}`);

    const response = await client.query<{
      locations: QueryResult<Connection<LocationNode>>;
    }>(query, pageVariables);

    const edges = response.locations.data.edges;
    const locations = edges.map(({ node }) => node);
    
    allLocations.push(...locations);

    hasNextPage = response.locations.data.pageInfo.hasNextPage;
    afterCursor = response.locations.data.pageInfo.endCursor;

    console.log(`Page ${pageCount}: Fetched ${edges.length} locations (Total so far: ${allLocations.length}, hasNextPage: ${hasNextPage})`);
    console.log(`Complexity: ${response.locations.complexity}`);

    // Small delay between pages to be respectful to the API
    if (hasNextPage) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`Pagination complete: ${pageCount} pages, ${allLocations.length} total locations`);

  return allLocations;
}

/**
 * GET /api/shiphero/locations
 * Get all bin locations with inventory details (with pagination)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get("warehouse_id");
    const sku = searchParams.get("sku");
    const pickableOnly = searchParams.get("pickable") === "true";
    const sellableOnly = searchParams.get("sellable") === "true";

    // Get customer account ID from environment (configured via authentication)
    const customerAccountId = process.env.SHIPHERO_CUSTOMER_ACCOUNT_ID;

    const client = getShipHeroClient();

    const variables = {
      warehouse_id: warehouseId || undefined,
      sku: sku || undefined,
      pickable: pickableOnly || undefined,
      sellable: sellableOnly || undefined,
    };

    // Fetch all pages
    const startTime = Date.now();
    const allLocations = await fetchAllLocations(client, variables, customerAccountId);
    const fetchDuration = Date.now() - startTime;

    // Transform and flatten the data
    const locationsData = allLocations
      .map((node) => {
        // Get all products in this location
        const products = node.products.edges.map(({ node: productNode }) => ({
          sku: productNode.sku,
          productName: productNode.product.name,
          quantity: productNode.quantity,
          barcode: productNode.product.barcode,
        }));

        // Only return locations that have products
        if (products.length === 0) {
          return null;
        }

        return {
          locationId: node.id,
          legacyId: node.legacy_id,
          locationName: decodeLocationName(node.name),
          locationNameRaw: node.name,
          zone: node.zone,
          pickable: node.pickable,
          sellable: node.sellable,
          warehouseId: node.warehouse_id,
          products: products,
          totalItems: products.reduce((sum, p) => sum + p.quantity, 0),
        };
      })
      .filter((loc): loc is NonNullable<typeof loc> => loc !== null);

    console.log(`Returning ${locationsData.length} locations with inventory (took ${fetchDuration}ms)`);

    return NextResponse.json({
      success: true,
      data: locationsData,
      meta: {
        total_locations: locationsData.length,
        total_skus: locationsData.reduce((sum, loc) => sum + loc.products.length, 0),
        total_units: locationsData.reduce((sum, loc) => sum + loc.totalItems, 0),
        fetch_duration_ms: fetchDuration,
        customer_account_id: customerAccountId || 'All customers',
      },
    });
  } catch (error: any) {
    console.error("Locations fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch locations",
        type: error.type || "unknown",
      },
      { status: 500 }
    );
  }
}

