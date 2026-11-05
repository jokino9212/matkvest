import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';

const expected='29e750205c4549e2c9d6105b49002ba1c505876518a2139e3da0ce5644e15859';
const sha=x=>createHash('sha256').update(x).digest('hex');
const candidateHtml=fs.readFileSync('index.html'),candidateSw=fs.readFileSync('sw.js');
if(sha(candidateHtml)!==expected||!candidateSw.includes('matkvest-iphone-v54')||!candidateSw.includes(expected))throw Error('Source v54 mismatch');
const oldSha='10ae70be6d2a54528274ddc4f5678c9971b536c8';
const originalHtml=execFileSync('git',['show',oldSha+':index.html'],{maxBuffer:24*1024*1024});
const originalSw=execFileSync('git',['show',oldSha+':sw.js']);
if(!originalSw.toString().includes('matkvest-iphone-v50'))throw Error('v50 fixture mismatch');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'matkvest-stage18-resume-'));
for(const name of ['manifest.webmanifest'])fs.copyFileSync(name,path.join(directory,name));
fs.writeFileSync(path.join(directory,'index.html'),candidateHtml);
fs.writeFileSync(path.join(directory,'sw.js'),candidateSw);
const port=32178,url='http://127.0.0.1:'+port+'/index.html';
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',directory],{stdio:'ignore'});
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const report={sha:expected,checkedAt:new Date().toISOString(),pass:[],fail:[],pageErrors:[]};
const check=async(name,callback)=>{
 try{const result=await callback();report.pass.push({name,...result});console.log('PASS '+name+' '+JSON.stringify(result).slice(0,1000))}
 catch(e){report.fail.push({name,error:String(e),stack:String(e.stack).slice(0,1100)});console.log('FAIL '+name+' '+String(e))}
};
async function fresh(){
 const ctx=await browser.createBrowserContext();
 const page=await ctx.newPage();
 page.on('pageerror',e=>report.pageErrors.push(String(e)));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 return {ctx,page};
}
async function continueDraft(page){
 await page.waitForSelector('.mk872-training-dialog',{timeout:15000});
 await page.evaluate(()=>{
   const b=[...document.querySelectorAll('.mk872-training-dialog button')].find(x=>x.textContent.trim()==='Продолжить');
   if(!b)throw Error('Resume button missing');
   b.click();
 });
}
async function waitHTTP(){
 for(let i=0;i<70;i++){try{const r=await fetch(url);if(r.ok){await r.body?.cancel();return}}catch{}await delay(180)}
 throw Error('Local app fixture did not boot');
}
try{
 await waitHTTP();
 for(const kind of ['g5','g6']){
   await check(kind+' mixed/ordinary fraction form persists across refresh',async()=>{
     const {ctx,page}=await fresh();
     try{
       const a=await page.evaluate(k=>{
         if(k==='g5')startG5QuizStage('frac_read',0);
         else startG6QuizStage('g6:fraction_add_subtract',0);
         if(q.answerMode!=='fraction')throw Error('Test topic failed to generate fraction mode');
         const fields=['quizFracWhole','quizFracNum','quizFracDen'].map(id=>document.getElementById(id));
         if(fields.some(x=>!x))throw Error('Missing fraction box');
         const values=k==='g5'?['','4','8']:['2','1','3'];
         for(let i=0;i<3;i++){fields[i].value=values[i];fields[i].dispatchEvent(new Event('input',{bubbles:true}))}
         if(!mk872PersistDraft())throw Error('Draft save returned false');
         const draft=mk872ReadDraft();
         return {id:blockSession.attemptId,key:blockSession.key,sig:q.sig,values,hasDraft:!!draft};
       },kind);
       await page.reload({waitUntil:'domcontentloaded',timeout:120000});
       await continueDraft(page);
       const b=await page.evaluate(()=>({
         id:blockSession?.attemptId,key:blockSession?.key,sig:q?.sig,
         values:['quizFracWhole','quizFracNum','quizFracDen'].map(id=>document.getElementById(id)?.value),
         inputs:['quizFracWhole','quizFracNum','quizFracDen'].map(id=>!!document.getElementById(id))
       }));
       if(a.id!==b.id||a.key!==b.key||a.sig!==b.sig)throw Error('Attempt identity lost '+JSON.stringify({a,b}));
       if(JSON.stringify(a.values)!==JSON.stringify(b.values))throw Error('Fraction inputs were not restored '+JSON.stringify({a,b}));
       return {attemptIdStable:true,questionStable:true,fractionFieldsRestored:true,fields:b.values};
     }finally{await ctx.close()}
   });
 }
 await check('Cross-grade G7 unfinished item resume unaffected',async()=>{
   const {ctx,page}=await fresh();
   try{
     const a=await page.evaluate(()=>{
       startG7QuizStage('g7:geo_primitives',0);
       if(!mk872PersistDraft())throw Error('Cannot save G7 draft');
       return {sig:q.sig,id:blockSession.attemptId}
     });
     await page.reload({waitUntil:'domcontentloaded',timeout:120000});
     await continueDraft(page);
     const b=await page.evaluate(()=>({sig:q.sig,id:blockSession.attemptId}));
     if(a.sig!==b.sig||a.id!==b.id)throw Error('G7 regression '+JSON.stringify({a,b}));
     return {g7Stable:true};
   }finally{await ctx.close()}
 });
 await check('Old v50 upgrade to v54 retains local profile and removes stale cache',async()=>{
   // Change server fixture to actual old release while no other browser context is active.
   fs.writeFileSync(path.join(directory,'index.html'),originalHtml);
   fs.writeFileSync(path.join(directory,'sw.js'),originalSw);
   const {ctx,page}=await fresh();
   try{
     await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:30000});
     const data=await page.evaluate(()=>{
       const values={xp:130,coins:99,inventory:['feline'],lessons:{g5:4,g6:2}};
       localStorage.setItem('stage18-old-profile',JSON.stringify(values));
       return {value:localStorage.getItem('stage18-old-profile')};
     });
     fs.writeFileSync(path.join(directory,'index.html'),candidateHtml);
     fs.writeFileSync(path.join(directory,'sw.js'),candidateSw);
     await page.goto(url,{waitUntil:'load',timeout:120000});
     await page.waitForFunction(()=>!!document.getElementById('matkvest-stage18d-grammar'),{timeout:20000});
     await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();if(r)await r.update()}).catch(()=>{});
     await page.waitForFunction(async()=>{const cachesNow=await caches.keys();return cachesNow.includes('matkvest-iphone-v54')&&!cachesNow.includes('matkvest-iphone-v50')},{timeout:60000});
     // The PWA intentionally reloads on controllerchange: do not read DOM during navigation.
     let newer=null;
     for(let retry=0;retry<12;retry++){
       try{
         await delay(450);
         newer=await page.evaluate(async()=>({
           sentinel:localStorage.getItem('stage18-old-profile'),
           hasForm:!!document.getElementById('matkvest-stage18d-grammar'),
           caches:await caches.keys(),
           controller:!!navigator.serviceWorker.controller
         }));
         if(newer.hasForm&&newer.controller)break;
       }catch(e){
         if(!/Execution context was destroyed|navigation|Cannot find context/i.test(String(e)))throw e;
       }
     }
     if(!newer)throw Error('Cannot inspect stable page after service-worker update');
     if(data.value!==newer.sentinel||!newer.hasForm||!newer.controller)throw Error('Legacy data or current application lost '+JSON.stringify(newer));
     return {profileRetained:true,staleSWDeleted:true,caches:newer.caches};
   }finally{await ctx.close()}
 });
 await check('v54 offline boot and cached local data',async()=>{
   fs.writeFileSync(path.join(directory,'index.html'),candidateHtml);
   fs.writeFileSync(path.join(directory,'sw.js'),candidateSw);
   const {ctx,page}=await fresh();
   try{
     await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:30000});
     await page.evaluate(()=>localStorage.setItem('stage18-offline','retained'));
     await page.setOfflineMode(true);
     const navigation=await page.reload({waitUntil:'domcontentloaded',timeout:30000});
     const actual=await page.evaluate(()=>({profile:localStorage.getItem('stage18-offline'),visible:!!document.getElementById('matkvest-stage18d-grammar')}));
     if(!navigation?.ok()||actual.profile!=='retained'||!actual.visible)throw Error('Offline boot failure '+JSON.stringify(actual));
     return {offline:true,dataRetained:true};
   }finally{await ctx.close()}
 });
}finally{
 await browser.close();
 server.kill('SIGTERM');
 fs.rmSync(directory,{recursive:true,force:true});
 fs.writeFileSync('audits/g5g6_stage18_resume_pwa_report.json',JSON.stringify(report,null,2)+'\n');
 console.log('SUMMARY '+JSON.stringify({passed:report.pass.length,failed:report.fail.length,failures:report.fail,pageErrors:report.pageErrors},null,2));
 if(report.fail.length||report.pageErrors.length)process.exitCode=1;
}
