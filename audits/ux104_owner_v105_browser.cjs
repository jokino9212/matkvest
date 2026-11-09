'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const ids=['pet_bot','pet_owl','pet_penguin','pet_dino','pet_cat','pet_dragon','pet_fox','pet_turtle','pet_tiger','pet_astronaut'];
const m=[1,2,3].map(n=>JSON.parse(fs.readFileSync('audits/ux104_batch'+n+'_manifest.json','utf8')));
assert(m.every(x=>x.art_acceptance.status==='approved'),'Art SHA-256 approval missing');
const records=[...m[0].items,...m[1].candidates,...m[2].items];
assert.deepEqual(records.map(x=>x.id),ids);
const html=fs.readFileSync('index.html'),sw=fs.readFileSync('sw.js','utf8');
assert(sw.includes('matkvest-iphone-v105'));
assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')),'PWA app hash does not match');
const first={
pet_bot:'f352dd29dbbcea07e15d5a8b69ae03e7f4286a977c490e2672badbc625efc113',
pet_owl:'4bfaaa6e118047f59081c679bf7161217f8ddb8f0e9d2996468ae5aa84e6ad1d',
pet_penguin:'96c726213840a2b03db6f3f000b80d236f3a09e7fc16c16ba313f7d236127ec2'
};
for(let i=0;i<records.length;i++){
 const p=records[i],b=fs.readFileSync('assets/source/pets/'+p.id+'.webp');
 const digest=crypto.createHash('sha256').update(b).digest('hex');
 const exp=p.sha256||first[p.id];
 assert.equal(digest,exp,p.id);
 assert.equal(m[i<3?0:i<6?1:2].art_acceptance.accepted_sha256[p.id],digest);
 assert.equal(b.subarray(0,4).toString(),'RIFF');
 assert.equal(b.subarray(8,12).toString(),'WEBP');
 assert(sw.includes('./assets/source/pets/'+p.id+'.webp'),'SW failed to precache '+p.id);
}
assert.equal(new Set(records.map(p=>p.id)).size,10);
const output='audits/ux104_owner_v105_output';fs.mkdirSync(output,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:830},isMobile:width<500,hasTouch:width<500});
  const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const meta=await page.evaluate(list=>{
    const cats=SHOP_CATALOG;
    const p=ensureProfileIdentity({...EMPTY_STATE,coins:12000,xp:50000,
      inventory:{...(EMPTY_STATE.inventory||{}),pets:['pet_none',...list.map(i=>i.id)]},
      equipped:{...(EMPTY_STATE.equipped||{}),pet:'pet_astronaut'}});
    profiles={'UX104 LIVE QA':p};currentProfile='UX104 LIVE QA';state=p;
    openShop('pets','all');
    return {
     counts:[cats.pets.length,cats.avatars.length,cats.badges.length,cats.stickers.length],
     matched:list.map(i=>{const row=cats.pets.find(x=>x.id===i.id);
      return {id:row?.id,name:row?.name,price:row?.price,rarity:row?.rarity,level:row?.level,
       source:row?.icon?.match(/src="([^"]+)"/)?.[1]||null}}),
    };
  },records);
  assert.deepEqual(meta.counts,[21,55,50,40],'Catalog counts changed');
  for(let i=0;i<records.length;i++){
    const p=records[i],actual=meta.matched[i],src='assets/source/pets/'+p.id+'.webp';
    for(const field of ['id','name','price','rarity','level'])assert.equal(actual[field],p[field],p.id+'.'+field);
    assert.equal(actual.source,src,'Real SHOP_CATALOG still shows duplicate/avatar art '+p.id);
    const img=page.locator('#modal .shop-icon img[src="'+src+'"]').first();
    assert.equal(await img.count(),1,'Actual shop card art missing '+p.id);
    const dims=await img.evaluate(async x=>{await x.decode();const r=x.getBoundingClientRect();
      return {native:[x.naturalWidth,x.naturalHeight],w:r.width,h:r.height,fit:getComputedStyle(x).objectFit}});
    assert.deepEqual(dims.native,[640,640]);
    assert(dims.w>=38&&Math.abs(dims.w-dims.h)<=2&&dims.fit==='contain');
    if(width===320){
      await page.locator('#modal .shop-icon').filter({has:page.locator('img[src="'+src+'"]')}).first().click();
      await page.waitForFunction(()=>document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
      const viewer=await page.evaluate(source=>{
       const x=document.querySelector('#mk872AvatarViewer .mk30-visual img[src="'+source+'"]');
       return {loaded:x?.naturalWidth===640,fit:x?getComputedStyle(x).objectFit:null};
      },src);
      assert(viewer.loaded&&viewer.fit==='contain','Wrong fullscreen image '+p.id);
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>!document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
    }
  }
  await page.screenshot({path:output+'/shop_'+width+'.png',animations:'disabled'});
  await page.evaluate(()=>{mk872CollectionTab='pets';openCollection()});
  const collection=await page.evaluate(async list=>{
    const imgs=list.map(p=>document.querySelector('#modal img[src="assets/source/pets/'+p.id+'.webp"]'));
    await Promise.all(imgs.map(x=>x?.decode().catch(()=>{})));
    return imgs.map(x=>x?.naturalWidth===640);
  },records);
  assert(collection.every(Boolean),'Missing actual collection art');
  await page.evaluate(()=>openLeaderboard());
  assert(await page.locator('#modal .leader-table img[src="assets/source/pets/pet_astronaut.webp"]').count()>0,'Equipped pet wrong in leaderboard');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2);
  assert(!overflow,'Horizontal overflow '+width);
  assert.deepEqual(errors,[],'JavaScript errors '+width);
  console.log('PASS_UX104_REAL_V105_ALL10',JSON.stringify({width,shop:10,collection:10,leaderboard:true,zeroJsErrors:true,noOverflow:true}));
  await page.close();
 }
}finally{await browser.close()}
})().catch(e=>{console.error('FAIL_UX104_REAL_V105_ALL10',e.stack||e);process.exitCode=1});
