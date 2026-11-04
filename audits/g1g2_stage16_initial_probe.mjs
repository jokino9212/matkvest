import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

// Stage16 initial content audit: inventory every G1/G2 theme and every difficulty.
// Diagnostic probes do not change any application code or real user data.
const expected='f188d39a3a16fc54dfb32238fc34d3dfe6cc3c4416cd475579bf3ed65a7e1e36';
const raw=fs.readFileSync('index.html');
const sha=createHash('sha256').update(raw).digest('hex');
if(sha!==expected)throw Error('Unexpected frontend source SHA '+sha);
const bin=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!bin)throw Error('Chrome unavailable');
const browser=await puppeteer.launch({executablePath:bin,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const report={date:new Date().toISOString(),sha256:sha,grades:{},notes:[],pageErrors,errors:[],suspicious:[],summary:{}};
try{
  await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  for(const grade of [1,2]){
    const result=await page.evaluate(grade=>{
      const catalog=window['g'+grade+'AllTopics']();
      const make=window['makeG'+grade+'Question'];
      const start=window['startG'+grade+'QuizStage'];
      const rows=[],errors=[],suspicious=[],stageStarts=[];
      const canonical=q=>[
        String(q.text??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(),
        String(q.answer??q.answerRat??q.ans??''),
        JSON.stringify(q.visual?.data??null),
        JSON.stringify(q.choices?.map(c=>c.text??c.label??c.value??c.key)??null)
      ].join('|');
      const numeric=q=>{
        let text=String(q.text??'').replace(/<[^>]+>/g,' ').trim();
        const numbers=[...text.matchAll(/-?\d+(?:[.,]\d+)?/g)].map(m=>Math.abs(Number(m[0].replace(',','.')))).filter(Number.isFinite);
        return {max:numbers.length?Math.max(...numbers):0,numberCount:numbers.length};
      };
      const independentlyCheck=q=>{
        let s=String(q.text??'').replace(/<[^>]+>/g,' ').trim();
        let m=s.match(/^(?:Вычисли(?:те)?\s*:?\s*)?(-?\d+)\s*([+−\-×*÷:])\s*(-?\d+)\s*(?:=\s*\??|\?)?$/i);
        if(!m||q.choices?.length)return null;
        const a=+m[1],b=+m[3],op=m[2];
        let value=op==='+'?a+b:['-','−'].includes(op)?a-b:['×','*'].includes(op)?a*b:b===0?null:a/b;
        if(value===null||!Number.isFinite(value))return null;
        const answer=q.answer??q.ans;
        if(answer==null||!Number.isFinite(Number(String(answer).replace(',','.'))))return null;
        return {pass:Math.abs(value-Number(String(answer).replace(',','.')))<1e-9,expected:value,actual:answer,s};
      };
      for(const topic of catalog){
        const topicRow={id:topic.id,title:topic.title??topic.name??topic.label??null,levels:[]};
        for(let d=0;d<3;d++){
          const seen=new Set(),signatures=new Set(),nums=[],samples=[],types=new Set(),check={checked:0,passed:0,failed:[]};
          let empty=0,invalid=0;
          for(let k=0;k<40;k++){
            try{
              const q=make(topic.id,d);
              if(!q||typeof q!=='object'){invalid++;throw Error('Empty generator object')}
              if(!String(q.text??'').trim()){empty++;throw Error('Empty exercise text')}
              if(q.ans===undefined&&q.answer===undefined&&q.answerRat===undefined)throw Error('No answer key');
              seen.add(canonical(q));signatures.add(String(q.sig??JSON.stringify(q)));
              const n=numeric(q);nums.push(n.max);
              if(samples.length<5)samples.push({prompt:String(q.text).slice(0,350),answer:String(q.answer??q.answerRat??q.ans??''),signature:String(q.sig??'').slice(0,200)});
              types.add(q.audit?.variant??q.audit?.type??q.templateId??q.kind??'legacy');
              const independent=independentlyCheck(q);
              if(independent){check.checked++;if(independent.pass)check.passed++;else check.failed.push(independent);}
            }catch(e){errors.push({grade,topic:topic.id,level:d,run:k,error:String(e)});if(errors.length>50)break;}
          }
          let sorted=[...nums].sort((a,b)=>a-b);
          const row={level:d,samplesAttempted:40,uniqueContent:seen.size,uniqueSignatures:signatures.size,distinctVariants:types.size,medianMaxNumber:sorted.length?sorted[Math.floor(sorted.length/2)]:null,empty,invalid,mathIndependent:check,samples};
          topicRow.levels.push(row);
          if(seen.size<22)suspicious.push({grade,topic:topic.id,level:d,kind:'low-content-uniqueness',unique:seen.size,generated:40});
          if(check.failed.length)errors.push(...check.failed.map(e=>({grade,topic:topic.id,level:d,kind:'simple-arithmetic-answer-mismatch',...e})));
        }
        const l=topicRow.levels;
        if(l[2].medianMaxNumber!==null&&l[0].medianMaxNumber!==null&&l[2].medianMaxNumber<l[0].medianMaxNumber){
          suspicious.push({grade,topic:topic.id,kind:'numeric-complexity-regression',level0:l[0].medianMaxNumber,level2:l[2].medianMaxNumber});
        }
        rows.push(topicRow);
      }
      // A real UI launch is also attempted for each topic and level; record actual renderer.
      if(typeof start==='function'){
        for(const topic of catalog)for(let d=0;d<3;d++){
          try{
            start(topic.id,d);
            const stageText=document.querySelector('#qstage .quizq')?.textContent?.trim();
            stageStarts.push({id:topic.id,level:d,kind:blockSession?.kind??null,key:blockSession?.key??null,rendered:!!stageText,hasSkip:!!document.getElementById('quizSkip'),sample:String(stageText??'').slice(0,130)});
          }catch(e){errors.push({grade,topic:topic.id,level:d,kind:'stage-start',error:String(e)})}
        }
      }
      return {grade,topics:catalog.length,rows,stageStarts,errors,suspicious,startEntry:typeof start};
    },grade);
    report.grades[grade]=result;
    report.errors.push(...result.errors);
    report.suspicious.push(...result.suspicious);
    console.log('GRADE',grade,'topics',result.topics,'stageStarts',result.stageStarts.length,'generationErrors',result.errors.length,'suspicious',result.suspicious.length);
  }
  report.summary={
    topicCount:Object.values(report.grades).reduce((a,g)=>a+g.topics,0),
    generated:Object.values(report.grades).reduce((a,g)=>a+g.rows.reduce((b,t)=>b+t.levels.reduce((c,l)=>c+l.samplesAttempted,0),0),0),
    starts:Object.values(report.grades).reduce((a,g)=>a+g.stageStarts.length,0),
    rendered:Object.values(report.grades).reduce((a,g)=>a+g.stageStarts.filter(s=>s.rendered).length,0),
    errors:report.errors.length,
    suspicious:report.suspicious.length,
    pageErrors:pageErrors.length,
    independentlyVerified:Object.values(report.grades).reduce((a,g)=>a+g.rows.reduce((b,t)=>b+t.levels.reduce((c,l)=>c+l.mathIndependent.checked,0),0),0)
  };
  console.log('STAGE16 INITIAL DIAGNOSTIC',JSON.stringify(report.summary));
  console.log('STAGE16 suspicious',JSON.stringify(report.suspicious.slice(0,30)));
  console.log('STAGE16 errors',JSON.stringify(report.errors.slice(0,15)));
  // Only hard technical failures block CI. Diversity/complexity are audit observations to classify.
  if(report.errors.length||pageErrors.length)process.exitCode=1;
}catch(e){
 report.errors.push({fatal:String(e),stack:String(e.stack).slice(0,2000)});
 console.error('STAGE16 FATAL',e);
 process.exitCode=1;
}finally{
  fs.writeFileSync('audits/g1g2_stage16_initial_report.json',JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
