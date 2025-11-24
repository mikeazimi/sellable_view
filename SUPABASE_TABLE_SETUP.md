# Create Locations Table in Supabase

## Step 1: Go to SQL Editor

https://supabase.com/dashboard/project/ujfmsmyvyyqfcqqyozrm/sql/new

## Step 2: Copy and Run This SQL

```sql
-- Drop existing table if any
DROP TABLE IF EXISTS locations CASCADE;

-- Create locations table
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  warehouse TEXT NOT NULL,
  location TEXT NOT NULL,
  pickable BOOLEAN DEFAULT true,
  sellable BOOLEAN DEFAULT true,
  pick_priority INTEGER,
  transfer_bin BOOLEAN DEFAULT false,
  staging BOOLEAN DEFAULT false,
  quantity INTEGER DEFAULT 0,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(warehouse, location)
);

-- Create indexes
CREATE INDEX idx_locations_sellable ON locations(sellable);
CREATE INDEX idx_locations_pickable ON locations(pickable);
CREATE INDEX idx_locations_warehouse ON locations(warehouse);
CREATE INDEX idx_locations_filters ON locations(warehouse, sellable, pickable);

-- Verify table created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'locations';
```

## Step 3: After Running

You should see output showing all the columns:
- id
- warehouse
- location
- pickable
- sellable
- pick_priority
- transfer_bin
- staging
- quantity
- type
- created_at
- updated_at

## Step 4: Then Upload CSV

Go to Admin page and upload your CSV file!

