'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const asRat=s=>{
 const m=clean(s).match(/^(\d+)\s+(\d+)\/(\d+)$/);
 if(m)return [BigInt(m[1])*BigInt(m[3])+BigInt(m[2]),BigInt(m[3])];
 const f=clean(s).match(/^(\d+)\/(\d+)$/);
 if(f)return [BigInt(f[1]),BigInt(f[2])];
 const n=clean(s).match(/^\d+$/);
 if(n)return [BigInt(n[0]),1n];
 return null;
};
const eq=(a,b)=>a&&b&&a[0]*b[1]===b[0]*a[1];
const sign=(a,b)=>a[0]*b[1]===b[0]*a[1]?'=':a[0]*b[1]>b[0]*a[1]?'>':'<';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),browserErrors=[];
  page.on('pageerror',e=>browserErrors.push(String(e.message)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const topics=['frac_compare_den','frac_compare_num','mixed_compare','mixed_sub'];
  const batch=await page.evaluate((topics)=>{
   const samples=[],problems=[];
   for(const topic of topics)for(let stage=0;stage<3;stage++)
    for(let session=0;session<120;session++){
     blockSession={kind:'g5quiz',key:'g5:'+topic,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};
     qid='g5:'+topic;
     for(let pos=0;pos<5;pos++){
      blockSession.done=pos;
      try{
       const q=freshQuiz(qid);
       samples.push({topic,stage,session,pos,text:stripHtmlText(q.text||''),answer:String(q.correctText||''),
        explanation:stripHtmlText(q.ex||''),mode:q.answerMode||'choice',
        answerRat:q.answerRat?{n:q.answerRat.n,d:q.answerRat.d}:null,
        choices:(q.choices||[]).map(x=>({key:String(x.key),label:stripHtmlText(String(x.label))})),
        ans:String(q.ans),template:q.templateId||''});
      }catch(e){problems.push({topic,stage,session,pos,error:String(e)})}
     }
    }
   return {samples,problems};
  },topics);
  const flaws=[],warnings=[],byTopic={};
  const fail=(x,type,expected)=>flaws.push({type,topic:x.topic,stage:x.stage,text:x.text,answer:x.answer,
   expected,explanation:x.explanation,template:x.template});
  const warn=(x,type)=>warnings.push({type,topic:x.topic,stage:x.stage,text:x.text,answer:x.answer,
   explanation:x.explanation,template:x.template});
  for(const x of batch.samples){
   byTopic[x.topic]=(byTopic[x.topic]||0)+1;
   const mix=x.text.match(/(\d+)\s+(\d+)\/(\d+)/g)||[];
   const fraction=x.text.match(/(\d+)\/(\d+)/g)||[];
   const isThree=/^Три дроби/.test(x.text);
   let expected;
   if(x.topic==='mixed_sub'){
    if(mix.length!==2){fail(x,'mixed_sub_operands',2);continue}
    const a=asRat(mix[0]),b=asRat(mix[1]);
    expected=[a[0]*b[1]-b[0]*a[1],a[1]*b[1]];
    if(!eq(expected,asRat(x.answer)))fail(x,'independent_subtraction',expected.map(String).join('/'));
    if(!x.answerRat||!eq(expected,[BigInt(x.answerRat.n),BigInt(x.answerRat.d)]))
      fail(x,'internal_fraction_value',expected.map(String).join('/'));
    const ex=x.explanation.match(/[(](\d+)−(\d+)[)]\/(\d+)\s*=\s*(\d+)\/(\d+)/);
    if(!ex)fail(x,'explanation_unparseable','(A−B)/d = result/d');
    else {
     const [_,u,v,d,n,den]=ex.map(String);
     if(BigInt(u)-BigInt(v)!==BigInt(n)||BigInt(d)!==BigInt(den)||!eq([BigInt(n),BigInt(den)],expected))
      fail(x,'explanation_math_error',expected.map(String).join('/'));
    }
    if(!x.explanation.includes(x.answer))warn(x,'explanation_omits_final_answer');
   }else if(isThree){
    const numbers=(x.text.match(/(?:числители|знаменатели) ([\d,\s]+)\./)||[])[1];
    const vals=numbers?.split(',').map(s=>Number(s.trim()));
    if(!vals||vals.length!==3){fail(x,'three_frac_parse','3 numbers');continue}
    expected=String(x.topic==='frac_compare_den'?Math.max(...vals):Math.min(...vals));
    if(x.answer!==expected)fail(x,'three_fraction_oracle',expected);
    if(!x.explanation.includes(expected))warn(x,'three_explanation_omits_result');
   }else{
    if(x.topic==='mixed_compare'){
     if(mix.length!==2){fail(x,'mixed_comparison_operands',2);continue}
     expected=sign(asRat(mix[0]),asRat(mix[1]));
     const ex=x.explanation.match(/сравниваем (\d+) и (\d+)/);
     if(!ex||sign([BigInt(ex[1]),1n],[BigInt(ex[2]),1n])!==expected)
      fail(x,'mixed_comparison_explanation',expected);
    }else {
     if(fraction.length!==2){fail(x,'fraction_comparison_operands',2);continue}
     expected=sign(asRat(fraction[0]),asRat(fraction[1]));
    }
    if(x.answer!==expected)fail(x,'comparison_oracle',expected);
   }
   const keys=x.choices.map(v=>v.key), labels=x.choices.map(v=>v.label);
   if(keys.length&&new Set(keys).size!==keys.length)fail(x,'duplicate_choice_keys',keys);
   if(labels.length&&new Set(labels).size!==labels.length)fail(x,'duplicate_choice_labels',labels);
   if(keys.length&&!(keys.includes(x.ans)||keys.includes('ok')))fail(x,'correct_option_missing',x.ans);
  }
  for(const p of batch.problems)flaws.push({type:'generation_error',...p});
  for(const e of browserErrors)flaws.push({type:'browser_error',error:e});
  const result={topics:topics.length,questions:batch.samples.length,
    byTopic,flaws:flaws.slice(0,50),flawCount:flaws.length,
    warnings:warnings.slice(0,50),warningCount:warnings.length,
    warningGroups:Object.entries(warnings.reduce((a,v)=>(a[v.type]=(a[v.type]||0)+1,a),{}))};
  fs.mkdirSync('audits/out',{recursive:true});
  fs.writeFileSync('audits/out/g5_stage14_math_oracle.json',JSON.stringify(result,null,2));
  console.log('STAGE14_ORACLE_RESULT',JSON.stringify({...result,flaws:result.flaws.slice(0,12),warnings:result.warnings.slice(0,7)}));
  assert.equal(result.questions,7200);
  assert.equal(result.flawCount,0,'Independent grade 5 math oracle found incorrect answers/options/explanations');
  console.log('STAGE14_MATH_ORACLE_PASS',JSON.stringify({questions:result.questions,flaws:result.flawCount,warnings:result.warningCount}));
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE14_ORACLE_FAIL',e.stack||e);process.exit(1)});
