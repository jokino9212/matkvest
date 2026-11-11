'use strict';
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   const omit=new Set(['frac_compare_den','frac_compare_num','mixed_compare','mixed_sub']);
   const topics=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS].filter(x=>!omit.has(x.id));
   const rows=[],failures=[];
   for(const topic of topics)for(let stage=0;stage<3;stage++){
    const types=new Map();let total=0;
    for(let sess=0;sess<15;sess++){
     blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};
     qid='g5:'+topic.id;
     for(let pos=0;pos<5;pos++){
      blockSession.done=pos;
      try{
       const q=freshQuiz(qid),tpl=String(q.templateId||'base'),txt=stripHtmlText(q.text||''),ex=stripHtmlText(q.ex||'');
       const existing=types.get(tpl);
       if(!existing)types.set(tpl,{template:tpl,example:txt.slice(0,240),answer:String(q.correctText||''),ex:ex.slice(0,240),
         mode:String(q.answerMode||'choice'),answerRat:q.answerRat||null, choices:(q.choices||[]).map(x=>stripHtmlText(String(x.label||''))),count:1});
       else existing.count++;
       total++;
      }catch(err){failures.push({topic:topic.id,stage,sess,pos,error:String(err)})}
     }
    }
    rows.push({id:topic.id,stage,questions:total,types:[...types.values()]});
   }
   return {topics:topics.length,configs:rows.length,questions:rows.reduce((sum,r)=>sum+r.questions,0),
     rows,failures};
  });
  fs.mkdirSync('audits/out',{recursive:true});
  fs.writeFileSync('audits/out/g5_stage14b_census.json',JSON.stringify(result,null,2));
  console.log('STAGE14B_CENSUS_SUMMARY',JSON.stringify({topics:result.topics,configs:result.configs,questions:result.questions,failures:result.failures.length,distinctTemplates:new Set(result.rows.flatMap(x=>x.types.map(v=>x.id+'::'+v.template))).size}));
  for(const id of [...new Set(result.rows.map(x=>x.id))]){
   const rows=result.rows.filter(x=>x.id===id);
   console.log('STAGE14B_TOPIC',JSON.stringify({id,templates:rows.flatMap(x=>x.types.map(y=>({stage:x.stage,t:y.template,q:y.example,a:y.answer,ex:y.ex}))).slice(0,12)}));
  }
  if(result.topics!==49||result.questions!==11025||result.failures.length||errors.length)throw Error(JSON.stringify({topics:result.topics,questions:result.questions,failures:result.failures.slice(0,3),errors}));
  console.log('STAGE14B_CENSUS_PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE14B_CENSUS_FAIL',e.stack||e);process.exit(1)});
