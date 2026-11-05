import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
import {createHash} from 'node:crypto';

const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const result=await page.evaluate(()=>{
   const out={topics:[],exceptions:[],sampleCount:0,quality:{missingAnswer:0,duplicateChoiceKeys:0,duplicateChoiceLabels:0,invalidFractionDenominator:0},numberFractionExamples:[],stageIssues:[]};
   const grade5=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS].map(x=>({id:x.id,grade:5,title:x.title}));
   const grade6=g6AllTopics().filter(x=>x.implemented!==false).map(x=>({id:x.id,grade:6,title:x.title}));
   const grade6All=g6AllTopics().map(x=>({id:x.id,implemented:x.implemented,title:x.title}));
   const sampleLimit=36, byStage=3;
   function visible(q){const holder=document.createElement('div');holder.innerHTML=String(q?.text||'');return (holder.textContent||'').replace(/\s+/g,' ').trim();}
   function normalized(t){return String(t).replace(/[-+]?\d+(?:[.,]\d+)?/g,'#').replace(/\s+/g,' ').toLowerCase().trim();}
   function getTopicId(t){return t.grade===5?'g5:'+t.id:t.id;}
   function run(t,d){
     const full=getTopicId(t);blockSession={kind:t.grade===5?'g5quiz':'g6quiz',topicId:t.grade===5?t.id:full,stageIndex:d,done:0,total:d===0?5:d===1?7:10,finished:false,usedSignatures:[]};
     let examples=[],types={},tags={},actual={},templates={},promptSamples=[];
     for(let n=0;n<sampleLimit;n++){
       let q;
       try {q=t.grade===5?makeG5Question(t.id):makeG6Question(t.id,d);}
       catch(e){out.exceptions.push({id:full,stage:d,i:n,error:String(e)});break;}
       if(!q || !q.text){out.exceptions.push({id:full,stage:d,i:n,error:'empty question object/text'});continue;}
       out.sampleCount++;
       const v=visible(q),sign=String(q.sig||''),tem=String(q.templateId||q.audit?.type||sign.split(':')[3]||'default'),mode=String(q.answerMode|| (q.choices?.length?'choice':'unknown'));
       if(!types[mode])types[mode]=0;types[mode]++;
       tags[tem]=(tags[tem]||0)+1;
       templates[normalized(v)]=(templates[normalized(v)]||0)+1;
       actual[v]=(actual[v]||0)+1;
       if(promptSamples.length<4)promptSamples.push(v.slice(0,220));
       if(q.choices?.length){
         const a=q.choices.map(x=>String(x.key)),b=q.choices.map(x=>String(x.label));
         if(new Set(a).size!==a.length)out.quality.duplicateChoiceKeys++;
         if(new Set(b).size!==b.length)out.quality.duplicateChoiceLabels++;
         if(!a.includes(String(q.ans)))out.quality.missingAnswer++;
       }else if(!mode || mode==='unknown' || (mode==='fraction'&&!q.answerRat))out.quality.missingAnswer++;
       if(q.answerRat&&q.answerRat.d===0)out.quality.invalidFractionDenominator++;
       if(mode==='number'&&q.answerRat&&q.answerRat.d>1&&out.numberFractionExamples.length<55)
         out.numberFractionExamples.push({topic:full,stage:d,answer:q.ans,display:q.correctText||'',hint:q.inputHint||'',prompt:v.slice(0,180),den:q.answerRat.d});
       if(examples.length<3)examples.push({mode,template:tem,rawAnswer:String(q.ans||''),prompt:v.slice(0,180)});
     }
     const samples=Object.values(actual).reduce((a,b)=>a+b,0);
     const nn=Object.keys(templates).length;
     const topic={id:full,grade:t.grade,title:t.title,stage:d,samples,uniqueVisible:Object.keys(actual).length,uniqueNormalized:nn,templateFamilyCount:Object.keys(tags).length,mostCommonTemplates:Object.entries(tags).sort((a,b)=>b[1]-a[1]).slice(0,5),modes:types,prompts:promptSamples,examples};
     if(samples===0||nn<=1||Object.keys(actual).length<=Math.floor(samples*0.6))out.stageIssues.push({id:full,stage:d,samples,normalized:nn,visible:topic.uniqueVisible,templateFamilyCount:topic.templateFamilyCount});
     out.topics.push(topic);
   }
   for(const t of [...grade5,...grade6])for(let d=0;d<byStage;d++)run(t,d);
   out.inventory={grade5:grade5.length,grade6:grade6.length,grade6All:grade6All.length,grade6Pending:grade6All.filter(x=>!x.implemented).map(x=>x.id)};
   return out;
 });
 result.sha256=sha;result.pageErrors=pageErrors;result.runDate=new Date().toISOString();
 fs.writeFileSync('audits/g5g6_stage18_quality_deep_report.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({sha256:sha,inventory:result.inventory,sampleCount:result.sampleCount,exceptions:result.exceptions.slice(0,20),pageErrors,quality:result.quality,stageIssues:result.stageIssues.slice(0,65),fractionNumberExamples:result.numberFractionExamples.slice(0,18)},null,2));
 if(pageErrors.length||result.exceptions.length||result.quality.missingAnswer||result.quality.duplicateChoiceKeys||result.quality.duplicateChoiceLabels||result.quality.invalidFractionDenominator)process.exitCode=1;
}finally{await browser.close()}
