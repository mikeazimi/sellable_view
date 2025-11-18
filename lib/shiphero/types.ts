/**
 * TypeScript interfaces for ShipHero API
 * Based on ShipHero GraphQL schema
 */

// ============================================================================
// Warehouse Types
// ============================================================================

export interface WarehouseAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  phone?: string;
}

export interface Warehouse {
  id: string;
  legacy_id: number;
  identifier: string;
  address: WarehouseAddress;
  profile?: {
    name: string;
    timezone: string;
  };
  dynamic_slotting?: boolean;
}

// ============================================================================
// Product and Inventory Types
// ============================================================================

export interface ProductDimensions {
  weight?: string;
  height?: string;
  width?: string;
  length?: string;
}

export interface InventoryLocation {
  location_id: string;
  location_name: string;
  quantity: number;
  pickable: boolean;
}

export interface ProductInventory {
  warehouse_id: string;
  warehouse_identifier: string;
  on_hand: number;
  available: number;
  allocated: number;
  backorder_quantity: number;
  reserve: number;
  non_sellable: number;
  sellable: number;
  sell_ahead: number;
  qty_in_totes: number;
  updated_at: string;
  locations?: InventoryLocation[];
}

export interface Product {
  id: string;
  legacy_id: number;
  sku: string;
  name: string;
  price?: string;
  barcode?: string;
  dimensions?: ProductDimensions;
  created_at: string;
  updated_at: string;
  inventory?: ProductInventory[];
  warehouse_products?: WarehouseProduct[];
}

export interface WarehouseProduct {
  id: string;
  legacy_id: number;
  sku: string;
  warehouse_id: string;
  warehouse_identifier: string;
  on_hand: number;
  available: number;
  allocated: number;
  inventory_bin?: string;
  reserve_inventory: number;
  reorder_level: number;
  reorder_amount: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Order Types
// ============================================================================

export interface OrderAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  state_code?: string;
  zip: string;
  country: string;
  country_code?: string;
  email?: string;
  phone?: string;
}

export interface OrderLineItem {
  id: string;
  sku: string;
  partner_line_item_id: string;
  quantity: number;
  price: string;
  product_name: string;
  fulfillment_status: string;
  quantity_allocated: number;
  quantity_pending_fulfillment: number;
  quantity_shipped: number;
  backorder_quantity: number;
}

export interface Order {
  id: string;
  legacy_id: number;
  order_number: string;
  partner_order_id?: string;
  shop_name: string;
  fulfillment_status: string;
  order_date: string;
  total_price: string;
  subtotal: string;
  total_tax?: string;
  total_discounts?: string;
  email?: string;
  phone?: string;
  shipping_address: OrderAddress;
  billing_address?: OrderAddress;
  line_items: {
    edges: Array<{
      node: OrderLineItem;
      cursor: string;
    }>;
    pageInfo: PageInfo;
  };
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface Connection<T> {
  edges: Array<{
    node: T;
    cursor: string;
  }>;
  pageInfo: PageInfo;
}

// ============================================================================
// Response Wrapper Types
// ============================================================================

export interface QueryResult<T> {
  request_id: string;
  complexity: number;
  data: T;
}

// ============================================================================
// Inventory Sync Types
// ============================================================================

export interface InventorySyncStatus {
  id: string;
  url: string;
  user_id: string;
  account_id: string;
  warehouse_id: string;
  customer_account_id?: string;
  total_count: number;
  status: 'processing' | 'success' | 'error';
  error?: string;
  created_at: string;
  updated_at: string;
  success_count?: number;
  error_count?: number;
  finished_count?: number;
}

export interface InventorySyncItemStatus {
  id: string;
  row: number;
  sku: string;
  quantity: number;
  action: string;
  reason: string;
  location?: string;
  status: 'success' | 'error';
  error?: string;
  created_at: string;
  updated_at: string;
}

