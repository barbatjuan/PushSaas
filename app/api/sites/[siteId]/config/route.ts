import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    return NextResponse.json({
      onesignal_app_id: site.onesignal_app_id,
      site_name: site.name,
      site_url: site.url
    })
  } catch (error) {
    console.error('Error in site config API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
