const CACHE = 'gymcoach-v2';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache first, then network
self.addEventListener('fetch', e => {
  // Don't cache ntfy.sh calls
  if (e.request.url.includes('ntfy.sh')) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/index.html')))
  );
});

// Push — receive push notification from server (future use)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'GymCoach', body: 'Rappel médicament 💊' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'GymCoach 💊', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: 'medoc'
    })
  );
});
