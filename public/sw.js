// Register Service Worker for offline support (only in production builds)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('Service Worker registration failed:', error);
      });
  });
}
// Basic service worker for offline-first app shell caching
const CACHE_NAME = 'ramsons-cache-v3';
const APP_SHELL = [
  '/',
  '/index.html',
  // Vite will fingerprint assets; we use runtime caching below for assets
  '/sounds/notification.wav'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)))
    )
  );
});

// Cache-first for app shell and static assets, network-first for navigation
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // For navigation requests, try network first then fall back to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Same-origin static assets: cache-first (skip Range requests and partial responses)
  if (url.origin === self.location.origin) {
    // Bypass caching for Range requests (e.g., audio streaming)
    if (request.headers.has('range')) {
      event.respondWith(fetch(request));
      return;
    }

    // Runtime-cache assets under /assets and other static files
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/sounds/')) {
      event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
          const cached = await cache.match(request);
          if (cached) return cached;
          const response = await fetch(request);
          // Only cache full 200 OK responses (Cache API doesn't support 206 Partial Content)
          if (response && response.status === 200) {
            try {
              cache.put(request, response.clone());
            } catch (e) {
              // Ignore cache put errors to avoid breaking fetch
            }
          }
          return response;
        })
      );
      return;
    }
  }

  // Default: just let network handle (e.g., API calls to localhost:5000)
});
