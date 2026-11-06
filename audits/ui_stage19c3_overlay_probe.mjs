import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const prior=JSON.parse(fs.readFileSync('audits/ui_stage19c3_probe.json','utf8'));
console.log('PRIOR OVERLAYS',JSON.stringify(prior.screens.map(x=>({name:x.name,w:x.width,overlay:x.data.overlay?.map(y=>({cls:y.cls,id:y.id,width:y.width,height:y.height,top:y.y,bg:y.bg,actions:y.actions})),top:x.data.top?.slice(0,5).map(y=>({cls:y.cls,id:y.id,text:y.text})),attrs:x.data.attrs?.slice(0,6).map(y=>({cls:y.cls,id:y.id,text:y.text})),firstInteractive:x.data.interactive?.slice(0,12).map(y=>({cls:y.cls,id:y.id,text:y.text}))}))).slice(0,22000));
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const base=pathToFileURL(path.resolve('index.html')).href;
const record={screens:[],errors:[]};
async function pageFor(w){
 const p=await browser.newPage();p.on('pageerror',e=>record.errors.push(String(e)));
 await p.setViewport({width:w,height:900,isMobile:w<=600,hasTouch:w<=600});
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:120000});return p;
}
async function inspect(p,name,w){
 const d=await p.evaluate(()=>{
  const visible=e=>{if(!e)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>10&&r.height>10&&s.display!=='none'&&s.visibility!=='hidden'};
  const format=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{
   id:e.id,tag:e.tagName,cls:String(e.className).slice(0,140),text:e.innerText?.replace(/\s+/g,' ').slice(0,145),rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)],
   color:s.color,bg:s.backgroundColor,border:s.borderColor,shadow:s.boxShadow,radius:s.borderRadius,padding:s.padding,
   font:s.fontSize,weight:s.fontWeight,display:s.display,cursor:s.cursor}};
  const dialogs=[...document.querySelectorAll('[role="dialog"],dialog,.modal,.modal-content,.modal-box,[class*="modal"],[class*="dialog"]')].filter(visible).slice(0,14);
  const leaf=[...document.querySelectorAll('button,a,[role="button"],input')].filter(visible).filter(e=>dialogs.some(d=>d.contains(e))).slice(0,60);
  const classes=[...document.querySelectorAll('body *')].filter(visible).filter(e=>dialogs.some(d=>d.contains(e))&&/stage|theory|lesson|train|question|shop|profile|modal|quiz|exercise|level|card|result|summary/i.test(String(e.className||''))).slice(0,80);
  return{dialogs:dialogs.map(format),buttons:leaf.map(format),cards:classes.map(format),
   overlayRoot:dialogs[0]?.outerHTML.slice(0,12000),pageText:document.body.innerText.slice(0,1800),
   bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth};
 });
 record.screens.push({name,width:w,data:d});
 await p.screenshot({path:'audits/ui19c3_overlay_'+name+'_'+w+'.png',fullPage:false});
 return d;
}
try{
 for(const w of [390,1280]){
  for(const [name,sel] of [['topic','.topic'],['shop','.shop-pill'],['profile','.profile-pill'],['journal','.report-pill'],['data','.data-pill']]){
   const p=await pageFor(w);
   if(name==='topic'){
    await p.evaluate(()=>document.querySelector('.grade-grid>.grade-card:first-child button.btn.primary').click());
    await p.evaluate(()=>document.querySelector('#mainView .topic')?.click());
   }else{
    if(w<=600)await p.evaluate(()=>document.querySelector('.mk-ui19-nav-toggle')?.click());
    await p.evaluate(s=>document.querySelector(s)?.click(),sel);
   }
   const before=await inspect(p,name,w);
   if(name==='topic'){
    const action=await p.evaluate(()=>{
     const roots=[...document.querySelectorAll('[role="dialog"],dialog,.modal,.modal-content,[class*="modal"]')].filter(e=>e.getBoundingClientRect().width>100&&getComputedStyle(e).display!=='none');
     const root=roots.find(x=>x.querySelector('.stage-card'))||roots.find(x=>/Разминка/.test(x.innerText))||roots.at(-1);
     if(!root)return{ok:false,why:'no dialog'};
     const options=[...root.querySelectorAll('.stage-card,button,[role="button"]')].filter(e=>{
      const r=e.getBoundingClientRect();return r.width>20&&r.height>20&&!e.disabled&&!e.matches('.locked,.disabled,[aria-disabled="true"]');
     });
     const action=options.find(e=>/1\.?\s*Разминка|Разминка|Начать/.test(e.textContent||''))||options[0];
     if(!action)return{ok:false,why:'no stage',options:options.map(e=>e.className)};
     const info={className:String(action.className),text:action.innerText.slice(0,90),tag:action.tagName};
     action.click();return{ok:true,info};
    });
    record.screens.push({name:'stage click',width:w,data:action});
    await inspect(p,'stage_first',w);
   }
   await p.close();
  }
 }
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19c3_overlay_probe.json',JSON.stringify(record,null,2)+'\n');
 console.log('OVERLAY META',JSON.stringify({screens:record.screens.map(x=>({name:x.name,width:x.width,root:x.data.dialogs?.[0],classes:x.data.cards?.slice(0,8),buttons:x.data.buttons?.slice(0,12),action:x.name==='stage click'?x.data:null})),errors:record.errors}).slice(0,21000));
 if(record.errors.length)process.exitCode=1;
}