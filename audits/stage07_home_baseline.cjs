'use strict';
const assert=require('node:assert/strict');
const path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const result=[];
  for(const width of [320,390,768,1280]){
   const context=await browser.newContext({viewport:{width,height:800},isMobile:width<500,hasTouch:width<500});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>renderHome());
   const audit=await page.evaluate(()=>{
    const list=[...document.querySelectorAll('.grade-card')].map((e,i)=>{
      const r=e.getBoundingClientRect(),button=e.querySelector('button'),s=getComputedStyle(e);
      return {i,cls:String(e.className),tag:e.tagName,role:e.getAttribute('role'),tabindex:e.getAttribute('tabindex'),
        cursor:s.cursor,button:button?.textContent.trim().slice(0,60),buttonCount:e.querySelectorAll('button').length,
        onclick:!!e.onclick,aria:e.getAttribute('aria-label'),w:Math.round(r.width),h:Math.round(r.height)};
    });
    const quick=[...document.querySelectorAll('.quick-card')].map(e=>({role:e.getAttribute('role'),
      tabindex:e.getAttribute('tabindex'),buttonCount:e.querySelectorAll('button').length,onclick:!!e.onclick,cursor:getComputedStyle(e).cursor}));
    const shop=typeof mk30CollectionWorth==='function';
    return {classes:list,quick,worthAvailable:shop,bodyOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      reducedMotionStyles:[...document.styleSheets].length};
   });
   const allGrade=audit.classes.length;
   if(!allGrade)throw Error('No grade cards rendered');
   assert(audit.bodyOverflow<=2,'Home overflow at '+width);
   assert.equal(errors.length,0,'Browser errors '+JSON.stringify(errors));
   result.push({width,...audit});
   console.log('STAGE07_HOME_BASELINE',JSON.stringify({width,...audit}));
   await context.close();
  }
  console.log('STAGE07_AUDIT_PASS',JSON.stringify({widths:result.map(x=>x.width),classCounts:result.map(x=>x.classes.length),quickCounts:result.map(x=>x.quick.length)}));
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE07_AUDIT_FAIL',e.stack||e);process.exit(1)});
