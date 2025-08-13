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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div>NotiFly</div>
            <nav>
              <a href="#inicio">Inicio</a>
              <a href="#como-funciona">Cómo Funciona</a>
            </nav>
          </div>
        </div>
      </header>
      
      <main>
        <section className="pt-32 pb-16">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold">NotiFly</h1>
            <p className="mt-4">Plataforma de notificaciones push</p>
          </div>
        </section>
      </main>
      
      <footer className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2025 NotiFly. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
