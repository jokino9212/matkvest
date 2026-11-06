'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync('sw.js', 'utf8');
const listeners = new Map();
const entries = new Map();
let fetchCalls = 0;
let responseFactory = request => new Response('public asset', {
  status: 200,
  headers: { 'Content-Type': request.mode === 'navigate' ? 'text/html' : 'image/png' }
});
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
const fetch = async request => { fetchCalls++; return responseFactory(request); };
vm.runInNewContext(script, { self, caches, fetch, URL, Response });
assert(listeners.has('fetch'), 'Service Worker must register fetch listener');
function request(path, { destination = '', mode = 'cors', method = 'GET', headers = {} } = {}) {
  return { url: 'https://example.test' + path, destination, mode, method, headers: new Headers(headers) };
}
let lastResponse = null;
async function dispatch(req) {
  let responded = false;
  let responsePromise;
  const waits = [];
  listeners.get('fetch')({
    request: req,
    respondWith(p) { responded = true; responsePromise = Promise.resolve(p); },
    waitUntil(p) { waits.push(Promise.resolve(p)); }
  });
  lastResponse = responded ? await responsePromise : null;
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
  // Cache must never accept private/no-store/redirected responses, even on allowlisted URLs.
  const before = entries.size;
  const originalShell = await entries.get('./index.html').clone().text();
  assert.equal(originalShell, 'public asset', 'canonical HTML must enter offline cache');
  responseFactory = () => new Response('private content', { headers: { 'Cache-Control': 'private, no-store' } });
  assert.equal(await dispatch(request('/matkvest/assets/secret.png', { destination: 'image' })), true);
  assert.equal(entries.size, before, 'private static response cannot enter cache');
  responseFactory = () => {
    const response = new Response('redirected content');
    Object.defineProperty(response, 'redirected', { value: true });
    return response;
  };
  assert.equal(await dispatch(request('/matkvest/assets/redirect.png', { destination: 'image' })), true);
  assert.equal(entries.size, before, 'redirected static resource cannot enter cache');
  assert.equal(await dispatch(request('/matkvest/index.html', { destination: 'document', mode: 'navigate' })), true);
  assert.equal(entries.size, before, 'redirected navigation cannot replace cached shell');
  assert.equal(await entries.get('./index.html').clone().text(), originalShell, 'redirect must not overwrite existing shell');
  responseFactory = () => { throw new Error('offline'); };
  const offline = await dispatch(request('/matkvest/index.html', { destination: 'document', mode: 'navigate' }));
  assert.equal(offline, true, 'offline shell fallback must remain intercepted');
  assert.equal(await lastResponse.text(), originalShell, 'offline fallback must serve exact cached HTML');
  assert(fetchCalls >= 2, 'network-first app shell and public asset must fetch');
  process.stdout.write('stage20 SW privacy: PASS (' + privatePaths.length + ' private endpoint families; static/offline paths preserved)\\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
