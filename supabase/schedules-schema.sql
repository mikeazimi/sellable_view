-- Inventory refresh schedules table
DROP TABLE IF EXISTS refresh_schedules CASCADE;

CREATE TABLE refresh_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  customer_account_id TEXT NOT NULL,
  warehouse_id TEXT,
  enabled BOOLEAN DEFAULT true,
  days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sunday, 6=Saturday
  run_times TEXT[] DEFAULT '{}', -- Times in HH:MM format (24-hour)
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for checking what should run
CREATE INDEX idx_schedules_enabled ON refresh_schedules(enabled);
CREATE INDEX idx_schedules_last_run ON refresh_schedules(last_run_at);

COMMENT ON TABLE refresh_schedules IS 'Automated inventory refresh schedules';
COMMENT ON COLUMN refresh_schedules.days_of_week IS 'Array of day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN refresh_schedules.run_times IS 'Array of times in HH:MM format (e.g., ["06:00", "18:00"])';

