'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
const xp={rare:60,epic:40,legendary:20};
async function read(page){return page.evaluate(()=>({coins:state.coins,xp:state.xp,stats:deepCopy(state.chestStats),sale:deepCopy(state.saleHistory),ids:deepCopy(state.chestOwnedIds),inv:deepCopy(state.inventory),meta:deepCopy(state.acquisitionMetadata)}))}
async function checkEconomy(page){
 const economy=await page.evaluate(()=>{
  const tiers=['rare','epic','legendary'],pools=Object.fromEntries(tiers.map(r=>[r,mk861ChestEntries(r).map(x=>({id:x.item.id,refund:Math.floor(x.item.price/2)}))]));
  const mean=r=>pools[r].reduce((s,x)=>s+x.refund,0)/pools[r].length;
  let distribution=new Map([['0,0',1]]),counts={rare:0,epic:0,legendary:0};
  for(let turn=0;turn<1000;turn++){
   const next=new Map();
   for(const [key,mass] of distribution){
    const [missEpicPlus,missLegendary]=key.split(',').map(Number),p={missEpicPlus,missLegendary};
    const probs=missLegendary>=11?[0,0,1]:missEpicPlus>=3?[0,5/6,1/6]:[.7,.25,.05];
    tiers.forEach((r,i)=>{const weight=mass*probs[i];if(!weight)return;
     if(turn>=100)counts[r]+=weight;
     const n=mk861NextPity(p,r),k=n.missEpicPlus+','+n.missLegendary;next.set(k,(next.get(k)||0)+weight);
    });
   }
   distribution=next;
  }
  const total=Object.values(counts).reduce((a,b)=>a+b,0),effective=Object.fromEntries(tiers.map(r=>[r,counts[r]/total]));
  return {pools,means:Object.fromEntries(tiers.map(r=>[r,mean(r)])),effective,
   baseRefund:tiers.reduce((s,r)=>s+MK861_CHEST_RATES[r]*mean(r),0),
   pityRefund:tiers.reduce((s,r)=>s+effective[r]*mean(r),0),
   baseXp:tiers.reduce((s,r)=>s+MK861_CHEST_RATES[r]*MK305_CHEST_XP[r],0),
   pityXp:tiers.reduce((s,r)=>s+effective[r]*MK305_CHEST_XP[r],0),
   totalPossibleResale:Object.values(pools).flat().reduce((s,x)=>s+x.refund,0)};
 });
 assert(economy.pools.rare.length&&economy.pools.epic.length&&economy.pools.legendary.length);
 const ids=Object.values(economy.pools).flat().map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(economy.baseXp,53);
 console.log('V305_ECONOMY',JSON.stringify(economy));
}
async function run(page,fallback,width){
 await page.goto(page.url()==='about:blank'?globalThis.testUrl:page.url());
 await page.waitForFunction(()=>typeof mk305IsSold==='function'&&typeof mk872CollectionSwitch==='function'&&mk854HistoryReady);
 await page.evaluate(()=>{state.coins=30000;state.xp=10000;save();return mk305FlushWrites()});
 // The previously accepted deterministic economy analysis is not repeated.
 for(const rarity of ['rare','epic','legendary']){
  const before=await read(page);
  const result=await page.evaluate(async rarity=>{
   const roll=mk861RollRarity,pick=mk861PickArray;
   mk861RollRarity=()=>rarity;mk861PickArray=items=>items[0]||null;
   try{const r=await mk861OpenChestTransaction();if(!r)throw Error('opening failed');return {rarity:r.rarity,id:r.rewardId,type:r.type,price:r.item.price,bonusXp:r.bonusXp};}
   finally{mk861RollRarity=roll;mk861PickArray=pick;}
  },rarity);
  assert.equal(result.rarity,rarity);
  assert.equal(result.bonusXp,xp[rarity]);
  const opened=await read(page);
  assert.equal(opened.coins,before.coins-200);assert.equal(opened.xp,before.xp+xp[rarity]);
  assert.equal(opened.stats.totalOpened,before.stats.totalOpened+1);
  assert.equal(opened.stats.bonusXp,before.stats.bonusXp+xp[rarity]);
  assert(opened.inv[result.type].includes(result.id));assert.equal(opened.meta[result.type+':'+result.id].source,'chest');
  const stale=await page.evaluate(()=>deepCopy(state));
  const root=page.locator('.mk861-reveal');
  if(!fallback)await page.locator('.mk861-reveal[data-v-app]').waitFor();
  await root.getByRole('button',{name:'Пропустить'}).click();
  assert((await root.innerText()).includes('+'+xp[rarity]+' XP'));
  const refund=Math.floor(result.price*.5);
  await root.getByRole('button',{name:'Продать за '+refund+' 🪙'}).click();
  const dialog=page.locator('#mk865SaleDialog');
  await dialog.getByRole('button',{name:'Продать за '+refund+' 🪙'}).click();
  await page.waitForFunction(({type,id})=>mk305IsSold(state,type,id),result);
  const sold=await read(page);
  assert.equal(sold.coins,opened.coins+refund);
  assert.equal(sold.xp,opened.xp);
  assert(!sold.inv[result.type].includes(result.id));
  assert(sold.ids.includes(result.id));
  assert.equal(sold.sale.at(-1).refundRate,.5);
  assert.equal(sold.sale.at(-1).refundCoins,refund);
  const protection=await page.evaluate(({result,stale})=>{
   const local=deepCopy(state),a=mergeSameStudent(local,deepCopy(stale)),b=mergeSameStudent(deepCopy(stale),local);
   const replaced=deepCopy(stale);mk305PreserveChestOnReplacement(local,replaced);
   const expired=deepCopy(local);expired.saleHistory=[];mk861ApplyChestOwnedToInventory(expired);mk865NormalizeSaleProfile(expired);
   const list=[a,b,replaced,expired];
   return {owned:list.map(p=>mk861OwnsInProfile(p,result.type,result.id)),xp:list.map(p=>p.xp),
    tombstone:list.map(p=>mk305IsSold(p,result.type,result.id)),duplicate:mk861UnownedEntries(state,result.rarity).some(x=>x.item.id===result.id)};
  },{result,stale});
  assert.deepEqual(protection.owned,[false,false,false,false]);assert.deepEqual(protection.tombstone,[true,true,true,true]);
  assert.equal(protection.duplicate,false);
  assert(protection.xp.every(n=>n===sold.xp));
  await page.evaluate(({type,id})=>mk865SellItem(type,id,.5),result);
  assert.equal((await read(page)).coins,sold.coins);
  await page.evaluate(()=>mk865CloseSaleOverlay());
  await page.reload();
  await page.waitForFunction(()=>typeof mk305IsSold==='function'&&mk854HistoryReady);
  const reloaded=await read(page);
  assert.equal(reloaded.coins,sold.coins);assert.equal(reloaded.xp,sold.xp);
  assert(!reloaded.inv[result.type].includes(result.id));assert(reloaded.meta[result.type+':'+result.id].soldTimestamp>0);
  // Actual backup replacement, not just calling the reconciliation helper.
  await page.evaluate(stale=>{pendingImport={scope:'profile',profiles:{[currentProfile]:stale},currentProfile};return replaceWithPendingImport()},stale);
  const restored=await read(page);
  assert(!restored.inv[result.type].includes(result.id));assert(restored.meta[result.type+':'+result.id].soldTimestamp>0);
  assert.equal(restored.xp,sold.xp);assert.equal(restored.coins,sold.coins);
  console.log('V305_CHEST_SALE_PASS',JSON.stringify({width,fallback,rarity,result,refund}));
 }
 // A compensation-only roll never issues XP, even if the rarity is forced.
 const comp=await page.evaluate(async()=>{
  const roll=mk861RollRarity;mk861RollRarity=()=> 'rare';
  for(const x of mk861ChestEntries('rare'))mk865RememberEverOwned(state,x.type,x.item.id);
  save();await mk305FlushWrites();
  const oldXp=state.xp,oldCoins=state.coins,oldBonus=state.chestStats.bonusXp;
  try{const r=await mk861OpenChestTransaction();const out={compensation:r?.compensation,bonus:r?.bonusXp,deltaXp:state.xp-oldXp,deltaCoins:state.coins-oldCoins,deltaBonus:state.chestStats.bonusXp-oldBonus};mk861FinishReveal();return out;}finally{mk861RollRarity=roll;}
 });
 assert.deepEqual(comp,{compensation:true,bonus:0,deltaXp:0,deltaCoins:-100,deltaBonus:0});
 // Force a write failure after the profile collection was written; no partial grant survives.
 const rollback=await page.evaluate(async()=>{
  const old=deepCopy(state),snapshot=mk861StorageSnapshot(),original=Storage.prototype.setItem,roll=mk861RollRarity;let failed=false;
  mk861RollRarity=()=> 'epic';
  Storage.prototype.setItem=function(k,v){if(k==='mq4'&&!failed){failed=true;throw new DOMException('test quota','QuotaExceededError')}return original.call(this,k,v)};
  try{const r=await mk861OpenChestTransaction();return {failed,result:r===null,coins:state.coins===old.coins,xp:state.xp===old.xp,stats:JSON.stringify(state.chestStats)===JSON.stringify(old.chestStats),storage:JSON.stringify(mk861StorageSnapshot())===JSON.stringify(snapshot)};}
  finally{Storage.prototype.setItem=original;mk861RollRarity=roll;}
 });
 assert.deepEqual(rollback,{failed:true,result:true,coins:true,xp:true,stats:true,storage:true});
 console.log('V305_COMPENSATION_ROLLBACK_PASS',width,fallback);
}
withMatkvestBrowser(async(browser,url)=>{
 globalThis.testUrl=url;
 for(const [width,fallback] of [[390,false],[1280,true]]){
  const context=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
  if(fallback)await context.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{await run(page,fallback,width);assert.deepEqual(errors,[]);}finally{await context.close();}
 }
}).catch(e=>{console.error(e);process.exitCode=1;});
