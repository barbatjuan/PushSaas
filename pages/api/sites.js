import { supabaseAdmin } from '../../lib/db';
import webpush from 'web-push';



export default async function handler(req, res) {
  // Endpoint público para desarrollo y producción
  const userId = 'dev-user'; // Simplificado para funcionar en producción

  if (req.method === 'GET') {
    // Listar sitios
    try {
      const { data, error } = await supabaseAdmin
        .from('sites')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return res.status(200).json(data || []);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching sites' });
    }
  } else if (req.method === 'POST') {
    const { siteName, siteUrl } = req.body;
    if (!siteName || !siteUrl) {
      return res.status(400).json({ error: 'siteName and siteUrl are required' });
    }
    try {
      const site_id = Math.random().toString(36).substring(2, 14);
      const { data: newSite, error } = await supabaseAdmin
        .from('sites')
        .insert({
          site_id,
          name: siteName,
          url: normalizeSiteUrl(siteUrl),

          status: 'active',
          subscriber_count: 0,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      if (error) throw error;

      // Generar e insertar claves VAPID para el nuevo sitio
      const { publicKey, privateKey } = webpush.generateVAPIDKeys();
      await supabaseAdmin.from('vapid_keys').insert({
        site_id: newSite.id,
        public_key: publicKey,
        private_key: privateKey
      });

      return res.status(201).json({ success: true, site_id, vapidPublicKey: publicKey });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error creating site' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function normalizeSiteUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url.replace(/\/$/, '');
}
