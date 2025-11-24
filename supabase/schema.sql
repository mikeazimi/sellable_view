-- Locations cache table - seeded from CSV upload
CREATE TABLE IF NOT EXISTS locations (
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

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_locations_sellable ON locations(sellable);
CREATE INDEX IF NOT EXISTS idx_locations_pickable ON locations(pickable);
CREATE INDEX IF NOT EXISTS idx_locations_warehouse ON locations(warehouse);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_locations_filters ON locations(warehouse, sellable, pickable);

