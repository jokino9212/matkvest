'use strict';
// Postdeploy Android-width smoke for actual GitHub Pages, issue #91.
// Requires official MATKVEST_PAGES_URL, never hardcodes an assumed hostname.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {chromium}=require('playwright');
const url=process.env.MATKVEST_PAGES_URL;
assert(url&&url.startsWith('https://'),'Official Pages HTTPS URL must come from GitHub');
const root=new URL(url.endsWith('/')?url:url+'/');
const html=fs.readFileSync('index.html'),sw=fs.readFileSync('sw.js','utf8');
const expected=crypto.createHash('sha256').update(html).digest('hex');
assert(sw.includes('const CACHE_NAME = "matkvest-iphone-v158";'));
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
      &&swLive.includes('const CACHE_NAME = "matkvest-iphone-v158";')
      &&swLive.includes('const APP_BUILD_HASH = "'+expected+'";')){
     console.log('PASS_PWA_91_PAGES_BYTES',JSON.stringify({attempt:i+1,bytes:htmlLive.length,sha:liveHash,worker:'v158'}));
     return;
   }
   console.log('PWA_91_PAGES_PROPAGATING',JSON.stringify({attempt:i+1,status:page.status,hash:liveHash,sw158:swLive.includes('matkvest-iphone-v158')}));
  }catch(e){console.log('PWA_91_PAGES_RETRY',i+1,String(e).slice(0,200));}
  await pause(10000);
 }
 throw Error('Live Pages is not serving the exact merged v158 HTML and SW');
}
async function browserTest(browser,width){
 const ctx=await browser.newContext({viewport:{width,height:820},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(root.href,{waitUntil:'domcontentloaded',timeout:120000});
  const initial=await page.evaluate(()=>{
   openGrade(5);
   const id='area_units_g5';
   blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:0,done:0,total:10,usedSignatures:[],items:[],finished:false};
   qid='g5:'+id;
   const q=makeG5Question(id);
   return {grade:currentGrade,topics:g5AllTopics().length,
    src:q.sourceTopicId,lesson:String(g5Lesson(id)),
    scriptCount:document.querySelectorAll('script[src^="g5-"][src*="?v=158"]').length,
    legacyScriptCount:document.querySelectorAll('script[src^="g5-"]:not([src*="?v=158"])').length};
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
   const state=await page.evaluate(async()=>{
    openGrade(5);
    const id='area_units_g5';
    blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:0,done:0,total:10,usedSignatures:[],items:[],finished:false};
    qid='g5:'+id;
    const q=makeG5Question(id);
    return {topics:g5AllTopics().length,source:q.sourceTopicId,
     scriptCount:document.querySelectorAll('script[src^="g5-"][src*="?v=158"]').length,
     profileSentinel:localStorage.getItem('mk91_production_probe'),
     cacheKeys:await caches.keys(),controller:!!navigator.serviceWorker.controller};
   });
   assert.equal(state.topics,74);
   assert.equal(state.source,'area_units_g5');
   assert.equal(state.scriptCount,19);
   assert.equal(state.profileSentinel,'persists');
   assert(state.cacheKeys.includes('matkvest-iphone-v158'));
   assert(state.controller,'Production v158 SW not controlling browser');
   console.log('PASS_PWA_91_PAGES_GRADE5_RELOAD',JSON.stringify({width,iteration:i+1,...state}));
  }
  assert.deepEqual(errors,[]);
 }finally{await ctx.close();}
}
(async()=>{
 await deployed();
 const b=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{for(const width of [320,390])await browserTest(b,width);}
 finally{await b.close();}
 console.log('PASS_PWA_91_LIVE_PRODUCTION_ANDROID_WIDTHS',JSON.stringify({widths:[320,390],reloads:3,cache:'v158'}));
})().catch(e=>{console.error('FAIL_PWA_91_LIVE_PRODUCTION',e.stack||e);process.exit(1)});
