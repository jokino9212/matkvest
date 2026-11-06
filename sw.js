const CACHE_NAME = "matkvest-iphone-v71";
const APP_BUILD_HASH = "f3d0639236010fc143b7d3dfcb2d9a7c4805746ed4c06387a89dd719bac42640";
const APP_FILES = ["./", "./index.html", "./manifest.webmanifest"];

// Navigation must prefer the network: cached HTML may be from a previous deployment.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith("matkvest-iphone-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Stage 20: only public app-shell and static resources may enter Cache Storage.
  // In particular, NEVER intercept API/auth/profile/economy requests, even on
  // navigations. An empty destination is typical of fetch()/XHR.
  const privatePath = new RegExp("(?:^|/)(?:api|auth|account|accounts|session|sessions|profile|profiles|user|users|wallet|inventory|economy|progress|sync|private|admin)(?:/|$)", "i");
  if (privatePath.test(url.pathname) ||
      request.headers.has("Authorization") ||
      request.headers.has("Cookie") ||
      (request.mode !== "navigate" && !["script", "style", "image", "font", "manifest"].includes(request.destination))) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy)));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match("./index.html")) || Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)));
      }
      return response;
    }))
  );
});
