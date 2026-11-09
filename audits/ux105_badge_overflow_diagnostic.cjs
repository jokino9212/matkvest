'use strict';
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const text=fs.readFileSync('index.html','utf8');
for(const needle of ['function openProfiles(', 'function openLeaderboard(', 'function renderBadge', 'function renderSticker', 'leader-table', 'mk30CollectionWorth', 'sticker', 'rare', 'fav-badge', 'profile-badge', 'badge-row']){
 let i=text.indexOf(needle);
 console.log('SRC_LOOKUP',needle,i, i<0?'':text.slice(Math.max(0,i-150),i+1350).replace(/\n/g,' '));
}

for(const needle of ['function favoriteStickersHtml(', 'function profileBadgesHtml(', 'function stickerIcon(', 'function mkSticker', 'function badgeIcon(', 'function renderItemIcon(', 'favoriteStickers:', 'favoriteStickers=', '.leader-stickers', '.profile-sticker-line', '.profile-sticker-slot', 'function shopIconHtml(', 'const SHOP_CATALOG']){
 let p=-1,count=0;
 while((p=text.indexOf(needle,p+1))>=0 && count<3){
 console.log('DEEP_SOURCE',needle,p,text.slice(Math.max(0,p-210),p+2300).replace(/\n/g,' '));count++;
 }
}


const targets=['.favorite-sticker{','.favorite-sticker >','.favorite-sticker img','.favorite-sticker svg','.profile-badge-chip','mk-ux94-sticker-image'];
for(const target of targets){
 let pos=-1,arr=[];while((pos=text.indexOf(target,pos+1))>=0){arr.push(pos)}
 console.log('CSS_TARGET',target,'TOTAL',arr.length,'TAIL',arr.slice(-6).map(x=>({at:x,snippet:text.slice(Math.max(0,x-120),x+730).replace(/\n/g,' ')})));
}

(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
for(const width of [390,900]){
const page=await browser.newPage({viewport:{width,height:950}});
page.on('pageerror',e=>console.log('JS_ERROR',e.message));
await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
const seeded=await page.evaluate(()=>{
 const allBadges=SHOP_CATALOG.badges.map(x=>x.id);
 const allStickers=SHOP_CATALOG.stickers.map(x=>x.id);
 const allPets=SHOP_CATALOG.pets.filter(x=>x.id!=='pet_none').map(x=>x.id);
 const a=ensureProfileIdentity({...EMPTY_STATE,coins:181,xp:2851,inventory:{...(EMPTY_STATE.inventory||{}),badges:allBadges,stickers:allStickers,pets:allPets},equipped:{...(EMPTY_STATE.equipped||{}),pet:'pet_owl',avatar:'av_trophy',stickers:['st_hourglass','st_orbit','st_control_perfect'],badges:allBadges.slice(0,3)}});
 const b=ensureProfileIdentity({...EMPTY_STATE,coins:114,xp:5141,inventory:{...(EMPTY_STATE.inventory||{}),badges:allBadges,stickers:allStickers,pets:allPets},equipped:{...(EMPTY_STATE.equipped||{}),pet:'pet_owl',avatar:'av_crown',stickers:['st_hourglass','st_grade4','st_royal'],badges:allBadges.slice(2,5)}});
 profiles={'sausage2628':a,'Боба':b};state=a;currentProfile='sausage2628';openProfiles();
 return {badges:allBadges.length,stickers:allStickers.length,profileModal:!!document.querySelector('#modal')};
});
console.log('SEEDED',width,JSON.stringify(seeded));
const locate=()=>page.evaluate(()=>{
 const modal=document.querySelector('#modal');
 const root=modal||document;
 let candidates=[...root.querySelectorAll('img,svg,span,div,a')].map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);
 return {tag:el.tagName,cls:typeof el.className==='string'?el.className:'svg',id:el.id||'',rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)],css:[s.position,s.width,s.height,s.maxWidth,s.transform,s.overflow],html:el.outerHTML.slice(0,500)};});
 return candidates.filter(x=>x.rect[2]>180&&x.rect[3]>90&&x.rect[2]<1100).sort((a,b)=>b.rect[2]*b.rect[3]-a.rect[2]*a.rect[3]).slice(0,28);
});
console.log('PROFILES_GIANT',width,JSON.stringify(await locate()));

const actual=await page.evaluate(()=>{
 const modal=document.querySelector('#modal');
 const els=[...modal.querySelectorAll('.favorite-stickers,.favorite-sticker,.favorite-sticker img,.favorite-sticker svg,.profile-badges,.profile-badge-chip,.profile-badge-chip img,.profile-badge-chip svg')];
 return els.map(el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
  return {tag:el.tagName,className:el.getAttribute('class'),title:el.getAttribute('title'),src:el.getAttribute('src'),rect:[r.x,r.y,r.width,r.height].map(x=>+x.toFixed(1)),scroll:[el.scrollWidth,el.scrollHeight],css:{w:cs.width,h:cs.height,maxW:cs.maxWidth,maxH:cs.maxHeight,display:cs.display,overflow:cs.overflow,transform:cs.transform},html:el.outerHTML.slice(0,230)}
 });
});
console.log('ACTUAL_STICKER_RECTS',width,JSON.stringify(actual));


const isolate=await page.evaluate(()=>{
 const asNode=(icon,style)=>{const host=document.createElement('div');host.className='ux105-diagnostic-target';host.style.cssText='position:absolute;left:45px;top:40px;z-index:0';
 host.innerHTML=style==='sticker'?'<div class="profile-sticker-line"><span class="favorite-stickers"><span class="favorite-sticker">'+icon+'</span></span></div>':
 '<div class="profile-badges compact"><span class="profile-badge-chip">'+icon+'</span></div>';
 document.body.append(host);
 const item=host.querySelector(style==='sticker'?'.favorite-sticker':'.profile-badge-chip');
 const rb=item.getBoundingClientRect(),children=[...item.querySelectorAll('*')].map(el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return {tag:el.tagName,classes:el.getAttribute('class'),w:+r.width.toFixed(1),h:+r.height.toFixed(1),x:+r.x.toFixed(1),y:+r.y.toFixed(1),position:cs.position,cssWidth:cs.width,cssHeight:cs.height};});
 const output={w:rb.width,h:rb.height,children,overflow:children.some(q=>q.w>rb.width+3||q.h>rb.height+3),html:item.outerHTML.slice(0,500)};
 host.remove();return output;};
 return {stickers:SHOP_CATALOG.stickers.map(x=>({id:x.id,name:x.name,...asNode(x.icon,'sticker')})),
   badges:SHOP_CATALOG.badges.map(x=>({id:x.id,name:x.name,...asNode(x.icon,'badge')}))};
});
console.log('ICON_ISOLATION',width,JSON.stringify({stickerProblem:isolate.stickers.filter(x=>x.overflow),badgeProblem:isolate.badges.filter(x=>x.overflow),stickerSample:isolate.stickers.slice(0,4)}));

await page.evaluate(()=>openLeaderboard());
console.log('LEADER_GIANT',width,JSON.stringify(await locate()));

const actual=await page.evaluate(()=>{
 const modal=document.querySelector('#modal');
 const els=[...modal.querySelectorAll('.favorite-stickers,.favorite-sticker,.favorite-sticker img,.favorite-sticker svg,.profile-badges,.profile-badge-chip,.profile-badge-chip img,.profile-badge-chip svg')];
 return els.map(el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
  return {tag:el.tagName,className:el.getAttribute('class'),title:el.getAttribute('title'),src:el.getAttribute('src'),rect:[r.x,r.y,r.width,r.height].map(x=>+x.toFixed(1)),scroll:[el.scrollWidth,el.scrollHeight],css:{w:cs.width,h:cs.height,maxW:cs.maxWidth,maxH:cs.maxHeight,display:cs.display,overflow:cs.overflow,transform:cs.transform},html:el.outerHTML.slice(0,230)}
 });
});
console.log('ACTUAL_STICKER_RECTS',width,JSON.stringify(actual));

await page.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error('DIAGNOSTIC_FAIL',e.stack||e);process.exitCode=1});
