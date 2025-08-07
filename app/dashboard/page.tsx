'use client'

import { useCurrentUser } from '@/lib/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, Bell, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalSites: number
  totalSubscribers: number
  totalNotifications: number
  recentNotifications: any[]
}

export default function DashboardPage() {
  const { user, loading } = useCurrentUser()
  const [stats, setStats] = useState<DashboardStats>({
    totalSites: 0,
    totalSubscribers: 0,
    totalNotifications: 0,
    recentNotifications: []
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      try {
        // Get sites count and total subscribers
        const { data: sites, error: sitesError } = await supabase
          .from('sites')
          .select('id, subscriber_count')
          .eq('user_id', user.id)

        if (sitesError) throw sitesError

        const totalSites = sites?.length || 0
        const totalSubscribers = sites?.reduce((sum, site) => sum + (site.subscriber_count || 0), 0) || 0

        // Get notifications count
        const { count: notificationsCount, error: notificationsError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .in('site_id', sites?.map(site => site.id) || [])

        if (notificationsError) throw notificationsError

        // Get recent notifications
        const { data: recentNotifications, error: recentError } = await supabase
          .from('notifications')
          .select('*, sites(name)')
          .in('site_id', sites?.map(site => site.id) || [])
          .order('created_at', { ascending: false })
          .limit(5)

        if (recentError) throw recentError

        setStats({
          totalSites,
          totalSubscribers,
          totalNotifications: notificationsCount || 0,
          recentNotifications: recentNotifications || []
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [user])

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  if (!user) {
    return <div className="flex items-center justify-center h-64">Error al cargar usuario</div>
  }

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-2">
          ¡Hola, {user.name || 'Usuario'}! 🚀
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-200 max-w-2xl">
          Aquí tienes un resumen de tu actividad de notificaciones push. Tu plataforma para reconectar con tus visitantes.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sitios Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 group animate-in slide-in-from-left-4 fade-in duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-blue-100">Sitios Totales</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-1">{loadingStats ? '...' : stats.totalSites}</div>
            <p className="text-xs text-blue-100">
              Plan {user.plan === 'paid' ? 'Pro' : 'Gratuito'}
            </p>
          </CardContent>
        </Card>

        {/* Suscriptores Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 group animate-in slide-in-from-bottom-4 fade-in duration-500 delay-150">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-emerald-100">Suscriptores</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-1">{loadingStats ? '...' : stats.totalSubscribers}</div>
            <p className="text-xs text-emerald-100 mb-2">
              {user.plan === 'paid' ? 'de 10,000' : `de 20`} máximo
            </p>
            {/* Progress Bar */}
            <div className="w-full bg-emerald-200/30 rounded-full h-2 mb-1">
              <div 
                className="bg-white/80 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${Math.min((stats.totalSubscribers / (user.plan === 'paid' ? 10000 : 20)) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-emerald-200">
              {Math.round((stats.totalSubscribers / (user.plan === 'paid' ? 10000 : 20)) * 100)}% utilizado
            </p>
          </CardContent>
        </Card>

        {/* Notificaciones Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 group animate-in slide-in-from-right-4 fade-in duration-500 delay-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-purple-100">Notificaciones Enviadas</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
              <Bell className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-1">{loadingStats ? '...' : stats.totalNotifications}</div>
            <p className="text-xs text-purple-100 mb-2">
              Total enviadas
            </p>
            {/* Mini Chart Simulation */}
            <div className="flex items-end space-x-1 h-6">
              {[3, 7, 4, 8, 6, 9, 5, 7].map((height, index) => (
                <div
                  key={index}
                  className="bg-white/60 rounded-sm flex-1 transition-all duration-300 hover:bg-white/80"
                  style={{ height: `${height * 3}px` }}
                ></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Acciones Rápidas */}
        <Card className="border-0 bg-white/90 dark:bg-gray-800/95 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] animate-in slide-in-from-left-4 fade-in duration-500 delay-500 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
              Acciones Rápidas
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Gestiona tus sitios y notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/sites/new">
              <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 group">
                <Plus className="mr-3 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
                Agregar Nuevo Sitio
              </Button>
            </Link>
            <Link href="/dashboard/notifications/new">
              <Button variant="outline" className="w-full justify-start border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 transition-all duration-200 group">
                <Bell className="mr-3 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                Enviar Notificación
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Notificaciones Recientes */}
        <Card className="border-0 bg-white/90 dark:bg-gray-800/95 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] animate-in slide-in-from-right-4 fade-in duration-500 delay-700 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
              Notificaciones Recientes
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Últimas notificaciones enviadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-300">Cargando...</span>
              </div>
            ) : stats.recentNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-300">No hay notificaciones recientes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentNotifications.map((notification) => (
                  <div key={notification.id} className="flex justify-between items-start p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/70 transition-colors duration-200 border border-gray-200/50 dark:border-gray-600/50">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                        {notification.sites?.name} • {notification.sent_count} enviados
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      notification.status === 'sent' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : notification.status === 'failed'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {notification.status === 'sent' ? 'Enviado' : 
                       notification.status === 'failed' ? 'Falló' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Status */}
      {user.plan === 'free' && stats.totalSubscribers > 15 && (
        <Card className="border-0 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-[#2d2a1e] dark:to-[#3d3526] shadow-xl border-l-4 border-amber-400 dark:border-[#e0af68] hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-[#e0af68] flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Te estás acercando al límite de tu plan
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-[#c0a36e]">
              Tienes {stats.totalSubscribers} de 20 suscriptores. Considera actualizar a Pro para obtener hasta 10,000 suscriptores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200">
              Actualizar a Pro - €19/mes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
