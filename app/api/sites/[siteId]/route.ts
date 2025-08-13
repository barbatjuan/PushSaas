import { NextRequest, NextResponse } from 'next/server';

// Mapa temporal de dominios permitidos por siteId.
// TODO: Reemplazar por consulta a BD (sites table) y lectura dinámica.
const siteDomains: Record<string, string> = {
  // Ejemplos. Mantener actualizado según onboarding real.
  jrk2k9lrkce: 'https://skyblue-toad-123619.hostingersite.com',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const { siteId } = params;
    const origin = request.headers.get('origin') || '';
    
    // Validar que el siteId existe (opcional - puedes agregar validación de DB aquí)
    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Vary': 'Origin',
          },
        }
      );
    }

    // Validar que el origen corresponde al dominio permitido para el siteId
    const allowedDomain = siteDomains[siteId];
    if (!allowedDomain || origin !== allowedDomain) {
      return NextResponse.json(
        { error: 'Domain not allowed' },
        {
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Vary': 'Origin',
          },
        }
      );
    }

    // Obtener la clave VAPID pública desde las variables de entorno
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      return NextResponse.json(
        { error: 'VAPID key not configured' },
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': allowedDomain,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Vary': 'Origin',
          },
        }
      );
    }

    // Devolver la clave VAPID pública con headers CORS
    return NextResponse.json(
      {
        vapidPublicKey,
        siteId,
        success: true
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedDomain,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
          'Vary': 'Origin',
        }
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
