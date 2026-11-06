import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const SW=fs.readFileSync('sw.js','utf8');
if(sha!=='c93d13aeaafdb742e3ceda0111d3242daaf19fcc3a2cdd7b90b1b4a18f0817f2'||
   !SW.includes('matkvest-iphone-v70')||!SW.includes(sha))throw Error('Must use verified v70 HTML');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!exe)throw Error('Chromium missing');
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const report={from:'frontend v70',sha,byGrade:[],errors:[],checks:[],timestamp:new Date().toISOString()};
const check=(name,pass,detail)=>report.checks.push({name,pass:!!pass,detail:pass?undefined:detail});
try{
 for(let grade=1;grade<=8;grade++){
  const ctx=await browser.createBrowserContext(),p=await ctx.newPage();
  p.on('pageerror',e=>report.errors.push({grade,error:String(e)}));
  await p.setViewport({width:1280,height:900});
  await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  const data=await p.evaluate(grade=>{
    const button=document.querySelectorAll('.grade-grid>.grade-card')[grade-1]?.querySelector('button.btn.primary');
    if(!button)return{error:'grade button missing'};
    button.click();
    const root=document.querySelector('#mainView');
    const topics=[...root.querySelectorAll('.topic')];
    return{grade,pageTitle:root.querySelector('.grade-hero h1')?.innerText||null,
      topicCount:topics.length,
      topics:topics.map((e,index)=>{
        const get=e=>e?.getAttribute('onclick')||null;
        const title=e.querySelector('strong')?.textContent?.trim()||e.querySelector('h3')?.textContent?.trim()||(e.innerText||'').replace(/\s+/g,' ').trim().slice(0,130);
        const datasets=Object.fromEntries([...Object.entries(e.dataset||{})].filter(([key,value])=>String(value).length<300));
        const inline=get(e),nested=[...e.querySelectorAll('[onclick]')].slice(0,5).map(x=>({tag:x.tagName,onclick:get(x)?.slice(0,250)}));
        let handler=null;
        try{handler=typeof e.onclick==='function'?String(e.onclick).slice(0,420):null}catch(_){}
        return{index,title,id:e.id||null,cls:String(e.className).slice(0,130),
          dataset:datasets,onclick:inline?.slice(0,350)||null,
          jsHandler:handler,nested};
      })};
  },grade);
  report.byGrade.push(data);
  check('Grade '+grade+' accessible',!data.error&&data.topicCount>0,data.error);
  check('Grade '+grade+' every topic has title',data.topics?.every(t=>t.title.length>0),data.topics?.filter(t=>!t.title).slice(0,4));
  const uniq=new Set(data.topics?.map(x=>x.title.trim())||[]);
  check('Grade '+grade+' no duplicate displayed theme titles',uniq.size===data.topicCount,
    {unique:uniq.size,total:data.topicCount});
  await ctx.close();
 }
}finally{
 await browser.close();
 fs.writeFileSync('audits/backend20_frontend_topic_inventory.json',JSON.stringify(report,null,2)+'\n');
 console.log('BACKEND20 V70 CATALOG '+JSON.stringify({
  sha,checks:report.checks.length,passes:report.checks.filter(x=>x.pass).length,
  failed:report.checks.filter(x=>!x.pass),errors:report.errors,
  grades:report.byGrade.map(g=>({grade:g.grade,title:g.pageTitle,count:g.topicCount,
    ids:g.topics?.filter(t=>t.id||t.dataset?.topicId).slice(0,4),
    samples:g.topics?.slice(0,3)}))},null,2).slice(0,20000));
 if(report.errors.length||report.checks.some(x=>!x.pass))process.exitCode=1;
}
