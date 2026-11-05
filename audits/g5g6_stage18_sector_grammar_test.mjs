import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const hash=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(!fs.readFileSync('sw.js','utf8').includes('matkvest-iphone-v55')||!fs.readFileSync('sw.js','utf8').includes(hash))throw Error('v55 SW mismatch');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const audit=await page.evaluate(()=>{
   const names={otherProblems:[],sector:[],nByType:{},correct:0,total:0};
   for(let stage=0;stage<3;stage++){
     blockSession={kind:'g5quiz',topicId:'charts',stageIndex:stage,done:0,finished:false,total:10,usedSignatures:[]};
     for(let i=0;i<260;i++){
       const q=makeG5Question('charts');
       if(!q||!q.text||!q.choices?.some(c=>String(c.key)===String(q.ans)))throw Error('Grade5 charts: invalid answer');
       names.total++;
       const div=document.createElement('div');div.innerHTML=q.text;const plain=div.textContent.trim();
       if(/разделили\s+на\s+\d+\s+равных\s+сектор/i.test(plain)){
         const m=plain.match(/разделили\s+на\s+(\d+)\s+(равных секторов|равных сектора|равный сектор)/i);
         if(!m){names.otherProblems.push({stage,plain});continue}
         const n=Number(m[1]),t=n%10,h=n%100,expected=h>=11&&h<=14?'равных секторов':t===1?'равный сектор':t>=2&&t<=4?'равных сектора':'равных секторов';
         if(m[2]!==expected)names.otherProblems.push({stage,n,actual:m[2],expected,plain});
         else names.correct++;
         names.sector.push({stage,n,form:m[2]});
         names.nByType[m[2]]=(names.nByType[m[2]]||0)+1;
       }
     }
   }
   return names;
 });
 const report={sha:hash,checkedAt:new Date().toISOString(),sectorCases:audit.sector.length,correct:audit.correct,failures:audit.otherProblems,forms:audit.nByType,generated:audit.total,pageErrors};
 fs.writeFileSync('audits/g5g6_stage18_sector_grammar_test_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({cases:report.sectorCases,correct:report.correct,failures:report.failures.slice(0,12),forms:report.forms,pageErrors},null,2));
 if(!report.sectorCases||report.failures.length||pageErrors.length||!report.forms['равных сектора']||!report.forms['равных секторов'])process.exitCode=1;
}finally{await browser.close()}
