'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');

async function verify(browser,url,width,missing=false){
 const context=await browser.newContext({viewport:{width,height:870},isMobile:width<600,
  hasTouch:width<600,serviceWorkers:'block'});
 if(missing){
  await context.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await context.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof openLeaderboard==='function'&&
    typeof openShop==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  await page.evaluate(()=>openLeaderboard());
  const host=page.locator('#modal .vue-report');
  await host.waitFor({state:'attached'});
  if(!missing)await page.locator('#modal .vue-report[data-v-app]').waitFor({state:'attached'});
  const selectors=await page.evaluate(()=>({
   buttons:[...document.querySelectorAll('#modal .vue-report button')].slice(0,8).map(x=>({
    text:x.textContent?.trim(),aria:x.getAttribute('aria-label'),className:x.className,onclick:x.hasAttribute('onclick')})),
   vue:!!document.querySelector('#modal .vue-report[data-v-app]')
  }));
  const help=host.locator('button[aria-label*="Справка"]').first();
  await help.waitFor({state:'attached'});
  await help.press('Enter');
  await page.locator('#mk872-help-layer').waitFor();
  const opened=await page.locator('#mk872-help-layer [role="dialog"]').count()>0;
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#mk872-help-layer'));
  const focusRestored=await help.evaluate(el=>document.activeElement===el);
  const result=await page.evaluate(()=>{
   const host=document.querySelector('#modal .vue-report');
   const oldHelp=host.querySelector('button[aria-label*="Справка"]');
   const oldClose=[...host.querySelectorAll('button')].find(x=>x.classList.contains('x')||x.getAttribute('aria-label')==='Закрыть окно');
   if(!oldClose)throw Error('Cannot locate leaderboard close button');
   openShop('avatars');
   const before={shopVisible:!!modal.querySelector('.shop-tabs'),hasHelpLayer:!!document.getElementById('mk872-help-layer'),
    id:state.profileId,xp:state.xp,coins:state.coins,attempts:state.attemptHistory?.length||0};
   oldHelp.click();oldClose.click();
   const after={shopVisible:!!modal.querySelector('.shop-tabs'),hasHelpLayer:!!document.getElementById('mk872-help-layer'),
    id:state.profileId,xp:state.xp,coins:state.coins,attempts:state.attemptHistory?.length||0};
   return {oldHelpDetached:!oldHelp.isConnected,oldCloseDetached:!oldClose.isConnected,
    before,after};
  });
  assert.equal(result.before.shopVisible,true);
  assert.equal(result.oldHelpDetached,true);
  assert.equal(result.oldCloseDetached,true);
  assert.deepEqual(errors,[]);
  console.log('V283_LEADERBOARD_PREFLIGHT',JSON.stringify({width,missing,selectors,opened,focusRestored,
   oldButtonsAffectedModal:JSON.stringify(result.before)!==JSON.stringify(result.after),...result}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,url)=>{
 await verify(browser,url,390);
 await verify(browser,url,1280);
 await verify(browser,url,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
