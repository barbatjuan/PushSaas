import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // OneSignal endpoints deprecated
  return NextResponse.json({
    error: 'OneSignal integration has been removed. This endpoint is deprecated.',
  }, { status: 410 })
}
