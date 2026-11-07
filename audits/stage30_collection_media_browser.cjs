'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs');
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const issues=[];
 for(const width of [320,390,900]){
  const context=await browser.newContext({viewport:{width,height:750},isMobile:width<500,hasTouch:width<500});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const setup=await page.evaluate(()=>{
    const normalAvatar=catalogItem('avatars','av_fox');
    const avatar=normalAvatar||SHOP_CATALOG.avatars.find(a=>a.price>0&&!a.mk868Raster);
    const pet=SHOP_CATALOG.pets.find(x=>x.id!=='pet_none'&&x.price>0);
    const badge=SHOP_CATALOG.badges.find(x=>x.price>0);
    if(!avatar||!pet||!badge)throw Error('Missing real catalog test items');
    const p=ensureProfileIdentity({...EMPTY_STATE,coins:114,xp:1500,inventory:{
      ...(EMPTY_STATE.inventory||{}),avatars:['av_default',avatar.id,avatar.id],pets:['pet_none',pet.id],badges:[badge.id]},
      equipped:{...(EMPTY_STATE.equipped||{}),avatar:avatar.id,pet:pet.id}
    });
    profiles={'Тестовый ученик':p};
    currentProfile='Тестовый ученик';state=p;
    const expected=[avatar,pet,badge].reduce((a,x)=>a+x.price,0);
    return {avatar:avatar.id,pet:pet.id,badge:badge.id,expected};
   });
   const worth=await page.evaluate(()=>{
    const p=profiles[currentProfile];
    return {value:mk30CollectionWorth(p),own:mk30CollectionWorth(state)};
   });
   assert.equal(worth.value,setup.expected);
   assert.equal(worth.own,setup.expected);
   await page.evaluate(()=>openLeaderboard());
   const board=await page.evaluate(()=>{
     const th=[...document.querySelectorAll('.leader-table thead th')].map(x=>x.textContent.trim());
     const row=document.querySelector('.leader-table tbody tr');
     const td=[...row.children].map(x=>x.textContent.trim());
     return {th,td,pet:!!row.querySelector('.pet-mini'),legacy:row.querySelector('.avatar-badge')?.innerHTML};
   });
   assert(board.th.includes('Коллекция'),'Missing worth column: '+JSON.stringify(board.th));
   assert.equal(board.td[board.th.indexOf('Коллекция')],String(setup.expected));
   assert(board.pet,'Pet not visible');
   const oldHtml=await page.locator('.leader-table .avatar-badge').first().evaluate(n=>n.innerHTML);
   await page.locator('.leader-table .avatar-core').first().click();
   const avatarView=await page.evaluate(()=>{
     const viewer=document.getElementById('mk872AvatarViewer');
     const clone=viewer.querySelector('.mk30-visual .avatar-badge');
     return {open:viewer.classList.contains('mk872-open'),hasClone:!!clone,
       html:clone?.innerHTML,title:document.getElementById('mk872ViewerTitle')?.textContent,
       visualText:viewer.querySelector('.mk30-visual')?.textContent?.slice(0,40)};
   });
   assert(avatarView.open&&avatarView.hasClone,'Avatar modal did not contain original artwork');
   assert.equal(avatarView.html,oldHtml,'Avatar modal did not preserve rendered image layers');
   assert(!/^\s*100\s*$/.test(avatarView.visualText||''),'Level badge opened instead of avatar');
   await page.keyboard.press('Escape');
   assert(!(await page.locator('#mk872AvatarViewer').evaluate(n=>n.classList.contains('mk872-open'))),'Escape did not close');
   await page.locator('.leader-table .pet-mini').first().click();
   const petView=await page.evaluate(()=>{
     const viewer=document.getElementById('mk872AvatarViewer');
     return {open:viewer.classList.contains('mk872-open'),pet:!!viewer.querySelector('.mk30-pet'),
       visual:viewer.querySelector('.mk30-visual')?.innerHTML?.slice(0,450)};
   });
   assert(petView.open&&petView.pet,'Pet did not open as full-screen artwork');
   await page.keyboard.press('Escape');
   await page.evaluate(()=>openCollection());
   assert((await page.locator('#modal').innerText()).includes('Стоимость коллекции'),'Collection worth missing');
   assert((await page.locator('#modal').innerText()).includes(String(setup.expected)),'Collection worth wrong');
   if(errors.length)throw Error('JS page errors '+JSON.stringify(errors.slice(0,3)));
   console.log('STAGE30_PASS',JSON.stringify({width,setup,worth,
     board:{columns:board.th,worth:board.td[board.th.indexOf('Коллекция')]},
     avatar:{opened:avatarView.open,cloned:true,title:avatarView.title},
     pet:{opened:petView.open,cloned:petView.pet}}));
  }catch(e){issues.push({width,error:String(e)});console.error('STAGE30_FAIL',JSON.stringify({width,error:String(e),stack:String(e.stack||'').slice(0,1300)}))}
  await context.close();
 }
 await browser.close();
 console.log('STAGE30_SUMMARY',JSON.stringify({expected:3,failures:issues.length,issues}));
 if(issues.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
