'use strict';
const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const out='audits/ux100_avatar_probe_output';
 fs.mkdirSync(out,{recursive:true});
 try{
  for(const id of ['av_default','av_mq_guard','av_mq_rex','av_mq_mare','av_centurion']){
   const page=await browser.newPage({viewport:{width:390,height:800}});
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const before=await page.evaluate(id=>{
    const item=SHOP_CATALOG.avatars.find(x=>x.id===id);
    if(!item)throw Error('Missing avatar '+id);
    const p=ensureProfileIdentity({...EMPTY_STATE,xp:20000,coins:8000,inventory:{...(EMPTY_STATE.inventory||{}),avatars:['av_default',id],pets:['pet_none']},
      equipped:{...(EMPTY_STATE.equipped||{}),avatar:id,pet:'pet_none'}});
    profiles={['QA '+id]:p};currentProfile='QA '+id;state=p;
    openLeaderboard();
    const badge=document.querySelector('.leader-table .avatar-badge');
    const core=badge?.querySelector('.avatar-core');
    const rect=core?.getBoundingClientRect();
    const center=rect?document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2):null;
    const holder=document.querySelector('#mk872AvatarViewer');
    return {item:{id:item.id,name:item.name,icon:(item.icon||'').slice(0,420)},
     badge:badge?.outerHTML.slice(0,1600)||null,
     center:center?.outerHTML.slice(0,300)||null,
     holderClass:holder?.className,rect:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height}:null};
   },id);
   const core=page.locator('.leader-table .avatar-core').first();
   await core.click({force:true});
   await page.waitForTimeout(60);
   const afterClick=await page.evaluate(()=>{
    const holder=document.querySelector('#mk872AvatarViewer');
    return {holder:holder?.outerHTML.slice(0,1200),classes:holder?.className,
      modal:document.querySelector('#modal')?.className,overlay:document.querySelector('#overlay')?.className,
      svg:!!holder?.querySelector('svg'),img:!!holder?.querySelector('img'),
      hidden:holder?getComputedStyle(holder).display:null};
   });
   if(!String(afterClick.classes).includes('mk872-open')){
     const badge=page.locator('.leader-table .avatar-badge').first();
     await badge.evaluate(el=>el.click());
   }
   const afterManual=await page.evaluate(()=>{
    const h=document.querySelector('#mk872AvatarViewer');
    return {open:h?.classList.contains('mk872-open'),className:h?.className,
       sourceImage:document.querySelector('.leader-table .avatar-badge')?.innerHTML.slice(0,600),
       image:h?.querySelector('.mk30-visual')?.innerHTML.slice(0,600)};
   });
   if(['av_mq_rex','av_mq_mare'].includes(id))await page.screenshot({path:out+'/'+id+'.png',animations:'disabled'});
   console.log('UX100_AVATAR_DIAGNOSTIC',JSON.stringify({id,before,afterClick,afterManual}));
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
