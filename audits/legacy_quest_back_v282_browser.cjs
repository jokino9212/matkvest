'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function scenario(browser,base,width,missing=false){
 const context=await browser.newContext({viewport:{width,height:870},
   isMobile:width<600,hasTouch:width<600,serviceWorkers:missing?'block':'allow'});
 if(missing){
  await context.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await context.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof openQuests==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  if(!missing){
   await page.waitForFunction(()=>typeof MatKvestVueActions?.questBackActions==='function');
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert(await page.evaluate(async()=>{
    const keys=await caches.keys(),cache=await caches.open('matkvest-iphone-v282');
    return keys.includes('matkvest-iphone-v282')&&
      (await cache.keys()).some(x=>x.url.endsWith('assets/ui/legacy-vue-actions.js'));
   }),'Adapter must be available in v282 offline cache');
   await context.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof openQuests==='function'&&mk854HistoryReady===true);
  }else assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');
  const original=await page.evaluate(()=>({
   profile:state.profileId,xp:state.xp,coins:state.coins,
   attempts:state.attemptHistory?.length||0
  }));
  const back=()=>page.locator('#questBoardVue button').filter({hasText:/Главный экран/}).first();
  await page.evaluate(()=>openQuests());
  await page.locator('#questBoardVue .quest-screen').waitFor({state:'attached'});
  if(!missing)await page.locator('#questBoardVue[data-v-app]').waitFor({state:'attached'});
  assert.equal(await page.evaluate(()=>mk854Route().screen),'quests');
  await back().press('Enter');
  assert.deepEqual(await page.evaluate(()=>mk854Route()),{screen:'home'});
  assert.equal(await page.locator('#questBoardVue').count(),0,'Back must remove quest board');
  await page.evaluate(()=>openQuests());
  await page.locator('#questBoardVue .quest-screen').waitFor({state:'attached'});
  const stale=await page.evaluate(()=>{
   const host=document.getElementById('questBoardVue');
   const old=[...host.querySelectorAll('button')].find(x=>/Главный экран/.test(x.textContent));
   if(!old)throw Error('No back button');
   openGrade(5);
   const before=mk854Route().screen;
   const gradeBefore=!!document.querySelector('#grade5Vue');
   old.click();
   return {detached:!old.isConnected,before,after:mk854Route().screen,
     gradeBefore,gradeAfter:!!document.querySelector('#grade5Vue')};
  });
  assert.equal(stale.detached,true);
  assert.equal(stale.gradeBefore,true);
  assert.equal(stale.gradeAfter,true,'Stale back cannot replace current grade');
  assert.equal(stale.after,stale.before);
  await page.evaluate(()=>openQuests());
  await page.locator('#questBoardVue .quest-screen').waitFor({state:'attached'});
  await back().press('Space');
  assert.equal(await page.evaluate(()=>mk854Route().screen),'home');
  if(!missing){
   await page.evaluate(()=>openQuests());
   await page.locator('#questBoardVue .quest-screen').waitFor({state:'attached'});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>mk854HistoryReady===true);
   await page.locator('#questBoardVue .quest-screen').waitFor({state:'attached'});
   assert.equal(await page.evaluate(()=>mk854Route().screen),'quests');
   await back().press('Enter');
   assert.equal(await page.evaluate(()=>mk854Route().screen),'home');
  }
  assert.deepEqual(await page.evaluate(()=>({
   profile:state.profileId,xp:state.xp,coins:state.coins,
   attempts:state.attemptHistory?.length||0
  })),original,'Quest back/rehydration cannot award or modify attempts');
  assert.deepEqual(errors,[]);
  console.log('PASS_V282_QUEST_BACK_BROWSER',JSON.stringify({width,missing,offlineF5:!missing,
    vueAndFallback:true,staleInert:true,enterSpace:true,homeRoute:true,rewardsStable:true}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 await scenario(browser,base,390);
 await scenario(browser,base,1280);
 await scenario(browser,base,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
