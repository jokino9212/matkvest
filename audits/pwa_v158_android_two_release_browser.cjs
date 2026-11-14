'use strict';
// Issue #91: exact v157 -> v158 Service Worker in real mobile Chromium.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const BASE='213a841de6a4a215aab3f9e972fdcfdfbae8a225';
const oldWorker=execFileSync('git',['show',BASE+':sw.js'],{cwd:root,encoding:'utf8',maxBuffer:1024*1024});
const OLD='matkvest-iphone-v157',NEW='matkvest-iphone-v158';
assert(oldWorker.includes('const CACHE_NAME = "'+OLD+'";'));
assert(worker.includes('const CACHE_NAME = "'+NEW+'";'));
assert(worker.includes('request.destination === "script"')&&worker.includes('cache: "no-store"'),'JS network-first missing');
assert.equal(crypto.createHash('sha256').update(html).digest('hex'),worker.match(/const APP_BUILD_HASH = "([a-f0-9]{64})";/)[1]);
const srcTags=[...html.matchAll(/<script src="(g5-[\w-]+\.js)\?v=158"><\/script>/g)];
assert(srcTags.length>=18,'Actual Grade 5 scripts must have cache-busting URLs');
let stage=1; // 1: deployed v157; 2: deployed v158; 3: real application v158
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
 '.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml',
 '.webp':'image/webp'};
function shell(n){
 return '<!doctype html><html lang="ru"><head><meta charset="utf-8"></head>'+
 '<body><main id="g5">5 класс, версия <span id="build"></span></main>'+
 '<script src="g5-natural-units-v125.js'+(n===1?'':'?v=158')+'"></script>'+
 '<script>document.querySelector("#build").textContent=window.G5_BUILD;'+
 'window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).catch(console.error));</script>'+
 '</body></html>';
}
const server=http.createServer((req,res)=>{
 try{
  const u=new URL(req.url,'http://127.0.0.1'),requested=decodeURIComponent(u.pathname);
  if(requested==='/'||requested==='/index.html'){
   res.writeHead(200,{'Content-Type':mime['.html'],'Cache-Control':'no-store'});
   return res.end(stage===3?html:shell(stage));
  }
  if(requested==='/sw.js'){
   res.writeHead(200,{'Content-Type':mime['.js'],'Cache-Control':'no-store'});
   return res.end(stage===1?oldWorker:worker);
  }
  if(stage!==3){
   const data=requested==='/g5-natural-units-v125.js'
    ?'window.G5_BUILD = "v'+(stage===1?'157':'158')+'";'
    :requested.endsWith('.js')?'// Other Grade 5 script in the fixture.\n':'asset-placeholder';
   res.writeHead(200,{'Content-Type':mime[path.extname(requested)]||'text/plain','Cache-Control':'no-store'});
   return res.end(data);
  }
  const filename=path.resolve(root,'.'+requested);
  if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(filename,(err,data)=>{
   if(err){res.writeHead(404);return res.end();}
   res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream',
     'Cache-Control':'no-store'});res.end(data);
  });
 }catch(e){res.writeHead(400);res.end('bad request');}
});
function log(tag,data){console.log('PASS_PWA_91_'+tag+' '+JSON.stringify(data));}
async function transition(browser,origin,width){
 stage=1;
 const context=await browser.newContext({viewport:{width,height:780},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
 const page=await context.newPage(),jsErrors=[];
 page.on('pageerror',e=>jsErrors.push(String(e.message)));
 try{
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const before=await page.evaluate(async()=>{
   const cache=await caches.open('matkvest-iphone-v157');
   const response=await cache.match('./g5-natural-units-v125.js');
   return {version:window.G5_BUILD,keys:await caches.keys(),
    script:response?await response.text():null};
  });
  assert.equal(before.version,'v157');
  assert(before.script?.includes('v157'),'Old SW did not cache old generator');
  assert(before.keys.includes(OLD));
  const specimen={
   profiles:JSON.stringify({'Ученик Android':{xp:321,coins:654,inventory:{pet:['pet_cat']}}}),
   current:'Ученик Android',
   draft:JSON.stringify({key:'g5:area_units_g5',done:4,answer:'6',attemptId:'g5-draft-preserved-91'})
  };
  await page.evaluate(o=>{
   localStorage.setItem('mq4_profiles',o.profiles);
   localStorage.setItem('mq4_current_profile',o.current);
   localStorage.setItem('mk872_training_draft',o.draft);
  },specimen);
  // First reload still has the PREVIOUS cache-first worker controlling this tab.
  stage=2;
  await page.reload({waitUntil:'domcontentloaded'});
  const first=await page.evaluate(()=>({
   version:window.G5_BUILD,visible:document.querySelector('#build').textContent,
   profiles:localStorage.getItem('mq4_profiles'),
   draft:localStorage.getItem('mk872_training_draft'),
   current:localStorage.getItem('mq4_current_profile'),
   controller:!!navigator.serviceWorker.controller,
   scriptSrc:document.querySelector('script[src^="g5-natural-units"]')?.src||''
  }));
  assert.equal(first.version,'v158','First Android refresh loaded obsolete Grade 5 JS');
  assert.equal(first.visible,'v158');
  assert(first.scriptSrc.includes('?v=158'),'Old SW cache was not bypassed');
  assert.equal(first.profiles,specimen.profiles);
  assert.equal(first.draft,specimen.draft);
  assert.equal(first.current,specimen.current);
  await page.evaluate(async()=>{
   const registration=await navigator.serviceWorker.getRegistration();
   if(!registration)throw Error('No SW registration');
   await registration.update();
  });
  await page.waitForFunction(async expected=>(await caches.keys()).includes(expected),NEW,{timeout:60000});
  await page.waitForFunction(async expected=>!(await caches.keys()).includes(expected),OLD,{timeout:60000});
  for(let i=0;i<3;i++){
   await page.reload({waitUntil:'domcontentloaded'});
   assert.equal(await page.evaluate(()=>window.G5_BUILD),'v158','Reload reverted to old Grade 5 '+i);
  }
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:20000});
  const offline=await page.evaluate(()=>({
   version:window.G5_BUILD,profiles:localStorage.getItem('mq4_profiles'),
   draft:localStorage.getItem('mk872_training_draft'),
   current:localStorage.getItem('mq4_current_profile')
  }));
  assert.equal(offline.version,'v158','Offline fallback used stale JS');
  assert.equal(offline.profiles,specimen.profiles);
  assert.equal(offline.draft,specimen.draft);
  assert.equal(offline.current,specimen.current);
  assert.deepEqual(jsErrors,[],'Browser exceptions');
  log('TWO_RELEASES',{width,before:before.version,firstRefresh:first.version,
   repeatedReloads:3,offline:offline.version,persisted:true,jsErrors});
 }finally{await context.close();}
}
async function actualApp(browser,origin){
 stage=3;
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:90000});
  const status=await page.evaluate(()=>{
   openGrade(5);
   blockSession={kind:'g5quiz',key:'g5:area_units_g5',stageIndex:0,done:0,total:10,usedSignatures:[],items:[],finished:false};
   qid='g5:area_units_g5';
   const q=makeG5Question('area_units_g5');
   return {grade:currentGrade,topics:g5AllTopics().length,
    questionSource:q.sourceTopicId,hasAnswer:!!q.correctLabel,
    tags:document.querySelectorAll('script[src*="?v=158"]').length};
  });
  assert.equal(status.grade,5);
  assert.equal(status.topics,74);
  assert.equal(status.questionSource,'area_units_g5');
  assert(status.hasAnswer);
  assert.equal(status.tags,srcTags.length);
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload({waitUntil:'domcontentloaded',timeout:90000});
  const again=await page.evaluate(()=>({
   topics:g5AllTopics().length,
   script:!!document.querySelector('script[src="g5-natural-units-v125.js?v=158"]')
  }));
  assert.equal(again.topics,74);
  assert(again.script);
  assert.deepEqual(errors,[],'Real app JavaScript errors');
  log('REAL_APP',{mobile:390,grade:status.grade,topics:status.topics,
   scriptTags:status.tags,jsErrors:errors.length});
 }finally{await context.close();}
}
async function main(){
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const origin='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [320,390])await transition(browser,origin,width);
  await actualApp(browser,origin);
  log('SUMMARY',{twoReleaseAndroidWidths:[320,390],firstRefresh:'new',
   repeatedReloads:3,offline:'new',userStorage:'preserved',realApp:true});
 }finally{await browser.close();await new Promise(ok=>server.close(ok));}
}
main().catch(e=>{console.error('FAIL_PWA_91',e.stack||e);process.exitCode=1});
