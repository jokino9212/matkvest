'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const cases=[];
  for(const width of [390,1280]){
   const ctx=await browser.newContext({viewport:{width,height:840},isMobile:width<500,hasTouch:width<500});
   const page=await ctx.newPage();
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{
    startG5QuizStage('frac_to_mixed',0);
    q={...q,text:'Выдели целую часть: '+frac(26,9),answerMode:'fraction',answerRat:rational(26,9),
       correctText:'2 8/9',correctHtml:mixed(2,8,9),stage18AnswerForm:{kind:'mixed'},requireReduced:false,
       ex:'26 : 9 = 2 (ост. 8).'};
    answered=false;quizPenalty=false;
    document.querySelector('#qstage').innerHTML='<div class="quizq">'+q.text+'</div>'+quizAnswerMarkup('nextQ','skipNormalQuiz');
   });
   await page.locator('#quizFracWhole').fill('2');
   const focus=await page.evaluate(()=>({id:document.activeElement?.id,
     values:['quizFracWhole','quizFracNum','quizFracDen'].map(x=>document.getElementById(x)?.value)}));
   await page.locator('#quizFracNum').fill('8');
   await page.locator('#quizFracDen').fill('11');
   await page.locator('#quizCheck').click();
   const wrong=await page.evaluate(()=>({
    answered,feedback:document.querySelector('#qfb')?.textContent?.slice(0,180),
    classes:['quizFracWhole','quizFracNum','quizFracDen'].map(id=>({id,cls:document.getElementById(id)?.className})),
    ev:quizInputEvaluation(q,quizInputRaw(q))}));
   const sample={width,focus,wrong};cases.push(sample);
   console.log('STAGE02_BASELINE',JSON.stringify(sample));
   await ctx.close();
  }
  assert(cases.every(x=>!x.wrong.answered),'Incorrect denominator unexpectedly accepted');
  console.log('STAGE02_BASELINE_DONE',cases.length);
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
