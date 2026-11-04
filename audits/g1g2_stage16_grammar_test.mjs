import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const sha=x=>createHash('sha256').update(x).digest('hex');
const html=fs.readFileSync('index.html'),sw=fs.readFileSync('sw.js','utf8'),hash=sha(html);
if(!sw.includes('const APP_BUILD_HASH = "'+hash+'"'))throw Error('SW hash differs from patched HTML');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const report={testedAt:new Date().toISOString(),sha256:hash,checks:[],failures:[],pageErrors};
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const result=await page.evaluate(()=>{
   const checks=[],failures=[];
   function check(name,fn){try{const info=fn();checks.push({name,pass:true,info});}catch(e){checks.push({name,pass:false});failures.push({name,error:String(e)});}}
   check('All G2 word-problem levels: no wrong book case or wrong «5 раза»',()=>{
     let tested=0,correctAccusative=0,correctTimes=0,validOriginalCounts=0,mathChecked=0;
     for(let d=0;d<3;d++)for(let i=0;i<850;i++){
       const q=makeG2Question('g2:word_problems',d);
       if(!q?.text||(!('ans' in q)&&!('answer' in q)&&!('answerRat' in q)))throw Error('Invalid G2 question at difficulty '+d);
       const text=String(q.text).replace(/<[^>]+>/g,' '),ex=String(q.ex??'');
       if(/(?:Поставили|поставили|Сняли|сняли)\s+(?:ещё\s+)?(?:1|21|31|41|51|61|71|81|91)\s+книга(?=[\s.,!?]|$)/.test(text))throw Error('Wrong accusative: '+text);
       if(/(?:Поставили|поставили|Сняли|сняли)\s+(?:ещё\s+)?(?:1|21|31|41|51|61|71|81|91)\s+книгу(?=[\s.,!?]|$)/.test(text))correctAccusative++;
       if(/(?:^|\s)(?:5|6) раза(?=[\s.,!?]|$)/.test(ex))throw Error('Wrong «5 раза» / «6 раза»: '+ex);
       if(/(?:^|\s)(?:5|6) раз(?=[\s.,!?]|$)/.test(ex))correctTimes++;
       if(/было (?:1|21|31|41|51|61|71|81|91) книга(?=[\s.,!?]|$)/.test(text))validOriginalCounts++;
       const m=ex.match(/(\d+) повторяется (\d+) (раза|раз): (\d+)\s*[·×*]\s*(\d+)\s*=\s*(\d+)/);
       if(m){
         const [,each,groups,word,a,b,result]=m;
         if(Number(each)!==Number(a)||Number(groups)!==Number(b)||Number(a)*Number(b)!==Number(result))throw Error('Multiplication explanation disagrees with math '+ex);
         if(word!==(Number(groups)%10>=2&&Number(groups)%10<=4&&(Number(groups)%100<12||Number(groups)%100>14)?'раза':'раз'))throw Error('Wrong repetition noun '+ex);
         mathChecked++;
       }
       tested++;
     }
     if(correctAccusative<5)throw Error('Test did not exercise enough book accusative cases: '+correctAccusative);
     if(correctTimes<5)throw Error('Test did not exercise enough five/six repetitions: '+correctTimes);
     return {tested,correctAccusative,correctTimes,validOriginalCounts,mathChecked};
   });
   check('Crossgrade generation smoke unaffected',()=>{
     const byGrade={},grades=[1,2,3,5,6,8];
     for(const grade of grades){
       let n=0;
       for(const topic of window['g'+grade+'AllTopics']()){
         if(topic.rendererType==='column')continue;
         for(let d=0;d<3;d++)for(let sample=0;sample<3;sample++){
           const q=window['makeG'+grade+'Question'](topic.id,d);
           if(!q?.text||!('ans' in q)&&!('answer' in q)&&!('answerRat' in q))throw Error('Bad grade '+grade+' '+topic.id+' '+d);
           n++;
         }
       }byGrade[grade]=n;
     }return byGrade;
   });
   return {checks,failures};
 });
 report.checks=result.checks;report.failures=result.failures;
 const summary={passed:report.checks.filter(c=>c.pass).length,failed:report.failures.length,pageErrors:pageErrors.length,sha256:hash};
 console.log('STAGE16 GRAMMAR TEST SUMMARY',JSON.stringify(summary));
 if(result.failures.length)console.error('GRAMMAR FAILURES',JSON.stringify(result.failures));
 if(report.failures.length||pageErrors.length)process.exitCode=1;
}catch(e){report.failures.push({fatal:String(e)});process.exitCode=1;console.error(e);}
finally{fs.writeFileSync('audits/g1g2_stage16_grammar_report.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
