'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function scenario(browser,base,width,missing=false){
 const context=await browser.newContext({viewport:{width,height:860},
   isMobile:width<600,hasTouch:width<600,serviceWorkers:'block'});
 if(missing){
  await context.route('**/assets/ui/knowledge-map.js*',route=>route.abort());
  await context.route('**/assets/ui/legacy-vue-actions.js*',route=>route.abort());
 }
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof showElementaryTopicSoon==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  const report=await page.evaluate(()=>{
   const topic=g1AllTopics().find(t=>g1InfoById(t.id));
   if(!topic)throw Error('No valid 1st-grade topic for placeholder dialog');
   const before={profile:state.profileId,xp:state.xp,coins:state.coins,
     attempts:state.attemptHistory?.length||0};
   showElementaryTopicSoon(1,topic.id);
   const old=[...modal.querySelectorAll('button')].find(x=>/Понятно/.test(x.textContent));
   if(!old||!overlay.classList.contains('show'))throw Error('Placeholder modal not shown');
   const hadOnclick=old.hasAttribute('onclick');
   openShop('avatars');
   const shopBefore=overlay.classList.contains('show')&&!!modal.querySelector('.shop-tabs');
   const detached=!old.isConnected;
   old.click();
   const shopAfter=overlay.classList.contains('show')&&!!modal.querySelector('.shop-tabs');
   const after={profile:state.profileId,xp:state.xp,coins:state.coins,
     attempts:state.attemptHistory?.length||0};
   return {topic:topic.id,hadOnclick,shopBefore,detached,shopAfter,
      rewardsStable:JSON.stringify(before)===JSON.stringify(after)};
  });
  assert.equal(report.shopBefore,true);
  assert.equal(report.detached,true);
  assert.equal(report.rewardsStable,true);
  assert.deepEqual(errors,[]);
  console.log('V282_MODAL_PREFLIGHT',JSON.stringify({width,missing,...report,
    defect:!report.shopAfter}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 await scenario(browser,base,390);
 await scenario(browser,base,1280);
 await scenario(browser,base,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
