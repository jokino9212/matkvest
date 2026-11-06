'use strict';
const {chromium}=require('playwright');
const path=require('node:path');
const assert=require('node:assert/strict');
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let issues=[];
 try{
  for(const width of [320,360,390,412,430,768]){
   const ctx=await browser.newContext({viewport:{width,height:740},isMobile:width<500,hasTouch:width<500});
   let page;const errors=[];
   const cases=[
    ['column-division',async()=>{
      await page.evaluate(()=>{startColumnStage('div',0);task={a:14067,b:3,quotient:'4689',ans:4689,steps:divisionSteps(14067,3)};renderDivision()});
      await page.locator('.column-modal .qin').first().waitFor();
      return '.column-modal .qin';
    }],
    ['grade6-topic',async()=>{
      await page.evaluate(()=>openGrade(6));
      const topic=page.locator('#mainView .topic:not(.locked):not(.disabled):not(.soon)').first();
      await topic.click({timeout:5000});
      return '#modal input:visible,#modal textarea:visible';
    }],
    ['grade5-topic',async()=>{
      await page.evaluate(()=>openGrade(5));
      const topic=page.locator('#mainView .topic:not(.locked):not(.disabled):not(.soon)').first();
      await topic.click();
      return '#modal input:visible,#modal textarea:visible';
    }],
   ];
   for(const [name,open] of cases){
    page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
    let sel;try{sel=await open()}catch(e){issues.push({width,name,type:'opening-error',error:e.message.slice(0,150)});continue}
    const snapshot=await page.evaluate(()=>{
      const el=document.querySelector('.column-modal')||document.querySelector('#modal');
      const root=el&&el.getBoundingClientRect(); const vw=document.documentElement.clientWidth;
      const controls=[...(el?.querySelectorAll('input,textarea,select,button,.quizq,.lesson,.stage-card,.column-modal .div-layout')||[])].filter(e=>{
       const r=e.getBoundingClientRect();return r.width>0 && r.height>0&&getComputedStyle(e).visibility!=='hidden'
      });
      const bad=controls.filter(e=>{if(e.closest('.shop-tabs'))return false;const r=e.getBoundingClientRect();return r.left < Math.max(0,root.left)-3 || r.right>Math.min(vw,root.right)+3}).slice(0,8).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,50),left:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right)}));
      return {vw,scrollWidth:document.documentElement.scrollWidth,root:root&&{left:root.left,right:root.right},controls:controls.length,bad};
    });
    if(snapshot.scrollWidth>width+2||snapshot.bad.length)issues.push({width,name,type:'horizontal-overflow',snapshot});
    const first=page.locator(sel).first();
    if(await first.count() && await first.isVisible()){
      await first.focus();
      await page.setViewportSize({width,height:420});
      await first.evaluate(el=>el.scrollIntoView({block:'nearest',inline:'nearest'}));
      const state=await first.evaluate(el=>{
       const r=el.getBoundingClientRect();
       const vh=document.documentElement.clientHeight;
       const ancestors=[];
       for(let p=el.parentElement;p;p=p.parentElement){
        const cs=getComputedStyle(p);
        if(/auto|scroll/.test(cs.overflowY))ancestors.push({cls:String(p.className).slice(0,40),scrollHeight:p.scrollHeight,clientHeight:p.clientHeight,scrollTop:p.scrollTop});
       }
       return {top:Math.round(r.top),bottom:Math.round(r.bottom),viewportHeight:vh,focused:document.activeElement===el,ancestors};
      });
      console.log('KEYBOARD',width,name,JSON.stringify(state));
      if(!state.focused||state.top<0||state.bottom>420+3)issues.push({width,name,type:'keyboard-focus-not-visible',state});
      await page.setViewportSize({width,height:740});
    }
    console.log('SCREEN',width,name,JSON.stringify(snapshot));
    await page.close();
   }
   if(errors.length)issues.push({width,type:'pageerror',errors:errors.slice(0,3)});
   await ctx.close();
  }
 }finally{await browser.close()}
 console.log('ISSUES',JSON.stringify(issues.slice(0,40)));
 if(issues.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
