import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const report=await page.evaluate(()=>{
   const examples={},counts={};
   for(const topic of g7AllTopics()){
    for(let d=0;d<3;d++){
     for(let attempt=0;attempt<3;attempt++){
      startG7QuizStage(topic.id,d);
      const cur=q,mode=cur?.choices?.length?'choices':String(cur?.answerMode||'unknown');
      counts[mode]=(counts[mode]||0)+1;
      if(!examples[mode]){
       const root=document.getElementById('qstage');
       examples[mode]={topic:topic.id,d,ans:cur?.ans,answerRat:cur?.answerRat,answerPoint:cur?.answerPoint,
         keys:Object.keys(cur||{}),inputElements:[...root.querySelectorAll('input')].map(el=>({id:el.id,type:el.type,placeholder:el.placeholder,outerHTML:el.outerHTML.slice(0,280)})),
         actions:[...root.querySelectorAll('button')].map(el=>({id:el.id,text:el.textContent.trim().slice(0,70),onclick:el.getAttribute('onclick')})),
         html:root.innerHTML.slice(0,2800)};
      }
     }
    }
   }
   return {counts,examples,handlers:{checkQuizInput:String(checkQuizInput).slice(0,11000),quizInputEvaluation:String(quizInputEvaluation).slice(0,8000),quizInputRaw:String(quizInputRaw).slice(0,5000)}};
 });
 fs.writeFileSync('audits/g7_stage10_input_probe.json',JSON.stringify(report,null,2)+'\n');
 console.log('INPUT MODE PROBE',JSON.stringify({counts:report.counts,examples:Object.fromEntries(Object.entries(report.examples).map(([k,v])=>[k,{topic:v.topic,stage:v.d,answer:v.ans,answerRat:v.answerRat,answerPoint:v.answerPoint,inputs:v.inputElements,buttons:v.actions}]))},null,2));
}finally{await browser.close()}
