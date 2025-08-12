import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function getServerSupabase() {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )
  return supabase
}

// Replacement for Clerk's currentUser()
export async function currentUser() {
  const supabase = await getServerSupabase()
  const { data } = await supabase.auth.getUser()
  return data.user || null
}

// Minimal replacement for auth().protect() semantics in API routes
export async function requireUser() {
  const user = await currentUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

// Helper to check admin role from DB (users.role === 'admin')
export async function isAdmin() {
  const supabase = await getServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return false
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('supabase_user_id', uid)
    .single()
  return data?.role === 'admin'
}
