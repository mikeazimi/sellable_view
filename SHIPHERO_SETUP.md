# ShipHero API Integration Guide

## 🚀 Quick Setup

Your ShipHero API integration is configured for **3PL operations** with customer account filtering.

### 1. Get Your Refresh Token

1. Log into ShipHero: https://app.shiphero.com
2. Go to **My Account** → **Third-Party Developer**
3. Create or view your developer user
4. Copy the **Refresh Token**

### 2. Get Your Customer Account ID (Optional)

Since you're a 3PL, you can filter data by specific customer accounts:

#### Option A: Use the UUID Query (Recommended)

If you have the legacy customer account ID:

```bash
curl -X POST https://public-api.shiphero.com/graphql \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { uuid(legacy_id: YOUR_LEGACY_ID, entity: CustomerAccount) { data { legacy_id id } } }"
  }'
```

#### Option B: Query Customer Accounts

```graphql
query GetCustomerAccounts {
  account {
    data {
      customers {
        edges {
          node {
            id
            legacy_id
            name
          }
        }
      }
    }
  }
}
```

### 3. Set Environment Variables

#### Local Development

**The dev token is already configured!** Check `.env.local`:

```env
SHIPHERO_REFRESH_TOKEN=dYbj7j9dspqoxwAtW5S2TOBNacIYvv7BKFwQqbArw7mv-
# SHIPHERO_CUSTOMER_ACCOUNT_ID=  # Add your customer account ID here
```

To filter by a specific customer account, uncomment and set:
```env
SHIPHERO_CUSTOMER_ACCOUNT_ID=Q3VzdG9tZXJBY2NvdW50OjEyMzQ1
```

#### Production (Vercel)

Add environment variables to Vercel:

```bash
# Add refresh token
vercel env add SHIPHERO_REFRESH_TOKEN

# Add customer account ID (optional - leave empty to see all customers)
vercel env add SHIPHERO_CUSTOMER_ACCOUNT_ID
```

Or via Vercel Dashboard:
https://vercel.com/mikeazimi-dischubcoms-projects/sellable-view/settings/environment-variables

### 4. Test Your Connection

#### Quick UI Test (Recommended)

1. Start the dev server:
```bash
pnpm dev
```

2. Visit the Settings page:
```
http://localhost:3000/settings
```

3. Use the **Quick Test Token** button to auto-fill the dev token
4. Click **Refresh Token** to generate an access token
5. You should see a success message!

#### API Test

Visit these endpoints to verify:

**Local:**
```bash
# Test connection
http://localhost:3000/api/shiphero/test-connection

# List inventory
http://localhost:3000/api/inventory/list

# Search inventory
http://localhost:3000/api/inventory/search?q=SKU
```

**Production:**
```bash
# Deploy first
git push origin main

# Then visit:
https://sellable-view.vercel.app/settings
https://sellable-view.vercel.app/api/shiphero/test-connection
```

---

## 📡 Available API Endpoints

### Test Connection
- **GET** `/api/shiphero/test-connection`
- Tests authentication and shows account info

### Warehouses
- **GET** `/api/shiphero/warehouses`
- Lists all warehouses for your account

### Inventory Management
- **GET** `/api/inventory/list?warehouse_id=xxx&sku=xxx`
- Lists inventory with optional filtering
- Automatically filtered by customer_account_id if set

- **GET** `/api/inventory/search?q=searchterm&warehouse_id=xxx`
- Searches inventory by SKU or product name
- Automatically filtered by customer_account_id if set

---

## 🔧 How the 3PL Filtering Works

When `SHIPHERO_CUSTOMER_ACCOUNT_ID` is set:
- ✅ All API queries automatically include `customer_account_id` parameter
- ✅ Only data for that specific customer will be returned
- ✅ Other customers' data is completely hidden

When `SHIPHERO_CUSTOMER_ACCOUNT_ID` is NOT set:
- 📊 All customer data will be returned
- 🔍 You'll see inventory/orders across all your 3PL customers

---

## 💡 Usage Examples

### TypeScript/React Example

```typescript
// In your React component or API route
import { getShipHeroClient, getCustomerAccountId } from '@/lib/shiphero';

async function getInventory() {
  const client = getShipHeroClient();
  const customerAccountId = getCustomerAccountId();
  
  const query = `
    query GetInventory($customer_account_id: String) {
      warehouse_products(
        customer_account_id: $customer_account_id
        first: 50
      ) {
        data {
          edges {
            node {
              sku
              on_hand
              available
              warehouse_identifier
            }
          }
        }
      }
    }
  `;
  
  const response = await client.query(query, {}, customerAccountId);
  return response;
}
```

### Fetching from Frontend

```typescript
// In your React component
async function fetchInventory() {
  const response = await fetch('/api/inventory/list');
  const data = await response.json();
  
  if (data.success) {
    console.log('Inventory:', data.data);
    console.log('ShipHero Request ID:', data.meta.request_id);
  }
}
```

---

## 🔍 Important Notes

### Token Management
- Access tokens expire after **28 days**
- The auth client automatically refreshes tokens
- Tokens are cached in memory for performance
- Token refresh includes a 5-minute safety buffer

### 3PL Customer Account Filtering
- Customer account ID must be in **UUID format** (e.g., `Q3VzdG9tZXJBY2NvdW50OjEyMzQ1`)
- NOT the legacy integer ID
- Use the `uuid` query to convert legacy IDs if needed

### Rate Limiting
- ShipHero uses complexity-based rate limiting
- Each response includes `complexity` score
- The client includes automatic retry with exponential backoff
- Rate limit errors are automatically retried

### Security
- **NEVER** commit `.env.local` to git (already in `.gitignore`)
- Refresh tokens are sensitive - treat like passwords
- Only use tokens on the server-side (API routes)
- Never expose tokens to client-side code

---

## 🛠️ Troubleshooting

### "SHIPHERO_REFRESH_TOKEN environment variable is not set"

**Solution:** Add the refresh token to your environment:
1. Local: Add to `.env.local`
2. Vercel: Add via `vercel env add` or dashboard

### "Authentication failed - token may be expired"

**Solution:** Your refresh token may be invalid or expired:
1. Generate a new refresh token in ShipHero
2. Update your environment variables
3. Redeploy if on Vercel

### "No data for customer account"

**Possible causes:**
1. Customer account ID is incorrect (check format - should be UUID)
2. Customer account doesn't have any data yet
3. Customer account ID doesn't belong to your 3PL

**Solution:** Test without customer account ID first to see all data:
1. Remove `SHIPHERO_CUSTOMER_ACCOUNT_ID` from environment
2. Redeploy
3. Check `/api/shiphero/test-connection`

### "Rate limit exceeded"

**Solution:** The client will automatically retry, but you can:
1. Reduce complexity of queries (request fewer fields)
2. Implement caching for frequently accessed data
3. Wait a moment before retrying manually

---

## 📚 Additional Resources

- **ShipHero Developer Docs**: https://developer.shiphero.com/
- **GraphQL Schema**: https://developer.shiphero.com/schema/
- **Your Vercel Dashboard**: https://vercel.com/mikeazimi-dischubcoms-projects/sellable-view

---

**Last Updated:** {{ date }}

