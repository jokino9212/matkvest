'use strict';
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:390,height:850}}),pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const report=await page.evaluate(()=>{
  const rows=[],topics=g5AllTopics(),faults=[];
  for(const {id,title} of topics){
   const levels=[],all=[];
   for(let level=0;level<3;level++){
    const families=new Set(),texts=new Set(),errors=[];
    let modes=new Set();
    for(let slot=0;slot<5;slot++){
     for(let n=0;n<10;n++){
      blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:slot,total:10,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
      try{
       const q=makeG5Question(id);
       if(!q?.text||!q.choices?.length||!q.ex||!q.templateId||!q.sig)throw Error('Incomplete question record');
       const matches=q.choices.filter(x=>String(x.key)===String(q.ans));
       if(matches.length!==1)throw Error('Correct answer key not unique');
       if(new Set(q.choices.map(x=>String(x.label))).size!==q.choices.length)throw Error('Repeated possible answers');
       if(n===0){families.add(q.templateId);texts.add(q.text)}
       modes.add(q.answerMode||'choices');
      }catch(e){errors.push(String(e.message))}
     }
    }
    levels.push({stage:level,uniqueFamilies:families.size,types:[...families],distinctInitialQuestions:texts.size,errors:[...new Set(errors)],modes:[...modes]});
    all.push(...families);
   }
   rows.push({id,title,levels,crossStageUnique:new Set(all).size});
  }
  const lacking=rows.filter(x=>x.levels.some(y=>y.uniqueFamilies<5)).map(x=>({id:x.id,counts:x.levels.map(y=>y.uniqueFamilies),types:x.levels.map(y=>y.types)}));
  const repeating=rows.filter(x=>x.crossStageUnique<15).map(x=>({id:x.id,unique:x.crossStageUnique,types:x.levels.map(y=>y.types)}));
  const throwing=rows.filter(x=>x.levels.some(y=>y.errors.length)).map(x=>({id:x.id,errors:x.levels.flatMap(y=>y.errors)}));
  return {total:rows.length,lacking,repeating,throwing,rows};
 });
 const dir='audits',out=path.join(dir,'g5_v132_full_curriculum_inventory.json');
 fs.writeFileSync(out,JSON.stringify(report,null,2));
 console.log('G5_FINAL_AUDIT_SUMMARY '+JSON.stringify({total:report.total,lacking:report.lacking.map(x=>({id:x.id,counts:x.counts})),repeating:report.repeating.map(x=>({id:x.id,unique:x.unique})),throwing:report.throwing}));
 console.log('G5_FINAL_AUDIT_PRODUCED '+out);
 if(report.total!==74||pageErrors.length)throw Error('Catalog count mismatch or page crash '+JSON.stringify(pageErrors));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_FINAL_AUDIT_FAIL',e.stack||e);process.exit(1)});
