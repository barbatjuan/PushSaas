import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { notification_id, site_id } = requestBody;

    console.log('📊 Full click request received:', requestBody);
    console.log('📊 Extracted values:', { notification_id, site_id });

    if (!notification_id && !site_id) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'notification_id or site_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('📊 Registering notification click:', { notification_id, site_id });

    // If we have notification_id, update that specific notification
    if (notification_id) {
      console.log('🔍 Looking for notification with ID:', notification_id);
      
      // First get current count, then increment
      const { data: currentNotification, error: fetchError } = await supabaseAdmin
        .from('notifications')
        .select('id, clicked_count, title')
        .eq('id', notification_id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching notification:', fetchError);
        console.log('🔍 Trying to find any notifications for debugging...');
        
        // Debug: List recent notifications
        const { data: recentNotifications } = await supabaseAdmin
          .from('notifications')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(5);
        
        console.log('📊 Recent notifications:', recentNotifications);
        
        return NextResponse.json(
          { error: 'Notification not found', notification_id, recent_notifications: recentNotifications },
          { status: 404, headers: corsHeaders }
        );
      }

      console.log('✅ Found notification:', currentNotification);
      const newClickCount = (currentNotification.clicked_count || 0) + 1;
      console.log('🔢 Updating click count from', currentNotification.clicked_count, 'to', newClickCount);

      const { error: updateError } = await supabaseAdmin
        .from('notifications')
        .update({
          clicked_count: newClickCount
        })
        .eq('id', notification_id);

      if (updateError) {
        console.error('❌ Error updating notification click count:', updateError);
        return NextResponse.json(
          { error: 'Failed to update click count', details: updateError },
          { status: 500, headers: corsHeaders }
        );
      }
      
      console.log('✅ Successfully updated click count to', newClickCount);
    }

    // If we have site_id, we can also track general site engagement
    // This is useful for notifications sent via the native system
    if (site_id) {
      console.log('📈 Tracking site engagement for:', site_id);
      // You could add additional tracking here if needed
    }

    return NextResponse.json(
      { success: true, message: 'Click registered successfully' },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ Click tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
