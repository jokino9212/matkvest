import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import puppeteer from 'puppeteer-core';
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();
await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
const result=await page.evaluate(()=>{
 const named=(expr)=>{try{return eval(expr)}catch(e){return '__UNAVAILABLE__:'+e.message}};
 const catalog=named('SHOP_CATALOG');
 const s=named('state');
 const functions=[
 'buyShopItem','equipShopItem','shopCard','filteredShopItems','openShop','catalogItem','normalizeShop','mk865RefundQuote',
 'mk865Resell','mk865Sell','mk865Acquisition','mk865SetAcquisition','mk865WasEverOwned',
 'mk872ModernCatalog','mk872LegacyItems','mk872CollectionOwned','mk872LegacySale',
 'mk861RollRarity','mk861ChestPrice','mk861OpenChest','mk861UnownedEntries',
 'mk873Receipt','mk873Refund','mk873ApplyPrice','shopRarityButtons'
 ];
 const summaries=Object.fromEntries(functions.map(name=>{
   const fn=named(name);
   return [name,typeof fn==='function'?String(fn).slice(0,16000):typeof fn==='number'||typeof fn==='string'?fn:'NOT_FOUND'];
 }));
 const consts={};
 for(const n of ['SHOP_TYPES','MK865_REFUND_NOW','MK865_REFUND_TRAINING','MK861_CHEST_PRICE','MK861_RARITY_ODDS','MK861_PITY_EPIC','MK861_PITY_LEGENDARY','MK868_LEGACY_HERO_IDS','MK873_HERO_PRICES','MK872_MODERN_HERO_IDS','SHOP_RARITIES']){
   const v=named(n);
   consts[n]=typeof v==='function'?'[function]':v instanceof Set?[...v]:v;
 }
 if(!catalog||typeof catalog!=='object'||String(catalog).startsWith('__'))return{error:'catalog variable inaccessible',consts,functions:summaries};
 const rows=[];
 for(const [type,items] of Object.entries(catalog)){
   for(const it of items||[]){
     rows.push({type,id:it.id,name:it.name,rarity:it.rarity,price:it.price,level:it.level,rewardOnly:it.rewardOnly===true,
       hiddenInStore:it.hiddenInStore===true,legacyHero:it.legacyHero===true,finalHero:it.finalHero===true,
       assetType:it.assetType,archive:it.archive,shopOnly:it.shopOnly,source:it.source,retired:it.retired,hidden:it.hidden,
       allKeys:Object.keys(it)});
   }
 }
 const distribution={};
 for(const e of rows){
  const k=e.type+'|'+e.rarity;
  const a=distribution[k]??={type:e.type,rarity:e.rarity,n:0,prices:[],levels:[],rewardOnly:0,hidden:0};
  a.n++;if(Number.isFinite(e.price))a.prices.push(e.price);if(Number.isFinite(e.level))a.levels.push(e.level);if(e.rewardOnly)a.rewardOnly++;if(e.hiddenInStore)a.hidden++;
 }
 for(const a of Object.values(distribution)){
  a.prices.sort((a,b)=>a-b);a.levels.sort((a,b)=>a-b);
  a.minPrice=a.prices[0]??null;a.maxPrice=a.prices.at(-1)??null;
  a.minLevel=a.levels[0]??null;a.maxLevel=a.levels.at(-1)??null;
  a.prices=[...new Set(a.prices)].slice(0,45);
  a.levels=[...new Set(a.levels)].slice(0,25);
 }
 const other={
  modern:named('mk872ModernCatalog()'),
  legacy: named('mk872LegacyItems(state)'),
  countShopKeys:Object.keys(catalog),
  profile:Object.fromEntries(['coins','xp','inventory','shopStats','equipped','chestPity'].map(k=>[k,typeof s==='object'&&s&&k in s?s[k]:'NO_KEY']))
 };
 if(Array.isArray(other.modern))other.modern=other.modern.map(it=>({id:it.id,name:it.name,price:it.price,rarity:it.rarity,level:it.level,rewardOnly:it.rewardOnly,keys:Object.keys(it)}));
 if(Array.isArray(other.legacy))other.legacy=other.legacy.map(it=>({id:it.id,name:it.name,price:it.price,rarity:it.rarity,level:it.level,keys:Object.keys(it)}));
 return{catalogRows:rows,distribution:Object.values(distribution),consts,functions:summaries,other};
});
await browser.close();
fs.writeFileSync('audits/ui_stage19d_catalog_economy.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({error:result.error,distribution:result.distribution,consts:result.consts,modern:result.other?.modern,legacy:result.other?.legacy,functions:Object.fromEntries(Object.entries(result.functions||{}).map(([n,v])=>[n,String(v).slice(0,350)]))},null,2).slice(0,35000));
