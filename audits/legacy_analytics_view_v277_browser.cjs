'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function scenario(browser,address,width,missing=false){
 const context=await browser.newContext({viewport:{width,height:870},
  isMobile:width<600,hasTouch:width<600,serviceWorkers:missing?'block':'allow'});
 if(missing){
  await context.route('**/assets/ui/knowledge-map.js*',route=>route.abort());
  await context.route('**/assets/ui/legacy-vue-actions.js*',route=>route.abort());
 }
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(address,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof renderAnalyticsView==='function'&&
    typeof openKnowledgeMap==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  if(!missing){
   await page.waitForFunction(()=>typeof window.MatKvestVueActions?.analyticsViewActions==='function');
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert(await page.evaluate(async()=>{
    const cache=await caches.open('matkvest-iphone-v277');
    return (await caches.keys()).includes('matkvest-iphone-v277')&&
      (await cache.keys()).some(x=>x.url.endsWith('assets/ui/legacy-vue-actions.js'));
   }),'Offline PWA must cache v277 action module');
   await context.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof window.MatKvestVueActions?.analyticsViewActions==='function');
   await page.evaluate(()=>{
    window.__v277Actions=[];
    const original=window.MatKvestVueActions.analyticsViewActions;
    window.MatKvestVueActions.analyticsViewActions=opts=>{
      const bound=original(opts);
      window.__v277Actions.push({valid:opts.isCurrent,actions:bound});
      return bound;
    };
    openGrade(5);
   });
   const grade=page.locator('#grade5Vue[data-v-app]');
   await grade.getByRole('heading',{name:'Математика 5 класса',exact:true}).waitFor();
   await grade.getByRole('button',{name:/Главный экран/}).first().press('Enter');
   await page.locator('#homeDashboard[data-v-app]').waitFor();
   const snapshot=()=>page.evaluate(()=>({
     route:mk854Route(),xp:state.xp,coins:state.coins,attempts:state.attemptHistory?.length||0,
     grade:currentGrade
   }));
   const before=await snapshot();
   await page.evaluate(()=>{
     const stale=window.__v277Actions[0];
     window.__v277OldWasCurrent=stale.valid();
     stale.actions.open('natural');
     stale.actions.back();
     stale.actions.progress();
   });
   assert.equal(await page.evaluate(()=>window.__v277OldWasCurrent),false);
   assert.deepEqual(await snapshot(),before,'Stale grade callbacks cannot change navigation');
   await page.evaluate(()=>openKnowledgeMap());
   const map=page.locator('#knowledgeMapVue[data-v-app]');
   await map.getByRole('searchbox',{name:'Найти тему'}).waitFor();
   await map.getByRole('searchbox',{name:'Найти тему'}).fill('дроби');
   await map.waitFor();
   const mapCount=await page.evaluate(()=>window.__v277Actions.length);
   assert(mapCount>=2);
   await page.evaluate(()=>openKnowledgeTopicDetail('g4:moro_missing_sub'));
   const detail=page.locator('#knowledgeTopicDetailVue[data-v-app]');
   await detail.getByRole('heading',{name:/Неизвестное уменьшаемое/}).waitFor();
   await detail.getByRole('button',{name:/К карте знаний/}).press('Enter');
   await map.getByRole('searchbox',{name:'Найти тему'}).waitFor();
   await page.evaluate(()=>renderHome());
   await page.locator('#homeDashboard[data-v-app]').waitFor();
   const after=await snapshot();
   await page.evaluate(()=>{
     for(const entry of window.__v277Actions){
       if(entry.valid())continue;
       entry.actions.search?.('НЕ ДОПУСКАТЬ');
       entry.actions.grade?.(8);
       entry.actions.train?.('g4:moro_missing_sub');
       entry.actions.errors?.('g4:moro_missing_sub');
       entry.actions.open?.('g5:natural');
       entry.actions.back?.();
     }
   });
   assert.deepEqual(await snapshot(),after,
     'Stale knowledge-map/detail actions cannot navigate or award');
  }else{
   assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');
   await page.evaluate(()=>openGrade(5));
   const host=page.locator('#grade5Vue:not([data-v-app])');
   await host.getByRole('alert').getByText('Не удалось открыть 5 класс.').waitFor();
   await page.evaluate(()=>{
     window.__v277OldBack=document.querySelector('#grade5Vue .home-back-btn');
     window.__v277OldRetry=document.querySelector('#grade5Vue .knowledge-empty button');
   });
   await host.locator('.home-back-btn').press('Space');
   await page.locator('.home-hero').first().waitFor();
   const before=await page.evaluate(()=>({route:mk854Route(),xp:state.xp,coins:state.coins}));
   await page.evaluate(()=>{
     window.__v277OldBack.click();
     window.__v277OldRetry.click();
   });
   assert.deepEqual(await page.evaluate(()=>({route:mk854Route(),xp:state.xp,coins:state.coins})),before,
    'Detached HTML back/retry must not dispatch');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS_V277_ANALYTICS_BROWSER',JSON.stringify({width,missing,offlineF5:!missing,
   gradeBack:true,mapDetailBack:!missing,staleCallbacks:true,fallback:missing,
   stableRewards:true}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,address)=>{
 for(const width of [390,1280])await scenario(browser,address,width);
 await scenario(browser,address,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
