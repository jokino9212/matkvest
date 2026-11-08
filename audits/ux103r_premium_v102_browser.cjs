'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto'),{chromium}=require('playwright');
const ids=['pet_phoenix','pet_orb','pet_ghost'];
const expected={pet_phoenix:{price:820,rarity:'epic'},pet_orb:{price:1050,rarity:'legendary'},pet_ghost:{price:1500,rarity:'legendary'}};
const out='audits/ux103r_premium_v102_output';
fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync('index.html'),sw=fs.readFileSync('sw.js','utf8');
assert(sw.includes('matkvest-iphone-v101'),'PWA v101 absent');
assert(sw.includes('APP_BUILD_HASH = "'+crypto.createHash('sha256').update(html).digest('hex')+'"'),'HTML/SW hash mismatch');
for(const id of ids){
 const src='assets/source/pets/'+id+'.webp';
 assert(sw.includes('./'+src),'SVG missing from PWA precache '+id);
 const text=fs.readFileSync(src,'utf8');
 assert(text.includes('viewBox="0 0 512 512"'),'Wrong artboard '+id);
 assert(/aria-label="[^"]+"/.test(text),'Missing accessible art description '+id);
 assert(!/<script\b|<foreignObject\b|onload\s*=|onerror\s*=|href\s*=|http:\/\//i.test(text.replace(/http:\/\/www\.w3\.org\/2000\/svg/g,'')),'Unsafe pet SVG '+id);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const summary=[];
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:810},isMobile:width<500,hasTouch:width<500});
  const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const catalog=await page.evaluate(()=>{
    const pets=SHOP_CATALOG.pets;
    return {total:pets.length,real:pets.filter(x=>x.id!=='pet_none').length,
      keys:pets.map(x=>x.id),items:pets.map(x=>({id:x.id,name:x.name,price:x.price,rarity:x.rarity,
        level:x.level,rewardOnly:!!x.rewardOnly,achievement:x.achievement||null,
        src:x.icon?.match(/src="([^"]+)"/)?.[1]||'',icon:String(x.icon||'').slice(0,220)}))};
  });
  assert.equal(catalog.total,21);assert.equal(catalog.real,20);
  assert.equal(new Set(catalog.keys).size,21,'Duplicate pet IDs');
  const initial=catalog.items.filter(x=>ids.includes(x.id));
  assert.equal(initial.length,3);
  for(const item of initial){
    assert.equal(item.price,expected[item.id].price);assert.equal(item.rarity,expected[item.id].rarity);
    assert.equal(item.src,'assets/source/pets/'+item.id+'.webp','Incorrect artwork path '+item.id);
    assert(!item.rewardOnly,'Purchase reward status changed '+item.id);
  }
  await page.evaluate(ids=>{
    const p=ensureProfileIdentity({...EMPTY_STATE,coins:12000,xp:100000,
      inventory:{...(EMPTY_STATE.inventory||{}),pets:['pet_none',...ids]},
      equipped:{...(EMPTY_STATE.equipped||{}),pet:'pet_phoenix'}});
    profiles={'UX103 ученик':p};currentProfile='UX103 ученик';state=p;
    openShop('pets','all');
  },ids);
  const shop=await page.evaluate(async ids=>{
    const images=ids.map(id=>document.querySelector('#modal img[src="assets/source/pets/'+id+'.webp"]'));
    await Promise.all(images.map(i=>i?.decode().catch(()=>null)));
    return {cards:document.querySelectorAll('#modal .shop-grid .shop-card').length,
      images:images.map((img,i)=>({id:ids[i],loaded:!!img&&img.naturalWidth===640&&img.naturalHeight===640,
        width:img?.getBoundingClientRect().width||0,height:img?.getBoundingClientRect().height||0})),
      viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth};
  },ids);
  assert.equal(shop.cards,21,'Shop pet count changed');
  assert(shop.images.every(x=>x.loaded),'A pet illustration did not render '+JSON.stringify(shop.images));
  assert(shop.scroll<=shop.viewport+2,'Shop horizontal viewport overflow');
  await page.screenshot({path:out+'/shop_'+width+'.png',animations:'disabled'});
  const viewer=[];
  for(const id of ids){
    const icon=page.locator('#modal .shop-icon').filter({
      has:page.locator('img.mk-ux103-pet-image[src="assets/source/pets/'+id+'.webp"]')
    }).first();
    assert.equal(await icon.count(),1,'Missing shop click target '+id+' '+width);
    await icon.click({timeout:8000});
    await page.waitForFunction(()=>document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'),null,{timeout:2500});
    const v=await page.evaluate(id=>{
      const shell=document.querySelector('#mk872AvatarViewer'), root=shell?.querySelector('.mk30-visual'),
        img=root?.querySelector('img[src="assets/source/pets/'+id+'.webp"]');
      const r=img?.getBoundingClientRect(),parent=img?.parentElement,pr=parent?.getBoundingClientRect();
      return {open:shell?.classList.contains('mk872-open'),title:document.querySelector('#mk872ViewerTitle')?.textContent?.trim(),
        exists:!!img,loaded:img?.naturalWidth===640,source:img?.getAttribute('src')||'',
        rect:r?{width:r.width,height:r.height}:null,container:pr?{width:pr.width,height:pr.height}:null,
        objectFit:img?getComputedStyle(img).objectFit:null,
        background:parent?getComputedStyle(parent).backgroundColor:null,border:parent?getComputedStyle(parent).borderTopWidth:null};
    },id);
    assert(v.open&&v.exists&&v.loaded,'Fullscreen viewer did not display '+id+' '+JSON.stringify(v));
    assert.equal(v.objectFit,'contain','Incorrect viewer fit '+id);
    assert(Math.abs(v.rect.width-v.rect.height)<3,'Image distorted '+id+' '+JSON.stringify(v));
    assert(v.rect.width/v.container.width>=.86,'Artwork too small '+id+' '+JSON.stringify(v));
    assert.equal(v.background,'rgba(0, 0, 0, 0)','Pet viewer acquired background tile '+id);
    assert.equal(v.border,'0px','Pet viewer acquired an inner border '+id);
    viewer.push({id,...v});
    await page.screenshot({path:out+'/zoom_'+id+'_'+width+'.png',animations:'disabled'});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'),null,{timeout:2500});
  }
  await page.evaluate(()=>{mk872CollectionTab='pets';openCollection()});
  const collection=await page.evaluate(async ids=>{
    const imgs=ids.map(id=>document.querySelector('#modal img[src="assets/source/pets/'+id+'.webp"]'));
    await Promise.all(imgs.map(img=>img?.decode().catch(()=>null)));
    return {all:imgs.map((img,i)=>({id:ids[i],found:!!img,loaded:img?.naturalWidth===640})),
      overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2};
  },ids);
  assert(collection.all.every(x=>x.found&&x.loaded),'Collection missing illustrated pet '+JSON.stringify(collection));
  assert(!collection.overflow,'Collection overflow');
  await page.screenshot({path:out+'/collection_'+width+'.png',animations:'disabled'});
  await page.evaluate(()=>openLeaderboard());
  const leaderboard=await page.evaluate(()=>{
    const row=document.querySelector('#modal .leader-table');
    const imgs=[...row?.querySelectorAll('img.mk-ux103-pet-image')||[]];
    return {images:imgs.map(x=>x.getAttribute('src')),html:row?.innerHTML.slice(0,650)};
  });
  assert(leaderboard.images.includes('assets/source/pets/pet_phoenix.webp'),
    'Leaderboard does not show newly equipped pet '+JSON.stringify(leaderboard));
  await page.screenshot({path:out+'/leader_'+width+'.png',animations:'disabled'});
  const purchase=await page.evaluate(()=>{
    state.inventory.pets=state.inventory.pets.filter(x=>x!=='pet_ghost');
    const coins=state.coins,spent=state.shopStats?.spent||0;
    buyShopItem('pets','pet_ghost');
    return {owned:state.inventory.pets.includes('pet_ghost'),before:coins,after:state.coins,
      spentBefore:spent,spentAfter:state.shopStats?.spent||0};
  });
  console.log('UX103_PURCHASE_DIAGNOSTIC',width,JSON.stringify(purchase));
  assert(purchase.owned,'Pet purchase failed');
  // Purchase may also grant a one-time account bonus (observed +83 coins); the ledger must charge exactly 1500.
  assert(purchase.after>=purchase.before-1500 && purchase.after<purchase.before,
    'Pet purchase overcharged or was not charged at all '+JSON.stringify(purchase));
  assert.equal(purchase.spentAfter-purchase.spentBefore,1500,'Pet inventory worth/shop ledger incorrect');
  assert.deepEqual(errors,[],'JavaScript errors '+width);
  summary.push({width,shop,collection,leaderboard:leaderboard.images,purchase,viewer});
  console.log('UX103R_PREMIUM_V102_PASS',JSON.stringify({width,shop,collection,leaderboard:leaderboard.images,
    purchased:purchase,viewer:viewer.map(({id,title,source,objectFit})=>({id,title,source,objectFit}))}));
  await page.close();
 }
 fs.writeFileSync(out+'/functional_qa.json',JSON.stringify(summary,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error('UX103R_PREMIUM_V102_FAIL',e.stack||e);process.exitCode=1});
