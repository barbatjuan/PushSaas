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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          ¡Hola, {user.name || 'Usuario'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Aquí tienes un resumen de tu actividad de notificaciones push.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sitios Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : stats.totalSites}</div>
            <p className="text-xs text-muted-foreground">
              Plan {user.plan === 'paid' ? 'Pro' : 'Gratuito'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suscriptores</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : stats.totalSubscribers}</div>
            <p className="text-xs text-muted-foreground">
              Límite: {user.plan === 'paid' ? '10,000' : '500'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificaciones Enviadas</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : stats.totalNotifications}</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Gestiona tus sitios y notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/sites/new">
              <Button className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Nuevo Sitio
              </Button>
            </Link>
            <Link href="/dashboard/notifications/new">
              <Button variant="outline" className="w-full justify-start">
                <Bell className="mr-2 h-4 w-4" />
                Enviar Notificación
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificaciones Recientes</CardTitle>
            <CardDescription>
              Últimas notificaciones enviadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : stats.recentNotifications.length === 0 ? (
              <p className="text-sm text-gray-500">No hay notificaciones recientes</p>
            ) : (
              <div className="space-y-3">
                {stats.recentNotifications.map((notification) => (
                  <div key={notification.id} className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-gray-500">
                        {notification.sites?.name} • {notification.sent_count} enviados
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      notification.status === 'sent' 
                        ? 'bg-green-100 text-green-800' 
                        : notification.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
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
      {user.plan === 'free' && stats.totalSubscribers > 400 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">
              Te estás acercando al límite de tu plan
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Tienes {stats.totalSubscribers} de 500 suscriptores. Considera actualizar a Pro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              Actualizar a Pro
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
