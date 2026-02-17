// ─── WHEELFORGE SERVICE WORKER ───
// Cache-first for static assets, network-first for API calls

const CACHE_VERSION = 'wheelforge-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

// App shell — always cache these
const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.svg',
    '/icon-512.png',
];

// ─── INSTALL ───
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

// ─── ACTIVATE ───
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// ─── FETCH STRATEGY ───
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET and cross-origin WS
    if (request.method !== 'GET') return;
    if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

    // API calls → network-first with cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstWithCache(request, API_CACHE));
        return;
    }

    // Static assets → cache-first with network fallback
    if (
        url.pathname.match(/\.(js|css|png|svg|jpg|jpeg|webp|woff2?|ttf|eot|ico)$/) ||
        url.pathname === '/' ||
        url.pathname === '/index.html'
    ) {
        event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
        return;
    }

    // Google Fonts → cache-first (long TTL)
    if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
        return;
    }

    // Everything else → network with offline fallback
    event.respondWith(
        fetch(request).catch(() => caches.match('/index.html'))
    );
});

// ─── CACHE STRATEGIES ───

async function cacheFirstWithNetwork(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
}

async function networkFirstWithCache(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(
            JSON.stringify({ success: false, error: 'Offline — cached data unavailable' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
