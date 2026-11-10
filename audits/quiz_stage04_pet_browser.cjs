'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},isMobile:width<500,hasTouch:width<500});
   const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const initial=await page.evaluate(()=>{
     startG5QuizStage('frac_to_mixed',0);
     const pet=SHOP_CATALOG.pets.find(x=>x.id!=='pet_none');
     const node=document.createElement('div');
     node.id='stage04PetFixture';node.className='pet-mini';node.textContent=pet?.name?'🐾':'🐱';
     document.querySelector('#qstage').appendChild(node);
     return {id:blockSession.attemptId,done:blockSession.done,xp:state.xp,coins:state.coins,petId:pet?.id};
   });
   const open=async()=>{
     await page.locator('#stage04PetFixture').click();
     return page.evaluate(()=>({viewer:document.getElementById('mk872AvatarViewer')?.classList.contains('mk872-open'),
       dialog:!!document.querySelector('.mk872-training-dialog'),attempt:blockSession?.attemptId}));
   };
   const results=[];
   for(const method of ['close','backdrop','esc','back']){
     const opened=await open();
     if(!opened.viewer)throw Error('Pet did not open '+JSON.stringify(opened));
     if(method==='close')await page.locator('#mk872AvatarViewer .mk872-viewer-close').click();
     if(method==='backdrop')await page.locator('#mk872AvatarViewer').click({position:{x:4,y:4}});
     if(method==='esc')await page.keyboard.press('Escape');
     if(method==='back')await page.goBack({waitUntil:'domcontentloaded'});
     const after=await page.evaluate(()=>({viewer:document.getElementById('mk872AvatarViewer')?.classList.contains('mk872-open'),
       dialog:!!document.querySelector('.mk872-training-dialog'),attempt:blockSession?.attemptId,
       done:blockSession?.done,xp:state.xp,coins:state.coins,draft:mk872ReadDraft()?.attemptId}));
     results.push({method,opened,after});
     console.log('STAGE04_PET_OBSERVE',JSON.stringify({width,method,opened,after}));
     assert.equal(after.viewer,false,'Pet viewer did not close by '+method);
     assert.equal(after.dialog,false,'Exit training dialog appeared after '+method);
     assert.equal(after.attempt,initial.id,'Pet close changed active attempt');
     assert.equal(after.done,initial.done,'Pet close changed training progress');
     assert.equal(after.xp,initial.xp,'Pet close changed XP');
     assert.equal(after.coins,initial.coins,'Pet close changed coins');
     assert.equal(after.draft,initial.id,'Pet close removed training draft');
   }
   console.log('STAGE04_PET_GATE_PASS',JSON.stringify({width,initial,results,errors}));
   await ctx.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE04_TEST_ERROR',e.stack||e);process.exit(1)});
