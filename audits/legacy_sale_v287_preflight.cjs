'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');

async function verify(browser,url,width,fallback){
 const ctx=await browser.newContext({viewport:{width,height:860},
  isMobile:width<600,hasTouch:width<600,serviceWorkers:'block'});
 if(fallback){
  await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await ctx.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof mk865ShowSaleOverlay==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  await page.evaluate(()=>{
   window.__v287Log=[];
   window.__v287Open=(number)=>{
    const name=number===1?'First':'Second';
    const model={title:name,topics:[{grade:4,title:'Тема '+name,detail:'Тестовая тема',reason:'Без изменений',
      run:()=>window.__v287Log.push(name+':topic')}],
     buttons:[[{label:'Действие '+name,run:()=>window.__v287Log.push(name+':button')}]]};
    mk865ShowSaleOverlay(model);
   };
   window.__v287Open(1);
  });
  const popup=page.locator('#mk865SaleOverlay'),host=popup.locator('#mk865SaleDialog > div');
  await popup.getByRole('button',{name:'Действие First'}).waitFor();
  if(!fallback)await host.locator('[data-v-app]').waitFor().catch(async()=>await popup.locator('[data-v-app]').waitFor());
  const refs=await page.evaluate(()=>{
   const dialog=document.getElementById('mk865SaleDialog');
   const firstButton=[...dialog.querySelectorAll('button')].find(x=>x.textContent.trim()==='Действие First');
   const firstTopic=[...dialog.querySelectorAll('button')].find(x=>x.textContent.includes('Тема First'));
   if(!firstButton||!firstTopic)throw Error('Missing first model actions');
   window.__v287OldButton=firstButton;window.__v287OldTopic=firstTopic;
   return {firstButtonInline:firstButton.hasAttribute('onclick'),firstTopicInline:firstTopic.hasAttribute('onclick')};
  });
  await page.evaluate(()=>window.__v287Open(2));
  await popup.getByRole('button',{name:'Действие Second'}).waitFor();
  if(!fallback)await popup.locator('[data-v-app]').waitFor();
  const result=await page.evaluate(()=>{
   const initial={profile:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0,route:JSON.stringify(mk854Route())};
   const oldDetached=!window.__v287OldButton.isConnected&&!window.__v287OldTopic.isConnected;
   window.__v287OldButton.click();
   window.__v287OldTopic.click();
   const observed=window.__v287Log.slice();
   const after={profile:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0,route:JSON.stringify(mk854Route())};
   return {oldDetached,observed,initial,after,
    defectStaleRun:observed.includes('Second:button'),
    defectStaleTopic:observed.includes('Second:topic'),
    open:!!document.querySelector('#mk865SaleOverlay.show')};
  });
  assert(result.oldDetached,'Old controls must be detached');
  assert.deepEqual(result.initial,result.after,'No real sale, reward or route mutations allowed');
  assert.equal(result.open,true);
  assert.deepEqual(errors,[]);
  console.log('V287_SALE_ACTION_PREFLIGHT',JSON.stringify({width,fallback,refs,...result}));
 }finally{await ctx.close()}
}
withMatkvestBrowser(async(browser,url)=>{
 await verify(browser,url,390,false);
 await verify(browser,url,1280,false);
 await verify(browser,url,390,true);
}).catch(error=>{console.error(error);process.exitCode=1});
