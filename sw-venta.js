// ========== SERVICE WORKER — COPIHUE PUNTO DE VENTA ==========
const VERSION = 'copihue-venta-v57';
const CACHE_ESTATICO = [
    '/venta.html',
    '/manifest-venta.json'
];

// INSTALAR — cachear archivos estáticos
self.addEventListener('install', event => {
    console.log('📦 SW Venta instalando...');
    event.waitUntil(
        caches.open(VERSION).then(cache => {
            return cache.addAll(CACHE_ESTATICO);
        }).then(() => {
            console.log('✅ SW Venta instalado');
            return self.skipWaiting(); // Activar inmediatamente
        })
    );
});

// ACTIVAR — limpiar caches viejos
self.addEventListener('activate', event => {
    console.log('🚀 SW Venta activando...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== VERSION)
                    .map(key => {
                        console.log('🗑 Eliminando cache viejo:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => {
            console.log('✅ SW Venta activo');
            return self.clients.claim(); // Tomar control de todas las pestañas
        })
    );
});

// FETCH — estrategia: red primero, cache como respaldo
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // La API de Google siempre va a la red (nunca cachear datos en tiempo real)
    if (url.hostname.includes('script.google.com')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Sin internet — devolver respuesta de error amigable
                return new Response(JSON.stringify({
                    error: true,
                    offline: true,
                    mensaje: 'Sin conexión — los datos se actualizarán cuando vuelva internet'
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // Archivos estáticos — cache primero, red como respaldo
    if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) {
                    // Devolver cache y actualizar en segundo plano
                    fetch(event.request).then(response => {
                        if (response && response.status === 200) {
                            caches.open(VERSION).then(cache => {
                                cache.put(event.request, response);
                            });
                        }
                    }).catch(() => {});
                    return cached;
                }
                // No está en cache — ir a la red
                return fetch(event.request).catch(() => {
                    // Sin internet y sin cache — devolver venta.html del cache
                    return caches.match('/venta.html');
                });
            })
        );
    }
});
