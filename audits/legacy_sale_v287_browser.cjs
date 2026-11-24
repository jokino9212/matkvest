'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');

async function verify(browser,url,width,fallback){
 const ctx=await browser.newContext({viewport:{width,height:860},
  isMobile:width<600,hasTouch:width<600,serviceWorkers:fallback?'block':'allow'});
 if(fallback){
  await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await ctx.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof mk865ShowSaleOverlay==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  if(!fallback){
   await page.waitForFunction(()=>typeof window.MatKvestVueActions?.saleDialogDispatchActions==='function');
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert(await page.evaluate(async()=>{
    const cache=await caches.open('matkvest-iphone-v287');
    return (await caches.keys()).includes('matkvest-iphone-v287')&&
      (await cache.keys()).some(req=>req.url.endsWith('assets/ui/legacy-vue-actions.js'));
   }),'v287 adapter missing from PWA cache');
   await ctx.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof mk865ShowSaleOverlay==='function'&&mk854HistoryReady===true);
  }else assert.equal(await page.evaluate(()=>typeof MatKvestVueActions),'undefined');
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
  const popup=page.locator('#mk865SaleOverlay');
  await popup.getByRole('button',{name:'Действие First'}).waitFor();
  if(!fallback)await popup.locator('[data-v-app]').waitFor();
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
  assert.equal(result.defectStaleRun,false,'Detached old row incorrectly dispatched current model');
  assert.equal(result.defectStaleTopic,false,'Detached old topic incorrectly dispatched current model');
  assert.deepEqual(result.observed,[],'Stale controls must be completely inert');
  assert.deepEqual(result.initial,result.after,'No real sale, reward or route mutations allowed');
  assert.equal(result.open,true);
  assert.equal(refs.firstButtonInline,false,'No inline fallback sale row');
  assert.equal(refs.firstTopicInline,false,'No inline fallback sale topic');
  await popup.getByRole('button',{name:'Действие Second'}).press('Enter');
  await popup.locator('button').filter({hasText:'Тема Second'}).press('Space');
  const live=await page.evaluate(()=>window.__v287Log.slice());
  assert.deepEqual(live,['Second:button','Second:topic'],'Live buttons and topics must dispatch exactly once');
  await popup.getByRole('button',{name:'Закрыть окно продажи'}).press('Enter');
  await page.waitForFunction(()=>!document.getElementById('mk865SaleOverlay').classList.contains('show'));
  assert.deepEqual(await page.evaluate(()=>({profile:state.profileId,xp:state.xp,coins:state.coins,
   attempts:state.attemptHistory?.length||0,route:JSON.stringify(mk854Route())})),result.initial);
  assert.deepEqual(errors,[]);
  console.log('PASS_V287_SALE_DISPATCH_BROWSER',JSON.stringify({width,fallback,offlineF5:!fallback,
   oldButtonInert:true,oldTopicInert:true,liveButtonAndTopicOnce:true,keyboardEnterSpace:true,
   noInline:true,progressRewardsStable:true}));
 }finally{await ctx.close()}
}
withMatkvestBrowser(async(browser,url)=>{
 await verify(browser,url,390,false);
 await verify(browser,url,1280,false);
 await verify(browser,url,390,true);
}).catch(error=>{console.error(error);process.exitCode=1});
