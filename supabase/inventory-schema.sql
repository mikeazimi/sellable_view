-- Inventory snapshot table - synced nightly from ShipHero
DROP TABLE IF EXISTS inventory_locations CASCADE;

CREATE TABLE inventory_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL,
  location_id TEXT,
  location_name TEXT,
  quantity INTEGER DEFAULT 0,
  sellable BOOLEAN DEFAULT true,
  pickable BOOLEAN DEFAULT true,
  warehouse_id TEXT,
  warehouse_identifier TEXT,
  account_id TEXT,
  product_name TEXT,
  barcode TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sku, location_name, account_id)
);

-- Indexes for fast querying
CREATE INDEX idx_inventory_sku ON inventory_locations(sku);
CREATE INDEX idx_inventory_location ON inventory_locations(location_name);
CREATE INDEX idx_inventory_sellable ON inventory_locations(sellable);
CREATE INDEX idx_inventory_pickable ON inventory_locations(pickable);
CREATE INDEX idx_inventory_account ON inventory_locations(account_id);
CREATE INDEX idx_inventory_warehouse ON inventory_locations(warehouse_identifier);

-- Composite indexes for common queries
CREATE INDEX idx_inventory_filters ON inventory_locations(account_id, sellable, pickable);
CREATE INDEX idx_inventory_location_status ON inventory_locations(location_name, sellable, pickable);

-- Add comments
COMMENT ON TABLE inventory_locations IS 'ShipHero inventory snapshot - synced nightly';
COMMENT ON COLUMN inventory_locations.sellable IS 'Location sellable status (from locations cache)';
COMMENT ON COLUMN inventory_locations.pickable IS 'Location pickable status (from locations cache)';
COMMENT ON COLUMN inventory_locations.last_synced_at IS 'Last snapshot sync timestamp';

