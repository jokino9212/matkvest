'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const file='file://'+path.resolve('index.html');
async function run(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const cases=[],errors=[];
 try{
 for(const width of [320,390,768,1280]){
  const ctx=await browser.newContext({viewport:{width,height:780},isMobile:width<=390,hasTouch:width<=390,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push({width,error:e.message}));
  await page.goto(file,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>renderHome());
  for(let n=0;n<8;n++){
   await page.evaluate(()=>renderHome());
   const card=page.locator('.grade-card').nth(n);
   const info=await card.evaluate(e=>({role:e.getAttribute('role'),tab:e.tabIndex,buttons:e.querySelectorAll('button').length,focusVisible:getComputedStyle(e).outlineStyle,
    rect:{width:Math.round(e.getBoundingClientRect().width),height:Math.round(e.getBoundingClientRect().height)}}));
   await card.focus();
   const focus=await card.evaluate(e=>({focused:document.activeElement===e,outline:getComputedStyle(e).outlineStyle,outlineWidth:getComputedStyle(e).outlineWidth}));
   await card.press(n%2?'Space':'Enter');
   const after=await page.evaluate(()=>({overlay:document.getElementById('overlay')?.classList.contains('show'),
     main:document.getElementById('mainView')?.textContent?.slice(0,150),
     modal:document.getElementById('modal')?.textContent?.slice(0,150),
     route:typeof mk854ReadRoute==='function'?JSON.stringify(mk854ReadRoute()):'unavailable',
     gradeCards:document.querySelectorAll('.grade-card').length}));
   cases.push({width,kind:'grade',grade:n+1,info,focus,after});
   console.log('STAGE07B_GRADE',JSON.stringify({width,grade:n+1,focus,after}));
  }
  for(let n=0;n<4;n++){
   await page.evaluate(()=>renderHome());
   const card=page.locator('.quick-card').nth(n);
   const before=await card.evaluate(e=>({role:e.getAttribute('role'),tab:e.tabIndex,btn:e.querySelector('button')?.textContent.trim(),label:e.getAttribute('aria-label'),focused:document.activeElement===e}));
   await card.click({position:{x:8,y:8}});
   const after=await page.evaluate(()=>({overlay:document.getElementById('overlay')?.classList.contains('show'),
     main:document.getElementById('mainView')?.textContent?.slice(0,110),modal:document.getElementById('modal')?.textContent?.slice(0,110)}));
   cases.push({width,kind:'quick',n,before,after});
   console.log('STAGE07B_QUICK_CLICK',JSON.stringify({width,n,before,after}));
  }
  await ctx.close();
 }
 }finally{await browser.close()}
 console.log('STAGE07B_SUMMARY',JSON.stringify({cases:cases.length,pageErrors:errors,gradeFocusMissing:cases.filter(x=>x.kind==='grade'&&(!x.focus.focused||x.focus.outline==='none')).length,
  gradeNoResponse:cases.filter(x=>x.kind==='grade'&&!x.after.overlay&&x.after.gradeCards===8).map(x=>({width:x.width,grade:x.grade})),
  quickNoResponse:cases.filter(x=>x.kind==='quick'&&!x.after.overlay&&x.after.main?.includes('Быстрые тренировки')).map(x=>({width:x.width,n:x.n}))}));
 assert.deepEqual(errors,[],'Browser errors');
}
run().catch(e=>{console.error('STAGE07B_ERROR',e.stack||e);process.exitCode=1});
