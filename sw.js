// sw.js - Service Worker para Almacén Copihue con PWA Builder
const CACHE_NAME = 'almacen-copihue-pwa-v1';
const APP_VERSION = '2.0';

// ARCHIVOS CRÍTICOS - Rutas REALES según tu estructura
const CRITICAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

// ICONOS ANDROID - Rutas REALES
const ANDROID_ICONS = [
  './iconos-pwa/android/android-launchericon-48-48.png',
  './iconos-pwa/android/android-launchericon-72-72.png',
  './iconos-pwa/android/android-launchericon-96-96.png',
  './iconos-pwa/android/android-launchericon-144-144.png',
  './iconos-pwa/android/android-launchericon-192-192.png',
  './iconos-pwa/android/android-launchericon-512-512.png'
];

// ICONOS iOS - Para iPhone
const IOS_ICONS = [
  './iconos-pwa/ios/180.png',
  './iconos-pwa/ios/192.png',
  './iconos-pwa/ios/512.png'
];

// ICONOS Windows
const WINDOWS_ICONS = [
  './iconos-pwa/windows11/SmallTile.scale-100.png',
  './iconos-pwa/windows11/Square44x44Logo.scale-100.png',
  './iconos-pwa/windows11/Square150x150Logo.scale-100.png'
];

// COMBINAR TODOS LOS ASSETS
const ALL_ASSETS = [
  ...CRITICAL_ASSETS,
  ...ANDROID_ICONS,
  ...IOS_ICONS,
  ...WINDOWS_ICONS
];

console.log(`🚀 Almacén Copihue PWA v${APP_VERSION} iniciando...`);

// ========== INSTALACIÓN ==========
self.addEventListener('install', event => {
  console.log('📦 Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📁 Cache abierto. Agregando assets...');
        
        // Cachear solo los archivos críticos primero
        return cache.addAll(CRITICAL_ASSETS)
          .then(() => {
            console.log('✅ Archivos críticos cacheados');
            
            // Intentar cachear iconos después
            return Promise.all(
              ALL_ASSETS.filter(asset => !CRITICAL_ASSETS.includes(asset))
                .map(asset => 
                  cache.add(asset).catch(err => {
                    console.warn(`⚠️ No se pudo cachear: ${asset}`, err.message);
                    return Promise.resolve(); // Continuar aunque falle
                  })
                )
            );
          });
      })
      .then(() => {
        console.log('✨ Instalación completada. Activando...');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch(error => {
        console.error('❌ Error en instalación:', error);
        return self.skipWaiting(); // Activar igual
      })
  );
});

// ========== ACTIVACIÓN ==========
self.addEventListener('activate', event => {
  console.log('🔄 Activando nuevo Service Worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Eliminar caches viejos
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Eliminando cache viejo: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Cache limpiado. Tomando control...');
      return self.clients.claim();
    })
  );
});

// ========== ESTRATEGIA DE FETCH INTELIGENTE ==========
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // 🔥 NUNCA CACHEAR DATOS DINÁMICOS
  const DYNAMIC_URLS = [
    'docs.google.com',
    'spreadsheets',
    'gviz/tq',
    'corsproxy.io',
    'api.allorigins.win',
    'wa.me',
    'whatsapp.com'
  ];
  
  const isDynamic = DYNAMIC_URLS.some(dynamicUrl => 
    url.href.includes(dynamicUrl)
  );
  
  if (isDynamic) {
    console.log(`📊 Fetch directo (dinámico): ${url.pathname}`);
    return fetch(request);
  }
  
  // Para recursos locales
  if (url.origin === self.location.origin) {
    // Estrategia: Cache First para assets estáticos
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          console.log(`💾 Desde cache: ${url.pathname}`);
          return cachedResponse;
        }
        
        return fetch(request)
          .then(networkResponse => {
            // Verificar si es válido para cachear
            if (!networkResponse.ok || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // Solo cachear si es un recurso local y estático
            const isCacheable = 
              request.method === 'GET' &&
              !request.url.includes('?') && // No cachear con query strings
              (request.destination === 'image' || 
               request.destination === 'script' ||
               request.destination === 'style' ||
               request.destination === 'font' ||
               request.destination === 'document');
            
            if (isCacheable) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                  console.log(`➕ Nuevo cache: ${url.pathname}`);
                });
            }
            
            return networkResponse;
          })
          .catch(error => {
            console.log(`❌ Error de red: ${url.pathname}`, error);
            
            // Fallbacks específicos
            if (request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            if (request.destination === 'image') {
              // Fallback a icono según tamaño solicitado
              const isLargeIcon = request.url.includes('512') || request.url.includes('192');
              const fallbackIcon = isLargeIcon 
                ? './iconos-pwa/android/android-launchericon-512-512.png'
                : './iconos-pwa/android/android-launchericon-192-192.png';
              
              return caches.match(fallbackIcon);
            }
            
            // Respuesta genérica para offline
            return new Response(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Almacén Copihue - Offline</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { font-family: sans-serif; padding: 20px; text-align: center; }
                    h1 { color: #2e7d32; }
                  </style>
                </head>
                <body>
                  <h1>📶 Sin conexión</h1>
                  <p>El Almacén Copihue no está disponible sin conexión.</p>
                  <p>Verifica tu conexión a internet e intenta nuevamente.</p>
                </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html' }
            });
          });
      })
    );
  }
});

// ========== MANEJO DE MENSAJES ==========
self.addEventListener('message', event => {
  console.log('📨 Mensaje recibido:', event.data);
  
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
});

// ========== NOTIFICACIONES PUSH (OPCIONAL) ==========
self.addEventListener('push', event => {
  console.log('📬 Notificación push recibida', event);
  
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Almacén Copihue', {
        body: data.body || 'Nueva actualización disponible',
        icon: './iconos-pwa/android/android-launchericon-192-192.png',
        badge: './iconos-pwa/android/android-launchericon-72-72.png',
        tag: 'almacen-copihue-notification',
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'Ver'
          },
          {
            action: 'close',
            title: 'Cerrar'
          }
        ]
      })
    );
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('✅ Service Worker cargado y listo');