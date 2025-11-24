-- Locations cache table for ShipHero data
-- Synced periodically to avoid credit exhaustion

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,              -- ShipHero location ID
  name TEXT NOT NULL,                -- Location name (bin number)
  sellable BOOLEAN DEFAULT true,     -- Is this location sellable?
  pickable BOOLEAN DEFAULT true,     -- Is this location pickable?
  warehouse_id TEXT,                 -- ShipHero warehouse ID
  warehouse_identifier TEXT,         -- Human-readable warehouse name
  zone TEXT,                         -- Zone extracted from name
  client_id TEXT,                    -- For multi-tenant (customer account ID)
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_locations_sellable ON locations(sellable);
CREATE INDEX IF NOT EXISTS idx_locations_pickable ON locations(pickable);
CREATE INDEX IF NOT EXISTS idx_locations_warehouse ON locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_locations_client ON locations(client_id);

-- Composite index for common filters
CREATE INDEX IF NOT EXISTS idx_locations_filters ON locations(client_id, sellable, pickable);

-- Comments
COMMENT ON TABLE locations IS 'Cached ShipHero location data - synced every 6 hours';
COMMENT ON COLUMN locations.id IS 'ShipHero location UUID';
COMMENT ON COLUMN locations.sellable IS 'Whether location is sellable (from ShipHero)';
COMMENT ON COLUMN locations.pickable IS 'Whether location is pickable (from ShipHero)';
COMMENT ON COLUMN locations.last_updated IS 'Last sync time from ShipHero';

