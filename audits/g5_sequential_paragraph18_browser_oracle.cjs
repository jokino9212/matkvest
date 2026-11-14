'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const TOPIC='divisors_multiples_g5',REPEATS=40;
const parse=(s,re,ctx)=>{const m=s.match(re);assert(m,'Cannot parse student text '+ctx+': '+s);return m.slice(1).map(Number);};
const gcd=(a,b)=>{assert(a>0&&b>0);while(b){const v=a%b;a=b;b=v;}return a;};
const lcm=(a,b)=>a/gcd(a,b)*b;
const divisors=n=>{let total=0;for(let i=1;i<=n;i++)if(n%i===0)total++;return total;};
function expected(q){
 const t=q.level,p=q.family,s=q.text,ctx=t+'/'+p+'/'+q.trial;
 let a,b,c;
 if(t===0){
  if(p===0){[a,b]=parse(s,/Число (\d+) — положительное кратное числа (\d+)\. Найди следующее/,ctx);assert.equal(a%b,0);return a+b;}
  if(p===1){[a,b]=parse(s,/Найди (\d+)-е положительное кратное числа (\d+)/,ctx);return a*b;}
  if(p===2){[a,b]=parse(s,/Число (\d+) делится на (\d+) без остатка/,ctx);assert.equal(a%b,0);return a/b;}
  if(p===3){[a]=parse(s,/Сколько положительных делителей у числа (\d+)/,ctx);return divisors(a);}
  [a,b]=parse(s,/Сколько положительных кратных числа (\d+) не превышают (\d+)/,ctx);return Math.floor(b/a);
 }
 if(t===1){
  if(p===0){[a,b]=parse(s,/Найди наименьшее общее положительное кратное чисел (\d+) и (\d+)/,ctx);return lcm(a,b);}
  if(p===1){[a,b]=parse(s,/Сколько общих положительных делителей у чисел (\d+) и (\d+)/,ctx);return divisors(gcd(a,b));}
  if(p===2){[a,b,c]=parse(s,/Сколько положительных кратных числа (\d+) находится от (\d+) до (\d+) включительно/,ctx);return Math.floor(c/a)-Math.floor((b-1)/a);}
  if(p===3){[a,b]=parse(s,/К числу (\d+) нужно прибавить наименьшее положительное число, чтобы получилось кратное (\d+)/,ctx);return b-a%b;}
  [a,b,c]=parse(s,/Сколько общих положительных кратных чисел (\d+) и (\d+) не превышают (\d+)/,ctx);return Math.floor(c/lcm(a,b));
 }
 if(p===0){[a,b]=parse(s,/Найди наименьшее общее положительное кратное чисел (\d+) и (\d+)/,ctx);assert(a%b&&b%a);return lcm(a,b);}
 if(p===1){[a,b]=parse(s,/Найди наибольший общий положительный делитель чисел (\d+) и (\d+)/,ctx);return gcd(a,b);}
 if(p===2){[a,b]=parse(s,/Из (\d+) карандашей и (\d+) фломастеров составляют наибольшее число одинаковых наборов/,ctx);return gcd(a,b);}
 if(p===3){const [lo,hi,x,y]=parse(s,/Сколько чисел от (\d+) до (\d+) включительно делятся без остатка и на (\d+), и на (\d+)/,ctx);return Math.floor(hi/lcm(x,y))-Math.floor((lo-1)/lcm(x,y));}
 const [limit,x,y]=parse(s,/Найди наименьшее натуральное число, большее (\d+), которое делится без остатка и на (\d+), и на (\d+)/,ctx),step=lcm(x,y);
 return (Math.floor(limit/step)+1)*step;
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(({topic,repeats})=>{
   let seed=2026111418;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<repeats;trial++){
    qid='g5:'+topic;
    blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(topic),div=document.createElement('div');div.innerHTML=String(q.text);
    rows.push({level,family,trial,text:div.textContent,answer:String(q.correctLabel),ans:String(q.ans),choices:q.choices.map(x=>({key:String(x.key),label:String(x.label)})),ex:String(q.ex),meta:q.mk18,source:q.sourceTopicId,template:q.templateId});
   }
   return {rows,total:g5AllTopics().length,lesson:String(g5Lesson(topic)),links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="divisors_multiples_g5"]').length};
  },{topic:TOPIC,repeats:REPEATS});
  assert.equal(out.total,74);assert.equal(out.rows.length,600);assert.equal(out.links,1);
  assert(out.lesson.includes('Наибольший общий делитель')&&out.lesson.includes('положительные кратные'));
  const slots=new Map(),templates=new Set(),steps=[[],[],[]];
  for(const q of out.rows){
   const ctx=q.level+'/'+q.family+'/'+q.trial,v=expected(q);
   assert(Number.isSafeInteger(v)&&v>0,'Invalid independent answer '+ctx);
   assert(q.meta&&q.meta.id===TOPIC&&q.meta.t===q.level&&q.meta.p===q.family,'Not live v153 family '+ctx);
   assert.equal(q.meta.expected,v,'Plan mismatch '+ctx);assert.equal(Number(q.answer),v,'Wrong learner-visible answer '+ctx);
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'Wrong key multiplicity '+ctx);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Duplicate choice '+ctx);
   assert(q.ex.includes('Ответ: '+v+'.'),'Unproved final answer '+ctx);
   assert(!/undefined|NaN|Infinity/.test(q.ex));assert(q.template);
   const slot=q.level+'/'+q.family;if(!slots.has(slot))slots.set(slot,new Set());
   slots.get(slot).add(q.text);templates.add(q.template);steps[q.level].push(q.meta.steps);
  }
  assert.equal(templates.size,15,'Expected 15 different cognitive families');
  assert.equal(slots.size,15);
  for(const [slot,seen]of slots)assert(seen.size>=10,'Insufficient visible variety '+slot+': '+seen.size);
  const means=steps.map(x=>x.reduce((a,b)=>a+b,0)/x.length);
  assert(means[0]<means[1]&&means[1]<means[2],'Difficulty not increasing: '+means);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_18_PASS '+JSON.stringify({questions:out.rows.length,families:templates.size,meanSteps:means}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_18_FAIL',e.stack||e);process.exit(1)});
