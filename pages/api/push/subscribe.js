import { supabaseAdmin } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { siteId, subscription, userAgent } = req.body;

    if (!siteId || !subscription) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verificar que el sitio existe y está activo
    const { data: siteData, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('id, status, subscriber_count')
      .eq('site_id', siteId)
      .eq('status', 'active')
      .single();

    if (siteError || !siteData) {
      console.error('Error al buscar sitio:', siteError);
      return res.status(404).json({ error: 'Site not found or inactive' });
    }

    // Verificar límite de suscriptores para plan gratuito usando conteo real desde push_subscriptions
    const { data: activeCountResp, error: countErr } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteData.id)
      .eq('is_active', true);
    const activeCount = activeCountResp?.length ? activeCountResp.length : (activeCountResp === null ? 0 : 0);
    if (countErr) {
      console.warn('No se pudo obtener el conteo real de suscriptores. Continuando sin límite.', countErr);
    }
    if (!countErr && activeCount >= 20) {
      return res.status(403).json({ 
        error: 'Subscriber limit reached (20). Please upgrade to premium.' 
      });
    }

    // Crear hash único del endpoint para evitar duplicados
    // Hash de 32 caracteres (hex) para cumplir con varchar(32)
    const subscriptionHash = crypto
      .createHash('sha256')
      .update(subscription.endpoint)
      .digest('hex')
      .slice(0, 32);

    // Verificar si ya existe esta suscripción
    const { data: existingSub } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id')
      .eq('subscription_hash', subscriptionHash)
      .eq('site_id', siteData.id)
      .single();

    if (existingSub) {
      // Actualizar fecha de última actividad
      await supabaseAdmin
        .from('push_subscriptions')
        .update({ 
          last_seen: new Date().toISOString(),
          is_active: true
        })
        .eq('id', existingSub.id);

      return res.status(200).json({ 
        success: true, 
        message: 'Subscription already exists and was updated' 
      });
    }

    // Crear nueva suscripción
    const { data: newSub, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .insert({
        id: uuidv4(),
        site_id: siteData.id,
        subscription_hash: subscriptionHash,
        subscription_data: subscription,
        user_agent: userAgent || req.headers['user-agent'],
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        is_active: true
      });

    if (subError) {
      console.error('Error al crear suscripción:', subError);
      throw subError;
    }

    // Nota: Se elimina actualización de sites.subscriber_count y escritura en tabla legacy 'subscribers'

    return res.status(201).json({ 
      success: true, 
      message: 'Subscription created successfully' 
    });

  } catch (error) {
    console.error('Error in push subscription:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
