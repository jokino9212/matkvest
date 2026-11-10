'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,390,768,1280]){
  const ctx=await browser.newContext({viewport:{width,height:800},isMobile:width<500,hasTouch:width<500});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>renderHome());
  await page.waitForFunction(()=>document.querySelectorAll('.quick-card[role="button"][tabindex="0"]').length===4);
  const results=[];
  for(let idx=0;idx<4;idx++){
   await page.evaluate(()=>renderHome());
   await page.waitForFunction(()=>document.querySelectorAll('.quick-card[role="button"][tabindex="0"]').length===4);
   const candidate=page.locator('.quick-card').nth(idx);
   const info=await candidate.evaluate(card=>({
    label:card.getAttribute('aria-label'),role:card.getAttribute('role'),tabindex:card.tabIndex,
    childTabindex:card.querySelector('button')?.tabIndex,buttons:card.querySelectorAll('button').length
   }));
   assert.equal(info.role,'button');assert.equal(info.tabindex,0);
   assert.equal(info.buttons,1);assert.equal(info.childTabindex,-1);
   assert(info.label?.length>0,'Missing accessible name');
   const count=await page.evaluate(i=>{
    window._quickCardEventCounter=0;
    document.querySelectorAll('.quick-card')[i].querySelector('button').addEventListener('click',()=>{window._quickCardEventCounter++});
    return window._quickCardEventCounter;
   },idx);
   assert.equal(count,0);
   await candidate.focus();
   assert(await candidate.evaluate(n=>document.activeElement===n),'Quick card cannot receive focus');
   await page.keyboard.press(idx%2?'Space':'Enter');
   const clickCount=await page.evaluate(()=>window._quickCardEventCounter);
   assert.equal(clickCount,1,'Keyboard did not activate exactly one button');
   results.push({idx,key:idx%2?'Space':'Enter',label:info.label,clicked:clickCount});
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(overflow<=2,'Horizontal overflow at '+width);
  assert.deepEqual(errors,[],'Browser errors');
  console.log('STAGE07_KEYBOARD_PASS',JSON.stringify({width,results,overflow}));
  await ctx.close();
 }
}finally{await browser.close()}
})().catch(e=>{console.error('STAGE07_KEYBOARD_FAIL',e.stack||e);process.exit(1)});
