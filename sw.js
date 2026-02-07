/**
 * Service Worker - Portfolio Scorecard PWA
 */

const CACHE_NAME = 'scorecard-v2.1';
const ASSETS_TO_CACHE = [
  '/Portfolio-Scorecard/',
  '/Portfolio-Scorecard/index.html',
  '/Portfolio-Scorecard/css/reset.css',
  '/Portfolio-Scorecard/css/variables.css',
  '/Portfolio-Scorecard/css/layout.css',
  '/Portfolio-Scorecard/css/components.css',
  '/Portfolio-Scorecard/css/theme-dark.css',
  '/Portfolio-Scorecard/css/theme-light.css',
  '/Portfolio-Scorecard/css/print.css',
  '/Portfolio-Scorecard/css/mobile.css',
  '/Portfolio-Scorecard/js/app.js',
  '/Portfolio-Scorecard/js/core/state.js',
  '/Portfolio-Scorecard/js/core/router.js',
  '/Portfolio-Scorecard/js/core/events.js'
];

// Install - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome extension requests
  if (event.request.url.includes('chrome-extension')) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request)
          .then((cached) => cached || new Response('Offline', { status: 503 }));
      })
  );
});
