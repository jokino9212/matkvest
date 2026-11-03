import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const executable=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!executable)throw Error('Chromium not installed');
const browser=await puppeteer.launch({executablePath:executable,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(String(error)));
let report;
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 report=await page.evaluate(()=>{
  const targets=['geo_basic_constructions','geo_right_triangle_congruence','geo_circle_inscribed_in_angle','geo_incircle_triangle'];
  const all=g7AllTopics(), errors=[], stats=[];let total=0;
  const check=(raw,d,n)=>{
   const texts=new Set(),sigs=new Set(),variants=new Set();let stage4=0,successes=0;
   for(let i=0;i<n;i++){
    try{
     const q=makeG7Question('g7:'+raw,d);
     if(!q||!q.text||!q.ex||!q.sig)throw Error('Missing question metadata');
     if(/(?:undefined|NaN|\[object Object\])/.test(String(q.text)+' '+String(q.ex)))throw Error('Invalid output text');
     if(Array.isArray(q.choices)&&q.choices.length){
      if(q.choices.filter(row=>String(row.key)===String(q.ans)).length!==1)throw Error('Ambiguous choice answer');
     }
     if(q.audit?.type==='g7AuditStage4'){
      stage4++;
      if(q.audit.raw!==raw||q.audit.d!==d)throw Error('Audit metadata mismatch');
      if(q.audit.answer!==undefined&&Number(q.ans)!==Number(q.audit.answer)&&String(q.ans)!==String(q.audit.answer))throw Error('Incorrect numeric answer');
     }
     texts.add(q.text);sigs.add(q.sig);variants.add(q.audit?.variant||'legacy');
     successes++;total++;
    }catch(e){errors.push({raw,d,index:i,error:String(e)});if(errors.length>=30)break;}
   }
   stats.push({raw,d,requested:n,successes,newStage4:stage4,uniqueTexts:texts.size,uniqueSignatures:sigs.size,variantCount:variants.size,variants:[...variants]});
  };
  for(const raw of targets)for(let d=0;d<3;d++)check(raw,d,220);
  for(const item of all)for(let d=0;d<3;d++)check(item.id.slice(3),d,10);
  for(const s of stats.filter(x=>targets.includes(x.raw)&&x.requested===220)){
   if(s.newStage4<150||s.uniqueTexts<35||s.variantCount<4)errors.push({raw:s.raw,d:s.d,error:'Variety threshold failed',stat:s});
  }
  return {catalog:all.length,total,errors,stats};
 });
 report.htmlSha256=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
 report.testedAt=new Date().toISOString();
 report.browser=await browser.version();
 report.pageErrors=pageErrors;
 fs.mkdirSync('audits',{recursive:true});
 fs.writeFileSync('audits/g7_stage4_browser_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({catalog:report.catalog,total:report.total,errors:report.errors.slice(0,8),pageErrors:pageErrors.length,targets:report.stats.filter(x=>x.requested===220)},null,2));
 if(report.catalog!==107||report.errors.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close()}
