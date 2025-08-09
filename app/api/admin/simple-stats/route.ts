import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
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

    // Check admin password
    const adminPassword = request.headers.get('x-admin-password') || 
                         new URL(request.url).searchParams.get('admin_password')
    
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
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

    // 3. Count subscribers
    const { count: totalSubscribers, error: subscribersError } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (subscribersError) {
      console.error('❌ Error counting subscribers:', subscribersError)
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
    const { data: recentSites, error: recentSitesError } = await supabaseAdmin
      .from('sites')
      .select('name, url, subscriber_count, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentSitesError) {
      console.error('❌ Error fetching recent sites:', recentSitesError)
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
