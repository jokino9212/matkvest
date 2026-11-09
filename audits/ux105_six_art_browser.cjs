'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const man=JSON.parse(fs.readFileSync('audits/ux105_new_pets_manifest.json','utf8'));
const old=JSON.parse(fs.readFileSync('audits/ux105_baseline_pets.json','utf8')).items;
const six=man.items.filter(x=>x.status==='candidate_art_created_pending_review');
const missing=man.items.filter(x=>x.status==='planned');
assert.equal(six.length,6,'Six original artwork candidates expected');
assert.equal(missing.length,4,'Four art files are deliberately missing');
assert(man.artwork.art_approval==='pending'&&man.artwork.accepted_count===0);
assert(fs.readFileSync('sw.js','utf8').includes('matkvest-iphone-v106'),'No app release allowed');
assert(!fs.readFileSync('index.html','utf8').includes('id="mk-ux105-ten-original-pets"'));
const SHAs=new Set();
for(const pet of six) {
 const data=fs.readFileSync(pet.asset);
 assert(data.subarray(0,4).toString()==='RIFF'&&data.subarray(8,12).toString()==='WEBP',pet.id);
 assert(data.length>20000&&data.length<350000);
 assert.equal(data.length,pet.candidate_size_bytes,pet.id);
 const digest=crypto.createHash('sha256').update(data).digest('hex');
 assert.equal(digest,pet.sha256,pet.id);
 assert(!SHAs.has(digest));SHAs.add(digest);
}
for(const pet of missing)assert(!fs.existsSync(pet.asset),'Unexpected unknown artwork '+pet.id);
const folder='audits/ux105_six_art_output';fs.mkdirSync(folder,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={status:'6/10 source candidates present; 0/10 approved; NOT PUBLISHED',sizes:[],alpha:[]};
 try{
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:850},isMobile:width<500,hasTouch:width<500});
   const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const meta=await page.evaluate(list=>{
     const before=SHOP_CATALOG.pets.map(x=>({id:x.id,name:x.name,price:x.price,rarity:x.rarity,level:x.level,rewardOnly:!!x.rewardOnly}));
     for(const p of list) {
       if(SHOP_CATALOG.pets.some(x=>x.id===p.id))throw new Error('Item ID already exists '+p.id);
       SHOP_CATALOG.pets.push({...p,icon:'<img class="emoji-fallback-img mk-ux103-pet-image mk-ux103-premium-image" alt="" loading="eager" decoding="async" src="'+p.asset+'">'});
     }
     const profile=ensureProfileIdentity({...EMPTY_STATE,coins:9000,xp:30000,
       inventory:{...(EMPTY_STATE.inventory||{}),pets:['pet_none',...list.map(x=>x.id)]},
       equipped:{...(EMPTY_STATE.equipped||{}),pet:list.at(-1).id}});
     profiles={'UX105 SIX CANDIDATES':profile};currentProfile='UX105 SIX CANDIDATES';state=profile;
     openShop('pets','all');
     return {before,counts:[SHOP_CATALOG.pets.length,SHOP_CATALOG.avatars.length,SHOP_CATALOG.badges.length,SHOP_CATALOG.stickers.length]};
   },six);
   assert.deepEqual(meta.before,old,'Existing item metadata changed');
   assert.deepEqual(meta.counts,[27,55,50,40]);
   for(const p of six){
     const src=p.asset;
     const el=page.locator('#modal .shop-icon img[src="'+src+'"]').first();
     assert.equal(await el.count(),1,'Candidate art absent from test shop '+p.id);
     const r=await el.evaluate(async x=>{
       await x.decode();const box=x.getBoundingClientRect();
       return {native:[x.naturalWidth,x.naturalHeight],wh:[box.width,box.height],fit:getComputedStyle(x).objectFit};
     });
     assert.deepEqual(r.native,[640,640],'Wrong candidate dimensions');
     assert(r.wh[0]>35&&Math.abs(r.wh[0]-r.wh[1])<2&&r.fit==='contain','Card size wrong '+p.id);
     if(width===320){
       await page.locator('#modal .shop-icon').filter({has:page.locator('img[src="'+src+'"]')}).first().click();
       await page.waitForFunction(()=>document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
       assert(await page.locator('#mk872AvatarViewer img[src="'+src+'"]').count()>0,'Fullscreen wrong source '+p.id);
       await page.keyboard.press('Escape');
       await page.waitForFunction(()=>!document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
     }
   }
   await page.screenshot({path:folder+'/six_shop_'+width+'.png',animations:'disabled'});
   await page.evaluate(()=>{mk872CollectionTab='pets';openCollection()});
   for(const p of six){
     const i=page.locator('#modal img[src="'+p.asset+'"]');
     assert(await i.count()>0,'Candidate missing from temporary collection '+p.id);
   }
   await page.evaluate(()=>openLeaderboard());
   const id=six.at(-1).id;
   assert(await page.locator('#modal .leader-table img[src="assets/candidates/pets/'+id+'.webp"]').count()>0,
     'Equipped candidate pet missing from leaderboard');
   assert(!await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2),'Horizontal overflow '+width);
   assert.deepEqual(errors,[],'Unexpected JavaScript error '+width);
   report.sizes.push({width,shop:6,collection:6,leaderboard:true,zoom:width===320,errors:0});
   console.log('UX105_SIX_WEBP_REAL_UI_PASS',JSON.stringify(report.sizes.at(-1)));
   await page.close();
  }
  const gallery=await browser.newPage({viewport:{width:1450,height:900}});
  await gallery.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const alpha=await gallery.evaluate(async items=>{
   const checks=[];
   for(const p of items){
     const img=new Image();img.src=p.asset;await img.decode();
     if(img.naturalWidth!==640||img.naturalHeight!==640)throw Error('Wrong pixel dimensions '+p.id);
     for(const size of [48,128,384]){
       const c=document.createElement('canvas');c.width=c.height=size;
       const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,size,size);
       const data=ctx.getImageData(0,0,size,size).data;
       let coverage=0;for(let k=3;k<data.length;k+=4)if(data[k]>25)coverage++;
       checks.push({id:p.id,size,coverage:coverage/(size*size),corners:[data[3],data[4*(size-1)+3],data[4*size*(size-1)+3],data[data.length-1]]});
     }
   }
   return checks;
  },six);
  assert.equal(alpha.length,18);
  for(const a of alpha){
   assert(a.coverage>.19&&a.coverage<.80,'Bad silhouette coverage '+JSON.stringify(a));
   assert(a.corners.every(c=>c<18),'Art has nontransparent tile '+JSON.stringify(a));
  }
  report.alpha=alpha;
  fs.writeFileSync(folder+'/qa.json',JSON.stringify(report,null,2));
  console.log('UX105_SIX_WEBP_ALPHA_PASS',JSON.stringify({originals:six.length,checks:alpha.length}));
  await gallery.close();
 }finally{await browser.close()}
})().catch(e=>{console.error('UX105_SIX_WEBP_QA_FAIL',e.stack||e);process.exitCode=1});
