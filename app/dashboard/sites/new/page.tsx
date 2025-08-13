'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Copy, Download } from 'lucide-react'
import { useCurrentUser } from '@/lib/hooks/use-user'

export default function NewSitePage() {
  const { user, loading } = useCurrentUser()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    logo_url: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [automationResult, setAutomationResult] = useState<any>(null)
  const [showIntegrationCode, setShowIntegrationCode] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setError('')
    setAutomationResult(null)

    try {
      // Use the existing sites endpoint
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          url: formData.url.trim(),
          logo_url: formData.logo_url.trim() || undefined,
          // Pasar el ID interno (UUID) del usuario para asociar el sitio
          userId: user.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el sitio automáticamente')
      }

      // Store the automation result to show integration code
      setAutomationResult(result)
      setShowIntegrationCode(true)
      
      // Don't redirect immediately - let user see the integration code first
      console.log('✅ Site created with automation:', result)
      
    } catch (error) {
      console.error('Error creating site:', error)
      setError(error instanceof Error ? error.message : 'Error al crear el sitio')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const isFormValid = formData.name.trim() && formData.url.trim() && isValidUrl(formData.url.trim())

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  if (!user) {
    return <div className="flex items-center justify-center h-64">Error al cargar usuario</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sites">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-[#c0caf5] dark:via-[#7aa2f7] dark:to-[#bb9af7] bg-clip-text text-transparent">Agregar Nuevo Sitio</h1>
          <p className="text-gray-600 dark:text-[#a9b1d6] mt-2">
            Registra tu sitio web para comenzar a recolectar suscriptores.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card className="border-0 bg-white/80 dark:bg-[#24283b]/90 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-[#414868]/30">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">Información del Sitio</CardTitle>
            <CardDescription className="text-gray-600 dark:text-[#a9b1d6]">
              Proporciona los detalles de tu sitio web. Una vez registrado, obtendrás un código JavaScript para integrar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Sitio</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Mi Tienda Online"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <p className="text-sm text-gray-500">
                  Un nombre descriptivo para identificar tu sitio en el dashboard.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL del Sitio</Label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  placeholder="https://mitienda.com"
                  value={formData.url}
                  onChange={handleChange}
                  required
                />
                <p className="text-sm text-gray-500">
                  La URL completa de tu sitio web (incluye https://).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo de la Empresa (Opcional)</Label>
                <Input
                  id="logo_url"
                  name="logo_url"
                  type="url"
                  placeholder="https://mitienda.com/logo.png"
                  value={formData.logo_url}
                  onChange={handleChange}
                />
                <p className="text-sm text-gray-500">
                  URL del logo de tu empresa que aparecerá en las notificaciones push (recomendado: 192x192px).
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Sitio'}
                </Button>
                <Link href="/dashboard/sites">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Integration Code Display */}
        {showIntegrationCode && automationResult && (
          <Card className="mt-6 border-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg border-l-4 border-green-500 dark:border-green-400">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-300 flex items-center gap-2">
                🎉 ¡Sitio Creado Automáticamente!
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-200">
                Tu sitio ha sido configurado completamente. Ahora puedes usar el plugin WordPress para integración ultra-simple.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Site ID Prominente */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                    🔑 Tu Site ID
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(automationResult.site?.id)}
                    className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                </div>
                <code className="block p-3 bg-white dark:bg-gray-800 rounded text-lg font-mono border border-purple-200 dark:border-purple-600 text-purple-900 dark:text-purple-200 font-bold">
                  {automationResult.site?.id}
                </code>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                  Usa este Site ID en el plugin WordPress para configuración automática.
                </p>
              </div>

              {/* WordPress Plugin Guide */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                  📱 Integración WordPress Recomendada
                </h4>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <span className="text-sm text-blue-800 dark:text-blue-200">Descarga el plugin WordPress</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <span className="text-sm text-blue-800 dark:text-blue-200">Instala en WordPress (Plugins → Subir plugin)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <span className="text-sm text-blue-800 dark:text-blue-200">Pega tu Site ID y ¡listo!</span>
                  </div>
                </div>
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
              </div>

              {/* Alternative Manual Integration - Collapsed */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span>🔧 Integración Manual (Solo si no usas WordPress)</span>
                  <span className="text-xs text-gray-500 group-open:hidden">Mostrar código</span>
                  <span className="text-xs text-gray-500 hidden group-open:inline">Ocultar código</span>
                </summary>
                <div className="mt-3 space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  {/* HTML Integration */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Código para HTML (cualquier sitio)</Label>
                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-600">
                      <code className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap font-mono">
                        {automationResult.integration?.sdk_code}
                      </code>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Pega este código en el &lt;head&gt; de tu sitio web.
                    </p>
                  </div>
                </div>
              </details>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  onClick={() => router.push('/dashboard/sites')}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
                >
                  Ver Todos los Sitios
                </Button>
                <Button 
                  onClick={() => router.push(`/dashboard/notifications/new?site=${automationResult.site?.id}`)}
                  variant="outline"
                  className="flex-1 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  Enviar Primera Notificación
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>¿Qué sucede después?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">Obtendrás un código JavaScript único</p>
                <p className="text-sm text-gray-600">
                  Un script personalizado para tu sitio que recolectará suscriptores.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">Instala el código en tu sitio</p>
                <p className="text-sm text-gray-600">
                  Copia y pega el código en el &lt;head&gt; de tu sitio web.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Comienza a enviar notificaciones</p>
                <p className="text-sm text-gray-600">
                  Una vez que tengas suscriptores, podrás enviar notificaciones push.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
