import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('site')
    
    if (!siteId) {
      return new NextResponse('Site ID is required', { status: 400 })
    }
    
    // Leer el archivo Service Worker desde public
    const swPath = join(process.cwd(), 'public', 'sw.js')
    let swContent = await readFile(swPath, 'utf8')
    
    // Reemplazar placeholder del site_id si existe
    swContent = swContent.replace(/SITE_ID_PLACEHOLDER/g, siteId)
    
    return new NextResponse(swContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error serving Service Worker:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
