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
  const rows=[],problems=[];
  for(const topic of topics)for(const stage of [0,1,2]){
    const samples=[],sessions=[];
    for(let session=0;session<20;session++){
      blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[]};
      qid='g5:'+topic.id;
      const current=[];
      for(let pos=0;pos<5;pos++){
        blockSession.done=pos;
        let item;
        try {item=makeG5Question(topic.id)}catch(e){problems.push({id:topic.id,stage,session,pos,error:String(e)});continue}
        const answers=(item.choices||[]).map(x=>({key:String(x.key),label:choicePlain(x)}));
        const answer=String(item.correctText||'');
        const valid=item.answerMode==='fraction'||item.answerMode==='number'||answers.some(x=>x.key===String(item.ans));
        const prompt=String(item.text||'');
        const text=stripHtmlText(prompt);
        const signature=JSON.stringify([prompt,answer,answers.map(x=>x.label).sort()]);
        const entry={stage,pos,mode:item.mk5Audit?.mode,level:item.mk5Audit?.level,phase:item.mk5Audit?.phase,template:item.templateId||'base',type:item.mk5Audit?.type,
          prompt,answer,signature,text};
        if(!text||!answer||!valid)problems.push({id:topic.id,stage,session,pos,reason:'invalid answer',answer,text});
        samples.push(entry);current.push(entry);
      }
      const unique=new Set(current.map(x=>x.signature)).size;
      sessions.push({unique,total:current.length,templates:[...new Set(current.map(x=>x.template))]});
    }
    const uniq=list=>new Set(list).size;
    const row={id:topic.id,stage,total:samples.length,fullDistinct:uniq(samples.map(x=>x.signature)),stemDistinct:uniq(samples.map(x=>x.text)),
      templateDistinct:uniq(samples.map(x=>x.template)),templateList:[...new Set(samples.map(x=>x.template))].slice(0,8),
      avgUniquePer5:Number((sessions.reduce((a,s)=>a+s.unique,0)/20).toFixed(2)),
      minUniquePer5:Math.min(...sessions.map(s=>s.unique)),duplicateSessions:sessions.filter(s=>s.unique<5).length,
      levelByPosition:[0,1,2,3,4].map(p=>[...new Set(samples.filter(x=>x.pos===p).map(x=>x.level))]),
      modeByPosition:[0,1,2,3,4].map(p=>[...new Set(samples.filter(x=>x.pos===p).map(x=>x.mode))]),
      examples:[...new Map(samples.map(x=>[x.template,{template:x.template,text:x.text.slice(0,160),answer:x.answer}])).values()].slice(0,6)};
    rows.push(row);
  }
  return {topics:topics.length,generated:rows.reduce((s,r)=>s+r.total,0),errors:problems.slice(0,15),errorCount:problems.length,
     minUnique:Math.min(...rows.map(x=>x.minUniquePer5)),
     duplicateSessions:rows.reduce((s,r)=>s+r.duplicateSessions,0),
     weak:rows.filter(x=>x.minUniquePer5<5||x.templateDistinct<2).map(x=>({id:x.id,stage:x.stage,variants:x.templateDistinct,minUnique:x.minUniquePer5,duplicateSessions:x.duplicateSessions,templates:x.templateList})),
     byTopic:topics.map(t=>({id:t.id,stage:rows.filter(r=>r.id===t.id).map(r=>({stage:r.stage,
       variants:r.templateDistinct,fullDistinct:r.fullDistinct,avgUniquePer5:r.avgUniquePer5,minUniquePer5:r.minUniquePer5,
       levelByPosition:r.levelByPosition,modeByPosition:r.modeByPosition,examples:r.examples}))}))};
 });
 console.log('STAGE05_REAL_SESSIONS',JSON.stringify(result));
 assert.equal(result.topics,53,'grade-5 catalog changed');
 assert.equal(result.generated,15900,'missing generated questions');
 assert.equal(result.errorCount,0,'generator errors');
 assert.deepEqual(errors,[],'browser errors');
 console.log('STAGE05_REAL_SESSIONS_PASS',JSON.stringify({topics:result.topics,generated:result.generated,
  minUnique:result.minUnique,duplicateSessions:result.duplicateSessions,weakConfigurations:result.weak.length}));
}finally{await browser.close()}
})().catch(e=>{console.error('STAGE05_REAL_SESSIONS_FAIL',e.stack||e);process.exit(1)});
