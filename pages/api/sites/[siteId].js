import { supabaseAdmin } from '../../../lib/db';


export default async function handler(req, res) {

  const { siteId } = req.query;

  if (!siteId) {
    return res.status(400).json({ error: 'Se requiere ID del sitio' });
  }

  // Verificar propiedad del sitio
  try {
    const { data: site, error } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('site_id', siteId)
      .single();

    if (error || !site) {
      return res.status(404).json({ error: 'Sitio no encontrado o no tienes permisos' });
    }

    // Continuar con la operación solicitada
    if (req.method === 'GET') {
      // Incluir estadísticas adicionales del sitio
      const { count: notificationCount } = await supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', site.id);

      const { count: activeSubscribersCount } = await supabaseAdmin
        .from('push_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', site.id)
        .eq('is_active', true);

      // Obtener las claves VAPID usando el UUID del sitio
      const { data: vapidKeys } = await supabaseAdmin
        .from('vapid_keys')
        .select('public_key')
        .eq('site_id', site.id)
        .single();

      return res.status(200).json({
        ...site,
        stats: {
          notificationCount: notificationCount || 0,
          activeSubscribers: activeSubscribersCount || 0
        },
        vapidPublicKey: vapidKeys?.public_key || process.env.VAPID_PUBLIC_KEY || null
      });

    } 
    else if (req.method === 'PUT') {
      const { siteName, siteUrl, status, plan } = req.body;
      
      // Actualizar solo los campos proporcionados
      const updates = {};
      if (siteName) updates.site_name = siteName;
      if (siteUrl) updates.site_url = normalizeSiteUrl(siteUrl);
      if (status) updates.status = status;
      if (plan) updates.plan = plan;
      
      updates.updated_at = new Date().toISOString();

      const { data: updatedSite, error: updateError } = await supabaseAdmin
        .from('sites')
        .update(updates)
        .eq('id', site.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({ site: updatedSite });
    } 
    else if (req.method === 'DELETE') {
      // No eliminamos realmente, solo desactivamos
      const { data: deactivatedSite, error: deactivateError } = await supabaseAdmin
        .from('sites')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', site.id)
        .select()
        .single();

      if (deactivateError) throw deactivateError;

      // También desactivar todas las suscripciones
      await supabaseAdmin
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('site_id', site.id);

      return res.status(200).json({ 
        success: true,
        message: 'Sitio desactivado correctamente'
      });
    }
    else {
      return res.status(405).json({ error: 'Método no permitido' });
    }

  } catch (error) {
    console.error('Error en operación de sitio:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Función para normalizar la URL del sitio
function normalizeSiteUrl(url) {
  // Asegurar que la URL tiene el formato correcto (comienza con http/https)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Eliminar la barra final si existe
  return url.replace(/\/$/, '');
}
