import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v68')||!sw.includes(sha))throw Error('PWA v68 mismatch');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!exe)throw Error('Chromium executable missing');
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const report={sha,checks:[],errors:[],scenes:[]};
function check(name,pass,detail){report.checks.push({name,pass:!!pass,detail:pass?undefined:detail})}
async function fresh(width){
 const ctx=await browser.createBrowserContext(),p=await ctx.newPage();
 p.on('pageerror',e=>report.errors.push(String(e)));
 await p.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 return {ctx,p};
}
const inspect=p=>p.evaluate(()=>({
 attemptId:blockSession?.attemptId,
 currentItem:blockSession?.currentItem?.itemId,
 done:blockSession?.done,answered,
 penalty:quizPenalty,quiz:!!document.querySelector('#qstage'),
 dialog:!!document.querySelector('.mk872-training-dialog'),
 heading:document.querySelector('.mk872-training-panel h2')?.textContent,
 message:document.querySelector('.mk872-training-panel p')?.textContent,
 buttons:[...document.querySelectorAll('.mk872-training-actions button')].map(b=>b.textContent),
 focus:document.activeElement?.id||document.activeElement?.textContent?.slice(0,55),
 balance:state.coins,xp:state.xp,
 draft:!!mk872ReadDraft(),viewport:innerWidth,body:document.documentElement.scrollWidth
}));
const action=(p,part)=>p.evaluate(part=>{
 const button=[...document.querySelectorAll('.mk872-training-actions button')].find(e=>e.textContent.includes(part));
 if(!button)return false;button.click();return true;
},part);
const start=(p,kind)=>p.evaluate(kind=>{
 if(kind==='table')startTableStage(0);
 else if(kind==='column')startColumnStage('add',0);
 else startQuizStage('numbers',0);
},kind);
async function popup(p){await p.waitForSelector('.mk872-training-dialog',{timeout:10000})}
try{
 for(const width of [320,390,768,1280]){
   const {ctx,p}=await fresh(width);
   await start(p,'quiz');
   const a=await inspect(p);
   check('Live grade 4 quiz is accessible at '+width,a.quiz&&a.currentItem&&a.done===0,a);
   const before=await p.evaluate(()=>({
     id:blockSession.attemptId,item:blockSession.currentItem,coins:state.coins,xp:state.xp,
     oldDraft:mk872ReadDraft()?.attemptId
   }));
   await p.click('#quizSkip');await popup(p);
   let d=await inspect(p);
   check('Skip opens explicit confirmation at '+width,d.dialog&&/Пропустить это задание/.test(d.heading)&&d.buttons.some(x=>x.includes('Вернуться')),d);
   check('Pending skip cannot change question or balances at '+width,d.done===0&&d.currentItem===a.currentItem&&d.balance===before.coins&&d.xp===before.xp,d);
   check('Skip confirmation is in viewport at '+width,d.body<=width+2,d);
   if(width===390||width===1280)await p.screenshot({path:'audits/ui19h_skip_'+width+'.png',fullPage:false});
   await p.keyboard.press('Escape');
   d=await inspect(p);
   check('Escape cancels skip with no progress change at '+width,!d.dialog&&d.done===0&&d.currentItem===a.currentItem,d);
   await p.click('#quizSkip');await popup(p);
   const cancelled=await action(p,'Вернуться');d=await inspect(p);
   check('Cancel button preserves same item and focus at '+width,cancelled&&!d.dialog&&d.done===0&&d.focus==='quizSkip',d);
   await p.click('#quizSkip');await popup(p);
   const confirmed=await action(p,'Да, пропустить');d=await inspect(p);
   check('Confirmed skip consumes exactly one item at '+width,confirmed&&d.done===1&&d.currentItem!==a.currentItem&&!d.dialog,d);
   check('Explicit skip leaves XP/coins unchanged at '+width,d.balance===before.coins&&d.xp===before.xp,d);
   check('No horizontal overflow after normal skip at '+width,d.body<=width+2,d);
   report.scenes.push({width,initial:a,afterSkip:d});
   // A mistaken answer must not bypass the same confirmation.
   const wrong=await p.evaluate(()=>{
     if(!q?.choices?.length)return false;
     const wrongIndex=q.choices.findIndex(c=>String(c.key)!==String(q.ans));
     if(wrongIndex<0)return false;
     pick(wrongIndex);
     return true;
   });
   if(wrong){
     const prev=await inspect(p);
     await p.click('#quizSkip');await popup(p);
     const during=await inspect(p);
     check('After wrong answer, skip still waits for confirmation at '+width,during.done===prev.done&&during.currentItem===prev.currentItem,during);
     await action(p,'Вернуться');
   }
   // Existing exit semantics are destructive, so the label must state that.
   await p.evaluate(()=>closeModal());await popup(p);
   d=await inspect(p);
   check('Closing quiz explains destructive exit at '+width,d.message?.includes('удалены')&&d.buttons.some(x=>x.includes('удалить попытку')),d);
   await action(p,'Остаться');
   d=await inspect(p);
   check('Cancel exit retains attempt at '+width,!d.dialog&&d.attemptId===a.attemptId,d);
   await ctx.close();
 }
 // Table multiplication and written-column routes use different existing skip functions.
 for(const kind of ['table','column']){
   const {ctx,p}=await fresh(390);await start(p,kind);
   const before=await inspect(p);
   const btn=kind==='table'?'#tstage .btn.soft':'#stage .btn.soft';
   await p.click(btn);await popup(p);
   const pending=await inspect(p);
   check(kind+' skip uses the same confirmation without scoring',pending.dialog&&pending.done===0&&pending.balance===before.balance,pending);
   await action(p,'Да, пропустить');
   const after=await inspect(p);
   check(kind+' confirmed skip advances exactly one item',after.done===1&&!after.dialog,after);
   await ctx.close();
 }
 // Reopen must use the same attempt and same rendered question after reload.
 {
   const {ctx,p}=await fresh(390);await start(p,'quiz');
   const a=await inspect(p);
   const saved=await p.evaluate(()=>mk872PersistDraft());
   check('Full unfinished attempt can be saved before reload',saved,{saved});
   await p.reload({waitUntil:'domcontentloaded',timeout:120000});await popup(p);
   let d=await inspect(p);
   check('After reload, resume dialog appears without auto-replacing questions',d.dialog&&d.buttons.includes('Продолжить')&&d.draft,d);
   const touched=await action(p,'Начать заново');await popup(p);d=await inspect(p);
   check('Restart now requires a second explicit destructive confirmation',touched&&/Начать тренировку заново/.test(d.heading)&&d.draft,d);
   await action(p,'Отмена');d=await inspect(p);
   check('Cancel restart does not remove persisted draft',!d.dialog&&d.draft,d);
   await p.evaluate(()=>mk872OfferResume());await popup(p);
   await action(p,'Продолжить');
   d=await inspect(p);
   check('Resumed attempt keeps its original attemptId and item',d.attemptId===a.attemptId&&d.currentItem===a.currentItem&&d.done===a.done,d);
   check('Resume preserves finances',d.balance===a.balance&&d.xp===a.xp,d);
   await p.evaluate(()=>closeModal());await popup(p);
   await action(p,'Выйти и удалить');d=await inspect(p);
   check('Explicitly destructive exit clears draft and active attempt',!d.draft&&!d.dialog&&d.attemptId==null,d);
   await ctx.close();
 }
 // A final skipped question must settle to an ordinary result once, never twice.
 {
   const {ctx,p}=await fresh(390);await start(p,'quiz');
   await p.evaluate(()=>{
     blockSession.total=1;
     if(state.activeAttempt)state.activeAttempt.total=1;
   });
   await p.click('#quizSkip');await popup(p);
   await action(p,'Да, пропустить');
   const d=await p.evaluate(()=>({
     finished:!mk872HasActiveLearning(),
     record:state.attemptHistory?.[0]?.status,
     draft:mk872ReadDraft()?.attemptId||null,
     skipCount:state.attemptHistory?.[0]?.items?.filter(x=>x.skipped).length||0
   }));
   check('Last-question skip completes exactly one skipped item',d.finished&&d.skipCount===1,d);
   await ctx.close();
 }
 // Correct-answer state must resume with its existing Next action and not grant a second reward.
 {
   const {ctx,p}=await fresh(390);await start(p,'quiz');
   const correct=await p.evaluate(()=>{
     const n=q?.choices?.findIndex(c=>String(c.key)===String(q.ans))??-1;
     if(n<0)return false;
     pick(n);return true;
   });
   if(!correct)throw Error('Grade 4 choice answer fixture disappeared');
   const before=await p.evaluate(()=>({
     id:blockSession?.attemptId,done:blockSession?.done,item:blockSession?.currentItem?.itemId,
     coins:state.coins,xp:state.xp,answered,
     skipHidden:getComputedStyle(document.getElementById('quizSkip')).display==='none',
     nextVisible:getComputedStyle(document.getElementById('quizNext')).display!=='none'
   }));
   check('Correct answer resolves and hides skip while exposing Next',before.answered&&before.skipHidden&&before.nextVisible,before);
   await p.evaluate(()=>mk872PersistDraft());
   await p.reload({waitUntil:'domcontentloaded',timeout:120000});await popup(p);
   await action(p,'Продолжить');
   const resumed=await p.evaluate(()=>({
     id:blockSession?.attemptId,done:blockSession?.done,item:blockSession?.currentItem?.itemId,
     coins:state.coins,xp:state.xp,answered,
     nextVisible:getComputedStyle(document.getElementById('quizNext')).display!=='none',
     nextReady:typeof document.getElementById('quizNext')?.onclick==='function'
   }));
   check('Resolved question restores the same Next action and no duplicate reward',
     resumed.id===before.id&&resumed.done===before.done&&resumed.item===before.item&&
     resumed.coins===before.coins&&resumed.xp===before.xp&&resumed.answered&&resumed.nextVisible&&resumed.nextReady,
     {before,resumed});
   await p.click('#quizNext');
   const after=await inspect(p);
   check('Restored Next advances one new item with no duplicate XP',
     after.currentItem!==before.item&&after.done===before.done&&after.xp===before.xp&&after.balance===before.coins,after);
   await ctx.close();
 }
 // Quick trainer uses a separate session representation: reload must resume the same question.
 {
   const {ctx,p}=await fresh(390);
   const before=await p.evaluate(()=>{
     openQuickTrainer('quick:multiplication');
     startQuickTraining();
     return{mode:quickMode,id:quickSession?.recordId,question:quickQuestion?.instanceId,
       count:quickSession?.answered,coins:state.coins,xp:state.xp,save:mk872PersistDraft()};
   });
   check('Quick trainer saves an active session and question',before.mode==='training'&&!!before.id&&!!before.question&&before.save,before);
   await p.reload({waitUntil:'domcontentloaded',timeout:120000});await popup(p);
   const pending=await inspect(p);
   check('Quick trainer reload offers an explicit resume',pending.dialog&&pending.buttons.includes('Продолжить'),pending);
   await action(p,'Продолжить');
   const after=await p.evaluate(()=>({
     mode:quickMode,id:quickSession?.recordId,question:quickQuestion?.instanceId,
     count:quickSession?.answered,coins:state.coins,xp:state.xp,
     trainingVisible:!!document.querySelector('#quickStage')
   }));
   check('Quick resume restores the exact question and balance',
     after.mode==='training'&&after.id===before.id&&after.question===before.question&&
     after.count===before.count&&after.coins===before.coins&&after.xp===before.xp&&after.trainingVisible,
     {before,after});
   await ctx.close();
 }
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19h_test_report.json',JSON.stringify(report,null,2)+'\n');
 const bad=report.checks.filter(c=>!c.pass);
 console.log(JSON.stringify({sha,checks:report.checks.length,passed:report.checks.length-bad.length,failures:bad,errors:report.errors},null,2).slice(0,25000));
 if(bad.length||report.errors.length)process.exitCode=1;
}
