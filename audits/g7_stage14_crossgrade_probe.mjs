import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
const html=fs.readFileSync('index.html');
const expected='f188d39a3a16fc54dfb32238fc34d3dfe6cc3c4416cd475579bf3ed65a7e1e36';
if(createHash('sha256').update(html).digest('hex')!==expected)throw Error('Unverified source');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const probe=await page.evaluate(()=>{
  const grades={};
  for(let g=1;g<=8;g++){
   const list=window['g'+g+'AllTopics'],make=window['makeG'+g+'Question'],start=window['startG'+g+'QuizStage'];
   let topics=[],err=null;
   try{if(typeof list==='function')topics=list()}catch(e){err=String(e)}
   grades[g]={list:typeof list,make:typeof make,start:typeof start,count:topics?.length||0,first:topics?.slice(0,3).map(t=>({id:t.id,title:t.title||t.name,keys:Object.keys(t)})),error:err};
  }
  return {grades,hasPwaRegistration:document.querySelector('#mk-stage12-pwa-refresh')!==null, hasLearningGuard:typeof mk872HasActiveLearning==='function',hasDraftSave:typeof mk872PersistDraft==='function',hasGrade7Patch:typeof freshQuiz==='function'};
 });
 fs.writeFileSync('audits/g7_stage14_probe_report.json',JSON.stringify({sha256:expected,probe,errors,testedAt:new Date().toISOString()},null,2)+'\n');
 console.log(JSON.stringify({probe,errors},null,2));
 if(errors.length)process.exitCode=1;
}finally{await browser.close()}
