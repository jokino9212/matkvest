'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const avatarFolder = 'assets/source/avatars';
const files = fs.readdirSync(path.join(root, avatarFolder)).filter(file => file.endsWith('.webp')).sort();
assert.equal(files.length, 9);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!filename.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  fs.readFile(filename, (error, bytes) => {
    if (error) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream' });
    response.end(bytes);
  });
});

async function verify(width, browser, url) {
  const context = await browser.newContext({viewport: {width, height: 820}, isMobile: width < 500, hasTouch: width < 500});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const newArt = '#modal .shop-grid img[src^="./assets/source/avatars/"]';
  const starter = 'av_mq_ivy_cartographer';
  const starterSrc = './assets/source/avatars/' + starter + '-v2.webp';
  try {
    await page.goto(url);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    const catalog = await page.evaluate(() => {
      const items = mk872ModernCatalog();
      return {
        ids: items.map(item => item.id),
        active: mk872ActiveCollectionItems('avatars').length,
        legacy: SHOP_CATALOG.avatars.filter(item => item.legacyHero).length,
        beginner: items.filter(item => item.level === 1).map(item => item.price)
      };
    });
    assert.equal(new Set(catalog.ids).size, 30);
    assert.equal(catalog.active, 30);
    assert.equal(catalog.legacy, 34);
    assert.deepEqual(catalog.beginner.sort((a,b)=>a-b), [60, 85, 105]);
    await context.setOffline(true);
    await page.reload();

    await page.evaluate(() => {
      state.xp = 0;
      state.coins = 200;
      state.inventory.avatars = ['av_default', 'av_robot'];
      save();
      openShop('avatars', 'all');
    });
    assert.equal(await page.locator('#modal .mk868-final-hero-card').count(), 30);
    const opened = await page.locator(newArt).evaluateAll(async images => {
      await Promise.all(images.map(image => image.decode()));
      return images.map(image => ({ file: image.src.split('/').pop(), width: image.naturalWidth, height: image.naturalHeight }));
    });
    assert.deepEqual(opened.map(image => image.file).sort(), files);
    assert(opened.every(image => image.width === 512 && image.height === 512));

    const first = page.locator('.mk868-final-hero-card').filter({
      has: page.locator('img[src="' + starterSrc + '"]')
    });
    await first.locator('.shop-icon').click();
    const viewer = page.locator('#mk872AvatarViewer');
    assert(await viewer.isVisible());
    assert.equal(await viewer.locator('img').getAttribute('src'), starterSrc);
    await page.keyboard.press('Escape');
    await viewer.waitFor({state: 'hidden'});

    await first.locator('button[onclick*="buyShopItem"]').click();
    const bought = await page.evaluate(() => ({
      coins: state.coins, equipped: state.equipped.avatar,
      avatars: [...state.inventory.avatars]
    }));
    assert.equal(bought.coins, 140);
    assert.equal(bought.equipped, starter);
    assert(bought.avatars.includes('av_robot'));

    await page.reload();
    const restored = await page.evaluate(() => ({ equipped: state.equipped.avatar, owned: state.inventory.avatars }));
    assert.equal(restored.equipped, starter);
    assert(restored.owned.includes(starter) && restored.owned.includes('av_robot'));

    for (const [open, selector] of [
      ['openCollection()', '#modal .mk872-col-card img'],
      ['openProfiles()', '#modal img'],
      ['openLeaderboard()', '.leader-table .avatar-core img']
    ]) {
      await page.evaluate(open);
      const artwork = page.locator(selector).and(page.locator('img[src="' + starterSrc + '"]')).first();
      await artwork.waitFor({state: 'attached'});
      assert.equal(await artwork.evaluate(async image => { await image.decode(); return image.naturalWidth; }), 512);
    }
    assert.deepEqual(errors, []);
    console.log('PASS', width, '30 active heroes, all 9 artworks offline, purchase, archive and equip persisted');
  } finally {
    await context.close();
  }
}

(async () => {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const browser = await chromium.launch({args: ['--no-sandbox']});
  try {
    const url = 'http://127.0.0.1:' + server.address().port + '/';
    for (const width of [320, 390, 1280]) await verify(width, browser, url);
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
