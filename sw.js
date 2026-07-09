// Architecture Anatomy — service worker
// Stale-while-revalidate for app shell; network-first for catalogs.
const CACHE = 'anatomy-v1.8.0';
const SHELL = [
  './',
  './index.html',
  './atlas.html',
  './3d-prototype.html',
  './tools/svg-renderer.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Network-first for catalog JSON so edits are always fresh
  if (url.pathname.includes('/catalogs/')) {
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Stale-while-revalidate: serve cached instantly, refresh in background.
  // Never more than one visit stale; cache bumps are now safety net, not steering wheel.
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(r => {
        if (r.ok && e.request.method === 'GET') {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
