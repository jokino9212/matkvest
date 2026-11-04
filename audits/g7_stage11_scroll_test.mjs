import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const marker='/* МатКвест G7 этап 11: сброс прокрутки при запуске другой тренировки */';
const html=fs.readFileSync('index.html','utf8');
if((html.match(/МатКвест G7 этап 11: сброс прокрутки/g)||[]).length!==1)throw Error('Stage11 scroll patch missing or duplicated');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Chromium missing');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const checks=[],errors=[];
try{
  for(const viewport of [{width:390,height:844},{width:1280,height:900}]){
    await page.setViewport({...viewport,deviceScaleFactor:1});
    await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
    const result=await page.evaluate((viewport)=>{
      const topics=['geo_constructions_lines_angles','geo_primitives','coordinate_plane','graphical_equations_systems','geo_incircle_triangle','geo_right_triangle_properties','geo_circle_chord_diameter'];
      const checks=[],errors=[];
      const modal=document.getElementById('modal');
      for(let run=0;run<5;run++){
        for(const raw of topics){
          const d=(run+topics.indexOf(raw))%3;
          try{
            startG7QuizStage('g7:'+raw,d);
            modal.scrollTop=99999;
            const before=modal.scrollTop;
            startG7QuizStage('g7:'+raw,d);
            const after=modal.scrollTop;
            const question=document.querySelector('#qstage .quizq');
            const svg=document.querySelector('#qstage svg');
            if(before<100)throw Error('Could not establish precondition: modal not scrolled');
            if(after!==0)throw Error('ScrollTop not reset: '+after);
            if(!question||!question.textContent.trim())throw Error('Question not shown');
            if(!blockSession||blockSession.kind!=='g7quiz'||blockSession.topicId!==raw)throw Error('Session for wrong topic');
            if(q.visual&&['coordinatePlane','geometry'].includes(q.visual.type)&&!svg)throw Error('SVG missing');
            checks.push({run,raw,d,before,after,hasSvg:!!svg});
          }catch(e){errors.push({run,raw,d,error:String(e)});}
        }
      }
      return {viewport:viewport.width,checks,errors};
    },viewport);
    checks.push(...result.checks.map(x=>({...x,viewport:viewport.width})));
    errors.push(...result.errors.map(x=>({...x,viewport:viewport.width})));
  }
  const report={testedAt:new Date().toISOString(),htmlSha256:createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),checks:checks.length,errors,pageErrors,sample:checks.slice(0,8)};
  fs.writeFileSync('audits/g7_stage11_scroll_report.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  if(checks.length!==70||errors.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close()}
