const CACHE_NAME = 'almacen-copihue-v1.3';
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
  console.log('Service Worker instalado para Almacén Copihue');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch events - Estrategia Cache First con fallback a red
self.addEventListener('fetch', event => {
  // Evitar cachear requests a APIs externas (datos dinámicos)
  if (event.request.url.includes('docs.google.com') || 
      event.request.url.includes('api.allorigins.win') ||
      event.request.url.includes('wa.me')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si existe en cache, devolverlo
        if (response) {
          return response;
        }

        // Si no está en cache, buscar en red
        return fetch(event.request)
          .then(fetchResponse => {
            // Verificar si la respuesta es válida
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // Clonar la respuesta para cachearla
            const responseToCache = fetchResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          })
          .catch(() => {
            // Fallback para páginas HTML
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            // Fallback para imágenes
            if (event.request.destination === 'image') {
              return caches.match('./icon-192x192.png');
            }
          });
      })
  );
});