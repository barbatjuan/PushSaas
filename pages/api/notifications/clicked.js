import { supabaseAdmin } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { notificationId, action, timestamp } = req.body;
    
    if (!notificationId) {
      return res.status(400).json({ error: 'Missing notification ID' });
    }

    // Verificar que la notificación existe
    const { data: notification, error: notifError } = await supabaseAdmin
      .from('notifications')
      .select('id, clicked_count')
      .eq('id', notificationId)
      .single();

    if (notifError || !notification) {
      console.log('Notificación no encontrada:', notificationId);
      // No devolvemos error para evitar problemas en el SW
      return res.status(200).json({ success: false, error: 'Notification not found' });
    }

    // Actualizar contador de clics
    await supabaseAdmin
      .from('notifications')
      .update({ 
        clicked_count: (notification.clicked_count || 0) + 1,
      })
      .eq('id', notificationId);

    // Registrar evento de clic
    await supabaseAdmin
      .from('events')
      .insert({
        id: uuidv4(),
        notification_id: notificationId,
        subscriber_id: null, // No podemos identificar el suscriptor desde SW
        event_type: 'clicked',
        created_at: new Date(timestamp || Date.now()).toISOString(),
        metadata: { 
          action, 
          timestamp, 
          userAgent: req.headers['user-agent'],
          referer: req.headers['referer']
        }
      });

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error('Error registering notification click:', error);
    // No devolvemos error para evitar problemas en el SW
    return res.status(200).json({ success: false, error: 'Internal server error' });
  }
}
