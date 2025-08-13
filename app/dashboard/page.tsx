'use client'

import { useCurrentUser } from '@/lib/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, Bell, TrendingUp, Download, FileText, CheckCircle } from 'lucide-react'
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
          <CardContent className="space-y-4">
            <Link href="/dashboard/sites/new">
              <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 group">
                <Plus className="mr-3 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
                Agregar Nuevo Sitio
              </Button>
            </Link>
            <Link href="/dashboard/notifications/new">
              <Button
                variant="outline"
                className="w-full justify-start border-2 border-indigo-300/70 dark:border-indigo-400/40 bg-white/80 dark:bg-gray-800/60 text-indigo-700 dark:text-indigo-100 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm hover:shadow transition-all duration-200 group"
              >
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

      {/* WordPress Plugin Download Section */}
      <Card className="border-0 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 shadow-xl border-l-4 border-purple-500 dark:border-purple-400 hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-purple-800 dark:text-purple-300 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Plugin WordPress - Integración Ultra-Simple
          </CardTitle>
          <CardDescription className="text-purple-700 dark:text-purple-200">
            Instala NotiFly en WordPress con solo tu Site ID. Sin archivos manuales, sin FTP, sin complicaciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Configuración en 2 minutos</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">CDN automático incluido</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Verificación visual</span>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button 
              onClick={() => {
                // Trigger download
                const link = document.createElement('a');
                link.href = '/api/download/wordpress-plugin';
                link.download = 'notifly-push-notifications.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Plugin WordPress (.zip)
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                // Open documentation in new tab
                window.open('https://github.com/notifly/wordpress-plugin#readme', '_blank');
              }}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Ver Documentación
            </Button>
          </div>

          {/* Step by Step Guide */}
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              📋 Guía de Instalación Paso a Paso
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Descarga el Plugin</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Haz clic en "Descargar Plugin WordPress (.zip)" arriba para obtener el archivo <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">notifly-push-notifications.zip</code></p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Sube a WordPress</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Ve a <strong>Plugins → Añadir nuevo → Subir plugin</strong> y sube el archivo ZIP descargado. WordPress lo descomprimirá automáticamente y luego podrás activarlo.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Configura tu Site ID</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Ve a <strong>Configuración → NotiFly</strong> en tu WordPress y pega tu Site ID. Puedes copiar tu Site ID desde la sección de sitios.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">✓</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">¡Listo! 🎉</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">El plugin verificará automáticamente la integración y mostrará el estado. ¡Ya puedes empezar a recolectar suscriptores!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access to Site IDs */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">💡 ¿Necesitas tu Site ID?</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Encuentra el Site ID de cualquiera de tus sitios registrados:
            </p>
            <Link href="/dashboard/sites">
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30">
                Ver Mis Sitios y Site IDs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

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
