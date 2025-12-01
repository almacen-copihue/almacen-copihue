// sw.js - Service Worker MEJORADO para Almacén Copihue
const CACHE_NAME = 'almacen-copihue-v2.0';
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
        // Aunque falle algún archivo, continuamos
        return self.skipWaiting();
      })
  );
});

// Activar Service Worker - Limpiar caches viejos
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activado - Limpiando caches viejos');
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
    }).then(() => {
      console.log('✅ Limpieza de cache completada');
      return self.clients.claim();
    })
  );
});

// Fetch events - Estrategia MEJORADA
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // 🔥 NUNCA cachear datos dinámicos de Google Sheets
  if (url.includes('docs.google.com') || 
      url.includes('api.allorigins.win') ||
      url.includes('/gviz/tq') ||
      url.includes('spreadsheets/d/') ||
      url.includes('wa.me')) {
    console.log('📊 Fetch directo (sin cache) para:', new URL(url).pathname);
    return fetch(event.request);
  }

  // Para archivos estáticos, usar estrategia Cache First
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si existe en cache, devolverlo (solo para archivos estáticos)
        if (response) {
          console.log('💾 Sirviendo desde cache:', new URL(url).pathname);
          return response;
        }

        // Si no está en cache, buscar en red
        return fetch(event.request)
          .then(fetchResponse => {
            // Verificar si la respuesta es válida para cachear
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // Solo cachear archivos locales (no externos)
            if (url.startsWith(self.location.origin)) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                  console.log('➕ Nuevo archivo cacheado:', new URL(url).pathname);
                });
            }

            return fetchResponse;
          })
          .catch(error => {
            console.log('❌ Error en fetch:', error);
            
            // Fallback para páginas HTML
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            // Fallback para imágenes
            if (event.request.destination === 'image') {
              return caches.match('./icon-192x192.png');
            }
            
            // Para otros tipos, devolver error controlado
            return new Response('Recurso no disponible offline', {
              status: 408,
              statusText: 'Offline'
            });
          });
      })
  );
});

// Mensaje para forzar actualización de cache
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});