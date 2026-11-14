'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const ID='formulas_g5';
function extract(text,re,ctx){
 const match=text.match(re);
 assert(match,'Cannot independently parse learner question '+ctx+': '+text);
 return match.slice(1).map(Number);
}
function compute(row){
 const s=row.text,l=row.level,p=row.family,ctx=l+'/'+p+'/'+row.trial;
 let a,b,c,d;
 if(l===0){
  if(p===0){[a,b]=extract(s,/скорость (\d+) км\/ч, время (\d+) ч/,ctx);return a*b;}
  if(p===1){[a,b]=extract(s,/со сторонами (\d+) см и (\d+) см/,ctx);return 2*(a+b);}
  if(p===2){[a,b]=extract(s,/Цена (\d+) руб\. за тетрадь, купили (\d+) тетрадей/,ctx);return a*b;}
  if(p===3){[a,b]=extract(s,/при x = (\d+) и y = (\d+)/,ctx);return 3*a+2*b;}
  [a,b,c]=extract(s,/со сторонами (\d+) см, (\d+) см и (\d+) см/,ctx);return a+b+c;
 }
 if(l===1){
  if(p===0){[a,b]=extract(s,/путь (\d+) км пройден за (\d+) ч/,ctx);assert.equal(a%b,0);return a/b;}
  if(p===1){[a,b]=extract(s,/прошли (\d+) км со скоростью (\d+) км\/ч/,ctx);assert.equal(a%b,0);return a/b;}
  if(p===2){[a,b]=extract(s,/Периметр прямоугольника (\d+) см, длина (\d+) см/,ctx);assert.equal(a%2,0);return a/2-b;}
  if(p===3){[a,b,c]=extract(s,/Цена (\d+) руб\., купили (\d+) товаров, доставка (\d+) руб/,ctx);return a*b+c;}
  [a,b,c]=extract(s,/если x = (\d+), y = (\d+), z = (\d+)/,ctx);return 4*a+3*b-c;
 }
 if(p===0){[a,b,c,d]=extract(s,/v₁ = (\d+) км\/ч, t₁ = (\d+) ч; v₂ = (\d+) км\/ч, t₂ = (\d+) ч/,ctx);return a*b+c*d;}
 if(p===1){[a,b,c,d]=extract(s,/длина (\d+) см, ширина (\d+) см\. Длину увеличили на (\d+) см, ширину на (\d+) см/,ctx);return 2*(a+b+c+d)-2*(a+b);}
 if(p===2){let e;[a,b,c,d,e]=extract(s,/Купили (\d+) товаров по (\d+) руб\. и (\d+) товаров по (\d+) руб\.; доставка (\d+) руб/,ctx);return a*b+c*d+e;}
 if(p===3){[a,b,c]=extract(s,/равен (\d+) км, скорость v = (\d+) км\/ч, дополнительный путь r = (\d+) км/,ctx);assert.equal((a-c)%b,0);return (a-c)/b;}
 [a,b,c,d]=extract(s,/При p = (\d+), n = (\d+), m = (\d+), d = (\d+)/,ctx);
 return Math.abs(a*(b+c)-(a+d)*b);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(({id})=>{
   let seed=2026111420;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<40;trial++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),node=document.createElement('div');node.innerHTML=String(q.text);
    rows.push({level,family,trial,text:node.textContent,answer:q.correctLabel,choices:q.choices.map(x=>({label:String(x.label),key:String(x.key)})),ans:String(q.ans),ex:String(q.ex),source:q.sourceTopicId,template:q.templateId,meta:q.mk123});
   }
   renderGrade5();
   return {rows,topics:g5AllTopics().length,lesson:String(g5Lesson(id)),links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="formulas_g5"]').length};
  },{id:ID});
  assert.equal(result.topics,74);assert.equal(result.rows.length,600);
  assert.equal(result.links,1);
  assert(result.lesson.includes('s = v · t')&&result.lesson.includes('P = 2(a + b)')&&result.lesson.includes('C = p · n'));
  const slots=new Map(),families=new Set(),steps=[[],[],[]];
  for(const q of result.rows){
   const ctx=q.level+'/'+q.family+'/'+q.trial,expected=compute(q),meta=q.meta;
   assert(meta&&meta.id===ID&&meta.t===q.level&&meta.p===q.family,'Active generator is stale '+ctx);
   assert(Number.isSafeInteger(expected)&&expected>=0,'Invalid mathematical result '+ctx);
   assert.equal(expected,meta.expected,'Incorrect computational plan '+ctx);
   assert.equal(Number(q.answer),expected,'Wrong learner answer '+ctx);
   assert.equal(q.choices.filter(c=>c.key===q.ans).length,1,'Ambiguous correct answer key '+ctx);
   assert.equal(new Set(q.choices.map(c=>c.label)).size,q.choices.length,'Repeated choice '+ctx);
   assert(q.ex.includes('Ответ: '+expected+'.'),'Explanation does not confirm correct answer '+ctx);
   assert(!/NaN|undefined|Infinity/.test(q.ex),'Invalid solution '+ctx);
   assert(q.template,'No family ID '+ctx);
   assert.equal(q.source,ID);
   let slot=q.level+'/'+q.family;
   if(!slots.has(slot))slots.set(slot,new Set());
   slots.get(slot).add(q.text);families.add(q.template);steps[q.level].push(meta.steps);
  }
  assert.equal(families.size,15,'Expected 15 independent concept families');
  assert.equal(slots.size,15);
  for(const [slot,texts]of slots)assert(texts.size>=10,'Insufficient randomized prompt variation '+slot+': '+texts.size);
  const averages=steps.map(a=>a.reduce((x,y)=>x+y,0)/a.length);
  assert(averages[0]<averages[1]&&averages[1]<averages[2],'Difficulty does not increase '+averages);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_20_PASS '+JSON.stringify({questions:600,families:15,meanSteps:averages}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_20_FAIL',e.stack||e);process.exit(1)});
