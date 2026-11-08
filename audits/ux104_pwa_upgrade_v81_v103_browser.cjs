'use strict';
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const stagingDir = process.cwd();
const baselineDir = path.resolve(stagingDir, 'baseline_v81');
const CACHE_OLD = 'matkvest-iphone-v81';
const CACHE_NEW = 'matkvest-iphone-v103';
let activeDir = baselineDir;
let server;

function hashOk(root, cache) {
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert(worker.includes('const CACHE_NAME = "' + cache + '";'), 'Expected PWA cache ' + cache);
  const fp = worker.match(/const APP_BUILD_HASH\s*=\s*"([a-f0-9]{64})"/)?.[1];
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'index.html'))).digest('hex');
  assert.equal(fp, hash, cache + ' PWA fingerprint mismatch');
}
function serve() {
  return http.createServer((req, res) => {
    let name;
    try { name = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
    catch { res.writeHead(400); return res.end(); }
    const base = activeDir;
    const file = path.resolve(base, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(base + path.sep)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end('Not found'); }
      const ext = path.extname(file);
      const type = ({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
        '.svg':'image/svg+xml','.webmanifest':'application/manifest+json; charset=utf-8'})[ext] || 'application/octet-stream';
      res.writeHead(200, {'Content-Type':type, 'Cache-Control':'no-store, max-age=0'});
      res.end(data);
    });
  });
}
async function inspect(page) {
  return page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mq4_profiles') || '{}');
    const draft = mk872ReadDraft();
    const names = Object.keys(saved);
    return {current:currentProfile, xp:state.xp, coins:state.coins,
      profileId:state.profileId, progress:progressFor('g7:rational_numbers_forms').best[0],
      a:saved['Релиз A']?.profileId, b:saved['Релиз B']?.profileId,
      balanceA:[saved['Релиз A']?.xp,saved['Релиз A']?.coins],
      balanceB:[saved['Релиз B']?.xp,saved['Релиз B']?.coins],
      draft:draft?.attemptId || null, draftUsable:draft?mk872DraftUsable(draft):false,
      names, cacheController:!!navigator.serviceWorker.controller};
  });
}
async function scenario(browser, origin, width) {
  activeDir = baselineDir;
  const context = await browser.newContext({viewport:{width,height:780},
    isMobile:width<=430,hasTouch:width<=430,serviceWorkers:'allow'});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));
  try {
    await page.goto(origin,{waitUntil:'domcontentloaded'});
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    const seeded = await page.evaluate(() => {
      const a=ensureProfileIdentity({...EMPTY_STATE,xp:321,coins:789,
        courseProgress:{'g7:rational_numbers_forms':{best:[2,0,0],bonus:[false,false,false]}}});
      const b=ensureProfileIdentity({...EMPTY_STATE,xp:654,coins:432});
      localStorage.setItem('mq4_profiles',JSON.stringify({'Релиз A':a,'Релиз B':b}));
      localStorage.setItem('mq4_current_profile','Релиз A');
      localStorage.setItem('mq4',JSON.stringify(a));
      return {a:a.profileId,b:b.profileId};
    });
    await page.reload({waitUntil:'domcontentloaded'});
    const beforeDraft = await inspect(page);
    assert.equal(beforeDraft.current,'Релиз A');
    assert.equal(beforeDraft.xp,321);
    assert.equal(beforeDraft.coins,789);
    assert.equal(beforeDraft.progress,2);
    assert.deepEqual(beforeDraft.balanceB,[654,432]);
    const started = await page.evaluate(() => {
      startG7QuizStage('g7:rational_numbers_forms',0);
      skipNormalQuiz();
      if (!mk872PersistDraft()) throw Error('Failed to persist v81 attempt');
      const draft=mk872ReadDraft();
      return {id:draft?.attemptId,valid:mk872DraftUsable(draft),done:blockSession.done};
    });
    assert(started.id&&started.valid, 'v81 training draft was not created');
    const oldCache=await page.evaluate(async()=>({keys:await caches.keys(),controller:!!navigator.serviceWorker.controller}));
    assert(oldCache.keys.includes(CACHE_OLD), 'v81 cache missing');

    // Simulate deployment at exactly the SAME origin, without touching user storage.
    activeDir = stagingDir;
    await page.evaluate(async () => {
      const registration=await navigator.serviceWorker.getRegistration();
      if(!registration)throw Error('Existing service worker not found');
      await registration.update();
    });
    await page.waitForFunction(async()=> (await caches.keys()).includes('matkvest-iphone-v103'),null,{timeout:90000});
    await page.waitForFunction(async()=> !(await caches.keys()).includes('matkvest-iphone-v81'),null,{timeout:90000});
    await page.reload({waitUntil:'domcontentloaded'});
    const online = await inspect(page);
    assert.equal(online.current,'Релиз A');
    assert.equal(online.xp,321);
    assert.equal(online.coins,789);
    assert.equal(online.progress,2);
    assert.equal(online.profileId,seeded.a);
    assert.deepEqual(online.balanceB,[654,432]);
    assert.equal(online.a,seeded.a);
    assert.equal(online.b,seeded.b);
    assert.equal(online.draft,started.id);
    assert(online.draftUsable,'v81 training draft not usable in v103');
    assert(online.cacheController,'v103 worker does not control app');

    await context.setOffline(true);
    await page.reload({waitUntil:'domcontentloaded',timeout:20000});
    const offline = await inspect(page);
    assert.equal(offline.current,online.current);
    assert.equal(offline.xp,online.xp);
    assert.equal(offline.coins,online.coins);
    assert.equal(offline.profileId,online.profileId);
    assert.equal(offline.draft,started.id);
    assert(offline.draftUsable,'Offline upgrade lost pending attempt');
    assert.equal(offline.progress,2);
    const offlineUI=await page.evaluate(()=>{
      openGrade(6);const grade=currentGrade;openShop('stickers','all');
      return {grade,shop:!!document.querySelector('.shop-tabs'),
       cache:navigator.serviceWorker.controller?.scriptURL,
       pageWidth:document.documentElement.clientWidth,
       scrollWidth:document.documentElement.scrollWidth};
    });
    assert.equal(offlineUI.grade,6);
    assert(offlineUI.shop,'Stickers shop unavailable offline');
    assert(offlineUI.scrollWidth<=offlineUI.pageWidth+2,'Offline layout overflow');
    assert.deepEqual(errors,[],'JavaScript page errors');
    console.log('PASS_UX104_UPGRADE', JSON.stringify({width,
      oldCache:oldCache.keys, newCache:CACHE_NEW,
      initial:{profiles:beforeDraft.names,coins:beforeDraft.coins,xp:beforeDraft.xp},
      pendingAttempt:{id:started.id,done:started.done},
      afterUpgrade:{coins:online.coins,xp:online.xp,draftUsable:online.draftUsable},
      offline:offlineUI}));
  } finally { await context.close(); }
}
async function main() {
  hashOk(baselineDir,CACHE_OLD);
  hashOk(stagingDir,CACHE_NEW);
  server=serve();
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const origin='http://127.0.0.1:'+server.address().port+'/';
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const failures=[];
  try {
    for(const width of [320,390]) {
      try { await scenario(browser,origin,width); }
      catch(e) { failures.push({width,error:String(e)}); console.error('FAIL_UX104_UPGRADE',width,e.stack||e); }
    }
  } finally { await browser.close(); await new Promise(ok=>server.close(ok)); }
  console.log('UX104_UPGRADE_SUMMARY', JSON.stringify({tested:[320,390],failures}));
  if(failures.length)process.exitCode=1;
}
main().catch(e=>{console.error('FATAL_UX104_UPGRADE',e.stack||e);process.exitCode=1});