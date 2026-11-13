'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const TOPIC='natural_divide',REPEATS=40;
function read(prompt,re,ctx){const m=prompt.match(re);assert(m,'Cannot interpret student text '+ctx+': '+prompt);return m.slice(1).map(Number)}
function quotient(a,b,ctx){assert(Number.isSafeInteger(a)&&Number.isSafeInteger(b)&&b>0&&a>=0&&a%b===0,'Invalid or nonexact natural quotient '+ctx+': '+a+' / '+b);return a/b}
function learnerOracle(q){
 const s=q.plain,t=q.level,p=q.family,ctx=t+'/'+p+'/'+q.trial;let v;
 if(t===0){
  if(p===0){v=read(s,/Найди частное (\d+) : (\d+)/,ctx);return quotient(v[0],v[1],ctx);}
  if(p===1){v=read(s,/В равенстве (\d+) : □ = (\d+) найди неизвестный делитель/,ctx);return quotient(v[0],v[1],ctx);}
  if(p===2){v=read(s,/В равенстве x : (\d+) = (\d+) найди неизвестное делимое/,ctx);return v[0]*v[1];}
  if(p===3){v=read(s,/свойства деления: (\d+) : 1 \+ (\d+) : (\d+) \+ 0 : (\d+)/,ctx);assert.equal(v[0],v[1]);assert.equal(v[1],v[2]);return v[0]+quotient(v[1],v[2],ctx);}
  if(p===4){v=read(s,/^(\d+) тетрадей разложили поровну в (\d+) коробок/,ctx);return quotient(v[0],v[1],ctx);}
 }
 if(t===1){
  if(p===0){v=read(s,/Найди сумму частных (\d+) : (\d+) и (\d+) : (\d+)/,ctx);return quotient(v[0],v[1],ctx)+quotient(v[2],v[3],ctx);}
  if(p===1){v=read(s,/Вычисли \((\d+) \+ (\d+)\) : (\d+)/,ctx);assert.equal(v[0]%v[2],0,'Each part of sum must itself be divisible');assert.equal(v[1]%v[2],0);return quotient(v[0]+v[1],v[2],ctx);}
  if(p===2){v=read(s,/Вычисли \((\d+) − (\d+)\) : (\d+)/,ctx);assert(v[0]>=v[1]);return quotient(v[0]-v[1],v[2],ctx);}
  if(p===3){v=read(s,/Для (\d+) классов выделили (\d+) тетрадей поровну.*отложили (\d+) тетрадей/,ctx);const per=quotient(v[1],v[0],ctx);assert(per>=v[2]);return per-v[2];}
  if(p===4){v=read(s,/Число x разделили на (\d+), затем на (\d+) и получили (\d+)/,ctx);return v[0]*v[1]*v[2];}
 }
 if(t===2){
  if(p===0){v=read(s,/Вычисли \((\d+) \+ (\d+)\) : (\d+) \+ (\d+) : (\d+)/,ctx);return quotient(v[0]+v[1],v[2],ctx)+quotient(v[3],v[4],ctx);}
  if(p===1){v=read(s,/Вычисли \((\d+) − (\d+)\) : (\d+) \+ (\d+) : (\d+)/,ctx);assert(v[0]>=v[1]);return quotient(v[0]-v[1],v[2],ctx)+quotient(v[3],v[4],ctx);}
  if(p===2){v=read(s,/привезли (\d+) книг\. (\d+) книг оставили.*между (\d+) классами\. В каждом классе (\d+) книг поставили/,ctx);assert(v[0]>=v[1]);const first=quotient(v[0]-v[1],v[2],ctx);assert(first>=v[3]);return first-v[3];}
  if(p===3){v=read(s,/В (\d+) больших коробках было по (\d+) карандашей, а в (\d+) других коробках — по (\d+) карандашей\. Все карандаши разложили поровну в (\d+) новых наборов/,ctx);return quotient(v[0]*v[1]+v[2]*v[3],v[4],ctx);}
  if(p===4){v=read(s,/Вычисли частное \((\d+) \+ (\d+) − (\d+)\) : (\d+)/,ctx);assert(v[0]+v[1]>=v[2]);return quotient(v[0]+v[1]-v[2],v[3],ctx);}
 }
 throw Error('Missing learner oracle family '+ctx);
}
function exact(node){
 assert(Array.isArray(node),'Math oracle plan must be an array');
 const [op,...params]=node,E=exact;
 if(op==='v'){assert(Number.isSafeInteger(params[0]));return BigInt(params[0])}
 if(op==='add')return params.reduce((acc,x)=>acc+E(x),0n);
 if(op==='sub')return E(params[0])-E(params[1]);
 if(op==='mul')return E(params[0])*E(params[1]);
 if(op==='div'){const a=E(params[0]),b=E(params[1]);assert(b>0n&&a>=0n&&a%b===0n,'Nonexact or zero denominator in math plan: '+JSON.stringify(node));return a/b}
 if(op==='abs'){const a=E(params[0]);return a<0n?-a:a}
 throw Error('Unknown arithmetic operation '+op);
}
function verifySteps(node){
 if(!Array.isArray(node))return;
 const [op,...params]=node;
 for(const p of params.filter(Array.isArray))verifySteps(p);
 if(op==='sub')assert(exact(node)>=0n,'Negative intermediate in natural division '+JSON.stringify(node));
 if(op==='div')assert(exact(node)>=0n,'Invalid division stage '+JSON.stringify(node));
}
(async()=>{
 const nav=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
 assert(nav.includes("[13,'Действие деления',['natural_divide']]"),'§13 textbook mapping missing or changed');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),uncaught=[];
  page.on('pageerror',e=>uncaught.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(({id,repeats})=>{
   let seed=2026111413;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<repeats;trial++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),el=document.createElement('div');el.innerHTML=String(q.text);
    rows.push({level,family,trial,plain:el.textContent,ans:String(q.ans),correctLabel:String(q.correctLabel),
      choices:q.choices.map(x=>({key:String(x.key),label:String(x.label)})),ex:String(q.ex),
      meta:q.mk123,template:q.templateId,source:q.sourceTopicId});
   }
   renderGrade5();
   return {topics:g5AllTopics().length,lesson:String(g5Lesson(id)),links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="natural_divide"]').length,rows};
  },{id:TOPIC,repeats:REPEATS});
  assert.equal(data.topics,74,'Keep all 74 topics and their IDs');
  assert.equal(data.links,1,'Exactly one navigable §13 heading expected');
  assert(data.lesson.includes('Делимое : делитель = частное')&&data.lesson.includes('Деление на 0 запрещено')&&data.lesson.includes('84 : 7 = 12'),'§13 learner theory lacks parts, zero rule, or worked example');
  assert.equal(data.rows.length,600,'§13 requires exactly 3 × 5 × 40 learner-generated tasks');
  const families=new Map(),variety=new Map(),steps=[[],[],[]];
  const methods={divisionByOneAndSelf:0,unknownDividend:0,unknownDivisor:0,realEqualShares:0,divisionOfSum:0,divisionOfDifference:0,inverseTwoDivisions:0,twoDifferentQuotients:0,advancedNarratives:0};
  for(const q of data.rows){
   const ctx=q.level+'/'+q.family+'/'+q.trial,m=q.meta,expected=learnerOracle(q);
   assert(m&&m.id===TOPIC&&m.t===q.level&&m.p===q.family,'Question did not come from final active v123 '+ctx);
   assert.equal(q.source,TOPIC,'Saved progress topic ID drift '+ctx);
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'Missing unique correct answer choice '+ctx);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Duplicate visible option '+ctx);
   assert(!/undefined|NaN|Infinity/.test(q.plain+q.ex),'Malformed learner question or explanation '+ctx);
   assert(Number.isSafeInteger(expected)&&expected>=0,'Non-natural answer from learner condition '+ctx);
   assert.equal(q.ans,String(expected),'Accepted key incorrect for visible question '+ctx);
   assert.equal(q.correctLabel,String(expected),'Displayed correct option incorrect for visible question '+ctx);
   assert.equal(m.expected,expected,'Generator math metadata is wrong '+ctx);
   assert.equal(exact(m.plan),BigInt(expected),'Independent BigInt plan and text interpretation disagree '+ctx);
   verifySteps(m.plan);
   assert(q.ex.includes('Ответ: '+expected+'.'),'Missing explicit final answer in full solution '+ctx);
   assert((q.ex.match(/=/g)||[]).length>=2,'No concrete intermediate mathematical equality in explanation '+ctx);
   if(q.level===0&&q.family===3){assert(q.ex.includes('0 :')&&q.ex.includes(': 1')&&q.ex.includes('на ненулевое число'));methods.divisionByOneAndSelf++;}
   if(q.level===0&&q.family===1)methods.unknownDivisor++;
   if(q.level===0&&q.family===2)methods.unknownDividend++;
   if(q.level===0&&q.family===4||q.level===1&&q.family===3)methods.realEqualShares++;
   if(q.level===1&&q.family===1||q.level===2&&q.family===0||q.level===2&&q.family===4)methods.divisionOfSum++;
   if(q.level===1&&q.family===2||q.level===2&&q.family===1)methods.divisionOfDifference++;
   if(q.level===1&&q.family===4)methods.inverseTwoDivisions++;
   if(q.level===1&&q.family===0)methods.twoDifferentQuotients++;
   if(q.level===2&&[2,3].includes(q.family))methods.advancedNarratives++;
   if(q.level===2)assert((q.ex.match(/=/g)||[]).length>=3,'Master level lacks several actual computations '+ctx);
   const slot=q.level+'/'+q.family;steps[q.level].push(m.steps);
   if(!families.has(slot))families.set(slot,q.template);
   else assert.equal(families.get(slot),q.template,'Cognitive template ID switched '+ctx);
   const set=variety.get(slot)||new Set();set.add(q.plain);variety.set(slot,set);
  }
  assert.equal(families.size,15,'Need exactly 15 Grade 5 division cognitive families');
  assert.equal(new Set(families.values()).size,15,'Duplicate family IDs across slots');
  for(const [slot,set]of variety)assert(set.size>=10,'Not enough distinct learner prompts '+slot+' ('+set.size+')');
  const meanSteps=steps.map(a=>a.reduce((x,y)=>x+y,0)/a.length);
  assert(meanSteps[0]<meanSteps[1]&&meanSteps[1]<meanSteps[2],'False difficulty progression '+meanSteps);
  assert.deepEqual(methods,{divisionByOneAndSelf:40,unknownDividend:40,unknownDivisor:40,realEqualShares:80,divisionOfSum:120,divisionOfDifference:80,inverseTwoDivisions:40,twoDifferentQuotients:40,advancedNarratives:80},'Insufficient real cognitive diversity');
  assert.deepEqual(uncaught,[],'Uncaught browser exception');
  console.log('G5_SEQUENTIAL_PARAGRAPH_13_PASS '+JSON.stringify({paragraph:13,questions:data.rows.length,families:families.size,meanSteps,methods,links:data.links}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_13_FAIL',e.stack||e);process.exit(1)});
