'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(()=>{
   const topics=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS],bad=[];let rational=0,integer=0,checked=0,choiceWholes=0;
   for(const topic of topics)for(let stage=0;stage<3;stage++)for(let run=0;run<25;run++){
    blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};qid='g5:'+topic.id;
    for(let pos=0;pos<5;pos++){
     blockSession.done=pos;let q;try{q=freshQuiz(qid)}catch(e){bad.push({topic:topic.id,error:String(e)});continue}
     checked++;
     if(q.mk5Audit?.type!=='rational')continue;
     rational++;
     const {numerator,denominator}=q.mk5Audit,[n,d]=g5NewRat(numerator,denominator);
     const correctKey=n+'/'+d;
     const correct=q.choices.find(c=>String(c.key)===correctKey);
     if(!correct)bad.push({topic:topic.id,problem:'missing answer key',correctKey,choices:q.choices});
     if(d===1){integer++;
      if(correct&&stripHtmlText(correct.label)!==String(n))bad.push({topic:topic.id,problem:'noncanonical integer label',expected:String(n),label:correct.label});
      if(String(q.ans)!==correctKey)bad.push({topic:topic.id,problem:'modified grading key',expected:correctKey,actual:q.ans});
      if(q.answerMode!=='fraction')bad.push({topic:topic.id,problem:'fraction input mode lost',answerMode:q.answerMode,correctKey});
      if(String(q.mk5Audit.expected)!==correctKey)bad.push({topic:topic.id,problem:'math audit key mismatch',expected:correctKey,audit:q.mk5Audit.expected});
     }
     for(const c of q.choices){const m=String(c.key).match(/^(\d+)\/1$/);
      if(m){choiceWholes++;if(stripHtmlText(c.label)!==m[1])bad.push({topic:topic.id,problem:'noncanonical wrong answer',key:c.key,label:c.label})}
     }
    }
   }
   return {checked,rational,integer,choiceWholes,bad:bad.slice(0,20),badCount:bad.length};
  });
  console.log('STAGE16_CANONICAL_ANSWER_AUDIT',JSON.stringify(data));
  assert.equal(data.checked,19875);assert(data.rational>100);assert(data.integer>0);assert(data.choiceWholes>data.integer);
  assert.equal(data.badCount,0);assert.deepEqual(errors,[]);
  console.log('STAGE16_CANONICAL_ANSWER_PASS',JSON.stringify({questions:data.checked,rational:data.rational,wholeCorrect:data.integer,wholeChoices:data.choiceWholes}));
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE16_CANONICAL_ANSWER_FAIL',e.stack||e);process.exit(1)});
