'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs');
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  fs.mkdirSync('audits/screenshots',{recursive:true});
  for(const width of [320,360,375,390,412,520,768]){
   const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1,isMobile:width<=520,hasTouch:width<=520});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const hasApp=await page.evaluate(()=>typeof openColumn==='function' && typeof renderDivision==='function' && typeof divisionSteps==='function');
   assert(hasApp,'Actual application functions missing at width '+width+'; errors: '+errors.slice(0,3).join(' | '));
   await page.evaluate(()=>{
     startColumnStage('div',0);
     task={a:14067,b:3,quotient:'4689',ans:4689,steps:divisionSteps(14067,3)};
     renderDivision();
   });
   await page.locator('.column-modal .div-layout .qin').first().waitFor();
   const geo=await page.evaluate(()=>{
    const card=document.querySelector('.column-modal .card').getBoundingClientRect();
    const layout=document.querySelector('.column-modal .div-layout').getBoundingClientRect();
    const selectors=['.div-fixed','.div-work-in','.div-op','.div-rule','.qin','.divisor-box'];
    const parts=selectors.flatMap(sel=>[...document.querySelectorAll('.column-modal .div-layout '+sel)]);
    const boxes=parts.map(el=>el.getBoundingClientRect());
    const over=boxes.map((b,i)=>({i,left:b.left,right:b.right})).filter(b=>b.left <card.left-2 || b.right>card.right+2);
    return {card:{left:card.left,right:card.right},layout:{left:layout.left,right:layout.right},count:parts.length,over,screen:innerWidth};
   });
   assert(geo.count>=20, 'Missing division cells: '+JSON.stringify({width,geo}));
   assert.equal(geo.over.length,0,'Real example 14067÷3 clipped at '+width+': '+JSON.stringify(geo));
   assert(geo.layout.right<=width+1,'Whole long-division layout goes beyond viewport '+width);
   await page.locator('.column-modal .qin').first().fill('4');
   assert.equal(await page.locator('.column-modal .qin').first().inputValue(),'4');
   await page.screenshot({path:'audits/screenshots/division-real-'+width+'.png'});
   console.log('PASS actual app 14067÷3 at '+width+'px');
   await page.close();
  }
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
