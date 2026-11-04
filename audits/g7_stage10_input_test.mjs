import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
const EXPECTED='f54327a5ae104f38259f962265115094df699cf946854e1193693de6cf1aec59';
if(createHash('sha256').update(fs.readFileSync('index.html')).digest('hex')!==EXPECTED)throw Error('Unexpected HTML source');
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const results=await page.evaluate(()=>{
   const scenarios=[
      {mode:'number',topic:'g7:rational_numbers_forms',stage:0},
      {mode:'fraction',topic:'g7:rational_numbers_forms',stage:1},
      {mode:'linear',topic:'g7:expression_properties',stage:1},
      {mode:'coordinate',topic:'g7:coordinate_plane',stage:2},
      {mode:'multi',topic:'g7:graphical_equations_systems',stage:2},
   ];
   const results=[],errors=[];
   const getMode=a=>a?.choices?.length?'choices':String(a?.answerMode||'unknown');
   const fmtRat=r=>r&&typeof r==='object'&&'n' in r?String(Number(r.n)/Number(r.d)).replace('.',','):String(r);
   function fill(a,isCorrect){
      const mode=getMode(a);
      if(mode==='coordinate'){
        const x=document.getElementById('quizInputX'),y=document.getElementById('quizInputY');
        if(!x||!y)throw Error('Coordinate inputs missing');
        x.value=isCorrect?fmtRat(a.answerPoint?.x):'987654321';
        y.value=isCorrect?fmtRat(a.answerPoint?.y):'-987654321';
      }else{
        const input=document.getElementById('quizInput');
        if(!input)throw Error('Text input missing');
        input.value=isCorrect?String(a.ans):'987654321abcdef';
      }
   }
   function find(sc){
      for(let attempt=0;attempt<180;attempt++){
        startG7QuizStage(sc.topic,sc.stage);
        if(getMode(q)===sc.mode)return {a:q,attempts:attempt+1};
      }
      return null;
   }
   for(const sc of scenarios){
     for(const isCorrect of [false,true]){
       for(let run=0;run<5;run++){
         try{
           const found=find(sc);
           if(!found)throw Error('No generated input task for mode after 180 starts');
           const a=found.a,old=blockSession.correct;
           fill(a,isCorrect);
           const raw=a.ans,check=document.getElementById('quizCheck');
           if(!check)throw Error('Check button missing');
           check.click();
           const now=blockSession.correct,fb=(document.getElementById('qfb')?.textContent||'').trim();
           const next=document.getElementById('quizNext');
           if(!fb)throw Error('No feedback after submitting');
           if(isCorrect&&now!==old+1)throw Error('Correct input not credited: '+JSON.stringify({mode:sc.mode,raw,fb,old,now}));
           if(!isCorrect&&now!==old)throw Error('Invalid input was credited: '+JSON.stringify({mode:sc.mode,raw,fb,old,now}));
           if(isCorrect&&(!next||next.style.display==='none'))throw Error('Cannot proceed after correct input');
           if(isCorrect){
             check.click();
             if(blockSession.correct!==now)throw Error('Repeated Check credited twice');
           }
           results.push({mode:sc.mode,isCorrect,run,attempts:found.attempts,raw,feedback:fb.slice(0,70),credited:now-old});
         }catch(e){errors.push({mode:sc.mode,isCorrect,run,error:String(e)});if(errors.length>20)break;}
       }
       if(errors.length>20)break;
     }
     if(errors.length>20)break;
   }
   return {expected:scenarios.length*2*5,trials:results.length,errors,results};
 });
 const report={sha256:EXPECTED,testedAt:new Date().toISOString(),...results,pageErrors};
 fs.writeFileSync('audits/g7_stage10_input_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({expected:report.expected,trials:report.trials,byMode:Object.fromEntries([...new Set(report.results.map(x=>x.mode))].map(k=>[k,report.results.filter(x=>x.mode===k).length])),errors:report.errors.slice(0,20),pageErrors},null,2));
 if(report.trials!==report.expected||report.errors.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close()}
