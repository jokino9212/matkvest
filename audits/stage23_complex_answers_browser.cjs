'use strict';
const {chromium}=require('playwright');
const path=require('node:path');
const assert=require('node:assert/strict');

async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const failures=[],reports=[];
 try{
 for(const width of [320,390,768]){
  const context=await browser.newContext({viewport:{width,height:740},isMobile:width<500,hasTouch:width<500});
  const page=await context.newPage();const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   const testResults=[],problems=[];
   const getRat=x=>x&&Number(x.d)!==0?Number(x.n)/Number(x.d):null;
   const cases=[
    {mode:'coordinate',topic:'g7:coordinate_plane',grade:7,stage:2},
    {mode:'linear',topic:'g7:expression_properties',grade:7,stage:1},
    {mode:'multi',topic:'g7:graphical_equations_systems',grade:7,stage:2},
    {mode:'fraction',topic:'g7:rational_numbers_forms',grade:7,stage:1},
   ];
   function answerOf(question){
    switch(question.answerMode){
     case 'coordinate': return question.answerPoint?{x:String(getRat(question.answerPoint.x)),y:String(getRat(question.answerPoint.y))}:null;
     case 'linear': {
       const v=question.answerLinear;if(!v)return null;
       const a=getRat(v.a),b=getRat(v.b);if(a===null||b===null)return null;
       return a===0?String(b):a===1?(b===0?'x':'x'+(b>0?'+':'')+b):String(a)+'x'+(b===0?'':(b>0?'+':'')+b);
     }
     case 'multi':return Array.isArray(question.answerList)?question.answerList.join('; '):null;
     case 'fraction':{
       const r=question.answerRat;if(!r)return null;
       return String(r.n)+'/'+String(r.d);
     }
     default:return null;
    }
   }
   for(const c of cases){
    let test=null;
    for(let i=0;i<120;i++){
     try{startG7QuizStage(c.topic,c.stage)}catch(e){problems.push({mode:c.mode,stage:'start',error:String(e)});break}
     if(q?.answerMode!==c.mode)continue;
     const input=answerOf(q);
     if(input==null)continue;
     const ev=quizInputEvaluation(q,input);
     if(ev.valid&&ev.ok){test={topic:c.topic,mode:c.mode,stage:c.stage,attempts:i+1,answer:input,question:q,verified:ev};break}
    }
    if(!test){problems.push({mode:c.mode,reason:'MODE_OR_VALID_ANSWER_NOT_FOUND'});continue}
    const wrong={coordinate:{x:'99999',y:'-99999'},linear:'987654x+123456',multi:'99999;88888',fraction:'12345/67891'}[c.mode];
    const incorrect=quizInputEvaluation(test.question,wrong);
    if(incorrect.valid&&incorrect.ok)problems.push({mode:c.mode,reason:'INVALID_ACCEPTED'});
    let correct=quizInputEvaluation(test.question,test.answer);
    if(!correct.valid||!correct.ok)problems.push({mode:c.mode,reason:'CORRECT_REJECTED',answer:test.answer,correct});
    const rawInputs=[...document.querySelectorAll('#qstage input')];
    const geom=rawInputs.map(el=>{const r=el.getBoundingClientRect();return{id:el.id,left:r.left,right:r.right}});
    const overflow=geom.filter(x=>x.left<-2||x.right>document.documentElement.clientWidth+2);
    if(overflow.length)problems.push({mode:c.mode,reason:'INPUT_CLIPPED',overflow});
    testResults.push({mode:c.mode,attempts:test.attempts,inputs:geom.length,valid:correct.valid,ok:correct.ok,wrongAccepted:incorrect.valid&&incorrect.ok,overflow:overflow.length});
   }
   // Validate actual skip behavior for a generated grade-7 quiz, not just a parsing function.
   startG7QuizStage('g7:rational_numbers_forms',0);
   const initial={id:blockSession?.attemptId,done:blockSession?.done,correct:blockSession?.correct,question:q?.sig||q?.text};
   const skipped=skipNormalQuiz();
   const post={id:blockSession?.attemptId,done:blockSession?.done,correct:blockSession?.correct,question:q?.sig||q?.text};
   if(!skipped||post.id!==initial.id||post.correct!==initial.correct||post.done!==initial.done+1)
    problems.push({mode:'skip',reason:'SKIP_BEHAVIOR',initial,skipped,post});
   return {testResults,problems,skip:{initial,post,skipped},scrollWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth};
  });
  if(result.scrollWidth>width+2)failures.push({width,type:'horizontal-overflow',result});
  if(result.problems.length)failures.push({width,problems:result.problems});
  if(pageErrors.length)failures.push({width,pageErrors:pageErrors.slice(0,6)});
  reports.push({width,...result});
  console.log('STAGE23',JSON.stringify({width,modes:result.testResults,issues:result.problems,skip:result.skip,errors:pageErrors}));
  await context.close();
 }
 }finally{await browser.close()}
 console.log('STAGE23_SUMMARY',JSON.stringify({cases:reports.length,errors:failures}));
 if(failures.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
