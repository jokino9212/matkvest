'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const out='audits/ux104_shop_achievement_ledger_output';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const result=[];
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:840},isMobile:width<500,hasTouch:width<500});
  const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const x=await page.evaluate(()=>{
   const pet=SHOP_CATALOG.pets.find(x=>x.id==='pet_ghost');
   if(!pet||pet.price!==1500)throw Error('Expected immutable pet price 1500');
   const p=ensureProfileIdentity({...EMPTY_STATE,coins:12000,xp:100000,
       inventory:{...(EMPTY_STATE.inventory||{}),pets:['pet_none']},
       equipped:{...(EMPTY_STATE.equipped||{}),pet:'pet_none'}});
   profiles={'Economy ledger QA':p};currentProfile='Economy ledger QA';state=p;openShop('pets','all');
   const initial={coins:state.coins,xp:state.xp,spent:state.shopStats?.spent||0,
      owned:state.inventory.pets.includes('pet_ghost')};
   let current=state.coins;const writes=[];
   Object.defineProperty(state,'coins',{configurable:true,enumerable:true,
     get(){return current},set(value){writes.push({from:current,to:value,change:value-current});
       current=value;}});
   buyShopItem('pets','pet_ghost');
   const purchased={coins:state.coins,xp:state.xp,spent:state.shopStats?.spent||0,
      owned:state.inventory.pets.includes('pet_ghost')};
   buyShopItem('pets','pet_ghost');
   const repeated={coins:state.coins,xp:state.xp,spent:state.shopStats?.spent||0,
      owned:state.inventory.pets.includes('pet_ghost')};
   return {initial,purchased,repeated,writes};
  });
  assert.equal(x.initial.coins,12000);
  assert.equal(x.initial.xp,100000);
  assert(!x.initial.owned);
  assert.equal(x.purchased.spent-x.initial.spent,1500,'Purchase ledger must charge catalog amount');
  assert(x.purchased.owned,'Purchased item not granted to inventory');
  assert.deepEqual(x.writes.slice(0,4).map(x=>x.change),[-1500,8,30,45],
     'Unexpected purchase then three distinct achievement rewards');
  assert.equal(x.purchased.coins,10583,'Final coin balance must include independently earned 83 coins');
  assert.equal(x.purchased.xp,100065,'Achievement XP bonus lost');
  assert.deepEqual(x.repeated,x.purchased,'Re-purchase or UI re-entry duplicated charges/rewards');
  assert.equal(x.writes.length,4,'Unexpected coin writes after duplicate purchase');
  assert.deepEqual(errors,[],'Runtime JS errors');
  result.push({width,...x});
  console.log('UX104_ACHIEVEMENT_LEDGER_PASS',JSON.stringify({width,charge:1500,
    credits:x.writes.slice(1).map(v=>v.change),xpAward:x.purchased.xp-x.initial.xp,
    before:x.initial.coins,after:x.purchased.coins,duplicatePurchaseSafe:true}));
  await page.close();
 }
 fs.writeFileSync(out+'/ledger_QA.json',JSON.stringify(result,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error('UX104_ACHIEVEMENT_LEDGER_FAIL',e.stack||e);process.exitCode=1});
