# Supabase Setup Guide

## Step 1: Create the locations table

1. Go to: https://supabase.com/dashboard/project/ujfmsmyvyyqfcqqyozrm/editor
2. Click on "SQL Editor"
3. Paste the contents of `supabase/schema.sql`
4. Click "Run"

This creates the `locations` table with proper indexes.

## Step 2: Run your first sync

Once your ShipHero credits refresh, test the sync:

**Locally:**
```bash
curl -X POST http://localhost:3000/api/sync/locations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Production:**
```bash
curl -X POST https://your-app.vercel.app/api/sync/locations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

This will:
1. Fetch ALL locations from ShipHero (~2000 credits one-time)
2. Save them to Supabase
3. Take ~30-60 seconds

## Step 3: Verify the data

Check Supabase:
1. Go to: https://supabase.com/dashboard/project/ujfmsmyvyyqfcqqyozrm/editor
2. Click on "locations" table
3. You should see all your locations with sellable/pickable status

## Step 4: Update inventory query (Next Implementation)

Once locations are cached, we'll update the inventory query to:
1. Query Supabase for filtered location IDs (instant!)
2. Use those IDs to filter ShipHero results
3. Only query ShipHero for SKUs and quantities (cheap!)

## Environment Variables Set

✅ Locally: `.env.local` configured
✅ Vercel: All Supabase keys added to production

## Next Steps

1. **Run the SQL schema** in Supabase SQL Editor
2. **Wait for ShipHero credits to refresh** (~1 hour)
3. **Run the sync** manually to populate cache
4. **Update inventory query** to use cached locations
5. **Enjoy 60x faster queries!**

