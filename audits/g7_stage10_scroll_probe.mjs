import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();
const results=[];
try{
 await page.setViewport({width:390,height:844,deviceScaleFactor:1});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 fs.mkdirSync('audits/g7_stage10_scroll_previews',{recursive:true});
 const topics=['geo_constructions_lines_angles','geo_primitives','geo_incircle_triangle','coordinate_plane','graphical_equations_systems'];
 for(let i=0;i<topics.length;i++){
  const raw=topics[i];
  const details=await page.evaluate((raw)=>{
   startG7QuizStage('g7:'+raw,1);
   const stage=document.getElementById('qstage'),question=stage?.querySelector('.quizq');
   function box(el){if(!el)return null;const b=el.getBoundingClientRect();return {top:Math.round(b.top),bottom:Math.round(b.bottom),height:Math.round(b.height),left:Math.round(b.left),width:Math.round(b.width)}}
   const ancestors=[];
   let el=stage;
   for(let j=0;el&&j<9;j++,el=el.parentElement){
    const style=getComputedStyle(el);
    ancestors.push({tag:el.tagName,id:el.id,className:String(el.className).slice(0,70),scrollTop:Math.round(el.scrollTop),scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,overflowY:style.overflowY,rect:box(el)});
   }
   return {raw,stage:box(stage),question:box(question),heading:stage?.textContent.trim().slice(0,90),ancestors,scrollY:window.scrollY};
  },raw);
  const file='audits/g7_stage10_scroll_previews/mobile_'+raw+'.png';
  await page.screenshot({path:file,fullPage:false});
  results.push({...details,file});
 }
 fs.writeFileSync('audits/g7_stage10_scroll_probe.json',JSON.stringify({testedAt:new Date().toISOString(),results},null,2)+'\n');
 console.log(JSON.stringify(results.map(x=>({raw:x.raw,question:x.question,scrollable:x.ancestors.filter(x=>x.scrollHeight>x.clientHeight+10).map(y=>({id:y.id,cls:y.className,scrollTop:y.scrollTop,clientHeight:y.clientHeight,scrollHeight:y.scrollHeight,top:y.rect?.top}))})),null,2));
}finally{await browser.close()}
