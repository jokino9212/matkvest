'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync('sw.js', 'utf8');
const listeners = new Map();
const entries = new Map();
let fetchCalls = 0;
const cache = {
  addAll: async () => {},
  match: async key => entries.get(typeof key === 'string' ? key : key.url),
  put: async (key, response) => entries.set(typeof key === 'string' ? key : key.url, response)
};
const caches = {
  open: async () => cache,
  match: async key => cache.match(key),
  keys: async () => ['matkvest-iphone-v71'],
  delete: async () => true
};
const self = {
  location: { origin: 'https://example.test' },
  registration: { scope: 'https://example.test/matkvest/' },
  addEventListener: (event, fn) => listeners.set(event, fn),
  skipWaiting: async () => {},
  clients: { claim: async () => {} }
};
const fetch = async () => { fetchCalls++; return new Response('public asset', { status: 200 }); };
vm.runInNewContext(script, { self, caches, fetch, URL, Response });
assert(listeners.has('fetch'), 'Service Worker must register fetch listener');
function request(path, { destination = '', mode = 'cors', method = 'GET', headers = {} } = {}) {
  return { url: 'https://example.test' + path, destination, mode, method, headers: new Headers(headers) };
}
async function dispatch(req) {
  let responded = false;
  let responsePromise;
  const waits = [];
  listeners.get('fetch')({
    request: req,
    respondWith(p) { responded = true; responsePromise = Promise.resolve(p); },
    waitUntil(p) { waits.push(Promise.resolve(p)); }
  });
  if (responded) await responsePromise;
  await Promise.all(waits);
  return responded;
}
(async () => {
  const privatePaths = [
    '/matkvest/api/me', '/matkvest/api/v1/students/1',
    '/matkvest/auth/session', '/matkvest/profiles/4',
    '/matkvest/wallet', '/matkvest/inventory', '/matkvest/sync',
    '/matkvest/users/1', '/matkvest/admin'
  ];
  for (const path of privatePaths) {
    assert.equal(await dispatch(request(path)), false, path + ': default fetch must bypass SW');
    assert.equal(await dispatch(request(path, { destination: 'image' })), false, path + ': image must bypass SW');
    assert.equal(await dispatch(request(path, { destination: 'document', mode: 'navigate' })), false, path + ': navigate must bypass SW');
  }
  assert.equal(await dispatch(request('/matkvest/assets/public.png', { destination: 'image', headers: { Authorization: 'Bearer test' } })), false);
  assert.equal(await dispatch(request('/matkvest/api/me', { method: 'POST' })), false);
  assert.equal(await dispatch(request('/matkvest/secret-report.pdf', { destination: 'document', mode: 'navigate' })), false, 'unknown navigation must not poison app shell');
  assert.equal(await dispatch(request('/matkvest/user-private.png', { destination: 'image' })), false, 'root image is not explicitly public');
  assert.equal(await dispatch(request('/matkvest/api/export.png', { destination: 'image' })), false, 'API suffix must not bypass path policy');
  assert.equal(await dispatch(request('/other-app/assets/file.png', { destination: 'image' })), false, 'outside SW scope');
  assert.equal(await dispatch(request('/matkvest/assets/public.png', { destination: 'image', headers: { Cookie: 'session=abc' } })), false, 'credentialed resource');
  assert.equal(await dispatch(request('/matkvest/assets/public.png', { destination: 'image' })), true, 'public image should remain cacheable');
  assert.equal(entries.has('https://example.test/matkvest/assets/public.png'), true);
  assert.equal(await dispatch(request('/matkvest/index.html', { destination: 'document', mode: 'navigate' })), true, 'app shell navigation remains network-first');
  for (const path of privatePaths) assert.equal(entries.has('https://example.test' + path), false, 'privacy: ' + path);
  assert(fetchCalls >= 2, 'network-first app shell and public asset must fetch');
  process.stdout.write('stage20 SW privacy: PASS (' + privatePaths.length + ' private endpoint families; static/offline paths preserved)\\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
