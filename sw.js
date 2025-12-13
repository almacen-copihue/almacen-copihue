// Service Worker MÍNIMO - Sin cache problemático
console.log('✅ SW cargado - Sin cache activo');

self.addEventListener('install', (event) => {
    console.log('🔧 SW instalado');
    self.skipWaiting(); // Activar inmediatamente
});

self.addEventListener('activate', (event) => {
    console.log('🚀 SW activado');
    event.waitUntil(self.clients.claim()); // Tomar control
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    
    // 🚫 NUNCA cachear estas URLs
    if (url.includes('index.html') || 
        url.includes('docs.google.com') || 
        url.includes('spreadsheets')) {
        
        // Pasar directo, SIN CACHE
        event.respondWith(fetch(event.request));
        return;
    }
    
    // Para imágenes: cache solo si ya están cargadas
    if (url.includes('/imagenes-productos/')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // Si falla, imagen genérica
                    return new Response(
                        `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                            <rect width="200" height="200" fill="#e8f5e9"/>
                            <text x="100" y="100" font-family="Arial" font-size="24" 
                                  text-anchor="middle" fill="#2e7d32">🛒</text>
                        </svg>`,
                        { headers: { 'Content-Type': 'image/svg+xml' } }
                    );
                })
        );
        return;
    }
    
    // Para todo lo demás: pasar directo
    event.respondWith(fetch(event.request));
});

// Limpiar cualquier cache antiguo al iniciar
caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
        console.log('🗑️ Cache eliminado:', cacheName);
    });
});