import { NextRequest, NextResponse } from 'next/server';
import { VAPID_KEYS } from '@/lib/webpush';

export async function GET(request: NextRequest) {
  try {
    // Return only the public key (safe to expose)
    return NextResponse.json({
      publicKey: VAPID_KEYS.publicKey,
      success: true
    });
  } catch (error) {
    console.error('❌ Failed to get VAPID key:', error);
    return NextResponse.json(
      { error: 'Failed to get VAPID key' },
      { status: 500 }
    );
  }
}


