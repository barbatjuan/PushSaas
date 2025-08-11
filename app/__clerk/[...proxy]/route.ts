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
  return handleClerkProxy(request)
}

async function handleClerkProxy(request: NextRequest) {
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  
  // Remove /__clerk from the path
  const clerkPath = pathSegments.slice(2).join('/')

  // Route assets to Clerk CDN and API calls to Frontend API
  const isAsset = clerkPath.startsWith('npm/') || clerkPath.startsWith('v/') || clerkPath.includes('.js') || clerkPath.includes('.css') || clerkPath.includes('.map')
  const targetBase = isAsset
    ? 'https://cdn.clerk.com'
    : 'https://frontend-api.clerk.services'
  const clerkApiUrl = `${targetBase}/${clerkPath}${url.search}`
  
  try {
    // Forward the request to Clerk's Frontend API
    const response = await fetch(clerkApiUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
    })

    // Create response with proper CORS headers
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
    return new NextResponse('Proxy error', { status: 500 })
  }
}
