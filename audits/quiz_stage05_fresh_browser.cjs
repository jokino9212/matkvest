'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const result=await page.evaluate(()=>{
  const topics=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS];
  const runs=[],failures=[];
  for(const topic of topics)for(const stage of [0,1,2]){
   const perStage=[];
   for(let session=0;session<12;session++){
    blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};
    qid='g5:'+topic.id;
    const items=[];
    for(let pos=0;pos<5;pos++){
      blockSession.done=pos;
      try{
       const item=freshQuiz(qid),name=String(item.templateId||'base');
       const trueSignature=JSON.stringify([item.text,item.correctText,(item.choices||[]).map(c=>c.label).sort()]);
       items.push({name,signature:trueSignature,actualSig:item.sig||item._signature||'',level:item.mk5Audit?.level,answer:String(item.correctText),text:String(item.text||'').slice(0,140)});
      }catch(err){failures.push({topic:topic.id,stage,session,pos,error:String(err).slice(0,200)})}
    }
    const unique=new Set(items.map(x=>x.signature)).size;
    perStage.push({unique,count:items.length,templates:new Set(items.map(x=>x.name)).size});
    if(unique<items.length)failures.push({topic:topic.id,stage,session,reason:'exact repeated question',unique,items:items.map(x=>({name:x.name,actualSig:x.actualSig,answer:x.answer,text:x.text}))});
   }
   runs.push({id:topic.id,stage,duplicates:perStage.filter(s=>s.unique<s.count).length,
      avgTemplates:Number((perStage.reduce((s,i)=>s+i.templates,0)/12).toFixed(2)),
      minTemplates:Math.min(...perStage.map(s=>s.templates))});
  }
  return {topics:topics.length,sessions:runs.length*12,questions:runs.length*12*5,
    errors:failures.slice(0,40),errorCount:failures.length,
    repeats:runs.filter(x=>x.duplicates),minTemplates:Math.min(...runs.map(x=>x.minTemplates)),
    byTopic:topics.map(x=>({id:x.id,stages:runs.filter(y=>y.id===x.id)}))};
 });
 console.log('STAGE05_FRESH_REAL',JSON.stringify(result));
 assert.equal(result.topics,53);
 assert.equal(result.errorCount,0,'freshQuiz exposed duplicates or errors');
 assert.deepEqual(errors,[]);
 console.log('STAGE05_FRESH_PASS',JSON.stringify({topics:result.topics,sessions:result.sessions,questions:result.questions,
  minTemplates:result.minTemplates}));
}finally{await browser.close()}
})().catch(e=>{console.error('STAGE05_FRESH_FAIL',e.stack||e);process.exit(1)});
