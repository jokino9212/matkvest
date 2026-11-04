import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v50')||!sw.includes('const APP_BUILD_HASH = "'+sha+'"'))throw Error('HTML/PWA v50 fingerprint mismatch');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Chromium unavailable');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,timeout:90000,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const report={stage:'17D-final-written-corrective-gate',sha256:sha,at:new Date().toISOString(),rows:[],errors:[],ui:[],pageErrors,summary:{}};
try{
 await page.setViewport({width:390,height:844});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const r=await page.evaluate(()=>{
  const ids=['written_add','written_subtract','written_multiply','written_divide'],N=600,rows=[],ui=[],errors=[];
  const fail=(kind,info)=>{if(errors.length<140)errors.push({kind,...info})};
  const clean=x=>String(x??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  for(const raw of ids)for(let d=0;d<3;d++){
   const row={id:'g3:'+raw,d,attempted:N,verified:0,answers:new Set(),models:new Set(),carryCounts:{},quotientDigits:{},borrowCounts:{},mathChecks:0,levelChecks:0,modelChecks:0};
   for(let i=0;i<N;i++){
    let q;try{q=generateG3ColumnTask('g3:'+raw,d)}catch(e){fail('generation-exception',{raw,d,i,error:String(e)});continue}
    const ctx={raw,d,i},a=q?.a,b=q?.b,answer=q?.ans,expected=raw==='written_add'?a+b:raw==='written_subtract'?a-b:raw==='written_multiply'?a*b:a/b;
    if(!Number.isInteger(a)||!Number.isInteger(b)||a<1||b<1||!Number.isInteger(answer)||answer!==expected||!q.audit||a>999)
      fail('independent-column-arithmetic',{...ctx,a,b,answer,expected});
    if(q.audit.answer!==expected)fail('column-audit-answer',{...ctx,a,b,answer,audit:q.audit});
    if(raw==='written_add'){
      const carries=g3HasCarry(a,b);
      if(carries!==q.audit.carries||d===0&&carries!==0||d===1&&carries!==1||d===2&&carries<2||answer>1000)fail('written-add-carries',{...ctx,a,b,carries});
      row.carryCounts[carries]=(row.carryCounts[carries]??0)+1;
      row.levelChecks++;
    }else if(raw==='written_subtract'){
      const borrows=g3BorrowCount(a,b);
      if(borrows!==q.audit.borrows||d===0&&borrows!==0||d===1&&borrows<1||d===2&&borrows<2||a<b)fail('written-sub-borrows',{...ctx,a,b,borrows});
      row.borrowCounts[borrows]=(row.borrowCounts[borrows]??0)+1;
      row.levelChecks++;
    }else if(raw==='written_multiply'){
      const unitCarry=Math.floor((a%10)*b/10),tensCarry=Math.floor((Math.floor(a/10)*b+unitCarry)/10),
        count=Number(unitCarry>0)+Number(tensCarry>0);
      if(d!==count||q.audit.carryCount!==count||q.audit.carry!==(count>0)||b<2||b>9||a>99||answer>(d===0?99:d===1?299:999))
        fail('hard-written-mul-progression',{...ctx,a,b,count,expected:d,answer,audit:q.audit});
      if(q.op!=='×'||q.singleDigitMultiplier!==true||!Array.isArray(q.carry1))
        fail('written-mul-render-data',{...ctx,a,b,op:q.op,carry:q.carry1});
      row.carryCounts[count]=(row.carryCounts[count]??0)+1;
      row.levelChecks++;
    }else{
      const quotientDigits=String(answer).length,dividendDigits=String(a).length;
      row.quotientDigits[quotientDigits]=(row.quotientDigits[quotientDigits]??0)+1;
      if(quotientDigits!==(d===2?3:2)||a>999||a%b!==0||q.audit.remainder!==0||String(q.quotient)!==String(answer)||!q.steps?.length||b>9)
        fail('written-division-level-or-steps',{...ctx,a,b,answer,quotientDigits,dividendDigits,printed:q.quotient,steps:q.steps?.slice(0,3)});
      if(q.audit.quotientDigits!==quotientDigits)fail('division-audit-length',{...ctx,a,b,answer,audit:q.audit});
      row.levelChecks++;
    }
    row.mathChecks++;
    row.verified++;
    row.answers.add(answer);row.models.add(a+':'+b);
   }
   row.uniqueAnswers=row.answers.size;row.uniqueModels=row.models.size;
   delete row.answers;delete row.models;
   if(row.verified!==N||row.mathChecks!==N||row.levelChecks!==N)fail('coverage',{raw,d,row});
   if(row.uniqueModels<20)fail('column-low-variability',{raw,d,models:row.uniqueModels});
   rows.push(row);
  }
  for(const raw of ids)for(let d=0;d<3;d++){
   try{
    startG3QuizStage('g3:'+raw,d);
    const session={kind:blockSession?.kind,key:blockSession?.key,d:blockSession?.stageIndex},
       dom=document.querySelector('#modal'),txt=clean(dom?.textContent),
       overlay=document.querySelector('#overlay'),
       active=!!overlay&&getComputedStyle(overlay).display!=='none';
    const state={id:'g3:'+raw,d,textChars:txt.length,session,active,hasTask:txt.length>60,inputs:dom?.querySelectorAll('input').length??0};
    ui.push(state);
    if(!active||!state.hasTask||session.kind!=='g3column'||session.d!==d)
      fail('g3-column-render',{raw,d,state});
   }catch(e){fail('g3-column-ui-exception',{raw,d,error:String(e)})}
  }
  for(const mode of ['add','sub','mul','div'])for(let d=0;d<3;d++){
   try{
    startColumnStage(mode,d);
    const m=generateColumnTask(),value=mode==='add'?m.a+m.b:mode==='sub'?m.a-m.b:mode==='mul'?m.a*m.b:m.a/m.b,
      modal=document.querySelector('#modal'),txt=clean(modal?.textContent),state={id:'g4-column:'+mode,d,rendered:txt.length>60,session:blockSession?.kind};
    ui.push(state);
    if(!state.rendered||blockSession?.kind!=='column'||m.ans!==value)fail('g4-column-regression',{mode,d,state,m});
   }catch(e){fail('g4-column-exception',{mode,d,error:String(e)})}
  }
  return {rows,ui,errors};
 });
 report.rows=r.rows;report.ui=r.ui;report.errors=r.errors;
 report.summary={generated:r.rows.reduce((s,x)=>s+x.verified,0),mathChecks:r.rows.reduce((s,x)=>s+x.mathChecks,0),levelChecks:r.rows.reduce((s,x)=>s+x.levelChecks,0),uniqueModelCounts:r.rows.map(x=>[x.id,x.d,x.uniqueModels]),ui:r.ui.length,errors:r.errors.length,jsErrors:pageErrors.length};
 console.log('WRITTEN FINAL',JSON.stringify(report.summary));
 console.log('WRITTEN LEVELS',JSON.stringify(report.rows.map(x=>({id:x.id,d:x.d,carry:x.carryCounts,borrows:x.borrowCounts,digits:x.quotientDigits,unique:x.uniqueModels}))));
 if(r.errors.length)console.log('WRITTEN FAILURES',JSON.stringify(r.errors.slice(0,20)));
 if(report.summary.generated!==7200||report.summary.mathChecks!==7200||report.summary.levelChecks!==7200||report.summary.ui!==24||r.errors.length||pageErrors.length)process.exitCode=1;
}catch(e){report.errors.push({fatal:String(e),stack:String(e.stack).slice(0,1400)});console.error('FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g3g4_stage17_final_written_test_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
