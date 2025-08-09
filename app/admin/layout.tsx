import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link'
import { BarChart3, Users, Globe, Settings, DollarSign } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Debugging: Log the user's public metadata to see what the server receives
  console.log('Checking admin status for user:', user.id);
  console.log('User public metadata:', JSON.stringify(user.publicMetadata, null, 2));
  // Verificar rol desde la base de datos (fuente de verdad)
  let isAdmin = false
  try {
    const { data: dbUser, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('clerk_id', user.id)
      .single()
    if (!error && dbUser?.role === 'admin') {
      isAdmin = true
    }
  } catch (e) {
    console.error('Error comprobando rol admin en DB:', e)
  }
  // Fallback: permitir metadata de Clerk si existe
  if (!isAdmin && (user.publicMetadata as any)?.role === 'admin') {
    isAdmin = true
  }

  if (!isAdmin) {
    // Si no es admin, redirigir al dashboard normal o a una página de acceso denegado.
    // Por ahora, lo redirigimos al dashboard principal.
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin/simple" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                PushSaaS Admin
              </Link>
              
              {/* Navigation Links */}
              <div className="hidden md:flex space-x-6">
                <Link 
                  href="/admin/simple" 
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link 
                  href="/admin/metrics" 
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <DollarSign className="h-4 w-4" />
                  Métricas SaaS
                </Link>
                <Link 
                  href="/admin/users" 
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Users
                </Link>
                <Link 
                  href="/admin/sites" 
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Sites
                </Link>
                <Link 
                  href="/admin/settings" 
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                
                <Link 
                  href="/admin/debug" 
                  className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Debug
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-sm text-gray-600 block">
                  Admin: {user.emailAddresses[0]?.emailAddress || 'N/A'}
                </span>
                <span className="text-xs text-gray-400">
                  ID: {user.id.slice(-8)}
                </span>
              </div>
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || 'A').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
