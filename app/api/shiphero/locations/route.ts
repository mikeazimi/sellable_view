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
 * Fetch all warehouse products with pagination
 * More efficient than locations query according to ShipHero docs
 */
async function fetchAllWarehouseProducts(
  client: any,
  variables: any,
  customerAccountId?: string
): Promise<any[]> {
  const allProducts: any[] = [];
  let hasNextPage = true;
  let afterCursor: string | undefined = undefined;
  let pageCount = 0;
  const maxPages = 100; // Safety limit to prevent infinite loops

  const query = `
    query GetWarehouseProducts(
      $warehouse_id: String
      $sku: String
      $customer_account_id: String
      $first: Int
      $after: String
    ) {
      warehouse_products(
        warehouse_id: $warehouse_id
        sku: $sku
        customer_account_id: $customer_account_id
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
              sku
              warehouse_id
              warehouse_identifier
              on_hand
              inventory_bin
              active
              product {
                name
                barcode
              }
              locations {
                location_id
                location_name
                quantity
                pickable
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

  console.log(`Starting paginated warehouse products fetch${customerAccountId ? ' for customer: ' + customerAccountId : ''}`);

  while (hasNextPage && pageCount < maxPages) {
    pageCount++;
    
    const pageVariables = {
      ...variables,
      first: 50, // Fetch 50 products per page
      after: afterCursor,
      customer_account_id: customerAccountId,
    };

    console.log(`Fetching page ${pageCount}${afterCursor ? ` (cursor: ${afterCursor.substring(0, 20)}...)` : ''}`);

    const response = await client.query<{
      warehouse_products: QueryResult<Connection<any>>;
    }>(query, pageVariables);

    const edges = response.warehouse_products.data.edges;
    const products = edges.map(({ node }) => node);
    
    allProducts.push(...products);

    hasNextPage = response.warehouse_products.data.pageInfo.hasNextPage;
    afterCursor = response.warehouse_products.data.pageInfo.endCursor;

    console.log(`Page ${pageCount}: Fetched ${edges.length} products (Total so far: ${allProducts.length}, hasNextPage: ${hasNextPage})`);
    console.log(`Complexity: ${response.warehouse_products.complexity}`);

    // Small delay between pages to be respectful to the API
    if (hasNextPage) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`Pagination complete: ${pageCount} pages, ${allProducts.length} total products`);

  return allProducts;
}

/**
 * GET /api/shiphero/locations
 * Get all inventory data efficiently using warehouse_products query (per ShipHero docs)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get("warehouse_id");
    const sku = searchParams.get("sku");

    // Get customer account ID from environment (configured via authentication)
    const customerAccountId = process.env.SHIPHERO_CUSTOMER_ACCOUNT_ID;

    const client = getShipHeroClient();

    const variables = {
      warehouse_id: warehouseId || undefined,
      sku: sku || undefined,
      active: true, // Only get active products
    };

    // Fetch all pages using warehouse_products query (more efficient per docs)
    const startTime = Date.now();
    const allWarehouseProducts = await fetchAllWarehouseProducts(client, variables, customerAccountId);
    const fetchDuration = Date.now() - startTime;

    // Transform warehouse products into location-based data
    const locationsData: any[] = [];
    const locationMap = new Map<string, any>();

    allWarehouseProducts.forEach((product) => {
      if (product.locations && product.locations.length > 0) {
        // Product has specific location data (dynamic slotting)
        product.locations.forEach((location: any) => {
          const locationKey = `${product.warehouse_id}-${location.location_id}`;
          
          if (!locationMap.has(locationKey)) {
            locationMap.set(locationKey, {
              locationId: location.location_id,
              locationName: decodeLocationName(location.location_name),
              locationNameRaw: location.location_name,
              zone: location.location_name.split('-')[0] || 'Unknown', // Infer zone from location
              pickable: location.pickable,
              sellable: true, // Assume sellable if in locations
              warehouseId: product.warehouse_id,
              products: [],
              totalItems: 0,
            });
          }

          const loc = locationMap.get(locationKey);
          loc.products.push({
            sku: product.sku,
            productName: product.product?.name || product.sku,
            quantity: location.quantity,
            barcode: product.product?.barcode,
          });
          loc.totalItems += location.quantity;
        });
      } else if (product.inventory_bin && product.on_hand > 0) {
        // Product in traditional bin (static slotting)
        const locationKey = `${product.warehouse_id}-${product.inventory_bin}`;
        
        if (!locationMap.has(locationKey)) {
          locationMap.set(locationKey, {
            locationId: product.inventory_bin,
            locationName: decodeLocationName(product.inventory_bin),
            locationNameRaw: product.inventory_bin,
            zone: product.inventory_bin.split('-')[0] || 'Unknown',
            pickable: true, // Assume pickable if in inventory bin
            sellable: product.active !== false,
            warehouseId: product.warehouse_id,
            products: [],
            totalItems: 0,
          });
        }

        const loc = locationMap.get(locationKey);
        loc.products.push({
          sku: product.sku,
          productName: product.product?.name || product.sku,
          quantity: product.on_hand,
          barcode: product.product?.barcode,
        });
        loc.totalItems += product.on_hand;
      }
    });

    const locationsArray = Array.from(locationMap.values())
      .filter(loc => loc.products.length > 0);

    console.log(`Returning ${locationsArray.length} locations with inventory (took ${fetchDuration}ms)`);

    return NextResponse.json({
      success: true,
      data: locationsArray,
      meta: {
        total_locations: locationsArray.length,
        total_skus: locationsArray.reduce((sum: number, loc: any) => sum + loc.products.length, 0),
        total_units: locationsArray.reduce((sum: number, loc: any) => sum + loc.totalItems, 0),
        fetch_duration_ms: fetchDuration,
        customer_account_id: customerAccountId || 'All customers',
        query_method: 'warehouse_products (per ShipHero docs)',
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

