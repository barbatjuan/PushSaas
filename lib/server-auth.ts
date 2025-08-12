import { cookies } from 'next/headers'
import { createRouteHandlerClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function getServerSupabase() {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  return supabase
}

// Cliente para Server Components (App Router)
export async function getServerComponentSupabase() {
  const supabase = createServerComponentClient<Database>({ cookies })
  return supabase
}

// Cliente Admin (Service Role) - solo uso server-side
export function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  }
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// currentUser() basado en Supabase Auth
export async function currentUser() {
  const supabase = await getServerSupabase()
  const { data } = await supabase.auth.getUser()
  return data.user || null
}

// Versión para Server Components (App Router)
export async function currentUserSC() {
  const supabase = await getServerComponentSupabase()
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
