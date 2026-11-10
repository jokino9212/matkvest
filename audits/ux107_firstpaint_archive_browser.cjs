'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
assert(sw.includes('matkvest-iphone-v107'));
assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
const head=html.indexOf('</head>'),catalog=html.indexOf('const SHOP_CATALOG='),render=html.indexOf('function openShop(');
assert(head>0&&catalog>head&&render>catalog);
for(const id of ['mk-ux106-profile-badge-sizes','mk-ux103-pet-style','mk-ux105-pet-art-style'])
 assert(html.indexOf('id="'+id+'"')<head,'CSS is after first paint: '+id);
assert(html.indexOf('id="mk-ux107-boot-hydration"')>catalog&&html.indexOf('id="mk-ux107-boot-hydration"')<render);
assert(html.includes('<meta name="matkvest-release" content="v107">'));
assert(html.includes('id="mk-ux107-legacy-pet-archive"'));
assert(sw.includes('caches.open(CACHE_NAME).then(cache => cache.match(request))'),'Old cache could override new art');
const original=['pet_phoenix','pet_orb','pet_ghost','pet_bot','pet_owl','pet_penguin','pet_dino','pet_cat','pet_dragon','pet_fox','pet_turtle','pet_tiger','pet_astronaut'];
const newItems=JSON.parse(fs.readFileSync('audits/ux105_new_pets_manifest.json','utf8')).items;
const output='audits/ux107_firstpaint_archive_output';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
 for(const width of [320,390,900,1280]){
  const context=await browser.newContext({viewport:{width,height:880},isMobile:width<500,hasTouch:width<500});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const initial=await page.evaluate(({original,ids})=>{
   const p=SHOP_CATALOG.pets;
   return {length:p.length,
    originals:original.map(id=>({id,icon:p.find(x=>x.id===id)?.icon||''})),
    added:ids.map(id=>({id,icon:p.find(x=>x.id===id)?.icon||''})),
    badgeInHead:document.querySelector('head #mk-ux106-profile-badge-sizes')!==null,
    build:document.querySelector('meta[name="matkvest-release"]')?.content};
  },{original,ids:newItems.map(x=>x.id)});
  assert.equal(initial.length,31,'Lost or duplicate pet IDs');
  assert(initial.badgeInHead&&initial.build==='v107');
  for(const p of [...initial.originals,...initial.added]){
   assert(p.icon.includes('assets/source/pets/'+p.id+'.webp'),'Stale emoji or missing first-paint original art '+p.id);
  }
  // Persist a pre-v107 style purchased old pet, plus another existing pet.
  const seed=await page.evaluate(()=>{
   const p=ensureProfileIdentity({...EMPTY_STATE,xp:0,coins:620,
    inventory:{...(EMPTY_STATE.inventory||{}),pets:['pet_none','pet_cat','pet_owl']},
    equipped:{...(EMPTY_STATE.equipped||{}),pet:'pet_cat'}});
   mk865SetAcquisition(p,'pets','pet_cat','store',390,Date.now()-900000);
   profiles={'Архивный покупатель':p};currentProfile='Архивный покупатель';state=p;
   save();
   return {profileId:state.profileId,oldPet:state.equipped.pet,coins:state.coins,
    purchased:mk865Acquisition(state,'pets','pet_cat')};
  });
  assert.equal(seed.coins,620);
  assert.equal(seed.purchased.paidPrice,390);
  for(let attempt=0;attempt<3;attempt++){
   await page.reload({waitUntil:'domcontentloaded'});
   const inspect=await page.evaluate(()=>{
    const pet=SHOP_CATALOG.pets.find(x=>x.id==='pet_cat');
    const newPet=SHOP_CATALOG.pets.find(x=>x.id==='pet_axolotl');
    const pre=mk865SellEligibility('pets','pet_cat',state);
    openProfiles();
    return {oldIcon:pet?.icon,newIcon:newPet?.icon,coins:state.coins,
      pet:state.equipped.pet,profileId:state.profileId,canSell:pre.ok,refund:pre.refundNow,
      current:currentProfile,badges:document.querySelector('head #mk-ux106-profile-badge-sizes')!==null};
   });
   assert(inspect.oldIcon.includes('assets/source/pets/pet_cat.webp'),'Reload restored old drawing');
   assert(inspect.newIcon.includes('assets/source/pets/pet_axolotl.webp'),'Reload lost new drawing');
   assert.equal(inspect.coins,620);assert.equal(inspect.profileId,seed.profileId);
   assert.equal(inspect.pet,'pet_cat');assert.equal(inspect.canSell,true);
   assert.equal(inspect.refund,156);
   assert.equal(inspect.badges,true);
   assert.equal(inspect.current,'Архивный покупатель');
  }
  await page.evaluate(()=>{openCollection();mk873CollectionSwitch('archive')});
  const archive=await page.evaluate(()=>{
   const node=document.querySelector('#mk872CollectionContent');
   return {text:node?.textContent||'',action:!!node?.querySelector('.mk-ux107-old-pets button[onclick*="pet_cat"]'),
    avatars:typeof mk873ArchiveRows==='function'};
  });
  assert(archive.avatars&&archive.text.includes('История старых питомцев')&&archive.text.includes('Кот'),
   'Original purchased pet missing from archive history '+JSON.stringify(archive));
  assert(archive.action,'Legacy pet sale button missing');
  await page.screenshot({path:output+'/legacy_archive_'+width+'.png',animations:'disabled'});
  await page.evaluate(()=>mk865OpenSellDialog('pets','pet_cat'));
  assert(await page.locator('#mk865SaleOverlay').getByText('Продать сейчас').count()>0,'Existing refund dialog missing');
  await page.evaluate(()=>mk865SellItem('pets','pet_cat',0.4));
  const sold=await page.evaluate(()=>({coins:state.coins,inventory:state.inventory.pets.slice(),pet:state.equipped.pet,
   sales:state.saleHistory.filter(x=>x.type==='pets'&&x.id==='pet_cat').length}));
  assert.equal(sold.coins,776,'Not returning exactly 40% of 390 original paid coins');
  assert(!sold.inventory.includes('pet_cat')&&sold.inventory.includes('pet_owl'),'Other pet deleted during sale');
  assert.equal(sold.pet,'pet_none');assert.equal(sold.sales,1);
  await page.evaluate(()=>mk865SellItem('pets','pet_cat',0.4));
  assert.equal(await page.evaluate(()=>state.coins),776,'Double-credit old purchased pet');
  await page.reload({waitUntil:'domcontentloaded'});
  const persisted=await page.evaluate(()=>({coins:state.coins,pets:state.inventory.pets.slice(),
    history:state.saleHistory.filter(x=>x.type==='pets'&&x.id==='pet_cat').length}));
  assert.equal(persisted.coins,776);assert(!persisted.pets.includes('pet_cat'));assert.equal(persisted.history,1);
  assert.deepEqual(errors,[],'Javascript runtime errors after reload/archive');
  console.log('UX107_BOOT_ARCHIVE_SELL_AND_RELOAD_PASS',JSON.stringify({width,initialPetImages:23,reloads:3,refund:156,coinBalance:776,otherOldPetPreserved:true,headCssBeforeFirstPaint:true,noJsErrors:true}));
  await context.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('UX107_FIRSTPAINT_ARCHIVE_FAIL',e.stack||e);process.exitCode=1});
