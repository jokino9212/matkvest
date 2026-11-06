import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v59')||!sw.includes(sha))throw Error('PWA fingerprint mismatch for v59');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href,report={sha,tests:[],errors:[],screens:[]};
const check=(name,pass,detail)=>report.tests.push({name,pass:!!pass,detail:detail??null});
async function pageFor(width){
 const p=await browser.newPage();p.on('pageerror',e=>report.errors.push(String(e)));
 await p.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600,deviceScaleFactor:1});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});return p;
}
try{
 for(const width of [390,600,681,768,800,1024,1120,1121,1280,1440]){
  const p=await pageFor(width);
  const d=await p.evaluate(()=>{
   const by=sel=>document.querySelector(sel),style=sel=>getComputedStyle(by(sel));
   const top=by('.top').getBoundingClientRect(),nav=by('.mk-ui19-nav-wrap'),toggle=by('.mk-ui19-nav-toggle'),stats=by('.stats');
   const cards=[...document.querySelectorAll('.grade-grid>.grade-card')];
   const info=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{
     top:Math.round(r.top),left:Math.round(r.left),right:Math.round(r.right),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height),fontSize:s.fontSize,background:s.backgroundColor}};
   const c=cards[0],p=c.querySelector('p'),cta=c.querySelector('button.btn.primary');
   return{width:innerWidth,body:document.documentElement.scrollWidth,top:info(by('.top')),stats:info(stats),gradeCount:cards.length,card:info(c),
     cardHeightMax:Math.max(...cards.map(e=>e.getBoundingClientRect().height)),cardP:info(p),cta:info(cta),
     ctaFocus:cta.tagName==='BUTTON',menuVisible:getComputedStyle(toggle).display!=='none',menuExpanded:toggle.getAttribute('aria-expanded'),
     navVisible:getComputedStyle(nav).display!=='none',navItems:nav.querySelectorAll('.shop-pill,.data-pill,.report-pill,.leader-pill').length,
     levelHidden:getComputedStyle(by('.level-pill')).display==='none',headerRows:[...stats.children].filter(e=>e.getBoundingClientRect().width>0).map(e=>Math.round(e.getBoundingClientRect().top)),
     style:!!by('#mk-ui19c2-layout')};
  });
  report.screens.push({scene:'home',width,d});
  check('v59 class and design elements at '+width,d.gradeCount===8&&d.style&&d.navItems===4,d);
  check('No horizontal overflow at '+width,d.body<=width+2,d);
  check('Class body copy is legible at '+width,parseFloat(d.cardP.fontSize)>=13,d);
  check('Class CTA is touch-friendly and consistent at '+width,d.cta.height>=44&&d.cta.background==='rgb(231, 244, 236)'&&d.ctaFocus,d);
  if(width<=680){
   check('Mobile keeps compact menu and stable header '+width,d.menuVisible&&!d.navVisible&&d.top.height<=130,d);
   check('Mobile card remains usable '+width,d.card.height<=290,d);
  }else if(width<=1120){
   check('Tablet/compact desktop is one-row with collapsed navigation '+width,d.top.height<=86&&d.menuVisible&&!d.navVisible&&d.levelHidden,d);
  }else{
   check('Wide desktop is one-row with full links '+width,d.top.height<=86&&!d.menuVisible&&d.navVisible&&d.levelHidden,d);
  }
  if(width>=1121)check('Compact desktop cards save significant vertical space '+width,d.card.height<=340&&d.cardHeightMax<=340,d);
  if([390,768,1024,1280,1440].includes(width))await p.screenshot({path:'audits/ui19c2_after_home_'+width+'.png',fullPage:false});
  await p.close();
 }
 for(const w of [768,1024]){
  const page=await pageFor(w);
  await page.click('.mk-ui19-nav-toggle');
  let menu=await page.evaluate(()=>{
   const n=document.querySelector('.mk-ui19-nav-wrap'),t=document.querySelector('.mk-ui19-nav-toggle'),r=n.getBoundingClientRect();
   return{open:t.getAttribute('aria-expanded'),display:getComputedStyle(n).display,left:r.left,right:r.right,width:innerWidth,controls:n.querySelectorAll('.shop-pill,.data-pill,.report-pill,.leader-pill').length};
  });
  check('Tablet disclosure opens and stays inside viewport at '+w,menu.open==='true'&&menu.display==='grid'&&menu.right<=w&&menu.left>=0&&menu.controls===4,menu);
  await page.screenshot({path:'audits/ui19c2_after_menu_'+w+'.png',fullPage:false});
  await page.keyboard.press('Escape');
  menu=await page.evaluate(()=>({open:document.querySelector('.mk-ui19-nav-toggle').getAttribute('aria-expanded'),focus:document.activeElement===document.querySelector('.mk-ui19-nav-toggle')}));
  check('Tablet Escape closes and refocuses at '+w,menu.open==='false'&&menu.focus,menu);
  await page.close();
 }
 for(const w of [390,1280]){
  const page=await pageFor(w);
  const g=await page.evaluate(()=>{
    const card=document.querySelector('.grade-grid>.grade-card');
    const btn=card.querySelector('button.btn.primary');let calls=0;btn.addEventListener('click',()=>calls++,{capture:true});
    card.querySelector('h2').click();
    return{calls,intoGrade:!!document.querySelector('#mainView .topic')};
  });
  check('Class background navigates once at '+w,g.calls===1&&g.intoGrade,g);
  const d=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+2,topics:document.querySelectorAll('#mainView .topic').length,nav:document.querySelectorAll('.shop-pill').length}));
  check('Class page intact at '+w,!d.overflow&&d.topics>0&&d.nav===1,d);
  await page.screenshot({path:'audits/ui19c2_after_grade1_'+w+'.png',fullPage:false});
  await page.close();
 }
 const page=await pageFor(1280);
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 const reduce=await page.evaluate(()=>getComputedStyle(document.querySelector('.grade-grid>.grade-card')).transitionDuration);
 check('Reduced motion still respected',reduce==='0s',reduce);
 await page.close();
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19c2_test_report.json',JSON.stringify(report,null,2)+'\n');
 const failed=report.tests.filter(t=>!t.pass);
 console.log(JSON.stringify({sha,checks:report.tests.length,passed:report.tests.length-failed.length,failed,errors:report.errors},null,2));
 if(failed.length||report.errors.length)process.exitCode=1;
}