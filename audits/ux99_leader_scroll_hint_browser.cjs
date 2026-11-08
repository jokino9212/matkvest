'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),path=require('node:path'),fs=require('node:fs');
const out='audits/ux99_leader_hint_output';fs.mkdirSync(out,{recursive:true});
(async()=>{
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
for(const width of [320,360,390,430,768,1280]){
 const page=await b.newPage({viewport:{width,height:800},isMobile:width<500,hasTouch:width<500});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{
  const p=ensureProfileIdentity({...EMPTY_STATE,coins:4000,xp:22000});
  profiles={'Ученик МатКвест':p};currentProfile='Ученик МатКвест';state=p;openLeaderboard();
 });
 if(width<=480)await page.locator('#modal .mk-ux99-scroll-hint').waitFor({state:'attached'});
 const before=await page.evaluate(()=>{
  const wrap=document.querySelector('#modal .leader-table').parentElement;
  const hint=document.querySelector('#modal .mk-ux99-scroll-hint');
  return {client:wrap.clientWidth,scroll:wrap.scrollWidth,left:wrap.scrollLeft,
   hint:hint?getComputedStyle(hint).display:'absent',label:hint?.innerText||'',
   aria:wrap.getAttribute('aria-label'),count:document.querySelectorAll('#modal .mk-ux99-scroll-hint').length};
 });
 if(width<=480){assert(before.scroll>before.client+50,'No horizontal data '+JSON.stringify(before));assert.equal(before.count,1)}
 if(width<=480){
  assert.notEqual(before.hint,'none','Mobile hint not visible '+JSON.stringify(before));
  assert(before.label.includes('XP')&&before.label.includes('монеты')&&before.label.includes('коллекция'),'Missing discoverability text '+JSON.stringify(before));
  await page.screenshot({path:out+'/leader_initial_'+width+'.png',animations:'disabled'});
  await page.evaluate(()=>{
   const wrap=document.querySelector('#modal .leader-table').parentElement;
   wrap.scrollLeft=wrap.scrollWidth-wrap.clientWidth;
   wrap.dispatchEvent(new Event('scroll'));
  });
  const after=await page.evaluate(()=>({
   left:document.querySelector('#modal .leader-table').parentElement.scrollLeft,
   hint:document.querySelector('#modal .mk-ux99-scroll-hint').innerText,
   header:[...document.querySelectorAll('#modal .leader-table th')].map(x=>x.innerText)
  }));
  assert(after.left>100,'Failed horizontal scrolling '+JSON.stringify(after));
  assert(after.hint.includes('вправо'),'Reverse scroll instruction missing '+JSON.stringify(after));
  assert(after.header.includes('XP')&&after.header.includes('Монеты'),'Data columns missing');
  await page.screenshot({path:out+'/leader_scrolled_'+width+'.png',animations:'disabled'});
 }else{
  assert(['none','absent'].includes(before.hint),'Desktop hint should be hidden '+JSON.stringify(before));
  await page.screenshot({path:out+'/leader_desktop_'+width+'.png',animations:'disabled'});
 }
 assert.deepEqual(errors,[],'Page errors');
 console.log('UX99_LEADER_HINT_PASS',width,JSON.stringify(before));
 await page.close();
}
}finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});