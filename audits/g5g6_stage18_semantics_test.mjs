import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const rawHtml=fs.readFileSync('index.html');
const hash=createHash('sha256').update(rawHtml).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v52')||!sw.includes(hash))throw Error('New PWA v52 hash does not match HTML');
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const outcome=await page.evaluate(()=>{
   const stats={checks:[],details:[],unhandled:[]};
   function check(name,value,extra=null){stats.checks.push({name,pass:!!value,extra});}
   function evalForm(q,form){
     const prev=globalThis.qid;
     globalThis.qid='g5:'+q.sourceTopicId;
     const v=quizInputEvaluation(q,{stage18Fraction:true,whole:form[0],numerator:form[1],denominator:form[2]});
     globalThis.qid=prev;
     return v;
   }
   function gen(topic,stage,attempts=140){
     blockSession={kind:'g5quiz',stageIndex:stage,topicId:topic,done:0,total:10,finished:false,usedSignatures:[]};
     const arr=[];for(let i=0;i<attempts;i++)arr.push(makeG5Question(topic));
     return arr;
   }
   function partsFor(rat){
     const abs=Math.abs(rat.n),d=rat.d,w=Math.floor(abs/d),n=abs%d;
     return [String(rat.n<0?-w:w),String(n),String(d)];
   }
   // Reading words must preserve exact numerator/denominator, not reduce blindly.
   const reading=gen('frac_read',0,240).filter(q=>q.stage18AnswerForm?.kind==='exact');
   check('All word-to-fraction questions expose exact requested format',reading.length===240,reading.length);
   check('Word fractions display same written form as expected',reading.every(q=>q.correctText===String(q.stage18AnswerForm.n)+'/'+String(q.stage18AnswerForm.d)));
   const notReduced=reading.find(q=>q.stage18AnswerForm.n>1&&q.stage18AnswerForm.n%2===0&&q.stage18AnswerForm.d%2===0) || reading.find(q=>q.stage18AnswerForm.n===q.stage18AnswerForm.d);
   check('Sample available for reducible named fractions',!!notReduced);
   if(notReduced){
     const f=notReduced.stage18AnswerForm;
     const exact=evalForm(notReduced,['',String(f.n),String(f.d)]);
     const reduced=rational(f.n,f.d);
     const alt=evalForm(notReduced,['',String(reduced.n),String(reduced.d)]);
     check('Exact named fraction accepted',exact.valid&&exact.ok,{answer:notReduced.correctText});
     if(reduced.n!==f.n||reduced.d!==f.d)check('Reducing named fraction is rejected when exact form requested',alt.valid&&!alt.ok,{named:notReduced.correctText,reduced:String(reduced.n)+'/'+String(reduced.d)});
   }
   const mixToFrac=gen('mixed_to_frac',0).filter(q=>q.stage18AnswerForm?.kind==='exact');
   check('Mixed to improper has numerator/denominator boxes',mixToFrac.length>30,mixToFrac.length);
   if(mixToFrac.length){
     const q=mixToFrac[0],f=q.stage18AnswerForm;
     check('Exact conversion preserves original denominator',evalForm(q,['',String(f.n),String(f.d)]).ok,{answer:q.correctText});
     check('A mixed input is not accepted where improper fraction required',!evalForm(q,['1',String(Math.abs(q.answerRat.n)%q.answerRat.d),String(q.answerRat.d)]).ok);
   }
   const fromImproper=gen('frac_to_mixed',0);
   check('Improper to mixed no longer multiple choice',fromImproper.every(q=>q.answerMode==='fraction'&&q.stage18AnswerForm?.kind==='mixed'));
   const improperQ=fromImproper.find(q=>q.answerRat.d!==1&&q.answerRat.n>q.answerRat.d);
   if(improperQ){
     const p=partsFor(improperQ.answerRat);
     check('Mixed answer cells accepted',evalForm(improperQ,p).ok,{answer:improperQ.correctText,parts:p});
     check('Improper fraction rejected when mixed required',!evalForm(improperQ,['',String(improperQ.answerRat.n),String(improperQ.answerRat.d)]).ok);
   }else check('Mixed question sample generated',false);
   for(const topic of ['mixed_add','mixed_sub']){
     const list=gen(topic,0,120);
     check(topic+' uses cells including integer results',list.every(q=>q.answerMode==='fraction'&&q.stage18AnswerForm?.kind==='mixed'),{fraction:list.filter(q=>q.answerMode==='fraction').length});
     const m=list.find(q=>q.answerRat?.d>1);
     if(m)check(topic+' mixed result accepted',evalForm(m,partsFor(m.answerRat)).ok,{answer:m.correctText});
   }
   const ray=gen('frac_ray',1,160).filter(q=>q.stage18AnswerForm?.kind==='exact');
   check('Fraction-ray improper notation must retain original division denominator',ray.length===160,ray.length);
   if(ray.length)check('Fraction-ray specified denominator answer accepted',evalForm(ray[0],['',String(ray[0].stage18AnswerForm.n),String(ray[0].stage18AnswerForm.d)]).ok,ray[0].correctText);
   // New powers are not limited to 6 near-identical prompts.
   for(const diff of [0,1]){
     const q=gen('powers',diff,240);
     const normalized=new Set(q.map(x=>x.text.replace(/\d+/g,'#')));
     const unique=new Set(q.map(x=>x.text));
     check('Powers grade5 stage '+diff+' at least five structural formats',normalized.size>=5,{count:normalized.size,prompts:[...normalized]});
     check('Powers grade5 stage '+diff+' has >=35 distinct visible exercises',unique.size>=35,{count:unique.size});
     check('Powers stage '+diff+' has unique answer choices with matching correct answer',q.every(x=>x.choices?.some(y=>String(y.key)===String(x.ans))&&new Set(x.choices.map(y=>String(y.key))).size===x.choices.length));
     check('Powers stage '+diff+' question has distinct signature',q.every(x=>String(x.sig).includes('s18b:')));
   }
   const advanced=gen('powers',2,15);
   check('Powers Master stage keeps existing generator',advanced.every(x=>!String(x.sig).includes('s18b:')));
   const untouched6=gen('frac_read',1,6);
   check('Fraction reading-to-words remains multiple choice',untouched6.every(x=>x.answerMode!=='fraction'));
   // Grade6 and higher remain untouched in generator architecture.
   check('G6 generator still callable',typeof makeG6Question==='function');
   check('G7 fraction input check remains unchanged',(()=>{globalThis.qid='g7:rational_numbers_forms';return !stage18UsesFractionBoxes({answerMode:'fraction'})})());
   return stats;
 });
 const fails=outcome.checks.filter(x=>!x.pass);
 const report={hash,checkedAt:new Date().toISOString(),passed:outcome.checks.length-fails.length,total:outcome.checks.length,failed:fails,details:outcome.details,errors};
 fs.writeFileSync('audits/g5g6_stage18_semantics_test_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({hash,passed:report.passed,total:report.total,failed:fails,errors},null,2));
 if(fails.length||errors.length)process.exitCode=1;
}finally{await browser.close()}
