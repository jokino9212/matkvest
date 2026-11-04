import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const expected='8bd7ccd047368b8754299e7c1bd5995229f789b040a9ca8478d1ecb4b521da5a';
const hash=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(hash!==expected || !fs.readFileSync('sw.js','utf8').includes('const APP_BUILD_HASH = "'+hash+'"'))throw Error('Refuse unchecked HTML or mismatched PWA hash: '+hash);
const binary=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath:binary,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),jsErrors=[];
page.on('pageerror',e=>jsErrors.push(String(e)));
const report={stage:'17D-initial-semantic-diagnostic',htmlSha256:hash,at:new Date().toISOString(),perTopic:[],defects:[],flags:[],samples:[],ui:[],jsErrors,summary:{}};
try{
 await page.setViewport({width:390,height:844});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const result=await page.evaluate(()=>{
  const perTopic=[],defects=[],defectCounts={},defectExamples={},flags=[],samples=[],ui=[];
  const clean=x=>String(x??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
  const error=(kind,ctx)=>{defectCounts[kind]=(defectCounts[kind]||0)+1;if(!defectExamples[kind])defectExamples[kind]=[];if(defectExamples[kind].length<8)defectExamples[kind].push({kind,...ctx});if(defects.length<180)defects.push({kind,...ctx})};
  const flag=(kind,ctx)=>{if(flags.length<160)flags.push({kind,...ctx})};
  const number=x=>typeof x==='number'?x:/^-?\d+(?:[.,]\d+)?$/.test(String(x))?Number(String(x).replace(',','.')):null;
  const correct=q=>q.ans??q.answer??q.answerRat;
  const normalize=x=>clean(x).replace(/\d+(?:[,.]\d+)?/g,'#').replace(/\b(?:Пети|Маши|Саши|Даши)\b/g,'ИМЯ');
  function evalExpr(s){
   const str=String(s).replace(/−/g,'-').replace(/[×·]/g,'*').replace(/[÷:]/g,'/').replace(/\s+/g,'');
   if(!/^[0-9()+*/.-]+$/.test(str))return null;
   const tokens=str.match(/\d+(?:\.\d+)?|[()+*/-]/g);
   if(!tokens||tokens.join('')!==str)return null;
   let i=0;
   function atom(){if(tokens[i]==='-'){i++;return -atom()}if(tokens[i]==='('){i++;const v=expr();if(tokens[i++]!==')')throw Error('paren');return v}const v=Number(tokens[i++]);if(!Number.isFinite(v))throw Error('num');return v}
   function term(){let v=atom();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],a=atom();v=op==='*'?v*a:v/a}return v}
   function expr(){let v=term();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],a=term();v=op==='+'?v+a:v-a}return v}
   try{const v=expr();return i===tokens.length&&Number.isFinite(v)?v:null}catch{return null}
  }
  const groupPattern=/(?:^|[^\d])(?:[5-9]|1[1-9]|\d*[05-9])\s+одинаковые\s+группы(?=\W|$)/giu;
  const badRaza=/(?:^|[^\d])(?:[5-9]|1[1-9]|\d*[05-9])\s+раза(?=\W|$)/giu;
  const moneyPunct=/(?:коп|руб)\.\s*\./giu;
  function inspectQuestion(q,context,row){
    const prompt=clean(q?.text),ex=clean(q?.ex),ans=correct(q);
    if(!prompt||!ex||ans===undefined||ans===null){error('missing-prompt-explanation-answer',{...context,prompt:prompt.slice(0,100),ex:ex.slice(0,100),ans:String(ans)});return}
    row.valid++;
    row.promptKinds.add(normalize(prompt));
    row.rawPrompts.add(prompt);
    row.explanationCount++;
    row.meanPromptLength+=prompt.length;
    row.meanNumericDigits+=(prompt.match(/\d/g)||[]).length;
    const strings=[['prompt',prompt],['explanation',ex]];
    for(const [field,s] of strings){
      for(const [rule,regex] of [['plural-five-groups',groupPattern],['plural-five-times',badRaza],['double-period-money',moneyPunct]]){
       regex.lastIndex=0;
       if(regex.test(s))error(rule,{...context,field,text:s.slice(0,280)});
      }
    }
    const eq=/(-?\d{1,8}(?:\s*[+−\-×·:÷]\s*-?\d{1,8})+)\s*=\s*(-?\d{1,10})(?![\d.,])/gu;
    let match;
    while((match=eq.exec(ex))!==null){
      const prefix=ex.slice(Math.max(0,match.index-55),match.index).trim();
      const expression=/(?:по|прибавляем|вычитаем)$/u.test(prefix)?match[1].replace(/^\s*\d+\s*:\s*(?=\d+\s*[+−\-×·])/u,''):match[1], output=Number(match[2]);
      if(/[:÷]/.test(expression)&&/ост(?:ат|\.|\s)/i.test(ex))continue;
      const value=evalExpr(expression);
      if(value===null)continue;
      row.explanationEquations++;
      if(Math.abs(value-output)>1e-8)
       error('incorrect-explanation-equation',{...context,match:match[0],calculated:value,text:ex.slice(0,320)});
    }
    const arithmetic=prompt.match(/^([\d\s()+−\-×·÷:]+)\s*=\s*\?/);
    if(arithmetic&&number(ans)!==null){
      const computed=evalExpr(arithmetic[1]);
      if(computed!==null){
        row.independentAnswers++;
        if(Math.abs(computed-number(ans))>1e-8)error('incorrect-expression-answer',{...context,prompt,answer:String(ans),independent:computed});
      }
    }
    const comparing=prompt.match(/^\s*(\d+)\s*\?\s*(\d+)\s*$/);
    if(comparing&&['<','>','='].includes(String(ans))){
      const op=+comparing[1]<+comparing[2]?'<':+comparing[1]>+comparing[2]?'>':'=';
      row.independentAnswers++;
      if(op!==String(ans))error('incorrect-compare-answer',{...context,prompt,answer:String(ans),independent:op});
    }
    const rounding=prompt.match(/Округли(?:те)? число (\d+) до (десятков тысяч|десятков|сотен|тысяч)/i);
    if(rounding&&number(ans)!==null){
      const p={'десятков':10,'сотен':100,'тысяч':1000,'десятков тысяч':10000}[rounding[2].toLowerCase()];
      const n=Math.floor(+rounding[1]/p+0.5)*p;
      row.independentAnswers++;
      if(n!==number(ans))error('incorrect-rounding',{...context,prompt,answer:String(ans),independent:n});
    }
    const c=q.choices;
    if(Array.isArray(c)&&c.length){
      row.choiceQuestions++;
      const keys=c.map(v=>String(v.key??v.value??v.label));
      const labels=c.map(v=>clean(v.label??v.key??v.value));
      if(keys.filter(v=>v===String(ans)).length!==1)error('choice-key-missing-or-nonunique',{...context,prompt,ans:String(ans),keys});
      if(new Set(keys).size!==keys.length)error('duplicate-choice-keys',{...context,prompt,keys});
      if(new Set(labels).size!==labels.length)error('duplicate-choice-labels',{...context,prompt,labels});
      const candidates=labels.map(number);
      const answerNum=number(ans);
      if(candidates.every(v=>v!==null)&&answerNum!==null){
        row.verifiedNumericDistractors+=Math.max(0,candidates.length-1);
        if(candidates.filter(v=>v===answerNum).length!==1)error('ambiguous-numeric-choices',{...context,prompt,ans:String(ans),labels});
      }
    }
    if(context.i===0&&samples.length<240)samples.push({...context,prompt:prompt.slice(0,220),ex:ex.slice(0,240),answer:String(ans),auditType:q.audit?.type??null,auditVariant:q.audit?.variant??null,visual:q.visual?.type??null,choices:q.choices?.map(x=>x.label).slice(0,5)});
  }
  const g3=g3AllTopics();
  for(const t of g3){
   const isColumn=t.rendererType==='column',row={grade:3,id:t.id,title:t.title,isColumn,levels:[]};
   if(!isColumn)for(let d=0;d<3;d++){
    const layer={d,attempts:0,valid:0,promptKinds:new Set(),rawPrompts:new Set(),explanationCount:0,meanPromptLength:0,meanNumericDigits:0,explanationEquations:0,independentAnswers:0,choiceQuestions:0,verifiedNumericDistractors:0};
    for(let i=0;i<90;i++){
     layer.attempts++;
     try{inspectQuestion(makeG3Question(t.id,d),{grade:3,id:t.id,d,i},layer)}
     catch(e){error('g3-generator-exception',{id:t.id,d,i,message:String(e)})}
    }
    const unique=layer.rawPrompts.size,shapes=layer.promptKinds.size;
    row.levels.push({d,generated:layer.attempts,valid:layer.valid,uniquePrompts:unique,structuralShapes:shapes,meanPromptLength:Math.round(layer.meanPromptLength/Math.max(1,layer.valid)),meanDigits:+(layer.meanNumericDigits/Math.max(1,layer.valid)).toFixed(1),explanationEquations:layer.explanationEquations,independentAnswers:layer.independentAnswers,choiceQuestions:layer.choiceQuestions,verifiedNumericDistractors:layer.verifiedNumericDistractors});
    if(unique<8)flag('low-exact-variety',{id:t.id,d,unique});
    if(shapes<2)flag('one-structural-template',{id:t.id,d,shapes});
   }
   perTopic.push(row);
  }
  openGrade(4);
  for(const t of TOPICS){
   const row={grade:4,id:t.id,title:t.title,legacySpecial:['column','table'].includes(t.id),levels:[]};
   if(!row.legacySpecial)for(let d=0;d<3;d++){
     const layer={d,attempts:0,valid:0,promptKinds:new Set(),rawPrompts:new Set(),explanationCount:0,meanPromptLength:0,meanNumericDigits:0,explanationEquations:0,independentAnswers:0,choiceQuestions:0,verifiedNumericDistractors:0};
     try{
       startQuizStage(t.id,d);
       const box=document.getElementById('qstage'),theory=document.querySelector('.lesson');
       ui.push({grade:4,id:t.id,d,hasQuiz:!!box?.querySelector('.quizq'),theoryChars:clean(theory?.textContent).length});
       if(!box?.querySelector('.quizq'))error('g4-missing-quiz-dom',{id:t.id,d});
       if(clean(theory?.textContent).length<70)flag('g4-short-theory',{id:t.id,d,chars:clean(theory?.textContent).length});
       for(let i=0;i<90;i++){
         layer.attempts++;
         inspectQuestion(makeQ(t.id),{grade:4,id:t.id,d,i},layer);
       }
     }catch(e){error('g4-generator-exception',{id:t.id,d,message:String(e)})}
     row.levels.push({d,generated:layer.attempts,valid:layer.valid,uniquePrompts:layer.rawPrompts.size,structuralShapes:layer.promptKinds.size,meanPromptLength:Math.round(layer.meanPromptLength/Math.max(1,layer.valid)),meanDigits:+(layer.meanNumericDigits/Math.max(1,layer.valid)).toFixed(1),explanationEquations:layer.explanationEquations,independentAnswers:layer.independentAnswers,choiceQuestions:layer.choiceQuestions,verifiedNumericDistractors:layer.verifiedNumericDistractors});
     if(layer.rawPrompts.size<8)flag('low-exact-variety',{id:t.id,d,unique:layer.rawPrompts.size});
   }
   perTopic.push(row);
  }
  return {perTopic,defects,defectCounts,defectExamples,flags,samples,ui,summary:{grade3Topics:g3.length,grade4Topics:TOPICS.length,grade3Generations:perTopic.filter(x=>x.grade===3).flatMap(x=>x.levels).reduce((s,x)=>s+x.generated,0),grade4Generations:perTopic.filter(x=>x.grade===4).flatMap(x=>x.levels).reduce((s,x)=>s+x.generated,0),valid:perTopic.flatMap(x=>x.levels).reduce((s,x)=>s+x.valid,0),independentMath:perTopic.flatMap(x=>x.levels).reduce((s,x)=>s+x.independentAnswers+x.explanationEquations,0),numericDistractors:perTopic.flatMap(x=>x.levels).reduce((s,x)=>s+x.verifiedNumericDistractors,0),defects:defects.length,flags:flags.length,g4UI:ui.length}};
 });
 Object.assign(report,result);
 report.summary={...result.summary,jsErrors:jsErrors.length,defectTypes:result.defectCounts};
 console.log('STAGE17 D SEMANTIC SUMMARY',JSON.stringify(report.summary));
 console.log('STAGE17 D DEFECTS',JSON.stringify(report.defects.slice(0,28)));
 console.log('STAGE17 D QUALITY FLAGS',JSON.stringify(report.flags.slice(0,18)));
 console.log('STAGE17 D PER TOPIC',JSON.stringify(report.perTopic.map(x=>({id:x.id,levels:x.levels.map(l=>[l.d,l.uniquePrompts,l.structuralShapes,l.independentAnswers,l.explanationEquations])}))));
 if(report.defects.length||jsErrors.length||result.summary.grade3Topics!==48||result.summary.grade4Topics!==8||result.summary.valid!==result.summary.grade3Generations+result.summary.grade4Generations)process.exitCode=1;
}catch(e){report.defects.push({fatal:String(e),stack:String(e.stack).slice(0,1600)});console.error('STAGE17 D FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g3g4_stage17_phaseD_semantics_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
