-- Inventory refresh schedules table
DROP TABLE IF EXISTS refresh_schedules CASCADE;

CREATE TABLE refresh_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  customer_account_id TEXT NOT NULL,
  email TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  days TEXT[] DEFAULT '{}', -- ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  time TEXT NOT NULL, -- Time in HH:MM format (24-hour)
  
  -- Filters
  filter_warehouse TEXT,
  filter_sellable TEXT DEFAULT 'all', -- 'all', 'sellable', 'non-sellable'
  filter_pickable TEXT DEFAULT 'all', -- 'all', 'pickable', 'non-pickable'
  filter_sku TEXT,
  filter_location TEXT,
  
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for checking what should run
CREATE INDEX idx_schedules_enabled ON refresh_schedules(enabled);
CREATE INDEX idx_schedules_last_run ON refresh_schedules(last_run_at);
CREATE INDEX idx_schedules_account ON refresh_schedules(customer_account_id);

COMMENT ON TABLE refresh_schedules IS 'Automated inventory refresh schedules with filters';
COMMENT ON COLUMN refresh_schedules.days IS 'Array of day abbreviations: Mon, Tue, Wed, Thu, Fri, Sat, Sun';
COMMENT ON COLUMN refresh_schedules.time IS 'Time in HH:MM format (e.g., 09:00)';
COMMENT ON COLUMN refresh_schedules.filter_warehouse IS 'Filter by warehouse identifier';
COMMENT ON COLUMN refresh_schedules.filter_sellable IS 'Filter by sellable status: all, sellable, or non-sellable';
COMMENT ON COLUMN refresh_schedules.filter_pickable IS 'Filter by pickable status: all, pickable, or non-pickable';

