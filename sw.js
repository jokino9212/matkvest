const CACHE_NAME = "matkvest-iphone-v107";
const APP_BUILD_HASH = "3ed3458144d67f2e3b3177fb677f4d7575de37e1ad215d28f4341e0528c1b32b";
const APP_FILES = ["./assets/source/pets/pet_cosmic_whale.webp", "./assets/source/pets/pet_griffin.webp", "./assets/source/pets/pet_rocket_snail.webp", "./assets/source/pets/pet_moon_rabbit.webp", "./assets/source/pets/pet_mole.webp", "./assets/source/pets/pet_chameleon.webp", "./assets/source/pets/pet_raccoon.webp", "./assets/source/pets/pet_squirrel.webp", "./assets/source/pets/pet_capybara.webp", "./assets/source/pets/pet_axolotl.webp", "./", "./index.html", "./manifest.webmanifest", "./assets/source/badges/prototypes/bd_star.svg", "./assets/source/badges/prototypes/bd_diamond.svg", "./assets/source/badges/prototypes/bd_pi.svg", "./assets/source/badges/prototypes/bd_root.svg", "./assets/source/badges/prototypes/bd_sigma.svg", "./assets/source/badges/prototypes/bd_fraction.svg", "./assets/source/badges/prototypes/bd_infinity.svg", "./assets/source/badges/prototypes/bd_div_master.svg", "./assets/source/badges/prototypes/bd_fraction_master.svg", "./assets/source/badges/prototypes/bd_perfect.svg", "./assets/source/badges/prototypes/bd_control.svg", "./assets/source/badges/prototypes/bd_errors.svg", "./assets/source/badges/prototypes/bd_grade4.svg", "./assets/source/badges/prototypes/bd_grade5.svg", "./assets/source/badges/prototypes/bd_thousand.svg", "./assets/source/badges/prototypes/bd_equations.svg", "./assets/source/badges/prototypes/bd_comet.svg", "./assets/source/badges/prototypes/bd_geometry.svg", "./assets/source/badges/prototypes/bd_logic.svg", "./assets/source/badges/prototypes/bd_sprint.svg", "./assets/source/badges/prototypes/bd_orbit.svg", "./assets/source/badges/prototypes/bd_compass.svg", "./assets/source/badges/prototypes/bd_clock.svg", "./assets/source/badges/prototypes/bd_puzzle.svg", "./assets/source/badges/prototypes/bd_crown.svg", "./assets/source/badges/prototypes/bd_prism.svg", "./assets/source/badges/prototypes/bd_rocket.svg", "./assets/source/badges/prototypes/bd_chess.svg", "./assets/source/badges/prototypes/bd_spiral.svg", "./assets/source/badges/prototypes/bd_telescope.svg", "./assets/source/badges/prototypes/bd_abacus.svg", "./assets/source/badges/prototypes/bd_hourglass.svg", "./assets/source/badges/prototypes/bd_atom.svg", "./assets/source/badges/prototypes/bd_matrix.svg", "./assets/source/badges/prototypes/bd_phoenix.svg", "./assets/source/badges/prototypes/bd_magnet.svg", "./assets/source/badges/prototypes/bd_gear.svg", "./assets/source/badges/prototypes/bd_mountain.svg", "./assets/source/badges/prototypes/bd_key.svg", "./assets/source/badges/prototypes/bd_dragonfly.svg", "./assets/source/badges/prototypes/bd_lighthouse.svg", "./assets/source/badges/prototypes/bd_book.svg", "./assets/source/badges/prototypes/bd_owl.svg", "./assets/source/badges/prototypes/bd_sundial.svg", "./assets/source/badges/prototypes/bd_rune.svg", "./assets/source/badges/prototypes/bd_crystal.svg", "./assets/source/badges/prototypes/bd_satellite.svg", "./assets/source/badges/prototypes/bd_archimedes.svg", "./assets/source/badges/prototypes/bd_galaxy.svg", "./assets/source/badges/prototypes/bd_aurora.svg", "./assets/source/stickers/st_pi.svg", "./assets/source/stickers/st_star.svg", "./assets/source/stickers/st_rocket.svg", "./assets/source/stickers/st_lightning.svg", "./assets/source/stickers/st_cube.svg", "./assets/source/stickers/st_planet.svg", "./assets/source/stickers/st_trophy.svg", "./assets/source/stickers/st_crown.svg", "./assets/source/stickers/st_sigma.svg", "./assets/source/stickers/st_root.svg", "./assets/source/stickers/st_percent.svg", "./assets/source/stickers/st_divide.svg", "./assets/source/stickers/st_times.svg", "./assets/source/stickers/st_equals.svg", "./assets/source/stickers/st_delta.svg", "./assets/source/stickers/st_pi2.svg", "./assets/source/stickers/st_x2.svg", "./assets/source/stickers/st_approx.svg", "./assets/source/stickers/st_fraction.svg", "./assets/source/stickers/st_degree.svg", "./assets/source/stickers/st_orbit.svg", "./assets/source/stickers/st_fire.svg", "./assets/source/stickers/st_crystal.svg", "./assets/source/stickers/st_bolt2.svg", "./assets/source/stickers/st_star2.svg", "./assets/source/stickers/st_royal.svg", "./assets/source/stickers/st_infinity.svg", "./assets/source/stickers/st_golden_pi.svg", "./assets/source/stickers/st_master10.svg", "./assets/source/stickers/st_grade4.svg", "./assets/source/stickers/st_control_perfect.svg", "./assets/source/stickers/st_pencil.svg", "./assets/source/stickers/st_heart.svg", "./assets/source/stickers/st_target.svg", "./assets/source/stickers/st_hourglass.svg", "./assets/source/stickers/st_magnifier.svg", "./assets/source/stickers/st_joystick.svg", "./assets/source/stickers/st_robot.svg", "./assets/source/stickers/st_portal.svg", "./assets/source/stickers/st_phoenix.svg", "./assets/source/pets/pet_phoenix.webp", "./assets/source/pets/pet_orb.webp", "./assets/source/pets/pet_ghost.webp", "./assets/source/pets/pet_bot.webp", "./assets/source/pets/pet_owl.webp", "./assets/source/pets/pet_penguin.webp", "./assets/source/pets/pet_dino.webp", "./assets/source/pets/pet_cat.webp", "./assets/source/pets/pet_dragon.webp", "./assets/source/pets/pet_fox.webp", "./assets/source/pets/pet_turtle.webp", "./assets/source/pets/pet_tiger.webp", "./assets/source/pets/pet_astronaut.webp"];

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
  // Stage 9.5: authenticated JSON is network-only, never cached or served as HTML.
  // The API can be reverse-proxied at /api/v1/ or below the PWA scope (/matkvest/api/v1/).
  // An Authorization header is another unconditional cache bypass.
  const pathname = new URL(request.url).pathname;
  if (/(?:^|\/)api(?:\/|$)/.test(pathname) || request.headers.has("Authorization")) return;

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
    caches.open(CACHE_NAME).then(cache => cache.match(request)).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)));
      }
      return response;
    }))
  );
});
