'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');

async function verify(browser,url,width,missing=false){
 const ctx=await browser.newContext({viewport:{width,height:870},isMobile:width<600,
  hasTouch:width<600,serviceWorkers:missing?'block':'allow'});
 if(missing){
  await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await ctx.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof openLeaderboard==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  if(!missing){
   await page.waitForFunction(()=>typeof MatKvestVueActions?.leaderboardDialogActions==='function');
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert(await page.evaluate(async()=>{
    const cache=await caches.open('matkvest-iphone-v283');
    return (await caches.keys()).includes('matkvest-iphone-v283')&&
      (await cache.keys()).some(x=>x.url.endsWith('assets/ui/legacy-vue-actions.js'));
   }),'v283 action adapter missing in offline PWA cache');
   await ctx.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof openLeaderboard==='function'&&mk854HistoryReady===true);
  }else assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');

  const snapshot=()=>page.evaluate(()=>({
   profile:state.profileId,xp:state.xp,coins:state.coins,
   attempts:state.attemptHistory?.length||0
  }));
  const initial=await snapshot();
  const dialog=page.locator('#modal .vue-report');
  const help=dialog.locator('button[aria-label*="Справка"]').first();
  const close=dialog.locator('button.x').first();
  await page.evaluate(()=>openLeaderboard());
  await dialog.waitFor({state:'attached'});
  if(!missing)await page.locator('#modal .vue-report[data-v-app]').waitFor();
  await dialog.locator('.leader-table').waitFor({state:'attached'});
  const inlineCount=await page.evaluate(()=>[...document.querySelectorAll('#modal .vue-report button')].filter(x=>x.hasAttribute('onclick')).length);
  assert.equal(inlineCount,0,'Leaderboard fallback must not have inline handlers');
  await help.press('Enter');
  await page.locator('#mk872-help-layer [role="dialog"]').waitFor();
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#mk872-help-layer'));
  assert.equal(await help.evaluate(x=>document.activeElement===x),true,'Help focus must be restored');
  await help.press('Space');
  await page.locator('#mk872-help-layer [role="dialog"]').waitFor();
  await page.locator('#mk872-help-layer button.mk872-help-close').first().press('Enter');
  await page.waitForFunction(()=>!document.querySelector('#mk872-help-layer'));
  assert.equal(await help.evaluate(x=>document.activeElement===x),true);
  await close.press('Enter');
  await page.waitForFunction(()=>!overlay.classList.contains('show'));
  await page.evaluate(()=>openLeaderboard());
  await dialog.waitFor({state:'attached'});
  if(!missing)await page.locator('#modal .vue-report[data-v-app]').waitFor();
  const stale=await page.evaluate(()=>{
   const host=modal.querySelector('.vue-report');
   const oldHelp=host.querySelector('button[aria-label*="Справка"]');
   const oldClose=host.querySelector('button.x');
   if(!oldClose||!oldHelp)throw Error('Leaderboard actions missing');
   openShop('avatars');
   const before={shop:!!modal.querySelector('.shop-tabs'),
    help:!!document.querySelector('#mk872-help-layer'),
    id:state.profileId,xp:state.xp,coins:state.coins,attempts:state.attemptHistory?.length||0,
    route:JSON.stringify(mk854Route())};
   oldHelp.click();oldClose.click();
   const after={shop:!!modal.querySelector('.shop-tabs'),
    help:!!document.querySelector('#mk872-help-layer'),
    id:state.profileId,xp:state.xp,coins:state.coins,attempts:state.attemptHistory?.length||0,
    route:JSON.stringify(mk854Route())};
   return {detached:!oldHelp.isConnected&&!oldClose.isConnected,before,after};
  });
  assert(stale.detached);
  assert(stale.before.shop);
  assert.deepEqual(stale.after,stale.before,'Detached help/close cannot alter current shop');
  assert.deepEqual(await snapshot(),initial,'Leaderboard gestures cannot alter XP, coins, profile or attempts');
  if(!missing){
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>mk854HistoryReady===true&&typeof openLeaderboard==='function');
   await page.evaluate(()=>openLeaderboard());
   await dialog.locator('.leader-table').waitFor();
   await help.press('Enter');
   await page.locator('#mk872-help-layer [role="dialog"]').waitFor();
   await page.keyboard.press('Escape');
   assert.deepEqual(await snapshot(),initial,'Offline F5 cannot reaward leaderboard progress');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS_V283_LEADERBOARD_BROWSER',JSON.stringify({width,missing,
    offlineF5:!missing,vueAndHtmlFallback:true,noInline:true,keyboard:true,focus:true,
    staleInert:true,rewardsStable:true}));
 }finally{await ctx.close()}
}
withMatkvestBrowser(async(browser,url)=>{
 await verify(browser,url,390);
 await verify(browser,url,1280);
 await verify(browser,url,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
