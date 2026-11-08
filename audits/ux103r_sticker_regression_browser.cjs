'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const out='audits/ux103r_40_sticker_output';fs.mkdirSync(out,{recursive:true});
const newOnes=[
 ['st_pencil','common',28,1],['st_heart','common',33,2],['st_target','common',36,2],
 ['st_hourglass','uncommon',46,3],['st_magnifier','uncommon',47,3],
 ['st_joystick','rare',61,5],['st_robot','rare',63,5],
 ['st_portal','epic',82,7],['st_phoenix','legendary',125,10]];
const oldPrices={st_pi:25,st_star:30,st_rocket:35,st_lightning:40,st_cube:45,
 st_planet:50,st_trophy:55,st_crown:70,st_sigma:28,st_root:32,
 st_percent:34,st_divide:34,st_times:34,st_equals:20,st_delta:38,st_pi2:42,
 st_x2:42,st_approx:42,st_fraction:44,st_degree:48,st_orbit:52,st_fire:54,
 st_crystal:58,st_bolt2:66,st_star2:64,st_royal:72,st_infinity:95,
 st_golden_pi:110,st_master10:0,st_grade4:0,st_control_perfect:0};
const sw=fs.readFileSync('sw.js','utf8');
assert(sw.includes('matkvest-iphone-v102'),'PWA cache did not advance to v102');
const hash=crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
assert(sw.includes('APP_BUILD_HASH = "'+hash+'"'),'SW HTML fingerprint diverged');
for(const [id] of newOnes){
 const f='assets/source/stickers/'+id+'.svg';
 assert(fs.existsSync(f),'Sticker asset missing '+id);
 assert(sw.includes('./'+f),'Offline precache missing '+id);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const summary=[];
 try {
 for(const width of [320,360,390,430,768,1280]){
  const page=await browser.newPage({viewport:{width,height:830},isMobile:width<=430,hasTouch:width<=430});
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e.message||e)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const catalog=await page.evaluate(()=>{
   const a=SHOP_CATALOG.stickers;
   return {length:a.length,unique:new Set(a.map(x=>x.id)).size,
    badges:SHOP_CATALOG.badges.length,avatars:SHOP_CATALOG.avatars.length,
    items:a.map(x=>({id:x.id,name:x.name,price:x.price,rarity:x.rarity,
      level:x.level,rewardOnly:!!x.rewardOnly,achievement:x.achievement||null,
      src:x.icon?.match(/src="([^"]+)"/)?.[1]||''}))};
  });
  assert.equal(catalog.length,40,'Sticker count '+width);
  assert.equal(catalog.unique,40,'Duplicate sticker ID');
  assert.equal(catalog.badges,50);assert.equal(catalog.avatars,55);
  assert.equal(catalog.items.filter(x=>x.rewardOnly).length,3,'Reward stickers changed');
  for(const [id,price] of Object.entries(oldPrices))
   assert.equal(catalog.items.find(x=>x.id===id)?.price,price,'Legacy price changed '+id);
  for(const [id,rarity,price,level] of newOnes){
   const x=catalog.items.find(x=>x.id===id);
   assert(x,'New sticker missing '+id);
   assert.deepEqual([x.rarity,x.price,x.level,x.rewardOnly],[rarity,price,level,false],'Wrong new tier '+id);
  }
  assert.deepEqual(catalog.items.filter(x=>x.rewardOnly).map(x=>x.achievement).sort(),
   ['controlPerfect','grade4','master10'].sort(),'Reward achievements changed');
  assert(catalog.items.every(x=>x.src==='assets/source/stickers/'+x.id+'.svg'),
   'Legacy or new sticker is not a real vector');
  await page.evaluate(()=>{
   const p=ensureProfileIdentity({...EMPTY_STATE,coins:20000,xp:50000,
     inventory:{...(EMPTY_STATE.inventory||{}),stickers:SHOP_CATALOG.stickers.map(x=>x.id)},
     equipped:{...(EMPTY_STATE.equipped||{}),stickers:['st_pencil','st_robot','st_phoenix']}});
   profiles={'UX103 learner':p};currentProfile='UX103 learner';state=p;
   shopRarityFilter='all';openShop('stickers');
  });
  const shop=await page.evaluate(async()=>{
   const imgs=[...document.querySelectorAll('#modal .shop-icon img.mk-ux94-sticker-image')];
   await Promise.all(imgs.map(x=>x.decode().catch(()=>null)));
   return {cards:document.querySelectorAll('#modal .shop-grid .shop-card').length,imgs:imgs.length,
    broken:imgs.filter(x=>x.naturalWidth<=0).map(x=>x.getAttribute('src')),
    width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth};
  });
  assert.equal(shop.cards,40,'Shop hides sticker items '+width);
  assert.equal(shop.imgs,40,'Shop icon missing '+width);
  assert.deepEqual(shop.broken,[],'Shop broken image '+width);
  assert(shop.scroll<=shop.width+2,'Shop horizontally overflows viewport '+width);
  await page.screenshot({path:out+'/shop_'+width+'.png',animations:'disabled',timeout:18000});
  const before=await page.evaluate(()=>{
   const names=state.equipped.stickers.slice();
   toggleFavoriteSticker('st_pencil');
   toggleFavoriteSticker('st_portal');
   return {before:names,after:state.equipped.stickers.slice()};
  });
  assert.deepEqual(before.before,['st_pencil','st_robot','st_phoenix']);
  assert.deepEqual(before.after,['st_robot','st_phoenix','st_portal']);
  await page.evaluate(()=>openLeaderboard());
  const leader=await page.evaluate(async()=>{
   const tokens=[...document.querySelectorAll('#modal .favorite-sticker')];
   await Promise.all(tokens.map(x=>x.querySelector('img')?.decode().catch(()=>null)));
   return tokens.map(x=>{const r=x.getBoundingClientRect();const img=x.querySelector('img');
     return {width:r.width,height:r.height,src:img?.getAttribute('src'),
       loaded:img?.naturalWidth>0,overflow:x.scrollWidth>Math.ceil(r.width)+1}});
  });
  assert.equal(leader.length,3,'Three favorites not in leaderboard');
  assert(leader.every(x=>x.loaded&&!x.overflow&&Math.abs(x.width-x.height)<=1&&x.width>=29&&x.width<=35),
    'Leaderboard layout broken '+JSON.stringify(leader));
  await page.screenshot({path:out+'/leader_'+width+'.png',animations:'disabled',timeout:18000});
  await page.evaluate(()=>{mk872CollectionTab='stickers';openCollection()});
  const collection=await page.evaluate(async()=>{
    const imgs=[...document.querySelectorAll('#modal img.mk-ux94-sticker-image')];
    await Promise.all(imgs.map(x=>x.decode().catch(()=>null)));
    return {images:imgs.length,newItems:['st_pencil','st_heart','st_target','st_hourglass',
      'st_magnifier','st_joystick','st_robot','st_portal','st_phoenix'].filter(id=>imgs.some(img=>
      img.getAttribute('src')==='assets/source/stickers/'+id+'.svg')),
      broken:imgs.filter(x=>x.naturalWidth<=0).map(x=>x.getAttribute('src')),
      viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth};
  });
  assert.equal(collection.newItems.length,9,'Collection not displaying nine new SVG stickers');
  assert.deepEqual(collection.broken,[]);
  assert(collection.scroll<=collection.viewport+2,'Collection overflows viewport');
  await page.screenshot({path:out+'/collection_'+width+'.png',animations:'disabled',timeout:18000});
  const purchased=await page.evaluate(()=>{
    // Remove ownership of one paid item to exercise the actual purchase path.
    const id='st_pencil';state.inventory.stickers=state.inventory.stickers.filter(x=>x!==id);
    const coins=state.coins,spent=state.shopStats?.spent||0;
    buyShopItem('stickers',id);
    const after={owned:state.inventory.stickers.includes(id),coins:state.coins,
      spent:state.shopStats?.spent||0};
    return {coins,spent,after,price:catalogItem('stickers',id).price};
  });
  assert(purchased.after.owned,'Purchase did not grant new sticker');
  assert.equal(purchased.after.spent-purchased.spent,purchased.price,'Purchase ledger price incorrect');
  assert.equal(purchased.after.coins,purchased.coins-purchased.price,'Coins not deducted correctly');
  assert.deepEqual(pageErrors,[],'Page JS errors at width '+width);
  summary.push({width,shop,collection,leader,purchased});
  console.log('UX103R_STICKERS_40_PASS',JSON.stringify({width,shop,collection,purchase:purchased}));
  await page.close();
 }
 fs.writeFileSync(out+'/browser_qa.json',JSON.stringify(summary,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error('UX103R_STICKER_FAIL',e.stack||e);process.exitCode=1});
