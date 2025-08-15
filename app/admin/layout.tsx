import { currentUserSC, getSupabaseAdmin } from '@/lib/server-auth';
import { redirect } from 'next/navigation';

// Import supabaseAdmin lazily inside the component to avoid crashing
// on environments where service role is not configured.
import Link from 'next/link'
import { BarChart3, Users, Globe, Settings, DollarSign } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'


export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user: any = null
  try {
    user = await currentUserSC()
  } catch (e) {
    console.error('Error calling currentUser in admin layout:', e)
    redirect('/auth/sign-in')
  }
  
  if (!user) {
    redirect('/auth/sign-in')
  }

  // Verificar rol desde la base de datos (fuente de verdad)
  let isAdmin = false
  try {
    const admin = getSupabaseAdmin()
    const { data: dbUser, error } = await admin
      .from('users')
      .select('role')
      .eq('supabase_user_id', user.id)
      .single()
    if (!error && dbUser?.role === 'admin') {
      isAdmin = true
    }
  } catch (e) {
    console.error('Error comprobando rol admin en DB:', e)
  }

  if (!isAdmin) {
    // Si no es admin, redirigir al dashboard normal o a una página de acceso denegado.
    // Por ahora, lo redirigimos al dashboard principal.
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Admin Navigation */}
      <nav className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin/simple" className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600">
                PushSaaS Admin
              </Link>
              
              {/* Navigation Links */}
              <div className="hidden md:flex space-x-6">
                <Link 
                  href="/admin/simple" 
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:dark:text-white transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link 
                  href="/admin/metrics" 
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:dark:text-white transition-colors"
                >
                  <DollarSign className="h-4 w-4" />
                  Métricas SaaS
                </Link>
                <Link 
                  href="/admin/users" 
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:dark:text-white transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Users
                </Link>
                <Link 
                  href="/admin/sites" 
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:dark:text-white transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Sites
                </Link>
                <Link 
                  href="/admin/settings" 
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:dark:text-white transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                
                <Link 
                  href="/admin/debug" 
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 hover:dark:text-orange-400 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Debug
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              {/* User Menu (avatar dropdown) */}
              <div className="relative">
                <details className="group">
                  <summary className="list-none flex items-center gap-3 cursor-pointer select-none">
                    <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm ring-1 ring-blue-500/20">
                      <span className="text-white text-sm font-medium">
                        {(user.email?.[0] || 'A').toUpperCase()}
                      </span>
                    </div>
                  </summary>
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl p-3 z-50">
                    <div className="px-2 pb-2 border-b border-gray-200 dark:border-gray-800 mb-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.email || 'Admin'}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">ID:</span>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono border">
                          {String(user.id).slice(-8)}
                        </code>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <Link href="/dashboard" className="px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200">Perfil</Link>
                      <Link href="/admin/settings" className="px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200">Configuración</Link>
                      <Link href="/sign-out" className="px-3 py-2 text-sm rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">Cerrar sesión</Link>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="bg-gray-50 dark:bg-gray-950">{children}</main>
    </div>
  )
}
