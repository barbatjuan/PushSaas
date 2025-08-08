'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Smartphone, Bell, Shield, Wifi, Settings, Download } from 'lucide-react'

interface DiagnosticResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'loading'
  message: string
  details?: string
  action?: () => void
  actionLabel?: string
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [pushSaaSStatus, setPushSaaSStatus] = useState<any>(null)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const results: DiagnosticResult[] = []

    try {
      // 1. Verificar HTTPS
      results.push({
        name: 'Conexión HTTPS',
        status: location.protocol === 'https:' ? 'success' : 'error',
        message: location.protocol === 'https:' ? 'Sitio servido por HTTPS ✅' : 'Se requiere HTTPS para notificaciones push',
        details: `Protocolo actual: ${location.protocol}`
      })

      // 2. Verificar Service Worker
      let swStatus: DiagnosticResult = {
        name: 'Service Worker',
        status: 'loading',
        message: 'Verificando...'
      }

      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            swStatus = {
              name: 'Service Worker',
              status: registration.active ? 'success' : 'warning',
              message: registration.active ? 'Service Worker activo ✅' : 'Service Worker registrado pero no activo',
              details: `Estado: ${registration.active?.state || 'No activo'}`
            }
          } else {
            swStatus = {
              name: 'Service Worker',
              status: 'error',
              message: 'Service Worker no registrado',
              details: 'Es necesario para recibir notificaciones en segundo plano',
              action: () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(() => window.location.reload())
                  .catch(console.error)
              },
              actionLabel: 'Registrar SW'
            }
          }
        } catch (error) {
          swStatus = {
            name: 'Service Worker',
            status: 'error',
            message: 'Error al verificar Service Worker',
            details: String(error)
          }
        }
      } else {
        swStatus = {
          name: 'Service Worker',
          status: 'error',
          message: 'Service Workers no soportados',
          details: 'Este navegador no soporta Service Workers'
        }
      }
      results.push(swStatus)

      // 3. Verificar soporte de notificaciones
      if ('Notification' in window) {
        const permission = Notification.permission
        results.push({
          name: 'Soporte de Notificaciones',
          status: permission === 'granted' ? 'success' : permission === 'denied' ? 'error' : 'warning',
          message: permission === 'granted' ? 'Permisos concedidos ✅' : 
                   permission === 'denied' ? 'Permisos denegados' : 'Permisos pendientes',
          details: `Estado: ${permission}`,
          action: permission !== 'granted' ? () => {
            Notification.requestPermission().then(() => runDiagnostics())
          } : undefined,
          actionLabel: permission !== 'granted' ? 'Solicitar Permisos' : undefined
        })
      } else {
        results.push({
          name: 'Soporte de Notificaciones',
          status: 'error',
          message: 'Notificaciones no soportadas',
          details: 'Este navegador no soporta notificaciones'
        })
      }

      // 4. Verificar Push API
      if ('PushManager' in window) {
        results.push({
          name: 'Push API',
          status: 'success',
          message: 'Push API disponible ✅',
          details: 'El navegador soporta notificaciones push'
        })
      } else {
        results.push({
          name: 'Push API',
          status: 'error',
          message: 'Push API no disponible',
          details: 'Este navegador no soporta Push API'
        })
      }

      // 5. Verificar PWA (modo standalone)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://')

      results.push({
        name: 'Modo PWA',
        status: isStandalone ? 'success' : 'warning',
        message: isStandalone ? 'App instalada como PWA ✅' : 'App no instalada como PWA',
        details: isStandalone ? 'Ejecutándose en modo standalone' : 'Ejecutándose en navegador web',
        action: !isStandalone ? () => {
          alert('Para instalar como PWA:\n1. Abre el menú del navegador\n2. Selecciona "Instalar app" o "Añadir a pantalla de inicio"\n3. Confirma la instalación')
        } : undefined,
        actionLabel: !isStandalone ? 'Cómo Instalar' : undefined
      })

      // 6. Verificar Manifest
      try {
        const manifestResponse = await fetch('/manifest.json')
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json()
          results.push({
            name: 'Manifest PWA',
            status: 'success',
            message: 'Manifest cargado correctamente ✅',
            details: `Nombre: ${manifest.name || manifest.short_name}`
          })
        } else {
          results.push({
            name: 'Manifest PWA',
            status: 'error',
            message: 'Error al cargar manifest',
            details: `Status: ${manifestResponse.status}`
          })
        }
      } catch (error) {
        results.push({
          name: 'Manifest PWA',
          status: 'error',
          message: 'Manifest no encontrado',
          details: String(error)
        })
      }

      // 7. Verificar PushSaaS SDK
      if (typeof (window as any).pushSaaS !== 'undefined') {
        try {
          const status = (window as any).pushSaaS?.debug?.status?.() || {}
          setPushSaaSStatus(status)
          
          results.push({
            name: 'PushSaaS SDK',
            status: status.subscribed ? 'success' : 'warning',
            message: status.subscribed ? 'SDK conectado y suscrito ✅' : 'SDK cargado pero no suscrito',
            details: status.endpoint ? `Endpoint: ${status.endpoint.substring(0, 50)}...` : 'Sin endpoint'
          })
        } catch (error) {
          results.push({
            name: 'PushSaaS SDK',
            status: 'error',
            message: 'Error al verificar SDK',
            details: String(error)
          })
        }
      } else {
        results.push({
          name: 'PushSaaS SDK',
          status: 'error',
          message: 'SDK no encontrado',
          details: 'El SDK de PushSaaS no está cargado',
          action: () => window.location.reload(),
          actionLabel: 'Recargar Página'
        })
      }

      // 8. Verificar conexión de red
      if ('navigator' in window && 'onLine' in navigator) {
        results.push({
          name: 'Conexión de Red',
          status: navigator.onLine ? 'success' : 'error',
          message: navigator.onLine ? 'Conectado a internet ✅' : 'Sin conexión a internet',
          details: navigator.onLine ? 'Red disponible' : 'Verificar conexión'
        })
      }

      // 9. Verificar información del dispositivo
      const userAgent = navigator.userAgent
      const isAndroid = /Android/i.test(userAgent)
      const isChrome = /Chrome/i.test(userAgent)
      const isMobile = /Mobile/i.test(userAgent)

      results.push({
        name: 'Información del Dispositivo',
        status: 'success',
        message: `${isAndroid ? 'Android' : 'Otro OS'} - ${isChrome ? 'Chrome' : 'Otro navegador'} - ${isMobile ? 'Móvil' : 'Desktop'}`,
        details: userAgent
      })

    } catch (error) {
      console.error('Error en diagnósticos:', error)
    }

    setDiagnostics(results)
    setIsRunning(false)
  }

  const sendTestNotification = async () => {
    try {
      if ((window as any).pushSaaS) {
        // Intentar enviar notificación de prueba
        const response = await fetch('/api/test-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Prueba de Notificación',
            body: 'Esta es una notificación de prueba desde PushSaaS',
            url: '/dashboard'
          })
        })
        
        if (response.ok) {
          alert('Notificación de prueba enviada. Deberías recibirla en unos segundos.')
        } else {
          alert('Error al enviar notificación de prueba')
        }
      }
    } catch (error) {
      console.error('Error enviando notificación de prueba:', error)
      alert('Error al enviar notificación de prueba')
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default: return <RefreshCw className="h-5 w-5 text-gray-500 animate-spin" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'error': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      default: return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }
  }

  const successCount = diagnostics.filter(d => d.status === 'success').length
  const errorCount = diagnostics.filter(d => d.status === 'error').length
  const warningCount = diagnostics.filter(d => d.status === 'warning').length

  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-2">
          Diagnóstico PWA & Push 🔧
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-200 max-w-3xl">
          Verifica que tu aplicación esté configurada correctamente para recibir notificaciones push en Android.
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{successCount}</div>
            <div className="text-sm text-green-600 dark:text-green-400">Correctos</div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{warningCount}</div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Advertencias</div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4 text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">{errorCount}</div>
            <div className="text-sm text-red-600 dark:text-red-400">Errores</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isRunning ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {isRunning ? 'Verificando...' : 'Verificar'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resultados de diagnóstico */}
      <div className="space-y-4">
        {diagnostics.map((diagnostic, index) => (
          <Card key={index} className={getStatusColor(diagnostic.status)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getStatusIcon(diagnostic.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{diagnostic.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{diagnostic.message}</p>
                    {diagnostic.details && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        {diagnostic.details}
                      </p>
                    )}
                  </div>
                </div>
                {diagnostic.action && diagnostic.actionLabel && (
                  <Button 
                    onClick={diagnostic.action}
                    variant="outline"
                    size="sm"
                    className="ml-4"
                  >
                    {diagnostic.actionLabel}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Información adicional de PushSaaS */}
      {pushSaaSStatus && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Estado de PushSaaS SDK
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
              {JSON.stringify(pushSaaSStatus, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Acciones de prueba */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Acciones de Prueba
          </CardTitle>
          <CardDescription>
            Herramientas para probar la funcionalidad de notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={sendTestNotification}
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white"
          >
            <Bell className="h-4 w-4 mr-2" />
            Enviar Notificación de Prueba
          </Button>
          
          <Button 
            onClick={() => {
              console.log('🔔 Estado de notificaciones:', Notification.permission)
              console.log('📱 User Agent:', navigator.userAgent)
              console.log('🌐 Online:', navigator.onLine)
              console.log('📍 Location:', location.href)
              if ((window as any).pushSaaS) {
                console.log('🚀 PushSaaS Status:', (window as any).pushSaaS.debug?.status?.())
              }
            }}
            variant="outline"
            className="w-full md:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Mostrar Info en Consola
          </Button>
        </CardContent>
      </Card>

      {/* Guía de resolución de problemas */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Guía de Resolución de Problemas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">❌ Si hay errores:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                <li>• Verificar que la app esté en HTTPS</li>
                <li>• Instalar la app como PWA</li>
                <li>• Conceder permisos de notificación</li>
                <li>• Verificar que no haya otros SW</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">✅ Para Android específicamente:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                <li>• Usar Chrome o navegador compatible</li>
                <li>• Instalar como PWA desde el menú</li>
                <li>• Verificar configuración de batería</li>
                <li>• No usar modo incógnito</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
