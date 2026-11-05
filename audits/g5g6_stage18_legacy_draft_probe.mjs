import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';

const oldCommit='e58d84f15eaeb71a3e4d904cfb316724b2fd678d';
const newCommit='074154775f45573804bdf30e4c821d654c707023';
const oldHTML=execFileSync('git',['show',oldCommit+':index.html'],{maxBuffer:25*1024*1024});
const oldSW=execFileSync('git',['show',oldCommit+':sw.js']);
const newHTML=execFileSync('git',['show',newCommit+':index.html'],{maxBuffer:25*1024*1024});
const newSW=execFileSync('git',['show',newCommit+':sw.js']);
if(!oldSW.toString().includes('matkvest-iphone-v40')||!newSW.toString().includes('matkvest-iphone-v55'))throw Error('Unexpected PWA source');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'matkvest-stage18-legacy-draft-'));
const writeOld=()=>{fs.writeFileSync(path.join(tmp,'index.html'),oldHTML);fs.writeFileSync(path.join(tmp,'sw.js'),oldSW)};
const writeNew=()=>{fs.writeFileSync(path.join(tmp,'index.html'),newHTML);fs.writeFileSync(path.join(tmp,'sw.js'),newSW)};
writeOld();fs.copyFileSync('manifest.webmanifest',path.join(tmp,'manifest.webmanifest'));
const port=32179,url='http://127.0.0.1:'+port+'/index.html';
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',tmp],{stdio:'ignore'});
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
const report={test:'Real v40 incomplete G5/G6 attempt -> v55',at:new Date().toISOString(),cases:[],pageErrors:[]};
async function waitServer(){for(let i=0;i<65;i++){try{let r=await fetch(url);if(r.ok){await r.body?.cancel();return}}catch{}await delay(200)}throw Error('server unavailable');}
async function doCase(name,oldInit){
 writeOld();
 const ctx=await browser.createBrowserContext();
 const page=await ctx.newPage();
 page.on('pageerror',e=>report.pageErrors.push(String(e)));
 const result={name,status:'FAIL'};
 try{
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
   await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:30000});
   const before=await page.evaluate(oldInit);
   result.before=before;
   if(!before.saved)throw Error('Previous unfinished draft did not persist');
   writeNew();
   await page.goto(url,{waitUntil:'load',timeout:120000});
   await page.waitForFunction(()=>!!document.getElementById('matkvest-stage18g-sectors'),{timeout:25000});
   await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();if(reg)await reg.update()}).catch(()=>{});
   await page.waitForFunction(async()=>{const c=await caches.keys();return c.includes('matkvest-iphone-v55')&&!c.includes('matkvest-iphone-v40')},{timeout:60000});
   // Expected SW controllerchange may navigate more than once; make sure the final document is stable.
   await page.waitForSelector('.mk872-training-dialog',{timeout:20000});
   let succeeded=false;
   for(let i=0;i<12;i++){try{
     await delay(450);
     const state=await page.evaluate(()=>{
       const btn=[...document.querySelectorAll('.mk872-training-dialog button')].find(b=>b.textContent.trim()==='Продолжить');
       if(!btn)throw Error('No resume action on legacy draft');
       btn.click();
       return {qid,attemptId:blockSession?.attemptId,key:blockSession?.key,sig:q?.sig,mode:q?.answerMode||'choice',
         legacy:document.getElementById('quizInput')?.value??null,
         boxes:['quizFracWhole','quizFracNum','quizFracDen'].map(id=>document.getElementById(id)?.value??null),
         hasChoice:!!document.querySelector('#qstage .answers .answer'),
         hasNext:!!document.getElementById('quizNext'),
         savedDraft:!!mk872ReadDraft()};
     });
     result.after=state;succeeded=true;break;
   }catch(err){if(!/context was destroyed|navigation|Cannot find context/i.test(String(err)))throw err}}
   if(!succeeded)throw Error('Cannot read resumed draft after SW update');
   result.sameAttempt=result.after.attemptId===before.id && result.after.sig===before.sig;
   result.typedValueRestored=before.typed===null?true:(result.after.legacy===before.typed ||
     (result.after.boxes[1]+'/'+result.after.boxes[2]===before.typed));
   result.status=result.sameAttempt && result.typedValueRestored?'PASS':'FAIL';
 }catch(e){result.error=String(e)}
 finally{report.cases.push(result);await ctx.close();}
}
try{
 await waitServer();
 await doCase('G5 prior-choice fraction answer',()=>{
   startG5QuizStage('frac_read',0);
   if(!mk872PersistDraft())throw Error('G5 draft save failed');
   return {id:blockSession.attemptId,sig:q.sig,mode:q.answerMode||'choice',typed:null,saved:!!mk872ReadDraft()};
 });
 await doCase('G6 old slash-form fraction answer',()=>{
   for(let i=0;i<80;i++){startG6QuizStage('g6:fraction_add_subtract',0);if(q.answerMode==='fraction'&&document.getElementById('quizInput'))break;}
   if(q.answerMode!=='fraction')throw Error('G6 legacy fraction question not found');
   const typed='2/3',input=document.getElementById('quizInput');if(!input)throw Error('Old text field missing');
   input.value=typed;input.dispatchEvent(new Event('input',{bubbles:true}));
   if(!mk872PersistDraft())throw Error('G6 draft save failed');
   return {id:blockSession.attemptId,sig:q.sig,mode:q.answerMode,typed,saved:!!mk872ReadDraft()};
 });
}catch(e){report.internalError=String(e)}
finally{
 await browser.close();server.kill('SIGTERM');fs.rmSync(tmp,{recursive:true,force:true});
 fs.writeFileSync('audits/g5g6_stage18_legacy_draft_probe.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 if(report.internalError||report.pageErrors.length)process.exitCode=1;
}
