'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');

async function verify(browser,base,width,missing=false){
 const ctx=await browser.newContext({viewport:{width,height:860},isMobile:width<600,
  hasTouch:width<600,serviceWorkers:missing?'block':'allow'});
 if(missing){
  await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await ctx.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof mk872HelpOpen==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  if(!missing){
   await page.waitForFunction(()=>typeof MatKvestVueActions?.helpDialogActions==='function');
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert(await page.evaluate(async()=>{
    const c=await caches.open('matkvest-iphone-v284');
    return (await caches.keys()).includes('matkvest-iphone-v284')&&
      (await c.keys()).some(x=>x.url.endsWith('assets/ui/legacy-vue-actions.js'));
   }));
   await ctx.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof mk872HelpOpen==='function'&&mk854HistoryReady===true);
  }else assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');

  const initial=await page.evaluate(()=>({id:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0,route:JSON.stringify(mk854Route())}));
  await page.evaluate(()=>{
   const opener=document.createElement('button');
   opener.id='v284-opener';opener.type='button';opener.textContent='Справка тест';
   document.body.appendChild(opener);opener.focus();
   mk872HelpOpen('shop',opener);
  });
  const layer=page.locator('#mk872-help-layer');
  await layer.waitFor();
  if(!missing)await page.locator('#mk872-help-layer [data-v-app]').waitFor();
  const report=await page.evaluate(()=>{
   const first=document.getElementById('mk872-help-layer');
   const staleClose=first.querySelector('button.mk872-help-close');
   if(!staleClose)throw Error('Missing help close button');
   const fallbackInline=staleClose.hasAttribute('onclick');
   const opener=document.getElementById('v284-opener');
   mk872HelpOpen('collection',opener);
   const beforeButton=document.querySelector('#mk872-help-title')?.textContent;
   staleClose.click();
   const afterButton=document.querySelector('#mk872-help-title')?.textContent;
   mk872HelpOpen('chest',opener);
   const beforeBackdrop=document.querySelector('#mk872-help-title')?.textContent;
   first.click();
   const afterBackdrop=document.querySelector('#mk872-help-title')?.textContent;
   return {fallbackInline,staleButtonDetached:!staleClose.isConnected,
     staleBackdropDetached:!first.isConnected,
     beforeButton,afterButton,beforeBackdrop,afterBackdrop};
  });
  assert.equal(report.fallbackInline,false);
  assert(report.staleButtonDetached&&report.staleBackdropDetached);
  assert.equal(report.afterButton,report.beforeButton,'Stale close button must not close new help');
  assert.equal(report.afterBackdrop,report.beforeBackdrop,'Stale backdrop must not close new help');
  await layer.locator('button.mk872-help-close').press('Enter');
  await layer.waitFor({state:'detached'});
  assert(await page.evaluate(()=>document.activeElement?.id==='v284-opener'));
  await page.evaluate(()=>mk872HelpOpen('shop',document.getElementById('v284-opener')));
  await layer.waitFor();
  await layer.locator('button.mk872-help-close').press('Space');
  await layer.waitFor({state:'detached'});
  assert(await page.evaluate(()=>document.activeElement?.id==='v284-opener'));
  await page.evaluate(()=>mk872HelpOpen('collection',document.getElementById('v284-opener')));
  await layer.waitFor();
  await page.keyboard.press('Escape');
  await layer.waitFor({state:'detached'});
  assert(await page.evaluate(()=>document.activeElement?.id==='v284-opener'));
  await page.evaluate(()=>mk872HelpOpen('chest',document.getElementById('v284-opener')));
  await layer.waitFor();
  await layer.click({position:{x:1,y:1},force:true});
  await layer.waitFor({state:'detached'});
  const after=await page.evaluate(()=>({id:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0,route:JSON.stringify(mk854Route())}));
  assert.deepEqual(after,initial,'Help close cannot touch profile, route, XP, coins or attempts');
  assert.deepEqual(errors,[]);
  console.log('PASS_V284_HELP_BROWSER',JSON.stringify({width,missing,
   offlineF5:!missing,oldCloseInert:true,oldBackdropInert:true,keyboardEnterSpaceEscape:true,
   focusRestored:true,noInline:true,rewardsUnchanged:true}));
 }finally{await ctx.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 await verify(browser,base,390);
 await verify(browser,base,1280);
 await verify(browser,base,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
