const CACHE_NAME = "matkvest-iphone-v177";
const APP_BUILD_HASH = "f92bdfdb70104f6110e4d31b8be81a57c2074fb6151ba6c61894da6d9ef407fa";
const APP_FILES = ["./assets/source/pets/pet_cosmic_whale.webp", "./assets/source/pets/pet_griffin.webp", "./assets/source/pets/pet_rocket_snail.webp", "./assets/source/pets/pet_moon_rabbit.webp", "./assets/source/pets/pet_mole.webp", "./assets/source/pets/pet_chameleon.webp", "./assets/source/pets/pet_raccoon.webp", "./assets/source/pets/pet_squirrel.webp", "./assets/source/pets/pet_capybara.webp", "./assets/source/pets/pet_axolotl.webp", "./", "./index.html", "./g5-conversion-ux.js", "./g5-textbook-topics.js", "./g5-textbook-core.js", "./g5-textbook-v111.js", "./g5-textbook-v112.js", "./g5-pedagogy-v113.js", "./g5-fractions-v114.js", "./g5-fraction-arithmetic-v115.js", "./g5-decimals-v116.js", "./g5-textbook-navigation-v121.js", "./g5-live-pedagogy-v122.js", "./g5-arithmetic-tiers-v123.js", "./g5-textbook-tiers-v124.js", "./g5-natural-units-v125.js", "./g5-remaining-core-v126.js", "./g5-decimal-tiers-v127.js", "./g5-decimal-percent-v128.js", "./g5-fraction-concepts-v129.js", "./g5-fraction-applications-v130.js", "./manifest.webmanifest", "./assets/source/badges/prototypes/bd_star.svg", "./assets/source/badges/prototypes/bd_diamond.svg", "./assets/source/badges/prototypes/bd_pi.svg", "./assets/source/badges/prototypes/bd_root.svg", "./assets/source/badges/prototypes/bd_sigma.svg", "./assets/source/badges/prototypes/bd_fraction.svg", "./assets/source/badges/prototypes/bd_infinity.svg", "./assets/source/badges/prototypes/bd_div_master.svg", "./assets/source/badges/prototypes/bd_fraction_master.svg", "./assets/source/badges/prototypes/bd_perfect.svg", "./assets/source/badges/prototypes/bd_control.svg", "./assets/source/badges/prototypes/bd_errors.svg", "./assets/source/badges/prototypes/bd_grade4.svg", "./assets/source/badges/prototypes/bd_grade5.svg", "./assets/source/badges/prototypes/bd_thousand.svg", "./assets/source/badges/prototypes/bd_equations.svg", "./assets/source/badges/prototypes/bd_comet.svg", "./assets/source/badges/prototypes/bd_geometry.svg", "./assets/source/badges/prototypes/bd_logic.svg", "./assets/source/badges/prototypes/bd_sprint.svg", "./assets/source/badges/prototypes/bd_orbit.svg", "./assets/source/badges/prototypes/bd_compass.svg", "./assets/source/badges/prototypes/bd_clock.svg", "./assets/source/badges/prototypes/bd_puzzle.svg", "./assets/source/badges/prototypes/bd_crown.svg", "./assets/source/badges/prototypes/bd_prism.svg", "./assets/source/badges/prototypes/bd_rocket.svg", "./assets/source/badges/prototypes/bd_chess.svg", "./assets/source/badges/prototypes/bd_spiral.svg", "./assets/source/badges/prototypes/bd_telescope.svg", "./assets/source/badges/prototypes/bd_abacus.svg", "./assets/source/badges/prototypes/bd_hourglass.svg", "./assets/source/badges/prototypes/bd_atom.svg", "./assets/source/badges/prototypes/bd_matrix.svg", "./assets/source/badges/prototypes/bd_phoenix.svg", "./assets/source/badges/prototypes/bd_magnet.svg", "./assets/source/badges/prototypes/bd_gear.svg", "./assets/source/badges/prototypes/bd_mountain.svg", "./assets/source/badges/prototypes/bd_key.svg", "./assets/source/badges/prototypes/bd_dragonfly.svg", "./assets/source/badges/prototypes/bd_lighthouse.svg", "./assets/source/badges/prototypes/bd_book.svg", "./assets/source/badges/prototypes/bd_owl.svg", "./assets/source/badges/prototypes/bd_sundial.svg", "./assets/source/badges/prototypes/bd_rune.svg", "./assets/source/badges/prototypes/bd_crystal.svg", "./assets/source/badges/prototypes/bd_satellite.svg", "./assets/source/badges/prototypes/bd_archimedes.svg", "./assets/source/badges/prototypes/bd_galaxy.svg", "./assets/source/badges/prototypes/bd_aurora.svg", "./assets/source/stickers/st_pi.svg", "./assets/source/stickers/st_star.svg", "./assets/source/stickers/st_rocket.svg", "./assets/source/stickers/st_lightning.svg", "./assets/source/stickers/st_cube.svg", "./assets/source/stickers/st_planet.svg", "./assets/source/stickers/st_trophy.svg", "./assets/source/stickers/st_crown.svg", "./assets/source/stickers/st_sigma.svg", "./assets/source/stickers/st_root.svg", "./assets/source/stickers/st_percent.svg", "./assets/source/stickers/st_divide.svg", "./assets/source/stickers/st_times.svg", "./assets/source/stickers/st_equals.svg", "./assets/source/stickers/st_delta.svg", "./assets/source/stickers/st_pi2.svg", "./assets/source/stickers/st_x2.svg", "./assets/source/stickers/st_approx.svg", "./assets/source/stickers/st_fraction.svg", "./assets/source/stickers/st_degree.svg", "./assets/source/stickers/st_orbit.svg", "./assets/source/stickers/st_fire.svg", "./assets/source/stickers/st_crystal.svg", "./assets/source/stickers/st_bolt2.svg", "./assets/source/stickers/st_star2.svg", "./assets/source/stickers/st_royal.svg", "./assets/source/stickers/st_infinity.svg", "./assets/source/stickers/st_golden_pi.svg", "./assets/source/stickers/st_master10.svg", "./assets/source/stickers/st_grade4.svg", "./assets/source/stickers/st_control_perfect.svg", "./assets/source/stickers/st_pencil.svg", "./assets/source/stickers/st_heart.svg", "./assets/source/stickers/st_target.svg", "./assets/source/stickers/st_hourglass.svg", "./assets/source/stickers/st_magnifier.svg", "./assets/source/stickers/st_joystick.svg", "./assets/source/stickers/st_robot.svg", "./assets/source/stickers/st_portal.svg", "./assets/source/stickers/st_phoenix.svg", "./assets/source/pets/pet_phoenix.webp", "./assets/source/pets/pet_orb.webp", "./assets/source/pets/pet_ghost.webp", "./assets/source/pets/pet_bot.webp", "./assets/source/pets/pet_owl.webp", "./assets/source/pets/pet_penguin.webp", "./assets/source/pets/pet_dino.webp", "./assets/source/pets/pet_cat.webp", "./assets/source/pets/pet_dragon.webp", "./assets/source/pets/pet_fox.webp", "./assets/source/pets/pet_turtle.webp", "./assets/source/pets/pet_tiger.webp", "./assets/source/pets/pet_astronaut.webp"];

// The installed worker and its cached HTML/scripts form one verified build.
const SCRIPT_HASHES = {"g5-conversion-ux.js": "b4aab65470464259cfc2c888adb7e0d34d96a0f8e4705670057f4aca1125273b", "g5-textbook-topics.js": "202766878d1f6f486d0dcd07df9641da607b1b2cc218a3957c0d36e8e6454cd6", "g5-textbook-core.js": "4bb3987e5420d591f96fc68025ab0e04930b87277ccadc23ea17d961cd2febe1", "g5-textbook-v111.js": "befed3e6d8525799b603a0e7cc8526e55136413e9f4189496f6c5593e2aaaa86", "g5-textbook-v112.js": "ad6d7725d4cad57e0e396fc4355ee2f98d3cc909ad1cb3b8a531777c050555d7", "g5-pedagogy-v113.js": "5d4c374ae4f60a2e9b56931c02f7502a463a6c56d42e8cb85f947d9c91af591a", "g5-fractions-v114.js": "63af484f9fe9a41f05074ea287866f4a37b69bc6b06eb65897663ad638f0451f", "g5-fraction-arithmetic-v115.js": "17ea4401154b90fe4395ffbf1ab544d55b967c0465ef5f4702280807742d806f", "g5-decimals-v116.js": "225347f1f4c9951d1a29c84ab575394527b01bde5767f04e05f86c7be38e31fa", "g5-textbook-navigation-v121.js": "4c4c461d96530dfc817c4b0e52b689aa9a236df5eb5ef9b339af08c0bc020d19", "g5-live-pedagogy-v122.js": "1b3dff651e0b1091601e96ef26ecba07e1b72fb3b6160a2f2c1a4a41db0867f6", "g5-arithmetic-tiers-v123.js": "681914639cf718ffb7b1c4b91ae62472c0a4e4f925666b67f417c17331ef8f20", "g5-textbook-tiers-v124.js": "db6d64973d2f35241f19712b0eccd67c65c7a7b8ac88c1b6b4c85c0141e868a2", "g5-natural-units-v125.js": "4b43fae4ad8ae106474a7dc0d7e0cf513b66c2919a3738ddd173f4228ff0132d", "g5-remaining-core-v126.js": "bf571bfac7417cc3f2b5f910bf815581d1ca7e399a6e6b5085236e2d576cf21a", "g5-decimal-tiers-v127.js": "942348f1a06a1b42b4c5c460e74aff2a154679484d6cf60817822d38e9d43602", "g5-decimal-percent-v128.js": "12bfc4d08b3a615a8de264e58b794f1a08c10ff35ab56a5395a99423e65ac642", "g5-fraction-concepts-v129.js": "232112c5ce408fd47523ac0bab4f3df1beeae542306aad169a42faebc68a7dcc", "g5-fraction-applications-v130.js": "b8625e07da2a78538bc291871e355014c8d72ded7f4a2d725136662fc65b399e"};
const BUILD_VERSION = CACHE_NAME.slice(CACHE_NAME.lastIndexOf('-v') + 2);
const scope = new URL(self.registration.scope);
const entry = new URL('index.html', scope);
const snapshotRoot = new URL('__matkvest_snapshot__/', scope);
const snapshot = new URL(APP_BUILD_HASH + '/', snapshotRoot);

function snapshotKey(file) {
  return new URL(file, snapshot).href;
}

async function checkedResponse(url, digest) {
  for (const fresh of [false, true]) {
    const target = new URL(url);
    if (fresh) target.searchParams.set('mk-build', digest);
    let response;
    try {
      response = await fetch(target, {cache: 'no-store', redirect: 'error'});
    } catch (error) {
      if (fresh) throw error;
      continue;
    }
    if (response.ok && response.type !== 'opaque') {
      const hash = await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer());
      const actual = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
      if (actual === digest) return response;
    }
  }
  throw new Error('MatKvest: response does not match this build: ' + url);
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const files = [
      ['index.html', entry, APP_BUILD_HASH],
      ...Object.entries(SCRIPT_HASHES).map(([file, digest]) =>
        [file, new URL(file + '?v=' + BUILD_VERSION, scope), digest])
    ];
    const responses = await Promise.all(files.map(([, url, digest]) => checkedResponse(url, digest)));
    await Promise.all(files.map(([file], index) => cache.put(snapshotKey(file), responses[index])));
    const manifest = new URL('manifest.webmanifest', scope);
    await cache.add(manifest).catch(() => {});
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const previousVersions = names.map(name => {
      const match = /^matkvest-iphone-v(\d+)$/.exec(name);
      return match ? Number(match[1]) : null;
    }).filter(version => version !== null && version < Number(BUILD_VERSION));
    const previous = Math.max(-1, ...previousVersions);
    await Promise.all(previousVersions.filter(version => version !== previous)
      .map(version => caches.delete('matkvest-iphone-v' + version)));
    await self.clients.claim();
  })());
});

async function currentFile(file, url, digest) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(snapshotKey(file));
  if (cached) return cached;
  const response = await checkedResponse(url, digest);
  await cache.put(snapshotKey(file), response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  if (request.mode === 'navigate' && (url.pathname === scope.pathname || url.pathname === entry.pathname)) {
    // Even a successful revalidation can be stale at the CDN. Serve the installed
    // snapshot until a fully verified replacement worker is ready to claim us.
    event.respondWith(currentFile('index.html', entry, APP_BUILD_HASH));
    return;
  }

  const file = url.pathname.slice(scope.pathname.length);
  if (Object.hasOwn(SCRIPT_HASHES, file)) {
    const version = url.searchParams.get('v');
    if (version === BUILD_VERSION) {
      event.respondWith(currentFile(file, url, SCRIPT_HASHES[file]));
    } else if (version && /^\d+$/.test(version)) {
      // A tab already parsing the previous verified document can still use its exact snapshot.
      event.respondWith((async () => {
        const cacheName = 'matkvest-iphone-v' + version;
        if (!(await caches.has(cacheName))) return Response.error();
        const previous = await caches.open(cacheName);
        const exact = await previous.match(request);
        if (exact) return exact;
        const key = (await previous.keys()).find(key =>
          new URL(key.url).pathname.startsWith(snapshotRoot.pathname) &&
          new URL(key.url).pathname.endsWith('/' + file));
        return key ? previous.match(key) : Response.error();
      })());
    }
    return;
  }

  // Restrict asset caching to shipped artwork and the manifest.
  if (!APP_FILES.includes('./' + file)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});
