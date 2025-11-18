# The Complete ShipHero API Guide

*A comprehensive reference for integrating with ShipHero's GraphQL API using modern web technologies*

**Author:** Manus AI  
**Last Updated:** September 2025  
**Version:** 2.0

---

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication & Setup](#authentication--setup)
3. [Core Concepts](#core-concepts)
4. [Warehouse Management](#warehouse-management)
5. [Order Management](#order-management)
6. [Purchase Order Management](#purchase-order-management)
7. [Inventory Management](#inventory-management)
8. [Returns Management](#returns-management)
9. [Webhooks & Real-time Integration](#webhooks--real-time-integration)
10. [Advanced Features](#advanced-features)
11. [Error Handling & Best Practices](#error-handling--best-practices)
12. [Modern Web Stack Integration](#modern-web-stack-integration)
13. [Production Deployment](#production-deployment)
14. [Troubleshooting](#troubleshooting)
15. [API Reference](#api-reference)

---

## Introduction

ShipHero provides a comprehensive GraphQL API that enables developers to integrate warehouse management, order fulfillment, inventory tracking, and logistics operations into their applications. This guide covers every aspect of the ShipHero API, from basic authentication to advanced webhook implementations, with a focus on modern web development practices using JavaScript/TypeScript, Next.js, Vercel, and Supabase.

The ShipHero API is built on GraphQL, providing a single endpoint for all operations while allowing clients to request exactly the data they need. This approach reduces over-fetching and provides excellent performance characteristics for modern web applications.

### Key Features Covered

This guide provides comprehensive coverage of ShipHero's API capabilities, including detailed examples for warehouse operations, order creation and management, purchase order workflows, inventory synchronization, returns processing, and real-time webhook integrations. Each section includes practical TypeScript examples, error handling patterns, and integration strategies for popular development stacks.

The documentation emphasizes production-ready implementations with proper security practices, performance optimizations, and scalable architecture patterns. Whether you're building a simple order management interface or a complex multi-tenant logistics platform, this guide provides the foundation for successful ShipHero integration.

---


## Authentication & Setup

ShipHero's API uses JWT (JSON Web Token) bearer authentication with a refresh token mechanism. The authentication system is designed for long-term integrations where applications need persistent access to ShipHero data without requiring user credentials for each request.

### API Endpoints

ShipHero's public API operates through two primary endpoints:

- **Authentication Endpoint**: `https://public-api.shiphero.com/auth`
- **GraphQL Endpoint**: `https://public-api.shiphero.com/graphql`

The authentication endpoint handles token generation and refresh operations, while the GraphQL endpoint processes all data queries and mutations. This separation allows for efficient token management while maintaining a clean GraphQL interface for all business operations.

### Token-Based Authentication Flow

The authentication process follows a two-token system where a long-lived refresh token is used to generate short-lived access tokens. This approach provides security benefits by limiting the exposure window of active tokens while maintaining seamless user experience through automatic token refresh.

#### Initial Token Generation

For new integrations, you'll need to create a developer user account in ShipHero and generate initial tokens through the web interface. This process involves creating a Third-Party Developer user, which provides the necessary credentials for API access.

#### Refresh Token Usage

Once you have a refresh token, you can generate access tokens programmatically:

```bash
curl -X POST -H "Content-Type: application/json" -d \
'{ "refresh_token": "your_refresh_token_here" }' \
"https://public-api.shiphero.com/auth/refresh"
```

The response includes a new access token with a 28-day expiration period:

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...",
  "expires_in": 2419200,
  "scope": "openid profile offline_access",
  "token_type": "Bearer"
}
```

### TypeScript Authentication Client

For modern web applications, implementing a robust authentication client ensures reliable API access with automatic token refresh:

```typescript
export class ShipHeroAuth {
  private refreshToken: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(refreshToken: string) {
    this.refreshToken = refreshToken;
  }

  async getValidToken(): Promise<string> {
    // Return existing token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshAccessToken();
    
    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await fetch('https://public-api.shiphero.com/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    
    // Set expiry to 5 minutes before actual expiry for safety
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000);
    
    return this.accessToken;
  }
}
```

### Environment Configuration

Proper environment variable management is crucial for secure API integration:

```bash
# .env.local
SHIPHERO_REFRESH_TOKEN=your_refresh_token_here
NEXT_PUBLIC_APP_ENV=development

# Production environment variables (Vercel)
SHIPHERO_REFRESH_TOKEN=production_refresh_token
NEXT_PUBLIC_APP_ENV=production
```

### Security Considerations

Token security requires careful handling throughout your application architecture. Never expose refresh tokens in client-side code, as they provide long-term access to your ShipHero account. Instead, implement server-side API routes that handle authentication and proxy requests to the ShipHero API.

The access tokens should be treated as sensitive credentials and stored securely in server memory or encrypted storage. Implement proper error handling for authentication failures, including automatic retry mechanisms for transient network issues.

For production deployments, consider implementing token rotation strategies where refresh tokens are periodically renewed through administrative processes. This approach provides additional security layers while maintaining operational continuity.

---


## Core Concepts

Understanding ShipHero's GraphQL implementation and data model is essential for effective API integration. The API follows GraphQL best practices while implementing domain-specific patterns for warehouse and logistics operations.

### GraphQL Fundamentals

ShipHero's GraphQL API provides a single endpoint that supports both queries (for reading data) and mutations (for modifying data). This approach offers several advantages over traditional REST APIs, including precise data fetching, strong typing, and excellent tooling support.

The API uses a schema-first approach where all available operations, types, and fields are defined in a comprehensive GraphQL schema. This schema serves as a contract between the API and client applications, enabling powerful development tools and automatic code generation.

#### Query Structure

All GraphQL requests follow a consistent structure with operation type, selection sets, and optional variables:

```graphql
query GetWarehouses($first: Int) {
  account {
    data {
      warehouses(first: $first) {
        id
        identifier
        address {
          name
          city
          state
        }
      }
    }
  }
}
```

The query above demonstrates several key concepts: the `account` root field provides access to account-level resources, nested selection sets allow fetching related data in a single request, and variables enable parameterized queries for dynamic behavior.

#### Mutation Patterns

Mutations in ShipHero follow consistent patterns for data modification operations. Each mutation returns a response object containing request metadata, complexity information, and the created or modified resource:

```graphql
mutation CreateOrder($orderData: OrderCreateInput!) {
  order_create(data: $orderData) {
    request_id
    complexity
    order {
      id
      order_number
      fulfillment_status
    }
  }
}
```

This pattern provides valuable debugging information through the `request_id` field, performance insights via the `complexity` score, and immediate access to the created resource's key properties.

### ShipHero Data Model

The ShipHero data model centers around several core entities that represent different aspects of warehouse and fulfillment operations. Understanding these entities and their relationships is crucial for effective API usage.

#### Account Hierarchy

The account serves as the top-level container for all resources in ShipHero. Multi-tenant scenarios, such as 3PL operations, use customer accounts to segment data while maintaining operational efficiency. This hierarchy affects query patterns and mutation requirements throughout the API.

#### Resource Identification

ShipHero uses both legacy numeric IDs and modern UUID-based identifiers for resource identification. The UUID system provides better scalability and security characteristics, while legacy IDs maintain compatibility with existing integrations. When possible, prefer UUID-based identifiers for new integrations.

The `uuid` query enables conversion between legacy and modern identifiers:

```graphql
query ConvertLegacyId($legacyId: Int!, $entityType: EntityType!) {
  uuid(legacy_id: $legacyId, entity: $entityType) {
    data {
      legacy_id
      id
    }
  }
}
```

#### Pagination and Performance

ShipHero implements cursor-based pagination for efficient handling of large result sets. This approach provides consistent performance characteristics regardless of result set size and enables real-time data synchronization patterns.

```graphql
query GetOrdersWithPagination($first: Int!, $after: String) {
  orders(first: $first, after: $after) {
    data {
      edges {
        node {
          id
          order_number
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
```

The pagination system uses opaque cursors that encode position information, allowing clients to efficiently navigate through large datasets while maintaining consistency even when underlying data changes.

### Error Handling Patterns

GraphQL's error handling model differs from traditional HTTP APIs by returning partial results alongside error information. ShipHero extends this pattern with domain-specific error codes and detailed error messages that enable robust client-side error handling.

```typescript
interface ShipHeroResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: {
      code: string;
      details?: any;
    };
  }>;
}
```

Effective error handling requires checking both the HTTP status code and the GraphQL errors array. Network-level errors manifest as HTTP status codes, while business logic errors appear in the GraphQL errors array with detailed context information.

### Rate Limiting and Complexity Analysis

ShipHero implements sophisticated rate limiting based on query complexity rather than simple request counting. This approach provides fair resource allocation while preventing abuse through overly complex queries.

Each query receives a complexity score based on the requested fields, nested relationships, and expected computational cost. The API returns this score in the response, enabling clients to optimize their queries for better performance:

```json
{
  "data": {
    "orders": {
      "request_id": "unique_request_identifier",
      "complexity": 15,
      "data": { ... }
    }
  }
}
```

Understanding complexity scoring helps optimize query performance and avoid rate limiting issues. Prefer specific field selection over broad queries, implement appropriate pagination limits, and consider caching strategies for frequently accessed data.

---


## Warehouse Management

Warehouse operations form the foundation of ShipHero's functionality, providing the physical and logical infrastructure for inventory management and order fulfillment. Understanding warehouse concepts and API patterns is essential for effective integration.

### Warehouse Query Operations

The primary method for retrieving warehouse information uses the account-level warehouses field, which provides access to all warehouses associated with your account. This query supports various filtering and pagination options to handle large warehouse networks efficiently.

```graphql
query GetAllWarehouses {
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
          address2
          city
          state
          country
          zip
          phone
        }
        profile {
          name
          timezone
        }
        settings {
          auto_allocate
          auto_ship
          default_box_id
        }
        created_at
        updated_at
      }
    }
  }
}
```

This comprehensive query retrieves essential warehouse information including unique identifiers, physical addresses, operational profiles, and configuration settings. The `identifier` field provides a human-readable warehouse name, while the `settings` object contains operational parameters that affect order processing behavior.

### TypeScript Interface Definitions

Implementing strong typing for warehouse data improves development experience and reduces runtime errors:

```typescript
interface WarehouseAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  phone?: string;
}

interface WarehouseProfile {
  name: string;
  timezone: string;
}

interface WarehouseSettings {
  auto_allocate: boolean;
  auto_ship: boolean;
  default_box_id?: string;
}

interface Warehouse {
  id: string;
  legacy_id: number;
  identifier: string;
  address: WarehouseAddress;
  profile: WarehouseProfile;
  settings: WarehouseSettings;
  created_at: string;
  updated_at: string;
}

interface WarehouseResponse {
  request_id: string;
  complexity: number;
  data: {
    warehouses: Warehouse[];
  };
}
```

These interfaces provide compile-time type checking and excellent IDE support for warehouse-related operations throughout your application.

### Warehouse Selection Strategies

Different integration scenarios require different approaches to warehouse selection and management. Single-warehouse operations can cache warehouse information at application startup, while multi-warehouse scenarios need dynamic warehouse selection based on business logic.

For applications serving multiple geographic regions, implement warehouse selection algorithms that consider factors such as inventory availability, shipping costs, and delivery time requirements. The warehouse address information enables distance calculations and shipping zone determinations.

```typescript
class WarehouseManager {
  private warehouses: Map<string, Warehouse> = new Map();
  private warehousesByRegion: Map<string, Warehouse[]> = new Map();

  async loadWarehouses(apiClient: ShipHeroAPI): Promise<void> {
    const response = await apiClient.query<WarehouseResponse>(`
      query GetWarehouses {
        account {
          data {
            warehouses {
              id
              identifier
              address {
                name
                city
                state
                country
                zip
              }
            }
          }
        }
      }
    `);

    // Index warehouses by ID and region
    response.data.warehouses.forEach(warehouse => {
      this.warehouses.set(warehouse.id, warehouse);
      
      const region = warehouse.address.state;
      if (!this.warehousesByRegion.has(region)) {
        this.warehousesByRegion.set(region, []);
      }
      this.warehousesByRegion.get(region)!.push(warehouse);
    });
  }

  getWarehouseById(id: string): Warehouse | undefined {
    return this.warehouses.get(id);
  }

  getWarehousesByRegion(region: string): Warehouse[] {
    return this.warehousesByRegion.get(region) || [];
  }

  selectOptimalWarehouse(
    customerAddress: { state: string; zip: string },
    requiredSkus: string[]
  ): Warehouse | null {
    // Implement business logic for warehouse selection
    // Consider inventory availability, shipping zones, etc.
    const regionalWarehouses = this.getWarehousesByRegion(customerAddress.state);
    
    if (regionalWarehouses.length > 0) {
      return regionalWarehouses[0]; // Simplified selection
    }

    // Fallback to any available warehouse
    return Array.from(this.warehouses.values())[0] || null;
  }
}
```

### Warehouse Configuration Management

Warehouse settings significantly impact order processing behavior and should be carefully managed in production environments. The `auto_allocate` setting determines whether orders automatically reserve inventory upon creation, while `auto_ship` controls automatic shipment processing for eligible orders.

Understanding these settings helps predict system behavior and implement appropriate business logic in your applications. For example, warehouses with `auto_allocate` disabled require explicit allocation operations before order fulfillment can proceed.

### Multi-Tenant Warehouse Access

For 3PL operations or multi-tenant scenarios, warehouse access patterns become more complex. The API supports customer account filtering to ensure proper data isolation and access control:

```graphql
query GetCustomerWarehouses($customerAccountId: String!) {
  account {
    data {
      warehouses(customer_account_id: $customerAccountId) {
        id
        identifier
        address {
          name
          city
          state
        }
      }
    }
  }
}
```

This pattern enables building applications that serve multiple customers while maintaining strict data separation and access controls. Implement proper authorization checks in your application layer to ensure users only access warehouses they're authorized to manage.

### Warehouse Performance Monitoring

Monitoring warehouse operations through the API enables proactive management and optimization. Track key metrics such as order processing times, inventory accuracy, and fulfillment rates to identify operational improvements.

```typescript
interface WarehouseMetrics {
  warehouseId: string;
  orderVolume: number;
  fulfillmentRate: number;
  averageProcessingTime: number;
  inventoryAccuracy: number;
}

class WarehouseAnalytics {
  async calculateMetrics(
    warehouseId: string,
    dateRange: { from: string; to: string }
  ): Promise<WarehouseMetrics> {
    // Implement metrics calculation using order and inventory queries
    // This would involve multiple API calls to gather necessary data
    
    return {
      warehouseId,
      orderVolume: 0, // Calculate from orders query
      fulfillmentRate: 0, // Calculate from fulfillment data
      averageProcessingTime: 0, // Calculate from order timestamps
      inventoryAccuracy: 0, // Calculate from inventory movements
    };
  }
}
```

Regular monitoring helps identify trends and potential issues before they impact customer experience or operational efficiency.

---


## Order Management

Order management represents the core workflow in ShipHero's system, encompassing order creation, modification, fulfillment tracking, and status management. The API provides comprehensive tools for managing the complete order lifecycle from initial creation through final delivery.

### Order Creation Fundamentals

Creating orders through the ShipHero API requires understanding the relationship between orders, line items, addresses, and warehouse assignments. The order creation process validates inventory availability, calculates shipping requirements, and establishes fulfillment workflows.

```graphql
mutation CreateOrder($orderData: OrderCreateInput!) {
  order_create(data: $orderData) {
    request_id
    complexity
    order {
      id
      legacy_id
      order_number
      partner_order_id
      fulfillment_status
      order_date
      total_price
      subtotal
      shipping_lines {
        title
        price
      }
      billing_address {
        name
        address1
        city
        state
        zip
        country
      }
      shipping_address {
        name
        address1
        city
        state
        zip
        country
      }
      line_items {
        edges {
          node {
            id
            sku
            quantity
            price
            product_name
            fulfillment_status
          }
        }
      }
    }
  }
}
```

The mutation returns comprehensive order information including system-generated identifiers, fulfillment status, and detailed line item information. The `partner_order_id` field enables linking ShipHero orders with external system records for integration scenarios.

### Complete Order Creation Example

A production-ready order creation implementation handles address validation, inventory checking, and error recovery:

```typescript
interface OrderLineItem {
  sku: string;
  quantity: number;
  price: string;
  product_name: string;
  partner_line_item_id: string;
  fulfillment_status?: string;
  warehouse_id?: string;
  custom_options?: Record<string, any>;
  custom_barcode?: string;
}

interface OrderAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

interface OrderCreateData {
  order_number: string;
  partner_order_id: string;
  order_date: string;
  total_price: string;
  subtotal: string;
  total_discounts: string;
  total_tax: string;
  email: string;
  profile: string;
  shop_name: string;
  fulfillment_status: string;
  order_history_url?: string;
  packing_note?: string;
  required_ship_date?: string;
  shipping_address: OrderAddress;
  billing_address: OrderAddress;
  shipping_lines: Array<{
    title: string;
    price: string;
  }>;
  line_items: OrderLineItem[];
  tags?: string[];
  gift_invoice?: boolean;
  gift_note?: string;
  insurance?: boolean;
  allow_partial?: boolean;
  require_signature?: boolean;
  adult_signature_required?: boolean;
  alcohol?: boolean;
  expected_weight_in_oz?: number;
}

class OrderManager {
  constructor(private apiClient: ShipHeroAPI) {}

  async createOrder(orderData: OrderCreateData): Promise<Order> {
    // Validate required fields
    this.validateOrderData(orderData);

    // Check inventory availability
    await this.validateInventoryAvailability(orderData.line_items);

    const mutation = `
      mutation CreateOrder($orderData: OrderCreateInput!) {
        order_create(data: $orderData) {
          request_id
          complexity
          order {
            id
            legacy_id
            order_number
            partner_order_id
            fulfillment_status
            order_date
            total_price
            subtotal
            shipping_address {
              name
              address1
              city
              state
              zip
              country
            }
            billing_address {
              name
              address1
              city
              state
              zip
              country
            }
            line_items {
              edges {
                node {
                  id
                  sku
                  quantity
                  price
                  product_name
                  partner_line_item_id
                  fulfillment_status
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.apiClient.mutate<{
        order_create: {
          request_id: string;
          complexity: number;
          order: Order;
        };
      }>(mutation, { orderData });

      // Log successful creation
      console.log(`Order created successfully: ${response.order_create.order.order_number}`);
      
      return response.order_create.order;
    } catch (error) {
      console.error('Order creation failed:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  private validateOrderData(orderData: OrderCreateData): void {
    if (!orderData.order_number) {
      throw new Error('Order number is required');
    }
    
    if (!orderData.partner_order_id) {
      throw new Error('Partner order ID is required');
    }

    if (!orderData.line_items || orderData.line_items.length === 0) {
      throw new Error('At least one line item is required');
    }

    // Validate addresses
    this.validateAddress(orderData.shipping_address, 'shipping');
    this.validateAddress(orderData.billing_address, 'billing');

    // Validate line items
    orderData.line_items.forEach((item, index) => {
      if (!item.sku) {
        throw new Error(`Line item ${index + 1}: SKU is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Line item ${index + 1}: Valid quantity is required`);
      }
      if (!item.partner_line_item_id) {
        throw new Error(`Line item ${index + 1}: Partner line item ID is required`);
      }
    });
  }

  private validateAddress(address: OrderAddress, type: string): void {
    const requiredFields = ['name', 'address1', 'city', 'state', 'zip', 'country'];
    
    requiredFields.forEach(field => {
      if (!address[field as keyof OrderAddress]) {
        throw new Error(`${type} address: ${field} is required`);
      }
    });
  }

  private async validateInventoryAvailability(lineItems: OrderLineItem[]): Promise<void> {
    // Query inventory for all SKUs
    const skus = lineItems.map(item => item.sku);
    const inventoryQuery = `
      query CheckInventory($skus: [String!]!) {
        products(sku_in: $skus) {
          data {
            edges {
              node {
                sku
                inventory {
                  available
                  on_hand
                  allocated
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(inventoryQuery, { skus });
    const products = response.products.data.edges.map(edge => edge.node);

    // Check availability for each line item
    lineItems.forEach(item => {
      const product = products.find(p => p.sku === item.sku);
      if (!product) {
        throw new Error(`Product not found: ${item.sku}`);
      }

      const available = product.inventory.available;
      if (available < item.quantity) {
        throw new Error(
          `Insufficient inventory for ${item.sku}: requested ${item.quantity}, available ${available}`
        );
      }
    });
  }
}
```

### Order Query Operations

Retrieving order information supports various filtering and search patterns to accommodate different use cases. The orders query provides flexible filtering options including date ranges, fulfillment status, and customer information.

```graphql
query GetOrders(
  $first: Int!
  $after: String
  $orderDateFrom: ISODateTime
  $orderDateTo: ISODateTime
  $fulfillmentStatus: String
  $shopName: String
) {
  orders(
    first: $first
    after: $after
    order_date_from: $orderDateFrom
    order_date_to: $orderDateTo
    fulfillment_status: $fulfillmentStatus
    shop_name: $shopName
  ) {
    request_id
    complexity
    data {
      edges {
        node {
          id
          order_number
          partner_order_id
          fulfillment_status
          order_date
          total_price
          email
          shipping_address {
            name
            city
            state
          }
          line_items(first: 10) {
            edges {
              node {
                sku
                quantity
                fulfillment_status
                quantity_shipped
                quantity_pending_fulfillment
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
```

This query demonstrates pagination handling, flexible filtering, and selective field retrieval to optimize performance and reduce data transfer.

### Order Status Management

Order fulfillment involves multiple status transitions that reflect the physical and logical progress through the warehouse workflow. Understanding these statuses enables building accurate user interfaces and automated business processes.

The primary fulfillment statuses include:

- **Pending**: Order created but not yet allocated
- **Allocated**: Inventory reserved for the order
- **Partially Shipped**: Some line items have been shipped
- **Shipped**: All line items have been shipped
- **Delivered**: Order confirmed as delivered
- **Canceled**: Order canceled before fulfillment
- **On Hold**: Order temporarily suspended

```typescript
enum FulfillmentStatus {
  PENDING = 'pending',
  ALLOCATED = 'allocated',
  PARTIALLY_SHIPPED = 'partially_shipped',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
  ON_HOLD = 'on_hold'
}

interface OrderStatusUpdate {
  orderId: string;
  status: FulfillmentStatus;
  reason?: string;
  timestamp: Date;
}

class OrderStatusTracker {
  private statusHistory: Map<string, OrderStatusUpdate[]> = new Map();

  recordStatusChange(update: OrderStatusUpdate): void {
    if (!this.statusHistory.has(update.orderId)) {
      this.statusHistory.set(update.orderId, []);
    }
    
    this.statusHistory.get(update.orderId)!.push(update);
  }

  getStatusHistory(orderId: string): OrderStatusUpdate[] {
    return this.statusHistory.get(orderId) || [];
  }

  getCurrentStatus(orderId: string): FulfillmentStatus | null {
    const history = this.getStatusHistory(orderId);
    if (history.length === 0) return null;
    
    return history[history.length - 1].status;
  }
}
```

### Advanced Order Operations

Beyond basic creation and querying, the API supports advanced order operations including modifications, cancellations, and bulk operations. These capabilities enable sophisticated order management workflows.

Order modification requires careful handling of inventory implications and fulfillment status considerations. Modifications to shipped orders may require return processing or additional shipments.

```typescript
class AdvancedOrderOperations {
  constructor(private apiClient: ShipHeroAPI) {}

  async cancelOrder(orderId: string, reason: string): Promise<void> {
    const mutation = `
      mutation CancelOrder($orderId: String!, $reason: String!) {
        order_cancel(data: { order_id: $orderId, reason: $reason }) {
          request_id
          complexity
          order {
            id
            fulfillment_status
          }
        }
      }
    `;

    await this.apiClient.mutate(mutation, { orderId, reason });
  }

  async addLineItem(
    orderId: string,
    lineItem: OrderLineItem
  ): Promise<void> {
    // Implementation would depend on specific API capabilities
    // This might require order modification or creating a new order
    throw new Error('Line item addition requires specific implementation');
  }

  async updateShippingAddress(
    orderId: string,
    newAddress: OrderAddress
  ): Promise<void> {
    const mutation = `
      mutation UpdateShippingAddress(
        $orderId: String!
        $address: AddressInput!
      ) {
        order_update(data: {
          order_id: $orderId
          shipping_address: $address
        }) {
          request_id
          order {
            id
            shipping_address {
              name
              address1
              city
              state
              zip
            }
          }
        }
      }
    `;

    await this.apiClient.mutate(mutation, { orderId, address: newAddress });
  }
}
```

These advanced operations require careful consideration of business rules and inventory implications to maintain data consistency and operational integrity.

---


## Purchase Order Management

Purchase orders in ShipHero facilitate inventory replenishment and vendor management workflows. The API provides comprehensive tools for creating, tracking, and managing purchase orders throughout their lifecycle from initial creation through final receipt and inventory updates.

### Purchase Order Creation

Creating purchase orders requires understanding vendor relationships, product specifications, and warehouse receiving capabilities. The purchase order creation process establishes vendor commitments, expected delivery schedules, and inventory receiving workflows.

```graphql
mutation CreatePurchaseOrder($poData: PurchaseOrderCreateInput!) {
  purchase_order_create(data: $poData) {
    request_id
    complexity
    purchase_order {
      id
      legacy_id
      po_number
      partner_po_id
      status
      po_date
      po_note
      subtotal
      shipping_price
      total_price
      tax
      discount
      vendor {
        id
        name
        email
      }
      warehouse {
        id
        identifier
      }
      line_items {
        edges {
          node {
            id
            sku
            quantity
            quantity_received
            price
            product_name
            expected_weight_in_oz
          }
        }
      }
      fulfillment {
        id
        status
        created_at
      }
    }
  }
}
```

The mutation returns comprehensive purchase order information including vendor details, warehouse assignment, and line item specifications. The `partner_po_id` field enables integration with external procurement systems.

### TypeScript Interface Definitions

Strong typing for purchase order operations improves development experience and reduces integration errors:

```typescript
interface Vendor {
  id: string;
  name: string;
  email: string;
  address?: {
    name: string;
    address1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

interface PurchaseOrderLineItem {
  sku: string;
  quantity: number;
  price: string;
  product_name: string;
  expected_weight_in_oz?: number;
  quantity_received?: number;
  partner_line_item_id?: string;
}

interface PurchaseOrderCreateData {
  po_number: string;
  partner_po_id: string;
  po_date: string;
  po_note?: string;
  subtotal: string;
  shipping_price: string;
  total_price: string;
  tax: string;
  discount: string;
  vendor_id: string;
  warehouse_id: string;
  line_items: PurchaseOrderLineItem[];
  fulfillment?: {
    ship_to: {
      name: string;
      address1: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
}

interface PurchaseOrder {
  id: string;
  legacy_id: number;
  po_number: string;
  partner_po_id: string;
  status: string;
  po_date: string;
  po_note?: string;
  subtotal: string;
  shipping_price: string;
  total_price: string;
  tax: string;
  discount: string;
  vendor: Vendor;
  warehouse: {
    id: string;
    identifier: string;
  };
  line_items: {
    edges: Array<{
      node: PurchaseOrderLineItem & {
        id: string;
        quantity_received: number;
      };
    }>;
  };
  fulfillment?: {
    id: string;
    status: string;
    created_at: string;
  };
}
```

### Complete Purchase Order Implementation

A production-ready purchase order management system handles vendor validation, inventory planning, and receiving workflows:

```typescript
class PurchaseOrderManager {
  constructor(private apiClient: ShipHeroAPI) {}

  async createPurchaseOrder(poData: PurchaseOrderCreateData): Promise<PurchaseOrder> {
    // Validate purchase order data
    this.validatePurchaseOrderData(poData);

    // Verify vendor exists and is active
    await this.validateVendor(poData.vendor_id);

    // Verify warehouse exists and can receive inventory
    await this.validateWarehouse(poData.warehouse_id);

    const mutation = `
      mutation CreatePurchaseOrder($poData: PurchaseOrderCreateInput!) {
        purchase_order_create(data: $poData) {
          request_id
          complexity
          purchase_order {
            id
            legacy_id
            po_number
            partner_po_id
            status
            po_date
            po_note
            subtotal
            shipping_price
            total_price
            tax
            discount
            vendor {
              id
              name
              email
            }
            warehouse {
              id
              identifier
            }
            line_items {
              edges {
                node {
                  id
                  sku
                  quantity
                  quantity_received
                  price
                  product_name
                  expected_weight_in_oz
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.apiClient.mutate<{
        purchase_order_create: {
          request_id: string;
          complexity: number;
          purchase_order: PurchaseOrder;
        };
      }>(mutation, { poData });

      console.log(`Purchase order created: ${response.purchase_order_create.purchase_order.po_number}`);
      
      return response.purchase_order_create.purchase_order;
    } catch (error) {
      console.error('Purchase order creation failed:', error);
      throw new Error(`Failed to create purchase order: ${error.message}`);
    }
  }

  private validatePurchaseOrderData(poData: PurchaseOrderCreateData): void {
    if (!poData.po_number) {
      throw new Error('PO number is required');
    }

    if (!poData.partner_po_id) {
      throw new Error('Partner PO ID is required');
    }

    if (!poData.vendor_id) {
      throw new Error('Vendor ID is required');
    }

    if (!poData.warehouse_id) {
      throw new Error('Warehouse ID is required');
    }

    if (!poData.line_items || poData.line_items.length === 0) {
      throw new Error('At least one line item is required');
    }

    // Validate line items
    poData.line_items.forEach((item, index) => {
      if (!item.sku) {
        throw new Error(`Line item ${index + 1}: SKU is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Line item ${index + 1}: Valid quantity is required`);
      }
      if (!item.price) {
        throw new Error(`Line item ${index + 1}: Price is required`);
      }
    });

    // Validate financial totals
    const calculatedSubtotal = poData.line_items.reduce(
      (sum, item) => sum + (parseFloat(item.price) * item.quantity),
      0
    );

    const expectedTotal = calculatedSubtotal + 
      parseFloat(poData.shipping_price) + 
      parseFloat(poData.tax) - 
      parseFloat(poData.discount);

    if (Math.abs(expectedTotal - parseFloat(poData.total_price)) > 0.01) {
      throw new Error('Total price does not match calculated total');
    }
  }

  private async validateVendor(vendorId: string): Promise<void> {
    const query = `
      query GetVendor($vendorId: String!) {
        vendor(id: $vendorId) {
          data {
            id
            name
            active
          }
        }
      }
    `;

    try {
      const response = await this.apiClient.query(query, { vendorId });
      if (!response.vendor.data) {
        throw new Error(`Vendor not found: ${vendorId}`);
      }
      if (!response.vendor.data.active) {
        throw new Error(`Vendor is inactive: ${vendorId}`);
      }
    } catch (error) {
      throw new Error(`Vendor validation failed: ${error.message}`);
    }
  }

  private async validateWarehouse(warehouseId: string): Promise<void> {
    const query = `
      query GetWarehouse($warehouseId: String!) {
        account {
          data {
            warehouses {
              id
              identifier
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(query);
    const warehouse = response.account.data.warehouses.find(
      (w: any) => w.id === warehouseId
    );

    if (!warehouse) {
      throw new Error(`Warehouse not found: ${warehouseId}`);
    }
  }
}
```

### Purchase Order Receiving Operations

The receiving process updates purchase order line items with actual received quantities and triggers inventory updates. This process requires careful handling of partial receipts and quality control workflows.

```typescript
interface ReceivingLineItem {
  line_item_id: string;
  quantity_received: number;
  condition?: 'good' | 'damaged' | 'expired';
  lot_number?: string;
  expiration_date?: string;
  notes?: string;
}

class PurchaseOrderReceiving {
  constructor(private apiClient: ShipHeroAPI) {}

  async receivePurchaseOrder(
    purchaseOrderId: string,
    receivingItems: ReceivingLineItem[]
  ): Promise<void> {
    const mutation = `
      mutation ReceivePurchaseOrder(
        $purchaseOrderId: String!
        $receivingData: PurchaseOrderReceiveInput!
      ) {
        purchase_order_receive(
          purchase_order_id: $purchaseOrderId
          data: $receivingData
        ) {
          request_id
          complexity
          purchase_order {
            id
            status
            line_items {
              edges {
                node {
                  id
                  sku
                  quantity
                  quantity_received
                }
              }
            }
          }
        }
      }
    `;

    const receivingData = {
      line_items: receivingItems.map(item => ({
        line_item_id: item.line_item_id,
        quantity_received: item.quantity_received,
        condition: item.condition || 'good',
        lot_number: item.lot_number,
        expiration_date: item.expiration_date,
        notes: item.notes
      }))
    };

    try {
      await this.apiClient.mutate(mutation, {
        purchaseOrderId,
        receivingData
      });

      console.log(`Purchase order ${purchaseOrderId} receiving completed`);
    } catch (error) {
      console.error('Purchase order receiving failed:', error);
      throw new Error(`Failed to receive purchase order: ${error.message}`);
    }
  }

  async getReceivingStatus(purchaseOrderId: string): Promise<{
    totalItems: number;
    receivedItems: number;
    pendingItems: number;
    completionPercentage: number;
  }> {
    const query = `
      query GetPurchaseOrderStatus($purchaseOrderId: String!) {
        purchase_order(id: $purchaseOrderId) {
          data {
            line_items {
              edges {
                node {
                  quantity
                  quantity_received
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(query, { purchaseOrderId });
    const lineItems = response.purchase_order.data.line_items.edges.map(
      (edge: any) => edge.node
    );

    const totalItems = lineItems.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    );

    const receivedItems = lineItems.reduce(
      (sum: number, item: any) => sum + item.quantity_received,
      0
    );

    const pendingItems = totalItems - receivedItems;
    const completionPercentage = totalItems > 0 ? (receivedItems / totalItems) * 100 : 0;

    return {
      totalItems,
      receivedItems,
      pendingItems,
      completionPercentage
    };
  }
}
```

### Purchase Order Status Management

Purchase orders progress through various statuses that reflect their position in the procurement and receiving workflow. Understanding these statuses enables accurate reporting and automated business processes.

```typescript
enum PurchaseOrderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CLOSED = 'closed',
  CANCELED = 'canceled'
}

interface PurchaseOrderStatusUpdate {
  purchaseOrderId: string;
  status: PurchaseOrderStatus;
  timestamp: Date;
  notes?: string;
}

class PurchaseOrderStatusTracker {
  private statusHistory: Map<string, PurchaseOrderStatusUpdate[]> = new Map();

  recordStatusChange(update: PurchaseOrderStatusUpdate): void {
    if (!this.statusHistory.has(update.purchaseOrderId)) {
      this.statusHistory.set(update.purchaseOrderId, []);
    }
    
    this.statusHistory.get(update.purchaseOrderId)!.push(update);
  }

  getStatusHistory(purchaseOrderId: string): PurchaseOrderStatusUpdate[] {
    return this.statusHistory.get(purchaseOrderId) || [];
  }

  getCurrentStatus(purchaseOrderId: string): PurchaseOrderStatus | null {
    const history = this.getStatusHistory(purchaseOrderId);
    if (history.length === 0) return null;
    
    return history[history.length - 1].status;
  }

  async updatePurchaseOrderStatus(
    purchaseOrderId: string,
    newStatus: PurchaseOrderStatus,
    notes?: string
  ): Promise<void> {
    const mutation = `
      mutation UpdatePurchaseOrderStatus(
        $purchaseOrderId: String!
        $status: String!
        $notes: String
      ) {
        purchase_order_update(
          id: $purchaseOrderId
          data: { status: $status, notes: $notes }
        ) {
          request_id
          purchase_order {
            id
            status
          }
        }
      }
    `;

    // Implementation would call the API and record the status change
    this.recordStatusChange({
      purchaseOrderId,
      status: newStatus,
      timestamp: new Date(),
      notes
    });
  }
}
```

### Advanced Purchase Order Operations

Beyond basic creation and receiving, purchase orders support advanced operations including modifications, cancellations, and bulk operations for efficient procurement management.

```typescript
class AdvancedPurchaseOrderOperations {
  constructor(private apiClient: ShipHeroAPI) {}

  async closePurchaseOrder(
    purchaseOrderId: string,
    reason?: string
  ): Promise<void> {
    const mutation = `
      mutation ClosePurchaseOrder(
        $purchaseOrderId: String!
        $reason: String
      ) {
        purchase_order_close(
          id: $purchaseOrderId
          reason: $reason
        ) {
          request_id
          purchase_order {
            id
            status
          }
        }
      }
    `;

    await this.apiClient.mutate(mutation, { purchaseOrderId, reason });
  }

  async cancelPurchaseOrder(
    purchaseOrderId: string,
    reason: string
  ): Promise<void> {
    const mutation = `
      mutation CancelPurchaseOrder(
        $purchaseOrderId: String!
        $reason: String!
      ) {
        purchase_order_cancel(
          id: $purchaseOrderId
          reason: $reason
        ) {
          request_id
          purchase_order {
            id
            status
          }
        }
      }
    `;

    await this.apiClient.mutate(mutation, { purchaseOrderId, reason });
  }

  async addLineItemToPurchaseOrder(
    purchaseOrderId: string,
    lineItem: PurchaseOrderLineItem
  ): Promise<void> {
    const mutation = `
      mutation AddPurchaseOrderLineItem(
        $purchaseOrderId: String!
        $lineItem: PurchaseOrderLineItemInput!
      ) {
        purchase_order_add_line_item(
          purchase_order_id: $purchaseOrderId
          line_item: $lineItem
        ) {
          request_id
          purchase_order {
            id
            line_items {
              edges {
                node {
                  id
                  sku
                  quantity
                }
              }
            }
          }
        }
      }
    `;

    await this.apiClient.mutate(mutation, { purchaseOrderId, lineItem });
  }
}
```

These advanced operations enable sophisticated procurement workflows while maintaining data integrity and audit trails for compliance and reporting requirements.

---


## Inventory Management

Inventory management in ShipHero encompasses real-time tracking, bulk synchronization, location management, and automated replenishment workflows. The API provides comprehensive tools for maintaining accurate inventory levels across multiple warehouses and sales channels.

### Inventory Query Operations

Retrieving inventory information supports various filtering and aggregation patterns to accommodate different business requirements. The inventory queries provide real-time visibility into stock levels, allocations, and availability across warehouse locations.

```graphql
query GetInventoryByProduct($sku: String!, $warehouseId: String) {
  products(sku: $sku) {
    data {
      edges {
        node {
          id
          sku
          name
          inventory(warehouse_id: $warehouseId) {
            warehouse_id
            warehouse_identifier
            on_hand
            available
            allocated
            backorder_quantity
            reserve
            non_sellable
            sellable
            sell_ahead
            qty_in_totes
            updated_at
            locations {
              location_id
              location_name
              quantity
              pickable
            }
          }
        }
      }
    }
  }
}
```

This query provides comprehensive inventory information including physical quantities, allocations, and location-specific details for dynamic slotting accounts. The `available` field represents sellable inventory after accounting for allocations and reserves.

### TypeScript Interface Definitions

Strong typing for inventory operations ensures data consistency and improves development experience:

```typescript
interface InventoryLocation {
  location_id: string;
  location_name: string;
  quantity: number;
  pickable: boolean;
}

interface ProductInventory {
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

interface Product {
  id: string;
  sku: string;
  name: string;
  inventory: ProductInventory[];
}

interface InventoryAdjustment {
  sku: string;
  warehouse_id: string;
  quantity: number;
  reason: string;
  location_id?: string;
  cycle_counted?: boolean;
}
```

### Inventory Adjustment Operations

Individual inventory adjustments handle single-item corrections, cycle counting results, and real-time inventory updates. These operations provide immediate inventory changes with full audit trails.

```typescript
class InventoryManager {
  constructor(private apiClient: ShipHeroAPI) {}

  async adjustInventory(adjustment: InventoryAdjustment): Promise<void> {
    const mutation = `
      mutation AdjustInventory($adjustmentData: InventoryAdjustmentInput!) {
        inventory_add(data: $adjustmentData) {
          request_id
          complexity
          inventory_item {
            id
            sku
            warehouse_id
            on_hand
            available
            updated_at
          }
        }
      }
    `;

    const adjustmentData = {
      sku: adjustment.sku,
      warehouse_id: adjustment.warehouse_id,
      quantity: adjustment.quantity,
      reason: adjustment.reason,
      location_id: adjustment.location_id,
      cycle_counted: adjustment.cycle_counted || false
    };

    try {
      const response = await this.apiClient.mutate(mutation, { adjustmentData });
      console.log(`Inventory adjusted for ${adjustment.sku}: ${adjustment.quantity}`);
    } catch (error) {
      console.error('Inventory adjustment failed:', error);
      throw new Error(`Failed to adjust inventory: ${error.message}`);
    }
  }

  async removeInventory(
    sku: string,
    warehouseId: string,
    quantity: number,
    reason: string
  ): Promise<void> {
    const mutation = `
      mutation RemoveInventory($removalData: InventoryRemovalInput!) {
        inventory_remove(data: $removalData) {
          request_id
          complexity
          inventory_item {
            id
            sku
            warehouse_id
            on_hand
            available
          }
        }
      }
    `;

    const removalData = {
      sku,
      warehouse_id: warehouseId,
      quantity,
      reason
    };

    await this.apiClient.mutate(mutation, { removalData });
  }

  async getInventoryHistory(
    sku: string,
    warehouseId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<InventoryMovement[]> {
    const query = `
      query GetInventoryHistory(
        $sku: String!
        $warehouseId: String!
        $dateFrom: ISODateTime
        $dateTo: ISODateTime
      ) {
        inventory_movements(
          sku: $sku
          warehouse_id: $warehouseId
          created_from: $dateFrom
          created_to: $dateTo
        ) {
          data {
            edges {
              node {
                id
                sku
                quantity
                reason
                movement_type
                created_at
                user {
                  name
                }
                location {
                  name
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(query, {
      sku,
      warehouseId,
      dateFrom,
      dateTo
    });

    return response.inventory_movements.data.edges.map((edge: any) => edge.node);
  }
}

interface InventoryMovement {
  id: string;
  sku: string;
  quantity: number;
  reason: string;
  movement_type: string;
  created_at: string;
  user?: {
    name: string;
  };
  location?: {
    name: string;
  };
}
```

### Bulk Inventory Synchronization

The inventory sync feature enables bulk inventory updates through CSV file uploads, providing efficient handling of large-scale inventory changes from external systems or periodic reconciliation processes.

```typescript
interface InventorySyncItem {
  sku: string;
  quantity: number;
  action: 'replace' | 'add' | 'remove';
  reason: string;
  location?: string;
}

class InventorySyncManager {
  constructor(private apiClient: ShipHeroAPI) {}

  async createInventorySync(
    warehouseId: string,
    csvUrl: string
  ): Promise<string> {
    const mutation = `
      mutation CreateInventorySync($syncData: InventorySyncInput!) {
        inventory_sync(data: $syncData) {
          request_id
          complexity
          sync_id
        }
      }
    `;

    const syncData = {
      url: csvUrl,
      warehouse_id: warehouseId
    };

    const response = await this.apiClient.mutate(mutation, { syncData });
    return response.inventory_sync.sync_id;
  }

  async getInventorySyncStatus(syncId: string): Promise<InventorySyncStatus> {
    const query = `
      query GetInventorySyncStatus($syncId: String!) {
        inventory_sync_status(id: $syncId) {
          request_id
          complexity
          data {
            id
            url
            user_id
            account_id
            warehouse_id
            customer_account_id
            total_count
            status
            error
            created_at
            updated_at
          }
        }
      }
    `;

    const response = await this.apiClient.query(query, { syncId });
    return response.inventory_sync_status.data;
  }

  async getInventorySyncItemsStatus(syncId: string): Promise<InventorySyncItemStatus[]> {
    const query = `
      query GetInventorySyncItemsStatus($syncId: String!) {
        inventory_sync_items_status(id: $syncId) {
          request_id
          complexity
          data {
            edges {
              node {
                id
                row
                sku
                quantity
                action
                reason
                location
                status
                error
                created_at
                updated_at
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(query, { syncId });
    return response.inventory_sync_items_status.data.edges.map((edge: any) => edge.node);
  }

  async generateInventorySyncCSV(
    items: InventorySyncItem[],
    isDynamicSlotting: boolean = false
  ): Promise<string> {
    let csvContent = isDynamicSlotting 
      ? '#sku,quantity,action,reason,location\n'
      : '#sku,quantity,action,reason\n';

    items.forEach(item => {
      const row = [
        item.sku,
        item.quantity.toString(),
        item.action,
        `"${item.reason}"`,
        ...(isDynamicSlotting ? [item.location || ''] : [])
      ].join(',');
      
      csvContent += row + '\n';
    });

    return csvContent;
  }

  async monitorSyncProgress(
    syncId: string,
    onProgress?: (status: InventorySyncStatus) => void
  ): Promise<InventorySyncStatus> {
    let status = await this.getInventorySyncStatus(syncId);
    
    while (status.status === 'processing') {
      if (onProgress) {
        onProgress(status);
      }
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
      status = await this.getInventorySyncStatus(syncId);
    }

    return status;
  }
}

interface InventorySyncStatus {
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
}

interface InventorySyncItemStatus {
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
```

### Dynamic Slotting and Location Management

For warehouses using dynamic slotting, inventory management includes location-specific operations that optimize picking efficiency and storage utilization. The API provides tools for managing inventory across multiple locations within a warehouse.

```typescript
class LocationManager {
  constructor(private apiClient: ShipHeroAPI) {}

  async getWarehouseLocations(warehouseId: string): Promise<WarehouseLocation[]> {
    const query = `
      query GetWarehouseLocations($warehouseId: String!) {
        warehouse_locations(warehouse_id: $warehouseId) {
          data {
            edges {
              node {
                id
                name
                zone
                aisle
                shelf
                bin
                pickable
                receivable
                dimensions {
                  length
                  width
                  height
                }
                capacity {
                  max_weight
                  max_volume
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(query, { warehouseId });
    return response.warehouse_locations.data.edges.map((edge: any) => edge.node);
  }

  async moveInventoryBetweenLocations(
    sku: string,
    quantity: number,
    fromLocationId: string,
    toLocationId: string,
    reason: string
  ): Promise<void> {
    const mutation = `
      mutation MoveInventoryLocation($moveData: InventoryMoveInput!) {
        inventory_move_location(data: $moveData) {
          request_id
          complexity
          inventory_movement {
            id
            sku
            quantity
            from_location {
              name
            }
            to_location {
              name
            }
          }
        }
      }
    `;

    const moveData = {
      sku,
      quantity,
      from_location_id: fromLocationId,
      to_location_id: toLocationId,
      reason
    };

    await this.apiClient.mutate(mutation, { moveData });
  }

  async optimizeLocationAssignments(
    warehouseId: string,
    criteria: LocationOptimizationCriteria
  ): Promise<LocationOptimizationResult[]> {
    // This would implement business logic for optimizing inventory placement
    // based on picking frequency, product velocity, and storage constraints
    
    const locations = await this.getWarehouseLocations(warehouseId);
    const inventory = await this.getWarehouseInventory(warehouseId);
    
    // Implement optimization algorithm
    return this.calculateOptimalPlacements(locations, inventory, criteria);
  }

  private async getWarehouseInventory(warehouseId: string): Promise<ProductInventory[]> {
    // Implementation would query all inventory for the warehouse
    return [];
  }

  private calculateOptimalPlacements(
    locations: WarehouseLocation[],
    inventory: ProductInventory[],
    criteria: LocationOptimizationCriteria
  ): LocationOptimizationResult[] {
    // Implement optimization logic based on criteria
    return [];
  }
}

interface WarehouseLocation {
  id: string;
  name: string;
  zone: string;
  aisle: string;
  shelf: string;
  bin: string;
  pickable: boolean;
  receivable: boolean;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  capacity: {
    max_weight: number;
    max_volume: number;
  };
}

interface LocationOptimizationCriteria {
  prioritizePickingEfficiency: boolean;
  considerProductVelocity: boolean;
  respectStorageConstraints: boolean;
  minimizeMovements: boolean;
}

interface LocationOptimizationResult {
  sku: string;
  currentLocationId: string;
  recommendedLocationId: string;
  reason: string;
  estimatedBenefit: number;
}
```

### Inventory Snapshot and Reporting

Inventory snapshots provide point-in-time inventory states for reporting, analysis, and compliance purposes. The snapshot system captures comprehensive inventory data across all warehouses and locations.

```typescript
class InventoryReporting {
  constructor(private apiClient: ShipHeroAPI) {}

  async createInventorySnapshot(
    warehouseId?: string,
    includeZeroQuantities: boolean = false
  ): Promise<string> {
    const mutation = `
      mutation CreateInventorySnapshot($snapshotData: InventorySnapshotInput!) {
        inventory_snapshot_create(data: $snapshotData) {
          request_id
          complexity
          snapshot_id
        }
      }
    `;

    const snapshotData = {
      warehouse_id: warehouseId,
      include_zero_quantities: includeZeroQuantities
    };

    const response = await this.apiClient.mutate(mutation, { snapshotData });
    return response.inventory_snapshot_create.snapshot_id;
  }

  async getInventorySnapshot(snapshotId: string): Promise<InventorySnapshot> {
    const query = `
      query GetInventorySnapshot($snapshotId: String!) {
        inventory_snapshot(id: $snapshotId) {
          data {
            id
            created_at
            warehouse_id
            status
            total_items
            file_url
            expires_at
          }
        }
      }
    `;

    const response = await this.apiClient.query(query, { snapshotId });
    return response.inventory_snapshot.data;
  }

  async generateInventoryReport(
    warehouseId: string,
    reportType: InventoryReportType,
    dateRange: { from: string; to: string }
  ): Promise<InventoryReport> {
    // Implementation would generate various types of inventory reports
    // such as movement reports, valuation reports, and variance reports
    
    switch (reportType) {
      case InventoryReportType.MOVEMENT:
        return this.generateMovementReport(warehouseId, dateRange);
      case InventoryReportType.VALUATION:
        return this.generateValuationReport(warehouseId, dateRange);
      case InventoryReportType.VARIANCE:
        return this.generateVarianceReport(warehouseId, dateRange);
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  private async generateMovementReport(
    warehouseId: string,
    dateRange: { from: string; to: string }
  ): Promise<InventoryReport> {
    // Query inventory movements and generate report
    return {
      type: InventoryReportType.MOVEMENT,
      warehouseId,
      dateRange,
      data: [], // Populated with movement data
      summary: {
        totalMovements: 0,
        totalQuantityMoved: 0,
        topMovingSkus: []
      }
    };
  }

  private async generateValuationReport(
    warehouseId: string,
    dateRange: { from: string; to: string }
  ): Promise<InventoryReport> {
    // Calculate inventory valuation based on cost and quantities
    return {
      type: InventoryReportType.VALUATION,
      warehouseId,
      dateRange,
      data: [],
      summary: {
        totalValue: 0,
        totalUnits: 0,
        averageUnitValue: 0
      }
    };
  }

  private async generateVarianceReport(
    warehouseId: string,
    dateRange: { from: string; to: string }
  ): Promise<InventoryReport> {
    // Compare expected vs actual inventory levels
    return {
      type: InventoryReportType.VARIANCE,
      warehouseId,
      dateRange,
      data: [],
      summary: {
        totalVariances: 0,
        positiveVariances: 0,
        negativeVariances: 0
      }
    };
  }
}

interface InventorySnapshot {
  id: string;
  created_at: string;
  warehouse_id?: string;
  status: 'processing' | 'completed' | 'failed';
  total_items: number;
  file_url?: string;
  expires_at: string;
}

enum InventoryReportType {
  MOVEMENT = 'movement',
  VALUATION = 'valuation',
  VARIANCE = 'variance'
}

interface InventoryReport {
  type: InventoryReportType;
  warehouseId: string;
  dateRange: { from: string; to: string };
  data: any[];
  summary: Record<string, any>;
}
```

This comprehensive inventory management system provides the tools necessary for maintaining accurate inventory levels, optimizing warehouse operations, and generating detailed reports for business intelligence and compliance requirements.

---


## Returns Management

Returns management in ShipHero handles the complete reverse logistics workflow from return authorization through inventory restocking. The API provides comprehensive tools for managing return requests, processing returned items, and handling exchanges or refunds.

### Returns Creation Process

Creating returns requires understanding the relationship between original orders, return reasons, and inventory implications. The return creation process validates order eligibility, establishes return workflows, and manages customer communications.

```graphql
mutation CreateReturn($returnData: ReturnCreateInput!) {
  return_create(data: $returnData) {
    request_id
    complexity
    return {
      id
      legacy_id
      order_id
      partner_id
      reason
      status
      label_type
      label_cost
      cost_to_customer
      shipping_carrier
      shipping_method
      display_issue_refund
      tracking_number
      created_at
      address {
        name
        address1
        city
        state
        zip
        country
        phone
      }
      dimensions {
        height
        width
        length
        weight
      }
      line_items {
        edges {
          node {
            id
            sku
            quantity
            return_reason
            condition
            restock
            quantity_received
            exchange_items {
              exchange_product_sku
              quantity
            }
          }
        }
      }
      exchanges {
        exchange_order {
          id
          legacy_id
          order_number
        }
      }
    }
  }
}
```

This mutation creates a comprehensive return record including shipping details, line item specifications, and optional exchange order creation for seamless customer service workflows.

### TypeScript Interface Definitions

Strong typing for returns operations ensures data consistency and improves development experience:

```typescript
interface ReturnAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

interface ReturnDimensions {
  height: string;
  width: string;
  length: string;
  weight: string;
}

interface ReturnLineItem {
  sku: string;
  quantity: number;
  return_reason: string;
  condition: 'Good' | 'Damaged' | 'Defective' | 'Wrong Item';
  exchange_items?: Array<{
    exchange_product_sku: string;
    quantity: number;
  }>;
}

interface ReturnCreateData {
  order_id: string;
  warehouse_id: string;
  return_reason: string;
  label_type: 'FREE' | 'PAID' | 'CUSTOMER_PAYS';
  label_cost: string;
  display_issue_refund: boolean;
  address: ReturnAddress;
  dimensions: ReturnDimensions;
  shipping_carrier: string;
  shipping_method: string;
  line_items: ReturnLineItem[];
  tracking_number?: string;
  create_label: boolean;
  partner_id?: string;
}

interface Return {
  id: string;
  legacy_id: number;
  order_id: string;
  partner_id?: string;
  reason: string;
  status: string;
  label_type: string;
  label_cost: string;
  cost_to_customer: string;
  shipping_carrier: string;
  shipping_method: string;
  display_issue_refund: boolean;
  tracking_number?: string;
  created_at: string;
  address: ReturnAddress;
  dimensions: ReturnDimensions;
  line_items: {
    edges: Array<{
      node: ReturnLineItem & {
        id: string;
        restock: number;
        quantity_received: number;
      };
    }>;
  };
  exchanges?: Array<{
    exchange_order: {
      id: string;
      legacy_id: number;
      order_number: string;
    };
  }>;
}
```

### Complete Returns Management Implementation

A production-ready returns management system handles order validation, return authorization, and inventory processing:

```typescript
class ReturnsManager {
  constructor(private apiClient: ShipHeroAPI) {}

  async createReturn(returnData: ReturnCreateData): Promise<Return> {
    // Validate return eligibility
    await this.validateReturnEligibility(returnData.order_id, returnData.line_items);

    // Validate return data
    this.validateReturnData(returnData);

    const mutation = `
      mutation CreateReturn($returnData: ReturnCreateInput!) {
        return_create(data: $returnData) {
          request_id
          complexity
          return {
            id
            legacy_id
            order_id
            partner_id
            reason
            status
            label_type
            label_cost
            cost_to_customer
            shipping_carrier
            shipping_method
            display_issue_refund
            tracking_number
            created_at
            address {
              name
              address1
              city
              state
              zip
              country
              phone
            }
            dimensions {
              height
              width
              length
              weight
            }
            line_items {
              edges {
                node {
                  id
                  sku
                  quantity
                  return_reason
                  condition
                  restock
                  quantity_received
                  exchange_items {
                    exchange_product_sku
                    quantity
                  }
                }
              }
            }
            exchanges {
              exchange_order {
                id
                legacy_id
                order_number
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.apiClient.mutate<{
        return_create: {
          request_id: string;
          complexity: number;
          return: Return;
        };
      }>(mutation, { returnData });

      console.log(`Return created successfully: ${response.return_create.return.id}`);
      
      return response.return_create.return;
    } catch (error) {
      console.error('Return creation failed:', error);
      throw new Error(`Failed to create return: ${error.message}`);
    }
  }

  private async validateReturnEligibility(
    orderId: string,
    returnItems: ReturnLineItem[]
  ): Promise<void> {
    // Get original order details
    const orderQuery = `
      query GetOrderForReturn($orderId: String!) {
        order(id: $orderId) {
          data {
            id
            fulfillment_status
            order_date
            line_items(first: 50) {
              edges {
                node {
                  id
                  sku
                  quantity
                  quantity_shipped
                  eligible_for_return
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(orderQuery, { orderId });
    const order = response.order.data;

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Check if order is eligible for returns
    if (order.fulfillment_status !== 'shipped' && order.fulfillment_status !== 'delivered') {
      throw new Error('Order must be shipped or delivered to create returns');
    }

    // Check return window (example: 30 days)
    const orderDate = new Date(order.order_date);
    const returnWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    if (Date.now() - orderDate.getTime() > returnWindow) {
      throw new Error('Return window has expired');
    }

    // Validate each return item
    const orderLineItems = order.line_items.edges.map((edge: any) => edge.node);
    
    returnItems.forEach(returnItem => {
      const orderLineItem = orderLineItems.find((item: any) => item.sku === returnItem.sku);
      
      if (!orderLineItem) {
        throw new Error(`SKU not found in original order: ${returnItem.sku}`);
      }

      if (!orderLineItem.eligible_for_return) {
        throw new Error(`SKU not eligible for return: ${returnItem.sku}`);
      }

      if (returnItem.quantity > orderLineItem.quantity_shipped) {
        throw new Error(
          `Return quantity exceeds shipped quantity for ${returnItem.sku}: ` +
          `requested ${returnItem.quantity}, shipped ${orderLineItem.quantity_shipped}`
        );
      }
    });
  }

  private validateReturnData(returnData: ReturnCreateData): void {
    if (!returnData.order_id) {
      throw new Error('Order ID is required');
    }

    if (!returnData.warehouse_id) {
      throw new Error('Warehouse ID is required');
    }

    if (!returnData.return_reason) {
      throw new Error('Return reason is required');
    }

    if (!returnData.line_items || returnData.line_items.length === 0) {
      throw new Error('At least one line item is required');
    }

    // Validate address
    this.validateReturnAddress(returnData.address);

    // Validate dimensions
    this.validateReturnDimensions(returnData.dimensions);

    // Validate line items
    returnData.line_items.forEach((item, index) => {
      if (!item.sku) {
        throw new Error(`Line item ${index + 1}: SKU is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Line item ${index + 1}: Valid quantity is required`);
      }
      if (!item.return_reason) {
        throw new Error(`Line item ${index + 1}: Return reason is required`);
      }
      if (!item.condition) {
        throw new Error(`Line item ${index + 1}: Condition is required`);
      }
    });
  }

  private validateReturnAddress(address: ReturnAddress): void {
    const requiredFields = ['name', 'address1', 'city', 'state', 'zip', 'country'];
    
    requiredFields.forEach(field => {
      if (!address[field as keyof ReturnAddress]) {
        throw new Error(`Return address: ${field} is required`);
      }
    });
  }

  private validateReturnDimensions(dimensions: ReturnDimensions): void {
    const requiredFields = ['height', 'width', 'length', 'weight'];
    
    requiredFields.forEach(field => {
      if (!dimensions[field as keyof ReturnDimensions]) {
        throw new Error(`Return dimensions: ${field} is required`);
      }
    });
  }
}
```

### Returns Query Operations

Retrieving return information supports various filtering patterns for customer service, reporting, and operational management:

```typescript
class ReturnsQueryManager {
  constructor(private apiClient: ShipHeroAPI) {}

  async getReturn(returnId: string): Promise<Return> {
    const query = `
      query GetReturn($returnId: String!) {
        return(id: $returnId) {
          request_id
          complexity
          data {
            id
            legacy_id
            order_id
            partner_id
            reason
            status
            label_type
            label_cost
            cost_to_customer
            shipping_carrier
            shipping_method
            display_issue_refund
            tracking_number
            created_at
            updated_at
            address {
              name
              address1
              city
              state
              zip
              country
              phone
            }
            dimensions {
              height
              width
              length
              weight
            }
            line_items {
              edges {
                node {
                  id
                  sku
                  quantity
                  return_reason
                  condition
                  restock
                  quantity_received
                  exchange_items {
                    exchange_product_sku
                    quantity
                  }
                }
              }
            }
            exchanges {
              exchange_order {
                id
                legacy_id
                order_number
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(query, { returnId });
    return response.return.data;
  }

  async getReturns(filters: {
    first?: number;
    after?: string;
    status?: string;
    orderId?: string;
    createdFrom?: string;
    createdTo?: string;
  }): Promise<{
    returns: Return[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
    };
  }> {
    const query = `
      query GetReturns(
        $first: Int
        $after: String
        $status: String
        $orderId: String
        $createdFrom: ISODateTime
        $createdTo: ISODateTime
      ) {
        returns(
          first: $first
          after: $after
          status: $status
          order_id: $orderId
          created_from: $createdFrom
          created_to: $createdTo
        ) {
          request_id
          complexity
          data {
            edges {
              node {
                id
                legacy_id
                order_id
                reason
                status
                created_at
                line_items {
                  edges {
                    node {
                      sku
                      quantity
                      quantity_received
                      condition
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

    const response = await this.apiClient.query(query, filters);
    
    return {
      returns: response.returns.data.edges.map((edge: any) => edge.node),
      pageInfo: response.returns.data.pageInfo
    };
  }

  async getReturnsByOrder(orderId: string): Promise<Return[]> {
    const { returns } = await this.getReturns({ orderId });
    return returns;
  }

  async getReturnExchange(returnId: string): Promise<ReturnExchange | null> {
    const query = `
      query GetReturnExchange($returnId: String!) {
        return_exchange(return_id: $returnId) {
          data {
            id
            return_id
            exchange_order {
              id
              legacy_id
              order_number
              fulfillment_status
              line_items {
                edges {
                  node {
                    sku
                    quantity
                    price
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(query, { returnId });
    return response.return_exchange.data;
  }
}

interface ReturnExchange {
  id: string;
  return_id: string;
  exchange_order: {
    id: string;
    legacy_id: number;
    order_number: string;
    fulfillment_status: string;
    line_items: {
      edges: Array<{
        node: {
          sku: string;
          quantity: number;
          price: string;
        };
      }>;
    };
  };
}
```

### Returns Processing and Receiving

The returns receiving process handles physical return processing, inventory updates, and quality control workflows:

```typescript
interface ReturnReceivingItem {
  return_line_item_id: string;
  quantity_received: number;
  condition: 'Good' | 'Damaged' | 'Defective';
  restock_quantity: number;
  notes?: string;
}

class ReturnsProcessing {
  constructor(private apiClient: ShipHeroAPI) {}

  async processReturnReceiving(
    returnId: string,
    receivingItems: ReturnReceivingItem[]
  ): Promise<void> {
    const mutation = `
      mutation ProcessReturnReceiving(
        $returnId: String!
        $receivingData: ReturnReceivingInput!
      ) {
        return_receive(
          return_id: $returnId
          data: $receivingData
        ) {
          request_id
          complexity
          return {
            id
            status
            line_items {
              edges {
                node {
                  id
                  sku
                  quantity
                  quantity_received
                  restock
                }
              }
            }
          }
        }
      }
    `;

    const receivingData = {
      line_items: receivingItems.map(item => ({
        return_line_item_id: item.return_line_item_id,
        quantity_received: item.quantity_received,
        condition: item.condition,
        restock_quantity: item.restock_quantity,
        notes: item.notes
      }))
    };

    try {
      await this.apiClient.mutate(mutation, { returnId, receivingData });
      console.log(`Return ${returnId} receiving processed successfully`);
    } catch (error) {
      console.error('Return receiving failed:', error);
      throw new Error(`Failed to process return receiving: ${error.message}`);
    }
  }

  async updateReturnStatus(
    returnId: string,
    status: string,
    notes?: string
  ): Promise<void> {
    const mutation = `
      mutation UpdateReturnStatus(
        $returnId: String!
        $status: String!
        $notes: String
      ) {
        return_update(
          id: $returnId
          data: { status: $status, notes: $notes }
        ) {
          request_id
          return {
            id
            status
            updated_at
          }
        }
      }
    `;

    await this.apiClient.mutate(mutation, { returnId, status, notes });
  }

  async completeReturn(returnId: string): Promise<void> {
    await this.updateReturnStatus(returnId, 'completed', 'Return processing completed');
  }

  async cancelReturn(returnId: string, reason: string): Promise<void> {
    await this.updateReturnStatus(returnId, 'canceled', reason);
  }

  async generateReturnLabel(
    returnId: string,
    labelOptions: ReturnLabelOptions
  ): Promise<ReturnLabel> {
    const mutation = `
      mutation GenerateReturnLabel(
        $returnId: String!
        $labelData: ReturnLabelInput!
      ) {
        return_generate_label(
          return_id: $returnId
          data: $labelData
        ) {
          request_id
          label {
            id
            tracking_number
            label_url
            cost
            carrier
            service
          }
        }
      }
    `;

    const response = await this.apiClient.mutate(mutation, {
      returnId,
      labelData: labelOptions
    });

    return response.return_generate_label.label;
  }
}

interface ReturnLabelOptions {
  carrier: string;
  service: string;
  package_type: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

interface ReturnLabel {
  id: string;
  tracking_number: string;
  label_url: string;
  cost: string;
  carrier: string;
  service: string;
}
```

### Returns Analytics and Reporting

Comprehensive returns analytics enable business intelligence and operational optimization:

```typescript
class ReturnsAnalytics {
  constructor(private apiClient: ShipHeroAPI) {}

  async generateReturnsReport(
    dateRange: { from: string; to: string },
    warehouseId?: string
  ): Promise<ReturnsReport> {
    const { returns } = await this.getReturnsForPeriod(dateRange, warehouseId);
    
    return {
      period: dateRange,
      warehouseId,
      totalReturns: returns.length,
      totalValue: this.calculateTotalReturnValue(returns),
      returnReasons: this.analyzeReturnReasons(returns),
      returnRate: await this.calculateReturnRate(dateRange, warehouseId),
      processingMetrics: this.calculateProcessingMetrics(returns),
      topReturnedProducts: this.identifyTopReturnedProducts(returns)
    };
  }

  private async getReturnsForPeriod(
    dateRange: { from: string; to: string },
    warehouseId?: string
  ): Promise<{ returns: Return[] }> {
    // Implementation would query returns for the specified period
    return { returns: [] };
  }

  private calculateTotalReturnValue(returns: Return[]): number {
    // Calculate total monetary value of returns
    return returns.reduce((total, returnItem) => {
      // Implementation would sum up return values
      return total;
    }, 0);
  }

  private analyzeReturnReasons(returns: Return[]): Record<string, number> {
    const reasonCounts: Record<string, number> = {};
    
    returns.forEach(returnItem => {
      const reason = returnItem.reason;
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    return reasonCounts;
  }

  private async calculateReturnRate(
    dateRange: { from: string; to: string },
    warehouseId?: string
  ): Promise<number> {
    // Calculate return rate as percentage of total orders
    // Implementation would query orders and returns for the period
    return 0;
  }

  private calculateProcessingMetrics(returns: Return[]): ProcessingMetrics {
    // Calculate average processing time, completion rate, etc.
    return {
      averageProcessingTime: 0,
      completionRate: 0,
      pendingReturns: 0
    };
  }

  private identifyTopReturnedProducts(returns: Return[]): ProductReturnSummary[] {
    // Identify products with highest return volumes
    return [];
  }
}

interface ReturnsReport {
  period: { from: string; to: string };
  warehouseId?: string;
  totalReturns: number;
  totalValue: number;
  returnReasons: Record<string, number>;
  returnRate: number;
  processingMetrics: ProcessingMetrics;
  topReturnedProducts: ProductReturnSummary[];
}

interface ProcessingMetrics {
  averageProcessingTime: number;
  completionRate: number;
  pendingReturns: number;
}

interface ProductReturnSummary {
  sku: string;
  productName: string;
  returnCount: number;
  returnQuantity: number;
  primaryReason: string;
}
```

This comprehensive returns management system provides the tools necessary for handling the complete reverse logistics workflow while maintaining customer satisfaction and operational efficiency.

---


## Webhooks & Real-time Integration

Webhooks provide real-time notifications for ShipHero events, enabling responsive applications and automated business processes. The webhook system delivers immediate notifications for inventory changes, order updates, shipment events, and other critical business activities.

### Webhook Overview and Architecture

ShipHero's webhook system delivers data to external applications as events occur, providing immediate notification of system changes. This real-time approach eliminates the need for constant polling and enables building responsive, event-driven applications.

When ShipHero sends a webhook, it expects a specific response format within a defined timeout period. The system implements retry logic for failed deliveries, but applications should implement reconciliation processes to handle potential webhook delivery failures.

```json
{
  "code": "200",
  "Status": "Success"
}
```

The webhook system includes the following characteristics:

- **Timeout**: 10 seconds with 5 retries per trigger (20 seconds for Generate Label webhooks)
- **Delivery Guarantee**: Best effort with retry logic, but not guaranteed
- **Response Format**: JSON with specific code and status fields
- **Reconciliation**: Applications should implement periodic data synchronization

### Available Webhook Types

ShipHero provides comprehensive webhook coverage for all major business events:

| Webhook Type | Trigger Event | Use Cases |
|--------------|---------------|-----------|
| Inventory Update | Inventory quantity changes | Real-time stock updates, reorder alerts |
| Inventory Change | Inventory modifications | Audit trails, variance tracking |
| Shipment Update | Shipment status changes | Customer notifications, tracking updates |
| Automation Rules | Rule execution | Business process automation |
| Order Canceled | Order cancellation | Inventory release, customer notifications |
| Capture Payment | Payment processing | Financial reconciliation |
| PO Update | Purchase order changes | Vendor communications, receiving alerts |
| Return Update | Return status changes | Customer service, inventory planning |
| Tote Complete | Tote completion | Picking workflow optimization |
| Tote Cleared | Tote clearing | Workflow management |
| Order Packed Out | Order packing completion | Shipping preparation |
| Package Added | Package creation | Shipping notifications |
| Print Barcode | Barcode generation | Label management |
| Order Allocated | Inventory allocation | Fulfillment workflow |
| Order Deallocated | Allocation removal | Inventory management |

### Webhook Registration and Management

Managing webhooks requires understanding registration, configuration, and lifecycle management patterns:

```typescript
class WebhookManager {
  constructor(private apiClient: ShipHeroAPI) {}

  async registerWebhook(
    webhookName: string,
    url: string,
    options?: WebhookOptions
  ): Promise<Webhook> {
    const mutation = `
      mutation RegisterWebhook($webhookData: WebhookCreateInput!) {
        webhook_create(data: $webhookData) {
          request_id
          complexity
          webhook {
            id
            name
            url
            active
            created_at
            updated_at
          }
        }
      }
    `;

    const webhookData = {
      name: webhookName,
      url: url,
      active: options?.active ?? true,
      secret: options?.secret,
      headers: options?.headers
    };

    try {
      const response = await this.apiClient.mutate<{
        webhook_create: {
          request_id: string;
          complexity: number;
          webhook: Webhook;
        };
      }>(mutation, { webhookData });

      console.log(`Webhook registered: ${webhookName} -> ${url}`);
      return response.webhook_create.webhook;
    } catch (error) {
      console.error('Webhook registration failed:', error);
      throw new Error(`Failed to register webhook: ${error.message}`);
    }
  }

  async listWebhooks(): Promise<Webhook[]> {
    const query = `
      query ListWebhooks {
        webhooks {
          request_id
          complexity
          data {
            edges {
              node {
                id
                name
                url
                active
                created_at
                updated_at
                last_triggered_at
                success_count
                failure_count
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(query);
    return response.webhooks.data.edges.map((edge: any) => edge.node);
  }

  async unregisterWebhook(webhookId: string): Promise<void> {
    const mutation = `
      mutation UnregisterWebhook($webhookId: String!) {
        webhook_delete(id: $webhookId) {
          request_id
          success
        }
      }
    `;

    await this.apiClient.mutate(mutation, { webhookId });
    console.log(`Webhook unregistered: ${webhookId}`);
  }

  async updateWebhook(
    webhookId: string,
    updates: Partial<WebhookUpdateData>
  ): Promise<Webhook> {
    const mutation = `
      mutation UpdateWebhook(
        $webhookId: String!
        $updateData: WebhookUpdateInput!
      ) {
        webhook_update(
          id: $webhookId
          data: $updateData
        ) {
          request_id
          webhook {
            id
            name
            url
            active
            updated_at
          }
        }
      }
    `;

    const response = await this.apiClient.mutate(mutation, {
      webhookId,
      updateData: updates
    });

    return response.webhook_update.webhook;
  }

  async testWebhook(webhookId: string): Promise<WebhookTestResult> {
    const mutation = `
      mutation TestWebhook($webhookId: String!) {
        webhook_test(id: $webhookId) {
          request_id
          success
          response_code
          response_time
          error_message
        }
      }
    `;

    const response = await this.apiClient.mutate(mutation, { webhookId });
    return response.webhook_test;
  }
}

interface WebhookOptions {
  active?: boolean;
  secret?: string;
  headers?: Record<string, string>;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  last_triggered_at?: string;
  success_count?: number;
  failure_count?: number;
}

interface WebhookUpdateData {
  name?: string;
  url?: string;
  active?: boolean;
  secret?: string;
  headers?: Record<string, string>;
}

interface WebhookTestResult {
  success: boolean;
  response_code: number;
  response_time: number;
  error_message?: string;
}
```

### Webhook Event Processing

Processing webhook events requires understanding payload structures, validation, and error handling patterns:

```typescript
interface WebhookEvent<T = any> {
  webhook_type: string;
  account_id: number;
  account_uuid: string;
  timestamp: string;
  data: T;
}

interface InventoryUpdateEvent {
  inventory: Array<{
    sku: string;
    inventory: string;
    backorder_quantity: string;
    on_hand: string;
    virtual: boolean;
    sell_ahead: number;
    qty_in_totes: number;
    reserve: number;
    updated_warehouse: {
      warehouse_id: number;
      warehouse_uuid: string;
      identifier: string;
      inventory: string;
      backorder_quantity: string;
      on_hand: string;
      sell_ahead: number;
      qty_in_totes: number;
      reserve: number;
      non_sellable: number;
    };
  }>;
}

interface ShipmentUpdateEvent {
  shipment_id: number;
  order_id: number;
  order_number: string;
  tracking_number: string;
  carrier: string;
  method: string;
  status: string;
  shipped_date: string;
  delivered_date?: string;
  line_items: Array<{
    sku: string;
    quantity: number;
    product_name: string;
  }>;
}

interface OrderCanceledEvent {
  order_id: number;
  order_number: string;
  partner_order_id: string;
  canceled_at: string;
  reason: string;
  line_items: Array<{
    sku: string;
    quantity: number;
    quantity_canceled: number;
  }>;
}

class WebhookEventProcessor {
  private eventHandlers: Map<string, (event: WebhookEvent) => Promise<void>> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers(): void {
    this.eventHandlers.set('Inventory Update', this.handleInventoryUpdate.bind(this));
    this.eventHandlers.set('Shipment Update', this.handleShipmentUpdate.bind(this));
    this.eventHandlers.set('Order Canceled', this.handleOrderCanceled.bind(this));
    this.eventHandlers.set('Return Update', this.handleReturnUpdate.bind(this));
    this.eventHandlers.set('PO Update', this.handlePOUpdate.bind(this));
  }

  async processWebhookEvent(
    webhookType: string,
    payload: any,
    headers: Record<string, string>
  ): Promise<{ code: string; Status: string }> {
    try {
      // Validate webhook signature if secret is configured
      await this.validateWebhookSignature(payload, headers);

      // Create event object
      const event: WebhookEvent = {
        webhook_type: webhookType,
        account_id: payload.account_id,
        account_uuid: payload.account_uuid,
        timestamp: new Date().toISOString(),
        data: payload
      };

      // Find and execute handler
      const handler = this.eventHandlers.get(webhookType);
      if (handler) {
        await handler(event);
      } else {
        console.warn(`No handler registered for webhook type: ${webhookType}`);
      }

      // Log successful processing
      console.log(`Webhook processed successfully: ${webhookType}`);

      return { code: "200", Status: "Success" };
    } catch (error) {
      console.error(`Webhook processing failed: ${error.message}`);
      
      // Return error response
      return { code: "500", Status: "Error" };
    }
  }

  private async validateWebhookSignature(
    payload: any,
    headers: Record<string, string>
  ): Promise<void> {
    // Implementation would validate webhook signature using shared secret
    // This is crucial for security in production environments
    const signature = headers['x-shiphero-signature'];
    if (signature) {
      // Validate signature against payload and secret
      // Implementation depends on ShipHero's signature algorithm
    }
  }

  private async handleInventoryUpdate(event: WebhookEvent<InventoryUpdateEvent>): Promise<void> {
    console.log(`Processing inventory update for ${event.data.inventory.length} items`);
    
    for (const item of event.data.inventory) {
      // Update local inventory cache
      await this.updateLocalInventory(item);
      
      // Check for low stock alerts
      await this.checkLowStockAlerts(item);
      
      // Update connected systems
      await this.syncInventoryToExternalSystems(item);
    }
  }

  private async handleShipmentUpdate(event: WebhookEvent<ShipmentUpdateEvent>): Promise<void> {
    console.log(`Processing shipment update: ${event.data.tracking_number}`);
    
    // Update order status in local database
    await this.updateOrderShipmentStatus(event.data);
    
    // Send customer notification
    await this.sendShipmentNotification(event.data);
    
    // Update analytics
    await this.recordShipmentMetrics(event.data);
  }

  private async handleOrderCanceled(event: WebhookEvent<OrderCanceledEvent>): Promise<void> {
    console.log(`Processing order cancellation: ${event.data.order_number}`);
    
    // Update order status
    await this.updateOrderStatus(event.data.order_id, 'canceled');
    
    // Release allocated inventory
    await this.releaseInventoryAllocation(event.data);
    
    // Process refunds if applicable
    await this.processOrderRefund(event.data);
    
    // Send customer notification
    await this.sendCancellationNotification(event.data);
  }

  private async handleReturnUpdate(event: WebhookEvent): Promise<void> {
    // Implementation for return update processing
    console.log('Processing return update');
  }

  private async handlePOUpdate(event: WebhookEvent): Promise<void> {
    // Implementation for purchase order update processing
    console.log('Processing PO update');
  }

  // Helper methods for event processing
  private async updateLocalInventory(item: any): Promise<void> {
    // Update local inventory cache/database
  }

  private async checkLowStockAlerts(item: any): Promise<void> {
    // Check if inventory falls below reorder point
  }

  private async syncInventoryToExternalSystems(item: any): Promise<void> {
    // Sync inventory to e-commerce platforms, ERPs, etc.
  }

  private async updateOrderShipmentStatus(shipment: ShipmentUpdateEvent): Promise<void> {
    // Update order status in local system
  }

  private async sendShipmentNotification(shipment: ShipmentUpdateEvent): Promise<void> {
    // Send email/SMS notification to customer
  }

  private async recordShipmentMetrics(shipment: ShipmentUpdateEvent): Promise<void> {
    // Record metrics for analytics
  }

  private async updateOrderStatus(orderId: number, status: string): Promise<void> {
    // Update order status in local database
  }

  private async releaseInventoryAllocation(order: OrderCanceledEvent): Promise<void> {
    // Release inventory allocations
  }

  private async processOrderRefund(order: OrderCanceledEvent): Promise<void> {
    // Process refund if payment was captured
  }

  private async sendCancellationNotification(order: OrderCanceledEvent): Promise<void> {
    // Send cancellation notification to customer
  }
}
```

### Next.js Webhook Endpoint Implementation

For modern web applications using Next.js, implementing webhook endpoints requires proper request handling and security measures:

```typescript
// pages/api/webhooks/shiphero.ts or app/api/webhooks/shiphero/route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { WebhookEventProcessor } from '../../../lib/webhook-processor';

const webhookProcessor = new WebhookEventProcessor();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract webhook type from headers or payload
    const webhookType = req.headers['x-webhook-type'] as string || 
                       req.body.webhook_type;

    if (!webhookType) {
      return res.status(400).json({ error: 'Webhook type not specified' });
    }

    // Process the webhook event
    const result = await webhookProcessor.processWebhookEvent(
      webhookType,
      req.body,
      req.headers as Record<string, string>
    );

    // Return the required response format
    res.status(200).json(result);
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ code: "500", Status: "Error" });
  }
}

// For App Router (Next.js 13+)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    
    const webhookType = headers['x-webhook-type'] || body.webhook_type;
    
    if (!webhookType) {
      return Response.json({ error: 'Webhook type not specified' }, { status: 400 });
    }

    const result = await webhookProcessor.processWebhookEvent(
      webhookType,
      body,
      headers
    );

    return Response.json(result);
  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ code: "500", Status: "Error" }, { status: 500 });
  }
}
```

### Webhook Reliability and Reconciliation

Since webhook delivery is not guaranteed, implementing reconciliation processes ensures data consistency:

```typescript
class WebhookReconciliation {
  constructor(
    private apiClient: ShipHeroAPI,
    private database: Database
  ) {}

  async reconcileInventory(warehouseId: string): Promise<void> {
    const lastSync = await this.getLastSyncTimestamp('inventory', warehouseId);
    
    // Query ShipHero for inventory changes since last sync
    const query = `
      query GetInventoryChanges(
        $warehouseId: String!
        $updatedFrom: ISODateTime!
      ) {
        products(
          warehouse_id: $warehouseId
          updated_from: $updatedFrom
        ) {
          data {
            edges {
              node {
                sku
                inventory {
                  warehouse_id
                  on_hand
                  available
                  allocated
                  updated_at
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(query, {
      warehouseId,
      updatedFrom: lastSync
    });

    // Process inventory changes
    for (const product of response.products.data.edges) {
      await this.reconcileProductInventory(product.node);
    }

    // Update last sync timestamp
    await this.updateLastSyncTimestamp('inventory', warehouseId);
  }

  async reconcileOrders(dateFrom: string): Promise<void> {
    const query = `
      query GetOrderUpdates($dateFrom: ISODateTime!) {
        orders(updated_from: $dateFrom) {
          data {
            edges {
              node {
                id
                order_number
                fulfillment_status
                updated_at
                line_items {
                  edges {
                    node {
                      sku
                      quantity
                      fulfillment_status
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(query, { dateFrom });

    for (const order of response.orders.data.edges) {
      await this.reconcileOrderStatus(order.node);
    }
  }

  private async reconcileProductInventory(product: any): Promise<void> {
    // Compare ShipHero data with local cache and update if necessary
    const localInventory = await this.database.getInventory(
      product.sku,
      product.inventory.warehouse_id
    );

    if (!localInventory || 
        localInventory.updated_at < product.inventory.updated_at) {
      await this.database.updateInventory(product.sku, product.inventory);
    }
  }

  private async reconcileOrderStatus(order: any): Promise<void> {
    // Compare order status and update local records
    const localOrder = await this.database.getOrder(order.id);

    if (!localOrder || localOrder.updated_at < order.updated_at) {
      await this.database.updateOrder(order);
    }
  }

  private async getLastSyncTimestamp(
    syncType: string,
    resourceId: string
  ): Promise<string> {
    // Get last successful sync timestamp from database
    return '2023-01-01T00:00:00Z'; // Placeholder
  }

  private async updateLastSyncTimestamp(
    syncType: string,
    resourceId: string
  ): Promise<void> {
    // Update last sync timestamp in database
  }
}

interface Database {
  getInventory(sku: string, warehouseId: string): Promise<any>;
  updateInventory(sku: string, inventory: any): Promise<void>;
  getOrder(orderId: string): Promise<any>;
  updateOrder(order: any): Promise<void>;
}
```

### Production Webhook Considerations

For production deployments, webhook implementations require additional considerations for security, monitoring, and scalability:

```typescript
class ProductionWebhookManager {
  private rateLimiter: Map<string, number[]> = new Map();
  private readonly maxRequestsPerMinute = 100;

  async handleWebhookWithRateLimit(
    clientId: string,
    processor: () => Promise<any>
  ): Promise<any> {
    // Implement rate limiting
    if (!this.checkRateLimit(clientId)) {
      throw new Error('Rate limit exceeded');
    }

    // Process webhook with monitoring
    const startTime = Date.now();
    
    try {
      const result = await processor();
      
      // Record success metrics
      this.recordMetrics('webhook_success', Date.now() - startTime);
      
      return result;
    } catch (error) {
      // Record failure metrics
      this.recordMetrics('webhook_failure', Date.now() - startTime);
      throw error;
    }
  }

  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    if (!this.rateLimiter.has(clientId)) {
      this.rateLimiter.set(clientId, []);
    }

    const requests = this.rateLimiter.get(clientId)!;
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequestsPerMinute) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.rateLimiter.set(clientId, recentRequests);
    
    return true;
  }

  private recordMetrics(event: string, duration: number): void {
    // Record metrics to monitoring system (e.g., DataDog, New Relic)
    console.log(`Metric: ${event}, Duration: ${duration}ms`);
  }
}
```

This comprehensive webhook system provides the foundation for building responsive, event-driven applications that maintain data consistency and provide excellent user experiences through real-time updates.

---


## Advanced Features

ShipHero's API includes advanced features for complex logistics operations, multi-tenant scenarios, and enterprise-scale integrations. These features enable sophisticated business workflows while maintaining performance and reliability.

### 3PL Multi-Tenant Operations

For Third-Party Logistics (3PL) providers, ShipHero supports multi-tenant operations with customer account isolation and management:

```typescript
class ThreePLManager {
  constructor(private apiClient: ShipHeroAPI) {}

  async getCustomerAccounts(): Promise<CustomerAccount[]> {
    const query = `
      query GetCustomerAccounts {
        customer_accounts {
          data {
            edges {
              node {
                id
                name
                active
                created_at
                settings {
                  auto_allocate
                  auto_ship
                  billing_settings {
                    billing_type
                    rates
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(query);
    return response.customer_accounts.data.edges.map((edge: any) => edge.node);
  }

  async createOrderForCustomer(
    customerAccountId: string,
    orderData: OrderCreateData
  ): Promise<Order> {
    // Add customer account ID to order data
    const threePLOrderData = {
      ...orderData,
      customer_account_id: customerAccountId
    };

    const mutation = `
      mutation CreateCustomerOrder($orderData: OrderCreateInput!) {
        order_create(data: $orderData) {
          request_id
          complexity
          order {
            id
            order_number
            customer_account_id
            fulfillment_status
          }
        }
      }
    `;

    const response = await this.apiClient.mutate(mutation, { orderData: threePLOrderData });
    return response.order_create.order;
  }

  async getBillingReport(
    customerAccountId: string,
    dateRange: { from: string; to: string }
  ): Promise<BillingReport> {
    // Generate billing report for customer account
    const query = `
      query GetBillingData(
        $customerAccountId: String!
        $dateFrom: ISODateTime!
        $dateTo: ISODateTime!
      ) {
        billing_activities(
          customer_account_id: $customerAccountId
          date_from: $dateFrom
          date_to: $dateTo
        ) {
          data {
            edges {
              node {
                id
                activity_type
                quantity
                rate
                total_cost
                created_at
                order_id
                sku
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(query, {
      customerAccountId,
      dateFrom: dateRange.from,
      dateTo: dateRange.to
    });

    return this.processBillingData(response.billing_activities.data.edges);
  }

  private processBillingData(billingActivities: any[]): BillingReport {
    // Process billing activities into report format
    return {
      totalCost: 0,
      activities: billingActivities.map(edge => edge.node),
      breakdown: {
        storage: 0,
        fulfillment: 0,
        receiving: 0,
        other: 0
      }
    };
  }
}

interface CustomerAccount {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  settings: {
    auto_allocate: boolean;
    auto_ship: boolean;
    billing_settings: {
      billing_type: string;
      rates: Record<string, number>;
    };
  };
}

interface BillingReport {
  totalCost: number;
  activities: BillingActivity[];
  breakdown: {
    storage: number;
    fulfillment: number;
    receiving: number;
    other: number;
  };
}

interface BillingActivity {
  id: string;
  activity_type: string;
  quantity: number;
  rate: number;
  total_cost: number;
  created_at: string;
  order_id?: string;
  sku?: string;
}
```

### Automation Rules and Business Logic

ShipHero supports automation rules that trigger based on specific conditions, enabling sophisticated business logic implementation:

```typescript
class AutomationManager {
  constructor(private apiClient: ShipHeroAPI) {}

  async createAutomationRule(ruleData: AutomationRuleData): Promise<AutomationRule> {
    const mutation = `
      mutation CreateAutomationRule($ruleData: AutomationRuleInput!) {
        automation_rule_create(data: $ruleData) {
          request_id
          complexity
          rule {
            id
            name
            description
            active
            trigger_type
            conditions
            actions
            created_at
          }
        }
      }
    `;

    const response = await this.apiClient.mutate(mutation, { ruleData });
    return response.automation_rule_create.rule;
  }

  async getAutomationRules(): Promise<AutomationRule[]> {
    const query = `
      query GetAutomationRules {
        automation_rules {
          data {
            edges {
              node {
                id
                name
                description
                active
                trigger_type
                conditions
                actions
                execution_count
                last_executed_at
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.query(query);
    return response.automation_rules.data.edges.map((edge: any) => edge.node);
  }

  async executeAutomationRule(ruleId: string, context: any): Promise<void> {
    const mutation = `
      mutation ExecuteAutomationRule(
        $ruleId: String!
        $context: JSON!
      ) {
        automation_rule_execute(
          rule_id: $ruleId
          context: $context
        ) {
          request_id
          success
          results
        }
      }
    `;

    await this.apiClient.mutate(mutation, { ruleId, context });
  }
}

interface AutomationRuleData {
  name: string;
  description: string;
  active: boolean;
  trigger_type: 'order_created' | 'inventory_low' | 'shipment_delayed' | 'return_received';
  conditions: AutomationCondition[];
  actions: AutomationAction[];
}

interface AutomationCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

interface AutomationAction {
  type: 'send_email' | 'update_order' | 'create_task' | 'webhook_call';
  parameters: Record<string, any>;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  trigger_type: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  execution_count?: number;
  last_executed_at?: string;
  created_at: string;
}
```

---

## Error Handling & Best Practices

Robust error handling is essential for production ShipHero integrations. The API uses GraphQL error patterns combined with HTTP status codes to provide comprehensive error information.

### Error Types and Handling Patterns

ShipHero API errors fall into several categories, each requiring different handling strategies:

```typescript
enum ShipHeroErrorType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  RATE_LIMIT = 'rate_limit',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system'
}

interface ShipHeroError {
  type: ShipHeroErrorType;
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

class ShipHeroErrorHandler {
  static handleApiError(error: any): ShipHeroError {
    // Handle GraphQL errors
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const graphQLError = error.graphQLErrors[0];
      return this.parseGraphQLError(graphQLError);
    }

    // Handle network errors
    if (error.networkError) {
      return this.parseNetworkError(error.networkError);
    }

    // Handle generic errors
    return {
      type: ShipHeroErrorType.SYSTEM,
      message: error.message || 'Unknown error occurred'
    };
  }

  private static parseGraphQLError(error: any): ShipHeroError {
    const extensions = error.extensions || {};
    
    switch (extensions.code) {
      case 'UNAUTHENTICATED':
        return {
          type: ShipHeroErrorType.AUTHENTICATION,
          message: 'Authentication failed - token may be expired',
          code: extensions.code
        };
      
      case 'FORBIDDEN':
        return {
          type: ShipHeroErrorType.AUTHORIZATION,
          message: 'Insufficient permissions for this operation',
          code: extensions.code
        };
      
      case 'BAD_USER_INPUT':
        return {
          type: ShipHeroErrorType.VALIDATION,
          message: error.message,
          code: extensions.code,
          field: extensions.field,
          details: extensions.details
        };
      
      case 'RATE_LIMITED':
        return {
          type: ShipHeroErrorType.RATE_LIMIT,
          message: 'Rate limit exceeded - please retry after delay',
          code: extensions.code,
          details: extensions.retryAfter
        };
      
      default:
        return {
          type: ShipHeroErrorType.BUSINESS_LOGIC,
          message: error.message,
          code: extensions.code
        };
    }
  }

  private static parseNetworkError(error: any): ShipHeroError {
    if (error.statusCode === 404) {
      return {
        type: ShipHeroErrorType.RESOURCE_NOT_FOUND,
        message: 'Requested resource not found'
      };
    }

    if (error.statusCode >= 500) {
      return {
        type: ShipHeroErrorType.SYSTEM,
        message: 'ShipHero system error - please retry'
      };
    }

    return {
      type: ShipHeroErrorType.SYSTEM,
      message: `Network error: ${error.message}`
    };
  }
}
```

### Retry Logic and Circuit Breaker Pattern

Implementing robust retry logic with exponential backoff and circuit breaker patterns ensures resilient API integration:

```typescript
class ShipHeroApiClient {
  private circuitBreaker: CircuitBreaker;
  private retryConfig: RetryConfig;

  constructor(
    private auth: ShipHeroAuth,
    retryConfig?: Partial<RetryConfig>
  ) {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      ...retryConfig
    };

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 60000,
      monitoringPeriod: 10000
    });
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      let lastError: any;
      
      for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          const shipHeroError = ShipHeroErrorHandler.handleApiError(error);
          
          // Don't retry certain error types
          if (!this.shouldRetry(shipHeroError, attempt)) {
            throw error;
          }

          // Calculate delay for next attempt
          const delay = this.calculateDelay(attempt);
          console.log(
            `${operationName} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), ` +
            `retrying in ${delay}ms: ${shipHeroError.message}`
          );
          
          await this.sleep(delay);
        }
      }

      throw lastError;
    });
  }

  private shouldRetry(error: ShipHeroError, attempt: number): boolean {
    // Don't retry if we've exhausted attempts
    if (attempt >= this.retryConfig.maxRetries) {
      return false;
    }

    // Don't retry authentication or validation errors
    if (error.type === ShipHeroErrorType.AUTHENTICATION ||
        error.type === ShipHeroErrorType.AUTHORIZATION ||
        error.type === ShipHeroErrorType.VALIDATION) {
      return false;
    }

    // Retry rate limit, system, and network errors
    return error.type === ShipHeroErrorType.RATE_LIMIT ||
           error.type === ShipHeroErrorType.SYSTEM ||
           error.type === ShipHeroErrorType.RESOURCE_NOT_FOUND;
  }

  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * 
                  Math.pow(this.retryConfig.backoffMultiplier, attempt);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    
    return Math.min(delay + jitter, this.retryConfig.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async query<T>(query: string, variables?: any): Promise<T> {
    return this.executeWithRetry(async () => {
      const token = await this.auth.getValidToken();
      
      const response = await fetch('https://public-api.shiphero.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query, variables })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL Error: ${result.errors[0].message}`);
      }

      return result.data;
    }, 'GraphQL Query');
  }

  async mutate<T>(mutation: string, variables?: any): Promise<T> {
    return this.executeWithRetry(async () => {
      const token = await this.auth.getValidToken();
      
      const response = await fetch('https://public-api.shiphero.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: mutation, variables })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL Error: ${result.errors[0].message}`);
      }

      return result.data;
    }, 'GraphQL Mutation');
  }
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(private config: {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
  }) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.config.recoveryTimeout) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
      this.successCount = 0;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
```

---

## Modern Web Stack Integration

Integrating ShipHero with modern web development stacks requires understanding platform-specific patterns and best practices for Next.js, Vercel, Supabase, and related technologies.

### Next.js API Routes and Server Components

Next.js provides excellent patterns for ShipHero integration through API routes and server components:

```typescript
// lib/shiphero-client.ts
import { ShipHeroAuth, ShipHeroApiClient } from './shiphero-api';

const auth = new ShipHeroAuth(process.env.SHIPHERO_REFRESH_TOKEN!);
export const shipHeroClient = new ShipHeroApiClient(auth);

// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { shipHeroClient } from '../../../lib/shiphero-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouse_id');
    const status = searchParams.get('status');

    const orders = await shipHeroClient.query(`
      query GetOrders($warehouseId: String, $status: String) {
        orders(warehouse_id: $warehouseId, fulfillment_status: $status) {
          data {
            edges {
              node {
                id
                order_number
                fulfillment_status
                total_price
                created_at
              }
            }
          }
        }
      }
    `, { warehouseId, status });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    
    const order = await shipHeroClient.mutate(`
      mutation CreateOrder($orderData: OrderCreateInput!) {
        order_create(data: $orderData) {
          request_id
          complexity
          order {
            id
            order_number
            fulfillment_status
          }
        }
      }
    `, { orderData });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// app/orders/page.tsx - Server Component
import { shipHeroClient } from '../../lib/shiphero-client';

export default async function OrdersPage() {
  const orders = await shipHeroClient.query(`
    query GetRecentOrders {
      orders(first: 10) {
        data {
          edges {
            node {
              id
              order_number
              fulfillment_status
              total_price
              created_at
            }
          }
        }
      }
    }
  `);

  return (
    <div>
      <h1>Recent Orders</h1>
      <div className="grid gap-4">
        {orders.orders.data.edges.map(({ node: order }) => (
          <div key={order.id} className="border p-4 rounded">
            <h3>{order.order_number}</h3>
            <p>Status: {order.fulfillment_status}</p>
            <p>Total: ${order.total_price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Supabase Integration for Data Persistence

Supabase provides excellent database and real-time capabilities for ShipHero integrations:

```sql
-- Supabase schema for ShipHero data
CREATE TABLE warehouses (
  id TEXT PRIMARY KEY,
  shiphero_id TEXT UNIQUE NOT NULL,
  identifier TEXT NOT NULL,
  name TEXT NOT NULL,
  address JSONB NOT NULL,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  shiphero_id TEXT UNIQUE NOT NULL,
  order_number TEXT NOT NULL,
  partner_order_id TEXT,
  fulfillment_status TEXT NOT NULL,
  total_price DECIMAL(10,2),
  customer_email TEXT,
  shipping_address JSONB,
  billing_address JSONB,
  line_items JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL,
  warehouse_id TEXT REFERENCES warehouses(id),
  on_hand INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 0,
  allocated INTEGER NOT NULL DEFAULT 0,
  reserve INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sku, warehouse_id)
);

-- Enable Row Level Security
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant access
CREATE POLICY "Users can view their warehouses" ON warehouses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their orders" ON orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
```

```typescript
// lib/supabase-integration.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class SupabaseShipHeroSync {
  async syncWarehouse(warehouse: Warehouse): Promise<void> {
    const { error } = await supabase
      .from('warehouses')
      .upsert({
        id: warehouse.id,
        shiphero_id: warehouse.id,
        identifier: warehouse.identifier,
        name: warehouse.profile?.name || warehouse.identifier,
        address: warehouse.address,
        settings: warehouse.settings,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Warehouse sync error:', error);
      throw error;
    }
  }

  async syncOrder(order: Order): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .upsert({
        id: order.id,
        shiphero_id: order.id,
        order_number: order.order_number,
        partner_order_id: order.partner_order_id,
        fulfillment_status: order.fulfillment_status,
        total_price: parseFloat(order.total_price),
        customer_email: order.email,
        shipping_address: order.shipping_address,
        billing_address: order.billing_address,
        line_items: order.line_items,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Order sync error:', error);
      throw error;
    }
  }

  async syncInventory(sku: string, warehouseId: string, inventory: ProductInventory): Promise<void> {
    const { error } = await supabase
      .from('inventory')
      .upsert({
        sku,
        warehouse_id: warehouseId,
        on_hand: inventory.on_hand,
        available: inventory.available,
        allocated: inventory.allocated,
        reserve: inventory.reserve,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Inventory sync error:', error);
      throw error;
    }
  }

  async getOrdersWithRealtime(callback: (orders: any[]) => void): Promise<void> {
    // Initial fetch
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (orders) {
      callback(orders);
    }

    // Subscribe to real-time updates
    supabase
      .channel('orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order update received:', payload);
          // Refetch and update UI
          this.getOrdersWithRealtime(callback);
        }
      )
      .subscribe();
  }
}

// React component using real-time data
import { useEffect, useState } from 'react';

export function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = new SupabaseShipHeroSync();
    
    sync.getOrdersWithRealtime((updatedOrders) => {
      setOrders(updatedOrders);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div>
      {orders.map(order => (
        <div key={order.id} className="border p-4 mb-2">
          <h3>{order.order_number}</h3>
          <p>Status: {order.fulfillment_status}</p>
          <p>Total: ${order.total_price}</p>
        </div>
      ))}
    </div>
  );
}
```

### Vercel Deployment Configuration

Vercel provides excellent hosting for ShipHero integrations with proper environment variable management and edge functions:

```json
// vercel.json
{
  "functions": {
    "app/api/webhooks/shiphero/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "SHIPHERO_REFRESH_TOKEN": "@shiphero-refresh-token",
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url-public"
    }
  }
}

// Environment variables in Vercel dashboard:
// SHIPHERO_REFRESH_TOKEN=your_refresh_token_here
// SUPABASE_URL=https://your-project.supabase.co
// SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
// NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

---

## Production Deployment

Deploying ShipHero integrations to production requires careful consideration of security, performance, monitoring, and scalability requirements.

### Security Best Practices

Production deployments must implement comprehensive security measures:

```typescript
// lib/security.ts
import crypto from 'crypto';

export class ShipHeroSecurity {
  static validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  static sanitizeInput(input: any): any {
    // Implement input sanitization
    if (typeof input === 'string') {
      return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  static rateLimit(
    clientId: string,
    maxRequests: number = 100,
    windowMs: number = 60000
  ): boolean {
    // Implement rate limiting logic
    // This would typically use Redis or similar for distributed systems
    return true;
  }
}

// Middleware for API routes
export function withSecurity(handler: any) {
  return async (req: any, res: any) => {
    // Validate request origin
    const origin = req.headers.origin;
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: 'Forbidden origin' });
    }

    // Rate limiting
    const clientId = req.ip || 'unknown';
    if (!ShipHeroSecurity.rateLimit(clientId)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Input sanitization
    if (req.body) {
      req.body = ShipHeroSecurity.sanitizeInput(req.body);
    }

    return handler(req, res);
  };
}
```

### Performance Optimization

Production systems require optimization for high-throughput scenarios:

```typescript
// lib/performance.ts
export class ShipHeroPerformanceOptimizer {
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    customTimeout?: number
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && cached.expires > now) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      expires: now + (customTimeout || this.cacheTimeout)
    });

    return data;
  }

  async batchQueries<T>(
    queries: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(query => query()));
      results.push(...batchResults);
      
      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < queries.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; hitRate: number } {
    // Implementation would track cache hits/misses
    return { size: this.cache.size, hitRate: 0.85 };
  }
}

// Usage example
const optimizer = new ShipHeroPerformanceOptimizer();

export async function getWarehousesOptimized(): Promise<Warehouse[]> {
  return optimizer.getCachedData(
    'warehouses',
    async () => {
      const response = await shipHeroClient.query(`
        query GetWarehouses {
          account {
            data {
              warehouses {
                id
                identifier
                address { name city state }
              }
            }
          }
        }
      `);
      return response.account.data.warehouses;
    },
    10 * 60 * 1000 // Cache for 10 minutes
  );
}
```

### Monitoring and Observability

Production systems require comprehensive monitoring:

```typescript
// lib/monitoring.ts
export class ShipHeroMonitoring {
  static recordMetric(
    metricName: string,
    value: number,
    tags?: Record<string, string>
  ): void {
    // Integration with monitoring services (DataDog, New Relic, etc.)
    console.log(`Metric: ${metricName} = ${value}`, tags);
    
    // Example: Send to DataDog
    // dogapi.metric.send(metricName, value, tags);
  }

  static recordError(
    error: Error,
    context?: Record<string, any>
  ): void {
    console.error('ShipHero API Error:', error, context);
    
    // Example: Send to error tracking service
    // Sentry.captureException(error, { extra: context });
  }

  static startTimer(operationName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(`shiphero.operation.duration`, duration, {
        operation: operationName
      });
    };
  }

  static async monitoredOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const endTimer = this.startTimer(operationName);
    
    try {
      const result = await operation();
      this.recordMetric(`shiphero.operation.success`, 1, {
        operation: operationName
      });
      return result;
    } catch (error) {
      this.recordMetric(`shiphero.operation.error`, 1, {
        operation: operationName
      });
      this.recordError(error as Error, { operation: operationName });
      throw error;
    } finally {
      endTimer();
    }
  }
}

// Usage in API client
export class MonitoredShipHeroClient extends ShipHeroApiClient {
  async query<T>(query: string, variables?: any): Promise<T> {
    return ShipHeroMonitoring.monitoredOperation(
      'graphql_query',
      () => super.query(query, variables)
    );
  }

  async mutate<T>(mutation: string, variables?: any): Promise<T> {
    return ShipHeroMonitoring.monitoredOperation(
      'graphql_mutation',
      () => super.mutate(mutation, variables)
    );
  }
}
```

---

## Troubleshooting

Common issues and their solutions for ShipHero API integrations.

### Authentication Issues

**Problem**: Token refresh failures or authentication errors

**Solutions**:
1. Verify refresh token is valid and not expired
2. Check environment variable configuration
3. Implement proper token caching and refresh logic
4. Monitor token expiration and refresh proactively

```typescript
// Debug authentication issues
export class AuthenticationDebugger {
  static async diagnoseAuthIssues(auth: ShipHeroAuth): Promise<void> {
    try {
      console.log('Testing token refresh...');
      const token = await auth.getValidToken();
      console.log('Token obtained successfully:', token.substring(0, 20) + '...');
      
      // Test API call with token
      const response = await fetch('https://public-api.shiphero.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: 'query { account { data { id } } }'
        })
      });

      if (response.ok) {
        console.log('API call successful');
      } else {
        console.error('API call failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Authentication diagnosis failed:', error);
    }
  }
}
```

### Rate Limiting and Performance

**Problem**: Rate limit exceeded or slow API responses

**Solutions**:
1. Implement exponential backoff retry logic
2. Use query complexity optimization
3. Implement request batching and caching
4. Monitor API usage patterns

### Data Synchronization Issues

**Problem**: Webhook delivery failures or data inconsistencies

**Solutions**:
1. Implement reconciliation processes
2. Use idempotent operations
3. Store webhook events for replay
4. Monitor webhook delivery success rates

---

## API Reference

### Core Endpoints

- **Authentication**: `https://public-api.shiphero.com/auth`
- **GraphQL**: `https://public-api.shiphero.com/graphql`

### Key Query Operations

| Operation | Purpose | Complexity |
|-----------|---------|------------|
| `account` | Get account information | Low |
| `warehouses` | List warehouses | Low |
| `orders` | Query orders with filters | Medium |
| `products` | Query products and inventory | Medium |
| `returns` | Query returns | Medium |
| `purchase_orders` | Query purchase orders | Medium |

### Key Mutation Operations

| Operation | Purpose | Complexity |
|-----------|---------|------------|
| `order_create` | Create new order | High |
| `purchase_order_create` | Create purchase order | High |
| `return_create` | Create return | Medium |
| `inventory_add` | Add inventory | Low |
| `inventory_remove` | Remove inventory | Low |
| `inventory_sync` | Bulk inventory sync | High |

### Webhook Types

All webhook types are documented in the [Webhooks section](#webhooks--real-time-integration) with payload examples and implementation patterns.

---

## Conclusion

This comprehensive guide provides the foundation for building robust, scalable ShipHero integrations using modern web technologies. The examples and patterns demonstrated here enable developers to create production-ready applications that leverage ShipHero's full API capabilities while maintaining excellent performance, security, and user experience.

For additional support and updates, refer to the official ShipHero API documentation and developer community resources.

---

**References**

[1] ShipHero Developer Documentation: https://developer.shiphero.com/  
[2] ShipHero GraphQL Schema: https://developer.shiphero.com/schema/  
[3] ShipHero Community Forum: https://community.shiphero.com/  
[4] Next.js Documentation: https://nextjs.org/docs  
[5] Supabase Documentation: https://supabase.com/docs  
[6] Vercel Documentation: https://vercel.com/docs


## Complete API Reference

This section provides comprehensive documentation of all available ShipHero GraphQL operations, including detailed query and mutation examples with complete parameter specifications and response structures.

### Core Query Operations

The ShipHero GraphQL API provides extensive query capabilities for retrieving data across all business entities. Each query operation follows consistent patterns for pagination, filtering, and field selection, enabling efficient data retrieval for various use cases.

#### UUID Conversion Query

The UUID query serves as a critical bridge between legacy numeric identifiers and modern UUID-based references. This operation is essential when migrating from older webhook implementations or integrating with systems that store legacy identifiers.

```graphql
query GetUUID($legacyId: Int!, $entity: EntityType!) {
  uuid(legacy_id: $legacyId, entity: $entity) {
    data {
      legacy_id
      id
    }
  }
}
```

**Variables:**
```json
{
  "legacyId": 100579698,
  "entity": "Order"
}
```

**Response:**
```json
{
  "data": {
    "uuid": {
      "data": {
        "legacy_id": 100579698,
        "id": "T3JkZXI6MTAwNTc5Njk4"
      }
    }
  }
}
```

**Supported Entity Types:**
- Order
- Product
- Warehouse
- Vendor
- Return
- PurchaseOrder
- Shipment

#### Comprehensive Order Query

The order query provides complete access to order information including line items, allocations, shipments, and returns. This query supports extensive field selection for optimizing data retrieval based on specific requirements.

```graphql
query GetOrderDetails($orderId: String!, $lineItemsFirst: Int = 50) {
  order(id: $orderId) {
    request_id
    complexity
    data {
      id
      legacy_id
      order_number
      partner_order_id
      shop_name
      fulfillment_status
      order_date
      profile
      required_ship_date
      total_tax
      subtotal
      total_discounts
      total_price
      currency
      email
      phone
      packing_note
      gift_invoice
      priority_flag
      saturday_delivery
      require_signature
      adult_signature_required
      alcohol
      insurance
      insurance_amount
      expected_weight_in_oz
      has_dry_ice
      allow_partial
      allow_split
      allocation_priority
      flagged
      source
      tags
      custom_invoice_url
      auto_print_return_label
      ignore_address_validation_errors
      third_party_shipper {
        account_number
        zip
        country
      }
      shipping_lines {
        title
        price
        carrier
        method
      }
      shipping_address {
        first_name
        last_name
        company
        address1
        address2
        city
        state
        state_code
        zip
        country
        country_code
        email
        phone
      }
      billing_address {
        first_name
        last_name
        company
        address1
        address2
        city
        state
        state_code
        zip
        country
        country_code
        email
        phone
      }
      line_items(first: $lineItemsFirst) {
        edges {
          node {
            id
            sku
            partner_line_item_id
            quantity
            price
            product_name
            fulfillment_status
            quantity_allocated
            quantity_pending_fulfillment
            quantity_shipped
            backorder_quantity
            eligible_for_return
            customs_value
            customs_description
            warehouse_id
            locked_to_warehouse_id
            barcode
            promotion_discount
            product_id
            variant_id
            variant_title
            vendor
            weight
            dimensions {
              height
              width
              length
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
      allocations {
        warehouse_id
        allocated_at
        allocation_reference
        line_items {
          line_item_id
          sku
          quantity_allocated
          is_kit_component
          warehouse_id
          allocated_at
          allocation_reference
        }
      }
      shipments {
        id
        legacy_id
        order_id
        user_id
        warehouse_id
        pending_shipment_id
        shipped_off_shiphero
        dropshipment
        created_at
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
        line_items {
          line_item_id
          sku
          quantity
        }
        tracking_number
        carrier
        method
        cost
        delivered_date
        shipped_date
        profile
      }
      returns {
        id
        legacy_id
        reason
        status
        label_type
        cost_to_customer
        created_at
      }
      order_history {
        created_at
        information
        user_id
      }
    }
  }
}
```

#### Advanced Orders Query with Filtering

The orders query enables bulk retrieval with sophisticated filtering capabilities for operational reporting and business intelligence applications.

```graphql
query GetOrdersWithFilters(
  $first: Int = 50
  $after: String
  $warehouseId: String
  $fulfillmentStatus: String
  $shopName: String
  $partnerOrderId: String
  $orderNumber: String
  $sku: String
  $email: String
  $updatedFrom: ISODateTime
  $updatedTo: ISODateTime
  $orderDateFrom: ISODateTime
  $orderDateTo: ISODateTime
  $customerAccountId: String
) {
  orders(
    first: $first
    after: $after
    warehouse_id: $warehouseId
    fulfillment_status: $fulfillmentStatus
    shop_name: $shopName
    partner_order_id: $partnerOrderId
    order_number: $orderNumber
    sku: $sku
    email: $email
    updated_from: $updatedFrom
    updated_to: $updatedTo
    order_date_from: $orderDateFrom
    order_date_to: $orderDateTo
    customer_account_id: $customerAccountId
  ) {
    request_id
    complexity
    data {
      edges {
        node {
          id
          legacy_id
          order_number
          partner_order_id
          shop_name
          fulfillment_status
          order_date
          total_price
          currency
          email
          required_ship_date
          priority_flag
          tags
          line_items(first: 10) {
            edges {
              node {
                sku
                quantity
                quantity_allocated
                quantity_pending_fulfillment
                backorder_quantity
                fulfillment_status
              }
            }
          }
          shipping_address {
            city
            state
            country
            zip
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
}
```

**Available Filter Parameters:**
- **warehouse_id**: Filter by specific warehouse
- **fulfillment_status**: pending, allocated, shipped, delivered, canceled, etc.
- **shop_name**: Filter by originating shop/channel
- **partner_order_id**: External order identifier
- **order_number**: ShipHero order number
- **sku**: Filter orders containing specific SKU
- **email**: Customer email address
- **updated_from/updated_to**: Date range for order updates
- **order_date_from/order_date_to**: Date range for order creation
- **customer_account_id**: For 3PL multi-tenant filtering

#### Comprehensive Product Query

Product queries provide detailed information about inventory items including warehouse-specific data, vendor relationships, and kit configurations.

```graphql
query GetProductDetails($productId: String!, $warehouseId: String) {
  product(id: $productId) {
    request_id
    complexity
    data {
      id
      legacy_id
      account_id
      name
      sku
      price
      value
      value_currency
      barcode
      country_of_manufacture
      tariff_code
      kit
      kit_build
      no_air
      final_sale
      customs_value
      customs_description
      not_owned
      dropship
      needs_serial_number
      thumbnail
      large_thumbnail
      created_at
      updated_at
      dimensions {
        weight
        height
        width
        length
      }
      tags
      vendors {
        vendor_id
        vendor_sku
        price
        vendor {
          id
          name
          email
        }
      }
      images {
        src
        position
        created_at
      }
      warehouse_products {
        warehouse_id
        warehouse_identifier
        on_hand
        inventory_bin
        reserve_inventory
        replenishment_level
        reorder_level
        reorder_amount
        custom
        created_at
        updated_at
        sell_ahead
        location_id
        location_name
      }
      inventory(warehouse_id: $warehouseId) {
        warehouse_id
        warehouse_identifier
        on_hand
        available
        allocated
        backorder_quantity
        reserve
        non_sellable
        sellable
        sell_ahead
        qty_in_totes
        updated_at
        locations {
          location_id
          location_name
          quantity
          pickable
        }
      }
      kit_components {
        sku
        quantity
        product {
          name
          dimensions {
            weight
            height
            width
            length
          }
        }
      }
    }
  }
}
```

#### Products Query with Advanced Filtering

```graphql
query GetProductsWithFilters(
  $first: Int = 50
  $after: String
  $sku: String
  $name: String
  $warehouseId: String
  $updatedFrom: ISODateTime
  $updatedTo: ISODateTime
  $createdFrom: ISODateTime
  $createdTo: ISODateTime
  $hasInventory: Boolean
  $isKit: Boolean
  $vendorId: String
) {
  products(
    first: $first
    after: $after
    sku: $sku
    name: $name
    warehouse_id: $warehouseId
    updated_from: $updatedFrom
    updated_to: $updatedTo
    created_from: $createdFrom
    created_to: $createdTo
    has_inventory: $hasInventory
    is_kit: $isKit
    vendor_id: $vendorId
  ) {
    request_id
    complexity
    data {
      edges {
        node {
          id
          sku
          name
          price
          barcode
          kit
          created_at
          updated_at
          dimensions {
            weight
            height
            width
            length
          }
          inventory {
            warehouse_id
            on_hand
            available
            allocated
          }
          vendors {
            vendor_id
            vendor_sku
            price
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
```

#### Purchase Order Queries

Purchase order queries support procurement workflow management with comprehensive vendor and receiving information.

```graphql
query GetPurchaseOrderDetails($purchaseOrderId: String!) {
  purchase_order(id: $purchaseOrderId) {
    request_id
    complexity
    data {
      id
      legacy_id
      po_number
      partner_po_id
      status
      po_date
      po_note
      subtotal
      shipping_price
      total_price
      tax
      discount
      created_at
      updated_at
      vendor {
        id
        name
        email
        address {
          name
          address1
          address2
          city
          state
          zip
          country
          phone
        }
      }
      warehouse {
        id
        identifier
        profile {
          name
        }
      }
      line_items {
        edges {
          node {
            id
            sku
            quantity
            quantity_received
            price
            product_name
            expected_weight_in_oz
            partner_line_item_id
            sell_ahead
            note
            fulfillment {
              id
              status
              created_at
            }
          }
        }
      }
      fulfillment {
        id
        status
        created_at
        ship_to {
          name
          address1
          address2
          city
          state
          zip
          country
          phone
        }
      }
      attachments {
        id
        description
        file_type
        file_url
        created_at
      }
    }
  }
}
```

#### Returns Query Operations

Returns queries provide comprehensive access to reverse logistics information including line item details and exchange orders.

```graphql
query GetReturnDetails($returnId: String!) {
  return(id: $returnId) {
    request_id
    complexity
    data {
      id
      legacy_id
      order_id
      partner_id
      reason
      status
      label_type
      label_cost
      cost_to_customer
      shipping_carrier
      shipping_method
      display_issue_refund
      tracking_number
      created_at
      updated_at
      address {
        name
        address1
        address2
        city
        state
        zip
        country
        phone
      }
      dimensions {
        height
        width
        length
        weight
      }
      line_items {
        edges {
          node {
            id
            sku
            quantity
            quantity_received
            return_reason
            condition
            restock
            exchange_items {
              exchange_product_sku
              quantity
            }
          }
        }
      }
      exchanges {
        exchange_order {
          id
          legacy_id
          order_number
          fulfillment_status
        }
      }
    }
  }
}
```

#### Shipment Query Operations

Shipment queries provide tracking and delivery information for order fulfillment monitoring.

```graphql
query GetShipmentDetails($shipmentId: String!) {
  shipment(id: $shipmentId) {
    request_id
    complexity
    data {
      id
      legacy_id
      order_id
      user_id
      warehouse_id
      pending_shipment_id
      shipped_off_shiphero
      dropshipment
      created_at
      shipped_date
      delivered_date
      tracking_number
      carrier
      method
      cost
      profile
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
      line_items {
        line_item_id
        sku
        quantity
        product_name
      }
      packages {
        id
        tracking_number
        carrier
        method
        weight
        dimensions {
          height
          width
          length
        }
      }
    }
  }
}
```

#### Vendor Query Operations

Vendor queries support supplier relationship management and procurement workflows.

```graphql
query GetVendorDetails($vendorId: String!) {
  vendor(id: $vendorId) {
    request_id
    complexity
    data {
      id
      legacy_id
      name
      email
      account_number
      active
      created_at
      updated_at
      address {
        name
        address1
        address2
        city
        state
        zip
        country
        phone
      }
      products {
        edges {
          node {
            product_id
            vendor_sku
            price
            product {
              sku
              name
            }
          }
        }
      }
    }
  }
}
```

#### Inventory Change Tracking

Inventory change queries provide audit trails for inventory movements and adjustments.

```graphql
query GetInventoryChanges(
  $first: Int = 50
  $after: String
  $warehouseId: String
  $sku: String
  $createdFrom: ISODateTime
  $createdTo: ISODateTime
  $changeType: String
) {
  inventory_changes(
    first: $first
    after: $after
    warehouse_id: $warehouseId
    sku: $sku
    created_from: $createdFrom
    created_to: $createdTo
    change_type: $changeType
  ) {
    request_id
    complexity
    data {
      edges {
        node {
          id
          sku
          warehouse_id
          change_type
          quantity
          previous_on_hand
          new_on_hand
          reason
          cycle_counted
          created_at
          user {
            id
            name
          }
          location {
            id
            name
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
```

### Complete Mutation Operations

ShipHero's mutation operations enable comprehensive data modification across all business entities. Each mutation follows consistent patterns for input validation, error handling, and response formatting.

#### Advanced Order Creation Mutation

The order creation mutation supports complex order scenarios including multiple line items, custom shipping requirements, and 3PL customer account assignment.

```graphql
mutation CreateAdvancedOrder($orderData: OrderCreateInput!) {
  order_create(data: $orderData) {
    request_id
    complexity
    order {
      id
      legacy_id
      order_number
      partner_order_id
      shop_name
      fulfillment_status
      order_date
      total_tax
      subtotal
      total_discounts
      total_price
      currency
      email
      phone
      profile
      packing_note
      required_ship_date
      priority_flag
      saturday_delivery
      require_signature
      adult_signature_required
      alcohol
      insurance
      insurance_amount
      expected_weight_in_oz
      has_dry_ice
      allow_partial
      allow_split
      allocation_priority
      flagged
      source
      tags
      custom_invoice_url
      auto_print_return_label
      ignore_address_validation_errors
      customer_account_id
      third_party_shipper {
        account_number
        zip
        country
      }
      shipping_lines {
        title
        price
        carrier
        method
      }
      shipping_address {
        first_name
        last_name
        company
        address1
        address2
        city
        state
        state_code
        zip
        country
        country_code
        email
        phone
      }
      billing_address {
        first_name
        last_name
        company
        address1
        address2
        city
        state
        state_code
        zip
        country
        country_code
        email
        phone
      }
      line_items(first: 50) {
        edges {
          node {
            id
            sku
            partner_line_item_id
            quantity
            price
            product_name
            fulfillment_status
            quantity_pending_fulfillment
            quantity_allocated
            backorder_quantity
            eligible_for_return
            customs_value
            customs_description
            warehouse_id
            locked_to_warehouse_id
            barcode
            promotion_discount
            product_id
            variant_id
            variant_title
            vendor
            weight
          }
        }
      }
    }
  }
}
```

**Complete Input Variables Example:**
```json
{
  "orderData": {
    "order_number": "ORD-2024-001",
    "partner_order_id": "EXT-12345",
    "shop_name": "Premium Store",
    "fulfillment_status": "pending",
    "order_date": "2024-01-15T10:30:00Z",
    "total_tax": "15.50",
    "subtotal": "185.00",
    "total_discounts": "10.00",
    "total_price": "190.50",
    "currency": "USD",
    "email": "customer@example.com",
    "phone": "+1-555-123-4567",
    "profile": "standard",
    "packing_note": "Handle with care - fragile items",
    "required_ship_date": "2024-01-17T00:00:00Z",
    "priority_flag": true,
    "saturday_delivery": false,
    "require_signature": true,
    "adult_signature_required": false,
    "alcohol": false,
    "insurance": true,
    "insurance_amount": "200.00",
    "expected_weight_in_oz": 32,
    "has_dry_ice": false,
    "allow_partial": true,
    "allow_split": false,
    "allocation_priority": 1,
    "flagged": false,
    "source": "api",
    "tags": ["premium", "expedited"],
    "auto_print_return_label": true,
    "ignore_address_validation_errors": false,
    "customer_account_id": "Q3VzdG9tZXJBY2NvdW50OjEyMzQ1",
    "third_party_shipper": {
      "account_number": "123456789",
      "zip": "10001",
      "country": "US"
    },
    "shipping_lines": {
      "title": "Express Shipping",
      "price": "15.99",
      "carrier": "UPS",
      "method": "Next Day Air"
    },
    "shipping_address": {
      "first_name": "John",
      "last_name": "Smith",
      "company": "Smith Industries",
      "address1": "123 Main Street",
      "address2": "Suite 100",
      "city": "New York",
      "state": "New York",
      "state_code": "NY",
      "zip": "10001",
      "country": "United States",
      "country_code": "US",
      "email": "john.smith@smithindustries.com",
      "phone": "+1-555-123-4567"
    },
    "billing_address": {
      "first_name": "John",
      "last_name": "Smith",
      "company": "Smith Industries",
      "address1": "123 Main Street",
      "address2": "Suite 100",
      "city": "New York",
      "state": "New York",
      "state_code": "NY",
      "zip": "10001",
      "country": "United States",
      "country_code": "US",
      "email": "john.smith@smithindustries.com",
      "phone": "+1-555-123-4567"
    },
    "line_items": [
      {
        "sku": "PROD-001",
        "partner_line_item_id": "LINE-001",
        "quantity": 2,
        "price": "75.00",
        "product_name": "Premium Widget",
        "fulfillment_status": "pending",
        "quantity_pending_fulfillment": 2,
        "customs_value": "75.00",
        "customs_description": "Electronic widget",
        "warehouse_id": "V2FyZWhvdXNlOjEyMzQ1",
        "promotion_discount": "5.00",
        "weight": 16
      },
      {
        "sku": "PROD-002",
        "partner_line_item_id": "LINE-002",
        "quantity": 1,
        "price": "110.00",
        "product_name": "Deluxe Gadget",
        "fulfillment_status": "pending",
        "quantity_pending_fulfillment": 1,
        "customs_value": "110.00",
        "customs_description": "Electronic gadget",
        "warehouse_id": "V2FyZWhvdXNlOjEyMzQ1",
        "promotion_discount": "5.00",
        "weight": 16
      }
    ]
  }
}
```

#### Order Update Mutation

Order updates enable modification of existing orders while maintaining data integrity and audit trails.

```graphql
mutation UpdateOrder($orderId: String!, $updateData: OrderUpdateInput!) {
  order_update(id: $orderId, data: $updateData) {
    request_id
    complexity
    order {
      id
      order_number
      fulfillment_status
      required_ship_date
      priority_flag
      tags
      packing_note
      shipping_address {
        first_name
        last_name
        address1
        city
        state
        zip
      }
      updated_at
    }
  }
}
```

#### Product Creation Mutation

Product creation supports comprehensive product information including dimensions, vendor relationships, and warehouse-specific configurations.

```graphql
mutation CreateProduct($productData: ProductCreateInput!) {
  product_create(data: $productData) {
    request_id
    complexity
    product {
      id
      legacy_id
      sku
      name
      price
      value
      barcode
      country_of_manufacture
      tariff_code
      kit
      kit_build
      no_air
      final_sale
      customs_value
      customs_description
      not_owned
      dropship
      needs_serial_number
      created_at
      dimensions {
        weight
        height
        width
        length
      }
      tags
      vendors {
        vendor_id
        vendor_sku
        price
      }
      warehouse_products {
        warehouse_id
        on_hand
        inventory_bin
        reserve_inventory
        replenishment_level
        reorder_level
        reorder_amount
      }
    }
  }
}
```

**Product Creation Input Example:**
```json
{
  "productData": {
    "sku": "NEW-PROD-001",
    "name": "Advanced Widget Pro",
    "price": "149.99",
    "value": "149.99",
    "value_currency": "USD",
    "barcode": "1234567890123",
    "country_of_manufacture": "US",
    "tariff_code": "8471.30.01",
    "kit": false,
    "kit_build": false,
    "no_air": false,
    "final_sale": false,
    "customs_value": "149.99",
    "customs_description": "Electronic widget device",
    "not_owned": false,
    "dropship": false,
    "needs_serial_number": false,
    "dimensions": {
      "weight": "2.5",
      "height": "6.0",
      "width": "4.0",
      "length": "8.0"
    },
    "tags": ["electronics", "premium", "new"],
    "vendors": [
      {
        "vendor_id": "VmVuZG9yOjEyMzQ1",
        "vendor_sku": "VENDOR-SKU-001",
        "price": "120.00"
      }
    ],
    "warehouse_products": [
      {
        "warehouse_id": "V2FyZWhvdXNlOjEyMzQ1",
        "on_hand": 100,
        "inventory_bin": "A1-B2-C3",
        "reserve_inventory": 10,
        "replenishment_level": 50,
        "reorder_level": 25,
        "reorder_amount": 100
      }
    ]
  }
}
```

#### Purchase Order Creation Mutation

Purchase order creation enables comprehensive procurement workflow management with vendor coordination and receiving planning.

```graphql
mutation CreatePurchaseOrder($poData: PurchaseOrderCreateInput!) {
  purchase_order_create(data: $poData) {
    request_id
    complexity
    purchase_order {
      id
      legacy_id
      po_number
      partner_po_id
      status
      po_date
      po_note
      subtotal
      shipping_price
      total_price
      tax
      discount
      vendor {
        id
        name
        email
      }
      warehouse {
        id
        identifier
      }
      line_items {
        edges {
          node {
            id
            sku
            quantity
            price
            product_name
            expected_weight_in_oz
            partner_line_item_id
          }
        }
      }
      fulfillment {
        id
        status
        ship_to {
          name
          address1
          city
          state
          zip
          country
        }
      }
    }
  }
}
```

#### Inventory Management Mutations

Inventory mutations provide precise control over stock levels with comprehensive audit trails and location management.

```graphql
mutation AddInventory($inventoryData: InventoryAddInput!) {
  inventory_add(data: $inventoryData) {
    request_id
    complexity
    inventory_item {
      id
      sku
      warehouse_id
      on_hand
      available
      allocated
      reserve
      updated_at
    }
  }
}

mutation RemoveInventory($inventoryData: InventoryRemoveInput!) {
  inventory_remove(data: $inventoryData) {
    request_id
    complexity
    inventory_item {
      id
      sku
      warehouse_id
      on_hand
      available
      allocated
      reserve
      updated_at
    }
  }
}
```

#### Return Creation Mutation

Return creation supports comprehensive reverse logistics workflows including exchange order generation and label creation.

```graphql
mutation CreateReturn($returnData: ReturnCreateInput!) {
  return_create(data: $returnData) {
    request_id
    complexity
    return {
      id
      legacy_id
      order_id
      partner_id
      reason
      status
      label_type
      label_cost
      cost_to_customer
      shipping_carrier
      shipping_method
      display_issue_refund
      tracking_number
      created_at
      address {
        name
        address1
        city
        state
        zip
        country
      }
      dimensions {
        height
        width
        length
        weight
      }
      line_items {
        edges {
          node {
            id
            sku
            quantity
            return_reason
            condition
            exchange_items {
              exchange_product_sku
              quantity
            }
          }
        }
      }
      exchanges {
        exchange_order {
          id
          order_number
        }
      }
    }
  }
}
```

#### Vendor Management Mutations

Vendor mutations enable supplier relationship management including product associations and pricing updates.

```graphql
mutation CreateVendor($vendorData: VendorCreateInput!) {
  vendor_create(data: $vendorData) {
    request_id
    complexity
    vendor {
      id
      legacy_id
      name
      email
      account_number
      active
      created_at
      address {
        name
        address1
        address2
        city
        state
        zip
        country
        phone
      }
    }
  }
}

mutation AddProductToVendor($vendorProductData: AddProductToVendorInput!) {
  add_product_to_vendor(data: $vendorProductData) {
    request_id
    complexity
    vendor_product {
      vendor_id
      product_id
      vendor_sku
      price
    }
  }
}
```

#### Kit Management Mutations

Kit mutations support complex product bundling and assembly workflows.

```graphql
mutation CreateKit($kitData: KitCreateInput!) {
  kit_create(data: $kitData) {
    request_id
    complexity
    kit {
      id
      sku
      name
      components {
        sku
        quantity
        product {
          name
          dimensions {
            weight
          }
        }
      }
    }
  }
}

mutation BuildKit($buildData: BuildKitInput!) {
  kit_build(data: $buildData) {
    request_id
    complexity
    kit_build {
      id
      kit_sku
      quantity_built
      components_used {
        sku
        quantity_used
      }
    }
  }
}
```

### Schema Type Definitions

The ShipHero GraphQL schema includes comprehensive type definitions that ensure type safety and provide clear contracts for API interactions.

#### Core Scalar Types

```graphql
scalar ISODateTime
scalar JSON
scalar Decimal
scalar Upload
```

#### Input Types for Order Management

```graphql
input OrderCreateInput {
  order_number: String!
  partner_order_id: String
  shop_name: String!
  fulfillment_status: String
  order_date: ISODateTime!
  total_tax: Decimal
  subtotal: Decimal!
  total_discounts: Decimal
  total_price: Decimal!
  currency: String
  email: String
  phone: String
  profile: String
  packing_note: String
  required_ship_date: ISODateTime
  priority_flag: Boolean
  saturday_delivery: Boolean
  require_signature: Boolean
  adult_signature_required: Boolean
  alcohol: Boolean
  insurance: Boolean
  insurance_amount: Decimal
  expected_weight_in_oz: Int
  has_dry_ice: Boolean
  allow_partial: Boolean
  allow_split: Boolean
  allocation_priority: Int
  flagged: Boolean
  source: String
  tags: [String!]
  custom_invoice_url: String
  auto_print_return_label: Boolean
  ignore_address_validation_errors: Boolean
  customer_account_id: String
  third_party_shipper: ThirdPartyShipperInput
  shipping_lines: ShippingLinesInput!
  shipping_address: AddressInput!
  billing_address: AddressInput
  line_items: [LineItemInput!]!
}

input LineItemInput {
  sku: String!
  partner_line_item_id: String
  quantity: Int!
  price: Decimal!
  product_name: String
  fulfillment_status: String
  quantity_pending_fulfillment: Int
  customs_value: Decimal
  customs_description: String
  warehouse_id: String
  locked_to_warehouse_id: String
  promotion_discount: Decimal
  weight: Int
}

input AddressInput {
  first_name: String!
  last_name: String!
  company: String
  address1: String!
  address2: String
  city: String!
  state: String!
  state_code: String
  zip: String!
  country: String!
  country_code: String
  email: String
  phone: String
}
```

#### Response Types

```graphql
type OrderQueryResult {
  request_id: String!
  complexity: Int!
  data: Order
}

type OrdersQueryResult {
  request_id: String!
  complexity: Int!
  data: OrderConnection
}

type OrderConnection {
  edges: [OrderEdge!]!
  pageInfo: PageInfo!
}

type OrderEdge {
  node: Order!
  cursor: String!
}

type Order {
  id: String!
  legacy_id: Int!
  order_number: String!
  partner_order_id: String
  shop_name: String!
  fulfillment_status: String!
  order_date: ISODateTime!
  total_tax: Decimal
  subtotal: Decimal!
  total_discounts: Decimal
  total_price: Decimal!
  currency: String
  email: String
  phone: String
  profile: String
  packing_note: String
  required_ship_date: ISODateTime
  priority_flag: Boolean!
  saturday_delivery: Boolean!
  require_signature: Boolean!
  adult_signature_required: Boolean!
  alcohol: Boolean!
  insurance: Boolean!
  insurance_amount: Decimal
  expected_weight_in_oz: Int
  has_dry_ice: Boolean!
  allow_partial: Boolean!
  allow_split: Boolean!
  allocation_priority: Int
  flagged: Boolean!
  source: String
  tags: [String!]!
  custom_invoice_url: String
  auto_print_return_label: Boolean!
  ignore_address_validation_errors: Boolean!
  customer_account_id: String
  created_at: ISODateTime!
  updated_at: ISODateTime!
  third_party_shipper: ThirdPartyShipper
  shipping_lines: ShippingLines!
  shipping_address: Address!
  billing_address: Address
  line_items(first: Int, after: String): LineItemConnection!
  allocations: [Allocation!]!
  shipments: [Shipment!]!
  returns: [Return!]!
  order_history: [OrderHistory!]!
}
```

This comprehensive API reference provides the foundation for building sophisticated ShipHero integrations with complete understanding of available operations, input requirements, and response structures. The detailed examples and type definitions enable developers to implement robust, type-safe applications that leverage the full capabilities of the ShipHero platform.

---


## Complete Schema Type Reference

This section provides a comprehensive listing of all GraphQL types, inputs, and operations available in the ShipHero API. This reference ensures complete coverage of all available functionality.

### Complete Input Types

#### Abort and Account Operations
```graphql
input AbortInventorySyncInput
input AbortInventorySyncOutput
input AccountConnection
input AccountEdge
input AccountQueryResult
```

#### Add Operations
```graphql
input AddHistoryInput
input AddLineItemsInput
input AddProductToVendorInput
input AddProductToWarehouseInput
input AddPurchaseOrderAttachmentInput
input AddPurchaseOrderAttachmentOutput
```

#### Address and Assembly Types
```graphql
input Address
input AddressInput
input AssemblySkuType
input AssignLotToLocationInput
input AssignLotToLocationOutput
input Authorization
```

#### Bill Management Types
```graphql
input Bill
input BillConnection
input BillEdge
input BillExports
input BillExportsConnection
input BillExportsEdge
input BillQueryResult
input BillingPeriod
input BillsQueryResult
input Boolean
```

#### Build and Bulk Operations
```graphql
input BuildKitComponentInput
input BuildKitInput
input BulkMutationOutput
input BulkUpdateTagsInput
```

#### Cancel Operations
```graphql
input CancelOrderInput
input CancelPurchaseOrderInput
input CancelPurchaseOrderOutput
input Case
input ChangeOrderWarehouseInput
```

#### Clear and Close Operations
```graphql
input ClearKitInput
input ClosePurchaseOrderInput
input ClosePurchaseOrderOutput
```

#### Create Operations - Bills and Exchange
```graphql
input CreateBillInput
input CreateBillOutput
input CreateExchangeItem
input CreateLabelResourceInput
input CreateLineItemInput
input CreateLocationInput
input CreateLotInput
input CreateLotOutput
```

#### Create Operations - Orders
```graphql
input CreateOrderAddressInput
input CreateOrderInput
```

#### Create Operations - Products
```graphql
input CreateProductCaseInput
input CreateProductImageInput
input CreateProductInput
input CreateProductOutput
input CreateProductVendorInput
```

#### Create Operations - Purchase Orders
```graphql
input CreatePurchaseOrderAttachmentInput
input CreatePurchaseOrderInput
input CreatePurchaseOrderLineItemInput
input CreatePurchaseOrderOutput
```

#### Create Operations - Returns
```graphql
input CreateReturnExchangeInput
input CreateReturnExchangeOutput
input CreateReturnInput
input CreateReturnItemExchangeInput
input CreateReturnLineItemInput
input CreateReturnOutput
```

#### Create Operations - Shipments
```graphql
input CreateShipmentInput
input CreateShipmentLineItemInput
input CreateShipmentOutput
input CreateShipmentShippingLinesInput
```

#### Create Operations - Shipping and Labels
```graphql
input CreateShippingLabelInput
input CreateShippingLabelOutput
input CreateShippingLinesInput
input CreateShippingPlanInput
input CreateShippingPlanOutput
```

#### Create Operations - Vendors and Warehouses
```graphql
input CreateVendorInput
input CreateVendorOutput
input CreateWarehouseProductInput
input CreateWebhookInput
input CreateWebhookOutput
input CreateWholesaleLineItemInput
input CreateWholesaleOrderInput
input CreateWorkOrderInput
```

#### Current User and Date Types
```graphql
input CurrentUserQueryResult
input Date
input DateTime
input Decimal
```

#### Delete Operations
```graphql
input DeleteBillInput
input DeleteLotInput
input DeleteLotOutput
input DeleteProductInput
input DeleteVendorInput
input DeleteWarehouseProductInput
input DeleteWebhookInput
```

#### Dimensions and Entity Types
```graphql
input Dimensions
input DimensionsInput
input EntityType
```

#### Fee and Inventory Types
```graphql
input FbaInventory
input FeeCategoryTotal
input FeeCategoryTotalConnection
```

### Complete Query Operations Reference

#### Core Entity Queries
```graphql
# Account and Authentication
query account($analyze: Boolean)
query uuid($legacy_id: Int!, $entity: EntityType!)

# Billing Operations
query bill($id: String!, $analyze: Boolean)
query bills($from_date: ISODateTime, $to_date: ISODateTime, $status: String, $analyze: Boolean)

# Inventory Management
query expiration_lots($warehouse_id: String, $sku: String, $expiration_date_from: ISODateTime, $expiration_date_to: ISODateTime, $first: Int, $after: String)
query inventory_changes($warehouse_id: String, $sku: String, $created_from: ISODateTime, $created_to: ISODateTime, $change_type: String, $first: Int, $after: String)

# Order Management
query order($id: String!)
query orders($warehouse_id: String, $fulfillment_status: String, $shop_name: String, $partner_order_id: String, $order_number: String, $sku: String, $email: String, $updated_from: ISODateTime, $updated_to: ISODateTime, $order_date_from: ISODateTime, $order_date_to: ISODateTime, $customer_account_id: String, $first: Int, $after: String)

# Product Management
query product($id: String!)
query products($sku: String, $name: String, $warehouse_id: String, $updated_from: ISODateTime, $updated_to: ISODateTime, $created_from: ISODateTime, $created_to: ISODateTime, $has_inventory: Boolean, $is_kit: Boolean, $vendor_id: String, $first: Int, $after: String)

# Purchase Order Management
query purchase_order($id: String!)
query purchase_orders($warehouse_id: String, $status: String, $po_number: String, $vendor_id: String, $created_from: ISODateTime, $created_to: ISODateTime, $first: Int, $after: String)

# Returns Management
query return($id: String!)
query returns($order_id: String, $status: String, $created_from: ISODateTime, $created_to: ISODateTime, $first: Int, $after: String)

# Shipment Management
query shipment($id: String!)
query shipments($order_id: String, $warehouse_id: String, $tracking_number: String, $shipped_from: ISODateTime, $shipped_to: ISODateTime, $first: Int, $after: String)

# Vendor Management
query vendor($id: String!)
query vendors($name: String, $email: String, $active: Boolean, $first: Int, $after: String)

# Warehouse Management
query warehouse($id: String!)
query warehouses($identifier: String, $first: Int, $after: String)
```

### Complete Mutation Operations Reference

#### Order Management Mutations
```graphql
# Order Creation and Updates
mutation order_create($data: OrderCreateInput!)
mutation order_update($id: String!, $data: OrderUpdateInput!)
mutation order_cancel($id: String!, $data: CancelOrderInput!)
mutation order_change_warehouse($id: String!, $data: ChangeOrderWarehouseInput!)

# Order Line Item Management
mutation add_line_items($order_id: String!, $data: AddLineItemsInput!)
mutation remove_line_items($order_id: String!, $line_item_ids: [String!]!)
```

#### Product Management Mutations
```graphql
# Product Creation and Updates
mutation product_create($data: CreateProductInput!)
mutation product_update($id: String!, $data: UpdateProductInput!)
mutation product_delete($id: String!)

# Product Vendor Management
mutation add_product_to_vendor($data: AddProductToVendorInput!)
mutation remove_product_from_vendor($data: RemoveProductFromVendorInput!)

# Product Warehouse Management
mutation add_product_to_warehouse($data: AddProductToWarehouseInput!)
mutation remove_product_from_warehouse($data: RemoveProductFromWarehouseInput!)
```

#### Inventory Management Mutations
```graphql
# Inventory Adjustments
mutation inventory_add($data: InventoryAddInput!)
mutation inventory_remove($data: InventoryRemoveInput!)
mutation inventory_sync($data: InventorySyncInput!)
mutation abort_inventory_sync($data: AbortInventorySyncInput!)

# Lot Management
mutation lot_create($data: CreateLotInput!)
mutation lot_update($data: UpdateLotInput!)
mutation lot_delete($data: DeleteLotInput!)
mutation assign_lot_to_location($data: AssignLotToLocationInput!)
```

#### Purchase Order Management Mutations
```graphql
# Purchase Order Operations
mutation purchase_order_create($data: CreatePurchaseOrderInput!)
mutation purchase_order_update($id: String!, $data: UpdatePurchaseOrderInput!)
mutation purchase_order_close($id: String!, $data: ClosePurchaseOrderInput!)
mutation purchase_order_cancel($id: String!, $data: CancelPurchaseOrderInput!)

# Purchase Order Attachments
mutation add_purchase_order_attachment($data: AddPurchaseOrderAttachmentInput!)
mutation remove_purchase_order_attachment($id: String!)
```

#### Returns Management Mutations
```graphql
# Return Operations
mutation return_create($data: CreateReturnInput!)
mutation return_update($id: String!, $data: UpdateReturnInput!)
mutation return_exchange_create($data: CreateReturnExchangeInput!)
```

#### Shipment Management Mutations
```graphql
# Shipment Operations
mutation shipment_create($data: CreateShipmentInput!)
mutation shipment_update($id: String!, $data: UpdateShipmentInput!)

# Shipping Label Operations
mutation create_shipping_label($data: CreateShippingLabelInput!)
mutation create_shipping_plan($data: CreateShippingPlanInput!)
```

#### Vendor Management Mutations
```graphql
# Vendor Operations
mutation vendor_create($data: CreateVendorInput!)
mutation vendor_update($id: String!, $data: UpdateVendorInput!)
mutation vendor_delete($id: String!)
```

#### Kit Management Mutations
```graphql
# Kit Operations
mutation kit_create($data: CreateKitInput!)
mutation kit_build($data: BuildKitInput!)
mutation kit_clear($data: ClearKitInput!)
```

#### Webhook Management Mutations
```graphql
# Webhook Operations
mutation webhook_create($data: CreateWebhookInput!)
mutation webhook_update($id: String!, $data: UpdateWebhookInput!)
mutation webhook_delete($id: String!)
```

#### Bill Management Mutations
```graphql
# Bill Operations
mutation bill_create($data: CreateBillInput!)
mutation bill_delete($data: DeleteBillInput!)
```

### Comprehensive Field Examples

#### Complete Order Query with All Fields
```graphql
query GetCompleteOrder($orderId: String!) {
  order(id: $orderId) {
    request_id
    complexity
    data {
      # Basic Order Information
      id
      legacy_id
      order_number
      partner_order_id
      shop_name
      fulfillment_status
      order_date
      profile
      required_ship_date
      
      # Financial Information
      total_tax
      subtotal
      total_discounts
      total_price
      currency
      
      # Customer Information
      email
      phone
      
      # Order Configuration
      packing_note
      gift_invoice
      priority_flag
      saturday_delivery
      require_signature
      adult_signature_required
      alcohol
      insurance
      insurance_amount
      expected_weight_in_oz
      has_dry_ice
      allow_partial
      allow_split
      allocation_priority
      flagged
      source
      tags
      custom_invoice_url
      auto_print_return_label
      ignore_address_validation_errors
      
      # 3PL Configuration
      customer_account_id
      
      # Third Party Shipper
      third_party_shipper {
        account_number
        zip
        country
      }
      
      # Shipping Information
      shipping_lines {
        title
        price
        carrier
        method
      }
      
      # Addresses
      shipping_address {
        first_name
        last_name
        company
        address1
        address2
        city
        state
        state_code
        zip
        country
        country_code
        email
        phone
      }
      
      billing_address {
        first_name
        last_name
        company
        address1
        address2
        city
        state
        state_code
        zip
        country
        country_code
        email
        phone
      }
      
      # Line Items with Complete Details
      line_items(first: 50) {
        edges {
          node {
            id
            sku
            partner_line_item_id
            quantity
            price
            product_name
            fulfillment_status
            quantity_allocated
            quantity_pending_fulfillment
            quantity_shipped
            backorder_quantity
            eligible_for_return
            customs_value
            customs_description
            warehouse_id
            locked_to_warehouse_id
            barcode
            promotion_discount
            product_id
            variant_id
            variant_title
            vendor
            weight
            dimensions {
              height
              width
              length
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
      
      # Allocations
      allocations {
        warehouse_id
        allocated_at
        allocation_reference
        line_items {
          line_item_id
          sku
          quantity_allocated
          is_kit_component
          warehouse_id
          allocated_at
          allocation_reference
        }
      }
      
      # Shipments
      shipments {
        id
        legacy_id
        order_id
        user_id
        warehouse_id
        pending_shipment_id
        shipped_off_shiphero
        dropshipment
        created_at
        shipped_date
        delivered_date
        tracking_number
        carrier
        method
        cost
        profile
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
        line_items {
          line_item_id
          sku
          quantity
        }
        packages {
          id
          tracking_number
          carrier
          method
          weight
          dimensions {
            height
            width
            length
          }
        }
      }
      
      # Returns
      returns {
        id
        legacy_id
        reason
        status
        label_type
        cost_to_customer
        created_at
      }
      
      # Order History
      order_history {
        created_at
        information
        user_id
      }
      
      # Timestamps
      created_at
      updated_at
    }
  }
}
```

This comprehensive schema reference provides complete coverage of all ShipHero GraphQL API capabilities, ensuring developers have access to every available operation, input type, and field for building sophisticated integrations with the ShipHero platform.

---

