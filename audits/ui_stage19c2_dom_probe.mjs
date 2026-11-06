import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const report={scenes:[],errors:[]};
try{
 for(const width of [390,600,768,1024,1280,1440]){
  const page=await browser.newPage();
  page.on('pageerror',e=>report.errors.push(String(e)));
  await page.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  const data=await page.evaluate(()=>{
   function info(el){
     if(!el)return null;const r=el.getBoundingClientRect(),s=getComputedStyle(el);
     return{tag:el.tagName,cls:String(el.className).slice(0,220),id:el.id,text:el.textContent.replace(/\s+/g,' ').slice(0,75),
       rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},
       display:s.display,position:s.position,grid:s.gridTemplateColumns,flex:s.flex,flexWrap:s.flexWrap,align:s.alignItems,justify:s.justifyContent,
       gap:s.gap,padding:s.padding,margin:s.margin,fontSize:s.fontSize,lineHeight:s.lineHeight,minHeight:s.minHeight,maxHeight:s.maxHeight,width:s.width,
       background:s.backgroundColor,order:s.order,opacity:s.opacity};
   }
   const top=document.querySelector('.top'),stats=top?.querySelector('.stats'),nav=top?.querySelector('.mk-ui19-nav-wrap'),grid=document.querySelector('.grade-grid'),
     card=grid?.querySelector('.grade-card'),quick=document.querySelector('.quick-card');
   return{html:top?.outerHTML.slice(0,12500),cardHtml:card?.outerHTML.slice(0,8000),
      top:info(top),topChildren:[...top.children].map(info),stats:info(stats),statsChildren:[...stats.children].map(info),
      nav:info(nav),navChildren:[...nav?.children||[]].map(info),
      grid:info(grid),card:info(card),cardChildren:[...card?.children||[]].map(info),
      quick:info(quick),innerWidth,scrollWidth:document.documentElement.scrollWidth};
  });
  report.scenes.push({width,data});
  await page.close();
 }
}finally{await browser.close()}
fs.writeFileSync('audits/ui_stage19c2_dom_probe.json',JSON.stringify(report,null,2)+'\n');
console.log('UI19C2',JSON.stringify({errors:report.errors,sizes:report.scenes.map(s=>({width:s.width,head:s.data.top?.rect,grid:s.data.grid?.rect,card:s.data.card?.rect,nav:s.data.nav?.rect}))}));
if(report.errors.length)process.exitCode=1;