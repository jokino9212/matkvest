'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   const checked=[],cases=[
     ['mixed_to_frac',1,'number'],['mixed_to_frac',0,'fraction'],
     ['frac_to_mixed',1,'number'],['frac_to_mixed',0,'fraction']
   ];
   for(const [topic,pos,expectedMode] of cases){
    blockSession={kind:'g5quiz',key:'g5:'+topic,stageIndex:0,done:pos,total:5,
      usedSignatures:[],items:[],finished:false};
    qid='g5:'+topic;
    const sample=makeG5Question(topic);
    if(sample.answerMode!==expectedMode)throw Error('Wrong answer mode: '+topic+' pos '+pos+' got '+sample.answerMode);
    q=sample;
    const markup=quizAnswerMarkup('nextQ','nextQ');
    const div=document.createElement('div');div.innerHTML=markup;
    if(expectedMode==='number'){
      if(!div.querySelector('#quizInput')||div.querySelector('#quizFracNum'))throw Error('Numeric task exposes fraction cells');
      const got=quizInputEvaluation(sample,sample.correctText);
      if(!got.valid||!got.ok)throw Error('Rejected correct numeric answer '+topic);
    }else{
      if(!div.querySelector('#quizFracNum')||!div.querySelector('#quizFracDen')?.readOnly)throw Error('Denominator not fixed '+topic);
      if(topic==='mixed_to_frac'&&div.querySelector('#quizFracWhole'))throw Error('Improper answer exposes whole input');
      if(topic==='frac_to_mixed'&&!div.querySelector('#quizFracWhole'))throw Error('Mixed answer missing whole input');
      const den=sample.stage18FixedDenominator,form=sample.stage18ConversionType;
      let answer;
      if(form==='improper')answer={stage18Fraction:true,whole:'',numerator:String(sample.stage18AnswerForm.n),denominator:String(den)};
      else{
        const whole=Math.floor(sample.answerRat.n/sample.answerRat.d),rem=sample.answerRat.n*den/sample.answerRat.d-whole*den;
        answer={stage18Fraction:true,whole:String(whole),numerator:String(rem),denominator:String(den)};
      }
      const got=quizInputEvaluation(sample,answer);
      if(!got.valid||!got.ok)throw Error('Rejected correct formatted conversion '+topic+': '+JSON.stringify(got));
      const malformed={...answer,denominator:String(den+1)};
      if(quizInputEvaluation(sample,malformed).ok)throw Error('Accepted wrong denominator '+topic);
    }
    checked.push({topic,pos,mode:expectedMode});
   }
   return checked;
  });
  assert.deepEqual(errors,[]);
  assert.equal(result.length,4);
  console.log('G5_CONVERSION_UX_SMOKE_PASS',JSON.stringify(result));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_CONVERSION_UX_SMOKE_FAIL',e.stack||e);process.exit(1)});
