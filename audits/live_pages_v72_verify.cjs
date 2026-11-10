'use strict';
// Verify what GitHub Pages actually serves; do not infer production from a merge.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');

const url = process.env.MATKVEST_PAGES_URL || 'https://jokino9212.github.io/matkvest/';
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function main() {
  const expectedHtmlHash = digest(fs.readFileSync('index.html'));
  const serviceWorkerSource = fs.readFileSync('sw.js', 'utf8');
  assert(serviceWorkerSource.includes('matkvest-iphone-v72'), 'Local build is not v72');
  assert(serviceWorkerSource.includes(expectedHtmlHash), 'Local sw.js hash differs from index.html');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    fs.mkdirSync('audits/screenshots', { recursive: true });
    for (const width of [320, 360, 375, 390, 412]) {
      const context = await browser.newContext({
        viewport: { width, height: 850 }, isMobile: true, hasTouch: true,
        serviceWorkers: 'block', extraHTTPHeaders: { 'Cache-Control': 'no-cache' }
      });
      const page = await context.newPage();
      const response = await page.goto(url + '?live-v72-width=' + width + '&ts=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
      assert(response && response.status() === 200, 'Pages HTML HTTP status not 200 at ' + width);
      const htmlBuffer = Buffer.from(await response.body());
      const remoteHtmlHash = digest(htmlBuffer);
      assert.equal(remoteHtmlHash, expectedHtmlHash, 'Pages served stale/different HTML at ' + width + 'px: expected ' + expectedHtmlHash + ', got ' + remoteHtmlHash);
      const swResponse = await page.request.get(new URL('sw.js?live-v72=' + Date.now(), url).href, { headers: { 'Cache-Control': 'no-cache' }, timeout: 30000 });
      assert.equal(swResponse.status(), 200, 'Pages sw.js status');
      assert.equal((await swResponse.text()).trim(), serviceWorkerSource.trim(), 'Pages sw.js differs from local v72');
      const hasApp = await page.evaluate(() => typeof startColumnStage === 'function' && typeof renderDivision === 'function' && typeof divisionSteps === 'function');
      assert(hasApp, 'Application long division functions unavailable on live Pages');
      await page.evaluate(() => {
        startColumnStage('div', 0);
        task = { a: 14067, b: 3, quotient: '4689', ans: 4689, steps: divisionSteps(14067, 3) };
        renderDivision();
      });
      await page.locator('.column-modal .div-layout .qin').first().waitFor();
      const geometry = await page.evaluate(() => {
        const card = document.querySelector('.column-modal .card').getBoundingClientRect();
        const layout = document.querySelector('.column-modal .div-layout').getBoundingClientRect();
        const parts = ['.div-fixed', '.div-work-in', '.div-op', '.div-rule', '.qin', '.divisor-box']
          .flatMap(sel => Array.from(document.querySelectorAll('.column-modal .div-layout ' + sel)));
        return { cellCount: parts.length, outside: parts.filter(el => {
          const b = el.getBoundingClientRect(); return b.left < card.left - 2 || b.right > card.right + 2;
        }).length, layoutRight: layout.right, cardRight: card.right, viewport: innerWidth };
      });
      assert(geometry.cellCount >= 20, 'Missing long-division cells: ' + JSON.stringify(geometry));
      assert.equal(geometry.outside, 0, 'Clipped cells: ' + JSON.stringify(geometry));
      assert(geometry.layoutRight <= geometry.viewport + 1, 'Layout beyond viewport: ' + JSON.stringify(geometry));
      await page.screenshot({ path: 'audits/screenshots/pages-live-v72-' + width + '.png' });
      console.log('PASS live Pages: ' + width + 'px, HTML SHA256=' + remoteHtmlHash + ', ' + geometry.cellCount + ' cells');
      await context.close();
    }
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
