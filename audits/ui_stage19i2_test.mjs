import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v70')||!sw.includes(sha))throw Error('PWA v70 hash mismatch');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!chrome)throw Error('Chromium executable missing');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const report={version:'v70',sha,checks:[],pageerrors:[],screens:[]};
const check=(name,pass,detail)=>report.checks.push({name,pass:!!pass,detail:pass?undefined:detail});
async function fresh(width){
 const ctx=await browser.createBrowserContext(),p=await ctx.newPage();
 p.on('pageerror',e=>report.pageerrors.push({width,err:String(e)}));
 await p.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 return{ctx,p};
}
const inspect=p=>p.evaluate(()=>{
 const size=selector=>{const e=document.querySelector(selector);if(!e)return null;const s=getComputedStyle(e),r=e.getBoundingClientRect();return{w:r.width,h:r.height,text:(e.textContent||'').replace(/\s+/g,' ').trim().slice(0,55),color:s.color,background:s.backgroundColor,outline:s.outlineStyle,outlineWidth:s.outlineWidth,aria:e.getAttribute('aria-label'),role:e.getAttribute('role'),tabindex:e.tabIndex}};
 return{viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,
    avatar:size('.top .avatar-badge.mk872-viewable[tabindex="0"]'),
    brand:size('.top .brand.mk872-brand-home'),version:size('#appVersionBadge'),
    homeProgress:size('#mainView .mk19f-home-open'),goal:size('#mainView .training-goal-actions button.btn'),
    back:size('#mainView .home-back-btn'),gradeProgress:size('#mainView .mk19f-open-all'),
    course:[...document.querySelectorAll('#mainView .mk19c4-course-link')].map(e=>{const r=e.getBoundingClientRect();return{w:r.width,h:r.height}}),
    title:size('#modal .mtop h2'),close:size('#modal .mtop button.x'),
    help:size('#modal .mk872-help-trigger'),helpClose:size('.mk872-help-dialog button.mk872-help-close'),
    tabs:[...document.querySelectorAll('#modal .shop-tab')].map(e=>{const r=e.getBoundingClientRect();return{h:r.height,w:r.width}}),
    filters:[...document.querySelectorAll('#modal .shop-filter-btn')].map(e=>{const r=e.getBoundingClientRect();return{h:r.height,w:r.width}}),
    modalVisible:!!document.querySelector('#modal')?.getClientRects().length,
    nestedVisible:!!document.querySelector('.mk872-help-dialog')?.getClientRects().length,
    focusInModal:document.querySelector('#modal')?.contains(document.activeElement),
    focusOnTitle:document.activeElement===document.querySelector('#modal .mtop h2'),
    focusOnClose:document.activeElement===document.querySelector('#modal .mtop button.x'),
    focusOnHelp:document.activeElement===document.querySelector('#modal .mk872-help-trigger'),
    focusOnHelpClose:document.activeElement===document.querySelector('.mk872-help-dialog button.mk872-help-close')};
});
const openTopic=p=>p.evaluate(()=>{
 const card=document.querySelectorAll('.grade-grid>.grade-card')[6];
 card?.querySelector('button.btn.primary')?.click();
 const t=[...document.querySelectorAll('#mainView .topic')].find(x=>getComputedStyle(x).cursor==='pointer'&&!x.matches('.locked,.disabled,.soon'));
 if(!t)return false;
 t.click();return true;
});
try{
 for(const w of [320,390,768,1280]){
  const{ctx,p}=await fresh(w);
  let d=await inspect(p);
  check('Home no overflow at '+w,d.pageWidth<=w+2,d);
  check('Home brand target >=44 at '+w,d.brand?.w>=44&&d.brand?.h>=44,d.brand);
  check('Avatar keyboard control has clear accessible name at '+w,
    d.avatar?.aria==='Просмотреть аватар'&&d.avatar?.role==='button'&&d.avatar?.tabindex===0,d.avatar);
  check('Home progress target >=44 at '+w,d.homeProgress?.h>=44,d.homeProgress);
  check('Home training goal target >=44 at '+w,d.goal?.h>=44,d.goal);
  check('Version control target >=24 at '+w,d.version?.h>=24,d.version);
  check('Version label legibility is darkened at '+w,d.version?.color==='rgb(75, 102, 89)',d.version);

  const started=await openTopic(p);
  check('Class 7 topic can open at '+w,started);
  d=await inspect(p);
  check('Grade 7 return button >=44 at '+w,d.back?.h>=44,d.back);
  check('Grade 7 progress button >=44 at '+w,d.gradeProgress?.h>=44,d.gradeProgress);
  check('Grade 7 course shortcuts >=44 at '+w,d.course.length===3&&d.course.every(x=>x.h>=44),d.course);
  check('Dialog close button >=44 at '+w,d.close?.w>=44&&d.close?.h>=44,d.close);
  check('Programmatic heading focus remains inside modal at '+w,d.focusOnTitle&&d.focusInModal,d);
  check('Programmatic dialog title is not drawn as a large focus rectangle at '+w,d.title?.outline==='none',d.title);
  check('Topic layout no overflow at '+w,d.pageWidth<=w+2,d);
  if(w===390||w===1280)await p.screenshot({path:'audits/ui19i2_after_topic_'+w+'.png',fullPage:false});
  await p.keyboard.press('Tab');
  d=await inspect(p);
  check('Actual keyboard tab goes to visible dialog close button at '+w,d.focusOnClose&&d.close?.outline==='solid',d);
  await p.keyboard.press('Escape');
  d=await inspect(p);
  check('Esc from topic closes modal at '+w,!d.modalVisible,d);

  await p.evaluate(()=>openShop('pets'));
  d=await inspect(p);
  check('Shop help target >=44 at '+w,d.help?.w>=44&&d.help?.h>=44,d.help);
  check('Shop tabs >=44 at '+w,d.tabs.length>=4&&d.tabs.every(t=>t.h>=44),d.tabs);
  check('Shop filters >=44 at '+w,d.filters.length>=1&&d.filters.every(t=>t.h>=44),d.filters);
  check('Shop no horizontal overflow at '+w,d.pageWidth<=w+2,d);
  if(w===390||w===1280)await p.screenshot({path:'audits/ui19i2_after_shop_'+w+'.png',fullPage:false});
  await p.click('#modal .mk872-help-trigger');
  d=await inspect(p);
  check('Nested help opens at '+w,d.nestedVisible&&d.focusOnHelpClose,d);
  check('Nested help close >=44 at '+w,d.helpClose?.w>=44&&d.helpClose?.h>=44,d.helpClose);
  await p.keyboard.press('Escape');
  d=await inspect(p);
  check('Esc closes only nested help at '+w,!d.nestedVisible&&d.modalVisible&&d.focusOnHelp,d);
  await p.keyboard.press('Escape');
  d=await inspect(p);
  check('Esc closes shop after nested help at '+w,!d.modalVisible,d);

  await p.evaluate(()=>openCollection());
  d=await inspect(p);
  check('Collection help >=44 at '+w,d.help?.w>=44&&d.help?.h>=44,d.help);
  check('Collection no horizontal overflow at '+w,d.pageWidth<=w+2,d);
  await p.keyboard.press('Escape');

  // Test CSS text scaling without reloading or changing app data.
  await p.evaluate(()=>{const e=document.querySelector('html');e.style.fontSize='125%'});
  await p.evaluate(()=>openProfiles());
  d=await inspect(p);
  check('125% font-size profile remains without document overflow at '+w,d.pageWidth<=w+2,d);
  check('Profile close still >=44 with increased font at '+w,d.close?.h>=44,d.close);
  await p.keyboard.press('Escape');

  // Confirm operational learning dialogs have not been overridden.
  const quiz=await p.evaluate(()=>{startQuizStage('numbers',0);return !!document.querySelector('#quizSkip')});
  check('Learning quiz still starts at '+w,quiz);
  if(quiz){
    await p.click('#quizSkip');
    const popup=await p.evaluate(()=>!!document.querySelector('.mk872-training-dialog'));
    check('Irreversible skip still uses 19H confirmation at '+w,popup);
    await p.keyboard.press('Escape');
    const returned=await p.evaluate(()=>!document.querySelector('.mk872-training-dialog')&&!!document.querySelector('#quizSkip'));
    check('Escape cancels skip without leaving quiz at '+w,returned);
  }
  report.screens.push({width:w,ok:true});
  await ctx.close();
 }
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19i2_test_report.json',JSON.stringify(report,null,2)+'\n');
 const failed=report.checks.filter(x=>!x.pass);
 console.log('UI19I2 v70 '+JSON.stringify({sha,pass:report.checks.length-failed.length,total:report.checks.length,failed,pageerrors:report.pageerrors,screens:report.screens},null,2).slice(0,26000));
 if(failed.length||report.pageerrors.length)process.exitCode=1;
}
