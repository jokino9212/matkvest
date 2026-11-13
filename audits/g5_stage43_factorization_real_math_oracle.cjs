'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const ids=['frac_equal','frac_reduce','frac_common_lcm','frac_compare_diff','frac_add_diff','frac_sub_diff','frac_mul_common','frac_part_number','frac_div_common','frac_restore'];
const abs=x=>x<0n?-x:x,gcd=(x,y)=>{x=abs(x);y=abs(y);while(y){[x,y]=[y,x%y]}return x};
const rat=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert(d!==0n,'Division by zero');if(d<0n){n=-n;d=-d}const g=gcd(n,d);return [n/g,d/g]};
const cmp=(a,b)=>a[0]*b[1]-b[0]*a[1];
function solve(node){
 const [op,...x]=node,E=solve;
 if(op==='rat')return rat(x[0],x[1]);
 if(op==='add')return x.reduce((a,n)=>{const b=E(n);return rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1])},[0n,1n]);
 if(op==='sub'){const a=E(x[0]),b=E(x[1]);return rat(a[0]*b[1]-b[0]*a[1],a[1]*b[1])}
 if(op==='mul'){const a=E(x[0]),b=E(x[1]);return rat(a[0]*b[0],a[1]*b[1])}
 if(op==='div'){const a=E(x[0]),b=E(x[1]);return rat(a[0]*b[1],a[1]*b[0])}
 if(op==='max'||op==='min')return x.map(E).reduce((a,b)=>op==='max'?(cmp(a,b)>=0n?a:b):(cmp(a,b)<=0n?a:b));
 if(op==='abs'){const a=E(x[0]);return rat(abs(a[0]),a[1])}
 if(op==='num')return rat(E(x[0])[0]);
 if(op==='den')return rat(E(x[0])[1]);
 if(op==='lcm'){const a=BigInt(x[0]),b=BigInt(x[1]);return rat(a/gcd(a,b)*b)}
 if(op==='gcd')return rat(gcd(BigInt(x[0]),BigInt(x[1])));
 throw Error('Unknown mathematical operation '+op);
}
const lcm=(a,b)=>a/gcd(a,b)*b;
const slots=15,variants=20;
(async()=>{
 const file=fs.readFileSync('g5-fraction-applications-v130.js','utf8');
 assert(file.includes("'Из первой партии массой '+total+' кг"), 'The two independent stock supplies must remain corrected');
 assert(!file.includes("'Из '+total+' кг выделили '"),'Impossible double consumption of one stock is back');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(ids=>{
   let seed=2026111343;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const rows=[];
   for(const id of ids)for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<20;trial++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id);
    rows.push({id,level,family,trial,text:String(q.text),ex:String(q.ex),ans:String(q.ans),
      choices:q.choices.map(v=>({key:String(v.key),label:String(v.label)})),
      template:q.templateId,meta:q.mk129||q.mk130});
   }
   return {count:g5AllTopics().length,rows};
  },ids);
  assert.equal(result.count,74,'Course index changed');
  assert.equal(result.rows.length,ids.length*slots*variants,'Missing real exercises');
  const keys=new Map(),byTopic=new Map(),factorExamples=[];
  for(const q of result.rows){
   const prefix=q.id+' / '+q.level+'/'+q.family+' #'+q.trial;
   const meta=q.meta;
   assert(meta&&meta.id===q.id&&meta.t===q.level&&meta.p===q.family,'Incorrect generator metadata '+prefix);
   assert(!/undefined|NaN|Infinity/.test(q.text+q.ex),'Malformed text '+prefix);
   assert.equal(q.choices.filter(v=>v.key===q.ans).length,1,'No unique correct option '+prefix);
   assert.equal(new Set(q.choices.map(v=>v.label)).size,q.choices.length,'Duplicate visible option '+prefix);
   const result=solve(meta.plan),expected=rat(meta.expected.n,meta.expected.d);
   assert.deepEqual(result,expected,'Independent exact arithmetic failed '+prefix);
   const correct=expected[1]===1n?expected[0].toString():expected[0]+'/'+expected[1];
   assert.equal(q.ans,correct,'Incorrect registered correct answer '+prefix);
   const slot=q.id+':'+q.level+':'+q.family;
   if(q.trial===0){assert(!keys.has(slot),'Repeated family slot '+slot);keys.set(slot,q.template)}
   else assert.equal(keys.get(slot),q.template,'Question family drift '+prefix);
   byTopic.set(q.id,(byTopic.get(q.id)||0)+1);
   if(q.id==='frac_common_lcm'){
    const factor=meta.factorAudit;assert(factor,'No factorization audit '+prefix);
    let actual=1n;
    for(const n of factor.denominators)actual=lcm(actual,BigInt(n));
    assert.equal(BigInt(factor.lcm),actual,'LCM in explanation not mathematically minimal '+prefix);
    assert(q.ex.includes('Разложим знаменатели на простые множители'),'No actual denominator decomposition '+prefix);
    assert(q.ex.includes('Дополнительные множители'),'Missing denominator multipliers '+prefix);
    assert(q.ex.includes('= '+actual.toString()+'.'),'Wrong shown least common denominator '+prefix);
    for(const n of [...new Set(factor.denominators)])
     assert(q.ex.includes(actual+' : '+n+' = '+actual/BigInt(n)),'Missing correct multiplier '+n+' in '+prefix);
    if(q.trial===0)factorExamples.push({level:q.level,family:q.family,denominators:factor.denominators,lcm:Number(actual)});
   }
   if(q.id==='frac_reduce')assert(q.ex.includes('Разложим числитель и знаменатель')&&q.ex.includes('Делим оба числа'),'No actual canceling explanation '+prefix);
   if(q.id==='frac_equal'&&((q.level===0&&q.family===2)||((q.level===1||q.level===2)&&q.family===4)))
    assert(q.ex.includes('Разложим числитель и знаменатель'),'No proof of full reduction '+prefix);
   if(q.id==='frac_compare_diff')assert(q.ex.includes('Разложим знаменатели на простые множители'),'No concrete denominator comparison '+prefix);
   if(q.id==='frac_add_diff'||q.id==='frac_sub_diff')
    assert(q.ex.includes('Приводим дроби'),'No step-by-step common denominator arithmetic '+prefix);
   if(q.id==='frac_part_number'&&q.level===2&&q.family===3)
    assert(q.text.includes('Из второй такой же партии'),'Physically impossible doubled portion '+prefix);
  }
  assert.equal(keys.size,ids.length*slots,'Missing cognitive families');
  for(const id of ids)assert.equal(byTopic.get(id),slots*variants,'Incomplete topic '+id);
  assert.deepEqual(errors,[],'Browser runtime exceptions');
  console.log('G5_STAGE43_FACTOR_AND_EXACT_MATH_PASS '+JSON.stringify({topics:ids.length,questions:result.rows.length,families:keys.size,LCMExamples:factorExamples.slice(0,4),LCMChecks:slots*variants}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_STAGE43_FACTOR_AND_EXACT_MATH_FAIL',e.stack||e);process.exit(1)});
