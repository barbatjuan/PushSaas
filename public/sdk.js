/**
 * NotiFly SDK - Native Web Push API Implementation
 * No external dependencies - Pure Web Push API + VAPID
 */
(function() {
  'use strict';

  // Get the site ID from multiple sources
  const scriptTag = document.currentScript || document.querySelector('script[data-site]');
  let siteId = scriptTag ? scriptTag.getAttribute('data-site') : null;
  
  // If not found in script tag, try global variable (WordPress plugin)
  if (!siteId && window.NOTIFLY_SITE_ID) {
    siteId = window.NOTIFLY_SITE_ID;
    console.log('🔧 NotiFly: Using Site ID from global variable');
  }
  
  const apiBase = (scriptTag ? scriptTag.getAttribute('data-api') : null) || 
                  window.NOTIFLY_API_BASE || 
                  'https://www.adioswifi.es';
  
  // Force correct site ID for webcoders.es (temporary fix)
  if (window.location.hostname === 'webcoders.es' || siteId === '34c91fe84b42') {
    siteId = 'c670c8bcd133';
    console.log('🔧 NotiFly: Corrected site ID for webcoders.es');
  }
  
  if (!siteId) {
    console.error('NotiFly SDK: Site ID is required. Use data-site attribute or set window.NOTIFLY_SITE_ID');
    return;
  }

  console.log('🚀 NotiFly SDK: Initializing for site:', siteId);
  
  // Enhanced device detection - Support ALL devices
  const isAndroid = /Android/.test(navigator.userAgent);
  const isDesktop = !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isMobile = !isDesktop;
  
  // Better PWA detection for all devices
  const isInStandaloneMode = window.navigator.standalone === true || 
                            window.matchMedia('(display-mode: standalone)').matches ||
                            (window.navigator.standalone !== false && window.outerHeight === window.innerHeight);
  
  // Check Notification API availability
  const hasNotificationAPI = 'Notification' in window && typeof Notification.requestPermission === 'function';
  const notificationPermission = hasNotificationAPI ? Notification.permission : 'no-api';
  
  console.log(`📱 NotiFly Debug: Android: ${isAndroid} | Desktop: ${isDesktop} | Mobile: ${isMobile} | PWA: ${isInStandaloneMode} | Perm: ${notificationPermission}`);
  
  // Check if notifications are supported
  if (!hasNotificationAPI) {
    console.log('❌ NotiFly: Notification API not supported in this browser');
    showDebugAlert('❌ Tu navegador no soporta notificaciones push', 5000);
    return;
  }
  
  console.log('✅ NotiFly: Notification API available, proceeding with initialization');

  // State
  let isInitialized = false;
  let vapidPublicKey = null;
  let serviceWorkerRegistration = null;
  let pushSubscription = null;

  // Visual debug function for iPhone (no console access)
  function showDebugAlert(message, duration = 3000) {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      font-weight: bold;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 90%;
      text-align: center;
    `;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, duration);
  }

  // Android PWA Detection and Prompt Functions
  function shouldShowAndroidPWAPrompt() {
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    
    console.log('🤖 NotiFly Android PWA Check:', { isAndroid, isChrome, isInStandaloneMode });
    
    return isAndroid && isChrome && !isInStandaloneMode;
  }

  function createAndroidPWAPrompt() {
    // Check if user has already dismissed the PWA prompt
    const pwaPromptDismissed = localStorage.getItem('pushsaas-android-pwa-dismissed');
    if (pwaPromptDismissed) {
      console.log('🤖 NotiFly: Android PWA prompt previously dismissed');
      return false;
    }

    const promptHTML = `
      <div id="pushsaas-android-pwa-prompt" style="
        position: fixed;
        inset: auto 16px calc(16px + env(safe-area-inset-bottom)) 16px;
        z-index: 999999;
        display: flex;
        justify-content: center;
        pointer-events: none;
      ">
        <div role="dialog" aria-live="polite" aria-label="Instalar aplicación" style="
          width: min(520px, 100%);
          background: #0b1220;
          color: #e6e8eb;
          border: 1px solid rgba(230,232,235,0.12);
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.25);
          padding: 14px 16px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: center;
          transform: translateY(16px);
          opacity: 0;
          transition: transform .25s ease, opacity .25s ease;
          pointer-events: auto;
        ">
          <img src="/notifly/icon-192.png" alt="App icon" width="36" height="36" style="border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.25);" />
          <div style="display:flex; flex-direction:column; gap:4px;">
            <div style="font-size: 15px; font-weight: 700; letter-spacing: .2px;">Instala esta app</div>
            <div style="font-size: 13px; color: #9aa4af;">Acceso rápido y notificaciones push nativas</div>
          </div>
          <button id="pushsaas-android-close" aria-label="Cerrar" style="
            appearance: none; background: transparent; border: 0; color: #9aa4af;
            width: 32px; height: 32px; border-radius: 8px; display:grid; place-items:center;
          ">✕</button>
          <div style="grid-column: 1 / -1; display:flex; gap:10px; justify-content:flex-end; margin-top: 4px;">
            <button id="pushsaas-android-install" style="
              appearance: none; border: 0; background: #16a34a; color: white;
              padding: 10px 14px; border-radius: 10px; font-weight: 700; font-size: 14px;
              box-shadow: 0 8px 20px rgba(22,163,74,0.35);
            ">Instalar</button>
            <button id="pushsaas-android-later" style="
              appearance: none; background: transparent; border: 1px solid rgba(230,232,235,0.18);
              color: #c4c9cf; padding: 9px 12px; border-radius: 10px; font-weight: 600; font-size: 13px;
            ">Más tarde</button>
            <button id="pushsaas-android-dismiss" style="
              appearance: none; background: transparent; border: 0; color: #7a838d; font-size: 12px;
            ">No mostrar</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', promptHTML);
    
    const prompt = document.getElementById('pushsaas-android-pwa-prompt');
    const dialog = prompt.firstElementChild;
    const installBtn = document.getElementById('pushsaas-android-install');
    const laterBtn = document.getElementById('pushsaas-android-later');
    const dismissBtn = document.getElementById('pushsaas-android-dismiss');
    const closeBtn = document.getElementById('pushsaas-android-close');
    
    // Show prompt with animation
    requestAnimationFrame(() => {
      dialog.style.transform = 'translateY(0)';
      dialog.style.opacity = '1';
    });
    
    // Store the beforeinstallprompt event
    let deferredPrompt = null;
    
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('🤖 PushSaaS: beforeinstallprompt event fired');
      e.preventDefault();
      deferredPrompt = e;
      
      // Update install button to show it's ready
      installBtn.textContent = 'Instalar ahora';
      installBtn.style.background = '#22c55e';
    }, { once: true });
    
    function hidePrompt(persist = false) {
      dialog.style.transform = 'translateY(16px)';
      dialog.style.opacity = '0';
      setTimeout(() => {
        prompt.remove();
      }, 250);
      if (persist) {
        localStorage.setItem('pushsaas-android-pwa-dismissed', 'true');
      }
    }
    
    // Event handlers
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        console.log('🤖 PushSaaS: Showing install prompt');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`🤖 PushSaaS: User choice: ${outcome}`);
        deferredPrompt = null;
      } else {
        alert('📱 Para instalar:\n\n1. Toca el menú de Chrome (⋮)\n2. Selecciona "Añadir a pantalla de inicio"\n3. Confirma la instalación');
      }
      hidePrompt(false);
    });
    
    laterBtn.addEventListener('click', () => {
      console.log('🤖 PushSaaS: User chose "later" for PWA install');
      hidePrompt(false);
    });
    
    dismissBtn.addEventListener('click', () => {
      console.log('🤖 PushSaaS: User dismissed Android PWA prompt permanently');
      hidePrompt(true);
    });
    
    closeBtn.addEventListener('click', () => hidePrompt(false));
    
    // Auto-hide after 15 seconds
    setTimeout(() => {
      if (document.getElementById('pushsaas-android-pwa-prompt')) {
        console.log('🤖 PushSaaS: Android PWA prompt auto-hidden after 15s');
        hidePrompt(false);
      }
    }, 15000);
    
    console.log('🤖 PushSaaS: Android PWA installation prompt shown');
    return true;
  }

  // Create notification activation button for iOS PWA mode
  function createNotificationActivationButton() {
    // Check if button already exists
    if (document.getElementById('pushsaas-notification-button')) {
      return;
    }

    const buttonHTML = `
      <div id="pushsaas-notification-button" style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      ">
        <button id="pushsaas-activate-notifications" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          🔔 Activar Notificaciones
        </button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', buttonHTML);
    
    const button = document.getElementById('pushsaas-activate-notifications');
    
    // Add hover effect
    button.addEventListener('mousedown', () => {
      button.style.transform = 'scale(0.95)';
    });
    
    button.addEventListener('mouseup', () => {
      button.style.transform = 'scale(1)';
    });
    
    // Main click handler - THIS IS THE USER GESTURE iOS REQUIRES
    button.addEventListener('click', async () => {
      console.log('🔔 PushSaaS: User clicked notification activation button');
      showDebugAlert('🔔 Requesting notification permission...', 2000);
      
      try {
        // Request permission with user gesture
        const permission = await Notification.requestPermission();
        console.log('🔔 PushSaaS: Permission result:', permission);
        
        if (permission === 'granted') {
          showDebugAlert('✅ Permission granted! Setting up notifications...', 3000);
          
          // Remove the button
          document.getElementById('pushsaas-notification-button').remove();
          
          // Subscribe to push notifications
          setTimeout(async () => {
            const success = await window.PushSaaS.subscribe();
            if (success) {
              showDebugAlert('🎉 Notifications activated successfully!', 4000);
            } else {
              showDebugAlert('❌ Failed to activate notifications', 3000);
            }
          }, 500);
          
        } else {
          showDebugAlert('❌ Permission denied. You can enable it later in Settings.', 4000);
          // Keep the button visible in case user changes their mind
        }
        
      } catch (error) {
        console.error('❌ PushSaaS: Error requesting permission:', error);
        showDebugAlert('❌ Error requesting permission: ' + error.message, 4000);
      }
    });
    
    console.log('🔔 PushSaaS: Notification activation button created');
  }

  // EMERGENCY: Manual notification test button (bypasses PWA detection)
  function showEmergencyNotificationButton() {
    // Check if button already exists
    if (document.getElementById('pushsaas-emergency-button')) {
      return;
    }

    const buttonHTML = `
      <div id="pushsaas-emergency-button" style="
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      ">
        <button id="pushsaas-emergency-test" style="
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
          transition: all 0.3s ease;
        ">
          🆘 EMERGENCY: Test Notifications
        </button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', buttonHTML);
    
    const button = document.getElementById('pushsaas-emergency-test');
    
    // Emergency click handler - DIRECT NOTIFICATION TEST
    button.addEventListener('click', async () => {
      console.log('🆘 EMERGENCY: Testing notification permission directly');
      showDebugAlert('🆘 EMERGENCY: Testing notification API...', 2000);
      
      try {
        // Check if Notification API exists
        if (!('Notification' in window)) {
          showDebugAlert('❌ Notification API not available in this browser/context', 4000);
          return;
        }
        
        // Try to request permission directly
        const permission = await Notification.requestPermission();
        console.log('🆘 EMERGENCY: Permission result:', permission);
        
        if (permission === 'granted') {
          showDebugAlert('✅ EMERGENCY: Permission granted! API is available!', 4000);
          
          // Try to show a test notification
          try {
            new Notification('Test from WebCoders PWA', {
              body: 'If you see this, notifications work!',
              icon: '/logoNegro.png'
            });
            showDebugAlert('🎉 EMERGENCY: Test notification sent!', 4000);
          } catch (notifError) {
            showDebugAlert('❌ Error creating notification: ' + notifError.message, 4000);
          }
          
        } else {
          showDebugAlert('❌ EMERGENCY: Permission denied: ' + permission, 4000);
        }
        
      } catch (error) {
        console.error('❌ EMERGENCY: Error:', error);
        showDebugAlert('❌ EMERGENCY: Error: ' + error.message, 4000);
      }
    });
    
    console.log('🆘 EMERGENCY: Emergency notification test button created');
  }

  // Initialize the SDK
  async function init() {
    if (isInitialized) return;
    
    try {
      // Use improved PWA detection
      const isInStandaloneMode = window.navigator.standalone === true || 
                                window.matchMedia('(display-mode: standalone)').matches ||
                                (window.navigator.standalone !== false && window.outerHeight === window.innerHeight);
      
      // Check if Notification API is available
      const hasNotificationAPI = 'Notification' in window && typeof Notification.requestPermission === 'function';
      
      // Check for Android PWA installation prompt
      if (shouldShowAndroidPWAPrompt()) {
        console.log('🤖 PushSaaS: Showing Android PWA installation prompt');
        createAndroidPWAPrompt();
        // Continue with notification setup even if PWA prompt is shown
      }
      
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
      
      // For Android and Desktop: Auto-subscribe if permission already granted
      if (Notification.permission === 'granted') {
        console.log('✅ PushSaaS: Permission already granted, auto-subscribing');
        setTimeout(async () => {
          await window.PushSaaS.subscribe();
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ PushSaaS SDK: Initialization failed:', error);
    }
  }

  // Fetch VAPID public key from backend
  async function fetchVapidKey() {
    try {
      console.log('🔑 PushSaaS: Fetching VAPID key from:', `${apiBase}/api/sites/${siteId}`);
      const response = await fetch(`${apiBase}/api/sites/${siteId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch VAPID key: ${response.status}`);
      }
      const data = await response.json();
      vapidPublicKey = data.vapidPublicKey;
      window.PushSaaS.vapidPublicKey = vapidPublicKey;
      console.log('🔑 PushSaaS: Got VAPID key:', vapidPublicKey ? vapidPublicKey.substring(0, 20) + '...' : 'MISSING');
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
      let swUrl = `/sw.js?site=${siteId}`;
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
        swUrl = `${apiBase}/sw.js?site=${siteId}`;
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
      console.log(`   1. Download: ${apiBase}/sw.js`);
      console.log('   2. Upload to your website root as: /sw.js');
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
      
      console.log('🔑 PushSaaS: Converting VAPID key:', base64String.substring(0, 20) + '...', 'Length:', base64String.length);
      
      // Verificar longitud esperada (87 caracteres para 65 bytes)
      if (base64String.length !== 87) {
        console.warn('⚠️ PushSaaS: VAPID key length is', base64String.length, 'but should be 87 characters');
      }
      
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
        throw new Error('Service Worker not registered — check if sw.js exists');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      console.log('✅ PushSaaS: Permission granted');

      // Subscribe to push manager with persistent configuration
      const subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true, // Required for persistent subscriptions
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      console.log('🔐 PushSaaS: Subscription created with endpoint:', subscription.endpoint);
      console.log('🔑 PushSaaS: Subscription keys:', {
        p256dh: subscription.keys && subscription.keys.p256dh ? 'present' : 'missing',
        auth: subscription.keys && subscription.keys.auth ? 'present' : 'missing'
      });

      pushSubscription = subscription;
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
      // Add cache-busting parameter
      const cacheBuster = Date.now();
      const url = `${apiBase}/api/subscribe?v=${cacheBuster}`;
      
      console.log('🔄 PushSaaS: Syncing subscription to:', url);
      console.log('📦 PushSaaS: Payload:', {
        siteId: siteId,
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId,
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
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

  // Function to force initialization (useful when PWA is installed)
  function forceInit() {
    console.log('🔄 PushSaaS: Force initializing after PWA installation');
    isInitialized = false;
    init();
  }

  // Check if user returned in PWA mode and auto-initialize
  function checkPWAModeAndInit() {
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    
    if (isIOS && isInStandaloneMode) {
      console.log('📱 PushSaaS: User is in PWA mode, auto-initializing push notifications');
      setTimeout(() => {
        forceInit();
      }, 1000); // Small delay to ensure DOM is ready
    }
  }

  // PWA Helper Functions
  function shouldShowPWAPrompt() {
    // Check if we're on iOS Safari (where PWA prompts are useful)
    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isSafari = /safari/.test(window.navigator.userAgent.toLowerCase()) && !/chrome/.test(window.navigator.userAgent.toLowerCase());
    const isInStandaloneMode = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    
    // Show prompt if iOS Safari and not already in PWA mode
    return isIOS && isSafari && !isInStandaloneMode;
  }
  
  function createPWAPrompt() {
    console.log('📱 PushSaaS: Creating PWA installation prompt');
    
    // Simple PWA prompt for iOS Safari
    const promptText = 'Para recibir notificaciones, instala esta app:\n\n1. Toca el botón Compartir\n2. Selecciona "Añadir a pantalla de inicio"';
    alert(promptText);
    
    return true;
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
        version: '2.1.0',
        siteId: siteId,
        apiBase: apiBase,
        isInitialized: isInitialized,
        hasVapidKey: !!vapidPublicKey,
        hasServiceWorker: !!serviceWorkerRegistration,
        isPWAMode: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
        isIOS: /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
      };
    },

    // PWA-related functions
    pwa: {
      // Check if should show PWA prompt
      shouldShowPrompt: shouldShowPWAPrompt,
      
      // Manually show PWA prompt
      showPrompt: function() {
        if (shouldShowPWAPrompt()) {
          return createPWAPrompt();
        } else {
          console.log('📱 PushSaaS: PWA prompt not needed (not iOS Safari or already in PWA mode)');
          return false;
        }
      },
      
      // Force initialization (useful after PWA installation)
      forceInit: forceInit,
      
      // Reset PWA prompt dismissal
      resetPromptDismissal: function() {
        localStorage.removeItem('pushsaas-pwa-dismissed');
        console.log('📱 PushSaaS: PWA prompt dismissal reset');
      }
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
