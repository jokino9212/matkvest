'use strict';
/* UX105 future release gate: MUST NOT PASS unless ten real unique human-approved artworks have been integrated into v107. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const m=JSON.parse(fs.readFileSync('audits/ux105_new_pets_manifest.json','utf8'));
const old=JSON.parse(fs.readFileSync('audits/ux105_baseline_pets.json','utf8')).items;
const sw=fs.readFileSync('sw.js','utf8'),index=fs.readFileSync('index.html');
assert(sw.includes('matkvest-iphone-v107'),'Only full approved v107 release may pass this Gate');
assert(sw.includes(crypto.createHash('sha256').update(index).digest('hex')),'PWA app integrity failure');
assert(m.artwork.art_approval==='approved'&&m.artwork.accepted_count===10);
assert(m.items.length===10);
const ids=new Set();
for(const item of m.items){
 assert(!ids.has(item.id));ids.add(item.id);
 assert(item.status==='approved'&&item.approved_sha256===item.sha256);
 assert(typeof item.sha256==='string'&&item.sha256.length===64);
 const data=fs.readFileSync(item.source_asset);
 assert.equal(data.subarray(0,4).toString(),'RIFF');
 assert.equal(data.subarray(8,12).toString(),'WEBP');
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),item.sha256);
 assert(sw.includes('./'+item.source_asset),'Offline cache incomplete '+item.id);
}
const folder='audits/ux105_v107_output';fs.mkdirSync(folder,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report=[];
try{
for(const width of [320,390,768,1280]){
 const page=await browser.newPage({viewport:{width,height:850},isMobile:width<500,hasTouch:width<500});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const catalog=await page.evaluate((items)=>{
  const all=SHOP_CATALOG.pets;
  const entries=all.map(x=>({id:x.id,name:x.name,price:x.price,rarity:x.rarity,level:x.level,rewardOnly:!!x.rewardOnly}));
  const profile=ensureProfileIdentity({...EMPTY_STATE,coins:2250,xp:18500,
   inventory:{...(EMPTY_STATE.inventory||{}),pets:['pet_none',...items.map(x=>x.id)]},
   equipped:{...(EMPTY_STATE.equipped||{}),pet:items.at(-1).id}});
  profiles={'UX105 TEST ONLY':profile};currentProfile='UX105 TEST ONLY';state=profile;
  openShop('pets','all');
  return {entries,categories:[all.length,SHOP_CATALOG.avatars.length,SHOP_CATALOG.badges.length,SHOP_CATALOG.stickers.length]};
 },m.items);
 assert.deepEqual(catalog.categories,[31,55,50,40],'Wrong catalog cardinality');
 assert.deepEqual(catalog.entries.slice(0,21),old,'Any legacy pet metadata changed');
 assert.deepEqual(new Set(catalog.entries.map(x=>x.id)).size,31,'Duplicate new item ID');
 assert.deepEqual(catalog.entries.slice(21).map(x=>x.id),m.items.map(x=>x.id),'New pet ordering/IDs wrong');
 for(const item of m.items){
  const existing=catalog.entries.find(x=>x.id===item.id);
  for(const field of ['id','name','price','rarity','level','rewardOnly'])assert.equal(existing[field],item[field],item.id+'/'+field);
  const src=item.source_asset;
  const image=page.locator('#modal .shop-icon img[src="'+src+'"]').first();
  assert.equal(await image.count(),1,'Missing new purchasable pet in shop '+item.id);
  const dims=await image.evaluate(async im=>{await im.decode();const rc=im.getBoundingClientRect();
   return [im.naturalWidth,im.naturalHeight,rc.width,rc.height,getComputedStyle(im).objectFit]});
  assert.deepEqual(dims.slice(0,2),[640,640],'Unexpected artwork native dimensions '+item.id);
  assert(dims[2]>=35&&dims[3]>=35&&Math.abs(dims[2]-dims[3])<=2&&dims[4]==='contain','Image not properly sized '+item.id);
  if(width===320){
   await page.locator('#modal .shop-icon').filter({has:page.locator('img[src="'+src+'"]')}).first().click();
   await page.waitForFunction(()=>document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
   const full=await page.evaluate(source=>{
    const img=document.querySelector('#mk872AvatarViewer img[src="'+source+'"]');
    return {ready:img?.naturalWidth===640,fit:img?getComputedStyle(img).objectFit:''};
   },src);
   assert(full.ready&&full.fit==='contain','Broken fullscreen item '+item.id);
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>!document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
  }
 }
 await page.screenshot({path:folder+'/shop_'+width+'.png',animations:'disabled'});
 await page.evaluate(()=>{mk872CollectionTab='pets';openCollection()});
 const collected=await page.evaluate(async items=>{
  const all=items.map(x=>document.querySelector('#modal img[src="'+x.source_asset+'"]'));
  await Promise.all(all.map(x=>x?.decode()));
  return all.map(x=>x?.naturalWidth===640);
 },m.items);
 assert(collected.every(Boolean),'Some new pets missing in user collection');
 await page.evaluate(()=>openLeaderboard());
 assert(await page.locator('#modal .leader-table img[src="'+m.items.at(-1).source_asset+'"]').count()>=1,
 'Equipped new pet missing in leaderboard');
 assert(!await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2),'Document overflow');
 assert.deepEqual(errors,[],'JS runtime errors');
 report.push({width,newPets:10,fullCatalog:31,collectionNewPets:collected.length,leaderboard:true,fullscreenChecked:width===320,jsErrors:0});
 console.log('UX105_V107_FULL_CATALOG_PASS',JSON.stringify(report.at(-1)));
 await page.close();
}
 const page=await browser.newPage();
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const alpha=await page.evaluate(async items=>{
  const ret=[];
  for(const item of items){
   const image=new Image();image.src=item.source_asset;await image.decode();
   for(const size of [48,128,384]){
    const c=document.createElement('canvas');c.width=c.height=size;
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,size,size);
    const d=ctx.getImageData(0,0,size,size).data;
    let pixels=0,minX=size,minY=size,maxX=-1,maxY=-1;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const p=(y*size+x)*4+3;if(d[p]>25){pixels++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}}
    ret.push({id:item.id,size,coverage:pixels/(size*size),w:(maxX-minX+1)/size,h:(maxY-minY+1)/size,
     corners:[d[3],d[4*(size-1)+3],d[(size-1)*size*4+3],d[d.length-1]]});
   }
  }
  return ret;
 },m.items);
 assert.equal(alpha.length,30);
 for(const a of alpha){
  assert(a.coverage>.16&&a.coverage<.80,'Transparent art coverage bad '+JSON.stringify(a));
  assert(a.w>.45&&a.h>.65,'Pet too tiny '+JSON.stringify(a));
  assert(a.corners.every(x=>x<25),'Painted-in tile/background '+JSON.stringify(a));
 }
 fs.writeFileSync(folder+'/qa.json',JSON.stringify({results:report,alpha,original_21_entries_immutable:true},null,2));
 console.log('UX105_V107_ART_ALPHA_PASS 30/30; TEN DIFFERENT ORIGINALS');
 await page.close();
}finally{await browser.close()}
})().catch(err=>{console.error('UX105_V107_RELEASE_GATE_FAIL',err.stack||err);process.exitCode=1});
