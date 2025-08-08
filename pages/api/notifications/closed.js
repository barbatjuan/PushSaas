import { supabaseAdmin } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { notificationId, siteId, timestamp } = req.body;

    if (!notificationId) {
      return res.status(400).json({ error: 'notificationId is required' });
    }

    // Registrar el cierre de la notificación
    const { error } = await supabaseAdmin
      .from('notification_events')
      .insert({
        notification_id: notificationId,
        site_id: siteId,
        event_type: 'closed',
        timestamp: timestamp || new Date().toISOString()
      });

    if (error) {
      console.error('Error registering notification close:', error);
      return res.status(500).json({ error: 'Failed to register close event' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in notifications/closed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
