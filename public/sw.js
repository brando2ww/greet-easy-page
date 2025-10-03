const CACHE_NAME = 'speed-charger-v2';
const RUNTIME_CACHE = 'speed-charger-runtime-v2';
const FONT_CACHE = 'speed-charger-fonts';

// Assets to precache
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/fallback-image.png',
  '/favicon.png',
  '/favicon.ico',
  '/icons/icon-144.png',
  '/icons/icon-192.png',
  '/icons/icon-256.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
];

// Install event - precache essential assets with error handling
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential assets');
        return cache.addAll(PRECACHE_URLS).catch((error) => {
          console.error('[SW] Failed to cache some assets:', error);
          // Continue anyway - don't fail installation
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== FONT_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first for HTML, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle Google Fonts with dedicated cache
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cachedResponse || new Response('', { status: 503 }));
        });
      })
    );
    return;
  }

  // Skip other cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Network first for HTML pages
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch((error) => {
          console.log('[SW] Network failed for navigation, serving from cache:', error);
          // Fallback to cache, then offline page
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match('/offline.html')
                .then((offlinePage) => offlinePage || new Response('Offline', { 
                  status: 503,
                  statusText: 'Service Unavailable'
                }));
            });
        })
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((error) => {
            console.log('[SW] Network failed for asset:', request.url);
            // If cached version exists, return it
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return fallback image for failed images
            if (request.destination === 'image') {
              return caches.match('/fallback-image.png');
            }
            // Return empty response for other failed requests
            return new Response('', { status: 503 });
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
