'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   for(const n of [0,1,2,3]){
    for(const mode of ['background','button','keyboard']){
     const ctx=await browser.newContext({viewport:{width,height:840},isMobile:width<500,hasTouch:width<500});
     const page=await ctx.newPage();
     const errs=[];page.on('pageerror',e=>errs.push(e.message));
     await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
     await page.evaluate(()=>renderHome());
     const card=page.locator('.quick-card').nth(n);
     const before=await card.evaluate(e=>({html:e.outerHTML.slice(0,1100),btn:e.querySelector('button')?.outerHTML,
       parent:e.parentElement?.outerHTML.slice(0,300),onClick:e.getAttribute('onclick'),
       rect:{left:e.getBoundingClientRect().left,top:e.getBoundingClientRect().top,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}}));
     if(mode==='background')await card.click({position:{x:8,y:8}});
     if(mode==='button')await card.locator('button').click();
     if(mode==='keyboard'){await card.focus();await page.keyboard.press('Enter')}
     await page.waitForTimeout(90);
     const after=await page.evaluate(()=>({url:location.href,block:blockSession?{kind:blockSession.kind,key:blockSession.key,done:blockSession.done}:null,
       q:!!q,overlay:document.getElementById('overlay')?.className,
       mainText:document.getElementById('mainView')?.textContent?.slice(0,200),
       modalText:document.getElementById('modal')?.textContent?.slice(0,200),
       activeElement:document.activeElement?.outerHTML.slice(0,150)}));
     const titles=['Таблица умножения','Таблица сложения','Квадраты чисел','Кубы чисел'];
     assert(after.mainText.includes(titles[n]),'Quick action failed '+JSON.stringify({width,n,mode,after}));
     assert.deepEqual(errs,[],'Browser errors at '+width+'/'+n+'/'+mode);
     if(mode==='background'){
       assert(before?.html?.includes('role="button"'),'Surface lacks semantic role');
     }
     console.log('STAGE07B_ACTION_COMPARISON',JSON.stringify({width,n,mode,before:mode==='background'?before:undefined,after,errors:errs}));
     await ctx.close();
    }
   }
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE07B_ACTION_FAIL',e.stack||e);process.exitCode=1});
