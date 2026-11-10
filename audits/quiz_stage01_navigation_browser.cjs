'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const file='file://'+path.resolve('index.html');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const reports=[];
try{
 for(const width of [390,1280]){
  const ctx=await browser.newContext({viewport:{width,height:850},isMobile:width<500,hasTouch:width<500});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(file,{waitUntil:'domcontentloaded'});
  for(const topic of ['frac_to_mixed','mixed_to_frac']){
  for(let repeat=0;repeat<3;repeat++){
   let startup=await page.evaluate(({topic,stage})=>{
     if(typeof startG5QuizStage!=='function')return {error:'startG5QuizStage is not available'};
     startG5QuizStage(topic,stage);
     return {qid,mode:q?.answerMode,question:q?.text?.slice(0,150),started:!!blockSession,
       total:blockSession?.total,next:document.querySelector('#quizNext')?.outerHTML?.slice(0,150),
       check:document.querySelector('#quizCheck')?.outerHTML?.slice(0,150)};
   },{topic,stage:repeat});
   if(startup.error)throw Error(JSON.stringify(startup));
   const cases=[];
   for(let i=0;i<18;i++){
    const before=await page.evaluate(()=>{
     const box=document.createElement('div');box.innerHTML=q.correctHtml||q.correctLabel||'';
     const fract=box.querySelector('.frac'),whole=box.querySelector('.mixed .whole');
     const n=fract?.querySelector('.num')?.textContent?.trim()||'';
     const d=fract?.querySelector('.den')?.textContent?.trim()||'';
     const w=whole?.textContent?.trim()||(fract?'':(/^[-+]?\d+$/.test(String(q.correctText||''))?String(q.correctText):''));
     return {qid,sourceTopicId:q?.sourceTopicId,text:q?.text,correct:q?.correctText,
       correctHtml:q?.correctHtml,answerMode:q?.answerMode,form:q?.stage18AnswerForm,answerRat:q?.answerRat,
       raw:{stage18Fraction:true,whole:w,numerator:n,denominator:d},
       done:blockSession?.done,total:blockSession?.total,finished:blockSession?.finished,
       fieldCount:document.querySelectorAll('#quizFracWhole,#quizFracNum,#quizFracDen').length};
    });
    if(before.finished)break;
    if(before.fieldCount!==3||before.answerMode!=='fraction')throw Error('Expected 3 boxes '+JSON.stringify(before));
    await page.locator('#quizFracWhole').fill(before.raw.whole);
    await page.locator('#quizFracNum').fill(before.raw.numerator);
    await page.locator('#quizFracDen').fill(before.raw.denominator);
    await page.locator('#quizCheck').click();
    const after=await page.evaluate(()=>({evaluation:quizInputEvaluation(q,quizInputRaw(q)),answered,done:blockSession?.done,finished:blockSession?.finished,
      feedback:document.querySelector('#qfb')?.textContent?.slice(0,220),
      checkVisible:document.querySelector('#quizCheck')?.getBoundingClientRect().width>0,
      nextVisible:document.querySelector('#quizNext')?.getBoundingClientRect().width>0,
      qid,question:q?.text?.slice(0,100)}));
    cases.push({i:i+1,before:{qid:before.qid,topic:before.sourceTopicId,correct:before.correct,form:before.form,answerRat:before.answerRat,raw:before.raw,done:before.done},after});
    if(!after.answered)throw Error('Rejected valid answer '+JSON.stringify(cases.at(-1)));
    if(!after.nextVisible)throw Error('Next button missing '+JSON.stringify(cases.at(-1)));
    await page.locator('#quizNext').click();
    const moved=await page.evaluate(()=>({qid,done:blockSession?.done,finished:blockSession?.finished,question:q?.text?.slice(0,80)}));
    if(after.finished)break;
    if(moved.done<=before.done)throw Error('Next did not move progress '+JSON.stringify({before,after,moved}));
   }
   const report={width,topic,stage:repeat,startup,count:cases.length,checks:cases.map(x=>({i:x.i,ok:x.after.answered,done:x.after.done})),errors:errors.slice(0,4)};
   reports.push(report);console.log('STAGE01_REAL_NEXT',JSON.stringify(report));
   if(errors.length)throw Error('Browser errors '+JSON.stringify(errors));
   if(cases.length<5)throw Error('Insufficient real navigation '+JSON.stringify(report));
  }
  }
  await ctx.close();
 }
 console.log('STAGE01_REAL_NEXT_PASS',JSON.stringify({scenarios:reports.length,totalAnswered:reports.reduce((s,r)=>s+r.count,0)}));
}finally{await browser.close()}
})().catch(e=>{console.error('STAGE01_REAL_NEXT_FAIL',e.stack||e);process.exit(1)});
