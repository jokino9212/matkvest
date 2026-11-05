import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const sourceHash=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v53')||!sw.includes(sourceHash))throw Error('PWA/hash mismatch stage18C');
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),jsErrors=[];
page.on('pageerror',e=>jsErrors.push(String(e)));
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const result=await page.evaluate(()=>{
   const tests=[];
   const check=(name,pass,detail)=>tests.push({name,pass:!!pass,detail:detail??null});
   function normalized(t){return String(t||'').replace(/\d+/g,'#').replace(/\s+/g,' ').trim()}
   function g5(stage,n=250){
     blockSession={kind:'g5quiz',stageIndex:stage,topicId:'frac_types',done:0,finished:false,total:10};
     return Array.from({length:n},()=>makeG5Question('frac_types'));
   }
   function g6(topic,stage,n=250){
     blockSession={kind:'g6quiz',stageIndex:stage,topicId:'g6:'+topic,done:0,finished:false,total:12};
     return Array.from({length:n},()=>makeG6Question('g6:'+topic,stage));
   }
   for(const stage of [1,2]){
     const all=g5(stage);
     check('Grade5 fraction types stage '+stage+' 5+ structural formats',
       new Set(all.map(q=>normalized(q.text))).size>=5,
       {uniqueNormalized:new Set(all.map(q=>normalized(q.text))).size});
     check('Grade5 fraction types stage '+stage+' >40 distinct visible questions',
       new Set(all.map(q=>q.text)).size>=40,
       {uniqueVisible:new Set(all.map(q=>q.text)).size});
     check('Grade5 fraction types stage '+stage+' valid unique choices/answers',
       all.every(q=>q.answerMode==='choice'&&q.choices.length>=3&&q.choices.some(c=>String(c.key)===String(q.ans))&&new Set(q.choices.map(c=>String(c.key))).size===q.choices.length));
     check('Grade5 fraction types stage '+stage+' use audited variant signatures',
       all.every(q=>q.audit?.type==='s18cFractionTypes'&&String(q.sig).startsWith('g5:frac_types:s18c:')));
     // Independent verification of the actual math for all generated classification tasks.
     let correct=0;
     for(const q of all){
       const v=q.audit.variant, p=q.audit.seedParts, k=String(q.ans);
       let expected;
       if(stage===1)expected=v===0?'p':v===1?'imp':v===2?'eq':v===3?String(p[0]-1):String(p[0]-p[1]);
       else if(v===0){let count=0;for(let i=0;i<8;i+=2)if(p[i]<p[i+1])count++;expected=String(count)}
       else if(v===1){let count=0;for(let i=0;i<8;i+=2)if(p[i]>=p[i+1])count++;expected=String(count)}
       else if(v===2)expected=String(p[0]-p[1]);
       else if(v===3)expected=String(p[0]-1);
       else if(v===4)expected='both';
       else expected=String(p[1]);
       if(expected===k)correct++;
     }
     check('Grade5 stage '+stage+' independent answer calculations',correct===all.length,{verified:correct,total:all.length});
   }
   const stage0=g5(0,60);
   check('Grade5 basic fraction type questions still present',stage0.every(q=>!String(q.sig).includes('s18c:')));
   for(const stage of [0,1]){
     const all=g6('circle_area',stage,300);
     const adapted=all.filter(q=>q.audit?.type==='s18cCircleArea');
     check('Grade6 circle area stage '+stage+' new contexts appear',adapted.length>=120,{new:adapted.length,total:all.length});
     check('Grade6 circle area stage '+stage+' at least 4 variants',new Set(adapted.map(q=>q.audit.variant)).size>=4,{variants:[...new Set(adapted.map(q=>q.audit.variant))]});
     check('Grade6 circle area stage '+stage+' >35 visible exercises',new Set(all.map(q=>q.text)).size>=35,{unique:new Set(all.map(q=>q.text)).size});
     let checked=0,valid=0;
     for(const q of adapted){
       const r=q.audit.radius,v=q.audit.variant;
       const a=rational(314*r*r*(v==='two_discs'?2:1),100*(v==='half'?2:v==='quarter'?4:1));
       const agrees=rationalEq(a,q.answerRat);
       const parsed=parseExactNumberInput(q.ans);
       if(agrees&&parsed.ok&&rationalEq(parsed.rat,a))valid++;
       checked++;
     }
     check('Grade6 circle area stage '+stage+' independent exact arithmetic',valid===checked,{verified:valid,total:checked});
   }
   const complex=g6('circle_area',2,55);
   check('Grade6 Master circle area still uses prior generator',complex.every(q=>q.audit?.type!=='s18cCircleArea'));
   const ratio=[...g6('ratio_value',0,150),...g6('ratio_value',1,150),...g6('ratio_value',2,150)];
   check('Grade6 ratio value grammar no longer has wrong inflection',
     ratio.every(q=>!/В одной коробке \d+ одинаковых деталей/.test(q.text)),
     {examples:ratio.filter(q=>q.text.startsWith('В одной коробке')).slice(0,5).map(q=>q.text)});
   check('All ratio value questions have response',ratio.every(q=>q.answerMode&&q.answerRat&&q.answerRat.d>0));
   check('Grade 6 number-line diagrams unaffected',g6('number_line',1,20).every(q=>q.text&&q.ans!==undefined));
   return tests;
 });
 const failed=result.filter(t=>!t.pass);
 const report={htmlSha:sourceHash,checkedAt:new Date().toISOString(),total:result.length,passed:result.length-failed.length,failed,tests:result,jsErrors};
 fs.writeFileSync('audits/g5g6_stage18_variety_test_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({total:report.total,passed:report.passed,failed,jsErrors},null,2));
 if(failed.length||jsErrors.length)process.exitCode=1;
}finally{await browser.close()}
