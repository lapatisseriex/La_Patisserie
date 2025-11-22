// Service Worker for La Patisserie - Network Status Management  
const CACHE_NAME = 'la-patisserie-v3';
const OFFLINE_URL = '/offline.html';
const HEADER_CACHE = 'header-components-v2';
const UI_CACHE = 'ui-components-v2';

// Essential files to cache for offline functionality
const urlsToCache = [
  '/offline.html',
  '/404.html',
  '/images/logo.png',
  '/images/offline-illustration.png',
  '/images/404-illustration.png',
  '/images/favicon.ico',
  '/images/favicon-32x32.png',
  '/images/favicon-16x16.png',
  '/manifest.json'
];

// Production assets to cache dynamically
const dynamicCachePatterns = [
  '/assets/', // All Vite bundled assets
  '/images/', // All images
  '/fonts/'   // All fonts
];

// External resources to cache (CSS only; font files fetched by browser with proper CORS)
const externalResources = [
  'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&display=swap'
];

// Message event - handle skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Skipping waiting...');
    self.skipWaiting();
  }
});

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    Promise.all([
      // Cache main static assets with individual error handling
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching Static Files');
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url)
              .then(() => console.log('✅ Cached:', url))
              .catch(err => console.warn('⚠️ Failed to cache:', url, err.message))
          )
        );
      }),
      
      // Cache external resources
      caches.open(UI_CACHE).then((cache) => {
        console.log('Service Worker: Caching External Resources');
        return Promise.allSettled(
          externalResources.map(url => 
            cache.add(url)
              .then(() => console.log('✅ Cached external:', url))
              .catch(err => console.warn('⚠️ Failed to cache external:', url, err.message))
          )
        );
      }),
    ]).then(() => {
      console.log('Service Worker: All caches updated');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
  
  const validCaches = [CACHE_NAME, HEADER_CACHE, UI_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!validCaches.includes(cacheName)) {
            console.log('Service Worker: Clearing Old Cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Enhanced fetch event - handle network requests with header caching
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip service worker for API requests - let them always go to network
  if (url.pathname.includes('/api/')) {
    return; // Let the request pass through without service worker intervention
  }
  
  // Handle navigation requests (page loads)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, serve offline page with cached header
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match(OFFLINE_URL);
            });
        })
    );
  }
  
  // Handle assets and dynamic content (CSS, JS, images, fonts)
  else if (shouldCacheDynamically(url.pathname)) {
    event.respondWith(
      // Try cache first for static assets
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Service Worker: Serving cached asset:', url.pathname);
            return cachedResponse;
          }
          
          // If not in cache, try network and cache the response
          return fetch(event.request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                const cacheToUse = getCacheName(url.pathname);
                
                caches.open(cacheToUse)
                  .then((cache) => {
                    cache.put(event.request, responseClone);
                    console.log('Service Worker: Cached new asset:', url.pathname);
                  });
              }
              return response;
            })
            .catch(() => {
              console.log('Service Worker: Network failed, asset not in cache:', url.pathname);
              // For essential assets, return a placeholder response
              if (url.pathname.includes('.css')) {
                return new Response('/* Offline fallback styles */', { 
                  headers: { 'Content-Type': 'text/css' }
                });
              }
              return new Response('Asset not available offline', { status: 503 });
            });
        })
    );
  }
  
  // Handle other requests (non-API images, etc.)
  else if (event.request.destination !== 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache GET requests (POST/PUT/DELETE cannot be cached)
          if (response.status === 200 && event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to get from all caches
          return caches.match(event.request).then((cachedResponse) => {
            // If still no cached response, return a proper error response
            if (!cachedResponse) {
              return new Response('Resource not available offline', { 
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            }
            return cachedResponse;
          });
        })
    );
  }
});

// Helper function to check if URL should be cached dynamically
function shouldCacheDynamically(pathname) {
  return dynamicCachePatterns.some(pattern => pathname.startsWith(pattern)) ||
         pathname.includes('/assets/') ||
         pathname.includes('.js') ||
         pathname.includes('.css') ||
         pathname.includes('.png') ||
         pathname.includes('.jpg') ||
         pathname.includes('.svg') ||
         pathname.includes('.woff') ||
         pathname.includes('.woff2');
}

// Helper function to get appropriate cache name
function getCacheName(pathname) {
  if (pathname.includes('/assets/')) return HEADER_CACHE;
  if (pathname.includes('/images/')) return CACHE_NAME;
  return UI_CACHE;
}

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Handle any queued requests when connection is restored
    event.waitUntil(
      // Add your background sync logic here
      Promise.resolve()
    );
  }
});

// Push notifications (optional - for future enhancements)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/images/logo.png',
      badge: '/images/logo.png',
      tag: 'la-patisserie-notification'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});