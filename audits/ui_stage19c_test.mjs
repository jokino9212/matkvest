import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
const html=fs.readFileSync('index.html');
const sha=createHash('sha256').update(html).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v58')||!sw.includes(sha))throw Error('v58 PWA mismatch');
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(s=>s&&fs.existsSync(s));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const report={sha,tests:[],pageErrors:[],screens:[]};
function test(name,pass,detail){report.tests.push({name,pass:!!pass,detail:detail??null})}
async function pageFor(w){
 const p=await browser.newPage();
 p.on('pageerror',e=>report.pageErrors.push(String(e)));
 await p.setViewport({width:w,height:900,isMobile:w<=600,hasTouch:w<=600});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});return p;
}
async function screen(p,file){await p.screenshot({path:'audits/ui19c_after_'+file+'.png',fullPage:false})}
try{
 for(const w of [390,600,768,1280,1440]){
  const p=await pageFor(w);
  const state=await p.evaluate(()=>{
   const s=e=>e&&getComputedStyle(e),c=document.querySelector('.grade-grid>.grade-card'),q=document.querySelector('.quick-home .quick-card'),
     b=c?.querySelector('.btn.primary'),menu=document.querySelector('.mk-ui19-nav-toggle'),v=getComputedStyle(document.documentElement);
   return{viewport:innerWidth,docWidth:document.documentElement.scrollWidth,gradeCount:document.querySelectorAll('.grade-grid>.grade-card').length,
    quickCount:document.querySelectorAll('.quick-home .quick-card').length,
    css:!!document.getElementById('mk-ui19c-design-system'),keyboard:!!document.getElementById('mk-ui19c-topic-keyboard'),
    token:v.getPropertyValue('--mk19c-brand').trim(),cardRadius:s(c)?.borderRadius,
    cardBorder:s(c)?.borderColor,cardShadow:s(c)?.boxShadow,quickShadow:s(q)?.boxShadow,
    buttonMinHeight:s(b)?.minHeight,buttonFont:s(b)?.fontSize,buttonBg:s(b)?.backgroundColor,
    headerHeight:Math.round(document.querySelector('.top').getBoundingClientRect().height),
    mobileMenu:menu&&s(menu).display!=='none',bodyBg:s(document.body)?.backgroundColor};
  });
  report.screens.push({name:'home',width:w,state});
  test('Home components have complete 19C styles at '+w,state.css&&state.keyboard&&state.gradeCount===8&&state.quickCount===4&&state.token==='#176b54',state);
  test('No horizontal overflow at '+w,state.docWidth<=w+2,{doc:state.docWidth});
  test('Home CTA readable and at least 44px at '+w,parseFloat(state.buttonMinHeight)>=44&&parseFloat(state.buttonFont)>=14,state);
  test('Home card and quick surfaces share a shadow at '+w,state.cardShadow.includes('rgba')&&state.quickShadow.includes('rgba'),{card:state.cardShadow,quick:state.quickShadow});
  test('Responsive header keeps mobile disclosure at '+w,state.mobileMenu===(w<=600)&&state.headerHeight<=175,{mobile:state.mobileMenu,height:state.headerHeight});
  if([390,1280].includes(w))await screen(p,'home_'+w);
  await p.close();
 }
 for(const w of [390,1280]){
  for(const g of [1,2,3,4,5,6,7,8]){
   const p=await pageFor(w);
   await p.evaluate(grade=>document.querySelectorAll('.grade-grid>.grade-card')[grade-1].querySelector('button.btn.primary').click(),g);
   const state=await p.evaluate(()=>{
    const els=[...document.querySelectorAll('#mainView .topic')];
    const enabled=els.filter(e=>!e.matches('.soon,.locked,.disabled,[aria-disabled="true"]')&&getComputedStyle(e).cursor==='pointer');
    const first=enabled[0],st=first&&getComputedStyle(first);
    return{count:els.length,enabled:enabled.length,keyboardCount:enabled.filter(e=>e.getAttribute('role')==='button'&&e.tabIndex===0).length,
      firstBg:st?.backgroundColor,firstBorder:st?.borderColor,firstShadow:st?.boxShadow,
      firstClass:first?.className,docWidth:document.documentElement.scrollWidth,viewport:innerWidth,
      group:document.querySelectorAll('.g6-group').length};
   });
   test('Grade '+g+' has focusable enabled topic cards at '+w,state.enabled>0&&state.keyboardCount===state.enabled,state);
   test('Grade '+g+' topics fit viewport at '+w,state.docWidth<=w+2,state);
   if(g===7||g===8)test('G7/G8 topic has solid card surface at '+w,state.firstBg==='rgb(255, 255, 255)',state);
   if(g===6&&w===390)await screen(p,'grade6_390');
   if(g===7&&w===1280)await screen(p,'grade7_1280');
   if(g===8&&w===1280)await screen(p,'grade8_1280');
   await p.close();
  }
 }
 for(const g of [1,6,7,8]){
  const p=await pageFor(1280);
  await p.evaluate(grade=>document.querySelectorAll('.grade-grid>.grade-card')[grade-1].querySelector('button.btn.primary').click(),g);
  const initial=await p.evaluate(()=>{
   const t=document.querySelector('#mainView .topic[role="button"]'); if(!t)return null;
   window.__topicClickCount=0;t.addEventListener('click',()=>window.__topicClickCount++,{capture:true});
   t.focus();return{focus:document.activeElement===t,mainBefore:document.getElementById('mainView').innerHTML.length};
  });
  await p.keyboard.press('Enter');
  const after=await p.evaluate(()=>({clicked:window.__topicClickCount,mainText:document.getElementById('mainView').textContent.slice(0,100)}));
  test('Topic keyboard Enter activates exactly once in grade '+g,initial?.focus&&after.clicked===1,{initial,after});
  await p.close();
 }
 const p=await pageFor(1280);
 await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 test('Reduced motion disables card transition',await p.evaluate(()=>getComputedStyle(document.querySelector('.grade-grid>.grade-card')).transitionDuration==='0s'));
 await p.close();
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19c_test_report.json',JSON.stringify(report,null,2)+'\n');
 const fails=report.tests.filter(x=>!x.pass);
 console.log(JSON.stringify({sha,checks:report.tests.length,pass:report.tests.length-fails.length,failures:fails,pageErrors:report.pageErrors},null,2));
 if(fails.length||report.pageErrors.length)process.exitCode=1;
}
