'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminUserMenuProps {
  user: {
    id: string
    email?: string
  }
}

export default function AdminUserMenu({ user }: AdminUserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Usar router de Next.js para mejor compatibilidad con SSR
      router.push('/sign-out')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      setIsLoggingOut(false)
    }
  }

  const userInitial = (user.email?.[0] || 'A').toUpperCase()
  const shortId = String(user.id).slice(-8)

  return (
    <div className="relative">
      {/* User Info Display */}
      <div 
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        onClick={() => setShowMenu(!showMenu)}
      >
        {/* Avatar */}
        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-white text-sm font-medium">
            {userInitial}
          </span>
        </div>
        
        {/* User Info */}
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {user.email || 'Admin'}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ID:
            </span>
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono border">
              {shortId}
            </code>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.email || 'Admin'}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ID:
              </span>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono border">
                {shortId}
              </code>
            </div>
          </div>
          
          <div className="py-1">
            <a 
              href="/dashboard" 
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setShowMenu(false)}
            >
              <User className="h-4 w-4" />
              Dashboard Usuario
            </a>
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}
