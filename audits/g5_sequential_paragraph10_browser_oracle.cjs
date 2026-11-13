'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const ID='numeric_literal_expressions',TRIALS=40;
const read=(s,re,ctx)=>{const m=s.match(re);assert(m,'Cannot interpret actual student condition '+ctx+': '+s);return m.slice(1).map(Number);};
function fromStudent(q){
 const s=q.plain,t=q.level,p=q.family,ctx=t+'/'+p+'/'+q.trial;
 let v;
 if(t===0){
  if(p===0){v=read(s,/числового выражения (\d+) \+ (\d+) − (\d+)/,ctx);return v[0]+v[1]-v[2];}
  if(p===1){v=read(s,/При a = (\d+) найди значение буквенного выражения a \+ (\d+)/,ctx);return v[0]+v[1];}
  if(p===2){v=read(s,/суммы числа a и числа (\d+)/,ctx);return 'a + '+v[0];}
  if(p===3){v=read(s,/При a = (\d+) вычисли значение буквенного выражения 3a/,ctx);return 3*v[0];}
  if(p===4){v=read(s,/разности удвоенного числа a и числа (\d+)/,ctx);return '2a − '+v[0];}
 }
 if(t===1){
  if(p===0){v=read(s,/При a = (\d+) и b = (\d+) вычисли значение 3a \+ 2b/,ctx);return 3*v[0]+2*v[1];}
  if(p===1){v=read(s,/затем сумму умножили на (\d+)/,ctx);return v[0]+'(a + b)';}
  if(p===2){v=read(s,/При a = (\d+) и b = (\d+) вычисли 4\(a \+ b\) − b/,ctx);return 4*(v[0]+v[1])-v[1];}
  if(p===3){v=read(s,/При a = (\d+) и b = (\d+) вычисли 7a − 2b/,ctx);return 7*v[0]-2*v[1];}
  if(p===4){v=read(s,/При a = (\d+) и b = (\d+) сколько всего наклеек/,ctx);return 3*v[0]+v[1];}
 }
 if(t===2){
  if(p===0){v=read(s,/разности произведения числа (\d+) и суммы a \+ b и произведения числа (\d+) и c/,ctx);return v[0]+'(a + b) − '+v[1]+'c';}
  if(p===1){v=read(s,/При a = (\d+) и b = (\d+) вычисли 5\(a \+ b\) − 2\(a \+ 2b\)/,ctx);return 5*(v[0]+v[1])-2*(v[0]+2*v[1]);}
  if(p===2){v=read(s,/При a = (\d+) и b = (\d+) на сколько значение выражения 4\(a \+ b\) больше значения выражения 3a \+ 2b/,ctx);return 4*(v[0]+v[1])-3*v[0]-2*v[1];}
  if(p===3){v=read(s,/При a = (\d+), b = (\d+), c = (\d+) вычисли \(a \+ b\)\(b \+ c\) − a\(b − 1\)/,ctx);return (v[0]+v[1])*(v[1]+v[2])-v[0]*(v[1]-1);}
  if(p===4){v=read(s,/купили (\d+) карандашей по (\d+) рублей и (\d+) альбомов по (\d+) рублей.*скидку (\d+) рублей/,ctx);return v[0]*v[1]+v[2]*v[3]-v[4];}
 }
 throw Error('Unknown §10 family '+ctx);
}
function bigMath(plan){
 assert(Array.isArray(plan),'Missing mathematical derivation');
 const [op,...x]=plan,E=bigMath;
 if(op==='v'){assert(Number.isSafeInteger(x[0]));return BigInt(x[0]);}
 if(op==='add')return x.reduce((acc,v)=>acc+E(v),0n);
 if(op==='sub')return E(x[0])-E(x[1]);
 if(op==='mul')return E(x[0])*E(x[1]);
 if(op==='div'){const a=E(x[0]),b=E(x[1]);assert(b!==0n&&a%b===0n);return a/b;}
 if(op==='abs'){const n=E(x[0]);return n<0n?-n:n;}
 throw Error('Unknown arithmetic plan operation '+op);
}
function evalSymbolic(src,env){
 const expression=src.replace(/\s/g,'').replace(/−/g,'-').replace(/:/g,'/');
 const chunks=expression.match(/\d+|[abc]|[()+\-*/]/g);
 assert(chunks&&chunks.join('')===expression,'Invalid expression token '+src);
 const tokens=[];
 for(const chunk of chunks){
  const prev=tokens.at(-1);
  if(prev&&(/^\d+$/.test(prev)||/^[abc)]$/.test(prev))&&(/^[abc(]$/.test(chunk)))tokens.push('*');
  tokens.push(chunk);
 }
 let i=0;
 const atom=()=>{
  const tok=tokens[i++];
  if(tok==='('){const x=expr();assert.equal(tokens[i++],')','Unclosed expression');return x;}
  if(/^\d+$/.test(tok))return Number(tok);
  if(tok==='a'||tok==='b'||tok==='c')return env[tok];
  if(tok==='-')return -atom();
  throw Error('Bad expression atom: '+tok+' from '+src);
 };
 const term=()=>{let x=atom();while(['*','/'].includes(tokens[i])){const op=tokens[i++],y=atom();x=op==='*'?x*y:x/y;}return x;};
 const expr=()=>{let x=term();while(['+','-'].includes(tokens[i])){const op=tokens[i++],y=term();x=op==='+'?x+y:x-y;}return x;};
 const result=expr();assert.equal(i,tokens.length,'Unparsed tokens in '+src);return result;
}
(async()=>{
 const nav=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
 assert(nav.includes("[10,'Числовые и буквенные выражения',['numeric_literal_expressions']]"),'Wrong textbook §10 mapping');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const output=await page.evaluate(({id,trials})=>{
   let seed=2026111310;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const questions=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<trials;trial++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),root=document.createElement('div');root.innerHTML=String(q.text);
    questions.push({level,family,trial,plain:root.textContent,answer:String(q.ans),
      choices:q.choices.map(x=>({label:String(x.label),key:String(x.key)})),correctLabel:String(q.correctLabel),
      ex:String(q.ex),meta:q.mk123,template:q.templateId,source:q.sourceTopicId});
   }
   renderGrade5();
   return {count:g5AllTopics().length,links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="numeric_literal_expressions"]').length,
    lesson:String(g5Lesson(id)),questions};
  },{id:ID,trials:TRIALS});
  assert.equal(output.count,74,'Grade 5 catalog must keep 74 topics');
  assert.equal(output.links,1,'§10 direct textbook link must be unique');
  assert(output.lesson.includes('3a')&&output.lesson.includes('4(a + b)')&&output.lesson.includes('удвоенного'),'Lesson lacks letters, implicit multiplication or translation');
  assert.equal(output.questions.length,600,'15 families × 40 actual generated questions required');
  const familyIds=new Map(),variations=new Map(),steps=[[],[],[]],modes={symbolic:0,numeric:0,uniqueness:0,wordProblems:0,multipleVariables:0};
  for(const q of output.questions){
   const ctx=q.level+'/'+q.family+'/'+q.trial,m=q.meta,expected=fromStudent(q);
   assert(m&&m.id===ID&&m.t===q.level&&m.p===q.family,'Not the final v123 generator '+ctx);
   assert.equal(q.source,ID,'Misrouted textbook ID '+ctx);
   assert.equal(q.choices.filter(x=>x.key===q.answer).length,1,'Correct option missing or ambiguous key '+ctx);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Repeated visual answers '+ctx);
   assert(!/undefined|NaN|Infinity/.test(q.plain+q.ex),'Malformed student condition '+ctx);
   assert.equal(q.correctLabel,String(expected),'Independent semantic answer differs from what student sees '+ctx);
   assert.equal(String(m.expected),String(expected),'Expected metadata does not match student wording '+ctx);
   assert(q.ex.includes('Ответ: '+expected+'.'),'Missing final correct explanation '+ctx);
   if(typeof expected==='string'){
    assert.equal(m.kind,'expression','Symbolic result wrongly treated as number '+ctx);
    assert.equal(m.plan[0],'expr','Symbolic math plan malformed '+ctx);
    assert.equal(q.answer,'yes','Wrong symbolic correct-option key '+ctx);
    assert.equal(q.choices.length,4,'Four choices needed for expression translation '+ctx);
    const assignments=[{a:2,b:5,c:3},{a:7,b:4,c:2},{a:11,b:9,c:6},{a:13,b:17,c:8}];
    for(const alt of q.choices){
     const equivalent=assignments.every(v=>Math.abs(evalSymbolic(alt.label,v)-evalSymbolic(expected,v))<1e-9);
     assert.equal(equivalent,alt.key===q.answer,'Mathematically equivalent distractor or incorrect expression '+ctx+' '+alt.label);
    }
    modes.symbolic++;modes.uniqueness++;
   }else{
    assert.equal(m.kind,'number','Numeric and symbolic answer modes confused '+ctx);
    assert(Number.isSafeInteger(expected)&&expected>=0,'Non-natural student answer '+ctx);
    assert.equal(q.answer,String(expected),'Numeric correct key wrong '+ctx);
    assert.equal(bigMath(m.plan),BigInt(expected),'Exact independent BigInt evaluator disagrees with student wording '+ctx);
    modes.numeric++;
   }
   if(q.level===1&&q.family===4||q.level===2&&q.family===4)modes.wordProblems++;
   if(q.level>=1&&q.family===0||q.level===2&&[1,2,3].includes(q.family))modes.multipleVariables++;
   const slot=q.level+'/'+q.family;steps[q.level].push(m.steps);
   if(!familyIds.has(slot))familyIds.set(slot,q.template);
   else assert.equal(familyIds.get(slot),q.template,'Family instability '+ctx);
   const set=variations.get(slot)||new Set();set.add(q.plain);variations.set(slot,set);
  }
  assert.equal(familyIds.size,15,'§10 requires 15 complete cognitive family slots');
  assert.equal(new Set(familyIds.values()).size,15,'Template IDs collided across tiers');
  for(const [slot,set]of variations)assert(set.size>=6,'Not enough actual distinct variants '+slot+': '+set.size);
  const avg=steps.map(a=>a.reduce((x,y)=>x+y,0)/a.length);
  assert(avg[0]<avg[1]&&avg[1]<avg[2],'Levels not progressively harder '+avg);
  assert.equal(modes.symbolic,160,'Need four symbolic word-to-expression families across difficulty tiers');
  assert.equal(modes.numeric,440,'Need eleven numeric and literal evaluation families');
  assert.equal(modes.wordProblems,80,'Need concrete real-life symbolic word problems');
  assert.deepEqual(errors,[],'Uncaught browser runtime error');
  console.log('G5_SEQUENTIAL_PARAGRAPH_10_PASS '+JSON.stringify({paragraph:10,questions:600,families:15,meanSteps:avg,modes,links:output.links}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_10_FAIL',e.stack||e);process.exit(1)});
