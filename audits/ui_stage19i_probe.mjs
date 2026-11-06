import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const expected='27020e041b8613f34aac5651db02d7d0b330f0b9c61b13d79918ced22ffa8f31';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(sha!==expected||!sw.includes('matkvest-iphone-v68')||!sw.includes(sha))throw Error('19I audit must start from exact verified v68');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!exe)throw Error('Chromium not found');
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const result={stage:'19I',phase:'baseline',baseVersion:'v68',sha256:sha,widths:[320,390,768,1280],scenes:[],anomalies:[],jsErrors:[],checks:[],timestamp:new Date().toISOString()};
function recordCheck(name,pass,detail){result.checks.push({name,pass:!!pass,detail:pass?undefined:detail});}
const observe=async(p,width,name,opts={})=>{
 const d=await p.evaluate(({width,name})=>{
  const visible=e=>{if(!e)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>6&&r.height>6&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'};
  const rect=e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]};
  const text=e=>(e.innerText||e.textContent||'').replace(/\s+/g,' ').trim().slice(0,100);
  const all=[...document.querySelectorAll('button,a,input,select,textarea,[role="button"],[tabindex="0"]')].filter(visible);
  const buttons=all.filter(e=>e.matches('button,[role="button"],a'));
  const targets=all.filter(e=>!e.matches('[disabled],[aria-disabled="true"]')).filter(e=>{const r=e.getBoundingClientRect();return r.width<34||r.height<34}).slice(0,20).map(e=>({element:e.tagName,id:e.id,cls:String(e.className||'').slice(0,70),text:text(e),rect:rect(e)}));
  const unnamed=buttons.filter(e=>!text(e)&&!e.getAttribute('aria-label')&&!e.getAttribute('title')&&!e.querySelector('img[alt]')).slice(0,20).map(e=>({tag:e.tagName,id:e.id,cls:String(e.className||'').slice(0,90),html:e.outerHTML.slice(0,220)}));
  const root=document.querySelector('#mainView'),modal=document.querySelector('#modal');
  const topics=[...(root?.querySelectorAll('.topic')||[])].filter(visible);
  const inaccessibleTopics=topics.filter(e=>getComputedStyle(e).cursor==='pointer'&&e.tabIndex<0&&!e.querySelector('button,a,[tabindex="0"]')).slice(0,12).map(e=>({text:text(e),cls:String(e.className).slice(0,90)}));
  const top=document.querySelector('.top');
  const headerItems=top?[...top.children].filter(visible).map(e=>({cls:String(e.className).slice(0,60),rect:rect(e)})):[];
  const overflow=[...document.querySelectorAll('body *')].filter(visible).filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.position!=='absolute'&&s.position!=='fixed'&&r.width>width+5}).slice(0,8).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,80),rect:rect(e)}));
  const dialog=[...document.querySelectorAll('[role="dialog"],dialog,#modal,.mk872-training-dialog')].find(visible);
  return{name,width,pageWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,viewport:innerWidth,
    heading:[...(root?.querySelectorAll('h1,h2,h3')||[])].filter(visible).slice(0,4).map(text),
    targets:targets,unnamedButtons:unnamed,inaccessibleTopics,
    topicCount:topics.length,buttonCount:buttons.length,headerItems,oversized:overflow,
    dialog:dialog?{id:dialog.id,role:dialog.getAttribute('role'),ariaModal:dialog.getAttribute('aria-modal'),label:dialog.getAttribute('aria-label'),rect:rect(dialog),text:text(dialog).slice(0,110)}:null,
    visibleMain:text(root).slice(0,240),modalVisible:!!(modal&&visible(modal)),
    active:{tag:document.activeElement?.tagName,id:document.activeElement?.id,cls:String(document.activeElement?.className||'').slice(0,70)}};
 },{width,name});
 result.scenes.push(d);
 if(d.pageWidth>width+2)result.anomalies.push({type:'horizontal-overflow',name,width,pageWidth:d.pageWidth,oversized:d.oversized});
 if(d.unnamedButtons.length)result.anomalies.push({type:'unnamed-buttons',name,width,items:d.unnamedButtons});
 if(d.inaccessibleTopics.length)result.anomalies.push({type:'unreachable-topics',name,width,items:d.inaccessibleTopics});
 if(d.targets.length)result.anomalies.push({type:'small-target-candidates',name,width,count:d.targets.length,items:d.targets.slice(0,8)});
 if(opts.screenshot)await p.screenshot({path:'audits/ui19i_'+name+'_'+width+'.png',fullPage:false});
 return d;
};
async function goHome(p){await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});}
try{
 for(const width of result.widths){
  const ctx=await browser.createBrowserContext(),p=await ctx.newPage();
  p.on('pageerror',err=>result.jsErrors.push({width,error:String(err)}));
  await p.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600});
  await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  const home=await observe(p,width,'home',{screenshot:true});
  recordCheck('Home loads without horizontal overflow at '+width,home.pageWidth<=width+2,home.pageWidth);
  for(let grade=1;grade<=8;grade++){
    await goHome(p);
    const opened=await p.evaluate(g=>{
      const cards=[...document.querySelectorAll('.grade-grid>.grade-card')];
      const card=cards[g-1],button=card?.querySelector('button.btn.primary');
      if(!button)return{ok:false,count:cards.length,slot:g-1,cards:cards.map((c,i)=>({slot:i,txt:c.innerText.replace(/\s+/g,' ').slice(0,90),primary:!!c.querySelector('button.btn.primary'),html:c.outerHTML.slice(0,500)})),main:document.querySelector('#mainView')?.innerText.slice(0,140)};
      button.click();return{ok:true};
    },grade);
    recordCheck('Class '+grade+' opens at '+width,opened.ok,opened);
    if(!opened.ok){
      const freshCtx=await browser.createBrowserContext(),freshPage=await freshCtx.newPage();
      await freshPage.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600});
      await freshPage.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
      const fresh=await freshPage.evaluate(g=>{const c=document.querySelectorAll('.grade-grid>.grade-card')[g-1],b=c?.querySelector('button.btn.primary');if(b)b.click();return{button:!!b,topics:document.querySelectorAll('#mainView .topic').length,cardCount:document.querySelectorAll('.grade-grid>.grade-card').length}},grade);
      result.anomalies.push({type:'stateful-navigation-or-probe',width,grade,opened,fresh});
      await freshCtx.close();
      continue;
    }
    const d=await observe(p,width,'grade'+grade,{screenshot:width===390&&(grade===1||grade===7||grade===8)});
    recordCheck('Class '+grade+' has topics at '+width,d.topicCount>0,d.topicCount);
    if(grade===1||grade===7||grade===8){
      const click=await p.evaluate(()=>{
        const t=[...document.querySelectorAll('#mainView .topic')].find(e=>{const st=getComputedStyle(e);return e.getBoundingClientRect().width>8&&st.cursor==='pointer'&&!e.matches('.locked,.disabled,.soon')});
        if(!t)return false;t.click();return true;
      });
      recordCheck('Class '+grade+' offers clickable topic at '+width,click);
      if(click){
        const d=await observe(p,width,'topic'+grade,{screenshot:width===390&&grade===7});
        recordCheck('Class '+grade+' opens topic panel at '+width,!!d.dialog||d.modalVisible,d.dialog);
        if(width===390&&grade===7){
          const focus=await p.evaluate(async()=>{
            const modal=document.querySelector('#modal');const inModal=()=>modal?.contains(document.activeElement);
            const opener=document.activeElement?.outerHTML.slice(0,250);
            const steps=[];
            for(let i=0;i<25;i++){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}));}
            return {opener,modalOpen:modal?.getBoundingClientRect().width>10,focusInModal:inModal(),html:modal?.outerHTML.slice(0,1400)};
          });
          result.focusProbe=focus;
        }
        await p.keyboard.press('Escape');
        const after=await observe(p,width,'topic'+grade+'_escape');
        result.checks.push({name:'Esc from class '+grade+' panel at '+width,pass:true,detail:{modalVisible:after.modalVisible}});
      }
    }
  }
  for(const [name,method] of [['shop','openShop'],['collection','openCollection'],['profile','openProfiles'],['journal','openJournal'],['report','openReport']]){
    await goHome(p);
    const attempted=await p.evaluate(method=>{
      const fn=window[method];
      if(typeof fn!=='function')return {available:false};
      try{fn();return {available:true,ok:true}}catch(e){return{available:true,ok:false,error:String(e)}}
    },method);
    if(!attempted.available)continue;
    recordCheck(name+' route opens at '+width,attempted.ok,attempted);
    if(attempted.ok)await observe(p,width,name,{screenshot:width===390&&['shop','collection','profile'].includes(name)});
    await p.keyboard.press('Escape');
  }
  await ctx.close();
 }
}finally{
 await browser.close();
 result.summary={scenes:result.scenes.length,checks:result.checks.length,checksPass:result.checks.filter(x=>x.pass).length,
  errors:result.jsErrors.length,anomaliesByType:Object.fromEntries([...new Set(result.anomalies.map(x=>x.type))].map(type=>[type,result.anomalies.filter(x=>x.type===type).length]))};
 fs.writeFileSync('audits/ui_stage19i_baseline.json',JSON.stringify(result,null,2)+'\n');
 console.log('UI19I BASELINE '+JSON.stringify({summary:result.summary,failed:result.checks.filter(x=>!x.pass),errors:result.jsErrors,anomalies:result.anomalies.filter(x=>x.type!=='small-target-candidates').slice(0,35),smallSamples:result.anomalies.filter(x=>x.type==='small-target-candidates').slice(0,6)},null,2).slice(0,24000));
 if(result.jsErrors.length||result.checks.some(c=>!c.pass))process.exitCode=1;
}