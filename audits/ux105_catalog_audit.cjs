'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const result=await page.evaluate(()=>{
 const animals=SHOP_CATALOG.pets.map(x=>({id:x.id,name:x.name,price:x.price,rarity:x.rarity,level:x.level,desc:x.desc||'',rewardOnly:x.rewardOnly||false,achievement:x.achievement||null,icon:(x.icon||'').slice(0,155)}));
 const counts={pets:SHOP_CATALOG.pets.length,avatars:SHOP_CATALOG.avatars.length,badges:SHOP_CATALOG.badges.length,stickers:SHOP_CATALOG.stickers.length};
 return {animals,counts};
 });
 assert.equal(result.counts.pets,21,'Expect 20 real existing pets + pet_none before UX105');
 assert.equal(result.animals.filter(x=>x.id!=='pet_none').length,20);
 const rarities=Object.fromEntries(['common','uncommon','rare','epic','legendary'].map(r=>[r,result.animals.filter(x=>x.rarity===r&&x.id!=='pet_none').length]));
 const prices=result.animals.filter(x=>x.id!=='pet_none').map(x=>x.price).sort((a,b)=>a-b);
 const compact=result.animals.map(({icon,...item})=>({...item,imageSource:icon.includes('assets/source/')?'original_asset':'legacy'}));
 const out={base_cache:'v106',counts:result.counts,rarities,price_range:[prices[0],prices.at(-1)],animals:compact};
 fs.mkdirSync('audits/ux105_output',{recursive:true});
 fs.writeFileSync('audits/ux105_output/original_catalog.json',JSON.stringify(out,null,2)+'\n');
 console.log('UX105_BASELINE_PET_INVENTORY',JSON.stringify(out));
}finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
