'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const all=[];
 try{
  for(const width of [320,360,390,412,430,680,768,1024,1280]){
   const page=await browser.newPage({viewport:{width,height:840},isMobile:width<=430,hasTouch:width<=430});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>renderHome());
   const initial=await page.evaluate(()=>{
     const cards=[...document.querySelectorAll('#mainView .grade-grid>.grade-card')];
     const issues=[];
     const screen=document.documentElement.clientWidth;
     const interactive=cards.map(el=>({
       name:el.querySelector('h2')?.textContent.trim(),role:el.getAttribute('role'),tabindex:el.getAttribute('tabindex'),
       cursor:getComputedStyle(el).cursor,hasButton:!!el.querySelector('button'),box:el.getBoundingClientRect().toJSON()
     }));
     if(document.documentElement.scrollWidth>screen+2) issues.push({type:'horizontal-overflow',scroll:document.documentElement.scrollWidth,screen});
     return {screen,interactive,issues};
   });
   for(const grade of [1,4,6,8]){
     await page.evaluate(()=>renderHome());
     const card=page.locator('#mainView .grade-grid>.grade-card').filter({has:page.locator('h2', {hasText:grade+' КЛАСС'})}).first();
     await card.locator('h2').click();
     const actual=await page.evaluate(()=>currentGrade);
     if(actual!==grade) initial.issues.push({type:'card-body-click-broken',grade,actual});
     await page.evaluate(()=>renderHome());
   }
   await page.evaluate(()=>renderHome());
   const card1=page.locator('#mainView .grade-grid>.grade-card').filter({has:page.locator('h2',{hasText:'1 КЛАСС'})}).first();
   const keyboard=await card1.evaluate(el=>({role:el.getAttribute('role'),tabindex:el.tabIndex}));
   if(keyboard.tabindex<0||keyboard.role!=='button')initial.issues.push({type:'inaccessible-card',keyboard});
   else{
     await card1.focus();await page.keyboard.press('Enter');
     if((await page.evaluate(()=>currentGrade))!==1)initial.issues.push({type:'card-keyboard-enter-failed'});
   }
   await page.evaluate(()=>renderHome());
   const toggle=page.locator('.mk-ui19-nav-toggle');
   if(await toggle.count() && await toggle.isVisible()){
     await toggle.click();
     const expanded=await toggle.getAttribute('aria-expanded');
     if(expanded!=='true') initial.issues.push({type:'menu-not-open',expanded});
     const navBox=await page.locator('#mk-ui19-navigation').evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,visible:getComputedStyle(el).display!=='none',screen:innerWidth}});
     if(navBox.left<-2||navBox.right>width+2)initial.issues.push({type:'menu-clipped',navBox});
     await page.keyboard.press('Escape');
     if(await toggle.getAttribute('aria-expanded')!=='false')initial.issues.push({type:'menu-escape-failed'});
   }
   if(errors.length)initial.issues.push({type:'js-errors',errors:errors.slice(0,4)});
   console.log('AUDIT',width,JSON.stringify({cards:initial.interactive.length,issues:initial.issues,menuToggleVisible:await toggle.isVisible()}));
   all.push({width,...initial});
   await page.close();
  }
 }finally{await browser.close()}
 const issues=all.flatMap(x=>x.issues.map(issue=>({width:x.width,...issue})));
 console.log('AUDIT_TOTAL_ISSUES',JSON.stringify(issues));
 if(issues.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
