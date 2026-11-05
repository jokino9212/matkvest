import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const sha=x=>createHash('sha256').update(x).digest('hex');
const expected='29e750205c4549e2c9d6105b49002ba1c505876518a2139e3da0ce5644e15859';
const actual=sha(fs.readFileSync('index.html'));
if(actual!==expected)throw Error('Unexpected v54 source '+actual);
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
const targets=[
  ['g5:angles',1],['g5:charts',0],['g5:frac_shapes',0],
  ['g6:number_line',0],['g6:number_line',1],['g6:number_line',2],
  ['g6:coordinate_plane',2],['g6:point_coordinates',0],['g6:point_coordinates',1],['g6:point_coordinates',2],
  ['g6:tables_charts',0],['g6:tables_charts',2],
];
const output={sha:actual,at:new Date().toISOString(),targets:[],issues:[],pageErrors:errors,screenFiles:[]};
const dir='audits/g5g6_stage18_visual_previews';
fs.mkdirSync(dir,{recursive:true});
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 for(const viewport of [390,1280]){
  await page.setViewport({width:viewport,height:900,deviceScaleFactor:1,isMobile:viewport===390});
  for(const [topic,stage] of targets){
    const info=await page.evaluate(({topic,stage})=>{
      const isG5=topic.startsWith('g5:'),id=isG5?topic.slice(3):topic;
      let failures=[],rawList=[],fingerprints=new Map(),svgFingerprints=new Map(),choices=new Map(),ans=new Set(),scene=null;
      try{
        if(isG5)startG5QuizStage(id,stage);
        else startG6QuizStage(topic,stage);
        for(let i=0;i<72;i++){
          const cand=isG5?makeG5Question(id):makeG6Question(topic,stage);
          if(!cand||!cand.text)throw new Error('Missing question '+i);
          q=cand;
          if(!document.getElementById('qstage'))throw Error('qstage missing');
          const html=quizPromptHtml(cand);
          qstage.innerHTML=html+quizAnswerMarkup('nextQ','skipNormalQuiz');
          const root=document.querySelector('#qstage'),vis=root.querySelector('.quizq');
          const svg=[...root.querySelectorAll('svg')],canvas=[...root.querySelectorAll('canvas')],table=[...root.querySelectorAll('table')];
          const images=[...root.querySelectorAll('img')];
          const allText=vis?.textContent?.replace(/\s+/g,' ').trim()||'';
          const visualRaw=JSON.stringify(cand.visual||cand.diagram||cand.plot||null);
          const structure=svg.map(e=>e.outerHTML).join('')+canvas.map(e=>e.outerHTML).join('')+table.map(e=>e.outerHTML).join('')+images.map(e=>e.outerHTML).join('');
          const graphic=structure||visualRaw;
          const normalized=graphic.replace(/[+-]?\d+(?:[.,]\d+)?/g,'#');
          const oldF=fingerprints.get(graphic)||0;fingerprints.set(graphic,oldF+1);
          svgFingerprints.set(normalized,(svgFingerprints.get(normalized)||0)+1);
          choices.set(JSON.stringify(cand.choices||[]),(choices.get(JSON.stringify(cand.choices||[]))||0)+1);
          ans.add(String(cand.ans??cand.answer??cand.correctText??''));
          const rootBox=root.getBoundingClientRect();
          const svgIssues=[];
          for(const v of svg){
            const rect=v.getBoundingClientRect(),view=v.viewBox?.baseVal;
            if(rect.width<25||rect.height<20)svgIssues.push({type:'smallSVG',size:[rect.width,rect.height]});
            if(rect.left<-4||rect.right>innerWidth+4)svgIssues.push({type:'horizontalOverflow',rect:{left:rect.left,right:rect.right}});
            if(view?.width>0&&view?.height>0){
              const tr=[...v.querySelectorAll('text')];
              for(const t of tr)try{
                const bb=t.getBBox();
                const eps=5;
                if(bb.x<view.x-eps||bb.x+bb.width>view.x+view.width+eps||bb.y<view.y-eps||bb.y+bb.height>view.y+view.height+eps)svgIssues.push({type:'svgTextOutsideViewBox',text:t.textContent.slice(0,30),bb:{x:bb.x,y:bb.y,w:bb.width,h:bb.height},view:{x:view.x,y:view.y,w:view.width,h:view.height}});
              }catch(e){svgIssues.push({type:'svgBBoxError',text:String(e)})}
            }
          }
          if(rootBox.width<30||rootBox.right>innerWidth+5||rootBox.left<-5)svgIssues.push({type:'stageOverflow',bounds:{left:rootBox.left,right:rootBox.right,width:rootBox.width}});
          if(svgIssues.length)failures.push({iteration:i,issues:svgIssues.slice(0,8)});
          if(i<5)rawList.push({prompt:allText.slice(0,240),answer:String(cand.ans??''),svg:svg.length,table:table.length,canvas:canvas.length,images:images.length,visualType:cand.visual?.type,visualKeys:Object.keys(cand.visual||{}),visualChecksum:graphic.slice(0,110),sig:cand.sig,choices:JSON.stringify(cand.choices||[]).slice(0,180)});
          if(i===0)scene={html:root.innerHTML.length,svg:svg.length,table:table.length,canvas:canvas.length,img:images.length,stageSize:{width:rootBox.width,height:rootBox.height}};
        }
      }catch(e){failures.push({type:'exception',error:String(e)})}
      const highRepeat=[...fingerprints.values()].reduce((a,b)=>a+(b>1?b:0),0);
      return {topic,stage,viewport,samples:[...fingerprints.values()].reduce((a,b)=>a+b,0),visualVariants:fingerprints.size,visualFamilies:svgFingerprints.size,uniqueOptions:choices.size,uniqueAnswers:ans.size,maxRepeatedVisual:Math.max(0,...fingerprints.values()),repeatSampleCount:highRepeat,scene,rawList,failures:failures.slice(0,18)};
    },{topic,stage});
    output.targets.push(info);
    if(info.failures.length)output.issues.push({topic,stage,viewport,count:info.failures.length,examples:info.failures.slice(0,5)});
    if(info.samples){
      const name=topic.replace(':','_')+'_'+stage+'_'+viewport+'.png';
      const element=await page.$('#qstage');
      if(element){const file=dir+'/'+name;await element.screenshot({path:file});output.screenFiles.push(file);}
    }
    console.log('VISUAL '+JSON.stringify({topic,stage,viewport,samples:info.samples,visualVariants:info.visualVariants,visualFamilies:info.visualFamilies,uniqueOptions:info.uniqueOptions,uniqueAnswers:info.uniqueAnswers,failures:info.failures.slice(0,2)}));
  }
 }
 fs.writeFileSync('audits/g5g6_stage18_visual_diagnostic_report.json',JSON.stringify(output,null,2)+'\n');
 console.log('SUMMARY '+JSON.stringify({targetViewportPairs:output.targets.length,errors:errors.length,issuePairs:output.issues.length,screens:output.screenFiles.length}));
 if(errors.length||output.issues.some(x=>x.examples.some(v=>v.type==='exception'||v.issues?.some(o=>o.type==='horizontalOverflow'||o.type==='smallSVG'))))process.exitCode=1;
}finally{await browser.close();}
