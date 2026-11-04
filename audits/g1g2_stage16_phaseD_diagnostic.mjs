import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

// Stage 16/D diagnostic. Read-only, isolated branch, no production changes.
const expected='2be11af0d9ca5db18d45bc10011388f502803a12b0f92ca474ee11ba97939d03';
const source=fs.readFileSync('index.html','utf8');
const hash=createHash('sha256').update(Buffer.from(source)).digest('hex');
if(hash!==expected)throw Error('Refuse unknown candidate SHA '+hash);
if(!fs.readFileSync('sw.js','utf8').includes('const APP_BUILD_HASH = "'+hash+'"'))throw Error('Service Worker SHA mismatch');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Chrome not found');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const report={stage:'16D-diagnostic',sha256:hash,at:new Date().toISOString(),sourceExcerpts:[],topics:[],defects:[],observations:[],pageErrors,summary:{}};
const patterns=[
 /function g1StorySentence\(/g,/function g2StorySentence\(/g,/function g2StoryBase\(/g,
 /function g1StoryQuestion\(/g,/function g2StoryQuestion\(/g,/function g1TheoryHtml\(/g,
 /function g2TheoryHtml\(/g,/function g2StoryNoun\(/g,/function g1ActionNoun\(/g,
 /\$\{g2StoryNoun\(model\.a,[^}]+\)\}/g,/\$\{g1Noun\(m\.a,[^}]+\)\}/g
];
for(const re of patterns){
 const match=[...source.matchAll(re)];
 report.sourceExcerpts.push({pattern:String(re),count:match.length,samples:match.slice(0,4).map(m=>source.slice(Math.max(0,m.index-70),m.index+900))});
}
const slim=q=>({prompt:String(q?.text??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,300),ex:String(q?.ex??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,230),ans:q?.ans??null,answer:q?.answer??null,template:q?.audit?.templateId??q?.templateId??null,model:q?.audit?.model??null});
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const res=await page.evaluate(()=>{
  const topics=[],defects=[],observations=[],byType={},maxDefects=120;
  const clean=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
  const semTemplate=s=>clean(s).replace(/\d+/g,'#').slice(0,200);
  const push=(severity,kind,grade,id,d,q,detail)=>{
   const item={severity,kind,grade,topic:id,level:d,template:q?.audit?.templateId??q?.templateId??null,prompt:clean(q?.text).slice(0,280),detail};
   byType[kind]=(byType[kind]||0)+1;
   if(severity==='defect'){if(defects.length<maxDefects)defects.push(item);}
   else if(observations.length<80)observations.push(item);
  };
  const one=n=>n%10===1&&n%100!==11;
  const checkModel=(grade,id,q,d)=>{
   const m=q?.audit?.model;
   if(!m||typeof m!=='object')return false;
   const eq=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-9;
   let value=null;
   if(id.endsWith(':word_problems')){
    if(m.kind==='add')value=m.a+m.b;
    else if(m.kind==='sub')value=m.a-m.b;
    else if(m.kind==='mul')value=m.groups*m.each;
    else if(m.kind==='div')value=m.total/m.groups;
    else if(m.kind==='two_add_sub')value=m.a+m.b-m.c;
    else if(m.kind==='two_sub_add')value=m.a-m.b+m.c;
    else if(m.kind==='two_mul_add')value=m.groups*m.each+m.extra;
   }
   if(value!==null){
    if(!eq(value,m.result))push('defect','math-model-result',grade,id,d,q,{expected:value,actual:m.result});
    return true;
   }
   if(id.endsWith(':geometric_quantities')&&(m.shape==='square'||m.shape==='rectangle'||m.shape==='triangle')){
    const p=m.shape==='square'?4*m.a:m.shape==='rectangle'?2*(m.a+m.b):m.a+m.b+m.c;
    if(!eq(p,m.perimeter))push('defect','math-perimeter',grade,id,d,q,{expected:p,actual:m.perimeter});
    return true;
   }
   return false;
  };
  for(const grade of [1,2]){
   const all=window['g'+grade+'AllTopics'](),make=window['makeG'+grade+'Question'];
   for(const t of all){
    const row={grade,id:t.id,title:t.title,levels:[],uiStarts:[]};
    for(let d=0;d<3;d++){
     const count=t.id.endsWith(':word_problems')?1400:135;
     const templateCounts={},unique=new Set(),signatureCounts={},answerKinds={},samples=[];
     let validated=0,modelChecked=0,wrongGrammar=0,badPunctuation=0,choicesChecked=0;
     for(let i=0;i<count;i++){
      let q;
      try{q=make(t.id,d);}catch(e){push('defect','generator-throws',grade,t.id,d,null,String(e));continue;}
      if(!q||typeof q!=='object'||!clean(q.text)){push('defect','empty-question',grade,t.id,d,q,'');continue;}
      if(q.ans===undefined&&q.answer===undefined&&q.answerRat===undefined){push('defect','missing-answer',grade,t.id,d,q,'');continue;}
      validated++;
      const tt=String(q.audit?.templateId??q.templateId??semTemplate(q.text));
      templateCounts[tt]=(templateCounts[tt]||0)+1;
      signatureCounts[q.sig??tt]=(signatureCounts[q.sig??tt]||0)+1;
      unique.add(clean(q.text)+'|'+JSON.stringify(q.choices??null)+'|'+JSON.stringify(q.ans??q.answer??q.answerRat??null)+'|'+JSON.stringify(q.visual?.data??null));
      const ans=q.answer??q.ans??q.answerRat;
      const ak=q.choices?.length?'choice':typeof ans==='object'?'structured':typeof ans;
      answerKinds[ak]=(answerKinds[ak]||0)+1;
      if(samples.length<8&&!samples.some(s=>s.tpl===tt))samples.push({tpl:tt,text:clean(q.text).slice(0,270),ex:clean(q.ex).slice(0,200),answer:typeof ans==='object'?JSON.stringify(ans).slice(0,100):String(ans),visual:q.visual?.type??null});
      const text=clean(q.text);
      const nounBug=/(было|был|была)\s+(\d+)\s+(карандаш(?:а|ей|и)?|кубик(?:а|ов|и)?|мяч(?:а|ей|и)?|книга|книги|книг|тетрадь|тетради|тетрадей)(?=[\s.,!?;:]|$)/giu;
      for(const match of text.matchAll(nounBug)){
       const num=Number(match[2]),noun=match[3].toLowerCase(),form=match[1].toLowerCase();
       if(one(num)){
        const wanted=/^(книга|тетрадь)$/.test(noun)?'была':'был';
        if(form!==wanted){wrongGrammar++;push('defect','singular-gender-agreement',grade,t.id,d,q,{fragment:match[0],wanted});}
       }
      }
      if(/\b(?:см|дм|км|кг|г|л|мин|ч)\s+\./u.test(text)){
       badPunctuation++;push('observation','space-before-period',grade,t.id,d,q,{});
      }
      if(/\b(?:5|6|7|8|9|10)\s+раза\b/u.test(clean(q.ex))){
       push('defect','bad-times-suffix',grade,t.id,d,q,{ex:clean(q.ex)});
      }
      if(q.choices?.length){
       choicesChecked++;
       const keys=q.choices.map(c=>String(c.key??c.value??c.label));
       const labels=q.choices.map(c=>clean(c.label??c.value??c.key));
       if(new Set(keys).size!==keys.length||new Set(labels).size!==labels.length)push('defect','duplicate-choice',grade,t.id,d,q,{keys,labels});
       const matches=keys.filter(x=>x===String(ans));
       if(matches.length!==1)push('defect','answer-choice-count',grade,t.id,d,q,{ans:String(ans),keys});
      }
      if(checkModel(grade,t.id,q,d))modelChecked++;
      if(q.visual?.type==='g2Story'&&q.visual?.data?.showDerived===true)push('defect','visual-leaks-derived',grade,t.id,d,q,{});
      if(q.visual?.type==='g2Perimeter'&&q.visual?.data?.showPerimeter===true)push('defect','visual-leaks-perimeter',grade,t.id,d,q,{});
     }
     row.levels.push({d,attempted:count,validated,templates:Object.keys(templateCounts).length,topTemplates:Object.entries(templateCounts).sort((a,b)=>b[1]-a[1]).slice(0,6),unique:unique.size,modelChecked,wrongGrammar,badPunctuation,choicesChecked,answerKinds,samples});
     try{
      window['startG'+grade+'QuizStage'](t.id,d);
      row.uiStarts.push({level:d,rendered:!!document.querySelector('#qstage .quizq')?.textContent?.trim(),mode:window.q?.answerMode??null});
     }catch(e){row.uiStarts.push({level:d,rendered:false,error:String(e)});push('defect','ui-start-error',grade,t.id,d,null,String(e));}
    }
    topics.push(row);
   }
  }
  return {topics,defects,observations,byType};
 });
 report.topics=res.topics;report.defects=res.defects;report.observations=res.observations;
 report.summary={topics:res.topics.length,generated:res.topics.reduce((s,t)=>s+t.levels.reduce((a,l)=>a+l.attempted,0),0),valid:res.topics.reduce((s,t)=>s+t.levels.reduce((a,l)=>a+l.validated,0),0),independentModels:res.topics.reduce((s,t)=>s+t.levels.reduce((a,l)=>a+l.modelChecked,0),0),uiStarts:res.topics.reduce((s,t)=>s+t.uiStarts.length,0),uiRendered:res.topics.reduce((s,t)=>s+t.uiStarts.filter(x=>x.rendered).length,0),countsByType:res.byType,storedDefects:res.defects.length,storedObservations:res.observations.length,pageErrors:pageErrors.length};
 console.log('STAGE16 D DIAGNOSTIC SUMMARY',JSON.stringify(report.summary));
 console.log('STAGE16 D DEFECT SAMPLES',JSON.stringify(report.defects.slice(0,25)));
 console.log('STAGE16 D SOURCE',JSON.stringify(report.sourceExcerpts.filter(x=>x.count).map(x=>({pattern:x.pattern,count:x.count,samples:x.samples.slice(0,1)}))).slice(0,12000));
 if(report.summary.valid!==report.summary.generated||report.summary.uiRendered!==report.summary.uiStarts||pageErrors.length)process.exitCode=1;
 // Findings intentionally remain reviewable: don't silently claim a clean pedagogical release gate.
}catch(e){report.fatal={error:String(e),stack:String(e.stack).slice(0,2400)};console.error('STAGE16 D FATAL',e);process.exitCode=1;}
finally{
 fs.writeFileSync('audits/g1g2_stage16_phaseD_diagnostic_report.json',JSON.stringify(report,null,2)+'\n');
 await browser.close();
}