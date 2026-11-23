'use strict';
const assert = require('node:assert/strict');
const {withMatkvestBrowser} = require('./matkvest_browser_harness.cjs');

function summary() {
  return {
    profileId: state.profileId,
    xp: state.xp,
    coins: state.coins,
    completed: (state.attemptHistory || []).filter(r => r.status === 'finished').map(r => r.id),
    quick: (state.trainingHistory || []).map(r => r.id),
  };
}
async function waitForApp(page) {
  await page.waitForFunction(() => typeof mk854Route === 'function' && mk854HistoryReady === true, null,
    {timeout: 30000});
}
async function exercise(browser, base, width) {
  const context = await browser.newContext({
    viewport: {width, height: 850}, isMobile: width < 500, hasTouch: width < 500,
    serviceWorkers: 'allow',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(base, {waitUntil: 'domcontentloaded'});
    await waitForApp(page);
    assert.equal(await page.evaluate(() => typeof window.MatKvestRouteCore), 'object',
      'External route core was not loaded');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({waitUntil: 'domcontentloaded'});
    await waitForApp(page);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, {timeout: 30000});
    const cache = await page.evaluate(async () => {
      const names = await caches.keys(), entry = await caches.open('matkvest-iphone-v269');
      const keys = (await entry.keys()).map(key => key.url);
      return {names, hasRoute: keys.some(url => url.endsWith('/assets/ui/legacy-navigation-core.js'))};
    });
    assert(cache.names.includes('matkvest-iphone-v269'), 'PWA v269 not installed');
    assert(cache.hasRoute, 'Route module missing from the verified offline snapshot');
    assert.equal(await page.evaluate(() => mk854Route().screen), 'home');
    await page.evaluate(() => openProfiles());
    const name = 'Маршрут 269 ' + width;
    await page.locator('#newProfileName').fill(name);
    await page.locator('#newProfileName').press('Enter');
    await page.waitForFunction(expected => currentProfile === expected, name);
    await page.evaluate(() => openGrade(4));
    await page.waitForFunction(() => mk854Route().screen === 'grade' && mk854Route().grade === 4);
    const depth = await page.evaluate(() => mk854Depth());
    assert(depth > 0, 'No route history depth');
    const before = await page.evaluate(summary);
    await page.evaluate(() => openQuickTrainer('squares'));
    await page.waitForFunction(() => mk854Route().screen === 'trainer');
    const stage = page.locator('#quickStage');
    await stage.getByRole('button', {name: 'Начать тренировку', exact: true}).press('Enter');
    const answer = await page.evaluate(() => String(quickQuestion.correct));
    await stage.getByRole('button', {name: answer, exact: true}).press('Space');
    await stage.getByRole('button', {name: 'Завершить тренировку', exact: true}).press('Enter');
    await stage.getByRole('heading', {name: 'Тренировка завершена!', exact: true}).waitFor();
    const completed = await page.evaluate(summary);
    assert(completed.quick.length > before.quick.length, 'Quick result not stored');
    assert(completed.xp > before.xp || completed.coins > before.coins,
      'Rewards were not credited');
    const routeBefore = await page.evaluate(() => ({...mk854Route(), depth: mk854Depth()}));
    await context.setOffline(true);
    await page.reload({waitUntil: 'domcontentloaded'});
    await waitForApp(page);
    const offline = await page.evaluate(() => ({
      route: {...mk854Route(), depth: mk854Depth()},
      summary: {
        profileId: state.profileId,
        xp: state.xp,
        coins: state.coins,
        completed: (state.attemptHistory || []).filter(r => r.status === 'finished').map(r => r.id),
        quick: (state.trainingHistory || []).map(r => r.id),
      },
      core: typeof window.MatKvestRouteCore,
      controlled: !!navigator.serviceWorker.controller,
    }));
    assert(offline.controlled, 'Offline F5 was not served by PWA');
    assert.equal(offline.core, 'object', 'Route core absent after offline F5');
    assert.deepEqual(offline.route, routeBefore, 'Route lost after offline F5');
    assert.deepEqual(offline.summary, completed, 'Result or reward duplicated after offline F5');
    await page.goBack();
    await page.waitForFunction(() => mk854Route().screen === 'grade', null, {timeout: 15000});
    assert.deepEqual(await page.evaluate(summary), completed,
      'Browser Back changed completed results or rewards');
    await page.goForward();
    await page.waitForFunction(() => mk854Route().screen === 'trainer', null, {timeout: 15000});
    assert.deepEqual(await page.evaluate(summary), completed,
      'Browser Forward changed completed results or rewards');
    assert.deepEqual(errors, [], 'JavaScript exceptions during PWA/route test');
    console.log('PASS_ROUTE_V269', JSON.stringify({width, offlineF5: true, keyboard: true,
      history: true, quickResults: completed.quick.length, xp: completed.xp, coins: completed.coins,
      fallback: 'separately verified'}));
  } finally {
    await context.close();
  }
}
async function missingModuleFallback(browser, base) {
  const context = await browser.newContext({serviceWorkers: 'block'});
  await context.route('**/assets/ui/legacy-navigation-core.js*', route => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(base, {waitUntil: 'domcontentloaded'});
    await waitForApp(page);
    assert.equal(await page.evaluate(() => typeof window.MatKvestRouteCore), 'undefined',
      'Fallback probe accidentally loaded the module');
    assert.equal(await page.evaluate(() => mk854Route().screen), 'home');
    await page.evaluate(() => openGrade(4));
    await page.waitForFunction(() => mk854Route().screen === 'grade' && mk854Route().grade === 4);
    await page.evaluate(() => openQuickTrainer('squares'));
    await page.waitForFunction(() => mk854Route().screen === 'trainer');
    assert(await page.evaluate(() => mk854Depth()) > 0);
    assert.deepEqual(errors, [], 'Legacy fallback raised JavaScript errors');
    console.log('PASS_LEGACY_FALLBACK', JSON.stringify({moduleBlocked: true, grade: 4, trainer: true}));
  } finally {
    await context.close();
  }
}
withMatkvestBrowser(async (browser, base) => {
  for (const width of [390, 1280]) await exercise(browser, base, width);
  await missingModuleFallback(browser, base);
}).catch(e => {console.error(e); process.exitCode = 1;});
