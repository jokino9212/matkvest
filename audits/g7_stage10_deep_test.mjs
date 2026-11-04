import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const EXPECTED='f54327a5ae104f38259f962265115094df699cf946854e1193693de6cf1aec59';
const observedHash=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(observedHash!==EXPECTED)throw Error('Stage9 HTML SHA256 mismatch: '+observedHash);
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Chrome unavailable');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const results={sha256:observedHash,browser:null,testedAt:new Date().toISOString(),pageErrors,math:null,ui:null};
try{
 await page.setViewport({width:1280,height:900,deviceScaleFactor:1});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 results.browser=await browser.version();
 results.math=await page.evaluate(()=>{
   const errors=[],warnings=[],byTopic=[],byMode={},variants={};
   let tested=0,images=0,coordinates=0,graphs=0,strictAudit=0;
   const value=v=>v&&typeof v==='object'&&'n' in v?Number(v.n)/Number(v.d):Number(v);
   const finite=x=>Number.isFinite(Number(x));
   function validate(t,d,a){
     if(!a||!a.text||!a.sig||!a.ex)throw Error('Missing text, signature or explanation');
     const words=String(a.text)+' '+String(a.ex);
     if(/(?:NaN|undefined|\\[object Object\\]|Infinity)/.test(words))throw Error('Invalid text or explanation');
     if(String(a.ans??'').trim()==='')throw Error('Missing answer');
     if(a.choices?.length){
       if(a.choices.length<2)throw Error('Insufficient answer options');
       const keys=a.choices.map(x=>String(x.key));
       if(new Set(keys).size!==keys.length)throw Error('Duplicate choice keys');
       if(keys.filter(x=>x===String(a.ans)).length!==1)throw Error('Correct answer missing or not unique');
     }
     const m=a.audit||{},raw=t.id.slice(3);
     if(m.type==='g7AuditStage7'){
       strictAudit++;
       if(m.raw!==raw||m.d!==d)throw Error('Stage7 metadata inconsistent');
       if(m.answer!==undefined&&Number(a.ans)!==Number(m.answer))throw Error('Stage7 numeric answer inconsistent');
       if(m.correct!==undefined&&String(a.ans)!==String(m.correct))throw Error('Stage7 option answer inconsistent');
       if(m.expectedX!==undefined){
          if(a.answerMode!=='coordinate')throw Error('Expected coordinate answer mode');
          if(value(a.answerPoint?.x)!==m.expectedX||value(a.answerPoint?.y)!==m.expectedY)throw Error('Incorrect coordinate answer');
          coordinates++;
       }
       if(raw==='coordinate_plane'&&m.x!==undefined&&a.visual?.data?.points?.length){
         const p=a.visual.data.points[0];
         if(value(p.x)!==m.x||value(p.y)!==m.y)throw Error('Coordinate diagram differs from metadata');
         if(m.variant==='dist_ox'&&Number(a.ans)!==Math.abs(m.y))throw Error('Distance to Ox math error');
         if(m.variant==='dist_oy'&&Number(a.ans)!==Math.abs(m.x))throw Error('Distance to Oy math error');
         if(m.variant==='abscissa'&&Number(a.ans)!==m.x)throw Error('Abscissa answer differs from point');
         if(m.variant==='ordinate'&&Number(a.ans)!==m.y)throw Error('Ordinate answer differs from point');
       }
       if(raw==='graphical_equations_systems'&&m.k1!==undefined){
         const {k1,k2,b1,b2,x0,y0}=m,lines=a.visual?.data?.series||[];
         if(lines.length!==2)throw Error('Incorrect number of lines on graph');
         if(k1===k2&&(m.case!==(b1===b2?'infinite':'none')))throw Error('Equal slopes classification incorrect');
         if(k1!==k2&&m.case!=='one')throw Error('Different slopes classification incorrect');
         if(x0!==null&&x0!==undefined&&(k1*x0+b1!==y0||k2*x0+b2!==y0))throw Error('Graph intersection not on both lines');
         for(const [i,line] of lines.entries()){
           const k=i?k2:k1,b=i?b2:b1;
           if(line.k!==k||line.b!==b)throw Error('Line model parameters differ from equation');
           for(const p of line.points){
             if(Math.abs(value(p.y)-(k*value(p.x)+b))>1e-7)throw Error('Graph plotted an invalid point '+JSON.stringify({variant:m.variant,k,b,p,x:value(p.x),y:value(p.y),delta:value(p.y)-(k*value(p.x)+b)}));
           }
         }
         graphs++;
       }
     }
     if(a.visual){
       images++;
       if(a.visual.type==='coordinatePlane'&&!a.visual.data)throw Error('Coordinate diagram has no data');
       if(a.visual.type==='geometry'&&!a.visual.data)throw Error('Geometry diagram has no data');
     }
     const mode=a.choices?.length?'choices':String(a.answerMode||'text');
     byMode[mode]=(byMode[mode]||0)+1;
     const v=m.variant||m.type||a.templateId||'legacy';
     variants[v]=(variants[v]||0)+1;
     return v;
   }
   const topics=g7AllTopics();
   for(const t of topics)for(let d=0;d<3;d++){
      const uniqueText=new Set(),uniqueSig=new Set(),vset=new Set();
      for(let i=0;i<30;i++){
        try{
           const a=makeG7Question(t.id,d);
           const v=validate(t,d,a);
           uniqueText.add(String(a.text));uniqueSig.add(String(a.sig));vset.add(String(v));tested++;
        }catch(e){
           errors.push({topic:t.id,stage:d,index:i,error:String(e)});
           if(errors.length>=30)break;
        }
      }
      if(errors.length>=30)break;
      byTopic.push({topic:t.id,stage:d,uniqueTexts:uniqueText.size,uniqueSignatures:uniqueSig.size,variants:vset.size});
      if(uniqueText.size<=1)warnings.push({topic:t.id,stage:d,detail:'Only one prompt across 30 samples; review diagram and answer diversity'});
   }
   return {catalog:topics.length,tested,strictAudit,images,coordinates,graphs,byMode,variants:Object.keys(variants).length,errors,warnings: warnings.slice(0,60),byTopic};
 });
 // Exercise real answer buttons at every grade 7 stage; correct and incorrect on independent attempts.
 results.ui=await page.evaluate(()=>{
   const errors=[],observations=[],modes={};const topics=g7AllTopics();
   let testedCorrect=0,testedWrong=0,correctFeedback=0,wrongFeedback=0,inputsFound=0,svgRendered=0;
   function assert(cond,message){if(!cond)throw Error(message)}
   function trial(id,d,correct){
      startG7QuizStage(id,d);
      const current=q;
      if(!current)throw Error('No UI question');
      const svg=document.querySelector('#qstage svg');
      if(current.visual&&['geometry','coordinatePlane'].includes(current.visual.type)){
        assert(svg,'SVG not present');
        const vb=svg.viewBox?.baseVal,box=svg.getBoundingClientRect();
        assert(vb&&vb.width>0&&vb.height>0,'Invalid SVG viewBox');
        assert(box.width>10&&box.height>10,'SVG invisible');
        assert(!/NaN|Infinity|undefined/.test(svg.outerHTML),'Invalid SVG drawing values');
        svgRendered++;
      }
      const choices=current.choices||[];
      if(!choices.length){
        inputsFound++;
        return {mode:current.answerMode||'input',topic:id,stage:d,keys:Object.keys(current),html:document.getElementById('qstage')?.innerHTML.slice(0,800)};
      }
      const index=choices.findIndex(c=>String(c.key)===String(current.ans));
      assert(index>=0,'Correct choice absent');
      const selected=correct?index:choices.findIndex((_,i)=>i!==index);
      assert(selected>=0,'Wrong choice absent');
      const options=[...document.querySelectorAll('#qstage button.answer')];
      assert(options.length===choices.length,'UI options differ from model');
      const old=blockSession.correct;
      options[selected].click();
      const feedback=document.querySelector('#qfb')?.textContent.trim()||'';
      const next=document.getElementById('quizNext');
      const after=blockSession.correct;
      assert(feedback.length>0,'Missing feedback after answer');
      if(correct)assert(next&&next.style.display!=='none','Next button not enabled for correct answer');
      assert(correct?after===old+1:after===old,'Correct answer counter changed incorrectly');
      if(correct){testedCorrect++;correctFeedback++}else{testedWrong++;wrongFeedback++}
      if(correct){const awarded=blockSession.correct;options[selected].click();assert(blockSession.correct===awarded,'Repeated correct click awarded extra credit');}
      return null;
   }
   for(const t of topics){
      for(let d=0;d<3;d++){
        for(const correct of [false,true]){
           try{
             const obs=trial(t.id,d,correct);
             if(obs){modes[obs.mode]=(modes[obs.mode]||0)+1;if(observations.length<25)observations.push(obs);}
           }catch(e){
             errors.push({topic:t.id,stage:d,correct,error:String(e)});
             if(errors.length>35)break;
           }
        }
        if(errors.length>35)break;
      }
      if(errors.length>35)break;
   }
   return {catalog:topics.length,testedCorrect,testedWrong,correctFeedback,wrongFeedback,inputsFound,svgRendered,modes,observations,errors};
 });
 fs.writeFileSync('audits/g7_stage10_deep_report.json',JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify({sha256:observedHash,catalog:results.math.catalog,mathTested:results.math.tested,strictAudit:results.math.strictAudit,mathModes:results.math.byMode,mathErrors:results.math.errors.slice(0,10),mathWarnings:results.math.warnings.length,ui: {correct:results.ui.testedCorrect,wrong:results.ui.testedWrong,inputs:results.ui.inputsFound,svg:results.ui.svgRendered,errors:results.ui.errors.slice(0,10)},pageErrors},null,2));
 if(results.math.catalog!==107||results.math.errors.length||results.ui.errors.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close()}
