'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignOutPage() {
  const router = useRouter()

  useEffect(() => {
    // Limpiar cualquier estado local/cookies si es necesario
    // y redirigir a la página de inicio de sesión
    const handleSignOut = async () => {
      try {
        // Limpiar localStorage si hay datos de sesión
        localStorage.clear()
        
        // Redirigir a la página de sign-in
        router.push('/sign-in')
      } catch (error) {
        console.error('Error durante el logout:', error)
        // Aún así redirigir en caso de error
        router.push('/sign-in')
      }
    }

    handleSignOut()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Cerrando sesión...</p>
      </div>
    </div>
  )
}
