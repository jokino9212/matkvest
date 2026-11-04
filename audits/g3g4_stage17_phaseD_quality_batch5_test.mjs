import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v48')||!sw.includes('const APP_BUILD_HASH = "'+sha+'"'))throw Error('PWA v48 fingerprint mismatch');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Chromium unavailable');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,timeout:90000,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),jsErrors=[];
page.on('pageerror',e=>jsErrors.push(String(e)));
const report={phase:'17D-quality-batch5',sha256:sha,at:new Date().toISOString(),rows:[],ui:[],errors:[],jsErrors,summary:{}};
try{
 await page.setViewport({width:390,height:844});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const data=await page.evaluate(()=>{
  const ids=['multiplication_table','division_table','rectangle_square_area'],N=500,rows=[],errors=[],ui=[];
  const fail=(kind,context)=>{if(errors.length<150)errors.push({kind,...context})};
  const clean=x=>String(x??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  for(const id of ids)for(let d=0;d<3;d++){
   const row={id,d,generated:N,verified:0,variants:{},prompts:new Set(),shapes:new Set(),models:new Set(),mathChecks:0};
   for(let i=0;i<N;i++){
    let q;
    try{q=makeG3Question('g3:'+id,d)}catch(e){fail('generator-exception',{id,d,i,error:String(e)});continue}
    const a=q?.audit??{},v=a.variant??'undefined',ans=Number(q?.ans),ctx={id,d,i,variant:v},prompt=clean(q?.text),ex=clean(q?.ex);
    row.variants[v]=(row.variants[v]??0)+1;row.prompts.add(prompt);row.shapes.add(prompt.replace(/\d+/g,'#'));
    if(!prompt||!ex||!q.sig||q.answerMode!=='number'||!Number.isInteger(ans)||ans<=0)fail('invalid-core-question',{...ctx,prompt,ex,ans,answerMode:q.answerMode});
    if(a.answer?.n!==undefined&&(a.answer.n!==ans||a.answer.d!==1))fail('audit-answer-mismatch',{...ctx,ans,auditAnswer:a.answer});
    if(q.answerRat?.n!==ans||q.answerRat?.d!==1)fail('rational-answer-mismatch',{...ctx,ans,answerRat:q.answerRat});
    if(id==='multiplication_table'){
     const {a:x,b:y,product,change}=a,expected=x*y;
     if(!Number.isInteger(x)||!Number.isInteger(y)||x<2||y<2||x>(d===0?5:9)||y>(d===0?5:9)||product!==expected)
       fail('wrong-multiplication-fact',{...ctx,a});
     let math=NaN;
     if(v==='product'||v==='pencils'||v==='books')math=expected;
     else if(v==='unknownA')math=x;
     else if(v==='unknownB')math=y;
     else if(v==='extra')math=expected+change;
     else if(v==='taken')math=expected-change;
     const levels=d===0?['product']:d===1?['product','pencils','books']:['unknownA','unknownB','extra','taken'];
     if(!levels.includes(v)||math!==ans)fail('multiplication-progression-or-answer',{...ctx,expected:math,ans,a});
     if((v==='extra'||v==='taken')&&(!Number.isInteger(change)||change<=0||change>=product))
       fail('multiplication-two-steps',{...ctx,a});
     row.mathChecks++;
    }else if(id==='division_table'){
     const {product,divisor,quotient,change}=a;
     if(!Number.isInteger(product)||!Number.isInteger(divisor)||!Number.isInteger(quotient)||product!==divisor*quotient||divisor<2||quotient<2)
       fail('wrong-division-fact',{...ctx,a});
     let math=NaN;
     if(['quotient','equalBoxes','equalGroups'].includes(v))math=product/divisor;
     else if(v==='unknownDividend')math=product;
     else if(v==='unknownDivisor')math=divisor;
     else if(v==='moreEach')math=product/divisor+change;
     else if(v==='takeEach')math=product/divisor-change;
     const levels=d===0?['quotient']:d===1?['quotient','equalBoxes','equalGroups']:['unknownDividend','unknownDivisor','moreEach','takeEach'];
     if(!levels.includes(v)||math!==ans)fail('division-progression-or-answer',{...ctx,expected:math,ans,a});
     if((v==='moreEach'||v==='takeEach')&&(!Number.isInteger(change)||change<1||change>=quotient))
       fail('division-two-steps',{...ctx,a});
     row.mathChecks++;
    }else{
     const {a:x,b:y,answer,unit}=a,pts=q?.visual?.data?.points??[],dx=pts.length===4?Math.abs(pts[1].x-pts[0].x):NaN,dy=pts.length===4?Math.abs(pts[2].y-pts[1].y):NaN;
     row.models.add(JSON.stringify({x,y,variant:v,unit,delta:a.delta??null}));
     if(q.visual?.type!=='g3geometry'||q.visual?.data?.kind!=='polygon'||pts.length!==4||dx!==x||dy!==y||pts.some(p=>p.x<0||p.x>13||p.y<0||p.y>8))
       fail('area-drawing-inconsistent',{...ctx,a,pts});
     let math=NaN;
     if(['gridRect','rect','square'].includes(v))math=x*y;
     else if(v==='missingSide')math=a.originalArea/a.knownSide;
     else if(v==='extendedSide')math=(x+a.delta)*y;
     const levels=d===0?['gridRect']:d===1?['rect','square']:['missingSide','extendedSide'];
     if(!levels.includes(v)||math!==ans||answer!==ans)
       fail('area-answer-progression',{...ctx,a,math,ans});
     if(v==='square'&&x!==y||v==='rect'&&x===y)fail('area-square-rectangle',{...ctx,a});
     if(v==='missingSide'&&(a.originalArea!==x*y||a.knownSide!==x||q.unitSuffix!==unit.replace('²','')))
       fail('area-inverse-construction',{...ctx,a,suffix:q.unitSuffix});
     if(v==='extendedSide'&&(a.delta<1||a.delta>3||a.newSide!==x+a.delta||a.originalArea!==x*y||q.unitSuffix!==unit))
       fail('area-extended-construction',{...ctx,a,suffix:q.unitSuffix});
     if(v==='gridRect'&&q.unitSuffix!=='кв. ед.')fail('area-grid-unit',{...ctx,suffix:q.unitSuffix});
     row.mathChecks++;
    }
    row.verified++;
   }
   row.uniquePrompts=row.prompts.size;row.structuralShapes=row.shapes.size;row.visualModels=row.models.size;
   delete row.prompts;delete row.shapes;delete row.models;
   if(row.verified!==N||row.mathChecks!==N)fail('missing-coverage',{id,d,row});
   if(d>0&&Object.keys(row.variants).length<2)fail('insufficient-reasoning-variety',{id,d,variants:row.variants});
   if(id==='rectangle_square_area'&&d===0&&row.visualModels<20)fail('grid-variation',{id,d,models:row.visualModels});
   if(d===2&&id!=='rectangle_square_area'&&(!Object.keys(row.variants).some(z=>z.startsWith('unknown'))||!Object.keys(row.variants).some(z=>['extra','taken','moreEach','takeEach'].includes(z))))
    fail('hard-level-regressed',{id,d,variants:row.variants});
   rows.push(row);
  }
  for(const id of ids)for(let d=0;d<3;d++){
   try{
    startG3QuizStage('g3:'+id,d);
    const shown=!!document.querySelector('#qstage .quizq'),input=!!document.querySelector('#quizInput'),
      svg=!!document.querySelector('#qstage .g3-geo-svg'),overflow=Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth);
    ui.push({id,d,shown,input,svg,overflow});
    if(!shown||!input||id==='rectangle_square_area'&&!svg||overflow>60)fail('unavailable-ui',{id,d,shown,input,svg,overflow});
   }catch(e){fail('ui-exception',{id,d,error:String(e)})}
  }
  return {rows,errors,ui};
 });
 report.rows=data.rows;report.errors=data.errors;report.ui=data.ui;
 report.summary={generated:report.rows.reduce((x,r)=>x+r.verified,0),independentMath:report.rows.reduce((x,r)=>x+r.mathChecks,0),ui:report.ui.length,uiReady:report.ui.filter(z=>z.shown&&z.input&&z.overflow<=60).length,errors:report.errors.length,jsErrors:jsErrors.length};
 console.log('BATCH5 SUMMARY',JSON.stringify(report.summary));
 console.log('BATCH5 DIVERSITY',JSON.stringify(report.rows.map(r=>({id:r.id,d:r.d,variants:r.variants,uniquePrompts:r.uniquePrompts,visualModels:r.visualModels}))));
 if(report.errors.length)console.log('BATCH5 DEFECTS',JSON.stringify(report.errors.slice(0,22)));
 if(report.summary.generated!==4500||report.summary.independentMath!==4500||report.summary.uiReady!==9||report.errors.length||jsErrors.length)process.exitCode=1;
}catch(e){report.errors.push({fatal:String(e),stack:String(e.stack).slice(0,1400)});console.error('BATCH5 FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g3g4_stage17_phaseD_quality_batch5_test_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
