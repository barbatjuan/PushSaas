import { redirect } from 'next/navigation'
import { currentUser, getServerSupabase } from '@/lib/server-auth'

export default async function PostLoginRedirect() {
  // Asegura sesión
  const user = await currentUser()
  if (!user) {
    redirect('/auth/sign-in')
  }

  // Consultar rol en DB
  const supabase = await getServerSupabase()
  const { data, error } = await supabase
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
