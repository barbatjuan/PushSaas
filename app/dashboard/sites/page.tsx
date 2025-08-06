'use client'

import { useCurrentUser } from '@/lib/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Users, Copy, ExternalLink, Trash2 } from 'lucide-react'
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

  useEffect(() => {
    if (!user) return
    fetchSites()
  }, [user])

  const fetchSites = async () => {
    try {
      setLoadingSites(true)
      const response = await fetch('/api/sites')
      if (!response.ok) throw new Error('Failed to fetch sites')
      const data = await response.json()
      setSites(data || [])
    } catch (error) {
      console.error('Error fetching sites:', error)
      alert('Error al cargar sitios')
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

  const deleteSite = async (siteId: string, siteName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el sitio "${siteName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      setDeletingSite(siteId)
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar sitio')
      }

      // Refresh sites list
      await fetchSites()
      alert('Sitio eliminado correctamente')
    } catch (error) {
      console.error('Error deleting site:', error)
      alert('Error al eliminar sitio: ' + (error instanceof Error ? error.message : 'Error desconocido'))
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Sitios</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tus sitios web y obtén los códigos de integración.
          </p>
        </div>
        <Link href="/dashboard/sites/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Sitio
          </Button>
        </Link>
      </div>

      {loadingSites ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando sitios...</p>
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
            <Card key={site.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {site.name}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        site.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
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
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      {site.subscriber_count} suscriptores
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Código de integración:
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                      {getScriptTag(site.site_id)}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(getScriptTag(site.site_id))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Copia este código y pégalo en el &lt;head&gt; de tu sitio web.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/notifications/new?site=${site.id}`}>
                    <Button variant="outline" size="sm">
                      Enviar Notificación
                    </Button>
                  </Link>
                  <Link href={`/dashboard/sites/${site.id}/settings`}>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-1 h-3 w-3" />
                      Configurar
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteSite(site.site_id, site.name)}
                    disabled={deletingSite === site.site_id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div>
  )
}
