import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';

// The OLD HTML and SW come from the actual pre-release main commit,
// not an approximation of the v55 application. The test does not hard refresh.
const oldCommit='318898506e150151595d01265190e0944e4c2ab0';
const sha=x=>createHash('sha256').update(x).digest('hex');
const oldHtml=execFileSync('git',['show',oldCommit+':index.html'],{maxBuffer:16*1024*1024});
const oldSw=execFileSync('git',['show',oldCommit+':sw.js']);
const candidateHtml=fs.readFileSync('index.html'),candidateSw=fs.readFileSync('sw.js');
const report={testedAt:new Date().toISOString(),oldCommit,oldSha256:sha(oldHtml),newSha256:sha(candidateHtml),steps:[],pageErrors:[],status:'FAIL'};
if(!oldSw.toString('utf8').includes('matkvest-iphone-v55'))throw Error('The archived main does not contain v55 SW');
if(report.newSha256!=='c93d13aeaafdb742e3ceda0111d3242daaf19fcc3a2cdd7b90b1b4a18f0817f2')throw Error('Unapproved candidate HTML');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'matkvest-legacy-upgrade-'));
fs.writeFileSync(path.join(temp,'index.html'),oldHtml);
fs.writeFileSync(path.join(temp,'sw.js'),oldSw);
fs.copyFileSync('manifest.webmanifest',path.join(temp,'manifest.webmanifest'));
const port=32216,url='http://127.0.0.1:'+port+'/';
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',temp],{stdio:'ignore'});
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let context;
try{
  for(let i=0;i<60;i++){try{const r=await fetch(url);if(r.ok){await r.body?.cancel();break;}}catch{}if(i===59)throw Error('Local legacy test server unavailable');await delay(150);}
  context=await browser.createBrowserContext();
  const page=await context.newPage();
  const stableEval=async (fn,where)=>{for(let i=0;i<12;i++){try{return await page.evaluate(fn);}catch(e){if(!/Execution context was destroyed|Cannot find context with specified id|Navigating frame was detached/.test(String(e)))throw e;report.steps.push({name:'Browser navigated while '+where+', retrying stable evaluation',pass:true,attempt:i+1});await delay(500)}}throw Error('Page did not settle while '+where)};
  page.on('pageerror',e=>report.pageErrors.push(String(e)));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:30000});
  const old=await page.evaluate(async()=>{
    const keys=await caches.keys();
    const sample={profile:{id:'old-local-profile'},progress:{g7:3},xp:246,coins:777,collection:['avatar1','badge1'],pendingAttempt:'old-client'};
    localStorage.setItem('matkvest-stage15-real-old-html-storage-probe',JSON.stringify(sample));
    startG7QuizStage('g7:geo_primitives',0);
    if(!mk872PersistDraft())throw Error('Legacy v55 unfinished quiz could not be saved');
    return {caches:keys,existingKeys:Object.keys(localStorage),
      sentinel:localStorage.getItem('matkvest-stage15-real-old-html-storage-probe'),
      attempt:{id:blockSession.attemptId,key:blockSession.key,sig:q.sig}};
  
  });
  if(!old.caches.includes('matkvest-iphone-v55'))throw Error('v55 cache not active on legacy page');
  report.steps.push({name:'Old main HTML and real v55 SW loaded',pass:true,oldCacheNames:old.caches,existingKeysCount:old.existingKeys.length});

  fs.writeFileSync(path.join(temp,'index.html'),candidateHtml);
  fs.writeFileSync(path.join(temp,'sw.js'),candidateSw);
  // Normal online navigation; no DevTools, cache disable or Ctrl+Shift+R.
  try{await page.goto(url,{waitUntil:'load',timeout:120000});}catch(e){if(!/Execution context was destroyed|Navigation|frame was detached/.test(String(e)))throw e;report.steps.push({name:'Expected v70 controllerchange during navigation',pass:true});}
  // The newly installed SW calls clients.claim(), and the v70 page may reload itself.
  // Waiting for the SW cache alone was a race: it can be ready before the new document.
  await page.waitForFunction(()=>!!document.getElementById('mk-stage12-pwa-refresh'),{timeout:20000});
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();if(!r)throw Error('Registration lost');await r.update();}).catch(()=>{});
  await page.waitForFunction(async()=>{
    const keys=await caches.keys();
    return keys.includes('matkvest-iphone-v70') &&
      !!document.getElementById('mk-stage12-pwa-refresh') &&
      typeof mk872PersistDraft==='function' &&
      document.readyState==='complete';
  },{timeout:50000});
  // Ensure document and worker settle after the controllerchange-driven navigation.
  await delay(650);
  const newer=await stableEval(async()=>({
    sentinel:localStorage.getItem('matkvest-stage15-real-old-html-storage-probe'),
    keys:Object.keys(localStorage),
    caches:await caches.keys(),
    hasDraftSaver:typeof mk872PersistDraft==='function',
    hasStage12Markup:!!document.getElementById('mk-stage12-pwa-refresh'),
    title:document.title,
    readyState:document.readyState,
    workerScript:(await navigator.serviceWorker.getRegistration())?.active?.scriptURL||null
  }),'post-upgrade summary');
  if(newer.sentinel!==old.sentinel)throw Error('Previously stored profile/progress/coins/collection probe changed during upgrade');
  const missing=old.existingKeys.filter(k=>!newer.keys.includes(k));
  if(missing.length)throw Error('Previously persisted localStorage keys disappeared: '+JSON.stringify(missing));
  if(!newer.hasDraftSaver)throw Error('New exact-attempt preservation code unavailable');
  if(newer.caches.includes('matkvest-iphone-v55'))throw Error('Legacy cache has not been removed');
  await page.waitForSelector('.mk872-training-dialog',{timeout:12000});
  const recovered=await stableEval(()=>{
    const b=[...document.querySelectorAll('.mk872-training-dialog button')].find(x=>x.textContent.trim()==='Продолжить');
    if(!b)throw Error('Resume option disappeared after v55 -> v70 upgrade');
    b.click();
    return {id:blockSession?.attemptId,key:blockSession?.key,sig:q?.sig};
  },'resume restored training');
  if(recovered.id!==old.attempt.id||recovered.key!==old.attempt.key||recovered.sig!==old.attempt.sig)
    throw Error('Real legacy saved attempt was not recovered exactly: '+JSON.stringify({old:old.attempt,recovered}));
  report.steps.push({name:'Exact v55 quiz attempt recovered on v70',pass:true,recovered});
  report.steps.push({name:'Normal navigation serves current HTML and v70 while retaining legacy storage',pass:true,preservedKeys:old.existingKeys.length,cacheNames:newer.caches});
  report.status='PASS';
  console.log('PASS real legacy v55 main -> audited v70, normal navigation',JSON.stringify(report.steps));
}catch(e){report.error=String(e);report.errorStack=String(e?.stack||'').slice(0,2200);process.exitCode=1;console.error('FAIL legacy deployment upgrade',String(e),report.errorStack);}
finally{
 if(context)await context.close();
 await browser.close();
 server.kill('SIGTERM');
 fs.rmSync(temp,{recursive:true,force:true});
 fs.writeFileSync('audits/release_ui_v70_upgrade_report.json',JSON.stringify(report,null,2)+'\n');
 console.log('LEGACY UPGRADE SUMMARY',report.status,report.pageErrors.length,'page errors');
 if(report.pageErrors.length)process.exitCode=1;
}
