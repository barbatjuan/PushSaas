import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const { siteId } = params;
    
    // Validar que el siteId existe (opcional - puedes agregar validación de DB aquí)
    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
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
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
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
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
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
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

// Manejar preflight requests (OPTIONS)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
