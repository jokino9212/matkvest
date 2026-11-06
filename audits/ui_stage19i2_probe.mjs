import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const expected='9f2f50a7e49653e6bfcb62de22402e6948ee1c3a642ffb80c0f25e4d3d4d55d1';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(sha!==expected||!sw.includes('matkvest-iphone-v69')||!sw.includes(sha))throw Error('Requires verified v69');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const record={stage:'19I/2',version:'v69',sha,widths:[320,390,768,1280],scenes:[],errors:[],testChecks:[]};
const check=(name,pass,detail)=>record.testChecks.push({name,pass:!!pass,detail:pass?undefined:detail});
const measure=p=>p.evaluate(()=>{
  const visible=e=>!!e?.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
  const dims=e=>{const r=e.getBoundingClientRect();return[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]};
  const desc=e=>{const s=getComputedStyle(e);return {id:e.id,tag:e.tagName,cls:String(e.className||'').slice(0,125),text:(e.innerText||e.textContent||'').replace(/\s+/g,' ').slice(0,90),rect:dims(e),bg:s.backgroundColor,fg:s.color,outline:s.outline,role:e.getAttribute('role'),aria:e.getAttribute('aria-label'),tabindex:e.tabIndex,parent:String(e.parentElement?.className||'').slice(0,75)}};
  const candidates=[...document.querySelectorAll('button,a,[role="button"],[tabindex="0"],[onclick]')].filter(visible);
  const tiny=candidates.filter(e=>{const r=e.getBoundingClientRect();return r.width<44||r.height<44}).slice(0,60).map(desc);
  const nav=document.querySelector('.mk-ui19-nav-toggle'),modal=document.querySelector('#modal');
  return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    active:desc(document.activeElement),tiny,nav:nav&&desc(nav),
    modal:visible(modal)?{rect:dims(modal),role:modal.getAttribute('role'),title:modal.querySelector('.mtop h2')?.textContent.slice(0,80)}:null,
    helpButtons:[...document.querySelectorAll('.mk872-help-trigger')].filter(visible).map(desc),
    dialog:[...document.querySelectorAll('.mk872-help-dialog,.mk872-training-dialog')].filter(visible).map(desc),
    header:[...document.querySelectorAll('.top button,.top .profile-pill')].filter(visible).slice(0,15).map(desc),
    visibleTopics:[...document.querySelectorAll('#mainView .topic')].filter(visible).length};
});
async function pageAt(width){
 const ctx=await browser.createBrowserContext(),p=await ctx.newPage();
 p.on('pageerror',e=>record.errors.push({width,error:String(e)}));
 await p.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 return {ctx,p};
}
async function scene(p,width,name,screenshot=false){
 const data=await measure(p);record.scenes.push({width,name,data});
 check('No document overflow '+name+' at '+width,data.scrollWidth<=width+2,data.scrollWidth);
 if(screenshot)await p.screenshot({path:'audits/ui19i2_'+name+'_'+width+'.png',fullPage:false});
 return data;
}
try{
 for(const width of record.widths){
  const {ctx,p}=await pageAt(width);
  await scene(p,width,'home',width===390);
  if(width<=768){
    const open=await p.evaluate(()=>{let e=document.querySelector('.mk-ui19-nav-toggle');if(!e||getComputedStyle(e).display==='none')return false;e.click();return true});
    check('Mobile menu toggle available at '+width,open);
    if(open){
      const d=await scene(p,width,'menu',width===390);
      check('Mobile menu expanded semantics at '+width,await p.evaluate(()=>document.querySelector('.mk-ui19-nav-toggle')?.getAttribute('aria-expanded')==='true'));
      await p.keyboard.press('Escape');
    }
  }
  // Open grade 7 and a topic in the same live app instance.
  const grade=await p.evaluate(()=>{document.querySelectorAll('.grade-grid>.grade-card')[6]?.querySelector('button.btn.primary')?.click();return document.querySelectorAll('#mainView .topic').length});
  check('Grade 7 topics accessible at '+width,grade>20,grade);
  await scene(p,width,'grade7',width===390);
  const clicked=await p.evaluate(()=>{
    const t=[...document.querySelectorAll('#mainView .topic')].find(e=>!e.matches('.locked,.disabled,.soon')&&getComputedStyle(e).cursor==='pointer');
    if(!t)return false;t.click();return true;
  });
  check('Grade 7 topic modal opens at '+width,clicked);
  if(clicked){
    const d=await scene(p,width,'topic7',width===390||width===1280);
    check('Topic has correct modal role at '+width,d.modal?.role==='dialog',d.modal);
    const outline=await p.evaluate(()=>{
      const t=document.querySelector('#modal .mtop h2'),s=getComputedStyle(t);
      return{focused:document.activeElement===t,outline:s.outlineStyle,outlineWidth:s.outlineWidth,outlineColor:s.outlineColor};
    });
    record.testChecks.push({name:'Topic heading focus appearance '+width,pass:true,detail:outline});
    await p.keyboard.press('Escape');
  }
  for(const [name,method] of [['shop','openShop'],['collection','openCollection'],['profile','openProfiles']]){
    const launched=await p.evaluate(method=>{const f=window[method];if(typeof f!=='function')return false;f();return true},method);
    check(name+' available at '+width,launched);
    if(!launched)continue;
    const d=await scene(p,width,name,width===390);
    check(name+' modal aria role at '+width,d.modal?.role==='dialog',d.modal);
    if(name==='shop'){
      const btn=d.helpButtons[0];
      record.testChecks.push({name:'Shop help touch target at '+width,pass:!!btn,detail:btn});
      if(btn){
        const opening=await p.evaluate(()=>{const b=document.querySelector('#modal .mk872-help-trigger');b?.click();return !!b});
        check('Help trigger can be activated at '+width,opening);
        let inside=await scene(p,width,'shopHelp',width===390);
        record.testChecks.push({name:'Nested help focus at '+width,pass:inside.dialog.length>0,detail:{dialog:inside.dialog,active:inside.active}});
        await p.keyboard.press('Escape');
        const after=await scene(p,width,'shopHelpEscape');
        record.testChecks.push({name:'Nested help escape inspection '+width,pass:true,detail:{dialogs:after.dialog,modal:after.modal,active:after.active}});
      }
    }
    await p.keyboard.press('Escape');
  }
  const trainingStarted=await p.evaluate(()=>{
    if(typeof startQuizStage!=='function')return false;startQuizStage('numbers',0);
    return !!document.querySelector('#quizSkip');
  });
  check('Quiz starts at '+width,trainingStarted);
  if(trainingStarted){
    const a=await scene(p,width,'quiz',width===390);
    const skip=await p.evaluate(()=>{const e=document.querySelector('#quizSkip');if(!e)return false;e.click();return true});
    check('Skip control activated '+width,skip);
    const b=await scene(p,width,'skipDialog',width===390);
    check('Skip confirmation visible at '+width,b.dialog.length>0,b.dialog);
    await p.keyboard.press('Escape');
    const c=await scene(p,width,'skipEscape');
    check('Skip Esc returns to question at '+width,c.dialog.length===0&&!!c.modal,c.dialog);
    await p.evaluate(()=>closeModal());
    const d=await scene(p,width,'exitDialog');
    check('Exit safeguard appears at '+width,d.dialog.length>0,d.dialog);
    await p.keyboard.press('Escape');
  }
  await ctx.close();
 }
}finally{
 await browser.close();
 record.summary={scenes:record.scenes.length,checks:record.testChecks.length,
   pass:record.testChecks.filter(x=>x.pass).length,pageerrors:record.errors.length,
   smallVisibleControls:record.scenes.flatMap(s=>s.data.tiny.map(t=>({scene:s.name,width:s.width,...t}))).filter(t=>t.rect[2]<44||t.rect[3]<44).length};
 fs.writeFileSync('audits/ui_stage19i2_probe_report.json',JSON.stringify(record,null,2)+'\n');
 console.log('UI19I2 '+JSON.stringify({summary:record.summary,failed:record.testChecks.filter(x=>!x.pass),
    help:record.testChecks.filter(x=>/help touch|Nested help/.test(x.name)),
    examples:record.scenes.filter(x=>x.name==='home'||x.name==='shop'||x.name==='topic7').filter(x=>x.width===390).map(x=>({name:x.name,tiny:x.data.tiny.slice(0,18),help:x.data.helpButtons,header:x.data.header.slice(0,7)})),
    errors:record.errors},null,2).slice(0,28000));
 if(record.errors.length||record.testChecks.some(x=>!x.pass))process.exitCode=1;
}
