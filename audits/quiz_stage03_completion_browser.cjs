'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
 for(const width of [320,390,1280]){
  for(const [topic,starter] of [
    ['frac_to_mixed','g5'],
    ['mixed_to_frac','g5'],
    ['g8:square_root_arithmetic','g8']
  ]){
   const ctx=await browser.newContext({viewport:{width,height:850},isMobile:width<500,hasTouch:width<500});
   const page=await ctx.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const init=await page.evaluate(({topic,starter})=>{
      if(starter==='g5')startG5QuizStage(topic,0);
      else startG8QuizStage(topic,0);
      return {id:blockSession.attemptId,total:blockSession.total,xp:state.xp,coins:state.coins};
   },{topic,starter});
   assert(init.total>=5&&init.total<=20,'unexpected question count');
   for(let i=0;i<init.total;i++){
    const before=await page.evaluate(()=>({done:blockSession.done,correct:blockSession.correct,
      current:q.text,correctText:String(q.correctText||correctChoicePlain(q)),ex:q.ex||'',xp:state.xp,coins:state.coins}));
    await page.locator('#quizSkip').click();
    const confirm=page.locator('.mk872-training-dialog button').filter({hasText:'Да, пропустить задание'});
    await confirm.click();
    const after=await page.evaluate(()=>({done:blockSession.done,correct:blockSession.correct,
      xp:state.xp,coins:state.coins,answered,q:q.text,finished:blockSession.finished,
      feedback:document.getElementById('qfb')?.textContent||'',
      next:document.getElementById('quizNext')?.textContent,
      nextVisible:!!document.getElementById('quizNext')?.offsetParent}));
    assert.equal(after.done,before.done+1,'skipped count incorrect');
    assert.equal(after.correct,before.correct,'skipped question got credited');
    assert.equal(after.xp,before.xp,'skip unexpectedly changed XP');
    assert.equal(after.coins,before.coins,'skip unexpectedly changed coins');
    assert.equal(after.q,before.current,'skip advanced without reveal');
    assert(after.feedback.includes('Правильный ответ:'),'answer hidden on skip');
    assert(after.answered&&after.nextVisible,'missing Next after skip');
    if(i===init.total-1){
      assert(after.finished,'last skip did not finish block counter');
      assert(after.next.includes('Посмотреть результат'),'final skip did not show result action');
    }else assert(after.next.includes('Следующий пример'),'not showing next question action');
    await page.locator('#quizNext').click();
   }
   const result=await page.evaluate(id=>({
     done:blockSession.done,total:blockSession.total,reportId:blockSession.reportId,
     history:(state.attemptHistory||[]).filter(x=>x.id===id).length,
     correct:blockSession.correct,xp:state.xp,coins:state.coins,
     draft:!!mk872ReadDraft(),resultText:document.querySelector('.block-result')?.textContent?.slice(0,170)||''
   }),init.id);
   assert.equal(result.done,result.total);
   assert.equal(result.correct,0);
   assert(result.reportId,'missing finalized report');
   assert.equal(result.history,1,'missing or duplicate final result');
   assert.equal(result.xp,init.xp,'skipped-only training gave XP');
   assert.equal(result.coins,init.coins,'skipped-only training gave coins');
   assert.equal(result.draft,false,'completed draft not cleaned');
   assert.deepEqual(errors,[],'browser errors');
   console.log('STAGE03_FULL_SKIP_PASS',JSON.stringify({width,topic,init,result}));
   await ctx.close();
  }
 }
 console.log('STAGE03_ALL_FINAL_PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE03_FULL_SKIP_FAIL',e.stack||e);process.exit(1)});
