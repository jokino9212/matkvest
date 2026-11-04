import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const chrome = [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!chrome) throw Error('Chromium not found');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const diagnostics=await page.evaluate(()=>{
  const names=['startG7QuizStage','makeG7Question','freshQuiz','showQuiz','checkAnswer','checkQuiz','quizSubmit','submitAnswer','answerQuiz','quizCheck','showQuestion','renderQuestion','checkBlockAnswer','onAnswer','nextQuestion','finishQuiz','g7AllTopics','checkNumericAnswer'];
  const fn=Object.fromEntries(names.map(k=>[k,typeof globalThis[k]]));
  const allMatches=Object.getOwnPropertyNames(globalThis).filter(k=>/(quiz|answer|check|submit|skip|question)/i.test(k)).slice(0,180);
  const stats={};const examples={};
  for(const t of g7AllTopics()){
   for(let d=0;d<3;d++){
    let qq;
    try{qq=makeG7Question(t.id,d);}catch(e){continue}
    const mode=qq?.choices?'choices':String(qq?.answerMode||'text');
    stats[mode]=(stats[mode]||0)+1;
    examples[mode]??={topic:t.id,stage:d,ans:qq.ans,keys:Object.keys(qq),choices:qq.choices?.slice(0,2),audit:qq.audit,visual:qq.visual?.type};
   }
  }
  startG7QuizStage('g7:geo_primitives',0);
  const buttons=[...document.querySelectorAll('button')].filter(e=>e.offsetWidth||e.offsetHeight).slice(-45).map(e=>({id:e.id,cls:e.className,txt:e.textContent.trim().slice(0,65),onclick:e.getAttribute('onclick')}));
  const stage=document.getElementById('qstage');
  return {fn,allMatches,stats,examples,activeMode:q?.answerMode,activeChoices:q?.choices?.length,activeAnswer:q?.ans,activeKeys:Object.keys(q||{}),buttons,stageHTML:stage?.innerHTML.slice(0,9000),blockSessionKeys:Object.keys(blockSession||{})};
 });
 const report={sha256:createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),diagnostics,errors,testedAt:new Date().toISOString()};
 fs.writeFileSync('audits/g7_stage10_probe.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({sha256:report.sha256,modes:diagnostics.stats,functions:diagnostics.fn,errors},null,2));
 if(errors.length||report.sha256!=='f54327a5ae104f38259f962265115094df699cf946854e1193693de6cf1aec59') process.exitCode=1;
}finally{await browser.close()}
