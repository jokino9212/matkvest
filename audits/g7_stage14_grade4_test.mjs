import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const expected='f188d39a3a16fc54dfb32238fc34d3dfe6cc3c4416cd475579bf3ed65a7e1e36';
if(createHash('sha256').update(fs.readFileSync('index.html')).digest('hex')!==expected)throw Error('Unexpected source SHA');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const grade4=await page.evaluate(()=>{
  const checks=[],errors=[];
  function test(label,fn){try{fn();checks.push({label,pass:true})}catch(e){errors.push({label,error:String(e)});checks.push({label,pass:false})}}
  test('Grade4 opens with available topic cards',()=>{
   openGrade(4);
   if(!mainView.textContent.includes('Математика 4 класса'))throw Error('Wrong grade view');
   if(document.querySelectorAll('#topics .topic').length!==TOPICS.length||TOPICS.length!==8)throw Error('Grade4 topic cards missing or duplicated');
  });
  test('Ordinary grade4 quiz opens and renders prompt',()=>{
   const first=TOPICS.find(x=>x.id!=='column'&&x.id!=='table');
   if(!first)throw Error('Quiz topics absent');
   startQuizStage(first.id,0);
   if(blockSession?.kind!=='quiz'||!document.querySelector('#qstage .quizq'))throw Error('Question did not render');
  });
  for(const op of ['add','sub','mul','div']){
   for(let stage=0;stage<3;stage++)test('Grade4 column '+op+' stage '+stage,()=>{
    startColumnStage(op,stage);
    if(blockSession?.kind!=='column'||blockSession?.key!=='column:'+op)throw Error('Wrong column session');
    if(!document.querySelector('#stage')?.children.length)throw Error('Empty column workspace');
   });
  }
  for(let stage=0;stage<3;stage++)test('Grade4 multiplication table stage '+stage,()=>{
    startTableStage(stage);
    if(blockSession?.kind!=='table'||!document.querySelector('#tstage')?.children.length)throw Error('Table task missing');
  });
  return {checks,errors,passed:checks.filter(x=>x.pass).length};
 });
 const report={sha256:expected,testedAt:new Date().toISOString(),pageErrors,grade4};
 fs.writeFileSync('audits/g7_stage14_grade4_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({grade4Passed:grade4.passed,grade4Checks:grade4.checks.length,errors:grade4.errors,pageErrors},null,2));
 if(grade4.errors.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close()}
