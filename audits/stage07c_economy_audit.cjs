'use strict';
const {chromium}=require('playwright'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const ctx=await browser.newContext({viewport:{width,height:860},isMobile:width<500,hasTouch:width<500});
   const page=await ctx.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const catalog=await page.evaluate(()=>{
    const cats=Object.entries(SHOP_CATALOG).filter(([k,v])=>Array.isArray(v));
    return {categories:cats.map(([name,a])=>({name,count:a.length,
      sample:a.slice(0,3).map(x=>({id:x.id,name:x.name,price:x.price,rarity:x.rarity}))})),
      ownCoins:state.coins,worthFn:typeof mk30CollectionWorth,
      leaderboardFn:typeof openLeaderboard};
   });
   console.log('STAGE07C_CATALOG',JSON.stringify({width,catalog}));
   for(const kind of ['avatars','pets','badges','stickers']){
    await page.evaluate(kind=>openShop(kind,'all'),kind);
    const shop=await page.evaluate(()=>{
      const modal=document.getElementById('modal');
      return {title:modal?.textContent.slice(0,200),all:modal?.textContent.slice(0,2300),
       classes:[...modal.querySelectorAll('.shop-card')].slice(0,12).map(x=>({cls:x.className,html:x.outerHTML.slice(0,900),text:x.textContent.trim().slice(0,160)})),
       categoryTabs:[...modal.querySelectorAll('.shop-tab')].map(x=>({label:x.textContent.trim(),active:x.classList.contains('active')})),
       over:document.documentElement.scrollWidth-document.documentElement.clientWidth};
    });
    console.log('STAGE07C_SHOP',JSON.stringify({width,kind,shop}));
   }
   await page.evaluate(()=>openCollection());
   const collection=await page.evaluate(()=>({intro:document.getElementById('modal')?.textContent.slice(0,2300),
      cardCount:document.querySelectorAll('#modal .shop-card,#modal .inventory-card').length,
      wealthy:[...document.querySelectorAll('#modal *')].filter(e=>e.children.length===0&&/стоимость|состояние|богатство/i.test(e.textContent)).slice(0,12).map(x=>x.textContent.trim().slice(0,80))}));
   console.log('STAGE07C_COLLECTION',JSON.stringify({width,collection}));
   await page.evaluate(()=>openLeaderboard());
   const board=await page.evaluate(()=>({headers:[...document.querySelectorAll('.leader-table thead th')].map(x=>x.textContent.trim()),
     labels:[...document.querySelectorAll('#modal button,[role="tab"]')].map(x=>x.textContent.trim().slice(0,70)).slice(0,28),
     text:document.getElementById('modal')?.textContent.slice(0,1900),
     over:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
   console.log('STAGE07C_LEADERS',JSON.stringify({width,board,errors}));
   await ctx.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE07C_AUDIT_ERROR',e.stack||e);process.exit(1)});
