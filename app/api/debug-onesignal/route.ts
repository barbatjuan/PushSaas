import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing OneSignal API...')
    
    // Test OneSignal API connection
    const testAppData = {
      name: 'Test App - ' + Date.now(),
      apns_env: 'production',
      chrome_web_origin: 'https://example.com',
      chrome_web_default_notification_icon: `${process.env.NEXT_PUBLIC_APP_URL}/icon-192.png`,
      chrome_web_sub_domain: null,
      site_name: 'Test Site'
    }

    console.log('OneSignal request data:', testAppData)
    console.log('OneSignal API Key exists:', !!process.env.ONESIGNAL_REST_API_KEY)
    console.log('OneSignal API Key length:', process.env.ONESIGNAL_REST_API_KEY?.length)

    const onesignalResponse = await fetch('https://onesignal.com/api/v1/apps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(testAppData)
    })

    const responseText = await onesignalResponse.text()
    console.log('OneSignal response status:', onesignalResponse.status)
    console.log('OneSignal response headers:', Object.fromEntries(onesignalResponse.headers.entries()))
    console.log('OneSignal response body:', responseText)

    let responseData = null
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      console.log('Response is not JSON')
    }

    const result = {
      success: onesignalResponse.ok,
      status: onesignalResponse.status,
      statusText: onesignalResponse.statusText,
      headers: Object.fromEntries(onesignalResponse.headers.entries()),
      response: responseData || responseText,
      apiKeyConfigured: !!process.env.ONESIGNAL_REST_API_KEY,
      apiKeyLength: process.env.ONESIGNAL_REST_API_KEY?.length,
      timestamp: new Date().toISOString()
    }

    // If successful, clean up the test app
    if (onesignalResponse.ok && responseData?.id) {
      try {
        await fetch(`https://onesignal.com/api/v1/apps/${responseData.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
          }
        })
        console.log('Test app cleaned up')
      } catch (e) {
        console.log('Failed to clean up test app:', e)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('OneSignal debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Exception during OneSignal test',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
