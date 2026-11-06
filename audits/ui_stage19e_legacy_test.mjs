import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');if(!sw.includes('matkvest-iphone-v65')||!sw.includes(sha))throw Error('v65 PWA mismatch');
const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href,report={sha,checks:[],errors:[]};
const check=(label,pass,detail)=>report.checks.push({label,pass:!!pass,detail:detail??null});
try{
 const context=await browser.createBrowserContext(),p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 const r=await p.evaluate(()=>{
  state.coins=1000;state.xp=999999;
  state.inventory.accessories=[...new Set([...(state.inventory.accessories||[]),'acc_halo'])];
  mk865SetAcquisition(state,'accessories','acc_halo','store',1400,Date.now()-86400000);
  save();
  const eligible=mk865SellEligibility('accessories','acc_halo',state);
  const before=JSON.stringify({coins:state.coins,inv:state.inventory,shop:state.shopStats,acq:state.acquisitionMetadata});
  const summary=mk19eProfileSummary(state);
  mk19eWallet();
  const details=document.querySelector('#mk19eWallet details.mk19e-info')?.textContent;
  const after=JSON.stringify({coins:state.coins,inv:state.inventory,shop:state.shopStats,acq:state.acquisitionMetadata});
  return{eligible:eligible.ok,refundNow:eligible.refundNow,summary,details,unchanged:before===after,rendered:!!document.querySelector('#mk19eWallet')};
 });
 check('Historic accessory has a valid old purchase and ordinary resale quote',r.eligible&&r.refundNow===560,{eligible:r.eligible,refund:r.refundNow});
 check('Hidden accessory excluded from immediately sellable wealth despite historical quote',r.summary.realizable===0&&r.summary.potential===r.summary.balance,r.summary);
 check('Wallet explains that the hidden legacy accessory is excluded',r.rendered&&r.details?.includes('Устаревшие аксессуары не учитываются'),r.details);
 check('Wallet does not change profile data for legacy item',r.unchanged);
 const s=await p.evaluate(()=>{
  state.inventory.pets=[...new Set([...state.inventory.pets,'pet_cat'])];mk865SetAcquisition(state,'pets','pet_cat','store',390,Date.now()-43200000);
  const sum=mk19eProfileSummary(state);mk19eWallet();
  return{sum,text:document.querySelector('#mk19eWallet .mk19e-potential')?.textContent.replace(/\s+/g,' ').trim()};
 });
 check('Ordinary sellable pet is still included at 40%, without counting hidden accessory',s.sum.realizable===156&&s.sum.eligibleCount===1&&s.sum.potential===s.sum.balance+156,s);
 await context.close();
}finally{
 await browser.close();fs.writeFileSync('audits/ui_stage19e_legacy_test_report.json',JSON.stringify(report,null,2)+'\n');
 const failures=report.checks.filter(x=>!x.pass);
 console.log(JSON.stringify({sha,checks:report.checks.length,passed:report.checks.length-failures.length,failures,errors:report.errors},null,2));
 if(failures.length||report.errors.length)process.exitCode=1;
}