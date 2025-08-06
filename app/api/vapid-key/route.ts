import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// VAPID keys - In production, store these securely in environment variables
const VAPID_KEYS = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

// Generate VAPID keys if they don't exist (development only)
if (!VAPID_KEYS.publicKey || !VAPID_KEYS.privateKey) {
  console.log('🔑 Generating new VAPID keys...');
  const vapidKeys = webpush.generateVAPIDKeys();
  VAPID_KEYS.publicKey = vapidKeys.publicKey;
  VAPID_KEYS.privateKey = vapidKeys.privateKey;
  
  console.log('📝 Add these to your .env file:');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
}

// Configure web-push
webpush.setVapidDetails(
  'mailto:support@pushsaas.com', // Replace with your email
  VAPID_KEYS.publicKey,
  VAPID_KEYS.privateKey
);

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

// Export the configured webpush instance for use in other endpoints
export { webpush, VAPID_KEYS };
