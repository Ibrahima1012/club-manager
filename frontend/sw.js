const CACHE_NAME = 'club-manager-v1';
const STATIC_ASSETS = [
  '/', '/index.html', '/manifest.json',
  '/css/app.css',
  '/js/app.js', '/js/auth.js', '/js/db.js',
  '/js/pdf.js', '/js/share.js', '/js/payment.js',
  '/js/modules/settings.js', '/js/modules/invoices.js',
  '/js/modules/receipts.js', '/js/modules/diplomas.js',
  '/js/modules/expenses.js',
  '/icons/icon-192.png', '/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  
  // API: network first, fallback cache
  if (request.url.includes('/api/')) {
    e.respondWith(
      fetch(request).then(r => {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
        return r;
      }).catch(() => caches.match(request))
    );
    return;
  }
  
  // Static: cache first
  e.respondWith(
    caches.match(request).then(cached => 
      cached || fetch(request).then(r => {
        caches.open(CACHE_NAME).then(c => c.put(request, r.clone()));
        return r;
      })
    )
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});