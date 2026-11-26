'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
const retired=['pet_robotx','pet_wisecat','pet_royal_dragon'];
const rewards=['pet_streak_owl','pet_fraction_dragon','pet_golden_turtle'];
async function scenario(browser,url,width,fallback){
 const ctx=await browser.newContext({viewport:{width,height:850},serviceWorkers:fallback?'block':'allow'});
 if(fallback){await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());await ctx.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());}
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(url);await p.waitForFunction(()=>typeof mk873ArchivedPets==='function'&&mk854HistoryReady===true);
  if(!fallback){await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();await p.waitForFunction(()=>!!navigator.serviceWorker.controller);}
  const expected=await p.evaluate(({retired,rewards})=>{
   state.coins=10000;state.xp=100000;
   for(const id of retired){const item=catalogItem('pets',id);state.inventory.pets.push(id);mk865SetAcquisition(state,'pets',id,'store',item.price,Date.now()-60000);}
   state.equipped.pet=retired[0];normalizeShop();
   const active=mk872ActiveCollectionItems('pets').map(x=>x.id),store=filteredShopItems('pets').map(x=>x.id),pool=['rare','epic','legendary'].flatMap(r=>mk861ChestEntries(r).map(x=>x.item.id)),quick=mk19gPetSummary();
   const initial={coins:state.coins,xp:state.xp,inventory:[...state.inventory.pets],history:JSON.stringify(state.acquisitionMetadata)};
   for(const id of retired){equipShopItem('pets',id);buyShopItem('pets',id);}
   const after={coins:state.coins,xp:state.xp,inventory:[...state.inventory.pets],history:JSON.stringify(state.acquisitionMetadata)};
   const rows=retired.map(id=>{const e=mk865SellEligibility('pets',id);return {id,now:e.refundNow,later:e.refundTraining,ok:e.ok}});
   const art=rewards.map(id=>{const item=catalogItem('pets',id);const el=document.createElement('div');el.innerHTML=item.icon;return {id,achievement:item.achievement,rewardOnly:item.rewardOnly,price:item.price,asset:el.querySelector('img')?.getAttribute('src'),marker:el.querySelector('[data-reward-pet]')?.dataset.rewardPet}});
   save();return {active,store,pool,available:quick.available.map(x=>x.id),current:state.equipped.pet,archive:mk873ArchivedPets(state).map(x=>x.id),initial,after,rows,art};
  },{retired,rewards});
  for(const id of retired){for(const list of [expected.active,expected.store,expected.pool,expected.available])assert(!list.includes(id),id);assert(expected.archive.includes(id));}
  assert.equal(expected.current,'pet_none');assert.deepEqual(expected.initial,expected.after);
  assert.deepEqual(expected.rows.map(r=>[r.ok,r.now,r.later]),[[true,172,344],[true,128,256],[true,304,608]]);
  assert.deepEqual(expected.art.map(x=>[x.rewardOnly,x.price,x.marker]),rewards.map(id=>[true,0,id]));
  assert.deepEqual(expected.art.map(x=>x.asset),['assets/source/pets/pet_owl.webp','assets/source/pets/pet_dragon.webp','assets/source/pets/pet_turtle.webp']);
  // Actual purchase guard on an unowned archived SKU, and a real archived sale.
  const sale=await p.evaluate(id=>{
   const coins=state.coins;mk865SellItem('pets',id,0.4);const sold=state.coins;
   mk865SellItem('pets',id,0.4);buyShopItem('pets',id);normalizeShop();save();
   return {coins,sold,after:state.coins,owned:state.inventory.pets.includes(id),ever:mk865WasEverOwned(state,'pets',id),sale:state.saleHistory.filter(x=>x.type==='pets'&&x.id===id).length};
  },retired[0]);
  assert.equal(sale.sold-sale.coins,172);assert.equal(sale.after,sale.sold);assert.equal(sale.owned,false);assert.equal(sale.ever,true);assert.equal(sale.sale,1);
  if(!fallback){await ctx.setOffline(true);await p.reload();await p.waitForFunction(()=>mk854HistoryReady===true);}
  const after=await p.evaluate(async({retired,rewards})=>{
   normalizeShop();const images=[];
   for(const id of rewards){const el=document.createElement('div');el.innerHTML=catalogItem('pets',id).icon;const img=new Image();img.src=el.querySelector('img').src;await img.decode();images.push(img.naturalWidth>0);}
   return {coins:state.coins,sale:state.saleHistory.filter(x=>x.type==='pets'&&x.id===retired[0]).length,archive:mk873ArchivedPets(state).map(x=>x.id),images};
  },{retired,rewards});
  assert.equal(after.coins,sale.sold);assert.equal(after.sale,1);assert(retired.every(id=>after.archive.includes(id)));assert(after.images.every(Boolean));assert.deepEqual(errors,[]);
  console.log('PASS_PET_CLEANUP',JSON.stringify({width,fallback,archive:true,refund:true,artwork:true,offline:!fallback}));
 }finally{await ctx.close();}
}
withMatkvestBrowser(async(browser,url)=>{await scenario(browser,url,390,false);await scenario(browser,url,1280,false);await scenario(browser,url,390,true)}).catch(e=>{console.error(e);process.exitCode=1});
