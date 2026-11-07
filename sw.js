const CACHE_NAME = "matkvest-iphone-v84";
const APP_BUILD_HASH = "b9294f521a79c7b84f1bdc18dc0f4685e708f2620f9ea8de14f2788ab145c603";
const APP_FILES = ["./", "./index.html", "./manifest.webmanifest", "./assets/source/badges/prototypes/bd_star.svg", "./assets/source/badges/prototypes/bd_diamond.svg", "./assets/source/badges/prototypes/bd_pi.svg", "./assets/source/badges/prototypes/bd_root.svg", "./assets/source/badges/prototypes/bd_sigma.svg", "./assets/source/badges/prototypes/bd_fraction.svg", "./assets/source/badges/prototypes/bd_infinity.svg", "./assets/source/badges/prototypes/bd_div_master.svg", "./assets/source/badges/prototypes/bd_fraction_master.svg", "./assets/source/badges/prototypes/bd_perfect.svg", "./assets/source/badges/prototypes/bd_control.svg", "./assets/source/badges/prototypes/bd_errors.svg", "./assets/source/badges/prototypes/bd_grade4.svg", "./assets/source/badges/prototypes/bd_grade5.svg", "./assets/source/badges/prototypes/bd_thousand.svg", "./assets/source/badges/prototypes/bd_equations.svg", "./assets/source/badges/prototypes/bd_comet.svg", "./assets/source/badges/prototypes/bd_geometry.svg", "./assets/source/badges/prototypes/bd_logic.svg", "./assets/source/badges/prototypes/bd_sprint.svg", "./assets/source/badges/prototypes/bd_orbit.svg", "./assets/source/badges/prototypes/bd_compass.svg", "./assets/source/badges/prototypes/bd_clock.svg", "./assets/source/badges/prototypes/bd_puzzle.svg", "./assets/source/badges/prototypes/bd_crown.svg"];

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
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

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
