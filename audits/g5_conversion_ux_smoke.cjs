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
   const checked=[];
   const cases=[
    ['mixed_to_frac','mixed_numerator','number'],
    ['mixed_to_frac','mixed_to_improper_0','fraction'],
    ['frac_to_mixed','improper_whole_part','number'],
    ['frac_to_mixed','improper_to_mixed_0','fraction']
   ];
   for(const [topic,template,expectedMode] of cases){
    let sample;
    for(let n=0;n<600;n++){
     const candidate=makeG5Question(topic);
     if(candidate.templateId===template){sample=candidate;break}
    }
    if(!sample)throw Error('Missing template: '+template);
    if(sample.answerMode!==expectedMode)throw Error('Wrong answer mode: '+template+' '+sample.answerMode);
    qid='g5:'+topic;q=sample;
    const markup=quizAnswerMarkup('nextQ','nextQ');
    const div=document.createElement('div');div.innerHTML=markup;
    if(expectedMode==='number'){
      if(!div.querySelector('#quizInput')||div.querySelector('#quizFracNum'))throw Error('Numeric template exposes fraction cells');
      const got=quizInputEvaluation(sample,sample.correctText);
      if(!got.valid||!got.ok)throw Error('Rejected correct numeric answer '+template);
    }else{
      if(!div.querySelector('#quizFracNum')||!div.querySelector('#quizFracDen')?.readOnly)throw Error('Denominator not fixed');
      if(topic==='mixed_to_frac'&&div.querySelector('#quizFracWhole'))throw Error('Improper answer exposes whole input');
      if(topic==='frac_to_mixed'&&!div.querySelector('#quizFracWhole'))throw Error('Mixed answer missing whole input');
      const den=sample.stage18FixedDenominator;
      const form=sample.stage18ConversionType;
      let answer;
      if(form==='improper'){
        answer={stage18Fraction:true,whole:'',numerator:String(sample.stage18AnswerForm.n),denominator:String(den)};
      }else{
        const whole=Math.floor(sample.answerRat.n/sample.answerRat.d),rem=(sample.answerRat.n*den/sample.answerRat.d)-whole*den;
        answer={stage18Fraction:true,whole:String(whole),numerator:String(rem),denominator:String(den)};
      }
      const got=quizInputEvaluation(sample,answer);
      if(!got.valid||!got.ok)throw Error('Rejected correct formatted conversion '+template+': '+JSON.stringify(got));
    }
    checked.push({topic,template});
   }
   return checked;
  });
  assert.deepEqual(errors,[]);
  assert.equal(result.length,4);
  console.log('G5_CONVERSION_UX_SMOKE_PASS',JSON.stringify(result));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_CONVERSION_UX_SMOKE_FAIL',e.stack||e);process.exit(1)});
