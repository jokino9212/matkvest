#!/usr/bin/env python3
"""Prepare the deterministic Android Grade-5 stale-PWA fix (issue #91).

Idempotent on the release branch. Applies versioned script URLs for transition
from the cache-first v157 worker, then fixes the service worker and its exact
SHA256 HTML fingerprint. NEVER touches localStorage, IndexedDB, profiles or data.
"""
from pathlib import Path
import hashlib
import re
import sys

ROOT=Path(__file__).resolve().parent.parent
INDEX=ROOT/"index.html"
WORKER=ROOT/"sw.js"
TAG_RE=re.compile(r'<script src="(g5-[\w-]+\.js)(?:\?v=\d+)?"></script>')
V="158"

SW_BODY=r'''// PWA v158: an HTML document and its Grade 5 JS must never mix releases online.
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
'''

def build():
    html=INDEX.read_text(encoding="utf-8")
    ids=TAG_RE.findall(html)
    if len(ids)<18 or len(ids)>30 or len(ids)!=len(set(ids)):
        raise SystemExit(f"Unsafe Grade-5 tag list ({len(ids)}): {ids}")
    updated_html=TAG_RE.sub(lambda m: f'<script src="{m.group(1)}?v={V}"></script>',html)
    if updated_html.count("?v=158")!=len(ids):
        raise SystemExit("Failed to pin all Grade-5 scripts to release 158")
    source=WORKER.read_text(encoding="utf-8")
    marker="// Navigation must prefer the network:"
    marker2="// PWA v158: an HTML document"
    if marker in source:
        core=source.split(marker,1)[0]
    elif marker2 in source:
        core=source.split(marker2,1)[0]
    else:
        raise SystemExit("Cannot find worker event handlers; refusing unsafe rewrite")
    core,count=re.subn(r'const CACHE_NAME = "matkvest-iphone-v\d+";',
                       'const CACHE_NAME = "matkvest-iphone-v158";',core)
    if count!=1:
        raise SystemExit("Missing unique worker cache declaration")
    expected_hash=hashlib.sha256(updated_html.encode("utf-8")).hexdigest()
    core,count=re.subn(r'const APP_BUILD_HASH = "[a-f0-9]{64}";',
                       f'const APP_BUILD_HASH = "{expected_hash}";',core)
    if count!=1 or 'const APP_FILES =' not in core:
        raise SystemExit("Missing worker hash or asset list")
    updated_worker=core+SW_BODY
    return html,updated_html,source,updated_worker,ids,expected_hash

def main():
    old_html,new_html,old_sw,new_sw,ids,hash_hex=build()
    check="--check" in sys.argv
    if check:
        if old_html!=new_html or old_sw!=new_sw:
            raise SystemExit("FAIL: Android PWA v158 patch is not applied or fingerprint mismatch")
    else:
        if old_html!=new_html: INDEX.write_text(new_html,encoding="utf-8")
        if old_sw!=new_sw: WORKER.write_text(new_sw,encoding="utf-8")
    print("PASS_G5_PWA_V158",{
        "mode":"check" if check else "apply",
        "updatedGrade5Scripts":len(ids),
        "cache":"matkvest-iphone-v158",
        "htmlSha256":hash_hex,
        "jsNetworkFirst":True,
        "userStorageUntouched":True,
    })

if __name__=="__main__":main()
