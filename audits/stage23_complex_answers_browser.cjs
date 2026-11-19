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
   const asExact=({n,d})=>d===1?String(n):n+'/'+d;
   const cases=[
    {mode:'coordinate',topic:'g7:coordinate_plane',stage:2,wrong:{x:'99999',y:'-99999'}},
    {mode:'coordinate',topic:'g7:graphical_equations_systems',stage:2,requireFraction:true,wrong:{x:'99999',y:'-99999'}},
    {mode:'linear',topic:'g7:brackets_like_terms',stage:1,wrong:'987654х+123456'},
    {mode:'number',topic:'g7:rational_numbers_forms',stage:0,requireFraction:true,wrong:'99999/2'},
    {mode:'multi',topic:'g8:equation_x2_equals_a',stage:1,wrong:'99999;88888'},
   ];
   function answerOf(question,requireFraction){
    switch(question.answerMode){
     case 'coordinate': {
       const {x,y}=question.answerPoint;
       if(requireFraction&&!([x,y].some(r=>r.d>1&&rationalFiniteDecimal(r)===null)))return null;
       return {x:asExact(x),y:asExact(y)};
     }
     case 'linear': {
       if(!question.answerLinear.a.n)return null;
       return formatLinearExpressionPlain(question.answerLinear).replace(/x/g,'х');
     }
     case 'multi':return question.answerList.join('; ');
     case 'number':return question.answerRat?.d>1?asExact(question.answerRat):null;
     default:return null;
    }
   }
   for(const c of cases){
    const start=c.topic.startsWith('g7:')?startG7QuizStage:startG8QuizStage;
    let test=null;
    for(let i=0;i<80;i++){
     try{start(c.topic,c.stage)}catch(e){problems.push({mode:c.mode,topic:c.topic,stage:'start',error:String(e)});break}
     if(q?.answerMode!==c.mode)continue;
     const input=answerOf(q,c.requireFraction);
     if(input!=null){test={topic:c.topic,mode:c.mode,stage:c.stage,attempts:i+1,answer:input,question:q};break}
    }
    if(!test){problems.push({mode:c.mode,topic:c.topic,reason:'MODE_OR_VALID_ANSWER_NOT_FOUND'});continue}
    const wrong=c.wrong;
    const incorrect=quizInputEvaluation(test.question,wrong);
    if(incorrect.valid&&incorrect.ok)problems.push({mode:c.mode,reason:'INVALID_ACCEPTED'});
    let correct=quizInputEvaluation(test.question,test.answer);
    if(!correct.valid||!correct.ok)problems.push({mode:c.mode,reason:'CORRECT_REJECTED',answer:test.answer,correct});
    const rawInputs=[...document.querySelectorAll('#qstage input')];
    const geom=rawInputs.map(el=>{const r=el.getBoundingClientRect();return{id:el.id,left:r.left,right:r.right}});
    const overflow=geom.filter(x=>x.left<-2||x.right>document.documentElement.clientWidth+2);
    if(overflow.length)problems.push({mode:c.mode,reason:'INPUT_CLIPPED',overflow});
    if(c.mode==='coordinate'&&c.requireFraction&&rawInputs.some(input=>input.inputMode!=='text'))
      problems.push({mode:c.mode,reason:'FRACTION_KEYBOARD_UNAVAILABLE'});
    // Submit correct complex answer through the real Check button.
    const check=document.getElementById('quizCheck');
    const scoreBefore=blockSession?.correct??0;
    if(c.mode==='coordinate'){
      document.getElementById('quizInputX').value=test.answer.x;
      document.getElementById('quizInputY').value=test.answer.y;
    }else{
      const input=document.getElementById('quizInput');
      if(!input){problems.push({mode:c.mode,reason:'MISSING_INPUT'});continue}
      input.value=test.answer;
    }
    check?.click();
    const scoreAfter=blockSession?.correct??0;
    const next=document.getElementById('quizNext');
    const nextVisible=!!next&&getComputedStyle(next).display!=='none';
    check?.click();
    const scoreAfterSecond=blockSession?.correct??0;
    if(scoreAfter!==scoreBefore+1||scoreAfterSecond!==scoreAfter||!nextVisible)
      problems.push({mode:c.mode,reason:'UI_SCORING_OR_NEXT',scoreBefore,scoreAfter,scoreAfterSecond,nextVisible,feedback:document.getElementById('qfb')?.textContent?.slice(0,160)});
    testResults.push({topic:c.topic,mode:c.mode,attempts:test.attempts,inputs:geom.length,valid:correct.valid,ok:correct.ok,wrongAccepted:incorrect.valid&&incorrect.ok,overflow:overflow.length,scoredOnce:scoreAfter===scoreBefore+1&&scoreAfterSecond===scoreAfter,nextVisible});
   }
   const semanticCases=[
    {name:'ratio-equivalent',q:{answerMode:'ratio',answerRatio:[2,3],requireReducedRatio:false},answer:'4:6',expected:true},
    {name:'ratio-wrong',q:{answerMode:'ratio',answerRatio:[2,3]},answer:'2:4',expected:false},
    {name:'ratio-zero-denominator',q:{answerMode:'ratio',answerRatio:[2,3]},answer:'2:0',invalid:true},
    {name:'ratio-reduced-required',q:{answerMode:'ratio',answerRatio:[2,3],requireReducedRatio:true},answer:'4:6',expected:false},
    {name:'remainder-correct',q:{answerMode:'remainder',answerQuotient:4,answerRemainder:3},answer:{q:'4',r:'3'},expected:true},
    {name:'remainder-wrong',q:{answerMode:'remainder',answerQuotient:4,answerRemainder:3},answer:{q:'5',r:'3'},expected:false},
    {name:'coordinate-comma',q:{answerMode:'coordinate',answerPoint:{x:{n:-3,d:2},y:{n:5,d:4}}},answer:{x:'-1,5',y:'1.25'},expected:true},
    {name:'fraction-equivalent',q:{answerMode:'fraction',answerRat:{n:1,d:2},requireReduced:false},answer:'2/4',expected:true},
    {name:'fraction-reduced-required',q:{answerMode:'fraction',answerRat:{n:1,d:2},requireReduced:true},answer:'2/4',expected:false},
    {name:'multi-negative',q:{answerMode:'multi',answerList:[2,-1,5]},answer:'2; -1; 5',expected:true},
    {name:'multi-wrong-order',q:{answerMode:'multi',answerList:[2,-1,5]},answer:'-1; 2; 5',expected:false},
    {name:'linear-expression',q:{answerMode:'linear',answerLinear:{a:{n:2,d:1},b:{n:-3,d:1}}},answer:'2x-3',expected:true},
    {name:'linear-cyrillic-x',q:{answerMode:'linear',answerLinear:{a:{n:2,d:1},b:{n:-3,d:1}}},answer:'2Х−3',expected:true},
    {name:'linear-wrong-sign',q:{answerMode:'linear',answerLinear:{a:{n:2,d:1},b:{n:-3,d:1}}},answer:'2x+3',expected:false},
   ];
   const semantic=[];
   for(const c of semanticCases){
    try{
     const out=quizInputEvaluation(c.q,c.answer);
     const match=c.invalid?!out.valid:out.valid&&out.ok===c.expected;
     if(!match)problems.push({mode:'semantic',name:c.name,reason:'UNEXPECTED_ANSWER_RESULT',out});
     semantic.push({name:c.name,valid:out.valid,ok:out.ok,match});
    }catch(e){problems.push({mode:'semantic',name:c.name,reason:'THREW',error:String(e)})}
   }
   // Validate actual skip behavior for a generated grade-7 quiz, not just a parsing function.
   startG7QuizStage('g7:rational_numbers_forms',0);
   const initial={id:blockSession?.attemptId,done:blockSession?.done,correct:blockSession?.correct,question:q?.sig||q?.text};
   const skipped=skipNormalQuiz();
   const post={id:blockSession?.attemptId,done:blockSession?.done,correct:blockSession?.correct,question:q?.sig||q?.text};
   if(!skipped||post.id!==initial.id||post.correct!==initial.correct||post.done!==initial.done+1)
    problems.push({mode:'skip',reason:'SKIP_BEHAVIOR',initial,skipped,post});
   return {testResults,semantic,problems,skip:{initial,post,skipped},scrollWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth};
  });
  if(result.scrollWidth>width+2)failures.push({width,type:'horizontal-overflow',result});
  if(result.problems.length)failures.push({width,problems:result.problems});
  if(pageErrors.length)failures.push({width,pageErrors:pageErrors.slice(0,6)});
  reports.push({width,...result});
  console.log('STAGE23',JSON.stringify({width,modes:result.testResults,semantic:result.semantic,issues:result.problems,skip:result.skip,errors:pageErrors}));
  await context.close();
 }
 }finally{await browser.close()}
 console.log('STAGE23_SUMMARY',JSON.stringify({cases:reports.length,errors:failures}));
 if(failures.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
