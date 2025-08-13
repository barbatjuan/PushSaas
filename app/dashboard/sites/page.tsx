'use client'

import { useCurrentUser } from '@/lib/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Users, Copy, ExternalLink, Trash2, Download, FileText, CheckCircle, Key } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type Site = Database['public']['Tables']['sites']['Row']

export default function SitesPage() {
  const { user, loading } = useCurrentUser()
  const [sites, setSites] = useState<Site[]>([])
  const [loadingSites, setLoadingSites] = useState(true)
  const [deletingSite, setDeletingSite] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<{siteId: string, siteName: string} | null>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  useEffect(() => {
    if (!user) return
    fetchSites()
  }, [user])

  const fetchSites = async () => {
    try {
      setLoadingSites(true)
      if (!user?.id) throw new Error('User not found');
      const response = await fetch(`/api/sites?userId=${user.id}`)
      if (!response.ok) throw new Error('Failed to fetch sites')
      const data = await response.json()
      setSites(data || [])
    } catch (error) {
      console.error('Error fetching sites:', error)
      setNotification({type: 'error', message: 'Error al cargar sitios'})
    } finally {
      setLoadingSites(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Add toast notification
  }

  const getScriptTag = (siteId: string) => {
    return `<script src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sdk.js" data-site="${siteId}"></script>`
  }

  const confirmDelete = (siteId: string, siteName: string) => {
    setShowDeleteDialog({siteId, siteName})
  }

  const deleteSite = async () => {
    if (!showDeleteDialog) return
    
    const {siteId, siteName} = showDeleteDialog
    
    try {
      setDeletingSite(siteId)
      setShowDeleteDialog(null)
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar sitio')
      }

      // Refresh sites list
      await fetchSites()
      setNotification({type: 'success', message: 'Sitio eliminado correctamente'})
    } catch (error) {
      console.error('Error deleting site:', error)
      setNotification({type: 'error', message: 'Error al eliminar sitio: ' + (error instanceof Error ? error.message : 'Error desconocido')})
    } finally {
      setDeletingSite(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  if (!user) {
    return <div className="flex items-center justify-center h-64">Error al cargar usuario</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-[#c0caf5] dark:via-[#7aa2f7] dark:to-[#bb9af7] bg-clip-text text-transparent">
            Mis Sitios
          </h1>
          <p className="text-lg text-gray-600 dark:text-[#a9b1d6] mt-2">
            Gestiona tus sitios web y obtén los códigos de integración.
          </p>
        </div>
        <Link href="/dashboard/sites/new">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 group">
            <Plus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            Agregar Sitio
          </Button>
        </Link>
      </div>

      {loadingSites ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-[#a9b1d6]">Cargando sitios...</p>
          </div>
        </div>
      ) : sites.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No tienes sitios registrados</CardTitle>
            <CardDescription>
              Agrega tu primer sitio para comenzar a recolectar suscriptores y enviar notificaciones push.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/dashboard/sites/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Mi Primer Sitio
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {sites.map((site) => (
            <Card key={site.id} className="border-0 bg-white/80 dark:bg-[#24283b]/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-[#414868]/30">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {site.name}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        site.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700/50' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700/50'
                      }`}>
                        {site.status === 'active' ? 'Activo' : 'Suspendido'}
                      </span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      {site.url}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <Users className="h-4 w-4" />
                      {site.subscriber_count} suscriptores
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Site ID Section - Prominente */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <label className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                        Site ID (para WordPress Plugin):
                      </label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(site.site_id)}
                      className="border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="mt-2">
                    <code className="block p-3 bg-white dark:bg-gray-800 rounded text-lg font-mono border border-purple-200 dark:border-purple-600 text-purple-900 dark:text-purple-200 font-bold">
                      {site.site_id}
                    </code>
                  </div>
                </div>

                {/* WordPress Plugin Integration Guide */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300">Integración WordPress Ultra-Simple</h3>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Descarga el Plugin WordPress</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Obtén el archivo ZIP listo para instalar</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Sube e Instala en WordPress</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Plugins → Añadir nuevo → Subir plugin</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Pega tu Site ID</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Configuración → NotiFly → Pegar Site ID de arriba</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900 dark:text-green-200">¡Listo! Verificación automática</p>
                        <p className="text-xs text-green-700 dark:text-green-300">El plugin verifica la integración automáticamente</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/api/download/wordpress-plugin';
                        link.download = 'notifly-push-notifications.zip';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Descargar Plugin WordPress
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('https://github.com/notifly/wordpress-plugin#readme', '_blank')}
                      className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Ver Documentación
                    </Button>
                  </div>
                </div>

                {/* Alternative Manual Integration */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2">
                      <span>🔧 Integración Manual (Avanzado)</span>
                      <span className="text-xs text-gray-500 group-open:hidden">Mostrar código</span>
                      <span className="text-xs text-gray-500 hidden group-open:inline">Ocultar código</span>
                    </summary>
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Código de integración manual:
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded text-sm font-mono border border-gray-200 dark:border-gray-600">
                            {getScriptTag(site.site_id)}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(getScriptTag(site.site_id))}
                            className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Solo si no puedes usar el plugin WordPress. Pega en el &lt;head&gt; de tu sitio.
                        </p>
                      </div>
                    </div>
                  </details>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/notifications/new?site=${site.id}`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500"
                    >
                      Enviar Notificación
                    </Button>
                  </Link>
                  <Link href={`/dashboard/sites/${site.id}/settings`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                    >
                      <Settings className="mr-1 h-3 w-3" />
                      Configurar
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => confirmDelete(site.site_id, site.name)}
                    disabled={deletingSite === site.site_id}
                    className="border-red-300 dark:border-red-600 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    {deletingSite === site.site_id ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                </div>

                {site.expires_at && new Date(site.expires_at) < new Date() && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      Este sitio ha expirado. Actualiza tu plan para continuar enviando notificaciones.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Plan limits warning */}
      {user.plan === 'free' && sites.length >= 1 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Plan Gratuito</CardTitle>
            <CardDescription className="text-yellow-700">
              En el plan gratuito puedes tener sitios ilimitados, pero cada sitio está limitado a 500 suscriptores.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Eliminar sitio
                </h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                ¿Estás seguro de que quieres eliminar el sitio <strong>"{showDeleteDialog.siteName}"</strong>? 
                Esta acción no se puede deshacer y se eliminarán todos los suscriptores asociados.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={deleteSite}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar sitio
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`rounded-md p-4 ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {notification.message}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setNotification(null)}
                    className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      notification.type === 'success'
                        ? 'text-green-500 hover:bg-green-100 focus:ring-green-600'
                        : 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                    }`}
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
