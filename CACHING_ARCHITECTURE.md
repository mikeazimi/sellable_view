# Two-Part Caching Architecture for Credit Efficiency

## The Problem

ShipHero credits get exhausted because we're querying location properties (sellable/pickable) for thousands of locations repeatedly.

## The Solution: Cache Location Metadata

### Part 1: Background Sync Job (Runs every 4-6 hours)

**Purpose:** Cache location metadata that rarely changes

**What it does:**
1. Queries ALL locations from ShipHero (one-time cost)
2. Stores in Supabase: id, name, sellable, pickable, warehouse_id
3. Runs on schedule (not on user demand)

**Cost:** ~1,000-2,000 credits every 6 hours (acceptable)

**Endpoint:** `POST /api/sync/locations`

### Part 2: Main Inventory Query (User-facing, real-time)

**Purpose:** Get current inventory quantities

**What it does:**
1. Query Supabase for location IDs matching filter (e.g., WHERE sellable = false)
2. Use those IDs to filter ShipHero inventory results client-side
3. Only queries ShipHero for SKUs and quantities (cheap!)

**Cost:** ~500-1,000 credits per query (sustainable)

**Endpoint:** `GET /api/shiphero/inventory`

## Architecture Flow

```
User Action:
├── Select "Non-Sellable Only"
├── Click "Load Inventory"
└── Backend:
    ├── Query Supabase: SELECT id FROM locations WHERE sellable = false
    │   (Returns ~200 location IDs instantly - milliseconds)
    ├── Query ShipHero: warehouse_products with customer_account_id
    │   (Gets SKUs and quantities - no location metadata needed)
    └── Filter results: Keep only items in non-sellable location IDs
        (Using Set lookup - super fast)

Background Job (Every 6 hours):
└── Sync:
    ├── Query ShipHero locations (all of them)
    ├── Upsert to Supabase locations table
    └── Log: "Synced 4,523 locations at 2024-11-24 10:00:00"
```

## Benefits

### Credit Savings
- **Old:** 60,000 credits per full inventory load
- **New:** 1,000 credits per inventory load (60x reduction!)
- **Background sync:** 2,000 credits every 6 hours (acceptable overhead)

### Speed
- **Old:** 45-60 seconds for full load
- **New:** 3-5 seconds for filtered load (no pagination needed!)
- **Supabase query:** < 100ms

### User Experience
- Instant filtering (no re-fetch needed)
- Switch between sellable/non-sellable instantly
- Real-time summaries
- No waiting for pages to load

## Implementation Steps

### Step 1: Set up Supabase
```bash
# Add Supabase client
pnpm add @supabase/supabase-js

# Add environment variables
NEXT_PUBLIC_SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Step 2: Create locations table
Run the schema.sql in Supabase SQL editor

### Step 3: Create sync job
Endpoint: `/api/sync/locations` (already created)

### Step 4: Schedule the sync
Use Vercel Cron or external scheduler:
```json
// vercel.json
{
  "crons": [{
    "path": "/api/sync/locations",
    "schedule": "0 */6 * * *"  // Every 6 hours
  }]
}
```

### Step 5: Update main query
Modify `/api/shiphero/inventory` to:
1. Get filtered location IDs from Supabase
2. Query ShipHero inventory (without location metadata)
3. Filter using cached IDs

## Next Steps

1. **Add Supabase to your project**
2. **Run the schema.sql** to create locations table
3. **Test sync endpoint** manually first
4. **Update main inventory query** to use cached data
5. **Set up cron schedule** for automatic syncing

Would you like me to implement the Supabase integration now?

