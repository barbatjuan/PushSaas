/**
 * PushSaaS SDK - Native Web Push API Implementation
 * No external dependencies - Pure Web Push API + VAPID
 */
(function() {
  'use strict';

  // Get the site ID from the script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-site]');
  let siteId = scriptTag ? scriptTag.getAttribute('data-site') : null;
  const apiBase = scriptTag.getAttribute('data-api') || 'https://web-push-notifications-phi.vercel.app';
  
  // Force correct site ID for webcoders.es (temporary fix)
  if (window.location.hostname === 'webcoders.es' || siteId === '34c91fe84b42') {
    siteId = 'c670c8bcd133';
    console.log('🔧 PushSaaS: Corrected site ID for webcoders.es');
  }
  
  if (!siteId) {
    console.error('PushSaaS SDK: data-site attribute is required');
    return;
  }

  console.log('🚀 PushSaaS SDK: Initializing for site:', siteId);

  // State
  let isInitialized = false;
  let vapidPublicKey = null;
  let serviceWorkerRegistration = null;
  let pushSubscription = null;

  // Initialize the SDK
  async function init() {
    if (isInitialized) return;
    
    try {
      // Check if browser supports push notifications
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications not supported in this browser');
      }

      // Get VAPID public key from backend
      await fetchVapidKey();
      
      // Register service worker
      await registerServiceWorker();
      
      // Check existing subscription
      await checkExistingSubscription();
      
      isInitialized = true;
      console.log('✅ PushSaaS SDK: Initialized successfully');
      
    } catch (error) {
      console.error('❌ PushSaaS SDK: Initialization failed:', error);
    }
  }

  // Fetch VAPID public key from backend
  async function fetchVapidKey() {
    try {
      const response = await fetch(`${apiBase}/api/vapid-key`);
      if (!response.ok) {
        throw new Error('Failed to fetch VAPID key');
      }
      const data = await response.json();
      vapidPublicKey = data.publicKey;
      console.log('🔑 PushSaaS: VAPID key fetched');
    } catch (error) {
      console.error('❌ PushSaaS: Failed to fetch VAPID key:', error);
      throw error;
    }
  }

  // Create and register inline Service Worker
  async function registerServiceWorker() {
    try {
      console.log('🔧 PushSaaS: Creating inline Service Worker...');
      
      // Create Service Worker code as a blob
      const swCode = `
        // PushSaaS Service Worker (Inline)
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
      
      // Create blob URL for the service worker
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);
      
      console.log('📡 PushSaaS: Registering inline Service Worker...');
      
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/'
      });
      
      serviceWorkerRegistration = registration;
      console.log('👷 PushSaaS: Service Worker registered successfully');
      
      // Clean up blob URL
      URL.revokeObjectURL(swUrl);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ PushSaaS: Service Worker ready');
      
    } catch (error) {
      console.error('❌ PushSaaS: Service Worker registration failed:', error);
      throw error;
    }
  }

  // Check for existing subscription
  async function checkExistingSubscription() {
    try {
      if (!serviceWorkerRegistration) return;
      
      pushSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
      
      if (pushSubscription) {
        console.log('📱 PushSaaS: Existing subscription found');
        // Optionally sync with backend
        await syncSubscriptionWithBackend(pushSubscription);
      }
    } catch (error) {
      console.error('❌ PushSaaS: Failed to check existing subscription:', error);
    }
  }

  // Convert VAPID key to Uint8Array
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Subscribe to push notifications
  async function subscribeToPush() {
    try {
      if (!serviceWorkerRegistration || !vapidPublicKey) {
        throw new Error('SDK not properly initialized');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      console.log('✅ PushSaaS: Permission granted');

      // Subscribe to push manager
      pushSubscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('📱 PushSaaS: Push subscription created');

      // Send subscription to backend
      await syncSubscriptionWithBackend(pushSubscription);
      
      return true;
      
    } catch (error) {
      console.error('❌ PushSaaS: Subscription failed:', error);
      return false;
    }
  }

  // Sync subscription with backend
  async function syncSubscriptionWithBackend(subscription) {
    try {
      const response = await fetch(`${apiBase}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_id: siteId,
          subscription: subscription.toJSON(),
          user_agent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync subscription with backend');
      }

      console.log('✅ PushSaaS: Subscription synced with backend');
      
    } catch (error) {
      console.error('❌ PushSaaS: Failed to sync subscription:', error);
      throw error;
    }
  }

  // Get subscription status
  async function getSubscriptionStatus() {
    try {
      if (!serviceWorkerRegistration) {
        return {
          isSubscribed: false,
          permission: Notification.permission,
          supported: 'serviceWorker' in navigator && 'PushManager' in window
        };
      }

      const subscription = await serviceWorkerRegistration.pushManager.getSubscription();
      
      return {
        isSubscribed: !!subscription,
        permission: Notification.permission,
        supported: true,
        subscription: subscription ? subscription.toJSON() : null
      };
      
    } catch (error) {
      console.error('❌ PushSaaS: Failed to get subscription status:', error);
      return {
        isSubscribed: false,
        permission: Notification.permission,
        supported: false,
        error: error.message
      };
    }
  }

  // Public API
  window.PushSaaS = {
    // Subscribe to push notifications
    subscribe: async function() {
      if (!isInitialized) {
        console.error('❌ PushSaaS SDK: Not initialized yet');
        return false;
      }
      return await subscribeToPush();
    },

    // Get current status
    getStatus: async function() {
      return await getSubscriptionStatus();
    },

    // Check if subscribed (simple boolean)
    isSubscribed: async function() {
      const status = await getSubscriptionStatus();
      return status.isSubscribed;
    },

    // Unsubscribe from push notifications
    unsubscribe: async function() {
      try {
        if (!serviceWorkerRegistration) return false;
        
        const subscription = await serviceWorkerRegistration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          console.log('🚫 PushSaaS: Unsubscribed successfully');
          return true;
        }
        return false;
      } catch (error) {
        console.error('❌ PushSaaS: Unsubscribe failed:', error);
        return false;
      }
    },

    // Get SDK info
    getInfo: function() {
      return {
        version: '2.0.0',
        siteId: siteId,
        apiBase: apiBase,
        isInitialized: isInitialized,
        hasVapidKey: !!vapidPublicKey,
        hasServiceWorker: !!serviceWorkerRegistration
      };
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Auto-prompt after delay (configurable)
  const autoPromptDelay = parseInt(scriptTag.getAttribute('data-auto-prompt') || '5000');
  if (autoPromptDelay > 0) {
    setTimeout(async () => {
      if (isInitialized && Notification.permission === 'default') {
        console.log('🔔 PushSaaS: Showing auto-prompt');
        await window.PushSaaS.subscribe();
      }
    }, autoPromptDelay);
  }

})();
