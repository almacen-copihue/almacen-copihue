// sw.js - Service Worker para Almacén Copihue (FIX ofertas dinámicas)
const CACHE_NAME = 'almacen-copihue-pwa-v2';
const APP_VERSION = '2.1';

const CRITICAL_ASSETS = [
  './manifest.json',
  './sw.js'
];

// ================== INSTALACIÓN ==================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CRITICAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ================== ACTIVACIÓN ==================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ================== FETCH ==================
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // 🚫 1) NUNCA cachear HTML (soluciona ofertas y precios viejos)
  if (request.destination === 'document') {
    return event.respondWith(fetch(request));
  }

  // 🚫 2) NUNCA cachear datos dinámicos externos (Google Sheets, APIs)
  const DYNAMIC_URLS = [
    'docs.google.com',
    'spreadsheets',
    'gviz/tq',
    'script.google.com',
    'corsproxy.io',
    'allorigins'
  ];

  if (DYNAMIC_URLS.some(d => url.href.includes(d))) {
    return event.respondWith(fetch(request));
  }

  // 🚫 3) NO cachear imágenes de productos/ofertas
  if (url.pathname.startsWith('/imagenes-productos/')) {
    return event.respondWith(fetch(request));
  }

  // ✅ 4) Cache First SOLO para assets estáticos
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
          if (
            response.ok &&
            request.method === 'GET' &&
            ['style', 'script', 'image', 'font'].includes(request.destination)
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});

// ================== MENSAJES ==================
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

console.log(`✅ SW Almacén Copihue v${APP_VERSION} activo`);
