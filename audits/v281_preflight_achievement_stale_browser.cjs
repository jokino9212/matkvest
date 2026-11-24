'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');

async function inspect(browser,base,missing){
 const ctx=await browser.newContext({viewport:{width:390,height:850},
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
 if(missing){
   await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
   await ctx.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await ctx.newPage();
 try{
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof openShop==='function'&&typeof achievementCatalogHtml==='function');
   await page.evaluate(()=>{
     achievementViewFilter='all';achievementCategoryFilter='all';achievementSortMode='category';
     openShop('achievements');
   });
   const sel=missing?'#modal .achievement-screen:not([data-v-app])':
     '#modal .achievement-screen[data-v-app]';
   await page.locator(sel).getByRole('button',{name:'Открытые',exact:true}).waitFor({timeout:15000});
   const actual=await page.evaluate(()=>{
     const host=modal.querySelector('.achievement-screen');
     const oldButton=[...host.querySelectorAll('.achievement-filter')]
       .find(b=>b.textContent.trim()==='Открытые');
     if(!oldButton)throw Error('Missing preflight filter button');
     const before={view:achievementViewFilter,id:state.profileId,coins:state.coins,xp:state.xp};
     openShop('avatars');
     const afterNavigation={
       modalShop:!!modal.querySelector('.shop-grid'),
       buttonConnected:oldButton.isConnected,
       view:achievementViewFilter
     };
     oldButton.click();
     const afterStale={
       view:achievementViewFilter,modalAchievements:!!modal.querySelector('.achievement-screen'),
       id:state.profileId,coins:state.coins,xp:state.xp
     };
     return {before,afterNavigation,afterStale};
   });
   console.log('V281_PREFLIGHT_STALE_ACHIEVEMENTS',JSON.stringify({missing,...actual}));
   assert.equal(actual.before.view,'all');
   assert.equal(actual.afterNavigation.modalShop,true);
   assert.equal(actual.afterNavigation.buttonConnected,false);
   assert(actual.afterStale.view==='open'||actual.afterStale.modalAchievements,
     'Preflight requires reproduced detached-button bug');
   assert.equal(actual.before.id,actual.afterStale.id);
   assert.equal(actual.before.coins,actual.afterStale.coins);
   assert.equal(actual.before.xp,actual.afterStale.xp);
   console.log('PASS_V281_PREFLIGHT_CONFIRMED_STALE',missing?'HTML':'Vue');
 }finally{await ctx.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 await inspect(browser,base,false);
 await inspect(browser,base,true);
}).catch(err=>{console.error(err);process.exitCode=1});
