'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   const topics=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS],rows=[],bad=[];
   const normalize=s=>stripHtmlText(String(s||'')).toLowerCase()
     .replace(/[-+]?\d+(?:[.,]\d+)?/g,'#').replace(/\s+/g,' ').trim();
   const operation=s=>{
    if(/ошибк|неверн|исправ|найди ошибк/.test(s))return 'error-analysis';
    if(/задач|купил|продал|остал|прошл|скорост|врем|расстояни|всего|сколько .* было/.test(s))return 'word-problem';
    if(/угол|треуголь|прямоуголь|периметр|площад|фигур|отрезок|геометри/.test(s))return 'geometry';
    if(/сравни|больше|меньше|равн|упорядоч|расположи/.test(s))return 'compare';
    if(/вычисл|найди значени|посчитай|реши|сумм|разност|произведен|частн|сколько будет/.test(s))return 'calculate';
    return 'other';
   };
   for(const topic of topics)for(let stage=0;stage<3;stage++){
    const sessions=[];
    for(let n=0;n<30;n++){
     blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};
     qid='g5:'+topic.id;
     const items=[];
     for(let pos=0;pos<5;pos++){
      blockSession.done=pos;
      try{
       const q=freshQuiz(qid),stem=normalize(q.text),answer=String(q.correctText||'');
       items.push({stem,operation:operation(stem),template:q.templateId||'base',
         level:q.mk5Audit?.level,answer,example:stripHtmlText(String(q.text||'')).slice(0,180),
         signature:JSON.stringify([q.text,answer,(q.choices||[]).map(c=>c.label).sort()])});
      }catch(e){bad.push({id:topic.id,stage,n,pos,error:String(e)})}
     }
     const uniq=key=>new Set(items.map(x=>x[key])).size;
     if(uniq('signature')!==items.length)bad.push({id:topic.id,stage,n,error:'exact duplicate'});
     sessions.push({stems:uniq('stem'),operations:uniq('operation'),templates:uniq('template'),items});
    }
    const avg=key=>+(sessions.reduce((s,x)=>s+x[key],0)/sessions.length).toFixed(2);
    const example=sessions.slice(0,3).flatMap(x=>x.items).filter((x,i,a)=>a.findIndex(y=>y.stem===x.stem)===i).slice(0,8);
    rows.push({id:topic.id,stage,sessions:sessions.length,
     avgStems:avg('stems'),avgOperations:avg('operations'),avgTemplates:avg('templates'),
     singleStemSessions:sessions.filter(x=>x.stems===1).length,
     singleOperationSessions:sessions.filter(x=>x.operations===1).length,
     minStems:Math.min(...sessions.map(x=>x.stems)),
     operations:[...new Set(sessions.flatMap(s=>s.items.map(i=>i.operation)))],
     examples:example.map(x=>({stem:x.stem,operation:x.operation,template:x.template,example:x.example}))});
   }
   rows.sort((a,b)=>b.singleStemSessions-a.singleStemSessions||a.avgStems-b.avgStems||a.avgOperations-b.avgOperations);
   return {topics:topics.length,configurations:rows.length,sessions:rows.length*30,questions:rows.length*30*5,
    problemCount:bad.length,problems:bad.slice(0,12),ranking:rows};
  });
  assert.equal(result.topics,53);assert.equal(result.configurations,159);
  assert.equal(result.questions,23850);assert.equal(result.problemCount,0,'generation errors or exact duplicates');
  assert.deepEqual(errors,[],'browser errors');
  fs.mkdirSync('audits/out',{recursive:true});
  fs.writeFileSync('audits/out/g5_stage10_semantic_report.json',JSON.stringify(result,null,2));
  console.log('STAGE10_SEMANTIC_TOP20',JSON.stringify(result.ranking.slice(0,20)));
  console.log('STAGE10_DIAGNOSTIC_PASS',JSON.stringify({topics:result.topics,sessions:result.sessions,
   questions:result.questions,singleStemConfigs:result.ranking.filter(x=>x.singleStemSessions>0).length,
   allSameOperationConfigs:result.ranking.filter(x=>x.singleOperationSessions===30).length,
   report:'audits/out/g5_stage10_semantic_report.json'}));
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE10_DIAGNOSTIC_FAIL',e.stack||e);process.exit(1)});
