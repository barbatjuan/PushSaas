import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/server-auth'
import { supabaseAdmin } from '@/lib/supabase'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1) Prefer DB role check using Supabase user
    let isAdmin = false
    try {
      const { data: dbUser, error } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('supabase_user_id', user.id)
        .single()
      if (!error && dbUser?.role === 'admin') {
        isAdmin = true
      }
    } catch (e) {
      console.error('Error checking admin role from DB:', e)
    }

    // Require admin via Supabase/DB only (no legacy password fallback)
    if (!isAdmin) {
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

    // 3. SUBSCRIBER STATISTICS (migrated to push_subscriptions)
    const { data: allPushSubs, error: pushSubsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, site_id, created_at, last_seen, is_active')

    if (pushSubsError) throw pushSubsError

    const activePushSubs = (allPushSubs || []).filter(s => s.is_active)
    const subscribersActiveToday = activePushSubs.filter(s => 
      s.last_seen && new Date(s.last_seen as any) >= startOfToday
    ).length

    // Calculate growth (this month vs last month) based on created_at
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const subscribersThisMonth = activePushSubs.filter(s => 
      new Date(s.created_at as any) >= startOfMonth
    ).length
    const subscribersLastMonth = activePushSubs.filter(s => {
      const subDate = new Date(s.created_at as any)
      return subDate >= lastMonth && subDate < startOfMonth
    }).length

    const growth = subscribersLastMonth > 0 
      ? ((subscribersThisMonth - subscribersLastMonth) / subscribersLastMonth) * 100 
      : 0

    // Top sites by active push subscriptions
    const countsBySite: Record<string, number> = {}
    for (const s of activePushSubs) {
      countsBySite[s.site_id as unknown as string] = (countsBySite[s.site_id as unknown as string] || 0) + 1
    }
    const sitesWithSubscribers = allSites
      .map(site => ({
        name: site.name,
        url: site.url,
        count: countsBySite[site.id] || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const subscriberStats = {
      total: activePushSubs.length,
      activeToday: subscribersActiveToday,
      growth: Math.round(growth * 10) / 10, // Round to 1 decimal
      topSites: sitesWithSubscribers
    }

    // 4. NOTIFICATION STATISTICS (no FK joins)
    const { data: allNotifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select('id, title, sent_count, delivered_count, clicked_count, created_at, site_id')
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
    // Map site_id -> site name from allSites
    const siteNameById: Record<string, string> = {}
    for (const s of allSites) {
      siteNameById[s.id] = s.name || 'Unknown Site'
    }

    const recentActivity = allNotifications
      .slice(0, 10)
      .map(n => ({
        id: n.id,
        title: n.title,
        siteName: siteNameById[n.site_id] || 'Unknown Site',
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
      .eq('supabase_user_id', user.id)
      .single()

    if (userError || !dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { metric, timeframe } = await request.json()

    // Handle specific metric requests
    switch (metric) {
      case 'live_subscribers':
        // Migrado a push_subscriptions: usuarios activos vistos en los últimos 5 minutos
        const { count: liveCount } = await supabaseAdmin
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString())

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
