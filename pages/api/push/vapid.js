import { supabaseAdmin } from '../../../lib/db';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { siteId } = req.query;
    if (!siteId || typeof siteId !== 'string') {
      return res.status(400).json({ error: 'siteId is required' });
    }

    // Buscar el sitio por site_id (texto)
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('id, status')
      .eq('site_id', siteId)
      .eq('status', 'active')
      .single();

    if (siteError || !site) {
      return res.status(404).json({ error: 'Site not found or inactive' });
    }

    // Obtener la VAPID para el UUID del sitio
    const { data: vapid, error: vapidError } = await supabaseAdmin
      .from('vapid_keys')
      .select('public_key')
      .eq('site_id', site.id)
      .single();

    if (vapidError || !vapid?.public_key) {
      return res.status(404).json({ error: 'VAPID public key not found for this site' });
    }

    return res.status(200).json({ publicKey: vapid.public_key });
  } catch (e) {
    console.error('Error fetching VAPID key:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
