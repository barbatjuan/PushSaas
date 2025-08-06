import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function HomePage() {
  const user = await currentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Reconecta con tus visitantes
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Plataforma SaaS de notificaciones push web para negocios pequeños. 
            Recupera clientes que visitaron tu sitio pero no compraron.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/sign-up">
              <Button className="px-8 py-3 h-11">
                Comenzar Gratis
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button className="px-8 py-3 h-11 border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                Registra tu sitio
              </CardTitle>
              <CardDescription>
                Agrega la URL de tu sitio web existente y obtén un código JavaScript único
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                Recolecta suscriptores
              </CardTitle>
              <CardDescription>
                Los visitantes de tu sitio pueden suscribirse a tus notificaciones push
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                Envía notificaciones
              </CardTitle>
              <CardDescription>
                Crea y envía notificaciones personalizadas desde tu panel de control
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">Planes y Precios</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Plan Gratuito</CardTitle>
                <CardDescription>Perfecto para empezar</CardDescription>
                <div className="text-3xl font-bold">$0<span className="text-sm font-normal">/mes</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Hasta 500 suscriptores
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Notificaciones ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Métricas básicas
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500">
              <CardHeader>
                <CardTitle>Plan Pro</CardTitle>
                <CardDescription>Para negocios en crecimiento</CardDescription>
                <div className="text-3xl font-bold">$29<span className="text-sm font-normal">/mes</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Hasta 10,000 suscriptores
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Notificaciones ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Métricas avanzadas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Soporte prioritario
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
