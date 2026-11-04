import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(!fs.readFileSync('sw.js','utf8').includes('const APP_BUILD_HASH = "'+sha+'"'))throw Error('HTML SW mismatch');
if(!fs.readFileSync('index.html','utf8').includes('g2StoryTimes(model.groups)'))throw Error('Missing targeted grammar patch');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const report={phase:'16D-multiplication-regression',sha256:sha,checkedAt:new Date().toISOString(),cases:[],failures:[],pageErrors};
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const res=await page.evaluate(()=>{
  const cases=[],failures=[];
  const plain=s=>String(s??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const expectedTimes=n=>n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'раза':'раз';
  let total=0,mathChecked=0,counts={raz:0,raza:0,badTimes:0},answerChoices=0,visualChecked=0;
  for(const grade of [1,2]){
   const all=window['g'+grade+'AllTopics'](),make=window['makeG'+grade+'Question'];
   for(const t of all){
    const levels=[];
    for(let d=0;d<3;d++){
     const samples=t.id==='g2:multiply_divide'?1800:t.id.endsWith(':word_problems')?450:85;
     let times=0,models=0;
     for(let i=0;i<samples;i++){
      total++;
      let q;
      try{q=make(t.id,d)}catch(e){if(failures.length<70)failures.push({kind:'generation',id:t.id,d,error:String(e)});continue;}
      const txt=plain(q?.text),ex=plain(q?.ex),both=txt+' '+ex;
      if(!txt){if(failures.length<70)failures.push({kind:'empty',id:t.id,d});continue;}
      for(const match of both.matchAll(/(\d+)\s+(раза|раз)(?=[\s.,!?;:]|$)/giu)){
       const n=+match[1],actual=match[2].toLowerCase(),expected=expectedTimes(n);
       times++;
       if(actual!==expected){counts.badTimes++;if(failures.length<70)failures.push({kind:'wrong-times',id:t.id,d,n,actual,expected,text:txt,ex});}
       else if(actual==='раза')counts.raza++;else counts.raz++;
      }
      const m=q.audit?.model;
      if(m&&t.id==='g2:multiply_divide'&&'groups' in m&&'each' in m&&'total' in m){
       models++;mathChecked++;
       if(m.groups*m.each!==m.total&&failures.length<70)failures.push({kind:'multiplication-model',id:t.id,d,model:m});
      }
      if(q.choices?.length){
       answerChoices++;
       const a=q.answer??q.ans??q.answerRat, keys=q.choices.map(c=>String(c.key??c.value??c.label));
       if(keys.filter(x=>x===String(a)).length!==1&&failures.length<70)failures.push({kind:'wrong-choice-answer',id:t.id,d,a,keys});
      }
      if(q.visual&&typeof q.visual==='object'){
       visualChecked++;
       if(q.visual?.data?.showDerived===true||q.visual?.data?.showPerimeter===true){
        if(failures.length<70)failures.push({kind:'answer-leak',id:t.id,d});
       }
      }
     }
     levels.push({level:d,generated:samples,times,models});
    }
    cases.push({id:t.id,grade,levels});
   }
  }
  return {cases,failures,total,mathChecked,counts,answerChoices,visualChecked};
 });
 report.cases=res.cases;report.failures=res.failures;report.summary={topics:res.cases.length,generated:res.total,multiplyModelsIndependent:res.mathChecked,counts:res.counts,answerChoices:res.answerChoices,visualObjects:res.visualChecked,defects:res.failures.length,pageErrors:pageErrors.length};
 console.log('STAGE16D MULTIPLY REGRESSION',JSON.stringify(report.summary));
 console.log('DEFECTS',JSON.stringify(res.failures.slice(0,15)));
 if(res.failures.length||res.counts.badTimes||res.counts.raz<20||res.counts.raza<20||pageErrors.length)process.exitCode=1;
}catch(e){report.failures.push({fatal:String(e),stack:String(e.stack).slice(0,1800)});console.error(e);process.exitCode=1}
finally{fs.writeFileSync('audits/g1g2_stage16_phaseD_multiply_regression_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}