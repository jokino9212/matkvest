'use strict';
/* UX105 compatibility preview without art: catalog data only, ephemeral browser memory, never a release. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const m=JSON.parse(fs.readFileSync('audits/ux105_new_pets_manifest.json','utf8'));
const old=JSON.parse(fs.readFileSync('audits/ux105_baseline_pets.json','utf8')).items;
assert.equal(m.items.length,10);assert.equal(m.artwork.art_approval,'pending');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});
  const jsErrors=[];page.on('pageerror',err=>jsErrors.push(err.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const counts=await page.evaluate(records=>{
   const orig=SHOP_CATALOG.pets.map(x=>({id:x.id,name:x.name,price:x.price,rarity:x.rarity,level:x.level,rewardOnly:!!x.rewardOnly}));
   // Data-only test: 1px transparent pixel never added to the repository/catalog build.
   const dataOnlyIcon='<img alt="" width="1" height="1" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=">';
   for(const p of records){
    if(SHOP_CATALOG.pets.some(x=>x.id===p.id))throw new Error('Duplicate temporary ID '+p.id);
    SHOP_CATALOG.pets.push({...p,icon:dataOnlyIcon});
   }
   const post=SHOP_CATALOG.pets.map(x=>({id:x.id,name:x.name,price:x.price,rarity:x.rarity,level:x.level,rewardOnly:!!x.rewardOnly}));
   const found=records.map(x=>catalogItem('pets',x.id));
   const fake=ensureProfileIdentity({...EMPTY_STATE,coins:9000,xp:80000,
      inventory:{...(EMPTY_STATE.inventory||{}),pets:['pet_none',...records.map(x=>x.id)]},
      equipped:{...(EMPTY_STATE.equipped||{}),pet:records.at(-1).id}});
   profiles={'UX105 CONTRACT ONLY':fake};currentProfile='UX105 CONTRACT ONLY';state=fake;
   openShop('pets','all');
   return {orig,post,allFound:found.every(Boolean),count:SHOP_CATALOG.pets.length};
  },m.items);
  assert.deepEqual(counts.orig,old);
  assert.equal(counts.count,31);
  assert(counts.allFound);
  assert.deepEqual(counts.post.slice(0,21),old,'Legacy entries altered');
  assert.deepEqual(counts.post.slice(21).map(x=>x.id),m.items.map(x=>x.id));
  for(const x of m.items){
    const n=page.locator('#modal').getByText(x.name,{exact:true}).first();
    assert((await n.count())>0,'New item not rendered by shop '+x.id);
  }
  await page.evaluate(()=>{mk872CollectionTab='pets';openCollection()});
  for(const x of m.items){
    assert((await page.locator('#modal').getByText(x.name,{exact:true}).count())>0,'New item not shown in collection '+x.id);
  }
  await page.evaluate(()=>openLeaderboard());
  assert((await page.locator('#modal .leader-table').count())===1,'Leaderboard render failed after data-only new item');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(overflow<=2,'Document horizontal overflow on '+width+': '+overflow);
  assert.deepEqual(jsErrors,[]);
  console.log('UX105_DATA_ONLY_PREVIEW_PASS',JSON.stringify({width,oldPets:20,newPetDefinitions:10,visibleInShop:true,visibleInCollection:true,leaderboard:true,jsErrors:0}));
  await page.close();
 }
}finally{await browser.close()}
})().catch(err=>{console.error('UX105_DATA_ONLY_PREVIEW_FAIL',err.stack||err);process.exitCode=1});
