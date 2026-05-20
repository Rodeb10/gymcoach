const CACHE = 'gymcoach-v1.5';
const ASSETS = [
  '/gymcoach/',
  '/gymcoach/index.html',
  '/gymcoach/manifest.json',
  '/gymcoach/icon-192.png',
  '/gymcoach/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(ASSETS.map(url => c.add(url).catch(() => {})));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first for HTML/JS, cache fallback for offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Skip cross-origin requests (ExerciseDB, YouTube, ntfy)
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request)
        .then(cached => cached || caches.match('/gymcoach/'))
      )
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'GymCoach', body: 'Rappel medicament' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'GymCoach', {
      body: data.body,
      icon: '/gymcoach/icon-192.png',
      badge: '/gymcoach/icon-192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: 'medoc'
    })
  );
});
