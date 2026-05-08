/**
 * Service Worker - CONOCE TEC V72
 * Permite modo offline básico para el mapa
 */
const CACHE_NAME = 'conocetec-v72-v1';

const urlsToCache = [
  '/pages/mapa-campus.html',
  '/map/data/pois.geojson',
  '/map/data/campus_routes.geojson',
  '/map/js/waze_reports.js',
  '/map/css/waze_reports.css',
  '/map/css/waze_dark_mode.css',
  '/map/css/styles_mejoras.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster@1.5.1/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster@1.5.1/dist/MarkerCluster.Default.css',
  'https://unpkg.com/leaflet.markercluster@1.5.1/dist/leaflet.markercluster.js',
  'https://unpkg.com/@turf/turf@6.5.0/turf.min.js',
  'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache.filter(u => !u.startsWith('https'))))
      .catch(err => console.warn('Cache parcial:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // No interceptar llamadas API (siempre ir al servidor)
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
