// 서비스워커 (기본 캐싱)
const CACHE_NAME = "rover-service-v1";
const urlsToCache = [
  "/",
  "/login",
  "/register",
  "/reservations",
  "/reviews",
  "/gallery",
  "/shop",
  "/admin",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});









