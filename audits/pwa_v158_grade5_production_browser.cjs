'use strict';
// Postdeploy Android-width smoke for actual GitHub Pages, issue #91.
// Requires official MATKVEST_PAGES_URL, never hardcodes an assumed hostname.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {chromium}=require('playwright');
const url=process.env.MATKVEST_PAGES_URL;
assert(url,'Set MATKVEST_PAGES_URL to the official Pages or local test address');
const root=new URL(url.endsWith('/')?url:url+'/');
assert(root.protocol==='https:'||(root.protocol==='http:'&&root.hostname==='127.0.0.1'),
 'Use the official HTTPS Pages address or a loopback test server');
const html=fs.readFileSync('index.html'),sw=fs.readFileSync('sw.js','utf8');
const expected=crypto.createHash('sha256').update(html).digest('hex');
const cacheVersion=Number(sw.match(/const CACHE_NAME = "matkvest-iphone-v(\d+)";/)?.[1]);
assert(Number.isInteger(cacheVersion)&&cacheVersion>=158,'Unsupported PWA release');
const cacheName='matkvest-iphone-v'+cacheVersion;
const usesVue=html.includes('const knowledgeMapUrl = ');
const g5Tags=[...html.toString('utf8').matchAll(/<script src="g5-[\w-]+\.js\?v=(\d+)"><\/script>/g)];
assert.equal(g5Tags.length,19);
assert(g5Tags.every(tag=>Number(tag[1])===cacheVersion),'Grade 5 HTML JS cache-bust does not match PWA version');
assert(sw.includes('const APP_BUILD_HASH = "'+expected+'";'));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function deployed(){
 for(let i=0;i<45;i++){
  try{
   const [page,worker]=await Promise.all([
    fetch(new URL('index.html',root),{cache:'no-store',signal:AbortSignal.timeout(25000)}),
    fetch(new URL('sw.js',root),{cache:'no-store',signal:AbortSignal.timeout(25000)})
   ]);
   const htmlLive=Buffer.from(await page.arrayBuffer());
   const swLive=await worker.text();
   const liveHash=crypto.createHash('sha256').update(htmlLive).digest('hex');
   if(page.status===200&&worker.status===200&&liveHash===expected
      &&swLive===sw){
     console.log('PASS_PWA_91_PAGES_BYTES',JSON.stringify({attempt:i+1,bytes:htmlLive.length,sha:liveHash,worker:cacheName}));
     return;
   }
   console.log('PWA_91_PAGES_PROPAGATING',JSON.stringify({attempt:i+1,status:page.status,hash:liveHash,workerMatches:swLive.includes(cacheName)}));
  }catch(e){console.log('PWA_91_PAGES_RETRY',i+1,String(e).slice(0,200));}
  await pause(10000);
 }
 throw Error('Live Pages is not serving the exact merged HTML and SW');
}
async function browserTest(browser,width){
 const ctx=await browser.newContext({viewport:{width,height:820},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(root.href,{waitUntil:'domcontentloaded',timeout:120000});
  const gradeButton=page.locator('.grade-card').getByRole('button',{name:'Открыть 5 класс',exact:true});
  const homeSummary=page.locator('#mainView #g5HomeProgress');
  const expectedHome='Пройдено тем: 0/74 • этапов: 0/222';
  assert.equal(await homeSummary.innerText(),expectedHome);
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>null));
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  const homeAfterReload=await homeSummary.innerText();
  assert.equal(homeAfterReload,expectedHome);
  console.log('PASS_PAGES_GRADE5_HOME_RELOAD',JSON.stringify({width,summary:homeAfterReload}));
  const course=page.locator(usesVue?'#grade5Vue[data-v-app]':'#mainView');
  const contents=course.locator('#mk-g5-textbook-nav');
  await gradeButton.click();
  await contents.waitFor();
  const initial=await page.evaluate(()=>{
   const id='area_units_g5';
   blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:0,done:0,total:10,usedSignatures:[],items:[],finished:false};
   qid='g5:'+id;
   const q=makeG5Question(id);
   return {grade:currentGrade,topics:g5AllTopics().length,
    src:q.sourceTopicId,lesson:String(g5Lesson(id)),
    scriptCount:document.querySelectorAll('script[src^="g5-"][src*="?v="]').length,
    legacyScriptCount:document.querySelectorAll('script[src^="g5-"]:not([src*="?v="])').length};
  });
  assert.equal(initial.grade,5);
  assert.equal(initial.topics,74);
  assert.equal(initial.src,'area_units_g5');
  assert(initial.lesson.includes('1 га = 100 а'));
  assert.equal(initial.scriptCount,19);
  assert.equal(initial.legacyScriptCount,0);
  await page.evaluate(()=>localStorage.setItem('mk91_production_probe','persists'));
  await page.evaluate(()=>navigator.serviceWorker.ready);
  // The page must be fresh on every in-Grade-5 reload, not just first open.
  for(let i=0;i<3;i++){
   await page.reload({waitUntil:'domcontentloaded',timeout:120000});
   await contents.waitFor();
   const state=await page.evaluate(async usesVue=>{
    const id='area_units_g5';
    blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:0,done:0,total:10,usedSignatures:[],items:[],finished:false};
    qid='g5:'+id;
    const q=makeG5Question(id);
    return {grade:currentGrade,topics:g5AllTopics().length,source:q.sourceTopicId,
     cards:document.querySelectorAll(usesVue?'#grade5Vue .topic':'#mainView .g5-card').length,
     paragraphs:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-list li').length,
     search:document.querySelector('#mk19c4-topic-tools .mk19c4-count')?.textContent,
     progress:document.querySelector('#mk19f-grade-strip [role="progressbar"]')?.getAttribute('aria-label'),
     scriptCount:document.querySelectorAll('script[src^="g5-"][src*="?v="]').length,
     profileSentinel:localStorage.getItem('mk91_production_probe'),
     cacheKeys:await caches.keys(),controller:!!navigator.serviceWorker.controller};
   },usesVue);
   assert.equal(state.grade,5);
   assert.equal(state.topics,74);
   assert.equal(state.cards,74);
   assert.equal(state.paragraphs,51);
   assert.equal(state.search,'Всего тем: 74');
   assert.match(state.progress,/из 222$/);
   assert.equal(state.source,'area_units_g5');
   assert.equal(state.scriptCount,19);
   assert.equal(state.profileSentinel,'persists');
   assert(state.cacheKeys.includes(cacheName));
   assert(state.controller,`${cacheName} service worker is not controlling the browser`);
   console.log('PASS_PWA_91_PAGES_GRADE5_RELOAD',JSON.stringify({width,iteration:i+1,...state}));
  }
  const chapter=contents.locator('details').filter({has:page.locator('[data-topic-id="area_units_g5"]')});
  if(await chapter.getAttribute('open')===null)await chapter.locator('summary').click();
  await chapter.locator('[data-topic-id="area_units_g5"]').click();
  const lesson=page.locator('#modal .lesson');
  await lesson.waitFor();
  const theory=await lesson.innerText();
  assert.match(theory,/1 га = 100 а/);
  await ctx.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await lesson.waitFor();
  await contents.waitFor();
  assert.equal(await lesson.innerText(),theory);
  assert.equal(await page.locator('#modal .stage-card').count(),3);
  assert.equal(await contents.locator('.mk-g5-toc-list li').count(),51);
  assert.deepEqual(errors,[]);
 }finally{await ctx.close();}
}
(async()=>{
 await deployed();
 const b=await chromium.launch({headless:true,executablePath:process.env.MATKVEST_CHROMIUM||undefined,args:['--no-sandbox']});
 try{for(const width of [320,390])await browserTest(b,width);}
 finally{await b.close();}
 console.log('PASS_PWA_91_LIVE_PRODUCTION_ANDROID_WIDTHS',JSON.stringify({widths:[320,390],reloads:3,cache:cacheName}));
})().catch(e=>{console.error('FAIL_PWA_91_LIVE_PRODUCTION',e.stack||e);process.exit(1)});
