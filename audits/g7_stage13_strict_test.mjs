import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const marker='/* МатКвест G7 этап 13: без содержательных повторов во всех 107 темах */';
const source=fs.readFileSync('index.html','utf8');
if(source.split(marker).length!==2)throw Error('Stage13 patch absent or duplicated');
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!executablePath)throw Error('Chromium not found');
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const report={sha256:createHash('sha256').update(source).digest('hex'),testedAt:new Date().toISOString(),catalog:0,sessions:0,questions:0,duplicates:[],errors:[],exhaustions:[],pageErrors,byTopic:[]};
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const ids=await page.evaluate(()=>g7AllTopics().map(x=>x.id));
 report.catalog=ids.length;
 for(const id of ids){
  const data=await page.evaluate(id=>{
   const trials=[],errors=[],duplicates=[],exhaustions=[];
   let questions=0;
   for(let d=0;d<3;d++)for(let repetition=0;repetition<3;repetition++){
    const sigs=new Set(),semantics=new Set(),variants=new Set();
    let count=0;
    try{
      startG7QuizStage(id,d);
      const total=STAGES[d].count;
      for(let i=0;i<total;i++){
       if(!q||!q.text||!q.sig||!q.ex)throw Error('Missing current question');
       if(!document.querySelector('#qstage .quizq')?.textContent?.trim())throw Error('Question not displayed');
       const semantic=JSON.stringify([String(q.text).replace(/\s+/g,' ').trim(),String(q.ans??''),q.visual?.data||null]);
       if(sigs.has(String(q.sig)))duplicates.push({d,repetition,question:i+1,kind:'signature',sig:q.sig});
       if(semantics.has(semantic))duplicates.push({d,repetition,question:i+1,kind:'semantic',sample:semantic.slice(0,320)});
       sigs.add(String(q.sig));semantics.add(semantic);
       variants.add(q.audit?.variant||q.audit?.type||q.templateId||'legacy');
       const btn=document.getElementById('quizSkip');
       if(!btn)throw Error('Skip button missing');
       btn.click();count++;questions++;
       if(blockSession.done!==i+1)throw Error('Progress mismatch');
      }
      if(!blockSession.finished||blockSession.items.length!==total)throw Error('Completion mismatch');
      if(blockSession._g7Stage13Exhausted?.length)exhaustions.push(...blockSession._g7Stage13Exhausted);
      trials.push({d,repetition,total,uniqueSig:sigs.size,uniqueSemantic:semantics.size,variants:variants.size});
    }catch(e){errors.push({d,repetition,count,error:String(e)});}
   }
   return {id,trials,questions,errors,duplicates,exhaustions};
  },id);
  report.sessions+=data.trials.length;
  report.questions+=data.questions;
  report.errors.push(...data.errors.map(x=>({topic:id,...x})));
  report.duplicates.push(...data.duplicates.map(x=>({topic:id,...x})));
  report.exhaustions.push(...data.exhaustions.map(x=>({topic:id,...x})));
  report.byTopic.push({topic:id,sessions:data.trials.length,questions:data.questions,minDistinct:data.trials.length?Math.min(...data.trials.map(x=>x.uniqueSemantic)):0});
  if(report.byTopic.length%15===0)console.log('Stage13 strict tested',report.byTopic.length,'/',ids.length,'duplicate errors',report.duplicates.length,'generator errors',report.errors.length);
  if(report.errors.length>40||report.duplicates.length>40||report.exhaustions.length>40)break;
 }
 fs.writeFileSync('audits/g7_stage13_strict_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({catalog:report.catalog,sessions:report.sessions,questions:report.questions,duplicates:report.duplicates.slice(0,15),errors:report.errors.slice(0,15),exhaustions:report.exhaustions.slice(0,15),pageErrors},null,2));
 if(report.catalog!==107||report.sessions!==963||report.questions!==7062||report.duplicates.length||report.errors.length||report.exhaustions.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close()}
