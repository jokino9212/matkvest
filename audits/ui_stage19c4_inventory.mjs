import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import puppeteer from 'puppeteer-core';
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));if(!chrome)throw Error('Chromium unavailable');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const base=pathToFileURL(path.resolve('index.html')).href;
const out={version:'v61',screens:[],errors:[],anomalies:[],testedWidths:[320,390,768,1280,1600],timestamp:new Date().toISOString()};
async function fresh(width){const ctx=await browser.createBrowserContext(),p=await ctx.newPage();p.on('pageerror',e=>out.errors.push({width,error:String(e)}));await p.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600});await p.goto(base,{waitUntil:'domcontentloaded',timeout:120000});return{ctx,p}}
const inspect=async(p,where,grade,width)=>p.evaluate(({where,grade,width})=>{
 const all=[...document.querySelectorAll('*')],visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>=8&&r.height>=8&&s.display!=='none'&&s.visibility!=='hidden'};
 const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]};
 const describe=e=>{const st=getComputedStyle(e);return {tag:e.tagName,cls:String(e.className||'').slice(0,140),text:(e.innerText||'').replace(/\s+/g,' ').trim().slice(0,100),rect:rect(e),background:st.backgroundColor,color:st.color,font:st.fontSize,lineHeight:st.lineHeight,padding:st.padding,cursor:st.cursor,role:e.getAttribute('role'),aria:e.getAttribute('aria-label'),tabindex:e.tabIndex}};
 const frame=where==='modal'?document.querySelector('#modal'):document.querySelector('#mainView');
 const top=document.querySelector('.top'),modal=document.querySelector('#modal');
 const topics=[...document.querySelectorAll('#mainView .topic')].filter(visible);
 const targets=[...(frame?.querySelectorAll('button,a,[role="button"],.topic,[tabindex="0"]')||[])].filter(visible).slice(0,80);
 const visibleSmall=targets.filter(e=>{const r=e.getBoundingClientRect();return r.width<34||r.height<34}).slice(0,20).map(describe);
 const overflowComponents=all.filter(visible).filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return r.width>width+3&&s.position!=='fixed'&&s.position!=='absolute'}).slice(0,18).map(describe);
 const offscreen=all.filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.x< -15||r.right>width+15}).filter(e=>!['html','body'].includes(e.tagName.toLowerCase())).slice(0,25).map(describe);
 const html=document.documentElement;
 return {where,grade,width,scrollWidth:html.scrollWidth,viewport:innerWidth,bodyHeight:document.body.scrollHeight,
   top:rect(top),modal:rect(modal),frame:rect(frame),frameText:frame?.innerText.replace(/\s+/g,' ').slice(0,700),
   topicCount:topics.length,firstTopic:topics[0]&&describe(topics[0]),modalHeader:modal?.querySelector('.mtop h2')?.textContent.trim().slice(0,95),
   stageCount:modal?.querySelectorAll('.stage-card').length,targetCount:targets.length,smallTargets:visibleSmall,oversized:overflowComponents,offscreen,
   heading:[...(frame?.querySelectorAll('h1,h2,h3')||[])].filter(visible).slice(0,8).map(describe),
   uniqueButtons:[...new Set(targets.map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,65)))].slice(0,25)};
 },{where,grade,width});
try{
 for(const width of out.testedWidths){
  const home=await fresh(width);let d=await inspect(home.p,'home',0,width);out.screens.push({kind:'home',width,data:d});
  if(d.scrollWidth>width+2)out.anomalies.push({kind:'overflow',screen:'home',width,scrollWidth:d.scrollWidth});
  if([320,390,768,1280].includes(width))await home.p.screenshot({path:'audits/ui19c4_baseline_home_'+width+'.png',fullPage:false});
  await home.ctx.close();
  for(let grade=1;grade<=8;grade++){
   const{ctx,p}=await fresh(width);
   const acted=await p.evaluate(g=>{const card=document.querySelectorAll('.grade-grid>.grade-card')[g-1];const b=card?.querySelector('button.btn.primary');if(!b)return false;b.click();return true},grade);
   if(!acted){out.anomalies.push({kind:'missing-grade-CTA',width,grade});await ctx.close();continue}
   d=await inspect(p,'grade',grade,width);out.screens.push({kind:'grade',width,grade,data:d});
   if(d.scrollWidth>width+2)out.anomalies.push({kind:'overflow',screen:'grade',width,grade,scrollWidth:d.scrollWidth});
   if(!d.topicCount)out.anomalies.push({kind:'no-topic',screen:'grade',width,grade});
   if(d.smallTargets.length)out.anomalies.push({kind:'small-controls',screen:'grade',width,grade,count:d.smallTargets.length,targets:d.smallTargets.slice(0,4)});
   if([320,390,768,1280].includes(width))await p.screenshot({path:'audits/ui19c4_baseline_grade'+grade+'_'+width+'.png',fullPage:false});
   const modalAction=await p.evaluate(()=>{
    const topic=[...document.querySelectorAll('#mainView .topic')].find(e=>{const st=getComputedStyle(e);return st.cursor==='pointer'&&e.getBoundingClientRect().width>10&&!e.matches('.locked,.disabled,.soon')});
    if(!topic)return{ok:false,why:'no selectable topics'};topic.click();return{ok:true,text:topic.innerText.replace(/\s+/g,' ').slice(0,110)}
   });
   if(modalAction.ok){
    const m=await inspect(p,'modal',grade,width);out.screens.push({kind:'modal',width,grade,data:m});
    if(m.scrollWidth>width+2)out.anomalies.push({kind:'overflow',screen:'modal',width,grade,scrollWidth:m.scrollWidth});
    if([390,1280].includes(width))await p.screenshot({path:'audits/ui19c4_baseline_modal'+grade+'_'+width+'.png',fullPage:false});
   }else out.anomalies.push({kind:'no-open-modal',width,grade,reason:modalAction.why});
   await ctx.close();
  }
 }
}finally{
 await browser.close();fs.writeFileSync('audits/ui_stage19c4_inventory.json',JSON.stringify(out,null,2)+'\n');
 console.log('UI19C4 INVENTORY',JSON.stringify({screens:out.screens.length,errors:out.errors,anomalies:out.anomalies.slice(0,75),
  summary:out.screens.filter(s=>['grade','modal'].includes(s.kind)).map(s=>({kind:s.kind,width:s.width,grade:s.grade,topics:s.data.topicCount,modalTitle:s.data.modalHeader,overflow:s.data.scrollWidth-s.width,small:s.data.smallTargets.length})).filter(s=>s.width===390||s.width===1280)},null,2).slice(0,22000));
 if(out.errors.length)process.exitCode=1;
}
