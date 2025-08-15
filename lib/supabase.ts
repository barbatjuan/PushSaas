import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Ensure a single anon client instance in the browser (prevents multiple GoTrueClient warnings)
function getBrowserSupabase() {
  const g = globalThis as any
  if (!g.__supabaseAnonClient) {
    g.__supabaseAnonClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return g.__supabaseAnonClient as ReturnType<typeof createClient<Database>>
}

// Export anon client (singleton). On server it will still be created once per module instance.
export const supabase = getBrowserSupabase()

// Server-side client with service role key for admin operations
// Only instantiate on the server to avoid leaking the service role and duplicate clients in the browser
export const supabaseAdmin = (typeof window === 'undefined')
  ? createClient<Database>(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : (undefined as unknown as ReturnType<typeof createClient<Database>>)
