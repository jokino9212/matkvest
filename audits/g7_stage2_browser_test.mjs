import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Chrome not found on runner');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();
const pageErrors=[];
page.on('pageerror',err=>pageErrors.push(String(err)));
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const report=await page.evaluate(()=>{
  const targets=['direct_inverse_proportion','common_factor','factorization_grouping','geo_triangle_elements','geo_isosceles_equilateral','geo_isosceles_properties_criteria','geo_triangle_inequality','geo_side_angle_relation'];
  const oldStage=['geo_congruence_sas','geo_congruence_asa','geo_congruence_sss','geo_locus_points','geo_circumcircle_triangle'];
  const all=g7AllTopics();
  let total=0,errors=[],status=[];
  const sample=(raw,d,n,expectedPrefix)=>{
   const signatures=new Set(),variants=new Set();
   let successes=0;
   for(let i=0;i<n;i++){
    try{
     const q=makeG7Question('g7:'+raw,d);
     if(!q||!q.text||!q.sig||!q.ex)throw Error('No question/text/sig/ex');
     if(String(q.text).includes('undefined')||String(q.text).includes('NaN')||String(q.ex).includes('NaN'))throw Error('Invalid rendered text');
     if(expectedPrefix&&!String(q.sig).includes(expectedPrefix))throw Error('Old generator fallback for '+raw+': '+q.sig);
     if(Array.isArray(q.choices)&&q.choices.length>0){
      const matched=q.choices.filter(opt=>String(opt.key)===String(q.ans));
      if(matched.length!==1)throw Error('Choice key ambiguous: '+q.sig+' options '+q.choices.length);
     }
     signatures.add(q.sig); variants.add((q.audit&&q.audit.variant)||q.sig.split(':')[3]||'unknown');
     successes++;total++;
    }catch(e){errors.push({raw,d,index:i,error:String(e)});if(errors.length>40)break;}
   }
   status.push({raw,d,requested:n,successes,uniqueSignatures:signatures.size,variantCount:variants.size});
  };
  for(const raw of targets)for(let d=0;d<3;d++)sample(raw,d,75, raw==='common_factor'||raw==='factorization_grouping'?null: 'audit2_');
  for(const raw of oldStage)for(let d=0;d<3;d++)sample(raw,d,100,'audit1_');
  for(const topic of all)for(let d=0;d<3;d++)sample(topic.id.replace(/^g7:/,''),d,4,null);
  return {catalog:all.length,total,errors,status,documentTitle:document.title};
 });
 report.pageErrors=pageErrors; report.testedAt=new Date().toISOString();
 report.browser=await browser.version();
 const output='audits/g7_stage2_browser_report.json';
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({catalog:report.catalog,total:report.total,errors:report.errors.length,pageErrors:pageErrors.length,status:report.status.slice(0,8)},null,2));
 if(report.catalog!==107||report.errors.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close()}
