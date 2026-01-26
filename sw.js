const CACHE_VERSION = 'v2.5-250127';
const CACHE_NAME = `almacen-copihue-${CACHE_VERSION}`;

// Archivos esenciales para cachear
const ESSENTIAL_FILES = [
    './',
    './index.html',
    './manifest.json',
    './iconos-pwa/android/android-launchericon-48-48.png',
    './iconos-pwa/android/android-launchericon-192-192.png',
    './iconos-pwa/android/android-launchericon-512-512.png',
    './iconos-pwa/ios/180.png'
];

// Instalación - Cachear archivos esenciales
self.addEventListener('install', (event) => {
    console.log('🔧 SW instalando - Versión:', CACHE_VERSION);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Cacheando archivos esenciales...');
                return cache.addAll(ESSENTIAL_FILES);
            })
            .then(() => {
                console.log('✅ Archivos esenciales cacheados');
                return self.skipWaiting(); // Activar inmediatamente
            })
            .catch(err => {
                console.error('❌ Error cacheando:', err);
            })
    );
});

// Activación - Limpiar cachés viejos
self.addEventListener('activate', (event) => {
    console.log('🚀 SW activando - Versión:', CACHE_VERSION);
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Eliminando caché viejo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ SW activado y listo');
                return self.clients.claim(); // Tomar control
            })
    );
});

// Fetch - Estrategia Network First con Cache Fallback
self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    const method = event.request.method;
    
    // 🚫 IGNORAR métodos que no sean GET
    if (method !== 'GET') {
        return; // No hacer nada, pasar directo
    }
    
    // 🚫 NUNCA cachear la API de Google Sheets
    if (url.includes('script.google.com') || 
        url.includes('docs.google.com') || 
        url.includes('spreadsheets')) {
        event.respondWith(fetch(event.request));
        return;
    }
    
    // 🔄 Para index.html: siempre intentar red primero
    if (url.includes('index.html') || url.endsWith('/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Actualizar caché con nueva versión
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseClone))
                            .catch(err => console.warn('No se pudo cachear:', err));
                    }
                    return response;
                })
                .catch(() => {
                    // Si falla, usar caché
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // 📦 Para archivos esenciales: Cache First
    if (ESSENTIAL_FILES.some(file => url.includes(file))) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    return response || fetch(event.request)
                        .then(fetchResponse => {
                            if (fetchResponse && fetchResponse.status === 200) {
                                const responseClone = fetchResponse.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(event.request, responseClone))
                                    .catch(err => console.warn('No se pudo cachear:', err));
                            }
                            return fetchResponse;
                        });
                })
        );
        return;
    }
    
    // 🖼️ Para imágenes de productos: Network First
    if (url.includes('/imagenes-productos/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cachear la imagen si se carga bien
                    if (response && response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseClone))
                            .catch(err => console.warn('No se pudo cachear imagen:', err));
                    }
                    return response;
                })
                .catch(() => {
                    // Si falla, buscar en caché
                    return caches.match(event.request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // Si no está en caché, placeholder SVG
                            return new Response(
                                `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="200" height="200" fill="#e8f5e9"/>
                                    <text x="100" y="100" font-family="Arial" font-size="40" 
                                          text-anchor="middle" fill="#2e7d32">🛒</text>
                                </svg>`,
                                { headers: { 'Content-Type': 'image/svg+xml' } }
                            );
                        });
                })
        );
        return;
    }
    
    // 🌐 Para todo lo demás: Network First
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});

// Mensaje de consola inicial
console.log('✅ Service Worker cargado - Versión:', CACHE_VERSION);