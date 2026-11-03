import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!executablePath)throw Error('Chromium executable not found');
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const target=[
 'fraction_word_problems','number_line_distance','absolute_value_function',
 'graphical_equations_systems','linear_system_substitution',
 'geo_right_triangle_properties','geo_circle_chord_diameter'
],errors=[],sessions=[];
let displayed=0,rendered=0,exhaustions=0;
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const baseline=await page.evaluate((target)=>{
  const failures=[];
  for(const t of g7AllTopics())if(!target.includes(t.id.slice(3)))for(let d=0;d<3;d++){
   try{
    const q=makeG7Question(t.id,d);
    if(!q?.text||!q?.ex||!q?.sig)throw Error('Missing fields');
   }catch(e){failures.push({raw:t.id,d,error:String(e)})}
  }
  return {catalog:g7AllTopics().length,otherSmoke:failures};
 },target);
 errors.push(...baseline.otherSmoke);
 for(const raw of target){
  for(let d=0;d<3;d++){
   for(let attempt=0;attempt<6;attempt++){
    const result=await page.evaluate(({raw,d})=>{
     const id='g7:'+raw,count=STAGES[d].count,seenSig=new Set(),seenSemantic=new Set(),seenVar=new Set(),errors=[];
     let rendered=0;
     try{
      startG7QuizStage(id,d);
      for(let i=0;i<count;i++){
       if(!blockSession?.currentItem||!q?.text||!q?.sig)throw Error('Missing current question');
       if(!document.querySelector('#qstage .quizq')?.textContent?.trim())throw Error('Question not displayed');
       const sig=String(q.sig),sem=JSON.stringify([q.text,q.ans,q.visual?.data||null]);
       if(seenSig.has(sig))throw Error('Duplicate signature on question '+(i+1));
       if(seenSemantic.has(sem))throw Error('Duplicate substantive content on question '+(i+1));
       seenSig.add(sig);seenSemantic.add(sem);seenVar.add(q.audit?.variant||q.audit?.type||'legacy');
       if(q.visual&&['coordinatePlane','geometry'].includes(q.visual.type)){
        if(!document.querySelector('#qstage svg'))throw Error('SVG figure not displayed');
        rendered++;
       }
       const skip=document.getElementById('quizSkip');
       if(!skip)throw Error('Skip button missing');
       skip.click();
       if(blockSession.done!==i+1)throw Error('Progress mismatch after skip');
      }
      if(!blockSession.finished||blockSession.items.length!==count)throw Error('Completion mismatch');
      if(!document.querySelector('.block-result'))throw Error('Result screen missing');
      if(blockSession._g7Stage9Exhausted?.length)throw Error('Generator exhausted unique questions');
     }catch(e){errors.push(String(e))}
     return {raw,d,expected:count,uniqueSig:seenSig.size,uniqueSemantic:seenSemantic.size,variants:seenVar.size,rendered,errors};
    },{raw,d});
    displayed+=result.uniqueSig;
    rendered+=result.rendered;
    if(result.errors.length){errors.push({raw,d,attempt,details:result.errors});if(result.errors.some(x=>x.includes('exhausted')))exhaustions++}
    sessions.push({...result,attempt});
   }
  }
  console.log('Stage9 QA completed topic',raw,'session errors',errors.length);
 }
 const report={
  catalog:baseline.catalog,targets:target,expectedSessions:target.length*3*6,
  actualSessions:sessions.length,expectedQuestions:target.length*(5+7+10)*6,
  displayed,rendered,errors,exhaustions,pageErrors,sha256:createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),
  browser:await browser.version(),testedAt:new Date().toISOString(),sessions
 };
 fs.writeFileSync('audits/g7_stage9_ui_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({catalog:report.catalog,expectedSessions:report.expectedSessions,actualSessions:report.actualSessions,expectedQuestions:report.expectedQuestions,displayed,rendered,errors:errors.slice(0,15),pageErrors,exhaustions},null,2));
 if(report.catalog!==107||report.actualSessions!==report.expectedSessions||displayed!==report.expectedQuestions||errors.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close()}
