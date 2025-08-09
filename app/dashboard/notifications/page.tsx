'use client'

import { useCurrentUser } from '@/lib/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Bell, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type Notification = Database['public']['Tables']['notifications']['Row'] & {
  site_name?: string | null
}

export default function NotificationsPage() {
  const { user, loading } = useCurrentUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      try {
        // First get user's sites
        const { data: sites, error: sitesError } = await supabase
          .from('sites')
          .select('id')
          .eq('user_id', user.id)

        if (sitesError) throw sitesError

        const siteIds = sites?.map(site => site.id) || []

        if (siteIds.length === 0) {
          setNotifications([])
          return
        }

        // Get notifications for user's sites (no FK join)
        const { data: notifications, error } = await supabase
          .from('notifications')
          .select('*')
          .in('site_id', siteIds)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Fetch site names and compose
        const { data: siteRows } = await supabase
          .from('sites')
          .select('id, name')
          .in('id', siteIds)

        const nameById: Record<string, string> = {}
        for (const s of siteRows || []) {
          nameById[s.id] = s.name || 'Unknown Site'
        }

        const enriched = (notifications || []).map(n => ({
          ...n,
          site_name: nameById[n.site_id] || 'Unknown Site'
        }))

        setNotifications(enriched)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoadingNotifications(false)
      }
    }

    fetchNotifications()
  }, [user])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Enviado'
      case 'failed':
        return 'Falló'
      case 'pending':
      default:
        return 'Pendiente'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  if (!user) {
    return <div className="flex items-center justify-center h-64">Error al cargar usuario</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-[#c0caf5] dark:via-[#7aa2f7] dark:to-[#bb9af7] bg-clip-text text-transparent">Notificaciones</h1>
          <p className="text-gray-600 dark:text-[#a9b1d6] mt-2">
            Historial de todas las notificaciones enviadas a tus suscriptores.
          </p>
        </div>
        <Link href="/dashboard/notifications/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Notificación
          </Button>
        </Link>
      </div>

      {loadingNotifications ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-[#a9b1d6]">Cargando notificaciones...</p>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No has enviado notificaciones</CardTitle>
            <CardDescription>
              Crea tu primera notificación para reconectar con los visitantes de tu sitio.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/dashboard/notifications/new">
              <Button>
                <Bell className="mr-2 h-4 w-4" />
                Enviar Mi Primera Notificación
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className="border-0 bg-white/80 dark:bg-[#24283b]/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-[#414868]/30">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(notification.status)}
                      {notification.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {notification.message}
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-[#9aa5ce]">
                      <span>Sitio: {notification.site_name || 'Unknown Site'}</span>
                      <span>•</span>
                      <span>{formatDate(notification.created_at)}</span>
                      {notification.sent_at && (
                        <>
                          <span>•</span>
                          <span>Enviado: {formatDate(notification.sent_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      notification.status === 'sent' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700/50' 
                        : notification.status === 'failed'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700/50'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700/50'
                    }`}>
                      {getStatusText(notification.status)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-[#7aa2f7]">
                      {notification.sent_count}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-[#9aa5ce]">Enviados</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-[#9ece6a]">
                      {notification.delivered_count}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-[#9aa5ce]">Entregados</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-[#bb9af7]">
                      {notification.clicked_count}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-[#9aa5ce]">Clics</div>
                  </div>
                </div>

                {notification.url && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-[#414868]/20 rounded-md">
                    <p className="text-sm text-gray-600 dark:text-[#9aa5ce]">
                      <strong>URL de destino:</strong>{' '}
                      <a 
                        href={notification.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-[#7aa2f7] hover:underline"
                      >
                        {notification.url}
                      </a>
                    </p>
                  </div>
                )}

                {notification.status === 'failed' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      Esta notificación falló al enviarse. Verifica la configuración de tu sitio.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
