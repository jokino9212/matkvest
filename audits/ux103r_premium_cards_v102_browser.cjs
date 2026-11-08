'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const out='audits/ux103r_real_pet_cards_output';fs.mkdirSync(out,{recursive:true});
const ids=['pet_phoenix','pet_orb','pet_ghost'];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:840},isMobile:width<500,hasTouch:width<500});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
   const p=ensureProfileIdentity({...EMPTY_STATE,coins:11000,xp:100000,
    inventory:{...(EMPTY_STATE.inventory||{}),pets:['pet_none']},
    equipped:{...(EMPTY_STATE.equipped||{}),pet:'pet_none'}});
   profiles={'UX103 mini QA':p};currentProfile='UX103 mini QA';state=p;
   openShop('pets','all');
  });
  const cards=[];
  for(const id of ids){
   const icon=page.locator('#modal .shop-icon').filter({
     has:page.locator('img.mk-ux103-pet-image[src="assets/source/pets/'+id+'.webp"]')
   }).first();
   assert.equal(await icon.count(),1,'Missing pet card '+id);
   const data=await icon.evaluate(async(el,id)=>{
      const image=el.querySelector('img[src="assets/source/pets/'+id+'.webp"]');
      await image.decode();
      const r=image.getBoundingClientRect(),parent=el.getBoundingClientRect(),card=el.closest('.shop-card')?.getBoundingClientRect();
      return {id,loaded:image.naturalWidth===640,area:{w:r.width,h:r.height},
       icon:{w:parent.width,h:parent.height},cardW:card?.width,
       contain:getComputedStyle(image).objectFit,overflow:r.width>parent.width+2};
   },id);
   assert(data.loaded,'Broken image '+id);
   assert(data.area.w>=38&&data.area.h>=38,'Pet too tiny in actual store card '+JSON.stringify(data));
   assert(Math.abs(data.area.w-data.area.h)<2,'Pet squashed '+JSON.stringify(data));
   assert(data.area.w<=data.icon.w+2&&!data.overflow,'Pet exceeds store card '+JSON.stringify(data));
   assert.equal(data.contain,'contain');
   cards.push(data);
   await icon.locator('..').screenshot({path:out+'/card_'+id+'_'+width+'.png',animations:'disabled'});
  }
  assert.deepEqual(errors,[],'Page errors');
  console.log('UX103R_REAL_PET_CARDS_PASS',JSON.stringify({width,cards}));
  await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('UX103R_REAL_PET_CARDS_FAIL',e.stack||e);process.exitCode=1});
