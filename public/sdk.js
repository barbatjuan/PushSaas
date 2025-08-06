(function() {
  'use strict';

  // Get the site ID from the script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-site]');
  const siteId = scriptTag ? scriptTag.getAttribute('data-site') : null;
  
  if (!siteId) {
    console.error('PushSaaS SDK: data-site attribute is required');
    return;
  }

  // Configuration
  const API_BASE = scriptTag.getAttribute('data-api') || 'http://localhost:3000';
  const ONESIGNAL_APP_ID = null; // Will be fetched from API

  // State
  let isInitialized = false;
  let onesignalAppId = null;

  // Initialize the SDK
  async function init() {
    if (isInitialized) return;
    
    try {
      // Get site configuration from API
      const response = await fetch(`${API_BASE}/api/sites/${siteId}/config`);
      if (!response.ok) {
        throw new Error('Failed to fetch site configuration');
      }
      
      const config = await response.json();
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
            notifyButton: {
              enable: false // We'll handle the subscription prompt ourselves
            }
          });

          // Handle subscription changes
          window.OneSignal.on('subscriptionChange', function(isSubscribed) {
            if (isSubscribed) {
              // Get the subscription token and send to our API
              window.OneSignal.getUserId().then(function(userId) {
                if (userId) {
                  registerSubscriber(userId);
                }
              });
            }
          });

          resolve();
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
        const permission = await window.OneSignal.requestPermission();
        return permission;
      } catch (error) {
        console.error('PushSaaS: Subscription failed:', error);
        return false;
      }
    },

    // Check if user is subscribed
    isSubscribed: async function() {
      if (!isInitialized) return false;
      
      try {
        return await window.OneSignal.isSubscribed();
      } catch (error) {
        console.error('PushSaaS: Failed to check subscription status:', error);
        return false;
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
