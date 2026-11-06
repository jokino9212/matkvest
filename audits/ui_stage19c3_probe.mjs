import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!chrome)throw Error('Chromium missing');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const base=pathToFileURL(path.resolve('index.html')).href;
const report={date:new Date().toISOString(),version:'v59',screens:[],errors:[],warnings:[]};
function key(e){return String(e).replaceAll(/[^a-zA-Z0-9_-]/g,'_').slice(0,70)}
async function scene(p,name,width){
 const data=await p.evaluate(()=>{
  const main=document.querySelector('#mainView'); 
  function visible(e){if(!e)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>3&&r.height>3&&s.display!=='none'&&s.visibility!=='hidden'}
  function el(e){if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {
   tag:e.tagName,cls:String(e.className||'').slice(0,170),id:e.id,text:e.innerText?.replace(/\s+/g,' ').trim().slice(0,120),
   width:Math.round(r.width),height:Math.round(r.height),x:Math.round(r.left),y:Math.round(r.top),
   font:s.fontSize,weight:s.fontWeight,bg:s.backgroundColor,fg:s.color,border:s.borderColor,radius:s.borderRadius,
   shadow:s.boxShadow,cursor:s.cursor,padding:s.padding,display:s.display,role:e.getAttribute('role'),
   aria:e.getAttribute('aria-label'),tabindex:e.getAttribute('tabindex'),actions:e.querySelectorAll('button,a,[role="button"]').length
  }}
  const vis=[...document.querySelectorAll('#mainView *')].filter(visible);
  const interactive=vis.filter(e=>e.matches('button,a,[role="button"],[onclick],input,select,textarea')).slice(0,65).map(el);
  const top=vis.filter(e=>/^(H[1-4]|SECTION|ARTICLE|DIALOG)$/i.test(e.tagName)).slice(0,55).map(el);
  const attrs=vis.filter(e=>/(card|lesson|theory|trainer|train|result|exercise|stage|topic|shop|profile|modal|progress|tabs|panel|game|question)/i.test(String(e.className||''))&&e.children.length>=1).slice(0,70).map(el);
  const overlay=[...document.querySelectorAll('[role="dialog"],dialog,.modal,.overlay,[class*="modal"],[class*="dialog"]')].filter(visible).slice(0,25).map(el);
  return {title:document.title,mainText:main?.innerText.slice(0,3500),mainHtml:main?.innerHTML.slice(0,8500),bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth,main:el(main),top,interactive,attrs,overlay};
 });
 report.screens.push({name,width,data});
 await p.screenshot({path:'audits/ui19c3_probe_'+key(name)+'_'+width+'.png',fullPage:false});
 return data;
}
async function fresh(width){
 const p=await browser.newPage();p.on('pageerror',e=>report.errors.push(String(e)));
 await p.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600});
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:120000});return p;
}
async function click(p,selector,label){
 return p.evaluate(({selector,label})=>{
  const el=document.querySelector(selector);
  if(!el)return{ok:false,reason:'absent '+selector};
  const cs=getComputedStyle(el);
  if(cs.display==='none'||el.getBoundingClientRect().width<=0)return{ok:false,reason:'hidden '+selector};
  el.click();return{ok:true,label,selector};
 },{selector,label});
}
try{
 for(const width of [390,1280]){
  let p=await fresh(width);
  await scene(p,'home',width);
  await click(p,'.grade-grid>.grade-card:first-child button.btn.primary','grade1');
  await scene(p,'grade1',width);
  const firstTopic=await click(p,'#mainView .topic:first-of-type','topic1');
  if(!firstTopic.ok)report.warnings.push({width,step:'topic1',firstTopic});
  await scene(p,'topic1',width);
  // Exercise navigation: stage or lesson CTA only, no user data is submitted.
  let opts=await p.evaluate(()=>{
   const main=document.querySelector('#mainView');
   return [...main.querySelectorAll('button,[role="button"],.stage-card')].filter(x=>{const r=x.getBoundingClientRect(),s=getComputedStyle(x);return r.width>10&&r.height>10&&s.display!=='none'&&s.visibility!=='hidden'}).slice(0,35).map(x=>({tag:x.tagName,cls:x.className,text:x.innerText?.slice(0,100),html:x.outerHTML.slice(0,350)}));
  });
  report.warnings.push({width,step:'topic action options',opts});
  const next=await p.evaluate(()=>{
   const main=document.querySelector('#mainView');
   const all=[...main.querySelectorAll('button,.stage-card,[role="button"]')].filter(e=>{
    let r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>8&&r.height>8&&s.display!=='none'&&!e.disabled&&e.getAttribute('aria-disabled')!=='true'&&!e.matches('.locked,.soon,.disabled');
   });
   const preferred=all.find(x=>/^(начать|открыть|урок|теори|тренир|этап|практик|пройти|изучить)/i.test(x.innerText?.trim()||''))||all.find(x=>/stage-card|stage/i.test(String(x.className)))||all[0];
   if(!preferred)return{ok:false};
   const detail={tag:preferred.tagName,cls:String(preferred.className).slice(0,100),text:preferred.innerText?.slice(0,80)};
   preferred.click();return{ok:true,detail};
  });
  report.warnings.push({width,step:'clicked topic first action',next});
  await scene(p,'topic_action',width);
  await p.close();
  for(const [name,sel] of [['shop','.shop-pill'],['profile','.profile-pill'],['data','.data-pill'],['journal','.report-pill'],['leaders','.leader-pill']]){
   p=await fresh(width);
   if(width<=600)await click(p,'.mk-ui19-nav-toggle','mobile nav');
   let action=await click(p,sel,name);report.warnings.push({width,step:name,action});
   await scene(p,name,width);
   await p.close();
  }
 }
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19c3_probe.json',JSON.stringify(report,null,2)+'\n');
 console.log('UI19C3 PROBE',JSON.stringify({screens:report.screens.map(x=>({name:x.name,width:x.width,text:x.data.mainText?.slice(0,160),htmlLength:x.data.mainHtml?.length,controls:x.data.interactive?.length,attrs:x.data.attrs?.length,overflow:x.data.bodyWidth>x.width})),errors:report.errors,warnings:report.warnings.filter(x=>x.step!=='topic action options')}).slice(0,11000));
 if(report.errors.length)process.exitCode=1;
}