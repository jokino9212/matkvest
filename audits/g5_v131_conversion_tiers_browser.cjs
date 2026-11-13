'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:810}}),pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const check=await page.evaluate(()=>{
   const issues=[],note=(v,m)=>{if(!v)issues.push(m)},ids=['frac_to_mixed','mixed_to_frac'];
   const topics=g5AllTopics();
   note(topics.length===74,'Grade five catalog changed');
   note((window.mkG5V130Tiered||[]).length===5,'Previously published fraction applications unavailable');
   let tested=0;
   for(const id of ids){
    const distinct=new Set();
    for(let tier=0;tier<3;tier++){
     for(let family=0;family<5;family++){
      for(let repeat=0;repeat<18;repeat++){
       blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:tier,done:family,total:10,usedSignatures:[],items:[],finished:false};
       qid='g5:'+id;
       try{
        const sample=makeG5Question(id),m=sample.conversionAudit;
        if(!m||m.stage!==tier||m.level!==tier||m.position!==family)throw Error('Wrong stage or conversion family');
        if(!sample.text||!sample.sig||!sample.ex||!sample.templateId)throw Error('Missing learner question fields');
        if(!repeat){if(distinct.has(sample.templateId))throw Error('Cognitive family repeated between levels');distinct.add(sample.templateId)}
        q=sample;
        const root=document.createElement('div');root.innerHTML=quizAnswerMarkup('nextQ','nextQ');
        if(sample.answerMode==='number'){
         if(!root.querySelector('#quizInput')||root.querySelector('#quizFracNum'))throw Error('Numeric question has irrelevant fraction cells');
         const evaluation=quizInputEvaluation(sample,sample.correctText);
         if(!evaluation.valid||!evaluation.ok)throw Error('Correct numeric result rejected');
        }else{
         const den=m.den,answerN=m.answerNumerator,cell=root.querySelector('#quizFracDen');
         if(!cell||!cell.readOnly||Number(cell.value)!==den)throw Error('Denominator not locked');
         const whole=Math.floor(answerN/den),rem=answerN%den;
         const isMixed=id==='frac_to_mixed';
         if(!root.querySelector('#quizFracNum')||!!root.querySelector('#quizFracWhole')!==isMixed)throw Error('Wrong fraction input arrangement');
         const raw={stage18Fraction:true,whole:isMixed?String(whole):'',numerator:String(isMixed?rem:answerN),denominator:String(den)};
         const evaluated=quizInputEvaluation(sample,raw);
         if(!evaluated.valid||!evaluated.ok)throw Error('Correct fraction entry rejected');
         if(quizInputEvaluation(sample,{...raw,denominator:String(den+1)}).ok)throw Error('Wrong denominator accepted');
        }
        if(tier===2&&m.family.indexOf('master_')!==0)throw Error('Master still repeats warmup/training family');
        tested++;
       }catch(e){issues.push(id+' L'+tier+' F'+family+' #'+repeat+': '+e.message)}
      }
     }
    }
    note(distinct.size===15,id+' lacks 15 unique stage-specific conversion families');
    blockSession=null;qid='';
    openG5Topic(id);
    note((document.getElementById('modal')?.querySelector('h2')?.textContent||'').includes(topics.find(x=>x.id===id).title),'Wrong dialog');
    for(let tier=0;tier<3;tier++){
     if(typeof startG5QuizStage==='function'){
      startG5QuizStage(id,tier);
      note(q?.conversionAudit?.stage===tier,'Stage quiz ignores selected level');
     }else issues.push('No real quiz stage opener');
    }
    if(typeof closeModal==='function')closeModal();
   }
   note(document.documentElement.scrollWidth<=innerWidth+2,'Horizontal overflow');
   return {errors:issues.slice(0,22),count:issues.length,tested};
  });
  assert.equal(check.count,0,JSON.stringify({width,check}).slice(0,10000));
  assert.deepEqual(pageErrors,[],JSON.stringify({width,pageErrors}));
  console.log('G5_V131_CONVERSION_FULL_UI_PASS',JSON.stringify({width,tested:check.tested,types:30}));
  await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V131_CONVERSION_FULL_UI_FAIL',e.stack||e);process.exit(1)});
