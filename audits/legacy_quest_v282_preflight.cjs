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
  console.log('V282_QUEST_STALE_STATUS',JSON.stringify({
   width,missing,staleTriggeredHome:result.afterGrade.gradeShown&&!result.afterOld.gradeShown
  }));
  await page.evaluate(()=>openQuests());
  const active=page.locator('#questBoardVue button').filter({hasText:/Главный экран/}).first();
  await active.waitFor({state:'attached'});
  await active.press('Enter');
  const navigation=await page.evaluate(()=>({
   route:mk854Route(),questStillVisible:!!document.querySelector('#questBoardVue'),
   gradeStillVisible:!!document.querySelector('#grade5Vue'),
   homeUI:!document.querySelector('#questBoardVue')&&!document.querySelector('#grade5Vue'),
   history:history.state
  }));
  console.log('V282_QUEST_ACTIVE_BACK',JSON.stringify({width,missing,...navigation}));
  await page.evaluate(()=>openGrade(5));
  await page.evaluate(()=>openQuests());
  await page.locator('#questBoardVue .quest-screen').waitFor({state:'attached'});
  const beforeSpace=await page.evaluate(()=>({
    route:mk854Route(),restoring:mk854Restoring,
    vue:!!document.querySelector('#questBoardVue[data-v-app]'),
    button:document.querySelector('#questBoardVue button.home-back-btn')?.outerHTML,
    focus:document.activeElement?.tagName
  }));
  const spaceBack=page.locator('#questBoardVue button').filter({hasText:/Главный экран/}).first();
  await spaceBack.press('Space');
  const afterSpace=await page.evaluate(()=>({
    route:mk854Route(),restoring:mk854Restoring,
    quest:!!document.querySelector('#questBoardVue'),
    grade:!!document.querySelector('#grade5Vue')
  }));
  console.log('V282_QUEST_SPACE_FROM_GRADE',JSON.stringify({width,missing,beforeSpace,afterSpace}));
  await page.waitForTimeout(1200);
  const settled=await page.evaluate(()=>({
   route:mk854Route(),quest:!!document.querySelector('#questBoardVue'),
   grade:!!document.querySelector('#grade5Vue'),history:history.state
  }));
  console.log('V282_QUEST_SPACE_SETTLED',JSON.stringify({width,missing,settled}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 await run(browser,base,390);
 await run(browser,base,1280);
 await run(browser,base,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
