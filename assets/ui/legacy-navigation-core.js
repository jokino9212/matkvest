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
  function shouldDeferRestore(route) {
    const r = route && route.screen ? route : HOME;
    if (['store', 'chest', 'quests', 'profiles'].includes(r.screen)) return true;
    return (r.screen === 'grade' || r.screen === 'topic') &&
      [1, 2, 3, 4, 5, 6, 7, 8].includes(Number(r.grade));
  }
  // Screen dispatch is pure: all application-specific stateful handlers are injected
  // freshly by index.html. The full inline dispatcher remains the fallback.
  function dispatchRoute(route, handlers = {}) {
    const r = route && route.screen ? route : { ...HOME };
    const key = r.screen;
    if (['home', 'grade', 'topic', 'trainer', 'store', 'leaderboard', 'quests', 'profiles'].includes(key) &&
        typeof handlers[key] === 'function') return handlers[key](r);
    if (typeof handlers.other === 'function' && handlers.other(r)) return true;
    return typeof handlers.home === 'function' ? handlers.home({ ...HOME }) : undefined;
  }
  function homeVueActions(run) { return { run }; }
  function trainingPlanReturnVueActions(returnToPlan) { return { returnToPlan }; }
  function freshVueActions(actions = {}, overrides = {}) {
    // Keep fresh action references on each render; never memoize closures.
    return { ...actions, ...overrides };
  }
  return { currentRoute, currentDepth, sameRoute, writeHistory, shouldDeferRestore, dispatchRoute, homeVueActions, trainingPlanReturnVueActions, freshVueActions };
});
