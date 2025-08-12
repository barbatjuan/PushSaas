// Service Worker para NotiFly
// Maneja notificaciones push y funcionalidad PWA

const CACHE_NAME = 'pushsaas-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  // Skip cache.addAll for now to avoid installation failures
  event.waitUntil(Promise.resolve());
  // Forzar activación inmediata
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Tomar control inmediato de todas las páginas
  self.clients.claim();
});

// Interceptar requests de red
self.addEventListener('fetch', (event) => {
  // Solo cachear requests GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Evitar interceptar peticiones de terceros
  try {
    const url = new URL(event.request.url);
    // Si no es mismo origen, dejar que el navegador maneje la request
    if (url.origin !== self.location.origin) {
      return;
    }
    // Añade aquí exclusiones específicas si fuese necesario
  } catch (e) {
    // Si falla el parseo de URL, no interceptar
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devolver desde cache si está disponible
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// MANEJO DE NOTIFICACIONES PUSH
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
      console.log('[SW] Push data:', notificationData);
    }
  } catch (e) {
    console.log('[SW] Error parsing push data:', e);
    notificationData = {
      title: 'Nueva notificación',
      body: 'Tienes una nueva notificación de NotiFly',
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    };
  }

  const title = notificationData.title || 'NotiFly';
  const options = {
    body: notificationData.body || 'Nueva notificación disponible',
    icon: notificationData.icon || '/icon-192.png',
    badge: notificationData.badge || '/icon-192.png',
    image: notificationData.image,
    data: {
      url: notificationData.url || '/',
      timestamp: Date.now(),
      ...notificationData.data
    },
    actions: notificationData.actions || [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ],
    tag: notificationData.tag || 'pushsaas-notification',
    renotify: true,
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  console.log('[SW] Showing notification:', title, options);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('[SW] Notification shown successfully');
        // Registrar que la notificación fue mostrada
        return fetch('/api/notifications/delivered', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            notificationId: notificationData.id,
            timestamp: Date.now()
          })
        }).catch(err => console.log('[SW] Error reporting delivery:', err));
      })
      .catch(err => {
        console.error('[SW] Error showing notification:', err);
      })
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Cerrar la notificación
  notification.close();

  if (action === 'close') {
    return;
  }

  // URL a abrir
  const urlToOpen = data.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Buscar si ya hay una ventana abierta
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          console.log('[SW] Focusing existing window');
          return client.focus().then(() => {
            // Navegar a la URL específica si es diferente
            if (urlToOpen !== '/') {
              return client.navigate(urlToOpen);
            }
          });
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      console.log('[SW] Opening new window:', urlToOpen);
      return clients.openWindow(urlToOpen);
    }).then(() => {
      // Registrar el clic
      return fetch('/api/notifications/clicked', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationId: data.id,
          action: action,
          timestamp: Date.now()
        })
      }).catch(err => console.log('[SW] Error reporting click:', err));
    })
  );
});

// Manejo de cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  
  const notification = event.notification;
  const data = notification.data || {};

  // Registrar el cierre
  event.waitUntil(
    fetch('/api/notifications/closed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notificationId: data.id,
        timestamp: Date.now()
      })
    }).catch(err => console.log('[SW] Error reporting close:', err))
  );
});

// Manejo de sincronización en segundo plano
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aquí puedes implementar lógica de sincronización
      console.log('[SW] Performing background sync')
    );
  }
});

// Manejo de mensajes desde la aplicación principal
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service Worker loaded successfully');
