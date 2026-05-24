const CACHE_VERSION = 'v3.3';
const CACHE_NAME = `almacen-copihue-${CACHE_VERSION}`;

const ESSENTIAL_FILES = [
    './venta_pos.html',
    './manifest.json',
    './iconos-pwa/android/android-launchericon-48-48.png',
    './iconos-pwa/android/android-launchericon-192-192.png',
    './iconos-pwa/android/android-launchericon-512-512.png',
    './iconos-pwa/ios/180.png'
];

// Archivos HTML del sistema — siempre Network First + re-cacheo
const HTML_DINAMICOS = [
    'index.html',
    'seba21.html',
    'copihue-dinero.html',
    'copihue-caja.html',
    'copihue-fiado.html',
    'copihue-reportes.html',
    'copihue-reportes-dinero.html',
    'copihue-pedidos.html',
    'copihue-herramientas.html',
    'copihue-horario.html',
    'copihue-fotos.html',
    'copihue-flyer.html',
    'copihue-caratulas.html',
    'copihue-config-ofertas.html',
    'copihue-dinero-live.html',
    'copihue-caja-movimientos.html',
];

self.addEventListener('install', (event) => {
    console.log('🔧 SW instalando - Versión:', CACHE_VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ESSENTIAL_FILES))
            .then(() => self.skipWaiting())
            .catch(err => console.error('❌ Error cacheando:', err))
    );
});

self.addEventListener('activate', (event) => {
    console.log('🚀 SW activando - Versión:', CACHE_VERSION);
    event.waitUntil(
        caches.keys()
            .then(names => Promise.all(
                names.map(name => {
                    if (name !== CACHE_NAME) {
                        console.log('🗑️ Eliminando caché viejo:', name);
                        return caches.delete(name);
                    }
                })
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    const method = event.request.method;

    // Ignorar no-GET
    if (method !== 'GET') return;

    // Nunca cachear API Google
    if (url.includes('script.google.com') ||
        url.includes('docs.google.com') ||
        url.includes('spreadsheets')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // ─── HTML DINÁMICOS: siempre red primero, luego cachear ───────────────────
    const esHTML = HTML_DINAMICOS.some(f => url.includes(f)) ||
                   url.endsWith('/') ||
                   // cualquier .html no listado también va por red
                   url.match(/\.html(\?.*)?$/);

    if (esHTML) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, clone))
                            .catch(err => console.warn('No se pudo cachear HTML:', err));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // ─── ARCHIVOS ESENCIALES: caché primero ───────────────────────────────────
    if (ESSENTIAL_FILES.some(f => url.includes(f))) {
        event.respondWith(
            caches.match(event.request)
                .then(cached => cached || fetch(event.request)
                    .then(res => {
                        if (res && res.status === 200) {
                            caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
                        }
                        return res;
                    })
                )
        );
        return;
    }

    // ─── IMÁGENES DE PRODUCTOS ────────────────────────────────────────────────
    if (url.includes('/imagenes-productos/')) {
        const cleanUrl = url.split('?')[0];
        const cleanRequest = new Request(cleanUrl, { cache: 'no-store' });
        event.respondWith(
            fetch(cleanRequest)
                .then(response => {
                    if (response && response.ok) {
                        caches.open(CACHE_NAME).then(c => c.put(cleanUrl, response.clone()));
                    }
                    return response;
                })
                .catch(() => caches.match(cleanUrl).then(cached => cached ||
                    new Response(
                        `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                            <rect width="200" height="200" fill="#e8f5e9"/>
                            <text x="100" y="100" font-family="Arial" font-size="40"
                                  text-anchor="middle" fill="#2e7d32">🛒</text>
                        </svg>`,
                        { headers: { 'Content-Type': 'image/svg+xml' } }
                    )
                ))
        );
        return;
    }

    // ─── TODO LO DEMÁS: red primero ───────────────────────────────────────────
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

console.log('✅ Service Worker cargado - Versión:', CACHE_VERSION);
