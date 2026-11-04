import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const expected='f188d39a3a16fc54dfb32238fc34d3dfe6cc3c4416cd475579bf3ed65a7e1e36';
if(createHash('sha256').update(fs.readFileSync('index.html')).digest('hex')!==expected)throw Error('Stage13 SHA mismatch');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const result=await page.evaluate(()=>{
  const grades={},errors=[],columnSessions=[];
  for(const grade of [1,2,3,5,6,8]){
   const catalog=window['g'+grade+'AllTopics'](),make=window['makeG'+grade+'Question'];
   const row={topics:catalog.length,attempted:0,complete:0,noText:0,noAnswer:0,sampleErrors:[]};
   for(const topic of catalog){
    if(grade===3&&topic.rendererType==='column')continue;
    for(let stage=0;stage<3;stage++){
     for(let run=0;run<3;run++){
      row.attempted++;
      try{
       let question=make(topic.id,stage);
       if(!question||typeof question!=='object')throw Error('Generator returned no question object');
       if(!String(question.text||'').trim()){row.noText++;throw Error('Missing question text')}
       if(question.ans===undefined&&question.answer===undefined&&question.answerRat===undefined){row.noAnswer++;throw Error('Missing answer key')}
       row.complete++;
      }catch(err){
       if(row.sampleErrors.length<15)row.sampleErrors.push({topic:topic.id,stage,run,error:String(err)});
       if(errors.length<70)errors.push({grade,topic:topic.id,stage,run,error:String(err)});
      }
     }
    }
   }
   grades[grade]=row;
  }
  for(const topic of g3AllTopics().filter(t=>t.rendererType==='column')){
   for(let stage=0;stage<3;stage++){
    try{
     startG3WrittenStage(topic.id,stage);
     if(blockSession?.kind!=='g3column'||blockSession?.key!==topic.id)throw Error('Wrong session after launching column training');
     if(!document.querySelector('#stage')?.textContent.trim())throw Error('Empty column training display');
     columnSessions.push({topic:topic.id,stage,ok:true});
    }catch(err){errors.push({grade:3,topic:topic.id,stage,mode:'column',error:String(err)});columnSessions.push({topic:topic.id,stage,ok:false,error:String(err)})}
   }
  }
  const entrypoints={openGrade:typeof openGrade,openTopic:typeof openTopic,openG7Quiz:typeof openG7Quiz,openG8Quiz:typeof openG8Quiz};
  return {grades,errors,columnSessions,entrypoints};
 });
 const report={testedAt:new Date().toISOString(),sha256:expected,pageErrors,...result};
 fs.writeFileSync('audits/g7_stage14_crossgrade_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({grades:report.grades,columnSessions:report.columnSessions.length,errors:report.errors.slice(0,25),pageErrors},null,2));
 if(report.errors.length||pageErrors.length||report.columnSessions.length!==12)process.exitCode=1;
}finally{await browser.close()}
