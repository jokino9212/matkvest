'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
    const failures=[],samples=[];let total=0;
    const check=(label,question,raw)=>{
      qid=label.startsWith('improper')?'g5:mixed_to_frac':'g5:frac_to_mixed';
      const out=quizInputEvaluation(question,raw);total++;
      if(!out.valid||!out.ok)failures.push({label,raw,out,expected:question.correctText,answerRat:question.answerRat});
      if(samples.length<8)samples.push({label,valid:out.valid,ok:out.ok,detail:out.detail,form:question.stage18AnswerForm});
    };
    for(let d=2;d<=17;d++){
      for(let w=1;w<=5;w++){
        let n=(w*7+d*3)%(d-1)+1;
        const num=w*d+n;
        const mixedQ={answerMode:'fraction',answerRat:rational(num,d),correctText:w+' '+n+'/'+d,correctHtml:mixed(w,n,d),stage18AnswerForm:{kind:'mixed'},requireReduced:false};
        check('mixed '+num+'/'+d,mixedQ,{stage18Fraction:true,whole:String(w),numerator:String(n),denominator:String(d)});
        const improperQ={answerMode:'fraction',answerRat:rational(num,d),correctText:num+'/'+d,correctHtml:frac(num,d),stage18AnswerForm:{kind:'improper'},requireReduced:false};
        check('improper '+num+'/'+d,improperQ,{stage18Fraction:true,whole:'',numerator:String(num),denominator:String(d)});
      }
    }
    const q26={answerMode:'fraction',answerRat:rational(26,9),correctText:'2 8/9',correctHtml:mixed(2,8,9),stage18AnswerForm:{kind:'mixed'},requireReduced:false};
    check('reported 26/9',q26,{stage18Fraction:true,whole:'2',numerator:'8',denominator:'9'});
    const generatedFailures=[],generatedSamples=[];let generatedTotal=0,notFraction=0;
    for(const topic of ['frac_to_mixed','mixed_to_frac']){
      qid='g5:'+topic;
      for(let i=0;i<180;i++){
        const item=makeG5Question(topic);
        if(item.answerMode!=='fraction'){notFraction++;if(generatedSamples.length<8)generatedSamples.push({topic,mode:item.answerMode,text:item.text});continue}
        const elem=document.createElement('div');elem.innerHTML=item.correctHtml||item.correctLabel||'';
        const fracNode=elem.querySelector('.frac'),wholeNode=elem.querySelector('.mixed .whole');
        const num=fracNode?.querySelector('.num')?.textContent?.trim();
        const den=fracNode?.querySelector('.den')?.textContent?.trim();
        const whole=wholeNode?.textContent?.trim()||'';
        const raw={stage18Fraction:true,whole,numerator:num||'',denominator:den||''};
        const out=quizInputEvaluation(item,raw);generatedTotal++;
        if(!out.valid||!out.ok)generatedFailures.push({topic,text:item.text,raw,correct:item.correctText,answerRat:item.answerRat,form:item.stage18AnswerForm,eval:out});
        if(generatedSamples.length<8)generatedSamples.push({topic,raw,correct:item.correctText,form:item.stage18AnswerForm,ok:out.ok,valid:out.valid});
      }
    }
    return {generatedTotal,notFraction,generatedFailures:generatedFailures.slice(0,12),generatedFailureCount:generatedFailures.length,generatedSamples,parseDirect:parseRationalInput('26/9'),parseMixed:parseRationalInput('2 8/9'),parseBoxes:stage18ParseFractionFields({whole:'2',numerator:'8',denominator:'9'}),usesBoxes:stage18UsesFractionBoxes({answerMode:'fraction'}),total,failures:failures.slice(0,30),failureCount:failures.length,samples};
  });
  console.log('STAGE01_BROWSER_RESULT',JSON.stringify(result));

  const formEdge=await page.evaluate(()=>{
    qid='g5:mixed_to_frac';
    const found=[];
    for(const value of [0,1,5,8,12,24]){
      const item={answerMode:'fraction',answerRat:rational(value,1),correctText:String(value),
        correctHtml:'<span class="math">'+value+'</span>',stage18AnswerForm:null,requireReduced:false};
      const v=String(value);
      found.push({question:'Какой числитель получится?',correct:v,accepted:quizInputEvaluation(item,{stage18Fraction:true,whole:v,numerator:'',denominator:''}),
        incorrect:quizInputEvaluation(item,{stage18Fraction:true,whole:String(value+1),numerator:'',denominator:''})});
    }
    qid='g5:frac_to_mixed';
    const mixedQ={answerMode:'fraction',answerRat:rational(26,9),correctText:'2 8/9',correctHtml:mixed(2,8,9),stage18AnswerForm:{kind:'mixed'},requireReduced:false};
    const mixedCorrect=quizInputEvaluation(mixedQ,{stage18Fraction:true,whole:'2',numerator:'8',denominator:'9'});
    const mixedWrongForm=quizInputEvaluation(mixedQ,{stage18Fraction:true,whole:'',numerator:'26',denominator:'9'});
    qid='g5:mixed_to_frac';
    const improperQ={answerMode:'fraction',answerRat:rational(26,9),correctText:'26/9',correctHtml:frac(26,9),stage18AnswerForm:{kind:'improper'},requireReduced:false};
    const improperCorrect=quizInputEvaluation(improperQ,{stage18Fraction:true,whole:'',numerator:'26',denominator:'9'});
    const improperWrongForm=quizInputEvaluation(improperQ,{stage18Fraction:true,whole:'2',numerator:'8',denominator:'9'});
    return {numericCount:found.length,numericCases:found.map(x=>({question:x.question,correct:x.correct,accepted:x.accepted.ok,wrongRejected:!x.incorrect.ok,kind:x.accepted.studentText})),
      mixedCorrect:mixedCorrect.ok,mixedWrongFormRejected:!mixedWrongForm.ok,improperCorrect:improperCorrect.ok,improperWrongFormRejected:!improperWrongForm.ok};
  });
  console.log('STAGE01_FORM_EDGE_RESULT',JSON.stringify(formEdge));
  assert.equal(formEdge.numericCount,6,'Did not generate integer subquestions');
  assert(formEdge.numericCases.every(x=>x.accepted&&x.wrongRejected),'Integer answer needs value comparison, not improper form');
  assert(formEdge.mixedCorrect&&formEdge.mixedWrongFormRejected&&formEdge.improperCorrect&&formEdge.improperWrongFormRejected,
   'Required mixed or improper form regression');

  const ui=await page.evaluate(()=>{
    qid='g5:frac_to_mixed';
    q={...makeG5Question('frac_to_mixed'),text:'Выдели целую часть: '+frac(26,9),answerMode:'fraction',answerRat:rational(26,9),
       correctText:'2 8/9',correctHtml:mixed(2,8,9),stage18AnswerForm:{kind:'mixed'},requireReduced:false,ex:'26 : 9 = 2 (ост. 8).'};
    answered=false;quizPenalty=false;
    const panel=document.createElement('div');panel.id='stage01RealUICheck';panel.innerHTML=quizAnswerMarkup('startNextQuizQuestion','skipQuizQuestion');document.body.appendChild(panel);
    const fields=stage18FractionFields();const ids=['quizFracWhole','quizFracNum','quizFracDen'];
    const vals=['2','8','9'];ids.forEach((id,i)=>document.getElementById(id).value=vals[i]);
    const before=quizInputEvaluation(q,stage18FractionFields());
    let exception=null;try{checkQuizInput()}catch(e){exception=String(e?.stack||e)}
    return {qid,form:q.stage18AnswerForm,fields:stage18FractionFields(),before,answered,exception,
      feedback:document.getElementById('qfb')?.textContent,fieldClasses:ids.map(id=>document.getElementById(id)?.className)};
  });
  console.log('STAGE01_REAL_UI_26_OVER_9',JSON.stringify(ui));
  assert.equal(ui.before.ok,true,'26/9 failed pre-check');
  assert.equal(ui.exception,null,'checkQuizInput threw');
  assert.equal(ui.answered,true,'26/9 not accepted on actual check handler');

  const series=await page.evaluate(()=>{
    document.getElementById('stage01RealUICheck')?.remove();
    const failures=[];let checks=0;
    for(let i=0;i<90;i++){
      const topic=i%2?'mixed_to_frac':'frac_to_mixed';
      qid='g5:'+topic;q=makeG5Question(topic);answered=false;quizPenalty=false;
      const sample=document.createElement('div');sample.innerHTML=q.correctHtml||q.correctLabel||'';
      const fracNode=sample.querySelector('.frac'),wholeNode=sample.querySelector('.mixed .whole');
      const n=fracNode?.querySelector('.num')?.textContent?.trim()||'';
      const d=fracNode?.querySelector('.den')?.textContent?.trim()||'';
      const w=wholeNode?.textContent?.trim()||'';
      const panel=document.createElement('div');panel.id='stage01SerialPanel';panel.innerHTML=quizAnswerMarkup('startNextQuizQuestion','skipQuizQuestion');
      document.body.appendChild(panel);
      document.getElementById('quizFracWhole').value=w;
      document.getElementById('quizFracNum').value=n;
      document.getElementById('quizFracDen').value=d;
      let err=null;try{checkQuizInput()}catch(e){err=String(e?.stack||e)}
      checks++;
      if(!answered||err)failures.push({i:i+1,topic,qid,text:q.text,correct:q.correctText,w,n,d,err,feedback:document.getElementById('qfb')?.textContent});
      panel.remove();
    }
    return {checks,failures:failures.slice(0,12),failureCount:failures.length};
  });
  console.log('STAGE01_SERIAL_REAL_UI',JSON.stringify(series));
  assert.equal(series.failureCount,0,'Serial every-third-check regression '+JSON.stringify(series.failures.slice(0,3)));


  assert.equal(errors.length,0,'Runtime page errors: '+errors.slice(0,5).join('; '));
  assert.equal(result.generatedFailureCount,0,'Generated fraction failures: '+JSON.stringify(result.generatedFailures.slice(0,3)));
  assert.equal(result.failureCount,0,'Incorrect fraction grading: '+JSON.stringify(result.failures.slice(0,3)));
  console.log('STAGE01_FRACTION_BROWSER_PASS',result.total);
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
