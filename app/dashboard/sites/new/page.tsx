'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/lib/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewSitePage() {
  const { user, loading } = useCurrentUser()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    url: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          url: formData.url.trim(),
          user_id: user.id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el sitio')
      }

      router.push('/dashboard/sites')
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
          <h1 className="text-3xl font-bold text-gray-900">Agregar Nuevo Sitio</h1>
          <p className="text-gray-600 mt-2">
            Registra tu sitio web para comenzar a recolectar suscriptores.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Información del Sitio</CardTitle>
            <CardDescription>
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
