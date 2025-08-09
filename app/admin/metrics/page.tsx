'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  RefreshCw,
  Calendar,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react'

interface SaaSMetrics {
  // Revenue Metrics
  mrr: number
  arr: number
  previousMrr: number
  mrrGrowthRate: number
  
  // User Metrics
  totalUsers: number
  paidUsers: number
  freeUsers: number
  newUsersThisMonth: number
  churnedUsersThisMonth: number
  
  // Financial Metrics
  arpu: number
  ltv: number
  churnRate: number
  conversionRate: number
  
  // Plan Breakdown
  planBreakdown: Array<{
    plan: string
    users: number
    revenue: number
    percentage: number
  }>
  
  // Growth Metrics
  monthlyGrowth: number
  userGrowthRate: number
  
  lastUpdated: string
}

export default function SaaSMetricsDashboard() {
  const [metrics, setMetrics] = useState<SaaSMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchMetrics = async () => {
    try {
      setRefreshing(true)
      setError('')
      
      const response = await fetch(`/api/admin/saas-metrics`)
      
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      } else if (response.status === 401 || response.status === 403) {
        setError('No autorizado: inicia sesión con una cuenta admin')
      } else {
        setError('Error al cargar las métricas')
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando métricas SaaS...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌ {error}</div>
          <Button onClick={fetchMetrics}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Métricas SaaS</h1>
            <p className="text-gray-600 mt-2">Indicadores clave de rendimiento financiero</p>
          </div>
          <Button 
            onClick={fetchMetrics} 
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* MRR */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                MRR (Monthly Recurring Revenue)
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(metrics?.mrr || 0)}
              </div>
              <div className="flex items-center mt-2">
                {(metrics?.mrrGrowthRate || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${(metrics?.mrrGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(metrics?.mrrGrowthRate || 0)} vs mes anterior
                </span>
              </div>
            </CardContent>
          </Card>

          {/* ARR */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                ARR (Annual Recurring Revenue)
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(metrics?.arr || 0)}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Proyección anual
              </p>
            </CardContent>
          </Card>

          {/* ARPU */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                ARPU (Average Revenue Per User)
              </CardTitle>
              <Users className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(metrics?.arpu || 0)}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Por usuario/mes
              </p>
            </CardContent>
          </Card>

          {/* Churn Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Churn Rate
              </CardTitle>
              <TrendingDown className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {(metrics?.churnRate || 0).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Tasa de cancelación mensual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User & Growth Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Usuarios
              </CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {metrics?.totalUsers || 0}
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="default">{metrics?.paidUsers || 0} paid</Badge>
                <Badge variant="secondary">{metrics?.freeUsers || 0} free</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Conversion Rate
              </CardTitle>
              <Target className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {(metrics?.conversionRate || 0).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Free to Paid
              </p>
            </CardContent>
          </Card>

          {/* LTV */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                LTV (Customer Lifetime Value)
              </CardTitle>
              <DollarSign className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(metrics?.ltv || 0)}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Valor promedio del cliente
              </p>
            </CardContent>
          </Card>

          {/* Growth Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Growth Rate
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatPercentage(metrics?.userGrowthRate || 0)}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Crecimiento mensual de usuarios
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Plan Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Desglose por Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.planBreakdown && metrics.planBreakdown.length > 0 ? (
              <div className="space-y-4">
                {metrics.planBreakdown.map((plan, index) => (
                  <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <div>
                        <p className="font-medium text-gray-900">{plan.plan}</p>
                        <p className="text-sm text-gray-500">{plan.users} usuarios</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(plan.revenue)}</p>
                      <p className="text-sm text-gray-500">{plan.percentage.toFixed(1)}% del total</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay datos de planes disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Última actualización: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString('es-ES') : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}
