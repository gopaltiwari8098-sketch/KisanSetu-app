const CACHE_NAME = 'kisansetu-v1';
const STATIC_ASSETS = [
  '/index.html',
  '/dashboard.html',
  '/css/variables.css',
  '/css/style.css',
  '/css/navbar.css',
  '/css/animations.css',
  '/js/config.js',
  '/js/utils/tokenStorage.js',
  '/js/utils/formatters.js'
];

// Install — cache static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore cache errors
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return; // API calls cache mat karo

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notification receive
self.addEventListener('push', (e) => {
  if (!e.data) return;

  let data;
  try {
    data = e.data.json();
  } catch {
    data = { title: 'KisanSetu', body: e.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/assets/icons/icon-192.png',
    badge: data.badge || '/assets/icons/badge-72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'open', title: 'App Kholein' },
      { action: 'close', title: 'Dismiss' }
    ],
    requireInteraction: true
  };

  e.waitUntil(
    self.registration.showNotification(data.title || 'KisanSetu', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  if (e.action === 'close') return;

  const url = e.notification.data?.url || '/dashboard.html';

  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});