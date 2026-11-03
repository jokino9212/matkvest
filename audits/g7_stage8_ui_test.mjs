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
let report;
try{
 await page.setViewport({width:1024,height:768,deviceScaleFactor:1});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 report=await page.evaluate(()=>{
   const topics=g7AllTopics(),sessions=[],errors=[],duplicates=[];
   let displayed=0,skipped=0,renderedGraphs=0,renderedGeometry=0,finished=0;
   for(const topic of topics){
     for(let d=0;d<3;d++){
       const raw=topic.id.slice(3),count=STAGES[d].count;
       const sigs=new Set(),semantics=new Set(),sessionVariants=new Set();
       let step=0,localError=null;
       try{
         startG7QuizStage(topic.id,d);
         if(!blockSession||blockSession.kind!=='g7quiz'||blockSession.total!==count)throw Error('Failed to start the correct stage');
         if(qid!==topic.id)throw Error('Incorrect topic after opening UI');
         for(;step<count;step++){
           if(!q||!blockSession.currentItem)throw Error('No current question/attempt');
           if(!document.querySelector('#qstage .quizq')?.textContent?.trim())throw Error('Question prompt missing from DOM');
           if(!q.ex||!q.sig)throw Error('No explanation or question signature');
           if(/(?:NaN|undefined|\[object Object\])/.test(q.text+' '+q.ex))throw Error('Unrenderable question text');
           if(q.visual?.type==='coordinatePlane'||q.visual?.type==='geometry'){
             if(!document.querySelector('#qstage svg'))throw Error('Coordinate/geometry SVG missing in UI');
             if(q.visual.type==='coordinatePlane')renderedGraphs++;else renderedGeometry++;
           }
           if(q.choices?.length){
             const btns=[...document.querySelectorAll('#qstage .answer')];
             if(btns.length!==q.choices.length)throw Error('Answer buttons missing');
             const matching=q.choices.filter(x=>String(x.key)===String(q.ans));
             if(matching.length!==1)throw Error('No unique correct option');
           }else{
             if(q.answerMode==='coordinate'&&!document.querySelector('#quizInputX, #quizInputY'))throw Error('Coordinate inputs missing');
             if(q.answerMode==='fraction'&&!document.querySelector('#qstage input'))throw Error('Fraction input missing');
           }
           sigs.add(q.sig);
           semantics.add(JSON.stringify([q.text,q.ans,q.visual?.data||null]));
           sessionVariants.add(q.audit?.variant||q.templateId||'legacy');
           const skipBtn=document.getElementById('quizSkip');
           if(!skipBtn)throw Error('Skip button missing');
           skipBtn.click();
           skipped++;displayed++;
           if(blockSession.done!==step+1)throw Error('Progress did not advance after skip');
           if(step+1<count&&!blockSession.currentItem)throw Error('No next question after skip');
         }
         if(!blockSession.finished)throw Error('Session not marked completed');
         if(!document.querySelector('.block-result'))throw Error('Result panel not displayed');
         if(blockSession.items?.length!==count)throw Error('Question history length does not match stage');
         if(!blockSession.items.every(x=>x.skipped===true))throw Error('Skipped question not recorded');
         finished++;
       }catch(e){
         localError=String(e);
         errors.push({raw,d,step,error:localError});
       }
       const row={raw,d,requested:count,attempted:step+(localError?0:0),uniqueSignatures:sigs.size,uniqueSemantic:semantics.size,variants:sessionVariants.size,finished:!localError};
       sessions.push(row);
       if(!localError&&(sigs.size!==count||semantics.size!==count))duplicates.push(row);
     }
   }
   return {catalog:topics.length,expectedSessions:topics.length*3,expectedQuestions:topics.length*STAGES.reduce((n,s)=>n+s.count,0),finished,displayed,skipped,renderedGraphs,renderedGeometry,errors,duplicates,sessions};
 });
 report.pageErrors=pageErrors;
 report.sha256=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
 report.browser=await browser.version();
 report.testedAt=new Date().toISOString();
 fs.writeFileSync('audits/g7_stage8_ui_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({catalog:report.catalog,expectedSessions:report.expectedSessions,expectedQuestions:report.expectedQuestions,finished:report.finished,displayed:report.displayed,skipped:report.skipped,renderedGraphs:report.renderedGraphs,renderedGeometry:report.renderedGeometry,errors:report.errors.slice(0,25),duplicateCount:report.duplicates.length,duplicateExamples:report.duplicates.slice(0,25),pageErrors:pageErrors.slice(0,12)},null,2));
 if(report.catalog!==107||report.finished!==report.expectedSessions||report.displayed!==report.expectedQuestions||report.errors.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close()}
