'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Globe, 
  Bell, 
  TrendingUp, 
  Activity,
  UserCheck,
  MousePointer,
  Send,
  BarChart3,
  Calendar,
  RefreshCw
} from 'lucide-react'

interface DashboardStats {
  users: {
    total: number
    free: number
    paid: number
    newThisMonth: number
  }
  sites: {
    total: number
    active: number
    suspended: number
    avgPerUser: number
  }
  subscribers: {
    total: number
    activeToday: number
    growth: number
    topSites: Array<{
      name: string
      url: string
      count: number
    }>
  }
  notifications: {
    totalSent: number
    deliveryRate: number
    clickRate: number
    sentToday: number
    sentThisMonth: number
    recentActivity: Array<{
      id: string
      title: string
      siteName: string
      sentCount: number
      clickedCount: number
      createdAt: string
    }>
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      setError('')
      const response = await fetch(`/api/admin/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else if (response.status === 401 || response.status === 403) {
        setError('No autorizado: inicia sesión con una cuenta admin')
        setStats(null)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error loading dashboard</h2>
          <p className="text-gray-600 mb-4">{error || 'Unable to fetch dashboard statistics'}</p>
          <Button onClick={fetchStats}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PushSaaS Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor your SaaS performance and metrics</p>
          </div>
          <Button 
            onClick={fetchStats} 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.users.newThisMonth} this month
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{stats.users.free} Free</Badge>
                <Badge variant="default">{stats.users.paid} Paid</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Active Sites */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sites.active.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.sites.avgPerUser.toFixed(1)} avg per user
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="default">{stats.sites.active} Active</Badge>
                <Badge variant="destructive">{stats.sites.suspended} Suspended</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Total Subscribers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.subscribers.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.subscribers.growth > 0 ? '+' : ''}{stats.subscribers.growth}% growth
              </p>
              <div className="mt-2">
                <Badge variant="outline">{stats.subscribers.activeToday} active today</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Sent */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.notifications.totalSent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.notifications.sentToday} today
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="default">{stats.notifications.deliveryRate.toFixed(1)}% delivered</Badge>
                <Badge variant="secondary">{stats.notifications.clickRate.toFixed(1)}% CTR</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Sites by Subscribers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Sites by Subscribers
                  </CardTitle>
                  <CardDescription>Sites with the most active subscribers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.subscribers.topSites.map((site, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{site.name}</p>
                          <p className="text-sm text-gray-500">{site.url}</p>
                        </div>
                        <Badge variant="outline">{site.count.toLocaleString()}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Notification Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Notifications
                  </CardTitle>
                  <CardDescription>Latest notification campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.notifications.recentActivity.map((notification) => (
                      <div key={notification.id} className="border-b pb-3 last:border-b-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-gray-500">{notification.siteName}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{notification.sentCount} sent</p>
                            <p className="text-xs text-gray-500">
                              {notification.clickedCount} clicks
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Analytics</CardTitle>
                <CardDescription>Detailed user statistics and growth metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.users.total}</div>
                    <p className="text-gray-600">Total Users</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.users.paid}</div>
                    <p className="text-gray-600">Paid Users</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {((stats.users.paid / stats.users.total) * 100).toFixed(1)}%
                    </div>
                    <p className="text-gray-600">Conversion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sites Tab */}
          <TabsContent value="sites">
            <Card>
              <CardHeader>
                <CardTitle>Site Analytics</CardTitle>
                <CardDescription>Site performance and distribution metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.sites.total}</div>
                    <p className="text-gray-600">Total Sites</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.sites.active}</div>
                    <p className="text-gray-600">Active Sites</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {stats.sites.avgPerUser.toFixed(1)}
                    </div>
                    <p className="text-gray-600">Avg per User</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Analytics</CardTitle>
                <CardDescription>Performance metrics for push notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.notifications.totalSent.toLocaleString()}
                    </div>
                    <p className="text-gray-600">Total Sent</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {stats.notifications.deliveryRate.toFixed(1)}%
                    </div>
                    <p className="text-gray-600">Delivery Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {stats.notifications.clickRate.toFixed(1)}%
                    </div>
                    <p className="text-gray-600">Click Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {stats.notifications.sentThisMonth.toLocaleString()}
                    </div>
                    <p className="text-gray-600">This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
