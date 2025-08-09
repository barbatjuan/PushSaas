import { NextRequest, NextResponse } from 'next/server'
// OneSignal endpoint deprecated
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'OneSignal integration has been removed. This endpoint is deprecated.'
  }, { status: 410 })
}
