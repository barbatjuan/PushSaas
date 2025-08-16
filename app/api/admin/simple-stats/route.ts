import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/server-auth'
import { supabaseAdmin } from '@/lib/supabase'

// Esta ruta debe ser dinámica porque usa headers()
export const dynamic = 'force-dynamic'

// Deshabilitar la caché para esta ruta
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

    // 2) Fallback: allow with ADMIN_PASSWORD if provided and matches
    if (!isAdmin) {
      const adminPassword = request.headers.get('x-admin-password') || 
                           new URL(request.url).searchParams.get('admin_password')
      if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    // Get simple counts from each table
    console.log('📊 Fetching admin stats...')

    // 1. Count users
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      console.error('❌ Error counting users:', usersError)
    }

    // 2. Count sites
    const { count: totalSites, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select('*', { count: 'exact', head: true })

    if (sitesError) {
      console.error('❌ Error counting sites:', sitesError)
    }

    // 3. Count subscribers (migrated to push_subscriptions)
    const { count: totalSubscribers, error: subscribersError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (subscribersError) {
      console.error('❌ Error counting push_subscriptions:', subscribersError)
    }

    // 4. Count notifications
    const { count: totalNotifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })

    if (notificationsError) {
      console.error('❌ Error counting notifications:', notificationsError)
    }

    // 5. Get recent users (last 10)
    const { data: recentUsers, error: recentUsersError } = await supabaseAdmin
      .from('users')
      .select('email, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentUsersError) {
      console.error('❌ Error fetching recent users:', recentUsersError)
    }

    // 6. Get recent sites (last 10)
    const { data: recentSitesRaw, error: recentSitesError } = await supabaseAdmin
      .from('sites')
      .select('id, name, url, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentSitesError) {
      console.error('❌ Error fetching recent sites:', recentSitesError)
    }

    // 6b. Compute active subscribers per recent site from push_subscriptions
    let recentSites: Array<{ name: string; url: string; subscriber_count: number; created_at: string }> = []
    if (recentSitesRaw && recentSitesRaw.length > 0) {
      // Count per site sequentially (max 10)
      for (const site of recentSitesRaw) {
        let count = 0
        try {
          const { count: c, error } = await supabaseAdmin
            .from('push_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', site.id)
            .eq('is_active', true)
          if (error) {
            console.error('❌ Error counting push_subscriptions for site', site.id, error)
          } else {
            count = c || 0
          }
        } catch (e) {
          console.error('❌ Exception counting push_subscriptions for site', site.id, e)
        }
        recentSites.push({
          name: site.name,
          url: site.url,
          subscriber_count: count,
          created_at: site.created_at,
        })
      }
    }

    // Compile stats
    const stats = {
      totalUsers: totalUsers || 0,
      totalSites: totalSites || 0,
      totalSubscribers: totalSubscribers || 0,
      totalNotifications: totalNotifications || 0,
      recentUsers: recentUsers || [],
      recentSites: recentSites || [],
      lastUpdated: new Date().toISOString()
    }

    console.log('✅ Admin stats compiled:', {
      users: stats.totalUsers,
      sites: stats.totalSites,
      subscribers: stats.totalSubscribers,
      notifications: stats.totalNotifications
    })

    return NextResponse.json(stats)

  } catch (error) {
    console.error('❌ Error in simple-stats API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' }, 
      { status: 500 }
    )
  }
}
