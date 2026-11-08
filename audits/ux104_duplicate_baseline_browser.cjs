'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const out='audits/ux104_preflight_output';fs.mkdirSync(out,{recursive:true});
const pairs=[
 ['pet_bot','av_robot'],['pet_owl','av_owl'],['pet_penguin','av_penguin'],
 ['pet_dino','av_dino'],['pet_cat','av_cat'],['pet_dragon','av_dragon'],
 ['pet_fox','av_fox'],['pet_turtle','av_turtle'],['pet_tiger','av_tiger'],
 ['pet_astronaut','av_astronaut']
];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={phase:'UX-104',staging:'v102',pairs:[],readme:'Inspect actual rendered pet vs avatar artwork; baseline register SHA agreement is the immutable source of duplicate facts.'};
 try{
 const page=await browser.newPage({viewport:{width:1480,height:940},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const data=await page.evaluate(pairs=>{
   const actual=SHOP_CATALOG.pets.filter(x=>x.id!=='pet_none');
   const avatars=SHOP_CATALOG.avatars;
   const read=(x)=>x?{id:x.id,name:x.name,rarity:x.rarity,price:x.price,level:x.level,
     rewardOnly:!!x.rewardOnly,achievement:x.achievement||null,raw:String(x.icon||'')}:null;
   return {petCount:actual.length,avatarCount:avatars.length,dupes:pairs.map(([pet,avatar])=>({
     pet:read(actual.find(x=>x.id===pet)),avatar:read(avatars.find(x=>x.id===avatar))
   }))};
 },pairs);
 assert.equal(data.petCount,20);assert.equal(data.avatarCount,55);
 assert(data.dupes.every(x=>x.pet&&x.avatar),'Missing ID in known duplicate list');
 const baseline=fs.readFileSync('audits/UX_UI_ASSET_REGISTER.csv','utf8');
 const byId={};
 for(const line of baseline.split(/\r?\n/)){
  const c=line.match(/^"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"/);
  if(c)byId[c[2]]={category:c[1],sha:c[8],name:c[3],price:Number(c[5])};
 }
 for(const item of data.dupes){
  const p=byId[item.pet.id],a=byId[item.avatar.id];
  assert(p&&a&&p.sha===a.sha,'Baseline source-hash mismatch '+item.pet.id);
  assert.equal(item.pet.price,p.price,'Current pet price differs from baseline: '+item.pet.id);
  report.pairs.push({pet:item.pet.id,petName:item.pet.name,petPrice:item.pet.price,
    petRarity:item.pet.rarity,petLevel:item.pet.level,petRewardOnly:item.pet.rewardOnly,
    petAchievement:item.pet.achievement,avatar:item.avatar.id,
    avatarName:item.avatar.name,matchingOriginalSha:p.sha});
 }
 const render=await page.evaluate(async items=>{
  const main=document.createElement('main');
  main.style.cssText='font:15px Arial,system-ui;background:#101827;color:#F5F8FF;padding:26px;min-height:100vh';
  const title=document.createElement('h1');title.textContent='МатКвест · UX-104 · 10 дублирующихся питомцев';
  title.style.cssText='font-size:25px;margin:0 0 10px';main.append(title);
  const subtitle=document.createElement('p');
  subtitle.textContent='СЛЕВА: питомец в текущем каталоге · СПРАВА: аватар с тем же исходным SHA · без изменений изображения';
  subtitle.style.cssText='font-size:14px;color:#BFD5ED;margin:0 0 18px';main.append(subtitle);
  const grid=document.createElement('section');
  grid.style.cssText='display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px';
  main.append(grid);
  const loaded=[];
  function addArt(holder,raw){
   if(/^\s*</.test(raw))holder.innerHTML=raw;
   else if(raw.startsWith('data:image/')){const img=document.createElement('img');img.src=raw;holder.append(img)}
   else holder.textContent=raw;
  }
  for(const pair of items){
   const card=document.createElement('article');card.style.cssText='background:#253850;border:1px solid #537091;border-radius:14px;overflow:hidden';
   const name=document.createElement('div');name.textContent=pair.pet.name+' / '+pair.avatar.name;
   name.style.cssText='font-weight:bold;font-size:13px;padding:10px 8px;min-height:43px';card.append(name);
   const line=document.createElement('div');line.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3px;padding:3px 6px';
   for(const [kind,subject] of [['Питомец',pair.pet],['Аватар',pair.avatar]]){
    const area=document.createElement('div');area.style.cssText='min-width:0';
    const holder=document.createElement('div');holder.style.cssText='height:136px;background:linear-gradient(120deg,#E3F1FA 0 50%,#172745 50% 100%);display:grid;place-items:center;overflow:hidden;font-size:66px;line-height:1';
    addArt(holder,subject.raw);
    const label=document.createElement('div');label.textContent=kind;label.style.cssText='font-size:11px;text-align:center;margin-top:5px';
    area.append(holder,label);line.append(area);
   }
   card.append(line);
   const footer=document.createElement('div');footer.textContent=pair.pet.id+' · '+pair.pet.rarity+' · '+(pair.pet.rewardOnly?'награда':pair.pet.price+' монет');footer.style.cssText='font-size:10px;color:#C0D8F1;padding:8px;min-height:38px';
   card.append(footer);grid.append(card);
  }
  document.head.append(Object.assign(document.createElement('style'),{textContent:'main img,main svg{display:block!important;max-width:98%!important;max-height:98%!important;width:auto!important;height:auto!important;object-fit:contain!important;margin:auto}'}));
  document.body.replaceChildren(main);
  const images=[...main.querySelectorAll('img')];
  await Promise.all(images.map(x=>x.decode().catch(()=>null)));
  return {images:images.length,loaded:images.filter(x=>x.naturalWidth>0).length,
    failures:images.filter(x=>x.naturalWidth<=0).map(x=>x.getAttribute('src')?.slice(0,60)),
    cards:main.querySelectorAll('article').length};
 },data.dupes);
 assert.equal(render.cards,10);
 assert.deepEqual(render.failures,[],'Media broken on original duplicate reference');
 assert(render.images>=15,'Expected most pairs to use photographic/graphic assets');
 await page.screenshot({path:out+'/all_10_original_duplicate_pairs.png',fullPage:true,animations:'disabled',timeout:25000});
 assert.deepEqual(errors,[],'Unexpected page Javascript error');
 report.render=render;
 fs.writeFileSync(out+'/ten_pets_duplicate_map.json',JSON.stringify(report,null,2));
 console.log('UX104_PREFLIGHT_PASS',JSON.stringify({count:report.pairs.length,render,pairs:report.pairs}));
 await page.close();
 }finally{await browser.close();}
})().catch(err=>{console.error('UX104_PREFLIGHT_FAIL',err.stack||err);process.exitCode=1;});
