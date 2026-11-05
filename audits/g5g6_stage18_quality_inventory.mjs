import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
const hash=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!executablePath)throw Error('Missing browser executable');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const result=await page.evaluate(()=>{
   const names=['makeG5Question','makeG6Question','freshQuiz','startG5QuizStage','startG6QuizStage','beginBlock','activeDifficulty','g5InfoById','g6InfoById','quizAnswerMarkup','g6FractionInputQuestion'];
   const probe=Object.fromEntries(names.map(name=>{try{return [name,{available:typeof eval(name)==='function',head:typeof eval(name)==='function'?String(eval(name)).slice(0,950):''}]}catch(e){return[name,{available:false,error:String(e)}]}}));
   return {probe,grade5:typeof G5_CORE==='undefined'?null:G5_CORE.map(x=>x.id),grade5frac:typeof G5_FRACTIONS==='undefined'?null:G5_FRACTIONS.map(x=>x.id),grade6:typeof G6_TOPICS==='undefined'?null:G6_TOPICS.map(x=>x.id),grade6implemented:typeof G6_IMPLEMENTED_TOPICS==='undefined'?null:[...G6_IMPLEMENTED_TOPICS]};
 });
 const out={sha256:hash,checkedAt:new Date().toISOString(),pageErrors,...result};
 fs.writeFileSync('audits/g5g6_stage18_quality_inventory.json',JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({sha256:hash,pageErrors,probe:Object.fromEntries(Object.entries(result.probe).map(([k,v])=>[k,v.available])),grade5Count:(result.grade5?.length||0)+(result.grade5frac?.length||0),grade6Count:result.grade6?.length,grade6implemented:result.grade6implemented?.length},null,2));
}finally{await browser.close()}
