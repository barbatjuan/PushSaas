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
      console.log('🔍 PushSaaS: Fetching VAPID key from:', `${apiBase}/api/vapid-key`);
      const response = await fetch(`${apiBase}/api/vapid-key`);
      if (!response.ok) {
        throw new Error(`Failed to fetch VAPID key: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('📦 PushSaaS: VAPID response data:', data);
      
      if (!data.publicKey) {
        throw new Error('No publicKey in response');
      }
      
      vapidPublicKey = data.publicKey;
      window.PushSaaS.vapidPublicKey = vapidPublicKey; // 💥 FIX GLOBAL
      console.log('🔑 PushSaaS: VAPID key stored:', vapidPublicKey ? vapidPublicKey.substring(0, 20) + '...' : 'NULL');
      console.log('✅ PushSaaS: VAPID key fetched successfully');
    } catch (error) {
      console.error('❌ PushSaaS: Failed to fetch VAPID key:', error);
      throw error;
    }
  }

  // Register Service Worker with automatic fallback
  async function registerServiceWorker() {
    try {
      console.log('🔧 PushSaaS: Registering Service Worker...');
      
      // Try physical file first (best performance)
      let swUrl = `/service-worker.js?site=${siteId}`;
      console.log('📡 PushSaaS: Trying physical file:', swUrl);
      
      try {
        const registration = await navigator.serviceWorker.register(swUrl, {
          scope: '/'
        });
        
        serviceWorkerRegistration = registration;
        console.log('👷 PushSaaS: Service Worker registered successfully (physical file)');
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('✅ PushSaaS: Service Worker ready');
        return;
        
      } catch (physicalFileError) {
        console.log('🔄 PushSaaS: Physical file not found, trying dynamic fallback...');
        
        // Fallback: Create dynamic service worker for WordPress/PHP sites
        if (window.location.pathname.includes('wp-') || document.querySelector('meta[name="generator"][content*="WordPress"]')) {
          swUrl = `/?pushsaas-worker&site=${siteId}`;
          console.log('📡 PushSaaS: Trying WordPress dynamic URL:', swUrl);
          
          try {
            const registration = await navigator.serviceWorker.register(swUrl, {
              scope: '/'
            });
            
            serviceWorkerRegistration = registration;
            console.log('👷 PushSaaS: Service Worker registered successfully (WordPress dynamic)');
            
            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            console.log('✅ PushSaaS: Service Worker ready');
            return;
            
          } catch (wpError) {
            console.log('⚠️ PushSaaS: WordPress dynamic fallback failed');
          }
        }
        
        // Final fallback: Try external service worker
        swUrl = `${apiBase}/api/service-worker?site=${siteId}`;
        console.log('📡 PushSaaS: Trying external service worker:', swUrl);
        
        try {
          const registration = await navigator.serviceWorker.register(swUrl, {
            scope: '/'
          });
          
          serviceWorkerRegistration = registration;
          console.log('👷 PushSaaS: Service Worker registered successfully (external)');
          
          // Wait for service worker to be ready
          await navigator.serviceWorker.ready;
          console.log('✅ PushSaaS: Service Worker ready');
          return;
          
        } catch (externalError) {
          throw new Error('All service worker registration methods failed');
        }
      }
      
    } catch (error) {
      console.error('❌ PushSaaS: Service Worker registration failed:', error);
      console.log('📝 PushSaaS: Manual setup required:');
      console.log(`   1. Download: ${apiBase}/service-worker.js`);
      console.log('   2. Upload to your website root as: /service-worker.js');
      console.log('   3. Reload this page');
      
      // Continue without service worker (limited functionality)
      console.log('⚠️ PushSaaS: Continuing without Service Worker (limited functionality)');
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

  // Convert VAPID key from base64url to Uint8Array
  function urlBase64ToUint8Array(base64String) {
    try {
      // Limpia espacios invisibles
      base64String = base64String.trim();
      
      // Fix: VAPID keys must be exactly 88 characters
      if (base64String.length === 89) {
        base64String = base64String.substring(0, 88);
        console.log('🔧 PushSaaS: Truncated VAPID key from 89 to 88 characters');
      }
      
      console.log('🔑 PushSaaS: Converting VAPID key:', base64String.substring(0, 20) + '...', 'Length:', base64String.length);
      
      // Añade padding necesario
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      
      // Cambia base64url a base64
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      console.log('🔄 PushSaaS: Converted to base64:', base64.substring(0, 20) + '...', 'Length:', base64.length);
      
      // Decodifica con atob (base64)
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      
      console.log('✅ PushSaaS: VAPID key converted successfully, array length:', outputArray.length);
      return outputArray;
    } catch (error) {
      console.error('❌ PushSaaS: Failed to convert VAPID key:', error);
      console.error('❌ PushSaaS: Original key:', base64String);
      console.error('❌ PushSaaS: Key length:', base64String.length);
      throw new Error('Invalid VAPID key format: ' + error.message);
    }
  }

  // Subscribe to push notifications
  async function subscribeToPush() {
    try {
      if (!vapidPublicKey) {
        throw new Error('VAPID key is missing — did initialization complete?');
      }
      
      if (!serviceWorkerRegistration) {
        throw new Error('Service Worker not registered — check if service-worker.js exists');
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

  // Create beautiful Tailwind CSS notification popup
  function createNotificationPopup() {
    // Check if popup already exists
    if (document.getElementById('pushsaas-popup')) {
      return;
    }

    // Create popup HTML with Tailwind CSS
    const popupHTML = `
      <div id="pushsaas-popup" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md mx-4 overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100">
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <div class="flex items-center">
              <div class="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zm6 10V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2z"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-white font-bold text-lg">Notificaciones Push</h3>
                <p class="text-blue-100 text-sm">Mantente al día con nuestras novedades</p>
              </div>
            </div>
          </div>
          
          <!-- Content -->
          <div class="px-6 py-6">
            <p class="text-gray-700 mb-4 leading-relaxed">
              🔔 <strong>¿Te gustaría recibir notificaciones?</strong><br>
              Te enviaremos actualizaciones importantes y contenido relevante directamente a tu navegador.
            </p>
            
            <div class="flex items-center text-sm text-gray-500 mb-6">
              <svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              Sin spam • Puedes cancelar en cualquier momento
            </div>
            
            <!-- Buttons -->
            <div class="flex space-x-3">
              <button id="pushsaas-allow" class="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
                ✅ Permitir
              </button>
              <button id="pushsaas-deny" class="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transform hover:scale-105 transition-all duration-200">
                ❌ Ahora no
              </button>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="bg-gray-50 px-6 py-3 text-center">
            <p class="text-xs text-gray-500">Powered by PushSaaS</p>
          </div>
        </div>
      </div>
    `;

    // Add Tailwind CSS if not present
    if (!document.querySelector('script[src*="tailwindcss"]') && !document.querySelector('link[href*="tailwind"]')) {
      const tailwindScript = document.createElement('script');
      tailwindScript.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(tailwindScript);
    }

    // Insert popup into DOM
    document.body.insertAdjacentHTML('beforeend', popupHTML);

    // Add event listeners
    const popup = document.getElementById('pushsaas-popup');
    const allowBtn = document.getElementById('pushsaas-allow');
    const denyBtn = document.getElementById('pushsaas-deny');

    // Allow button
    allowBtn.addEventListener('click', async () => {
      console.log('✅ PushSaaS: User clicked Allow');
      
      // First, request native browser permission
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          popup.remove();
          console.log('🎉 PushSaaS: Native permission granted, proceeding with subscription');
          await window.PushSaaS.subscribe();
        } else {
          popup.remove();
          console.log('❌ PushSaaS: Native permission denied by user');
          alert('❌ Para recibir notificaciones, necesitas permitir las notificaciones en tu navegador.');
        }
      } catch (error) {
        popup.remove();
        console.error('❌ PushSaaS: Error requesting native permission:', error);
        alert('❌ Error al solicitar permisos de notificación.');
      }
    });

    // Deny button
    denyBtn.addEventListener('click', () => {
      popup.remove();
      console.log('❌ PushSaaS: User clicked Deny');
    });

    // Close on background click
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        popup.remove();
        console.log('❌ PushSaaS: Popup closed by background click');
      }
    });

    // Auto-close after 30 seconds
    setTimeout(() => {
      if (document.getElementById('pushsaas-popup')) {
        popup.remove();
        console.log('⏰ PushSaaS: Popup auto-closed after timeout');
      }
    }, 30000);
  }

  // Auto-prompt after delay (configurable) - NATIVE POPUP
  const autoPromptDelay = parseInt(scriptTag.getAttribute('data-auto-prompt') || '5000');
  if (autoPromptDelay > 0) {
    setTimeout(async () => {
      if (isInitialized && Notification.permission === 'default') {
        console.log('🔔 PushSaaS: Showing native popup');
        await window.PushSaaS.subscribe();
      } else if (isInitialized && Notification.permission === 'granted') {
        console.log('✅ PushSaaS: Permission already granted, subscribing automatically');
        await window.PushSaaS.subscribe();
      }
    }, autoPromptDelay);
  }

})();
