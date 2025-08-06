(function() {
  'use strict';

  // Get the site ID from the script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-site]');
  let siteId = scriptTag ? scriptTag.getAttribute('data-site') : null;
  
  // Debug logging
  console.log('PushSaaS Debug: Script tag found:', scriptTag);
  console.log('PushSaaS Debug: Raw siteId from attribute:', siteId);
  
  // Force correct site ID if we detect the wrong one
  if (siteId === '34c91fe84b42' || !siteId) {
    console.log('PushSaaS Debug: Forcing correct site ID');
    siteId = 'c670c8bcd133';
  }
  
  console.log('PushSaaS Debug: Final siteId being used:', siteId);
  
  if (!siteId) {
    console.error('PushSaaS SDK: data-site attribute is required');
    return;
  }

  // Configuration
  const API_BASE = scriptTag.getAttribute('data-api') || 'https://web-push-notifications-phi.vercel.app';
  const ONESIGNAL_APP_ID = null; // Will be fetched from API

  // State
  let isInitialized = false;
  let onesignalAppId = null;

  // Initialize the SDK
  async function init() {
    if (isInitialized) return;
    
    try {
      // Get site configuration from API with CORS fallback
      let config;
      try {
        const response = await fetch(`${API_BASE}/api/sites/${siteId}/config`);
        if (!response.ok) {
          throw new Error('Failed to fetch site configuration');
        }
        config = await response.json();
      } catch (corsError) {
        console.log('CORS blocked, trying alternative method...');
        // Fallback: use a different approach or show error
        throw new Error('CORS blocked: ' + corsError.message);
      }
      onesignalAppId = config.onesignal_app_id;
      
      if (!onesignalAppId) {
        console.error('PushSaaS SDK: OneSignal app ID not configured for this site');
        return;
      }

      // Initialize OneSignal
      await initOneSignal();
      
      isInitialized = true;
      console.log('PushSaaS SDK initialized successfully');
    } catch (error) {
      console.error('PushSaaS SDK initialization failed:', error);
    }
  }

  // Initialize OneSignal
  async function initOneSignal() {
    return new Promise((resolve, reject) => {
      // Check if OneSignal is already loaded to prevent double initialization
      if (window.OneSignal && typeof window.OneSignal.init === 'function') {
        console.log('PushSaaS: OneSignal already initialized');
        resolve();
        return;
      }

      // Load OneSignal SDK
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
      script.async = true;
      
      script.onload = () => {
        window.OneSignal = window.OneSignal || [];
        
        window.OneSignal.push(function() {
          window.OneSignal.init({
            appId: onesignalAppId,
            allowLocalhostAsSecureOrigin: true,
            autoRegister: false, // Don't auto-register
            notifyButton: {
              enable: false
            }
          }).then(() => {
            console.log('PushSaaS: OneSignal initialized successfully');
            
            // Handle subscription changes
            window.OneSignal.on('subscriptionChange', function(isSubscribed) {
              if (isSubscribed) {
                window.OneSignal.getUserId().then(function(userId) {
                  if (userId) {
                    registerSubscriber(userId);
                  }
                });
              }
            });
            
            resolve();
          }).catch((error) => {
            console.error('PushSaaS: OneSignal init failed:', error);
            reject(error);
          });
        });
      };

      script.onerror = () => reject(new Error('Failed to load OneSignal SDK'));
      document.head.appendChild(script);
    });
  }

  // Register subscriber with our API
  async function registerSubscriber(token) {
    try {
      const response = await fetch(`${API_BASE}/api/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_id: siteId,
          token: token,
          user_agent: navigator.userAgent,
          url: window.location.href
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register subscriber');
      }

      console.log('PushSaaS: Subscriber registered successfully');
    } catch (error) {
      console.error('PushSaaS: Failed to register subscriber:', error);
    }
  }

  // Public API
  window.PushSaaS = {
    // Request permission and subscribe
    subscribe: async function() {
      if (!isInitialized) {
        console.error('PushSaaS SDK not initialized');
        return false;
      }

      try {
        // Use correct OneSignal API for requesting permission
        if (window.OneSignal.showNativePrompt) {
          await window.OneSignal.showNativePrompt();
          console.log('PushSaaS: Native prompt shown');
          return true;
        } else if (window.OneSignal.registerForPushNotifications) {
          await window.OneSignal.registerForPushNotifications();
          console.log('PushSaaS: Registered for push notifications');
          return true;
        } else {
          // Fallback to browser native API
          const permission = await Notification.requestPermission();
          console.log('PushSaaS: Browser permission result:', permission);
          return permission === 'granted';
        }
      } catch (error) {
        console.error('PushSaaS: Subscription failed:', error);
        // Final fallback to browser native API
        try {
          const permission = await Notification.requestPermission();
          console.log('PushSaaS: Fallback permission result:', permission);
          return permission === 'granted';
        } catch (fallbackError) {
          console.error('PushSaaS: All methods failed:', fallbackError);
        }
        return false;
      }
    },

    // Check if user is subscribed
    isSubscribed: async function() {
      if (!isInitialized) return false;
      
      try {
        // Use correct OneSignal API methods
        if (window.OneSignal.isPushNotificationsEnabled) {
          return await window.OneSignal.isPushNotificationsEnabled();
        } else if (window.OneSignal.isSubscribed) {
          return await window.OneSignal.isSubscribed();
        } else {
          // Fallback to browser permission check
          return Notification.permission === 'granted';
        }
      } catch (error) {
        console.error('PushSaaS: Failed to check subscription status:', error);
        // Fallback to browser permission check
        return Notification.permission === 'granted';
      }
    },

    // Get subscription status
    getSubscriptionStatus: async function() {
      if (!isInitialized) return null;
      
      try {
        const isSubscribed = await window.OneSignal.isSubscribed();
        const userId = isSubscribed ? await window.OneSignal.getUserId() : null;
        
        return {
          isSubscribed,
          userId,
          permission: Notification.permission
        };
      } catch (error) {
        console.error('PushSaaS: Failed to get subscription status:', error);
        return null;
      }
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Show subscription prompt after a delay (optional)
  setTimeout(() => {
    if (isInitialized && Notification.permission === 'default') {
      // You can customize this behavior
      console.log('PushSaaS: Ready to show subscription prompt');
      
      // Auto-prompt after 5 seconds
      window.PushSaaS.subscribe();
    }
  }, 5000);

})();
