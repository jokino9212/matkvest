import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Chromium not installed');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
let report;
try {
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 report=await page.evaluate(()=>{
  const targets=['geo_parallel_perpendicular_intro','geo_perpendicular_bisector_locus','geo_angle_bisector_locus','geo_constructions_lines_angles','geo_constructions_triangles'];
  const all=g7AllTopics(),errors=[],stats=[];let total=0;
  const sample=(raw,d,n)=>{
   const texts=new Set(),signatures=new Set(),variants=new Set();let stage5=0,successes=0;
   for(let i=0;i<n;i++){
    try {
     const q=makeG7Question('g7:'+raw,d);
     if(!q||!q.text||!q.sig||!q.ex)throw Error('Question metadata missing');
     if(/(?:undefined|NaN|\[object Object\])/.test(String(q.text)+' '+String(q.ex)))throw Error('Broken text');
     if(Array.isArray(q.choices)&&q.choices.length){
      if(q.choices.filter(c=>String(c.key)===String(q.ans)).length!==1)throw Error('Ambiguous correct choice');
     }
     if(q.audit?.type==='g7AuditStage5'){
      stage5++;
      if(q.audit.raw!==raw||q.audit.d!==d)throw Error('Wrong stage5 audit metadata');
      if(q.audit.answer!==undefined&&String(q.audit.answer)!==String(q.ans))throw Error('Wrong stage5 answer');
      if(q.audit.variant==='sss_exists'){
       const m=String(q.text).match(/сторонами (\d+), (\d+), (\d+) см/);
       if(!m)throw Error('Cannot verify triangle sides');
       const [a,b,c]=m.slice(1).map(Number);
       const exists=a+b>c&&a+c>b&&b+c>a;
       if(q.ans!==(exists?'да':'нет'))throw Error('Wrong triangle existence verdict');
      }
      if(q.audit.variant==='triangle_perimeter'){
       const m=String(q.text).match(/MA = (\d+) см, AB = (\d+) см/);
       if(!m||Number(q.ans)!==2*Number(m[1])+Number(m[2]))throw Error('Triangle perimeter mismatch');
      }
     }
     texts.add(q.text);signatures.add(q.sig);variants.add(q.audit?.variant||'legacy');
     total++;successes++;
    }catch(e){errors.push({raw,d,i,error:String(e)});if(errors.length>=30)break;}
   }
   stats.push({raw,d,requested:n,successes,newStage5:stage5,uniqueTexts:texts.size,uniqueSignatures:signatures.size,variantCount:variants.size,variants:[...variants]});
  };
  for(const raw of targets)for(let d=0;d<3;d++)sample(raw,d,220);
  for(const item of all)for(let d=0;d<3;d++)sample(item.id.slice(3),d,10);
  for(const st of stats.filter(s=>targets.includes(s.raw)&&s.requested===220)){
   if(st.newStage5<165||st.uniqueTexts<30||st.variantCount<3)errors.push({raw:st.raw,d:st.d,error:'Variety threshold failed',stat:st});
  }
  return {catalog:all.length,total,errors,stats};
 });
 report.pageErrors=pageErrors;
 report.htmlSha256=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
 report.testedAt=new Date().toISOString();
 report.browser=await browser.version();
 fs.mkdirSync('audits',{recursive:true});
 fs.writeFileSync('audits/g7_stage5_browser_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({catalog:report.catalog,total:report.total,errors:report.errors.slice(0,10),pageErrors:pageErrors.length,targets:report.stats.filter(s=>s.requested===220)},null,2));
 if(report.catalog!==107||report.errors.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close();}
