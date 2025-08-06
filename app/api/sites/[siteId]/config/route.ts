import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const { siteId } = params

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 })
    }

    // Get site configuration
    const { data: site, error } = await supabaseAdmin
      .from('sites')
      .select('onesignal_app_id, status, name, url')
      .eq('site_id', siteId)
      .eq('status', 'active')
      .single()

    if (error || !site) {
      return NextResponse.json({ error: 'Site not found or inactive' }, { status: 404 })
    }

    if (!site.onesignal_app_id) {
      return NextResponse.json({ error: 'OneSignal not configured for this site' }, { status: 400 })
    }

    const response = NextResponse.json({
      onesignal_app_id: site.onesignal_app_id,
      site_name: site.name,
      site_url: site.url
    })

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response
  } catch (error) {
    console.error('Error in site config API:', error)
    const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    
    // Add CORS headers even for errors
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return errorResponse
  }
}
