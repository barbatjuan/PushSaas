import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin password from headers or query params
    const adminPassword = request.headers.get('x-admin-password') || 
                         new URL(request.url).searchParams.get('admin_password')
    
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get current date for time-based queries
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // 1. USER STATISTICS
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, plan, created_at')

    if (usersError) throw usersError

    const userStats = {
      total: allUsers.length,
      free: allUsers.filter(u => u.plan === 'free').length,
      paid: allUsers.filter(u => u.plan === 'paid').length,
      newThisMonth: allUsers.filter(u => 
        new Date(u.created_at) >= startOfMonth
      ).length
    }

    // 2. SITE STATISTICS
    const { data: allSites, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select('id, user_id, name, url, status, subscriber_count, created_at')

    if (sitesError) throw sitesError

    const siteStats = {
      total: allSites.length,
      active: allSites.filter(s => s.status === 'active').length,
      suspended: allSites.filter(s => s.status === 'suspended').length,
      avgPerUser: userStats.total > 0 ? allSites.length / userStats.total : 0
    }

    // 3. SUBSCRIBER STATISTICS
    const { data: allSubscribers, error: subscribersError } = await supabaseAdmin
      .from('subscribers')
      .select('id, site_id, subscribed_at, last_seen, is_active')

    if (subscribersError) throw subscribersError

    const activeSubscribers = allSubscribers.filter(s => s.is_active)
    const subscribersActiveToday = activeSubscribers.filter(s => 
      s.last_seen && new Date(s.last_seen) >= startOfToday
    ).length

    // Calculate growth (comparing this month vs last month)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const subscribersThisMonth = activeSubscribers.filter(s => 
      new Date(s.subscribed_at) >= startOfMonth
    ).length
    const subscribersLastMonth = activeSubscribers.filter(s => {
      const subDate = new Date(s.subscribed_at)
      return subDate >= lastMonth && subDate < startOfMonth
    }).length

    const growth = subscribersLastMonth > 0 
      ? ((subscribersThisMonth - subscribersLastMonth) / subscribersLastMonth) * 100 
      : 0

    // Top sites by subscriber count
    const sitesWithSubscribers = allSites
      .map(site => ({
        name: site.name,
        url: site.url,
        count: site.subscriber_count || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const subscriberStats = {
      total: activeSubscribers.length,
      activeToday: subscribersActiveToday,
      growth: Math.round(growth * 10) / 10, // Round to 1 decimal
      topSites: sitesWithSubscribers
    }

    // 4. NOTIFICATION STATISTICS
    const { data: allNotifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select(`
        id, 
        title, 
        sent_count, 
        delivered_count, 
        clicked_count, 
        created_at,
        sites!inner(name)
      `)
      .order('created_at', { ascending: false })

    if (notificationsError) throw notificationsError

    const totalSent = allNotifications.reduce((sum, n) => sum + (n.sent_count || 0), 0)
    const totalDelivered = allNotifications.reduce((sum, n) => sum + (n.delivered_count || 0), 0)
    const totalClicked = allNotifications.reduce((sum, n) => sum + (n.clicked_count || 0), 0)

    const sentToday = allNotifications
      .filter(n => new Date(n.created_at) >= startOfToday)
      .reduce((sum, n) => sum + (n.sent_count || 0), 0)

    const sentThisMonth = allNotifications
      .filter(n => new Date(n.created_at) >= startOfMonth)
      .reduce((sum, n) => sum + (n.sent_count || 0), 0)

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
    const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0

    // Recent notification activity
    const recentActivity = allNotifications
      .slice(0, 10)
      .map(n => ({
        id: n.id,
        title: n.title,
        siteName: n.sites?.[0]?.name || 'Unknown Site',
        sentCount: n.sent_count || 0,
        clickedCount: n.clicked_count || 0,
        createdAt: n.created_at
      }))

    const notificationStats = {
      totalSent,
      deliveryRate: Math.round(deliveryRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      sentToday,
      sentThisMonth,
      recentActivity
    }

    // 5. COMPILE ALL STATS
    const dashboardStats = {
      users: userStats,
      sites: siteStats,
      subscribers: subscriberStats,
      notifications: notificationStats,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(dashboardStats)

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' }, 
      { status: 500 }
    )
  }
}

// Additional endpoint for real-time metrics
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('clerk_id', user.id)
      .single()

    if (userError || !dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { metric, timeframe } = await request.json()

    // Handle specific metric requests
    switch (metric) {
      case 'live_subscribers':
        const { count: liveCount } = await supabaseAdmin
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes

        return NextResponse.json({ count: liveCount || 0 })

      case 'notifications_today':
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const { data: todayNotifications } = await supabaseAdmin
          .from('notifications')
          .select('sent_count')
          .gte('created_at', today.toISOString())

        const todayTotal = todayNotifications?.reduce((sum, n) => sum + (n.sent_count || 0), 0) || 0
        return NextResponse.json({ count: todayTotal })

      case 'revenue_estimate':
        const { data: paidUsers } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('plan', 'paid')

        // Assuming $10/month per paid user (adjust as needed)
        const monthlyRevenue = (paidUsers?.length || 0) * 10
        return NextResponse.json({ monthly: monthlyRevenue, annual: monthlyRevenue * 12 })

      default:
        return NextResponse.json({ error: 'Unknown metric' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error fetching real-time metric:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metric' }, 
      { status: 500 }
    )
  }
}
