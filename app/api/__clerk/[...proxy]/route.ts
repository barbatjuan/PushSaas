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

export async function OPTIONS(request: NextRequest) {
  return handleClerkProxy(request)
}

async function handleClerkProxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  
  // Extract the path after /__clerk/
  const clerkPath = pathname.replace('/api/__clerk/', '')
  const targetUrl = `https://frontend-api.clerk.dev/${clerkPath}${search}`
  
  try {
    // Get the request body if it exists
    let body = null
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text()
    }
    
    // Forward the request to Clerk's Frontend API
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        // Forward all original headers
        ...Object.fromEntries(request.headers.entries()),
        // Add required Clerk proxy headers
        'Clerk-Proxy-Url': 'https://adioswifi.es/__clerk',
        'Clerk-Secret-Key': process.env.CLERK_SECRET_KEY || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || request.ip || '',
        // Remove host header to avoid conflicts
        'host': 'frontend-api.clerk.dev'
      },
      body: body || undefined,
    })
    
    // Get response body
    const responseBody = await response.text()
    
    // Create response with CORS headers
    const nextResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
    })
    
    // Copy response headers
    response.headers.forEach((value, key) => {
      // Skip headers that NextResponse handles automatically
      if (!['content-length', 'content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        nextResponse.headers.set(key, value)
      }
    })
    
    // Add CORS headers
    nextResponse.headers.set('Access-Control-Allow-Origin', '*')
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return nextResponse
    
  } catch (error) {
    console.error('Clerk proxy error:', error)
    return new NextResponse('Proxy Error', { status: 500 })
  }
}
