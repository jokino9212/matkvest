import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const got=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v45')||!sw.includes('const APP_BUILD_HASH = "'+got+'"'))throw Error('HTML and PWA v45 mismatch');
const browserExe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!browserExe)throw Error('Chromium missing');
const browser=await puppeteer.launch({executablePath:browserExe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),jsErrors=[];
page.on('pageerror',e=>jsErrors.push(String(e)));
const report={stage:'17D-grade3-quality-batch2',sha256:got,at:new Date().toISOString(),results:[],failures:[],ui:[],jsErrors,summary:{}};
try{
 await page.setViewport({width:390,height:844});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const result=await page.evaluate(()=>{
  const ids=['parts_compare','broken_line_length','parts_intro'],perLevel=500,failures=[],results=[],ui=[],names={2:'половина',3:'треть',4:'четверть',5:'пятая часть',10:'десятая часть'};
  const fail=(type,meta)=>{if(failures.length<180)failures.push({type,...meta})};
  const clean=x=>String(x??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  for(const id of ids)for(let d=0;d<3;d++){
   const variants={},shape=new Set(),raw=new Set(),pictures=new Set(),row={id,d,generated:perLevel,verified:0,variants,uniquePromptTexts:0,structuralShapes:0,distinctVisualModels:0};
   for(let i=0;i<perLevel;i++){
    let q;
    try{q=makeG3Question('g3:'+id,d)}catch(e){fail('generator-throws',{id,d,i,error:String(e)});continue}
    const a=q?.audit??{},prompt=clean(q?.text),ex=clean(q?.ex),answer=String(q?.ans??q?.answer);
    const variant=String(a.variant??'undefined');variants[variant]=(variants[variant]||0)+1;
    raw.add(prompt);shape.add(prompt.replace(/\d+/g,'#'));
    if(q?.visual?.data)pictures.add(JSON.stringify({denoms:q.visual.data.denoms,points:q.visual.data.points,measures:q.visual.data.measures}));
    if(!prompt||!ex||!q?.sig||!answer)fail('missing-core',{id,d,i,prompt});
    if(id==='parts_compare'){
     const {a:denA,b:denB,relation,equalWhole,whole,first,second}=a,expected=denA===denB?'=':denA<denB?'>':'<';
     if(!names[denA]||!names[denB]||expected!==relation||answer!==expected||equalWhole!==true)fail('fraction-comparison-model',{id,d,i,a,answer,expected});
     if(d===0&&variant!=='symbolic'||d===1&&!['diagram','fractionWords'].includes(variant)||d===2&&!['ribbons','ropes'].includes(variant))fail('fraction-level-progression',{id,d,i,variant});
     if(d===1&&variant==='diagram'){
      const denoms=q?.visual?.data?.denoms??[];
      if(denoms.join()!==[denA,denB].join()||q.visual.type!=='g3UnitParts')fail('fraction-visual-inconsistent',{id,d,i,denoms,a});
     }
     if(d===2){
      if(!Number.isInteger(whole)||!Number.isInteger(first)||!Number.isInteger(second)||whole<=0||whole%denA||whole%denB||first!==whole/denA||second!==whole/denB||Math.sign(first-second)!==(expected==='='?0:expected==='>'?1:-1))fail('fraction-story-independent-division',{id,d,i,a,expected});
      if(!prompt.includes(String(whole))||!ex.includes(String(first))||!ex.includes(String(second)))fail('fraction-story-missing-math',{id,d,i,a,prompt,ex});
     }
     const keys=(q.choices??[]).map(c=>String(c.key??c.value??c.label));
     if(keys.length!==3||new Set(keys).size!==3||keys.filter(k=>k===answer).length!==1)fail('choice-keys',{id,d,i,keys,answer});
    }
    if(id==='parts_intro'){
     const n=a.denom,variantsExpected=d===0?['name']:d===1?['wordToFraction','fractionToWord']:['visualFraction','visualName','visualCount'];
     if(!names[n]||answer!==String(n)||!variantsExpected.includes(variant))fail('intro-level-and-answer',{id,d,i,n,answer,variant});
     if(d===2){
      if(q?.visual?.type!=='g3UnitParts'||q?.visual?.data?.denoms?.join()!==String(n))fail('intro-visual-model',{id,d,i,a,visual:q?.visual});
      if(variant==='visualCount'&&!/Сколько частей/.test(prompt))fail('intro-count-task',{id,d,i,prompt});
     }
     const choices=q?.choices??[],keys=choices.map(x=>String(x.key));
     if(keys.length!==4||keys.filter(x=>x===answer).length!==1||new Set(keys).size!==keys.length)fail('intro-choices',{id,d,i,keys,answer});
     const correct=choices.find(x=>String(x.key)===answer)?.label??'';
     if(variant==='visualCount'&&clean(correct)!==String(n)||variant==='name'&&clean(correct)!==names[n])fail('intro-distractor-correctness',{id,d,i,variant,n,correct});
    }
    if(id==='broken_line_length'){
     const lengths=a.lengths??[],pts=a.points??[],total=lengths.reduce((x,y)=>x+y,0);
     if(!lengths.every(x=>Number.isInteger(x)&&x>0)||pts.length!==lengths.length+1||total!==a.total)fail('broken-length-base',{id,d,i,a});
     for(let k=0;k<lengths.length;k++){
      const p=pts[k],next=pts[k+1],dx=Math.abs(next.x-p.x),dy=Math.abs(next.y-p.y);
      if((dx===0)===(dy===0)||dx+dy!==lengths[k]||next.x<0||next.x>13||next.y<0||next.y>8)fail('broken-visual-length-mismatch',{id,d,i,k,dx,dy,len:lengths[k],points:[p,next]});
     }
     let expected;
     if(d===0){expected=total;if(variant!=='sum'||lengths.length<2||lengths.length>3)fail('broken-easy-level',{id,d,i,a})}
     if(d===1){expected=lengths[a.unknownIndex];if(variant!=='missing'||lengths.length<3||lengths.length>4||!Number.isInteger(a.unknownIndex)||!prompt.includes(String(total)))fail('broken-medium-level',{id,d,i,a,prompt})}
     if(d===2){expected=variant==='extend'?total+a.delta:variant==='compare'?total-a.otherLength:null;if(!['extend','compare'].includes(variant)||lengths.length<4||lengths.length>5||expected===null)fail('broken-advanced-level',{id,d,i,a})}
     if(Number(answer)!==expected||a.answer!==expected)fail('broken-independent-answer',{id,d,i,expected,answer,a});
     const measures=q?.visual?.data?.measures??[];
     if(q?.visual?.type!=='g3geometry'||q?.visual?.data?.kind!=='broken'||measures.length!==lengths.length)fail('broken-drawing-missing',{id,d,i,a,visual:q?.visual});
     const qs=measures.filter(m=>m.text==='? см');
     if(d===1&&(qs.length!==1||measures[a.unknownIndex]?.text!=='? см'||measures.some((m,k)=>k!==a.unknownIndex&&m.text!==lengths[k]+' см')))fail('broken-hidden-labels',{id,d,i,a,measures});
     if(d!==1&&measures.some((m,k)=>m.text!==lengths[k]+' см'))fail('broken-supplied-labels',{id,d,i,a,measures});
     if(d===2&&variant==='extend'&&!(a.delta>=2)||d===2&&variant==='compare'&&!(a.otherLength<total&&a.otherLength>0))fail('broken-second-operation',{id,d,i,a});
     if(!ex.includes(String(answer)))fail('broken-explanation-answer',{id,d,i,answer,ex});
    }
    row.verified++;
   }
   row.uniquePromptTexts=raw.size;row.structuralShapes=shape.size;row.distinctVisualModels=pictures.size;
   if(row.verified!==perLevel)fail('missing-coverage',{id,d,verified:row.verified,expected:perLevel});
   if(id==='parts_intro'&&d===2&&row.distinctVisualModels<5)fail('intro-visual-variety',{id,d,distinct:row.distinctVisualModels});
   if(id==='parts_compare'&&d===2&&row.uniquePromptTexts<80)fail('comparison-high-variety',{id,d,unique:row.uniquePromptTexts});
   if(id==='broken_line_length'&&d===1&&row.distinctVisualModels<30)fail('geometry-missing-variety',{id,d,distinct:row.distinctVisualModels});
   if(id==='broken_line_length'&&d===2&&row.distinctVisualModels<30)fail('geometry-two-step-variety',{id,d,distinct:row.distinctVisualModels});
   if(d>0&&!(id==='broken_line_length'&&d===1)&&Object.keys(variants).length<2)fail('weak-strategy-variety',{id,d,variants});
   results.push(row);
  }
  for(const id of ids)for(let d=0;d<3;d++){
   try{
    let success=false,meta={};
    for(let i=0;i<28;i++){
     startG3QuizStage('g3:'+id,d);
     const quiz=document.querySelector('#qstage .quizq'),bars=document.querySelectorAll('#qstage .g3-parts-cell'),svg=document.querySelector('#qstage .g3-geo-svg'),input=document.querySelector('#quizInput');
     meta={rendered:!!quiz,visualParts:bars.length,visualSvg:!!svg,input:!!input,widthOverflow:Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth)};
     const visualExpected=(id==='parts_intro'&&d===2)||(id==='broken_line_length');
     if(!!quiz&&(!visualExpected||(id==='parts_intro'&&bars.length>=2)||(id==='broken_line_length'&&svg))){success=true;break}
    }
    ui.push({id,d,success,...meta});
    if(!success||meta.widthOverflow>60)fail('unavailable-training-ui',{id,d,meta});
   }catch(e){fail('ui-exception',{id,d,error:String(e)})}
  }
  return {results,failures,ui};
 });
 report.results=result.results;report.failures=result.failures;report.ui=result.ui;
 report.summary={generated:report.results.reduce((s,x)=>s+x.generated,0),independentMath:report.results.reduce((s,x)=>s+x.verified,0),ui:report.ui.length,uiReady:report.ui.filter(x=>x.success).length,defects:report.failures.length,jsErrors:jsErrors.length};
 console.log('BATCH2 SUMMARY',JSON.stringify(report.summary));
 console.log('DIVERSITY',JSON.stringify(report.results.map(x=>({id:x.id,d:x.d,variants:x.variants,models:x.distinctVisualModels,uniquePrompts:x.uniquePromptTexts}))));
 if(report.failures.length)console.error('DEFECTS',JSON.stringify(report.failures.slice(0,15)));
 if(report.summary.generated!==4500||report.summary.independentMath!==4500||report.summary.uiReady!==9||report.failures.length||jsErrors.length)process.exitCode=1;
}catch(e){report.failures.push({fatal:String(e),stack:String(e.stack).slice(0,2000)});console.error('BATCH2 FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g3g4_stage17_phaseD_quality_batch2_test_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
