'use strict';
const { chromium }=require('playwright');
const path=require('node:path');
const fs=require('node:fs');
async function main(){
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
try{
for(const width of [320,360,390,412,430,768,1024]){
 const context=await browser.newContext({viewport:{width,height:740},isMobile:width<=430,hasTouch:width<=430});
 const page=await context.newPage(); const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const cases=[
  ['shop',()=>page.evaluate(()=>openShop('avatars','all'))],
  ['collection',()=>page.evaluate(()=>openCollection())],
  ['journal',()=>page.evaluate(()=>openAttemptJournal())],
  ['grade6',()=>page.evaluate(()=>openGrade(6))],
  ['grade8',()=>page.evaluate(()=>openGrade(8))],
  ['profile',()=>page.evaluate(()=>{const el=document.querySelector('.profile-pill');if(el)el.click();else throw new Error('Profile entry missing')})],
 ];
 for(const [name,run] of cases){
  try {await run();await page.waitForTimeout(70)} catch(e){console.log('OPEN_ERROR',width,name,e.message.slice(0,180));failures.push({width,name,type:'open-error',error:e.message.slice(0,180)});continue}
  const result=await page.evaluate(()=>{
    const vw=document.documentElement.clientWidth;
    const modal=document.getElementById('modal');
    const visible=modal && getComputedStyle(modal).display!=='none'&&modal.getBoundingClientRect().width>0;
    const container=visible?modal:document.getElementById('mainView');
    const box=container?.getBoundingClientRect();
    const nodes=Array.from(container?.querySelectorAll('button,input,select,textarea,.shop-card,.mk872-col-card,.report-card,.quizq,.lesson,.stage-card')||[]);
    const tabs=container?.querySelector('.shop-tabs');
    const tabStatus=tabs?{scrollWidth:tabs.scrollWidth,clientWidth:tabs.clientWidth,overflowX:getComputedStyle(tabs).overflowX,lastTab:tabs.querySelector('.shop-tab:last-child')?.textContent}:null;
    const overflow=nodes.filter(el=>{if(el.closest('.shop-tabs') && tabs && ['auto','scroll'].includes(getComputedStyle(tabs).overflowX))return false;
      const st=getComputedStyle(el);if(st.display==='none'||st.visibility==='hidden')return false;
      const r=el.getBoundingClientRect();return r.width>0&&(r.left<Math.max(0,box.left)-3||r.right>Math.min(vw,box.right)+3);
    }).slice(0,12).map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName,cls:String(el.className).slice(0,60),left:Math.round(r.left),right:Math.round(r.right)}});
    const smallTargets=nodes.filter(el=>el.matches('button,input,select')&&getComputedStyle(el).display!=='none').filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.height<32}).slice(0,6).map(el=>({tag:el.tagName,cls:String(el.className).slice(0,60),height:Math.round(el.getBoundingClientRect().height)}));
    return {vw,scrollWidth:document.documentElement.scrollWidth,visible,container:box&&{left:Math.round(box.left),right:Math.round(box.right),width:Math.round(box.width)},overflow,smallTargets,count:nodes.length,tabStatus};
  });
  console.log('SCREEN',width,name,JSON.stringify(result));
  if(result.scrollWidth>width+2||result.overflow.length)failures.push({width,name,type:'overflow',data:result});
  if(errors.length)failures.push({width,name,type:'page-errors',errors:errors.slice(0,3)});
 }
 await context.close();
}
}finally{await browser.close()}
console.log('SUMMARY',JSON.stringify({count:failures.length,failures:failures.slice(0,35)}));
if(failures.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
