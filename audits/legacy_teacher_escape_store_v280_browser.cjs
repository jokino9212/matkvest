'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function scenario(browser,address,width,missing=false){
 const context=await browser.newContext({viewport:{width,height:870},isMobile:width<600,hasTouch:width<600,
  serviceWorkers:missing?'block':'allow'});
 if(missing){
  await context.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
  await context.route('**/assets/ui/legacy-vue-actions.js?*',route=>route.abort());
 }
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(address,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof shopTabs==='function'&&
   typeof openTeacherDashboard==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  if(!missing){
   await page.waitForFunction(()=>typeof window.MatKvestVueActions?.storeTabActions==='function');
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert(await page.evaluate(async()=>{
    const cache=await caches.open('matkvest-iphone-v280');
    return (await caches.keys()).includes('matkvest-iphone-v280')&&
       (await cache.keys()).some(x=>x.url.endsWith('assets/ui/legacy-vue-actions.js'));
   }),'v280 adapter must be in offline cache');
   await context.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof openTeacherDashboard==='function'&&mk854HistoryReady===true);
  }else assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');
  const original=await page.evaluate(()=>({
    name:currentProfile,id:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0
  }));
  await page.evaluate(()=>{teacherUnlocked=true;openTeacherDashboard()});
  const dashboard=page.locator(missing?'#teacherDashboardVue:not([data-v-app])':'#teacherDashboardVue[data-v-app]');
  await dashboard.getByRole('heading',{name:/Панель преподавателя/}).waitFor();
  await dashboard.getByRole('button',{name:/Новый ученик/}).first().press('Enter');
  await page.locator('#overlay.show .mk871-profiles-screen').waitFor();
  assert.deepEqual(await page.evaluate(()=>mk854Route()),{screen:'home'},
    'Teacher profile modal must not insert a student profiles route into history');
  await page.keyboard.press('Escape');
  await page.locator('#overlay.show').waitFor({state:'hidden'});
  await dashboard.getByRole('heading',{name:/Панель преподавателя/}).waitFor();
  assert.equal(await page.evaluate(()=>teacherUnlocked),true);
  const focusAfter=await page.evaluate(()=>document.activeElement?.textContent?.trim()||'');
  assert.match(focusAfter,/Новый ученик|Создать ученика/,
    'Escape should restore focus to the teacher opener');
  await dashboard.getByRole('button',{name:/Резервная копия/}).first().press('Enter');
  await page.locator('#overlay.show .backup-box').first().waitFor();
  await page.keyboard.press('Escape');
  await page.locator('#overlay.show').waitFor({state:'hidden'});
  await dashboard.getByRole('heading',{name:/Панель преподавателя/}).waitFor();
  assert.equal(await page.evaluate(()=>teacherUnlocked),true);
  await dashboard.getByRole('button',{name:'← Главный экран',exact:true}).press('Enter');
  await page.waitForFunction(()=>!teacherUnlocked);
  // Regular student profiles route still participates in browser history.
  await page.evaluate(()=>openProfiles());
  await page.locator('#overlay.show .mk871-profiles-screen').waitFor();
  assert.equal(await page.evaluate(()=>mk854Route().screen),'profiles');
  await page.keyboard.press('Escape');
  await page.locator('#overlay.show').waitFor({state:'hidden'});
  await page.waitForFunction(()=>mk854Route().screen==='home');
  // Shop tabs must work without inline onclick/onchange, even without Vue.
  await page.evaluate(()=>openShop('avatars'));
  const tabs=page.locator('#modal .shop-tabs');
  await tabs.locator('button[data-store-category="frames"]').first().press('Enter');
  const frameDiagnostic=await page.evaluate(()=>({
   route:mk854Route(),overlay:overlay.className,hasTabHandler:modal.__mk280StoreTabsBound,
   shopTabCount:document.querySelectorAll('#modal .shop-tabs .shop-tab').length,
   tabActive:document.querySelector('#modal .shop-tabs')?.dataset.storeActive,
   requested:'frames',errors:[]
  }));
  console.log('V280_AFTER_FRAMES_CLICK',JSON.stringify({width,missing,...frameDiagnostic}));
  await page.locator('#modal .shop-tabs[data-store-active="frames"]').waitFor({timeout:5000});
  const nativeSelect=page.locator('#modal select.mk-ux91-category-select');
  await nativeSelect.selectOption('pets');
  await page.locator('#modal .shop-tabs[data-store-active="pets"]').waitFor();
  await page.evaluate(()=>{
    window.__v280OldTab=document.querySelector('#modal .shop-tabs button[data-store-category="avatars"]');
  });
  await tabs.locator('button[data-store-category="collection"]').first().press('Space');
  await page.locator('#modal .shop-tabs[data-store-active="collection"]').waitFor();
  const before=await page.evaluate(()=>({
    route:mk854Route(),name:currentProfile,id:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0
  }));
  await page.evaluate(()=>window.__v280OldTab?.click());
  assert.deepEqual(await page.evaluate(()=>({
    route:mk854Route(),name:currentProfile,id:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0
  })),before,'Detached old store tab must not reroute or award');
  await page.locator('#modal .shop-tabs button[data-store-category="avatars"]').first().click();
  await page.locator('#modal .shop-tabs[data-store-active="avatars"]').waitFor();
  if(!missing){
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>mk854HistoryReady===true);
   assert.equal(await page.evaluate(()=>mk854Route().category),'avatars');
  }
  assert.deepEqual(await page.evaluate(()=>({
    name:currentProfile,id:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0
  })),original,'Shop navigation and teacher modal must preserve rewards and attempt history');
  assert.deepEqual(errors,[]);
  console.log('PASS_V280_TEACHER_ESCAPE_STORE_TABS',JSON.stringify({
    width,missing,offlineF5:!missing,teacherEscapeReturn:true,focus:true,
    normalProfilesRoute:true,tabsEnterSpace:true,selectChange:true,staleTabInert:true,rewardsStable:true
  }));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,address)=>{
 await scenario(browser,address,390);
 await scenario(browser,address,1280);
 await scenario(browser,address,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
