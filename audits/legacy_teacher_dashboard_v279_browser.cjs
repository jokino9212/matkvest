'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function check(browser,base,width,missing=false){
 const ctx=await browser.newContext({viewport:{width,height:870},
  isMobile:width<600,hasTouch:width<600,serviceWorkers:missing?'block':'allow'});
 if(missing){
  await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await ctx.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof openTeacherDashboard==='function'&&
   typeof teacherDashboardModel==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  if(!missing){
   await page.waitForFunction(()=>typeof MatKvestVueActions?.teacherDashboardActions==='function');
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert(await page.evaluate(async()=>{
    const c=await caches.open('matkvest-iphone-v279');
    return (await caches.keys()).includes('matkvest-iphone-v279')&&
      (await c.keys()).some(x=>x.url.endsWith('assets/ui/legacy-vue-actions.js'));
   }));
   await ctx.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof teacherDashboardModel==='function'&&mk854HistoryReady===true);
  }else assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');
  const fixture=await page.evaluate(()=>{
   const before={name:currentProfile,id:state.profileId,xp:state.xp,coins:state.coins,
     attempts:state.attemptHistory?.length||0};
   const names=['v279 Аня','v279 Борис'];
   for(const [index,name] of names.entries()){
    profiles[name]=ensureProfileIdentity({...deepCopy(EMPTY_STATE),xp:350+index*150,coins:10+index});
   }
   persistSilently();
   teacherUnlocked=true;
   openTeacherDashboard();
   return {before,names,ids:names.map(x=>profiles[x].profileId)};
  });
  const dashboard=page.locator(missing?'#teacherDashboardVue:not([data-v-app])':'#teacherDashboardVue[data-v-app]');
  await dashboard.getByRole('heading',{name:'👨‍🏫 Панель преподавателя',exact:true}).waitFor();
  const search=dashboard.getByRole('searchbox',{name:'Найти ученика'});
  const sorting=dashboard.getByRole('combobox',{name:'Сортировать учеников'});
  const roster=dashboard.locator('.teacher-student-card');
  await search.fill('v279');
  await dashboard.getByRole('heading',{name:fixture.names[0],exact:true}).waitFor();
  assert.equal(await roster.count(),2);
  await sorting.selectOption('name');
  const names=await roster.locator('h3').allTextContents();
  assert.deepEqual(names,fixture.names);
  const filterLabel=await page.evaluate(()=>teacherDashboardFilters.find(x=>x.id==='all').label);
  await dashboard.getByRole('button',{name:filterLabel,exact:true}).press('Enter');
  assert.equal(await search.inputValue(),'v279','Filter must preserve search');
  // A stale fallback button must not close the mode or reopen an unrelated profile.
  await page.evaluate(()=>{
   const dash=document.querySelector('#teacherDashboardVue');
   window.__v279StaleClose=dash.querySelector('.home-back-btn');
   window.__v279StaleOpen=dash.querySelector('.teacher-student-card button');
   window.__v279StaleFilter=dash.querySelector('.teacher-filter');
   window.__v279OldSort=teacherListSort;
   window.__v279OldFilter=teacherListFilter;
   renderHome();
  });
  await page.waitForFunction(()=>!document.querySelector('#teacherDashboardVue'));
  const snapshot=await page.evaluate(()=>({teacher:teacherUnlocked,profile:currentProfile,
   id:state.profileId,xp:state.xp,coins:state.coins,sort:teacherListSort,filter:teacherListFilter,
   attempts:state.attemptHistory?.length||0}));
  await page.evaluate(()=>{
   for(const button of [window.__v279StaleClose,window.__v279StaleOpen,window.__v279StaleFilter]){
    button?.click();
   }
  });
  assert.deepEqual(await page.evaluate(()=>({teacher:teacherUnlocked,profile:currentProfile,
   id:state.profileId,xp:state.xp,coins:state.coins,sort:teacherListSort,filter:teacherListFilter,
   attempts:state.attemptHistory?.length||0})),snapshot,'Detached dashboard clicks must not execute');
  await page.evaluate(()=>openTeacherDashboard());
  await dashboard.getByRole('heading',{name:'👨‍🏫 Панель преподавателя',exact:true}).waitFor();
  await dashboard.locator('.teacher-student-card')
   .filter({has:page.getByRole('heading',{name:fixture.names[1],exact:true})})
   .getByRole('button',{name:'Открыть',exact:true}).press('Enter');
  const detail=page.locator(missing?'#teacherStudentVue:not([data-v-app])':'#teacherStudentVue[data-v-app]');
  await detail.getByRole('heading',{name:fixture.names[1],exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>teacherViewingProfileId),fixture.ids[1]);
  await detail.getByRole('button',{name:'← Все ученики',exact:true}).press('Enter');
  await dashboard.getByRole('heading',{name:'👨‍🏫 Панель преподавателя',exact:true}).waitFor();
  await dashboard.getByRole('button',{name:/Новый ученик/}).click();
  await page.locator('#modal .mk871-profiles-screen').waitFor();
  await page.keyboard.press('Escape');
  await page.locator('#overlay.show').waitFor({state:'hidden'});
  const afterProfilesEscape=await page.evaluate(()=>({
   teacherUnlocked,screen:mk854Route()?.screen,mainId:mainView.firstElementChild?.id,
   overlay:overlay.classList.contains("show"),
   dashboardButtons:[...document.querySelectorAll("#teacherDashboardVue button")].map(x=>x.textContent.trim()).filter(Boolean).slice(0,15)
  }));
  console.log("V279_AFTER_PROFILES_ESCAPE",JSON.stringify({width,missing,...afterProfilesEscape}));
  await dashboard.getByRole('button',{name:/Резервная копия/}).click();
  await page.locator('#modal .backup-box').first().waitFor();
  await page.keyboard.press('Escape');
  await page.locator('#overlay.show').waitFor({state:'hidden'});
  await dashboard.getByRole('button',{name:'← Главный экран',exact:true}).press('Enter');
  await page.waitForFunction(()=>teacherUnlocked===false);
  assert.deepEqual(await page.evaluate(()=>({name:currentProfile,id:state.profileId,
    xp:state.xp,coins:state.coins,attempts:state.attemptHistory?.length||0})),fixture.before,
    'Read-only dashboard should preserve profile, results and rewards');
  if(!missing){
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof teacherDashboardModel==='function'&&mk854HistoryReady===true);
   assert.deepEqual(await page.evaluate(()=>({name:currentProfile,id:state.profileId,
     xp:state.xp,coins:state.coins,attempts:state.attemptHistory?.length||0})),fixture.before);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS_V279_TEACHER_DASHBOARD_BROWSER',JSON.stringify({width,missing,offlineF5:!missing,
   search:true,sort:true,filter:true,openBack:true,profileModal:true,backup:true,
   staleGuards:true,rewardsStable:true}));
 }finally{await ctx.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 await check(browser,base,390);
 await check(browser,base,1280);
 await check(browser,base,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
