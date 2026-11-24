'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');

async function scenario(browser,base,width,missing=false){
 const context=await browser.newContext({viewport:{width,height:870},
  isMobile:width<600,hasTouch:width<600,serviceWorkers:missing?'block':'allow'});
 if(missing){
  await context.route('**/assets/ui/knowledge-map.js*',route=>route.abort());
  await context.route('**/assets/ui/legacy-vue-actions.js*',route=>route.abort());
 }
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof openProfiles==='function'&&typeof createProfile==='function'&&
    mk854HistoryReady===true,null,{timeout:30000});
  if(!missing){
   await page.waitForFunction(()=>typeof window.MatKvestVueActions?.profileDialogActions==='function');
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert(await page.evaluate(async()=>{
    const c=await caches.open('matkvest-iphone-v278');
    return (await caches.keys()).includes('matkvest-iphone-v278')&&
      (await c.keys()).some(x=>x.url.endsWith('/assets/ui/legacy-vue-actions.js'));
   }),'Profile actions must be cached offline');
   await context.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof openProfiles==='function'&&mk854HistoryReady===true);
  }else assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');

  const original=await page.evaluate(()=>{
   save();
   return {name:currentProfile,id:state.profileId,xp:state.xp,coins:state.coins,
     history:state.attemptHistory?.length||0};
  });
  const newName='V278 профиль '+width+(missing?' резерв':' Vue');
  const host=page.locator(missing?'#modal .vue-report:not([data-v-app])':'#modal .vue-report[data-v-app]');
  const open=async()=>{
   await page.evaluate(()=>openProfiles());
   await host.locator('.mk871-profiles-screen').waitFor();
  };
  await open();
  const input=missing?host.locator('#newProfileName'):host.getByRole('textbox',{name:'Имя ученика',exact:true});
  await input.fill(newName);
  await input.press('Enter');
  await page.waitForFunction(name=>currentProfile===name,newName);
  const created=await page.evaluate(name=>({
    id:state.profileId,xp:state.xp,coins:state.coins,
    history:state.attemptHistory?.length||0,
    count:Object.keys(profiles).filter(x=>x===name).length
  }),newName);
  assert.equal(created.count,1,'Enter must create exactly one profile');
  assert(created.id&&created.id!==original.id,'New profile must have unique ID');
  if(!missing){
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(name=>currentProfile===name,newName);
   assert.deepEqual(await page.evaluate(name=>({
     id:state.profileId,xp:state.xp,coins:state.coins,
     history:state.attemptHistory?.length||0,
     count:Object.keys(profiles).filter(x=>x===name).length
   }),newName),created,'Offline F5 must not duplicate profile, XP or rewards');
  }
  await open();
  await host.locator('.profile-row').filter({hasText:original.name})
    .getByRole('button',{name:'Выбрать',exact:true}).click();
  await page.waitForFunction(name=>currentProfile===name,original.name);
  const oldProfile=await page.evaluate(()=>({
    name:currentProfile,id:state.profileId,xp:state.xp,coins:state.coins,
    history:state.attemptHistory?.length||0
  }));
  assert.deepEqual(oldProfile,{name:original.name,id:original.id,xp:original.xp,
    coins:original.coins,history:original.history},'Switching back must restore original state exactly');
  await open();
  await page.evaluate(name=>{
   const row=[...document.querySelectorAll('#modal .profile-row')].find(x=>x.textContent.includes(name));
   window.__v278StaleSelect=row?.querySelector('button');
  },newName);
  await host.getByRole('button',{name:'Закрыть окно',exact:true}).press('Enter');
  assert.equal(await page.locator('#overlay').evaluate(el=>el.classList.contains('show')),false);
  await open();
  await page.evaluate(()=>window.__v278StaleSelect?.click());
  assert.equal(await page.evaluate(()=>currentProfile),original.name,
    'Detached select cannot change current profile');
  assert(await page.locator('#overlay').evaluate(el=>el.classList.contains('show')),
    'Detached select cannot close the new modal');
  await host.getByRole('button',{name:/Магазин/}).click();
  await page.waitForFunction(()=>document.querySelector('#overlay.show #modal')&&
    !document.querySelector('#modal .mk871-profiles-screen'),null,{timeout:10000});
  await page.evaluate(()=>openProfiles());
  await host.locator('.mk871-profiles-screen').waitFor();
  await host.getByRole('button',{name:/Моя коллекция/}).click();
  await page.waitForFunction(()=>document.querySelector('#overlay.show #modal')&&
    !document.querySelector('#modal .mk871-profiles-screen'),null,{timeout:10000});
  await page.evaluate(()=>openProfiles());
  await host.locator('.mk871-profiles-screen').waitFor();
  await host.locator('.profile-row').filter({hasText:newName})
    .getByRole('button',{name:'Выбрать',exact:true}).click();
  await page.waitForFunction(name=>currentProfile===name,newName);
  assert.deepEqual(await page.evaluate(name=>({
    id:state.profileId,xp:state.xp,coins:state.coins,
    history:state.attemptHistory?.length||0,
    count:Object.keys(profiles).filter(x=>x===name).length
  }),newName),created,'Selecting saved profile must not duplicate rewards');
  assert.deepEqual(errors,[]);
  console.log('PASS_V278_PROFILE_DIALOG_BROWSER',JSON.stringify({width,missing,offlineF5:!missing,
    enterCreate:true,select:true,staleSelectBlocked:true,
    shopCollection:true,profileId:true,rewardsUnchanged:true}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 for(const width of [390,1280])await scenario(browser,base,width);
 await scenario(browser,base,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
