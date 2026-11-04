import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';

// Isolated stage 15 release preflight: does NOT modify production or project assets.
const expected='f188d39a3a16fc54dfb32238fc34d3dfe6cc3c4416cd475579bf3ed65a7e1e36';
const sha=s=>createHash('sha256').update(s).digest('hex');
const html=fs.readFileSync('index.html');
const worker=fs.readFileSync('sw.js','utf8');
const strict=JSON.parse(fs.readFileSync('audits/g7_stage13_strict_report.json','utf8'));
const report={testedAt:new Date().toISOString(),expected,checks:[],pageErrors:[],failures:[],metrics:{}};
function check(name,condition,info={}){
  report.checks.push({name,pass:!!condition,...info});
  if(!condition)report.failures.push({name,...info});
  console.log(condition?'PASS':'FAIL',name,JSON.stringify(info));
}
check('Exact audited HTML SHA-256',sha(html)===expected,{actual:sha(html)});
check('SW v40 and matching HTML fingerprint',worker.includes('const CACHE_NAME = "matkvest-iphone-v40"')&&worker.includes('const APP_BUILD_HASH = "'+expected+'"'));
check('Safe navigation and explicit SW activation',worker.includes('fetch(request, { cache: "no-store" })')&&worker.includes('self.skipWaiting()')&&worker.includes('self.clients.claim()'));
check('Auto-update implementation present once',html.toString('utf8').split('id="mk-stage12-pwa-refresh"').length===2);
check('Stable stage13 semantic audit',strict.sha256===expected&&strict.catalog===107&&strict.sessions===963&&strict.questions===7062&&['duplicates','errors','exhaustions','pageErrors'].every(k=>Array.isArray(strict[k])&&strict[k].length===0));
check('Required PWA assets exist',['manifest.webmanifest','index.html','sw.js'].every(p=>fs.statSync(p).size>0));
if(report.failures.length)throw Error('Static Release Gate failed: '+JSON.stringify(report.failures));

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'matkvest-release15-'));
for(const filename of ['index.html','manifest.webmanifest'])fs.copyFileSync(filename,path.join(tmp,filename));
// Model the currently deployed v39 worker using the exact v40 implementation minus the newly added fingerprint.
// This transitions a live v39-controlled tab to v40 without changing its origin or localStorage.
const oldWorker=worker.replace('matkvest-iphone-v40','matkvest-iphone-v39').replace(/^const APP_BUILD_HASH = "[a-f0-9]{64}";\n/m,'');
if(oldWorker===worker||!oldWorker.includes('matkvest-iphone-v39'))throw Error('Failed to prepare v39 fixture');
fs.writeFileSync(path.join(tmp,'sw.js'),oldWorker);
const port=32195,url='http://127.0.0.1:'+port+'/index.html';
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',tmp],{stdio:'ignore'});
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!executablePath)throw Error('Chrome/Chromium not found');
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
async function waitServer(){for(let i=0;i<60;i++){try{let r=await fetch(url);if(r.ok){await r.body?.cancel();return;}}catch{}await delay(150);}throw Error('Fixture server unavailable');}
async function trial(name,fn){
 try { const evidence=await fn();check(name,true,evidence); }
 catch(e){check(name,false,{error:String(e),stack:String(e.stack).slice(0,1000)});}
}
try{
 await waitServer();
 await trial('v39 to v40: automatic reload and exact unfinished G7 attempt recovery',async()=>{
   const ctx=await browser.createBrowserContext(),page=await ctx.newPage();
   page.on('pageerror',e=>report.pageErrors.push(String(e)));
   try{
     await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
     await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:30000});
     const prev=await page.evaluate(async()=>await caches.keys());
     if(!prev.includes('matkvest-iphone-v39'))throw Error('Initial v39 worker cache absent: '+prev);
     const before=await page.evaluate(()=>{
       localStorage.setItem('matkvest-stage15-synthetic-profile-check',JSON.stringify({profile:'release-gate-test',xp:123,coins:456,collection:['item-1'],progress:{g7:2}}));
       startG7QuizStage('g7:geo_primitives',0);
       if(!mk872PersistDraft())throw Error('Cannot persist G7 session');
       return {attemptId:blockSession.attemptId,key:blockSession.key,sig:q.sig,draftKey:mk872DraftKey(),sentinel:localStorage.getItem('matkvest-stage15-synthetic-profile-check'),keys:Object.keys(localStorage)};
     });
     fs.writeFileSync(path.join(tmp,'sw.js'),worker);
     let navigations=0;
     page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
     const navigation=page.waitForNavigation({waitUntil:'domcontentloaded',timeout:45000});
     await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();if(!r)throw Error('No registration');await r.update();});
     await navigation;
     await page.waitForSelector('.mk872-training-dialog',{timeout:15000});
     const after=await page.evaluate(async()=>{
       const draft=mk872ReadDraft(),cachesNow=await caches.keys();
       const b=[...document.querySelectorAll('.mk872-training-dialog button')].find(x=>x.textContent.trim()==='Продолжить');
       if(!b)throw Error('Resume button not available');
       b.click();
       return {attemptId:blockSession?.attemptId,key:blockSession?.key,sig:q?.sig,sentinel:localStorage.getItem('matkvest-stage15-synthetic-profile-check'),keys:Object.keys(localStorage),cacheNames:cachesNow};
     });
     if(navigations!==1)throw Error('Expected one automatic navigation, got '+navigations);
     if(after.attemptId!==before.attemptId||after.key!==before.key||after.sig!==before.sig)throw Error('G7 attempt changed: '+JSON.stringify({before,after}));
     if(after.sentinel!==before.sentinel)throw Error('Profile, XP, coins, collection, progress sentinel corrupted');
     if(!after.cacheNames.includes('matkvest-iphone-v40'))throw Error('v40 cache not installed');
     if(after.cacheNames.includes('matkvest-iphone-v39'))throw Error('Stale v39 cache remains active');
     await delay(900);
     if(navigations!==1)throw Error('Reload loop detected');
     return {automaticReloads:navigations,exactAttempt:true,syntheticUserStorageIntact:true,cacheNames:after.cacheNames,keysBefore:before.keys.length,keysAfter:after.keys.length};
   } finally {await ctx.close();}
 });
 await trial('v40 offline navigation and preserved storage',async()=>{
   const ctx=await browser.createBrowserContext(),page=await ctx.newPage();
   page.on('pageerror',e=>report.pageErrors.push(String(e)));
   try {
     await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
     await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:30000});
     await page.evaluate(()=>localStorage.setItem('matkvest-stage15-offline-check','preserved'));
     await page.setOfflineMode(true);
     const response=await page.reload({waitUntil:'domcontentloaded',timeout:30000});
     if(!response?.ok())throw Error('Offline navigation unavailable');
     const data=await page.evaluate(()=>({title:document.title,storage:localStorage.getItem('matkvest-stage15-offline-check')}));
     if(!data.title||data.storage!=='preserved')throw Error('Offline boot or data lost');
     return {offlineBoot:true,storageIntact:true};
   }finally{await ctx.close();}
 });
 await trial('Mobile viewport: grade 7 quiz survives page reload',async()=>{
   const ctx=await browser.createBrowserContext(),page=await ctx.newPage();
   page.on('pageerror',e=>report.pageErrors.push(String(e)));
   try{
     await page.setViewport({width:390,height:844,isMobile:true,deviceScaleFactor:2,hasTouch:true});
     await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
     const a=await page.evaluate(()=>{startG7QuizStage('g7:geo_primitives',0);if(!mk872PersistDraft())throw Error('Save failed');return {id:blockSession.attemptId,sig:q.sig};});
     await page.reload({waitUntil:'domcontentloaded',timeout:120000});
     await page.waitForSelector('.mk872-training-dialog',{timeout:10000});
     const b=await page.evaluate(()=>{let btn=[...document.querySelectorAll('.mk872-training-dialog button')].find(x=>x.textContent.trim()==='Продолжить');if(!btn)throw Error('No mobile resume action');btn.click();return{id:blockSession?.attemptId,sig:q?.sig};});
     if(a.id!==b.id||a.sig!==b.sig)throw Error('Mobile attempt mismatch');
     return {width:390,height:844,exactResume:true};
   } finally {await ctx.close();}
 });
} finally {
 await browser.close();
 server.kill('SIGTERM');
 fs.rmSync(tmp,{recursive:true,force:true});
 report.metrics={pass:report.checks.filter(x=>x.pass).length,fail:report.failures.length,jsPageErrors:report.pageErrors.length};
 fs.writeFileSync('audits/g7_stage15_release_gate_report.json',JSON.stringify(report,null,2)+'\n');
 console.log('STAGE15 RELEASE GATE SUMMARY',JSON.stringify(report.metrics));
 if(report.failures.length||report.pageErrors.length)process.exitCode=1;
}
