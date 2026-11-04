import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const hash=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('const APP_BUILD_HASH = "'+hash+'"'))throw Error('HTML/SW fingerprint mismatch');
if(!fs.readFileSync('index.html','utf8').includes('function g1ExistVerb('))throw Error('Required isolated gender-agreement fix missing');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!chrome)throw Error('Chromium unavailable');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),jsErrors=[];
page.on('pageerror',e=>jsErrors.push(String(e)));
const report={stage:'16D-post-patch-regression',sha256:hash,at:new Date().toISOString(),failures:[],jsErrors,results:{},summary:{}};
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const r=await page.evaluate(()=>{
  const failures=[],rows=[],cross=[],input=[],ui=[];
  const fail=(kind,detail)=>{if(failures.length<80)failures.push({kind,...detail});};
  const clean=x=>String(x??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const singular=n=>n%10===1&&n%100!==11;
  let total=0,agreeChecks=0,mathChecks=0,choicesChecked=0,correctedFeminine=0,correctedMasculine=0,pluralVerified=0,actionAccusative=0;
  for(const grade of [1,2]){
   const make=window['makeG'+grade+'Question'];
   for(let d=0;d<3;d++){
    let tested=0,seen=0;
    for(let i=0;i<2400;i++){
     const q=make('g'+grade+':word_problems',d),t=clean(q?.text);
     total++;tested++;
     if(!t)fail('missing-text',{grade,d,run:i});
     const nounMatches=[...t.matchAll(/\b(было|был|была)\s+(\d+)\s+(карандаш|кубик|мяч|книга|тетрадь)(?=[\s.,!?;:]|$)/giu)];
     for(const m of nounMatches){
      const num=Number(m[2]),noun=m[3].toLowerCase(),verb=m[1].toLowerCase();
      if(singular(num)){
       const wanted=noun==='книга'||noun==='тетрадь'?'была':'был';
       agreeChecks++;seen++;
       if(verb!==wanted)fail('gender-agreement',{grade,d,t,fragment:m[0],wanted});
       else if(wanted==='была')correctedFeminine++;else correctedMasculine++;
      }else if(verb==='было')pluralVerified++;
     }
     const m=q?.audit?.model;
     if(m&&typeof m==='object'){
      let expected=null;
      switch(m.kind){
       case 'add':expected=m.a+m.b;break;
       case 'sub':expected=m.a-m.b;break;
       case 'mul':expected=m.groups*m.each;break;
       case 'div':expected=m.total/m.groups;break;
       case 'two_add_sub':expected=m.a+m.b-m.c;break;
       case 'two_sub_add':expected=m.a-m.b+m.c;break;
       case 'two_mul_add':expected=m.groups*m.each+m.extra;break;
      }
      if(expected!==null){
       mathChecks++;
       if(Math.abs(expected-m.result)>1e-9)fail('math-model',{grade,d,t,expected,actual:m.result});
      }
     }
     if(q.choices?.length){
      choicesChecked++;
      const a=q.answer??q.ans??q.answerRat;
      const k=q.choices.map(x=>String(x.key??x.value??x.label));
      if(k.filter(x=>x===String(a)).length!==1||new Set(k).size!==k.length)fail('choice-answer',{grade,d,t,a,keys:k});
     }
     if(/(?:дали|сняли|убрали|поставили|взяли|положили)\s+(?:ещё\s+)?(?:1|21|31|41|51|61|71|81|91)\s+книга\b/iu.test(t))fail('accusative',{grade,d,t});
     if(/(?:дали|сняли|убрали|поставили|взяли|положили)\s+(?:ещё\s+)?(?:1|21|31|41|51|61|71|81|91)\s+книгу\b/iu.test(t))actionAccusative++;
    }
    rows.push({grade,level:d,tested,singularAgreementCases:seen});
   }
  }
  for(const grade of [1,2]){
   const all=window['g'+grade+'AllTopics'](),make=window['makeG'+grade+'Question'];
   for(const topic of all){
    for(let d=0;d<3;d++){
     for(let i=0;i<45;i++){
      total++;const q=make(topic.id,d);
      if(!clean(q?.text)||(q.ans===undefined&&q.answer===undefined&&q.answerRat===undefined))fail('all-topic-invalid',{grade,topic:topic.id,d,i});
      if(q.choices?.length){
       choicesChecked++;const a=q.answer??q.ans??q.answerRat;
       const keys=q.choices.map(c=>String(c.key??c.value??c.label));
       if(keys.filter(k=>k===String(a)).length!==1||new Set(keys).size!==keys.length)fail('choice-answer',{grade,topic:topic.id,d,i,keys,a});
      }
      if(q.visual?.data?.showDerived===true||q.visual?.data?.showPerimeter===true)fail('visual-leaks-answer',{grade,topic:topic.id,d});
     }
     try{
      window['startG'+grade+'QuizStage'](topic.id,d);
      const ok=!!document.querySelector('#qstage .quizq')?.textContent?.trim();
      ui.push({grade,topic:topic.id,d,ok});
      if(!ok)fail('ui-empty',{grade,topic:topic.id,d});
     }catch(e){fail('ui-start',{grade,topic:topic.id,d,error:String(e)})}
    }
   }
  }
  // Wrong-input rejection and scoring: real rendered numeric UI, not pure generator.
  for(const grade of [1,2]){
   const id='g'+grade+':word_problems';
   for(const d of [1,2]){
    let found=false;
    for(let attempt=0;attempt<100;attempt++){
     window['startG'+grade+'QuizStage'](id,d);
     const el=document.getElementById('quizInput'),check=document.getElementById('quizCheck');
     if(!el||!check)continue;
     found=true;
     const old=blockSession.correct;
     el.value='999999999';
     check.click();
     const next=blockSession.correct;
     const feedback=clean(document.getElementById('qfb')?.textContent);
     input.push({grade,d,credited:next-old,feedback:feedback.slice(0,110)});
     if(next!==old||!feedback)fail('wrong-input-accepted-or-no-feedback',{grade,d,old,next,feedback});
     break;
    }
    if(!found)fail('numeric-input-ui-missing',{grade,d});
   }
  }
  // Non-invasive cross-grade smoke for supported quiz generators.
  for(const grade of [3,4,5,7,8]){
   const all=window['g'+grade+'AllTopics'],make=window['makeG'+grade+'Question'];
   if(typeof all!=='function'||typeof make!=='function'){cross.push({grade,available:false});continue;}
   let n=0,skipped=0;
   for(const t of all()){
    if(t.rendererType==='column'){skipped++;continue;}
    for(let d=0;d<3;d++){
     for(let i=0;i<3;i++){
      try{
       const q=make(t.id,d);
       if(!clean(q?.text)||(q.ans===undefined&&q.answer===undefined&&q.answerRat===undefined))throw Error('Invalid question');
       n++;
      }catch(e){fail('cross-grade',{grade,id:t.id,d,error:String(e)});}
     }
    }
   }
   cross.push({grade,available:true,verified:n,columnSkipped:skipped});
  }
  return {failures,rows,cross,input,ui,totals:{generated:total,agreeChecks,correctedFeminine,correctedMasculine,pluralVerified,actionAccusative,mathChecks,choicesChecked}};
 });
 report.results={...r,failures:undefined,ui:r.ui.length};
 report.failures=r.failures;
 report.summary={...r.totals,uiStarted:r.ui.length,uiRendered:r.ui.filter(x=>x.ok).length,wrongInputScenarios:r.input.length,wrongInputsRejected:r.input.filter(x=>x.credited===0&&x.feedback).length,crossgradeVerified:r.cross.reduce((s,x)=>s+(x.verified??0),0),errors:r.failures.length,jsErrors:jsErrors.length};
 console.log('STAGE16 D REGRESSION',JSON.stringify(report.summary));
 console.log('CROSS',JSON.stringify(r.cross));
 console.log('FAILURES',JSON.stringify(r.failures.slice(0,15)));
 if(report.summary.agreeChecks<70||report.summary.correctedFeminine<15||report.summary.correctedMasculine<15||report.summary.actionAccusative<20||report.summary.wrongInputsRejected!==4||r.failures.length||jsErrors.length)process.exitCode=1;
}catch(e){report.failures.push({fatal:String(e),stack:String(e.stack).slice(0,1600)});console.error('STAGE16 D REGRESSION FATAL',e);process.exitCode=1}
finally{
 fs.writeFileSync('audits/g1g2_stage16_phaseD_regression_report.json',JSON.stringify(report,null,2)+'\n');
 await browser.close()
}