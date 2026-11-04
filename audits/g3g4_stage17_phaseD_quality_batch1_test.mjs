import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const got=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v44')||!sw.includes('const APP_BUILD_HASH = "'+got+'"'))throw Error('Candidate and PWA v44 not synchronized');
const binary=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!binary)throw Error('Chrome unavailable');
const browser=await puppeteer.launch({executablePath:binary,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
const report={stage:'17D-grade3-quality-batch1',sha256:got,at:new Date().toISOString(),results:[],failures:[],ui:[],jsErrors:errors,summary:{}};
try{
 await page.setViewport({width:390,height:844});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const data=await page.evaluate(()=>{
  const failures=[],results=[],ui=[],ids=['offtable_multiply','offtable_divide','division_remainder'],count=480;
  const fail=(kind,meta)=>{if(failures.length<120)failures.push({kind,...meta})};
  const clean=x=>String(x??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  for(const id of ids)for(let d=0;d<3;d++){
   const variants={},shapes=new Set(),texts=new Set(),row={id,d,count,variants,uniquePrompts:0,shapes:0,independentChecks:0,numericExplanations:0};
   for(let i=0;i<count;i++){
    let q;try{q=makeG3Question('g3:'+id,d)}catch(e){fail('generator-throws',{id,d,i,e:String(e)});continue}
    const a=q?.audit??{},variant=String(a.variant),prompt=clean(q?.text),ex=clean(q?.ex);
    variants[variant]=(variants[variant]||0)+1;
    shapes.add(prompt.replace(/\d+/g,'#').replace(/^(На|В|Из) \S+/, '$1 ITEM'));
    texts.add(prompt);
    if(!prompt||!ex||!q?.sig)fail('missing-question',{id,d,i,prompt,ex});
    if(!ex.includes('=')||!Number.isFinite(Number(a?.dividend??a?.n??a?.total)))fail('bad-audit-or-explanation',{id,d,i,variant,ex:ex.slice(0,130)});
    if(id==='offtable_multiply'){
      const expected=a.n*a.k+(a.variant==='multiplyThenAdd'?a.delta:a.variant==='multiplyThenSubtract'?-a.delta:0);
      const answer=Number(q.ans??q.answer);
      if(!Number.isInteger(expected)||expected!==answer)fail('multiply-math',{id,d,i,variant,expected,answer});
      if(d===0&&variant!=='tens'||d===1&&!['equalGroups','decomp'].includes(variant)||d===2&&!['multiplyThenAdd','multiplyThenSubtract'].includes(variant))fail('multiply-progression',{id,d,i,variant});
      if(d===2&&(!Number.isInteger(a.delta)||a.delta<3||!/[−+]/.test(ex)))fail('multiply-second-step',{id,d,i,variant});
      row.independentChecks++;
    }
    if(id==='offtable_divide'){
      const base=a.dividend/a.divisor,expected=base+(a.variant==='divideThenAdd'?a.delta:a.variant==='divideThenSubtract'?-a.delta:0),answer=Number(q.ans??q.answer);
      if(!Number.isInteger(base)||!Number.isInteger(expected)||expected!==answer||a.quotient!==base)fail('divide-math',{id,d,i,variant,base,expected,answer});
      if(d===0&&variant!=='tens'||d===1&&!['decomp','equalSharing'].includes(variant)||d===2&&!['divideThenAdd','divideThenSubtract'].includes(variant))fail('divide-progression',{id,d,i,variant});
      if(d===2&&(!Number.isInteger(a.delta)||a.delta<2||!/[−+]/.test(ex)))fail('divide-second-step',{id,d,i,variant});
      row.independentChecks++;
    }
    if(id==='division_remainder'){
      const {dividend,divisor,quotient,remainder}=a,ans=String(q.ans??q.answer);
      if(![dividend,divisor,quotient,remainder].every(Number.isInteger)||dividend!==divisor*quotient+remainder||remainder<1||remainder>=divisor||ans!==quotient+' (ост. '+remainder+')')fail('remainder-math',{id,d,i,variant,dividend,divisor,quotient,remainder,ans});
      if(d===0&&variant!=='numeric'||d===1&&!['packApples','packPencils'].includes(variant)||d===2&&variant!=='subtractThenDivide')fail('remainder-progression',{id,d,i,variant});
      if(d===2&&(a.total-a.taken!==dividend||!prompt.includes(String(a.total))||!prompt.includes(String(a.taken))))fail('remainder-two-step',{id,d,i,variant,total:a.total,taken:a.taken,prompt});
      if(q.answerMode!=='remainder')fail('remainder-input-mode',{id,d,i,mode:q.answerMode});
      row.independentChecks++;
    }
    if(d===2&&id!=='division_remainder'&&!/(прибавляем|вычитаем|добавили|взяли|забрали|Принесли|стало|осталось)/i.test(prompt+' '+ex))fail('no-second-reasoning-operation',{id,d,i,prompt});
   }
   row.uniquePrompts=texts.size;row.shapes=shapes.size;
   if(row.independentChecks!==count)fail('coverage',{id,d,checked:row.independentChecks,expected:count});
   if(d===1&&Object.keys(variants).length<2)fail('middle-level-no-strategy-choice',{id,d,variants});
   if(d===2&&id!=='division_remainder'&&Object.keys(variants).length<2)fail('advanced-no-second-action-choice',{id,d,variants});
   if(d===1&&Object.values(variants).some(v=>v<45))fail('underrepresented-middle-variant',{id,d,variants});
   if(d===2&&id!=='division_remainder'&&Object.values(variants).some(v=>v<45))fail('underrepresented-advanced-variant',{id,d,variants});
   if(row.uniquePrompts<(id==='offtable_divide'&&d===0?8:12))fail('low-variety',{id,d,unique:row.uniquePrompts});
   results.push(row);
  }
  for(const id of ids)for(let d=0;d<3;d++){
   try{
     startG3QuizStage('g3:'+id,d);
     const view=document.querySelector('#qstage .quizq');
     const input=id==='division_remainder'?document.querySelectorAll('#qstage input').length>=2:!!document.querySelector('#quizInput');
     ui.push({id,d,rendered:!!view,hasInput:input});
     if(!view||!input)fail('ui-unavailable',{id,d,view:!!view,input:!!input});
   }catch(e){fail('ui-error',{id,d,error:String(e)})}
  }
  return {failures,results,ui};
 });
 report.results=data.results;report.ui=data.ui;report.failures=data.failures;
 report.summary={generated:report.results.reduce((s,r)=>s+r.count,0),independentlyVerified:report.results.reduce((s,r)=>s+r.independentChecks,0),ui:report.ui.length,uiReady:report.ui.filter(x=>x.rendered&&x.hasInput).length,failures:report.failures.length,jsErrors:errors.length};
 console.log('QUALITY-BATCH1',JSON.stringify(report.summary));
 console.log('DIVERSITY',JSON.stringify(report.results.map(x=>({id:x.id,d:x.d,variants:x.variants,shapes:x.shapes,unique:x.uniquePrompts}))));
 if(report.failures.length)console.error('FAILURES',JSON.stringify(report.failures.slice(0,18)));
 if(report.failures.length||errors.length||report.summary.generated!==4320||report.summary.uiReady!==9)process.exitCode=1;
}catch(e){report.failures.push({fatal:String(e),stack:String(e.stack).slice(0,1400)});console.error('QUALITY-BATCH1 FATAL',e);process.exitCode=1}
finally{
 fs.writeFileSync('audits/g3g4_stage17_phaseD_quality_batch1_test_report.json',JSON.stringify(report,null,2)+'\n');
 await browser.close();
}
