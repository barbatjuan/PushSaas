'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  Bell,
  Users,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle,
  Menu,
  X,
  Globe,
  Smartphone,
  Target,
  Shield,
  Play,
  Send,
  Sun,
  Moon,
} from 'lucide-react'

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (user) {
      router.push('/post-login')
    }
  }, [user, router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Initialize theme from localStorage or system, and keep <html> in sync
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('theme')
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      const startDark = stored ? stored === 'dark' : prefersDark
      setIsDark(startDark)
      document.documentElement.classList.toggle('dark', startDark)
    } catch (_) {
      // no-op
    }
  }, [])

  const toggleDark = () => {
    if (typeof window === 'undefined') return
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch (_) {}
  }

  // No hard loading here; landing is public.

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  NotiFly
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Web Push Platform</div>
              </div>
            </div>

            <nav className="hidden md:flex space-x-8">
              <a href="#inicio" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:dark:text-white transition-colors font-medium">Inicio</a>
              <a href="#como-funciona" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:dark:text-white transition-colors font-medium">Cómo Funciona</a>
              <a href="#precios" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:dark:text-white transition-colors font-medium">Precios</a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <button onClick={toggleDark} aria-label="Cambiar tema" className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link href="/auth/sign-in" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:dark:text-white transition-colors font-medium">Iniciar Sesión</Link>
              <Link href="/sign-up" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">Comenzar Gratis</Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg">
            <nav className="flex flex-col space-y-4 p-4">
              <a href="#inicio" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:dark:text-white transition-colors font-medium">Inicio</a>
              <a href="#como-funciona" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:dark:text-white transition-colors font-medium">Cómo Funciona</a>
              <a href="#precios" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:dark:text-white transition-colors font-medium">Precios</a>
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100">
                <button onClick={toggleDark} className="text-left p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center space-x-2"><span>{isDark ? 'Tema claro' : 'Tema oscuro'}</span></button>
                <Link href="/sign-in" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:dark:text-white transition-colors font-medium">Iniciar Sesión</Link>
                <Link href="/sign-up" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl text-left">Comenzar Gratis</Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="inicio" className="pt-24 pb-16 lg:pt-32 lg:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-slate-900 dark:via-gray-900 dark:to-indigo-950" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-r from-blue-400 to-purple-400 dark:from-blue-900 dark:to-purple-900 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-r from-purple-400 to-indigo-400 dark:from-purple-900 dark:to-indigo-900 rounded-full blur-3xl opacity-20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Bell className="w-4 h-4 mr-2" />
                Plataforma SaaS de Notificaciones Push
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                <span className="block">Reconecta con</span>
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent block">tus visitantes</span>
              </h1>

              <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Plataforma SaaS de notificaciones push web para negocios pequeños. <span className="font-semibold text-blue-600">Recupera clientes</span> que visitaron tu sitio pero no compraron.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/auth/sign-up" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center text-center">Comenzar Gratis</Link>
                <Link href="/auth/sign-in" className="border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-8 py-4 rounded-2xl text-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { value: '2.5M+', label: 'Notificaciones Enviadas' },
                  { value: '95%', label: 'Tasa de Entrega' },
                  { value: '12.3%', label: 'CTR Promedio' },
                  { value: '<3seg', label: 'Tiempo de Entrega' },
                ].map((stat, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo Preview */}
            <div className="mt-12 lg:mt-0 relative">
              <div className="relative">
                {/* Browser mockup */}
                <div className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-t-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Barra superior de Safari con título y controles */}
                  <div className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-2 flex items-center border-b border-gray-300 dark:border-gray-700">
                    {/* Controles de ventana */}
                    <div className="flex items-center space-x-1.5 mr-4 ml-1.5">
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-inner flex items-center justify-center group cursor-pointer">
                        <span className="text-red-800 opacity-0 group-hover:opacity-100 text-[8px] font-bold">×</span>
                      </div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-inner flex items-center justify-center group cursor-pointer">
                        <span className="text-yellow-800 opacity-0 group-hover:opacity-100 text-[8px] font-bold">−</span>
                      </div>
                      <div className="w-3 h-3 bg-green-500 rounded-full shadow-inner flex items-center justify-center group cursor-pointer">
                        <span className="text-green-800 opacity-0 group-hover:opacity-100 text-[8px] font-bold">+</span>
                      </div>
                    </div>
                    
                    {/* Pestañas de Safari */}
                    <div className="flex items-center space-x-1 flex-1 h-7">
                      <div className="bg-white dark:bg-gray-700 rounded-t-lg px-3 py-1.5 text-xs text-gray-800 dark:text-gray-200 font-medium flex items-center space-x-1.5 border-b-0 shadow-inner relative h-full">
                        <div className="w-3 h-3 bg-blue-500 rounded-full opacity-80"></div>
                        <span>NotiFly</span>
                        {/* Indicador de pestaña activa */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                      </div>
                      <div className="bg-gray-200 dark:bg-gray-800 rounded-t-lg px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center space-x-1.5 opacity-70">
                        <span>Nueva pestaña</span>
                      </div>
                    </div>
                    
                    {/* Controles adicionales */}
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <div className="w-2 h-2 border-t-2 border-r-2 border-gray-500 dark:border-gray-300 transform rotate-45 translate-x-[-1px]"></div>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <div className="w-2 h-2 border-t-2 border-r-2 border-gray-500 dark:border-gray-300 transform rotate-[225deg] translate-x-[1px]"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Barra de dirección y herramientas */}
                  <div className="bg-white dark:bg-gray-700 p-1.5 flex items-center space-x-2 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-1 text-sm text-gray-600 dark:text-gray-300 flex items-center">
                      <div className="w-4 h-4 mr-2 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 dark:text-blue-400 w-full h-full">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                      </div>
                      <span className="flex-1 text-xs font-medium">https://notifly.com</span>
                      <div className="w-4 h-4 ml-2 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-500 w-full h-full">
                          <path d="M18 15v3H6v-3"></path>
                          <path d="M12 3v12"></path>
                          <path d="m9 11 3 3 3-3"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="m22 2-7 20-4-9-9-4Z"></path>
                        <path d="M22 2 11 13"></path>
                      </svg>
                    </div>
                    <div className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M4 11a9 9 0 0 1 9 9"></path>
                        <path d="M4 4a16 16 0 0 1 16 16"></path>
                        <circle cx="5" cy="19" r="1"></circle>
                      </svg>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 h-[400px] overflow-hidden relative">
                    {/* Contenido de la página web de NotiFly */}
                    <div className="h-full overflow-y-auto">
                      {/* Header con gradiente */}
                      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700 p-3 relative">
                        <div className="flex items-center justify-between">
                          {/* Logo y nombre */}
                          <div className="flex items-center space-x-2">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-600 dark:text-blue-400">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                              </svg>
                            </div>
                            <span className="text-white font-bold text-lg">NotiFly</span>
                          </div>
                          
                          {/* Navegación */}
                          <div className="hidden sm:flex items-center space-x-4 text-xs text-white/90">
                            <span>Inicio</span>
                            <span>Cómo Funciona</span>
                            <span>Precios</span>
                          </div>
                          
                          {/* Botones de acción */}
                          <div className="flex items-center space-x-2">
                            <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-md backdrop-blur-sm transition-colors">Iniciar Sesión</button>
                            <button className="text-xs bg-white text-indigo-600 px-2 py-1 rounded-md font-medium shadow-md hover:shadow-lg transition-shadow">Comenzar Gratis</button>
                          </div>
                        </div>
                        
                        {/* Elementos decorativos */}
                        <div className="absolute -top-2 -left-8 transform hover:scale-110 transition-transform duration-500">
                          <div className="w-8 h-6 bg-gradient-to-br from-purple-500 via-pink-600 to-rose-600 rounded-md shadow-lg transform -rotate-12 hover:-rotate-6 transition-transform duration-700 border border-white/20">
                            <div className="p-1 space-y-0.5">
                              <div className="h-0.5 bg-white/50 rounded w-full animate-pulse"></div>
                              <div className="h-0.5 bg-white/40 rounded w-2/3 animate-pulse" style={{animationDelay: '0.3s'}}></div>
                              <div className="flex space-x-0.5">
                                <div className="w-1 h-1 bg-white/60 rounded animate-pulse" style={{animationDelay: '0.5s'}}></div>
                                <div className="w-1 h-1 bg-white/50 rounded animate-pulse" style={{animationDelay: '0.7s'}}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Notificaciones flotantes animadas */}
                        <div className="absolute -top-6 right-2 animate-bounce" style={{animationDelay: '1s'}}>
                          <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full shadow-lg flex items-center justify-center border-2 border-white/30">
                            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                          </div>
                        </div>

                        <div className="absolute top-8 -left-4 animate-bounce" style={{animationDelay: '1.5s'}}>
                          <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg flex items-center justify-center border border-white/30">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hero Section */}
                      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                        <div className="text-center">
                          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            Reconecta con<br />
                            <span className="text-4xl sm:text-5xl">tus visitantes</span>
                          </h1>
                          <p className="mt-3 max-w-md mx-auto text-base text-gray-600 dark:text-gray-400 sm:text-lg">
                            Plataforma SaaS de notificaciones push web para negocios pequeños. <span className="text-blue-600 dark:text-blue-400 font-medium">Recupera clientes</span> que visitaron tu sitio pero no compraron.
                          </p>
                          <div className="mt-5 max-w-md mx-auto flex justify-center">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-md hover:shadow-lg transition-all transform hover:scale-105">
                              Comenzar Gratis
                            </button>
                          </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="mt-8 flex justify-center space-x-8 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">2.5M+</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Notificaciones Enviadas</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">95%</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Tasa de Entrega</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">12.3%</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">CTR Promedio</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Cómo Funciona */}
                      <div className="py-8 bg-gray-50 dark:bg-gray-800">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                          <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cómo <span className="text-blue-600 dark:text-blue-400">Funciona</span></h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">En 3 pasos simples, tendrás tus notificaciones funcionando</p>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-6">
                            <div className="text-center">
                              <div className="mb-3 mx-auto w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl">1</div>
                              <div className="flex justify-center mb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                              </div>
                              <h3 className="font-medium text-gray-900 dark:text-white text-sm">Registra tu sitio</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Agrega un URL de tu sitio y obtén un script</p>
                            </div>
                            
                            <div className="text-center">
                              <div className="mb-3 mx-auto w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl">2</div>
                              <div className="flex justify-center mb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                              </div>
                              <h3 className="font-medium text-gray-900 dark:text-white text-sm">Recolecta suscriptores</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Los visitantes se suscriben a tus notificaciones</p>
                            </div>
                            
                            <div className="text-center">
                              <div className="mb-3 mx-auto w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl">3</div>
                              <div className="flex justify-center mb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                              </div>
                              <h3 className="font-medium text-gray-900 dark:text-white text-sm">Envía notificaciones</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Crea y envía campañas desde el panel</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification overlay */}
                <div className="absolute -top-4 -right-4 z-10">
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-4 max-w-sm mx-auto border border-gray-200 dark:border-gray-800">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">TuTienda.com</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">ahora</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">¡Tu carrito te espera! 🛒 Completa tu compra y obtén 20% de descuento</p>
                        <button className="text-blue-600 text-xs font-medium hover:text-blue-700">Ver oferta →</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-16 lg:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">Cómo <span className="text-blue-600">Funciona</span></h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">En 3 pasos simples, tendrás tus notificaciones funcionando</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {[
              { number: '1', title: 'Registra tu sitio', description: 'Agrega la URL de tu sitio y obtén un script', icon: <Globe className="w-8 h-8" /> },
              { number: '2', title: 'Recolecta suscriptores', description: 'Los visitantes se suscriben a tus notificaciones', icon: <Users className="w-8 h-8" /> },
              { number: '3', title: 'Envía notificaciones', description: 'Crea y envía campañas desde el panel', icon: <Send className="w-8 h-8" /> },
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg">{(index + 1).toString()}</div>
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">{step.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-sm">{step.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden lg:block absolute top-10 -right-6 transform translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-blue-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">Características que <span className="text-blue-600">Impulsan Ventas</span></h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">Tecnología diseñada para maximizar tu retorno</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Target className="w-8 h-8" />, title: 'Recuperación de Clientes', description: 'Reconecta y convierte abandono en ventas.' },
              { icon: <Zap className="w-8 h-8" />, title: 'Entrega Instantánea', description: 'Incluso con el navegador cerrado.' },
              { icon: <BarChart3 className="w-8 h-8" />, title: 'Analytics Avanzados', description: 'Engagement, clicks y conversiones.' },
              { icon: <Shield className="w-8 h-8" />, title: '100% Seguro', description: 'GDPR y cifrado extremo a extremo.' },
            ].map((f, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-800 group">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300">
                  <div className="text-blue-600">{f.icon}</div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{f.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-16 lg:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">Planes y <span className="text-blue-600">Precios</span></h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">Elige el plan perfecto. Sin compromisos</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-800 hover:border-blue-200 transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Plan Gratuito</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Perfecto para empezar</p>
                <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">$0<span className="text-xl text-gray-500 dark:text-gray-400 font-normal">/mes</span></div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-700 dark:text-gray-200">Hasta 20 suscriptores</span></div>
                <div className="flex items-center space-x-3"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-700 dark:text-gray-200">Notificaciones ilimitadas</span></div>
                <div className="flex items-center space-x-3"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-700 dark:text-gray-200">Métricas básicas</span></div>
              </div>
              <Link href="/sign-up" className="w-full inline-block text-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300">Comenzar Gratis</Link>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">Más Popular</div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Plan Pro</h3>
                <p className="text-blue-100 mb-6">Para negocios en crecimiento</p>
                <div className="text-5xl font-bold mb-2">€19<span className="text-xl font-normal text-blue-100">/mes</span></div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3"><CheckCircle className="w-5 h-5 text-white" /><span>Hasta 10,000 suscriptores</span></div>
                <div className="flex items-center space-x-3"><CheckCircle className="w-5 h-5 text-white" /><span>Notificaciones ilimitadas</span></div>
                <div className="flex items-center space-x-3"><CheckCircle className="w-5 h-5 text-white" /><span>Métricas avanzadas y soporte prioritario</span></div>
              </div>
              <Link href="/sign-up" className="w-full inline-block text-center bg-white text-blue-700 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors duration-300">Empezar</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">Lo que dicen nuestros <span className="text-blue-600">Clientes</span></h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">Resultados reales de negocios que ya están usando AdiosWiFi</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{
              name: 'Carlos Mendoza',
              role: 'E-commerce TechStore',
              stat: '+35% conversiones',
              quote: '"Recuperamos el 35% de carritos abandonados. El ROI fue inmediato, en el primer mes ya habíamos recuperado la inversión anual."'
            },{
              name: 'Laura Vega',
              role: 'Tienda Online ModaStyle',
              stat: '+127% engagement',
              quote: '"Increíble facilidad de uso. En 10 minutos ya tenía todo configurado y enviando mi primera campaña. Los resultados superaron nuestras expectativas."'
            },{
              name: 'Miguel Torres',
              role: 'SaaS CloudTech',
              stat: '+89% retención',
              quote: '"La segmentación automática es fantástica. Podemos enviar mensajes personalizados basados en el comportamiento del usuario. Game changer total."'
            }].map((t, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 shadow-lg">
                <div className="text-sm font-semibold text-green-500 mb-3">{t.stat}</div>
                <p className="text-gray-700 dark:text-gray-200 italic mb-6">{t.quote}</p>
                <div className="">
                  <div className="font-bold text-gray-900 dark:text-white">{t.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">¿Listo para Recuperar tus Ventas Perdidas?</h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Únete a miles de negocios que ya están convirtiendo más visitantes en clientes</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/sign-up" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl">Comenzar Gratis Ahora</Link>
            <div className="text-sm text-gray-500 dark:text-gray-400">Sin tarjeta de crédito • Setup en 5 minutos</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AdiosWiFi</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">Push Notifications</div>
              <p className="text-gray-600 dark:text-gray-400">La plataforma SaaS líder para recuperar clientes con notificaciones push web.</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li><a href="#como-funciona" className="hover:text-blue-600">Características</a></li>
                <li><a href="#precios" className="hover:text-blue-600">Precios</a></li>
                <li><a href="#" className="hover:text-blue-600">API</a></li>
                <li><a href="#" className="hover:text-blue-600">Integraciones</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Recursos</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li><a href="#" className="hover:text-blue-600">Blog</a></li>
                <li><a href="#" className="hover:text-blue-600">Guías</a></li>
                <li><a href="#" className="hover:text-blue-600">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-blue-600">Estado del Servicio</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li><a href="#" className="hover:text-blue-600">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-blue-600">Contacto</a></li>
                <li><a href="#" className="hover:text-blue-600">Privacidad</a></li>
                <li><a href="#" className="hover:text-blue-600">Términos</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">© 2025 AdiosWiFi. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
