import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
try{
 const page=await browser.newPage();
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const data=await page.evaluate(()=>{
  const selected=['frac_read','frac_ray','frac_to_mixed','mixed_to_frac','frac_add','frac_sub','mixed_compare','mixed_add','mixed_sub','frac_equal','frac_reduce','frac_common_lcm','frac_add_diff','dec_to_common','frac_division','frac_parts','frac_types','frac_shapes','powers','angles'];
  const out=[];
  for(const id of selected){
   const stages=[];
   for(let d=0;d<3;d++){
    blockSession={kind:'g5quiz',stageIndex:d,topicId:id,done:0,total:10,usedSignatures:[],finished:false};
    const arr=[];
    for(let i=0;i<15;i++){
     const q=makeG5Question(id);
     if(arr.length<8)arr.push({text:String(q.text).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,260),mode:q.answerMode||'choice',ans:q.ans,correctText:q.correctText,correctLabel:String(q.correctLabel||'').slice(0,160),choices:q.choices?.length,requireReduced:q.requireReduced,rat:q.answerRat});
    }
    stages.push({d,samples:arr});
   }
   out.push({id,stages});
  }
  return out;
 });
 fs.writeFileSync('audits/g5g6_stage18_answers_probe.json',JSON.stringify(data,null,2)+'\n');
 console.log(JSON.stringify(data.filter(x=>['frac_read','frac_to_mixed','mixed_to_frac','mixed_add','mixed_sub','frac_ray'].includes(x.id)).map(x=>({id:x.id,stages:x.stages.map(s=>({d:s.d,samples:s.samples.slice(0,2)}))})),null,2));
}finally{await browser.close()}
