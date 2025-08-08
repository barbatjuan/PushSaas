import { supabaseAdmin } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { siteId, endpoint } = req.body;

    if (!siteId || !endpoint) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verificar que el sitio existe
    const { data: siteData, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('id')
      .eq('site_id', siteId)
      .single();

    if (siteError || !siteData) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Desactivar en push_subscriptions
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('site_id', siteData.id)
      .filter('subscription_data->endpoint', 'eq', endpoint);

    if (updateError) {
      console.error('Error al desactivar suscripción:', updateError);
    }

    // Desactivar en subscribers (para compatibilidad)
    await supabaseAdmin
      .from('subscribers')
      .update({ is_active: false })
      .eq('site_id', siteId)
      .eq('token', endpoint);

    // Decrementar contador solo si se actualizó algún registro
    if (updateData && updateData.length > 0) {
      const { data: site } = await supabaseAdmin
        .from('sites')
        .select('subscriber_count')
        .eq('id', siteData.id)
        .single();

      if (site && site.subscriber_count > 0) {
        await supabaseAdmin
          .from('sites')
          .update({
            subscriber_count: site.subscriber_count - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', siteData.id);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription deactivated successfully'
    });
  } catch (error) {
    console.error('Error in unsubscribe:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
