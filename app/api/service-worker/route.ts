import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const serviceWorkerCode = `
// PushSaaS Service Worker
const SW_VERSION = '2.0.0';

self.addEventListener('install', (event) => {
  console.log('🔧 PushSaaS SW: Installing version', SW_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ PushSaaS SW: Activated version', SW_VERSION);
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('📨 PushSaaS SW: Push received');
  
  let notificationData = {
    title: 'Nueva notificación',
    body: 'Tienes una nueva notificación',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'pushsaas-notification',
    requireInteraction: false,
    data: {
      url: self.location.origin,
      timestamp: Date.now()
    }
  };
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('❌ PushSaaS SW: Failed to parse push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }
  
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

self.addEventListener('notificationclick', (event) => {
  console.log('👆 PushSaaS SW: Notification clicked');
  
  const notification = event.notification;
  const data = notification.data || {};
  
  notification.close();
  
  const urlToOpen = data.url || self.location.origin;
  
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url === urlToOpen && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });
  
  event.waitUntil(promiseChain);
});

console.log('🚀 PushSaaS SW: Loaded version', SW_VERSION);
`;

  return new NextResponse(serviceWorkerCode, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      // CORS headers to allow cross-origin requests
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
