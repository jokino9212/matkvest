'use strict';
const path=require('node:path'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox']});try{
const page=await b.newPage();page.on('pageerror',e=>console.log('PAGE_ERROR',e.message));
await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
const result=await page.evaluate(()=>{
const samples=[],cases={},topics=['frac_compare_den','frac_compare_num','mixed_compare','mixed_sub'];
for(const topic of topics)for(let stage=0;stage<3;stage++){
 blockSession={kind:'g5quiz',key:'g5:'+topic,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};qid='g5:'+topic;
 for(let i=0;i<5;i++){
  blockSession.done=i;
  const q=freshQuiz(qid);
  const item={topic,stage,i,text:stripHtmlText(q.text||''),correctText:q.correctText,
   correctHtml:q.correctHtml,answerMode:q.answerMode,answerRat:q.answerRat,
   correctLabel:q.correctLabel,ex:stripHtmlText(q.ex||''),templateId:q.templateId,
   choices:(q.choices||[]).map(x=>({label:stripHtmlText(x.label),key:x.key})),
   keys:Object.keys(q).sort()};
  samples.push(item);
 }
}
return samples;
});console.log('STAGE14_ORACLE_PROBE',JSON.stringify(result));}
finally{await b.close()}})().catch(e=>{console.error(e.stack||e);process.exit(1)});
