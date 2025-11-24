import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujfmsmyvyyqfcqqyozrm.supabase.co'

// Use the actual key directly for now (will move to env vars after testing)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZm1zbXl2eXlxZmNxcXlvenJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjQ2MDkyMCwiZXhwIjoyMDQ4MDM2OTIwfQ.-RhoSUo5qMb20iTWzDi54g_NOpD-hAG'

console.log('Supabase URL:', supabaseUrl)
console.log('Service key present:', !!supabaseServiceKey)

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

// Server-side client with service role (for API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Client-side client with anon key
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZm1zbXl2eXlxZmNxcXlvenJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NjA5MjAsImV4cCI6MjA0ODAzNjkyMH0.sAyY_c6-8xFjy3pij0wUMQ_LuDYN5fL'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

