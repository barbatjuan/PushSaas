/**
 * PushSaaS Service Worker
 * Download this file and place it at the root of your website: https://yoursite.com/service-worker.js
 * 
 * Instructions:
 * 1. Download this file from: https://web-push-notifications-phi.vercel.app/service-worker.js
 * 2. Upload it to your website root (same level as index.html)
 * 3. Make sure it's accessible at: https://yoursite.com/service-worker.js
 */

// Service Worker version
const SW_VERSION = '2.0.1';

// Get site ID from URL parameters (passed by SDK)
const urlParams = new URLSearchParams(self.location.search);
const SITE_ID = urlParams.get('site') || 'unknown';

console.log('🚀 PushSaaS Service Worker: Loaded version', SW_VERSION, 'for site:', SITE_ID);

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 PushSaaS SW: Installing version', SW_VERSION);
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ PushSaaS SW: Activated version', SW_VERSION);
  event.waitUntil(self.clients.claim());
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
        notificationData.data = { ...notificationData.data, ...pushData.data };
        console.log('📊 PushSaaS SW: Notification data updated:', notificationData.data);
      }
    } catch (error) {
      console.error('❌ PushSaaS SW: Failed to parse push data:', error);
    }
  } else {
    console.log('⚠️ PushSaaS SW: No push data received');
  }

  // Show notification
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

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('👆 PushSaaS SW: Notification clicked');
  
  const notification = event.notification;
  const data = notification.data || {};
  
  notification.close();
  
  // Register click with backend for statistics
  const registerClick = async () => {
    try {
      const clickData = {
        notification_id: data.notificationId || null,
        site_id: data.siteId || SITE_ID,
        timestamp: new Date().toISOString()
      };
      
      console.log('📊 PushSaaS: Registering click with data:', clickData);
      
      const response = await fetch('https://web-push-notifications-phi.vercel.app/api/notifications/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clickData)
      });
      
      const responseData = await response.text();
      console.log('📊 PushSaaS: Click response:', response.status, responseData);
      
      if (response.ok) {
        console.log('✅ PushSaaS: Click registered successfully');
      } else {
        console.warn('⚠️ PushSaaS: Failed to register click:', response.status, responseData);
      }
    } catch (error) {
      console.error('❌ PushSaaS: Error registering click:', error);
    }
  };
  
  // Register click (don't wait for it)
  registerClick();
  
  const urlToOpen = data.url || self.location.origin;
  
  // Open or focus the app
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url === urlToOpen && 'focus' in client) {
        console.log('🔍 PushSaaS: Focusing existing window');
        return client.focus();
      }
    }
    
    if (clients.openWindow) {
      console.log('🆕 PushSaaS: Opening new window');
      return clients.openWindow(urlToOpen);
    }
  }).catch((error) => {
    console.error('❌ PushSaaS: Failed to handle notification click:', error);
  });
  
  event.waitUntil(promiseChain);
});

// Error handlers
self.addEventListener('error', (event) => {
  console.error('❌ PushSaaS Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ PushSaaS Service Worker Unhandled Rejection:', event.reason);
});
