import fs from 'node:fs'; import path from 'node:path';import {pathToFileURL} from 'node:url';import puppeteer from 'puppeteer-core';
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href,report={version:'v60',scenes:[],events:[],errors:[]};
async function fresh(w){const context=await browser.createBrowserContext(),p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));await p.setViewport({width:w,height:900,isMobile:w<=600,hasTouch:w<=600});await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});return{context,p}}
async function click(p,s){await p.evaluate(sel=>{const x=document.querySelector(sel);if(!x)throw Error('missing '+sel);x.click()},s)}
async function scene(p,name,w){const d=await p.evaluate(()=>{
 const m=document.querySelector('#modal'),v=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return r.width>8&&r.height>8&&s.display!=='none'&&s.visibility!=='hidden'};
 const info=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {cls:String(e.className).slice(0,120),id:e.id,tag:e.tagName,text:e.innerText?.replace(/\s+/g,' ').slice(0,150),rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)],bg:s.backgroundColor,fg:s.color,radius:s.borderRadius,shadow:s.boxShadow,padding:s.padding,disabled:e.disabled}};
 const roots=[m,...document.querySelectorAll('.mk872-training-dialog,.mk872-training-panel,[role="dialog"]')].filter(e=>e&&v(e));
 return{modalText:m?.innerText.replace(/\s+/g,' ').slice(0,1700),roots:roots.map(info),bodyWidth:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('button,a,input,[role="button"]')].filter(v).filter(e=>roots.some(x=>x.contains(e))).slice(0,65).map(info),panels:[...document.querySelectorAll('div,section,article')].filter(v).filter(e=>roots.some(x=>x.contains(e))&&/result|summary|report|feedback|collect|inventory|chest|reward|purchase|confirm|receipt|training|shop-card|rarity|profile|dialog|modal/i.test(String(e.className))).slice(0,80).map(info),html:m?.outerHTML.slice(0,1000)};
 });report.scenes.push({name,width:w,data:d});await p.screenshot({path:'audits/ui19c3b_before_'+name+'_'+w+'.png',fullPage:false});return d}
async function stage(p){await click(p,'.grade-grid>.grade-card:first-child button.btn.primary');await click(p,'#mainView .topic');await click(p,'#modal button.stage-card:not(.locked):not(:disabled)')}
try{for(const w of [390,1280]){
 {const {p,context}=await fresh(w);await stage(p);await scene(p,'quiz_in_progress',w);
  for(let step=0;step<7;step++){
   let success=false,hadAnswer=false;
   for(let attempt=0;attempt<5;attempt++){
    const a=await p.evaluate(()=>{
     const n=document.querySelector('#quizNext');
     if(n&&getComputedStyle(n).display!=='none')return{ready:true,next:true,feedback:document.querySelector('#qfb')?.innerText.slice(0,110)};
     const q=document.querySelector('#modal .answers');
     const choices=[...(q?.querySelectorAll('button.answer')||[])].filter(e=>!e.disabled&&!e.classList.contains('bad')&&e.getBoundingClientRect().width>0);
     if(!choices.length)return{ready:false,txt:document.querySelector('#modal')?.innerText.slice(-320)};
     const answer=choices[0];answer.click();const next=document.querySelector('#quizNext');
     return{ready:true,choice:answer.innerText,next:!!next&&getComputedStyle(next).display!=='none',feedback:document.querySelector('#qfb')?.innerText.slice(0,110)};
    });
    report.events.push({type:'quiz_try',w,step,attempt,a});
    if(!a.ready)break;
    hadAnswer=true;if(a.next){success=true;break}
   }
   if(!success){
    if(!hadAnswer)break;
    const skipped=await p.evaluate(()=>{const b=document.querySelector('#quizSkip');if(!b||b.disabled)return false;b.click();return true});
    report.events.push({type:'quiz_skip_after_tries',w,step,skipped});
    if(!skipped)break;
   }
   const advanced=await p.evaluate(()=>{const n=document.querySelector('#quizNext');if(n&&getComputedStyle(n).display!=='none'&&!n.disabled){n.click();return true}return false});
   report.events.push({type:'quiz_advance',w,step,advanced});
   if(!advanced)break;
  }await scene(p,'quiz_result',w);await context.close()
 }
 {const {p,context}=await fresh(w);await stage(p);await scene(p,'resume_active',w);await click(p,'#modal .mtop button.x');await p.reload({waitUntil:'domcontentloaded',timeout:120000});await scene(p,'resume_reload',w);await context.close()}
 for(const kind of ['collection','shop_collection','chests','shop_help','journal']){
  const {p,context}=await fresh(w);if(w<=600)await click(p,'.mk-ui19-nav-toggle');
  if(kind==='collection'){await click(p,'.profile-pill');const result=await p.evaluate(()=>{const b=[...document.querySelectorAll('#modal button')].find(x=>/Моя коллекция/.test(x.innerText));if(!b)return false;b.click();return true});report.events.push({type:'collection',w,result})}
  else if(kind==='journal')await click(p,'.report-pill');
  else {await click(p,'.shop-pill');if(kind==='shop_collection')await p.evaluate(()=>[...document.querySelectorAll('#modal button.shop-tab')].find(x=>/Моё/.test(x.innerText))?.click());if(kind==='chests')await p.evaluate(()=>[...document.querySelectorAll('#modal button.shop-tab')].find(x=>/Сундуки/.test(x.innerText))?.click());if(kind==='shop_help')await p.evaluate(()=>document.querySelector('#modal .mk872-help-trigger')?.click())}
  await scene(p,kind,w);await context.close()
 }
}}finally{await browser.close();fs.writeFileSync('audits/ui_stage19c3b_inventory.json',JSON.stringify(report,null,2)+'\n');console.log('UI19C3B',JSON.stringify({scenes:report.scenes.map(x=>({name:x.name,width:x.width,text:x.data.modalText?.slice(0,180),roots:x.data.roots.map(y=>y.cls),panels:x.data.panels.length,controls:x.data.controls.length,overflow:x.data.bodyWidth>x.width})),events:report.events,errors:report.errors}).slice(0,15500));if(report.errors.length)process.exitCode=1}
