import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('No Chromium/Chrome');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
let report;
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 report=await page.evaluate(()=>{
  const errors=[],stats=[],all=g7AllTopics();let total=0;
  const stages=['integer_expression_transform','combined_factorization'];
  const evalMono=(m,values)=>Number(m.coef)*Object.entries(m.powers||{}).reduce((a,[v,p])=>a*Math.pow(values[v]??2,p),1);
  const evalPoly=(p,v)=>(p||[]).reduce((s,m)=>s+evalMono(m,v),0);
  const checkAlgebra=q=>{
   const a=q.audit; if(a.type!=='g7AuditStage3')throw Error('unexpected generator '+a.type);
   for(let t=0;t<5;t++){
    const v={x:t+2,y:t+3,z:t+2,a:t+3,b:t+4};
    if(a.raw==='combined_factorization'){
     const lhs=evalPoly(a.target,v),rhs=a.factors.reduce((p,f)=>p*evalPoly(f,v),1);
     if(lhs!==rhs)throw Error('factorization mismatch '+a.variant+': '+lhs+' != '+rhs);
    }else if(a.variant==='numeric_value'){
     if(Number(a.answer)!==4*a.b*a.x||Number(q.ans)!==Number(a.answer))throw Error('value mismatch');
    }else if(a.variant==='coefficient'){
     if(Number(a.answer)!==4*a.a*a.b||Number(q.ans)!==Number(a.answer))throw Error('coefficient mismatch');
    }else{
     const A=evalMono(a.A,v),B=evalMono(a.B,v),result=evalPoly(a.result,v);
     const expected={
      difference_squares:4*A*B,
      sum_squares:2*A*A+2*B*B,
      cancel_double:A*A+B*B,
      cross_only:2*A*B,
      conjugate_plus:A*A,
      conjugate_minus:-B*B,
      linear_combo:a.m*(A+B)-a.n*(A-B),
      scaled_difference:4*a.m*A*B,
      product_minus_square:2*A*B-2*B*B
     }[a.variant];
     if(expected===undefined||result!==expected)throw Error('transform mismatch '+a.variant+': '+result+' != '+expected);
    }
   }
  };
  function sample(raw,d,n,verify){
   const signatures=new Set(),variants=new Set(),texts=new Set();let successes=0;
   for(let i=0;i<n;i++){
    try{
     const q=makeG7Question('g7:'+raw,d);if(!q||!q.text||!q.sig||!q.ex)throw Error('missing q metadata');
     if(/(?:undefined|NaN|\[object Object\])/.test(q.text+' '+q.ex))throw Error('broken output');
     if(Array.isArray(q.choices)&&q.choices.length){
      if(q.choices.filter(opt=>String(opt.key)===String(q.ans)).length!==1)throw Error('ambiguous correct choice');
     }
     if(verify)checkAlgebra(q);
     signatures.add(q.sig);texts.add(q.text);variants.add(q.audit?.variant||'legacy');
     successes++;total++;
    }catch(e){errors.push({raw,d,i,error:String(e)});if(errors.length>35)break;}
   }
   stats.push({raw,d,requested:n,successes,uniqueSignatures:signatures.size,uniqueTexts:texts.size,variantCount:variants.size,variants:[...variants]});
  }
  for(const raw of stages)for(let d=0;d<3;d++)sample(raw,d,220,true);
  for(const t of all)for(let d=0;d<3;d++)sample(t.id.slice(3),d,10,false);
  for(const s of stats.filter(s=>stages.includes(s.raw)&&s.requested>=200)){
   if(s.variantCount<3||s.uniqueSignatures<40)errors.push({raw:s.raw,d:s.d,error:'insufficient variety '+JSON.stringify(s)});
  }
  return {catalog:all.length,total,errors,stats,title:document.title};
 });
 report.pageErrors=pageErrors;report.htmlSha256=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');report.testedAt=new Date().toISOString();report.browser=await browser.version();
 fs.writeFileSync('audits/g7_stage3_browser_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({catalog:report.catalog,total:report.total,errors:report.errors.slice(0,10),pageErrors,targets:report.stats.filter(s=>['integer_expression_transform','combined_factorization'].includes(s.raw))},null,2));
 if(report.catalog!==107||report.errors.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close()}