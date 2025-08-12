'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Globe, 
  Bell, 
  TrendingUp, 
  RefreshCw,
  Database,
  Activity
} from 'lucide-react'

interface SimpleStats {
  totalUsers: number
  totalSites: number
  totalSubscribers: number
  totalNotifications: number
  recentUsers: Array<{
    email: string
    created_at: string
  }>
  recentSites: Array<{
    name: string
    url: string
    subscriber_count: number
  }>
}

export default function SimpleAdminDashboard() {
  const [stats, setStats] = useState<SimpleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      setError('')
      // Fetch basic counts. Server valida rol admin vía Supabase + DB.
      const response = await fetch(`/api/admin/simple-stats`)
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else if (response.status === 401) {
        setError('No autenticado. Inicia sesión e inténtalo de nuevo.')
      } else if (response.status === 403) {
        setError('Acceso restringido. Tu usuario no es admin.')
      } else {
        setError('Error al cargar las estadísticas')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌ {error}</div>
          <Button onClick={fetchStats}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-cyan-400">Dashboard Administrativo</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Resumen general de NotiFly</p>
          </div>
          <Button 
            onClick={fetchStats} 
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Usuarios
              </CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                {stats?.totalUsers || 0}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Usuarios registrados
              </p>
            </CardContent>
          </Card>

          {/* Total Sites */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Sitios
              </CardTitle>
              <Globe className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                {stats?.totalSites || 0}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Sitios configurados
              </p>
            </CardContent>
          </Card>

          {/* Total Subscribers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Suscriptores
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                {stats?.totalSubscribers || 0}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Suscriptores activos
              </p>
            </CardContent>
          </Card>

          {/* Total Notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Notificaciones
              </CardTitle>
              <Bell className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                {stats?.totalNotifications || 0}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Notificaciones enviadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentUsers.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">{user.email}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay usuarios recientes</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Sites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Sitios Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentSites && stats.recentSites.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentSites.slice(0, 5).map((site, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-slate-100">{site.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{site.url}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{site.subscriber_count || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">suscriptores</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay sitios configurados</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Dashboard actualizado: {new Date().toLocaleString('es-ES')}
          </p>
        </div>
      </div>
    </div>
  )
}
