'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const TOPIC='natural_multiply',TRIALS=40;
const numbers=(s,re,ctx)=>{const match=s.match(re);assert(match,'Could not independently parse student-facing §12 prompt '+ctx+': '+s);return match.slice(1).map(Number);};
const total=arr=>arr.reduce((acc,x)=>acc+x,0);
function learnerAnswer(q){
 const t=q.level,p=q.family,s=q.plain,ctx=t+'/'+p+'/'+q.trial;let v;
 if(t===0){
  if(p===0){v=numbers(s,/Найди произведение (\d+) · (\d+)/,ctx);return v[0]*v[1];}
  if(p===1){v=numbers(s,/В равенстве (\d+) · (\d+) = (\d+) · □ найди число вместо □/,ctx);assert.equal(v[1],v[2],'Not genuine factor swap');return v[0];}
  if(p===2){v=numbers(s,/свойства единицы и нуля: 1 · (\d+) \+ (\d+) · 0/,ctx);return v[0];}
  if(p===3){v=numbers(s,/каждой коробке (\d+) карандашей.*в (\d+) одинаковых коробках/,ctx);return v[0]*v[1];}
  if(p===4){v=numbers(s,/способом: \(4 · 25\) · (\d+)/,ctx);return 100*v[0];}
 }
 if(t===1){
  if(p===0){v=numbers(s,/способом: 25 · (\d+) · 4/,ctx);return 100*v[0];}
  if(p===1){v=numbers(s,/по распределительному свойству: (\d+) · \((\d+) \+ (\d+)\)/,ctx);return v[0]*(v[1]+v[2]);}
  if(p===2){v=numbers(s,/распределительное свойство: (\d+) · \((\d+) − (\d+)\)/,ctx);assert(v[1]>v[2],'Subtracted product starts with negative difference');return v[0]*(v[1]-v[2]);}
  if(p===3){v=numbers(s,/способом: 37 · (\d+) \+ 63 · (\d+)/,ctx);assert.equal(v[0],v[1],'Different common factors!');return 100*v[0];}
  if(p===4){v=numbers(s,/каждом из (\d+) одинаковых наборов по (\d+) карандашей и (\d+) фломастеров/,ctx);return v[0]*(v[1]+v[2]);}
 }
 if(t===2){
  if(p===0){v=numbers(s,/способом: 125 · (\d+) · 8 · (\d+)/,ctx);return 1000*v[0]*v[1];}
  if(p===1){v=numbers(s,/общий множитель: (\d+) · (\d+) \+ (\d+) · (\d+) \+ (\d+) · (\d+)/,ctx);assert.equal(v[1],v[3]);assert.equal(v[3],v[5]);return (v[0]+v[2]+v[4])*v[1];}
  if(p===2){v=numbers(s,/распределительного свойства: (\d+) · \((\d+) \+ (\d+)\) − (\d+) · (\d+)/,ctx);assert.equal(v[0],v[3],'Factor being subtracted not common');assert(v[1]+v[2]>v[4],'Subtracted product would require negative group');return v[0]*(v[1]+v[2]-v[4]);}
  if(p===3){v=numbers(s,/привезли (\d+) коробок по (\d+) карандашей и (\d+) коробок по (\d+) карандашей.*ещё (\d+) наборов по 10 карандашей/,ctx);assert.equal(v[1],v[3]);return (v[0]+v[2])*v[1]+v[4]*10;}
  if(p===4){v=numbers(s,/множитель x: 15x \+ 35x \+ 50x = (\d+)/,ctx);assert.equal(v[0]%100,0);return v[0]/100;}
 }
 throw Error('Unknown student-facing §12 family '+ctx);
}
function exactPlan(node){
 assert(Array.isArray(node),'Math oracle not an operation plan');
 const [op,...args]=node,E=exactPlan;
 if(op==='v')return BigInt(args[0]);
 if(op==='add')return args.reduce((acc,v)=>acc+E(v),0n);
 if(op==='sub')return E(args[0])-E(args[1]);
 if(op==='mul')return E(args[0])*E(args[1]);
 if(op==='div'){const x=E(args[0]),y=E(args[1]);assert(y!==0n&&x%y===0n,'Nonintegral division');return x/y;}
 if(op==='abs'){const x=E(args[0]);return x<0n?-x:x;}
 throw Error('Unknown exact plan operation '+op);
}
function noNegativeNaturalSteps(node){
 if(!Array.isArray(node))return;
 const [op,...args]=node;
 for(const arg of args.filter(Array.isArray))noNegativeNaturalSteps(arg);
 if(op==='sub')assert(exactPlan(node)>=0n,'Negative intermediate for Grade 5 natural multiplication');
}
(async()=>{
 const nav=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
 assert(nav.includes("[12,'Действие умножения. Свойства умножения',['natural_multiply']]"),'§12 textbook paragraph mapping was lost');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),uncaught=[];
  page.on('pageerror',e=>uncaught.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(({topic,trials})=>{
   let seed=2026111412;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const results=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<trials;trial++){
    qid='g5:'+topic;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(topic),root=document.createElement('div');root.innerHTML=String(q.text);
    results.push({level,family,trial,plain:root.textContent,ans:String(q.ans),correctLabel:String(q.correctLabel),
     choices:q.choices.map(x=>({key:String(x.key),label:String(x.label)})),ex:String(q.ex),template:q.templateId,
     source:q.sourceTopicId,meta:q.mk123});
   }
   renderGrade5();
   return {topics:g5AllTopics().length,lesson:String(g5Lesson(topic)),
    links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="natural_multiply"]').length,results};
  },{topic:TOPIC,trials:TRIALS});
  assert.equal(out.topics,74,'Existing grade-5 topic inventory must be preserved');
  assert.equal(out.links,1,'§12 needs direct unique textbook navigation link');
  assert(out.lesson.includes('Переместительное')&&out.lesson.includes('Сочетательное')&&out.lesson.includes('Распределительное'),'Missing one of three essential rules in learner theory');
  assert(out.lesson.includes('25 · 13 · 4')&&out.lesson.includes('37 · 6 + 63 · 6')&&out.lesson.includes('a · 0 = 0'),'Learner theory must explain concrete grouping, distributing, and multiplying by zero');
  assert.equal(out.results.length,600,'Exactly 600 actual generated student-visible problems expected');
  const slotIds=new Map(),distinct=new Map(),steps=[[],[],[]];
  const coverage={zeroIdentity:0,commutative:0,associative:0,distributiveSum:0,distributiveDifference:0,commonFactor:0,unknownFactor:0,wordProblems:0};
  for(const q of out.results){
   const ctx=q.level+'/'+q.family+'/'+q.trial,m=q.meta,value=learnerAnswer(q);
   assert(m&&m.id===TOPIC&&m.t===q.level&&m.p===q.family,'The live generator is not active v123 '+ctx);
   assert.equal(q.source,TOPIC,'Topic ID drift '+ctx);
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'Ambiguous or missing correct answer '+ctx);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Duplicate answer choices '+ctx);
   assert(!/undefined|NaN|Infinity/.test(q.plain+q.ex),'Malformed text or teacher explanation '+ctx);
   assert(Number.isSafeInteger(value)&&value>=0,'Math answer must be nonnegative safe integer '+ctx);
   assert.equal(q.ans,String(value),'Correct key differs from actual student question '+ctx);
   assert.equal(q.correctLabel,String(value),'Student correct option wrong '+ctx);
   assert.equal(m.expected,value,'Stored generator expected answer wrong '+ctx);
   assert.equal(exactPlan(m.plan),BigInt(value),'Independent BigInt mathematics does not match student wording '+ctx);
   noNegativeNaturalSteps(m.plan);
   assert(q.ex.includes('Ответ: '+value+'.'),'Detailed solution does not conclude with student answer '+ctx);
   if(q.level===0&&q.family===1){assert(q.ex.includes('Переместительное'));coverage.commutative++;}
   if(q.level===0&&q.family===2){assert(q.ex.includes('1 ·')&&q.ex.includes('· 0'));coverage.zeroIdentity++;}
   if(q.level===0&&q.family===4||q.level===1&&q.family===0||q.level===2&&q.family===0){assert(/100|1000/.test(q.ex));coverage.associative++;}
   if(q.level===1&&q.family===1||q.level===1&&q.family===4){assert(/свойств/.test(q.plain+q.ex));coverage.distributiveSum++;}
   if(q.level===1&&q.family===2||q.level===2&&q.family===2){assert(/распределительн/.test(q.plain+q.ex));coverage.distributiveDifference++;}
   if(q.level===1&&q.family===3||q.level===2&&[1,2,4].includes(q.family)){assert(/множител/.test(q.plain+q.ex));coverage.commonFactor++;}
   if(q.level===2&&q.family===4){assert(q.ex.includes('Проверка:'));coverage.unknownFactor++;}
   if(q.level===0&&q.family===3||q.level===1&&q.family===4||q.level===2&&q.family===3){coverage.wordProblems++;}
   const slot=q.level+'/'+q.family;steps[q.level].push(m.steps);
   if(!slotIds.has(slot))slotIds.set(slot,q.template);
   else assert.equal(slotIds.get(slot),q.template,'Cognitive template identity is unstable '+ctx);
   const seen=distinct.get(slot)||new Set();seen.add(q.plain);distinct.set(slot,seen);
  }
  assert.equal(slotIds.size,15,'15 different slot combinations required');
  assert.equal(new Set(slotIds.values()).size,15,'Template collision between 15 families');
  for(const [slot,seen]of distinct)assert(seen.size>=10,'Too few genuinely distinct displayed tasks '+slot+' ('+seen.size+')');
  const means=steps.map(arr=>arr.reduce((s,v)=>s+v,0)/arr.length);
  assert(means[0]<means[1]&&means[1]<means[2],'Difficulty does not grow by cognitive steps '+means);
  assert.equal(coverage.zeroIdentity,40);assert.equal(coverage.commutative,40);
  assert.equal(coverage.associative,120);assert.equal(coverage.distributiveSum,80);
  assert.equal(coverage.distributiveDifference,80);assert.equal(coverage.commonFactor,160);
  assert.equal(coverage.unknownFactor,40);assert.equal(coverage.wordProblems,120);
  assert.deepEqual(uncaught,[],'Unhandled runtime errors in live student browser');
  console.log('G5_SEQUENTIAL_PARAGRAPH_12_PASS '+JSON.stringify({paragraph:12,questions:600,families:15,meanSteps:means,coverage,links:out.links}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_12_FAIL',e.stack||e);process.exit(1)});
