'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const ID='natural_subtract',TRIALS=40;
const vals=(s,re,ctx)=>{const m=s.match(re);assert(m,'Cannot independently interpret §9 question '+ctx+': '+s);return m.slice(1).map(Number);};
const sum=a=>a.reduce((x,y)=>x+y,0);
function fromText(q){
 const s=q.plain,t=q.level,p=q.family,ctx=t+'/'+p+'/'+q.trial;
 let x;
 if(t===0){
  if(p===0){x=vals(s,/разность: (\d+) − (\d+)/,ctx);return x[0]-x[1];}
  if(p===1){x=vals(s,/равенстве (\d+) − □ = (\d+)/,ctx);return x[0]-x[1];}
  if(p===2){x=vals(s,/вычитая сумму: (\d+) − \((\d+) \+ (\d+)\)/,ctx);return x[0]-x[1]-x[2];}
  if(p===3){x=vals(s,/значение выражения (\d+) − (\d+) − (\d+)/,ctx);return x[0]-x[1]-x[2];}
  if(p===4){x=vals(s,/было (\d+) листов.*забрали (\d+), вечером (\d+)/,ctx);return x[0]-x[1]-x[2];}
 }
 if(t===1){
  if(p===0){x=vals(s,/способом: \((\d+) \+ (\d+)\) − (\d+)/,ctx);assert(x[0]>=x[2]);return x[0]+x[1]-x[2];}
  if(p===1){x=vals(s,/способом: \((\d+) \+ (\d+)\) − (\d+)/,ctx);assert(x[1]>=x[2]);return x[0]+x[1]-x[2];}
  if(p===2){x=vals(s,/Вычисли: (\d+) − \((\d+) \+ (\d+) \+ (\d+)\)/,ctx);assert.equal(x[1]+x[2],100,'Must group one complete hundred');return x[0]-sum(x.slice(1));}
  if(p===3){x=vals(s,/числа x последовательно вычли (\d+) и (\d+) и получили (\d+)/,ctx);return sum(x);}
  if(p===4){x=vals(s,/было (\d+) яблок, во втором (\d+)(?: яблок)?.*взяли (\d+), из второго (\d+)/,ctx);return Math.abs(x[0]-x[2]-(x[1]-x[3]));}
 }
 if(t===2){
  if(p===0){x=vals(s,/группировкой: (\d+) − \((\d+) \+ (\d+)\) − \((\d+) \+ (\d+)\)/,ctx);assert.equal(x[1]+x[2],100);assert.equal(x[3]+x[4],100);return x[0]-200;}
  if(p===1){x=vals(s,/суммы: \((\d+) \+ (\d+) \+ (\d+)\) − \((\d+) \+ (\d+)\)/,ctx);assert(x[0]>=x[3]&&x[1]>=x[4],'Subtracted terms must fit their individual summands');return sum(x.slice(0,3))-sum(x.slice(3));}
  if(p===2){x=vals(s,/уменьшаемое x: x − \((\d+) \+ (\d+)\) − \((\d+) \+ (\d+)\) = (\d+)/,ctx);assert.equal(x[0]+x[1],100);assert.equal(x[2]+x[3],100);return sum(x);}
  if(p===3){x=vals(s,/было (\d+) книг.*выдали (\d+), во второй (\d+), в третий (\d+).*вернули (\d+) книг/,ctx);return x[0]-x[1]-x[2]-x[3]+x[4];}
  if(p===4){x=vals(s,/было (\d+) и (\d+) коробок.*забрали (\d+), из второго (\d+)/,ctx);assert(x[0]>=x[2]&&x[1]>=x[3]);return sum(x.slice(2));}
 }
 throw Error('§9 unknown family '+ctx);
}
function exact(node){
 assert(Array.isArray(node),'Missing source arithmetic plan');
 const [op,...args]=node,E=exact;
 if(op==='v'){assert(Number.isSafeInteger(args[0]));return BigInt(args[0]);}
 if(op==='add')return args.reduce((a,x)=>a+E(x),0n);
 if(op==='sub')return E(args[0])-E(args[1]);
 if(op==='mul')return E(args[0])*E(args[1]);
 if(op==='div'){const a=E(args[0]),b=E(args[1]);assert(b!==0n&&a%b===0n);return a/b;}
 if(op==='abs'){const a=E(args[0]);return a<0n?-a:a;}
 throw Error('Unrecognized exact math operation '+op);
}
function allNonnegative(node,underAbs=false){
 if(!Array.isArray(node))return;
 const [op,...args]=node;
 args.filter(Array.isArray).forEach(child=>allNonnegative(child,underAbs||op==='abs'));
 if(op==='sub'&&!underAbs)assert(exact(node)>=0n,'Negative subtraction sub-expression in natural-number task '+JSON.stringify(node));
}
(async()=>{
 const navigation=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
 assert(navigation.includes("[9,'Действие вычитания. Свойства вычитания',['natural_subtract']]"),'Strict §9 textbook navigation missing');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(({id,trials})=>{
   let seed=2026111309;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const questions=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<trials;trial++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),element=document.createElement('div');element.innerHTML=String(q.text);
    questions.push({level,family,trial,plain:element.textContent,answer:String(q.ans),choices:q.choices.map(c=>({key:String(c.key),label:String(c.label)})),
      correctLabel:String(q.correctLabel),ex:String(q.ex),template:q.templateId,meta:q.mk123,source:q.sourceTopicId});
   }
   renderGrade5();
   return {topicCount:g5AllTopics().length,lesson:String(g5Lesson(id)),links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="natural_subtract"]').length,questions};
  },{id:ID,trials:TRIALS});
  assert.equal(result.topicCount,74,'Grade 5 74 topics must not change');
  assert.equal(result.links,1,'§9 should be immediately navigable from textbook');
  assert(result.lesson.includes('Вычитание суммы')||result.lesson.includes('вычитания суммы'),'§9 lesson must teach subtraction of a sum');
  assert(result.lesson.includes('суммы')&&result.lesson.includes('уменьшаемое'),'§9 lesson must teach components and grouping');
  assert.equal(result.questions.length,600,'15 × 40 actual Grade 5 generated examples');
  const slots=new Map(),variations=new Map(),steps=[[],[],[]],groups={subSum:0,fromSum:0,inverse:0,roundHundreds:0,stories:0,absolute:0};
  for(const q of result.questions){
   const ctx=q.level+'/'+q.family+'/'+q.trial,m=q.meta,expected=fromText(q);
   assert(m&&m.id===ID&&m.t===q.level&&m.p===q.family,'Shadowed or incorrect generator in final UI '+ctx);
   assert.equal(q.source,ID,'Question topic changed '+ctx);
   assert.equal(q.choices.filter(c=>c.key===q.answer).length,1,'No unique accepted answer '+ctx);
   assert.equal(new Set(q.choices.map(c=>c.label)).size,q.choices.length,'Duplicate displayed options '+ctx);
   assert(!/undefined|NaN|Infinity/.test(q.plain+q.ex),'Malformed student text '+ctx);
   assert(Number.isSafeInteger(expected)&&expected>=0,'Non-natural answer '+ctx);
   assert.equal(exact(m.plan),BigInt(expected),'Independent BigInt plan and visible text mismatch '+ctx);
   allNonnegative(m.plan);
   assert.equal(m.expected,expected,'Generator stored answer differs from student problem '+ctx);
   assert.equal(q.correctLabel,String(expected),'Displayed right answer differs from independently solved condition '+ctx);
   assert.equal(q.answer,String(expected),'Accepted answer differs from independently solved condition '+ctx);
   assert(q.ex.includes('Ответ: '+expected),'Solution missing correct final answer '+ctx);
   if(q.level===0&&[2,3,4].includes(q.family)||q.level===1&&q.family===2||q.level===2&&q.family===0)groups.subSum++;
   if(q.level===1&&[0,1].includes(q.family)||q.level===2&&q.family===1)groups.fromSum++;
   if(q.level===0&&q.family===1||q.level===1&&q.family===3||q.level===2&&q.family===2)groups.inverse++;
   if(q.level===1&&q.family===2||q.level===2&&[0,2].includes(q.family)){assert(/100|200/.test(q.ex),'Solution hides property of round hundreds '+ctx);groups.roundHundreds++;}
   if(q.level===0&&q.family===4||q.level===2&&[3,4].includes(q.family))groups.stories++;
   if(q.level===1&&q.family===4){assert(q.ex.includes('положительная разность')&&q.ex.includes('|'),'Incorrect abs-distance explanation '+ctx);groups.absolute++;}
   steps[q.level].push(m.steps);
   const slot=q.level+'/'+q.family;
   if(!slots.has(slot))slots.set(slot,q.template);
   else assert.equal(q.template,slots.get(slot),'Family type not stable across examples '+ctx);
   const set=variations.get(slot)||new Set();set.add(q.plain);variations.set(slot,set);
  }
  assert.equal(slots.size,15,'Exactly 15 distinct learning family slots required');
  assert.equal(new Set(slots.values()).size,15,'Family template IDs must not collide');
  for(const [slot,set]of variations)assert(set.size>=10,'Too little variation '+slot+' '+set.size);
  const means=steps.map(a=>a.reduce((sum,x)=>sum+x,0)/a.length);
  assert(means[0]<means[1]&&means[1]<means[2],'Difficulty does not increase '+means);
  assert(groups.subSum>=200&&groups.fromSum>=120&&groups.inverse>=120&&groups.roundHundreds===120,'§9 methods are not meaningfully varied '+JSON.stringify(groups));
  assert.equal(groups.absolute,40,'Abs problem missing');
  assert.deepEqual(errors,[],'Uncaught browser error');
  console.log('G5_SEQUENTIAL_PARAGRAPH_09_PASS '+JSON.stringify({paragraph:9,questions:result.questions.length,families:slots.size,meanSteps:means,methodChecks:groups,links:result.links}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_09_FAIL',e.stack||e);process.exit(1)});
