'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const expected=[['bd_abacus','uncommon',195,5],['bd_hourglass','rare',285,7],['bd_atom','rare',355,8],['bd_matrix','epic',495,10],['bd_phoenix','legendary',780,13]];
const original={bd_star:55,bd_diamond:60,bd_pi:65,bd_root:75,bd_sigma:80,bd_fraction:90,bd_infinity:125,bd_comet:160,bd_geometry:240,bd_logic:360,bd_sprint:520,bd_orbit:190,bd_compass:275,bd_clock:330,bd_puzzle:425,bd_crown:650,bd_prism:215,bd_rocket:310,bd_chess:385,bd_spiral:465,bd_telescope:720};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const out='audits/ux08_badge_v86_output';fs.mkdirSync(out,{recursive:true});
 const results=[];
 try{
  for(const width of [320,390,768,1280]){
   console.log('UX086_BEGIN',width);
   const page=await browser.newPage({viewport:{width,height:width<500?740:850},isMobile:width<500,hasTouch:width<500});
   page.setDefaultTimeout(16000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const before=await page.evaluate(()=>{
    const all=SHOP_CATALOG.badges;
    const ids=all.map(x=>x.id);
    return {count:all.length,unique:new Set(ids).size,items:all.map(x=>({id:x.id,name:x.name,price:x.price,rarity:x.rarity,level:x.level,rewardOnly:!!x.rewardOnly,src:x.icon?.match(/src="([^"]+)"/)?.[1]||''}))};
   });
   assert.equal(before.count,35);assert.equal(before.unique,35);
   for(const [id,rarity,price,level] of expected){
    const item=before.items.find(x=>x.id===id);
    assert(item,'Missing '+id);
    assert.deepEqual([item.rarity,item.price,item.level,item.rewardOnly],[rarity,price,level,false]);
    assert(item.src.endsWith('/'+id+'.svg'),'Wrong art for '+id);
   }
   for(const [id,price] of Object.entries(original))assert.equal(before.items.find(x=>x.id===id)?.price,price);
   assert.equal(before.items.filter(x=>x.rewardOnly).length,9);
   await page.evaluate(()=>{
     state.coins=3500;state.xp=50000;shopRarityFilter='all';openShop('badges','all');
   });
   const shop=await page.evaluate(async()=>{
    const imgs=[...document.querySelectorAll('#modal img.mk-ux-badge-image')];
    await Promise.all(imgs.map(img=>img.decode().catch(()=>null)));
    return {rendered:imgs.length,broken:imgs.filter(x=>x.naturalWidth===0).map(x=>x.src),
       overflows:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
       total:document.querySelectorAll('#modal .shop-card').length};
   });
   assert.equal(shop.rendered,35,'Shop missing artworks '+width+' '+JSON.stringify(shop));
   assert.deepEqual(shop.broken,[]);
   assert(!shop.overflows,'Horizontal scrolling '+width);
   await page.screenshot({path:out+'/shop_'+width+'.png',animations:'disabled',timeout:13500});
   const purchase=await page.evaluate(()=>{
    const id='bd_abacus';const p=catalogItem('badges',id),start=state.coins;
    const wasOwned=state.inventory.badges.includes(id);const spentBefore=state.shopStats?.spent||0;
    if(wasOwned)state.inventory.badges=state.inventory.badges.filter(x=>x!==id);
    buyShopItem('badges',id);
    return {id,initial:start,final:state.coins,owned:state.inventory.badges.includes(id),price:p.price,wasOwned,spentDelta:(state.shopStats?.spent||0)-spentBefore};
   });
   assert(!purchase.wasOwned,'Fixture already owned');assert(purchase.owned,'Purchase did not persist');
   assert.equal(purchase.spentDelta,purchase.price,'Shop purchase ledger did not charge catalog price');
   assert(purchase.final>=purchase.initial-purchase.price,'Player charged more than catalog price');
   console.log('UX086_PURCHASE_LEDGER',width,JSON.stringify(purchase));
   const collection=await page.evaluate(async()=>{
     state.inventory.badges=[...new Set([...(state.inventory.badges||[]),...SHOP_CATALOG.badges.map(x=>x.id)])];
     mk872CollectionTab='badges';openCollection();
     const imgs=[...document.querySelectorAll('#modal img.mk-ux-badge-image')];
     await Promise.all(imgs.map(x=>x.decode().catch(()=>null)));
     return {count:imgs.length,ids:[...new Set(imgs.map(x=>x.getAttribute('src')?.split('/').pop()?.replace('.svg','')))],broken:imgs.filter(x=>x.naturalWidth===0).map(x=>x.src),
       overflows:document.documentElement.scrollWidth>document.documentElement.clientWidth+2};
   });
   assert.equal(collection.ids.length,35,'35 unique collection artworks: '+JSON.stringify(collection));assert.deepEqual(collection.broken,[]);assert(!collection.overflows);
   await page.screenshot({path:out+'/collection_'+width+'.png',animations:'disabled',timeout:13500});
   assert.deepEqual(errors,[],'JavaScript errors '+width);
   results.push({width,shop,purchase,collection,errors});
   console.log('UX086_PASS',width,JSON.stringify({shop:shop.rendered,collection:collection.count,purchase}));
   await page.close();
  }
  fs.writeFileSync(out+'/result.json',JSON.stringify(results,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
