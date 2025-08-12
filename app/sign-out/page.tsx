'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SignOutPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        // Cerrar sesión con Supabase
        await supabase.auth.signOut()
        
        // Limpiar localStorage si hay datos adicionales
        localStorage.clear()
        
        // Redirigir a la página de sign-in
        router.push('/auth/sign-in')
      } catch (error) {
        console.error('Error durante el logout:', error)
        // Aún así redirigir en caso de error
        router.push('/auth/sign-in')
      }
    }

    handleSignOut()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Cerrando sesión...</p>
      </div>
    </div>
  )
}
