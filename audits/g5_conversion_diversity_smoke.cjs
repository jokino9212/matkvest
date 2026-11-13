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
    const report=[],byTopic={},stages=[5,7,10];
    for(const topic of ['frac_to_mixed','mixed_to_frac']){
      const stageReports=[];
      for(let stage=0;stage<3;stage++){
        const kinds=[],families=[],levels=[],questions=[];
        for(let pos=0;pos<stages[stage];pos++){
          blockSession={kind:'g5quiz',key:'g5:'+topic,stageIndex:stage,done:pos,total:stages[stage],
            usedSignatures:[],items:[],finished:false};
          qid='g5:'+topic;
          const sample=makeG5Question(topic);
          if(!sample.conversionAudit)throw Error('Missing conversion audit '+topic+' '+stage+' '+pos);
          const a=sample.conversionAudit;
          const actual=Number(a.answerNumerator),n=Number(a.originalNumerator),d=Number(a.den);
          if(n!==a.whole*d+a.rem||!Number.isInteger(actual)||a.rem<=0||a.rem>=d)
            throw Error('Malformed conversion math '+topic+' '+JSON.stringify(a));
          if(!sample.text||!sample.ex||!sample.templateId||!sample.sig)
            throw Error('Missing question metadata '+topic+' '+stage+' '+pos);
          if(sample.answerMode!==((pos%5===1||topic==='frac_to_mixed'&&pos%5===2||
             topic==='mixed_to_frac'&&pos%5===3)?'number':'fraction'))
            throw Error('Wrong input mode '+topic+' '+stage+' '+pos+' '+sample.answerMode);
          const fracValue=sample.answerMode==='fraction'?
            sample.answerRat.n/sample.answerRat.d:sample.answerRat.n;
          if(Math.abs(fracValue-(a.answerKind==='number'?actual:actual/d))>1e-9)
            throw Error('Incorrect mathematical answer '+topic+' '+stage+' '+pos);
          q=sample;
          const root=document.createElement('div');root.innerHTML=quizAnswerMarkup('nextQ','nextQ');
          if(sample.answerMode==='number'){
            if(!root.querySelector('#quizInput')||root.querySelector('#quizFracNum'))
              throw Error('Numeric answer exposes irrelevant fraction fields');
            const evaluation=quizInputEvaluation(sample,sample.correctText);
            if(!evaluation.valid||!evaluation.ok)throw Error('Correct number rejected '+topic+' '+stage+' '+pos);
          }else{
            const inputNum=root.querySelector('#quizFracNum'),inputDen=root.querySelector('#quizFracDen');
            if(!inputNum||!inputDen||!inputDen.readOnly||Number(inputDen.value)!==d)
              throw Error('Denominator not locked '+topic+' '+stage+' '+pos);
            const whole=Math.floor(actual/d),rem=actual%d;
            const raw={stage18Fraction:true,whole:topic==='frac_to_mixed'?String(whole):'',
               numerator:String(topic==='frac_to_mixed'?rem:actual),denominator:String(d)};
            if(!!root.querySelector('#quizFracWhole')!==(topic==='frac_to_mixed'))
              throw Error('Unexpected whole-cell input '+topic);
            const evaluation=quizInputEvaluation(sample,raw);
            if(!evaluation.valid||!evaluation.ok)
              throw Error('Correct fraction rejected '+topic+' '+stage+' '+pos+': '+JSON.stringify(evaluation));
            if(quizInputEvaluation(sample,{...raw,denominator:String(d+1)}).ok)
              throw Error('Wrong denominator accepted '+topic+' '+stage+' '+pos);
          }
          families.push(a.family);kinds.push(a.answerKind);levels.push(a.level);questions.push(sample.text);
        }
        if(new Set(families.slice(0,5)).size!==5)
          throw Error('First five tasks repeat the same cognitive family '+topic+' stage '+stage+': '+families.join(','));
        if(new Set(questions).size!==questions.length)
          throw Error('Repeated visible task in this stage '+topic+' '+stage);
        if(levels[levels.length-1]<levels[0])
          throw Error('Difficulty decreases in stage '+stage+' '+topic+': '+levels.join(','));
        if(stage===2&&(!families.includes('master_plus_four_minus_one')&&topic==='frac_to_mixed'||
           !families.includes('master_plus_whole_and_two_parts')&&topic==='mixed_to_frac'))
          throw Error('Master lacks multi-step challenge for '+topic);
        stageReports.push({stage,questions:questions.length,families:[...new Set(families)],
          levels,kinds});
      }
      const tierFamilies=stageReports.flatMap(x=>x.families);
      if(new Set(tierFamilies).size!==15)
        throw Error('Conversion exercise families repeat between difficulty tiers '+topic+': '+tierFamilies.join(','));
      byTopic[topic]=stageReports;
    }
    // Existing reported examples must continue to work exactly, including unsimplified denominator.
    return byTopic;
  });
  assert.deepEqual(errors,[]);
  assert.equal(result.frac_to_mixed.reduce((s,x)=>s+x.questions,0),22);
  assert.equal(result.mixed_to_frac.reduce((s,x)=>s+x.questions,0),22);
  console.log('G5_CONVERSION_DIVERSITY_PASS',JSON.stringify(result));
 }finally{await browser.close()}
})().catch(error=>{console.error('G5_CONVERSION_DIVERSITY_FAIL',error.stack||error);process.exit(1)});
