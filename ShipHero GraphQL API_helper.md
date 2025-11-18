# ShipHero GraphQL API

Internal documentation for our GraphQL API.

## API Endpoints

`https://public-api.shiphero.com/graphql/`

---

## Queries

### `account`
Returns an AccountQueryResult

**Response**
```json
Returns an AccountQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `analyze` | Boolean |

**Query**
```graphql
query account($analyze: Boolean) {
account(analyze: $analyze) {
request_id
complexity
data {
...AccountFragment
}
}
}
```

**Variables**
```json
{"analyze": true}
```

**Response**
```json
{
"data": {
"account": {
"request_id": "xyz789",
"complexity": 123,
"data": "Account"
}
}
}
```

---

### `bill`
Returns a BillQueryResult

**Response**
```json
Returns a BillQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String! |
| `analyze` | Boolean |

**Query**
```graphql
query bill(
$id: String!,
$analyze: Boolean
) {
bill(
id: $id,
analyze: $analyze
) {
request_id
complexity
data {
...BillFragment
}
}
}
```

**Variables**
```json
{"id": "abc123", "analyze": false}
```

**Response**
```json
{
"data": {
"bill": {
"request_id": "xyz789",
"complexity": 987,
"data": "Bill"
}
}
}
```

---

### `bills`
Returns a BillsQueryResult

**Response**
```json
Returns a BillsQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `from_date` | ISODateTime |
| `to_date` | ISODateTime |
| `status` | String |
| `analyze` | Boolean |

**Query**
```graphql
query bills(
$from_date: ISODateTime,
$to_date: ISODateTime,
$status: String,
$analyze: Boolean
) {
bills(
from_date: $from_date,
to_date: $to_date,
status: $status,
analyze: $analyze
) {
request_id
complexity
data {
...BillConnectionFragment
}
}
}
```

**Variables**
```json
{
"from_date": ISODateTime,
"to_date": ISODateTime,
"status": "abc123",
"analyze": true
}
```

**Response**
```json
{
"data": {
"bills": {
"request_id": "xyz789",
"complexity": 987,
"data": "BillConnection"
}
}
}
```

---

### `expiration_lots`
Returns a LotsQueryResult

**Response**
```json
Returns a LotsQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `sku` | String |
| `po_id` | String |
| `analyze` | Boolean |

**Query**
```graphql
query expiration_lots(
$sku: String,
$po_id: String,
$analyze: Boolean
) {
expiration_lots(
sku: $sku,
po_id: $po_id,
analyze: $analyze
) {
request_id
complexity
data {
...LotConnectionFragment
}
}
}
```

**Variables**
```json
{
"sku": "xyz789",
"po_id": "xyz789",
"analyze": false
}
```

**Response**
```json
{
"data": {
"expiration_lots": {
"request_id": "abc123",
"complexity": 987,
"data": "LotConnection"
}
}
}
```

---

### `fulfillment_invoice`
Returns a FulfillmentInvoiceQueryResult

**Response**
```json
Returns a FulfillmentInvoiceQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String |
| `analyze` | Boolean |

**Query**
```graphql
query fulfillment_invoice(
$id: String,
$analyze: Boolean
) {
fulfillment_invoice(
id: $id,
analyze: $analyze
) {
request_id
complexity
data {
...FulfillmentInvoiceFragment
}
}
}
```

**Variables**
```json
{"id": "xyz789", "analyze": false}
```

**Response**
```json
{
"data": {
"fulfillment_invoice": {
"request_id": "xyz789",
"complexity": 987,
"data": "FulfillmentInvoice"
}
}
}
```

---

### `fulfillment_invoices`
Returns a FulfillmentInvoicesQueryResult

**Response**
```json
Returns a FulfillmentInvoicesQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `date_from` | ISODateTime |
| `date_to` | ISODateTime |
| `analyze` | Boolean |

**Query**
```graphql
query fulfillment_invoices(
$date_from: ISODateTime,
$date_to: ISODateTime,
$analyze: Boolean
) {
fulfillment_invoices(
date_from: $date_from,
date_to: $date_to,
analyze: $analyze
) {
request_id
complexity
data {
...FulfillmentInvoiceConnectionFragment
}
}
}
```

**Variables**
```json
{
"date_from": ISODateTime,
"date_to": ISODateTime,
"analyze": true
}
```

**Response**
```json
{
"data": {
"fulfillment_invoices": {
"request_id": "xyz789",
"complexity": 123,
"data": "FulfillmentInvoiceConnection"
}
}
}
```

---

### `inventory_changes`
Returns an InventoryChangesQueryResult

**Response**
```json
Returns an InventoryChangesQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `sku` | String |
| `warehouse_id` | String |
| `location_id` | String |
| `location_name` | String |
| `date_from` | ISODateTime |
| `date_to` | ISODateTime |
| `customer_account_id` | String |
| `reason` | String	It performs a contains / like search and requires a date range, with a maximum of 60 days |
| `analyze` | Boolean |

**Query**
```graphql
query inventory_changes(
$sku: String,
$warehouse_id: String,
$location_id: String,
$location_name: String,
$date_from: ISODateTime,
$date_to: ISODateTime,
$customer_account_id: String,
$reason: String,
$analyze: Boolean
) {
inventory_changes(
sku: $sku,
warehouse_id: $warehouse_id,
location_id: $location_id,
location_name: $location_name,
date_from: $date_from,
date_to: $date_to,
customer_account_id: $customer_account_id,
reason: $reason,
analyze: $analyze
) {
request_id
complexity
data {
...InventoryChangeConnectionFragment
}
}
}
```

**Variables**
```json
{
"sku": "abc123",
"warehouse_id": "abc123",
"location_id": "xyz789",
"location_name": "xyz789",
"date_from": ISODateTime,
"date_to": ISODateTime,
"customer_account_id": "abc123",
"reason": "abc123",
"analyze": true
}
```

**Response**
```json
{
"data": {
"inventory_changes": {
"request_id": "xyz789",
"complexity": 123,
"data": "InventoryChangeConnection"
}
}
}
```

---

### `inventory_snapshot`
Returns an InventorySnapshotQueryResult

**Response**
```json
Returns an InventorySnapshotQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `snapshot_id` | String! |
| `analyze` | Boolean |

**Query**
```graphql
query inventory_snapshot(
$snapshot_id: String!,
$analyze: Boolean
) {
inventory_snapshot(
snapshot_id: $snapshot_id,
analyze: $analyze
) {
request_id
complexity
snapshot {
...InventorySnapshotFragment
}
}
}
```

**Variables**
```json
{"snapshot_id": "abc123", "analyze": true}
```

**Response**
```json
{
"data": {
"inventory_snapshot": {
"request_id": "abc123",
"complexity": 987,
"snapshot": "InventorySnapshot"
}
}
}
```

---

### `inventory_snapshots`
Returns an InventorySnapshotsQueryResult

**Response**
```json
Returns an InventorySnapshotsQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `warehouse_id` | String |
| `customer_account_id` | String |
| `status` | String |
| `analyze` | Boolean |

**Query**
```graphql
query inventory_snapshots(
$warehouse_id: String,
$customer_account_id: String,
$status: String,
$analyze: Boolean
) {
inventory_snapshots(
warehouse_id: $warehouse_id,
customer_account_id: $customer_account_id,
status: $status,
analyze: $analyze
) {
request_id
complexity
snapshots {
...InventorySnapshotConnectionFragment
}
}
}
```

**Variables**
```json
{
"warehouse_id": "abc123",
"customer_account_id": "abc123",
"status": "abc123",
"analyze": true
}
```

**Response**
```json
{
"data": {
"inventory_snapshots": {
"request_id": "abc123",
"complexity": 987,
"snapshots": "InventorySnapshotConnection"
}
}
}
```

---

### `inventory_sync_items_status`
Returns an InventorySyncRowsQueryResult

**Response**
```json
Returns an InventorySyncRowsQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String! |
| `status` | String |
| `analyze` | Boolean |

**Query**
```graphql
query inventory_sync_items_status(
$id: String!,
$status: String,
$analyze: Boolean
) {
inventory_sync_items_status(
id: $id,
status: $status,
analyze: $analyze
) {
request_id
complexity
data {
...InventorySyncItemStatusConnectionFragment
}
}
}
```

**Variables**
```json
{
"id": "abc123",
"status": "xyz789",
"analyze": false
}
```

**Response**
```json
{
"data": {
"inventory_sync_items_status": {
"request_id": "xyz789",
"complexity": 987,
"data": "InventorySyncItemStatusConnection"
}
}
}
```

---

### `inventory_sync_status`
Returns an InventorySyncBatchQueryResult

**Response**
```json
Returns an InventorySyncBatchQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String |
| `analyze` | Boolean |

**Query**
```graphql
query inventory_sync_status(
$id: String,
$analyze: Boolean
) {
inventory_sync_status(
id: $id,
analyze: $analyze
) {
request_id
complexity
data {
...InventorySyncStatusFragment
}
}
}
```

**Variables**
```json
{"id": "abc123", "analyze": true}
```

**Response**
```json
{
"data": {
"inventory_sync_status": {
"request_id": "xyz789",
"complexity": 123,
"data": "InventorySyncStatus"
}
}
}
```

---

### `inventory_sync_statuses`
Returns an InventorySyncBatchesQueryResult

**Response**
```json
Returns an InventorySyncBatchesQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `warehouse_id` | String |
| `customer_account_id` | String |
| `status` | String |
| `analyze` | Boolean |

**Query**
```graphql
query inventory_sync_statuses(
$warehouse_id: String,
$customer_account_id: String,
$status: String,
$analyze: Boolean
) {
inventory_sync_statuses(
warehouse_id: $warehouse_id,
customer_account_id: $customer_account_id,
status: $status,
analyze: $analyze
) {
request_id
complexity
data {
...InventorySyncStatusConnectionFragment
}
}
}
```

**Variables**
```json
{
"warehouse_id": "xyz789",
"customer_account_id": "abc123",
"status": "xyz789",
"analyze": true
}
```

**Response**
```json
{
"data": {
"inventory_sync_statuses": {
"request_id": "xyz789",
"complexity": 987,
"data": "InventorySyncStatusConnection"
}
}
}
```

---

### `location`
Returns a LocationQueryResult

**Response**
```json
Returns a LocationQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String |
| `name` | String |
| `analyze` | Boolean |

**Query**
```graphql
query location(
$id: String,
$name: String,
$analyze: Boolean
) {
location(
id: $id,
name: $name,
analyze: $analyze
) {
request_id
complexity
data {
...LocationFragment
}
}
}
```

**Variables**
```json
{
"id": "abc123",
"name": "abc123",
"analyze": false
}
```

**Response**
```json
{
"data": {
"location": {
"request_id": "xyz789",
"complexity": 987,
"data": "Location"
}
}
}
```

---

### `locations`
Returns a LocationsQueryResult

**Response**
```json
Returns a LocationsQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `warehouse_id` | String |
| `sku` | String |
| `name` | String |
| `pickable` | Boolean |
| `sellable` | Boolean |
| `analyze` | Boolean |

**Query**
```graphql
query locations(
$warehouse_id: String,
$sku: String,
$name: String,
$pickable: Boolean,
$sellable: Boolean,
$analyze: Boolean
) {
locations(
warehouse_id: $warehouse_id,
sku: $sku,
name: $name,
pickable: $pickable,
sellable: $sellable,
analyze: $analyze
) {
request_id
complexity
data {
...LocationConnectionFragment
}
}
}
```

**Variables**
```json
{
"warehouse_id": "abc123",
"sku": "xyz789",
"name": "xyz789",
"pickable": true,
"sellable": true,
"analyze": true
}
```

**Response**
```json
{
"data": {
"locations": {
"request_id": "abc123",
"complexity": 987,
"data": "LocationConnection"
}
}
}
```

---

### `me`
Returns a CurrentUserQueryResult

**Response**
```json
Returns a CurrentUserQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `analyze` | Boolean |

**Query**
```graphql
query me($analyze: Boolean) {
me(analyze: $analyze) {
request_id
complexity
data {
...UserFragment
}
}
}
```

**Variables**
```json
{"analyze": true}
```

**Response**
```json
{
"data": {
"me": {
"request_id": "abc123",
"complexity": 123,
"data": "User"
}
}
}
```

---

### `node`
Returns a Node

**Response**
```json
Returns a Node
**Arguments**
| Name | Description |
| --- | --- |
| `id` | ID!	The ID of the object |

**Query**
```graphql
query node($id: ID!) {
node(id: $id) {
id
}
}
```

**Variables**
```json
{"id": "4"}
```

**Response**
```json
{"data": {"node": {"id": "4"}}}
```

---

### `order`
Returns an OrderQueryResult

**Response**
```json
Returns an OrderQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String! |
| `analyze` | Boolean |

**Query**
```graphql
query order(
$id: String!,
$analyze: Boolean
) {
order(
id: $id,
analyze: $analyze
) {
request_id
complexity
data {
...OrderFragment
}
}
}
```

**Variables**
```json
{"id": "abc123", "analyze": false}
```

**Response**
```json
{
"data": {
"order": {
"request_id": "xyz789",
"complexity": 987,
"data": "Order"
}
}
}
```

---

### `order_history`
Returns an OrderHistoryQueryResult

**Response**
```json
Returns an OrderHistoryQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `order_id` | String |
| `user_id` | String |
| `order_number` | String |
| `username` | String |
| `date_from` | Date |
| `date_to` | Date |
| `analyze` | Boolean |

**Query**
```graphql
query order_history(
$order_id: String,
$user_id: String,
$order_number: String,
$username: String,
$date_from: Date,
$date_to: Date,
$analyze: Boolean
) {
order_history(
order_id: $order_id,
user_id: $user_id,
order_number: $order_number,
username: $username,
date_from: $date_from,
date_to: $date_to,
analyze: $analyze
) {
request_id
complexity
data {
...OrderHistoryConnectionFragment
}
}
}
```

**Variables**
```json
{
"order_id": "xyz789",
"user_id": "xyz789",
"order_number": "xyz789",
"username": "xyz789",
"date_from": "2007-12-03",
"date_to": "2007-12-03",
"analyze": true
}
```

**Response**
```json
{
"data": {
"order_history": {
"request_id": "abc123",
"complexity": 987,
"data": "OrderHistoryConnection"
}
}
}
```

---

### `orders`
Returns an OrdersQueryResult

**Response**
```json
Returns an OrdersQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `shop_name` | String |
| `partner_order_id` | String |
| `order_number` | String |
| `warehouse_id` | String |
| `allocated_warehouse_id` | String |
| `fulfillment_status` | String |
| `sku` | String |
| `email` | String |
| `updated_from` | ISODateTime |
| `updated_to` | ISODateTime |
| `order_date_from` | ISODateTime |
| `order_date_to` | ISODateTime |
| `customer_account_id` | String	If you are a 3PL you can specify one of your customer's account |
| `has_hold` | Boolean |
| `operator_hold` | Boolean |
| `address_hold` | Boolean |
| `payment_hold` | Boolean |
| `fraud_hold` | Boolean |
| `ready_to_ship` | Boolean |
| `profile` | String |
| `tag` | String |
| `has_backorder` | Boolean |
| `is_wholesale_order` | Boolean |
| `analyze` | Boolean |

**Query**
```graphql
query orders(
$shop_name: String,
$partner_order_id: String,
$order_number: String,
$warehouse_id: String,
$allocated_warehouse_id: String,
$fulfillment_status: String,
$sku: String,
$email: String,
$updated_from: ISODateTime,
$updated_to: ISODateTime,
$order_date_from: ISODateTime,
$order_date_to: ISODateTime,
$customer_account_id: String,
$has_hold: Boolean,
$operator_hold: Boolean,
$address_hold: Boolean,
$payment_hold: Boolean,
$fraud_hold: Boolean,
$ready_to_ship: Boolean,
$profile: String,
$tag: String,
$has_backorder: Boolean,
$is_wholesale_order: Boolean,
$analyze: Boolean
) {
orders(
shop_name: $shop_name,
partner_order_id: $partner_order_id,
order_number: $order_number,
warehouse_id: $warehouse_id,
allocated_warehouse_id: $allocated_warehouse_id,
fulfillment_status: $fulfillment_status,
sku: $sku,
email: $email,
updated_from: $updated_from,
updated_to: $updated_to,
order_date_from: $order_date_from,
order_date_to: $order_date_to,
customer_account_id: $customer_account_id,
has_hold: $has_hold,
operator_hold: $operator_hold,
address_hold: $address_hold,
payment_hold: $payment_hold,
fraud_hold: $fraud_hold,
ready_to_ship: $ready_to_ship,
profile: $profile,
tag: $tag,
has_backorder: $has_backorder,
is_wholesale_order: $is_wholesale_order,
analyze: $analyze
) {
request_id
complexity
data {
...OrderConnectionFragment
}
}
}
```

**Variables**
```json
{
"shop_name": "xyz789",
"partner_order_id": "abc123",
"order_number": "abc123",
"warehouse_id": "abc123",
"allocated_warehouse_id": "xyz789",
"fulfillment_status": "xyz789",
"sku": "xyz789",
"email": "abc123",
"updated_from": ISODateTime,
"updated_to": ISODateTime,
"order_date_from": ISODateTime,
"order_date_to": ISODateTime,
"customer_account_id": "xyz789",
"has_hold": true,
"operator_hold": false,
"address_hold": true,
"payment_hold": true,
"fraud_hold": false,
"ready_to_ship": false,
"profile": "xyz789",
"tag": "xyz789",
"has_backorder": true,
"is_wholesale_order": false,
"analyze": true
}
```

**Response**
```json
{
"data": {
"orders": {
"request_id": "abc123",
"complexity": 987,
"data": "OrderConnection"
}
}
}
```

---

### `packs_per_day`
Returns a PacksPerDayQueryResult

**Response**
```json
Returns a PacksPerDayQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `warehouse_id` | String |
| `user_id` | String |
| `order_id` | String |
| `order_number` | String |
| `date_from` | ISODateTime |
| `date_to` | ISODateTime |
| `analyze` | Boolean |

**Query**
```graphql
query packs_per_day(
$warehouse_id: String,
$user_id: String,
$order_id: String,
$order_number: String,
$date_from: ISODateTime,
$date_to: ISODateTime,
$analyze: Boolean
) {
packs_per_day(
warehouse_id: $warehouse_id,
user_id: $user_id,
order_id: $order_id,
order_number: $order_number,
date_from: $date_from,
date_to: $date_to,
analyze: $analyze
) {
request_id
complexity
data {
...PackageConnectionFragment
}
}
}
```

**Variables**
```json
{
"warehouse_id": "abc123",
"user_id": "abc123",
"order_id": "xyz789",
"order_number": "abc123",
"date_from": ISODateTime,
"date_to": ISODateTime,
"analyze": true
}
```

**Response**
```json
{
"data": {
"packs_per_day": {
"request_id": "abc123",
"complexity": 123,
"data": "PackageConnection"
}
}
}
```

---

### `picks_per_day`
Returns a PicksPerDayQueryResult

**Response**
```json
Returns a PicksPerDayQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `warehouse_id` | String |
| `date_from` | ISODateTime |
| `date_to` | ISODateTime |
| `analyze` | Boolean |

**Query**
```graphql
query picks_per_day(
$warehouse_id: String,
$date_from: ISODateTime,
$date_to: ISODateTime,
$analyze: Boolean
) {
picks_per_day(
warehouse_id: $warehouse_id,
date_from: $date_from,
date_to: $date_to,
analyze: $analyze
) {
request_id
complexity
data {
...PickConnectionFragment
}
}
}
```

**Variables**
```json
{
"warehouse_id": "abc123",
"date_from": ISODateTime,
"date_to": ISODateTime,
"analyze": true
}
```

**Response**
```json
{
"data": {
"picks_per_day": {
"request_id": "xyz789",
"complexity": 987,
"data": "PickConnection"
}
}
}
```

---

### `product`
Returns a ProductQueryResult

**Response**
```json
Returns a ProductQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String |
| `sku` | String |
| `analyze` | Boolean |

**Query**
```graphql
query product(
$id: String,
$sku: String,
$analyze: Boolean
) {
product(
id: $id,
sku: $sku,
analyze: $analyze
) {
request_id
complexity
data {
...ProductFragment
}
}
}
```

**Variables**
```json
{
"id": "abc123",
"sku": "abc123",
"analyze": false
}
```

**Response**
```json
{
"data": {
"product": {
"request_id": "xyz789",
"complexity": 123,
"data": "Product"
}
}
}
```

---

### `products`
Returns a ProductsQueryResult

**Response**
```json
Returns a ProductsQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `sku` | String |
| `created_from` | ISODateTime |
| `created_to` | ISODateTime |
| `updated_from` | ISODateTime |
| `updated_to` | ISODateTime |
| `customer_account_id` | String	If you are a 3PL you can specify one of your customer's account |
| `has_kits` | Boolean |
| `analyze` | Boolean |

**Query**
```graphql
query products(
$sku: String,
$created_from: ISODateTime,
$created_to: ISODateTime,
$updated_from: ISODateTime,
$updated_to: ISODateTime,
$customer_account_id: String,
$has_kits: Boolean,
$analyze: Boolean
) {
products(
sku: $sku,
created_from: $created_from,
created_to: $created_to,
updated_from: $updated_from,
updated_to: $updated_to,
customer_account_id: $customer_account_id,
has_kits: $has_kits,
analyze: $analyze
) {
request_id
complexity
data {
...ProductConnectionFragment
}
}
}
```

**Variables**
```json
{
"sku": "abc123",
"created_from": ISODateTime,
"created_to": ISODateTime,
"updated_from": ISODateTime,
"updated_to": ISODateTime,
"customer_account_id": "xyz789",
"has_kits": false,
"analyze": true
}
```

**Response**
```json
{
"data": {
"products": {
"request_id": "xyz789",
"complexity": 987,
"data": "ProductConnection"
}
}
}
```

---

### `purchase_order`
Returns a PurchaseOrderQueryResult

**Response**
```json
Returns a PurchaseOrderQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String |
| `po_number` | String |
| `analyze` | Boolean |

**Query**
```graphql
query purchase_order(
$id: String,
$po_number: String,
$analyze: Boolean
) {
purchase_order(
id: $id,
po_number: $po_number,
analyze: $analyze
) {
request_id
complexity
data {
...PurchaseOrderFragment
}
}
}
```

**Variables**
```json
{
"id": "abc123",
"po_number": "abc123",
"analyze": false
}
```

**Response**
```json
{
"data": {
"purchase_order": {
"request_id": "xyz789",
"complexity": 123,
"data": "PurchaseOrder"
}
}
}
```

---

### `purchase_orders`
Returns a PurchaseOrdersQueryResult

**Response**
```json
Returns a PurchaseOrdersQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `sku` | String |
| `warehouse_id` | String |
| `created_from` | ISODateTime |
| `created_to` | ISODateTime |
| `po_date_from` | ISODateTime |
| `po_date_to` | ISODateTime |
| `customer_account_id` | String	If you are a 3PL you can specify one of your customer's account |
| `date_closed_from` | ISODateTime |
| `date_closed_to` | ISODateTime |
| `fulfillment_status` | String |
| `po_number` | String |
| `analyze` | Boolean |

**Query**
```graphql
query purchase_orders(
$sku: String,
$warehouse_id: String,
$created_from: ISODateTime,
$created_to: ISODateTime,
$po_date_from: ISODateTime,
$po_date_to: ISODateTime,
$customer_account_id: String,
$date_closed_from: ISODateTime,
$date_closed_to: ISODateTime,
$fulfillment_status: String,
$po_number: String,
$analyze: Boolean
) {
purchase_orders(
sku: $sku,
warehouse_id: $warehouse_id,
created_from: $created_from,
created_to: $created_to,
po_date_from: $po_date_from,
po_date_to: $po_date_to,
customer_account_id: $customer_account_id,
date_closed_from: $date_closed_from,
date_closed_to: $date_closed_to,
fulfillment_status: $fulfillment_status,
po_number: $po_number,
analyze: $analyze
) {
request_id
complexity
data {
...PurchaseOrderConnectionFragment
}
}
}
```

**Variables**
```json
{
"sku": "abc123",
"warehouse_id": "xyz789",
"created_from": ISODateTime,
"created_to": ISODateTime,
"po_date_from": ISODateTime,
"po_date_to": ISODateTime,
"customer_account_id": "abc123",
"date_closed_from": ISODateTime,
"date_closed_to": ISODateTime,
"fulfillment_status": "xyz789",
"po_number": "abc123",
"analyze": true
}
```

**Response**
```json
{
"data": {
"purchase_orders": {
"request_id": "xyz789",
"complexity": 987,
"data": "PurchaseOrderConnection"
}
}
}
```

---

### `return`
Returns a ReturnQueryResult

**Response**
```json
Returns a ReturnQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String! |
| `analyze` | Boolean |

**Query**
```graphql
query return(
$id: String!,
$analyze: Boolean
) {
return(
id: $id,
analyze: $analyze
) {
request_id
complexity
data {
...ReturnFragment
}
}
}
```

**Variables**
```json
{"id": "xyz789", "analyze": false}
```

**Response**
```json
{
"data": {
"return": {
"request_id": "xyz789",
"complexity": 987,
"data": "Return"
}
}
}
```

---

### `return_exchange`
Returns a ReturnExchangeQueryResult

**Response**
```json
Returns a ReturnExchangeQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String! |
| `analyze` | Boolean |

**Query**
```graphql
query return_exchange(
$id: String!,
$analyze: Boolean
) {
return_exchange(
id: $id,
analyze: $analyze
) {
request_id
complexity
data {
...ReturnExchangeFragment
}
}
}
```

**Variables**
```json
{"id": "xyz789", "analyze": true}
```

**Response**
```json
{
"data": {
"return_exchange": {
"request_id": "abc123",
"complexity": 987,
"data": "ReturnExchange"
}
}
}
```

---

### `returns`
Returns a ReturnsQueryResult

**Response**
```json
Returns a ReturnsQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `order_id` | String |
| `warehouse_id` | String |
| `date_from` | ISODateTime |
| `date_to` | ISODateTime |
| `customer_account_id` | String	If you are a 3PL you can specify one of your customer's account |
| `tracking_number` | String |
| `analyze` | Boolean |

**Query**
```graphql
query returns(
$order_id: String,
$warehouse_id: String,
$date_from: ISODateTime,
$date_to: ISODateTime,
$customer_account_id: String,
$tracking_number: String,
$analyze: Boolean
) {
returns(
order_id: $order_id,
warehouse_id: $warehouse_id,
date_from: $date_from,
date_to: $date_to,
customer_account_id: $customer_account_id,
tracking_number: $tracking_number,
analyze: $analyze
) {
request_id
complexity
data {
...ReturnConnectionFragment
}
}
}
```

**Variables**
```json
{
"order_id": "xyz789",
"warehouse_id": "abc123",
"date_from": ISODateTime,
"date_to": ISODateTime,
"customer_account_id": "xyz789",
"tracking_number": "abc123",
"analyze": true
}
```

**Response**
```json
{
"data": {
"returns": {
"request_id": "xyz789",
"complexity": 987,
"data": "ReturnConnection"
}
}
}
```

---

### `shipment`
Returns a ShipmentQueryResult

**Response**
```json
Returns a ShipmentQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String |
| `analyze` | Boolean |

**Query**
```graphql
query shipment(
$id: String,
$analyze: Boolean
) {
shipment(
id: $id,
analyze: $analyze
) {
request_id
complexity
data {
...ShipmentFragment
}
}
}
```

**Variables**
```json
{"id": "abc123", "analyze": false}
```

**Response**
```json
{
"data": {
"shipment": {
"request_id": "xyz789",
"complexity": 987,
"data": "Shipment"
}
}
}
```

---

### `shipments`
Returns a ShipmentsQueryResult

**Response**
```json
Returns a ShipmentsQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `customer_account_id` | String	If you are a 3PL you can specify one of your customer's account |
| `order_id` | String |
| `date_from` | ISODateTime |
| `date_to` | ISODateTime |
| `order_date_from` | ISODateTime |
| `order_date_to` | ISODateTime |
| `tracking_number` | String |
| `alternate_tracking_id` | String |
| `voided` | Boolean |
| `analyze` | Boolean |

**Query**
```graphql
query shipments(
$customer_account_id: String,
$order_id: String,
$date_from: ISODateTime,
$date_to: ISODateTime,
$order_date_from: ISODateTime,
$order_date_to: ISODateTime,
$tracking_number: String,
$alternate_tracking_id: String,
$voided: Boolean,
$analyze: Boolean
) {
shipments(
customer_account_id: $customer_account_id,
order_id: $order_id,
date_from: $date_from,
date_to: $date_to,
order_date_from: $order_date_from,
order_date_to: $order_date_to,
tracking_number: $tracking_number,
alternate_tracking_id: $alternate_tracking_id,
voided: $voided,
analyze: $analyze
) {
request_id
complexity
data {
...ShipmentConnectionFragment
}
}
}
```

**Variables**
```json
{
"customer_account_id": "xyz789",
"order_id": "abc123",
"date_from": ISODateTime,
"date_to": ISODateTime,
"order_date_from": ISODateTime,
"order_date_to": ISODateTime,
"tracking_number": "abc123",
"alternate_tracking_id": "abc123",
"voided": true,
"analyze": true
}
```

**Response**
```json
{
"data": {
"shipments": {
"request_id": "xyz789",
"complexity": 123,
"data": "ShipmentConnection"
}
}
}
```

---

### `shipping_container`
Returns a ShippingContainerQueryResult

**Response**
```json
Returns a ShippingContainerQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String |
| `analyze` | Boolean |

**Query**
```graphql
query shipping_container(
$id: String,
$analyze: Boolean
) {
shipping_container(
id: $id,
analyze: $analyze
) {
request_id
complexity
data {
...ShippingContainerFragment
}
}
}
```

**Variables**
```json
{"id": "abc123", "analyze": true}
```

**Response**
```json
{
"data": {
"shipping_container": {
"request_id": "abc123",
"complexity": 987,
"data": "ShippingContainer"
}
}
}
```

---

### `shipping_containers`
Returns a ShippingContainersQueryResult

**Response**
```json
Returns a ShippingContainersQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `warehouse_id` | String |
| `carrier` | String |
| `shipping_method` | String |
| `created_from` | ISODateTime |
| `created_to` | ISODateTime |
| `updated_from` | ISODateTime |
| `updated_to` | ISODateTime |
| `shipped_date_from` | ISODateTime |
| `shipped_date_to` | ISODateTime |
| `analyze` | Boolean |

**Query**
```graphql
query shipping_containers(
$warehouse_id: String,
$carrier: String,
$shipping_method: String,
$created_from: ISODateTime,
$created_to: ISODateTime,
$updated_from: ISODateTime,
$updated_to: ISODateTime,
$shipped_date_from: ISODateTime,
$shipped_date_to: ISODateTime,
$analyze: Boolean
) {
shipping_containers(
warehouse_id: $warehouse_id,
carrier: $carrier,
shipping_method: $shipping_method,
created_from: $created_from,
created_to: $created_to,
updated_from: $updated_from,
updated_to: $updated_to,
shipped_date_from: $shipped_date_from,
shipped_date_to: $shipped_date_to,
analyze: $analyze
) {
request_id
complexity
data {
...ShippingContainerConnectionFragment
}
}
}
```

**Variables**
```json
{
"warehouse_id": "abc123",
"carrier": "xyz789",
"shipping_method": "xyz789",
"created_from": ISODateTime,
"created_to": ISODateTime,
"updated_from": ISODateTime,
"updated_to": ISODateTime,
"shipped_date_from": ISODateTime,
"shipped_date_to": ISODateTime,
"analyze": true
}
```

**Response**
```json
{
"data": {
"shipping_containers": {
"request_id": "xyz789",
"complexity": 987,
"data": "ShippingContainerConnection"
}
}
}
```

---

### `shipping_plan`
Returns a ShippingPlanQueryResult

**Response**
```json
Returns a ShippingPlanQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String |
| `analyze` | Boolean |

**Query**
```graphql
query shipping_plan(
$id: String,
$analyze: Boolean
) {
shipping_plan(
id: $id,
analyze: $analyze
) {
request_id
complexity
data {
...ShippingPlanFragment
}
}
}
```

**Variables**
```json
{"id": "abc123", "analyze": false}
```

**Response**
```json
{
"data": {
"shipping_plan": {
"request_id": "abc123",
"complexity": 987,
"data": "ShippingPlan"
}
}
}
```

---

### `tote`
Returns a ToteContentQueryResult

**Response**
```json
Returns a ToteContentQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `barcode` | String! |
| `analyze` | Boolean |

**Query**
```graphql
query tote(
$barcode: String!,
$analyze: Boolean
) {
tote(
barcode: $barcode,
analyze: $analyze
) {
request_id
complexity
data {
...ToteFragment
}
}
}
```

**Variables**
```json
{"barcode": "abc123", "analyze": false}
```

**Response**
```json
{
"data": {
"tote": {
"request_id": "xyz789",
"complexity": 123,
"data": "Tote"
}
}
}
```

---

### `tote_history`
Returns a ToteHistoryQueryResult

**Response**
```json
Returns a ToteHistoryQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `tote_name` | String |
| `tote_id` | String |
| `date_from` | ISODateTime |
| `date_to` | ISODateTime |
| `analyze` | Boolean |

**Query**
```graphql
query tote_history(
$tote_name: String,
$tote_id: String,
$date_from: ISODateTime,
$date_to: ISODateTime,
$analyze: Boolean
) {
tote_history(
tote_name: $tote_name,
tote_id: $tote_id,
date_from: $date_from,
date_to: $date_to,
analyze: $analyze
) {
request_id
complexity
data {
...ToteHistoryConnectionFragment
}
}
}
```

**Variables**
```json
{
"tote_name": "xyz789",
"tote_id": "abc123",
"date_from": ISODateTime,
"date_to": ISODateTime,
"analyze": false
}
```

**Response**
```json
{
"data": {
"tote_history": {
"request_id": "abc123",
"complexity": 987,
"data": "ToteHistoryConnection"
}
}
}
```

---

### `user_quota`
Returns a UserQuota

**Response**
```json
Returns a UserQuota

**Query**
```graphql
query user_quota {
user_quota {
is_expired
expiration_date
time_remaining
credits_remaining
max_available
increment_rate
}
}
```

**Response**
```json
{
"data": {
"user_quota": {
"is_expired": true,
"expiration_date": ISODateTime,
"time_remaining": "xyz789",
"credits_remaining": 123,
"max_available": 123,
"increment_rate": 123
}
}
}
```

---

### `uuid`
Returns a LegacyIdQueryResult

**Response**
```json
Returns a LegacyIdQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `legacy_id` | Int! |
| `entity` | EntityType! |
| `analyze` | Boolean |

**Query**
```graphql
query uuid(
$legacy_id: Int!,
$entity: EntityType!,
$analyze: Boolean
) {
uuid(
legacy_id: $legacy_id,
entity: $entity,
analyze: $analyze
) {
request_id
complexity
data {
...LegacyIdFragment
}
}
}
```

**Variables**
```json
{"legacy_id": 987, "entity": "Account", "analyze": true}
```

**Response**
```json
{
"data": {
"uuid": {
"request_id": "xyz789",
"complexity": 123,
"data": "LegacyId"
}
}
}
```

---

### `vendors`
Returns a VendorsQueryResult

**Response**
```json
Returns a VendorsQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `analyze` | Boolean |

**Query**
```graphql
query vendors($analyze: Boolean) {
vendors(analyze: $analyze) {
request_id
complexity
data {
...VendorConnectionFragment
}
}
}
```

**Variables**
```json
{"analyze": true}
```

**Response**
```json
{
"data": {
"vendors": {
"request_id": "xyz789",
"complexity": 123,
"data": "VendorConnection"
}
}
}
```

---

### `warehouse_products`
Returns a WarehouseProductsQueryResult

**Response**
```json
Returns a WarehouseProductsQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `warehouse_id` | String |
| `active` | Boolean |
| `sku` | String |
| `customer_account_id` | String	If you are a 3PL you can specify one of your customer's account |
| `created_from` | ISODateTime |
| `created_to` | ISODateTime |
| `updated_from` | ISODateTime |
| `updated_to` | ISODateTime |
| `analyze` | Boolean |

**Query**
```graphql
query warehouse_products(
$warehouse_id: String,
$active: Boolean,
$sku: String,
$customer_account_id: String,
$created_from: ISODateTime,
$created_to: ISODateTime,
$updated_from: ISODateTime,
$updated_to: ISODateTime,
$analyze: Boolean
) {
warehouse_products(
warehouse_id: $warehouse_id,
active: $active,
sku: $sku,
customer_account_id: $customer_account_id,
created_from: $created_from,
created_to: $created_to,
updated_from: $updated_from,
updated_to: $updated_to,
analyze: $analyze
) {
request_id
complexity
data {
...WarehouseProductConnectionFragment
}
}
}
```

**Variables**
```json
{
"warehouse_id": "xyz789",
"active": true,
"sku": "abc123",
"customer_account_id": "xyz789",
"created_from": ISODateTime,
"created_to": ISODateTime,
"updated_from": ISODateTime,
"updated_to": ISODateTime,
"analyze": true
}
```

**Response**
```json
{
"data": {
"warehouse_products": {
"request_id": "abc123",
"complexity": 987,
"data": "WarehouseProductConnection"
}
}
}
```

---

### `webhooks`
Returns a WebhooksQueryResult

**Response**
```json
Returns a WebhooksQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `customer_account_id` | String	If you are a 3PL you can specify one of your customer's account |
| `analyze` | Boolean |

**Query**
```graphql
query webhooks(
$customer_account_id: String,
$analyze: Boolean
) {
webhooks(
customer_account_id: $customer_account_id,
analyze: $analyze
) {
request_id
complexity
data {
...WebhookConnectionFragment
}
}
}
```

**Variables**
```json
{
"customer_account_id": "abc123",
"analyze": true
}
```

**Response**
```json
{
"data": {
"webhooks": {
"request_id": "xyz789",
"complexity": 987,
"data": "WebhookConnection"
}
}
}
```

---

### `wholesale_order`
Returns a WholesaleOrderQueryResult

**Response**
```json
Returns a WholesaleOrderQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | String! |
| `analyze` | Boolean |

**Query**
```graphql
query wholesale_order(
$id: String!,
$analyze: Boolean
) {
wholesale_order(
id: $id,
analyze: $analyze
) {
request_id
complexity
data {
...WholesaleOrderFragment
}
}
}
```

**Variables**
```json
{"id": "abc123", "analyze": false}
```

**Response**
```json
{
"data": {
"wholesale_order": {
"request_id": "abc123",
"complexity": 123,
"data": "WholesaleOrder"
}
}
}
```

---

### `wholesale_orders`
Returns a WholesaleOrdersQueryResult

**Response**
```json
Returns a WholesaleOrdersQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `customer_account_id` | String	If you are a 3PL you can specify one of your customer's account |
| `partner_order_id` | String |
| `updated_from` | ISODateTime |
| `updated_to` | ISODateTime |
| `order_date_from` | ISODateTime |
| `order_date_to` | ISODateTime |
| `analyze` | Boolean |

**Query**
```graphql
query wholesale_orders(
$customer_account_id: String,
$partner_order_id: String,
$updated_from: ISODateTime,
$updated_to: ISODateTime,
$order_date_from: ISODateTime,
$order_date_to: ISODateTime,
$analyze: Boolean
) {
wholesale_orders(
customer_account_id: $customer_account_id,
partner_order_id: $partner_order_id,
updated_from: $updated_from,
updated_to: $updated_to,
order_date_from: $order_date_from,
order_date_to: $order_date_to,
analyze: $analyze
) {
request_id
complexity
data {
...WholesaleOrderConnectionFragment
}
}
}
```

**Variables**
```json
{
"customer_account_id": "abc123",
"partner_order_id": "xyz789",
"updated_from": ISODateTime,
"updated_to": ISODateTime,
"order_date_from": ISODateTime,
"order_date_to": ISODateTime,
"analyze": false
}
```

**Response**
```json
{
"data": {
"wholesale_orders": {
"request_id": "abc123",
"complexity": 987,
"data": "WholesaleOrderConnection"
}
}
}
```

---

### `work_order`
Returns a WorkOrderQueryResult

**Response**
```json
Returns a WorkOrderQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `id` | Int! |
| `analyze` | Boolean |

**Query**
```graphql
query work_order(
$id: Int!,
$analyze: Boolean
) {
work_order(
id: $id,
analyze: $analyze
) {
request_id
complexity
data {
...WorkOrderIdentifiableTypeFragment
}
}
}
```

**Variables**
```json
{"id": 987, "analyze": true}
```

**Response**
```json
{
"data": {
"work_order": {
"request_id": "abc123",
"complexity": 123,
"data": "WorkOrderIdentifiableType"
}
}
}
```

---

### `work_orders`
Returns a WorkOrdersQueryResult

**Response**
```json
Returns a WorkOrdersQueryResult
**Arguments**
| Name | Description |
| --- | --- |
| `status` | [String] |
| `wo_type` | [String] |
| `requested_date_from` | ISODateTime |
| `requested_date_to` | ISODateTime |
| `updated_at_from` | ISODateTime |
| `updated_at_to` | ISODateTime |
| `customer_account_id` | Int |
| `analyze` | Boolean |

**Query**
```graphql
query work_orders(
$status: [String],
$wo_type: [String],
$requested_date_from: ISODateTime,
$requested_date_to: ISODateTime,
$updated_at_from: ISODateTime,
$updated_at_to: ISODateTime,
$customer_account_id: Int,
$analyze: Boolean
) {
work_orders(
status: $status,
wo_type: $wo_type,
requested_date_from: $requested_date_from,
requested_date_to: $requested_date_to,
updated_at_from: $updated_at_from,
updated_at_to: $updated_at_to,
customer_account_id: $customer_account_id,
analyze: $analyze
) {
request_id
complexity
data {
...WorkOrderIdentifiableTypeConnectionFragment
}
}
}
```

**Variables**
```json
{
"status": ["abc123"],
"wo_type": ["abc123"],
"requested_date_from": ISODateTime,
"requested_date_to": ISODateTime,
"updated_at_from": ISODateTime,
"updated_at_to": ISODateTime,
"customer_account_id": 123,
"analyze": false
}
```

**Response**
```json
{
"data": {
"work_orders": {
"request_id": "abc123",
"complexity": 123,
"data": "WorkOrderIdentifiableTypeConnection"
}
}
}
Mutations
bill_create
**Response**
```json
Returns a CreateBillOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateBillInput! |

**Query**
```graphql
mutation bill_create($data: CreateBillInput!) {
bill_create(data: $data) {
request_id
complexity
bill {
...BillFragment
}
}
}
```

**Variables**
```json
{"data": CreateBillInput}
```

**Response**
```json
{
"data": {
"bill_create": {
"request_id": "abc123",
"complexity": 987,
"bill": Bill
}
}
}
Mutations
bill_delete
**Response**
```json
Returns a MutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | DeleteBillInput! |

**Query**
```graphql
mutation bill_delete($data: DeleteBillInput!) {
bill_delete(data: $data) {
request_id
complexity
}
}
```

**Variables**
```json
{"data": DeleteBillInput}
```

**Response**
```json
{
"data": {
"bill_delete": {
"request_id": "abc123",
"complexity": 987
}
}
}
Mutations
bill_recalculate
**Response**
```json
Returns a RecalculateBillOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | RecalculateBillInput! |

**Query**
```graphql
mutation bill_recalculate($data: RecalculateBillInput!) {
bill_recalculate(data: $data) {
request_id
complexity
bill {
...BillFragment
}
}
}
```

**Variables**
```json
{"data": RecalculateBillInput}
```

**Response**
```json
{
"data": {
"bill_recalculate": {
"request_id": "abc123",
"complexity": 987,
"bill": Bill
}
}
}
Mutations
bill_submit
**Response**
```json
Returns a MutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | SubmitBillInput! |

**Query**
```graphql
mutation bill_submit($data: SubmitBillInput!) {
bill_submit(data: $data) {
request_id
complexity
}
}
```

**Variables**
```json
{"data": SubmitBillInput}
```

**Response**
```json
{
"data": {
"bill_submit": {
"request_id": "xyz789",
"complexity": 987
}
}
}
Mutations
bill_update
**Response**
```json
Returns a MutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateBillInput! |

**Query**
```graphql
mutation bill_update($data: UpdateBillInput!) {
bill_update(data: $data) {
request_id
complexity
}
}
```

**Variables**
```json
{"data": UpdateBillInput}
```

**Response**
```json
{
"data": {
"bill_update": {
"request_id": "abc123",
"complexity": 123
}
}
}
Mutations
inventory_abort_snapshot
**Response**
```json
Returns an InventorySnapshotOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | InventoryAbortSnapshotInput! |

**Query**
```graphql
mutation inventory_abort_snapshot($data: InventoryAbortSnapshotInput!) {
inventory_abort_snapshot(data: $data) {
request_id
complexity
snapshot {
...InventorySnapshotFragment
}
}
}
```

**Variables**
```json
{"data": InventoryAbortSnapshotInput}
```

**Response**
```json
{
"data": {
"inventory_abort_snapshot": {
"request_id": "abc123",
"complexity": 987,
"snapshot": "InventorySnapshot"
}
}
}
Mutations
inventory_add
**Response**
```json
Returns an UpdateInventoryOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateInventoryInput! |

**Query**
```graphql
mutation inventory_add($data: UpdateInventoryInput!) {
inventory_add(data: $data) {
request_id
complexity
warehouse_product {
...WarehouseProductFragment
}
}
}
```

**Variables**
```json
{"data": UpdateInventoryInput}
```

**Response**
```json
{
"data": {
"inventory_add": {
"request_id": "xyz789",
"complexity": 987,
"warehouse_product": WarehouseProduct
}
}
}
Mutations
inventory_generate_snapshot
**Response**
```json
Returns an InventorySnapshotOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | InventoryGenerateSnapshotInput! |

**Query**
```graphql
mutation inventory_generate_snapshot($data: InventoryGenerateSnapshotInput!) {
inventory_generate_snapshot(data: $data) {
request_id
complexity
snapshot {
...InventorySnapshotFragment
}
}
}
```

**Variables**
```json
{"data": InventoryGenerateSnapshotInput}
```

**Response**
```json
{
"data": {
"inventory_generate_snapshot": {
"request_id": "xyz789",
"complexity": 123,
"snapshot": "InventorySnapshot"
}
}
}
Mutations
inventory_remove
**Response**
```json
Returns an UpdateInventoryOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateInventoryInput! |

**Query**
```graphql
mutation inventory_remove($data: UpdateInventoryInput!) {
inventory_remove(data: $data) {
request_id
complexity
warehouse_product {
...WarehouseProductFragment
}
}
}
```

**Variables**
```json
{"data": UpdateInventoryInput}
```

**Response**
```json
{
"data": {
"inventory_remove": {
"request_id": "xyz789",
"complexity": 987,
"warehouse_product": WarehouseProduct
}
}
}
Mutations
inventory_replace
**Response**
```json
Returns an UpdateInventoryOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | ReplaceInventoryInput! |

**Query**
```graphql
mutation inventory_replace($data: ReplaceInventoryInput!) {
inventory_replace(data: $data) {
request_id
complexity
warehouse_product {
...WarehouseProductFragment
}
}
}
```

**Variables**
```json
{"data": ReplaceInventoryInput}
```

**Response**
```json
{
"data": {
"inventory_replace": {
"request_id": "abc123",
"complexity": 123,
"warehouse_product": WarehouseProduct
}
}
}
Mutations
inventory_subtract
**Response**
```json
Returns an UpdateInventoryOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateInventoryInput! |

**Query**
```graphql
mutation inventory_subtract($data: UpdateInventoryInput!) {
inventory_subtract(data: $data) {
request_id
complexity
warehouse_product {
...WarehouseProductFragment
}
}
}
```

**Variables**
```json
{"data": UpdateInventoryInput}
```

**Response**
```json
{
"data": {
"inventory_subtract": {
"request_id": "xyz789",
"complexity": 123,
"warehouse_product": WarehouseProduct
}
}
}
Mutations
inventory_sync
**Response**
```json
Returns an InventorySyncOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | InventorySyncInput! |

**Query**
```graphql
mutation inventory_sync($data: InventorySyncInput!) {
inventory_sync(data: $data) {
request_id
complexity
sync_id
}
}
```

**Variables**
```json
{"data": InventorySyncInput}
```

**Response**
```json
{
"data": {
"inventory_sync": {
"request_id": "xyz789",
"complexity": 987,
"sync_id": "abc123"
}
}
}
Mutations
inventory_sync_abort
**Response**
```json
Returns an AbortInventorySyncOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | AbortInventorySyncInput! |

**Query**
```graphql
mutation inventory_sync_abort($data: AbortInventorySyncInput!) {
inventory_sync_abort(data: $data) {
request_id
complexity
sync {
...InventorySyncStatusFragment
}
}
}
```

**Variables**
```json
{"data": AbortInventorySyncInput}
```

**Response**
```json
{
"data": {
"inventory_sync_abort": {
"request_id": "xyz789",
"complexity": 123,
"sync": InventorySyncStatus
}
}
}
Mutations
inventory_transfer
**Response**
```json
Returns a TransferInventoryOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | TransferInventoryInput! |

**Query**
```graphql
mutation inventory_transfer($data: TransferInventoryInput!) {
inventory_transfer(data: $data) {
request_id
complexity
ok
}
}
```

**Variables**
```json
{"data": TransferInventoryInput}
```

**Response**
```json
{
"data": {
"inventory_transfer": {
"request_id": "xyz789",
"complexity": 123,
"ok": false
}
}
}
Mutations
kit_build
**Response**
```json
Returns a ProductMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | BuildKitInput! |

**Query**
```graphql
mutation kit_build($data: BuildKitInput!) {
kit_build(data: $data) {
request_id
complexity
product {
...ProductFragment
}
}
}
```

**Variables**
```json
{"data": BuildKitInput}
```

**Response**
```json
{
"data": {
"kit_build": {
"request_id": "xyz789",
"complexity": 987,
"product": Product
}
}
}
Mutations
kit_clear
**Response**
```json
Returns a MutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | ClearKitInput! |

**Query**
```graphql
mutation kit_clear($data: ClearKitInput!) {
kit_clear(data: $data) {
request_id
complexity
}
}
```

**Variables**
```json
{"data": ClearKitInput}
```

**Response**
```json
{
"data": {
"kit_clear": {
"request_id": "abc123",
"complexity": 123
}
}
}
Mutations
kit_remove_components
**Response**
```json
Returns a ProductMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | RemoveKitComponentsInput! |

**Query**
```graphql
mutation kit_remove_components($data: RemoveKitComponentsInput!) {
kit_remove_components(data: $data) {
request_id
complexity
product {
...ProductFragment
}
}
}
```

**Variables**
```json
{"data": RemoveKitComponentsInput}
```

**Response**
```json
{
"data": {
"kit_remove_components": {
"request_id": "xyz789",
"complexity": 987,
"product": Product
}
}
}
Mutations
location_create
**Response**
```json
Returns a LocationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateLocationInput! |

**Query**
```graphql
mutation location_create($data: CreateLocationInput!) {
location_create(data: $data) {
request_id
complexity
location {
...LocationFragment
}
}
}
```

**Variables**
```json
{"data": CreateLocationInput}
```

**Response**
```json
{
"data": {
"location_create": {
"request_id": "xyz789",
"complexity": 987,
"location": Location
}
}
}
Mutations
location_update
**Response**
```json
Returns a LocationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateLocationInput! |

**Query**
```graphql
mutation location_update($data: UpdateLocationInput!) {
location_update(data: $data) {
request_id
complexity
location {
...LocationFragment
}
}
}
```

**Variables**
```json
{"data": UpdateLocationInput}
```

**Response**
```json
{
"data": {
"location_update": {
"request_id": "xyz789",
"complexity": 987,
"location": Location
}
}
}
Mutations
lot_assign_to_location
**Response**
```json
Returns an AssignLotToLocationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | AssignLotToLocationInput! |

**Query**
```graphql
mutation lot_assign_to_location($data: AssignLotToLocationInput!) {
lot_assign_to_location(data: $data) {
request_id
complexity
warehouse_product {
...WarehouseProductFragment
}
}
}
```

**Variables**
```json
{"data": AssignLotToLocationInput}
```

**Response**
```json
{
"data": {
"lot_assign_to_location": {
"request_id": "abc123",
"complexity": 987,
"warehouse_product": WarehouseProduct
}
}
}
Mutations
lot_create
**Response**
```json
Returns a CreateLotOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateLotInput! |

**Query**
```graphql
mutation lot_create($data: CreateLotInput!) {
lot_create(data: $data) {
request_id
complexity
lot {
...LotFragment
}
}
}
```

**Variables**
```json
{"data": CreateLotInput}
```

**Response**
```json
{
"data": {
"lot_create": {
"request_id": "abc123",
"complexity": 123,
"lot": Lot
}
}
}
Mutations
lot_delete
**Response**
```json
Returns a DeleteLotOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | DeleteLotInput! |

**Query**
```graphql
mutation lot_delete($data: DeleteLotInput!) {
lot_delete(data: $data) {
request_id
complexity
lot {
...LotFragment
}
}
}
```

**Variables**
```json
{"data": DeleteLotInput}
```

**Response**
```json
{
"data": {
"lot_delete": {
"request_id": "xyz789",
"complexity": 987,
"lot": Lot
}
}
}
Mutations
lot_update
**Response**
```json
Returns an UpdateLotOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateLotInput! |

**Query**
```graphql
mutation lot_update($data: UpdateLotInput!) {
lot_update(data: $data) {
request_id
complexity
lot {
...LotFragment
}
}
}
```

**Variables**
```json
{"data": UpdateLotInput}
```

**Response**
```json
{
"data": {
"lot_update": {
"request_id": "xyz789",
"complexity": 987,
"lot": Lot
}
}
}
Mutations
lots_update
**Response**
```json
Returns an UpdateLotsOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateLotsInput! |

**Query**
```graphql
mutation lots_update($data: UpdateLotsInput!) {
lots_update(data: $data) {
request_id
complexity
ok
}
}
```

**Variables**
```json
{"data": UpdateLotsInput}
```

**Response**
```json
{
"data": {
"lots_update": {
"request_id": "abc123",
"complexity": 987,
"ok": true
}
}
}
Mutations
node
**Response**
```json
Returns a Node
**Arguments**
| Name | Description |
| --- | --- |
| `id` | ID!	The ID of the object |

**Query**
```graphql
mutation node($id: ID!) {
node(id: $id) {
id
}
}
```

**Variables**
```json
{"id": 4}
```

**Response**
```json
{"data": {"node": {"id": "4"}}}
Mutations
order_add_attachment
**Response**
```json
Returns an OrderAddAttachmentOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | OrderAddAttachmentInput! |

**Query**
```graphql
mutation order_add_attachment($data: OrderAddAttachmentInput!) {
order_add_attachment(data: $data) {
request_id
complexity
attachment {
...OrderAttachmentFragment
}
}
}
```

**Variables**
```json
{"data": OrderAddAttachmentInput}
```

**Response**
```json
{
"data": {
"order_add_attachment": {
"request_id": "xyz789",
"complexity": 987,
"attachment": OrderAttachment
}
}
}
Mutations
order_add_history_entry
**Response**
```json
Returns an OrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | AddHistoryInput! |

**Query**
```graphql
mutation order_add_history_entry($data: AddHistoryInput!) {
order_add_history_entry(data: $data) {
request_id
complexity
order {
...OrderFragment
}
}
}
```

**Variables**
```json
{"data": AddHistoryInput}
```

**Response**
```json
{
"data": {
"order_add_history_entry": {
"request_id": "xyz789",
"complexity": 987,
"order": Order
}
}
}
Mutations
order_add_line_items
**Response**
```json
Returns an OrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | AddLineItemsInput! |

**Query**
```graphql
mutation order_add_line_items($data: AddLineItemsInput!) {
order_add_line_items(data: $data) {
request_id
complexity
order {
...OrderFragment
}
}
}
```

**Variables**
```json
{"data": AddLineItemsInput}
```

**Response**
```json
{
"data": {
"order_add_line_items": {
"request_id": "xyz789",
"complexity": 987,
"order": Order
}
}
}
Mutations
order_add_tags
**Response**
```json
Returns an OrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateTagsInput! |

**Query**
```graphql
mutation order_add_tags($data: UpdateTagsInput!) {
order_add_tags(data: $data) {
request_id
complexity
order {
...OrderFragment
}
}
}
```

**Variables**
```json
{"data": UpdateTagsInput}
```

**Response**
```json
{
"data": {
"order_add_tags": {
"request_id": "abc123",
"complexity": 987,
"order": Order
}
}
}
Mutations
order_bulk_add_tags
**Response**
```json
Returns a BulkMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | BulkUpdateTagsInput! |

**Query**
```graphql
mutation order_bulk_add_tags($data: BulkUpdateTagsInput!) {
order_bulk_add_tags(data: $data) {
request_id
complexity
errors {
...OperationErrorFragment
}
}
}
```

**Variables**
```json
{"data": BulkUpdateTagsInput}
```

**Response**
```json
{
"data": {
"order_bulk_add_tags": {
"request_id": "xyz789",
"complexity": 987,
"errors": [OperationError]
}
}
}
Mutations
order_bulk_remove_tags
**Response**
```json
Returns a BulkMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | BulkUpdateTagsInput! |

**Query**
```graphql
mutation order_bulk_remove_tags($data: BulkUpdateTagsInput!) {
order_bulk_remove_tags(data: $data) {
request_id
complexity
errors {
...OperationErrorFragment
}
}
}
```

**Variables**
```json
{"data": BulkUpdateTagsInput}
```

**Response**
```json
{
"data": {
"order_bulk_remove_tags": {
"request_id": "xyz789",
"complexity": 987,
"errors": [OperationError]
}
}
}
Mutations
order_cancel
**Response**
```json
Returns an OrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CancelOrderInput! |

**Query**
```graphql
mutation order_cancel($data: CancelOrderInput!) {
order_cancel(data: $data) {
request_id
complexity
order {
...OrderFragment
}
}
}
```

**Variables**
```json
{"data": CancelOrderInput}
```

**Response**
```json
{
"data": {
"order_cancel": {
"request_id": "xyz789",
"complexity": 987,
"order": Order
}
}
}
Mutations
order_change_warehouse
**Response**
```json
Returns an OrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | ChangeOrderWarehouseInput! |

**Query**
```graphql
mutation order_change_warehouse($data: ChangeOrderWarehouseInput!) {
order_change_warehouse(data: $data) {
request_id
complexity
order {
...OrderFragment
}
}
}
```

**Variables**
```json
{"data": ChangeOrderWarehouseInput}
```

**Response**
```json
{
"data": {
"order_change_warehouse": {
"request_id": "abc123",
"complexity": 123,
"order": Order
}
}
}
Mutations
order_clear_tags
**Response**
```json
Returns an OrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateOrderInputBase! |

**Query**
```graphql
mutation order_clear_tags($data: UpdateOrderInputBase!) {
order_clear_tags(data: $data) {
request_id
complexity
order {
...OrderFragment
}
}
}
```

**Variables**
```json
{"data": UpdateOrderInputBase}
```

**Response**
```json
{
"data": {
"order_clear_tags": {
"request_id": "abc123",
"complexity": 123,
"order": Order
}
}
}
Mutations
order_create
**Response**
```json
Returns an OrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateOrderInput! |

**Query**
```graphql
mutation order_create($data: CreateOrderInput!) {
order_create(data: $data) {
request_id
complexity
order {
...OrderFragment
}
}
}
```

**Variables**
```json
{"data": CreateOrderInput}
```

**Response**
```json
{
"data": {
"order_create": {
"request_id": "xyz789",
"complexity": 123,
"order": Order
}
}
}
Mutations
order_fulfill
**Response**
```json
Returns an OrderShipmentMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | FulfillOrderInput! |

**Query**
```graphql
mutation order_fulfill($data: FulfillOrderInput!) {
order_fulfill(data: $data) {
request_id
complexity
shipment {
...ShipmentFragment
}
}
}
```

**Variables**
```json
{"data": FulfillOrderInput}
```

**Response**
```json
{
"data": {
"order_fulfill": {
"request_id": "xyz789",
"complexity": 987,
"shipment": Shipment
}
}
}
Mutations
order_remove_line_items
**Response**
```json
Returns an OrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | RemoveLineItemsInput! |

**Query**
```graphql
mutation order_remove_line_items($data: RemoveLineItemsInput!) {
order_remove_line_items(data: $data) {
request_id
complexity
order {
...OrderFragment
}
}
}
```

**Variables**
```json
{"data": RemoveLineItemsInput}
```

**Response**
```json
{
"data": {
"order_remove_line_items": {
"request_id": "xyz789",
"complexity": 987,
"order": Order
}
}
}
Mutations
order_update
**Response**
```json
Returns an OrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateOrderInput! |

**Query**
```graphql
mutation order_update($data: UpdateOrderInput!) {
order_update(data: $data) {
request_id
complexity
order {
...OrderFragment
}
}
}
```

**Variables**
```json
{"data": UpdateOrderInput}
```

**Response**
```json
{
"data": {
"order_update": {
"request_id": "xyz789",
"complexity": 123,
"order": Order
}
}
}
Mutations
order_update_fulfillment_status
**Response**
```json
Returns an OrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateOrderFulfillmentStatusInput! |

**Query**
```graphql
mutation order_update_fulfillment_status($data: UpdateOrderFulfillmentStatusInput!) {
order_update_fulfillment_status(data: $data) {
request_id
complexity
order {
...OrderFragment
}
}
}
```

**Variables**
```json
{"data": UpdateOrderFulfillmentStatusInput}
```

**Response**
```json
{
"data": {
"order_update_fulfillment_status": {
"request_id": "abc123",
"complexity": 987,
"order": Order
}
}
}
Mutations
order_update_holds
**Response**
```json
Returns an OrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateOrderHoldsInput! |

**Query**
```graphql
mutation order_update_holds($data: UpdateOrderHoldsInput!) {
order_update_holds(data: $data) {
request_id
complexity
order {
...OrderFragment
}
}
}
```

**Variables**
```json
{"data": UpdateOrderHoldsInput}
```

**Response**
```json
{
"data": {
"order_update_holds": {
"request_id": "xyz789",
"complexity": 987,
"order": Order
}
}
}
Mutations
order_update_line_items
**Response**
```json
Returns an OrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateLineItemsInput! |

**Query**
```graphql
mutation order_update_line_items($data: UpdateLineItemsInput!) {
order_update_line_items(data: $data) {
request_id
complexity
order {
...OrderFragment
}
}
}
```

**Variables**
```json
{"data": UpdateLineItemsInput}
```

**Response**
```json
{
"data": {
"order_update_line_items": {
"request_id": "abc123",
"complexity": 987,
"order": Order
}
}
}
Mutations
order_update_tags
**Response**
```json
Returns an OrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateTagsInput! |

**Query**
```graphql
mutation order_update_tags($data: UpdateTagsInput!) {
order_update_tags(data: $data) {
request_id
complexity
order {
...OrderFragment
}
}
}
```

**Variables**
```json
{"data": UpdateTagsInput}
```

**Response**
```json
{
"data": {
"order_update_tags": {
"request_id": "abc123",
"complexity": 987,
"order": Order
}
}
}
Mutations
product_add_to_warehouse
**Response**
```json
Returns a WarehouseProductMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | AddProductToWarehouseInput! |

**Query**
```graphql
mutation product_add_to_warehouse($data: AddProductToWarehouseInput!) {
product_add_to_warehouse(data: $data) {
request_id
complexity
warehouse_product {
...WarehouseProductFragment
}
}
}
```

**Variables**
```json
{"data": AddProductToWarehouseInput}
```

**Response**
```json
{
"data": {
"product_add_to_warehouse": {
"request_id": "abc123",
"complexity": 123,
"warehouse_product": WarehouseProduct
}
}
}
Mutations
product_create
**Response**
```json
Returns a CreateProductOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateProductInput! |

**Query**
```graphql
mutation product_create($data: CreateProductInput!) {
product_create(data: $data) {
request_id
complexity
product {
...ProductFragment
}
}
}
```

**Variables**
```json
{"data": CreateProductInput}
```

**Response**
```json
{
"data": {
"product_create": {
"request_id": "abc123",
"complexity": 987,
"product": Product
}
}
}
Mutations
product_delete
**Response**
```json
Returns a MutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | DeleteProductInput! |

**Query**
```graphql
mutation product_delete($data: DeleteProductInput!) {
product_delete(data: $data) {
request_id
complexity
}
}
```

**Variables**
```json
{"data": DeleteProductInput}
```

**Response**
```json
{
"data": {
"product_delete": {
"request_id": "xyz789",
"complexity": 987
}
}
}
Mutations
product_update
**Response**
```json
Returns a ProductMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateProductInput! |

**Query**
```graphql
mutation product_update($data: UpdateProductInput!) {
product_update(data: $data) {
request_id
complexity
product {
...ProductFragment
}
}
}
```

**Variables**
```json
{"data": UpdateProductInput}
```

**Response**
```json
{
"data": {
"product_update": {
"request_id": "xyz789",
"complexity": 987,
"product": Product
}
}
}
Mutations
purchase_order_add_attachment
**Response**
```json
Returns an AddPurchaseOrderAttachmentOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | AddPurchaseOrderAttachmentInput! |

**Query**
```graphql
mutation purchase_order_add_attachment($data: AddPurchaseOrderAttachmentInput!) {
purchase_order_add_attachment(data: $data) {
request_id
complexity
attachment {
...PurchaseOrderAttachmentFragment
}
}
}
```

**Variables**
```json
{"data": AddPurchaseOrderAttachmentInput}
```

**Response**
```json
{
"data": {
"purchase_order_add_attachment": {
"request_id": "abc123",
"complexity": 123,
"attachment": PurchaseOrderAttachment
}
}
}
Mutations
purchase_order_cancel
**Response**
```json
Returns a CancelPurchaseOrderOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CancelPurchaseOrderInput! |

**Query**
```graphql
mutation purchase_order_cancel($data: CancelPurchaseOrderInput!) {
purchase_order_cancel(data: $data) {
request_id
complexity
purchase_order {
...PurchaseOrderFragment
}
}
}
```

**Variables**
```json
{"data": CancelPurchaseOrderInput}
```

**Response**
```json
{
"data": {
"purchase_order_cancel": {
"request_id": "xyz789",
"complexity": 123,
"purchase_order": PurchaseOrder
}
}
}
Mutations
purchase_order_close
**Response**
```json
Returns a ClosePurchaseOrderOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | ClosePurchaseOrderInput! |

**Query**
```graphql
mutation purchase_order_close($data: ClosePurchaseOrderInput!) {
purchase_order_close(data: $data) {
request_id
complexity
purchase_order {
...PurchaseOrderFragment
}
}
}
```

**Variables**
```json
{"data": ClosePurchaseOrderInput}
```

**Response**
```json
{
"data": {
"purchase_order_close": {
"request_id": "xyz789",
"complexity": 987,
"purchase_order": PurchaseOrder
}
}
}
Mutations
purchase_order_create
**Response**
```json
Returns a CreatePurchaseOrderOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreatePurchaseOrderInput! |

**Query**
```graphql
mutation purchase_order_create($data: CreatePurchaseOrderInput!) {
purchase_order_create(data: $data) {
request_id
complexity
purchase_order {
...PurchaseOrderFragment
}
}
}
```

**Variables**
```json
{"data": CreatePurchaseOrderInput}
```

**Response**
```json
{
"data": {
"purchase_order_create": {
"request_id": "xyz789",
"complexity": 987,
"purchase_order": PurchaseOrder
}
}
}
Mutations
purchase_order_set_fulfillment_status
**Response**
```json
Returns a SetPurchaseOrderFulfillmentStatusOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | SetPurchaseOrderFulfillmentStatusInput! |

**Query**
```graphql
mutation purchase_order_set_fulfillment_status($data: SetPurchaseOrderFulfillmentStatusInput!) {
purchase_order_set_fulfillment_status(data: $data) {
request_id
complexity
purchase_order {
...PurchaseOrderFragment
}
}
}
```

**Variables**
```json
{"data": SetPurchaseOrderFulfillmentStatusInput}
```

**Response**
```json
{
"data": {
"purchase_order_set_fulfillment_status": {
"request_id": "abc123",
"complexity": 123,
"purchase_order": PurchaseOrder
}
}
}
Mutations
purchase_order_update
**Response**
```json
Returns an UpdatePurchaseOrderOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdatePurchaseOrderInput! |

**Query**
```graphql
mutation purchase_order_update($data: UpdatePurchaseOrderInput!) {
purchase_order_update(data: $data) {
request_id
complexity
purchase_order {
...PurchaseOrderFragment
}
}
}
```

**Variables**
```json
{"data": UpdatePurchaseOrderInput}
```

**Response**
```json
{
"data": {
"purchase_order_update": {
"request_id": "xyz789",
"complexity": 123,
"purchase_order": PurchaseOrder
}
}
}
Mutations
return_create
**Response**
```json
Returns a CreateReturnOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateReturnInput! |

**Query**
```graphql
mutation return_create($data: CreateReturnInput!) {
return_create(data: $data) {
request_id
complexity
return {
...ReturnFragment
}
}
}
```

**Variables**
```json
{"data": CreateReturnInput}
```

**Response**
```json
{
"data": {
"return_create": {
"request_id": "xyz789",
"complexity": 987,
"return": Return
}
}
}
Mutations
return_create_exchange
**Response**
```json
Returns a CreateReturnExchangeOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateReturnExchangeInput! |

**Query**
```graphql
mutation return_create_exchange($data: CreateReturnExchangeInput!) {
return_create_exchange(data: $data) {
request_id
complexity
return_exchange {
...ReturnExchangeFragment
}
}
}
```

**Variables**
```json
{"data": CreateReturnExchangeInput}
```

**Response**
```json
{
"data": {
"return_create_exchange": {
"request_id": "xyz789",
"complexity": 123,
"return_exchange": ReturnExchange
}
}
}
Mutations
return_update_status
**Response**
```json
Returns an UpdateReturnStatusOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateReturnStatusInput! |

**Query**
```graphql
mutation return_update_status($data: UpdateReturnStatusInput!) {
return_update_status(data: $data) {
request_id
complexity
return {
...ReturnFragment
}
}
}
```

**Variables**
```json
{"data": UpdateReturnStatusInput}
```

**Response**
```json
{
"data": {
"return_update_status": {
"request_id": "xyz789",
"complexity": 123,
"return": Return
}
}
}
Mutations
shipment_create
**Response**
```json
Returns a CreateShipmentOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateShipmentInput! |

**Query**
```graphql
mutation shipment_create($data: CreateShipmentInput!) {
shipment_create(data: $data) {
request_id
complexity
shipment {
...ShipmentFragment
}
}
}
```

**Variables**
```json
{"data": CreateShipmentInput}
```

**Response**
```json
{
"data": {
"shipment_create": {
"request_id": "xyz789",
"complexity": 123,
"shipment": Shipment
}
}
}
Mutations
shipment_create_shipping_label
**Response**
```json
Returns a CreateShippingLabelOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateShippingLabelInput! |

**Query**
```graphql
mutation shipment_create_shipping_label($data: CreateShippingLabelInput!) {
shipment_create_shipping_label(data: $data) {
request_id
complexity
shipping_label {
...ShippingLabelFragment
}
}
}
```

**Variables**
```json
{"data": CreateShippingLabelInput}
```

**Response**
```json
{
"data": {
"shipment_create_shipping_label": {
"request_id": "abc123",
"complexity": 123,
"shipping_label": ShippingLabel
}
}
}
Mutations
shipping_plan_create
**Response**
```json
Returns a CreateShippingPlanOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateShippingPlanInput! |

**Query**
```graphql
mutation shipping_plan_create($data: CreateShippingPlanInput!) {
shipping_plan_create(data: $data) {
request_id
complexity
shipping_plan {
...ShippingPlanFragment
}
}
}
```

**Variables**
```json
{"data": CreateShippingPlanInput}
```

**Response**
```json
{
"data": {
"shipping_plan_create": {
"request_id": "abc123",
"complexity": 123,
"shipping_plan": ShippingPlan
}
}
}
Mutations
vendor_add_product
**Response**
```json
Returns a MutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | AddProductToVendorInput! |

**Query**
```graphql
mutation vendor_add_product($data: AddProductToVendorInput!) {
vendor_add_product(data: $data) {
request_id
complexity
}
}
```

**Variables**
```json
{"data": AddProductToVendorInput}
```

**Response**
```json
{
"data": {
"vendor_add_product": {
"request_id": "xyz789",
"complexity": 987
}
}
}
Mutations
vendor_create
**Response**
```json
Returns a CreateVendorOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateVendorInput! |

**Query**
```graphql
mutation vendor_create($data: CreateVendorInput!) {
vendor_create(data: $data) {
request_id
complexity
vendor {
...VendorFragment
}
}
}
```

**Variables**
```json
{"data": CreateVendorInput}
```

**Response**
```json
{
"data": {
"vendor_create": {
"request_id": "abc123",
"complexity": 123,
"vendor": Vendor
}
}
}
Mutations
vendor_delete
**Response**
```json
Returns a MutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | DeleteVendorInput! |

**Query**
```graphql
mutation vendor_delete($data: DeleteVendorInput!) {
vendor_delete(data: $data) {
request_id
complexity
}
}
```

**Variables**
```json
{"data": DeleteVendorInput}
```

**Response**
```json
{
"data": {
"vendor_delete": {
"request_id": "abc123",
"complexity": 123
}
}
}
Mutations
vendor_remove_product
**Response**
```json
Returns a MutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | RemoveProductFromVendorInput! |

**Query**
```graphql
mutation vendor_remove_product($data: RemoveProductFromVendorInput!) {
vendor_remove_product(data: $data) {
request_id
complexity
}
}
```

**Variables**
```json
{"data": RemoveProductFromVendorInput}
```

**Response**
```json
{
"data": {
"vendor_remove_product": {
"request_id": "abc123",
"complexity": 123
}
}
}
Mutations
warehouse_product_delete
**Response**
```json
Returns a MutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | DeleteWarehouseProductInput! |

**Query**
```graphql
mutation warehouse_product_delete($data: DeleteWarehouseProductInput!) {
warehouse_product_delete(data: $data) {
request_id
complexity
}
}
```

**Variables**
```json
{"data": DeleteWarehouseProductInput}
```

**Response**
```json
{
"data": {
"warehouse_product_delete": {
"request_id": "xyz789",
"complexity": 987
}
}
}
Mutations
warehouse_product_update
**Response**
```json
Returns a WarehouseProductMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateWarehouseProductInput! |

**Query**
```graphql
mutation warehouse_product_update($data: UpdateWarehouseProductInput!) {
warehouse_product_update(data: $data) {
request_id
complexity
warehouse_product {
...WarehouseProductFragment
}
}
}
```

**Variables**
```json
{"data": UpdateWarehouseProductInput}
```

**Response**
```json
{
"data": {
"warehouse_product_update": {
"request_id": "xyz789",
"complexity": 123,
"warehouse_product": WarehouseProduct
}
}
}
Mutations
webhook_create
**Response**
```json
Returns a CreateWebhookOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateWebhookInput! |

**Query**
```graphql
mutation webhook_create($data: CreateWebhookInput!) {
webhook_create(data: $data) {
request_id
complexity
webhook {
...WebhookFragment
}
}
}
```

**Variables**
```json
{"data": CreateWebhookInput}
```

**Response**
```json
{
"data": {
"webhook_create": {
"request_id": "abc123",
"complexity": 987,
"webhook": Webhook
}
}
}
Mutations
webhook_delete
**Response**
```json
Returns a MutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | DeleteWebhookInput! |

**Query**
```graphql
mutation webhook_delete($data: DeleteWebhookInput!) {
webhook_delete(data: $data) {
request_id
complexity
}
}
```

**Variables**
```json
{"data": DeleteWebhookInput}
```

**Response**
```json
{
"data": {
"webhook_delete": {
"request_id": "xyz789",
"complexity": 987
}
}
}
Mutations
wholesale_order_create
**Response**
```json
Returns a WholesaleOrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateWholesaleOrderInput! |

**Query**
```graphql
mutation wholesale_order_create($data: CreateWholesaleOrderInput!) {
wholesale_order_create(data: $data) {
request_id
complexity
wholesale_order {
...WholesaleOrderFragment
}
}
}
```

**Variables**
```json
{"data": CreateWholesaleOrderInput}
```

**Response**
```json
{
"data": {
"wholesale_order_create": {
"request_id": "abc123",
"complexity": 123,
"wholesale_order": WholesaleOrder
}
}
}
Mutations
wholesale_order_update
**Response**
```json
Returns a WholesaleOrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | UpdateWholesaleOrderInput! |

**Query**
```graphql
mutation wholesale_order_update($data: UpdateWholesaleOrderInput!) {
wholesale_order_update(data: $data) {
request_id
complexity
wholesale_order {
...WholesaleOrderFragment
}
}
}
```

**Variables**
```json
{"data": UpdateWholesaleOrderInput}
```

**Response**
```json
{
"data": {
"wholesale_order_update": {
"request_id": "abc123",
"complexity": 987,
"wholesale_order": WholesaleOrder
}
}
}
Mutations
work_order_create
**Response**
```json
Returns a WorkOrderMutationOutput
**Arguments**
| Name | Description |
| --- | --- |
| `data` | CreateWorkOrderInput! |

**Query**
```graphql
mutation work_order_create($data: CreateWorkOrderInput!) {
work_order_create(data: $data) {
request_id
complexity
work_order {
...WorkOrderIdentifiableTypeFragment
}
}
}
```

**Variables**
```json
{"data": CreateWorkOrderInput}
```

**Response**
```json
{
"data": {
"work_order_create": {
"request_id": "xyz789",
"complexity": 123,
"work_order": WorkOrderIdentifiableType
}
}
}
Types
AbortInventorySyncInput
Input Field	Description
sync_id - String!
reason - String
Example
{
"sync_id": "abc123",
"reason": "xyz789"
}
Types
AbortInventorySyncOutput
Field Name	Description
request_id - String
complexity - Int
sync - InventorySyncStatus
Example
{
"request_id": "xyz789",
"complexity": 123,
"sync": InventorySyncStatus
}
Types
Account
Field Name	Description
id - String
legacy_id - Int
email - String
username - String
status - String
dynamic_slotting - Boolean
is_multi_warehouse - Boolean
is_3pl - Boolean
cycle_count_enabled - Boolean
ship_backorders - Boolean
customers - AccountConnection
**Arguments**
| Name | Description |
| --- | --- |
| `warehouse_id` | String |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `warehouses` | [Warehouse] |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [AccountEdge]!	Contains the nodes in this connection. |
| `node` | Account	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | Account |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String!	The id of the order you want to modify |
| `history_entry` | UserNoteInput |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String!	The id of the order you want to modify |
| `line_items` | [CreateLineItemInput]! |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `vendor_id` | String! |
| `sku` | String! |
| `manufacturer_sku` | String |
| `price` | String |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `sku` | String! |
| `warehouse_id` | String! |
| `on_hand` | Int |
| `inventory_bin` | String |
| `inventory_overstock_bin` | String |
| `reserve_inventory` | Int |
| `replenishment_level` | Int |
| `reorder_level` | Int |
| `reorder_amount` | Int |
| `price` | String |
| `value` | String |
| `value_currency` | String |
| `active` | Boolean |
| `po_id` | String! |
| `url` | String! |
| `description` | String |
| `filename` | String |
| `file_type` | String |
| `request_id` | String |
| `complexity` | Int |
| `attachment` | PurchaseOrderAttachment |
| `name` | String	The address's name or name of the person assigned to the address |
| `address1` | String	Address line 1 |
| `address2` | String	Address line 2 |
| `city` | String	Address's City |
| `state` | String	Address's State |
| `country` | String	Address's Country |
| `zip` | String	Address's Postal Code |
| `phone` | String |
| `name` | String |
| `address1` | String |
| `address2` | String |
| `city` | String |
| `state` | String |
| `country` | String |
| `zip` | String |
| `phone` | String |
| `sku` | String! |
| `quantity` | Int! |
| `receiving_location_id` | String |
| `staging_location_id` | String |
| `lot_id` | String!	Unique identifier of the Lot the product belongs to |
| `location_id` | String!	Unique identifier of the Location the product is placed at |
| `request_id` | String |
| `complexity` | Int |
| `warehouse_product` | WarehouseProduct |
| `transaction_id` | String |
| `authorized_amount` | String |
| `postauthed_amount` | String |
| `refunded_amount` | String |
| `card_type` | String |
| `date` | ISODateTime |
| `id` | String |
| `legacy_id` | Int |
| `status` | String |
| `customer_name` | String |
| `profile_name` | String |
| `created_at` | ISODateTime |
| `due_date` | ISODateTime |
| `amount` | Money |
| `totals` | FeeCategoryTotalConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `bill_exports` | BillExportsConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `billing_period` | BillingPeriod |
| `billing_frequency` | String |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [BillEdge]!	Contains the nodes in this connection. |
| `node` | Bill	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `status` | String |
| `file_url` | String |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [BillExportsEdge]!	Contains the nodes in this connection. |
| `node` | BillExports	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | Bill |
| `start` | ISODateTime |
| `end` | ISODateTime |
| `request_id` | String |
| `complexity` | Int |
| `data` | BillConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `sku` | String! |
| `quantity` | Int! |
| `sku` | String! |
| `components` | [BuildKitComponentInput]! |
| `kit_build` | Boolean |
| `customer_account_id` | String |
| `request_id` | String |
| `complexity` | Int |
| `errors` | [OperationError] |
| `orders_ids` | [String] |
| `tags` | [String] |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String!	The id of the order you want to modify |
| `reason` | String |
| `void_on_platform` | Boolean	Whether or not to void the order on the sales platform |
| `force` | Boolean	Cancel an order even if it has valid labels and completed shipments |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `po_id` | String! |
| `request_id` | String |
| `complexity` | Int |
| `purchase_order` | PurchaseOrder |
| `id` | String |
| `legacy_id` | Int |
| `case_barcode` | String |
| `case_quantity` | Int |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String!	The id of the order you want to modify |
| `warehouse_id` | String! |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `sku` | String! |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `po_id` | String! |
| `request_id` | String |
| `complexity` | Int |
| `purchase_order` | PurchaseOrder |
| `customer_account_id` | String! |
| `start_date` | ISODateTime! |
| `end_date` | ISODateTime! |
| `warehouse_id` | String |
| `request_id` | String |
| `complexity` | Int |
| `bill` | Bill |
| `return_item_id` | String! |
| `exchange_product_sku` | String! |
| `quantity` | Int! |
| `paper_pdf_location` | String |
| `thermal_pdf_location` | String |
| `pdf_location` | String |
| `image_location` | String |
| `sku` | String! |
| `partner_line_item_id` | String!	A unique identifier, usually the customer's internal id. It should be unique across all the order's line items, and is recommended to be unique accross the entire store. |
| `quantity` | Int! |
| `price` | String! |
| `product_name` | String |
| `option_title` | String |
| `fulfillment_status` | String |
| `quantity_pending_fulfillment` | Int |
| `custom_options` | GenericScalar |
| `custom_barcode` | String |
| `eligible_for_return` | Boolean |
| `customs_value` | String	A decimal value used for customs |
| `barcode` | String |
| `warehouse_id` | String	Set to lock to that warehouse. The item will not be moved in any multi-warehouse processing |
| `warehouse_id` | String! |
| `name` | String! |
| `zone` | String! |
| `location_type_id` | String |
| `pickable` | Boolean |
| `sellable` | Boolean |
| `is_cart` | Boolean |
| `pick_priority` | Int |
| `dimensions` | DimensionsInput |
| `temperature` | String |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `name` | String! |
| `sku` | String! |
| `expires_at` | ISODateTime |
| `is_active` | Boolean |
| `request_id` | String |
| `complexity` | Int |
| `lot` | Lot |
| `first_name` | String |
| `last_name` | String |
| `company` | String |
| `address1` | String |
| `address2` | String |
| `city` | String |
| `state` | String |
| `state_code` | String |
| `zip` | String |
| `country` | String |
| `country_code` | String |
| `email` | String	Order email takes precedence, followed by shipping address email, then billing address email |
| `phone` | String |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_number` | String	The store's internal order number |
| `partner_order_id` | String |
| `shop_name` | String |
| `fulfillment_status` | String	Status of the order (pending, fulfilled, cancelled, etc) |
| `order_date` | ISODateTime |
| `total_tax` | String |
| `total_discounts` | String |
| `box_name` | String |
| `currency` | String |
| `ready_to_ship` | Boolean |
| `insurance_amount` | Decimal |
| `shipping_lines` | CreateShippingLinesInput |
| `shipping_address` | CreateOrderAddressInput! |
| `billing_address` | CreateOrderAddressInput |
| `from_name` | String |
| `tags` | [String] |
| `line_items` | [CreateLineItemInput] |
| `gift_note` | String |
| `gift_invoice` | Boolean |
| `require_signature` | Boolean |
| `adult_signature_required` | Boolean |
| `alcohol` | Boolean |
| `insurance` | Boolean |
| `allow_partial` | Boolean |
| `allow_split` | Boolean |
| `custom_invoice_url` | String |
| `email` | String |
| `profile` | String |
| `packing_note` | String |
| `required_ship_date` | ISODateTime |
| `auto_print_return_label` | Boolean |
| `hold_until_date` | ISODateTime |
| `incoterms` | String |
| `tax_id` | String |
| `tax_type` | String |
| `flagged` | Boolean |
| `saturday_delivery` | Boolean |
| `ignore_address_validation_errors` | Boolean	US addresses are be validated and when errors occur the order will have an address hold created. If this flag is set then the error validation is skipped and no address hold is created |
| `skip_address_validation` | Boolean	Not address validation will be performed |
| `priority_flag` | Boolean |
| `allocation_priority` | Int |
| `holds` | HoldsInput |
| `dry_ice_weight_in_lbs` | String |
| `ftr_exemption` | Decimal |
| `address_is_business` | Boolean |
| `do_not_print_invoice` | Boolean |
| `ignore_payment_capture_errors` | Boolean |
| `case_barcode` | String! |
| `case_quantity` | Int! |
| `src` | String! |
| `position` | Int |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `name` | String! |
| `sku` | String! |
| `warehouse_products` | [CreateWarehouseProductInput]! |
| `barcode` | String |
| `country_of_manufacture` | String |
| `dimensions` | DimensionsInput |
| `tariff_code` | String |
| `product_note` | String |
| `kit` | Boolean |
| `kit_build` | Boolean |
| `no_air` | Boolean |
| `final_sale` | Boolean |
| `customs_value` | String |
| `customs_description` | String |
| `not_owned` | Boolean |
| `ignore_on_customs` | Boolean |
| `ignore_on_invoice` | Boolean |
| `dropship` | Boolean |
| `needs_serial_number` | Boolean |
| `virtual` | Boolean |
| `needs_lot_tracking` | Boolean |
| `images` | [CreateProductImageInput] |
| `tags` | [String] |
| `vendors` | [CreateProductVendorInput] |
| `packer_note` | String |
| `cases` | [CreateProductCaseInput] |
| `request_id` | String |
| `complexity` | Int |
| `product` | Product |
| `vendor_id` | String! |
| `vendor_sku` | String! |
| `price` | String |
| `url` | String! |
| `description` | String |
| `filename` | String |
| `file_type` | String |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `po_number` | String! |
| `subtotal` | String! |
| `shipping_price` | String! |
| `total_price` | String! |
| `warehouse_id` | String! |
| `line_items` | [CreatePurchaseOrderLineItemInput]! |
| `po_date` | ISODateTime |
| `po_note` | String |
| `fulfillment_status` | String |
| `discount` | String |
| `vendor_id` | String |
| `warehouse` | String |
| `packing_note` | String |
| `description` | String |
| `partner_order_number` | String |
| `tax` | String |
| `tracking_number` | String |
| `attachments` | [CreatePurchaseOrderAttachmentInput] |
| `origin_of_shipment` | String |
| `sku` | String! |
| `quantity` | Int! |
| `expected_weight_in_lbs` | String! |
| `price` | String! |
| `vendor_id` | String |
| `vendor_sku` | String |
| `variant_id` | Int |
| `quantity_received` | Int |
| `quantity_rejected` | Int |
| `product_name` | String |
| `option_title` | String |
| `fulfillment_status` | String |
| `sell_ahead` | Int |
| `note` | String |
| `partner_line_item_id` | String |
| `request_id` | String |
| `complexity` | Int |
| `purchase_order` | PurchaseOrder |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `return_id` | String! |
| `exchange_items` | [CreateExchangeItem]! |
| `request_id` | String |
| `complexity` | Int |
| `return_exchange` | ReturnExchange |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String! |
| `warehouse_id` | String! |
| `return_reason` | String! |
| `label_type` | ReturnLabelType! |
| `label_cost` | String! |
| `address` | AddressInput! |
| `dimensions` | DimensionsInput! |
| `shipping_carrier` | String! |
| `shipping_method` | String! |
| `line_items` | [CreateReturnLineItemInput]! |
| `email_customer_return_label` | Boolean |
| `tracking_number` | String	If a label was generated outside of ShipHero, you can send us that tracking number so we can create a generic label with it and assign it to the return. |
| `create_label` | Boolean	If you want us to generate a label for the return |
| `partner_id` | String |
| `display_issue_refund` | Boolean	If the user can have access to the refund form |
| `return_pickup_datetime` | DateTime	If a scheduled return is needed |
| `exchange_product_sku` | String! |
| `quantity` | Int! |
| `sku` | String!	The sku of one of the order's line items that is been returned |
| `quantity` | Int! |
| `return_reason` | String! |
| `condition` | String |
| `is_component` | Boolean |
| `exchange_items` | [CreateReturnItemExchangeInput] |
| `request_id` | String |
| `complexity` | Int |
| `return` | Return |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String! |
| `warehouse_id` | String! |
| `address` | AddressInput! |
| `line_items` | [CreateShipmentLineItemInput]! |
| `labels` | [CreateShipmentShippingLabelInput] |
| `notify_customer_via_shiphero` | Boolean |
| `notify_customer_via_store` | Boolean |
| `shipped_off_shiphero` | Boolean |
| `profile` | String |
| `line_item_id` | String! |
| `quantity` | Int! |
| `request_id` | String |
| `complexity` | Int |
| `shipment` | Shipment |
| `carrier` | String! |
| `shipping_name` | String! |
| `shipping_method` | String! |
| `cost` | String! |
| `address` | AddressInput! |
| `dimensions` | DimensionsInput! |
| `label` | CreateLabelResourceInput! |
| `line_item_ids` | [String]!	Specify the line items that should be associated with the label been created. The ids can be shipment line item ids or order line item ids (the ones used to create the shipment line items) |
| `tracking_number` | String |
| `tracking_url` | String |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `carrier` | String! |
| `shipping_name` | String! |
| `shipping_method` | String! |
| `cost` | String! |
| `address` | AddressInput! |
| `dimensions` | DimensionsInput! |
| `label` | CreateLabelResourceInput! |
| `line_item_ids` | [String]!	Specify the line items that should be associated with the label been created. The ids can be shipment line item ids or order line item ids (the ones used to create the shipment line items) |
| `tracking_number` | String |
| `shipment_id` | String! |
| `request_id` | String |
| `complexity` | Int |
| `shipping_label` | ShippingLabel |
| `title` | String! |
| `price` | String! |
| `carrier` | String |
| `method` | String |
| `subtotal` | String |
| `shipping_price` | String |
| `total_price` | String |
| `warehouse_id` | String! |
| `warehouse_note` | String |
| `vendor_po_number` | String |
| `line_items` | [LineItemInput]! |
| `packages` | [PackageInput] |
| `pallet` | PalletData |
| `request_id` | String |
| `complexity` | Int |
| `shipping_plan` | ShippingPlan |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `name` | String! |
| `email` | String! |
| `account_number` | String |
| `address` | AddressInput |
| `currency` | String |
| `internal_note` | String |
| `default_po_note` | String |
| `logo` | String |
| `partner_vendor_id` | Int |
| `request_id` | String |
| `complexity` | Int |
| `vendor` | Vendor |
| `warehouse_id` | String! |
| `on_hand` | Int! |
| `inventory_bin` | String |
| `inventory_overstock_bin` | String |
| `reserve_inventory` | Int |
| `replenishment_level` | Int |
| `replenishment_max_level` | Int |
| `replenishment_increment` | Int |
| `reorder_level` | Int |
| `reorder_amount` | Int |
| `price` | String |
| `custom` | Boolean |
| `warehouse` | String |
| `value` | String |
| `value_currency` | String |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `name` | String! |
| `url` | String! |
| `shop_name` | String |
| `request_id` | String |
| `complexity` | Int |
| `webhook` | Webhook |
| `sku` | String! |
| `partner_line_item_id` | String!	A unique identifier, usually the customer's internal id. It should be unique across all the order's line items, and is recommended to be unique accross the entire store. |
| `quantity` | Int! |
| `price` | String! |
| `product_name` | String |
| `option_title` | String |
| `fulfillment_status` | String |
| `quantity_pending_fulfillment` | Int |
| `custom_options` | GenericScalar |
| `custom_barcode` | String |
| `eligible_for_return` | Boolean |
| `customs_value` | String	A decimal value used for customs |
| `barcode` | String |
| `warehouse_id` | String	Set to lock to that warehouse. The item will not be moved in any multi-warehouse processing |
| `unit_of_measure` | String |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_number` | String	The store's internal order number |
| `partner_order_id` | String |
| `shop_name` | String |
| `fulfillment_status` | String	Status of the order (pending, fulfilled, cancelled, etc) |
| `order_date` | ISODateTime |
| `total_tax` | String |
| `total_discounts` | String |
| `box_name` | String |
| `currency` | String |
| `ready_to_ship` | Boolean |
| `insurance_amount` | Decimal |
| `shipping_lines` | CreateShippingLinesInput |
| `shipping_address` | CreateOrderAddressInput! |
| `billing_address` | CreateOrderAddressInput |
| `from_name` | String |
| `tags` | [String] |
| `line_items` | [CreateWholesaleLineItemInput] |
| `gift_note` | String |
| `gift_invoice` | Boolean |
| `require_signature` | Boolean |
| `adult_signature_required` | Boolean |
| `alcohol` | Boolean |
| `insurance` | Boolean |
| `allow_partial` | Boolean |
| `allow_split` | Boolean |
| `custom_invoice_url` | String |
| `email` | String |
| `profile` | String |
| `packing_note` | String |
| `required_ship_date` | ISODateTime |
| `auto_print_return_label` | Boolean |
| `hold_until_date` | ISODateTime |
| `incoterms` | String |
| `tax_id` | String |
| `tax_type` | String |
| `flagged` | Boolean |
| `saturday_delivery` | Boolean |
| `ignore_address_validation_errors` | Boolean	US addresses are be validated and when errors occur the order will have an address hold created. If this flag is set then the error validation is skipped and no address hold is created |
| `skip_address_validation` | Boolean	Not address validation will be performed |
| `priority_flag` | Boolean |
| `allocation_priority` | Int |
| `holds` | HoldsInput |
| `dry_ice_weight_in_lbs` | String |
| `ftr_exemption` | Decimal |
| `address_is_business` | Boolean |
| `do_not_print_invoice` | Boolean |
| `ignore_payment_capture_errors` | Boolean |
| `shipping_option` | WholesaleShippingOptions |
| `staging_location_id` | Int |
| `picking_flow` | WholesaleOrderPickingFlow |
| `outbound_progress` | WholesaleOrderOutboundProgress |
| `pickup_date` | ISODateTime |
| `preparation_date` | ISODateTime |
| `order_type` | String |
| `gs1_labels_required` | Boolean |
| `trading_partner_id` | String |
| `trading_partner_name` | String |
| `store_location_number` | String |
| `distribution_center` | String |
| `vendor` | String |
| `vendor_id` | String |
| `requested_delivery_date` | ISODateTime |
| `ship_not_before_date` | ISODateTime |
| `ship_no_later_than_date` | ISODateTime |
| `depositor_order_number` | String |
| `department` | String |
| `division` | String |
| `service_level` | String |
| `internal_supplier_number` | String |
| `terms_of_sale` | String |
| `retailer_notes` | String |
| `quote_number` | String |
| `sales_requirement_code` | String |
| `reference_fields` | JSONObjectScalar |
| `wholesale_shipping_details` | WholesaleShippingDetailsInput	The shipping details to be used to create a new wholesale order |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `warehouse_id` | String! |
| `requested_date` | DateTime! |
| `name` | String |
| `packing_details` | String |
| `assembly_details` | String |
| `type` | WorkOrderType! |
| `instructions` | String |
| `create_special_project` | Boolean |
| `priority` | WorkOrderPriority |
| `attachments` | [WorkOrderAttachmentType] |
| `assembly_sku` | AssemblySKUType |
| `request_id` | String |
| `complexity` | Int |
| `data` | User |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `id` | String! |
| `lot_id` | String! |
| `request_id` | String |
| `complexity` | Int |
| `lot` | Lot |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `sku` | String! |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `vendor_id` | String! |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `sku` | String! |
| `warehouse_id` | String! |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `name` | String! |
| `shop_name` | String |
| `weight` | String	Weight in unit configured in the account (Oz by default) |
| `height` | String	Height in unit configured in the account (In by default) |
| `width` | String	Width in unit configured in the account (In by default) |
| `length` | String	Lenght in unit configured in the account (In by default) |
| `weight` | String	Weight in unit configured in the account (Oz by default) |
| `height` | String	Height in unit configured in the account (In by default) |
| `width` | String	Width in unit configured in the account (In by default) |
| `length` | String	Lenght in unit configured in the account (In by default) |
| `id` | String |
| `legacy_id` | Int |
| `quantity` | Int |
| `marketplace_id` | String |
| `merchant_id` | String |
| `id` | String |
| `legacy_id` | Int |
| `amount` | Money |
| `label` | String |
| `category` | String |
| `quantity` | Int |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [FeeCategoryTotalEdge]!	Contains the nodes in this connection. |
| `node` | FeeCategoryTotal	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String!	The id of the order you want to modify |
| `tote_id` | String! |
| `packages` | [ShippedPackagesInput]! |
| `notify_customer_via_shiphero` | Boolean |
| `notify_customer_via_store` | Boolean |
| `shipped_off_shiphero` | Boolean |
| `note` | String |
| `id` | String |
| `legacy_id` | Int |
| `stripe_charge_id` | String |
| `stripe_invoice_id` | String |
| `stripe_invoice_number` | String |
| `stripe_invoice_status` | String |
| `stripe_invoice_url` | String |
| `stripe_next_payment_attempt` | ISODateTime |
| `account_id` | String |
| `cc_info` | String |
| `amount` | String |
| `created_at` | ISODateTime |
| `shipping_items` | FulfillmentInvoiceShippingItemConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `inbound_shipping_items` | FulfillmentInvoiceInboundShippingItemConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `returns_items` | FulfillmentInvoiceReturnItemConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `storage_items` | FulfillmentInvoiceStorageItemConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [FulfillmentInvoiceEdge]!	Contains the nodes in this connection. |
| `node` | FulfillmentInvoice	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `invoice_id` | String |
| `purchase_order_id` | String |
| `shipment_id` | String |
| `shipping_label_id` | String |
| `amount` | String |
| `cost` | String |
| `created_at` | ISODateTime |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [FulfillmentInvoiceInboundShippingItemEdge]!	Contains the nodes in this connection. |
| `node` | FulfillmentInvoiceInboundShippingItem	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | FulfillmentInvoice |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `invoice_id` | String |
| `order_id` | String |
| `rma_id` | String |
| `rma_label_id` | String |
| `amount` | String |
| `shipping_rate` | String |
| `picking_fee` | String |
| `inspection_fee` | String |
| `restocking_fee` | String |
| `created_at` | ISODateTime |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [FulfillmentInvoiceReturnItemEdge]!	Contains the nodes in this connection. |
| `node` | FulfillmentInvoiceReturnItem	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `invoice_id` | String |
| `order_id` | String |
| `shipment_id` | String |
| `shipping_label_id` | String |
| `amount` | String |
| `shipping_rate` | String |
| `processing_fee` | String |
| `picking_fee` | String |
| `overcharge_fee` | String |
| `created_at` | ISODateTime |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [FulfillmentInvoiceShippingItemEdge]!	Contains the nodes in this connection. |
| `node` | FulfillmentInvoiceShippingItem	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `warehouse_id` | String |
| `invoice_id` | String |
| `amount` | String |
| `created_at` | ISODateTime |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [FulfillmentInvoiceStorageItemEdge]!	Contains the nodes in this connection. |
| `node` | FulfillmentInvoiceStorageItem	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | FulfillmentInvoiceConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `payment_hold` | Boolean |
| `operator_hold` | Boolean |
| `fraud_hold` | Boolean |
| `address_hold` | Boolean |
| `client_hold` | Boolean |
| `The Int scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31` | 1. |
| `snapshot_id` | String! |
| `reason` | String |
| `id` | String |
| `legacy_id` | Int	For customers that transitioned from static slotting to dynamic slotting, there can be multiple records with the same legacy_id, please use the id field instead |
| `user_id` | String |
| `account_id` | String |
| `warehouse_id` | String |
| `sku` | String |
| `previous_on_hand` | Int |
| `change_in_on_hand` | Int |
| `reason` | String |
| `cycle_counted` | Boolean |
| `location_id` | String |
| `lot_id` | String |
| `lot_name` | String |
| `lot_expiration` | String |
| `created_at` | ISODateTime |
| `product` | Product |
| `location` | Location |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [InventoryChangeEdge]!	Contains the nodes in this connection. |
| `node` | InventoryChange	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | InventoryChangeConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `warehouse_id` | String |
| `notification_email` | String |
| `post_url` | String |
| `post_url_pre_check` | Boolean	If false, a pre-check on the POST URL will not be performed. This eliminates immediate validation and feedback in the mutation response, before sending the request to the worker. Nonetheless, disabling this check can be useful if a one-time token is used to authenticate the endpoint. |
| `new_format` | Boolean	If True, the snapshot structure will be organized by customer account id, rather than by SKU alone, adding support for different customer accounts having repeated SKUs. |
| `updated_from` | ISODateTime	to filter out products updated since that time |
| `has_inventory` | Boolean	to filter out products that don't have inventory |
| `snapshot_id` | String |
| `job_user_id` | String |
| `job_account_id` | String |
| `warehouse_id` | String |
| `customer_account_id` | String |
| `notification_email` | String |
| `email_error` | String |
| `post_url` | String |
| `post_error` | String |
| `post_url_pre_check` | Boolean |
| `status` | String |
| `error` | String |
| `created_at` | ISODateTime |
| `enqueued_at` | ISODateTime |
| `updated_at` | ISODateTime |
| `snapshot_url` | String |
| `snapshot_expiration` | ISODateTime |
| `new_format` | Boolean |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [InventorySnapshotEdge]!	Contains the nodes in this connection. |
| `node` | InventorySnapshot	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `snapshot` | InventorySnapshot |
| `request_id` | String |
| `complexity` | Int |
| `snapshot` | InventorySnapshot |
| `request_id` | String |
| `complexity` | Int |
| `snapshots` | InventorySnapshotConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `request_id` | String |
| `complexity` | Int |
| `data` | InventorySyncStatus |
| `request_id` | String |
| `complexity` | Int |
| `data` | InventorySyncStatusConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `url` | String! |
| `warehouse_id` | String! |
| `id` | String |
| `row` | Int |
| `sku` | String |
| `quantity` | Int |
| `action` | String |
| `reason` | String |
| `location` | Int |
| `status` | String |
| `error` | String |
| `created_at` | ISODateTime |
| `updated_at` | ISODateTime |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [InventorySyncItemStatusEdge]!	Contains the nodes in this connection. |
| `node` | InventorySyncItemStatus	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `sync_id` | String |
| `request_id` | String |
| `complexity` | Int |
| `data` | InventorySyncItemStatusConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `url` | String |
| `user_id` | String |
| `account_id` | String |
| `warehouse_id` | String |
| `customer_account_id` | String |
| `total_count` | Int |
| `status` | String |
| `error` | String |
| `created_at` | ISODateTime |
| `updated_at` | ISODateTime |
| `success_count` | Int |
| `error_count` | Int |
| `finished_count` | Int |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [InventorySyncStatusEdge]!	Contains the nodes in this connection. |
| `node` | InventorySyncStatus	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `warehouse_id` | String |
| `location_id` | String |
| `sku` | String |
| `quantity` | Int |
| `created_at` | ISODateTime |
| `location` | Location |
| `expiration_lot` | Lot |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [ItemLocationEdge]!	Contains the nodes in this connection. |
| `node` | ItemLocation	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `sku` | String	Stock Keeping Unit |
| `quantity` | Int	Amount of product units within the kit |
| `pdf_location` | String |
| `paper_pdf_location` | String |
| `thermal_pdf_location` | String |
| `image_location` | String |
| `id` | String |
| `legacy_id` | Int |
| `shipping_carrier` | String |
| `shipping_method` | String |
| `tracking_number` | String |
| `tracking_url` | String |
| `legacy_id` | Int |
| `id` | String |
| `request_id` | String |
| `complexity` | Int |
| `data` | LegacyId |
| `id` | String |
| `legacy_id` | Int |
| `sku` | String |
| `partner_line_item_id` | String |
| `product_id` | String	Products should be referenced by sku |
| `quantity` | Int |
| `price` | String |
| `product_name` | String |
| `option_title` | String |
| `fulfillment_status` | String |
| `quantity_pending_fulfillment` | Int |
| `quantity_shipped` | Int |
| `warehouse` | String |
| `quantity_allocated` | Int |
| `backorder_quantity` | Int |
| `custom_options` | GenericScalar |
| `custom_barcode` | String |
| `eligible_for_return` | Boolean |
| `customs_value` | String |
| `warehouse_id` | String	Use order allocations instead |
| `locked_to_warehouse_id` | String	This field was deprecated on accounts with Multi Warehouse Allocation rules |
| `subtotal` | String |
| `barcode` | String |
| `created_at` | ISODateTime |
| `updated_at` | ISODateTime |
| `order_id` | String |
| `shipped_line_item_lots` | [ShippedLineItemLot] |
| `serial_numbers` | [LineItemSerialNumber] |
| `promotion_discount` | String |
| `product` | Product |
| `tote_picks` | [TotePick] |
| `product_name` | String! |
| `sku` | String! |
| `quantity` | Int! |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [LineItemQuerySpecEdge]!	Contains the nodes in this connection. |
| `total_count` | Int |
| `node` | LineItem	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `sku` | String |
| `line_item_id` | String |
| `serial_number` | String |
| `scanned` | Boolean |
| `created_at` | ISODateTime |
| `updated_at` | ISODateTime |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `warehouse_id` | String |
| `type` | LocationType |
| `name` | String |
| `zone` | String |
| `pickable` | Boolean |
| `sellable` | Boolean |
| `is_cart` | Boolean |
| `pick_priority` | Int |
| `dimensions` | Dimensions |
| `length` | String	Not used anymore. Use dimensions |
| `width` | String	Not used anymore. Use dimensions |
| `height` | String	Not used anymore. Use dimensions |
| `max_weight` | String	Not used anymore. Use dimensions |
| `temperature` | String |
| `products` | ProductConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `last_counted` | ISODateTime |
| `created_at` | ISODateTime |
| `expiration_lots` | LotConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `customer_account_id` | String |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [LocationEdge]!	Contains the nodes in this connection. |
| `node` | Location	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `location` | Location |
| `request_id` | String |
| `complexity` | Int |
| `data` | Location |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `name` | String |
| `daily_storage_cost` | String |
| `category` | String |
| `request_id` | String |
| `complexity` | Int |
| `data` | LocationConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `po_id` | String	An expiration lot could have more than one purchase order associated. Check purchase_orders field. |
| `name` | String |
| `sku` | String |
| `created_at` | ISODateTime |
| `updated_at` | ISODateTime |
| `expires_at` | ISODateTime |
| `received_at` | ISODateTime |
| `is_active` | Boolean |
| `locations` | LocationConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `purchase_orders` | PurchaseOrderConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [LotEdge]!	Contains the nodes in this connection. |
| `node` | Lot	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | LotConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `order_id` | String |
| `is_master` | Boolean	Indicates if it's the master order |
| `request_id` | String |
| `complexity` | Int |
| `id` | ID!	The ID of the object |
| `code` | Int |
| `error` | String |
| `id` | String |
| `legacy_id` | Int |
| `order_number` | String	The store's internal order number |
| `partner_order_id` | String	The order ID assigned by the storefront |
| `shop_name` | String |
| `fulfillment_status` | String	Status of the order (pending, fulfilled, cancelled, etc) |
| `order_date` | ISODateTime |
| `total_tax` | String |
| `subtotal` | String |
| `total_discounts` | String |
| `total_price` | String |
| `box_name` | String |
| `ready_to_ship` | Boolean	This field is no longer being updated and should not be used or relied on |
| `auto_print_return_label` | Boolean |
| `custom_invoice_url` | String |
| `account_id` | String |
| `updated_at` | ISODateTime |
| `created_at` | ISODateTime |
| `email` | String |
| `profile` | String |
| `gift_note` | String |
| `packing_note` | String |
| `required_ship_date` | ISODateTime |
| `shipping_lines` | ShippingLines |
| `shipping_address` | OrderAddress |
| `billing_address` | OrderAddress |
| `tags` | [String] |
| `line_items` | LineItemQuerySpecConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `search` | GenericScalar |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `authorizations` | [Authorization] |
| `holds` | OrderHolds |
| `shipments` | [Shipment] |
| `returns` | [Return] |
| `rma_labels` | [RMALabel] |
| `flagged` | Boolean |
| `saturday_delivery` | Boolean |
| `ignore_address_validation_errors` | Boolean |
| `skip_address_validation` | Boolean |
| `priority_flag` | Boolean |
| `allocation_priority` | Int |
| `allocations` | [OrderWarehouseAllocation] |
| `source` | String |
| `third_party_shipper` | OrderThirdPartyShipper |
| `gift_invoice` | Boolean |
| `allow_partial` | Boolean |
| `require_signature` | Boolean |
| `adult_signature_required` | Boolean |
| `alcohol` | Boolean |
| `expected_weight_in_oz` | String |
| `insurance` | Boolean |
| `insurance_amount` | String |
| `currency` | String |
| `has_dry_ice` | Boolean |
| `allow_split` | Boolean |
| `hold_until_date` | ISODateTime |
| `incoterms` | String |
| `tax_id` | String |
| `tax_type` | String |
| `dry_ice_weight_in_lbs` | String |
| `ftr_exemption` | Decimal |
| `address_is_business` | Boolean |
| `do_not_print_invoice` | Boolean |
| `ignore_payment_capture_errors` | Boolean |
| `order_history` | [OrderHistory] |
| `merged_orders` | [MergedOrder] |
| `attachments` | OrderAttachmentQuerySpecConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `search` | GenericScalar |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `wholesale_order` | WholesaleOrder |
| `order_id` | String! |
| `url` | URL! |
| `customer_account_id` | String |
| `filename` | String |
| `file_type` | String |
| `description` | String |
| `request_id` | String |
| `complexity` | Int |
| `attachment` | OrderAttachment |
| `first_name` | String |
| `last_name` | String |
| `company` | String |
| `address1` | String |
| `address2` | String |
| `city` | String |
| `state` | String |
| `state_code` | String |
| `zip` | String |
| `country` | String |
| `country_code` | String |
| `email` | String |
| `phone` | String |
| `id` | String |
| `legacy_id` | Int |
| `order_id` | String |
| `account_id` | String |
| `description` | String |
| `url` | String |
| `filename` | String |
| `file_type` | String |
| `file_size` | Int |
| `created_at` | ISODateTime |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [OrderAttachmentQuerySpecEdge]!	Contains the nodes in this connection. |
| `total_count` | Int |
| `node` | OrderAttachment	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [OrderEdge]!	Contains the nodes in this connection. |
| `node` | Order	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `order_id` | String |
| `user_id` | String |
| `account_id` | String |
| `username` | String |
| `order_number` | String |
| `information` | String |
| `created_at` | ISODateTime |
| `order` | Order |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [OrderHistoryEdge]!	Contains the nodes in this connection. |
| `node` | OrderHistory	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | OrderHistoryConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `fraud_hold` | Boolean |
| `address_hold` | Boolean |
| `shipping_method_hold` | Boolean |
| `operator_hold` | Boolean |
| `payment_hold` | Boolean |
| `client_hold` | Boolean |
| `order_id` | String |
| `warehouse_id` | String |
| `allocated_at` | ISODateTime |
| `line_item_id` | String |
| `sku` | String |
| `quantity_allocated` | Int |
| `is_kit_component` | Boolean |
| `allocation_reference` | String |
| `request_id` | String |
| `complexity` | Int |
| `order` | Order |
| `request_id` | String |
| `complexity` | Int |
| `data` | Order |
| `request_id` | String |
| `complexity` | Int |
| `shipment` | Shipment |
| `account_number` | String |
| `zip` | String |
| `country` | String |
| `order_id` | String |
| `warehouse_id` | String |
| `allocated_at` | ISODateTime |
| `allocation_reference` | String |
| `ready_to_ship` | Boolean |
| `line_items` | [OrderLineItemAllocation] |
| `is_locked` | Boolean |
| `request_id` | String |
| `complexity` | Int |
| `data` | OrderConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `legacy_id` | Int |
| `shipment_id` | String |
| `warehouse_id` | String |
| `order_id` | String |
| `order_number` | String |
| `user_id` | String |
| `user_first_name` | String |
| `user_last_name` | String |
| `total_items` | Int	The sum of every shipped item's quantity in the package |
| `unique_items` | Int	The number of unique shipped items in the package |
| `barcodes_scanned` | Int	The nuber of barcodes scanned in the package |
| `created_at` | ISODateTime |
| `shipment` | Shipment |
| `order` | Order |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [PackageEdge]!	Contains the nodes in this connection. |
| `node` | Package	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `line_items` | [PackageLineItemInput]! |
| `sku` | String! |
| `quantity` | Int! |
| `request_id` | String |
| `complexity` | Int |
| `data` | PackageConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `hasNextPage` | Boolean!	When paginating forwards, are there more items? |
| `hasPreviousPage` | Boolean!	When paginating backwards, are there more items? |
| `startCursor` | String	When paginating backwards, the cursor to continue. |
| `endCursor` | String	When paginating forwards, the cursor to continue. |
| `quantity` | Int! |
| `kind` | String	One of 'ftl', 'ltl', 'container'. Default = "ftl" |
| `page_size` | String	One of '4x6', 'letter'. Default = "letter" |
| `floor_loaded` | Boolean |
| `id` | String |
| `legacy_id` | Int |
| `user_id` | String |
| `tote_id` | String |
| `line_item_id` | String |
| `pending_shipment_line_item_id` | String |
| `location_id` | String |
| `warehouse_id` | String |
| `order_id` | String |
| `order_number` | String |
| `user_first_name` | String |
| `user_last_name` | String |
| `inventory_bin` | String |
| `sku` | String |
| `quantity` | Int	The number required |
| `picked_quantity` | Int	The number that was picked |
| `pick_type` | String |
| `barcode_scanned` | String |
| `created_at` | ISODateTime |
| `line_item` | LineItem |
| `order` | Order |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [PickEdge]!	Contains the nodes in this connection. |
| `node` | Pick	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | PickConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `name` | String	Name of the product |
| `sku` | String	Stock Keeping Unit |
| `price` | String	Price of the product This is a warehouse specific field |
| `value` | String	Price paid for the product This is a warehouse specific field |
| `value_currency` | String	This is a warehouse specific field |
| `barcode` | String |
| `country_of_manufacture` | String |
| `dimensions` | Dimensions |
| `tariff_code` | String |
| `kit` | Boolean |
| `kit_build` | Boolean |
| `no_air` | Boolean |
| `final_sale` | Boolean |
| `customs_value` | String |
| `customs_description` | String |
| `not_owned` | Boolean |
| `dropship` | Boolean |
| `needs_serial_number` | Boolean |
| `thumbnail` | String |
| `large_thumbnail` | String |
| `created_at` | ISODateTime |
| `updated_at` | ISODateTime |
| `product_note` | String |
| `virtual` | Boolean |
| `ignore_on_invoice` | Boolean |
| `ignore_on_customs` | Boolean |
| `active` | Boolean	This is a warehouse specific field |
| `needs_lot_tracking` | Boolean |
| `warehouse_products` | [WarehouseProduct]	The physical instances of the product, stored in warehouses |
| `fba_inventory` | [FbaInventory]	Inventory available at FBA |
| `images` | [ProductImage] |
| `tags` | [String] |
| `vendors` | [ProductVendor] |
| `components` | [Product]	For kits, this will be the list of products that make up the kit This has been replaced by kit_components |
| `kit_components` | [KitComponent]	For kits, this will be the list of references to the products that make up the kit and their quantities |
| `cases` | [Case] |
| `packer_note` | String |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [ProductEdge]!	Contains the nodes in this connection. |
| `node` | Product	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `src` | String	The url where the image is hosted |
| `position` | Int	The order in which the image should appear |
| `request_id` | String |
| `complexity` | Int |
| `product` | Product |
| `request_id` | String |
| `complexity` | Int |
| `data` | Product |
| `vendor_id` | String |
| `vendor_sku` | String |
| `price` | String |
| `request_id` | String |
| `complexity` | Int |
| `data` | ProductConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `legacy_id` | Int |
| `po_number` | String |
| `account_id` | String |
| `warehouse_id` | String |
| `vendor_id` | String |
| `created_at` | ISODateTime |
| `po_date` | ISODateTime	The expected date to arrive at the warehouse. |
| `date_closed` | ISODateTime |
| `arrived_at` | ISODateTime |
| `packing_note` | String |
| `fulfillment_status` | String |
| `po_note` | String |
| `description` | String |
| `partner_order_number` | String |
| `subtotal` | String |
| `discount` | String |
| `total_price` | String |
| `tax` | String |
| `shipping_method` | String |
| `shipping_carrier` | String |
| `shipping_name` | String |
| `shipping_price` | String |
| `tracking_number` | String |
| `pdf` | String |
| `images` | String |
| `payment_method` | String |
| `payment_due_by` | String |
| `payment_note` | String |
| `locking` | String |
| `locked_by_user_id` | String |
| `line_items` | PurchaseOrderLineItemConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `attachments` | PurchaseOrderAttachmentConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `vendor` | Vendor |
| `warehouse` | Warehouse |
| `origin_of_shipment` | String |
| `tracking_numbers` | PurchaseOrderTrackingNumberConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `ship_date` | DateTime |
| `id` | String |
| `legacy_id` | Int |
| `url` | String |
| `user_id` | String |
| `account_id` | String |
| `po_li_sku` | String |
| `description` | String |
| `filename` | String |
| `file_type` | String |
| `file_size` | Int |
| `created_at` | ISODateTime |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [PurchaseOrderAttachmentEdge]!	Contains the nodes in this connection. |
| `node` | PurchaseOrderAttachment	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [PurchaseOrderEdge]!	Contains the nodes in this connection. |
| `node` | PurchaseOrder	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `po_id` | String |
| `account_id` | String |
| `warehouse_id` | String |
| `vendor_id` | String |
| `po_number` | String |
| `sku` | String |
| `vendor_sku` | String |
| `product_id` | String |
| `variant_id` | Int |
| `quantity` | Int |
| `quantity_received` | Int |
| `quantity_rejected` | Int |
| `price` | String |
| `product_name` | String |
| `option_title` | String |
| `expected_weight_in_lbs` | String |
| `fulfillment_status` | String |
| `sell_ahead` | Int |
| `note` | String |
| `partner_line_item_id` | String |
| `barcode` | String |
| `updated_at` | ISODateTime |
| `created_at` | ISODateTime |
| `vendor` | Vendor |
| `product` | WarehouseProduct |
| `expiration_lots` | LotConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [PurchaseOrderLineItemEdge]!	Contains the nodes in this connection. |
| `node` | PurchaseOrderLineItem	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | PurchaseOrder |
| `id` | String |
| `legacy_id` | Int |
| `po_id` | String |
| `carrier_id` | String |
| `carrier_value` | String |
| `tracking_number` | String |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [PurchaseOrderTrackingNumberEdge]!	Contains the nodes in this connection. |
| `node` | PurchaseOrderTrackingNumber	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | PurchaseOrderConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `order_id` | String |
| `rma_id` | String |
| `shipment_id` | String |
| `shipping_name` | String |
| `tracking_number` | String |
| `status` | String |
| `carrier` | String |
| `shipping_method` | String |
| `cost` | String |
| `box_code` | String |
| `dimensions` | Dimensions |
| `address` | Address |
| `paper_pdf_location` | String |
| `thermal_pdf_location` | String |
| `pdf_location` | String |
| `image_location` | String |
| `delivered` | Boolean |
| `picked_up` | Boolean |
| `refunded` | Boolean |
| `needs_refund` | Boolean |
| `profile` | String |
| `full_size_to_print` | String |
| `partner_fulfillment_id` | String |
| `created_at` | ISODateTime |
| `updated_at` | ISODateTime |
| `id` | String |
| `legacy_id` | Int |
| `tracking_number` | String |
| `status` | String |
| `created_date` | ISODateTime |
| `carrier` | String |
| `shipping_method` | String |
| `cost` | String |
| `dimensions` | Dimensions |
| `length` | Float	Use dimensions instead |
| `width` | Float	Use dimensions instead |
| `height` | Float	Use dimensions instead |
| `weight` | Float	Use dimensions instead |
| `to_name` | String |
| `address1` | String |
| `address2` | String |
| `address_city` | String |
| `address_state` | String |
| `address_zip` | String |
| `address_country` | String |
| `pdf_location` | String |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `id` | String! |
| `request_id` | String |
| `complexity` | Int |
| `bill` | Bill |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `sku` | String! |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `sku` | String! |
| `components` | [RemoveKitComponentInput]! |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String!	The id of the order you want to modify |
| `line_item_ids` | [String] |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `vendor_id` | String! |
| `sku` | String! |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `sku` | String! |
| `warehouse_id` | String! |
| `quantity` | Int! |
| `reason` | String |
| `location_id` | String |
| `includes_non_sellable` | Boolean |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `order_id` | String |
| `partner_id` | String |
| `reason` | String |
| `status` | String |
| `label_type` | ReturnLabelType |
| `label_cost` | String |
| `labels` | [RMALabelType] |
| `cost_to_customer` | String |
| `shipping_carrier` | String |
| `shipping_method` | String |
| `dimensions` | Dimensions |
| `address` | Address |
| `line_items` | [ReturnLineItem] |
| `total_items_expected` | Int |
| `total_items_received` | Int |
| `total_items_restocked` | Int |
| `created_at` | ISODateTime |
| `display_issue_refund` | Boolean |
| `order` | Order |
| `exchanges` | [ReturnExchange] |
| `return_history` | [ReturnHistory] |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [ReturnEdge]!	Contains the nodes in this connection. |
| `node` | Return	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `exchange_order_id` | String |
| `return_id` | String |
| `account_id` | String |
| `exchange_order` | Order |
| `exchange_items` | [ReturnExchangeItem] |
| `original_return` | Return |
| `id` | String |
| `legacy_id` | Int |
| `return_item_id` | String |
| `sku` | String |
| `quantity` | Int |
| `request_id` | String |
| `complexity` | Int |
| `data` | ReturnExchange |
| `id` | String |
| `legacy_id` | Int |
| `return_id` | String |
| `account_id` | String |
| `user_id` | String |
| `created_at` | ISODateTime |
| `body` | String |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `line_item_id` | String |
| `warehouse_id` | String |
| `product_id` | String |
| `return_id` | String |
| `quantity` | Int |
| `quantity_received` | Int |
| `restock` | Int |
| `condition` | String |
| `is_component` | Boolean |
| `type` | String |
| `reason` | String |
| `created_at` | ISODateTime |
| `updated_at` | ISODateTime |
| `line_item` | LineItem |
| `product` | Product |
| `warehouse` | Warehouse |
| `request_id` | String |
| `complexity` | Int |
| `data` | Return |
| `request_id` | String |
| `complexity` | Int |
| `data` | ReturnConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `po_id` | String! |
| `status` | String! |
| `request_id` | String |
| `complexity` | Int |
| `purchase_order` | PurchaseOrder |
| `id` | String |
| `legacy_id` | Int |
| `order_id` | String |
| `user_id` | String |
| `warehouse_id` | String |
| `pending_shipment_id` | String |
| `address` | Address |
| `profile` | String |
| `picked_up` | Boolean |
| `needs_refund` | Boolean |
| `refunded` | Boolean |
| `delivered` | Boolean |
| `shipped_off_shiphero` | Boolean |
| `dropshipment` | Boolean |
| `completed` | Boolean	This field indicates if store was notified about the shipment. It should be 'true' by default and 'false' when using the Bulk Ship UI. |
| `created_date` | ISODateTime |
| `line_items` | ShipmentLineItemConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `shipping_labels` | [ShippingLabel] |
| `warehouse` | Warehouse |
| `order` | Order |
| `total_packages` | Int |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [ShipmentEdge]!	Contains the nodes in this connection. |
| `total_count` | Int |
| `node` | Shipment	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `line_item_id` | String |
| `shipment_id` | String |
| `shipping_label_id` | String |
| `quantity` | Int |
| `line_item` | LineItem |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [ShipmentLineItemEdge]!	Contains the nodes in this connection. |
| `node` | ShipmentLineItem	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | Shipment |
| `request_id` | String |
| `complexity` | Int |
| `data` | ShipmentConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `search` | GenericScalar |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `quantity` | Int! |
| `sku` | String! |
| `id` | String |
| `legacy_id` | Int |
| `line_item_id` | String |
| `lot_id` | String |
| `lot_name` | String |
| `lot_expiration_date` | ISODateTime |
| `address` | CreateOrderAddressInput! |
| `carrier` | String! |
| `method` | String! |
| `tracking_number` | String |
| `tracking_url` | String |
| `label_url` | String |
| `cost` | String |
| `line_items` | [ShippedLineItemInput] |
| `dimensions` | DimensionsInput |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `warehouse_id` | String |
| `container_id` | String |
| `carrier` | String |
| `shipping_methods` | [String] |
| `shipping_labels` | ShippingLabelConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `note` | String |
| `needs_manifest` | Boolean |
| `created_at` | ISODateTime |
| `updated_at` | ISODateTime |
| `shipped_at` | ISODateTime |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [ShippingContainerEdge]!	Contains the nodes in this connection. |
| `total_count` | Int |
| `node` | ShippingContainer	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | ShippingContainer |
| `request_id` | String |
| `complexity` | Int |
| `data` | ShippingContainerConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `search` | GenericScalar |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `shipment_id` | String |
| `order_id` | String |
| `box_id` | String |
| `box_name` | String |
| `status` | String |
| `tracking_number` | String |
| `alternate_tracking_id` | String |
| `order_number` | String |
| `order_account_id` | String |
| `carrier` | String |
| `shipping_name` | String |
| `shipping_method` | String |
| `cost` | String |
| `box_code` | String |
| `device_id` | String |
| `delivered` | Boolean |
| `picked_up` | Boolean |
| `refunded` | Boolean |
| `needs_refund` | Boolean |
| `profile` | String |
| `partner_fulfillment_id` | String |
| `full_size_to_print` | String |
| `packing_slip` | String |
| `warehouse` | String |
| `warehouse_id` | String |
| `insurance_amount` | String |
| `carrier_account_id` | String |
| `source` | String |
| `created_date` | ISODateTime |
| `tracking_url` | String |
| `dimensions` | Dimensions |
| `label` | LabelResource |
| `address` | Address |
| `order` | Order |
| `shipment_line_items` | ShipmentLineItemConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `package_number` | Int |
| `parcelview_url` | String |
| `tracking_status` | String |
| `in_shipping_container` | Boolean |
| `shipping_container_id` | String |
| `last_mile_labels` | LastMileLabel |
| `serial_numbers` | [LineItemSerialNumber] |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [ShippingLabelEdge]!	Contains the nodes in this connection. |
| `node` | ShippingLabel	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `title` | String |
| `carrier` | String |
| `method` | String |
| `price` | String |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `warehouse_id` | String |
| `created_at` | ISODateTime |
| `fulfillment_status` | String |
| `warehouse_note` | String |
| `vendor_po_number` | String |
| `subtotal` | String |
| `shipping_price` | String |
| `total_price` | String |
| `shipping_method` | String |
| `shipping_carrier` | String |
| `shipping_name` | String |
| `tracking_number` | String |
| `warehouse` | Warehouse |
| `pdf_location` | String |
| `line_items` | ShippingPlanLineItemConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `packages` | ShippingPlanPackageConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `pallets` | ShippingPlanPalletConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `origin_of_shipment` | String |
| `tracking_numbers` | ShippingPlanTrackingNumberConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `warehouse_id` | String |
| `sku` | String |
| `vendor_sku` | String |
| `product_id` | String |
| `variant_id` | Int |
| `quantity` | Int |
| `quantity_received` | Int |
| `quantity_rejected` | Int |
| `price` | String |
| `product_name` | String |
| `option_title` | String |
| `expected_weight_in_lbs` | String |
| `fulfillment_status` | String |
| `sell_ahead` | Int |
| `note` | String |
| `partner_line_item_id` | String |
| `barcode` | String |
| `updated_at` | ISODateTime |
| `created_at` | ISODateTime |
| `product` | WarehouseProduct |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [ShippingPlanLineItemEdge]!	Contains the nodes in this connection. |
| `node` | ShippingPlanLineItem	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `box_number` | String |
| `line_items` | ShippingPlanPackageLineItemConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [ShippingPlanPackageEdge]!	Contains the nodes in this connection. |
| `node` | ShippingPlanPackage	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `sku` | String |
| `quantity` | Int |
| `created_at` | ISODateTime |
| `product` | Product |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [ShippingPlanPackageLineItemEdge]!	Contains the nodes in this connection. |
| `node` | ShippingPlanPackageLineItem	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `kind` | String |
| `quantity` | Int |
| `floor_loaded` | Boolean |
| `page_size` | String |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [ShippingPlanPalletEdge]!	Contains the nodes in this connection. |
| `node` | ShippingPlanPallet	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | ShippingPlan |
| `id` | String |
| `legacy_id` | Int |
| `po_id` | String |
| `carrier_id` | String |
| `carrier_value` | String |
| `tracking_number` | String |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [ShippingPlanTrackingNumberEdge]!	Contains the nodes in this connection. |
| `node` | ShippingPlanTrackingNumber	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `id` | String! |
| `id` | String |
| `legacy_id` | Int |
| `name` | String |
| `barcode` | String |
| `warehouse` | Warehouse |
| `orders` | [Order] |
| `picks` | [TotePick] |
| `request_id` | String |
| `complexity` | Int |
| `data` | Tote |
| `tote_name` | String |
| `tote_id` | String |
| `action` | String |
| `created_at` | ISODateTime |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [ToteHistoryEdge]!	Contains the nodes in this connection. |
| `node` | ToteHistory	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | ToteHistoryConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `legacy_id` | Int |
| `sku` | String |
| `created_at` | ISODateTime |
| `updated_at` | ISODateTime |
| `tote_id` | String |
| `current` | Int |
| `picked_quantity` | Int |
| `quantity` | Int |
| `inventory_bin` | String |
| `line_item` | LineItem |
| `location` | Location |
| `deducted` | Boolean |
| `customer_account_id` | String |
| `sku` | String! |
| `warehouse_id` | String! |
| `quantity` | Int! |
| `location_from_id` | String! |
| `location_to_id` | String! |
| `reason` | String |
| `request_id` | String |
| `complexity` | Int |
| `ok` | Boolean |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `id` | String! |
| `status` | String!	Bill status: draft, paid, finalize |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `sku` | String! |
| `warehouse_id` | String! |
| `quantity` | Int! |
| `reason` | String |
| `location_id` | String |
| `request_id` | String |
| `complexity` | Int |
| `warehouse_product` | WarehouseProduct |
| `id` | String! |
| `partner_line_item_id` | String |
| `quantity` | Int |
| `price` | String |
| `product_name` | String |
| `option_title` | String |
| `fulfillment_status` | String |
| `quantity_pending_fulfillment` | Int |
| `custom_options` | GenericScalar |
| `custom_barcode` | String |
| `eligible_for_return` | Boolean |
| `customs_value` | String	A decimal value used for customs |
| `warehouse_id` | String	Set to lock to that warehouse. The item will not be moved in any multi-warhouse processing |
| `barcode` | String |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String!	The id of the order you want to modify |
| `line_items` | [UpdateLineItemInput] |
| `location_id` | String!	The id of the location you want to modify |
| `zone` | String |
| `location_type_id` | String |
| `pickable` | Boolean |
| `sellable` | Boolean |
| `is_cart` | Boolean |
| `pick_priority` | Int |
| `dimensions` | DimensionsInput |
| `temperature` | String |
| `lot_id` | String! |
| `name` | String |
| `sku` | String |
| `expires_at` | ISODateTime |
| `is_active` | Boolean |
| `request_id` | String |
| `complexity` | Int |
| `lot` | Lot |
| `lots_ids` | [String]! |
| `is_active` | Boolean |
| `request_id` | String |
| `complexity` | Int |
| `ok` | Boolean |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String!	The id of the order you want to modify |
| `fulfillment_status` | String! |
| `remove_inventory` | Boolean	Whether or not to remove inventory if the order is being cancelled |
| `reason` | String |
| `void_on_platform` | Boolean	Whether or not to void the order on the sales platform if the order is being cancelled |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String!	The id of the order you want to modify |
| `payment_hold` | Boolean |
| `operator_hold` | Boolean |
| `fraud_hold` | Boolean |
| `address_hold` | Boolean |
| `client_hold` | Boolean |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String!	The id of the order you want to modify |
| `order_number` | String |
| `partner_order_id` | String |
| `fulfillment_status` | String |
| `order_date` | ISODateTime |
| `total_tax` | String |
| `total_discounts` | String |
| `box_name` | String |
| `ready_to_ship` | Boolean |
| `insurance_amount` | Decimal |
| `required_ship_date` | ISODateTime |
| `allocation_priority` | Int |
| `shipping_lines` | CreateShippingLinesInput |
| `shipping_address` | CreateOrderAddressInput |
| `billing_address` | CreateOrderAddressInput |
| `profile` | String |
| `packing_note` | String |
| `tags` | [String] |
| `gift_note` | String |
| `gift_invoice` | Boolean |
| `require_signature` | Boolean |
| `adult_signature_required` | Boolean |
| `alcohol` | Boolean |
| `insurance` | Boolean |
| `allow_partial` | Boolean |
| `allow_split` | Boolean |
| `priority_flag` | Boolean |
| `hold_until_date` | ISODateTime |
| `incoterms` | String |
| `tax_id` | String |
| `tax_type` | String |
| `history_entry` | UserNoteInput |
| `ignore_address_validation_errors` | Boolean	US addresses are be validated and when errors occur the order will have an address hold created. If this flag is set then the error validation is skipped and no address hold is created |
| `skip_address_validation` | Boolean	Not address validation will be performed |
| `custom_invoice_url` | String |
| `auto_print_return_label` | Boolean |
| `dry_ice_weight_in_lbs` | String |
| `ftr_exemption` | Decimal |
| `address_is_business` | Boolean |
| `do_not_print_invoice` | Boolean |
| `ignore_payment_capture_errors` | Boolean |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String!	The id of the order you want to modify |
| `case_barcode` | String! |
| `case_quantity` | Int! |
| `src` | String! |
| `position` | Int |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `sku` | String! |
| `name` | String |
| `dimensions` | DimensionsInput |
| `tariff_code` | String |
| `product_note` | String |
| `country_of_manufacture` | String |
| `needs_serial_number` | Boolean |
| `dropship` | Boolean |
| `barcode` | String |
| `customs_description` | String |
| `ignore_on_customs` | Boolean |
| `ignore_on_invoice` | Boolean |
| `tags` | [String]	Fully replaces existen tags with the ones provided |
| `vendors` | [UpdateProductVendorInput] |
| `final_sale` | Boolean |
| `virtual` | Boolean |
| `needs_lot_tracking` | Boolean |
| `images` | [UpdateProductImageInput] |
| `packer_note` | String |
| `cases` | [UpdateProductCaseInput] |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `vendor_id` | String! |
| `vendor_sku` | String |
| `price` | String |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `po_id` | String! |
| `packing_note` | String |
| `po_note` | String |
| `description` | String |
| `partner_order_number` | String |
| `discount` | String |
| `tax` | String |
| `line_items` | [UpdatePurchaseOrderLineItemInput] |
| `shipping_method` | String |
| `shipping_carrier` | String |
| `shipping_name` | String |
| `shipping_price` | String |
| `tracking_number` | String |
| `pdf` | String |
| `payment_method` | String |
| `payment_due_by` | String |
| `payment_note` | String |
| `po_date` | ISODateTime |
| `clear_po_date` | Boolean |
| `sku` | String! |
| `quantity` | Int |
| `quantity_received` | Int |
| `quantity_rejected` | Int |
| `sell_ahead` | Int |
| `price` | String |
| `note` | String |
| `request_id` | String |
| `complexity` | Int |
| `purchase_order` | PurchaseOrder |
| `return_id` | String! |
| `status` | String! |
| `request_id` | String |
| `complexity` | Int |
| `return` | Return |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `order_id` | String!	The id of the order you want to modify |
| `tags` | [String] |
| `customer_account_id` | String	Use this when you are a 3PL acting on behalf of one of your customers |
| `sku` | String! |
| `warehouse_id` | String! |
| `on_hand` | Int |
| `price` | String |
| `value` | String |
| `value_currency` | String |
| `inventory_bin` | String |
| `inventory_overstock_bin` | String |
| `reserve_inventory` | Int |
| `replenishment_level` | Int |
| `reorder_amount` | Int |
| `reorder_level` | Int |
| `customs_value` | String |
| `active` | Boolean |
| `replenishment_max_level` | Int |
| `replenishment_increment` | Int |
| `wholesale_line_item_id` | String! |
| `unit_of_measure` | String |
| `wholesale_order_id` | String!	The id of the wholesale order you want to modify |
| `staging_location_id` | Int |
| `pickup_date` | ISODateTime |
| `preparation_date` | ISODateTime |
| `order_type` | String |
| `gs1_labels_required` | Boolean |
| `trading_partner_id` | String |
| `trading_partner_name` | String |
| `store_location_number` | String |
| `distribution_center` | String |
| `vendor` | String |
| `vendor_id` | String |
| `requested_delivery_date` | ISODateTime |
| `ship_not_before_date` | ISODateTime |
| `ship_no_later_than_date` | ISODateTime |
| `depositor_order_number` | String |
| `department` | String |
| `division` | String |
| `service_level` | String |
| `internal_supplier_number` | String |
| `terms_of_sale` | String |
| `retailer_notes` | String |
| `quote_number` | String |
| `sales_requirement_code` | String |
| `reference_fields` | JSONObjectScalar |
| `wholesale_shipping_details` | WholesaleShippingDetailsInput |
| `wholesale_line_items` | [UpdateWholesaleLineItemInput] |
| `shipping_option` | WholesaleShippingOptions |
| `id` | String |
| `legacy_id` | Int |
| `email` | String |
| `first_name` | String |
| `last_name` | String |
| `account` | Account |
| `source` | String |
| `message` | String |
| `is_expired` | Boolean	There's no time window anymore, this will be always False |
| `expiration_date` | ISODateTime	There's no time window anymore, this will be always empty |
| `time_remaining` | String	There's no time window anymore, this will be always empty |
| `credits_remaining` | Int |
| `max_available` | Int |
| `increment_rate` | Int |
| `id` | String |
| `legacy_id` | Int |
| `name` | String |
| `email` | String |
| `account_number` | String |
| `account_id` | String |
| `address` | Address |
| `currency` | String |
| `internal_note` | String |
| `default_po_note` | String |
| `logo` | String |
| `partner_vendor_id` | Int |
| `created_at` | ISODateTime |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [VendorEdge]!	Contains the nodes in this connection. |
| `node` | Vendor	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | VendorConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `identifier` | String	Name of the warehouse |
| `dynamic_slotting` | Boolean |
| `invoice_email` | String |
| `phone_number` | String |
| `profile` | String |
| `address` | Address |
| `return_address` | Address |
| `company_name` | String |
| `company_alias` | String |
| `products` | ProductConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `sku` | String	Stock Keeping Unit |
| `warehouse_id` | String |
| `warehouse_identifier` | String	The warehouse identifier, usually Primary/Secondary |
| `price` | String	Price of the product |
| `value` | String	Price paid for the product |
| `value_currency` | String |
| `on_hand` | Int	The total count of a SKU physically in the warehouse. (Note, Available is the count indicated in your sales channels) |
| `inventory_bin` | String	The name of the bin where the product is stored |
| `inventory_overstock_bin` | String	The name of the bin where overstock is stored |
| `reserve_inventory` | Int	Count of a SKU that is not to be sold in your sales channel.For example, if you’re running a flash sale and want to hold some stock for returns or exchanges, you would enter your full inventory of say 100 units as the On Hand and a Reserve of 5 units. We’ll then tell the platform that you have 95 available for sale (On Hand minus Reserve). The Available count will remain 100 |
| `replenishment_level` | Int	Available only for accounts that use Dynamic Slotting and used specifically for replenishment reports. SKUs will appear on the replenishment report if inventory allocated and not enough in pickable bins, or if the pickable bin inventory is less than the replenishment level |
| `reorder_amount` | Int	The number that should be reordered when a SKU reaches the Reorder Level |
| `reorder_level` | Int	The Available value a SKU must reach to trigger a Reorder. (See Reorder Amount). Setting this to 0 will prevent a SKU from automatically being added to a PO |
| `backorder` | Int	Count of how many units you owe to customers for open orders and don’t have stock for in the warehouse |
| `allocated` | Int	Count of how many units you have in stock and owe to customers for open orders |
| `available` | Int	The number of available stock for any given SKU that is pushed to any connected sales channel. This is On Hand minus any allocations to open orders. |
| `non_sellable_quantity` | Int	Count of non sellable units of a SKU in the warehouse. |
| `in_tote` | Int	Total number of units picked in totes |
| `custom` | Boolean |
| `customs_value` | String |
| `created_at` | ISODateTime |
| `updated_at` | ISODateTime |
| `sell_ahead` | Int |
| `active` | Boolean |
| `warehouse` | Warehouse |
| `product` | Product |
| `inbounds` | WarehouseProductInboundConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `status` | String |
| `created_from` | ISODateTime |
| `created_to` | ISODateTime |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `locations` | ItemLocationConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `customer_account_id` | String |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [WarehouseProductEdge]!	Contains the nodes in this connection. |
| `node` | WarehouseProduct	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `sku` | String |
| `warehouse_id` | String |
| `po_id` | String |
| `purchase_order_line_item_id` | String |
| `po_date` | ISODateTime |
| `quantity` | Int |
| `quantity_received` | Int |
| `quantity_rejected` | Int |
| `sell_ahead` | Int |
| `status` | String |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [WarehouseProductInboundEdge]!	Contains the nodes in this connection. |
| `node` | WarehouseProductInbound	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `warehouse_product` | WarehouseProduct |
| `request_id` | String |
| `complexity` | Int |
| `data` | WarehouseProductConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | String |
| `shop_name` | String |
| `name` | String |
| `url` | String |
| `source` | String |
| `shared_signature_secret` | String	This will only be returned once when the webhook is created. |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [WebhookEdge]!	Contains the nodes in this connection. |
| `node` | Webhook	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `data` | WebhookConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `legacy_id` | Int |
| `line_item` | LineItem |
| `unit_of_measure` | String |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [WholesaleLineItemsQuerySpecEdge]!	Contains the nodes in this connection. |
| `total_count` | Int |
| `node` | WholesaleLineItem	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `id` | String |
| `legacy_id` | Int |
| `version` | WholesaleOrderVersion |
| `fulfillment_flow` | WholesaleFulfillmentFlowOptions |
| `shipping_option` | WholesaleShippingOptions |
| `staging_location_id` | Int |
| `picking_flow` | WholesaleOrderPickingFlow |
| `outbound_progress` | WholesaleOrderOutboundProgress |
| `pickup_date` | ISODateTime |
| `status` | WholesaleOrderStatus |
| `status_message` | String |
| `preparation_date` | ISODateTime |
| `order_type` | String |
| `gs1_labels_required` | Boolean |
| `trading_partner_id` | String |
| `trading_partner_name` | String |
| `store_location_number` | String |
| `distribution_center` | String |
| `vendor` | String |
| `vendor_id` | String |
| `requested_delivery_date` | ISODateTime |
| `ship_not_before_date` | ISODateTime |
| `ship_no_later_than_date` | ISODateTime |
| `depositor_order_number` | String |
| `department` | String |
| `division` | String |
| `service_level` | String |
| `internal_supplier_number` | String |
| `terms_of_sale` | String |
| `retailer_notes` | String |
| `quote_number` | String |
| `sales_requirement_code` | String |
| `reference_fields` | JSONObjectScalar |
| `order` | Order |
| `wholesale_shipping_details` | [WholesaleShippingDetails] |
| `wholesale_line_items` | WholesaleLineItemsQuerySpecConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `search` | GenericScalar |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [WholesaleOrderEdge]!	Contains the nodes in this connection. |
| `node` | WholesaleOrder	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `wholesale_order` | WholesaleOrder |
| `request_id` | String |
| `complexity` | Int |
| `data` | WholesaleOrder |
| `request_id` | String |
| `complexity` | Int |
| `data` | WholesaleOrderConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
| `id` | String |
| `legacy_id` | Int |
| `account_number` | String	Account number |
| `scac` | String	SCAC code for the shipping details |
| `carrier` | String	Shipping carrier |
| `shipping_method` | String	Shipping method |
| `bill_of_lading` | String	Bill of lading number |
| `cost` | Decimal	Shipping cost |
| `trailer_number` | String	Trailer number |
| `pro_number` | String	PRO number |
| `scac` | String	SCAC code for the shipping details |
| `freighter` | String	Freighter information |
| `bill_of_lading` | String	Bill of lading number |
| `cost` | Float	Shipping cost |
| `trailer_number` | String	Trailer number |
| `pro_number` | String	PRO number |
| `carrier` | String	Shipping carrier (overrides order.shipping_carrier) |
| `shipping_method` | String	Shipping method (overrides order.shipping_method) |
| `sku` | String |
| `account_id` | ID |
| `to_pick_quantity` | Int |
| `picked_quantity` | Int |
| `pick_location_id` | ID |
| `to_create_quantity` | Int |
| `created_quantity` | Int |
| `receiving_location` | Location |
| `staging_location` | Location |
| `account_id` | ID |
| `sku` | String |
| `created_at` | DateTime |
| `updated_at` | DateTime |
| `components` | [WorkOrderAssemblyComponentType] |
| `items_to_pick` | Int |
| `items_per_kit` | Int |
| `url` | String! |
| `filename` | String! |
| `id` | String |
| `legacy_id` | Int |
| `account_id` | Int |
| `warehouse_id` | ID |
| `name` | String |
| `configuration` | String |
| `type` | WorkOrderType |
| `scheduled_date` | DateTime |
| `requested_date` | DateTime |
| `started_at` | DateTime |
| `ended_at` | DateTime |
| `ready_to_pick_at` | DateTime |
| `assembly_in_progress_at` | DateTime |
| `completed_at` | DateTime |
| `created_at` | DateTime |
| `updated_at` | DateTime |
| `status` | WorkOrderStatus |
| `has_special_project` | Boolean |
| `priority` | WorkOrderPriority |
| `notes` | [WorkOrderNotesType] |
| `assembly_sku` | WorkOrderAssemblySkuType |
| `lot_name` | String |
| `lot_expiration_date` | Date |
| `pageInfo` | PageInfo!	Pagination data for this connection. |
| `edges` | [WorkOrderIdentifiableTypeEdge]!	Contains the nodes in this connection. |
| `node` | WorkOrderIdentifiableType	The item at the end of the edge |
| `cursor` | String!	A cursor for use in pagination |
| `request_id` | String |
| `complexity` | Int |
| `work_order` | WorkOrderIdentifiableType |
| `note` | String |
| `type` | WorkOrdersNoteType |
| `account_id` | ID |
| `created_at` | DateTime |
| `updated_at` | DateTime |
| `request_id` | String |
| `complexity` | Int |
| `data` | WorkOrderIdentifiableType |
| `request_id` | String |
| `complexity` | Int |
| `data` | WorkOrderIdentifiableTypeConnection |
**Arguments**
| Name | Description |
| --- | --- |
| `sort` | String |
| `before` | String |
| `after` | String |
| `first` | Int |
| `last` | Int |
---

