import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { site_id, title, message, url } = await request.json()

    if (!site_id || !title || !message) {
      return NextResponse.json({ error: 'Site ID, title, and message are required' }, { status: 400 })
    }

    // Get user from database
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', user.id)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get site and verify ownership
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('id', site_id)
      .eq('user_id', dbUser.id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found or access denied' }, { status: 404 })
    }

    if (site.status !== 'active') {
      return NextResponse.json({ error: 'Site is not active' }, { status: 400 })
    }

    if (!site.onesignal_app_id) {
      return NextResponse.json({ error: 'OneSignal not configured for this site' }, { status: 400 })
    }

    // Check if site has subscribers
    const { count: subscriberCount, error: countError } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', site.site_id)
      .eq('is_active', true)

    if (countError) {
      console.error('Error counting subscribers:', countError)
      return NextResponse.json({ error: 'Error checking subscribers' }, { status: 500 })
    }

    if (!subscriberCount || subscriberCount === 0) {
      return NextResponse.json({ error: 'No active subscribers found for this site' }, { status: 400 })
    }

    // Create notification record
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        site_id: site.id,
        title: title.trim(),
        message: message.trim(),
        url: url?.trim() || null,
        sent_count: 0,
        delivered_count: 0,
        clicked_count: 0,
        status: 'pending'
      })
      .select()
      .single()

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      return NextResponse.json({ error: 'Error creating notification' }, { status: 500 })
    }

    // Get all active push subscriptions for this site
    const { data: pushSubscriptions, error: subscriptionsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription_data')
      .eq('site_id', site.id)
      .eq('is_active', true)

    if (subscriptionsError) {
      console.error('Error fetching push subscriptions:', subscriptionsError)
      return NextResponse.json({ error: 'Error fetching subscriptions' }, { status: 500 })
    }

    if (!pushSubscriptions || pushSubscriptions.length === 0) {
      return NextResponse.json({ error: 'No active push subscriptions found' }, { status: 400 })
    }

    // Send notifications using native web-push
    const webpush = await import('web-push')
    
    // Configure VAPID keys
    webpush.default.setVapidDetails(
      'mailto:support@pushsaas.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const payload = JSON.stringify({
      title: title.trim(),
      body: message.trim(),
      url: url?.trim() || site.url,
      icon: site.logo_url || '/icon-192.png',
      badge: '/badge-72.png'
    })

    let sentCount = 0
    let failedCount = 0

    // Send to all subscriptions
    const sendPromises = pushSubscriptions.map(async (sub) => {
      try {
        await webpush.default.sendNotification(sub.subscription_data, payload)
        sentCount++
      } catch (error) {
        console.error('Failed to send to subscription:', error)
        failedCount++
      }
    })

    await Promise.all(sendPromises)

    // Update notification with results
    const { error: updateError } = await supabaseAdmin
      .from('notifications')
      .update({
        status: sentCount > 0 ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        delivered_count: sentCount // Assume delivered = sent for native push
      })
      .eq('id', notification.id)

    if (updateError) {
      console.error('Error updating notification status:', updateError)
    }

    return NextResponse.json({ 
      success: true, 
      notification_id: notification.id,
      sent_count: sentCount,
      failed_count: failedCount,
      total_subscriptions: pushSubscriptions.length
    })
  } catch (error) {
    console.error('Error in notifications API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', user.id)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's sites
    const { data: sites, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select('id')
      .eq('user_id', dbUser.id)

    if (sitesError) {
      console.error('Error fetching sites:', sitesError)
      return NextResponse.json({ error: 'Error fetching sites' }, { status: 500 })
    }

    const siteIds = sites?.map(site => site.id) || []

    if (siteIds.length === 0) {
      return NextResponse.json([])
    }

    // Get notifications for user's sites
    const { data: notifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select(`
        *,
        sites!inner(name)
      `)
      .in('site_id', siteIds)
      .order('created_at', { ascending: false })

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
      return NextResponse.json({ error: 'Error fetching notifications' }, { status: 500 })
    }

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error in notifications GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
