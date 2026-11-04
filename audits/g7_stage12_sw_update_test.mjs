import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';

const stage12='mk-stage12-pwa-refresh';
const source=fs.readFileSync('index.html','utf8');
if(!source.includes(stage12))throw Error('Stage12 update handler not injected');
const swSource=fs.readFileSync('sw.js','utf8');
if(!swSource.includes('matkvest-iphone-v40'))throw Error('Stage12 cache version missing');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'matkvest-stage12-'));
for(const name of ['index.html','sw.js','manifest.webmanifest'])fs.copyFileSync(name,path.join(tmp,name));
const port=32188;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',tmp],{stdio:'ignore'});
const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>fs.existsSync(p));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const report={runAt:new Date().toISOString(),tests:[],errors:[],pageErrors:[]};
const url='http://127.0.0.1:'+port+'/index.html';
async function waitServer(){for(let i=0;i<50;i++){try{const r=await fetch(url);if(r.ok){await r.body?.cancel();return}}catch{}await delay(150)}throw Error('Server not running')}
async function fresh(){const ctx=await browser.createBrowserContext(),page=await ctx.newPage();page.on('pageerror',e=>report.pageErrors.push(String(e)));await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:30000});await delay(350);return {ctx,page}}
async function trial(label,fn){try{const data=await fn();report.tests.push({label,ok:true,...data});console.log('PASS',label,JSON.stringify(data).slice(0,900))}catch(e){report.errors.push({label,error:String(e),stack:String(e.stack).slice(0,900)});console.error('FAIL',label,String(e))}}
let seq=0;
async function changeWorker(){
  const name=path.join(tmp,'sw.js');
  const s=fs.readFileSync(name,'utf8');
  const next=''+(++seq).toString(16).padStart(64,'0');
  const changed=s.replace(/const APP_BUILD_HASH = "[0-9a-f]{64}";/, 'const APP_BUILD_HASH = "'+next+'";');
  if(changed===s)throw Error('Cannot change worker version');
  fs.writeFileSync(name,changed);
}
async function forceWorkerUpdate(page){
  await page.evaluate(()=>navigator.serviceWorker.getRegistration().then(reg=>reg.update()).catch(err=>console.error(err)));
}
await waitServer();
try{
 await trial('New SW reloads an idle open tab',async()=>{
   const {ctx,page}=await fresh();
   let navigations=0;
   page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++});
   const before=await page.evaluate(()=>({controller:!!navigator.serviceWorker.controller,cache:Promise.resolve(caches.keys())}));
   await changeWorker();
   const pending=page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000});
   await forceWorkerUpdate(page).catch(()=>{});
   await pending;
   if(navigations!==1)throw Error('Expected exactly one automatic reload, got '+navigations);
   const after=await page.evaluate(async()=>({hasController:!!navigator.serviceWorker.controller,cache:await caches.keys()}));
   if(!after.hasController||!after.cache.includes('matkvest-iphone-v40'))throw Error('Worker did not remain active');
   await delay(800);
   if(navigations!==1)throw Error('Unexpected reload loop '+navigations);
   await ctx.close();
   return {reloads:navigations,after};
 });
 await trial('New SW saves G7 attempt, reloads and offers exact resume',async()=>{
   const {ctx,page}=await fresh();
   const a=await page.evaluate(()=>{
      startG7QuizStage('g7:geo_primitives',0);
      return {attemptId:blockSession.attemptId,sig:q.sig,key:blockSession.key};
   });
   await changeWorker();
   const pending=page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000});
   await forceWorkerUpdate(page).catch(()=>{});
   await pending;
   await page.waitForSelector('.mk872-training-dialog',{timeout:10000});
   const b=await page.evaluate(()=>{
     const d=mk872ReadDraft();
     if(!d)throw Error('No saved draft after auto update');
     const button=[...document.querySelectorAll('.mk872-training-dialog button')].find(x=>x.textContent.trim()==='Продолжить');
     if(!button)throw Error('Resume action missing');
     button.click();
     return {attemptId:blockSession?.attemptId,sig:q?.sig,key:blockSession?.key,profileId:d.profileId};
   });
   if(b.attemptId!==a.attemptId||b.sig!==a.sig||b.key!==a.key)throw Error('Lost exact attempt after update '+JSON.stringify({a,b}));
   await ctx.close();
   return {sameAttempt:true,sameQuestion:true};
 });
 await trial('Offline navigation uses fresh v40 HTML cache',async()=>{
   const {ctx,page}=await fresh();
   const cacheBefore=await page.evaluate(async()=>await caches.keys());
   if(!cacheBefore.includes('matkvest-iphone-v40'))throw Error('Cache v40 missing');
   await page.setOfflineMode(true);
   const response=await page.reload({waitUntil:'domcontentloaded',timeout:30000});
   if(!response||!response.ok())throw Error('Offline navigation failed');
   const content=await page.evaluate(()=>document.title);
   if(!content)throw Error('Offline HTML not loaded');
   await page.setOfflineMode(false);
   await ctx.close();
   return {offlineWorks:true,cacheBefore,title:content};
 });
}finally{
 await browser.close();
 server.kill('SIGTERM');
 fs.rmSync(tmp,{recursive:true,force:true});
 fs.writeFileSync('audits/g7_stage12_sw_update_report.json',JSON.stringify(report,null,2)+'\n');
 console.log('STAGE12 WORKER UPDATE SUMMARY',JSON.stringify({passes:report.tests.filter(t=>t.ok).length,errors:report.errors,pageErrors:report.pageErrors},null,2));
 if(report.errors.length||report.pageErrors.length)process.exitCode=1;
}
