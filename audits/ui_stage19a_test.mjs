import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
const hash=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v56')||!sw.includes(hash))throw Error('v56 service worker SHA mismatch');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const report={version:'v56',sha,tests:[],pageErrors:[],deeperNavigation:[]};
const check=(name,result,detail)=>report.tests.push({name,pass:!!result,detail:detail??null});
const url=pathToFileURL(path.resolve('index.html')).href;
async function pageFor(width){
 const p=await browser.newPage();p.on('pageerror',e=>report.pageErrors.push(String(e)));
 await p.setViewport({width,height:900,isMobile:width===390,hasTouch:width===390});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});return p;
}
try{
 for(const width of [390,1280]){
  let page=await pageFor(width);
  const initial=await page.evaluate(()=>{
    return {grades:document.querySelectorAll('.grade-grid > .grade-card').length,
      gradeSingles:[...document.querySelectorAll('.grade-grid > .grade-card:not(.g7-card)')].map(e=>e.querySelectorAll('button,a,input').length),
      quicks:document.querySelectorAll('.quick-home .quick-card').length,
      style:!!document.getElementById('mk-ui19a-styles'),script:!!document.getElementById('mk-ui19a-card-interaction')};
  });
  check('All 8 grade cards and 4 home quick cards at '+width,initial.grades===8&&initial.quicks===4,initial);
  check('Only one native action in each 1-6 grade card at '+width,initial.gradeSingles.length===6&&initial.gradeSingles.every(n=>n===1));
  check('Stage19A style and behavior loaded at '+width,initial.style&&initial.script);
  await page.close();
  for(let grade=1;grade<=8;grade++){
   page=await pageFor(width);
   const result=await page.evaluate(grade=>{
     const card=[...document.querySelectorAll('.grade-grid > .grade-card')][grade-1];
     if(!card)throw Error('Missing grade card');
     const button=card.querySelector('button.btn.primary');
     if(!button)throw Error('No class CTA for grade '+grade);
     const beforeMain=document.getElementById('mainView').innerHTML.length;
     const parentText=card.querySelector('h2')?.textContent||'';
     let activations=0;
     button.addEventListener('click',()=>activations++,{capture:true});
     const clickTarget=card.querySelector('h2')||card.querySelector('.grade-ico')||card;
     clickTarget.click();
     const gradeGridGone=!document.querySelector('.grade-grid')||getComputedStyle(document.querySelector('.grade-grid')).display==='none';
     const mainText=document.getElementById('mainView').textContent.replace(/\s+/g,' ').slice(0,230);
     const topics=[...document.querySelectorAll('.topic,.stage-card,.elementary-topic,.g7-topic,.g6-topic')].filter(e=>e.getBoundingClientRect().width>1).slice(0,10).map(e=>({className:String(e.className),text:e.textContent.replace(/\s+/g,' ').slice(0,85),actions:e.querySelectorAll('button,a,[role="button"]').length,role:e.getAttribute('role'),cursor:getComputedStyle(e).cursor}));
     return {grade,activations,gradeGridGone,mainText,topicCards:topics,parentText,beforeMain,afterMain:document.getElementById('mainView').innerHTML.length};
   },grade);
   check('Click grade '+grade+' background transitions exactly once at '+width,grade<=6?result.activations===1&&result.gradeGridGone:result.gradeGridGone,result);
   if(width===1280)report.deeperNavigation.push({grade,topics:result.topicCards});
   if(grade===1||grade===6)await page.screenshot({path:'audits/ui_stage19a_grade'+grade+'_'+width+'.png'});
   await page.close();
  }
  page=await pageFor(width);
  const quicks=await page.evaluate(()=>{
   const cards=[...document.querySelectorAll('.quick-home .quick-card')];let res=[];
   cards.forEach((card,i)=>{
     const btn=card.querySelector('button');const title=card.querySelector('h2,h3,strong');
     let n=0;btn?.addEventListener('click',()=>n++,{capture:true});
     (title||card.firstElementChild||card).click();
     res.push({i,clicks:n,text:(title||card).textContent.slice(0,80)});
   });
   return res;
  });
  check('Four home quick practice cards activate native CTA once at '+width,quicks.length===4&&quicks.every(q=>q.clicks===1),quicks);
  await page.close();
  page=await pageFor(width);
  const safety=await page.evaluate(()=>{
    const card=document.querySelector('.grade-grid > .grade-card:not(.g7-card)');
    const primary=card.querySelector('button');let launches=0;
    primary.addEventListener('click',()=>launches++,{capture:true});
    const fake=document.createElement('button');fake.textContent='Other action';card.appendChild(fake);
    card.querySelector('h2').click();
    const withTwo=launches;
    fake.remove();primary.click();
    return {withTwo,afterNative:launches};
  });
  check('Multi-action card background never triggers primary at '+width,safety.withTwo===0&&safety.afterNative===1,safety);
  await page.close();
  page=await pageFor(width);
  await page.focus('.grade-grid > .grade-card:first-child button');
  const focus=await page.evaluate(()=>{
    const card=document.querySelector('.grade-grid>.grade-card'),btn=card.querySelector('button');
    return {outline:getComputedStyle(card).outlineStyle,outlineWidth:getComputedStyle(card).outlineWidth,focus:document.activeElement===btn,
      cardTabindex:card.hasAttribute('tabindex'),cursor:getComputedStyle(card).cursor};
  });
  check('Keyboard CTA has focus-visible card ring and no duplicate tab stop at '+width,focus.focus&&!focus.cardTabindex&&focus.outline==='solid'&&focus.cursor==='pointer',focus);
  await page.keyboard.press('Enter');
  const keyboard=await page.evaluate(()=>!document.querySelector('.grade-grid'));
  check('Enter on original class CTA works at '+width,keyboard);
  await page.close();
 }
 // motion preferences: CSS must remove animation and lift.
 let p=await pageFor(1280);
 await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 const motion=await p.evaluate(()=>getComputedStyle(document.querySelector('.grade-grid>.grade-card')).transitionDuration);
 check('Reduced-motion cards have no animation',motion==='0s',motion);
 await p.close();
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19a_test_report.json',JSON.stringify(report,null,2)+'\n');
 const failures=report.tests.filter(x=>!x.pass);
 console.log(JSON.stringify({sha,passed:report.tests.length-failures.length,total:report.tests.length,failures,pageErrors:report.pageErrors},null,2));
 if(failures.length||report.pageErrors.length)process.exitCode=1;
}
