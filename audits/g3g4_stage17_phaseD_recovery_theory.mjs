import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';
const expected='fa4db04c3a53351ed672b12daa577a2ea3bb1376932f13b821e50db95436cd9a';
const got=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(got!==expected||!fs.readFileSync('sw.js','utf8').includes('const APP_BUILD_HASH = "'+got+'"'))throw Error('Unknown G3/G4 HTML or PWA');
const executable=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!executable)throw Error('Browser missing');
const port=32467,origin='http://127.0.0.1:'+port,server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
const browser=await puppeteer.launch({executablePath:executable,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const report={phase:'17D-recovery-theory-UI',candidateSha256:got,at:new Date().toISOString(),scenarios:[],theory:[],failures:[],flags:[],pageErrors:[],summary:{}};
const fail=(name,error)=>{report.failures.push({name,error:String(error)});console.error('FAIL',name,String(error))};
async function ready(){
  for(let i=0;i<65;i++){try{const response=await fetch(origin+'/index.html');if(response.ok){await response.body?.cancel();return}}catch{}await delay(150)}
  throw Error('Server unavailable');
}
async function fresh(){
 const ctx=await browser.createBrowserContext(),page=await ctx.newPage();
 page.on('pageerror',e=>report.pageErrors.push({context:page.__auditContext||'unknown',message:String(e),stack:String(e.stack).slice(0,2500)}));
 await page.setViewport({width:390,height:844,isMobile:true,deviceScaleFactor:2,hasTouch:true});
 await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded',timeout:120000});
 return {ctx,page};
}
const scenarios=[
 {name:'G3 quiz numbers',kind:'g3quiz',id:'g3:numbers_1000',d:1},
 {name:'G3 quiz geometry',kind:'g3quiz',id:'g3:geometry_figures',d:1},
 {name:'G3 written arithmetic',kind:'g3column',id:'g3:written_add',d:1},
 {name:'G4 quiz',kind:'g4quiz',id:'numbers',d:1},
 {name:'G4 written arithmetic',kind:'g4column',op:'sub',d:1},
 {name:'G4 table',kind:'g4table',d:1}
];
await ready();
try{
 for(const trial of scenarios){
  let ctx,page;
  try{
   ({ctx,page}=await fresh());page.__auditContext=trial.name;
   const before=await page.evaluate(({kind,id,op,d})=>{
    if(kind==='g3quiz')startG3QuizStage(id,d);
    else if(kind==='g3column')startG3WrittenStage(id,d);
    else {openGrade(4);if(kind==='g4quiz')startQuizStage(id,d);else if(kind==='g4column')startColumnStage(op,d);else startTableStage(d)}
    const active=typeof mk872HasActiveLearning==='function'&&mk872HasActiveLearning();
    const draftSaved=mk872PersistDraft(),draft=mk872ReadDraft();
    const stage=document.querySelector('#qstage')||document.querySelector('#stage')||document.querySelector('#tstage');
    return {key:blockSession?.key,attemptId:blockSession?.attemptId,done:blockSession?.done,correct:blockSession?.correct,
      kind:blockSession?.kind,qSig:typeof q==='undefined'?null:q?.sig??null,draftSaved,
      hasDraft:!!draft,draftAttemptId:draft?.attemptId,active,stageText:(stage?.textContent||'').trim().slice(0,120)};
   },trial);
   if(!before.draftSaved||!before.hasDraft||!before.active||!before.attemptId)throw Error('Not persisted at start '+JSON.stringify(before));
   await page.reload({waitUntil:'domcontentloaded',timeout:120000});
   await page.waitForSelector('.mk872-training-dialog',{timeout:11000});
   const after=await page.evaluate(()=>{
     const dialog=document.querySelector('.mk872-training-dialog');
     const b=[...dialog.querySelectorAll('button')].find(x=>x.textContent.trim()==='Продолжить');
     if(!b)throw Error('No resume button');
     b.click();
     const stage=document.querySelector('#qstage')||document.querySelector('#stage')||document.querySelector('#tstage');
     return {key:blockSession?.key,attemptId:blockSession?.attemptId,done:blockSession?.done,correct:blockSession?.correct,
       kind:blockSession?.kind,qSig:typeof q==='undefined'?null:q?.sig??null,
       active:mk872HasActiveLearning(),stageText:(stage?.textContent||'').trim().slice(0,120)};
   });
   if(!after.active||after.attemptId!==before.attemptId||after.key!==before.key||after.done!==before.done||after.correct!==before.correct)
       throw Error('Session state differs '+JSON.stringify({before,after}));
   if(before.qSig&&after.qSig!==before.qSig)throw Error('Question changed '+JSON.stringify({before,after}));
   if(!after.stageText)throw Error('Restored activity UI empty');
   report.scenarios.push({name:trial.name,status:'PASS',before,after});
   console.log('PASS RESTORE',trial.name,JSON.stringify({kind:after.kind,attemptId:after.attemptId,qSig:after.qSig}).slice(0,200));
  }catch(e){fail(trial.name,e)}
  finally{if(ctx)await ctx.close()}
 }
 let rapidCtx,rapidPage;
 try{
   ({ctx:rapidCtx,page:rapidPage}=await fresh());
   rapidPage.__auditContext='G4 quick switch after table';
   const startErrors=report.pageErrors.length;
   await rapidPage.evaluate(()=>{openGrade(4);startTableStage(0);startQuizStage('numbers',0)});
   await delay(180);
   const visible=await rapidPage.evaluate(()=>({question:!!document.querySelector('#qstage .quizq'),activeKind:blockSession?.kind}));
   report.quickSwitch={from:'table',to:'numbers',noErrors:report.pageErrors.length===startErrors,...visible};
   if(!visible.question||!report.quickSwitch.noErrors)throw Error('G4 rapid switch failure '+JSON.stringify(report.quickSwitch));
 }catch(e){fail('G4 immediate switch from multiplication table',e)}
 finally{if(rapidCtx)await rapidCtx.close()}
 // Theory and lesson UI for all ordinary themes at 390px viewport.
 let ctx,page;try{
  ({ctx,page}=await fresh());page.__auditContext='G3/G4 theory sweep';
  const evaluation=await page.evaluate(()=>{
   const rows=[],flags=[],errors=[],clean=x=>String(x??'').replace(/\s+/g,' ').trim();
   for(const t of g3AllTopics()){
    for(const d of [0,2]){
     try{
      if(t.rendererType==='column')startG3WrittenStage(t.id,d);
      else startG3QuizStage(t.id,d);
      const lesson=document.querySelector('.lesson'),content=clean(lesson?.textContent);
      const output=clean(document.querySelector('#qstage,#stage')?.textContent);
      const item={grade:3,id:t.id,d,theoryLength:content.length,preview:content.slice(0,145),activityLength:output.length,
        overflow:Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth)};
      rows.push(item);
      if(content.length<85)flags.push({kind:'short-theory',...item});
      if(item.overflow>60)flags.push({kind:'mobile-overflow',...item});
      if(!output)errors.push({kind:'missing-activity',id:t.id,d});
     }catch(e){errors.push({id:t.id,d,error:String(e)})}
    }
   }
   openGrade(4);
   for(const t of TOPICS){
    for(const d of [0,2]){
     try{
      if(t.id==='column')startColumnStage('add',d);
      else if(t.id==='table')startTableStage(d);
      else startQuizStage(t.id,d);
      const lesson=document.querySelector('.lesson'),content=clean(lesson?.textContent);
      const output=clean(document.querySelector('#qstage,#stage,#tstage')?.textContent);
      const item={grade:4,id:t.id,d,theoryLength:content.length,preview:content.slice(0,145),activityLength:output.length,
        overflow:Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth)};
      rows.push(item);
      if(content.length<85)flags.push({kind:'short-theory',...item});
      if(item.overflow>60)flags.push({kind:'mobile-overflow',...item});
      if(!output)errors.push({kind:'missing-activity',id:t.id,d});
     }catch(e){errors.push({id:t.id,d,error:String(e)})}
    }
   }
   return {rows,flags,errors};
  });
  report.theory=evaluation.rows;
  report.flags=evaluation.flags;
  for(const e of evaluation.errors)fail('topic-theory-or-activity',JSON.stringify(e));
 }finally{if(ctx)await ctx.close()}
 }finally{
 await browser.close();server.kill('SIGTERM');
 report.summary={restoreScenarios:scenarios.length,restored:report.scenarios.length,theoryActivitySnapshots:report.theory.length,
  shortTheoryFlags:report.flags.filter(x=>x.kind==='short-theory').length,
  mobileOverflowFlags:report.flags.filter(x=>x.kind==='mobile-overflow').length,
  failures:report.failures.length,jsErrors:report.pageErrors.length};
 fs.writeFileSync('audits/g3g4_stage17_phaseD_recovery_theory_report.json',JSON.stringify(report,null,2)+'\n');
 console.log('STAGE17D RECOVERY AND THEORY',JSON.stringify(report.summary));
 console.log('FAILURES',JSON.stringify(report.failures.slice(0,15)));
 console.log('FLAGS',JSON.stringify(report.flags.slice(0,15)));
 if(report.failures.length||report.pageErrors.length||report.scenarios.length!==scenarios.length||report.theory.length!==112)process.exitCode=1;
}
