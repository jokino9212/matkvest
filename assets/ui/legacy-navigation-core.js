/* Legacy route helpers. No DOM, storage or network dependencies.
 * The existing index.html route handlers remain the runtime owners until
 * browser/offline integration is verified. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MatKvestRouteCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const HOME = Object.freeze({ screen: 'home' });
  function currentRoute(state) {
    return state && state.__matkvest854 && state.route ? state.route : { ...HOME };
  }
  function currentDepth(state) {
    return state && state.__matkvest854 ? Math.max(0, Number(state.depth || 0)) : 0;
  }
  function sameRoute(a, b) {
    try { return JSON.stringify(a || {}) === JSON.stringify(b || {}); }
    catch (_) { return false; }
  }
  function writeHistory(history, route, mode = 'push', onError) {
    const current = currentRoute(history.state);
    const depth = currentDepth(history.state);
    if (mode === 'push' && sameRoute(current, route)) return false;
    const payload = {
      __matkvest854: true,
      depth: mode === 'push' ? depth + 1 : depth,
      route,
    };
    try {
      if (mode === 'replace') history.replaceState(payload, '');
      else history.pushState(payload, '');
      return true;
    } catch (error) {
      if (typeof onError === 'function') onError(error);
      return false;
    }
  }
  function freshVueActions(actions = {}, overrides = {}) {
    // Keep fresh action references on each render; never memoize closures.
    return { ...actions, ...overrides };
  }
  return { currentRoute, currentDepth, sameRoute, writeHistory, freshVueActions };
});
