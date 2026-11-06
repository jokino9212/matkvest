'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const file='file://'+path.resolve('index.html');

async function runScenario(browser,width,name,scenario){
 const context=await browser.newContext({viewport:{width,height:760},isMobile:width<=430,hasTouch:width<=430});
 const page=await context.newPage();
 const errors=[]; page.on('pageerror',e=>errors.push(String(e.message||e)));
 try{
  await page.goto(file,{waitUntil:'domcontentloaded'});
  const state=await scenario(page);
  if(errors.length)throw Error('Page errors: '+errors.slice(0,6).join(' | '));
  console.log('PASS_STAGE24',JSON.stringify({width,name,...state}));
 }finally{await context.close()}
}

async function restoredCompletion(page){
 const started=await page.evaluate(()=>{
   startG7QuizStage('g7:rational_numbers_forms',0);
   const id=blockSession.attemptId;
   // First item is skipped. The next gets a valid answer when possible, otherwise it is also skipped.
   skipNormalQuiz();
   let firstCorrect=false;
   for(let i=0;i<18;i++){
    if(q?.answerMode==='number'&&q.answerRat){
      const rat=q.answerRat,possibles=[String(q.correctText??''),String(Number(rat.n)/Number(rat.d)),'0'];
      const ans=possibles.find(v=>{const e=quizInputEvaluation(q,v);return e.valid&&e.ok});
      if(ans!==undefined){
       const input=document.getElementById('quizInput');input.value=ans;input.dispatchEvent(new Event('input',{bubbles:true}));
       document.getElementById('quizCheck')?.click();
       if(answered){firstCorrect=true;document.getElementById('quizNext')?.click();break}
      }
    }
    skipNormalQuiz();
    if(blockSession.finished)break;
   }
   const draftSaved=mk872PersistDraft(),d=mk872ReadDraft();
   return {id,done:blockSession.done,correct:blockSession.correct,itemCount:blockSession.items.length,
    firstCorrect,draftSaved,draftId:d?.attemptId,historyBefore:state.attemptHistory?.filter(x=>x.id===id).length||0,
    xp:state.xp,coins:state.coins};
 });
 assert(started.draftSaved,'Draft not saved');
 assert.equal(started.draftId,started.id);
 await page.reload({waitUntil:'domcontentloaded'});
 const report=await page.evaluate((started)=>{
   const d=mk872ReadDraft();
   if(!d)throw Error('Draft missing after reload');
   mk872RestoreDraft(d);
   const recovered={
    id:blockSession.attemptId,done:blockSession.done,correct:blockSession.correct,
    itemCount:blockSession.items.length,history:state.attemptHistory?.filter(x=>x.id===started.id).length||0
   };
   let iterations=0;
   while(blockSession && !blockSession.finished && iterations<60){
     const prev=blockSession.done;
     if(!skipNormalQuiz())throw Error('Skip failed in finishing loop');
     if(blockSession.done<=prev && !blockSession.finished)throw Error('No block progress');
     iterations++;
   }
   if(!blockSession?.finished)throw Error('Did not finish training');
   // Final skipped item should trigger result rendering via skipNormalQuiz.
   const history=(state.attemptHistory||[]).filter(x=>x.id===started.id);
   const finalized={history:history.length,status:history[0]?.status,reportId:blockSession.reportId,
    total:blockSession.total,done:blockSession.done,correct:blockSession.correct,
    xp:state.xp,coins:state.coins,rendered:document.querySelector('.block-result')?.textContent?.includes('Верно с первой')||false,
    active:state.activeAttempt?.id||null,bonusFlags:progressFor(blockSession.key).bonus.slice()};
   // The finished screen contains an action that can trigger finishBlock again in abnormal cases.
   finishBlock();
   const repeated={history:(state.attemptHistory||[]).filter(x=>x.id===started.id).length,
     xp:state.xp,coins:state.coins,reportId:blockSession.reportId,
     bonusFlags:progressFor(blockSession.key).bonus.slice()};
   return {recovered,iterations,finalized,repeated,draftLeft:!!mk872ReadDraft()};
 },started);
 assert.equal(report.recovered.id,started.id,'Recovery changed attempt id');
 assert.equal(report.recovered.done,started.done,'Recovery changed completed count');
 assert.equal(report.recovered.correct,started.correct,'Recovery changed score');
 assert.equal(report.recovered.itemCount,started.itemCount,'Recovery changed completed items');
 assert.equal(report.finalized.history,1,'Missing or duplicate history records');
 assert(report.finalized.reportId,'Finalized report ID missing');
 assert(report.finalized.rendered,'Result screen missing');
 assert.equal(report.finalized.done,report.finalized.total,'Block not fully completed');
 assert.equal(report.repeated.history,1,'Repeated finish created duplicate history');
 assert.equal(report.repeated.xp,report.finalized.xp,'Repeated finish awarded extra XP');
 assert.equal(report.repeated.coins,report.finalized.coins,'Repeated finish awarded extra coins');
 assert(!report.draftLeft,'Finished attempt draft was not cleared');
 await page.reload({waitUntil:'domcontentloaded'});
 const afterReload=await page.evaluate(id=>({
  history:(state.attemptHistory||[]).filter(x=>x.id===id).length,
  draft:!!mk872ReadDraft(),active:state.activeAttempt?.id||null,
  xp:state.xp,coins:state.coins
 }),started.id);
 assert.equal(afterReload.history,1,'History duplicates after final reload');
 assert(!afterReload.draft,'Finished draft reappeared');
 assert.equal(afterReload.xp,report.repeated.xp,'XP changed after final reload');
 assert.equal(afterReload.coins,report.repeated.coins,'Coins changed after final reload');
 return {started,recovered:report.recovered,finalized:report.finalized,repeated:report.repeated,afterReload};
}

async function exitConfirmation(page){
 const initialized=await page.evaluate(()=>{
  startG7QuizStage('g7:rational_numbers_forms',0);
  const id=blockSession.attemptId;
  const before={id,xp:state.xp,coins:state.coins};
  closeModal();
  const dialog=document.querySelector('.mk872-training-dialog');
  if(!dialog)throw Error('Exit dialog missing');
  return {...before,dialog:dialog.textContent.slice(0,170),draftId:mk872ReadDraft()?.attemptId};
 });
 assert.equal(initialized.id,initialized.draftId,'Exit confirmation lost draft');
 const continued=await page.evaluate(()=>{
  const dialog=document.querySelector('.mk872-training-dialog');
  [...dialog.querySelectorAll('button')].find(b=>b.textContent.includes('Продолжить'))?.click();
  return {dialogOpen:!!document.querySelector('.mk872-training-dialog'),active:!!blockSession};
 });
 assert(!continued.dialogOpen&&continued.active,'Continue did not preserve attempt: '+JSON.stringify({initialized,continued}));
 const exited=await page.evaluate(()=>{
  closeModal();
  const dialog=document.querySelector('.mk872-training-dialog');
  [...dialog.querySelectorAll('button')].find(b=>b.textContent.includes('Выйти из тренировки'))?.click();
  return {dialogOpen:!!document.querySelector('.mk872-training-dialog'),
   draft:!!mk872ReadDraft(),active:state.activeAttempt?.id||null,
   block:!!blockSession,xp:state.xp,coins:state.coins,
   matchingHistory:(state.attemptHistory||[]).filter(r=>r.id===window._unusedId).length};
 });
 assert(!exited.dialogOpen&&!exited.draft&&!exited.active&&!exited.block,
  'Exit kept active draft/session '+JSON.stringify(exited));
 assert.equal(exited.xp,initialized.xp,'Exiting awarded XP');
 assert.equal(exited.coins,initialized.coins,'Exiting awarded coins');
 await page.reload({waitUntil:'domcontentloaded'});
 const reloaded=await page.evaluate(()=>({draft:!!mk872ReadDraft(),
  dialog:!!document.querySelector('.mk872-training-dialog'),active:state.activeAttempt?.id||null}));
 assert(!reloaded.draft&&!reloaded.active,'Exit draft returned after reload');
 return {initialized,continued,exited,reloaded};
}

async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let failures=0;
 try{
  for(const width of [320,390,768]){
   for(const [name,fn] of [['resume-complete',restoredCompletion],['exit-dialog',exitConfirmation]]){
    try{await runScenario(browser,width,name,fn)}
    catch(e){failures++;console.error('FAIL_STAGE24',JSON.stringify({width,name,error:String(e),stack:String(e.stack||'').slice(0,2100)}))}
   }
  }
 }finally{await browser.close()}
 console.log('STAGE24_SUMMARY',JSON.stringify({expected:6,failures}));
 if(failures)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
