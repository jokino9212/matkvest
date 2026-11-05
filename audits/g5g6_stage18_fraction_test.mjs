import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const source=fs.readFileSync('index.html');
const hash=createHash('sha256').update(source).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v51')||!sw.includes(hash))throw Error('PWA hash or cache version mismatch');
const execPath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!execPath)throw Error('Chromium not found');
const browser=await puppeteer.launch({headless:true,executablePath:execPath,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
const tests=[];
function ok(name,value,extra){tests.push({name,pass:!!value,extra:extra??null});}
try{
 await page.setViewport({width:390,height:844,isMobile:true,deviceScaleFactor:1});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const result=await page.evaluate(()=>{
   const out={};
   function setup(mode,grade,number,preferMixed=false,requireReduced=false){
     qid='g'+grade+':'+(grade===5?'frac_add':'fraction_add_subtract');
     q={text:'Тестовая дробь',answerMode:mode,answerRat:number,preferMixed,requireReduced,ans:'',correctText:'тест',correctHtml:'<b>тест</b>',choices:[],ex:'Проверка'};
     const root=document.getElementById('qstage')||Object.assign(document.createElement('div'),{id:'qstage'});if(!root.isConnected)document.body.appendChild(root);root.innerHTML=quizAnswerMarkup('nextQ','skipNormalQuiz');
   }
   function input(w,n,d){
     document.getElementById('quizFracWhole').value=w;
     document.getElementById('quizFracNum').value=n;
     document.getElementById('quizFracDen').value=d;
     const raw=quizInputRaw(q);
     return {raw,evaluation:quizInputEvaluation(q,raw),studentText:stage18FractionStudentText(raw)};
   }
   const known={};
   setup('fraction',6,rational(2,5));
   known.proper=input('','2','5');
   known.properBad=input('','3','5');
   known.empty=input('','','');
   known.missing=input('','2','');
   known.zero=input('','2','0');
   setup('fraction',6,rational(7,3),true);
   known.mixed=input('2','1','3');
   known.improper=input('','7','3');
   known.integer=input('3','','');
   setup('fraction',6,rational(1,2),false,true);
   known.notReduced=input('','2','4');
   known.reduced=input('','1','2');
   setup('fraction',7,rational(1,2));
   out.grade7TextInput=!!document.getElementById('quizInput')&&!document.getElementById('quizFracNum');
   setup('fraction',6,rational(2,5));
   const num=document.getElementById('quizFracNum'),den=document.getElementById('quizFracDen'),whole=document.getElementById('quizFracWhole');
   const bnum=num.getBoundingClientRect(),bden=den.getBoundingClientRect(),bwhole=whole.getBoundingClientRect();
   out.fieldGeometry={fractionStacked:bnum.bottom<bden.top,wholeIsLeft:bwhole.right<bnum.left,barVisible:!!document.querySelector('.stage18-frac-bar'),buttons:!!document.getElementById('quizCheck')&&!!document.getElementById('quizSkip'),mobileFits:bnum.right<=innerWidth&&bden.right<=innerWidth,labels:[whole.getAttribute('aria-label'),num.getAttribute('aria-label'),den.getAttribute('aria-label')]};
   out.g5TypeSamples=[];out.g5RawSamples=[];out.g5AdapterPatched=makeG5Question.toString().includes('stage18ConvertG5Fraction');out.g5ConverterSource=stage18ConvertG5Fraction.toString().slice(0,950);
   for(let i=0;i<70;i++){
     const z=makeG5Question('frac_read');if(out.g5RawSamples.length<8)out.g5RawSamples.push({ans:z.ans,label:z.correctLabel,mode:z.answerMode,templateId:z.templateId,text:z.text.slice(0,160)});
     if(z.answerMode==='fraction')out.g5TypeSamples.push({mode:z.answerMode,rat:z.answerRat,correctText:z.correctText,label:z.correctLabel});
   }
   if(out.g5TypeSamples.length){
     const z=out.g5TypeSamples[0];setup('fraction',5,z.rat);
     out.g5VisualInput=!!document.getElementById('quizFracNum')&&!!document.getElementById('quizFracDen');
   }else out.g5VisualInput=false;
   out.otherG5Choice=makeG5Question('natural').answerMode||'choice';
   out.cases={
     proper:known.proper.evaluation.ok,
     properBad:!known.properBad.evaluation.ok,
     empty:quizInputEmpty({answerMode:'fraction'},known.empty.raw),
     missing:!known.missing.evaluation.valid,
     zero:!known.zero.evaluation.valid,
     mixed:known.mixed.evaluation.ok && known.mixed.studentText==='2 1/3',
     improper:known.improper.evaluation.ok && known.improper.studentText==='7/3',
     integer:!known.integer.evaluation.ok,
     notReduced:known.notReduced.evaluation.valid&&!known.notReduced.evaluation.ok,
     reduced:known.reduced.evaluation.ok
   };
   return out;
 });
 for(const [name,value] of Object.entries(result.cases))ok('Fraction validation: '+name,value);
 for(const [name,value] of Object.entries(result.fieldGeometry)){
   ok('Mobile fraction field: '+name,name==='labels'?value.every(Boolean):value);
 }
 ok('Grade5 fraction conversion generates typed items',result.g5TypeSamples.length>=1,{found:result.g5TypeSamples.length});
 ok('Grade5 typed items use visual boxes',result.g5VisualInput);
 ok('Grade5 non-fraction item remains a choice',result.otherG5Choice==='choice');
 ok('Grade7 fraction inputs remain legacy text to avoid unrelated changes',result.grade7TextInput);
 const report={sourceHash:hash,tests:tests.length,passed:tests.filter(x=>x.pass).length,failed:tests.filter(x=>!x.pass),result,pageErrors:errors};
 fs.writeFileSync('audits/g5g6_stage18_fraction_test_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({hash,tests:report.tests,passed:report.passed,failed:report.failed,pageErrors:errors,g5TypedSamples:result.g5TypeSamples.length,g5RawSamples:result.g5RawSamples,g5AdapterPatched:result.g5AdapterPatched,g5ConverterSource:result.g5ConverterSource},null,2));
 if(report.failed.length||errors.length)process.exitCode=1;
}finally{await browser.close()}
