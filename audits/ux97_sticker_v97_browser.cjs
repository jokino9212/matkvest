'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const dir='audits/ux97_sticker_v97_output';fs.mkdirSync(dir,{recursive:true});
const ids=['st_pi','st_star','st_rocket','st_lightning','st_cube','st_planet','st_trophy','st_crown','st_sigma','st_root','st_percent','st_divide','st_times','st_equals','st_delta','st_pi2','st_x2','st_approx','st_fraction','st_degree','st_orbit','st_fire','st_crystal','st_bolt2','st_star2','st_royal','st_infinity','st_golden_pi','st_master10','st_grade4','st_control_perfect'];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:820},isMobile:width<500,hasTouch:width<500});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const baseline=await page.evaluate(ids=>{
   const items=SHOP_CATALOG.stickers;
   const p=ensureProfileIdentity({...EMPTY_STATE,coins:10000,xp:50000,
    inventory:{...(EMPTY_STATE.inventory||{}),stickers:items.map(x=>x.id)},
    equipped:{...(EMPTY_STATE.equipped||{}),stickers:['st_star2','st_royal','st_infinity']}});
   profiles={'Тест стикеров':p};currentProfile='Тест стикеров';state=p;
   return {catalog:items.length,ids:items.filter(x=>ids.includes(x.id)).map(x=>x.id),
    badges:SHOP_CATALOG.badges.length,images:items.filter(x=>x.icon.includes('mk-ux94-sticker-image')).length,
    special:items.filter(x=>ids.includes(x.id)).map(x=>({id:x.id,rarity:x.rarity,price:x.price,src:x.icon.match(/src="([^"]+)/)?.[1]}))};
  },ids);
  console.log('UX96_BASELINE',width,JSON.stringify(baseline));
  assert.equal(baseline.catalog,31);
  assert.equal(baseline.badges,50);
  assert.equal(baseline.images,31);
  assert.deepEqual(new Set(baseline.ids),new Set(ids));
  for(const a of baseline.special)assert.equal(a.src,'assets/source/stickers/'+a.id+'.svg');
  await page.evaluate(()=>openLeaderboard());
  const leader=await page.evaluate(async()=>{
   const stickers=[...document.querySelectorAll('.leader-table .favorite-sticker')];
   await Promise.all(stickers.flatMap(x=>[...x.querySelectorAll('img')]).map(x=>x.decode().catch(()=>null)));
   return stickers.map(x=>{const r=x.getBoundingClientRect();const img=x.querySelector('img');return {
    width:r.width,height:r.height,src:img?.getAttribute('src')?.slice(0,85),
    loaded:img?img.naturalWidth>0:true,overflow:x.scrollWidth>Math.ceil(r.width)+1}});
  });
  assert.equal(leader.length,3);
  assert(leader.every(x=>Math.abs(x.height-x.width)<1&&x.height>=29&&x.height<=35&&x.loaded&&!x.overflow),
   'Sticker profile sizing '+width+' '+JSON.stringify(leader));
  await page.screenshot({path:dir+'/leader_'+width+'.png',animations:'disabled'});
  const profile=await page.evaluate(()=>{
   const host=document.createElement('section');host.id='ux94ProfileFixture';
   host.innerHTML=profileIdentityCardHtml(state,currentProfile,{action:false});document.body.append(host);
   return [...host.querySelectorAll('.favorite-sticker')].map(x=>x.getBoundingClientRect().width);
  });
  assert.equal(profile.length,3);assert(profile.every(x=>x>=29&&x<=35),'Profile sticker dimensions '+JSON.stringify(profile));
  await page.evaluate(()=>document.getElementById('ux94ProfileFixture').remove());
  await page.evaluate(()=>openShop('stickers'));
  const shop=await page.evaluate(async()=>{
   const imgs=[...document.querySelectorAll('#modal .shop-icon img.mk-ux94-sticker-image')];
   await Promise.all(imgs.map(x=>x.decode().catch(()=>null)));
   return {count:document.querySelectorAll('#modal .shop-grid .shop-card').length,images:imgs.length,
    broken:imgs.filter(x=>x.naturalWidth<=0).map(x=>x.src),
    overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2};
  });
  assert.equal(shop.count,31);
  assert.equal(shop.images,31);
  assert.deepEqual(shop.broken,[]);assert(!shop.overflow,'Body overflow '+width);
  await page.screenshot({path:dir+'/shop_'+width+'.png',animations:'disabled'});
  await page.evaluate(()=>{toggleFavoriteSticker('st_infinity');toggleFavoriteSticker('st_golden_pi')});
  const favorite=await page.evaluate(()=>state.equipped.stickers);
  assert.deepEqual(favorite,['st_star2','st_royal','st_golden_pi'],'Favorite toggling lost original semantics');
  await page.evaluate(()=>{mk872CollectionTab='stickers';openCollection()});
  const collection=await page.evaluate(()=>{
    const content=document.querySelector('#modal')?.innerHTML||'';
    return {count:document.querySelectorAll('#modal img.mk-ux94-sticker-image').length,
     selected:document.querySelectorAll('#modal .favorite-sticker').length,
     item:content.includes('st_star2.svg')};
  });
  assert(collection.count>=3,'Collection does not contain sticker SVG '+JSON.stringify(collection));
  await page.screenshot({path:dir+'/collection_'+width+'.png',animations:'disabled'});
  assert.deepEqual(errors,[]);
  console.log('UX97_STICKER_V97_PASS',width,JSON.stringify({leader,shop,collection}));
  await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
