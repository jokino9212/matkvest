'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
const tiers=['rare','epic','legendary'], xp={rare:60,epic:40,legendary:20};
const ready=p=>p.waitForFunction(()=>typeof mk305IsSold==='function'&&mk854HistoryReady);
async function fresh(context,url){const p=await context.newPage();await p.goto(url);await ready(p);await p.waitForLoadState('load');await p.evaluate(()=>mk305FlushWrites());return p}
const snap=p=>p.evaluate(()=>({coins:state.coins,xp:state.xp,opened:state.chestStats.totalOpened,bonus:state.chestStats.bonusXp,ids:[...state.chestOwnedIds],chestHistory:deepCopy(state.chestHistory),sales:state.saleHistory.map(s=>({id:s.id,transactionId:s.transactionId,refund:s.refundCoins})),inventory:deepCopy(state.inventory),meta:deepCopy(state.acquisitionMetadata)}));
async function seed(p,coins){await p.evaluate(n=>{state.coins=n;state.xp=10000;save();return mk305FlushWrites()},coins)}
async function open(p,rarity,at=0){return p.evaluate(async ({rarity,at})=>{
 if(at>0)await new Promise(r=>setTimeout(r,Math.max(0,at-Date.now())));
 const roll=mk861RollRarity,pick=mk861PickArray;mk861RollRarity=()=>rarity;mk861PickArray=a=>a[0]||null;
 try{const b={coins:state.coins,xp:state.xp,opened:state.chestStats.totalOpened};const r=await mk861OpenChestTransaction();
 if(r)mk861FinishReveal();return {before:b,after:{coins:state.coins,xp:state.xp,opened:state.chestStats.totalOpened},reward:r?{transactionId:r.transactionId,id:r.rewardId,type:r.type,price:r.item?.price,compensation:r.compensation,bonus:r.bonusXp}:null};}
 finally{mk861RollRarity=roll;mk861PickArray=pick}
 },{rarity,at})}
async function sell(p,item,at=0){return p.evaluate(async ({item,at})=>{
 if(at>0)await new Promise(r=>setTimeout(r,Math.max(0,at-Date.now())));
 const receipt=await mk865SellItem(item.type,item.id,.5);
 return {receipt:receipt||null};
 },{item,at})}
async function checkRace(browser,url,fallback,mode){
 const ctx=await browser.newContext({viewport:{width:390,height:850},serviceWorkers:'block'});
 if(fallback)await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
 try{
  const a=await fresh(ctx,url);await seed(a,mode==='open-one'?200:mode==='open-two'?400:3000);
  let items=[];
  if(mode.startsWith('sell')){items.push((await open(a,'rare')).reward);if(mode==='sell-distinct')items.push((await open(a,'epic')).reward);else items.push(items[0]);assert(items.every(x=>x?.id))}
  const before=await snap(a),b=await fresh(ctx,url),beforeB=await snap(b);
  assert.equal(beforeB.coins,before.coins);assert.equal(beforeB.opened,before.opened);
  const at=Date.now()+250;
  const results=mode.startsWith('open')?await Promise.all([open(a,'rare',at),open(b,'rare',at)]):await Promise.all([sell(a,items[0],at),sell(b,items[1],at)]);
  const c=await fresh(ctx,url),after=await snap(c);
  console.log('V305_RACE',JSON.stringify({fallback,mode,before:{coins:before.coins,xp:before.xp,opened:before.opened},results,after:{coins:after.coins,xp:after.xp,opened:after.opened,ids:after.ids,sales:after.sales}}));
  if(mode.startsWith('open')){
   const rewards=results.filter(x=>x.reward).map(x=>x.reward);
   assert(rewards.length===(mode==='open-one'?1:2),'overdraw or no accepted chest');
   assert.equal(new Set(rewards.map(x=>x.id)).size,rewards.length,'duplicate reward in two tabs');
   assert.equal(after.opened,before.opened+rewards.length,'lost chest receipt');
   assert.equal(new Set(rewards.map(x=>x.transactionId)).size,rewards.length);
   assert(rewards.every(x=>x.transactionId&&after.chestHistory.some(h=>h.transactionId===x.transactionId)),'own chest receipt missing');
   assert.equal(after.coins,before.coins-200*rewards.length,'lost debit');
   assert.equal(after.xp,before.xp+60*rewards.length,'lost XP');
   assert(rewards.every(x=>after.ids.includes(x.id)),'lost ownership');
  }else{
   const successes=results.map(x=>x.receipt).filter(Boolean);
   assert(successes.length===(mode==='sell-same'?1:2),'duplicate sale acknowledged');
   assert.equal(after.coins,before.coins+successes.reduce((s,x)=>s+x.refundCoins,0),'lost sale credit');
   const newSales=after.sales.slice(before.sales.length);
   assert.equal(newSales.length,successes.length,'lost or duplicate sale receipt');
   assert.equal(new Set(newSales.map(x=>x.transactionId)).size,newSales.length);
   assert(successes.every(x=>newSales.some(y=>y.transactionId===x.transactionId&&y.refund===x.refundCoins)),'own sale receipt missing');
   for(const s of newSales){const item=items.find(i=>i.id===s.id);assert(item);assert(!after.inventory[item.type].includes(item.id),'sold item restored');assert(after.meta[item.type+':'+item.id].soldTimestamp>0)}
   assert.equal(after.xp,before.xp);
  }
 }finally{await ctx.close()}
}
async function exhaustion(browser,url){
 const ctx=await browser.newContext({serviceWorkers:'block'});
 try{
  const p=await fresh(ctx,url);await seed(p,50000);
  const result=await p.evaluate(async ()=>{
   const rarities=['rare','epic','legendary'],xp={rare:60,epic:40,legendary:20};
   const pool=Object.fromEntries(rarities.map(r=>[r,mk861UnownedEntries(state,r).map(x=>x.item.id)]));
   const initial={coins:state.coins,xp:state.xp,opened:state.chestStats.totalOpened};const receipts=[],compensations=[];
   const roll=mk861RollRarity,pick=mk861PickArray;mk861PickArray=a=>a[0]||null;
   try{
    for(const r of rarities){
     mk861RollRarity=()=>r;
     for(const id of pool[r]){
      const x=await mk861OpenChestTransaction();if(!x||x.compensation||x.rewardId!==id||x.bonusXp!==xp[r])throw Error('wrong reward '+r+' '+id);
      receipts.push({id:x.rewardId,rarity:r,bonus:x.bonusXp,price:x.item.price});mk861FinishReveal();
     }
     if(mk861UnownedEntries(state,r).length)throw Error('tier not exhausted '+r);
     const b={coins:state.coins,xp:state.xp};const x=await mk861OpenChestTransaction();
     if(x)mk861FinishReveal();
     compensations.push({rarity:r,accepted:!!x,compensation:x?.compensation,delta:state.coins-b.coins,xp:state.xp-b.xp,bonus:x?.bonusXp});
    }
    const b={coins:state.coins,xp:state.xp};for(let i=0;i<6;i++){mk861RollRarity=()=>rarities[i%3];const x=await mk861OpenChestTransaction();if(x){if(!x.compensation||x.bonusXp)throw Error('reward after exhaustion');mk861FinishReveal()}}
    return {pool,initial,receipts,compensations,post:{coins:state.coins-b.coins,xp:state.xp-b.xp},final:{coins:state.coins,xp:state.xp,opened:state.chestStats.totalOpened,available:rarities.map(r=>mk861UnownedEntries(state,r).length)}};
   }finally{mk861RollRarity=roll;mk861PickArray=pick}
  });
  assert.equal(new Set(result.receipts.map(x=>x.id)).size,result.receipts.length);
  assert.deepEqual(result.final.available,[0,0,0]);assert.equal(result.post.xp,0);assert(result.post.coins<=0);
  assert.equal(result.final.xp-result.initial.xp,result.receipts.reduce((s,x)=>s+x.bonus,0));
  for(const x of result.compensations){assert.equal(x.xp,0);assert(x.delta<=0);if(x.accepted){assert.equal(x.compensation,true);assert.equal(x.bonus,0)}}
  console.log('V305_EXHAUSTION_PASS',JSON.stringify(result));
 }finally{await ctx.close()}
}
async function avatar(browser,url,width){
 const ctx=await browser.newContext({viewport:{width,height:850},serviceWorkers:'allow'});
 const errors=[];
 try{
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await ready(p);
  await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const id='avatar_clash_king';
  const info=await p.evaluate(async id=>{
   const item=catalogItem('avatars',id),src=new URL('./assets/source/avatars/avatar_clash_king.svg',location.href).href;
   const hit=await caches.match(src);return {id:item?.id,name:item?.name,price:item?.price,level:item?.level,cached:!!hit,active:mk872ActiveCollectionItems('avatars').some(x=>x.id===id)};
  },id);
  assert.equal(info.id,id);assert.equal(info.price,480);assert.equal(info.level,8);assert(info.cached&&info.active,JSON.stringify(info));
  await ctx.setOffline(true);await p.reload();await ready(p);
  await p.evaluate(id=>{state.inventory.avatars=[...new Set([...state.inventory.avatars,id])];state.equipped.avatar=id;save();openProfiles();return mk305FlushWrites()},id);
  const trigger=p.locator('#modal .mk871-profiles-screen .profile-preview > .avatar-badge');
  const img=trigger.locator('img[src*="avatar_clash_king.svg"]').first();await img.waitFor();
  assert.equal(await img.evaluate(async x=>{await x.decode();return x.naturalWidth}),512);
  await trigger.click();
  const viewer=p.locator('#mk872AvatarViewer .mk872-viewer-content[data-v-app]');await viewer.waitFor();
  const visual=viewer.locator('#mk872ViewerVisual img[src*="avatar_clash_king.svg"]');
  await visual.waitFor();const bounds=await visual.evaluate(async x=>{await x.decode();const r=x.getBoundingClientRect();return {w:x.naturalWidth,h:x.naturalHeight,visible:r.width>100&&r.height>100&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}});
  assert.deepEqual(bounds,{w:512,h:512,visible:true});
  await fs.mkdir('ci-acceptance-output/v305-king',{recursive:true});await p.screenshot({path:'ci-acceptance-output/v305-king/king-'+width+'.png'});
  await p.keyboard.press('Escape');await viewer.waitFor({state:'detached'});
  await p.reload();await ready(p);
  assert.equal(await p.evaluate(()=>state.equipped.avatar),id);assert.deepEqual(errors,[]);
  console.log('V305_KING_OFFLINE_PASS',width,JSON.stringify(info));
 }finally{await ctx.close()}
}
async function staleSave(browser,url,fallback,concurrent){
 const ctx=await browser.newContext({serviceWorkers:'block'});
 if(fallback)await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
 try{
  const a=await fresh(ctx,url);await seed(a,2000);const b=await fresh(ctx,url);
  const before=await snap(a);
  const operation=()=>open(a,'rare');
  const saveStale=()=>b.evaluate(()=>{state.coins+=7;state.xp+=3;save();return mk305FlushWrites()});
  let reward;
  if(concurrent){const [x,ok]=await Promise.all([operation(),saveStale()]);assert(ok);reward=x.reward}
  else {reward=(await operation()).reward;assert(await saveStale())}
  assert(reward?.transactionId);
  const c=await fresh(ctx,url),opened=await snap(c);
  assert.equal(opened.coins,before.coins-200+7);assert.equal(opened.xp,before.xp+60+3);
  assert(opened.ids.includes(reward.id));assert(opened.chestHistory.some(x=>x.transactionId===reward.transactionId));
  const d=await fresh(ctx,url);
  const sale=(await sell(c,reward)).receipt;assert(sale?.transactionId);
  assert(await d.evaluate(()=>{state.coins+=11;state.xp+=5;save();return mk305FlushWrites()}));
  const e=await fresh(ctx,url),after=await snap(e);
  assert.equal(after.coins,opened.coins+sale.refundCoins+11);assert.equal(after.xp,opened.xp+5);
  assert(after.sales.some(x=>x.transactionId===sale.transactionId));
  assert(!after.inventory[reward.type].includes(reward.id));
  assert(after.meta[reward.type+':'+reward.id].soldTimestamp>0);
  assert(after.ids.includes(reward.id));
  console.log('V305_STALE_SAVE_PASS',JSON.stringify({fallback,concurrent,before:before.coins,after:after.coins,reward:reward.transactionId,sale:sale.transactionId}));
 }finally{await ctx.close()}
}
async function queuedSaveCrash(browser,url,fallback,afterCommit){
 const ctx=await browser.newContext({serviceWorkers:'block'});
 if(fallback)await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
 try{
  const a=await fresh(ctx,url);await seed(a,2000);const b=await fresh(ctx,url),before=await snap(a);
  if(afterCommit){
   const result=await b.evaluate(async()=>{
    const original=Storage.prototype.removeItem;
    Storage.prototype.removeItem=function(key){if(key.startsWith(MK305_PENDING_PREFIX))throw Error('test crash after canonical commit');return original.call(this,key)};
    try{state.coins+=17;state.xp+=9;save();const ok=await mk305FlushWrites();return {ok,pending:Object.keys(localStorage).filter(k=>k.startsWith(MK305_PENDING_PREFIX)).length}}
    finally{Storage.prototype.removeItem=original}
   });
   assert.equal(result.ok,false);assert(result.pending>0);
  }else{
   await a.evaluate(()=>{window.mk305TestHeld=false;navigator.locks.request(MK305_PROFILE_LOCK,()=>new Promise(resolve=>{window.mk305TestRelease=resolve;window.mk305TestHeld=true}))});
   await a.waitForFunction(()=>window.mk305TestHeld);
   const pending=await b.evaluate(()=>{state.coins+=17;state.xp+=9;save();return Object.keys(localStorage).filter(k=>k.startsWith(MK305_PENDING_PREFIX)).length});
   assert(pending>0);
   await b.close();
   await a.evaluate(()=>window.mk305TestRelease());
  }
  const c=await fresh(ctx,url),after=await snap(c);
  assert.equal(after.coins,before.coins+17);assert.equal(after.xp,before.xp+9);
  const d=await fresh(ctx,url),again=await snap(d);
  assert.equal(again.coins,after.coins);assert.equal(again.xp,after.xp);
  assert.equal(await d.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith(MK305_PENDING_PREFIX)).length),0);
  console.log('V305_DURABLE_SAVE_PASS',JSON.stringify({fallback,afterCommit,before:before.coins,after:after.coins}));
 }finally{await ctx.close()}
}
async function archiveRace(browser,url,fallback){
 const ctx=await browser.newContext({serviceWorkers:'block'});
 if(fallback)await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
 try{
  const a=await fresh(ctx,url);await seed(a,3000);
  const fixture=await a.evaluate(async()=>{
   const avatar=SHOP_CATALOG.avatars.find(item=>mk873IsArchivedAvatar(item.id)&&!item.rewardOnly&&item.price>0).id;
   state.inventory.avatars.push(avatar);state.equipped.avatar=avatar;
   mk865SetAcquisition(state,'avatars',avatar,'store',400,Date.now()-900000);save();await mk305FlushWrites();
   return avatar;
  });
  const b=await fresh(ctx,url),before=await snap(a);
  const [chest,archive]=await Promise.all([open(a,'rare'),b.evaluate(async id=>{
   const e=mk873Eligibility(state,id);if(!e.ok)throw Error(e.reason);
   const {record}=await mk873RecordRefund(state,id,e);await mk873ProjectRefunds([record]);return record.receipt;
  },fixture)]);
  assert(chest.reward?.transactionId&&archive?.transactionId);
  const c=await fresh(ctx,url),after=await snap(c);
  assert.equal(after.coins,before.coins-200+archive.refundCoins);assert.equal(after.xp,before.xp+60);
  assert(after.chestHistory.some(x=>x.transactionId===chest.reward.transactionId));
  assert(after.sales.some(x=>x.transactionId===archive.transactionId));
  assert(!after.inventory.avatars.includes(fixture));assert(after.ids.includes(chest.reward.id));
  console.log('V305_ARCHIVE_RACE_PASS',JSON.stringify({fallback,chest:chest.reward.transactionId,archive:archive.transactionId}));
 }finally{await ctx.close()}
}
async function pendingProfileEdit(browser,url,fallback){
 const ctx=await browser.newContext({serviceWorkers:'block'});
 if(fallback)await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
 try{
  const a=await fresh(ctx,url);await seed(a,2000);const b=await fresh(ctx,url);
  await a.evaluate(()=>{window.mk305TestHeld=false;navigator.locks.request(MK305_PROFILE_LOCK,()=>new Promise(resolve=>{window.mk305TestRelease=resolve;window.mk305TestHeld=true}))});
  await a.waitForFunction(()=>window.mk305TestHeld);
  const id=await b.evaluate(()=>{
   state.coins+=7;save();
   const profile=ensureProfileIdentity(deepCopy(EMPTY_STATE));
   profiles['Несохранённая карточка преподавателя']=profile;return profile.profileId;
  });
  await a.evaluate(()=>window.mk305TestRelease());
  assert(await b.evaluate(()=>mk305FlushWrites()));
  assert.equal(await b.evaluate(id=>teacherProfileById(id)?.profile?.profileId||teacherProfileById(id)?.profileId||null,id),id,'queued save clobbered an unrelated in-memory profile');
  console.log('V305_PENDING_PROFILE_EDIT_PASS',fallback);
 }finally{await ctx.close()}
}
// A real pre-migration tab, not another instance of the staged runtime.
// HEAD:index.html is the accepted runtime; the CI scripts materialize the candidate
// only in the working tree. Both documents share the same origin and localStorage.
async function actualOldRuntime(browser,url){
 const {execFileSync}=require('node:child_process');
 const oldHtml=execFileSync('git',['show','HEAD:index.html'],{maxBuffer:32*1024*1024});
 const ctx=await browser.newContext({serviceWorkers:'block'});
 try{
  const a=await fresh(ctx,url);await seed(a,3000);
  const first=(await open(a,'rare')).reward;assert(first?.transactionId);
  const old=await ctx.newPage();
  await old.route(u=>u.href===url,r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:oldHtml}));
  await old.goto(url);
  await old.waitForFunction(()=>typeof mk305IsSold==='function'&&mk854HistoryReady);
  assert.equal(await old.evaluate(()=>typeof mk305FlushWrites),'undefined','fixture must be actual pre-migration runtime');
  const before=await snap(a);
  assert.deepEqual(await old.evaluate(()=>({coins:state.coins,xp:state.xp})),{coins:before.coins,xp:before.xp});
  const sale=(await sell(a,first)).receipt;assert(sale?.transactionId);
  const second=(await open(a,'epic')).reward;assert(second?.transactionId);
  const expected={coins:before.coins+sale.refundCoins-200+17,xp:before.xp+40+9};
  await old.evaluate(()=>{state.coins+=17;state.xp+=9;save()});
  const b=await fresh(ctx,url),after=await snap(b);
  const result={expected,actual:{coins:after.coins,xp:after.xp},
   ownSale:after.sales.some(x=>x.transactionId===sale.transactionId),
   ownChest:after.chestHistory.some(x=>x.transactionId===second.transactionId),
   soldNotRestored:!after.inventory[first.type].includes(first.id)};
  console.log('V305_ACTUAL_OLD_RUNTIME',JSON.stringify(result));
  assert.deepEqual(result.actual,expected,'old build lost economy changes');
  assert(result.ownSale&&result.ownChest&&result.soldNotRestored,'old build lost receipt or resurrected sold item');
  const again=await fresh(ctx,url);assert.deepEqual(await snap(again),after,'legacy replay duplicated ordinary progress');
  const protectedDoc=await again.evaluate(()=>JSON.parse(localStorage.getItem('mq4_v305_authority')));
  assert(protectedDoc?.profiles&&Object.values(protectedDoc.profiles).some(p=>p.saleHistory?.some(s=>s.transactionId===sale.transactionId)),'authority missing durable sale receipt');
 }finally{await ctx.close()}
}
// An old document opened before the migration has no trustworthy revision.
async function unversionedOldRuntime(browser,url){
 const {execFileSync}=require('node:child_process');
 const oldHtml=execFileSync('git',['show','HEAD:index.html'],{maxBuffer:32*1024*1024});
 const ctx=await browser.newContext({serviceWorkers:'block'});
 try{
  const old=await ctx.newPage();
  await old.route(u=>u.href===url,r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:oldHtml}));
  await old.goto(url);await old.waitForFunction(()=>typeof mk305IsSold==='function'&&mk854HistoryReady);
  assert.equal(await old.evaluate(()=>typeof mk305FlushWrites),'undefined');
  await old.evaluate(()=>{state.coins=3000;state.xp=10000;save()});
  const a=await fresh(ctx,url);
  const first=(await open(a,'rare')).reward;assert(first?.transactionId);
  const sale=(await sell(a,first)).receipt;assert(sale?.transactionId);
  const second=(await open(a,'epic')).reward;assert(second?.transactionId);
  const before=await snap(a);
  const raw=await old.evaluate(()=>{state.coins+=17;state.xp+=9;save();return localStorage.getItem('mq4_profiles')});
  assert(Object.values(JSON.parse(raw)).every(p=>!p.mk305LegacyRevision),'fixture must have no revision');
  const b=await fresh(ctx,url);
  assert.deepEqual(await snap(b),before,'unversioned writer replaced protected state');
  assert(await b.evaluate(raw=>Object.keys(localStorage).some(k=>k.startsWith('mq4_v305_legacy_quarantine:')&&localStorage.getItem(k)===raw),raw),'unversioned raw snapshot not preserved');
  await b.getByRole('button',{name:'Скачать данные для восстановления',exact:true}).waitFor();
  const download=await Promise.all([b.waitForEvent('download'),b.getByRole('button',{name:'Скачать данные для восстановления',exact:true}).click()]);
  const file=JSON.parse(await fs.readFile(await download[0].path(),'utf8'));
  assert.equal(file.automaticImport,false);assert(file.snapshots.some(s=>s.raw===raw),'export lost original legacy bytes');
  console.log('V305_UNVERSIONED_OLD_QUARANTINE_PASS');
 }finally{await ctx.close()}
}
// A tagged older runtime can still claim a duplicate sale in its UI. It must
// never overwrite the new authority or silently import a second economic effect.
async function legacyEconomicConflict(browser,url){
 const {execFileSync}=require('node:child_process');
 const oldHtml=execFileSync('git',['show','HEAD:index.html'],{maxBuffer:32*1024*1024});
 const ctx=await browser.newContext({serviceWorkers:'block'});
 try{
  const a=await fresh(ctx,url);await seed(a,3000);
  const first=(await open(a,'rare')).reward;assert(first?.transactionId);
  const old=await ctx.newPage();
  await old.route(u=>u.href===url,r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:oldHtml}));
  await old.goto(url);await old.waitForFunction(()=>typeof mk305IsSold==='function'&&mk854HistoryReady);
  assert.equal(await old.evaluate(()=>typeof mk305FlushWrites),'undefined');
  assert(await old.evaluate(()=>!!state.mk305LegacyRevision),'fixture must be tagged');
  const sale=(await sell(a,first)).receipt;assert(sale?.transactionId);
  const second=(await open(a,'epic')).reward;assert(second?.transactionId);
  const before=await snap(a);
  const legacy=await old.evaluate(item=>{const before=state.coins;mk865SellItem(item.type,item.id,.5);return {before,after:state.coins,raw:localStorage.getItem('mq4_profiles')}},first);
  assert(legacy.after>legacy.before,'old runtime did not execute stale sale');
  const b=await fresh(ctx,url);
  assert.deepEqual(await snap(b),before,'old monetary conflict changed protected economy');
  assert(await b.evaluate(raw=>Object.keys(localStorage).some(k=>k.startsWith('mq4_v305_legacy_quarantine:')&&localStorage.getItem(k)===raw),legacy.raw),'conflicting raw snapshot not preserved');
  console.log('V305_LEGACY_ECONOMIC_CONFLICT_PASS');
 }finally{await ctx.close()}
}
// Browsers without Web Locks must never acknowledge unsafe monetary operations.
async function withoutWebLocks(browser,url,fallback){
 const ctx=await browser.newContext({serviceWorkers:'block'});
 if(fallback)await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
 try{
  const a=await fresh(ctx,url);await seed(a,3000);
  const first=(await open(a,'rare')).reward;assert(first?.transactionId);
  await a.close();
  const p=await ctx.newPage();
  await p.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined,configurable:true}));
  await p.goto(url);await ready(p);
  assert.equal(await p.evaluate(()=>typeof navigator.locks),'undefined');
  const before=await snap(p);
  const result=await p.evaluate(async item=>{
   const candidate=mk872ModernCatalog().find(x=>!isOwned('avatars',x.id)&&!x.rewardOnly&&x.price>0&&x.price<state.coins&&x.level<=levelFor(state.xp));
   if(!candidate)throw Error('missing shop fixture');
   const chest=await mk861OpenChestTransaction();
   const sale=await mk865SellItem(item.type,item.id,.5);
   const buy=await buyShopItem('avatars',candidate.id);
   return {chest:chest===null,sale:sale===null,buy:buy===null,owned:isOwned('avatars',candidate.id)};
  },first);
  assert.deepEqual(result,{chest:true,sale:true,buy:true,owned:false});
  assert.deepEqual(await snap(p),before,'unsafe economy mutation without Web Locks');
  await p.evaluate(()=>{state.coins+=17;state.xp+=9;save()});
  await p.reload();await ready(p);
  const after=await snap(p);
  assert.equal(after.coins,before.coins+17);assert.equal(after.xp,before.xp+9);
  assert.deepEqual(after.sales,before.sales);assert.deepEqual(after.chestHistory,before.chestHistory);
  const locked=await fresh(ctx,url);const fromLock=await snap(locked);
  assert.equal(fromLock.coins,after.coins);assert.equal(fromLock.xp,after.xp);
  const opened=(await open(locked,'epic')).reward;assert(opened?.transactionId);
  await p.evaluate(()=>{state.coins+=23;state.xp+=11;save()});
  const latest=await fresh(ctx,url),final=await snap(latest);
  assert.equal(final.coins,after.coins-200+23,'no-lock stale write lost locked debit or training credit');
  assert.equal(final.xp,after.xp+40+11,'no-lock stale write lost locked XP or training XP');
  assert(final.chestHistory.some(x=>x.transactionId===opened.transactionId),'no-lock stale write lost chest receipt');
  console.log('V305_NO_WEB_LOCKS_PASS',fallback);
 }finally{await ctx.close()}
}
withMatkvestBrowser(async(browser,url)=>{
 const failed=[];const check=async(name,fn)=>{try{await fn();console.log('PASS',name)}catch(e){failed.push(name);console.error('FAIL',name,e.stack||e)}};
 for(const fallback of [false,true])for(const mode of ['open-one','open-two','sell-same','sell-distinct'])await check('race '+fallback+' '+mode,()=>checkRace(browser,url,fallback,mode));
 for(const fallback of [false,true])for(const concurrent of [false,true])await check('stale save '+fallback+' '+concurrent,()=>staleSave(browser,url,fallback,concurrent));
 for(const fallback of [false,true])for(const afterCommit of [false,true])await check('durable save '+fallback+' '+afterCommit,()=>queuedSaveCrash(browser,url,fallback,afterCommit));
 for(const fallback of [false,true])await check('archive race '+fallback,()=>archiveRace(browser,url,fallback));
 for(const fallback of [false,true])await check('pending profile edit '+fallback,()=>pendingProfileEdit(browser,url,fallback));
 for(const fallback of [false,true])await check('no Web Locks '+fallback,()=>withoutWebLocks(browser,url,fallback));
 await check('actual old runtime',()=>actualOldRuntime(browser,url));
 await check('unversioned actual old runtime',()=>unversionedOldRuntime(browser,url));
 await check('legacy economic conflict',()=>legacyEconomicConflict(browser,url));
 await check('exhaustion',()=>exhaustion(browser,url));
 for(const width of [390,1280])await check('king offline '+width,()=>avatar(browser,url,width));
 assert.deepEqual(failed,[]);
}).catch(e=>{console.error(e);process.exitCode=1;});
