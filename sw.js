/**
 * Block Blast - Service Worker (PWA)
 * Implements Network-First strategy with Offline Fallback.
 * Ensures normal F5 reloads ALWAYS fetch the latest live code immediately,
 * while still supporting 100% offline play when disconnected from network.
 */

const CACHE_NAME = 'blockblast-v32';
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/game.js',
    './js/modes.js',
    './js/shapes.js',
    './js/skins.js',
    './js/renderer.js',
    './js/particles.js',
    './js/audio.js',
    './js/input.js',
    './js/ai.js',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    // Activate immediately without waiting
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Network-First with Offline Fallback
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Update cache with fresh network response in background
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // If offline or network unavailable, serve cached response
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});
