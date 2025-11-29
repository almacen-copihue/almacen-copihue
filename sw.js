// sw.js - Service Worker CON DIAGNÓSTICO
const CACHE_NAME = 'almacen-copihue-v2.1';
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
  console.log('🚀 Service Worker instalado para Almacén Copihue');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache abierto - Almacenando archivos esenciales');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Todos los archivos esenciales cacheados');
        return self.skipWaiting();
      })
      .catch(error => {
        console.log('⚠️ Algunos archivos no se pudieron cachear:', error);
        return self.skipWaiting();
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch events - CON DIAGNÓSTICO DETALLADO
self.addEventListener('fetch', event => {
  const url = event.request.url;
  const fileName = url.split('/').pop(); // Extrae el nombre del archivo
  
  // NUNCA cachear datos dinámicos
  if (url.includes('docs.google.com') || 
      url.includes('api.allorigins.win') ||
      url.includes('/gviz/tq') ||
      url.includes('wa.me')) {
    console.log('📊 Fetch DIRECTO (sin cache):', fileName || 'Google Sheets');
    return fetch(event.request);
  }

  // PARA IMÁGENES - Estrategia Cache First con diagnóstico
  if (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            console.log('📸 IMAGEN desde CACHE:', fileName, '✅');
            return response;
          }
          
          console.log('📸 IMAGEN descargando:', fileName, '⬇️');
          return fetch(event.request)
            .then(fetchResponse => {
              if (fetchResponse && fetchResponse.status === 200) {
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                    console.log('📸 IMAGEN guardada en cache:', fileName, '💾');
                  });
              }
              return fetchResponse;
            })
            .catch(error => {
              console.log('❌ Error cargando imagen:', fileName, error);
              return caches.match('./icon-192x192.png');
            });
        })
    );
    return;
  }

  // Para otros archivos (HTML, CSS, JS)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(fetchResponse => {
            if (fetchResponse && fetchResponse.status === 200) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return fetchResponse;
          })
          .catch(() => {
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
