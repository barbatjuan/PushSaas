import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Nota: obtenemos dominios y claves VAPID desde la base de datos.

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const { siteId } = params;
    const requestOrigin = request.headers.get('origin') || '';

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': requestOrigin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Vary': 'Origin',
          },
        }
      );
    }

    // 1) Buscar el sitio por site_id (string público) y validar que esté activo
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('id, url, status')
      .eq('site_id', siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': requestOrigin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Vary': 'Origin',
          },
        }
      );
    }

    if (site.status !== 'active') {
      return NextResponse.json(
        { error: 'Site is not active' },
        {
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': requestOrigin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Vary': 'Origin',
          },
        }
      );
    }

    // 2) Determinar el origen permitido desde la URL del sitio
    let allowedOrigin = '*';
    try {
      if (site.url) {
        const u = new URL(site.url);
        allowedOrigin = `${u.protocol}//${u.host}`;
      }
    } catch {
      // Si la URL no es válida, permitimos únicamente el request origin como fallback controlado
      allowedOrigin = requestOrigin || '*';
    }

    // Validar que el request provenga del dominio configurado
    if (allowedOrigin !== '*' && requestOrigin && requestOrigin !== allowedOrigin) {
      return NextResponse.json(
        { error: 'Domain not allowed' },
        {
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': requestOrigin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Vary': 'Origin',
          },
        }
      );
    }

    // 3) Leer la VAPID public key desde vapid_keys por UUID del sitio
    const { data: vapid, error: vapidError } = await supabaseAdmin
      .from('vapid_keys')
      .select('public_key')
      .eq('site_id', site.id)
      .single();

    if (vapidError || !vapid?.public_key) {
      return NextResponse.json(
        { error: 'VAPID key not configured for site' },
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Vary': 'Origin',
          },
        }
      );
    }

    // 4) Responder con la clave pública específica del sitio
    return NextResponse.json(
      {
        vapidPublicKey: vapid.public_key,
        siteId,
        success: true,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'public, max-age=3600',
          'Vary': 'Origin',
        },
      }
    );
  } catch (error) {
    console.error('❌ Failed to get site VAPID key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Vary': 'Origin',
        },
      }
    );
  }
}

// Manejar preflight requests (OPTIONS)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  // Para preflight, permitimos el origen que llama; la validación fuerte se hace en GET
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    },
  });
}
