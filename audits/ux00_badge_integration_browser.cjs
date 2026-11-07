'use strict';
const assert=require('node:assert/strict');
const path=require('node:path'),{chromium}=require('playwright'),fs=require('node:fs');
const expected={
 bd_star:['common',55],bd_diamond:['common',60],bd_pi:['common',65],
 bd_root:['uncommon',75],bd_sigma:['uncommon',80],bd_fraction:['uncommon',90],bd_infinity:['rare',125],
 bd_div_master:['rare',0],bd_fraction_master:['legendary',0],bd_perfect:['legendary',0],
 bd_control:['legendary',0],bd_errors:['legendary',0],bd_grade4:['epic',0],
 bd_grade5:['legendary',0],bd_thousand:['legendary',0],bd_equations:['rare',0]
};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const output=[];fs.mkdirSync('audits/ux00_badge_integration_output',{recursive:true});
 try{
  for(const width of [390,1280]){console.log('GATE_BEGIN',width);
   const page=await browser.newPage({viewport:{width,height:width<=390?740:850},isMobile:width<768,hasTouch:width<768});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   page.setDefaultTimeout(15000);await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded',timeout:30000});console.log('GATE_PAGE_READY',width);
   const meta=await page.evaluate(()=>{
     return SHOP_CATALOG.badges.map(b=>({id:b.id,name:b.name,rarity:b.rarity,price:b.price,src:b.icon?.match(/src="([^"]+)"/)?.[1]||null}));
   });
   assert.equal(meta.length,16);
   for(const row of meta){const exp=expected[row.id];assert(exp,JSON.stringify(row));assert.equal(row.rarity,exp[0]);assert.equal(row.price,exp[1]);assert.equal(row.src,'assets/source/badges/prototypes/'+row.id+'.svg')}
   await page.evaluate(()=>{state.coins=1200;openShop('badges','all')});
   await page.locator('#modal .mk-ux-badge-image').first().waitFor({timeout:10000});console.log('GATE_SHOP_READY',width);
   const shop=await page.evaluate(async()=>{
    const nodes=[...document.querySelectorAll('#modal .mk-ux-badge-image')];
    await Promise.race([Promise.all(nodes.map(i=>i.decode().catch(()=>null))),new Promise((_,reject)=>setTimeout(()=>reject(new Error('badge images decode timeout')),10000))]);
    return {count:nodes.length,broken:nodes.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src')),
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      samples:nodes.slice(0,3).map(i=>({w:i.getBoundingClientRect().width,h:i.getBoundingClientRect().height,src:i.getAttribute('src')}))}
   });
   assert(shop.count>=7,'Missing purchasable badges '+JSON.stringify(shop));
   assert.deepEqual(shop.broken,[],'Unloaded shop badges');
   assert(shop.samples.every(x=>x.w>=25&&x.h>=25),'Badge rendered too small in shop '+JSON.stringify(shop));
   console.log('GATE_SHOP_CHECKED',width,JSON.stringify(shop));await page.screenshot({path:'audits/ux00_badge_integration_output/shop_'+width+'.png',animations:'disabled',timeout:15000});
   const owned=await page.evaluate(()=>{
     state.inventory.badges=[...new Set([...(state.inventory.badges||[]),'bd_star','bd_pi','bd_div_master','bd_perfect'])];
     mk872CollectionTab='badges';openCollection();
     return {owned:mk872CollectionOwned('badges').length,renderCount:document.querySelectorAll('#modal .mk-ux-badge-image').length,visible:document.querySelector('#modal')?.innerText?.slice(0,150)};
   });
   assert(owned.owned>=4,JSON.stringify(owned));
   assert(owned.renderCount>=4,'Collection missing art '+JSON.stringify(owned));
   console.log('GATE_COLLECTION_CHECKED',width,JSON.stringify(owned));await page.screenshot({path:'audits/ux00_badge_integration_output/collection_'+width+'.png',animations:'disabled',timeout:15000});
   assert.deepEqual(errors,[],'JS errors at '+width+'px: '+JSON.stringify(errors));
   output.push({width,shop,owned,errors});
   await page.close();
  }
  fs.writeFileSync('audits/ux00_badge_integration_output/results.json',JSON.stringify(output,null,2));
  console.log('BADGE_INTEGRATION_PASS',JSON.stringify(output));
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
