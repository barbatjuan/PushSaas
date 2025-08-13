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
    
    // Leer el archivo SDK desde public
    const sdkPath = join(process.cwd(), 'public', 'sdk.js')
    let sdkContent = await readFile(sdkPath, 'utf8')
    
    // Reemplazar placeholder del site_id si existe
    sdkContent = sdkContent.replace(/SITE_ID_PLACEHOLDER/g, siteId)
    
    return new NextResponse(sdkContent, {
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
    console.error('Error serving SDK:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
