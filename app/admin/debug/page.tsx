'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, User, Key, Database } from 'lucide-react'

export default function AdminDebug() {
  const { user, loading, signOut } = useAuth()

  const handleClearCache = () => {
    // Clear all relevant caches
    if (typeof window !== 'undefined') {
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Clear localStorage
      localStorage.clear()
      
      // Force reload
      window.location.reload()
    }
  }

  const handleForceSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/auth/sign-in'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando información de usuario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-cyan-400">Debug de Usuario</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Información de sesión y usuario actual</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleClearCache}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Limpiar Caché
            </Button>
            <Button 
              onClick={handleForceSignOut}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* User Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Usuario Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">ID de Usuario</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">
                    {user?.id || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">Email Principal</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.email || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">Nombre</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.user_metadata?.full_name || user?.email || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">Username</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.user_metadata?.user_name || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">Creado</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.created_at ? new Date(user.created_at).toLocaleString('es-ES') : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">Última Actualización</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.updated_at ? new Date(user.updated_at).toLocaleString('es-ES') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Addresses */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Direcciones de Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user?.email ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{user.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Estado: N/D</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {String(user.id).slice(-8)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No hay direcciones de email</p>
            )}
          </CardContent>
        </Card>

        {/* Session Storage */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Session Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-gray-900 dark:text-slate-100">Admin Password</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {typeof window !== 'undefined' && sessionStorage.getItem('admin_password') ? 
                    '✅ Configurado' : '❌ No configurado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw User Object */}
        <Card>
          <CardHeader>
            <CardTitle>Objeto Usuario Completo (Raw)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96 text-gray-800 dark:text-gray-200">
              {JSON.stringify(user, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
