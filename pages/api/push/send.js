import { supabaseAdmin } from '../../../lib/db';
import webpush from 'web-push';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Usamos 'message' en BD, pero mantenemos 'body' en payload de notificación
    const { siteId, title, message: msg, body, icon, url, data } = req.body;
    const message = msg || body || '';

    if (!siteId || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verificar que el sitio existe
    const { data: siteData, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('id, user_id')
      .eq('site_id', siteId)
      .eq('status', 'active')
      .single();

    if (siteError || !siteData) {
      return res.status(404).json({ error: 'Site not found or inactive' });
    }

    // Obtener claves VAPID del sitio usando el UUID del sitio
    console.log('🔍 Buscando claves VAPID para site UUID:', siteData.id);
    const { data: vapidRow, error: vapidError } = await supabaseAdmin
      .from('vapid_keys')
      .select('public_key, private_key')
      .eq('site_id', siteData.id)
      .single();

    console.log('🔑 VAPID query result:', { vapidRow, vapidError });
    
    const publicKey = vapidRow?.public_key || process.env.VAPID_PUBLIC_KEY;
    const privateKey = vapidRow?.private_key || process.env.VAPID_PRIVATE_KEY;
    
    console.log('🔐 Using VAPID keys:');
    console.log('   Public (first 20 chars):', publicKey?.substring(0, 20) + '...');
    console.log('   Private (first 20 chars):', privateKey?.substring(0, 20) + '...');
    console.log('   Source:', vapidRow ? 'Supabase' : 'Environment');

    // Configurar webpush con la pareja adecuada antes de enviar
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || `mailto:contact@${process.env.NEXT_PUBLIC_APP_URL || 'example.com'}`,
      publicKey,
      privateKey
    );
    
    console.log('✅ WebPush configured with VAPID details');

    // Registrar la notificación en la BD
    const notificationId = uuidv4();
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        id: notificationId,
        site_id: siteData.id,
        title,
        message,
        url,
        created_at: new Date().toISOString()
      });

    if (notifError) {
      console.error('Error al crear registro de notificación:', notifError);
      throw notifError;
    }

    // Obtener todas las suscripciones activas para este sitio
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, subscription_data')
      .eq('site_id', siteData.id)
      .eq('is_active', true);

    if (subError) {
      console.error('Error al obtener suscripciones:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ 
        error: 'No active subscriptions found for this site' 
      });
    }
    
    console.log(`📱 Found ${subscriptions.length} active subscriptions for site ${siteId}`);
    
    // Log subscription details to debug VAPID key mismatches
    subscriptions.forEach((sub, index) => {
      const subData = sub.subscription_data;
      const endpoint = subData.endpoint;
      const keys = subData.keys;
      console.log(`📱 Subscription ${index + 1}:`);
      console.log(`   Endpoint: ${endpoint.substring(0, 50)}...`);
      console.log(`   Keys p256dh: ${keys?.p256dh ? keys.p256dh.substring(0, 20) + '...' : 'MISSING'}`);
      console.log(`   Keys auth: ${keys?.auth ? keys.auth.substring(0, 20) + '...' : 'MISSING'}`);
    });

    // Preparar payload de la notificación
    const notificationPayload = {
      id: notificationId,
      title,
      message,
      icon: icon || '/icon-192.png',
      url: url || '/',
      data: {
        url: url || '/',
        notificationId,
        ...data
      },
      timestamp: Date.now()
    };

    // Enviar notificación a cada suscriptor
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const sub of subscriptions) {
      try {
        // Enviar directamente con webpush (ya configurado con claves correctas)
        await webpush.sendNotification(
          sub.subscription_data,
          JSON.stringify(notificationPayload)
        );
        
        // Éxito: registrar evento
        successCount++;
        results.push({
          subscriptionId: sub.id,
          success: true
        });
        
        await supabaseAdmin
          .from('events')
          .insert({
            id: uuidv4(),
            notification_id: notificationId,
            subscriber_id: sub.id,
            event_type: 'sent',
            created_at: new Date().toISOString()
          });
          
      } catch (error) {
        console.error(`Error sending to subscription ${sub.id}:`, error);
        failCount++;
        
        results.push({
          subscriptionId: sub.id,
          success: false
        });
        
        // Auto-cleanup: marcar suscripciones inválidas como inactivas
        const statusCode = error.statusCode;
        if (statusCode === 410 || statusCode === 403 || statusCode === 502 || statusCode === 401) {
          console.log(`🧹 Auto-cleaning invalid subscription (${statusCode}):`, sub.id);
          await supabaseAdmin
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', sub.id);
        }
        
        // Registrar evento fallido
        await supabaseAdmin
          .from('events')
          .insert({
            id: uuidv4(),
            notification_id: notificationId,
            subscriber_id: sub.id,
            event_type: 'failed',
            metadata: { error: error.message, statusCode }
          });
      }
    }

    // Actualizar estadísticas de la notificación
    await supabaseAdmin
      .from('notifications')
      .update({ 
        sent_count: successCount,
        delivered_count: successCount
      })
      .eq('id', notificationId);

    return res.status(200).json({
      success: true,
      total: subscriptions.length,
      successful: successCount,
      failed: failCount,
      notificationId
    });

  } catch (error) {
    console.error('Error sending push notifications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
