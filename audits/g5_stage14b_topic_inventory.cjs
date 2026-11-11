'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const r=await page.evaluate(()=>{
   const excluded=new Set(['frac_compare_den','frac_compare_num','mixed_compare','mixed_sub']);
   const topics=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS].filter(t=>!excluded.has(t.id));
   const rows=[],issues=[];
   for(const t of topics)for(let stage=0;stage<3;stage++){
    const templates=new Map(),modes={},answerTypes={},examples=[];
    for(let session=0;session<16;session++){
     blockSession={kind:'g5quiz',key:'g5:'+t.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};
     qid='g5:'+t.id;
     for(let pos=0;pos<5;pos++){
      blockSession.done=pos;
      try{
       const q=freshQuiz(qid);
       const id=String(q.templateId||'base'),answer=String(q.correctText||''),choice=(q.choices||[]).map(x=>({label:stripHtmlText(String(x.label||'')),key:String(x.key)}));
       const sample={id,stem:stripHtmlText(String(q.text||'')).slice(0,185),answer,mode:q.answerMode||'choice',ex:stripHtmlText(String(q.ex||'')).slice(0,175),choices:choice.slice(0,6),answerRat:q.answerRat?{n:q.answerRat.n,d:q.answerRat.d}:null,ans:q.ans,source:q.sourceTopicId};
       const entry=templates.get(id)||{count:0,sample};entry.count++;
       templates.set(id,entry);modes[sample.mode]=(modes[sample.mode]||0)+1;
       if(!answer.trim())issues.push({id:t.id,stage,reason:'empty answer',sample});
       if(!sample.ex.trim())issues.push({id:t.id,stage,reason:'empty explanation',sample});
       if(choice.length&&new Set(choice.map(c=>c.key)).size!==choice.length)issues.push({id:t.id,stage,reason:'duplicated choice keys',sample});
      }catch(e){issues.push({id:t.id,stage,reason:'generation error',error:String(e)})}
     }
    }
    rows.push({id:t.id,title:t.title,stage,questions:80,modes,templates:[...templates.entries()].map(([id,v])=>({id,count:v.count,sample:v.sample}))});
   }
   return {topicCount:topics.length,configCount:rows.length,questionCount:rows.length*80,issues,rows};
  });
  assert.equal(r.topicCount,49);assert.equal(r.configCount,147);assert.equal(r.questionCount,11760);
  assert.deepEqual(errors,[]);assert.deepEqual(r.issues,[]);
  fs.mkdirSync('audits/out',{recursive:true});
  fs.writeFileSync('audits/out/g5_stage14b_topic_inventory.json',JSON.stringify(r,null,2));
  const byTopic=[];
  for(const row of r.rows){
   let group=byTopic.find(g=>g.id===row.id);
   if(!group)byTopic.push(group={id:row.id,title:row.title,examples:[]});
   if(row.stage===2)group.examples=row.templates.map(t=>({template:t.id,stem:t.sample.stem,answer:t.sample.answer,mode:t.sample.mode,ex:t.sample.ex})).slice(0,7);
  }
  for(const topic of byTopic)console.log('STAGE14B_TOPIC',JSON.stringify(topic));
  console.log('STAGE14B_INVENTORY_PASS',JSON.stringify({topics:r.topicCount,configs:r.configCount,questions:r.questionCount,issues:r.issues.length,templates:r.rows.reduce((s,x)=>s+x.templates.length,0)}));
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE14B_INVENTORY_FAIL',e.stack||e);process.exit(1)});
