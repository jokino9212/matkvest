import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const expected='b953b710a471210fe0f8247b55e879cedf4d7e11c6f369d551040a9f5d46c7d3';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(sha!==expected)throw Error('Refuse unknown candidate '+sha);
if(!fs.readFileSync('sw.js','utf8').includes('const APP_BUILD_HASH = "'+sha+'"'))throw Error('SW/HTML hash mismatch');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),jsErrors=[];page.on('pageerror',e=>jsErrors.push(String(e)));
const report={phase:'16D-visual-theory-audit',candidateSha256:sha,at:new Date().toISOString(),theory:[],visuals:[],ui:[],flags:[],errors:[],jsErrors,summary:{}};
try{
 await page.setViewport({width:390,height:844});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const res=await page.evaluate(()=>{
  const theory=[],visuals=[],flags=[],errors=[],ui=[],theoryBodies=new Map();
  const clean=s=>String(s??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const push=(kind,grade,id,detail)=>{if(flags.length<120)flags.push({kind,grade,topic:id,detail});};
  const broken=(kind,grade,id,detail)=>{if(errors.length<100)errors.push({kind,grade,topic:id,detail});};
  for(const grade of [1,2]){
   const all=window['g'+grade+'AllTopics'](),make=window['makeG'+grade+'Question'];
   const theoryFn=window['g'+grade+'TheoryHtml'];
   for(const t of all){
    const tid=t.id;
    let h='';
    try{h=typeof theoryFn==='function'?theoryFn(tid):'';}catch(e){broken('theory-exception',grade,tid,String(e))}
    const box=document.createElement('div');box.innerHTML=String(h??'');
    const text=clean(box.textContent);
    const key=text.replace(/\d+/g,'#');
    const row={grade,id:tid,title:t.title,length:text.length,excerpt:text.slice(0,470),
      headings:[...box.querySelectorAll('h1,h2,h3,h4')].map(x=>x.textContent.trim()).slice(0,14),
      svg:box.querySelectorAll('svg').length,img:box.querySelectorAll('img').length,
      htmlLength:String(h).length};
    theory.push(row);
    if(text.length<100)push('theory-too-short-or-not-found',grade,tid,{length:text.length,excerpt:text.slice(0,100)});
    if(theoryBodies.has(key))push('identical-theory-content',grade,tid,{previous:theoryBodies.get(key),length:text.length});
    else theoryBodies.set(key,tid);
    const vCounts={},empty=[],suspicious=[];
    for(let d=0;d<3;d++){
     for(let i=0;i<35;i++){
      let q;
      try{q=make(tid,d);}catch(e){broken('generator',grade,tid,String(e));continue;}
      if(!q?.visual)continue;
      const type=String(q.visual.type??'undefined');
      vCounts[type]=(vCounts[type]||0)+1;
      let markup;
      try{markup=quizVisualHtml(q)}catch(e){broken('quizVisualHtml-exception',grade,tid,{d,type,error:String(e)});continue}
      if(!String(markup??'').trim()){
       if(empty.length<8)empty.push({d,type,prompt:clean(q.text).slice(0,100)});
       continue;
      }
      const holder=document.createElement('div');holder.innerHTML=String(markup);
      if(/(?:NaN|Infinity|undefined)(?:\b|[<=";])/i.test(String(markup)))suspicious.push({d,type,kind:'invalid-numeric-or-text',sample:String(markup).slice(0,160)});
      for(const svg of holder.querySelectorAll('svg')){
       const vb=svg.getAttribute('viewBox');
       if(vb){
        const parts=vb.trim().split(/[\s,]+/).map(Number);
        if(parts.length!==4||!parts.every(Number.isFinite)||parts[2]<=0||parts[3]<=0)suspicious.push({d,type,kind:'bad-svg-viewBox',viewBox:vb});
       }
      }
      if(q.visual?.type==='g2Perimeter'&&q.visual.data?.showPerimeter===true){
       suspicious.push({d,type,kind:'answer-displayed-before-solution'});
      }
     }
     try{
      window['startG'+grade+'QuizStage'](tid,d);
      const stage=document.getElementById('qstage'),quiz=stage?.querySelector('.quizq');
      const ok=!!quiz?.textContent?.trim();
      const main=document.querySelector('#main')??document.querySelector('main')??document.body;
      const overflow=main.scrollWidth-main.clientWidth;
      ui.push({grade,id:tid,level:d,rendered:ok,pageHorizontalOverflow:overflow});
      if(!ok)broken('ui-not-rendered',grade,tid,{level:d});
      if(overflow>70)push('mobile-horizontal-overflow',grade,tid,{d,overflow});
     }catch(e){broken('ui-exception',grade,tid,{level:d,error:String(e)})}
    }
    visuals.push({grade,id:tid,types:vCounts,empty:empty.slice(0,5),suspicious:suspicious.slice(0,10)});
    if(empty.length)push('empty-visual-renderer',grade,tid,{count:empty.length,examples:empty.slice(0,3)});
    for(const s of suspicious.slice(0,5))push('visual-anomaly',grade,tid,s);
   }
  }
  return {theory,visuals,flags,errors,ui};
 });
 report.theory=res.theory;report.visuals=res.visuals;report.flags=res.flags;report.errors=res.errors;report.ui=res.ui;
 report.summary={theoryTopics:res.theory.length,theoryWith100Chars:res.theory.filter(x=>x.length>=100).length,
  uniqueTheoryBodies:new Set(res.theory.map(x=>x.excerpt)).size,visualGenerators:res.visuals.reduce((s,x)=>s+Object.values(x.types).reduce((a,b)=>a+b,0),0),
  uiStarts:res.ui.length,uiRendered:res.ui.filter(x=>x.rendered).length,maxMobileOverflow:Math.max(0,...res.ui.map(x=>x.pageHorizontalOverflow)),flags:res.flags.length,errors:res.errors.length,jsErrors:jsErrors.length};
 console.log('STAGE16D THEORY VISUAL SUMMARY',JSON.stringify(report.summary));
 console.log('STAGE16D FLAGS',JSON.stringify(report.flags.slice(0,18)));
 for(const t of report.theory)console.log('THEORY',JSON.stringify({id:t.id,length:t.length,excerpt:t.excerpt.slice(0,170),headings:t.headings}));
 if(res.errors.length||jsErrors.length||report.summary.uiRendered!==report.summary.uiStarts)process.exitCode=1;
}catch(e){report.errors.push({fatal:String(e),stack:String(e.stack).slice(0,1700)});console.error('STAGE16D VISUAL FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g1g2_stage16_phaseD_theory_visual_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}