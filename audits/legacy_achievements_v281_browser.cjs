'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');

async function verify(browser,base,width,missing=false){
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
  await page.waitForFunction(()=>typeof openShop==='function'&&
   typeof achievementCatalogModel==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  if(!missing){
   await page.waitForFunction(()=>typeof MatKvestVueActions?.achievementFilterActions==='function');
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert(await page.evaluate(async()=>{
    const c=await caches.open('matkvest-iphone-v281');
    return (await caches.keys()).includes('matkvest-iphone-v281')&&
       (await c.keys()).some(x=>x.url.endsWith('assets/ui/legacy-vue-actions.js'));
   }));
   await context.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof openShop==='function'&&mk854HistoryReady===true);
  }else assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');

  const fixture=await page.evaluate(({width,missing})=>{
   const original=currentProfile,name='v281 Достижения '+width+(missing?' HTML':' Vue');
   profiles[original]={...state};
   currentProfile=name;
   state=ensureProfileIdentity({...deepCopy(EMPTY_STATE),solved:10});
   achievementViewFilter='all';
   achievementCategoryFilter='all';
   achievementSortMode='category';
   const before=state.coins;
   persistSilently();
   openShop('achievements');
   const a=ACHIEVEMENTS.find(item=>item.id==='solved10');
   return {original,name,id:state.profileId,before,expected:before+a.reward.coins};
  },{width,missing});

  const screen=page.locator(missing?
    '#modal .achievement-screen:not([data-v-app])':
    '#modal .achievement-screen[data-v-app]');
  await screen.getByRole('button',{name:'Открытые',exact:true}).waitFor();
  const receipt=await page.evaluate(()=>({
   name:currentProfile,id:state.profileId,xp:state.xp,coins:state.coins,
   attempts:state.attemptHistory?.length||0,unlock:achievementUnlockView(state).solved10
  }));
  assert.equal(receipt.id,fixture.id);
  assert.equal(receipt.coins,fixture.expected);
  assert(receipt.unlock.rewardGranted);
  await screen.getByRole('button',{name:'Открытые',exact:true}).press('Enter');
  assert.equal(await page.evaluate(()=>achievementViewFilter),'open');
  assert(await screen.getByRole('button',{name:'Открытые',exact:true})
    .evaluate(x=>x===document.activeElement));
  await screen.getByRole('button',{name:'Не открытые',exact:true}).click();
  assert.equal(await page.evaluate(()=>achievementViewFilter),'locked');
  await screen.getByRole('combobox',{name:'Категория достижений'})
    .selectOption('general');
  await screen.getByRole('combobox',{name:'Сортировка достижений'})
    .selectOption('nearest');
  assert.deepEqual(await page.evaluate(()=>[achievementViewFilter,
   achievementCategoryFilter,achievementSortMode]),['locked','general','nearest']);
  await screen.getByRole('button',{name:'Все',exact:true}).press('Space');
  assert.equal(await page.evaluate(()=>achievementViewFilter),'all');
  const prior=await page.evaluate(()=>{
   const old=[...document.querySelectorAll('#modal .achievement-screen .achievement-filter')]
     .find(x=>x.textContent.trim()==='Открытые');
   if(!old)throw Error('Stale achievements test button missing');
   const view=achievementViewFilter;
   openShop('avatars');
   const before=!!modal.querySelector('.shop-grid');
   old.click();
   return {before,view,after:achievementViewFilter,
    shopStillVisible:!!modal.querySelector('.shop-grid'),
    achievementReopened:!!modal.querySelector('.achievement-screen'),
    staleConnected:old.isConnected};
  });
  assert.equal(prior.before,true);
  assert.equal(prior.staleConnected,false);
  assert.equal(prior.after,prior.view,'Detached filter must not mutate global state');
  assert.equal(prior.shopStillVisible,true,'Detached filter cannot navigate away from store');
  assert.equal(prior.achievementReopened,false);
  await page.evaluate(()=>openShop('achievements'));
  await screen.getByRole('button',{name:'Все',exact:true}).waitFor();
  assert.deepEqual(await page.evaluate(()=>({
   name:currentProfile,id:state.profileId,xp:state.xp,coins:state.coins,
   attempts:state.attemptHistory?.length||0,unlock:achievementUnlockView(state).solved10
  })),receipt,'Filter actions cannot reaward achievements');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!overlay.classList.contains('show'));
  if(!missing){
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof openShop==='function'&&mk854HistoryReady===true);
   await page.evaluate(()=>openShop('achievements'));
   await screen.getByRole('button',{name:'Открытые',exact:true}).waitFor();
   assert.deepEqual(await page.evaluate(()=>({
    name:currentProfile,id:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0,unlock:achievementUnlockView(state).solved10
   })),receipt,'Offline F5 cannot duplicate XP, coins or achievement rewards');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS_V281_ACHIEVEMENT_BROWSER',JSON.stringify({width,missing,
   offlineF5:!missing,keyboard:true,filters:true,detachedVueAndHtmlGuard:true,
   rewardsStable:true,profileStable:true}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 await verify(browser,base,390);
 await verify(browser,base,1280);
 await verify(browser,base,390,true);
}).catch(err=>{console.error(err);process.exitCode=1});
