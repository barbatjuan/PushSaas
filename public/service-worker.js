/**
 * PushSaaS Service Worker
 * Handles push notifications in the background
 */

// Service Worker version for cache management
const SW_VERSION = '2.0.0';
const CACHE_NAME = `pushsaas-sw-${SW_VERSION}`;

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 PushSaaS Service Worker: Installing version', SW_VERSION);
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ PushSaaS Service Worker: Activated version', SW_VERSION);
  
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('📨 PushSaaS Service Worker: Push received');
  
  let notificationData = {
    title: 'Nueva notificación',
    body: 'Tienes una nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'pushsaas-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/action-open.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/action-close.png'
      }
    ],
    data: {
      url: self.location.origin,
      timestamp: Date.now()
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('📨 PushSaaS: Push data received:', pushData);
      
      // Merge with default data
      notificationData = {
        ...notificationData,
        ...pushData,
        data: {
          ...notificationData.data,
          ...(pushData.data || {})
        }
      };
    } catch (error) {
      console.error('❌ PushSaaS: Failed to parse push data:', error);
      // Use text data as body if JSON parsing fails
      notificationData.body = event.data.text() || notificationData.body;
    }
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
      actions: notificationData.actions,
      data: notificationData.data,
      vibrate: [200, 100, 200], // Vibration pattern
      timestamp: notificationData.data.timestamp
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('👆 PushSaaS Service Worker: Notification clicked');
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  // Close the notification
  notification.close();
  
  // Handle different actions
  if (action === 'close') {
    console.log('🚫 PushSaaS: Notification closed by user');
    return;
  }
  
  // Default action or 'open' action
  const urlToOpen = data.url || self.location.origin;
  
  // Open or focus the app
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    // Check if there's already a window/tab open with the target URL
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url === urlToOpen && 'focus' in client) {
        console.log('🔍 PushSaaS: Focusing existing window');
        return client.focus();
      }
    }
    
    // No existing window found, open a new one
    if (clients.openWindow) {
      console.log('🆕 PushSaaS: Opening new window');
      return clients.openWindow(urlToOpen);
    }
  }).catch((error) => {
    console.error('❌ PushSaaS: Failed to handle notification click:', error);
  });
  
  event.waitUntil(promiseChain);
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('🚫 PushSaaS Service Worker: Notification closed');
  
  // Optional: Track notification close events
  const notification = event.notification;
  const data = notification.data || {};
  
  // You could send analytics data here
  // trackNotificationClose(data);
});

// Background sync (optional - for offline support)
self.addEventListener('sync', (event) => {
  console.log('🔄 PushSaaS Service Worker: Background sync triggered');
  
  if (event.tag === 'pushsaas-sync') {
    // Handle background sync
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    console.log('🔄 PushSaaS: Performing background sync');
    
    // You could sync pending data here
    // For example, retry failed subscription updates
    
  } catch (error) {
    console.error('❌ PushSaaS: Background sync failed:', error);
  }
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('💬 PushSaaS Service Worker: Message received:', event.data);
  
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: SW_VERSION });
      break;
      
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'UPDATE_CONFIG':
      // Handle configuration updates
      console.log('⚙️ PushSaaS: Configuration updated:', payload);
      break;
      
    default:
      console.log('❓ PushSaaS: Unknown message type:', type);
  }
});

// Error handler
self.addEventListener('error', (event) => {
  console.error('❌ PushSaaS Service Worker Error:', event.error);
});

// Unhandled rejection handler
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ PushSaaS Service Worker Unhandled Rejection:', event.reason);
});

console.log('🚀 PushSaaS Service Worker: Loaded version', SW_VERSION);
