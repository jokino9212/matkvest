'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const ID='divisibility_rules_g5',REPEATS=40;
function args(s,re,ctx){const m=s.match(re);assert(m,'Unable to parse actual learner question '+ctx+': '+s);return m.slice(1).map(Number);}
function count(lo,hi,k){assert(lo>0&&hi>=lo&&k>0);return Math.floor(hi/k)-Math.floor((lo-1)/k);}
const validDigits=(base,k)=>Array.from({length:10},(_,i)=>i).filter(i=>(base+i)%k===0).length;
function expectation(q){
 const s=q.text,t=q.level,p=q.family,ctx=t+'/'+p+'/'+q.trial;
 let n,lo,hi;
 if(t===0){
  if(p===0){[n]=args(s,/в числе (\d+)\*0, чтобы оно делилось на 2/,ctx);return Array.from({length:10},(_,i)=>n*100+i*10).filter(x=>x%2===0).length;}
  if(p===1){[n]=args(s,/в числе (\d+)\*, чтобы оно делилось на 5/,ctx);return validDigits(n*10,5);}
  if(p===2){const m=s.match(/Среди чисел ([\d,\s]+) сколько делятся на 10/);assert(m,'List unavailable '+ctx);return m[1].split(',').map(Number).filter(x=>x%10===0).length;}
  if(p===3){const m=s.match(/Сколько чётных чисел среди ([\d,\s]+)\?/);assert(m,'Even list unavailable '+ctx);return m[1].split(',').map(Number).filter(x=>x%2===0).length;}
  [n]=args(s,/в числе (\d+)\*, если оно должно делиться и на 2, и на 5/,ctx);
  return validDigits(n*10,10);
 }
 if(t===1){
  if(p===0){[n]=args(s,/число (\d+) \+ x делящимся на 3/,ctx);return validDigits(n,3);}
  if(p===1){[n]=args(s,/число (\d+) \+ x, делящееся на 9/,ctx);return validDigits(n,9);}
  if(p===2){[lo,hi]=args(s,/от (\d+) до (\d+) включительно делится на 5/,ctx);return count(lo,hi,5);}
  if(p===3){[lo,hi]=args(s,/от (\d+) до (\d+) включительно одновременно чётны и делятся на 5/,ctx);return count(lo,hi,10);}
  [n]=args(s,/число (\d+) \+ x делящимся на 2 и 3/,ctx);return validDigits(n,6);
 }
 if(p===0){[lo,hi]=args(s,/от (\d+) до (\d+) одновременно делится на 2, 3 и 5/,ctx);return count(lo,hi,30);}
 if(p===1){[n]=args(s,/число (\d+) \+ x делящимся на 3 и 5/,ctx);return validDigits(n,15);}
 if(p===2){[lo,hi]=args(s,/от (\d+) до (\d+) делятся на 9 и одновременно на 2/,ctx);return count(lo,hi,18);}
 if(p===3){[lo,hi]=args(s,/от (\d+) до (\d+) включительно сколько чисел делятся на 3, но не делятся на 9/,ctx);return count(lo,hi,3)-count(lo,hi,9);}
 [lo,hi]=args(s,/от (\d+) до (\d+) делится на 2 или на 5/,ctx);
 return count(lo,hi,2)+count(lo,hi,5)-count(lo,hi,10);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(({id,repeats})=>{
   let seed=2026111419;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<repeats;trial++){
    qid='g5:'+id;
    blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),root=document.createElement('div');root.innerHTML=String(q.text);
    rows.push({level,family,trial,text:root.textContent,answer:String(q.correctLabel),ans:String(q.ans),choices:q.choices.map(x=>({key:String(x.key),label:String(x.label)})),ex:String(q.ex),source:q.sourceTopicId,template:q.templateId,meta:q.mk125});
   }
   renderGrade5();
   return {rows,total:g5AllTopics().length,links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="divisibility_rules_g5"]').length,lesson:String(g5Lesson(id))};
  },{id:ID,repeats:REPEATS});
  assert.equal(out.rows.length,600);assert.equal(out.total,74);assert.equal(out.links,1);
  assert(out.lesson.includes('на 3')&&out.lesson.includes('сумма')&&out.lesson.includes('на 9'));
  const families=new Set(),samples=new Map(),steps=[[],[],[]];
  for(const row of out.rows){
   const ctx=row.level+'/'+row.family+'/'+row.trial,expected=expectation(row),m=row.meta;
   assert(Number.isSafeInteger(expected)&&expected>=0,'Invalid independent answer '+ctx);
   assert(m&&m.id===ID&&m.t===row.level&&m.p===row.family,'Wrong live v125 topic '+ctx);
   assert.equal(expected,m.expected,'Generator math differs from text '+ctx);
   assert.equal(Number(row.answer),expected,'Incorrect visible response '+ctx);
   assert.equal(row.choices.filter(x=>x.key===row.ans).length,1,'Incorrect key count '+ctx);
   assert.equal(new Set(row.choices.map(x=>x.label)).size,row.choices.length,'Duplicate answer labels '+ctx);
   assert(row.ex.includes('Ответ: '+expected+'.'),'Incorrect explanation answer '+ctx);
   assert(!/NaN|undefined|Infinity/.test(row.ex));
   assert(row.template,'No visible family ID '+ctx);
   const slot=row.level+'/'+row.family;
   if(!samples.has(slot))samples.set(slot,new Set());
   samples.get(slot).add(row.text);families.add(row.template);steps[row.level].push(m.steps);
  }
  assert.equal(families.size,15);assert.equal(samples.size,15);
  for(const [slot,items]of samples)assert(items.size>=10,'No genuine variation '+slot+': '+items.size);
  const means=steps.map(arr=>arr.reduce((a,b)=>a+b,0)/arr.length);
  assert(means[0]<means[1]&&means[1]<means[2],'Difficulty does not rise '+means);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_19_PASS '+JSON.stringify({questions:600,families:15,meanSteps:means}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_19_FAIL',e.stack||e);process.exit(1)});
