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
    const { notification_id, site_id } = await request.json();

    if (!notification_id && !site_id) {
      return NextResponse.json(
        { error: 'notification_id or site_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('📊 Registering notification click:', { notification_id, site_id });

    // If we have notification_id, update that specific notification
    if (notification_id) {
      // First get current count, then increment
      const { data: currentNotification, error: fetchError } = await supabaseAdmin
        .from('notifications')
        .select('clicked_count')
        .eq('id', notification_id)
        .single();

      if (fetchError) {
        console.error('Error fetching current notification:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch notification' },
          { status: 500, headers: corsHeaders }
        );
      }

      const newClickCount = (currentNotification.clicked_count || 0) + 1;

      const { error: updateError } = await supabaseAdmin
        .from('notifications')
        .update({
          clicked_count: newClickCount
        })
        .eq('id', notification_id);

      if (updateError) {
        console.error('Error updating notification click count:', updateError);
        return NextResponse.json(
          { error: 'Failed to register click' },
          { status: 500, headers: corsHeaders }
        );
      }
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
