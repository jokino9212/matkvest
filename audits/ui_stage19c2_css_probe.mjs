import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const b=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const p=await b.newPage();
await p.setViewport({width:390,height:900,isMobile:true,hasTouch:true});
await p.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
const data=await p.evaluate(()=>{
 const el=document.querySelector('.grade-grid>.grade-card>button.btn.primary');
 if(!el)return {err:'button missing'};
 const matched=[],locations=[];
 let par=el;while(par&&locations.length<10){locations.push({tag:par.tagName,id:par.id,cls:par.className});par=par.parentElement;}
 function inspectRule(rule,src){
   if(rule instanceof CSSStyleRule){
     try{
       if(el.matches(rule.selectorText)){
         const st=rule.style;
         const p=['background','background-color','color','border-color'];
         const d=p.map(k=>({key:k,val:st.getPropertyValue(k),important:st.getPropertyPriority(k)})).filter(x=>x.val);
         if(d.length)matched.push({selector:rule.selectorText,source:src,declarations:d});
       }
     }catch{}
   }else if(rule.cssRules){for(const sub of rule.cssRules)inspectRule(sub,src+' '+(rule.conditionText||''))}
 }
 for(const sheet of [...document.styleSheets]){
   let r;try{r=sheet.cssRules}catch{continue}
   for(const rule of r)inspectRule(rule,sheet.ownerNode?.id||sheet.href||'inline')
 }
 const nodes=[...document.querySelectorAll('style')].map(n=>({id:n.id,pos:n.compareDocumentPosition(el),last:n.textContent.slice(-150)})).slice(-20);
 return{outer:el.outerHTML,computed:getComputedStyle(el).backgroundColor,inlineStyle:el.getAttribute('style'),
  matches:{withMain:el.matches('#mainView .grade-grid>.grade-card>button.btn.primary'),withoutMain:el.matches('.grade-grid>.grade-card>button.btn.primary'),
   v58:el.matches('.grade-grid>.grade-card .btn.primary')},
  ancestors:locations,matched:matched.slice(-35),styleNodes:nodes};
});
console.log('UI19C2 CSS PROBE '+JSON.stringify(data).slice(0,26000));
fs.writeFileSync('audits/ui_stage19c2_css_probe.json',JSON.stringify(data,null,2)+'\n');
await p.close();await b.close();