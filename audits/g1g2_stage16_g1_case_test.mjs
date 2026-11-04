import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const hash=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
const html=fs.readFileSync('index.html','utf8');
if(!sw.includes('const APP_BUILD_HASH = "'+hash+'"'))throw Error('SW SHA out of sync');
if(!html.includes('function g1ActionNoun(')||html.includes('1 книга. Ей дали ещё 1 книга'))throw Error('G1 targeted source patch missing');
const bin=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:bin,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),jsErrors=[];page.on('pageerror',e=>jsErrors.push(String(e)));
const report={phase:'16-G1-grammar',sha256:hash,checkedAt:new Date().toISOString(),checks:[],failures:[],jsErrors};
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const res=await page.evaluate(()=>{
  const bad=/(?:дали|убрали|добавили|сняли|поставили|взяли|положили)\s+(?:ещё\s+)?(?:1|21|31|41|51|61|71|81|91)\s+книга(?=[\s.,!?;:]|$)/i;
  const good=/(?:дали|убрали|добавили|сняли|поставили|взяли|положили)\s+(?:ещё\s+)?(?:1|21|31|41|51|61|71|81|91)\s+книгу(?=[\s.,!?;:]|$)/i;
  const checks=[],failures=[];
  for(const grade of [1,2]){
    const make=window['makeG'+grade+'Question'];const byLevel=[];
    for(let d=0;d<3;d++){
     let checked=0,correct=0,wrong=0;
     for(let i=0;i<2200;i++){
      const q=make('g'+grade+':word_problems',d);
      if(!q?.text)throw Error('Missing task: G'+grade+', difficulty '+d);
      const txt=String(q.text).replace(/<[^>]+>/g,' ');
      if(bad.test(txt)){wrong++;if(failures.length<30)failures.push({grade,d,txt,kind:'bad-accusative'});}
      if(good.test(txt))correct++;
      checked++;
     }
     byLevel.push({difficulty:d,checked,correct,wrong});
    }
    checks.push({grade,byLevel});
  }
  const g1Total=checks.find(x=>x.grade===1).byLevel.reduce((sum,l)=>sum+l.correct,0);
  const g2Total=checks.find(x=>x.grade===2).byLevel.reduce((sum,l)=>sum+l.correct,0);
  if(g1Total<35)failures.push({kind:'G1 insufficient correct accusative coverage',g1Total});
  if(g2Total<35)failures.push({kind:'G2 insufficient correct accusative coverage',g2Total});
  const started=[];
  for(const grade of [1,2])for(let d=0;d<3;d++){
   window['startG'+grade+'QuizStage']('g'+grade+':word_problems',d);
   started.push({grade,d,rendered:!!document.querySelector('#qstage .quizq')?.textContent?.trim()});
  }
  return {checks,failures,started};
 });
 report.checks=res.checks;report.failures=res.failures;report.starts=res.started;
 report.summary={generated:res.checks.reduce((s,g)=>s+g.byLevel.reduce((n,l)=>n+l.checked,0),0),correctCases:res.checks.reduce((s,g)=>s+g.byLevel.reduce((n,l)=>n+l.correct,0),0),errors:res.failures.length,uiRendered:res.started.filter(s=>s.rendered).length,uiStarted:res.started.length,jsErrors:jsErrors.length};
 console.log('STAGE16 G1 PATCH QA',JSON.stringify(report.summary));
 console.log('CASES',JSON.stringify(res.checks));
 if(res.failures.length||jsErrors.length||report.summary.uiRendered!==report.summary.uiStarted)process.exitCode=1;
}catch(e){report.failures.push({fatal:String(e),stack:String(e.stack).slice(0,1400)});console.error('TEST FATAL',e);process.exitCode=1;}
finally{fs.writeFileSync('audits/g1g2_stage16_g1_case_report.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
