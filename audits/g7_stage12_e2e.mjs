import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';

const expected='3d93fc220d9a8e29b2a299a22036b1d50eefad65b40364e1de1e52b4d8d6de88';
const current=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(current!==expected)throw Error('Stage 11 source hash mismatch '+current);
const port=32187;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
async function waitServer(){for(let n=0;n<35;n++){try{const res=await fetch('http://127.0.0.1:'+port+'/index.html');if(res.ok){await res.body?.cancel();return}}catch{}await delay(200)}throw Error('Local HTTP server unavailable')}
const browser=await puppeteer.launch({executablePath:['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>fs.existsSync(p)),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results={sha256:expected,testedAt:new Date().toISOString(),passes:[],failures:[],pageErrors:[],notes:[]};
const url='http://127.0.0.1:'+port+'/index.html';
async function scenario(label,fn){try{const r=await fn();results.passes.push({label,...r});console.log('PASS',label,JSON.stringify(r).slice(0,550))}catch(e){results.failures.push({label,error:String(e),stack:String(e.stack).slice(0,1300)});console.error('FAIL',label,String(e))}}
async function fresh(){const ctx=await browser.createBrowserContext(),page=await ctx.newPage();page.on('pageerror',e=>results.pageErrors.push(String(e)));await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});return {ctx,page}}
async function resume(page){await page.waitForSelector('.mk872-training-dialog',{timeout:10000});return page.evaluate(()=>{const b=[...document.querySelectorAll('.mk872-training-dialog button')].find(x=>x.textContent.trim()==='Продолжить');if(!b)throw Error('Resume button missing');b.click();return {dialog:!!document.querySelector('.mk872-training-dialog'),active:mk872HasActiveLearning(),key:blockSession?.key,attemptId:blockSession?.attemptId,done:blockSession?.done,qSig:q?.sig}})}
await waitServer();
try{
 await scenario('G7 exact resume after reload',async()=>{
  const {ctx,page}=await fresh();
  const a=await page.evaluate(()=>{
   startG7QuizStage('g7:geo_primitives',0);
   const sig=String(q.sig),attemptId=blockSession.attemptId,keys=Object.keys(localStorage);
   if(!mk872PersistDraft())throw Error('Draft save returned false');
   const draft=mk872ReadDraft();if(!draft)throw Error('Draft not stored');
   return {sig,attemptId,key:blockSession.key,done:blockSession.done,storedKey:mk872DraftKey(),storedAttempt:draft.attemptId,keys};
  });
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  const b=await resume(page);
  if(!b.active||b.qSig!==a.sig||b.attemptId!==a.attemptId||b.done!==a.done)throw Error('Incorrect question or attempt restored '+JSON.stringify({a,b}));
  await ctx.close();return {original:a.sig,restored:b.qSig,done:b.done};
 });
 await scenario('G7 answer state and progress after reload',async()=>{
  const {ctx,page}=await fresh();
  const a=await page.evaluate(()=>{
    startG7QuizStage('g7:geo_primitives',0);
    if(!q.choices?.length)throw Error('No choices');
    const i=q.choices.findIndex(c=>String(c.key)===String(q.ans));
    if(i<0)throw Error('Correct choice not found');
    pick(i);
    if(blockSession.correct!==1)throw Error('Correct answer not counted');
    if(!mk872PersistDraft())throw Error('Draft save failed');
    return {id:blockSession.attemptId,sig:q.sig,answered,done:blockSession.done,correct:blockSession.correct};
  });
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  const b=await resume(page);
  const c=await page.evaluate(()=>({id:blockSession.attemptId,sig:q.sig,answered,done:blockSession.done,correct:blockSession.correct,nextDisplay:document.getElementById('quizNext')?.style.display}));
  if(c.id!==a.id||c.sig!==a.sig||c.correct!==a.correct||c.answered!==a.answered)throw Error('Answer state mismatch '+JSON.stringify({a,b,c}));
  await page.evaluate(()=>{document.getElementById('quizNext').click()});
  const next=await page.evaluate(()=>({done:blockSession.done,correct:blockSession.correct,attemptId:blockSession.attemptId}));
  if(next.done!==1||next.correct!==1||next.attemptId!==a.id)throw Error('Advance counted incorrectly '+JSON.stringify(next));
  await ctx.close();return {correct:c.correct,doneAfterNext:next.done,idStable:true};
 });
 await scenario('G7 typed input retained after reload',async()=>{
  const {ctx,page}=await fresh();
  const a=await page.evaluate(()=>{
    for(let tries=0;tries<80;tries++){
      startG7QuizStage('g7:rational_numbers_forms',0);
      if(q.answerMode==='number')break;
    }
    if(q.answerMode!=='number')throw Error('Cannot produce numeric input');
    const input=document.getElementById('quizInput');if(!input)throw Error('No numeric input');
    input.value='123,456';input.dispatchEvent(new Event('input',{bubbles:true}));
    if(!mk872PersistDraft())throw Error('Save failed');
    return {id:blockSession.attemptId,sig:q.sig,value:input.value};
  });
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  const b=await resume(page);
  const c=await page.evaluate(()=>({id:blockSession.attemptId,sig:q.sig,value:document.getElementById('quizInput')?.value}));
  if(c.value!==a.value||c.id!==a.id||c.sig!==a.sig)throw Error('Typed value not preserved '+JSON.stringify({a,b,c}));
  await ctx.close();return {value:c.value,exactQuestion:true};
 });
 await scenario('G7 explicit exit deletes unfinished snapshot',async()=>{
  const {ctx,page}=await fresh();
  await page.evaluate(()=>{startG7QuizStage('g7:geo_primitives',0);mk872PersistDraft();closeModal()});
  await page.waitForSelector('.mk872-training-dialog',{timeout:7000});
  const a=await page.evaluate(()=>{
    const names=[...document.querySelectorAll('.mk872-training-dialog button')].map(b=>b.textContent.trim());
    const b=[...document.querySelectorAll('.mk872-training-dialog button')].find(b=>b.textContent.trim()==='Выйти из тренировки');
    if(!b)throw Error('Exit confirmation missing');
    b.click();
    return {names,hasDraft:!!mk872ReadDraft(),active:mk872HasActiveLearning()};
  });
  if(a.hasDraft||a.active)throw Error('Explicit exit did not clear draft');
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await delay(400);
  const b=await page.evaluate(()=>({dialog:!!document.querySelector('.mk872-training-dialog'),hasDraft:!!mk872ReadDraft()}));
  if(b.dialog||b.hasDraft)throw Error('Abandoned draft appeared after reload');
  await ctx.close();return {explicitExitClearsDraft:true};
 });
 await scenario('PWA installed worker and navigation network-first',async()=>{
  const {ctx,page}=await fresh();
  await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:20000});
  const before=await page.evaluate(async()=>({controller:!!navigator.serviceWorker.controller,registration:!!(await navigator.serviceWorker.getRegistration()),cacheNames:await caches.keys()}));
  if(!before.controller||!before.registration)throw Error('Service worker not controlling page');
  if(!before.cacheNames.includes('matkvest-iphone-v39'))throw Error('Unexpected cache name '+before.cacheNames.join(','));
  const nav=await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  if(!nav.ok())throw Error('Online nav returned error');
  await ctx.close();return before;
 });
}finally{
  await browser.close();
  server.kill('SIGTERM');
  fs.writeFileSync('audits/g7_stage12_e2e_report.json',JSON.stringify(results,null,2)+'\n');
  console.log('STAGE12 SUMMARY',JSON.stringify({passes:results.passes.length,failures:results.failures,pageErrors:results.pageErrors},null,2));
  if(results.failures.length||results.pageErrors.length)process.exitCode=1;
}
