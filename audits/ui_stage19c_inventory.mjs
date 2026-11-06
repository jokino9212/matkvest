import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!executablePath)throw Error('Chrome unavailable');
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const out={screens:[],consoleErrors:[],date:new Date().toISOString(),sourceVersion:'v57'};
async function snapshot(width,screen,grade){
 const p=await browser.newPage();
 p.on('pageerror',e=>out.consoleErrors.push(String(e)));
 await p.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 if(grade){await p.evaluate(g=>{const c=document.querySelectorAll('.grade-grid>.grade-card')[g-1];const b=c?.querySelector('button.btn.primary');if(!b)throw Error('Missing CTA for grade '+g);b.click()},grade);}
 await p.screenshot({path:'audits/ui19c_before_'+screen+'_'+width+'.png',fullPage:false});
 const data=await p.evaluate(()=>{
  const selectors=['body','.top','.stats','.grade-grid','.grade-card','.quick-card','.btn','.btn.primary','.pill','.topic','.stage-card','.elementary-topic','.g7-topic','.g6-topic','button','h1','h2'];
  const info=e=>{
   if(!e)return null;const s=getComputedStyle(e),r=e.getBoundingClientRect();return{
    tag:e.tagName,cls:String(e.className||'').slice(0,120),text:e.textContent.replace(/\s+/g,' ').slice(0,95),
    rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)],
    style:{bg:s.backgroundColor,color:s.color,border:s.borderColor,radius:s.borderRadius,shadow:s.boxShadow,font:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,padding:s.padding,transition:s.transitionDuration},
    actions:e.querySelectorAll('button,a,[role="button"]').length
   };
  };
  const elements={};for(const sel of selectors)elements[sel]=[...document.querySelectorAll(sel)].slice(0,3).map(info);
  const cards=[...document.querySelectorAll('#mainView > *,#mainView section,#mainView article')].slice(0,25).map(info);
  const activeText=document.getElementById('mainView')?.innerText.slice(0,1700);
  return{documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,bodyWidth:document.body.scrollWidth,mainText:activeText,elements,cards,
   colors:[...document.querySelectorAll('button')].slice(0,25).map(b=>({text:b.textContent.replace(/\s+/g,' ').slice(0,55),cls:b.className}))};
 });
 out.screens.push({screen,width,grade:grade||null,data});
 await p.close();
}
try{
 for(const w of [390,768,1280])await snapshot(w,'home');
 for(const w of [390,1280])await snapshot(w,'grade6',6);
 await snapshot(1280,'grade7',7);
}finally{await browser.close()}
fs.writeFileSync('audits/ui_stage19c_inventory.json',JSON.stringify(out,null,2)+'\n');
console.log('UI19C INVENTORY',JSON.stringify({screens:out.screens.map(s=>({screen:s.screen,width:s.width,overflow:s.data.documentWidth>s.data.viewport,main:s.data.mainText?.slice(0,220)})),errors:out.consoleErrors}).slice(0,3500));
if(out.consoleErrors.length||out.screens.some(s=>s.data.documentWidth>s.data.viewport+2))process.exitCode=1;
