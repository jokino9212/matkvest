'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const manifest=JSON.parse(fs.readFileSync('audits/ux105_new_pets_manifest.json','utf8'));
const baseline=JSON.parse(fs.readFileSync('audits/ux105_baseline_pets.json','utf8')).items;
assert(manifest.items.length===10);
assert(manifest.artwork.art_approval==='pending');
const rarities=['common','uncommon','rare','epic','legendary'];
const actualDistribution=Object.fromEntries(rarities.map(r=>[r,manifest.items.filter(x=>x.rarity===r).length]));
assert.deepEqual(actualDistribution,manifest.distribution_new);
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const data=await page.evaluate(()=>{
 const all=SHOP_CATALOG.pets.map(x=>({id:x.id,name:x.name,rarity:x.rarity,price:x.price,level:x.level,rewardOnly:!!x.rewardOnly}));
 const current=structuredClone(EMPTY_STATE);
 const oldKeys=Object.keys(current);
 return {all,oldKeys,catalogs:{avatars:SHOP_CATALOG.avatars.length,badges:SHOP_CATALOG.badges.length,stickers:SHOP_CATALOG.stickers.length}};
 });
 assert.equal(data.all.length,21);
 assert.deepEqual(data.all,baseline,'Baseline pet catalog changed before new release');
 assert.deepEqual(data.catalogs,{avatars:55,badges:50,stickers:40});
 const known=new Set(data.all.map(x=>x.id));const names=new Set(data.all.map(x=>x.name));
 for(const x of manifest.items){
  assert(!known.has(x.id),'New pet duplicates legacy ID: '+x.id);assert(!names.has(x.name),'New pet duplicates legacy name: '+x.name);
  known.add(x.id);names.add(x.name);
  assert(!x.rewardOnly&&x.achievement===null);
 }
 assert.equal(known.size,31,'30 distinct animals + pet_none required after real integration');
 const priceOrderedByRarity=rarities.map(r=>manifest.items.filter(x=>x.rarity===r).map(x=>x.price).sort((a,b)=>a-b));
 assert(priceOrderedByRarity.every(xs=>xs.every((price,i)=>i===0||price>xs[i-1])),'Price ladder duplicated');
 console.log('UX105_NEW_PETS_CONTRACT_BROWSER_PASS',JSON.stringify({legacy_unchanged:data.all.length,new_unique:manifest.items.length,future_pet_total:known.size,old_profile_keys:data.oldKeys.length,priceRanges:priceOrderedByRarity}));
 await page.close();
}finally{await browser.close()}
})().catch(e=>{console.error('UX105_CONTRACT_BROWSER_FAIL',e.stack||e);process.exitCode=1});
