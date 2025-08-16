import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/server-auth';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve internal DB user by Supabase user id
    const { data: dbUser, error: dbUserError } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_user_id', user.id)
      .single();
    if (dbUserError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { siteId, notification, targetAll = true, targetSubscriptions = [] } = body;

    // Validate required fields
    if (!siteId || !notification) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId and notification' },
        { status: 400 }
      );
    }

    // Validate notification structure
    if (!notification.title || !notification.body) {
      return NextResponse.json(
        { error: 'Notification must have title and body' },
        { status: 400 }
      );
    }

    // Resolve site by site_id (text) or id (UUID) and ensure ownership
    let { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, domain, user_id, site_id, status')
      .eq('site_id', siteId)
      .eq('user_id', dbUser.id)
      .eq('status', 'active')
      .single();
    if (siteError || !site) {
      const byUuid = await supabase
        .from('sites')
        .select('id, name, domain, user_id, site_id, status')
        .eq('id', siteId)
        .eq('user_id', dbUser.id)
        .eq('status', 'active')
        .single();
      site = byUuid.data as any;
      siteError = byUuid.error as any;
    }
    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found or access denied' }, { status: 404 });
    }

    // Configure webpush with per-site VAPID keys from Supabase (multi-tenant safe)
    const { data: vapidRow, error: vapidError } = await supabase
      .from('vapid_keys')
      .select('public_key, private_key')
      .eq('site_id', site.id)
      .single();
    if (vapidError || !vapidRow?.public_key || !vapidRow?.private_key) {
      return NextResponse.json({ error: 'VAPID keys not found for site' }, { status: 500 });
    }
    try {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || `mailto:contact@${process.env.NEXT_PUBLIC_APP_URL || 'example.com'}`,
        vapidRow.public_key,
        vapidRow.private_key
      );
    } catch (e: any) {
      console.error('❌ Failed to configure webpush:', e);
      return NextResponse.json({ error: 'Failed to configure webpush' }, { status: 500 });
    }

    // Get active subscriptions for the site
    let subscriptionsQuery = supabase
      .from('push_subscriptions')
      .select('id, subscription_data, subscription_hash')
      .eq('site_id', siteId)
      .eq('is_active', true);

    // If not targeting all, filter by specific subscriptions
    if (!targetAll && targetSubscriptions.length > 0) {
      subscriptionsQuery = subscriptionsQuery.in('id', targetSubscriptions);
    }

    const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery;

    if (subscriptionsError) {
      console.error('❌ Failed to fetch subscriptions:', subscriptionsError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions found',
        sent: 0,
        failed: 0
      });
    }

    // Prepare notification payload
    const notificationPayload: NotificationPayload = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/notifly/icon-192.png',
      badge: notification.badge || '/notifly/icon-192.png',
      url: notification.url || (site.domain?.startsWith('http') ? site.domain : `https://${site.domain || ''}`) || '/',
      actions: notification.actions || [
        {
          action: 'open',
          title: 'Abrir',
          icon: '/action-open.png'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/action-close.png'
        }
      ],
      data: {
        siteId: siteId,
        siteName: site.name,
        timestamp: Date.now(),
        ...(notification.data || {})
      }
    };

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            subscription.subscription_data,
            JSON.stringify(notificationPayload)
          );
          return { success: true, subscriptionId: subscription.id };
        } catch (error: any) {
          console.error(`❌ Failed to send to subscription ${subscription.id}:`, error);
          
          // Handle invalid/expired subscriptions (broadened)
          if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 403 || error.statusCode === 401 || error.statusCode === 502) {
            // Deactivate expired subscription
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', subscription.id);
          }
          
          return { 
            success: false, 
            subscriptionId: subscription.id, 
            error: error.message 
          };
        }
      })
    );

    // Count successful and failed sends
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = results.length - successful;

    // Log notification send
    await supabase
      .from('notification_logs')
      .insert({
        site_id: siteId,
        user_id: dbUser.id,
        notification_data: notificationPayload,
        total_sent: successful,
        total_failed: failed,
        sent_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${successful} subscribers`,
      sent: successful,
      failed: failed,
      total: subscriptions.length
    });

  } catch (error) {
    console.error('❌ Send notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve notification history
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve internal DB user by Supabase user id
    const { data: dbUser, error: dbUserError } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_user_id', user.id)
      .single();
    if (dbUserError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!siteId) {
      return NextResponse.json(
        { error: 'Missing siteId parameter' },
        { status: 400 }
      );
    }

    // Check if user owns the site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id')
      .eq('id', siteId)
      .eq('user_id', dbUser.id)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found or access denied' },
        { status: 404 }
      );
    }

    // Get notification history
    const { data: notifications, error: notificationsError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('site_id', siteId)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (notificationsError) {
      console.error('❌ Failed to fetch notification history:', notificationsError);
      return NextResponse.json(
        { error: 'Failed to fetch notification history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      total: notifications?.length || 0
    });

  } catch (error) {
    console.error('❌ Get notification history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
