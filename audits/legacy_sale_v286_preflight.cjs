'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function verify(browser,url,width,missing=false){
 const context=await browser.newContext({viewport:{width,height:870},isMobile:width<600,hasTouch:width<600,serviceWorkers:'block'});
 if(missing){
  await context.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await context.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof mk865ShowSaleOverlay==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  await page.evaluate(()=>{
    const opener=document.createElement('button');opener.id='v286-sale-opener';opener.textContent='Тестовый просмотр';
    document.body.appendChild(opener);opener.focus();
    mk865ShowSaleOverlay({title:'Первое окно — без операций',buttons:[[{label:'Понятно',run:mk865CloseSaleOverlay}]]});
  });
  const popup=page.locator('#mk865SaleOverlay'),close=popup.locator('.mk865-sale-close');
  await close.waitFor();
  if(!missing)await popup.locator('[data-v-app]').waitFor();
  const first=await page.evaluate(()=>{
   const old=document.querySelector('#mk865SaleOverlay .mk865-sale-close');
   window.__v286OldSaleClose=old;
   return {vue:!!document.querySelector('#mk865SaleOverlay [data-v-app]'),
    inline:old.hasAttribute('onclick'),onclickAssigned:typeof old.onclick==='function'};
  });
  await page.evaluate(()=>{
   mk865ShowSaleOverlay({title:'Второе окно — без операций',buttons:[[{label:'Понятно',run:mk865CloseSaleOverlay}]]});
  });
  await close.waitFor();
  if(!missing)await popup.locator('[data-v-app]').waitFor();
  const result=await page.evaluate(()=>{
   const overlay=document.getElementById('mk865SaleOverlay'),model=mk865CurrentSaleDialog;
   const before={open:overlay.classList.contains('show'),title:overlay.querySelector('#mk865SaleTitle')?.textContent,
    modelCurrent:model?.title,profile:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0,route:JSON.stringify(mk854Route())};
   const oldDetached=!window.__v286OldSaleClose.isConnected;
   window.__v286OldSaleClose.click();
   const after={open:overlay.classList.contains('show'),title:overlay.querySelector('#mk865SaleTitle')?.textContent,
    modelCurrent:mk865CurrentSaleDialog?.title,profile:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0,route:JSON.stringify(mk854Route())};
   return {oldDetached,before,after,defectOldClose:before.open&&!after.open};
  });
  assert(result.oldDetached);
  assert(result.before.open);
  assert.equal(result.before.profile,result.after.profile);
  assert.equal(result.before.xp,result.after.xp);
  assert.equal(result.before.coins,result.after.coins);
  assert.equal(result.before.attempts,result.after.attempts);
  assert.equal(result.before.route,result.after.route);
  assert.deepEqual(errors,[]);
  console.log('V286_SALE_PREFLIGHT',JSON.stringify({width,missing,first,...result}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,url)=>{
 await verify(browser,url,390);
 await verify(browser,url,1280);
 await verify(browser,url,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
