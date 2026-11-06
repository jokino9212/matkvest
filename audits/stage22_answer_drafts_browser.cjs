'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');

const plans=[
 {grade:5,method:'startG5QuizStage',catalog:'g5AllTopics',prefix:''},
 {grade:6,method:'startG6QuizStage',catalog:'g6AllTopics',prefix:''},
 {grade:7,method:'startG7QuizStage',catalog:'g7AllTopics',prefix:''},
 {grade:8,method:'startG8QuizStage',catalog:'g8AllTopics',prefix:''}
];
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const failures=[],done=[];
 try{
 for(const width of [320,390,768]){
 for(const plan of plans){
   const context=await browser.newContext({viewport:{width,height:690},isMobile:width<500,hasTouch:width<500});
   const page=await context.newPage();const pageErrors=[];
   page.on('pageerror',e=>pageErrors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   let data;
   try{
    data=await page.evaluate(({plan})=>{
      const cat=window[plan.catalog]();
      let chosen=null;
      for(const t of cat.slice(0,Math.min(cat.length,55))){
       if(t.implemented===false)continue;
       for(let stage=0;stage<=2;stage++){
        try{window[plan.method](t.id,stage)}catch(e){continue}
        const inp=document.querySelector('#qstage input:not([type=hidden])');
        const btn=document.getElementById('quizCheck');
        if(inp&&btn&&q&&q.answerMode&&q.answerMode!=='choice'){
         chosen={topic:t.id,stage,mode:q.answerMode,answerId:inp.id};break;
        }
       }
       if(chosen)break;
      }
      if(!chosen)return {error:'NO_INPUT_TASK',catalog:cat.length};
      const inputs=[...document.querySelectorAll('#qstage input:not([type=hidden])')];
      const entries=inputs.map((input,i)=>{
       const value=['-123456789','987654321','-456789123','321987654'][i%4];
       input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));
       return {id:input.id,value};
      });
      const before={attempt:blockSession?.attemptId,correct:blockSession?.correct,fields:entries,mode:q?.answerMode,question:q?.sig||q?.text};
      const persisted=mk872PersistDraft();
      const draft=mk872ReadDraft();
      const savedInput=entries.every(x=>draft?.html?.includes('value="'+x.value+'"'));
      inputs.forEach(input=>{input.value='7';input.dispatchEvent(new Event('input',{bubbles:true}))});
      if(draft)mk872RestoreDraft(draft);
      const afterInput=document.getElementById(chosen.answerId);
      const after={attempt:blockSession?.attemptId,correct:blockSession?.correct,
       fields:entries.map(x=>({id:x.id,value:document.getElementById(x.id)?.value})),question:q?.sig||q?.text};
      const modalRect=document.getElementById('modal').getBoundingClientRect();
      const inputRect=afterInput?.getBoundingClientRect();
      const check=document.getElementById('quizCheck');
      const checkRect=check?.getBoundingClientRect();
      return {chosen,before,persisted,draftFound:!!draft,savedInput,after,
       geometry:{viewport:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,
        modalLeft:modalRect.left,modalRight:modalRect.right,
        inputLeft:inputRect?.left,inputRight:inputRect?.right,
        checkLeft:checkRect?.left,checkRight:checkRect?.right},
       buttons:{check:!!check,next:!!document.getElementById('quizNext')}
      };
    },{plan});
    if(data.error)throw new Error(data.error+' '+JSON.stringify(data));
    assert(data.persisted && data.draftFound && data.savedInput,'Draft not written '+JSON.stringify(data));
    assert.equal(data.after.attempt,data.before.attempt,'Changed attempt identity');
    assert.deepEqual(data.after.fields,data.before.fields,'Lost one or more fraction/answer fields');
    assert.equal(data.after.question,data.before.question,'Question changed after restore');
    assert.equal(data.after.correct,data.before.correct,'Score changed after restore');
    assert(data.geometry.scrollWidth<=width+2,'Horizontal page overflow '+JSON.stringify(data.geometry));
    for(const k of ['inputLeft','inputRight','checkLeft','checkRight'])assert(Number.isFinite(data.geometry[k]),'Missing visible control '+k);
    assert(data.geometry.inputLeft>=-2&&data.geometry.inputRight<=width+2,'Input clipped');
    assert(data.geometry.checkLeft>=-2&&data.geometry.checkRight<=width+2,'Check button clipped');
    // Invalid answer should never improve the score. For some modes an invalid string is rejected before penalty.
    const invalid=await page.evaluate(()=>{
      const before=blockSession.correct;
      const check=document.getElementById('quizCheck');check.click();
      return {before,after:blockSession.correct,feedback:document.getElementById('qfb')?.textContent?.trim().slice(0,140)};
    });
    assert.equal(invalid.after,invalid.before,'Invalid input credited');
    const correct=await page.evaluate(({plan})=>{
      const cat=window[plan.catalog]();
      let found=null;
      outer:for(const topic of cat.slice(0,Math.min(45,cat.length))){
       if(topic.implemented===false)continue;
       for(let stage=0;stage<3;stage++){
        try{window[plan.method](topic.id,stage)}catch(e){continue}
        const input=document.getElementById('quizInput');
        if(plan.grade===5 && q?.answerMode==='fraction' && stage18UsesFractionBoxes(q) && q.answerRat){
          const n=Number(q.answerRat.n),d=Number(q.answerRat.d);
          if(Number.isInteger(n)&&Number.isInteger(d)&&n>0&&d>0){
           const candidates=[
            {whole:'',num:String(n),den:String(d)},
            {whole:'0',num:String(n),den:String(d)},
            {whole:String(Math.floor(n/d)),num:String(n%d),den:String(d)}
           ];
           for(const form of candidates){
            document.getElementById('quizFracWhole').value=form.whole;
            document.getElementById('quizFracNum').value=form.num;
            document.getElementById('quizFracDen').value=form.den;
            const ev=quizInputEvaluation(q,stage18FractionFields());
            if(ev.valid&&ev.ok){found={topic:topic.id,stage,form,kind:'fraction'};break outer}
           }
          }
        }
        if(q?.answerMode==='number' && input && q.answerRat){
          const rat=q.answerRat;
          const options=[String(q.ans??''),String(q.correctText??''),
           String(Number(rat.n)/Number(rat.d)),String(rat.n)+'/'+String(rat.d)];
          const correctValue=options.find(v=>{const e=quizInputEvaluation(q,v);return e.valid&&e.ok});
          if(correctValue!==undefined){found={topic:topic.id,stage,ans:correctValue};break outer}
        }
       }
      }
      if(!found)return {skipped:'NO_NUMERIC_ANSWER'};
      const input=document.getElementById('quizInput'),check=document.getElementById('quizCheck');
      const scoreBefore=blockSession.correct;
      if(found.kind==='fraction'){
        for(const [id,value] of [['quizFracWhole',found.form.whole],['quizFracNum',found.form.num],['quizFracDen',found.form.den]]){
         const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));
        }
      }else{input.value=String(found.ans);input.dispatchEvent(new Event('input',{bubbles:true}))}
      check.click();
      const scoreAfter=blockSession.correct,feedback=document.getElementById('qfb')?.textContent?.trim();
      const next=document.getElementById('quizNext');
      check.click();
      return {found,scoreBefore,scoreAfter,scoreAfterSecond: blockSession.correct,
        feedback:feedback?.slice(0,140),nextVisible:!!next && getComputedStyle(next).display!=='none'};
    },{plan});
    assert(!correct.skipped,'No valid answer candidate for '+plan.grade+' class');
    if(!correct.skipped){
      assert.equal(correct.scoreAfter,correct.scoreBefore+1,'Correct numeric answer not credited: '+JSON.stringify(correct));
      assert.equal(correct.scoreAfterSecond,correct.scoreAfter,'Repeated Check credited twice');
      assert(correct.nextVisible,'Next action missing after correct answer');
    }
    done.push({width,grade:plan.grade,chosen:data.chosen,attemptPreserved:true,invalid,correct});
    console.log('PASS_STAGE22',JSON.stringify(done.at(-1)));
   }catch(e){failures.push({width,grade:plan.grade,error:String(e),data});console.error('FAIL_STAGE22',JSON.stringify(failures.at(-1)).slice(0,2400))}
   if(pageErrors.length)failures.push({width,grade:plan.grade,type:'js-errors',errors:pageErrors.slice(0,5)});
   await context.close();
 }
 }
 }finally{await browser.close()}
 console.log('STAGE22_SUMMARY',JSON.stringify({done:done.length,failures:failures.length,details:failures.slice(0,20)}));
 if(failures.length||done.length!==12)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
