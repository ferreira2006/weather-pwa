const CACHE_NAME = "weather-pwa-cache-v1";
const urlsToCache = [
  ".",
  "index.html",
  "popup.js",
  "manifest.json",
  "icon192.png",
  "icon512.png"
];

// Instalando cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Ativando o service worker
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Interceptando requisições para servir cache quando offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request);
    })
  );
});
