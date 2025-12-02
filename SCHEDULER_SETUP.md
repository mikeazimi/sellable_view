# Scheduler Setup Instructions

## Step 1: Create the Schedules Table in Supabase

1. Go to your Supabase SQL Editor:
   https://supabase.com/dashboard/project/ujfmsmyvyyqfcqqyozrm/sql/new

2. Copy and paste the SQL from `supabase/refresh-schedules-schema.sql`:

```sql
-- Inventory refresh schedules table
DROP TABLE IF EXISTS refresh_schedules CASCADE;

CREATE TABLE refresh_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  customer_account_id TEXT NOT NULL,
  email TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  days TEXT[] DEFAULT '{}',
  time TEXT NOT NULL,
  
  -- Filters
  filter_warehouse TEXT,
  filter_sellable TEXT DEFAULT 'all',
  filter_pickable TEXT DEFAULT 'all',
  filter_sku TEXT,
  filter_location TEXT,
  
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_schedules_enabled ON refresh_schedules(enabled);
CREATE INDEX idx_schedules_last_run ON refresh_schedules(last_run_at);
CREATE INDEX idx_schedules_account ON refresh_schedules(customer_account_id);
```

3. Click "Run" to create the table

4. Verify the table was created:
   ```sql
   SELECT * FROM refresh_schedules LIMIT 10;
   ```

## Step 2: Configure Email (Optional)

To enable email reports, set up Resend:

1. Sign up at https://resend.com (free tier: 100 emails/day)
2. Get your API key
3. Add to Vercel environment variables:
   - Key: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxxx`

## Step 3: Test the Scheduler

### Manual Test (from Settings Page)

1. Go to **Settings** page
2. Click **"Add Schedule"**
3. Configure:
   - Select days (e.g., Mon, Wed, Fri)
   - Set time (e.g., 09:00)
   - Enter email address
   - **Set filters** (optional):
     - Warehouse: Filter by warehouse identifier
     - Sellable: All / Sellable Only / Non-Sellable Only
     - Pickable: All / Pickable Only / Non-Pickable Only
     - SKU: Partial match (e.g., "DN-" for all SKUs starting with DN-)
     - Location: Partial match (e.g., "A-01" for all locations containing A-01)
4. Click **"Save All Schedules"**
5. Click **"Run Now"** to test immediately

### Automated Scheduling

The Vercel cron job runs every 5 minutes and checks Supabase for schedules that should run.

## Features

### ✅ **Schedule Management**
- Save schedules to Supabase (persistent across sessions)
- Enable/disable schedules
- Set recurring days (Mon-Sun)
- Set specific time (24-hour format)

### ✅ **Report Filters**
Filter reports by Supabase column headings:
- **Warehouse**: Filter by `warehouse_identifier`
- **Sellable**: Filter by `sellable` status
- **Pickable**: Filter by `pickable` status
- **SKU**: Partial match on `sku` field
- **Location**: Partial match on `location_name` field

### ✅ **Automated Execution**
- Cron job checks every 5 minutes
- Triggers schedules that match current day/time
- Updates `last_run_at` and `last_run_status`
- Sends filtered report via email

### ✅ **Manual Testing**
- "Run Now" button for immediate testing
- Uses filters configured in the schedule
- Shows results in toast notification

## Troubleshooting

**Schedules not running?**
- Check that the schedule is **enabled**
- Verify the **days** and **time** are correct
- Check Vercel logs for cron job execution
- Ensure `SHIPHERO_ACCESS_TOKEN` is set in environment variables

**Email not sending?**
- Verify `RESEND_API_KEY` is configured in Vercel
- Check Resend dashboard for delivery status
- Test with "Run Now" button first

**Filters not working?**
- Check filter values match actual data in Supabase
- Use partial matches for SKU/Location (case-insensitive)
- Warehouse filter must match exact `warehouse_identifier`

## Architecture

```
┌─────────────────┐
│  Vercel Cron    │ Every 5 minutes
│  (check-schedules)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase DB   │ Read enabled schedules
│ refresh_schedules│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Run Inventory  │ Fetch + filter + email
│   /api/scheduler│
│  /run-inventory │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Email Report  │ Send CSV via Resend
│  /api/scheduler │
│  /email-report  │
└─────────────────┘
```

## Example Schedule

**Goal**: Email weekly inventory report for sellable items in Warehouse A every Monday at 9 AM

**Configuration**:
- Days: `[Mon]`
- Time: `09:00`
- Email: `inventory@mycompany.com`
- Filters:
  - Warehouse: `WAREHOUSE-A`
  - Sellable: `Sellable Only`
  - Pickable: `All`
  - SKU: _(empty)_
  - Location: _(empty)_

**Result**: Every Monday at 9 AM, you'll receive an email with a CSV containing only sellable items from Warehouse A.

