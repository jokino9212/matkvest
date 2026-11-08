'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const meta=JSON.parse(fs.readFileSync('audits/ux104_batch1_manifest.json','utf8'));
const items=meta.items,ids=items.map(x=>x.id);
const out='audits/ux104_batch1_v103_output';fs.mkdirSync(out,{recursive:true});
const sw=fs.readFileSync('sw.js','utf8');
assert(sw.includes('matkvest-iphone-v103'),'Candidate must be v103');
assert(sw.includes(crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex')),'PWA fingerprint changed');
for(const i of items){
 assert(sw.includes('./'+i.asset),'PWA does not precache '+i.id);
 const b=fs.readFileSync(i.asset);
 assert(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP','Not a genuine WebP '+i.id);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const baselinePage=await browser.newPage();
  await baselinePage.goto('file://'+path.resolve('baseline_v102/index.html'),{waitUntil:'domcontentloaded'});
  const baseline=await baselinePage.evaluate(()=>{
   const catalog=SHOP_CATALOG;
   const projection=x=>({id:x.id,name:x.name,price:x.price,rarity:x.rarity,level:x.level,
    rewardOnly:!!x.rewardOnly,achievement:x.achievement||null});
   return {pets:catalog.pets.map(projection),avatars:catalog.avatars.map(x=>({id:x.id,icon:x.icon})),
    stickers:catalog.stickers.map(projection),badges:catalog.badges.map(projection)};
  });
  await baselinePage.close();
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:820},isMobile:width<500,hasTouch:width<500});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const actual=await page.evaluate(()=>{
    const catalog=SHOP_CATALOG;
    const projection=x=>({id:x.id,name:x.name,price:x.price,rarity:x.rarity,level:x.level,
     rewardOnly:!!x.rewardOnly,achievement:x.achievement||null});
    return {pets:catalog.pets.map(projection),avatars:catalog.avatars.map(x=>({id:x.id,icon:x.icon})),
      stickers:catalog.stickers.map(projection),badges:catalog.badges.map(projection),
      changed:catalog.pets.filter(x=>['pet_bot','pet_owl','pet_penguin'].includes(x.id))
       .map(x=>({id:x.id,src:x.icon?.match(/src="([^"]+)"/)?.[1]||''}))};
   });
   assert.deepEqual(actual.pets,baseline.pets,'Pet identity/economy changed');
   assert.deepEqual(actual.avatars,baseline.avatars,'Original avatars changed');
   assert.deepEqual(actual.stickers,baseline.stickers,'Existing stickers changed');
   assert.deepEqual(actual.badges,baseline.badges,'Existing badges changed');
   assert.equal(actual.pets.length,21);assert.equal(actual.avatars.length,55);
   assert.equal(actual.stickers.length,40);assert.equal(actual.badges.length,50);
   for(const i of items)assert.equal(actual.changed.find(x=>x.id===i.id)?.src,i.asset);
   await page.evaluate(ids=>{
    const p=ensureProfileIdentity({...EMPTY_STATE,coins:10000,xp:50000,
      inventory:{...(EMPTY_STATE.inventory||{}),pets:['pet_none',...ids]},
      equipped:{...(EMPTY_STATE.equipped||{}),pet:ids[0]}});
    profiles={'UX104 student':p};currentProfile='UX104 student';state=p;openShop('pets','all');
   },ids);
   const shop=await page.evaluate(async items=>{
    const icons=items.map(item=>document.querySelector('#modal .shop-card img[src="'+item.asset+'"]'));
    await Promise.all(icons.map(x=>x?.decode().catch(()=>null)));
    return {details:icons.map((img,i)=>({id:items[i].id,decoded:img?.naturalWidth===640&&img?.naturalHeight===640,
      width:img?.getBoundingClientRect().width||0,height:img?.getBoundingClientRect().height||0})),
      viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth};
   },items);
   assert(shop.details.every(x=>x.decoded&&x.width>=38),'Broken artwork/shop scaling '+JSON.stringify(shop));
   assert(shop.scroll<=shop.viewport+2,'Horizontal overflow in pet store');
   await page.screenshot({path:out+'/shop_'+width+'.png',animations:'disabled'});
   for(const item of items){
    const trigger=page.locator('#modal .shop-icon').filter({has:page.locator('img[src="'+item.asset+'"]')}).first();
    assert.equal(await trigger.count(),1);
    await trigger.click();
    await page.waitForFunction(()=>document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
    const v=await page.evaluate(src=>{
      const root=document.querySelector('#mk872AvatarViewer .mk30-visual');
      const img=root?.querySelector('img[src="'+src+'"]');
      const parent=img?.parentElement,rect=img?.getBoundingClientRect(),outer=parent?.getBoundingClientRect();
      return {loaded:img?.naturalWidth===640,src:img?.getAttribute('src'),
        width:rect?.width,height:rect?.height,ratio:rect?.width/outer?.width,
        background:parent?getComputedStyle(parent).backgroundColor:null,
        border:parent?getComputedStyle(parent).borderTopWidth:null};
    },item.asset);
    assert(v.loaded&&v.ratio>=.85&&Math.abs(v.width-v.height)<2,'Wrong fullscreen '+item.id+' '+JSON.stringify(v));
    assert.equal(v.background,'rgba(0, 0, 0, 0)');assert.equal(v.border,'0px');
    await page.screenshot({path:out+'/zoom_'+item.id+'_'+width+'.png',animations:'disabled'});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
   }
   await page.evaluate(()=>{mk872CollectionTab='pets';openCollection()});
   const collection=await page.evaluate(async items=>{
    const images=items.map(i=>document.querySelector('#modal img[src="'+i.asset+'"]'));
    await Promise.all(images.map(x=>x?.decode().catch(()=>null)));
    return images.map(x=>!!x&&x.naturalWidth===640);
   },items);
   assert(collection.every(Boolean),'Collection does not show unique new pets');
   await page.evaluate(()=>openLeaderboard());
   const lead=await page.evaluate(src=>!!document.querySelector('#modal .leader-table img[src="'+src+'"]'),items[0].asset);
   assert(lead,'Leaderboard did not use equipped pet original art');
   assert.deepEqual(errors,[],'Javascript errors in v103 at '+width);
   console.log('UX104_BATCH1_V103_PASS',JSON.stringify({width,shop,collection,lead,prices:actual.changed.map(i=>i.id)}));
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('UX104_BATCH1_V103_FAIL',e.stack||e);process.exitCode=1});
