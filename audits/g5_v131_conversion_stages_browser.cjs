'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-conversion-stage-v131.js"><\/script>/g)||[]).length,1);
 assert(sw.includes('"./g5-conversion-stage-v131.js"')&&sw.includes('matkvest-iphone-v131'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:840}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const report=await page.evaluate(()=>{
    const problems=[],check=(ok,msg)=>{if(!ok)problems.push(msg)},ids=window.mkG5V131Tiered||[];
    check(ids.length===2,'Both conversion topics not loaded');
    check(g5AllTopics().length===74,'Original 74 topics missing');
    function independent(tree){
     const [op,...a]=tree,E=independent;
     if(op==='v')return BigInt(a[0]);
     if(op==='add')return a.reduce((s,x)=>s+E(x),0n);
     if(op==='sub')return E(a[0])-E(a[1]);
     if(op==='mul')return E(a[0])*E(a[1]);
     if(op==='div'){const n=E(a[0]),d=E(a[1]);if(d===0n||n%d!==0n)throw Error('Noninteger quotient');return n/d}
     if(op==='mod'){const n=E(a[0]),d=E(a[1]);if(n<0n||d<=0n)throw Error('Bad remainder');return n%d}
     throw Error('Unexpected operation '+op);
    }
    let checked=0;
    const perTopic={};
    for(const id of ids){
     const families=[];
     for(let stage=0;stage<3;stage++){
      const templates=new Set();
      for(let f=0;f<5;f++){
       for(let rep=0;rep<40;rep++){
        blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:stage,done:f,total:10,usedSignatures:[],items:[],finished:false};
        qid='g5:'+id;
        try{
         const sample=makeG5Question(id),meta=sample?.mk131;
         if(!sample?.text||!sample?.ex||!sample?.templateId||!sample?.sig||!sample?.conversionAudit)throw Error('Missing learner display data');
         if(stage===0&&meta)throw Error('Warmup unexpectedly replaced');
         if(stage>0){
          if(!meta)throw Error('Training/master still using repeat warmup families');
          if(meta.id!==id||meta.stage!==stage||meta.p!==f||meta.steps<stage+1)throw Error('Wrong topic/stage/complexity');
          const expected=independent(meta.plan);
          if(expected!==BigInt(meta.answerN))throw Error('Wrong independently computed answer');
          if(sample.conversionAudit.answerNumerator!==Number(expected))throw Error('Conversion audit and answer disagree');
          if(meta.kind==='mixed'){
           if(sample.stage18ConversionType!=='mixed'||Number(expected)%meta.den===0)throw Error('Bad mixed-form request');
          }else if(meta.kind==='improper'){
           if(sample.stage18ConversionType!=='improper'||Number(expected)<meta.den)throw Error('Bad improper-form request');
          }else if(sample.answerMode!=='number'||sample.stage18ConversionType)throw Error('Numeric task exposed fraction form');
         }
         const matches=sample.choices.filter(c=>String(c.key)===String(sample.ans));
         if(matches.length!==1||new Set(sample.choices.map(c=>String(c.label))).size!==sample.choices.length)throw Error('Ambiguous/duplicate answer choices');
         q=sample;
         const root=document.createElement('div');root.innerHTML=quizAnswerMarkup('nextQ','nextQ');
         const den=sample.stage18FixedDenominator;
         if(sample.answerMode==='number'){
          if(!root.querySelector('#quizInput')||root.querySelector('#quizFracNum'))throw Error('Number asks for irrelevant fraction cells');
          const evalResult=quizInputEvaluation(sample,sample.correctText);
          if(!evalResult.valid||!evalResult.ok)throw Error('Correct numeric input rejected');
         }else{
          const numerator=root.querySelector('#quizFracNum'),denom=root.querySelector('#quizFracDen');
          if(!numerator||!denom?.readOnly||Number(denom.value)!==den)throw Error('Fraction cells or locked denominator missing');
          const fractionValue=sample.conversionAudit.answerNumerator;
          const whole=Math.floor(fractionValue/den),remainder=fractionValue%den;
          const isMixed=sample.stage18ConversionType==='mixed';
          const raw={stage18Fraction:true,whole:isMixed?String(whole):'',numerator:String(isMixed?remainder:fractionValue),denominator:String(den)};
          if(!!root.querySelector('#quizFracWhole')!==isMixed)throw Error('Wrong whole-part input visibility');
          const evaluation=quizInputEvaluation(sample,raw);
          if(!evaluation.valid||!evaluation.ok)throw Error('Correct fixed-denominator input rejected: '+JSON.stringify(evaluation));
          const wrong=quizInputEvaluation(sample,{...raw,denominator:String(den+1)});
          if(wrong.ok)throw Error('Altered denominator accepted');
         }
         if(rep===0)templates.add(sample.templateId);
         checked++;
        }catch(e){problems.push(id+' L'+stage+' F'+f+' repeat'+rep+': '+e.message)}
       }
      }
      check(templates.size===5,id+' L'+stage+' only '+templates.size+' unique question types');
      families.push(...templates);
     }
     check(new Set(families).size===15,id+' repeats a cognitive family across stages');
     perTopic[id]=families;
    }
    const explicitImproper={answerMode:'fraction',answerRat:rational(28,8),correctText:'28/8',
     correctHtml:frac(28,8),stage18AnswerForm:{kind:'exact',n:28,d:8},
     stage18FixedDenominator:8,stage18ConversionType:'improper'};
    const explicitMixed={answerMode:'fraction',answerRat:rational(26,9),correctText:'2 8/9',
     correctHtml:mixed(2,8,9),stage18AnswerForm:{kind:'mixed'},
     stage18FixedDenominator:9,stage18ConversionType:'mixed'};
    check(quizInputEvaluation(explicitImproper,{stage18Fraction:true,whole:'',numerator:'28',denominator:'8'}).ok,'3 4/8 → 28/8 bug regressed');
    check(quizInputEvaluation(explicitMixed,{stage18Fraction:true,whole:'2',numerator:'8',denominator:'9'}).ok,'26/9 → 2 8/9 bug regressed');
    renderGrade5();
    const nav=mainView.querySelector('#mk-g5-textbook-nav');
    check(nav?.querySelectorAll('.mk-g5-toc-list li').length===51,'Textbook catalog lost sections');
    check(nav?.querySelectorAll('input').length===0,'Duplicate search returned');
    for(const id of ids){
     blockSession=null;qid='';
     openG5Topic(id);
     const title=document.getElementById('modal')?.querySelector('h2')?.textContent||'';
     check(title.includes(g5AllTopics().find(x=>x.id===id)?.title),'Wrong topic dialog '+id);
     if(typeof startG5QuizStage==='function'){
      startG5QuizStage(id,2);
      check(q?.mk131?.stage===2&&q?.mk131?.id===id,'Live Master is still not stage-aware '+id);
     }else problems.push('No real quiz launcher');
     if(typeof closeModal==='function')closeModal();
    }
    check(document.documentElement.scrollWidth<=innerWidth+2,'Horizontal scrolling '+innerWidth);
    return {checked,errorCount:problems.length,errors:problems.slice(0,25),perTopic};
   });
   assert.equal(report.errorCount,0,JSON.stringify({width,report}).slice(0,9000));
   assert.deepEqual(errors,[],JSON.stringify({width,errors}));
   console.log('G5_V131_CONVERSIONS_3_STAGE_PASS',JSON.stringify({width,topics:2,realQuestions:report.checked,uniqueFamilies:30}));
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V131_CONVERSIONS_3_STAGE_FAIL',e.stack||e);process.exit(1)});
