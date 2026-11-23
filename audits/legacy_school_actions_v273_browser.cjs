'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');

async function boot(page,context,missing){
  await page.goto(page.__base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof mk854Route==='function'&&mk854HistoryReady===true,
    null,{timeout:30000});
  if(missing){
    assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');
    return;
  }
  assert.deepEqual(await page.evaluate(()=>({
    table:typeof window.MatKvestVueActions?.schoolTableActions,
    quiz:typeof window.MatKvestVueActions?.schoolQuizActions
  })),{table:'function',quiz:'function'});
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{timeout:30000});
  const cache=await page.evaluate(async()=>{
    const c=await caches.open('matkvest-iphone-v273');
    return {names:await caches.keys(),actions:(await c.keys()).some(k=>k.url.endsWith('/assets/ui/legacy-vue-actions.js'))};
  });
  assert(cache.names.includes('matkvest-iphone-v273')&&cache.actions,'v273 adapter must be verified offline');
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof mk854Route==='function'&&mk854HistoryReady===true);
  assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions?.schoolQuizActions),'function');
}
async function resume(page){
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.mk872-training-dialog[data-v-app]').getByRole('alertdialog',{name:/незавершённая тренировка/})
  .getByRole('button',{name:'Продолжить',exact:true}).click();
}
async function scenario(browser,base,width,kind,missing=false){
 const context=await browser.newContext({
   viewport:{width,height:850},isMobile:width<500,hasTouch:width<500,
   serviceWorkers:missing?'block':'allow'
 });
 if(missing)await context.route('**/assets/ui/legacy-vue-actions.js*',route=>route.abort());
 const page=await context.newPage(),errors=[];
 page.__base=base;
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await boot(page,context,missing);
  if(kind==='table'){
   await page.evaluate(()=>{openGrade(4);startTableStage(0)});
   const host=page.locator('#tstage[data-v-app]'),field=host.getByRole('textbox',{name:'Ответ'});
   const primary=host.locator('#tablePrimary');
   await field.waitFor();
   const read=()=>page.evaluate(()=>{
     const item=blockSession.currentItem??blockSession.items.at(-1);
     return {id:blockSession.attemptId,item:item.itemId,checks:item.checks.map(x=>x.correct),
       done:blockSession.done,xp:state.xp,coins:state.coins,answer:ta*tb,
       rewards:blockSession.lastAnswerReward??null};
   });
   const before=await read();
   await field.press('Enter');
   await host.getByText(/Сначала введи ответ/).waitFor();
   assert.deepEqual(await read(),before,'Blank Enter cannot affect attempt');
   await field.fill(String(before.answer));
   await field.press('Enter');
   await host.getByText(/✅ Верно!/).waitFor();
   const scored=await read();
   assert.deepEqual(scored.checks,[true]);
   assert(scored.xp>before.xp&&scored.coins>before.coins,'Expected one successful table reward');
   if(!missing){
    await resume(page);
    await host.getByText(/✅ Верно!/).waitFor();
    assert.deepEqual(await read(),scored,'F5 must not add rewards or duplicate checks');
   }
   await primary.press('Space');
   await field.waitFor();
   const advanced=await read();
   assert.equal(advanced.done,1);
   assert.notEqual(advanced.item,scored.item,'Next must advance exactly one item');
   assert.equal(advanced.xp,scored.xp);
   assert.equal(advanced.coins,scored.coins);
  }else{
   await page.evaluate(()=>{openGrade(4);startQuizStage('numbers',0)});
   const host=page.locator('#qstage[data-v-app]'),options=host.locator('.answers > button');
   await options.first().waitFor();
   const read=()=>page.evaluate(()=>{
     const item=blockSession.currentItem??blockSession.items.at(-1);
     return {id:blockSession.attemptId,item:item.itemId,checks:item.checks.map(x=>x.correct),
       done:blockSession.done,xp:state.xp,coins:state.coins,
       selected:q.choices.findIndex(c=>String(c.key)===String(q.ans)),
       wrong:q.choices.findIndex(c=>String(c.key)!==String(q.ans))};
   });
   const before=await read();
   assert(before.selected>=0&&before.wrong>=0);
   await options.nth(before.wrong).press('Enter');
   await host.getByText(/Пока неверно/).waitFor();
   const attempted=await read();
   assert.deepEqual(attempted.checks,[false]);
   if(!missing){
    await resume(page);
    await options.first().waitFor();
    assert.deepEqual(await read(),attempted,'Incorrect answer F5 lost state');
   }
   await options.nth(before.selected).press('Space');
   const next=host.locator('#quizNext');
   await next.waitFor({state:'visible'});
   const scored=await read();
   assert.deepEqual(scored.checks,[false,true]);
   assert.equal(scored.done,1);
   if(!missing){
    await resume(page);
    await next.waitFor({state:'visible'});
    assert.deepEqual(await read(),scored,'Answer correction after F5 credited twice');
   }
   await next.press('Enter');
   await options.first().waitFor();
   const advanced=await read();
   assert.notEqual(advanced.item,scored.item);
   assert.equal(advanced.done,1);
   assert.equal(advanced.xp,scored.xp);
   assert.equal(advanced.coins,scored.coins);
  }
  assert.deepEqual(errors,[],'No JS exceptions');
  console.log('PASS_V273_SCHOOL_BROWSER',JSON.stringify({width,kind,fallback:missing,offlineF5:!missing,
    keyboard:true,progress:true,duplicateRewards:false}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 for(const width of [390,1280]){
  await scenario(browser,base,width,'table');
  await scenario(browser,base,width,'quiz');
 }
 await scenario(browser,base,390,'table',true);
 await scenario(browser,base,390,'quiz',true);
}).catch(error=>{console.error(error);process.exitCode=1});
