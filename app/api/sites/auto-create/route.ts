import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateSiteRequest {
  name: string;
  url: string;
  logo_url?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: CreateSiteRequest = await request.json();
    const { name, url, logo_url } = body;

    // Validate required fields
    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log('🚀 Starting automated site creation:', { name, url });

    // Generate unique site ID
    const siteId = uuidv4().replace(/-/g, '').substring(0, 12);

    // Save to database
    const { data: site, error: dbError } = await supabase
      .from('sites')
      .insert({
        user_id: userId,
        name,
        url,
        site_id: siteId,
        logo_url,
        status: 'active',
        subscriber_count: 0
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save site to database' },
        { status: 500 }
      );
    }

    // Step 4: Generate SDK integration code
    const sdkCode = `<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://web-push-notifications-phi.vercel.app'}/sdk.js" data-site="${siteId}"></script>`;

    // Step 5: Generate PHP code for WordPress
    const phpCode = `<?php
// PushSaaS - Notificaciones Push Automáticas
if (!function_exists('add_pushsaas_notifications')) {
    function add_pushsaas_notifications() {
        echo '${sdkCode}';
    }
    add_action('wp_head', 'add_pushsaas_notifications');
}
?>`;

    console.log('✅ Site created successfully:', {
      siteId,
      name,
      url
    });

    // Return complete setup information
    return NextResponse.json({
      success: true,
      site: {
        id: siteId,
        name,
        url,
        logo_url,
        site_id: siteId,
        created_at: site.created_at,
      },
      integration: {
        sdk_code: sdkCode,
        php_code: phpCode,
        instructions: {
          html: 'Copia y pega este código en el <head> de tu sitio web.',
          wordpress: 'Copia y pega este código en el archivo functions.php de tu tema de WordPress.',
          verification: `Visita ${url} y abre las herramientas de desarrollador para verificar que el SDK se carga correctamente.`,
        },
      },
      automation_status: {
        web_push_configured: true,
        ready_to_use: true,
      },
    });

  } catch (error) {
    console.error('💥 Auto-create site failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to create site automatically',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check automation status
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if OneSignal automation is properly configured
    const hasOneSignalKey = !!process.env.ONESIGNAL_USER_AUTH_KEY;
    const hasSupabase = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    return NextResponse.json({
      automation_available: hasOneSignalKey && hasSupabase,
      configuration: {
        onesignal_configured: hasOneSignalKey,
        database_configured: hasSupabase,
      },
      message: hasOneSignalKey && hasSupabase 
        ? 'Automation is ready to use' 
        : 'Automation requires additional configuration',
    });

  } catch (error) {
    console.error('Failed to check automation status:', error);
    return NextResponse.json(
      { error: 'Failed to check automation status' },
      { status: 500 }
    );
  }
}
