'use strict';
const {readFile} = require('node:fs/promises');
const {createServer} = require('node:http');
const {extname, resolve, sep} = require('node:path');
const {chromium} = require('playwright');

const root = resolve(__dirname, '..');
const prefix = '/matkvest/';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

async function withMatkvestBrowser(run) {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (!pathname.startsWith(prefix)) return response.writeHead(404).end();
      const file = resolve(root, pathname.slice(prefix.length) || 'index.html');
      if (!file.startsWith(root + sep)) return response.writeHead(404).end();
      const body = await readFile(file);
      response.writeHead(200, {
        'Content-Type': mime[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      }).end(body);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.MATKVEST_CHROMIUM || undefined,
      args: ['--no-sandbox'],
    });
    try {
      await run(browser, 'http://127.0.0.1:' + server.address().port + prefix);
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

async function openGrade5Textbook(page) {
  await page.evaluate(() => openGrade(5));
  await page.locator('#grade5Vue[data-v-app] #mk-g5-textbook-nav').waitFor({state: 'attached'});
}

module.exports = {withMatkvestBrowser, openGrade5Textbook};
