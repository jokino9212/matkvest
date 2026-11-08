'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path'), {chromium}=require('playwright');
const out='audits/ux00_badge_final_visual_output';fs.mkdirSync(out,{recursive:true});
const widths=[320,360,390,430,768,1280];
const ids=['bd_star','bd_diamond','bd_pi','bd_root','bd_sigma','bd_fraction','bd_infinity','bd_div_master','bd_fraction_master','bd_perfect','bd_control','bd_errors','bd_grade4','bd_grade5','bd_thousand','bd_equations','bd_comet','bd_geometry','bd_logic','bd_sprint','bd_orbit','bd_compass','bd_clock','bd_puzzle','bd_crown','bd_prism','bd_rocket','bd_chess','bd_spiral','bd_telescope','bd_abacus','bd_hourglass','bd_atom','bd_matrix','bd_phoenix','bd_magnet','bd_gear','bd_mountain','bd_key','bd_dragonfly','bd_lighthouse','bd_book','bd_owl','bd_sundial','bd_rune','bd_crystal','bd_satellite','bd_archimedes','bd_galaxy','bd_aurora'];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const results=[];
 try{
  for(const width of widths){
   const page=await browser.newPage({viewport:{width,height:width<500?740:850},isMobile:width<500,hasTouch:width<500});
   page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{state.coins=2000;shopRarityFilter='all';openShop('badges','all')});
   const shop=await page.evaluate(async()=>{
      const images=[...document.querySelectorAll('#modal img.mk-ux-badge-image')];
      await Promise.all(images.map(x=>x.decode().catch(()=>null)));
      return {ids:images.map(x=>x.getAttribute('src')?.split('/').pop()?.replace('.svg','')),
         unloaded:images.filter(x=>!x.complete||x.naturalWidth===0).map(x=>x.src),
         tooSmall:images.filter(x=>x.getBoundingClientRect().width<35||x.getBoundingClientRect().height<35).map(x=>({src:x.src,width:x.getBoundingClientRect().width})),
         documentOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
         modalOverflow:document.querySelector('#modal')?.scrollWidth>document.querySelector('#modal')?.clientWidth+4};
   });
   assert.equal(shop.ids.length,50,'shop count '+width);
   assert.deepEqual(new Set(shop.ids),new Set(ids),'shop ids '+width);
   assert.deepEqual(shop.unloaded,[],'shop image loads '+width);
   assert.deepEqual(shop.tooSmall,[],'shop image too small '+width);
   assert(!shop.documentOverflow,'horizontal overflow '+width);
   await page.screenshot({path:out+'/shop_'+width+'.png',animations:'disabled',fullPage:false});
   const collection=await page.evaluate(async()=>{
     state.inventory.badges=[...new Set([...(state.inventory.badges||[]),...SHOP_CATALOG.badges.map(x=>x.id)])];
     mk872CollectionTab='badges';openCollection();
     const images=[...document.querySelectorAll('#modal img.mk-ux-badge-image')];
     await Promise.all(images.map(x=>x.decode().catch(()=>null)));
     return {ids:images.map(x=>x.getAttribute('src')?.split('/').pop()?.replace('.svg','')),
       unloaded:images.filter(x=>!x.complete||x.naturalWidth===0).map(x=>x.src),
       tooSmall:images.filter(x=>x.getBoundingClientRect().width<35||x.getBoundingClientRect().height<35).map(x=>({src:x.src,width:x.getBoundingClientRect().width})),
       hasViewportOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2};
   });
   assert.equal(collection.ids.length,50,'collection count '+width+' '+JSON.stringify(collection));
   assert.deepEqual(new Set(collection.ids),new Set(ids));
   assert.deepEqual(collection.unloaded,[]);
   assert(!collection.hasViewportOverflow,'collection viewport overflow '+width);
   await page.screenshot({path:out+'/collection_'+width+'.png',animations:'disabled',fullPage:false});
   console.log('VISUAL_BADGE_PASS',width,JSON.stringify({shopCount:shop.ids.length,collectionCount:collection.ids.length,tooSmall:collection.tooSmall}));
   assert.deepEqual(errors,[],'browser errors '+width);
   results.push({width,shop,collection,errors});
   await page.close();
  }
  fs.writeFileSync(out+'/report.json',JSON.stringify({head:process.env.GITHUB_SHA||null,results},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
