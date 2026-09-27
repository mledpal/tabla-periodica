// Service worker: permite usar la tabla sin conexión una vez visitada.
// - Página y archivos propios: primero red (siempre la última versión publicada) y,
//   sin conexión, la copia guardada. Así nunca se mezcla HTML nuevo con JS antiguo.
// - Three.js (URL con versión fija en la CDN): primero caché
// - Fuentes de Google: caché y actualización en segundo plano
const VERSION = "v2";
const APP_CACHE = `tabla-app-${VERSION}`;
const CDN_CACHE = `tabla-cdn-${VERSION}`;

const APP_SHELL = [
  "./",
  "index.html",
  "css/style.css",
  "js/data.js",
  "js/main.js",
  "js/atom3d.js",
  "favicon.svg",
  "manifest.webmanifest",
  "img/icon-192.png",
  "img/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== APP_CACHE && k !== CDN_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);

  if(req.mode === "navigate"){
    event.respondWith(networkFirst(req, "index.html"));
    return;
  }

  if(url.origin === self.location.origin){
    event.respondWith(networkFirst(req));
    return;
  }

  if(url.hostname === "cdn.jsdelivr.net"){
    event.respondWith(cacheFirst(req, CDN_CACHE));
    return;
  }

  if(url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")){
    event.respondWith(staleWhileRevalidate(req, CDN_CACHE));
  }
});

// cacheKey permite guardar todas las navegaciones como "index.html" (la app es una sola página)
async function networkFirst(req, cacheKey){
  const cache = await caches.open(APP_CACHE);
  try {
    const res = await fetch(req);
    if(res.ok) cache.put(cacheKey || req, res.clone());
    return res;
  } catch(err){
    const cached = await cache.match(cacheKey || req, { ignoreSearch: true });
    if(cached) return cached;
    throw err;
  }
}

async function cacheFirst(req, cacheName){
  const cached = await caches.match(req);
  if(cached) return cached;
  const res = await fetch(req);
  if(res.ok) (await caches.open(cacheName)).put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, cacheName){
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req, { ignoreSearch: true });
  const network = fetch(req)
    .then(res => {
      if(res.ok || res.type === "opaque") cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}
