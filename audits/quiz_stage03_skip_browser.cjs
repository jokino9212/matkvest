'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let reports=[];
 try{
 for(const width of [390,1280]){
  const ctx=await browser.newContext({viewport:{width,height:800},isMobile:width<500,hasTouch:width<500});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  for(const topic of ['frac_to_mixed','mixed_to_frac']){
   await page.evaluate(topic=>startG5QuizStage(topic,0),topic);
   const before=await page.evaluate(()=>({
     xp:state.xp,coins:state.coins,done:blockSession.done,correct:blockSession.correct,
     id:blockSession.attemptId,itemId:blockSession.currentItem?.id,
     qid,text:q.text,correctText:String(q.correctText||correctChoicePlain(q)),
     correctHtml:q.correctHtml||'',ex:q.ex||'',draft:mk872ReadDraft()?.attemptId}));
   await page.locator('#quizSkip').click({timeout:5000});
   const dialog=await page.evaluate(()=>[...document.querySelectorAll('.mk872-training-dialog, [role="dialog"]')].map(el=>({text:el.textContent?.slice(0,380),buttons:[...el.querySelectorAll('button')].map(b=>b.textContent?.trim())})));
   if(dialog.length){console.log('STAGE03_SKIP_CONFIRM_DIALOG',JSON.stringify({width,topic,dialog}));
     const confirm=page.locator('.mk872-training-dialog button').filter({hasText:/Пропустить|Подтвердить|Да,|Пропускаю|Продолжить|Все равно/i}).last();
     if(await confirm.count())await confirm.click({timeout:4000});
   }
   const after=await page.evaluate(()=>({
     xp:state.xp,coins:state.coins,done:blockSession?.done,correct:blockSession?.correct,answered,
     question:q?.text,feedback:document.querySelector('#qfb')?.textContent||'',
     nextVisible:!!document.querySelector('#quizNext')?.offsetParent,
     skipVisible:!!document.querySelector('#quizSkip')?.offsetParent,
     currentItem:blockSession?.currentItem,
     draft:mk872ReadDraft()?.attemptId}));
   const report={width,topic,before,after,dialog};reports.push(report);console.log('STAGE03_SKIP_OBSERVE',JSON.stringify(report));
   assert.equal(after.xp,before.xp,'Skip changed XP');
   assert.equal(after.coins,before.coins,'Skip changed coins');
  }
  if(errors.length)throw Error('Browser runtime errors '+errors.slice(0,3).join('; '));
  await ctx.close();
 }
 console.log('STAGE03_SKIP_BASELINE_COMPLETE',reports.length);
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
