'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function run(browser,base,width,missing=false){
 const context=await browser.newContext({viewport:{width,height:870},
  isMobile:width<600,hasTouch:width<600,serviceWorkers:'block'});
 if(missing){
  await context.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await context.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof openQuests==='function'&&
    typeof openGrade==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  await page.evaluate(()=>openQuests());
  await page.locator('#questBoardVue .quest-screen').waitFor({state:'attached'});
  if(!missing)await page.locator('#questBoardVue[data-v-app]').waitFor({state:'attached'});
  const result=await page.evaluate(()=>{
    const host=document.getElementById('questBoardVue');
    const back=[...host.querySelectorAll('button')].find(x=>/Главный экран/.test(x.textContent||''));
    if(!back)throw Error('Quest back button not found; '+host.textContent.slice(0,300));
    const wasVue=host.hasAttribute('data-v-app');
    const original={id:state.profileId,xp:state.xp,coins:state.coins,history:state.attemptHistory?.length||0};
    openGrade(5);
    const afterGrade={hostConnected:host.isConnected,btnConnected:back.isConnected,
      gradeShown:!!document.querySelector('#grade5Vue'),screen:mk854Route().screen};
    back.click();
    const afterOld={gradeShown:!!document.querySelector('#grade5Vue'),
      homeShown:!document.querySelector('#grade5Vue'),screen:mk854Route().screen};
    const final={id:state.profileId,xp:state.xp,coins:state.coins,history:state.attemptHistory?.length||0};
    return {wasVue,afterGrade,afterOld,rewardsStable:JSON.stringify(original)===JSON.stringify(final)};
  });
  assert.equal(result.wasVue,!missing);
  assert.equal(result.afterGrade.btnConnected,false);
  assert.equal(result.afterGrade.gradeShown,true);
  assert.equal(result.rewardsStable,true);
  assert.deepEqual(errors,[]);
  console.log('V282_QUEST_PREFLIGHT',JSON.stringify({width,missing,...result}));
  assert.equal(result.afterOld.gradeShown,false,
    'Pre-fix detached button should reproduce stale route bug');
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 await run(browser,base,390);
 await run(browser,base,1280);
 await run(browser,base,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
