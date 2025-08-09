import { supabaseAdmin } from '../../lib/db';
import webpush from 'web-push';



export default async function handler(req, res) {
  // Endpoint público para desarrollo y producción
  // Acepta:
  // - userId: UUID interno de la tabla users.id
  // - clerkId: identificador de Clerk (users.clerk_id)
  // También tolera que "userId" traiga el clerkId por compatibilidad
  // Nota: en POST también aceptaremos en el body
  const { userId: qUserId, clerkId: qClerkId } = req.query;
  const { userId: bUserId, clerkId: bClerkId } = (req.method === 'POST' ? (req.body || {}) : {});
  const userId = qUserId || bUserId;
  const clerkId = qClerkId || bClerkId;

  if (!userId && !clerkId) {
    return res.status(400).json({ error: 'userId (UUID) o clerkId son requeridos' });
  }

  // Resolver el UUID interno del usuario a partir de userId o clerkId
  async function resolveUserUUID() {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const raw = userId || clerkId;

    // Si parece un UUID, úsalo directamente
    if (raw && uuidRegex.test(raw)) {
      return raw;
    }

    // Si viene clerkId explícito o el "userId" no es UUID, intentar buscar por clerk_id
    const clerkLookup = clerkId || raw;
    if (!clerkLookup) return null;

    const { data: userRow, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkLookup)
      .single();

    if (userErr || !userRow) return null;
    return userRow.id;
  }

  const userUUID = await resolveUserUUID();
  if (!userUUID) {
    return res.status(404).json({ error: 'Usuario no encontrado para el identificador proporcionado' });
  }

  if (req.method === 'GET') {
    // Listar sitios
    try {
      const { data, error } = await supabaseAdmin
        .from('sites')
        .select('*')
        .eq('user_id', userUUID);
      if (error) throw error;
      return res.status(200).json(data || []);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching sites' });
    }
  } else if (req.method === 'POST') {
    // Tolerar claves alternativas desde el frontend
    const siteName = req.body.siteName || req.body.name;
    const siteUrl = req.body.siteUrl || req.body.url;
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
          user_id: userUUID,
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
