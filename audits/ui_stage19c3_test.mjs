import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v60')||!sw.includes(sha))throw Error('v60 PWA fingerprint mismatch');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const report={sha,checks:[],errors:[],screens:[]};
const check=(name,pass,detail)=>report.checks.push({name,pass:!!pass,detail:detail??null});
async function pageFor(w){
 const context=await browser.createBrowserContext();
 const p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));
 await p.setViewport({width:w,height:900,isMobile:w<=600,hasTouch:w<=600});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 return{p,context};
}
async function openDialog(p,kind){
 if(kind==='topic'||kind==='stage'){
  await p.evaluate(()=>document.querySelector('.grade-grid>.grade-card:first-child button.btn.primary').click());
  await p.evaluate(()=>document.querySelector('#mainView .topic')?.click());
  if(kind==='stage')await p.evaluate(()=>{
   const st=document.querySelector('#modal .stage-card:not(.locked):not(:disabled)');
   if(!st)throw Error('No enabled stage');st.click();
  });
 }else{
  if((await p.evaluate(()=>innerWidth))<=600)await p.evaluate(()=>document.querySelector('.mk-ui19-nav-toggle')?.click());
  const selector={shop:'.shop-pill',profile:'.profile-pill',data:'.data-pill',journal:'.report-pill'}[kind];
  if(!selector)throw Error('Unsupported scene '+kind);
  await p.evaluate(sel=>{const e=document.querySelector(sel);if(!e)throw Error('Missing '+sel);e.click();},selector);
 }
}
async function state(p){
 return p.evaluate(()=>{
  const el=(s)=>document.querySelector(s),css=(s)=>el(s)&&getComputedStyle(el(s));
  const m=el('#modal'),mt=el('#modal .mtop'),r=m?.getBoundingClientRect();
  const rect=e=>{const d=e?.getBoundingClientRect();return d&&[Math.round(d.x),Math.round(d.y),Math.round(d.width),Math.round(d.height)]};
  return{style:!!el('#mk-ui19c3-modal-design'),viewport:innerWidth,bodyWidth:document.documentElement.scrollWidth,
    modalVisible:!!m&&getComputedStyle(m).display!=='none'&&!!r?.width,modalRect:rect(m),
    scrollWidth:m?.scrollWidth,clientWidth:m?.clientWidth,
    modalBorder:css('#modal')?.borderRadius,header:rect(mt),headBorder:css('#modal .mtop')?.borderBottomColor,
    closeSize:rect(el('#modal .mtop button.x')),closeLabel:el('#modal .mtop button.x')?.textContent,
    lesson:rect(el('#modal .lesson')),lessonBg:css('#modal .lesson')?.backgroundColor,
    stages:el('#modal')?.querySelectorAll('.stage-card').length,
    locked:el('#modal')?.querySelectorAll('.stage-card.locked:disabled').length,
    stageRadius:css('#modal button.stage-card')?.borderRadius,
    answers:el('#modal')?.querySelectorAll('.answers button.answer').length,
    questionText:el('#modal .quizq')?.textContent.trim(),answerHeight:el('#modal .answer')?.getBoundingClientRect().height,
    shopTabs:el('#modal')?.querySelectorAll('.shop-tab').length,
    shopCards:el('#modal')?.querySelectorAll('.shop-card').length,
    shopActive:el('#modal button.shop-tab.active')?.innerText.trim(),
    profilePreview:rect(el('#modal .profile-preview')),profileRows:el('#modal')?.querySelectorAll('.profile-row').length,
    backups:el('#modal')?.querySelectorAll('.backup-action').length,
    progressText:el('#blockProgressText')?.textContent.trim(),
    name:el('#newProfileName')?.getAttribute('placeholder'),
    text:el('#modal')?.innerText.replace(/\s+/g,' ').slice(0,450)
  };
 });
}
try{
 for(const w of [390,768,1280]){
  for(const kind of ['topic','stage','shop','profile','journal','data']){
   const {p,context}=await pageFor(w);
   await openDialog(p,kind);
   const d=await state(p);
   report.screens.push({width:w,kind,state:d});
   check(kind+' dialog present and styled @'+w,d.modalVisible&&d.style&&d.modalBorder==='20px'||d.modalVisible&&d.style&&d.modalBorder==='18px',d);
   check(kind+' dialog within viewport @'+w,!!d.modalRect&&d.modalRect[0]>=0&&d.modalRect[0]+d.modalRect[2]<=w+2&&d.scrollWidth<=d.clientWidth+2,{rect:d.modalRect,scroll:d.scrollWidth,client:d.clientWidth});
   check(kind+' has visible close target @'+w,!!d.closeSize&&d.closeSize[2]>=40&&d.closeSize[3]>=40,{close:d.closeSize});
   if(kind==='topic'){
    check('Lesson and sequential stages retained @'+w,d.stages===3&&d.locked===2&&d.lessonBg==='rgb(244, 250, 246)',d);
    check('Stage card design applies @'+w,parseFloat(d.stageRadius)>=13,d);
   }
   if(kind==='stage'){
    check('Practice questions and answer choices preserved @'+w,d.answers===4&&d.questionText?.length>4&&d.answerHeight>=56,d);
    check('Practice progress indicator present @'+w,/0\s*\/\s*5/.test(d.progressText||''),d);
   }
   if(kind==='shop'){
    check('All shop tabs and products retained @'+w,d.shopTabs>=12&&d.shopCards>=3,d);
    const result=await p.evaluate(()=>{
     const t=[...document.querySelectorAll('#modal button.shop-tab')].find(x=>/Питомцы/.test(x.innerText));
     if(!t)return{found:false};
     t.click();
     return{found:true,active:document.querySelector('#modal button.shop-tab.active')?.innerText,shopCards:document.querySelectorAll('#modal .shop-card').length};
    });
    check('Pet shop category switches without checkout @'+w,result.found&&/Питомцы/.test(result.active||''),result);
   }
   if(kind==='profile'){
    check('Profile management has controls @'+w,d.profileRows>=1&&!!d.profilePreview&&!!d.name,d);
   }
   if(kind==='data')check('Backup screen retains download actions @'+w,d.backups>=2,d);
   if(kind==='journal')check('Journal opens @'+w,d.text.includes('Журнал'),d);
   if([390,1280].includes(w)&&['topic','stage','shop','profile'].includes(kind)){
    await p.screenshot({path:'audits/ui19c3_after_'+kind+'_'+w+'.png',fullPage:false});
   }
   // close only for non-running practice; active exercise must retain current attempt.
   if(kind!=='stage'){
    const before=await p.evaluate(()=>!!document.querySelector('#modal'));
    await p.evaluate(()=>document.querySelector('#modal .mtop .x')?.click());
    const after=await p.evaluate(()=>{const m=document.querySelector('#modal');return !!m&&getComputedStyle(m).display!=='none'&&m.getBoundingClientRect().width>0});
    check(kind+' close works @'+w,before&&!after,{before,after});
   }
   await context.close();
  }
 }
 const {p,context}=await pageFor(1280);
 await openDialog(p,'topic');
 await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 const motion=await p.evaluate(()=>getComputedStyle(document.querySelector('#modal button.stage-card')).transitionDuration);
 check('Reduced motion on stage cards',motion==='0s',motion);
 await context.close();
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19c3_test_report.json',JSON.stringify(report,null,2)+'\n');
 const failures=report.checks.filter(x=>!x.pass);
 console.log(JSON.stringify({sha,checks:report.checks.length,passed:report.checks.length-failures.length,failures,errors:report.errors},null,2));
 if(failures.length||report.errors.length)process.exitCode=1;
}
