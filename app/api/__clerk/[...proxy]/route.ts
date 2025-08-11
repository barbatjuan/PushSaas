import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handleClerkProxy(request)
}

export async function POST(request: NextRequest) {
  return handleClerkProxy(request)
}

export async function PUT(request: NextRequest) {
  return handleClerkProxy(request)
}

export async function DELETE(request: NextRequest) {
  return handleClerkProxy(request)
}

export async function PATCH(request: NextRequest) {
  return handleClerkProxy(request)
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  })
}

async function handleClerkProxy(request: NextRequest) {
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  const clerkPath = pathSegments.slice(3).join('/') // Remove /api/__clerk
  
  // Route assets to CDN, API calls to frontend-api
  const isAsset = clerkPath.startsWith('npm/') || 
                  clerkPath.startsWith('v/') || 
                  clerkPath.includes('.js') || 
                  clerkPath.includes('.css') || 
                  clerkPath.includes('.map')
  
  const targetBase = isAsset
    ? 'https://js.clerk.dev'
    : 'https://clerk.services'
  
  const clerkApiUrl = `${targetBase}/${clerkPath}${url.search}`

  try {
    const response = await fetch(clerkApiUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'Host': new URL(targetBase).host,
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
    })

    const responseHeaders = new Headers(response.headers)
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Clerk proxy error:', error)
    return new NextResponse('Proxy Error', { status: 500 })
  }
}
