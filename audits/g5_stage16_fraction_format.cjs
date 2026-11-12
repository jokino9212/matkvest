'use strict';
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox']});try{
const page=await browser.newPage();await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
const samples=await page.evaluate(()=>{
const topics=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS],bad=[],total={},seen={};
for(const topic of topics)for(let stage=0;stage<3;stage++)for(let run=0;run<35;run++){
 blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};qid='g5:'+topic.id;
 for(let pos=0;pos<5;pos++){
 blockSession.done=pos;const q=freshQuiz(qid);
 const answer=stripHtmlText(String(q.correctText||'')),ex=stripHtmlText(String(q.ex||''));
 const key=topic.id+'::'+String(q.templateId||'base');
 total[key]=(total[key]||0)+1;
 const m=answer.match(/^(\d+)\/(\d+)$/);
 if(m&&(Number(m[2])===1||Number(m[1])===Number(m[2])||Number(m[1])%Number(m[2])===0)){
  const b=key+'::'+answer;seen[b]=(seen[b]||0)+1;
  if(!bad.some(x=>x.signature===b))bad.push({signature:b,key,stage,answer,text:stripHtmlText(q.text).slice(0,180),ex:ex.slice(0,300),mode:q.answerMode,rat:q.answerRat||null});
 }
 }
}
return {total:53*3*35*5,examples:bad.slice(0,80),problemConfigs:Object.keys(seen).length,instances:Object.values(seen).reduce((a,b)=>a+b,0),byKey:[...new Map(bad.map(x=>[x.key,x])).values()]};
});
fs.mkdirSync('audits/out',{recursive:true});fs.writeFileSync('audits/out/g5_stage16_fraction_display.json',JSON.stringify(samples,null,2));
console.log('STAGE16_FRACTION_FORMAT_SUMMARY',JSON.stringify({total:samples.total,instances:samples.instances,problemConfigs:samples.problemConfigs,byKey:samples.byKey.slice(0,25)}));
assert.equal(samples.total,27825);console.log('STAGE16_FRACTION_FORMAT_AUDIT_PASS');
}finally{await browser.close()}})().catch(e=>{console.error(e.stack||e);process.exit(1)});
