// sw.js - Service Worker CORREGIDO VAO
const CACHE_NAME = 'almacen-copihue-pwa-v3'; // Cambia la versión

// ================== INSTALACIÓN ==================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Solo cachear assets estáticos CRÍTICOS
      return cache.addAll([
        './index.html',
        './manifest.json',
        // Añade aquí otros assets realmente estáticos
      ]);
    }).then(() => self.skipWaiting())
  );
});

// ================== ACTIVACIÓN ==================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => {
      // Limpiar completamente el caché antiguo
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'CACHE_CLEARED', version: 'v3' });
        });
      });
    }).then(() => self.clients.claim())
  );
});

// ================== FETCH - ESTRATEGIA "NETWORK FIRST" ==================
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // 🚫 NUNCA cachear archivos dinámicos
  const NO_CACHE_PATHS = [
    '/imagenes-productos/',
    'docs.google.com',
    'spreadsheets',
    'corsproxy.io',
    'googleapis.com'
  ];
  
  // Si es una URL que NO debe cachearse
  if (NO_CACHE_PATHS.some(path => url.href.includes(path))) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Para todo lo demás, usar Network First
  event.respondWith(
    fetch(request)
      .then(response => {
        // Solo cachear si es exitoso y no es HTML dinámico
        if (response.ok && request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si no hay conexión, buscar en cache
        return caches.match(request);
      })
  );
});

console.log('✅ Service Worker v3 activado - Modo Network First');
