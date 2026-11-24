'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');

async function verify(browser,url,width,missing=false){
 const ctx=await browser.newContext({viewport:{width,height:860},isMobile:width<600,hasTouch:width<600,serviceWorkers:missing?'block':'allow'});
 if(missing){
  await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await ctx.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof mk854Route==='function'&&mk854HistoryReady===true,null,{timeout:30000});
  if(!missing){
   await page.waitForFunction(()=>typeof MatKvestVueActions?.artworkViewerActions==='function');
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert(await page.evaluate(async()=>{
    const cache=await caches.open('matkvest-iphone-v285');
    return (await caches.keys()).includes('matkvest-iphone-v285')&&
     (await cache.keys()).some(x=>x.url.endsWith('assets/ui/legacy-vue-actions.js'));
   }), 'v285 action adapter must be cached');
   await ctx.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>mk854HistoryReady===true);
  }else assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');
  await page.evaluate(()=>{
   for(const [id,txt] of [['v285-probe-1','🐱'],['v285-probe-2','🐶']]){
    const avatar=document.createElement('span');avatar.className='avatar-badge';avatar.id=id;
    avatar.textContent=txt;avatar.tabIndex=0;avatar.setAttribute('role','button');
    document.body.append(avatar);
   }
   document.getElementById('v285-probe-1').click();
  });
  const popup=page.locator('#mk872AvatarViewer'),close=popup.locator('button.mk872-viewer-close');
  await close.waitFor({state:'attached'});
  if(!missing)await page.locator('#mk872AvatarViewer .mk872-viewer-content[data-v-app]').waitFor();
  const first=await page.evaluate(()=>{
   const close=document.querySelector('#mk872AvatarViewer button.mk872-viewer-close');
   if(!close)throw Error('No close button');
   window.__v285OldClose=close;
   return {vue:!!document.querySelector('#mk872AvatarViewer .mk872-viewer-content[data-v-app]'),
    inline:close.hasAttribute('onclick'),onclickAssigned:typeof close.onclick==='function'};
  });
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.getElementById('mk872AvatarViewer').classList.contains('mk872-open')&&!history.state?.__mk30PetViewer,null,{timeout:15000});
  await page.evaluate(()=>document.getElementById('v285-probe-2').click());
  await close.waitFor({state:'attached'});
  if(!missing)await page.locator('#mk872AvatarViewer .mk872-viewer-content[data-v-app]').waitFor();
  const result=await page.evaluate(()=>{
   const popup=document.getElementById('mk872AvatarViewer');
   const before={visible:popup.classList.contains('mk872-open'),title:popup.querySelector('#mk872ViewerTitle')?.textContent,
    route:JSON.stringify(mk854Route()),historyTag:!!history.state?.__mk30PetViewer,
    profile:state.profileId,xp:state.xp,coins:state.coins,attempts:state.attemptHistory?.length||0};
   const detached=!window.__v285OldClose.isConnected;
   window.__v285OldClose.click();
   const after={visible:popup.classList.contains('mk872-open'),title:popup.querySelector('#mk872ViewerTitle')?.textContent,
    route:JSON.stringify(mk854Route()),historyTag:!!history.state?.__mk30PetViewer,
    profile:state.profileId,xp:state.xp,coins:state.coins,attempts:state.attemptHistory?.length||0};
   return {detached,before,after,defectOldButton:before.visible&&!after.visible};
  });
  assert.equal(result.detached,true);
  assert.equal(result.before.visible,true);
  assert.equal(result.before.historyTag,true);
  assert.equal(result.defectOldButton,false,'Detached old close must not dismiss new artwork');
  assert.equal(result.after.visible,true);
  assert.equal(result.after.title,result.before.title);
  assert.equal(result.after.route,result.before.route);
  assert.equal(result.after.historyTag,true);
  assert.equal(result.before.profile,result.after.profile);
  assert.equal(result.before.xp,result.after.xp);
  assert.equal(result.before.coins,result.after.coins);
  assert.equal(result.before.attempts,result.after.attempts);
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.getElementById('mk872AvatarViewer').classList.contains('mk872-open')&&!history.state?.__mk30PetViewer,null,{timeout:15000});
  assert(await page.evaluate(()=>document.activeElement?.id==='v285-probe-2'),'Escape must restore focus');
  await page.locator('#v285-probe-1').press('Enter');
  await close.waitFor({state:'attached'});
  if(!missing)await page.locator('#mk872AvatarViewer .mk872-viewer-content[data-v-app]').waitFor();
  assert(await close.evaluate(el=>el===document.activeElement),'Viewer must focus close button');
  await close.press('Space');
  await page.waitForFunction(()=>!document.getElementById('mk872AvatarViewer').classList.contains('mk872-open')&&!history.state?.__mk30PetViewer,null,{timeout:15000});
  assert(await page.evaluate(()=>document.activeElement?.id==='v285-probe-1'),'Close must restore focus');
  await page.locator('#v285-probe-2').press('Enter');
  await close.waitFor({state:'attached'});
  if(!missing)await page.locator('#mk872AvatarViewer .mk872-viewer-content[data-v-app]').waitFor();
  await page.goBack();
  await page.waitForFunction(()=>!document.getElementById('mk872AvatarViewer').classList.contains('mk872-open')&&!history.state?.__mk30PetViewer,null,{timeout:15000});
  const after=await page.evaluate(()=>({profile:state.profileId,xp:state.xp,coins:state.coins,
    attempts:state.attemptHistory?.length||0,route:JSON.stringify(mk854Route())}));
  assert.deepEqual(after,{profile:result.before.profile,xp:result.before.xp,coins:result.before.coins,
   attempts:result.before.attempts,route:result.before.route});
  assert.deepEqual(errors,[]);
  console.log('PASS_V285_ARTWORK_BROWSER',JSON.stringify({width,missing,first,
   offlineF5:!missing,detachedCloseInert:true,keyboardEnterSpaceEscape:true,backRestoresRoute:true,
   focusRestored:true,progressRewardsUnchanged:true}));
 }finally{await ctx.close()}
}
withMatkvestBrowser(async(browser,url)=>{
 await verify(browser,url,390);
 await verify(browser,url,1280);
 await verify(browser,url,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
