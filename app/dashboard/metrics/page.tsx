'use client'

import { useCurrentUser } from '@/lib/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, Bell, Calendar, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface MetricsData {
  totalSites: number
  totalSubscribers: number
  totalNotifications: number
  clickRate: number
  subscriptionRate: number
  monthlyGrowth: number
}

export default function MetricsPage() {
  const { user, loading } = useCurrentUser()
  const [metrics, setMetrics] = useState<MetricsData>({
    totalSites: 0,
    totalSubscribers: 0,
    totalNotifications: 0,
    clickRate: 0,
    subscriptionRate: 0,
    monthlyGrowth: 0
  })
  const [loadingMetrics, setLoadingMetrics] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchMetrics = async () => {
      try {
        // 1) Obtener sitios del usuario
        const { data: sites, error: sitesError } = await supabase
          .from('sites')
          .select('id, created_at')
          .eq('user_id', user.id)

        if (sitesError) throw sitesError

        const totalSites = sites?.length || 0

        // 2) Contar suscriptores activos reales desde push_subscriptions
        let totalSubscribers = 0
        const siteIds = (sites || []).map(s => s.id)
        if (siteIds.length > 0) {
          const { count: activeSubsCount, error: psError } = await supabase
            .from('push_subscriptions')
            .select('*', { count: 'exact', head: true })
            .in('site_id', siteIds)
            .eq('is_active', true)
          if (psError) throw psError
          totalSubscribers = activeSubsCount || 0
        }

        // 3) Contar notificaciones
        const { count: notificationsCount, error: notificationsError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .in('site_id', (sites || []).map(site => site.id))

        if (notificationsError) throw notificationsError

        // Calculate growth (simplified)
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const thisMonthSites = sites?.filter(site => {
          const siteDate = new Date(site.created_at)
          return siteDate.getMonth() === currentMonth && siteDate.getFullYear() === currentYear
        }).length || 0

        const monthlyGrowth = totalSites > 0 ? (thisMonthSites / totalSites) * 100 : 0

        setMetrics({
          totalSites,
          totalSubscribers,
          totalNotifications: notificationsCount || 0,
          clickRate: 12.5, // Simulated
          subscriptionRate: 8.3, // Simulated
          monthlyGrowth: Math.round(monthlyGrowth * 10) / 10
        })
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setLoadingMetrics(false)
      }
    }

    fetchMetrics()
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-[#c0caf5] dark:via-[#7aa2f7] dark:to-[#bb9af7] bg-clip-text text-transparent mb-2">
          Métricas y Análisis
        </h1>
        <p className="text-lg text-gray-600 dark:text-[#a9b1d6] max-w-2xl">
          Analiza el rendimiento de tus notificaciones push y el crecimiento de tus suscriptores.
        </p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Sites */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-blue-100">Sitios Totales</CardTitle>
            <BarChart3 className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-1">{loadingMetrics ? '...' : metrics.totalSites}</div>
            <p className="text-xs text-blue-100">
              +{metrics.monthlyGrowth}% este mes
            </p>
          </CardContent>
        </Card>

        {/* Total Subscribers */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-emerald-100">Suscriptores</CardTitle>
            <Users className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-1">{loadingMetrics ? '...' : metrics.totalSubscribers}</div>
            <p className="text-xs text-emerald-100">
              Tasa de conversión: {metrics.subscriptionRate}%
            </p>
          </CardContent>
        </Card>

        {/* Total Notifications */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-purple-100">Notificaciones</CardTitle>
            <Bell className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-1">{loadingMetrics ? '...' : metrics.totalNotifications}</div>
            <p className="text-xs text-purple-100">
              CTR: {metrics.clickRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Engagement Metrics */}
        <Card className="border-0 bg-white/80 dark:bg-[#24283b]/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-[#c0caf5] dark:to-[#a9b1d6] bg-clip-text text-transparent flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-[#7aa2f7]" />
              Métricas de Engagement
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-[#9aa5ce]">
              Rendimiento de tus notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-[#a9b1d6]">Tasa de Clics (CTR)</span>
              <span className="text-lg font-bold text-blue-600 dark:text-[#7aa2f7]">{metrics.clickRate}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-[#414868]/30 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.clickRate * 8}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-[#a9b1d6]">Tasa de Suscripción</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-[#9ece6a]">{metrics.subscriptionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-[#414868]/30 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.subscriptionRate * 12}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Growth Metrics */}
        <Card className="border-0 bg-white/80 dark:bg-[#24283b]/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-[#c0caf5] dark:to-[#a9b1d6] bg-clip-text text-transparent flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-[#bb9af7]" />
              Crecimiento
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-[#9aa5ce]">
              Tendencias de crecimiento mensual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-[#bb9af7] mb-2">
                +{metrics.monthlyGrowth}%
              </div>
              <p className="text-sm text-gray-600 dark:text-[#9aa5ce]">
                Crecimiento este mes
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-[#9aa5ce]">Sitios nuevos</span>
                <span className="text-sm font-medium text-gray-900 dark:text-[#c0caf5]">
                  {Math.round(metrics.totalSites * metrics.monthlyGrowth / 100)} este mes
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-[#9aa5ce]">Promedio diario</span>
                <span className="text-sm font-medium text-gray-900 dark:text-[#c0caf5]">
                  {Math.round(metrics.totalSubscribers / 30)} suscriptores
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips Card */}
      <Card className="border-0 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-[#2d2a1e] dark:to-[#3d3526] shadow-xl border-l-4 border-amber-400 dark:border-[#e0af68]">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-[#e0af68] flex items-center gap-2">
            <Target className="h-5 w-5" />
            Consejos para Mejorar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-amber-700 dark:text-[#c0a36e]">
            <p>• Envía notificaciones en horarios de mayor actividad (8-10 AM, 6-8 PM)</p>
            <p>• Personaliza los mensajes según el comportamiento del usuario</p>
            <p>• Mantén los títulos cortos y llamativos (máximo 50 caracteres)</p>
            <p>• Incluye llamadas a la acción claras en tus notificaciones</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
