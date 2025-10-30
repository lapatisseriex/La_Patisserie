// Service Worker for La Patisserie - Network Status Management
const CACHE_NAME = 'la-patisserie-v2';
const OFFLINE_URL = '/offline.html';
const HEADER_CACHE = 'header-components-v1';
const UI_CACHE = 'ui-components-v1';

// Essential files to cache for offline functionality
const urlsToCache = [
  '/',
  '/offline.html',
  '/404.html',
  '/images/logo.png',
  '/images/offline-illustration.png',
  '/images/404-illustration.png',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/manifest.json'
];

// Header and UI components to cache
const headerUICache = [
  // Main app files
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/src/styles/network-status.css',
  
  // Header component files
  '/src/components/Header/Header.jsx',
  '/src/components/Header/Header.css',
  '/src/components/Header/UserMenu/UserMenu.jsx',
  
  // Common components used in header
  '/src/components/common/NetworkStatusBanner.jsx',
  '/src/components/common/OfflinePage.jsx',
  
  // Context providers needed for header
  '/src/context/LocationContext/LocationContext.jsx',
  '/src/context/HostelContext/HostelContext.jsx',
  '/src/hooks/useAuth.js',
  '/src/hooks/useNetworkStatus.js',
  
  // Essential fonts and styles
  'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  event.waitUntil(
    Promise.all([
      // Cache main assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching Main Files');
        return cache.addAll(urlsToCache);
      }),
      
      // Cache header and UI components
      caches.open(HEADER_CACHE).then((cache) => {
        console.log('Service Worker: Caching Header Components');
        return cache.addAll(headerUICache.filter(url => !url.startsWith('http')));
      }),
      
      // Cache external resources separately
      caches.open(UI_CACHE).then((cache) => {
        console.log('Service Worker: Caching External Resources');
        const externalUrls = headerUICache.filter(url => url.startsWith('http'));
        return Promise.allSettled(
          externalUrls.map(url => 
            fetch(url, { mode: 'cors' })
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(err => console.log('Failed to cache:', url, err))
          )
        );
      })
    ]).then(() => {
      console.log('Service Worker: All caches updated');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
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
  
  // Handle component files (header, CSS, JS)
  else if (isHeaderComponent(url.pathname)) {
    event.respondWith(
      // Try cache first for header components
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Service Worker: Serving cached header component:', url.pathname);
            return cachedResponse;
          }
          
          // If not in cache, try network and cache the response
          return fetch(event.request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                const cacheToUse = isHeaderRelated(url.pathname) ? HEADER_CACHE : CACHE_NAME;
                
                caches.open(cacheToUse)
                  .then((cache) => {
                    cache.put(event.request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              console.log('Service Worker: Network failed, header component not in cache:', url.pathname);
              return new Response('Component not available offline', { status: 503 });
            });
        })
    );
  }
  
  // Handle other requests (API, images, etc.)
  else if (event.request.destination !== 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If we got a response, clone it and store it in cache
          if (response.status === 200) {
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
          return caches.match(event.request);
        })
    );
  }
});

// Helper function to check if URL is a header component
function isHeaderComponent(pathname) {
  const headerPaths = [
    '/src/components/Header/',
    '/src/components/common/NetworkStatusBanner.jsx',
    '/src/components/common/OfflinePage.jsx',
    '/src/context/',
    '/src/hooks/',
    '/src/styles/',
    '/src/main.jsx',
    '/src/App.jsx',
    '/src/index.css'
  ];
  
  return headerPaths.some(path => pathname.includes(path));
}

// Helper function to check if component is header-related
function isHeaderRelated(pathname) {
  return pathname.includes('/Header/') || 
         pathname.includes('/UserMenu/') || 
         pathname.includes('Header.jsx') ||
         pathname.includes('Header.css');
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