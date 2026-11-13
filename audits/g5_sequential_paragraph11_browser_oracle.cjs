'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const TOPIC='equations',REPEAT=40,EPS=1e-7;
function getEquation(s,ctx){
 const word=s.match(/^К некоторому числу x прибавили (\d+), затем умножили полученную сумму на (\d+) и вычли (\d+)\. Получили (\d+)\. Найди исходное число x\.$/);
 if(word)return {left:'(x + '+word[1]+') · '+word[2]+' − '+word[3],right:word[4],word:true};
 const match=s.match(/(?:Реши уравнение|Найди x:)\s*([0-9x+\-−·(): ]+\s*=\s*[0-9x+\-−·(): ]+)\s*\./);
 assert(match,'No actual equation or recognized word story '+ctx+': '+s);
 const pair=match[1].split('=');
 assert.equal(pair.length,2,'Not exactly one equality '+ctx);
 return {left:pair[0].trim(),right:pair[1].trim(),word:false};
}
function calc(src,x){
 const raw=src.replace(/\s+/g,'').replace(/−/g,'-').replace(/·/g,'*').replace(/:/g,'/');
 const chunks=raw.match(/\d+|x|[()+\-*/]/g);
 assert(chunks&&chunks.join('')===raw,'Cannot tokenize actual equation: '+src);
 const tokens=[];
 for(const chunk of chunks){
  const prev=tokens.at(-1);
  if(prev!==undefined&&(/^\d+$/.test(prev)||prev==='x'||prev===')')&&(chunk==='x'||chunk==='('))tokens.push('*');
  tokens.push(chunk);
 }
 let i=0;
 function atom(){
  const t=tokens[i++];
  if(t==='('){const z=expr();assert.equal(tokens[i++],')','Mismatched parentheses '+src);return z;}
  if(t==='-')return -atom();
  if(t==='x')return x;
  if(/^\d+$/.test(t||''))return Number(t);
  throw Error('Cannot evaluate equation token '+t+' in '+src);
 }
 function term(){
  let z=atom();
  while(tokens[i]==='*'||tokens[i]==='/'){
   const op=tokens[i++],rhs=atom();assert(rhs!==0||op!=='/','Division by zero in real equation');
   z=op==='*'?z*rhs:z/rhs;
  }
  return z;
 }
 function expr(){
  let z=term();
  while(tokens[i]==='+'||tokens[i]==='-'){
   const op=tokens[i++],rhs=term();
   z=op==='+'?z+rhs:z-rhs;
  }
  return z;
 }
 const result=expr();
 assert.equal(i,tokens.length,'Unparsed actual equation '+src);
 assert(Number.isFinite(result),'Non-finite equation value '+src);
 return result;
}
function exact(node){
 assert(Array.isArray(node),'No arithmetic plan');
 const [op,...args]=node,E=exact;
 if(op==='v')return BigInt(args[0]);
 if(op==='add')return args.reduce((a,n)=>a+E(n),0n);
 if(op==='sub')return E(args[0])-E(args[1]);
 if(op==='mul')return E(args[0])*E(args[1]);
 if(op==='div'){const a=E(args[0]),b=E(args[1]);assert(b!==0n&&a%b===0n,'Nonintegral inverse action');return a/b;}
 if(op==='abs'){const v=E(args[0]);return v<0n?-v:v;}
 if(op==='pow'){const a=E(args[0]),b=E(args[1]);assert(b>=0n&&b<=12n);return a**b;}
 throw Error('Unrecognized plan operation '+op);
}
function checkPlan(node,ctx){
 if(!Array.isArray(node))return;
 const [op,...args]=node;
 args.filter(Array.isArray).forEach(ch=>checkPlan(ch,ctx));
 if(op==='sub')assert(exact(node)>=0n,'Negative natural-number inverse substep '+ctx);
}
(async()=>{
 const nav=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
 assert(nav.includes("[11,'Уравнение',['equations']]"),'§11 must remain the real textbook destination');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(({id,repeats})=>{
   let seed=20261114011;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<repeats;trial++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),div=document.createElement('div');div.innerHTML=String(q.text);
    rows.push({level,family,trial,prompt:div.textContent,ans:String(q.ans),
      correctLabel:String(q.correctLabel),ex:String(q.ex),
      choices:q.choices.map(c=>({label:String(c.label),key:String(c.key)})),
      template:q.templateId,meta:q.mk126,source:q.sourceTopicId});
   }
   renderGrade5();
   const links=[...document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="equations"]')];
   return {rows,count:g5AllTopics().length,links:links.length,lesson:String(g5Lesson(id))};
  },{id:TOPIC,repeats:REPEAT});
  assert.equal(data.count,74,'All 74 Grade 5 topic IDs must survive');
  assert.equal(data.links,1,'One direct §11 textbook link required');
  assert(data.lesson.includes('Корень уравнения')&&/проверк/i.test(data.lesson)&&data.lesson.includes('3(x + 4)'),'Teaching must define the root, its meaning and substitution checking');
  assert.equal(data.rows.length,600,'3 levels × 5 families × 40 real browser questions');
  const slots=new Map(),variants=new Map(),steps=[[],[],[]],verified={substitution:0,uniqueNaturalRoots:0,inversePlans:0,wordModels:0,intermediates:0};
  for(const q of data.rows){
   const ctx=q.level+'/'+q.family+'/'+q.trial,m=q.meta;
   assert(m&&m.id===TOPIC&&m.t===q.level&&m.p===q.family,'Wrong final active generator, must use v126 '+ctx);
   assert.equal(q.source,TOPIC,'Student topic ID changed '+ctx);
   assert.equal(q.choices.filter(c=>c.key===q.ans).length,1,'Wrong correct-choice count '+ctx);
   assert.equal(new Set(q.choices.map(c=>c.label)).size,q.choices.length,'Repeated student answer choices '+ctx);
   assert(!/undefined|NaN|Infinity/.test(q.prompt+q.ex),'Malformed generated text '+ctx);
   const root=Number(q.correctLabel),equation=getEquation(q.prompt,ctx);
   assert(Number.isSafeInteger(root)&&root>0,'Solution is not a natural number '+ctx);
   assert.equal(q.ans,String(root),'Correct option key does not match real root '+ctx);
   assert.equal(m.expected,root,'Generator expected answer differs from accepted root '+ctx);
   assert.equal(exact(m.plan),BigInt(root),'BigInt inverse calculation mismatch '+ctx);
   checkPlan(m.plan,ctx);verified.inversePlans++;
   const delta=n=>calc(equation.left,n)-calc(equation.right,n);
   const slope=delta(1)-delta(0);
   assert(Number.isFinite(slope)&&Math.abs(slope)>EPS,'Unsolvable or non-unique equation '+ctx);
   const independentRoot=-delta(0)/slope;
   assert(Math.abs(independentRoot-root)<EPS,'Independent root from actual equation differs '+ctx+' got '+independentRoot+' vs '+root);
   assert(Math.abs(delta(root))<EPS,'Root fails equation substitution '+ctx);
   for(const wrong of [root-2,root-1,root+1,root+2]){
    if(wrong<=0)continue;
    assert(Math.abs(delta(wrong))>EPS,'Equation has a second nearby natural root '+ctx);
   }
   verified.uniqueNaturalRoots++;
   const proof=q.ex.match(/Проверка:\s*([^.!?]+?)\s*=\s*(\d+)\./);
   assert(proof,'Detailed solution lacks explicit concrete substitution check '+ctx+': '+q.ex);
   assert(!/\bx\b/.test(proof[1]),'Substitution proof still contains unknown x '+ctx);
   assert(Math.abs(calc(proof[1],root)-Number(proof[2]))<EPS,'Solution proof has false equality '+ctx);
   assert(Math.abs(calc(proof[1],root)-calc(equation.right,root))<EPS,'Proof does not evaluate the actual original equation '+ctx);
   verified.substitution++;
   assert(q.ex.includes('Ответ: '+root+'.'),'Solution missing final accepted root '+ctx);
   if(q.level===2&&q.family===2){
    assert(equation.word&&q.ex.includes('Составим уравнение'),'Text problem must translate actual words into an equation '+ctx);
    verified.wordModels++;
   }
   if(q.level>0){
    assert(q.ex.match(/(?:Затем|Сначала|Разделим|Вернём|Вычтем|Прибавим|Поэтому|Составим|Неизвестное)/),
      'Detailed reasoning is missing multiple inverse steps '+ctx);
    assert((q.ex.match(/=/g)||[]).length>=q.level+2,'Missing actual intermediate equalities '+ctx);
    verified.intermediates++;
   }
   steps[q.level].push(m.steps);
   const slot=q.level+'/'+q.family;
   if(!slots.has(slot))slots.set(slot,q.template);
   else assert.equal(slots.get(slot),q.template,'Unstable family identity '+ctx);
   const set=variants.get(slot)||new Set();set.add(q.prompt);variants.set(slot,set);
  }
  assert.equal(slots.size,15,'§11 must contain 15 cognitive families');
  assert.equal(new Set(slots.values()).size,15,'Family ID collisions');
  for(const [slot,set]of variants)assert(set.size>=10,'Not enough actual problem variation in '+slot+': '+set.size);
  const meanSteps=steps.map(a=>a.reduce((sum,n)=>sum+n,0)/a.length);
  assert(meanSteps[0]<meanSteps[1]&&meanSteps[1]<meanSteps[2],'No growing complexity of equations '+meanSteps);
  assert.equal(verified.substitution,600,'Proof missing on at least one problem');
  assert.equal(verified.wordModels,40,'Missing dedicated equation-from-story family');
  assert.equal(verified.intermediates,400,'Missing multistep solution verifications');
  assert.deepEqual(errors,[],'Browser uncaught runtime error');
  console.log('G5_SEQUENTIAL_PARAGRAPH_11_PASS '+JSON.stringify({paragraph:11,questions:600,families:15,meanSteps,checks:verified,links:data.links}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_11_FAIL',e.stack||e);process.exit(1)});
