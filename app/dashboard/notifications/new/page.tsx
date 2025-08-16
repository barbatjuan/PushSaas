'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCurrentUser } from '@/lib/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Send, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type Site = Database['public']['Tables']['sites']['Row']

export default function NewNotificationPage() {
  const { user, loading, isPaid } = useCurrentUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedSiteId = searchParams?.get('site')

  const [sites, setSites] = useState<Site[]>([])
  const [loadingSites, setLoadingSites] = useState(true)
  // Mapa de conteos reales de suscriptores activos por sitio
  const [activeCounts, setActiveCounts] = useState<Record<string, number>>({})
  const [formData, setFormData] = useState({
    site_id: preselectedSiteId || '',
    title: '',
    message: '',
    url: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return

    const fetchSites = async () => {
      try {
        const { data, error } = await supabase
          .from('sites')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('name')

        if (error) throw error
        setSites(data || [])
        // Obtener conteos reales por sitio desde el backend (evita RLS)
        try {
          const res = await fetch('/api/dashboard/subscriber-counts')
          if (res.ok) {
            const json = await res.json()
            const counts: Record<string, number> = {}
            if (json?.bySite) {
              for (const [siteId, info] of Object.entries(json.bySite as Record<string, any>)) {
                counts[siteId] = (info as any).count || 0
              }
            }
            setActiveCounts(counts)
          } else {
            setActiveCounts({})
          }
        } catch (e) {
          console.error('Error fetching subscriber-counts:', e)
          setActiveCounts({})
        }
        
        // If no preselected site and only one site, auto-select it
        if (!preselectedSiteId && data && data.length === 1) {
          setFormData(prev => ({ ...prev, site_id: data[0].id }))
        }
      } catch (error) {
        console.error('Error fetching sites:', error)
      } finally {
        setLoadingSites(false)
      }
    }

    fetchSites()
  }, [user, preselectedSiteId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: formData.site_id,
          title: formData.title.trim(),
          message: formData.message.trim(),
          url: formData.url.trim() || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar la notificación')
      }

      router.push('/dashboard/notifications')
    } catch (error) {
      console.error('Error sending notification:', error)
      setError(error instanceof Error ? error.message : 'Error al enviar la notificación')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const selectedSite = sites.find(site => site.id === formData.site_id)
  const selectedCount = selectedSite ? (activeCounts[selectedSite.id] || 0) : 0
  const canSend = selectedCount > 0
  const isFormValid = formData.site_id && formData.title.trim() && formData.message.trim()

  if (loading || loadingSites) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  if (!user) {
    return <div className="flex items-center justify-center h-64">Error al cargar usuario</div>
  }

  if (sites.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/notifications">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nueva Notificación</h1>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>No tienes sitios activos</CardTitle>
            <CardDescription>
              Necesitas tener al menos un sitio registrado y activo para enviar notificaciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/dashboard/sites/new">
              <Button>Agregar Mi Primer Sitio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/notifications">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-[#c0caf5] dark:via-[#7aa2f7] dark:to-[#bb9af7] bg-clip-text text-transparent">Nueva Notificación</h1>
          <p className="text-gray-600 dark:text-[#a9b1d6] mt-2">
            Envía una notificación push a los suscriptores de tu sitio.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Notificación</CardTitle>
            <CardDescription>
              Completa la información de tu notificación push. Será enviada inmediatamente a todos los suscriptores activos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="site_id">Sitio</Label>
                <Select
                  value={formData.site_id}
                  onValueChange={(value) => handleChange('site_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un sitio" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name} ({activeCounts[site.id] || 0} suscriptores)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSite && (
                  <p className="text-sm text-gray-500">
                    Se enviará a {selectedCount} suscriptores de {selectedSite.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="¡Oferta especial solo por hoy!"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  maxLength={50}
                  required
                />
                <p className="text-sm text-gray-500">
                  {formData.title.length}/50 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  placeholder="Aprovecha nuestro descuento del 30% en todos los productos. ¡Solo hasta medianoche!"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  maxLength={120}
                  rows={3}
                  required
                />
                <p className="text-sm text-gray-500">
                  {formData.message.length}/120 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL de destino (opcional)</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://mitienda.com/ofertas"
                  value={formData.url}
                  onChange={(e) => handleChange('url', e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Los usuarios serán dirigidos a esta URL al hacer clic en la notificación.
                </p>
              </div>

              {!canSend && selectedSite && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Este sitio no tiene suscriptores activos. No se podrá enviar la notificación.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={!isFormValid || !canSend || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Notificación
                    </>
                  )}
                </Button>
                <Link href="/dashboard/notifications">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
            <CardDescription>
              Así se verá tu notificación en el navegador:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-100 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">🔔</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {formData.title || 'Título de la notificación'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formData.message || 'Mensaje de la notificación aparecerá aquí...'}
                  </div>
                  {selectedSite && (
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedSite.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
