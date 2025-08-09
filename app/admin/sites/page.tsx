'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Globe, 
  Users, 
  RefreshCw,
  ExternalLink,
  Calendar
} from 'lucide-react'

interface Site {
  id: string
  name: string
  url: string
  site_id: string
  status: 'active' | 'suspended'
  subscriber_count: number
  created_at: string
  user_email: string
}

export default function SitesManagement() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchSites = async () => {
    try {
      setRefreshing(true)
      setError('')
      
      const response = await fetch(`/api/admin/sites-list`)
      
      if (response.ok) {
        const data = await response.json()
        setSites(data.sites || [])
      } else if (response.status === 401 || response.status === 403) {
        setError('No autorizado: inicia sesión con una cuenta admin')
      } else {
        setError('Error al cargar los sitios')
      }
    } catch (error) {
      console.error('Error fetching sites:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSites()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando sitios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌ {error}</div>
          <Button onClick={fetchSites}>Reintentar</Button>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-cyan-400">Gestión de Sitios</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Administra todos los sitios configurados</p>
          </div>
          <Button 
            onClick={fetchSites} 
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Sitios
              </CardTitle>
              <Globe className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                {sites.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Sitios Activos
              </CardTitle>
              <Globe className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                {sites.filter(s => s.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Suscriptores
              </CardTitle>
              <Users className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {sites.reduce((sum, site) => sum + (site.subscriber_count || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sites List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Sitios ({sites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {sites.length > 0 ? (
              <div className="space-y-4">
                {sites.map((site) => (
                  <div key={site.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{site.name}</h3>
                          <Badge variant={site.status === 'active' ? 'default' : 'destructive'}>
                            {site.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            <a 
                              href={site.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-blue-600 hover:underline"
                            >
                              {site.url}
                            </a>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Site ID:</span>
                            <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-xs">{site.site_id}</code>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Propietario:</span>
                            <span>{site.user_email}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Creado: {new Date(site.created_at).toLocaleDateString('es-ES')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {site.subscriber_count || 0}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">suscriptores</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">No hay sitios configurados</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Los sitios aparecerán aquí cuando los usuarios los configuren</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Última actualización: {new Date().toLocaleString('es-ES')}
          </p>
        </div>
      </div>
    </div>
  )
}
