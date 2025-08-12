import { redirect } from 'next/navigation'
import { currentUser, getSupabaseAdmin } from '@/lib/server-auth'

export default async function PostLoginRedirect() {
  // Asegura sesión
  const user = await currentUser()
  if (!user) {
    redirect('/auth/sign-in')
  }

  // Consultar rol en DB con Service Role (evita RLS)
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('users')
    .select('role')
    .eq('supabase_user_id', user.id)
    .single()

  if (error) {
    // Si hay error leyendo el rol, ir al dashboard como fallback
    redirect('/dashboard')
  }

  if (data?.role === 'admin') {
    redirect('/admin')
  }

  redirect('/dashboard')
}
