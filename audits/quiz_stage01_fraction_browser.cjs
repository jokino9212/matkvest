'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
    const failures=[],samples=[];let total=0;
    const check=(label,question,raw)=>{
      qid=label.startsWith('improper')?'g5:mixed_to_frac':'g5:frac_to_mixed';
      const out=quizInputEvaluation(question,raw);total++;
      if(!out.valid||!out.ok)failures.push({label,raw,out,expected:question.correctText,answerRat:question.answerRat});
      if(samples.length<8)samples.push({label,valid:out.valid,ok:out.ok,detail:out.detail,form:question.stage18AnswerForm});
    };
    for(let d=2;d<=17;d++){
      for(let w=1;w<=5;w++){
        let n=(w*7+d*3)%(d-1)+1;
        const num=w*d+n;
        const mixedQ={answerMode:'fraction',answerRat:rational(num,d),correctText:w+' '+n+'/'+d,correctHtml:mixed(w,n,d),stage18AnswerForm:{kind:'mixed'},requireReduced:false};
        check('mixed '+num+'/'+d,mixedQ,{stage18Fraction:true,whole:String(w),numerator:String(n),denominator:String(d)});
        const improperQ={answerMode:'fraction',answerRat:rational(num,d),correctText:num+'/'+d,correctHtml:frac(num,d),stage18AnswerForm:{kind:'improper'},requireReduced:false};
        check('improper '+num+'/'+d,improperQ,{stage18Fraction:true,whole:'',numerator:String(num),denominator:String(d)});
      }
    }
    const q26={answerMode:'fraction',answerRat:rational(26,9),correctText:'2 8/9',correctHtml:mixed(2,8,9),stage18AnswerForm:{kind:'mixed'},requireReduced:false};
    check('reported 26/9',q26,{stage18Fraction:true,whole:'2',numerator:'8',denominator:'9'});
    return {parseDirect:parseRationalInput('26/9'),parseMixed:parseRationalInput('2 8/9'),parseBoxes:stage18ParseFractionFields({whole:'2',numerator:'8',denominator:'9'}),usesBoxes:stage18UsesFractionBoxes({answerMode:'fraction'}),total,failures:failures.slice(0,30),failureCount:failures.length,samples};
  });
  console.log('STAGE01_BROWSER_RESULT',JSON.stringify(result));
  assert.equal(errors.length,0,'Runtime page errors: '+errors.slice(0,5).join('; '));
  assert.equal(result.failureCount,0,'Incorrect fraction grading: '+JSON.stringify(result.failures.slice(0,3)));
  console.log('STAGE01_FRACTION_BROWSER_PASS',result.total);
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
