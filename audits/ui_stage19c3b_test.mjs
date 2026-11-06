import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v61')||!sw.includes(sha))throw Error('v61 cache mismatch');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href,report={sha,checks:[],errors:[],screens:[]};
const check=(name,pass,detail)=>report.checks.push({name,pass:!!pass,detail:detail??null});
async function fresh(w){const context=await browser.createBrowserContext(),p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));await p.setViewport({width:w,height:900,isMobile:w<=600,hasTouch:w<=600});await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});return{context,p}}
async function click(p,selector){await p.evaluate(s=>{const e=document.querySelector(s);if(!e)throw Error('Missing '+s);e.click()},selector)}
async function open(p,kind,w){
 if(['topic','stage'].includes(kind)){await click(p,'.grade-grid>.grade-card:first-child button.btn.primary');await click(p,'#mainView .topic');if(kind==='stage')await click(p,'#modal button.stage-card:not(.locked):not(:disabled)')}
 else{if(w<=600)await click(p,'.mk-ui19-nav-toggle');await click(p,{shop:'.shop-pill',profile:'.profile-pill',journal:'.report-pill'}[kind]);}
}
async function computed(p){
 return p.evaluate(()=>{
  const by=s=>document.querySelector(s),r=e=>{const x=e?.getBoundingClientRect();return x&&[Math.round(x.x),Math.round(x.y),Math.round(x.width),Math.round(x.height)]},
    visible=e=>e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>8;
  const d=by('.mk872-training-dialog'),h=by('.mk872-help-dialog'),m=by('#modal');
  return {style:!!by('#mk-ui19c3b-final-screens'),viewport:innerWidth,bodyWidth:document.documentElement.scrollWidth,
    modal: r(m),modalClientWidth:m?.clientWidth,modalScrollWidth:m?.scrollWidth,
    preview:r(by('#modal .profile-preview')),previewInfo:r(by('#modal .profile-preview-info')),
    avatar:r(by('#modal .profile-preview .avatar-badge.large')),
    collectionCount:document.querySelectorAll('#modal .mk872-col-count').length,
    collectionActive:by('#modal .mk872-col-count.active')?.innerText?.trim(),
    chest:r(by('#modal .mk861-chest-card')),chestText:by('#modal .mk861-chest-page')?.innerText.replace(/\s+/g,' ').slice(0,650),
    chestButton:r(by('#modal .mk861-chest-actions .btn')),
    result:r(by('#modal .block-result')),resultText:by('#modal .block-result')?.innerText.replace(/\s+/g,' ').slice(0,750),
    reportEmpty:r(by('#modal .report-empty')),
    resumeVisible:visible(d),resume:r(by('.mk872-training-panel')),resumeButtons:[...document.querySelectorAll('.mk872-training-panel button')].map(e=>({name:e.innerText,rect:r(e)})),
    helpVisible:visible(h),help:r(h),helpClose:r(by('.mk872-help-close')),
    questionCount:document.querySelectorAll('#modal button.answer').length,
    currentText:m?.innerText.replace(/\s+/g,' ').slice(0,380)
  };
 });
}
async function finishQuiz(p,w){
 await open(p,'stage',w);
 for(let step=0;step<6;step++){
  let found=false;
  for(let attempt=0;attempt<5;attempt++){
   const a=await p.evaluate(()=>{
    const n=document.querySelector('#quizNext');if(n&&getComputedStyle(n).display!=='none')return{state:'next'};
    const a=[...document.querySelectorAll('#modal button.answer')].find(e=>!e.disabled&&!e.classList.contains('bad')&&e.getBoundingClientRect().width>0);
    if(!a)return{state:'none'};
    a.click();const next=document.querySelector('#quizNext');
    return{state:next&&getComputedStyle(next).display!=='none'?'next':'retry',feedback:document.querySelector('#qfb')?.innerText.slice(0,150)};
   });
   if(a.state==='next'){found=true;break}
   if(a.state==='none')break;
  }
  if(!found)break;
  const advanced=await p.evaluate(()=>{const n=document.querySelector('#quizNext');if(n&&!n.disabled&&getComputedStyle(n).display!=='none'){n.click();return true}return false});
  if(!advanced)break;
 }
}
try{
 for(const w of [390,768,1280]){
  for(const kind of ['collection','chests','help','resume','result','journal']){
   const {p,context}=await fresh(w);
   if(kind==='collection'){
    await open(p,'profile',w);
    await p.evaluate(()=>{const b=[...document.querySelectorAll('#modal button')].find(x=>/Моя коллекция/.test(x.innerText));if(!b)throw Error('No collection button');b.click()});
   }else if(kind==='chests'||kind==='help'){
    await open(p,'shop',w);
    if(kind==='chests')await p.evaluate(()=>[...document.querySelectorAll('#modal button.shop-tab')].find(x=>/Сундуки/.test(x.innerText))?.click());
    else await click(p,'#modal .mk872-help-trigger');
   }else if(kind==='resume'){
    await open(p,'stage',w);await click(p,'#modal .mtop button.x');await p.reload({waitUntil:'domcontentloaded',timeout:120000});
   }else if(kind==='result')await finishQuiz(p,w);
   else await open(p,'journal',w);
   const d=await computed(p);
   report.screens.push({kind,width:w,state:d});
   check(kind+' v61 style applied at '+w,d.style,d);
   check(kind+' document fits at '+w,d.bodyWidth<=w+2,{w,scroll:d.bodyWidth});
   if(kind!=='resume'&&kind!=='help')check(kind+' visible modal at '+w,!!d.modal&&d.modal[0]>=0&&d.modal[0]+d.modal[2]<=w+2,d);
   if(kind==='collection'){
    check('All collection categories still present at '+w,d.collectionCount>=10&&!!d.preview,d);
    check('Collection avatar not too small at '+w,!!d.avatar&&d.avatar[2]>=60&&d.avatar[3]>=60,d);
    if(w===390)check('Mobile profile preview reduced below v60 381px',!!d.preview&&d.preview[3]<=350,{before:381,after:d.preview?.[3]});
    // Preserve original navigation and active state.
    const next=await p.evaluate(()=>{const b=[...document.querySelectorAll('#modal button.mk872-col-count')].find(x=>/Питомцы/.test(x.innerText));if(!b)return false;b.click();return !!document.querySelector('#modal .mk872-col-count.active')});
    check('Collection category switch works at '+w,next);
   }
   if(kind==='chests'){
    check('Chest price and probability display remains intact at '+w,!!d.chest&&/200/.test(d.chestText||'')&&/70%/.test(d.chestText||'')&&/25%/.test(d.chestText||'')&&/5%/.test(d.chestText||''),d);
    check('Chest disabled purchase control retained at '+w,!!d.chestButton&&d.chestButton[3]>=43,d);
   }
   if(kind==='help'){
    check('Nested help dialog accessible at '+w,d.helpVisible&&!!d.helpClose&&d.helpClose[2]>=42&&d.helpClose[3]>=42,d);
    await click(p,'.mk872-help-close');
    const closed=await computed(p);check('Help closes and restores store at '+w,!closed.helpVisible&&!!closed.modal,closed);
   }
   if(kind==='resume'){
    check('Resume dialog offers all three choices at '+w,d.resumeVisible&&d.resumeButtons.length===3&&d.resumeButtons.every(b=>b.rect?.[3]>=44),d);
    const choice=await p.evaluate(()=>{const b=[...document.querySelectorAll('.mk872-training-panel button')].find(x=>/Позже/.test(x.innerText));if(!b)return false;b.click();return true});
    const after=await computed(p);
    check('Later closes resumable attempt dialog at '+w,choice&&!after.resumeVisible,after);
   }
   if(kind==='result'){
    check('Completed quiz result reports scores at '+w,!!d.result&&/С первой|Верно с первой/.test(d.resultText||'')&&/Разбор попытки/.test(d.resultText||''),d);
    const oldText=d.currentText;
    const action=await p.evaluate(()=>{const b=[...document.querySelectorAll('#modal button')].find(x=>/Разбор попытки/.test(x.innerText));if(!b)return false;b.click();return true});
    const changed=await computed(p);
    check('Attempt review opens without losing result at '+w,action&&changed.currentText!==oldText,{oldText,newText:changed.currentText});
   }
   if(kind==='journal')check('Journal opens with report or empty state at '+w,!!d.reportEmpty||/Журнал/.test(d.currentText),d);
   if([390,1280].includes(w)&&['collection','chests','resume','result','help'].includes(kind))await p.screenshot({path:'audits/ui19c3b_after_'+kind+'_'+w+'.png',fullPage:false});
   await context.close();
  }
 }
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19c3b_test_report.json',JSON.stringify(report,null,2)+'\n');
 const fail=report.checks.filter(x=>!x.pass);
 console.log(JSON.stringify({sha,checks:report.checks.length,passed:report.checks.length-fail.length,failures:fail,errors:report.errors},null,2));
 if(fail.length||report.errors.length)process.exitCode=1;
}
