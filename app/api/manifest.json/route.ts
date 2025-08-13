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
    
    // Leer el archivo manifest desde public
    const manifestPath = join(process.cwd(), 'public', 'manifest.json')
    let manifestContent = await readFile(manifestPath, 'utf8')
    
    // Parsear y personalizar el manifest con el site_id
    const manifest = JSON.parse(manifestContent)
    
    // Personalizar el manifest para el sitio específico
    manifest.name = `NotiFly - ${siteId}`
    manifest.short_name = `NotiFly`
    manifest.description = `Push notifications for site ${siteId}`
    
    return new NextResponse(JSON.stringify(manifest, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error serving manifest:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
