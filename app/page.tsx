'use client'

import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Moon, Sun, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (isLoaded && user) {
      router.push('/dashboard')
    }
  }, [user, isLoaded, router])

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('pushsaas-theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('pushsaas-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('pushsaas-theme', 'light')
    }
  }

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#1a1b26] dark:via-[#1f2335] dark:to-[#24283b] transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-[#1a1b26]/90 backdrop-blur-md border-b border-gray-200/50 dark:border-[#414868]/30 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-[#c0caf5] dark:to-[#a9b1d6] bg-clip-text text-transparent">PushSaaS</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#414868]/20 transition-colors duration-200"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Moon className="h-4 w-4 text-gray-600 dark:text-[#a9b1d6]" />
                )}
              </Button>
              <Link href="/sign-in">
                <Button variant="outline" className="border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-[#414868]/30 dark:hover:border-[#7aa2f7] dark:hover:bg-[#414868]/20 text-blue-700 dark:text-[#7aa2f7] hover:text-blue-800 dark:hover:text-[#8fbcf7] transition-all duration-200">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-6">
            Reconecta con tus visitantes
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-200 mb-8 max-w-3xl mx-auto">
            Plataforma SaaS de notificaciones push web para negocios pequeños. 
            Recupera clientes que visitaron tu sitio pero no compraron.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/sign-up">
              <Button className="px-8 py-3 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                Comenzar Gratis
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" className="px-8 py-3 h-11 border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-600 hover:text-white transition-all duration-200 font-semibold">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                Registra tu sitio
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Agrega la URL de tu sitio web existente y obtén un código JavaScript único
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                Recolecta suscriptores
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Los visitantes de tu sitio pueden suscribirse a tus notificaciones push
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                Envía notificaciones
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Crea y envía notificaciones personalizadas desde tu panel de control
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Planes y Precios</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Plan Gratuito</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">Perfecto para empezar</CardDescription>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">$0<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/mes</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Hasta 20 suscriptores
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Notificaciones ilimitadas
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Métricas básicas
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Plan Pro</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">Para negocios en crecimiento</CardDescription>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">€19<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/mes</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Hasta 10,000 suscriptores
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Notificaciones ilimitadas
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Métricas avanzadas
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
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
