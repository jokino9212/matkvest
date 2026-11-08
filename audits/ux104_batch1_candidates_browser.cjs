'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const dir='audits/ux104_batch1_candidate_output';fs.mkdirSync(dir,{recursive:true});
const records=[
 {id:'pet_bot',name:'Мини-бот',price:240,rarity:'uncommon',level:3,sha:'f352dd29dbbcea07e15d5a8b69ae03e7f4286a977c490e2672badbc625efc113'},
 {id:'pet_owl',name:'Сова',price:270,rarity:'uncommon',level:4,sha:'4bfaaa6e118047f59081c679bf7161217f8ddb8f0e9d2996468ae5aa84e6ad1d'},
 {id:'pet_penguin',name:'Пингвин',price:300,rarity:'rare',level:5,sha:'96c726213840a2b03db6f3f000b80d236f3a09e7fc16c16ba313f7d236127ec2'}
].map(x=>({...x,src:'assets/candidates/pets/'+x.id+'.webp'}));
const sw=fs.readFileSync('sw.js','utf8'),html=fs.readFileSync('index.html','utf8');
assert(sw.includes('matkvest-iphone-v102'),'Candidate QA expects unchanged v102 PWA');
assert(records.every(x=>!sw.includes(x.src)&&!html.includes(x.src)),'Unapproved candidate leaked into release');
for(const r of records){
 const b=fs.readFileSync(r.src);
 assert.equal(b.subarray(0,4).toString('latin1'),'RIFF');
 assert.equal(b.subarray(8,12).toString('latin1'),'WEBP');
 assert(b.length>30000&&b.length<200000,'Bad source size '+r.id);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),r.sha,'Hash mismatch '+r.id);
}
assert.equal(new Set(records.map(r=>r.sha)).size,3,'Three distinct originals required');
const baselineShas=['pet_phoenix','pet_orb','pet_ghost'].map(x=>
 crypto.createHash('sha256').update(fs.readFileSync('assets/source/pets/'+x+'.webp')).digest('hex'));
assert(records.every(r=>!baselineShas.includes(r.sha)),'Duplicate approved premium pet source');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={status:'candidate_not_approved',assets:records,art:[],responsive:[]};
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:830},isMobile:width<500,hasTouch:width<500});
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e.message||e)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const catalog=await page.evaluate(records=>{
    const itemKeys=['id','name','price','rarity','level','rewardOnly','achievement'];
    const originals=records.map(record=>{
      const row=SHOP_CATALOG.pets.find(p=>p.id===record.id);
      if(!row)throw Error('Missing '+record.id);
      const before=Object.fromEntries(itemKeys.map(k=>[k,k==='rewardOnly'?!!row[k]:k==='achievement'?(row[k]??null):row[k]]));
      const avatar=SHOP_CATALOG.avatars.find(a=>a.id===({'pet_bot':'av_robot','pet_owl':'av_owl','pet_penguin':'av_penguin'})[record.id]);
      const avatarIcon=String(avatar?.icon);
      row.icon='<img class="emoji-fallback-img mk-ux103-pet-image mk-ux103-premium-image" alt="" loading="eager" decoding="async" src="'+record.src+'">';
      const after=Object.fromEntries(itemKeys.map(k=>[k,k==='rewardOnly'?!!row[k]:k==='achievement'?(row[k]??null):row[k]]));
      return {before,after,avatarUnchanged:String(avatar.icon)===avatarIcon,src:record.src};
    });
    const p=ensureProfileIdentity({...EMPTY_STATE,coins:12000,xp:50000,
     inventory:{...(EMPTY_STATE.inventory||{}),pets:['pet_none',...records.map(x=>x.id)]},
     equipped:{...(EMPTY_STATE.equipped||{}),pet:'pet_bot'}});
    profiles={'UX104 ART QA':p};currentProfile='UX104 ART QA';state=p;
    openShop('pets','all');
    return {pets:SHOP_CATALOG.pets.length,avatars:SHOP_CATALOG.avatars.length,
     badges:SHOP_CATALOG.badges.length,stickers:SHOP_CATALOG.stickers.length,items:originals};
  },records);
  assert.deepEqual([catalog.pets,catalog.avatars,catalog.badges,catalog.stickers],[21,55,50,40]);
  for(let i=0;i<records.length;i++){
   const r=records[i],m=catalog.items[i];
   assert.deepEqual(m.before,m.after,'Metadata changed '+r.id);
   assert(m.avatarUnchanged,'Original avatar mutated '+r.id);
   for(const k of ['id','name','price','rarity','level'])assert.equal(m.after[k],r[k],'Item metadata '+r.id+'.'+k);
  }
  const shop=[];
  for(const r of records){
   const selector='#modal .shop-icon img[src="'+r.src+'"]';
   const img=page.locator(selector).first();
   assert.equal(await img.count(),1,'Missing shop illustration '+r.id);
   const dims=await img.evaluate(async image=>{
    await image.decode();const box=image.getBoundingClientRect();
    return {native:[image.naturalWidth,image.naturalHeight],css:[Number(box.width.toFixed(2)),Number(box.height.toFixed(2))],
      fit:getComputedStyle(image).objectFit};
   });
   assert.deepEqual(dims.native,[640,640],'Broken WebP '+r.id);
   assert(dims.css[0]>=38&&Math.abs(dims.css[0]-dims.css[1])<=2,'Bad thumbnail '+r.id);
   shop.push({id:r.id,...dims});
   await page.locator('#modal .shop-icon').filter({has:page.locator('img[src="'+r.src+'"]')}).first().click();
   await page.waitForFunction(()=>document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
   const view=await page.evaluate(src=>{
    const el=document.querySelector('#mk872AvatarViewer .mk30-visual img[src="'+src+'"]');
    const box=el?.getBoundingClientRect(),outer=el?.parentElement?.getBoundingClientRect();
    return {loaded:el?.naturalWidth===640,width:box?.width,height:box?.height,ratio:box?.width/outer?.width,
     fit:el?getComputedStyle(el).objectFit:null};
   },r.src);
   assert(view.loaded&&view.width>=200&&view.ratio>=.85&&view.fit==='contain'&&Math.abs(view.width-view.height)<3,
      'Bad fullscreen '+r.id+' '+JSON.stringify(view));
   if(width===320||width===390)await page.screenshot({path:dir+'/zoom_'+r.id+'_'+width+'.png',animations:'disabled'});
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>!document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
  }
  await page.screenshot({path:dir+'/shop_last_'+width+'.png',animations:'disabled'});
  await page.evaluate(()=>{mk872CollectionTab='pets';openCollection()});
  const collection=await page.evaluate(async records=>{
    const imgs=records.map(r=>document.querySelector('#modal img[src="'+r.src+'"]'));
    await Promise.all(imgs.map(i=>i?.decode().catch(()=>null)));
    return imgs.map(i=>!!i&&i.naturalWidth===640);
  },records);
  assert(collection.every(Boolean),'Candidate missing from collection');
  await page.evaluate(()=>openLeaderboard());
  assert(await page.locator('#modal .leader-table img[src="'+records[0].src+'"]').count()>0,'Equipped bot not in leaderboard');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2);
  assert(!overflow,'Overflow in candidate UX');
  assert.deepEqual(pageErrors,[],'Unexpected page JS errors');
  report.responsive.push({width,shop,collection,leader:true});
  console.log('UX104_THREE_PREMIUM_CANDIDATES_PASS',JSON.stringify({width,shop,collection,leader:true}));
  await page.close();
 }
 const artPage=await browser.newPage({viewport:{width:1500,height:900}});
 await artPage.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const inputs=records.map(r=>({...r,dataUrl:'data:image/webp;base64,'+fs.readFileSync(r.src).toString('base64')}));
 report.art=await artPage.evaluate(async inputs=>{
  const results=[];
  for(const item of inputs){
   const img=new Image();img.src=item.dataUrl;await img.decode();
   if(img.naturalWidth!==640||img.naturalHeight!==640)throw Error('Non-square '+item.id);
   for(const size of [48,128,384]){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(img,0,0,size,size);
    const d=ctx.getImageData(0,0,size,size).data;
    let pixels=0,minX=size,maxX=-1,minY=size,maxY=-1;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
     const n=(y*size+x)*4;if(d[n+3]>28){pixels++;minX=Math.min(minX,x);
      maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    }
    results.push({id:item.id,size,coverage:pixels/(size*size),bboxW:(maxX-minX+1)/size,
       bboxH:(maxY-minY+1)/size,
       corners:[d[3],d[4*(size-1)+3],d[4*(size*(size-1))+3],d[4*(size*size-1)+3]]});
   }
  }
  return results;
 },inputs);
 for(const m of report.art){
  assert(m.coverage>.16&&m.coverage<.82,'Opaque tile or invisible pet '+JSON.stringify(m));
  assert(m.bboxW>.60&&m.bboxH>.70,'Tiny character '+JSON.stringify(m));
  assert(m.corners.every(c=>c<20),'Background puddle '+JSON.stringify(m));
 }
 await artPage.evaluate(records=>{
   const root=document.createElement('main');
   root.style.cssText='padding:24px;font-family:Arial,system-ui;background:#15223c;color:#eaf7ff;min-height:100vh';
   root.innerHTML='<h1>МатКвест · UX104 · 3 премиальных кандидата (не опубликованы)</h1>';
   for(const size of [48,128,384]){
    const h=document.createElement('h2');h.textContent=size+'px · светлый/тёмный фон';root.append(h);
    const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:14px';
    for(const pet of records){
     const card=document.createElement('section');card.style.cssText='border:1px solid #64758d;border-radius:12px;overflow:hidden';
     const stage=document.createElement('div');stage.style.cssText='display:grid;grid-template-columns:1fr 1fr';
     for(const bg of ['#f0f5fc','#213557']){
      const col=document.createElement('div');col.style.cssText='min-height:'+Math.max(size+20,95)+'px;background:'+bg+';display:grid;place-items:center';
      const img=document.createElement('img');img.src=pet.src;img.style.cssText='width:'+size+'px;height:'+size+'px;max-width:100%;object-fit:contain';
      col.append(img);stage.append(col);
     }
     const title=document.createElement('div');title.textContent=pet.name+' · '+pet.price+' монет';
     title.style.cssText='font-size:13px;font-weight:bold;text-align:center;padding:8px';
     card.append(stage,title);row.append(card);
    }
    root.append(row);
   }
   document.body.replaceChildren(root);
 },records);
 await artPage.evaluate(async()=>Promise.all([...document.querySelectorAll('main img')].map(img=>img.decode())));
 await artPage.screenshot({path:dir+'/all_three_48_128_384_light_dark.png',fullPage:true,animations:'disabled'});
 console.log('UX104_THREE_PREMIUM_ALPHA_PASS',JSON.stringify(report.art));
 await artPage.close();
 fs.writeFileSync(dir+'/qa.json',JSON.stringify(report,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error('UX104_THREE_CANDIDATES_FAIL',e.stack||e);process.exitCode=1});
