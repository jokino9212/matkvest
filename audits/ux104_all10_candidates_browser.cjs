'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require('playwright');
const output='audits/ux104_all10_output';
fs.mkdirSync(output,{recursive:true});
const m1=JSON.parse(fs.readFileSync('audits/ux104_batch1_manifest.json','utf8'));
const m2=JSON.parse(fs.readFileSync('audits/ux104_batch2_manifest.json','utf8'));
const m3=JSON.parse(fs.readFileSync('audits/ux104_batch3_manifest.json','utf8'));
const firstHashes={
 pet_bot:'f352dd29dbbcea07e15d5a8b69ae03e7f4286a977c490e2672badbc625efc113',
 pet_owl:'4bfaaa6e118047f59081c679bf7161217f8ddb8f0e9d2996468ae5aa84e6ad1d',
 pet_penguin:'96c726213840a2b03db6f3f000b80d236f3a09e7fc16c16ba313f7d236127ec2'
};
const records=[...m1.items,...m2.candidates,...m3.items].map(x=>({
 id:x.id,name:x.name,price:x.price,rarity:x.rarity,level:x.level,avatar:x.avatar_duplicate,
 sha:x.sha256||firstHashes[x.id],
 src:'assets/candidates/pets/'+x.id+'.webp'
}));
const expectedIds=['pet_bot','pet_owl','pet_penguin','pet_dino','pet_cat','pet_dragon','pet_fox','pet_turtle','pet_tiger','pet_astronaut'];
assert.deepEqual(records.map(x=>x.id),expectedIds);
assert([m1,m2,m3].every(m=>m.art_acceptance.status==='pending_visual_review'));
const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
assert(sw.includes('matkvest-iphone-v102'));
assert(records.every(x=>!html.includes(x.src)&&!sw.includes(x.src)),'Unapproved source found in active app');
const knownShas=[];
for(const x of records){
 const b=fs.readFileSync(x.src);
 assert.equal(b.subarray(0,4).toString('latin1'),'RIFF',x.id);
 assert.equal(b.subarray(8,12).toString('latin1'),'WEBP',x.id);
 assert(b.length>=20000&&b.length<=400000,x.id+' size');
 const sha=crypto.createHash('sha256').update(b).digest('hex');
 assert.equal(sha,x.sha,'SHA mismatch '+x.id);
 knownShas.push(sha);
}
assert.equal(new Set(knownShas).size,10,'Ten distinct premium art candidates required');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={status:'read_only_visual_preview_not_user_approved',records:records.map(x=>({id:x.id,sha:x.sha})),screens:[],alpha:[]};
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:830},isMobile:width<500,hasTouch:width<500});
  const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const details=await page.evaluate(list=>{
   const fields=['id','name','price','rarity','level','rewardOnly','achievement'];
   const originals=[];
   for(const r of list){
     const same=SHOP_CATALOG.pets.filter(x=>x.id===r.id);
     if(same.length!==1)throw Error('Missing or duplicated '+r.id);
     const p=same[0],avatar=SHOP_CATALOG.avatars.find(x=>x.id===r.avatar);
     if(!avatar)throw Error('Missing original avatar '+r.avatar);
     const snapshot=Object.fromEntries(fields.map(k=>[k,p[k]??null]));
     const prev=avatar.icon;
     p.icon='<img class="emoji-fallback-img mk-ux103-pet-image mk-ux103-premium-image" alt="" loading="eager" decoding="async" src="'+r.src+'">';
     const snapshot2=Object.fromEntries(fields.map(k=>[k,p[k]??null]));
     originals.push({before:snapshot,after:snapshot2,avatarUntouched:avatar.icon===prev});
   }
   const p=ensureProfileIdentity({...EMPTY_STATE,coins:12000,xp:50000,
      inventory:{...(EMPTY_STATE.inventory||{}),pets:['pet_none',...list.map(x=>x.id)]},
      equipped:{...(EMPTY_STATE.equipped||{}),pet:'pet_astronaut'}});
   profiles={'UX104 ALL10 PREVIEW':p};currentProfile='UX104 ALL10 PREVIEW';state=p;
   openShop('pets','all');
   return {counts:[SHOP_CATALOG.pets.length,SHOP_CATALOG.avatars.length,SHOP_CATALOG.badges.length,SHOP_CATALOG.stickers.length],originals};
  },records);
  assert.deepEqual(details.counts,[21,55,50,40]);
  for(let i=0;i<records.length;i++){
    const orig=details.originals[i],r=records[i];
    assert.deepEqual(orig.before,orig.after,'Mutated economy or ID '+r.id);
    assert(orig.avatarUntouched,'Mutated original avatar '+r.id);
    for(const f of ['id','name','price','rarity','level'])assert.equal(orig.before[f],r[f],r.id+'.'+f);
  }
  const shop=[];
  for(const item of records){
    const image=page.locator('#modal .shop-icon img[src="'+item.src+'"]').first();
    assert.equal(await image.count(),1,'Missing shop card '+item.id);
    const details=await image.evaluate(async el=>{
     await el.decode();const rc=el.getBoundingClientRect();
     return {w:el.naturalWidth,h:el.naturalHeight,cssW:rc.width,cssH:rc.height,fit:getComputedStyle(el).objectFit};
    });
    assert(details.w===640&&details.h===640&&details.cssW>=38&&Math.abs(details.cssW-details.cssH)<2, 'Bad shop art '+item.id);
    shop.push({id:item.id,cssW:+details.cssW.toFixed(2)});
    if(width===320){
      await page.locator('#modal .shop-icon').filter({has:page.locator('img[src="'+item.src+'"]')}).first().click();
      await page.waitForFunction(()=>document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
      const v=await page.evaluate(src=>{
       const img=document.querySelector('#mk872AvatarViewer .mk30-visual img[src="'+src+'"]');
       return {loaded:img?.naturalWidth===640,fit:img?getComputedStyle(img).objectFit:null};
      },item.src);
      assert(v.loaded&&v.fit==='contain','Fullscreen source wrong '+item.id);
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>!document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'));
    }
  }
  await page.screenshot({path:output+'/shop_all10_'+width+'.png',animations:'disabled'});
  await page.evaluate(()=>{mk872CollectionTab='pets';openCollection()});
  const col=await page.evaluate(async list=>{
    const imgs=list.map(r=>document.querySelector('#modal img[src="'+r.src+'"]'));
    await Promise.all(imgs.map(x=>x?.decode().catch(()=>null)));
    return imgs.map(x=>x?.naturalWidth===640);
  },records);
  assert(col.every(Boolean),'Some premium candidate missing in collection '+JSON.stringify(col));
  await page.evaluate(()=>openLeaderboard());
  assert(await page.locator('#modal .leader-table img[src="assets/candidates/pets/pet_astronaut.webp"]').count()>0,'Equipped astronaut missing in leaderboard');
  assert(!await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2),'Horizontal overflow '+width);
  assert.deepEqual(errors,[],'Unexpected JS errors '+width);
  report.screens.push({width,shop:shop.length,collection:col.length,leaderboard:true,jsErrors:0,horizontalOverflow:false});
  console.log('UX104_ALL10_REAL_APP_PASS',JSON.stringify({width,shop:shop.length,collection:col.length,leaderboard:true}));
  await page.close();
 }
 const gallery=await browser.newPage({viewport:{width:1500,height:800}});
 await gallery.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const input=records.map(r=>({...r,data:'data:image/webp;base64,'+fs.readFileSync(r.src).toString('base64')}));
 const art=await gallery.evaluate(async list=>{
  let results=[];
  for(const r of list){
   const img=new Image();img.src=r.data;await img.decode();
   if(img.naturalWidth!==640||img.naturalHeight!==640)throw Error('Wrong artwork size '+r.id);
   for(const size of [48,128,384]){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(img,0,0,size,size);
    const d=ctx.getImageData(0,0,size,size).data;
    let occupied=0,minX=size,minY=size,maxX=-1,maxY=-1;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const idx=(y*size+x)*4;if(d[idx+3]>28){occupied++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
    }
    results.push({id:r.id,size,coverage:occupied/(size*size),bboxW:(maxX-minX+1)/size,bboxH:(maxY-minY+1)/size,
     corners:[d[3],d[4*(size-1)+3],d[4*size*(size-1)+3],d[4*(size*size-1)+3]]});
   }
  }
  return results;
 },input);
 for(const m of art){
  const tall=m.id==='pet_astronaut'&&m.bboxW>=.52&&m.bboxH>=.86&&m.coverage>=.29;
  assert((m.bboxW>.59&&m.bboxH>.70)||tall, 'Too small mascot '+JSON.stringify(m));
  assert(m.coverage>.16&&m.coverage<.82,'Opaque background/tiny character '+JSON.stringify(m));
  assert(m.corners.every(a=>a<20),'Baked tile at corner '+JSON.stringify(m));
 }
 report.alpha=art;
 await gallery.evaluate(list=>{
  const root=document.createElement('main');
  root.style.cssText='padding:22px;color:#e8f1ff;background:#111c32;font-family:Arial,sans-serif';
  root.innerHTML='<h1 style="margin-top:0">МатКвест · UX-104 — все 10 оригинальных питомцев · художественная приёмка</h1><p>Кандидаты. Не опубликованы. Показаны в 48 / 128 / 384 пикселя на светлом и тёмном фоне.</p>';
  for(const sz of [48,128,384]){
    const label=document.createElement('h2');label.textContent=sz+'px';root.append(label);
    const grid=document.createElement('section');grid.style.cssText='display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px';
    for(const item of list){
      const card=document.createElement('div');card.style.cssText='border:1px solid #455b7a;border-radius:8px;overflow:hidden';
      const panels=document.createElement('div');panels.style.cssText='display:grid;grid-template-columns:1fr 1fr';
      for(const bg of ['#f0f5fc','#213557']){
        const panel=document.createElement('div');panel.style.cssText='background:'+bg+';height:'+Math.max(100,sz+16)+'px;display:grid;place-items:center;overflow:hidden';
        const im=document.createElement('img');im.src=item.src;im.style.cssText='width:'+sz+'px;height:'+sz+'px;max-width:95%;object-fit:contain';
        panel.append(im);panels.append(panel);
      }
      const footer=document.createElement('p');footer.style.cssText='text-align:center;margin:5px 0;font-size:12px';
      footer.textContent=item.name+' · '+item.price+' монет';
      card.append(panels,footer);grid.append(card);
    }
    root.append(grid);
  }
  document.body.replaceChildren(root);
 },records);
 await gallery.evaluate(async()=>Promise.all([...document.querySelectorAll('main img')].map(x=>x.decode())));
 await gallery.screenshot({path:output+'/all10_48_128_384_light_dark.png',fullPage:true,animations:'disabled'});
 await gallery.close();
 fs.writeFileSync(output+'/qa.json',JSON.stringify(report,null,2));
 console.log('UX104_ALL10_COMBINED_ALPHA_PASS',JSON.stringify({uniqueArt:records.length,alphaChecks:art.length,widths:report.screens.map(x=>x.width)}));
 }finally{await browser.close()}
})().catch(e=>{console.error('UX104_ALL10_BROWSER_GATE_FAIL',e.stack||e);process.exitCode=1});
