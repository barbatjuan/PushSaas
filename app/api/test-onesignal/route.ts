import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing OneSignal with exact documentation format...')
    
    const apiKey = process.env.ONESIGNAL_REST_API_KEY
    console.log('API Key configured:', !!apiKey)
    console.log('API Key length:', apiKey?.length)
    console.log('API Key starts with:', apiKey?.substring(0, 20) + '...')

    // Test simple API call first - get apps
    const response = await fetch('https://onesignal.com/api/v1/apps', {
      method: 'GET',
      headers: {
        'Authorization': `key ${apiKey}`
      }
    })

    const responseText = await response.text()
    console.log('OneSignal GET apps response status:', response.status)
    console.log('OneSignal GET apps response:', responseText)

    let responseData = null
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      console.log('Response is not JSON')
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseData || responseText,
      apiKeyConfigured: !!apiKey,
      apiKeyLength: apiKey?.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('OneSignal test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Exception during OneSignal test',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
