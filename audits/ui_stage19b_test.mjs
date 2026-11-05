import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v57')||!sw.includes(sha))throw Error('PWA v57 mismatch');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(s=>s&&fs.existsSync(s));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href,report={sha,tests:[],pageErrors:[]};
const check=(name,pass,detail)=>report.tests.push({name,pass:!!pass,detail:detail??null});
const pageFor=async width=>{
 const p=await browser.newPage();
 p.on('pageerror',e=>report.pageErrors.push(String(e)));
 await p.setViewport({width,height:900,isMobile:width<681,deviceScaleFactor:1,hasTouch:width<681});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 return p;
};
try{
 for(const width of [390,600,768,1280]){
  const page=await pageFor(width);
  const state=await page.evaluate(()=>{
    const top=document.querySelector('.top'),stats=top?.querySelector('.stats'),nav=stats?.querySelector('#mk-ui19-navigation'),toggle=stats?.querySelector('button.mk-ui19-nav-toggle');
    const r=top?.getBoundingClientRect();
    const controls=[...nav?.querySelectorAll('.shop-pill,.data-pill,.report-pill,.leader-pill')||[]];
    const coinPills=[...nav?.querySelectorAll('.mk-ui19-secondary-resource')||[]];
    const visible=e=>getComputedStyle(e).display!=='none';
    return {height:Math.round(r.height),width:Math.round(r.width),menuVisible:toggle?visible(toggle):false,
      navDisplay:nav?getComputedStyle(nav).display:null,menuExpanded:toggle?.getAttribute('aria-expanded'),
      navLabels:controls.map(x=>x.textContent.replace(/\s+/g,' ').trim()),controlRoles:controls.map(x=>[x.getAttribute('role'),x.tabIndex]),
      secondaryCurrency:coinPills.length,menuCount:controls.length,hasGradeCards:!!document.querySelector('.grade-grid')};
  });
  check('All 4 original navigation actions preserve role and keyboard semantics at '+width,
    state.menuCount===4&&state.controlRoles.every(([role,tab])=>role==='button'&&tab===0),state);
  if(width<=600){
    check('Mobile uses one compact menu and hides actions at '+width,state.menuVisible&&state.navDisplay==='none'&&state.menuExpanded==='false',state);
    check('Mobile header no longer spans six rows at '+width,state.height<=175,{height:state.height});
    await page.screenshot({path:'audits/ui_stage19b_home_'+width+'.png'});
    await page.click('.mk-ui19-nav-toggle');
    const expanded=await page.evaluate(()=>{
      const s=document.querySelector('.stats'),n=document.getElementById('mk-ui19-navigation'),b=document.querySelector('.mk-ui19-nav-toggle'),r=n.getBoundingClientRect();
      return {attr:b.getAttribute('aria-expanded'),display:getComputedStyle(n).display,rect:{left:r.left,right:r.right,top:r.top,width:r.width,height:r.height},windowWidth:innerWidth,items:[...n.querySelectorAll('.shop-pill,.data-pill,.report-pill,.leader-pill')].map(x=>getComputedStyle(x).display)};
    });
    check('Menu opens as 2-column overlay, never horizontally overflows at '+width,expanded.attr==='true'&&expanded.display==='grid'&&expanded.rect.left>=0&&expanded.rect.right<=width&&expanded.items.every(x=>x!=='none'),expanded);
    await page.screenshot({path:'audits/ui_stage19b_menu_'+width+'.png'});
    await page.keyboard.press('Escape');
    const collapsed=await page.evaluate(()=>({expanded:document.querySelector('.mk-ui19-nav-toggle').getAttribute('aria-expanded'),
      focus:document.activeElement===document.querySelector('.mk-ui19-nav-toggle'),nav:getComputedStyle(document.querySelector('.mk-ui19-nav-wrap')).display}));
    check('Escape closes menu and restores focus at '+width,collapsed.expanded==='false'&&collapsed.focus&&collapsed.nav==='none',collapsed);
  }else{
    check('Desktop/tablet destinations visible and toggle hidden at '+width,!state.menuVisible&&state.navDisplay!=='none',state);
    await page.screenshot({path:'audits/ui_stage19b_home_'+width+'.png'});
  }
  await page.close();
 }
 for(const mode of ['mouse','keyboard']){
  for(const [label,cls] of [['Магазин','shop-pill'],['Данные','data-pill'],['Журнал','report-pill'],['Лидеры','leader-pill']]){
    const page=await pageFor(390);
    const r=await page.evaluate(({mode,cls})=>{
      const menu=document.querySelector('.mk-ui19-nav-toggle');
      menu.click();
      const el=document.querySelector('.mk-ui19-nav-wrap .'+cls);
      let fired=0;el.addEventListener('click',()=>fired++,{capture:true});
      if(mode==='mouse')el.click();
      else {el.focus();el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}))}
      return {fired,closed:menu.getAttribute('aria-expanded')==='false',exists:!!document.querySelector('.stats')};
    },{mode,cls});
    check('Mobile '+label+' action works once via '+mode,r.fired===1&&r.closed,r);
    await page.close();
  }
 }
 // Existing class navigation must still work.
 const page=await pageFor(390);
 await page.evaluate(()=>{
   const card=document.querySelector('.grade-grid > .grade-card');
   card.querySelector('h2').click();
 });
 check('Mobile whole-card grade navigation preserved',await page.evaluate(()=>!document.querySelector('.grade-grid')));
 await page.close();
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19b_test_report.json',JSON.stringify(report,null,2)+'\n');
 const fails=report.tests.filter(t=>!t.pass);
 console.log(JSON.stringify({sha,checks:report.tests.length,passed:report.tests.length-fails.length,failed:fails,pageErrors:report.pageErrors},null,2));
 if(fails.length||report.pageErrors.length)process.exitCode=1;
}
