import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function getServerSupabase() {
  const supabase = createRouteHandlerClient<Database>({ cookies })
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
