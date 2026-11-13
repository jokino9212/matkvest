'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const topic='natural_add',TRIALS=40;
const parse=(s,re,ctx)=>{const match=s.match(re);assert(match,'Cannot parse learner-facing task '+ctx+': '+s);return match.slice(1).map(Number);};
const sum=xs=>xs.reduce((a,b)=>a+b,0);
function studentOracle(q){
 const {level:t,family:p,plain:s}=q,ctx=t+'/'+p+'/'+q.trial;
 let v;
 if(t===0){
  if(p===0){v=parse(s,/Найди сумму натуральных чисел (\d+) и (\d+)/,ctx);return sum(v);}
  if(p===1){v=parse(s,/В равенстве (\d+) \+ (\d+) = □ \+ (\d+)/,ctx);assert.equal(v[0],v[2],'Commutativity must swap exact terms '+ctx);return v[1];}
  if(p===2){v=parse(s,/свойство нуля: (\d+) \+ 0 \+ (\d+)/,ctx);return sum(v);}
  if(p===3){v=parse(s,/Утром привезли (\d+) книг, днём — (\d+) книг/,ctx);return sum(v);}
  if(p===4){v=parse(s,/Вычисли удобным способом: (\d+) \+ (\d+) \+ (\d+)/,ctx);assert.equal(v[1]+v[2],100,'Warmup grouping must complete a hundred '+ctx);return sum(v);}
 }
 if(t===1){
  if(p===0){v=parse(s,/Вычисли удобным способом: (\d+) \+ (\d+) \+ (\d+)/,ctx);assert.equal(v[0]+v[2],100,'Training commutation should form hundred '+ctx);return sum(v);}
  if(p===1){v=parse(s,/Найди сумму (\d+) \+ (\d+) \+ (\d+) \+ (\d+) удобной группировкой/,ctx);assert.equal(v[1]+v[3],100,'One pair must make 100 '+ctx);return sum(v);}
  if(p===2){v=parse(s,/В сумме (\d+) \+ (\d+) \+ (\d+) \+ (\d+) сначала сложи пару/,ctx);assert.equal(v[1]+v[3],100,'Explicit pair must be 100 '+ctx);return sum(v);}
  if(p===3){v=parse(s,/В равенстве x \+ (\d+) \+ (\d+) = (\d+)/,ctx);assert(v[2]>v[0]+v[1],'Positive unknown addend');return v[2]-v[0]-v[1];}
  if(p===4){v=parse(s,/В понедельник получили (\d+) тетрадей, во вторник (\d+), в среду (\d+), в четверг (\d+)/,ctx);return sum(v);}
 }
 if(t===2){
  if(p===0){v=parse(s,/Вычисли, применяя свойства сложения: (\d+) \+ (\d+) \+ (\d+) \+ (\d+) \+ (\d+)/,ctx);assert.equal(v[0]+v[2],500,'First regrouping must be 500');assert.equal(v[1]+v[3],500,'Second regrouping must be 500');return sum(v);}
  if(p===1){v=parse(s,/Используя сочетательное свойство, вычисли (\d+) \+ (\d+) \+ (\d+) \+ (\d+) \+ (\d+) \+ (\d+)/,ctx);assert.equal(v[0]+v[2],100);assert.equal(v[1]+v[3],100);return sum(v);}
  if(p===2){v=parse(s,/Найди неизвестное слагаемое x в равенстве x \+ (\d+) \+ (\d+) \+ (\d+) \+ (\d+) = (\d+)/,ctx);assert.equal(v[0]+v[2],100);assert.equal(v[1]+v[3],100);return v[4]-sum(v.slice(0,4));}
  if(p===3){v=parse(s,/в первой (\d+), (\d+) и (\d+) штук, во второй (\d+), (\d+) и (\d+)/,ctx);return sum(v);}
  if(p===4){v=parse(s,/группируя удобные пары: (\d+) \+ (\d+) \+ (\d+) \+ (\d+) \+ (\d+) \+ (\d+) \+ (\d+)/,ctx);assert.equal(v[0]+v[3],100);assert.equal(v[2]+v[5],100);return sum(v);}
 }
 throw Error('Missing oracle family '+ctx);
}
function bigintPlan(node){
 assert(Array.isArray(node),'No operation plan');
 const [op,...values]=node,read=bigintPlan;
 if(op==='v')return BigInt(values[0]);
 if(op==='add')return values.reduce((acc,item)=>acc+read(item),0n);
 if(op==='sub')return read(values[0])-read(values[1]);
 if(op==='mul')return read(values[0])*read(values[1]);
 if(op==='div'){const a=read(values[0]),b=read(values[1]);assert(b&&a%b===0n);return a/b;}
 if(op==='abs'){const x=read(values[0]);return x<0n?-x:x}
 throw Error('Unknown arithmetic operation '+op);
}
(async()=>{
 const nav=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
 assert(nav.includes("[8,'Действие сложения. Свойства сложения',['natural_add']]"),'§8 textbook index wrong');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(({topic,trials})=>{
   let seed=2026111308;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const records=[];
   for(let t=0;t<3;t++)for(let p=0;p<5;p++)for(let j=0;j<trials;j++){
    qid='g5:'+topic;blockSession={kind:'g5quiz',key:qid,stageIndex:t,done:p,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(topic),dummy=document.createElement('div');dummy.innerHTML=String(q.text);
    records.push({level:t,family:p,trial:j,plain:dummy.textContent,text:String(q.text),ans:String(q.ans),
      choices:q.choices.map(x=>({key:String(x.key),label:String(x.label)})),
      correctLabel:String(q.correctLabel),ex:String(q.ex),template:q.templateId,meta:q.mk123,source:q.sourceTopicId});
   }
   renderGrade5();
   return {topics:g5AllTopics().length,links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="natural_add"]').length,
    lesson:String(g5Lesson('natural_add')),records};
  },{topic,trials:TRIALS});
  assert.equal(out.topics,74,'Existing 74 topic catalog changed');
  assert.equal(out.links,1,'§8 should be directly reachable from textbook table of contents');
  assert(/Переместительн/.test(out.lesson)&&/Сочетательн/.test(out.lesson)&&out.lesson.includes('37 + 64 + 63'),'Lesson must demonstrate both laws and concrete regrouping');
  assert.equal(out.records.length,600,'Expected 3 × 5 × 40 true generated exercises');
  const families=new Map(),variation=new Map(),steps=[[],[],[]],groupChecks={hundreds:0,zero:0,commutation:0,inverse:0,contexts:0};
  for(const q of out.records){
   const ctx=q.level+'/'+q.family+'/'+q.trial,meta=q.meta;
   assert(meta&&meta.id===topic&&meta.t===q.level&&meta.p===q.family,'Must inspect active v123 generator, not shadowed donor '+ctx);
   assert.equal(q.source,topic,'Topic identifier changed for '+ctx);
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'Correct answer option missing or repeated '+ctx);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Duplicate visible answer choices '+ctx);
   assert(!/undefined|NaN|Infinity/.test(q.plain+q.ex),'Malformed question text '+ctx);
   const answer=studentOracle(q),computed=bigintPlan(meta.plan);
   assert.equal(computed.toString(),String(answer),'BigInt plan differs from independent text interpretation '+ctx);
   assert.equal(String(meta.expected),String(answer),'Stored right answer not what student should compute '+ctx);
   assert.equal(q.correctLabel,String(answer),'Correct choice text differs from meaningful answer '+ctx);
   assert.equal(q.ans,String(answer),'Incorrect registered answer key '+ctx);
   assert(q.ex.includes('Ответ: '+answer),'Teacher explanation missing calculated final answer '+ctx);
   if(q.level===0&&q.family===1){assert(q.ex.includes('перестановки'),'Missing commutativity reasoning');groupChecks.commutation++;}
   if(q.level===0&&q.family===2){assert(q.ex.includes('нуля'),'Missing zero identity');groupChecks.zero++;}
   if((q.level===0&&q.family===4)||(q.level===1&&q.family<=2)||(q.level===2&&[0,1,2,4].includes(q.family))){assert(/100|500/.test(q.ex),'Missing round-number regrouping in explanation '+ctx);groupChecks.hundreds++;}
   if((q.level===1&&q.family===3)||(q.level===2&&q.family===2))groupChecks.inverse++;
   if((q.level===0&&q.family===3)||(q.level===1&&q.family===4)||(q.level===2&&q.family===3))groupChecks.contexts++;
   steps[q.level].push(meta.steps);
   const slot=q.level+'/'+q.family;
   if(!families.has(slot))families.set(slot,q.template);
   else assert.equal(q.template,families.get(slot),'A family ID varies unpredictably '+ctx);
   const set=variation.get(slot)||new Set();set.add(q.plain);variation.set(slot,set);
  }
  assert.equal(families.size,15,'15 independently different cognitive families required');
  assert.equal(new Set(families.values()).size,15,'Family IDs must be unique');
  for(const [slot,set]of variation)assert(set.size>=10,'Insufficient distinct numerical conditions '+slot+': '+set.size);
  const avg=steps.map(x=>x.reduce((acc,n)=>acc+n,0)/x.length);
  assert(avg[0]<avg[1]&&avg[1]<avg[2],'Addition levels are not getting more complex '+avg.join(', '));
  assert(groupChecks.hundreds>=300,'Hundred-completion property underused');
  assert.equal(groupChecks.commutation,40);
  assert.equal(groupChecks.zero,40);
  assert.equal(groupChecks.inverse,80);
  assert.equal(groupChecks.contexts,120);
  assert.deepEqual(errors,[],'Uncaught JS browser runtime error');
  console.log('G5_SEQUENTIAL_PARAGRAPH_08_PASS '+JSON.stringify({paragraph:8,questions:600,families:15,meanSteps:avg,groups:groupChecks,links:out.links}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_08_FAIL',e.stack||e);process.exit(1)});
