'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function verify(browser,base,width,missing=false){
 const context=await browser.newContext({viewport:{width,height:860},isMobile:width<600,hasTouch:width<600,serviceWorkers:'block'});
 if(missing){
  await context.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await context.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof mk872HelpOpen==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  await page.evaluate(()=>mk872HelpOpen('shop',document.querySelector('#app')||document.body));
  await page.locator('#mk872-help-layer').waitFor();
  if(!missing)await page.locator('#mk872-help-layer [data-v-app]').waitFor();
  const result=await page.evaluate(()=>{
   const stateBefore={id:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0,route:JSON.stringify(mk854Route())};
   const oldLayer=document.getElementById('mk872-help-layer');
   const oldClose=oldLayer.querySelector('button.mk872-help-close');
   if(!oldClose)throw Error('No help close button');
   const oldInline=oldClose.hasAttribute('onclick');
   mk872HelpOpen('collection',document.body);
   const beforeButton={present:!!document.getElementById('mk872-help-layer'),
    heading:document.querySelector('#mk872-help-title')?.textContent};
   oldClose.click();
   const afterButton={present:!!document.getElementById('mk872-help-layer'),
    heading:document.querySelector('#mk872-help-title')?.textContent};
   mk872HelpOpen('chest',document.body);
   const beforeBackdrop={present:!!document.getElementById('mk872-help-layer'),
    heading:document.querySelector('#mk872-help-title')?.textContent};
   oldLayer.click();
   const afterBackdrop={present:!!document.getElementById('mk872-help-layer'),
    heading:document.querySelector('#mk872-help-title')?.textContent};
   const stateAfter={id:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0,route:JSON.stringify(mk854Route())};
   return {oldInline,oldCloseDetached:!oldClose.isConnected,oldLayerDetached:!oldLayer.isConnected,
    beforeButton,afterButton,beforeBackdrop,afterBackdrop,
    rewardsStable:JSON.stringify(stateBefore)===JSON.stringify(stateAfter)};
  });
  assert.equal(result.oldCloseDetached,true);
  assert.equal(result.oldLayerDetached,true);
  assert.equal(result.beforeButton.present,true);
  assert.equal(result.beforeBackdrop.present,true);
  assert.equal(result.rewardsStable,true);
  assert.deepEqual(errors,[]);
  console.log('V284_HELP_PREFLIGHT',JSON.stringify({width,missing,...result,
   defectOldClose:!result.afterButton.present,defectOldBackdrop:!result.afterBackdrop.present}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 await verify(browser,base,390);
 await verify(browser,base,1280);
 await verify(browser,base,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
