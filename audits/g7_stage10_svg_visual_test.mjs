import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const expected='f54327a5ae104f38259f962265115094df699cf946854e1193693de6cf1aec59';
if(createHash('sha256').update(fs.readFileSync('index.html')).digest('hex')!==expected)throw Error('HTML changed unexpectedly');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[],report={sha256:expected,testedAt:new Date().toISOString(),screens:[],checks:[],errors:[],pageErrors};
page.on('pageerror',e=>pageErrors.push(String(e)));
const targets=['geo_primitives','coordinate_plane','graphical_equations_systems','geo_right_triangle_properties','geo_circle_chord_diameter','geo_incircle_triangle','geo_constructions_lines_angles','geo_perpendicular_oblique_distances'];
fs.mkdirSync('audits/g7_stage10_svg_previews',{recursive:true});
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  await page.setViewport({...viewport,deviceScaleFactor:1});
  for(const raw of targets){
   for(const d of [0,1,2]){
    const v=await page.evaluate(({raw,d})=>{
     let found=false;
     for(let attempt=0;attempt<18;attempt++){
      startG7QuizStage('g7:'+raw,d);
      if(document.querySelector('#qstage svg')){found=true;break}
     }
     const svg=document.querySelector('#qstage svg');
     if(!found||!svg)return {found:false};
     const box=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;
     const labels=[...svg.querySelectorAll('text')].map((e)=>{
      try{
       const b=e.getBBox();
       return {text:(e.textContent||'').slice(0,40),x:b.x,y:b.y,width:b.width,height:b.height,
        overflow:b.x<vb.x-3||b.y<vb.y-3||b.x+b.width>vb.x+vb.width+3||b.y+b.height>vb.y+vb.height+3};
      }catch(error){return {text:(e.textContent||'').slice(0,40),error:String(error)}}
     });
     const content=document.getElementById('qstage')?.getBoundingClientRect();
     return {found:true,type:q.visual?.type,svg:{left:box.left,top:box.top,width:box.width,height:box.height},viewBox:{x:vb.x,y:vb.y,width:vb.width,height:vb.height},question: {left:content.left,width:content.width},labels:labels.length,labelOverflow:labels.filter(x=>x.overflow)};
    },{raw,d});
    const r={viewport:viewport.width,topic:raw,stage:d,...v};
    if(v.found){
      if(v.svg.width<50||v.svg.height<30||v.viewBox.width<=0||v.viewBox.height<=0)report.errors.push({...r,error:'Invisible/invalid SVG'});
      if(v.svg.left<-3||v.svg.left+v.svg.width>viewport.width+3)report.errors.push({...r,error:'SVG horizontally out of viewport'});
      if(v.labelOverflow?.length)report.errors.push({...r,error:'SVG text labels outside viewBox'});
      if(!report.screens.some(x=>x.viewport===viewport.width&&x.topic===raw)){
       const element=await page.$('#qstage');
       if(element){
        const file='audits/g7_stage10_svg_previews/'+viewport.width+'_'+raw+'.png';
        await element.screenshot({path:file});
        report.screens.push({viewport:viewport.width,topic:raw,stage:d,file});
       }
      }
    }
    report.checks.push({viewport:viewport.width,topic:raw,stage:d,found:v.found,svg:v.svg,labelOverflow:v.labelOverflow?.length||0});
   }
  }
 }
 fs.writeFileSync('audits/g7_stage10_svg_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({checks:report.checks.length,rendered:report.checks.filter(x=>x.found).length,screenshots:report.screens.length,errors:report.errors.slice(0,16),pageErrors},null,2));
 if(report.errors.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close()}
