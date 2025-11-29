// sw.js - VERSIÓN FINAL OPTIMIZADA
const CACHE_NAME = 'almacen-copihue-v2.2';
const urlsToCache = [
  './',
  './index.html', 
  './manifest.json',
  './sw.js',
  './icon-192x192.png',
  './icon-512x512.png',
  './Square44x44Logo.scale-100.png',
  './Square150x150Logo.scale-100.png',
  './StoreLogo.scale-100.png'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activar Service Worker  
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch events - Estrategia optimizada
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // Nunca cachear datos dinámicos
  if (url.includes('docs.google.com') || url.includes('api.allorigins.win')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache First para archivos estáticos
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(fetchResponse => {
            if (fetchResponse && fetchResponse.status === 200) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));
            }
            return fetchResponse;
          })
          .catch(() => {
            // Fallbacks
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            if (event.request.destination === 'image') {
              return caches.match('./icon-192x192.png');
            }
          });
      })
  );
});
