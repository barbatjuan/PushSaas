(function() {
  'use strict';
  
  console.log('🚀 NotiFly SDK (No Service Worker) Loading...');
  
  // Configuration
  const API_BASE_URL = 'https://web-push-notifications-phi.vercel.app/api';
  
  // Device detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  const notificationPermission = typeof Notification !== 'undefined' ? Notification.permission : 'no-api';
  
  console.log(`📱 Device Info: iOS=${isIOS}, PWA=${isInStandaloneMode}, NotificationAPI=${typeof Notification !== 'undefined'}`);
  
  // Show debug info immediately
  setTimeout(() => {
    showDebugAlert(`📱 iOS: ${isIOS} | PWA: ${isInStandaloneMode} | Perm: ${notificationPermission} | NO-SW`, 8000);
    
    // Show test button for iOS
    if (isIOS) {
      setTimeout(() => {
        showDirectNotificationTest();
      }, 2000);
    }
  }, 100);
  
  // Visual debug function
  function showDebugAlert(message, duration = 5000) {
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
      font-size: 14px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 90vw;
      text-align: center;
    `;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, duration);
  }
  
  // Direct notification test without service worker
  function showDirectNotificationTest() {
    const button = document.createElement('button');
    button.style.cssText = `
      position: fixed;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      background: #FF5722;
      color: white;
      border: none;
      padding: 15px 25px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    button.textContent = '🧪 DIRECT TEST (No SW)';
    
    button.onclick = async function() {
      try {
        showDebugAlert('🧪 Testing direct notification...', 3000);
        
        // Check if Notification API is available
        if (typeof Notification === 'undefined') {
          showDebugAlert('❌ Notification API not available', 5000);
          return;
        }
        
        // Request permission
        const permission = await Notification.requestPermission();
        showDebugAlert(`🔔 Permission: ${permission}`, 3000);
        
        if (permission === 'granted') {
          // Show a test notification
          const notification = new Notification('🎉 Test Successful!', {
            body: 'Direct notification works without service worker!',
            icon: '/icon-192.png'
          });
          
          showDebugAlert('✅ Direct notification sent!', 5000);
        } else {
          showDebugAlert(`❌ Permission denied: ${permission}`, 5000);
        }
        
      } catch (error) {
        showDebugAlert(`❌ Error: ${error.message}`, 5000);
        console.error('Direct notification test error:', error);
      }
    };
    
    document.body.appendChild(button);
  }
  
  // Show PWA installation prompt for iOS Safari (not in standalone)
  if (isIOS && !isInStandaloneMode) {
    setTimeout(() => {
      createPWAPrompt();
    }, 1000);
  }
  
  function createPWAPrompt() {
    const promptDiv = document.createElement('div');
    promptDiv.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
      z-index: 10000;
      box-shadow: 0 -4px 12px rgba(0,0,0,0.3);
    `;
    
    promptDiv.innerHTML = `
      <div style="margin-bottom: 15px; font-size: 18px; font-weight: bold;">📱 Instalar WebCoders como App</div>
      <div style="margin-bottom: 15px; font-size: 14px; opacity: 0.9;">Para recibir notificaciones push, instala esta página como aplicación</div>
      <div style="margin-bottom: 15px; font-size: 14px;">Toca <strong>Compartir</strong> → <strong>Agregar a pantalla de inicio</strong></div>
      <button onclick="this.parentElement.remove()" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 10px 20px; border-radius: 20px; margin-right: 10px;">Entendido</button>
      <button onclick="this.parentElement.remove()" style="background: rgba(255,255,255,0.9); color: #667eea; border: none; padding: 10px 20px; border-radius: 20px; font-weight: bold;">Cerrar</button>
    `;
    
    document.body.appendChild(promptDiv);
  }
  
  console.log('✅ NotiFly SDK (No Service Worker) Loaded');
})();
