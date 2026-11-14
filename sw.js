const CACHE_NAME = "matkvest-iphone-v158";
const APP_BUILD_HASH = "3afa4f9a406ee3dc5c778f31831a82e8e2ce7b134dc279af5ebf9a644dc7a379";
const APP_FILES = ["./assets/source/pets/pet_cosmic_whale.webp", "./assets/source/pets/pet_griffin.webp", "./assets/source/pets/pet_rocket_snail.webp", "./assets/source/pets/pet_moon_rabbit.webp", "./assets/source/pets/pet_mole.webp", "./assets/source/pets/pet_chameleon.webp", "./assets/source/pets/pet_raccoon.webp", "./assets/source/pets/pet_squirrel.webp", "./assets/source/pets/pet_capybara.webp", "./assets/source/pets/pet_axolotl.webp", "./", "./index.html", "./g5-conversion-ux.js", "./g5-textbook-topics.js", "./g5-textbook-core.js", "./g5-textbook-v111.js", "./g5-textbook-v112.js", "./g5-pedagogy-v113.js", "./g5-fractions-v114.js", "./g5-fraction-arithmetic-v115.js", "./g5-decimals-v116.js", "./g5-textbook-navigation-v121.js", "./g5-live-pedagogy-v122.js", "./g5-arithmetic-tiers-v123.js", "./g5-textbook-tiers-v124.js", "./g5-natural-units-v125.js", "./g5-remaining-core-v126.js", "./g5-decimal-tiers-v127.js", "./g5-decimal-percent-v128.js", "./g5-fraction-concepts-v129.js", "./g5-fraction-applications-v130.js", "./manifest.webmanifest", "./assets/source/badges/prototypes/bd_star.svg", "./assets/source/badges/prototypes/bd_diamond.svg", "./assets/source/badges/prototypes/bd_pi.svg", "./assets/source/badges/prototypes/bd_root.svg", "./assets/source/badges/prototypes/bd_sigma.svg", "./assets/source/badges/prototypes/bd_fraction.svg", "./assets/source/badges/prototypes/bd_infinity.svg", "./assets/source/badges/prototypes/bd_div_master.svg", "./assets/source/badges/prototypes/bd_fraction_master.svg", "./assets/source/badges/prototypes/bd_perfect.svg", "./assets/source/badges/prototypes/bd_control.svg", "./assets/source/badges/prototypes/bd_errors.svg", "./assets/source/badges/prototypes/bd_grade4.svg", "./assets/source/badges/prototypes/bd_grade5.svg", "./assets/source/badges/prototypes/bd_thousand.svg", "./assets/source/badges/prototypes/bd_equations.svg", "./assets/source/badges/prototypes/bd_comet.svg", "./assets/source/badges/prototypes/bd_geometry.svg", "./assets/source/badges/prototypes/bd_logic.svg", "./assets/source/badges/prototypes/bd_sprint.svg", "./assets/source/badges/prototypes/bd_orbit.svg", "./assets/source/badges/prototypes/bd_compass.svg", "./assets/source/badges/prototypes/bd_clock.svg", "./assets/source/badges/prototypes/bd_puzzle.svg", "./assets/source/badges/prototypes/bd_crown.svg", "./assets/source/badges/prototypes/bd_prism.svg", "./assets/source/badges/prototypes/bd_rocket.svg", "./assets/source/badges/prototypes/bd_chess.svg", "./assets/source/badges/prototypes/bd_spiral.svg", "./assets/source/badges/prototypes/bd_telescope.svg", "./assets/source/badges/prototypes/bd_abacus.svg", "./assets/source/badges/prototypes/bd_hourglass.svg", "./assets/source/badges/prototypes/bd_atom.svg", "./assets/source/badges/prototypes/bd_matrix.svg", "./assets/source/badges/prototypes/bd_phoenix.svg", "./assets/source/badges/prototypes/bd_magnet.svg", "./assets/source/badges/prototypes/bd_gear.svg", "./assets/source/badges/prototypes/bd_mountain.svg", "./assets/source/badges/prototypes/bd_key.svg", "./assets/source/badges/prototypes/bd_dragonfly.svg", "./assets/source/badges/prototypes/bd_lighthouse.svg", "./assets/source/badges/prototypes/bd_book.svg", "./assets/source/badges/prototypes/bd_owl.svg", "./assets/source/badges/prototypes/bd_sundial.svg", "./assets/source/badges/prototypes/bd_rune.svg", "./assets/source/badges/prototypes/bd_crystal.svg", "./assets/source/badges/prototypes/bd_satellite.svg", "./assets/source/badges/prototypes/bd_archimedes.svg", "./assets/source/badges/prototypes/bd_galaxy.svg", "./assets/source/badges/prototypes/bd_aurora.svg", "./assets/source/stickers/st_pi.svg", "./assets/source/stickers/st_star.svg", "./assets/source/stickers/st_rocket.svg", "./assets/source/stickers/st_lightning.svg", "./assets/source/stickers/st_cube.svg", "./assets/source/stickers/st_planet.svg", "./assets/source/stickers/st_trophy.svg", "./assets/source/stickers/st_crown.svg", "./assets/source/stickers/st_sigma.svg", "./assets/source/stickers/st_root.svg", "./assets/source/stickers/st_percent.svg", "./assets/source/stickers/st_divide.svg", "./assets/source/stickers/st_times.svg", "./assets/source/stickers/st_equals.svg", "./assets/source/stickers/st_delta.svg", "./assets/source/stickers/st_pi2.svg", "./assets/source/stickers/st_x2.svg", "./assets/source/stickers/st_approx.svg", "./assets/source/stickers/st_fraction.svg", "./assets/source/stickers/st_degree.svg", "./assets/source/stickers/st_orbit.svg", "./assets/source/stickers/st_fire.svg", "./assets/source/stickers/st_crystal.svg", "./assets/source/stickers/st_bolt2.svg", "./assets/source/stickers/st_star2.svg", "./assets/source/stickers/st_royal.svg", "./assets/source/stickers/st_infinity.svg", "./assets/source/stickers/st_golden_pi.svg", "./assets/source/stickers/st_master10.svg", "./assets/source/stickers/st_grade4.svg", "./assets/source/stickers/st_control_perfect.svg", "./assets/source/stickers/st_pencil.svg", "./assets/source/stickers/st_heart.svg", "./assets/source/stickers/st_target.svg", "./assets/source/stickers/st_hourglass.svg", "./assets/source/stickers/st_magnifier.svg", "./assets/source/stickers/st_joystick.svg", "./assets/source/stickers/st_robot.svg", "./assets/source/stickers/st_portal.svg", "./assets/source/stickers/st_phoenix.svg", "./assets/source/pets/pet_phoenix.webp", "./assets/source/pets/pet_orb.webp", "./assets/source/pets/pet_ghost.webp", "./assets/source/pets/pet_bot.webp", "./assets/source/pets/pet_owl.webp", "./assets/source/pets/pet_penguin.webp", "./assets/source/pets/pet_dino.webp", "./assets/source/pets/pet_cat.webp", "./assets/source/pets/pet_dragon.webp", "./assets/source/pets/pet_fox.webp", "./assets/source/pets/pet_turtle.webp", "./assets/source/pets/pet_tiger.webp", "./assets/source/pets/pet_astronaut.webp"];

// PWA v158: an HTML document and its Grade 5 JS must never mix releases online.
// Cached image assets remain cache-first; HTML and JS are always network-first.
const CORE_FILES = APP_FILES.filter(file => !file.startsWith("./assets/source/"));

self.addEventListener("install", event => {
  // Missing optional pet/badge files must NOT prevent a new worker installing.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_FILES))
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

function mk158SaveResponse(event, request, response, cacheKey) {
  if (response && response.ok) {
    const copy = response.clone();
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => cache.put(cacheKey || request, copy))
    );
  }
  return response;
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, {cache: "no-store"})
        .then(response => mk158SaveResponse(event, request, response, "./index.html"))
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match("./index.html")) || Response.error();
        })
    );
    return;
  }

  const url = new URL(request.url);
  // The old v157 worker was cache-first for scripts. New requests must never
  // reuse an obsolete script online; versioned HTML src URLs bypass old v157 too.
  if (request.destination === "script" || /\.(?:js|mjs)$/i.test(url.pathname)) {
    event.respondWith(
      fetch(request, {cache: "no-store"})
        .then(response => mk158SaveResponse(event, request, response))
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match(request))
            || (await cache.match(request, {ignoreSearch: true}))
            || Response.error();
        })
    );
    return;
  }

  // Immutable artwork is efficient offline; fetch and lazily cache other assets.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => cache.match(request))
      .then(cached => cached || fetch(request).then(response =>
        mk158SaveResponse(event, request, response)
      ))
  );
});
