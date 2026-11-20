'use strict';

const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const url = process.env.MATKVEST_TEST_URL || pathToFileURL(resolve('index.html')).href;

async function check(browser, width, height) {
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
    await page.locator('.grade-card button[onclick="openGrade(4)"]').tap();
    const summary = page.locator('#mainView summary').filter({ hasText: /^Величины$/ });
    const point = await summary.evaluate(node => {
      const rect = node.getBoundingClientRect();
      const y = (rect.top + rect.bottom) / 2;
      window.scrollBy({ top: Math.round(y - window.innerHeight + 22), behavior: 'instant' });
      const scrolled = node.getBoundingClientRect();
      return { x: scrolled.right - 18, y: (scrolled.top + scrolled.bottom) / 2 };
    });
    assert.equal(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('summary')?.textContent.trim(), point), 'Величины', 'The build control covers the chapter toggle');
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
  const server = process.env.MATKVEST_TEST_PROXY;
  const browser = await chromium.launch(server ? { proxy: { server } } : {});
  try {
    for (const [width, height] of [[320, 568], [390, 640], [844, 390]]) await check(browser, width, height);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
