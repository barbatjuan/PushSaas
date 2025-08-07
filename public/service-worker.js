/**
 * PushSaaS Service Worker
 * Download this file and place it at the root of your website: https://yoursite.com/service-worker.js
 * 
 * Instructions:
 * 1. Download this file from: https://web-push-notifications-phi.vercel.app/service-worker.js
 * 2. Upload it to your website root (same level as index.html)
 * 3. Make sure it's accessible at: https://yoursite.com/service-worker.js
 */

// Service Worker version for cache busting - FORCE UPDATE
const SW_VERSION = '2.0.5';
const CACHE_NAME = 'pushsaas-sw-v2.0.5'; // Added for cache busting

// Get site ID from URL parameters (passed by SDK)
const urlParams = new URLSearchParams(self.location.search);
const SITE_ID = urlParams.get('site') || 'c670c8bcd133'; // Default site ID

console.log('🔥 PushSaaS SW: Service Worker v2.0.5 - Standardized id field usage');
console.log('🚀 PushSaaS Service Worker: Loaded version', SW_VERSION, 'for site:', SITE_ID);
console.log('🔧 PushSaaS SW: Enhanced debugging for notificationId tracking!');

// Install event - FORCE UPDATE
self.addEventListener('install', (event) => {
  console.log('🔥 PushSaaS SW: FORCE INSTALLING service worker version', SW_VERSION);
  // Skip waiting to activate immediately and avoid subscription interruption
  event.waitUntil(self.skipWaiting());
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ PushSaaS SW: Service worker activated');
  // Claim all clients immediately to maintain subscription continuity
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('👍 PushSaaS SW: All clients claimed, subscriptions maintained');
    })
  );
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('📨 PushSaaS SW: Push received for site:', SITE_ID);
  
  let notificationData = {
    title: 'Nueva notificación',
    body: 'Tienes una nueva notificación',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'pushsaas-notification',
    requireInteraction: false,
    data: {
      url: self.location.origin,
      timestamp: Date.now(),
      siteId: SITE_ID
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('📦 PushSaaS SW: Received push data:', pushData);
      
      if (pushData.title) notificationData.title = pushData.title;
      if (pushData.body) notificationData.body = pushData.body;
      if (pushData.icon) {
        notificationData.icon = pushData.icon;
        console.log('🎨 PushSaaS SW: Using custom icon:', pushData.icon);
      }
      if (pushData.badge) notificationData.badge = pushData.badge;
      if (pushData.url) notificationData.data.url = pushData.url;
      
      if (pushData.data) {
        notificationData.data = {
          url: pushData.url || self.location.origin,
          timestamp: Date.now(),
          siteId: SITE_ID,
          ...pushData.data
        };
        console.log('📊 PushSaaS SW: Notification data updated (merged):', notificationData.data);
        console.log('🔑 PushSaaS SW: id confirmed:', notificationData.data.id || 'STILL MISSING!');
      }
    } catch (error) {
      console.error('❌ PushSaaS SW: Failed to parse push data:', error);
    }
  } else {
    console.log('⚠️ PushSaaS SW: No push data received');
  }

  // Show notification
  console.log('🚀 PushSaaS SW: Final notification data before showing:', notificationData.data);
  console.log('🔑 PushSaaS SW: Final notificationId check:', notificationData.data.notificationId || 'STILL MISSING!');
  
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      timestamp: notificationData.data.timestamp
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event - UPDATED VERSION
self.addEventListener('notificationclick', (event) => {
  console.log('🔥 PushSaaS SW: Notification clicked - v1.0.6 FORCE UPDATE');
  
  const notification = event.notification;
  const data = notification.data || {};
  
  console.log('📊 PushSaaS SW: Full notification object:', {
    title: notification.title,
    body: notification.body,
    data: notification.data,
    tag: notification.tag
  });
  console.log('📊 PushSaaS SW: Click data extracted:', data);
  console.log('🔑 PushSaaS SW: id found:', data.id || 'MISSING!');
  console.log('🎯 PushSaaS SW: siteId found:', data.siteId || 'MISSING!');
  
  notification.close();
  
  // SIMPLIFIED: Register click immediately
  const clickData = {
    notification_id: data.id || null,
    site_id: data.siteId || SITE_ID,
    timestamp: new Date().toISOString()
  };
  
  console.log('🚀 PushSaaS SW: Sending click data:', clickData);
  
  // Send click tracking request
  const trackClick = fetch('https://web-push-notifications-phi.vercel.app/api/notifications/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clickData)
  }).then(response => {
    console.log('✅ PushSaaS SW: Click tracked, status:', response.status);
    return response.text();
  }).then(data => {
    console.log('📊 PushSaaS SW: Click response:', data);
  }).catch(error => {
    console.error('❌ PushSaaS SW: Click tracking failed:', error);
  });
  
  const urlToOpen = data.url || self.location.origin;
  
  // Open or focus the app
  const openWindow = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url === urlToOpen && 'focus' in client) {
        console.log('🔍 PushSaaS SW: Focusing existing window');
        return client.focus();
      }
    }
    
    console.log('🌐 PushSaaS SW: Opening new window');
    return clients.openWindow(urlToOpen);
  }).catch(error => {
    console.error('❌ PushSaaS SW: Error opening window:', error);
  });
  
  // CRITICAL: Wait for both operations
  event.waitUntil(Promise.all([openWindow, trackClick]));
});

// Error handlers
self.addEventListener('error', (event) => {
  console.error('❌ PushSaaS Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ PushSaaS Service Worker Unhandled Rejection:', event.reason);
});
