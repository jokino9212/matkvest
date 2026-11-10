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
   // Skip is a two-step UX: reveal answer, then click Next. Keep the draft
   // in progress before reloading instead of accidentally finishing the block.
   if(!skipNormalQuiz())throw Error('Initial skip failed');
   const initialFeedback=document.getElementById('qfb')?.textContent||'';
   if(!initialFeedback.includes('Правильный ответ:'))throw Error('Initial skip did not reveal answer');
   document.getElementById('quizNext')?.click();
   if(answered||blockSession.done!==1)throw Error('Initial skip did not advance after Next');
   let firstCorrect=false;
   if(q?.answerMode==='number'&&q.answerRat){
     const rat=q.answerRat,possibles=[String(q.correctText??''),String(Number(rat.n)/Number(rat.d)),'0'];
     const ans=possibles.find(v=>{const e=quizInputEvaluation(q,v);return e.valid&&e.ok});
     if(ans!==undefined){
       const input=document.getElementById('quizInput');
       if(input){
         input.value=ans;input.dispatchEvent(new Event('input',{bubbles:true}));
         document.getElementById('quizCheck')?.click();
         if(answered){firstCorrect=true;document.getElementById('quizNext')?.click()}
       }
     }
   }
   if(!firstCorrect){
     if(!skipNormalQuiz())throw Error('Second skip failed');
     const feedback=document.getElementById('qfb')?.textContent||'';
     if(!feedback.includes('Правильный ответ:'))throw Error('Second skip did not reveal answer');
     document.getElementById('quizNext')?.click();
   }
   if(blockSession.finished||blockSession.done<2)throw Error('Draft did not remain in progress');
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
     if(!document.getElementById('qfb')?.textContent?.includes('Правильный ответ:'))throw Error('Correct skip answer was hidden');
     if(blockSession.done<=prev)throw Error('No block progress');
     document.getElementById('quizNext')?.click();
     iterations++;
   }
   if(!blockSession?.finished)throw Error('Did not finish training');
   // Final skipped item reveals its answer; Next explicitly opens the result.
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
  return {...before,dialog:dialog.textContent.slice(0,170),buttons:[...dialog.querySelectorAll('button')].map(b=>b.textContent.trim()),draftId:mk872ReadDraft()?.attemptId};
 });
 assert.equal(initialized.id,initialized.draftId,'Exit confirmation lost draft');
 const continued=await page.evaluate(()=>{
  const dialog=document.querySelector('.mk872-training-dialog');
  [...dialog.querySelectorAll('button')].find(b=>b.textContent.includes('Остаться в тренировке'))?.click();
  return {dialogOpen:!!document.querySelector('.mk872-training-dialog'),active:!!blockSession};
 });
 assert(!continued.dialogOpen&&continued.active,'Continue did not preserve attempt: '+JSON.stringify({initialized,continued}));
 const exited=await page.evaluate(()=>{
  closeModal();
  const dialog=document.querySelector('.mk872-training-dialog');
  [...dialog.querySelectorAll('button')].find(b=>b.textContent.includes('Выйти и удалить попытку'))?.click();
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


async function firstPassBonus(page){
 const result=await page.evaluate(()=>{
  const originalXp=state.xp,originalCoins=state.coins;
  const topic='g8:square_root_arithmetic';
  const key=topic,stage=0;
  const prior=progressFor(key).bonus[stage];
  if(prior)throw Error('Clean test profile already has completion bonus');
  function answer(){
   if(q?.choices?.length){
    const index=q.choices.findIndex(c=>String(c.key)===String(q.ans));
    if(index<0)throw Error('No correct choice');
    pick(index);return;
   }
   if(q?.answerMode==='number'&&q.answerRat){
    const r=q.answerRat;
    const variants=[String(q.correctText??''),String(Number(r.n)/Number(r.d)),String(r.n)+'/'+String(r.d)];
    const answer=variants.find(x=>{const e=quizInputEvaluation(q,x);return e.valid&&e.ok});
    if(answer===undefined)throw Error('Unable to derive numeric answer');
    const input=document.getElementById('quizInput');if(!input)throw Error('No input');
    input.value=answer;input.dispatchEvent(new Event('input',{bubbles:true}));
    document.getElementById('quizCheck')?.click();return;
   }
   throw Error('Unsupported generated form '+q?.answerMode);
  }
  function complete(){
   startG8QuizStage(topic,stage);
   const id=blockSession.attemptId;
   let cycles=0;
   while(cycles++<15){
     answer();
     if(!answered)throw Error('Input not credited');
     if(blockSession.finished)break;
     document.getElementById('quizNext')?.click();
   }
   if(!blockSession.finished)throw Error('Not finished after '+cycles+' cycles');
   const beforeFinish={xp:state.xp,coins:state.coins};
   document.getElementById('quizNext')?.click();
   if(!blockSession.reportId)throw Error('Result not finalized');
   const finishDelta={xp:state.xp-beforeFinish.xp,coins:state.coins-beforeFinish.coins};
   return {id,done:blockSession.done,correct:blockSession.correct,xp:state.xp,coins:state.coins,finishDelta,
     history:(state.attemptHistory||[]).filter(a=>a.id===id).length,bonus:progressFor(key).bonus[stage]};
  }
  const first=complete();
  finishBlock();
  const afterDouble={xp:state.xp,coins:state.coins,history:(state.attemptHistory||[]).filter(a=>a.id===first.id).length};
  const second=complete();
  finishBlock();
  const afterRepeat={xp:state.xp,coins:state.coins,history:(state.attemptHistory||[]).filter(a=>a.id===second.id).length};
  return {originalXp,originalCoins,first,afterDouble,second,afterRepeat};
 });
 assert.equal(result.first.correct,result.first.done,'First passing run not all correct');
 assert(result.first.bonus,'Initial pass bonus flag missing');
 assert.equal(result.first.history,1);
 assert.equal(result.afterDouble.history,1,'Duplicate history when finish repeated');
 assert.equal(result.afterDouble.xp,result.first.xp,'Double finish credited XP');
 assert.equal(result.afterDouble.coins,result.first.coins,'Double finish credited coins');
 assert.equal(result.second.history,1);
 assert.deepEqual(result.first.finishDelta,{xp:10,coins:5},
  'First completion stage bonus incorrect: '+JSON.stringify(result));
 assert.deepEqual(result.second.finishDelta,{xp:0,coins:0},
  'Second completion repeated one-time bonus: '+JSON.stringify(result));
 assert.equal(result.afterRepeat.xp,result.second.xp,'Repeated finish awarded XP on second run');
 assert.equal(result.afterRepeat.coins,result.second.coins,'Repeated finish awarded coins on second run');
 return result;
}

async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let failures=0;
 try{
  for(const width of [320,390,768]){
   for(const [name,fn] of [['resume-complete',restoredCompletion],['exit-dialog',exitConfirmation],['first-pass-bonus',firstPassBonus]]){
    try{await runScenario(browser,width,name,fn)}
    catch(e){failures++;console.error('FAIL_STAGE24',JSON.stringify({width,name,error:String(e),stack:String(e.stack||'').slice(0,2100)}))}
   }
  }
 }finally{await browser.close()}
 console.log('STAGE24_SUMMARY',JSON.stringify({expected:9,failures}));
 if(failures)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
