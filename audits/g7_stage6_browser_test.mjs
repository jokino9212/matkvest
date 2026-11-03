import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Chromium not found');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
let report;
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 report=await page.evaluate(()=>{
  const targets=['stat_choose_characteristic','stat_random_variability','geo_perpendicular_oblique_distances'];
  const topics=g7AllTopics(),errors=[],stats=[];let total=0;
  const sample=(raw,d,n)=>{
   const texts=new Set(),sigs=new Set(),variants=new Set();let newCases=0,successes=0;
   for(let i=0;i<n;i++){
    try{
     const q=makeG7Question('g7:'+raw,d);
     if(!q||!q.text||!q.sig||!q.ex)throw Error('Missing metadata');
     if(/(?:undefined|NaN|\[object Object\])/.test(String(q.text)+' '+String(q.ex)))throw Error('Broken output');
     if(Array.isArray(q.choices)&&q.choices.length){
      if(q.choices.filter(c=>String(c.key)===String(q.ans)).length!==1)throw Error('Ambiguous answer');
     }
     if(q.audit?.type==='g7AuditStage6'){
      newCases++;
      if(q.audit.raw!==raw||q.audit.d!==d)throw Error('Mislabelled stage 6 question');
      if(q.audit.answer!==undefined&&Number(q.ans)!==Number(q.audit.answer))throw Error('Incorrect numeric answer');
      if(q.audit.correct!==undefined&&String(q.ans)!==String(q.audit.correct))throw Error('Incorrect choice answer');
      const m=q.audit;
      if(m.variant==='median_find'){
       const arr=m.values;
       if(arr.length!==5||Number(q.ans)!==[...arr].sort((a,b)=>a-b)[2])throw Error('Median mismatch');
      }
      if(m.variant==='range_measure'){
       if(Number(q.ans)!==m.max-m.min)throw Error('Range mismatch');
      }
      if(m.variant==='stable'||m.variant==='compare'){
       const a=Math.max(...m.A)-Math.min(...m.A),b=Math.max(...m.B)-Math.min(...m.B);
       if(a===b)throw Error('Comparison ambiguous');
       const correct=m.variant==='stable'?(a<b?'A':'Б'):(a>b?'A':'Б');
       if(q.ans!==correct)throw Error('Spread comparison mismatch');
      }
     }
     texts.add(q.text);sigs.add(q.sig);variants.add(q.audit?.variant||'legacy');
     successes++;total++;
    }catch(e){errors.push({raw,d,i,error:String(e)});if(errors.length>30)break;}
   }
   stats.push({raw,d,requested:n,successes,newStage6:newCases,uniqueTexts:texts.size,uniqueSignatures:sigs.size,variantCount:variants.size,variants:[...variants]});
  };
  for(const raw of targets)for(let d=0;d<3;d++)sample(raw,d,220);
  for(const t of topics)for(let d=0;d<3;d++)sample(t.id.slice(3),d,10);
  for(const s of stats.filter(z=>targets.includes(z.raw)&&z.requested===220)){
   if(s.newStage6<165||s.uniqueTexts<40||s.variantCount<3)errors.push({raw:s.raw,d:s.d,error:'Variety below minimum',stat:s});
  }
  return {catalog:topics.length,total,errors,stats};
 });
 report.pageErrors=pageErrors;
 report.htmlSha256=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
 report.testedAt=new Date().toISOString();
 report.browser=await browser.version();
 fs.writeFileSync('audits/g7_stage6_browser_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({catalog:report.catalog,total:report.total,errors:report.errors.slice(0,12),pageErrors:pageErrors.length,targets:report.stats.filter(x=>x.requested===220)},null,2));
 if(report.catalog!==107||report.errors.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close();}
