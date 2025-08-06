import webpush from 'web-push';

// VAPID keys - In production, store these securely in environment variables
export const VAPID_KEYS = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

// Initialize webpush configuration only when needed (lazy initialization)
let isConfigured = false;

function configureWebPush() {
  if (!isConfigured && VAPID_KEYS.publicKey && VAPID_KEYS.privateKey) {
    try {
      webpush.setVapidDetails(
        'mailto:support@pushsaas.com', // Replace with your email
        VAPID_KEYS.publicKey,
        VAPID_KEYS.privateKey
      );
      isConfigured = true;
      console.log('✅ WebPush configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure WebPush:', error);
      throw error;
    }
  } else if (!VAPID_KEYS.publicKey || !VAPID_KEYS.privateKey) {
    throw new Error('VAPID keys not found. Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.');
  }
}

// Export a configured webpush instance
export const getWebPush = () => {
  configureWebPush();
  return webpush;
};

export { webpush };
