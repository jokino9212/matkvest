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
   const book=G2_STORY_ITEMS.find(o=>o.one==='книга');
   check('Book nominative for original count stays unchanged',()=>{
     const expected={1:'книга',2:'книги',5:'книг',11:'книг',21:'книга'};
     for(const [n,v] of Object.entries(expected)){if(g2StoryNoun(+n,book)!==v)throw Error(n+' unexpected nominative '+g2StoryNoun(+n,book));}return expected;
   });
   check('Accusative changes only when singular book follows verb',()=>{
     const expected={1:'книгу',2:'книги',5:'книг',11:'книг',21:'книгу',31:'книгу',101:'книгу'};
     for(const [n,v] of Object.entries(expected)){if(g2StoryAccNoun(+n,book)!==v)throw Error(n+' -> '+g2StoryAccNoun(+n,book));}
     for(const other of G2_STORY_ITEMS.filter(o=>o.one!=='книга'))for(const n of [1,2,5,11,21])
       if(g2StoryAccNoun(n,other)!==g2StoryNoun(n,other))throw Error('Another noun changed: '+other.one+n);
     return expected;
   });
   check('Two-to-six repetitions use correct «раза/раз» in explanation',()=>{
      for(const n of [1,2,3,4,5,6,11,12,21,22]){
        const word=g2StoryTimes(n),expected=[2,3,4,22].includes(n)?'раза':'раз';
        if(word!==expected)throw Error(n+' repetitions should be '+expected+', got '+word);
        const explanation=g2StoryOneExplanation({kind:'mul',each:3,groups:n,total:3*n});
        if(!explanation.includes(n+' '+expected+':'))throw Error('Wrong number of times '+explanation);
      }return true;
   });
   check('First-grade noun inflection unaffected',()=>{
      if(g1Noun(1,book)!=='книга'||g1Noun(21,book)!=='книга')throw Error('g1Noun unexpectedly changed');
      return true;
   });
   check('Single-step G2 addition and subtraction have proper cases',()=>{
      for(const kind of ['add','sub'])for(const n of [1,2,11,21]){
       const model={kind,obj:book,a:25,b:n,result:kind==='add'?25+n:25-n};
       const s=g2StoryOneText(model);
       if(!s.includes(n+' '+g2StoryAccNoun(n,book)))throw Error('Missing correct form '+kind+' '+n+' '+s);
       if(!s.includes('25 '+g2StoryNoun(25,book)))throw Error('Damaged nominative '+s);
      }return true;
   });
   check('All G2 word-problem levels generated safely 500x',()=>{
      let tested=0, accusatives=0;
      for(let d=0;d<3;d++)for(let i=0;i<500;i++){
       const q=makeG2Question('g2:word_problems',d);
       if(!q||!q.text||(!('ans' in q)&&!('answer' in q)&&!('answerRat' in q)))throw Error('Invalid question '+d);
       const p=String(q.text).replace(/<[^>]+>/g,' ');
       if(/(?:Поставили|поставили|Сняли|сняли)\s+(?:ещё\s+)?(?:1|21|31|41|51|61|71|81|91)\s+книга\b/.test(p))throw Error('Uninflected book accusative '+p);
       if(/(?:Поставили|поставили|Сняли|сняли)\s+(?:ещё\s+)?(?:1|21|31|41|51|61|71|81|91)\s+книгу\b/.test(p))accusatives++;
       tested++;
      }return {tested,accusatives};
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
