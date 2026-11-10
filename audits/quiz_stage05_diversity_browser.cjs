'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const report=await page.evaluate(()=>{
   const topics=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS];
   const metrics=[],issues=[];
   for(const topic of topics){
    for(const stage of [0,1,2]){
     blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,usedSignatures:[],items:[],total:10,done:0};
     qid='g5:'+topic.id;
     const samples=[],failures=[];
     for(let i=0;i<80;i++){
      try{
       const item=makeG5Question(topic.id);
       const text=stripHtmlText(item.text||'');
       const answer=String(item.correctText??'');
       const choiceKeys=(item.choices||[]).map(x=>String(x.key));
       const hasAnswer=item.answerMode==='fraction'||item.answerMode==='number'||choiceKeys.includes(String(item.ans));
       if(!text||!answer||!hasAnswer)failures.push({i,text,answer,mode:item.answerMode,template:item.templateId});
       samples.push({text,answer,template:item.templateId||'base',mode:item.answerMode||'choice',size:Math.max(...(text.match(/\d+/g)||['0']).map(Number))});
      }catch(err){failures.push({i,error:String(err).slice(0,160)})}
     }
     const texts=samples.map(x=>x.text),unique=new Set(texts).size;
     const templates=[...new Set(samples.map(x=>x.template))];
     const modes=[...new Set(samples.map(x=>x.mode))];
     const numericSizes=samples.map(x=>x.size).filter(Number.isFinite).sort((a,b)=>a-b);
     const p90=numericSizes[Math.min(numericSizes.length-1,Math.floor(numericSizes.length*.9))]||0;
     const m={id:topic.id,title:topic.title,stage,total:samples.length,unique,uniquePct:Math.round(unique/Math.max(samples.length,1)*100),
       templates:templates.length,templateNames:templates.slice(0,8),modes:modes.join(','),p90,failures:failures.slice(0,3),failureCount:failures.length};
     metrics.push(m);
     if(m.uniquePct<40||m.templates<=1||m.failureCount)issues.push(m);
    }
   }
   const byTopic=topics.map(t=>{
    const d=metrics.filter(x=>x.id===t.id);
    return {id:t.id,templates:d.map(x=>x.templates),uniquePct:d.map(x=>x.uniquePct),p90:d.map(x=>x.p90)};
   });
   return {topicCount:topics.length,samplesPerStage:80,totalSamples:metrics.reduce((sum,m)=>sum+m.total,0),
     failures:metrics.reduce((sum,m)=>sum+m.failureCount,0),weakCount:issues.length,weak:issues.slice(0,90),
     byTopic};
  });
  console.log('STAGE05_G5_REPORT',JSON.stringify(report));
  assert.equal(report.failures,0,'Generator failures or missing correct answers');
  assert.equal(errors.length,0,'Browser errors '+errors.join('|'));
  console.log('STAGE05_G5_AUDIT_PASS',JSON.stringify({topics:report.topicCount,samples:report.totalSamples,weakCount:report.weakCount}));
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE05_G5_AUDIT_FAIL',e.stack||e);process.exit(1)});
