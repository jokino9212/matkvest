import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v54')||!sw.includes(sha))throw Error('PWA v54 integrity failure');
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
const results=[];
const check=(name,pass,detail)=>results.push({name,pass:!!pass,detail:detail??null});
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const grammar=await page.evaluate(()=>{
   const src=[];
   for(const d of [0,1,2]){
     blockSession={kind:'g6quiz',stageIndex:d,topicId:'g6:ratio_value',done:0,total:10};
     for(let i=0;i<250;i++){
       const q=makeG6Question('g6:ratio_value',d);
       if(String(q.text).includes('В одной коробке'))src.push(q.text);
     }
   }
   const word=n=>{const k=n%10,h=n%100;return h>=11&&h<=14?'деталей':k===1?'деталь':k>=2&&k<=4?'детали':'деталей'};
   const bad=[];
   for(const html of src){
     const plain=String(html).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
     const m=plain.match(/В одной коробке (\d+) (деталь|детали|деталей)/);
     if(!m||m[2]!==word(Number(m[1]))||plain.includes('одинаковых деталей'))bad.push({plain,expected:m?word(Number(m[1])):null});
   }
   return {count:src.length,bad:bad.slice(0,12),sample:src.slice(0,9)};
 });
 check('Grade6 ratio contexts sampled at least 150 times',grammar.count>=150,grammar.count);
 check('All grade6 ratio contexts agree with Russian number declension',grammar.bad.length===0,grammar);
 for(const width of [390,768,1280]){
   await page.setViewport({width,height:900,isMobile:width===390,deviceScaleFactor:1});
   const geometry=await page.evaluate(()=>{
     qid='g6:fraction_add_subtract';
     q={answerMode:'fraction',answerRat:rational(7,3),correctText:'2 1/3',correctHtml:rationalHtml(rational(7,3),true),preferMixed:true,choices:[],ex:''};
     const root=document.getElementById('qstage')||Object.assign(document.createElement('div'),{id:'qstage'});
     if(!root.isConnected)document.body.appendChild(root);
     root.innerHTML=quizAnswerMarkup('nextQ','skipNormalQuiz');
     const center=id=>{const r=document.getElementById(id).getBoundingClientRect();return{x:(r.left+r.right)/2,y:(r.top+r.bottom)/2,right:r.right,left:r.left}};
     const w=center('quizFracWhole'),n=center('quizFracNum'),d=center('quizFracDen');
     return {width:innerWidth,whole:w,numerator:n,denominator:d,deltaY:Math.abs(w.y-(n.y+d.y)/2),
       visible:[w,n,d].every(r=>r.left>=0&&r.right<=innerWidth),css:document.querySelector('style')!==null};
   });
   check('Fraction whole cell centered between numerator and denominator at '+width+'px',geometry.deltaY<=13,geometry);
   check('All three fraction fields fit horizontally at '+width+'px',geometry.visible);
 }
 const report={sourceSha:sha,checkedAt:new Date().toISOString(),passed:results.filter(x=>x.pass).length,total:results.length,failed:results.filter(x=>!x.pass),tests:results,pageErrors};
 fs.writeFileSync('audits/g5g6_stage18_ui_polish_test_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,total:report.total,failed:report.failed,pageErrors},null,2));
 if(report.failed.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close()}
