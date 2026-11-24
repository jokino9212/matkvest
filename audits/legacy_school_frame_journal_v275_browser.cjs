'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');

async function boot(page,context,base,missing){
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof startQuizStage==='function'&&typeof openAttemptJournal==='function'&&mk854HistoryReady===true,
   null,{timeout:30000});
 if(missing){
  assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');
  return;
 }
 assert.deepEqual(await page.evaluate(()=>({
   frame:typeof window.MatKvestVueActions?.schoolAttemptFrameActions,
   journal:typeof window.MatKvestVueActions?.attemptJournalActions,
   review:typeof window.MatKvestVueActions?.attemptReviewActions
 })),{frame:'function',journal:'function',review:'function'});
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:30000});
 const cache=await page.evaluate(async()=>{
  const c=await caches.open('matkvest-iphone-v275');
  return {valid:(await caches.keys()).includes('matkvest-iphone-v275'),
   actions:(await c.keys()).some(x=>x.url.endsWith('/assets/ui/legacy-vue-actions.js'))};
 });
 assert(cache.valid&&cache.actions,'V275 action script must be PWA-cached');
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof openAttemptJournal==='function'&&mk854HistoryReady===true);
}
async function resume(page){
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.mk872-training-dialog').getByRole('alertdialog',{name:/незавершённая тренировка/})
  .getByRole('button',{name:'Продолжить',exact:true}).click();
}
async function scenario(browser,base,width,missing=false){
 const context=await browser.newContext({viewport:{width,height:870},
  isMobile:width<600,hasTouch:width<600,serviceWorkers:missing?'block':'allow'});
 if(missing)await context.route('**/assets/ui/knowledge-map.js*',route=>route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await boot(page,context,base,missing);
  await page.evaluate(()=>{openGrade(4);startQuizStage('moro_missing_sub',0)});
  const frame=page.locator(missing?'#schoolAttemptFrame:not([data-v-app])':'#schoolAttemptFrame[data-v-app]');
  const field=page.locator('#quizInput');
  await frame.getByRole('heading',{name:/Неизвестное уменьшаемое/}).waitFor();
  await field.waitFor();
  const snapshot=()=>page.evaluate(()=>({
    id:blockSession?.attemptId??null,item:blockSession?.currentItem?.itemId??null,
    xp:state.xp,coins:state.coins,history:state.attemptHistory?.length||0
  }));
  await field.fill('41');
  const before=await snapshot();
  await frame.getByRole('button',{name:'Закрыть окно',exact:true}).click();
  await page.getByRole('button',{name:'Остаться в тренировке',exact:true}).click();
  assert.deepEqual(await snapshot(),before,'Cancel close must preserve attempt');
  assert.equal(await field.inputValue(),'41');
  if(!missing){
   await resume(page);
   await frame.getByRole('heading',{name:/Неизвестное уменьшаемое/}).waitFor();
   assert.equal(await field.inputValue(),'41','Offline F5 must restore exact draft');
   assert.deepEqual(await snapshot(),before,'Offline reload must not award');
  }
  await page.evaluate(()=>{
    window.__v275DetachedClose=document.querySelector('#schoolAttemptFrame .mtop .x');
  });
  await frame.getByRole('button',{name:'Закрыть окно',exact:true}).press('Enter');
  await page.getByRole('button',{name:'Выйти и удалить попытку',exact:true}).click();
  const exited=await snapshot();
  await page.evaluate(()=>window.__v275DetachedClose?.click());
  assert.deepEqual(await snapshot(),exited,'Detached frame close must not change state');
  assert.equal(await page.evaluate(()=>document.querySelector('#overlay')?.classList.contains('show')),false,
    'Detached close must never reopen or close another overlay');
  await page.evaluate(()=>{
   const now=Date.now();
   const fixture={id:'v275-stable-record',key:'g4:table',topicId:'table',grade:4,
     title:'V275 контрольный отчёт',kind:'table',stageIndex:0,status:'finished',
     startedAt:now-60000,endedAt:now,total:1,done:1,correct:1,stars:3,
     items:[{itemId:'v275-record-item',kind:'table',grade:4,topicId:'table',
       label:'Задание',prompt:'2 × 2 = ?',studentAnswer:'4',correctAnswer:'4',
       firstTry:true,finalCorrect:true,skipped:false,checks:[{answer:'4',correct:true}],
       startedAt:now-60000,endedAt:now-59000}]};
   state.attemptHistory.unshift(fixture);
   save();
   window.__v275Stats={xp:state.xp,coins:state.coins,history:state.attemptHistory.length};
   openAttemptJournal(state,'Проверка v275',()=>{closeModal();renderHome()});
  });
  const host=page.locator(missing?'#modal .vue-report:not([data-v-app])':'#modal .vue-report[data-v-app]');
  const journal=host.getByRole('heading',{name:'📋 Журнал попыток — Проверка v275',exact:true});
  await journal.waitFor();
  await host.getByRole('button',{name:/V275 контрольный отчёт/}).click();
  await host.getByRole('heading',{name:'📋 Разбор: V275 контрольный отчёт',exact:true}).waitFor();
  await host.getByText('2 × 2 = ?', {exact:false}).first().waitFor();
  await host.getByRole('button',{name:'← К журналу',exact:true}).press('Enter');
  await journal.waitFor();
  assert.deepEqual(await page.evaluate(()=>({xp:state.xp,coins:state.coins,history:state.attemptHistory.length})),
    await page.evaluate(()=>window.__v275Stats),'Review navigation must be read-only');
  await host.getByRole('button',{name:/← К ученику|← Назад/}).click();
  assert.equal(await page.evaluate(()=>document.querySelector('#overlay')?.classList.contains('show')),false);
  if(!missing){
   const expected=await page.evaluate(()=>({xp:state.xp,coins:state.coins,
      records:state.attemptHistory.filter(x=>x.id==='v275-stable-record').length}));
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof openAttemptJournal==='function'&&mk854HistoryReady===true);
   await page.evaluate(()=>openAttemptJournal(state,'Проверка v275'));
   await journal.waitFor();
   await host.getByRole('button',{name:/V275 контрольный отчёт/}).waitFor();
   assert.deepEqual(await page.evaluate(()=>({xp:state.xp,coins:state.coins,
      records:state.attemptHistory.filter(x=>x.id==='v275-stable-record').length})),
    expected,'Offline F5 should persist one report and exact rewards');
   await host.getByRole('button',{name:'Закрыть окно',exact:true}).click();
   assert.equal(await page.evaluate(()=>document.querySelector('#overlay')?.classList.contains('show')),false);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS_V275_FRAME_JOURNAL_BROWSER',JSON.stringify({width,missing,offlineF5:!missing,
   closeConfirm:true,staleClose:true,journalReviewBack:true,savedReports:true,noRewardDuplicates:true}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 for(const width of [390,1280])await scenario(browser,base,width);
 await scenario(browser,base,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
