import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';

// The OLD HTML and SW come from the actual pre-release main commit,
// not an approximation of the v39 application. The test does not hard refresh.
const oldCommit='aec894d39ee4e389c616d265e9fe219f10399f5c';
const sha=x=>createHash('sha256').update(x).digest('hex');
const oldHtml=execFileSync('git',['show',oldCommit+':index.html'],{maxBuffer:16*1024*1024});
const oldSw=execFileSync('git',['show',oldCommit+':sw.js']);
const candidateHtml=fs.readFileSync('index.html'),candidateSw=fs.readFileSync('sw.js');
const report={testedAt:new Date().toISOString(),oldCommit,oldSha256:sha(oldHtml),newSha256:sha(candidateHtml),steps:[],pageErrors:[],status:'FAIL'};
if(!oldSw.toString('utf8').includes('matkvest-iphone-v39'))throw Error('The archived main does not contain v39 SW');
if(report.newSha256!=='f188d39a3a16fc54dfb32238fc34d3dfe6cc3c4416cd475579bf3ed65a7e1e36')throw Error('Unapproved candidate HTML');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'matkvest-legacy-upgrade-'));
fs.writeFileSync(path.join(temp,'index.html'),oldHtml);
fs.writeFileSync(path.join(temp,'sw.js'),oldSw);
fs.copyFileSync('manifest.webmanifest',path.join(temp,'manifest.webmanifest'));
const port=32196,url='http://127.0.0.1:'+port+'/';
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',temp],{stdio:'ignore'});
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let context;
try{
  for(let i=0;i<60;i++){try{const r=await fetch(url);if(r.ok){await r.body?.cancel();break;}}catch{}if(i===59)throw Error('Local legacy test server unavailable');await delay(150);}
  context=await browser.createBrowserContext();
  const page=await context.newPage();
  page.on('pageerror',e=>report.pageErrors.push(String(e)));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:30000});
  const old=await page.evaluate(async()=>{
    const keys=await caches.keys();
    const sample={profile:{id:'old-local-profile'},progress:{g7:3},xp:246,coins:777,collection:['avatar1','badge1'],pendingAttempt:'old-client'};
    localStorage.setItem('matkvest-stage15-real-old-html-storage-probe',JSON.stringify(sample));
    return {caches:keys,existingKeys:Object.keys(localStorage),sentinel:localStorage.getItem('matkvest-stage15-real-old-html-storage-probe')};
  });
  if(!old.caches.includes('matkvest-iphone-v39'))throw Error('v39 cache not active on legacy page');
  report.steps.push({name:'Old main HTML and real v39 SW loaded',pass:true,oldCacheNames:old.caches,existingKeysCount:old.existingKeys.length});

  fs.writeFileSync(path.join(temp,'index.html'),candidateHtml);
  fs.writeFileSync(path.join(temp,'sw.js'),candidateSw);
  // Normal online navigation; no DevTools, cache disable or Ctrl+Shift+R.
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>!!document.getElementById('mk-stage12-pwa-refresh'),{timeout:15000});
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();if(!r)throw Error('Registration lost');await r.update();}).catch(()=>{});
  await page.waitForFunction(async()=>{const k=await caches.keys();return k.includes('matkvest-iphone-v40');},{timeout:35000});
  const newer=await page.evaluate(async()=>({
    sentinel:localStorage.getItem('matkvest-stage15-real-old-html-storage-probe'),
    keys:Object.keys(localStorage),
    caches:await caches.keys(),
    hasDraftSaver:typeof mk872PersistDraft==='function',
    title:document.title
  }));
  if(newer.sentinel!==old.sentinel)throw Error('Previously stored profile/progress/coins/collection probe changed during upgrade');
  const missing=old.existingKeys.filter(k=>!newer.keys.includes(k));
  if(missing.length)throw Error('Previously persisted localStorage keys disappeared: '+JSON.stringify(missing));
  if(!newer.hasDraftSaver)throw Error('New exact-attempt preservation code unavailable');
  if(newer.caches.includes('matkvest-iphone-v39'))throw Error('Legacy cache has not been removed');
  report.steps.push({name:'Normal navigation serves current HTML and v40 while retaining legacy storage',pass:true,preservedKeys:old.existingKeys.length,cacheNames:newer.caches});
  report.status='PASS';
  console.log('PASS real legacy v39 main -> audited v40, normal navigation',JSON.stringify(report.steps));
}catch(e){report.error=String(e);process.exitCode=1;console.error('FAIL legacy deployment upgrade',String(e));}
finally{
 if(context)await context.close();
 await browser.close();
 server.kill('SIGTERM');
 fs.rmSync(temp,{recursive:true,force:true});
 fs.writeFileSync('audits/g7_stage15_legacy_upgrade_report.json',JSON.stringify(report,null,2)+'\n');
 console.log('LEGACY UPGRADE SUMMARY',report.status,report.pageErrors.length,'page errors');
 if(report.pageErrors.length)process.exitCode=1;
}
