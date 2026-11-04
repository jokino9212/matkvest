import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const approved='b953b710a471210fe0f8247b55e879cedf4d7e11c6f369d551040a9f5d46c7d3';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(sha!==approved)throw Error('Unexpected stage17 candidate SHA');
const binary=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath:binary,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
const report={stage:'17C-g3g4-column-input-accept-reject',sha256:sha,at:new Date().toISOString(),scenarios:[],failures:[],pageErrors};
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const results=await page.evaluate(()=>{
   const scenarios=[],failures=[];
   const write=(grade,op,d)=>grade===3?startG3WrittenStage('g3:written_'+(op==='sub'?'subtract':op==='mul'?'multiply':op==='div'?'divide':'add'),d):startColumnStage(op,d);
   const setAll=bad=>{
     const inputs=[...document.querySelectorAll('#stage input[data-exp]')],digit=inputs.find(i=>i.dataset.row==='final')??inputs.find(i=>i.dataset.row==='quot')??inputs.find(i=>i.dataset.exp&&!i.classList.contains('mark-in'));
     for(const input of inputs){
       const wanted=input.dataset.exp??'';
       input.value=input===digit&&bad?String((Number(wanted)||0)+1).slice(-1):wanted;
     }
     return {count:inputs.length,alteredRow:digit?.dataset.row,correct:digit?.dataset.exp};
   };
   for(const grade of [3,4]){
    if(grade===4)openGrade(4);
    for(const op of ['add','sub','mul','div'])for(let d=0;d<3;d++){
      const name=grade+'-'+op+'-'+d;
      try{
       write(grade,op,d);
       const before=blockSession?.correct??0;
       const wrongInput=setAll(true);
       checkColumn();
       const wrongFeedback=document.querySelector('#fb')?.textContent?.trim()??'';
       const wrongCorrect=(blockSession?.correct??0)-before;
       // "неверно" contains "верно": do not mistake negative feedback for success.
       const wrongRejected=wrongCorrect===0&&/Пока неверно|Ошибок в клетках|Ошибка/i.test(wrongFeedback)&&!/✅|^Верно|^Отлично/i.test(wrongFeedback);
       scenarios.push({name,scenario:'wrong',wrongInput,credited:wrongCorrect,feedback:wrongFeedback.slice(0,170),rejected:wrongRejected});
       if(!wrongRejected&&failures.length<60)failures.push({kind:'bad-column-accepted',name,feedback:wrongFeedback,credited:wrongCorrect});
      }catch(e){if(failures.length<60)failures.push({kind:'wrong-input-exception',name,error:String(e)})}
      try{
       write(grade,op,d);
       const before=blockSession?.correct??0;
       const correctInput=setAll(false);
       checkColumn();
       const goodFeedback=document.querySelector('#fb')?.textContent?.trim()??'';
       const gained=(blockSession?.correct??0)-before;
       const accepted=gained===1||/✅|Верно|Отлично/i.test(goodFeedback);
       scenarios.push({name,scenario:'correct',correctInput,credited:gained,feedback:goodFeedback.slice(0,170),accepted});
       if(!accepted&&failures.length<60)failures.push({kind:'correct-column-rejected',name,feedback:goodFeedback,credited:gained});
      }catch(e){if(failures.length<60)failures.push({kind:'correct-input-exception',name,error:String(e)})}
    }
   }
   return {scenarios,failures};
 });
 report.scenarios=results.scenarios;report.failures=results.failures;
 report.summary={scenarios:results.scenarios.length,wrong:results.scenarios.filter(x=>x.scenario==='wrong').length,
 wrongRejected:results.scenarios.filter(x=>x.scenario==='wrong'&&x.rejected).length,
 correct:results.scenarios.filter(x=>x.scenario==='correct').length,
 correctAccepted:results.scenarios.filter(x=>x.scenario==='correct'&&x.accepted).length,
 failures:results.failures.length,pageErrors:pageErrors.length};
 console.log('STAGE17 C COLUMN INPUT',JSON.stringify(report.summary));
 console.log('STAGE17 C SCENARIOS',JSON.stringify(report.scenarios.map(x=>({name:x.name,scenario:x.scenario,credited:x.credited,accepted:x.accepted,rejected:x.rejected,feedback:x.feedback.slice(0,75)}))));
 console.log('STAGE17 C FAILURES',JSON.stringify(report.failures.slice(0,15)));
 if(report.summary.scenarios!==48||report.summary.correctAccepted!==24||report.summary.wrongRejected!==24||pageErrors.length)process.exitCode=1;
}catch(e){report.failures.push({fatal:String(e),stack:String(e.stack).slice(0,1600)});console.error('STAGE17C FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g3g4_stage17_phaseC_column_input_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}