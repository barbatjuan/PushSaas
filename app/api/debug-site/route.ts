import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const siteId = url.searchParams.get('siteId') || '34c91fe84b42'

    console.log('Debug site - Looking for siteId:', siteId)

    // Get site details
    const { data: site, error } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('site_id', siteId)
      .single()

    console.log('Debug site - Query result:', { site, error })

    const response = NextResponse.json({
      siteId: siteId,
      siteFound: !!site,
      site: site,
      error: error,
      timestamp: new Date().toISOString()
    })

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response
  } catch (error) {
    console.error('Debug site error:', error)
    const errorResponse = NextResponse.json({
      error: 'Exception in debug',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })

    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    return errorResponse
  }
}

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
