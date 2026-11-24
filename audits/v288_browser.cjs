'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function scenario(browser,url,width,fallback){
 const ctx=await browser.newContext({viewport:{width,height:870},serviceWorkers:fallback?'block':'allow'});
 if(fallback){await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());await ctx.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());}
 const p=await ctx.newPage();
 try{
 await p.goto(url,{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>typeof openCollection==='function'&&mk854HistoryReady===true);
 if(!fallback){
 await p.evaluate(()=>navigator.serviceWorker.ready);
 await p.reload({waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await ctx.setOffline(true);await p.reload({waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>mk854HistoryReady===true);
 }
 await p.evaluate(()=>{state.coins=1000;state.xp=1000;if(!state.inventory.pets.includes('pet_bot'))state.inventory.pets.push('pet_bot');save();});
 const results=[];
 async function probe(name,open,selector,next,expectedHost){
  await p.evaluate(open);
  const loc=p.locator(selector).first();await loc.waitFor({state:'attached'});
  if(!fallback&&expectedHost)await p.locator(expectedHost+'[data-v-app]').waitFor({state:'attached'});
  await loc.evaluate(el=>window.__v288Old=el);
  await p.evaluate(next);
  await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{
   const snapshot=()=>({route:JSON.stringify(mk854Route()),open:overlay.classList.contains('show'),coins:state.coins,xp:state.xp,pet:state.equipped.pet,inventory:JSON.stringify(state.inventory),section:document.querySelector('[data-mk872-collection-tab][aria-pressed="true"]')?.dataset.mk872CollectionTab});
   const detached=!window.__v288Old.isConnected,before=snapshot();
   window.__v288Old.click();return {detached,before};
  });
  await p.waitForTimeout(500);
  const after=await p.evaluate(()=>({route:JSON.stringify(mk854Route()),open:overlay.classList.contains('show'),coins:state.coins,xp:state.xp,pet:state.equipped.pet,inventory:JSON.stringify(state.inventory),section:document.querySelector('[data-mk872-collection-tab][aria-pressed="true"]')?.dataset.mk872CollectionTab}));
  results.push({name,detached:r.detached,changed:JSON.stringify(r.before)!==JSON.stringify(after),before:{...r.before,inventory:undefined},after:{...after,inventory:undefined}});
 }
 await probe('store-header-close',()=>openShop('avatars'),'#modal [data-store-heading] button.x',()=>openShop('frames'),'#modal [data-store-heading]');
 await probe('collection-tab',()=>openCollection(),'#modal [data-mk872-collection-tab="pets"]',()=>openShop('avatars'),'#mk872CollectionUX .mk872-col-counter-grid');
 await probe('pet-choice',()=>{state.equipped.pet='pet_none';save();openShop('pets')},'#mk19gPetPanel [data-pet-choice="pet_bot"]',()=>openShop('avatars'),'#mk19gPetPanel');
 await probe('shop-buy',()=>openShop('avatars','all'),'#modal .shop-grid .shop-card button:not([disabled]):text("Купить за")',()=>openShop('frames'),'#modal .shop-grid');
 for(const r of results){assert.equal(r.detached,true,r.name+' fixture not detached');assert.equal(r.changed,false,r.name+' detached action changed state');}
 // Live controls must continue to act once.
 await p.evaluate(()=>openShop('avatars','all'));
 let buy=p.locator('#modal .shop-grid .shop-card button:not([disabled]):text("Купить за")').first();
 if(!fallback)await p.locator('#modal .shop-grid[data-v-app]').waitFor();
 await buy.waitFor();
 const price=Number((await buy.innerText()).match(/\d+/)[0]);
 const before=await p.evaluate(()=>({coins:state.coins,purchases:state.shopStats.purchases}));
 await buy.press('Enter');
 await p.waitForFunction(n=>state.shopStats.purchases===n,before.purchases+1);
 assert.equal(await p.evaluate(()=>state.coins),before.coins-price);
 const returnRoute=await p.evaluate(()=>mk854Route());
 await p.evaluate(()=>openCollection());
 if(!fallback)await p.locator('#mk872CollectionUX .mk872-col-counter-grid[data-v-app]').waitFor();
 await p.locator('[data-mk872-collection-tab="pets"]').press('Space');
 await p.waitForFunction(()=>mk854Route().collectionTab==='pets');
 await p.locator('#mk19gPetPanel [data-pet-choice="pet_bot"]').press('Enter');
 await p.waitForFunction(()=>state.equipped.pet==='pet_bot');
 await p.locator('#modal [data-store-heading] button.x').press('Enter');
 // A nested collection closes back to the originating shop route, not necessarily home.
 await p.waitForFunction(expected=>JSON.stringify(mk854Route())===JSON.stringify(expected),returnRoute);
 await p.locator('#mk872CollectionUX').waitFor({state:'detached'});
 console.log('PASS_V288_NESTED_CLOSE',JSON.stringify({width,fallback,returnRoute,actual:await p.evaluate(()=>mk854Route())}));
 console.log('PASS_V288_CONSOLIDATED_STORE',JSON.stringify({width,fallback,results}));
 }finally{await ctx.close()}
}
withMatkvestBrowser(async(browser,url)=>{await scenario(browser,url,390,false);await scenario(browser,url,1280,false);await scenario(browser,url,390,true)}).catch(e=>{console.error(e);process.exitCode=1});
