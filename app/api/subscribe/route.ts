import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  console.log('🔧 OPTIONS request received at /api/subscribe');
  console.log('📍 Request URL:', request.url);
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  console.log('🚀 Recibiendo suscripción en backend - POST /api/subscribe');
  console.log('📍 Request URL:', request.url);
  console.log('🌐 Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.json();
    console.log('📦 Request body:', body);
    const { siteId, subscription, userAgent, timestamp } = body;

    // Validate required fields
    if (!siteId || !subscription) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId and subscription' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate subscription object structure
    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if site exists and get its UUID
    console.log('🔍 Checking if site exists:', siteId);
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, site_id')
      .eq('site_id', siteId)
      .single();

    console.log('📊 Site query result:', { site, siteError });
    
    if (siteError || !site) {
      console.log('❌ Site not found in database:', siteId);
      console.log('❌ Site error details:', siteError);
      return NextResponse.json(
        { error: 'Site not found', siteId: siteId, details: siteError?.message },
        { status: 404, headers: corsHeaders }
      );
    }
    
    console.log('✅ Site found:', site);
    const siteUUID = site.id; // Use the actual UUID from the sites table
    console.log('🎯 Using site UUID:', siteUUID);

    // Create a unique identifier for this subscription
    const subscriptionHash = Buffer.from(subscription.endpoint).toString('base64').slice(0, 32);

    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('site_id', siteUUID)
      .eq('subscription_hash', subscriptionHash)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({
          subscription_data: subscription,
          user_agent: userAgent,
          last_seen: new Date().toISOString(),
          is_active: true
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('❌ Failed to update subscription:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription updated successfully',
        subscriptionId: existingSubscription.id
      }, { headers: corsHeaders });
    } else {
      // Create new subscription
      const { data: newSubscription, error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          site_id: siteUUID,
          subscription_hash: subscriptionHash,
          subscription_data: subscription,
          user_agent: userAgent,
          created_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          is_active: true
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Failed to create subscription:', insertError);
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription created successfully',
        subscriptionId: newSubscription.id
      }, { headers: corsHeaders });
    }

  } catch (error) {
    console.error('❌ Subscribe endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, endpoint } = body;

    if (!siteId || !endpoint) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId and endpoint' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create subscription hash from endpoint
    const subscriptionHash = Buffer.from(endpoint).toString('base64').slice(0, 32);

    // Deactivate subscription (soft delete)
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('site_id', siteId)
      .eq('subscription_hash', subscriptionHash);

    if (error) {
      console.error('❌ Failed to unsubscribe:', error);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Unsubscribe endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
