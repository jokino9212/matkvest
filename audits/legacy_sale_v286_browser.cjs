'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function verify(browser,url,width,missing=false){
 const context=await browser.newContext({viewport:{width,height:870},isMobile:width<600,
  hasTouch:width<600,serviceWorkers:missing?'block':'allow'});
 if(missing){
  await context.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await context.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof mk865ShowSaleOverlay==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  if(!missing){
   await page.waitForFunction(()=>typeof MatKvestVueActions?.saleDialogCloseActions==='function');
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert(await page.evaluate(async()=>{
    const cache=await caches.open('matkvest-iphone-v286');
    return (await caches.keys()).includes('matkvest-iphone-v286')&&
      (await cache.keys()).some(x=>x.url.endsWith('assets/ui/legacy-vue-actions.js'));
   }),'v286 action adapter not in PWA cache');
   await context.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof mk865ShowSaleOverlay==='function'&&mk854HistoryReady===true);
  }else assert.equal(await page.evaluate(()=>typeof MatKvestVueActions),'undefined');
  const snapshot=()=>page.evaluate(()=>({profile:state.profileId,xp:state.xp,coins:state.coins,
   attempts:state.attemptHistory?.length||0,route:JSON.stringify(mk854Route())}));
  const initial=await snapshot();
  const openModel=async(title)=>{
   await page.evaluate(title=>mk865ShowSaleOverlay({title,buttons:[[{label:'Понятно',run:mk865CloseSaleOverlay}]]}),title);
   const popup=page.locator('#mk865SaleOverlay');
   await popup.locator('.mk865-sale-close').waitFor();
   if(!missing)await popup.locator('[data-v-app]').waitFor();
   return popup;
  };
  await page.evaluate(()=>{
   const btn=document.createElement('button');btn.type='button';btn.id='v286-sale-opener';
   btn.textContent='Открыть просмотр';document.body.append(btn);btn.focus();
  });
  const popup=await openModel('Первое окно — без операции');
  const oldButton=await page.evaluate(()=>{
   const close=document.querySelector('#mk865SaleOverlay .mk865-sale-close');
   window.__v286OldSaleClose=close;
   return {vue:!!document.querySelector('#mk865SaleOverlay [data-v-app]'),
    inline:close.hasAttribute('onclick')};
  });
  assert.equal(oldButton.inline,false,'HTML fallback close button cannot have inline handler');
  await openModel('Второе окно — без операции');
  const stale=await page.evaluate(()=>{
   const overlay=document.getElementById('mk865SaleOverlay');
   const before={open:overlay.classList.contains('show'),title:overlay.querySelector('#mk865SaleTitle')?.textContent,
    model:mk865CurrentSaleDialog?.title};
   const detached=!window.__v286OldSaleClose.isConnected;
   window.__v286OldSaleClose.click();
   const after={open:overlay.classList.contains('show'),title:overlay.querySelector('#mk865SaleTitle')?.textContent,
    model:mk865CurrentSaleDialog?.title};
   return {detached,before,after};
  });
  assert(stale.detached,'Old button must be detached');
  assert.equal(stale.before.open,true);
  assert.deepEqual(stale.after,stale.before,'Old sale button closed replacement dialog');
  const close=popup.locator('button.mk865-sale-close');
  await close.press('Enter');
  await page.waitForFunction(()=>!document.getElementById('mk865SaleOverlay').classList.contains('show'));
  assert(await page.evaluate(()=>document.activeElement?.id==='v286-sale-opener'));
  await openModel('Третье окно — без операции');
  await close.press('Space');
  await page.waitForFunction(()=>!document.getElementById('mk865SaleOverlay').classList.contains('show'));
  assert(await page.evaluate(()=>document.activeElement?.id==='v286-sale-opener'));
  await openModel('Четвёртое окно — без операции');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.getElementById('mk865SaleOverlay').classList.contains('show'));
  assert(await page.evaluate(()=>document.activeElement?.id==='v286-sale-opener'));
  await openModel('Пятое окно — без операции');
  await popup.click({position:{x:1,y:1},force:true});
  await page.waitForFunction(()=>!document.getElementById('mk865SaleOverlay').classList.contains('show'));
  assert.deepEqual(await snapshot(),initial,'Sale close UI changed progress, rewards, attempts or route');
  assert.deepEqual(errors,[]);
  console.log('PASS_V286_SALE_CLOSE_BROWSER',JSON.stringify({width,missing,offlineF5:!missing,
    staleCloseInert:true,noInline:true,keyboardEnterSpaceEscape:true,focusRestored:true,
    backdrop:true,routeAndRewardsStable:true}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,url)=>{
 await verify(browser,url,390);
 await verify(browser,url,1280);
 await verify(browser,url,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
