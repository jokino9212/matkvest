import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),report={};
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 for(const width of [390,768,1280]){
  await page.setViewport({width,height:900,isMobile:width===390,deviceScaleFactor:1});
  report[width]=await page.evaluate(()=>{
    const head=document.querySelector('header');
    const a=[...document.querySelectorAll('.pill')];
    const compact=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{tag:e.tagName,id:e.id,cls:String(e.className),text:e.textContent.replace(/\s+/g,' ').slice(0,120),w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.x),y:Math.round(r.y),display:s.display,position:s.position,gap:s.gap,flexWrap:s.flexWrap}};
    return {head:head?.outerHTML.slice(0,13500),headInfo:compact(head),headParent:compact(head?.parentElement),headChildren:[...head?.children||[]].map(compact),pill: a.map(e=>({element:compact(e),parent:compact(e.parentElement)})),main:compact(document.querySelector('main'))};
  });
 }
 fs.writeFileSync('audits/ui_stage19_header_report.json',JSON.stringify(report,null,2)+'\n');
 console.log('HEADER STRUCTURE '+JSON.stringify(report[390]).slice(0,19000));
}finally{await browser.close()}
