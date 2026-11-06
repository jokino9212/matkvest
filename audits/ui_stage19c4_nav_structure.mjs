import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import puppeteer from 'puppeteer-core';
const exe=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));const b=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});const url=pathToFileURL(path.resolve('index.html')).href;const report={grades:[],headers:[]};
for(const w of [320,390,1280]){
 const p=await b.newPage();await p.setViewport({width:w,height:900,isMobile:w<=600,hasTouch:w<=600});await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 report.headers.push(await p.evaluate(()=>{
 const e=document.querySelector('.top'),s=document.querySelector('.stats');const rect=x=>{let r=x.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]};return {width:innerWidth,head:e.outerHTML.slice(0,4500),rect:rect(e),topChildren:[...e.children].map(x=>({cls:x.className,rect:rect(x)})),stats:[...s.children].map(x=>({cls:x.className,rect:rect(x),display:getComputedStyle(x).display}))}
 }));
 await p.close();
 for(const g of [1,4,7,8]){
  const p=await b.newPage();await p.setViewport({width:w,height:900,isMobile:w<=600,hasTouch:w<=600});await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  const d=await p.evaluate(grade=>{
   document.querySelectorAll('.grade-grid>.grade-card')[grade-1].querySelector('button.btn.primary').click();
   function loc(e){let a=[];for(let n=e,i=0;n&&i<6;i++,n=n.parentElement){const r=n.getBoundingClientRect();a.push({tag:n.tagName,id:n.id,cls:String(n.className||'').slice(0,180),rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)],firstText:n.innerText.replace(/\s+/g,' ').slice(0,120),childCount:n.children.length})}return a}
   const root=document.querySelector('#mainView'),topic=root.querySelector('.topic'),heads=[...root.querySelectorAll('h1,h2,h3,h4')];
   return{grade,rootHtml:root.innerHTML.slice(0,8500),first:loc(topic),headings:heads.slice(0,25).map(h=>({text:h.innerText.trim().slice(0,110),path:loc(h).slice(0,3)})),sections:[...root.children].slice(0,8).map(x=>({cls:x.className,tag:x.tagName,children:x.children.length,txt:x.innerText.slice(0,140)}))};
  },g);
  report.grades.push({width:w,...d});
  await p.close();
 }
}
await b.close();
fs.writeFileSync('audits/ui_stage19c4_nav_structure.json',JSON.stringify(report,null,2)+'\n');
console.log('NAV STRUCTURE',JSON.stringify(report.grades.filter(x=>x.width===390).map(x=>({grade:x.grade,first:x.first?.slice(0,4),headings:x.headings.slice(0,10).map(h=>({text:h.text,parent:h.path?.slice(0,2).map(y=>y.cls)})),sections:x.sections}))).slice(0,20000));
