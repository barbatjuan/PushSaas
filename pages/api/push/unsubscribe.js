import { supabaseAdmin } from '../../../lib/supabase';

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

    // Nota: Se elimina compatibilidad legacy con 'subscribers' y decremento de 'sites.subscriber_count'

    return res.status(200).json({
      success: true,
      message: 'Subscription deactivated successfully'
    });
  } catch (error) {
    console.error('Error in unsubscribe:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
