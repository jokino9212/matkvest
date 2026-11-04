import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const expected='b953b710a471210fe0f8247b55e879cedf4d7e11c6f369d551040a9f5d46c7d3';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(sha!==expected||!fs.readFileSync('sw.js','utf8').includes('const APP_BUILD_HASH = "'+sha+'"'))throw Error('Refuse unchecked source/SW '+sha);
const binary=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath:binary,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),jsErrors=[];
page.on('pageerror',e=>jsErrors.push(String(e)));
const report={stage:'16D-semantic-answer-gate',htmlSha256:sha,checkedAt:new Date().toISOString(),topics:[],errors:[],notes:[],jsErrors,ui:[]};
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const res=await page.evaluate(()=>{
  const topics=[],errors=[],notes=[],ui=[];
  const clean=x=>String(x??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const fail=(kind,id,d,detail)=>{if(errors.length<100)errors.push({kind,id,d,...detail})};
  const evalExpression=x=>{
   if(!/^[\d+\-−×*·÷:/().\s]+$/u.test(x))return null;
   const a=x.replace(/−/g,'-').replace(/[×·]/g,'*').replace(/[÷:]/g,'/').replace(/\s/g,'');
   const tokens=a.match(/\d+(?:\.\d+)?|[()+*/-]/g);
   if(!tokens||tokens.join('')!==a)return null;
   let pos=0;
   const factor=()=>{
    if(tokens[pos]==='-'){pos++;return -factor()}
    if(tokens[pos]==='('){pos++;const n=expr();if(tokens[pos++]!==')')throw Error('paren');return n;}
    const n=Number(tokens[pos++]);if(!Number.isFinite(n))throw Error('number');return n;
   };
   const term=()=>{let v=factor();while(tokens[pos]==='*'||tokens[pos]==='/'){const op=tokens[pos++],b=factor();v=op==='*'?v*b:v/b}return v};
   const expr=()=>{let v=term();while(tokens[pos]==='+'||tokens[pos]==='-'){const op=tokens[pos++],b=term();v=op==='+'?v+b:v-b}return v};
   try{const v=expr();return pos===tokens.length&&Number.isFinite(v)?v:null}catch{return null}
  };
  const correctMathChoice=(label,m,topicId)=>{
    const s=clean(label);
    if(s.includes('=')){
      const parts=s.split('=').map(x=>x.trim());if(parts.length!==2)return null;
      const a=evalExpression(parts[0]),b=evalExpression(parts[1]);
      return a===null||b===null?null:Math.abs(a-b)<1e-8;
    }
    if(topicId==='g2:geometric_quantities'&&m?.perimeter!=null){
      const value=evalExpression(s);return value===null?null:Math.abs(value-m.perimeter)<1e-8;
    }
    if(topicId==='g2:word_problems'&&m?.result!=null&&/[\d+\-−×÷]/u.test(s)){
      const value=evalExpression(s);return value===null?null:Math.abs(value-m.result)<1e-8;
    }
    return null;
  };
  let allGenerated=0,choices=0,mathChoices=0,wrongOptionsSemanticallyVerified=0,visualGeometry=0,triangles=0,explanations=0,templateCount=0;
  for(const grade of [1,2]){
   const all=window['g'+grade+'AllTopics'](),make=window['makeG'+grade+'Question'];
   for(const t of all){
    const row={grade,id:t.id,levels:[],questionExamples:[]};
    for(let d=0;d<3;d++){
     const templateFreq={},sampleCount=310,seenPrompts=new Set();
     let numericChoiceGroups=0,allOptionsSemanticsKnown=0,explanationMath=0,visualMath=0;
     for(let i=0;i<sampleCount;i++){
      let q;try{q=make(t.id,d)}catch(e){fail('generator',t.id,d,{error:String(e)});continue}
      allGenerated++;
      const answer=q.ans??q.answer??q.answerRat,tid=q.audit?.templateId??q.templateId??'unknown';
      templateFreq[tid]=(templateFreq[tid]||0)+1;
      const prompt=clean(q.text),ex=clean(q.ex);
      if(!prompt||!ex)fail('missing-prompt-or-explanation',t.id,d,{prompt,ex});
      explanations++;
      seenPrompts.add(prompt+'|'+JSON.stringify(q.visual?.data??null));
      const m=q.audit?.model;
      if(Array.isArray(q.choices)&&q.choices.length){
       choices++;
       const keys=q.choices.map(x=>String(x.key??x.value??x.label));
       if(keys.filter(x=>x===String(answer)).length!==1)fail('correct-choice-not-unique',t.id,d,{prompt,answer:String(answer),keys});
       if(new Set(keys).size!==keys.length)fail('duplicated-key',t.id,d,{prompt,keys});
       const validity=q.choices.map(c=>correctMathChoice(c.label??c.key??c.value,m,t.id));
       if(validity.some(x=>x!==null)){
        mathChoices++;numericChoiceGroups++;
        if(validity.every(x=>x!==null)){
          allOptionsSemanticsKnown++;wrongOptionsSemanticallyVerified+=Math.max(0,validity.length-1);
          const rightIndex=keys.findIndex(k=>k===String(answer));
          if(validity.filter(Boolean).length!==1||validity[rightIndex]!==true)
            fail('mathematically-ambiguous-distractors',t.id,d,{prompt,labels:q.choices.map(x=>x.label),answer:String(answer),validity,model:m});
        }else{
          if(notes.length<35)notes.push({kind:'partial-choice-parser-coverage',id:t.id,d,template:tid,prompt,validity});
        }
       }
      }
      const v=q.visual;
      if(v&&typeof v==='object'){
       const obj=v.data;
       if(v.type==='g2Perimeter'&&obj){
        visualGeometry++;
        const p=x=>x.shape==='rectangle'?2*(x.a+x.b):x.shape==='square'?4*x.a:x.shape==='triangle'?x.a+x.b+x.c:null;
        for(const sh of [obj,obj.left,obj.right].filter(Boolean)){
         const perimeter=p(sh);
         if(perimeter!==null&&sh.perimeter!==undefined&&Math.abs(perimeter-sh.perimeter)>1e-9)
           fail('visual-perimeter-mismatch',t.id,d,{prompt,shape:sh});
         if(sh.shape==='triangle'){
           triangles++;if(!(sh.a+sh.b>sh.c&&sh.a+sh.c>sh.b&&sh.b+sh.c>sh.a))
             fail('nonexistent-triangle',t.id,d,{prompt,shape:sh});
         }
         if(sh.shape==='square'&&sh.b!==undefined&&sh.b!==sh.a)
           fail('square-side-mismatch',t.id,d,{prompt,shape:sh});
        }
        if(obj.showPerimeter===true)fail('unhidden-answer-visual',t.id,d,{prompt});
       }
       if(v.type==='g2Story'&&obj?.showDerived===true)fail('premature-derived-step',t.id,d,{prompt});
      }
      if(m&&m.steps&&Array.isArray(m.steps)&&m.steps.length){
       for(const step of m.steps){
        if(typeof step!=='string'||!/^\d+(?:\s*[+\-−×·÷:]\s*\d+)+\s*=\s*\d+/.test(step))continue;
        const eq=step.split('=');
        if(eq.length<2)continue;
        const got=evalExpression(eq[0]),target=evalExpression(eq[1]);
        if(got!==null&&target!==null){
         explanationMath++;
         if(Math.abs(got-target)>1e-8)fail('incorrect-explanation-step',t.id,d,{prompt,step,got,target});
        }
       }
      }
     }
     templateCount+=Object.keys(templateFreq).length;
     row.levels.push({d,generated:sampleCount,uniquePrompts:seenPrompts.size,templates:Object.keys(templateFreq).length,templateFrequency:templateFreq,numericChoiceGroups,allOptionsSemanticsKnown,independentExplanationSteps:explanationMath,visualMath});
    }
    topics.push(row);
   }
  }
  // Verify actual accepted numeric answers plus the rejected input already checked in other QA.
  for(const grade of [1,2])for(const d of [1,2]){
    let solved=false;
    for(let i=0;i<125;i++){
      window['startG'+grade+'QuizStage']('g'+grade+':word_problems',d);
      const input=document.getElementById('quizInput'),check=document.getElementById('quizCheck');
      if(!input||!check)continue;
      const q=window.q;
      const variants=[q?.ans,q?.answer,q?.answerRat].filter(x=>typeof x==='string'||typeof x==='number');
      const answer=variants.find(x=>/^-?\d+(?:[,.]\d+)?$/.test(String(x)));
      if(answer===undefined)continue;
      const initial=blockSession?.correct??0;
      input.value=String(answer);check.click();
      const credited=(blockSession?.correct??0)-initial,feedback=clean(document.getElementById('qfb')?.textContent);
      ui.push({grade,d,answer:String(answer),credited,feedback:feedback.slice(0,100)});
      if(credited!==1)fail('correct-input-rejected','g'+grade+':word_problems',d,{answer:String(answer),feedback});
      solved=true;break;
    }
    if(!solved)fail('correct-input-scenario-unavailable','g'+grade+':word_problems',d,{});
  }
  return {topics,errors,notes,ui,summary:{topicCount:topics.length,generated:allGenerated,choices,mathChoices,wrongOptionsSemanticallyVerified,visualGeometry,triangles,explanations,templateCount,correctInputCases:ui.length,correctInputsCredited:ui.filter(x=>x.credited===1).length}};
 });
 report.topics=res.topics;report.errors=res.errors;report.notes=res.notes;report.ui=res.ui;
 report.summary={...res.summary,errors:res.errors.length,jsErrors:jsErrors.length};
 console.log('STAGE16D ANSWER SEMANTIC SUMMARY',JSON.stringify(report.summary));
 console.log('DEFECTS',JSON.stringify(res.errors.slice(0,24)));
 console.log('CORRECT INPUT',JSON.stringify(res.ui));
 if(res.errors.length||jsErrors.length||res.summary.correctInputsCredited!==4)process.exitCode=1;
}catch(e){report.errors.push({fatal:String(e),stack:String(e.stack).slice(0,1800)});console.error('STAGE16D ANSWER SEMANTIC FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g1g2_stage16_phaseD_answer_semantic_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}