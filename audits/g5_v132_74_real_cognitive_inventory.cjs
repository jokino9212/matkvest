'use strict';
const {chromium}=require('playwright'),path=require('path');
(async()=>{
 const b=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 const p=await b.newPage({viewport:{width:1280,height:810}});
 await p.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const data=await p.evaluate(()=>{
  let seed=20261113;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const result=[],list=g5AllTopics();
  for(const entry of list){
   const issues=[],stages=[],allFamilies=new Set(),sampleText=[];
   for(let t=0;t<3;t++){
    const templates=new Set(),texts=new Set(),sample=[],depth=[],answerModes=[];
    for(let f=0;f<5;f++){
     for(let trial=0;trial<12;trial++){
      blockSession={kind:'g5quiz',key:'g5:'+entry.id,stageIndex:t,done:f,total:10,usedSignatures:[],items:[],finished:false};qid='g5:'+entry.id;
      try{
       const q=makeG5Question(entry.id);
       if(!q||!q.text||!q.ex||!q.templateId||!q.sig||!Array.isArray(q.choices)||q.choices.length<2)throw Error('Missing real quiz fields');
       const right=q.choices.filter(c=>String(c.key)===String(q.ans));
       if(right.length!==1)throw Error('Wrong number of correct keys '+right.length);
       const choiceLabels=q.choices.map(c=>String(c.label));
       if(new Set(choiceLabels).size!==choiceLabels.length)throw Error('Duplicated visible answer choices');
       if(String(q.text).includes('NaN')||String(q.ex).includes('NaN')||String(q.text).includes('undefined')||String(q.ex).includes('undefined')||String(q.text).includes('Infinity'))throw Error('Malformed value in task or solution');
       const depthVal=Number(q.mk131?.steps??q.mk130?.steps??q.mk129?.steps??q.mk128?.steps??q.mk127?.steps??q.mk126?.steps??q.mk125?.steps??q.mk124?.steps??q.mk123?.steps??q.mk122?.steps??q.mk5Pedagogy?.steps);
       if(Number.isFinite(depthVal))depth.push(depthVal);
       if(trial===0){
        templates.add(q.templateId);
        if(texts.has(q.text))issues.push('Same exact prompt in distinct family: L'+t+' F'+f);
        texts.add(q.text);
        sample.push({f,prompt:String(q.text).replace(/<[^>]+>/g,' ').slice(0,120),template:q.templateId,kind:q.answerMode||'choice',steps:Number.isFinite(depthVal)?depthVal:null});
        answerModes.push(q.answerMode||'choice');
       }
      }catch(e){issues.push('L'+t+' F'+f+' #'+trial+' '+String(e.message||e).slice(0,150))}
     }
    }
    if(templates.size!==5)issues.push('Stage '+t+' has '+templates.size+' / 5 distinct families');
    for(const template of templates){if(allFamilies.has(template))issues.push('Same family ID reused across stages: '+template);allFamilies.add(template)}
    stages.push({tier:t,families:[...templates],modes:answerModes,meanSteps:depth.length?Math.round(depth.reduce((a,b)=>a+b,0)/depth.length*100)/100:null,sample});
   }
   result.push({id:entry.id,title:entry.title,issues,allFamilyCount:allFamilies.size,stages});
  }
  return {count:list.length,items:result};
 });
 let errors=0,duplicate=0,nonGrowing=0;for(const x of data.items){
  const deps=x.stages.map(x=>x.meanSteps);
  const sameStage=deps.every(v=>v!==null)&&deps[0]>=deps[1]||deps.every(v=>v!==null)&&deps[1]>=deps[2];
  if(sameStage)nonGrowing++;
  if(x.issues.length)errors++;
  if(x.allFamilyCount<15)duplicate++;
  console.log('G5_V132_TOPIC '+JSON.stringify({id:x.id,title:x.title,families:x.allFamilyCount,steps:deps,issues:x.issues.slice(0,9),samples:x.stages.map(y=>y.sample.map(x=>({family:x.template,kind:x.kind,steps:x.steps,prompt:x.prompt.slice(0,90)})))}));
 }
 console.log('G5_V132_SUMMARY '+JSON.stringify({topics:data.count,topicsWithIssues:errors,topicsWithRepeatedFamilies:duplicate,topicsWithNonIncreasingMetadata:nonGrowing,numberOfQuestionFamilies:data.items.reduce((s,x)=>s+x.allFamilyCount,0)}));
 if(data.count!==74||errors>0||duplicate>0)throw Error('Grade-five QA gate failed: '+errors+' malformed topic(s), '+duplicate+' topic(s) with repeated families');
 }finally{await b.close()}
})().catch(e=>{console.error('G5_V132_AUDIT_CRASH',e.stack||e);process.exit(1)});
