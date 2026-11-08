'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const asset='assets/candidates/pets/pet_bot.webp';
const out='audits/ux104_bot_candidate_output';fs.mkdirSync(out,{recursive:true});
const contents=fs.readFileSync(asset);
assert(contents.slice(0,4).toString()==='RIFF'&&contents.slice(8,12).toString()==='WEBP','Invalid real WebP');
assert(contents.length>30000&&contents.length<400000,'Asset size unusual');
const digest=crypto.createHash('sha256').update(contents).digest('hex');
assert.equal(digest,'f352dd29dbbcea07e15d5a8b69ae03e7f4286a977c490e2672badbc625efc113');
const sw=fs.readFileSync('sw.js','utf8');
assert(sw.includes('matkvest-iphone-v102'),'Do not audit from wrong staging release');
assert(!sw.includes(asset),'UNAPPROVED art must NOT be PWA precached');
assert(!fs.readFileSync('index.html','utf8').includes(asset),'UNAPPROVED art must NOT be in real catalog');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const qa={sha256:digest,bytes:contents.length,viewports:[]};
 try{
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:850},isMobile:width<500,hasTouch:width<500});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const metadata=await page.evaluate(asset=>{
     const item=SHOP_CATALOG.pets.find(p=>p.id==='pet_bot');
     const avatar=SHOP_CATALOG.avatars.find(a=>a.id==='av_robot');
     if(!item||!avatar)throw Error('Missing old pet or avatar');
     const before={id:item.id,name:item.name,rarity:item.rarity,price:item.price,level:item.level,
       rewardOnly:!!item.rewardOnly,achievement:item.achievement??null,oldIcon:String(item.icon).slice(0,200)};
     const avatarOriginal=String(avatar.icon);
     item.icon='<img class="emoji-fallback-img mk-ux103-pet-image mk-ux103-premium-image" alt="" loading="eager" decoding="async" src="'+asset+'">';
     const p=ensureProfileIdentity({...EMPTY_STATE,coins:12000,xp:50000,
       inventory:{...(EMPTY_STATE.inventory||{}),pets:['pet_none','pet_bot']},
       equipped:{...(EMPTY_STATE.equipped||{}),pet:'pet_bot'}});
     profiles={'Bot QA':p};currentProfile='Bot QA';state=p;openShop('pets','all');
     return {before,now:{id:item.id,name:item.name,rarity:item.rarity,price:item.price,level:item.level,
       rewardOnly:!!item.rewardOnly,achievement:item.achievement??null},avatarUntouched:String(avatar.icon)===avatarOriginal};
   },asset);
   for(const key of ['id','name','rarity','price','level','rewardOnly','achievement'])
    assert.deepEqual(metadata.now[key],metadata.before[key],'Changed immutable field '+key);
   assert.equal(metadata.before.price,240);assert.equal(metadata.before.rarity,'uncommon');assert.equal(metadata.before.level,3);
   assert(metadata.avatarUntouched);
   const selector='#modal .shop-icon img[src="'+asset+'"]';
   const card=page.locator(selector).first();
   assert.equal(await card.count(),1,'Shop card missing original bot');
   const dims=await card.evaluate(async(img)=>{
      await img.decode();
      const r=img.getBoundingClientRect(),outer=img.parentElement.getBoundingClientRect();
      return {natural:[img.naturalWidth,img.naturalHeight],
        css:[Number(r.width.toFixed(2)),Number(r.height.toFixed(2))],
        container:[Number(outer.width.toFixed(2)),Number(outer.height.toFixed(2))],
        objectFit:getComputedStyle(img).objectFit};
   });
   assert.deepEqual(dims.natural,[640,640],'Decode not genuine 640');
   assert(dims.css[0]>=38 && Math.abs(dims.css[0]-dims.css[1])<2,'Bad card sizing');
   await page.screenshot({path:out+'/shop_candidate_'+width+'.png',animations:'disabled'});
   await page.locator('#modal .shop-icon').filter({has:page.locator('img[src="'+asset+'"]')}).first().click();
   await page.waitForFunction(()=>document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
   const zoom=await page.evaluate(asset=>{
      const shell=document.querySelector('#mk872AvatarViewer');
      const img=shell?.querySelector('img[src="'+asset+'"]');
      const box=img?.getBoundingClientRect();
      return {loaded:img?.naturalWidth===640,width:box?.width,height:box?.height,
        fit:img?getComputedStyle(img).objectFit:null};
   },asset);
   assert(zoom.loaded&&zoom.width>=180&&zoom.fit==='contain'&&Math.abs(zoom.width-zoom.height)<2,
      'Bot zoom defective '+JSON.stringify(zoom));
   await page.screenshot({path:out+'/zoom_candidate_'+width+'.png',animations:'disabled'});
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>!document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
   await page.evaluate(()=>{mk872CollectionTab='pets';openCollection()});
   const collection=await page.evaluate(async(asset)=>{
      const img=document.querySelector('#modal img[src="'+asset+'"]');await img?.decode();
      return !!img&&img.naturalWidth===640;
   },asset);
   assert(collection,'Collection missed bot candidate');
   await page.evaluate(()=>openLeaderboard());
   assert(await page.locator('#modal .leader-table img[src="'+asset+'"]').count()>0,'Leader missed equipped bot');
   const viewport=await page.evaluate(()=>({w:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert(viewport.scroll<=viewport.w+2,'Mobile horizontal overflow');
   assert.deepEqual(errors,[]);
   qa.viewports.push({width,card:dims,zoom,collection,leader:true});
   console.log('UX104_BOT_CANDIDATE_PASS',JSON.stringify({width,card:dims,zoom,collection,leader:true}));
   await page.close();
  }
  const page=await browser.newPage({viewport:{width:1150,height:850}});
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const dataUrl='data:image/webp;base64,'+contents.toString('base64');
  const data=await page.evaluate(async(url)=>{
   const img=new Image();img.src=url;await img.decode();
   const sizes=[48,128,384],results=[];
   for(const size of sizes){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    const cx=canvas.getContext('2d',{willReadFrequently:true});cx.drawImage(img,0,0,size,size);
    const d=cx.getImageData(0,0,size,size).data;
    let count=0,minX=size,minY=size,maxX=-1,maxY=-1;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
     const i=(y*size+x)*4;if(d[i+3]>28){count++;minX=Math.min(x,minX);
     maxX=Math.max(x,maxX);minY=Math.min(y,minY);maxY=Math.max(y,maxY);}
    }
    const corners=[0,4*(size-1),4*size*(size-1),4*(size*size-1)].map(i=>d[i+3]);
    results.push({size,coverage:count/(size*size),fillW:(maxX-minX+1)/size,
     fillH:(maxY-minY+1)/size,corners});
   }
   return results;
  },dataUrl);
  for(const row of data){
   assert(row.coverage>.2&&row.coverage<.83,'Opaque tile or invisible character');
   assert(row.fillW>.7&&row.fillH>.7,'Character too small');
   assert(row.corners.every(a=>a<20),'Background has transparent-square issue');
  }
  qa.alpha=data;
  await page.evaluate((asset)=>{
    const main=document.createElement('main');main.style.cssText='background:#14243b;color:white;padding:24px;font-family:system-ui';
    main.innerHTML='<h1>UX-104 · Мини-бот · кандидат, не выпущен</h1><p>Оригинальный WebP · три размера · светлый/тёмный фон</p>';
    for(const size of [48,128,384]){
      const h=document.createElement('h2');h.textContent=size+'px';main.appendChild(h);
      const box=document.createElement('div');box.style.cssText='display:flex;gap:12px';
      for(const bg of ['#f3f6ff','#203451']){
       const surface=document.createElement('div');surface.style.cssText='width:450px;height:'+Math.max(size+30,96)+'px;background:'+bg+';display:grid;place-items:center;border-radius:12px';
       const image=document.createElement('img');image.src=asset;image.style.cssText='width:'+size+'px;height:'+size+'px;object-fit:contain';
       surface.append(image);box.append(surface);
      }
      main.append(box);
    }
    document.body.replaceChildren(main);
  },asset);
  await page.evaluate(async()=>Promise.all([...document.querySelectorAll('main img')].map(x=>x.decode())));
  await page.screenshot({path:out+'/bot_candidate_48_128_384_light_dark.png',fullPage:true,animations:'disabled'});
  fs.writeFileSync(out+'/candidate_qa.json',JSON.stringify(qa,null,2));
  console.log('UX104_BOT_ALPHA_PASS',JSON.stringify(data));
  await page.close();
 }finally{await browser.close()}
})().catch(e=>{console.error('UX104_BOT_CANDIDATE_FAIL',e.stack||e);process.exitCode=1});
