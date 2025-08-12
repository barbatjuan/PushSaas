'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Key, 
  Database,
  Server,
  Shield,
  Info
} from 'lucide-react'

interface SystemInfo {
  environment: string
  database: string
  vapidConfigured: boolean
  adminPasswordSet: boolean
  supabaseConfigured: boolean
}

export default function AdminSettings() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSystemInfo = async () => {
    try {
      setError('')
      
      const response = await fetch(`/api/admin/system-info`)
      
      if (response.ok) {
        const data = await response.json()
        setSystemInfo(data)
      } else if (response.status === 401 || response.status === 403) {
        setError('No autorizado: inicia sesión con una cuenta admin')
      } else {
        setError('Error al cargar la información del sistema')
      }
    } catch (error) {
      console.error('Error fetching system info:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemInfo()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌ {error}</div>
          <Button onClick={fetchSystemInfo}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-cyan-400">Configuración del Sistema</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Estado y configuración de NotiFly</p>
          </div>
          <Button 
            onClick={fetchSystemInfo} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Environment */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Entorno
              </CardTitle>
              <Server className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {systemInfo?.environment || 'development'}
              </div>
              <Badge variant={systemInfo?.environment === 'production' ? 'default' : 'secondary'}>
                {systemInfo?.environment === 'production' ? 'Producción' : 'Desarrollo'}
              </Badge>
            </CardContent>
          </Card>

          {/* Database */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Base de Datos
              </CardTitle>
              <Database className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Supabase
              </div>
              <Badge variant={systemInfo?.supabaseConfigured ? 'default' : 'destructive'}>
                {systemInfo?.supabaseConfigured ? 'Configurado' : 'No configurado'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Estado de Configuración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Admin Password */}
              <div className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">Contraseña de Administrador</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Autenticación para el panel admin</p>
                  </div>
                </div>
                <Badge variant={systemInfo?.adminPasswordSet ? 'default' : 'destructive'}>
                  {systemInfo?.adminPasswordSet ? 'Configurado' : 'No configurado'}
                </Badge>
              </div>

              {/* Auth Provider */}
              <div className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">Supabase Authentication</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sistema de autenticación de usuarios</p>
                  </div>
                </div>
                <Badge variant={systemInfo?.supabaseConfigured ? 'default' : 'destructive'}>
                  {systemInfo?.supabaseConfigured ? 'Configurado' : 'No configurado'}
                </Badge>
              </div>

              {/* VAPID Keys */}
              <div className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">VAPID Keys</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Claves para notificaciones push</p>
                  </div>
                </div>
                <Badge variant={systemInfo?.vapidConfigured ? 'default' : 'destructive'}>
                  {systemInfo?.vapidConfigured ? 'Configurado' : 'No configurado'}
                </Badge>
              </div>

              {/* Supabase */}
              <div className="flex justify-between items-center py-3">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">Supabase Database</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Base de datos principal</p>
                  </div>
                </div>
                <Badge variant={systemInfo?.supabaseConfigured ? 'default' : 'destructive'}>
                  {systemInfo?.supabaseConfigured ? 'Configurado' : 'No configurado'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Información del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-slate-100">Versión</p>
                <p className="text-gray-600 dark:text-gray-400">NotiFly v1.0.0</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-slate-100">Framework</p>
                <p className="text-gray-600 dark:text-gray-400">Next.js 14</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-slate-100">Base de Datos</p>
                <p className="text-gray-600 dark:text-gray-400">Supabase PostgreSQL</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-slate-100">Autenticación</p>
                <p className="text-gray-600 dark:text-gray-400">Supabase Auth + Admin Password</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-slate-100">Push Notifications</p>
                <p className="text-gray-600 dark:text-gray-400">Web Push API + VAPID</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-slate-100">Última actualización</p>
                <p className="text-gray-600 dark:text-gray-400">{new Date().toLocaleString('es-ES')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
