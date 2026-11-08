'use strict';
const {chromium}=require('playwright'), path=require('node:path');
const assert=require('node:assert/strict'),fs=require('node:fs');
const output='audits/ux104_coins_audit_output';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const findings=[];
 try{
 for(const [caseName,setup] of [['fresh',0],['rich',1],['priorOwned',2]]){
  const page=await browser.newPage({viewport:{width:390,height:850}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(([kind,mode])=>{
   const recorded=[];
   const p=ensureProfileIdentity({...EMPTY_STATE,coins:12000,xp:mode?100000:0,
    inventory:{...(EMPTY_STATE.inventory||{}),pets:mode===2?SHOP_CATALOG.pets.filter(x=>x.id!=='pet_ghost').map(x=>x.id):['pet_none']},
    equipped:{...(EMPTY_STATE.equipped||{}),pet:'pet_none'}});
   profiles={'Economy QA '+kind:p};currentProfile='Economy QA '+kind;state=p;
   const functionSource=String(buyShopItem).slice(0,14000);
   const beforeSetup={coins:state.coins,xp:state.xp,inventory:state.inventory.pets.length,
     shopSpent:state.shopStats?.spent||0,counter:state.coinStats||null,
     achieve:state.achievements||null,profileKeys:Object.keys(state)};
   openShop('pets','all');
   const beforeBuy={coins:state.coins,xp:state.xp,spent:state.shopStats?.spent||0,
      petOwned:state.inventory.pets.includes('pet_ghost')};
   let value=state.coins;
   Object.defineProperty(state,'coins',{get(){return value},set(next){
     recorded.push({old:value,new:next,stack:String(new Error().stack||'').split('\n').slice(1,6)});
     value=next;
   },configurable:true,enumerable:true});
   buyShopItem('pets','pet_ghost');
   return {caseName:kind,beforeSetup,beforeBuy,afterBuy:{coins:state.coins,spent:state.shopStats?.spent||0,
      petOwned:state.inventory.pets.includes('pet_ghost'),xp:state.xp},
      trackedWrites:recorded,method:functionSource};
  },[caseName,setup]);
  findings.push({caseName,beforeSetup:result.beforeSetup,beforeBuy:result.beforeBuy,
    afterBuy:result.afterBuy,writes:result.trackedWrites,errors,method:result.method});
  console.log('UX104_COIN_DIAGNOSTIC',JSON.stringify({caseName,beforeBuy:result.beforeBuy,
    afterBuy:result.afterBuy,writes:result.trackedWrites,errors}));
  if(caseName==='fresh') console.log('UX104_BUY_FUNCTION_SNIPPET',result.method.slice(0,5000));
  await page.close();
 }
 fs.writeFileSync(output+'/coins_audit.json',JSON.stringify(findings,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error('UX104_COIN_AUDIT_ERROR',e.stack||e);process.exitCode=1});
