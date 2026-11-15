const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 const pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(String(e)));
 await page.goto(pathToFileURL(process.cwd()+'/index.html').href);
 const topics=await page.evaluate(()=>g7AllTopics().map(x=>x.id));
 let questions=0,sessions=0;
 const failures=[];
 for(const id of topics){
  const tested=await page.evaluate(id=>{
   const result=[];
   for(let d=0;d<3;d++){
    const seen=new Set(), families=new Set();
    let repeats=0;
    try{
     startG7QuizStage(id,d);
     const total=STAGES[d].count;
     for(let i=0;i<total;i++){
      if(!q?.text||!document.querySelector('#qstage .quizq')?.textContent.trim())throw Error('No question rendered');
      const key=JSON.stringify([q.text,q.visual?.data??null,q.choices?.map(x=>x.key).sort()]);
      if(seen.has(key))repeats++;
      seen.add(key);
      families.add(q.audit?.variant??q.sig);
      if(!skipNormalQuiz())throw Error('Skip failed');
      if(blockSession.done!==i+1)throw Error('Wrong progress count');
      if(!blockSession.finished)nextQ();
     }
     if(!blockSession.finished||blockSession.items.length!==total)throw Error('Did not finish');
     result.push({d,total,repeats,families:families.size});
    }catch(e){result.push({d,error:e.message})}
   }
   return result;
  },id);
  sessions+=tested.filter(x=>!x.error).length;
  questions+=tested.reduce((n,x)=>n+(x.total??0),0);
  tested.filter(x=>x.error||x.repeats||x.families<2).forEach(x=>failures.push({id,...x}));
 }
 console.log(JSON.stringify({topics:topics.length,questions,sessions,failures,pageErrors},null,2));
 await browser.close();
 if(failures.length||pageErrors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
