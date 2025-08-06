import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, subscription, userAgent, timestamp } = body;

    // Validate required fields
    if (!siteId || !subscription) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId and subscription' },
        { status: 400 }
      );
    }

    // Validate subscription object structure
    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription format' },
        { status: 400 }
      );
    }

    // Check if site exists
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Create a unique identifier for this subscription
    const subscriptionHash = Buffer.from(subscription.endpoint).toString('base64').slice(0, 32);

    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('site_id', siteId)
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
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription updated successfully',
        subscriptionId: existingSubscription.id
      });
    } else {
      // Create new subscription
      const { data: newSubscription, error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          site_id: siteId,
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
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription created successfully',
        subscriptionId: newSubscription.id
      });
    }

  } catch (error) {
    console.error('❌ Subscribe endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
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
        { status: 400 }
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
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully'
    });

  } catch (error) {
    console.error('❌ Unsubscribe endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
