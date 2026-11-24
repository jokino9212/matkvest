'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');

async function verify(browser,url,width,missing=false){
 const ctx=await browser.newContext({viewport:{width,height:860},isMobile:width<600,hasTouch:width<600,serviceWorkers:'block'});
 if(missing){
  await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await ctx.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof mk854Route==='function'&&mk854HistoryReady===true,null,{timeout:30000});
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
  assert.equal(result.before.profile,result.after.profile);
  assert.equal(result.before.xp,result.after.xp);
  assert.equal(result.before.coins,result.after.coins);
  assert.equal(result.before.attempts,result.after.attempts);
  assert.deepEqual(errors,[]);
  console.log('V285_ARTWORK_PREFLIGHT',JSON.stringify({width,missing,first,...result}));
 }finally{await ctx.close()}
}
withMatkvestBrowser(async(browser,url)=>{
 await verify(browser,url,390);
 await verify(browser,url,1280);
 await verify(browser,url,390,true);
}).catch(e=>{console.error(e);process.exitCode=1});
