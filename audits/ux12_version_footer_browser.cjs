'use strict';

const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { createServer } = require('node:http');
const { extname, resolve, sep } = require('node:path');
const { chromium } = require('playwright');

const root = resolve(__dirname, '..');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const localSite = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + sep) || !types[extname(file)]) {
    response.writeHead(404).end();
    return;
  }
  try {
    const contents = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)] }).end(contents);
  } catch {
    response.writeHead(404).end();
  }
});

async function check(browser, url, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
    ignoreHTTPSErrors: !!process.env.MATKVEST_TEST_PROXY
  });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.locator('.grade-card').getByRole('button',{name:'Открыть 4 класс',exact:true}).tap();
    await page.locator('#appFooter[data-v-app]').waitFor();
    const summary = page.locator('#mk-g4-textbook-nav summary').filter({ hasText: /Величины$/ });
    const point = await summary.evaluate(node => {
      const rect = node.getBoundingClientRect();
      const y = (rect.top + rect.bottom) / 2;
      window.scrollBy({ top: Math.round(y - window.innerHeight + 22), behavior: 'instant' });
      const scrolled = node.getBoundingClientRect();
      return { x: scrolled.right - 18, y: (scrolled.top + scrolled.bottom) / 2 };
    });
    assert(await summary.evaluate((node, { x, y }) =>
      document.elementFromPoint(x, y)?.closest('summary') === node, point), 'The build control covers the chapter toggle');
    await page.touchscreen.tap(point.x, point.y);
    assert.equal(await summary.evaluate(node => node.closest('details').open), true);

    const build = page.locator('#appVersionBadge');
    assert.match(await build.innerText(), /^Сборка v\d+$/);
    assert.equal(await build.evaluate(node => {
      const main = document.getElementById('mainView');
      return node.getBoundingClientRect().top >= main.getBoundingClientRect().bottom;
    }), true, 'Version control must appear after the course content');
    await build.scrollIntoViewIfNeeded();
    for (let tap = 0; tap < 7; tap++) await build.tap();
    await page.getByRole('dialog', { name: 'Код разработчика' }).waitFor();
    await page.getByRole('button', { name: 'Отмена', exact: true }).tap();
    assert.equal(await build.evaluate(node => document.activeElement === node), true);
    console.log('PASS version footer', width, height);
  } finally {
    await context.close();
  }
}

(async () => {
  const proxy = process.env.MATKVEST_TEST_PROXY;
  const browser = await chromium.launch(proxy ? { proxy: { server: proxy } } : {});
  try {
    let url = process.env.MATKVEST_TEST_URL;
    if (!url) {
      await new Promise(resolve => localSite.listen(0, '127.0.0.1', resolve));
      url = 'http://127.0.0.1:' + localSite.address().port + '/';
    }
    for (const [width, height] of [[320, 568], [390, 640], [844, 390]]) {
      await check(browser, url, width, height);
    }
  } finally {
    await browser.close();
    if (localSite.listening) localSite.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
