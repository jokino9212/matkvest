import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const expected='04a719fe8c292d8fe42b9762fdca5b8b48c316042cbdb1709ac18fe5290eff21';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(sha!==expected)throw Error('Unapproved HTML: '+sha);
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v49')||!sw.includes('const APP_BUILD_HASH = "'+sha+'"'))throw Error('Unapproved service worker');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('No browser');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,timeout:90000,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),jsErrors=[];
page.on('pageerror',e=>jsErrors.push(String(e)));
const report={phase:'17D-final-coverage-diagnostic',sha256:sha,at:new Date().toISOString(),topics:[],columns:[],grade4:[],ui:[],warnings:[],errors:[],jsErrors,summary:{}};
try{
 await page.setViewport({width:390,height:844});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const d=await page.evaluate(()=>{
  const errors=[],warnings=[],topics=[],columns=[],grade4=[],ui=[],N=400;
  const fail=(kind,info)=>{if(errors.length<120)errors.push({kind,...info})};
  const warn=(kind,info)=>{if(warnings.length<120)warnings.push({kind,...info})};
  const normalize=x=>String(x??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const columnNames=['written_add','written_subtract','written_multiply','written_divide'];
  const sets=g3AllTopics(),basic=sets.filter(t=>t.rendererType==='quiz'),written=sets.filter(t=>t.rendererType==='column');
  if(sets.length!==48||basic.length!==44||written.length!==4)fail('missing-grade3-topic',{total:sets.length,quiz:basic.length,column:written.length});
  if(sets.some(t=>t.implemented===false)||new Set(sets.map(t=>t.id)).size!==sets.length)fail('unimplemented-or-duplicate-g3',{unimplemented:sets.filter(t=>t.implemented===false).map(t=>t.id)});
  for(const t of sets){
   const topic={id:t.id,title:t.title,rendererType:t.rendererType,levels:[],checks:0};
   for(let l=0;l<3;l++){
    const sigs=new Set(),values=new Set();let ok=0;
    for(let i=0;i<80;i++){
     try{
      const q=t.rendererType==='column'?generateG3ColumnTask(t.id,l):makeG3Question(t.id,l);
      if(!q||q.ans===undefined||q.ans===null||String(q.ans)==='')fail('unreadable-g3-answer',{id:t.id,l,i});
      if(t.rendererType==='quiz'&&(!q.text||!q.ex||!q.sig))fail('g3-missing-fields',{id:t.id,l,i});
      if(q.sig)sigs.add(q.sig);
      values.add(q.ans);
      ok++;
     }catch(e){fail('g3-create-exception',{id:t.id,l,i,error:String(e)})}
    }
    topic.levels.push({difficulty:l,valid:ok,uniqueSignature:sigs.size,distinctAnswers:values.size});
   }
   topics.push(topic);
  }
  for(const raw of columnNames)for(let l=0;l<3;l++){
   const stats={id:'g3:'+raw,level:l,generated:0,correct:0,carryCounts:{},borrowCounts:{},twoCarry:0,zeroCarry:0,quotientDigits:{},dividendDigits:{},answerRange:[Infinity,-Infinity],ui:null};
   for(let i=0;i<N;i++){
    let q;
    try{q=generateG3ColumnTask('g3:'+raw,l)}catch(e){fail('column-exception',{id:raw,l,i,error:String(e)});continue}
    if(!q){fail('column-null',{id:raw,l,i});continue}
    const a=q.a,b=q.b,v=q.ans,expected=raw==='written_add'?a+b:raw==='written_subtract'?a-b:raw==='written_multiply'?a*b:a/b;
    if(!Number.isInteger(a)||!Number.isInteger(b)||a<=0||b<=0||!Number.isInteger(v)||v!==expected||v<0||!q.audit)fail('column-math',{id:raw,l,i,a,b,v,expected});
    if(raw==='written_add'){
     const carry=g3HasCarry(a,b);
     stats.carryCounts[carry]=(stats.carryCounts[carry]??0)+1;
     if(carry!==q.audit.carries||l===0&&carry!==0||l===1&&carry!==1||l===2&&carry<2||v>1000)fail('column-add-carries',{id:raw,l,i,a,b,carry});
    }else if(raw==='written_subtract'){
     const borrow=g3BorrowCount(a,b);
     stats.borrowCounts[borrow]=(stats.borrowCounts[borrow]??0)+1;
     if(borrow!==q.audit.borrows||l===0&&borrow!==0||l===1&&borrow<1||l===2&&borrow<2)fail('column-sub-borrows',{id:raw,l,i,a,b,borrow});
    }else if(raw==='written_multiply'){
     const uc=Math.floor((a%10)*b/10);
     const tc=Math.floor((Math.floor(a/10)*b+uc)/10);
     const carries=Number(uc>0)+Number(tc>0);
     stats.carryCounts[carries]=(stats.carryCounts[carries]??0)+1;
     if(carries===2)stats.twoCarry++;
     if(carries===0)stats.zeroCarry++;
     if(q.singleDigitMultiplier!==true||b>9||a>99||v>999||l===0&&carries!==0||l===1&&carries<1)fail('column-mul-model',{id:raw,l,i,a,b,carries});
    }else{
     const quotientDigits=String(v).length,dividendDigits=String(a).length;
     stats.quotientDigits[quotientDigits]=(stats.quotientDigits[quotientDigits]??0)+1;
     stats.dividendDigits[dividendDigits]=(stats.dividendDigits[dividendDigits]??0)+1;
     if(a>999||b>9||a%b!==0||String(q.quotient)!==String(v)||!Array.isArray(q.steps)||!q.steps.length)fail('column-div-model',{id:raw,l,i,a,b,v,steps:q.steps});
    }
    stats.answerRange[0]=Math.min(stats.answerRange[0],v);
    stats.answerRange[1]=Math.max(stats.answerRange[1],v);
    stats.generated++;stats.correct++;
   }
   if(raw==='written_multiply'&&l===2&&stats.twoCarry<N*.7)warn('hard-column-mul-lacks-double-carry',{id:raw,l,twoCarry:stats.twoCarry,samples:N,distribution:stats.carryCounts});
   if(raw==='written_divide'&&l===2&&!(stats.quotientDigits['3']>N*.7))warn('hard-column-division-never-three-digit-quotient',{id:raw,l,digits:stats.quotientDigits});
   columns.push(stats);
  }
  // Exercise actual paths for every grade3 topic, including the four column renderers.
  for(const t of sets)for(let l=0;l<3;l++){
    try{
     startG3QuizStage(t.id,l);
     const session={kind:blockSession?.kind,key:blockSession?.key,stageIndex:blockSession?.stageIndex},
      dom=document.querySelector('#qstage'),txt=normalize(dom?.textContent),
      isColumn=t.rendererType==='column',
      hasTask=!!dom&&(txt.length>20||!!dom.querySelector('.column'));
     ui.push({grade:3,id:t.id,l,session,textChars:txt.length,hasTask,isColumn});
     if(!hasTask)fail('grade3-ui-not-rendered',{id:t.id,l,session,textChars:txt.length});
     if(isColumn&&session.kind!=='g3column')fail('grade3-column-wrong-engine',{id:t.id,l,session});
     if(!isColumn&&session.kind!=='g3quiz')fail('grade3-quiz-wrong-engine',{id:t.id,l,session});
    }catch(e){fail('grade3-ui-exception',{id:t.id,l,error:String(e)})}
  }
  openGrade(4);
  if(TOPICS.length!==8||new Set(TOPICS.map(t=>t.id)).size!==8)fail('grade4-topic-inventory',{count:TOPICS.length,ids:TOPICS.map(t=>t.id)});
  const specials=['column','table'];
  for(const t of TOPICS){
    const row={id:t.id,title:t.title,levels:[],legacySpecial:specials.includes(t.id)};
    if(!row.legacySpecial)for(let l=0;l<3;l++){
     try{
      startQuizStage(t.id,l);
      const sigs=new Set();let valid=0;
      for(let i=0;i<100;i++){
       const q=makeQ(t.id);
       if(!q?.text||q.ans===undefined||!q.sig)fail('grade4-quiz-incomplete',{id:t.id,l,i});
       sigs.add(q.sig);valid++;
      }
      row.levels.push({l,valid,uniqueSig:sigs.size});
     }catch(e){fail('grade4-quiz-exception',{id:t.id,l,error:String(e)})}
    }
    grade4.push(row);
  }
  for(const t of TOPICS.filter(t=>!specials.includes(t.id)))for(let l=0;l<3;l++){
    try{
     startQuizStage(t.id,l);
     const dom=document.querySelector('#qstage'),txt=normalize(dom?.textContent);
     ui.push({grade:4,id:t.id,l,hasTask:!!dom&&txt.length>20,textChars:txt.length});
     if(!dom||txt.length<20)fail('grade4-quiz-ui',{id:t.id,l,textChars:txt.length});
    }catch(e){fail('grade4-quiz-ui-exception',{id:t.id,l,error:String(e)})}
  }
  for(const mode of ['add','sub','mul','div'])for(let l=0;l<3;l++){
    try{
     startColumnStage(mode,l);
     const task=generateColumnTask(),expected=mode==='add'?task.a+task.b:mode==='sub'?task.a-task.b:mode==='mul'?task.a*task.b:task.a/task.b,
      dom=document.querySelector('#qstage'),txt=normalize(dom?.textContent);
     ui.push({grade:4,id:'column:'+mode,l,hasTask:!!dom&&txt.length>20,textChars:txt.length,task:{a:task.a,b:task.b,ans:task.ans}});
     if(!task||task.ans!==expected)fail('grade4-column-math',{mode,l,task,expected});
     if(!dom||txt.length<20)fail('grade4-column-ui',{mode,l,textChars:txt.length});
    }catch(e){fail('grade4-column-exception',{mode,l,error:String(e)})}
  }
  for(let l=0;l<3;l++){
    try{
     startTableStage(l);
     const dom=document.querySelector('#qstage'),txt=normalize(dom?.textContent);
     ui.push({grade:4,id:'table',l,hasTask:!!dom&&txt.length>20,textChars:txt.length});
     if(!dom||txt.length<20)fail('grade4-table-ui',{l,textChars:txt.length});
    }catch(e){fail('grade4-table-exception',{l,error:String(e)})}
  }
  const runtimeHints={startG3WrittenStage:typeof startG3WrittenStage==='function'?String(startG3WrittenStage).slice(0,3500):'missing',startColumnStage:typeof startColumnStage==='function'?String(startColumnStage).slice(0,3500):'missing',startTableStage:typeof startTableStage==='function'?String(startTableStage).slice(0,3500):'missing',openColumn:typeof openColumn==='function'?String(openColumn).slice(0,1500):'missing',visibleIds:[...document.querySelectorAll('[id]')].filter(el=>{const r=el.getBoundingClientRect();return r.width>10&&r.height>10&&r.y>=-700&&r.y<1600}).slice(-50).map(el=>({id:el.id,text:normalize(el.textContent).slice(0,100)}))};
  return {topics,columns,grade4,ui,errors,warnings,runtimeHints,summary:{grade3Topics:sets.length,grade3Quiz:basic.length,grade3Column:written.length,grade4Topics:TOPICS.length,grade4LegacySpecial:specials.length,grade3ColumnGenerated:columns.reduce((s,x)=>s+x.generated,0),grade3ColumnCorrect:columns.reduce((s,x)=>s+x.correct,0),grade3UI:ui.filter(x=>x.grade===3).length,grade4UI:ui.filter(x=>x.grade===4).length,uiReady:ui.filter(x=>x.hasTask).length,uiExpected:48*3+(6+4+1)*3}};
 });
 Object.assign(report,d);
 report.summary={...d.summary,errors:d.errors.length,warningCount:d.warnings.length,jsErrors:jsErrors.length};
 console.log('INVENTORY',JSON.stringify(report.summary));
 console.log('COLUMNS',JSON.stringify(report.columns.map(c=>({id:c.id,l:c.level,carry:c.carryCounts,borrow:c.borrowCounts,quotientDigits:c.quotientDigits,dividendDigits:c.dividendDigits,twoCarry:c.twoCarry}))));
 console.log('WARNINGS',JSON.stringify(report.warnings));
 if(d.errors.length)console.log('INVENTORY ERRORS',JSON.stringify(d.errors.slice(0,25)));
}catch(e){report.errors.push({fatal:String(e),stack:String(e.stack).slice(0,1500)});console.error('FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g3g4_stage17_final_coverage_diagnostic.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
