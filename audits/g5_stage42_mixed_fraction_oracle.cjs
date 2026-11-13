'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
const ids=['frac_types','frac_add','frac_sub','frac_division','frac_to_mixed','mixed_to_frac','mixed_compare','mixed_add','mixed_sub'];
const gcd=(x,y)=>{x=x<0n?-x:x;y=y<0n?-y:y;while(y){[x,y]=[y,x%y]}return x};
const rat=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert(d!==0n,'zero denominator');if(d<0n){n=-n;d=-d}const g=gcd(n,d);return [n/g,d/g]};
function calc(node){
 const [op,...p]=node;
 if(op==='rat')return rat(p[0],p[1]);
 if(op==='add')return p.reduce((a,x)=>{const b=calc(x);return rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1])},[0n,1n]);
 if(op==='sub'){const a=calc(p[0]),b=calc(p[1]);return rat(a[0]*b[1]-b[0]*a[1],a[1]*b[1])}
 if(op==='mul'){const a=calc(p[0]),b=calc(p[1]);return rat(a[0]*b[0],a[1]*b[1])}
 if(op==='div'){const a=calc(p[0]),b=calc(p[1]);return rat(a[0]*b[1],a[1]*b[0])}
 if(op==='abs'){const a=calc(p[0]);return rat(a[0]<0n?-a[0]:a[0],a[1])}
 throw Error('Unknown independently audited rational operation '+op);
}
function sum(terms,ops){
 assert.equal(terms.length-1,ops.length);
 return terms.reduce((acc,v,i)=>i===0?BigInt(v):ops[i-1]==='+'?acc+BigInt(v):acc-BigInt(v),0n);
}
function expectedConversion(a){
 const d=BigInt(a.den),n=BigInt(a.originalNumerator),whole=BigInt(a.whole),rem=BigInt(a.rem);
 assert.equal(n,whole*d+rem,'conversion source mixed and improper representations differ');
 const extras={
  full_conversion:n,full_recheck:n,whole_part:whole,remainder:rem,context_conversion:n,
  plus_one_whole:n+d,whole_after_plus_one:whole+1n,remainder_after_unit_fraction:(rem+1n)%d,
  context_plus_one:n+d,plus_two_wholes:n+2n*d,
  master_add_two_sub_one:n+d,master_whole_after_two_changes:whole+2n,
  master_remainder_after_numerator_changes:(rem+1n)%d,
  master_context_add_three_sub_one:n+2n*d,master_plus_four_minus_one:n+3n*d,
  new_numerator:n,count_fractional_units:n,plus_one_fractional_unit:n+1n,
  numerator_after_plus_one:n+d,context_fraction:n,count_parts_after_plus_one:n+d,
  plus_whole_and_fraction:n+d+1n,
  master_improper_add_two_sub_one:n+d,master_numerator_add_wholes_sub_part:n+2n*d-1n,
  master_context_improper_two_changes:n+d-1n,master_count_parts_two_changes:n+3n*d-2n,
  master_plus_whole_and_two_parts:n+2n*d+1n
 };
 assert(Object.hasOwn(extras,a.family),'Unknown conversion family '+a.family);
 return extras[a.family];
}
(async()=>{
 const source=fs.readFileSync('g5-fraction-applications-v130.js','utf8');
 assert(!source.includes('Сколько метра приходится'),'Grammar regression');
 assert(!source.includes('Какова суммарная доля одного участника каждой группы?'),'Ambiguous context regression');
 assert(source.includes('Какова общая длина двух отрезков'),'Restored meaningful fractional division context missing');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),browserErrors=[];
  page.on('pageerror',e=>browserErrors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(ids=>{
   let seed=2026111342;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const rows=[];
   for(const id of ids)for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let repeat=0;repeat<20;repeat++){
    blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
    const q=makeG5Question(id),right=q.choices.filter(c=>String(c.key)===String(q.ans));
    const div=document.createElement('div');div.innerHTML=String(right[0]?.label||'');
    const w=div.querySelector('.mixed .whole'),fraction=div.querySelector('.frac');
    const answerParts=fraction?{n:Number(fraction.querySelector('.num')?.textContent),d:Number(fraction.querySelector('.den')?.textContent),whole:w?Number(w.textContent):0}:null;
    rows.push({id,level,family,repeat,ans:String(q.ans),text:String(q.text),ex:String(q.ex),template:q.templateId,
     choices:q.choices.map(c=>({key:String(c.key),label:String(c.label)})),rightLabel:String(right[0]?.label),answerParts,
     audit:q.mk5Audit,conversion:q.conversionAudit,answerRat:q.answerRat?{n:q.answerRat.n,d:q.answerRat.d}:null,
     conversionType:q.stage18ConversionType,mode:q.answerMode,correctText:q.correctText,answerForm:q.stage18AnswerForm,
     mixed:q.mk115,application:q.mk130});
   }
   const nav=g5AllTopics();
   return {topics:nav.length,rows};
  },ids);
  assert.equal(data.topics,74,'Existing Grade 5 topic IDs were altered');
  assert.equal(data.rows.length,2700,'Incorrect number of generated questions');
  const byFamily=new Map(),models={proper:0,improper:0,whole:0,zeroError:0},conversionModes=new Set();
  for(const q of data.rows){
   const id=q.id+' stage '+q.level+' family '+q.family+' sample '+q.repeat;
   assert.equal(q.choices.filter(c=>c.key===q.ans).length,1,'Correct option missing '+id);
   assert.equal(new Set(q.choices.map(c=>c.label)).size,q.choices.length,'Duplicate answers '+id);
   assert(!/NaN|undefined|Infinity/.test(q.text+q.ex),'Malformed learner question '+id);
   const key=q.id+':'+q.level+':'+q.family;
   if(q.repeat===0){assert(!byFamily.has(key),'Duplicate topic family key '+key);byFamily.set(key,q.template)}
   else assert.equal(q.template,byFamily.get(key),'Template instability '+id);
   if(q.mixed){
    const a=q.mixed;
    assert.equal(a.id,q.id,'Bad arithmetic ID '+id);
    if(a.kind==='compare'){
     const left=sum(a.left,a.opsLeft),right=sum(a.right,a.opsRight);
     assert.equal(q.ans,left<right?'lt':left>right?'gt':'eq','Incorrect comparison '+id);
    }else if(a.kind==='numeric'||a.kind==='mixed'||a.kind==='fraction'){
     const total=sum(a.terms,a.ops);const value=a.absolute?(total<0n?-total:total):total;
     assert(value>=0n,'Negative mathematical quantity '+id);
     assert.equal(value.toString(),String(a.expected),'Incorrect generator arithmetic '+id);
     if(a.kind==='numeric')assert.equal(q.ans,value.toString(),'Wrong numeric answer '+id);
     else{
      const display=q.answerParts&&q.answerParts.d>0&&q.answerParts.n>=0
       ?rat(BigInt(q.answerParts.whole)*BigInt(q.answerParts.d)+BigInt(q.answerParts.n),q.answerParts.d)
       :/^\d+$/.test(q.rightLabel.trim())?rat(BigInt(q.rightLabel.trim())):null;
      assert(display,'Wrong displayed mixed-number or integer format '+id);
      const exact=rat(value,a.d);
      assert.deepEqual(display,exact,'Wrong displayed mixed fraction '+id);
     }
     if(q.id==='mixed_sub'&&q.level===2&&(q.family===0||q.family===1||q.family===3||q.family===4))
      assert(a.ops.length>=3,'Master mixed subtraction repeats an easier two-operation family '+id);
    }else if(a.kind==='choice')assert.equal(q.rightLabel,String(a.expected),'Wrong conceptual option '+id);
    else throw Error('Unexpected mixed/arithmetic task '+a.kind+' '+id);
   }
   if(q.application){
    const a=q.application,answer=calc(a.plan),expect=rat(a.expected.n,a.expected.d);
    assert.deepEqual(answer,expect,'Independent fraction-division oracle failed '+id);
    const shown=q.ans===String(answer[0])?rat(q.ans):q.ans.includes('/')?rat(...q.ans.split('/')):null;
    assert(shown,'Application answer missing '+id);
    assert.deepEqual(shown,answer,'Wrong fraction application key '+id);
   }
   if(q.audit){
    if(q.audit.type==='choice')assert.equal(q.rightLabel,String(q.audit.expected),'Wrong proper/improper classification '+id);
    if(q.audit.type==='numeric')assert.equal(q.ans,String(q.audit.expected),'Wrong proper/improper numeric result '+id);
    if(q.audit.type==='fraction'){
     assert(q.ans.includes('/'),'§28 proper fraction must be a fraction '+id);
     assert.deepEqual(rat(...q.ans.split('/')),rat(...q.audit.expected.split('/')),'Wrong proper fraction result '+id);
    }
   }
   if(q.conversion){
    const a=q.conversion,num=expectedConversion(a);
    assert.equal(String(a.answerNumerator),num.toString(),'Incorrect conversion arithmetic '+id);
    conversionModes.add(q.id+'_'+a.answerKind);
    if(a.answerKind==='number')assert.equal(q.ans,num.toString(),'Wrong single-field answer '+id);
    else{
     assert(q.answerRat,'Missing rational answer '+id);
     assert.deepEqual(rat(q.answerRat.n,q.answerRat.d),rat(num,a.den),'Wrong conversion rational number '+id);
     assert.equal(q.answerForm?.kind,a.answerKind==='mixed'?'mixed':'exact','Wrong conversion required input form '+id);
     if(a.answerKind==='improper')assert.equal(q.answerForm.n,num.toString()*1,'Wrong improper numerator '+id);
    }
   }
   if(q.id==='frac_types'){
    const match=q.text.match(/Дробь (\d+)\/(\d+):/);
    if(match){
     const n=Number(match[1]),d=Number(match[2]);
     if(n<d)models.proper++;else if(n>d)models.improper++;else models.whole++;
    }
   }
  }
  assert.equal(byFamily.size,135,'Lost cognitive families across §§28–32');
  for(const mode of ['frac_to_mixed_number','frac_to_mixed_mixed','mixed_to_frac_number','mixed_to_frac_improper'])
   assert(conversionModes.has(mode),'Missing required conversion answer mode '+mode);
  const diagramChecks=await page.evaluate(rows=>{
   let checks=0,proper=0,improper=0,equality=0;
   for(const q of rows.filter(x=>x.id==='frac_types')){
    const root=document.createElement('div');root.innerHTML=q.text;
    const svg=root.querySelector('svg[aria-label^="Дробь "]');if(!svg)continue;
    const m=svg.getAttribute('aria-label').match(/Дробь (\d+)\/(\d+):/);if(!m)throw Error('Malformed bar description');
    const n=Number(m[1]),d=Number(m[2]),rects=[...svg.querySelectorAll('rect')],filled=rects.filter(el=>el.getAttribute('fill')==='#67a5e6');
    if(filled.length!==n||rects.length!==Math.ceil(n/d)*d)throw Error('Visual fraction is not '+n+'/'+d);
    const expected=Math.ceil(n/d)*42+7;
    if(Number(svg.getAttribute('viewBox').split(' ')[3])!==expected)throw Error('Fraction bars are clipped');
    if(n<d)proper++;else if(n>d)improper++;else equality++;
    checks++;
   }
   return {checks,proper,improper,equality};
  },data.rows);
  assert.equal(diagramChecks.checks,80,'§28 should display 4 illustrated families × 20 variants');
  assert(diagramChecks.proper>0&&diagramChecks.improper>0&&diagramChecks.equality>0,'Missing one of proper/improper/equal visuals');
  assert.deepEqual(browserErrors,[],'Uncaught browser errors');
  const summary={topics:ids.length,questions:data.rows.length,families:byFamily.size,diagramChecks,conversionModes:[...conversionModes].sort()};
  console.log('G5_STAGE42_MIXED_FRACTION_ORACLE_PASS '+JSON.stringify(summary));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_STAGE42_MIXED_FRACTION_ORACLE_FAIL',e.stack||e);process.exit(1)});
