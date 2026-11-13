'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const ID='division_remainder',REPEATS=40;
const parse=(s,re,ctx)=>{const m=s.match(re);assert(m,'Cannot independently interpret learner-visible task '+ctx+': '+s);return m.slice(1).map(Number)};
function divided(a,b,ctx){
 assert(Number.isSafeInteger(a)&&Number.isSafeInteger(b)&&a>=0&&b>0,'Invalid dividend or zero divisor '+ctx+': '+a+' / '+b);
 const q=Math.floor(a/b),r=a%b;assert(a===b*q+r&&r>=0&&r<b,'Remainder invariant broken '+ctx);
 return {q,r,b,a};
}
function expectedFromLearner(row){
 const s=row.text,t=row.level,p=row.family,ctx=t+'/'+p+'/'+row.trial;
 let a,b,q,r,v;
 if(t===0){
  if(p===0){[a,b]=parse(s,/Найди остаток от деления (\d+) на (\d+)/,ctx);return divided(a,b,ctx).r;}
  if(p===1){[a,b]=parse(s,/Какое неполное частное при делении (\d+) на (\d+)/,ctx);return divided(a,b,ctx).q;}
  if(p===2){[b,q,r]=parse(s,/Найди делимое, если делитель (\d+), неполное частное (\d+) и остаток (\d+)/,ctx);assert(r>=0&&r<b,'Impossible published remainder');return b*q+r;}
  if(p===3){[b]=parse(s,/Какой наибольший возможный остаток при делении на (\d+)/,ctx);assert(b>0);return b-1;}
  if(p===4){[a,b]=parse(s,/Разложили (\d+) пуговиц в пакеты по (\d+) штук/,ctx);return divided(a,b,ctx).r;}
 }
 if(t===1){
  if(p===0){[a,v,b]=parse(s,/К (\d+) прибавили (\d+) и разделили сумму на (\d+).*полных групп/,ctx);return divided(a+v,b,ctx).q;}
  if(p===1){[a,b]=parse(s,/Сколько минимум прибавить к (\d+), чтобы число делилось на (\d+) без остатка/,ctx);const {r}=divided(a,b,ctx);return r?b-r:0;}
  if(p===2){[a,r,v,b]=parse(s,/Из (\d+) жетонов убрали (\d+) жетонов и ещё (\d+) полных групп по (\d+) жетонов/,ctx);assert.equal(divided(a,b,ctx).r,r,'Incorrect remainder already stated to student');return divided(a-r-v*b,b,ctx).q;}
  if(p===3){[a,v,b]=parse(s,/Сложили (\d+) и (\d+) предметов.*остаток.*на (\d+)/,ctx);return divided(a+v,b,ctx).r;}
  if(p===4){[a,q,b,r]=parse(s,/К (\d+) прибавили несколько предметов так, чтобы получить (\d+) полных групп по (\d+) и остаток (\d+)/,ctx);assert(r>=0&&r<b,'Impossible requested remainder');const to=b*q+r;assert(to>a,'Task asks to add but target is not bigger');return to-a;}
 }
 if(t===2){
  if(p===0){[a,v,b]=parse(s,/В одной партии (\d+) предметов, во второй (\d+).*упаковок по (\d+)/,ctx);return divided(a+v,b,ctx).q;}
  if(p===1){[a,v,b]=parse(s,/Привезли (\d+) и (\d+) карандашей.*по (\d+) в коробку/,ctx);const {q,r}=divided(a+v,b,ctx);return q+(r>0?1:0);}
  if(p===2){
   [a,b,r,v]=parse(s,/Число (\d+) при делении на (\d+) даёт остаток (\d+).*остаток стал (\d+)/,ctx);
   assert.equal(divided(a,b,ctx).r,r,'Problem itself lies about its initial remainder');
   assert(v>=0&&v<b,'Target remainder invalid');
   const minimal=(v-r+b)%b||b;assert.equal(divided(a+minimal,b,ctx).r,v,'Added amount does not give required remainder');
   for(let k=1;k<minimal;k++)assert.notEqual(divided(a+k,b,ctx).r,v,'Earlier valid positive increment '+ctx);
   return minimal;
  }
  if(p===3){[a,v,r,b]=parse(s,/Было (\d+) предметов, добавили (\d+), затем забрали (\d+).*группы по (\d+)/,ctx);assert(a+v>=r);return divided(a+v-r,b,ctx).r;}
  if(p===4){
   [a,b,r,v,q]=parse(s,/После раскладывания (\d+) шариков по (\d+) в коробку осталось (\d+) шариков\. Их объединили с ещё (\d+) шариками и разложили по (\d+) в пакет/,ctx);
   assert.equal(divided(a,b,ctx).r,r,'First packaging remainder shown incorrectly');
   return divided(r+v,q,ctx).r;
  }
 }
 throw Error('No §14 student-text oracle for '+ctx);
}
function bigIntPlan(tree){
 assert(Array.isArray(tree),'Expected an arithmetic plan tree');
 const [op,...v]=tree,E=bigIntPlan;
 if(op==='v'){assert(Number.isSafeInteger(v[0]));return BigInt(v[0])}
 if(op==='add')return v.reduce((sum,x)=>sum+E(x),0n);
 if(op==='sub')return E(v[0])-E(v[1]);
 if(op==='mul')return E(v[0])*E(v[1]);
 if(op==='div'){
  const a=E(v[0]),b=E(v[1]);
  assert(b>0n&&a>=0n&&a%b===0n,'Invalid noninteger division in source operation plan '+JSON.stringify(tree));return a/b;
 }
 if(op==='mod'){
  const a=E(v[0]),b=E(v[1]);
  assert(a>=0n&&b>0n,'Division by zero or negative modulus in source plan '+JSON.stringify(tree));
  const r=a%b;assert(0n<=r&&r<b);return r;
 }
 if(op==='abs'){const a=E(v[0]);return a>=0n?a:-a;}
 throw Error('Unknown exact operation '+op);
}
function checkNatural(tree){
 if(!Array.isArray(tree))return;
 const [op,...v]=tree;for(const sub of v.filter(Array.isArray))checkNatural(sub);
 if(op==='sub')assert(bigIntPlan(tree)>=0n,'Invalid negative intermediate in §14 student arithmetic');
}
function verifyExplanations(row){
 const ctx=row.level+'/'+row.family+'/'+row.trial;
 assert(row.ex.includes('Ответ: '+row.expected+'.'),'Explanatory answer does not match question '+ctx);
 assert(!/NaN|undefined|Infinity/.test(row.ex),'Broken numeric explanation '+ctx);
 const proof=/(\d+)\s*=\s*(\d+)\s*·\s*(\d+)\s*\+\s*(\d+)/g;
 const proofs=[...row.ex.matchAll(proof)];
 for(const m of proofs){
  const [a,b,q,r]=m.slice(1).map(Number);
  assert(a===b*q+r&&b>0&&r>=0&&r<b,'FALSE displayed remainder identity in explanatory text '+ctx+' '+m[0]);
 }
 // The "largest remainder" and "rebuild dividend" slots are formula tasks;
 // all others must show at least one concrete a=b*q+r proof.
 if(!(row.level===0&&[2,3].includes(row.family))){
  assert(proofs.length>=1,'No concrete divisor×quotient+remainder proof in '+ctx+': '+row.ex);
 }
 const range=/0\s*≤\s*(\d+)\s*<\s*(\d+)/g;
 for(const m of row.ex.matchAll(range)){const r=Number(m[1]),b=Number(m[2]);assert(r>=0&&b>0&&r<b,'Wrong explicitly printed remainder bound '+ctx);}
 return proofs.length;
}
(async()=>{
 const nav=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
 assert(nav.includes("[14,'Деление с остатком',['division_remainder']]"),'§14 Vilenkin numbering changed');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(({topic,repeats})=>{
   let seed=2026111414;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<repeats;trial++){
    qid='g5:'+topic;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(topic),root=document.createElement('div');root.innerHTML=String(q.text);
    rows.push({level,family,trial,text:root.textContent,ex:String(q.ex),ans:String(q.ans),
      choices:q.choices.map(x=>({key:String(x.key),label:String(x.label)})),
      correctLabel:String(q.correctLabel),meta:q.mk124,source:q.sourceTopicId,template:q.templateId});
   }
   renderGrade5();
   return {rows,topics:g5AllTopics().length,lesson:String(g5Lesson(topic)),links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="division_remainder"]').length};
  },{topic:ID,repeats:REPEATS});
  assert.equal(out.topics,74,'Keep all 74 existing Grade 5 topics');
  assert.equal(out.links,1,'Missing or duplicated §14 direct textbook link');
  assert(out.lesson.includes('0 ≤ r < b')&&out.lesson.includes('делитель · неполное частное + остаток')&&out.lesson.includes('последнюю неполную коробку'),'Student theory must explain arithmetic invariant and full-versus-required boxes');
  assert.equal(out.rows.length,600,'Must generate 3 × 5 × 40 real questions');
  const templates=new Map(),variety=new Map(),steps=[[],[],[]],coverage={zeroRemainders:0,quotientVersusRequiredBoxes:0,largestRemainder:0,smallestPositiveAddition:0,twoBatchMerges:0,secondPacking:0,realNumericProofs:0};
  for(const row of out.rows){
   const ctx=row.level+'/'+row.family+'/'+row.trial,m=row.meta,expected=expectedFromLearner(row);
   row.expected=expected;
   assert(m&&m.id===ID&&m.t===row.level&&m.p===row.family,'Shadowed donor rather than active v124 '+ctx);
   assert.equal(row.source,ID,'Topic ID and learner progress changed '+ctx);
   assert(Number.isSafeInteger(expected)&&expected>=0,'Non-natural answer '+ctx);
   assert.equal(row.choices.filter(x=>x.key===row.ans).length,1,'No unique correct answer choice '+ctx);
   assert.equal(new Set(row.choices.map(x=>x.label)).size,row.choices.length,'Duplicate answer values visible '+ctx);
   assert.equal(row.ans,String(expected),'Student accepted answer differs from actual problem '+ctx);
   assert.equal(row.correctLabel,String(expected),'Correct visible choice differs from math '+ctx);
   assert.equal(m.expected,expected,'Generator metadata does not match text '+ctx);
   assert.equal(bigIntPlan(m.plan),BigInt(expected),'Independent BigInt expression plan does not match visible text '+ctx);
   checkNatural(m.plan);
   coverage.realNumericProofs+=verifyExplanations(row);
   if(row.level===0&&row.family===3)coverage.largestRemainder++;
   if(row.level===2&&row.family===1)coverage.quotientVersusRequiredBoxes++;
   if(row.level===2&&row.family===2)coverage.smallestPositiveAddition++;
   if(row.level===1&&row.family===3||row.level===2&&[0,1].includes(row.family))coverage.twoBatchMerges++;
   if(row.level===2&&row.family===4)coverage.secondPacking++;
   if([1,3,4].includes(row.family)||row.level===2){
    if(/остаток 0|остаток равен 0|остаток 0\b/.test(row.ex)||/ \+ 0(?:\.|,|$)/.test(row.ex))coverage.zeroRemainders++;
   }
   const slot=row.level+'/'+row.family;steps[row.level].push(m.steps);
   if(!templates.has(slot))templates.set(slot,row.template);
   else assert.equal(templates.get(slot),row.template,'Template family identity differs '+ctx);
   const seen=variety.get(slot)||new Set();seen.add(row.text);variety.set(slot,seen);
  }
  assert.equal(templates.size,15,'Need 15 independent cognitive families');
  assert.equal(new Set(templates.values()).size,15,'Family IDs duplicated across level/family slots');
  for(const [slot,seen]of variety)assert(seen.size>=10,'Insufficient REAL numerical variation at slot '+slot+': '+seen.size);
  const means=steps.map(a=>a.reduce((sum,v)=>sum+v,0)/a.length);
  assert(means[0]<means[1]&&means[1]<means[2],'Stage difficulty does not increase '+means);
  assert(coverage.zeroRemainders>0,'No examples with remainder zero');
  assert.equal(coverage.quotientVersusRequiredBoxes,40);
  assert.equal(coverage.largestRemainder,40);
  assert.equal(coverage.smallestPositiveAddition,40);
  assert.equal(coverage.twoBatchMerges,120);
  assert.equal(coverage.secondPacking,40);
  assert(coverage.realNumericProofs>=520,'Too few actual numeric remainder identities explained');
  assert.deepEqual(errors,[],'Uncaught browser JavaScript errors');
  console.log('G5_SEQUENTIAL_PARAGRAPH_14_PASS '+JSON.stringify({paragraph:14,questions:600,families:templates.size,meanSteps:means,coverage,links:out.links}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_14_FAIL',e.stack||e);process.exit(1)});
