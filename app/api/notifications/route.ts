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

    // Send notification via OneSignal
    try {
      const onesignalPayload = {
        app_id: site.onesignal_app_id,
        headings: { en: title.trim() },
        contents: { en: message.trim() },
        included_segments: ['All'],
        ...(url && { url: url.trim() })
      }

      const onesignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify(onesignalPayload)
      })

      const onesignalResult = await onesignalResponse.json()

      if (onesignalResponse.ok) {
        // Update notification with success status
        const { error: updateError } = await supabaseAdmin
          .from('notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            sent_count: onesignalResult.recipients || subscriberCount,
            onesignal_notification_id: onesignalResult.id
          })
          .eq('id', notification.id)

        if (updateError) {
          console.error('Error updating notification status:', updateError)
        }

        return NextResponse.json({
          message: 'Notification sent successfully',
          notification: {
            ...notification,
            status: 'sent',
            sent_count: onesignalResult.recipients || subscriberCount,
            onesignal_notification_id: onesignalResult.id
          }
        }, { status: 201 })
      } else {
        console.error('OneSignal API error:', onesignalResult)
        
        // Update notification with failed status
        await supabaseAdmin
          .from('notifications')
          .update({
            status: 'failed'
          })
          .eq('id', notification.id)

        return NextResponse.json({ 
          error: `Failed to send notification: ${onesignalResult.errors?.[0] || 'Unknown OneSignal error'}` 
        }, { status: 500 })
      }
    } catch (onesignalError) {
      console.error('OneSignal request error:', onesignalError)
      
      // Update notification with failed status
      await supabaseAdmin
        .from('notifications')
        .update({
          status: 'failed'
        })
        .eq('id', notification.id)

      return NextResponse.json({ error: 'Failed to send notification via OneSignal' }, { status: 500 })
    }
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
