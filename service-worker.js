/* ============================================================
   NexusCorp ERP — Service Worker
   service-worker.js
   ============================================================ */

const CACHE_NAME = 'nexus-erp-v3';

const LOCAL_ASSETS = [
  './',
  './index.html',
  './app.js',
  './css/app.css',
  './manifest.json',
  /* Services */
  './services/csv.service.js',
  './services/finance.service.js',
  './services/sales.service.js',
  './services/crm.service.js',
  './services/production.service.js',
  './services/supplychain.service.js',
  /* Component Templates */
  './components/overview/overview.html',
  './components/finance/finance.html',
  './components/sales/sales.html',
  './components/crm/crm.html',
  './components/production/production.html',
  './components/supplychain/supplychain.html',
  /* Component Controllers */
  './components/overview/overview.controller.js',
  './components/finance/finance.controller.js',
  './components/sales/sales.controller.js',
  './components/crm/crm.controller.js',
  './components/production/production.controller.js',
  './components/supplychain/supplychain.controller.js',
  /* CSV Data Files */
  './finance.csv',
  './sales.csv',
  './customers.csv',
  './production.csv',
  './supply_chain.csv'
];

/* ── Install: pre-cache all local assets ── */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('[SW] Pre-caching assets');
      return cache.addAll(LOCAL_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* ── Activate: remove stale caches ── */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
          .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: cache-first for local, network-first for CDN ── */
self.addEventListener('fetch', function (event) {
  var url = event.request.url;

  /* For CDN resources — network first, fall back to cache */
  if (url.includes('cdn.') || url.includes('googleapis') || url.includes('jsdelivr') || url.includes('cloudflare')) {
    event.respondWith(
      fetch(event.request).then(function (response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(function () {
        return caches.match(event.request);
      })
    );
    return;
  }

  /* For local assets — cache first */
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).then(function (response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
