const CACHE_NAME = 'music-discovery-cache-v1';
const STATIC_CACHE = 'music-discovery-static-v1';
const DYNAMIC_CACHE = 'music-discovery-dynamic-v1';

// Archivos estáticos a cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Máximo de tracks a cachear
const MAX_CACHED_TRACKS = 50;

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error);
      })
  );
  
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  
  self.clients.claim();
});

// Fetch event - Interceptar peticiones
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // No cachear peticiones de Spotify API
  if (url.hostname.includes('spotify.com') || url.hostname.includes('scdn.co')) {
    return;
  }
  
  // Estrategia de caché para diferentes tipos de recursos
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          // Si está en caché, devolverlo
          if (cachedResponse) {
            console.log('Service Worker: Serving from cache', request.url);
            return cachedResponse;
          }
          
          // Si no está en caché, hacer fetch y cachear
          return fetch(request)
            .then((response) => {
              // No cachear respuestas de error
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Cachear respuesta exitosa
              const responseToCache = response.clone();
              
              // Decidir en qué caché guardar
              if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseToCache);
                  });
              } else {
                // Para contenido dinámico (como datos de música)
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    // Limitar el tamaño del caché dinámico
                    trimCache(cache, MAX_CACHED_TRACKS);
                    cache.put(request, responseToCache);
                  });
              }
              
              return response;
            })
            .catch((error) => {
              console.error('Service Worker: Fetch failed', error);
              
              // Si es una navegación y falla, mostrar página offline
              if (request.mode === 'navigate') {
                return caches.match('/index.html');
              }
            });
        })
    );
  }
});

// Función para limitar el tamaño del caché
function trimCache(cache, maxItems) {
  cache.keys()
    .then((keys) => {
      if (keys.length > maxItems) {
        // Eliminar las entradas más antiguas
        const deleteKeys = keys.slice(0, keys.length - maxItems);
        return Promise.all(
          deleteKeys.map((key) => cache.delete(key))
        );
      }
    });
}

// Manejo de mensajes desde la aplicación
self.addEventListener('message', (event) => {
  console.log('Service Worker: Received message', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_TRACK') {
    // Cachear una pista específica
    const { url, response } = event.data;
    caches.open(DYNAMIC_CACHE)
      .then((cache) => {
        cache.put(url, response);
      });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    // Limpiar caché dinámico
    caches.delete(DYNAMIC_CACHE);
  }
});

// Sincronización en segundo plano (para cuando haya conexión)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync-music') {
    event.waitUntil(
      // Aquí podríamos sincronizar datos de música
      console.log('Service Worker: Performing background sync')
    );
  }
});

// Notificaciones push (para futuras características)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  
  const options = {
    body: '¡Tienes nuevas recomendaciones de música!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explorar',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icon-192.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title || 'Descubre Música', options);
  } else {
    self.registration.showNotification('Descubre Música', options);
  }
});