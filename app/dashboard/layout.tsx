'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bell, BarChart3, Settings, Plus, Home, Zap, Users, TrendingUp, Moon, Sun, Wrench } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import RequireAuth from '@/components/RequireAuth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('pushsaas-theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('pushsaas-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('pushsaas-theme', 'light')
    }
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: pathname === '/dashboard'
    },
    {
      name: 'Mis Sitios',
      href: '/dashboard/sites',
      icon: Settings,
      current: pathname?.startsWith('/dashboard/sites') || false
    },
    {
      name: 'Notificaciones',
      href: '/dashboard/notifications',
      icon: Bell,
      current: pathname?.startsWith('/dashboard/notifications') || false
    },
    {
      name: 'Métricas',
      href: '/dashboard/metrics',
      icon: TrendingUp,
      current: pathname?.startsWith('/dashboard/metrics') || false
    },
    {
      name: 'Diagnóstico PWA',
      href: '/dashboard/diagnostics',
      icon: Wrench,
      current: pathname?.startsWith('/dashboard/diagnostics') || false
    }
  ]

  return (
    <RequireAuth>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#1a1b26] dark:via-[#1f2335] dark:to-[#24283b] transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-[#1a1b26]/90 backdrop-blur-md border-b border-gray-200/50 dark:border-[#414868]/30 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-[#c0caf5] dark:to-[#a9b1d6] bg-clip-text text-transparent">NotiFly</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-[#a9b1d6]">
                <Users className="h-4 w-4" />
                <span>Plan Gratuito</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#414868]/20 transition-colors duration-200"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Moon className="h-4 w-4 text-gray-600 dark:text-[#a9b1d6]" />
                )}
              </Button>
              <div className="flex items-center gap-3">
                {/* Avatar dropdown */}
                <div className="relative">
                  <details className="group">
                    <summary className="list-none cursor-pointer select-none">
                      <div className="h-8 w-8 bg-blue-600 rounded-full text-white flex items-center justify-center text-sm shadow-sm ring-1 ring-blue-500/20">
                        {(user?.email?.[0] || 'U').toUpperCase()}
                      </div>
                    </summary>
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a1b26] border border-gray-200 dark:border-[#414868]/30 rounded-lg shadow-xl p-3 z-50">
                      <div className="px-2 pb-2 border-b border-gray-200 dark:border-[#414868]/30 mb-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-[#c0caf5] truncate">
                          {user?.email || 'Usuario'}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <Link href="/dashboard" className="px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-[#414868]/20 text-gray-700 dark:text-[#a9b1d6]">Perfil</Link>
                        <Link href="/dashboard/sites" className="px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-[#414868]/20 text-gray-700 dark:text-[#a9b1d6]">Configuración</Link>
                        <button onClick={() => signOut()} className="text-left px-3 py-2 text-sm rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">Cerrar sesión</button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white/60 dark:bg-[#24283b]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-[#414868]/20 transition-colors duration-300">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button 
                        variant={item.current ? "default" : "ghost"} 
                        className={`w-full justify-start transition-all duration-200 group ${
                          item.current 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40' 
                            : 'hover:bg-blue-50 dark:hover:bg-[#414868]/20 hover:text-blue-700 dark:hover:text-[#7aa2f7] text-gray-700 dark:text-[#a9b1d6]'
                        }`}
                      >
                        <Icon className={`mr-3 h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
                          item.current ? 'text-white' : 'text-gray-500 dark:text-[#565f89] group-hover:text-blue-600 dark:group-hover:text-[#7aa2f7]'
                        }`} />
                        {item.name}
                      </Button>
                    </Link>
                  )
                })}
                
                {/* Quick Action */}
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-[#414868]/30">
                  <Link href="/dashboard/sites/new">
                    <Button className="w-full justify-start bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 group">
                      <Plus className="mr-3 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
                      Agregar Sitio
                    </Button>
                  </Link>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white/60 dark:bg-[#24283b]/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-[#414868]/20 min-h-[calc(100vh-12rem)] transition-colors duration-300">
              <div className="p-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
    </RequireAuth>
  )
}
