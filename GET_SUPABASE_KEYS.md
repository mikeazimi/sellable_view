# Get Your Supabase API Keys

The keys you provided (`sb_publishable_...` and `sb_secret_...`) are the new format that won't work with the JS client yet.

We need the JWT format keys instead.

## How to Get the Correct Keys:

### Step 1: Go to Project Settings

https://supabase.com/dashboard/project/ujfmsmyvyyqfcqqyozrm/settings/api

### Step 2: Find These Keys:

Look for the **"Project API keys"** section. You should see:

#### anon/public key (starts with `eyJ...`)
Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...`

Copy this - it's your **NEXT_PUBLIC_SUPABASE_ANON_KEY**

#### service_role key (starts with `eyJ...`)
Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...`

Copy this - it's your **SUPABASE_SERVICE_ROLE_KEY**

**IMPORTANT:** The service_role key should be marked as "secret" with a warning icon. This is the one that has full database access.

### Step 3: Look for "Project URL"

Should be: `https://ujfmsmyvyyqfcqqyozrm.supabase.co`

---

## Quick Check:

The correct keys should:
- ✅ Start with `eyJ`
- ✅ Be very long (hundreds of characters)
- ✅ Have three parts separated by dots (.)
- ✅ Look like JWT tokens

The keys you provided (`sb_publishable_...`) are likely from a different section or outdated.

---

Please paste the JWT format keys and I'll update the configuration!

