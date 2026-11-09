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
 const a=ensureProfileIdentity({...EMPTY_STATE,coins:181,xp:2851,inventory:{...(EMPTY_STATE.inventory||{}),badges:allBadges,stickers:allStickers,pets:allPets},equipped:{...(EMPTY_STATE.equipped||{}),pet:'pet_owl',avatar:'av_trophy'}});
 const b=ensureProfileIdentity({...EMPTY_STATE,coins:114,xp:5141,inventory:{...(EMPTY_STATE.inventory||{}),badges:allBadges,stickers:allStickers,pets:allPets},equipped:{...(EMPTY_STATE.equipped||{}),pet:'pet_owl',avatar:'av_crown'}});
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
await page.evaluate(()=>openLeaderboard());
console.log('LEADER_GIANT',width,JSON.stringify(await locate()));
await page.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error('DIAGNOSTIC_FAIL',e.stack||e);process.exitCode=1});
