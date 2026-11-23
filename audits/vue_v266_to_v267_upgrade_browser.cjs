'use strict';
// One-way upgrade v266 -> private candidate v267. This test must start on
// today's original v266, not on an old draft-schema fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { chromium } = require('playwright');

const oldRoot = path.resolve(process.argv[2] || '');
const newRoot = path.resolve(process.argv[3] || '');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function build(root, expectedVersion) {
  const html = fs.readFileSync(path.join(root, 'index.html'));
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const version = Number(worker.match(/const CACHE_NAME = "matkvest-iphone-v(\d+)";/)?.[1]);
  assert.equal(version, expectedVersion, 'Unexpected PWA build');
  assert.equal(sha(html), worker.match(/const APP_BUILD_HASH = "([a-f0-9]{64})";/)?.[1],
    'HTML snapshot hash mismatch');
  return { root, html, worker, version };
}
const baseline = build(oldRoot, 266);
const candidate = build(newRoot, 267);
const mounts = new Map();
const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.webp':'image/webp',
  '.png':'image/png'};
const server = http.createServer((request,response)=>{
  const url = new URL(request.url,'http://localhost');
  const [,mount,...parts] = url.pathname.split('/');
  const slot = mounts.get(mount);
  if(!slot)return response.writeHead(404).end();
  const relative = parts.join('/') || 'index.html';
  const release = slot.release;
  if(relative==='sw.js'){
    return response.writeHead(200,{'Content-Type':'text/javascript',
      'Cache-Control':'no-store'}).end(release.worker);
  }
  const file = path.resolve(release.root,relative);
  if(!file.startsWith(release.root+path.sep)){
    return response.writeHead(403).end();
  }
  try{
    const body = relative==='index.html' ? release.html : fs.readFileSync(file);
    return response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(body);
  }catch(error){return response.writeHead(404).end();}
});
async function version(page,expected){
  try {
    await page.waitForFunction(v => {
      if (!navigator.serviceWorker.controller)return false;
      // A URL from the actual document proves which JavaScript build is running.
      return document.documentElement.outerHTML.includes('knowledge-map.js?v='+v);
    },expected,{timeout:12000});
  } catch (error) {
    const debug=await page.evaluate(async()=>{
      const reg=await navigator.serviceWorker.getRegistration();
      const keys=await caches.keys();
      const details=await Promise.all(keys.map(async name=>{
        const cache=await caches.open(name),entries=await cache.keys();
        const key=entries.find(req=>req.url.includes('__matkvest_snapshot__') &&
          req.url.endsWith('/index.html'));
        const html=key ? await (await cache.match(key)).text() : '';
        return {name,entries:entries.length,
          cachedOld:html.includes('knowledge-map.js?v=266'),
          cachedNew:html.includes('knowledge-map.js?v=267')};
      }));
      return {
        htmlOld:document.documentElement.outerHTML.includes('knowledge-map.js?v=266'),
        htmlNew:document.documentElement.outerHTML.includes('knowledge-map.js?v=267'),
        active:reg?.active?.state,waiting:reg?.waiting?.state,installing:reg?.installing?.state,
        activeIsController:reg?.active===navigator.serviceWorker.controller,
        controlled:!!navigator.serviceWorker.controller,controllerState:navigator.serviceWorker.controller?.state,
        scope:reg?.scope,caches:details,
      };
    }).catch(e=>({diagnosticError:String(e)}));
    console.error('UPGRADE_VERSION_TIMEOUT',JSON.stringify({expected,debug}));
    throw error;
  }
  assert(await page.evaluate(async v => (await caches.keys()).includes('matkvest-iphone-v'+v),
    expected),'Missing versioned PWA snapshot cache');
}
async function profile(page,name){
  await page.evaluate(()=>openProfiles());
  await page.locator('#newProfileName').fill(name);
  await page.locator('#newProfileName').press('Enter');
  await page.waitForFunction(n=>currentProfile===n,name);
}
async function completedQuick(page){
  await page.evaluate(()=>openQuickTrainer('squares'));
  await page.locator('#quickStage').getByRole('button',{name:'Начать тренировку',exact:true}).press('Enter');
  const answer = await page.evaluate(()=>String(quickQuestion.correct));
  await page.locator('#quickStage').getByRole('button',{name:answer,exact:true}).press('Space');
  await page.locator('#quickStage').getByRole('button',{name:'Завершить тренировку',exact:true}).press('Enter');
  await page.locator('#quickStage').getByRole('heading',{name:'Тренировка завершена!',exact:true}).waitFor();
}
async function unfinishedSchool(page){
  await page.evaluate(()=>{openGrade(4);startTableStage(0);});
  await page.locator('#fin').waitFor();
  const correct=await page.evaluate(()=>String(ta*tb));
  await page.locator('#fin').fill(correct);
  await page.locator('#tablePrimary').press('Enter');
  await page.locator('#tfb').getByText(/Верно!/).waitFor();
  const saved=await page.evaluate(()=>{
    const ok=mk872PersistDraft(),draft=mk872ReadDraft();
    return {ok,id:draft?.attemptId,schema:draft?.schema,done:blockSession?.done};
  });
  assert(saved.ok && saved.id,'School attempt draft was not saved');
  return saved;
}
const snapshot = page => page.evaluate(()=>{
  const draft=mk872ReadDraft();
  return {
    profile:currentProfile,
    profileId:state.profileId,
    xp:state.xp,coins:state.coins,
    history:(state.attemptHistory||[]).filter(record=>record.status==='finished')
      .map(record=>record.id),
    quickHistory:(state.trainingHistory||[]).map(record=>record.id),
    draftId:draft?.attemptId,
    draftSchema:draft?.schema,
  };
});
async function scenario(browser,width){
  const name='upgrade'+width,slot={release:baseline};
  mounts.set(name,slot);
  const context=await browser.newContext({viewport:{width,height:850},
    isMobile:width<500,hasTouch:width<500,serviceWorkers:'allow'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    const url='http://127.0.0.1:'+server.address().port+'/'+name+'/';
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.reload({waitUntil:'domcontentloaded'});
    await version(page,baseline.version);
    await profile(page,'Ученик v267 '+width);
    await completedQuick(page);
    const draft=await unfinishedSchool(page);
    const before=await snapshot(page);
    assert(before.quickHistory.length>0 && before.xp>0 && before.coins>0,
      'Missing baseline training and rewards');
    assert.equal(before.draftId,draft.id);
    slot.release=candidate;
    try{
      await page.evaluate(async()=>{
        const registration=await navigator.serviceWorker.getRegistration();
        await registration.update();
      });
    }catch(error){
      if(!/Execution context was destroyed/.test(String(error)))throw error;
    }
    await page.waitForFunction(async v=>(await caches.keys()).includes('matkvest-iphone-v'+v),
      candidate.version,{timeout:30000});
    await page.reload({waitUntil:'domcontentloaded'});
    await version(page,candidate.version);
    assert.deepEqual(await snapshot(page),before,'State changed during PWA upgrade');
    await context.setOffline(true);
    await page.reload({waitUntil:'domcontentloaded'});
    await version(page,candidate.version);
    assert.deepEqual(await snapshot(page),before,'State changed after offline F5');
    const restored=await page.evaluate(()=>{
      const draft=mk872ReadDraft();
      if(!draft)throw new Error('Draft missing after offline refresh');
      mk872RestoreDraft(draft);
      return {id:blockSession?.attemptId,done:blockSession?.done};
    });
    assert.equal(restored.id,draft.id,'Draft ID replaced during upgrade');
    assert.equal(restored.done,draft.done,'Draft work lost during upgrade');
    assert.deepEqual(errors,[],'Unexpected JavaScript errors');
    console.log('PASS_V266_TO_V267',JSON.stringify({width,quick:before.quickHistory.length,
      draft:restored,coins:before.coins,xp:before.xp,offline:true}));
  }finally{
    await context.close();
  }
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true});
  try{
    for(const width of [390,1280])await scenario(browser,width);
  }finally{
    await browser.close();
    server.close();
  }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
