'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // If already logged in via admin_password, go to dashboard
    if (typeof window !== 'undefined') {
      const existing = sessionStorage.getItem('admin_password')
      if (existing) {
        router.replace('/admin/dashboard')
      }
    }
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Introduce la contraseña de administrador')
      return
    }

    // Store temporarily in session for legacy endpoints that accept admin_password
    sessionStorage.setItem('admin_password', password)

    // Navigate to admin dashboard
    router.push('/admin/dashboard')
  }

  const handleClear = () => {
    sessionStorage.removeItem('admin_password')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-cyan-400">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña de administrador
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduce la contraseña"
              />
            </div>

            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" className="w-full">Entrar</Button>
              <Button type="button" variant="outline" onClick={handleClear}>Limpiar</Button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Nota: Esta pantalla existe por compatibilidad temporal. Los endpoints ya soportan login con Clerk + rol admin.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
