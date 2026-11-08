'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const dir='audits/ux94_sticker_diagnostic_output';fs.mkdirSync(dir,{recursive:true});
 try{
  for(const width of [320,390,1280]){
   const page=await browser.newPage({viewport:{width,height:800},isMobile:width<500,hasTouch:width<500});
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const data=await page.evaluate(()=>{
    const items=SHOP_CATALOG.stickers;
    const testItems=[items[0],items.find(x=>x.icon.includes('emoji-fallback-img')),items.find(x=>x.icon.includes('<svg')),items.at(-1)].filter(Boolean);
    const p=ensureProfileIdentity({...EMPTY_STATE,coins:2000,xp:20000,
      inventory:{...(EMPTY_STATE.inventory||{}),stickers:items.map(x=>x.id)},
      equipped:{...(EMPTY_STATE.equipped||{}),stickers:testItems.slice(0,3).map(x=>x.id)}});
    profiles={'Стикер-ученик':p};currentProfile='Стикер-ученик';state=p;
    const preferred=p.equipped.stickers.map(id=>SHOP_CATALOG.stickers.find(x=>x.id===id)?.name);
    openLeaderboard();
    const leader=document.querySelector('.leader-table .leader-stickers');
    const list=[...leader.querySelectorAll('.favorite-sticker')].map(x=>({html:x.outerHTML.slice(0,350),img:x.querySelector('img')?.src.slice(0,40),text:x.textContent.trim()}));
    return {total:items.length,byRarity:Object.fromEntries([...new Set(items.map(x=>x.rarity))].map(r=>[r,items.filter(x=>x.rarity===r).length])),examples:items.slice(0,12).map(x=>({id:x.id,name:x.name,icon:x.icon.slice(0,110)})),preferred,list};
   });
   const metrics=await page.evaluate(()=>{
    const rows=[...document.querySelectorAll('.leader-table .favorite-sticker')];
    return rows.map(x=>{const r=x.getBoundingClientRect(),img=x.querySelector('img'),ir=img?.getBoundingClientRect();return {outer:[r.width,r.height],image:ir?[ir.width,ir.height]:null,overflow:!!ir&&(ir.width>r.width||ir.height>r.height)}});
   });
   await page.screenshot({path:dir+'/leader_'+width+'.png',animations:'disabled'});
   await page.evaluate(()=>openCollection());
   const collections=await page.evaluate(()=>({
     label:(document.querySelector('#modal')?.innerText||'').slice(0,600),
     stickerCards:document.querySelectorAll('.sticker-slot').length,
     favoriteCount:document.querySelectorAll('.sticker-slot.favorite').length
   }));
   await page.screenshot({path:dir+'/collection_'+width+'.png',animations:'disabled'});
   await page.evaluate(()=>openShop('stickers'));
   const shop=await page.evaluate(()=>({
     active:document.querySelector('.shop-tab.active')?.textContent,
     cards:document.querySelectorAll('.shop-grid .shop-card').length,
     sample:[...document.querySelectorAll('.shop-grid .shop-card .shop-icon')].slice(0,3).map(x=>x.outerHTML.slice(0,330))
   }));
   await page.screenshot({path:dir+'/shop_'+width+'.png',animations:'disabled'});
   console.log('UX94_STICKER_INVENTORY',width,JSON.stringify({data,metrics,collections,shop}));
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
