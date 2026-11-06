import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v62')||!sw.includes(sha))throw Error('PWA v62 mismatch');
const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href,report={sha,checks:[],errors:[],screens:[]};
const check=(name,pass,detail)=>report.checks.push({name,pass:!!pass,detail:detail??null});
async function fresh(w){
 const context=await browser.createBrowserContext(),p=await context.newPage();
 p.on('pageerror',e=>report.errors.push(String(e)));
 await p.setViewport({width:w,height:900,isMobile:w<=600,hasTouch:w<=600});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 return{context,p};
}
async function state(p){
 return p.evaluate(()=>{
  const root=document.querySelector('#mainView'),head=document.querySelector('.top'),search=document.querySelector('#mk19c4-topic-tools');
  const topics=[...root.querySelectorAll('.topic')],shown=topics.filter(x=>getComputedStyle(x).display!=='none'),buttons=[...search?.querySelectorAll('.mk19c4-course-link')||[]];
  const rect=e=>{const r=e?.getBoundingClientRect();return r&&[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]};
  return {grade:root.querySelector('.grade-hero h1')?.innerText.trim(),width:innerWidth,documentWidth:document.documentElement.scrollWidth,
   head:rect(head),topics:topics.length,shown:shown.length,search:!!search,input:search?.querySelector('input')?.value||'',
   count:search?.querySelector('.mk19c4-count')?.innerText,empty:search?.querySelector('.mk19c4-empty')?.dataset.visible,
   courseButtons:buttons.map(x=>x.innerText),groupTotal:root.querySelectorAll('.g6-group,.g7-course').length,
   groupHidden:root.querySelectorAll('.g6-group.mk19c4-filter-hidden,.g7-course.mk19c4-filter-hidden').length,
   firstVisible:shown[0]?.querySelector('strong')?.innerText,modalVisible:!!document.querySelector('#modal')&&getComputedStyle(document.querySelector('#modal')).display!=='none',
   close:document.querySelector('#modal .mtop .x')?.textContent};
 });
}
try{
 for(const w of [320,390,768,1280]){
  for(let g=1;g<=8;g++){
   const {context,p}=await fresh(w);
   await p.evaluate(grade=>document.querySelectorAll('.grade-grid>.grade-card')[grade-1].querySelector('button.btn.primary').click(),g);
   let d=await state(p);report.screens.push({grade:g,width:w,initial:d});
   const expected=g===3||g>=5;
   check('Grade '+g+' search shown only on long lists at '+w,d.search===expected,{search:d.search,topics:d.topics});
   check('Grade '+g+' has full original content at '+w,d.topics>0&&d.shown===d.topics,d);
   check('Grade '+g+' no horizontal overflow at '+w,d.documentWidth<=w+2,d);
   if(expected){
    const term=await p.evaluate(()=>[...document.querySelectorAll('#mainView .topic')].at(-1)?.querySelector('strong')?.textContent.trim()||'');
    await p.evaluate(text=>{const i=document.querySelector('#mk19c4-topic-tools input');i.value=text;i.dispatchEvent(new Event('input',{bubbles:true}))},term);
    let filtered=await state(p);
    check('Grade '+g+' instantly filters themes at '+w,filtered.shown>=1&&filtered.shown<filtered.topics&&filtered.input===term,filtered);
    check('Grade '+g+' hides empty sections at '+w,filtered.groupTotal===0||filtered.groupHidden>=1,filtered);
    check('Grade '+g+' search status count matches at '+w,filtered.count?.includes(String(filtered.shown))&&filtered.count?.includes(String(filtered.topics)),filtered);
    await p.evaluate(()=>{const i=document.querySelector('#mk19c4-topic-tools input');i.value='zzzz-does-not-exist-19c4';i.dispatchEvent(new Event('input',{bubbles:true}))});
    const zero=await state(p);
    check('Grade '+g+' empty search is accessible at '+w,zero.shown===0&&zero.empty==='true',zero);
    await p.click('#mk19c4-topic-tools .mk19c4-clear');
    const restored=await state(p);
    check('Grade '+g+' clear restores everything at '+w,restored.shown===restored.topics&&restored.empty==='false'&&!restored.input,restored);
    if(g===7||g===8){
      check('Grade '+g+' has 3 course links at '+w,restored.courseButtons.length===3,restored.courseButtons);
      await p.evaluate(()=>{const b=[...document.querySelectorAll('#mk19c4-topic-tools .mk19c4-course-link')].find(x=>/Геометрия/.test(x.innerText));if(!b)throw Error('Geometry course missing');b.click()});
      const afterCourse=await state(p);
      check('Grade '+g+' course shortcut keeps topics visible at '+w,afterCourse.shown===afterCourse.topics,afterCourse);
    }
    if([320,390,1280].includes(w)&&[3,7,8].includes(g))await p.screenshot({path:'audits/ui19c4_after_grade'+g+'_'+w+'.png',fullPage:false});
    if([390,1280].includes(w)&&g===7){
      await p.evaluate(()=>{const i=document.querySelector('#mk19c4-topic-tools input');i.value='геометрия';i.dispatchEvent(new Event('input',{bubbles:true}))});
      await p.screenshot({path:'audits/ui19c4_after_filtered7_'+w+'.png',fullPage:false});
    }
   }
   // Filtering should never replace the app's native topic click handlers.
   const action=await p.evaluate(()=>{
     const topic=[...document.querySelectorAll('#mainView .topic')].find(x=>!x.matches('.locked,.disabled,.soon,.mk19c4-filter-hidden')&&getComputedStyle(x).cursor==='pointer');
     if(!topic)return false;topic.click();return true;
   });
   const afterClick=await state(p);
   check('Grade '+g+' topic still opens its own modal at '+w,action&&afterClick.modalVisible&&!!afterClick.close,afterClick);
   await context.close();
  }
 }
 const {context,p}=await fresh(320);
 const d=await p.evaluate(()=>{
  const e=document.querySelector('.top'),stats=document.querySelector('.top .stats');
  const get=s=>{const x=document.querySelector(s),r=x?.getBoundingClientRect();return r&&[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]};
  return{height:Math.round(e.getBoundingClientRect().height),viewport:innerWidth,scroll:document.documentElement.scrollWidth,
   profile:get('.top .profile-pill'),coins:get('.top .stats>.pill:not(.grade-back):not(.profile-pill):not(.level-pill)'),
   menu:get('.top .mk-ui19-nav-toggle'),xp:get('#mk872TopLevelProgress'),
   statsHeight:Math.round(stats.getBoundingClientRect().height)};
 });
 check('320px header compressed from original 164px',d.height<=135,d);
 check('320px header no overflow',d.scroll<=320,d);
 await p.screenshot({path:'audits/ui19c4_after_home_320.png',fullPage:false});
 await context.close();
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19c4_test_report.json',JSON.stringify(report,null,2)+'\n');
 const fails=report.checks.filter(x=>!x.pass);
 console.log(JSON.stringify({sha,checks:report.checks.length,passed:report.checks.length-fails.length,failures:fails,errors:report.errors},null,2));
 if(fails.length||report.errors.length)process.exitCode=1;
}
