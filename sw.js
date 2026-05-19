const CACHE = 'gymcoach-v1.4';
const STATIC = ['/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/manifest.json'];

// Install — cache only static assets (not index.html)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC))
  );
  self.skipWaiting(); // take over immediately
});

// Activate — clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — NETWORK FIRST strategy
// → Always tries network first (gets latest version)
// → Falls back to cache only if offline
self.addEventListener('fetch', e => {
  // Skip non-GET and cross-origin (ntfy, YouTube, ExerciseDB)
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful responses for offline fallback
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request)) // offline fallback
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'GymCoach', body: 'Rappel medicament' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'GymCoach', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: 'medoc'
    })
  );
});

// Message: force update
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
