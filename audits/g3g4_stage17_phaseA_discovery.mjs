import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const approved='b953b710a471210fe0f8247b55e879cedf4d7e11c6f369d551040a9f5d46c7d3';
const htmlHash=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(htmlHash!==approved||!fs.readFileSync('sw.js','utf8').includes('const APP_BUILD_HASH = "'+htmlHash+'"'))throw Error('Refuse unknown candidate or unlinked SW: '+htmlHash);
const chromium=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:chromium,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
const report={stage:'17A-discovery-3-4',htmlSha256:htmlHash,createdAt:new Date().toISOString(),thirdGrade:{},fourthGrade:{},errors:[],pageErrors};
try{
 await page.setViewport({width:1366,height:850});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const result=await page.evaluate(()=>{
   const clean=s=>String(s??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
   const errors=[],grade3={topics:[],written:[],summary:{}},grade4={topics:[],columns:[],tables:[],summary:{}};
   const fail=(kind,context)=>{if(errors.length<100)errors.push({kind,...context})};
   const topicList=typeof g3AllTopics==='function'?g3AllTopics():[];
   let generated=0,verified=0;
   for(const t of topicList){
      const row={id:t.id,title:t.title,rendererType:t.rendererType??null,levels:[]};
      if(t.rendererType==='column'){grade3.topics.push(row);continue;}
      for(let d=0;d<3;d++){
       const signatures=new Set(),promptExamples=[],types=new Set(),cases=105;
       let valid=0,numericChoices=0,explanations=0;
       for(let i=0;i<cases;i++){
         generated++;
         let q;try{q=makeG3Question(t.id,d)}catch(e){fail('G3-gen-exception',{id:t.id,d,error:String(e)});continue}
         if(!q||!clean(q.text)||q.ans===undefined&&q.answer===undefined&&q.answerRat===undefined){fail('G3-invalid-answer',{id:t.id,d});continue}
         valid++;
         if(clean(q.ex))explanations++;
         signatures.add(String(q.sig??JSON.stringify(q.text)));
         types.add(String(q.audit?.templateId??q.templateId??q.kind??'legacy'));
         if(promptExamples.length<2)promptExamples.push({text:clean(q.text).slice(0,170),ex:clean(q.ex).slice(0,150),visual:q.visual?.type??null,answerMode:q.answerMode??(q.choices?.length?'choices':null)});
         if(Array.isArray(q.choices)&&q.choices.length){
           numericChoices++;
           const answer=q.ans??q.answer??q.answerRat,keys=q.choices.map(x=>String(x.key??x.value??x.label));
           if(keys.filter(x=>x===String(answer)).length!==1)fail('G3-choice-invalid',{id:t.id,d,answer:String(answer),keys});
         }
       }
       verified+=valid;
       row.levels.push({level:d,attempted:cases,valid,uniqueSignatures:signatures.size,templates:types.size,explanations,numericChoices,examples:promptExamples});
      }
      grade3.topics.push(row);
   }
   const wTopics=topicList.filter(t=>t.rendererType==='column');
   for(const t of wTopics)for(let d=0;d<3;d++){
     try{
       startG3WrittenStage(t.id,d);
       const root=document.getElementById('stage');
       const text=clean(root?.textContent);
       grade3.written.push({id:t.id,d,kind:blockSession?.kind,key:blockSession?.key,textLength:text.length,excerpt:text.slice(0,250),
         htmlSnippet:String(root?.innerHTML??'').slice(0,3400)});
       if(!text||blockSession?.kind!=='g3column')fail('G3-column-unavailable',{id:t.id,d,kind:blockSession?.kind});
     }catch(e){fail('G3-column-exception',{id:t.id,d,error:String(e)})}
   }
   grade3.summary={topicCount:topicList.length,ordinary:topicList.length-wTopics.length,columnTopics:wTopics.length,generations:generated,valid:verified,writtenLaunched:grade3.written.length};

   try{openGrade(4)}catch(e){fail('G4-open-error',{error:String(e)})}
   const list=typeof TOPICS!=='undefined'&&Array.isArray(TOPICS)?TOPICS:[];
   grade4.topics=list.map(t=>({id:t.id,title:t.title,rendererType:t.rendererType??null}));
   const row=(tag,root)=>{
     const node=document.getElementById(root);
     const text=clean(node?.textContent);
     return {tag,root,textLength:text.length,excerpt:text.slice(0,240),htmlSnippet:String(node?.innerHTML??'').slice(0,5500),
      scrollWidth:node?.scrollWidth??null,clientWidth:node?.clientWidth??null,
      inputCount:node?.querySelectorAll('input').length??0,
      tableCount:node?.querySelectorAll('table').length??0,svgCount:node?.querySelectorAll('svg').length??0};
   };
   for(const t of list.filter(x=>x.id!=='column'&&x.id!=='table')){
     for(let d=0;d<3;d++){
       try{
         startQuizStage(t.id,d);
         const snap=row(t.id+':'+d,'qstage');
         grade4.summary.quizStarted=(grade4.summary.quizStarted??0)+1;
         if(!snap.textLength)fail('G4-quiz-empty',{id:t.id,d});
         if(!grade4.quizExamples)grade4.quizExamples=[];
         grade4.quizExamples.push({id:t.id,d,excerpt:snap.excerpt,htmlSnippet:snap.htmlSnippet.slice(0,1000),textLength:snap.textLength});
       }catch(e){fail('G4-quiz-error',{id:t.id,d,error:String(e)})}
     }
   }
   for(const op of ['add','sub','mul','div'])for(let d=0;d<3;d++){
     try{
       startColumnStage(op,d);
       const snap=row('column:'+op+':'+d,'stage');
       grade4.columns.push({op,d,kind:blockSession?.kind,key:blockSession?.key,...snap});
       if(!snap.textLength||blockSession?.kind!=='column')fail('G4-column-not-started',{op,d,kind:blockSession?.kind});
     }catch(e){fail('G4-column-exception',{op,d,error:String(e)})}
   }
   for(let d=0;d<3;d++){
     try{startTableStage(d);const snap=row('table:'+d,'tstage');grade4.tables.push({d,kind:blockSession?.kind,...snap});
       if(!snap.textLength||blockSession?.kind!=='table')fail('G4-table-not-started',{d})}
     catch(e){fail('G4-table-error',{d,error:String(e)})}
   }
   grade4.summary={...grade4.summary,topicCount:list.length,columnSessions:grade4.columns.length,tableSessions:grade4.tables.length};
   return {grade3,grade4,errors};
 });
 report.thirdGrade=result.grade3;report.fourthGrade=result.grade4;report.errors=result.errors;
 report.summary={grade3:result.grade3.summary,grade4:result.grade4.summary,errors:result.errors.length,pageErrors:pageErrors.length};
 console.log('STAGE17 A DISCOVERY',JSON.stringify(report.summary));
 console.log('G4 TOPICS',JSON.stringify(result.grade4.topics));
 for(const c of result.grade4.columns)console.log('G4 COLUMN',JSON.stringify({op:c.op,d:c.d,excerpt:c.excerpt,inputs:c.inputCount,scroll:c.scrollWidth,width:c.clientWidth,html:c.htmlSnippet.slice(0,1100)}));
 console.log('ERRORS',JSON.stringify(result.errors.slice(0,14)));
 if(result.errors.length||pageErrors.length||result.grade4.columns.length!==12||result.grade4.tables.length!==3||result.grade3.summary.valid!==result.grade3.summary.generations)process.exitCode=1;
}catch(e){report.errors.push({fatal:String(e),stack:String(e.stack).slice(0,1700)});console.error('STAGE17A FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g3g4_stage17_phaseA_discovery_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}