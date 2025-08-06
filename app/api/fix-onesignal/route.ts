import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json()
    
    if (!siteId) {
      return NextResponse.json({ error: 'Site ID required' }, { status: 400 })
    }

    console.log('Fixing OneSignal for site:', siteId)

    // Get site details
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('site_id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    console.log('Site found:', site)

    // Create OneSignal app
    console.log('Creating OneSignal app...')
    const onesignalResponse = await fetch('https://onesignal.com/api/v1/apps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        name: `${site.name} - ${siteId}`,
        apns_env: 'production',
        chrome_web_origin: site.url,
        chrome_web_default_notification_icon: `${process.env.NEXT_PUBLIC_APP_URL}/icon-192.png`,
        chrome_web_sub_domain: null,
        site_name: site.name
      })
    })

    console.log('OneSignal response status:', onesignalResponse.status)
    const onesignalText = await onesignalResponse.text()
    console.log('OneSignal response:', onesignalText)

    if (!onesignalResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to create OneSignal app',
        details: onesignalText,
        status: onesignalResponse.status
      }, { status: 500 })
    }

    const onesignalData = JSON.parse(onesignalText)
    const onesignalAppId = onesignalData.id

    console.log('OneSignal app created:', onesignalAppId)

    // Update site with OneSignal app ID
    const { data: updatedSite, error: updateError } = await supabaseAdmin
      .from('sites')
      .update({ onesignal_app_id: onesignalAppId })
      .eq('site_id', siteId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating site:', updateError)
      return NextResponse.json({ error: 'Error updating site' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      site: updatedSite,
      onesignalAppId: onesignalAppId,
      message: 'OneSignal configured successfully'
    })

  } catch (error) {
    console.error('Error fixing OneSignal:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
