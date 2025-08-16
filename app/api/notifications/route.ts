import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/server-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getWebPush } from '@/lib/webpush'

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
      .eq('supabase_user_id', user.id)
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

    // OneSignal is no longer required; using native web-push

    // Check if site has active push subscriptions (migrated)
    const { count: subscriberCount, error: countError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', site.id)
      .eq('is_active', true)

    if (countError) {
      console.error('Error counting push_subscriptions:', countError)
      return NextResponse.json({ error: 'Error checking push subscriptions' }, { status: 500 })
    }

    if (!subscriberCount || subscriberCount === 0) {
      return NextResponse.json({ error: 'No active push subscriptions found for this site' }, { status: 400 })
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

    // Send notifications using native web-push via DB-managed VAPID keys
    const webpush = getWebPush()

    console.log('🖼️ Site data for notification:', {
      site_id: site.site_id,
      name: site.name,
      logo_url: site.logo_url,
      url: site.url
    });

    // Use processed logo with standard size and background
    const iconUrl = site.logo_url 
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://web-push-notifications-phi.vercel.app'}/api/logo?url=${encodeURIComponent(site.logo_url)}&size=192`
      : '/icon-192.png';
    console.log('🎨 Using processed icon URL:', iconUrl);

    const notificationData = {
      title: title.trim(),
      body: message.trim(),
      url: url?.trim() || site.url,
      icon: iconUrl,
      badge: '/badge-72.png',
      data: {
        siteId: site.site_id,
        id: notification.id,
        url: url?.trim() || site.url,
        timestamp: new Date().toISOString()
      }
    };

    const payload = JSON.stringify(notificationData);

    console.log('📦 Notification payload:', payload);

    let sentCount = 0
    let failedCount = 0

    // Send to all subscriptions
    const sendPromises = pushSubscriptions.map(async (sub) => {
      try {
        const r = await webpush.sendNotification(
          sub.subscription_data,
          payload
        )
        sentCount++
        console.log(`✅ Notification sent successfully`);
      } catch (error: any) {
        console.error(`❌ Failed to send notification:`, error);
        
        // Handle specific error codes
        if (error.statusCode === 410) {
          console.log('🗑️ Subscription expired/revoked, cleaning up from database');
          
          // Remove expired subscription from database
          try {
            const { error: deleteError } = await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('subscription_data', JSON.stringify(sub.subscription_data));
            
            if (deleteError) {
              console.error('❌ Failed to delete expired subscription:', deleteError);
            } else {
              console.log('✅ Expired subscription removed from database');
            }
          } catch (cleanupError) {
            console.error('❌ Error during subscription cleanup:', cleanupError);
          }
        } else if (error.statusCode === 413) {
          console.log('📦 Payload too large');
        } else if (error.statusCode === 429) {
          console.log('⏰ Rate limited');
        }
        
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
      .eq('supabase_user_id', user.id)
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

    // Get notifications for user's sites (no FK join)
    const { data: notifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select('*, site_id')
      .in('site_id', siteIds)
      .order('created_at', { ascending: false })

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
      return NextResponse.json({ error: 'Error fetching notifications' }, { status: 500 })
    }

    // Map site_id -> site name
    const { data: siteNames } = await supabaseAdmin
      .from('sites')
      .select('id, name')
      .in('id', siteIds)

    const nameById: Record<string, string> = {}
    for (const s of siteNames || []) {
      nameById[s.id] = s.name || 'Unknown Site'
    }

    const enriched = (notifications || []).map(n => ({
      ...n,
      sites: { name: nameById[n.site_id] || 'Unknown Site' }
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error in notifications GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
