import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, endpoint, subscription, reactivate } = body || {};

    if (!siteId || (!endpoint && !subscription)) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId and endpoint|subscription' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Resolve site UUID from human-readable siteId
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, site_id')
      .eq('site_id', siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found', details: siteError?.message },
        { status: 404, headers: corsHeaders }
      );
    }

    // Compute subscription hash from endpoint or subscription object
    const ep = endpoint || subscription?.endpoint;
    if (!ep) {
      return NextResponse.json(
        { error: 'Missing endpoint in request' },
        { status: 400, headers: corsHeaders }
      );
    }
    const subscriptionHash = Buffer.from(ep).toString('base64').slice(0, 32);

    // Update last_seen; optionally reactivate
    const update: any = { last_seen: new Date().toISOString() };
    if (reactivate === true) {
      update.is_active = true;
    }

    const { error: updateError } = await supabase
      .from('push_subscriptions')
      .update(update)
      .eq('site_id', site.id)
      .eq('subscription_hash', subscriptionHash);

    if (updateError) {
      console.error('❌ Heartbeat update failed:', {
        site_id: site.id,
        subscription_hash: subscriptionHash,
        error: updateError,
      });
      return NextResponse.json(
        { error: 'Failed to update heartbeat' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('❌ Heartbeat endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
