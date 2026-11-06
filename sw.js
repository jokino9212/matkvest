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

  // Only explicit public app shell URLs and public assets are eligible.
  // Never cache API responses, even when an endpoint resembles a static file.
  const scope = new URL(self.registration.scope);
  if (!url.pathname.startsWith(scope.pathname)) return;
  const relativePath = url.pathname.slice(scope.pathname.length);
  const isShell = relativePath === "" || relativePath === "index.html";
  const isManifest = relativePath === "manifest.webmanifest";
  const isPublicAsset = /^(?:assets|images|icons)\\/[a-z0-9_./-]+\\.(?:png|jpg|jpeg|webp|svg|gif|ico|woff2?|css|js)$/i.test(relativePath) &&
    !relativePath.split("/").includes("..");
  const hasCredentialsHeader = request.headers.has("Authorization") || request.headers.has("Cookie");
  if (hasCredentialsHeader) return;

  if (request.mode === "navigate") {
    if (!isShell) return;
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response.ok && response.type !== "opaque" &&
              !/\\b(?:no-store|private)\\b/i.test(response.headers.get("Cache-Control") || "")) {
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

  if (!((isPublicAsset && ["script", "style", "image", "font"].includes(request.destination)) ||
      (isManifest && request.destination === "manifest"))) return;
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok && response.type !== "opaque" &&
          !/\\b(?:no-store|private)\\b/i.test(response.headers.get("Cache-Control") || "")) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)));
      }
      return response;
    }))
  );
});
