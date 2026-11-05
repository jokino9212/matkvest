import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const html=fs.readFileSync('index.html','utf8');
const patterns=['grade-card','class-card','classCard','gradeCard','grade-grid','topic-card','theme-card','subject-card','class-tile','course-card','unit-card','home-classes','1 класс','2 класс','Выбрать класс','Открыть класс','Перейти'];
const source={};
for(const p of patterns){
 let start=0,list=[];
 while((start=html.toLowerCase().indexOf(p.toLowerCase(),start))>=0&&list.length<8){
  list.push({pos:start,around:html.slice(Math.max(0,start-500),Math.min(html.length,start+800))});
  start+=p.length;
 }
 source[p]=list;
}
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const screens=[];
 for(const [name,width] of [['desktop',1365],['mobile',390]]){
  await page.setViewport({width,height:850,isMobile:width===390,hasTouch:width===390});
  await new Promise(res=>setTimeout(res,350));
  const data=await page.evaluate(()=>{
   const visible=(e)=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return r.width>5&&r.height>5&&c.visibility!=='hidden'&&c.display!=='none'};
   const info=(e)=>{
     if(!e)return null;const st=getComputedStyle(e),r=e.getBoundingClientRect();
     return {tag:e.tagName.toLowerCase(),id:e.id,cls:String(e.className||'').slice(0,200),role:e.getAttribute('role'),tabindex:e.getAttribute('tabindex'),onclick:!!e.onclick,href:e.getAttribute('href'),cursor:st.cursor,display:st.display,text:e.textContent?.replace(/\s+/g,' ').trim().slice(0,85),rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},children:e.children.length,
       outline:st.outline,background:st.backgroundColor,borderRadius:st.borderRadius};
   };
   const vis=[...document.querySelectorAll('body *')].filter(visible);
   const gradeRoots=vis.filter(e=>{
      const t=e.textContent?.replace(/\s+/g,' ').trim()||'';
      return /^([1-8]|[1-8]-й)\s*класс$/i.test(t)&&[...e.children].every(ch=>!visible(ch)||ch.textContent?.replace(/\s+/g,' ').trim()!==t);
   }).slice(0,35);
   const gradeElements=gradeRoots.map(e=>({leaf:info(e),parents:[e.parentElement,e.parentElement?.parentElement,e.parentElement?.parentElement?.parentElement,e.parentElement?.parentElement?.parentElement?.parentElement].map(info)}));
   const controls=vis.filter(e=>e.matches('button,a,[role="button"],[onclick],input')&&e.closest('body')).slice(0,130).map(info);
   const cards=vis.filter(e=>/(card|tile|topic|grade|section|level|chapter|unit|class)/i.test(e.className||'')&&e.children.length>=2).slice(0,120).map(e=>({...info(e),hasButton:!!e.querySelector('button'),hasAnchor:!!e.querySelector('a'),innerBtns:[...e.querySelectorAll('button')].slice(0,3).map(info)}));
   const dialogs=[...document.querySelectorAll('[role="dialog"],dialog')].filter(visible).map(info);
   return {title:document.title,bodyText:document.body.innerText.slice(0,2500),location:location.href,gradeElements,controls,cards,dialogs,navLists:[...document.querySelectorAll('nav')].map(info),viewport:{w:innerWidth,h:innerHeight}};
  });
  screens.push({name,data});
 }
 const report={at:new Date().toISOString(),source,screen:screens,errors};
 fs.writeFileSync('audits/ui_stage19_probe.json',JSON.stringify(report,null,2)+'\n');
 console.log('UI probe '+JSON.stringify({grades:screens.map(x=>x.data.gradeElements.length),cards:screens.map(x=>x.data.cards.length),controls:screens.map(x=>x.data.controls.length),errors}).slice(0,3000));
}finally{await browser.close()}
