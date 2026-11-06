import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');if(!sw.includes('matkvest-iphone-v66')||!sw.includes(sha))throw Error('v66 PWA SHA mismatch');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;const report={sha,checks:[],errors:[],evidence:[]};
const check=(name,pass,detail)=>report.checks.push({name,pass:!!pass,detail:detail??null});
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
async function fresh(w){
 const ctx=await browser.createBrowserContext(),p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(String(e)));
 await p.setViewport({width:w,height:900,isMobile:w<=600,hasTouch:w<=600});await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});return{ctx,p};
}
async function state(p){
 return p.evaluate(()=>{
  const modal=document.querySelector('#mk19fProgress'),strip=document.querySelector('#mk19f-grade-strip'),view=document.querySelector('#mainView');
  const rect=e=>{const b=e?.getBoundingClientRect();return b&&[Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]};
  const stats=[...modal?.querySelectorAll('.mk19f-grade-row')||[]].map(x=>({text:x.textContent.replace(/\s+/g,' ').slice(0,170),bar:x.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'),max:x.querySelector('[role="progressbar"]')?.getAttribute('aria-valuemax')}));
  return{url:location.href,bodyWidth:document.documentElement.scrollWidth,w:innerWidth,
    strip:!!strip,stripGrade:Number(strip?.dataset.grade),stripText:clean(strip?.textContent),stripBox:rect(strip),
    stripBar:strip?.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'),
    stripBarMax:strip?.querySelector('[role="progressbar"]')?.getAttribute('aria-valuemax'),
    homeButton:!!view.querySelector('.home-start .mk19f-home-open'),
    modal:!!modal,modalBox:rect(modal),modalText:clean(modal?.textContent).slice(0,1400),
    gradeRows:stats,overall:modal?.querySelector('.mk19f-overall')?.textContent.replace(/\s+/g,' ').trim(),
    xp:modal?.querySelector('.mk19f-xp-summary')?.textContent.replace(/\s+/g,' ').trim(),
    xpBar:modal?.querySelector('.mk19f-xp-summary [role="progressbar"]')?.getAttribute('aria-valuenow'),
    xpMax:modal?.querySelector('.mk19f-xp-summary [role="progressbar"]')?.getAttribute('aria-valuemax'),
    levelPill:{role:document.querySelector('.top .level-pill')?.getAttribute('role'),tabindex:document.querySelector('.top .level-pill')?.getAttribute('tabindex')},
    gradeHeader:view.querySelector('.grade-hero h1')?.textContent.trim()||null};
 });
}
try{
 for(const w of [320,390,768,1280]){
  const {ctx,p}=await fresh(w);
  let s=await state(p);
  check('Home progress shortcut present at '+w,s.homeButton&&!s.strip,s);
  check('Level pill accessible as progress action at '+w,s.levelPill.role==='button'&&s.levelPill.tabindex==='0',s.levelPill);
  check('Home layout fits width '+w,s.bodyWidth<=w+2,s);
  await p.click('.home-start .mk19f-home-open');
  s=await state(p);
  check('Overview opens all 8 grade rows at '+w,s.modal&&s.gradeRows.length===8&&s.gradeRows.every(g=>g.bar==='0'),s);
  check('Overview shows exact baseline 1221 stages at '+w,s.overall?.includes('1 221')&&s.xp?.includes('115'),{overall:s.overall,xp:s.xp});
  check('Overview XP bar uses same 115-XP first level at '+w,s.xpBar==='0'&&s.xpMax==='115',s);
  check('Overview fits width '+w,s.bodyWidth<=w+2,s);
  if([320,390,1280].includes(w))await p.screenshot({path:'audits/ui19f_after_overview_'+w+'.png',fullPage:false});
  await p.evaluate(()=>closeModal());
  await p.evaluate(()=>document.querySelector('.top .level-pill').click());
  s=await state(p);
  check('Existing level pill opens overview at '+w,s.modal&&s.gradeRows.length===8,s);
  await p.evaluate(()=>closeModal());
  await p.evaluate(()=>document.querySelector('.top .level-pill').focus());
  await p.keyboard.press('Enter');
  s=await state(p);
  check('Enter on level pill opens progress at '+w,s.modal,s);
  await p.evaluate(()=>closeModal());
  const defaults=[];
  for(let g=1;g<=8;g++){
   await p.evaluate(g=>openGrade(g),g);
   s=await state(p);
   const expected=await p.evaluate(g=>teacherCourseProgress(state,g),g);
   defaults.push({grade:g,total:expected.total,done:expected.done});
   check('Grade '+g+' has its own progress strip at '+w,s.strip&&s.stripGrade===g&&s.stripBar===String(expected.done)&&s.stripBarMax===String(expected.total),{strip:s.stripText,expected});
   check('Grade '+g+' no horizontal overflow at '+w,s.bodyWidth<=w+2,s);
   check('Grade '+g+' keeps native class header at '+w,s.gradeHeader?.includes(g+' класса'),s.gradeHeader);
   if([390,1280].includes(w)&&[1,7,8].includes(g))await p.screenshot({path:'audits/ui19f_after_grade'+g+'_'+w+'.png',fullPage:false});
   if(g===7){
    await p.click('#mk19f-grade-strip .mk19f-open-all');
    const d=await state(p);
    check('Grade 7 opens overview with own stage totals at '+w,d.modal&&d.gradeRows[6].max==='321',d.gradeRows[6]);
    await p.evaluate(()=>document.querySelector('#mk19fProgress .mk19f-grade-row:last-child button').click());
    const reached=await state(p);
    check('Overview navigation closes modal and opens Grade 8 at '+w,!reached.modal&&reached.stripGrade===8&&reached.gradeHeader?.includes('8 класса'),reached);
   }
  }
  report.evidence.push({width:w,baseline:defaults});
  await ctx.close();
 }
 // Exact XP threshold boundaries; no new curve and no changed XP.
 {
  const {ctx,p}=await fresh(390);
  const thresholds=await p.evaluate(()=>{
   const xs=[0,114,115,259,260,500,2500];
   const before=JSON.stringify({xp:state.xp,coins:state.coins,history:state.attemptHistory,cp:state.courseProgress});
   const values=xs.map(xp=>{const m=mk19fProgressMetrics({...state,xp});return{xp,level:m.level.currentLevel,start:m.level.currentLevelStartXP,next:m.level.nextLevelXP,remaining:m.level.xpRemaining}});
   const after=JSON.stringify({xp:state.xp,coins:state.coins,history:state.attemptHistory,cp:state.courseProgress});
   return{values,unchanged:before===after};
  });
  const v=thresholds.values;
  check('XP level boundary 114/115 exact',v[1].level===1&&v[1].remaining===1&&v[2].level===2&&v[2].next===260,thresholds);
  check('XP level boundary 259/260 exact',v[3].level===2&&v[3].remaining===1&&v[4].level===3&&v[4].start===260,thresholds);
  check('Reading XP across boundary does not change active profile',thresholds.unchanged);
  await ctx.close();
 }
 // Profile-isolated stage counts and live update after a completed stage, no unlock logic modification.
 {
  const {ctx,p}=await fresh(390);
  await p.evaluate(()=>openGrade(7));
  const before=await p.evaluate(()=>{
   const g=teacherGradeTopicKeys(7),key=g[0],canonical=courseKey(key);
   const initial=mk19fProgressMetrics(state);
   const original=JSON.stringify({xp:state.xp,coins:state.coins,cp:state.courseProgress,attempts:state.attemptHistory});
   return{key,canonical,initialDone:initial.grades[6].done,initialXP:initial.level.totalXP,original};
  });
  check('Grade 7 exposes a real course progress key',!!before.key&&!!before.canonical,before);
  const after=await p.evaluate(({canonical})=>{
   state.courseProgress[canonical]={best:[4,0,0],bonus:[false,false,false]};
   const own=mk19fProgressMetrics(state),other=mk19fProgressMetrics({...state,courseProgress:{}});
   stats();
   const shown=document.querySelector('#mk19f-grade-strip')?.textContent.replace(/\s+/g,' ').trim();
   return{done:own.grades[6].done,warmup:own.grades[6].warmup,other:other.grades[6].done,
     displayed:shown,total:own.grades[6].total,balance:state.coins,xp:state.xp};
  },{canonical:before.canonical});
  check('Passed warmup stage increments Grade 7 without editing grading logic',after.done===before.initialDone+1&&after.warmup===1,after);
  check('Progress changes update active Grade 7 strip after stats()',after.displayed?.includes('1 из 321')&&after.displayed?.includes('Разминка: 1'),after);
  check('Another profile has separate progress values',after.other===0,after);
  check('Stage progress reporting does not award XP or coins',after.balance===0&&after.xp===before.initialXP,after);
  await ctx.close();
 }
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19f_test_report.json',JSON.stringify(report,null,2)+'\n');
 const fail=report.checks.filter(x=>!x.pass);
 console.log(JSON.stringify({sha,checks:report.checks.length,passed:report.checks.length-fail.length,failed:fail,errors:report.errors},null,2).slice(0,18000));
 if(fail.length||report.errors.length)process.exitCode=1;
}
