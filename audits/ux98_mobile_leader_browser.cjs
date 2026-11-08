'use strict';const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox']});const dir='audits/ux98_leader_mobile_output';fs.mkdirSync(dir,{recursive:true});
try{for(const width of [320,360,390,430,768,1280]){const page=await b.newPage({viewport:{width,height:800},isMobile:width<500,hasTouch:width<500});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
const data=await page.evaluate(()=>{
 const p=ensureProfileIdentity({...EMPTY_STATE,coins:10000,xp:30000,inventory:{...(EMPTY_STATE.inventory||{}),stickers:SHOP_CATALOG.stickers.map(x=>x.id)},equipped:{...(EMPTY_STATE.equipped||{}),stickers:['st_star2','st_royal','st_infinity']}});
 profiles={'Тест стикеров':p};currentProfile='Тест стикеров';state=p;openLeaderboard();
 const identity=document.querySelector('.leader-table .leader-identity');const modal=document.querySelector('#modal');
 const box=x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
 const name=identity.querySelector('.nickname-style'),badge=identity.querySelector('.profile-badge-empty'),
 favorite=identity.querySelector('.leader-stickers'),level=identity.querySelector('.leader-mobile-level'),avatar=identity.querySelector('.avatar-badge');
 return {modal:box(modal),identity:box(identity),name:box(name),badge:box(badge),favorite:box(favorite),level:box(level),avatar:box(avatar),display:getComputedStyle(identity).display,stickers:identity.querySelectorAll('.favorite-sticker').length,all:SHOP_CATALOG.stickers.length};
});
assert.equal(data.all,31);assert.equal(data.stickers,3);
if(width<=480){
 assert.equal(data.display,'grid','Mobile grid absent '+JSON.stringify(data));
 assert(data.badge.top>=data.name.bottom-1,'Name and empty badge overlap '+JSON.stringify(data));
 assert(data.favorite.top>=data.badge.bottom-1,'Badge and favorites overlap '+JSON.stringify(data));
 assert(data.level.top>=data.favorite.bottom-1,'Favorites and level overlap '+JSON.stringify(data));
 assert(data.badge.right<=data.modal.right-10,'Badge clipped on screen '+JSON.stringify(data));
 assert(data.name.right<=data.modal.right-10,'Name clipped on screen '+JSON.stringify(data));
 assert(data.avatar.right<data.name.left,'Avatar overlaps user info '+JSON.stringify(data));
}else assert.equal(data.display,'flex','Desktop leaderboard layout changed '+JSON.stringify(data));
assert.deepEqual(errors,[]);await page.screenshot({path:dir+'/leader_'+width+'.png',animations:'disabled'});
console.log('UX98_LEADER_PASS',width,JSON.stringify({name:data.name,badge:data.badge,level:data.level,modal:data.modal}));
await page.close();}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
