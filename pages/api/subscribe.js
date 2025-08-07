import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Set CORS headers
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { siteId, subscription, userAgent, timestamp } = req.body;

      // Validate required fields
      if (!siteId || !subscription) {
        return res.status(400).json({
          error: 'Missing required fields: siteId and subscription'
        });
      }

      // Validate subscription object structure
      if (!subscription.endpoint || !subscription.keys) {
        return res.status(400).json({
          error: 'Invalid subscription format'
        });
      }

      // Check if site exists
      const { data: site, error: siteError } = await supabase
        .from('sites')
        .select('id')
        .eq('id', siteId)
        .single();

      if (siteError || !site) {
        return res.status(404).json({
          error: 'Site not found'
        });
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
          return res.status(500).json({
            error: 'Failed to update subscription'
          });
        }

        return res.status(200).json({
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
          return res.status(500).json({
            error: 'Failed to create subscription'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Subscription created successfully',
          subscriptionId: newSubscription.id
        });
      }

    } catch (error) {
      console.error('❌ Subscribe endpoint error:', error);
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { siteId, endpoint } = req.body;

      if (!siteId || !endpoint) {
        return res.status(400).json({
          error: 'Missing required fields: siteId and endpoint'
        });
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
        return res.status(500).json({
          error: 'Failed to unsubscribe'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Unsubscribed successfully'
      });

    } catch (error) {
      console.error('❌ Unsubscribe endpoint error:', error);
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' });
  }
}
