'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function open(page,context,base,missing){
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof startColumnStage==='function'&&typeof mk854Route==='function'&&mk854HistoryReady===true,null,{timeout:30000});
 if(missing){
  assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');
  return;
 }
 assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions?.schoolColumnActions),'function');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:30000});
 const cache=await page.evaluate(async()=>{
   const c=await caches.open('matkvest-iphone-v274');
   return {ready:(await caches.keys()).includes('matkvest-iphone-v274'),
     adapter:(await c.keys()).some(x=>x.url.endsWith('/assets/ui/legacy-vue-actions.js'))};
 });
 assert(cache.ready&&cache.adapter);
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof startColumnStage==='function'&&mk854HistoryReady===true);
 assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions?.schoolColumnActions),'function');
}
async function continueAttempt(page){
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.mk872-training-dialog[data-v-app]').getByRole('alertdialog',{name:/незавершённая тренировка/})
  .getByRole('button',{name:'Продолжить',exact:true}).click();
}
async function scenario(browser,base,width,missing=false){
 const context=await browser.newContext({viewport:{width,height:800},
  isMobile:width<600,hasTouch:width<600,serviceWorkers:missing?'block':'allow'});
 if(missing){
  await context.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
  await context.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
 }
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await open(page,context,base,missing);
  for(const operation of ['add','sub','mul','div']){
   await page.evaluate(op=>{openGrade(4);startColumnStage(op,op==='sub'?1:0)},operation);
   const host=page.locator(missing?'#stage:not([data-v-app])':'#stage[data-v-app]');
   const required=host.locator('input[data-exp]:not(.mark-in)');
   const primary=host.locator('#columnPrimary');
   await required.first().waitFor();
   const read=()=>page.evaluate(()=>{
    const i=blockSession.currentItem??blockSession.items.at(-1);
    return {id:blockSession.attemptId,item:i.itemId,done:blockSession.done,
      checks:i.checks.map(c=>c.correct),xp:state.xp,coins:state.coins,
      reward:blockSession.lastAnswerReward??null};
   });
   const before=await read();
   await required.first().press('Enter');
   await host.locator('#fb').getByText(/Заполни обязательные клетки/).waitFor();
   assert.deepEqual(await read(),before,'Blank Enter must not score');
   const final=host.locator(operation==='div'?'input[data-row="quot"]':'input[data-row="final"]');
   if(await final.count()>1){
    const left=operation==='div';
    await final.nth(left?0:1).press(left?'ArrowRight':'ArrowLeft');
    assert(await final.nth(left?1:0).evaluate(el=>el===document.activeElement));
   }
   if(operation==='sub'){
    const dot=host.locator('input.dot-in[data-exp="•"]').first();
    if(await dot.count()){
      await dot.click();assert.equal(await dot.inputValue(),'•');
      await dot.click();assert.equal(await dot.inputValue(),'');
      await dot.fill('.');assert.equal(await dot.inputValue(),'•');
    }
   }
   const expected=await required.evaluateAll(list=>list.map(x=>x.dataset.exp));
   for(const [i,value] of expected.entries())await required.nth(i).fill(value);
   const values=await host.locator('input').evaluateAll(list=>list.map(el=>el.value));
   if(operation==='mul')await primary.press('Space');
   else await required.last().press('Enter');
   await host.locator('#fb').getByText(/✅ Отлично!/).waitFor();
   assert(await host.locator('#columnSkip').isHidden());
   assert(await primary.evaluate(x=>x===document.activeElement));
   const scored=await read();
   assert.deepEqual(scored.checks,[true]);
   assert(scored.xp>=before.xp&&scored.coins>=before.coins);
   if(!missing){
    await continueAttempt(page);
    await host.locator('#fb').getByText(/✅ Отлично!/).waitFor();
    assert.deepEqual(await read(),scored,'F5 duplicate reward/attempt');
    assert.deepEqual(await host.locator('input').evaluateAll(list=>list.map(el=>el.value)),values);
   }
   await primary.press('Enter');
   await required.first().waitFor();
   const after=await read();
   assert.equal(after.done,1);
   assert.notEqual(after.item,scored.item);
   assert.equal(after.xp,scored.xp);
   assert.equal(after.coins,scored.coins);
   await page.keyboard.press('Escape');
   const dialog=page.locator('.mk872-training-dialog'+(missing?':not([data-v-app])':'[data-v-app]'));
   const exit=dialog.getByRole('button',{name:'Выйти и удалить попытку',exact:true});
   if(await exit.count())await exit.click();
   else await page.evaluate(()=>{if(blockSession)cancelBlock();closeModal()});
  }
  if(missing){
   await page.evaluate(()=>{openGrade(4);startColumnStage('add',0)});
   const stale=await page.evaluate(()=>{
      const host=document.getElementById('stage');
      const field=host.querySelector('input[data-row][data-col]');
      if(!host||!host.oninput||!host.onkeydown)throw Error('Expected legacy column fallback event handlers');
      host.remove();
      field.value='x7';
      host.oninput({target:field});
      const afterInput=field.value;
      host.onkeydown({target:field,key:'ArrowRight',repeat:false,preventDefault(){}});
      return {afterInput,value:field.value,connected:host.isConnected};
   });
   assert.deepEqual(stale,{afterInput:'x7',value:'x7',connected:false},
    'Detached fallback must never sanitize input or navigate cells');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS_V274_COLUMN_BROWSER',JSON.stringify({width,missing,offlineF5:!missing,
    add:true,sub:true,mul:true,div:true,staleFallbackGuard:missing}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 for(const width of [390,1280])await scenario(browser,base,width);
 await scenario(browser,base,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
