import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujfmsmyvyyqfcqqyozrm.supabase.co'

// Correct JWT format keys
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZm1zbXl2eXlxZmNxcXlvenJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk5NzU1OSwiZXhwIjoyMDc5NTczNTU5fQ.SXjjpLpTSWcPdHtPVHSh7vri-_rZI0JuwFiCQWCyFeM'

console.log('Supabase configured')
console.log('URL:', supabaseUrl)
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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZm1zbXl2eXlxZmNxcXlvenJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTc1NTksImV4cCI6MjA3OTU3MzU1OX0.9pUFrgziNjovezjZTsusDGmBhdU1m2Hn3cy5xxiTLGY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

