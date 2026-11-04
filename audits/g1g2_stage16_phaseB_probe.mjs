import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

// Stage 16, phase B: inspect real G1/G2 exercises, not just numeric size.
// This script is read-only for the application and never touches user data.
const expected='2252fe792fbef2ba6b1a4d0794ae674164f55f3260496af1156660b986b5ae16';
const html=fs.readFileSync('index.html');
const sha=createHash('sha256').update(html).digest('hex');
if(sha!==expected)throw Error('Refuse to audit unknown frontend build: '+sha);
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('const APP_BUILD_HASH = "'+sha+'"'))throw Error('SW/HTML SHA mismatch');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Chrome/Chromium unavailable');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const report={stage:'16B',createdAt:new Date().toISOString(),sha256:sha,method:'semantic templates and actual generator output; numeric maxima diagnostic only',grades:{},flags:[],errors:[],pageErrors};
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 for(const grade of [1,2]){
   const result=await page.evaluate(grade=>{
     const topics=window['g'+grade+'AllTopics']();
     const generate=window['makeG'+grade+'Question'];
     const start=window['startG'+grade+'QuizStage'];
     const target=new Set(['g2:operations_100','g2:word_problems','g2:geometric_quantities']);
     const rows=[],failures=[],starts=[];
     const normalize=s=>String(s??'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
     const template=s=>normalize(s).replace(/\d+(?:[.,]\d+)?/g,'#').replace(/[А-ЯЁ]{2,}/g,'WORD').slice(0,440);
     const numeric=s=>[...normalize(s).matchAll(/-?\d+(?:[.,]\d+)?/g)].map(x=>Math.abs(Number(x[0].replace(',','.')))).filter(Number.isFinite);
     const score=s=>{
       const z=normalize(s);
       return {
         arithmeticOps:(z.match(/(?:\d|\))\s*[+\-−×*·÷:]\s*(?:\d|\()/g)||[]).length,
         parentheses:(z.match(/[()]/g)||[]).length,
         units:(z.match(/(?:см|дм|м|кг|г|л|мин|ч|руб|км)\b/gi)||[]).length,
         hasComparison:/на сколько|во сколько|больше|меньше|разност|сравн/iu.test(z),
         hasTwoStepLanguage:/сначала|потом|затем|после этого|всего|осталось/iu.test(z)
       };
     };
     for(const topic of topics){
       const selected=target.has(topic.id),count=selected?180:75;
       const row={id:topic.id,title:topic.title??topic.name??topic.label??null,selected,levels:[]};
       for(let d=0;d<3;d++){
         const fingerprints=new Set(),tpl=new Map(),sig=new Map(),variant=new Map(),numbers=[],features=[],samples=[];
         let missing=0,simpleMathChecked=0,simpleMathFailed=0;
         for(let k=0;k<count;k++){
           try{
             const q=generate(topic.id,d);
             if(!q||typeof q!=='object'||!normalize(q.text)){missing++;throw Error('Empty question');}
             if(!('answer' in q)&&!('ans' in q)&&!('answerRat' in q))throw Error('No answer');
             const s=normalize(q.text),ex=normalize(q.ex),answer=String(q.answer??q.answerRat??q.ans??'');
             const key=template(s);
             const signature=String(q.sig??q.templateId??q.kind??'none');
             const variantId=String(q.audit?.variant??q.audit?.type??q.templateId??q.kind??'unknown');
             const fp=s+'|'+answer+'|'+JSON.stringify(q.visual?.data??null)+'|'+JSON.stringify(q.choices?.map(x=>x.text??x.label??x.value??x.key)??null);
             fingerprints.add(fp);
             tpl.set(key,(tpl.get(key)||0)+1);
             sig.set(signature,(sig.get(signature)||0)+1);
             variant.set(variantId,(variant.get(variantId)||0)+1);
             const nums=numeric(s);numbers.push(nums.length?Math.max(...nums):0);
             const f=score(s+' '+ex);features.push(f);
             if(selected&&samples.length<22&&!samples.some(x=>x.template===key)){
               samples.push({template:key,prompt:s.slice(0,450),answer:answer.slice(0,180),explanation:ex.slice(0,480),signature:signature.slice(0,200),variant:variantId,audit:q.audit??null,visual:q.visual?{type:q.visual.type??null,data:JSON.stringify(q.visual.data??null).slice(0,420)}:null,choices:q.choices?.slice(0,5)??null});
             }
             const m=s.match(/^(?:Вычисли(?:те)?\s*:?\s*)?(-?\d+)\s*([+−\-×*÷:])\s*(-?\d+)\s*(?:=\s*\??|\?)?$/i);
             if(m&&!q.choices?.length&&Number.isFinite(Number(answer.replace(',','.')))){
               const a=+m[1],b=+m[3],op=m[2];
               const v=op==='+'?a+b:['-','−'].includes(op)?a-b:['×','*'].includes(op)?a*b:b===0?NaN:a/b;
               if(Number.isFinite(v)){simpleMathChecked++;if(Math.abs(v-Number(answer.replace(',','.')))>1e-9){simpleMathFailed++;failures.push({topic:topic.id,difficulty:d,kind:'wrong-answer',prompt:s,expected:v,actual:answer});}}
             }
           }catch(e){failures.push({topic:topic.id,difficulty:d,iteration:k,error:String(e)});if(failures.length>50)break;}
         }
         numbers.sort((a,b)=>a-b);
         const av=k=>features.length?Number((features.reduce((s,f)=>s+Number(f[k]||0),0)/features.length).toFixed(3)):null;
         row.levels.push({difficulty:d,generated:count,uniqueQuestions:fingerprints.size,uniqueTemplates:tpl.size,uniqueSignatures:sig.size,uniqueVariants:variant.size,medianLargestNumber:numbers[Math.floor(numbers.length/2)]??null,p90LargestNumber:numbers[Math.floor(numbers.length*.9)]??null,meanArithmeticOps:av('arithmeticOps'),meanParentheses:av('parentheses'),meanUnits:av('units'),comparisonShare:av('hasComparison'),twoStepLanguageShare:av('hasTwoStepLanguage'),emptyQuestions:missing,arithmeticVerified:simpleMathChecked,arithmeticWrong:simpleMathFailed,topTemplates:[...tpl].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([name,n])=>({template:name,count:n})),topSignatures:[...sig].sort((a,b)=>b[1]-a[1]).slice(0,8),variants:[...variant],samples});
       }
       if(selected&&typeof start==='function')for(let d=0;d<3;d++){
         try{
           start(topic.id,d);
           starts.push({id:topic.id,difficulty:d,rendered:!!document.querySelector('#qstage .quizq')?.textContent?.trim(),stageKind:typeof blockSession==='undefined'?null:blockSession?.kind??null});
         }catch(e){failures.push({topic:topic.id,difficulty:d,kind:'ui-start',error:String(e)});}
       }
       rows.push(row);
     }
     return {grade,topicCount:topics.length,rows,starts,failures};
   },grade);
   report.grades[grade]=result;
   report.errors.push(...result.failures);
   console.log('GRADE',grade,'topics',result.topicCount,'samples',result.rows.reduce((s,r)=>s+r.levels.reduce((q,l)=>q+l.generated,0),0),'failures',result.failures.length);
   for(const t of result.rows){
     const [a,b,c]=t.levels;
     if(t.selected){
       const observation={topic:t.id,levels:t.levels.map(l=>({difficulty:l.difficulty,uniqueQuestions:l.uniqueQuestions,uniqueTemplates:l.uniqueTemplates,medianLargestNumber:l.medianLargestNumber,meanArithmeticOps:l.meanArithmeticOps,comparisonShare:l.comparisonShare,twoStepLanguageShare:l.twoStepLanguageShare}))};
       if(c.medianLargestNumber<a.medianLargestNumber)observation.kind='numeric-drop-only-needs-review';
       else observation.kind='pedagogical-review';
       report.flags.push(observation);
       console.log('TARGET',JSON.stringify(observation));
       for(const level of t.levels)console.log('REPRESENTATIVE',t.id,level.difficulty,JSON.stringify(level.samples.slice(0,5).map(x=>({prompt:x.prompt,answer:x.answer,explanation:x.explanation,variant:x.variant,signature:x.signature}))));
     }
   }
 }
 report.summary={topics:Object.values(report.grades).reduce((s,g)=>s+g.topicCount,0),generated:Object.values(report.grades).reduce((s,g)=>s+g.rows.reduce((p,r)=>p+r.levels.reduce((n,l)=>n+l.generated,0),0),0),selectedLevels:Object.values(report.grades).reduce((s,g)=>s+g.starts.length,0),rendered:Object.values(report.grades).reduce((s,g)=>s+g.starts.filter(x=>x.rendered).length,0),mathChecked:Object.values(report.grades).reduce((s,g)=>s+g.rows.reduce((p,r)=>p+r.levels.reduce((n,l)=>n+l.arithmeticVerified,0),0),0),failures:report.errors.length,pageErrors:pageErrors.length};
 console.log('STAGE16 B SUMMARY',JSON.stringify(report.summary));
 if(report.errors.length||pageErrors.length||report.summary.rendered!==report.summary.selectedLevels)process.exitCode=1;
}catch(e){report.errors.push({fatal:String(e),stack:String(e.stack).slice(0,3000)});console.error('STAGE16 B FATAL',e);process.exitCode=1;}
finally{
 fs.writeFileSync('audits/g1g2_stage16_phaseB_report.json',JSON.stringify(report,null,2)+'\n');
 await browser.close();
}
