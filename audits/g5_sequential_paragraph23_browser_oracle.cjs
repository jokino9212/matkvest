'use strict';
// §23 independent geometry oracle: derive every answer only from the shown learner text.
// 600 actual problems, 15 cognitive families, 3 increasing levels, SVG structure/nets.
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const ID='cuboid';
function read(s,re,ctx){
 const m=s.match(re);assert(m,'Unparseable student condition '+ctx+': '+s.slice(0,220));
 return m.slice(1).map(Number);
}
function answer(q){
 const s=q.text,t=q.level,p=q.family,ctx=t+'/'+p+'/'+q.trial;
 let a,b,c,d,S,P,v;
 if(t===0){
  if(p===0){[a]=read(s,/В школьном кабинете (\d+) отдельных макетов/,ctx);return 6*a;}
  if(p===1){[a]=read(s,/На выставке (\d+) отдельных прямоугольных/,ctx);return 8*a;}
  if(p===2){[a,b]=read(s,/длину (\d+) см и ширину (\d+) см/,ctx);return a*b;}
  if(p===3){[a,b]=read(s,/У (\d+) отдельных коробок.*рёбер длины (\d+) см/,ctx);return 4*a;}
  [a,b]=read(s,/размером (\d+) × (\d+) см каждая/,ctx);return 2*a*b;
 }
 if(t===1){
  if(p===0){[a,b,c]=read(s,/измерения: (\d+) см, (\d+) см и (\d+) см/,ctx);return 4*(a+b+c);}
  if(p===1){[a,b,c]=read(s,/измерения (\d+) × (\d+) × (\d+) см/,ctx);return a*b+a*c+b*c;}
  if(p===2){[a,b,c]=read(s,/размером (\d+) × (\d+) × (\d+) см состоит/,ctx);return 2*(a*b+a*c+b*c);}
  if(p===3){[a,b]=read(s,/со сторонами (\d+) см и (\d+) см/,ctx);return 2*(a+b);}
  [a,b]=read(s,/На верхней и нижней гранях коробки длина (\d+) см, ширина (\d+) см/,ctx);return 4*(a+b);
 }
 if(p===0){[P,a,b]=read(s,/всех 12 рёбер прямоугольного параллелепипеда (\d+) см\. Длина (\d+) см, ширина (\d+) см/,ctx);assert.equal(P%4,0);return P/4-a-b;}
 if(p===1){[S,a,b]=read(s,/всех шести граней закрытой коробки (\d+) см²\. Длина (\d+) см, ширина (\d+) см/,ctx);assert.equal(S%2,0);v=S/2-a*b;assert.equal(v%(a+b),0);return v/(a+b);}
 if(p===2){[a,b,c,d]=read(s,/размеры (\d+) × (\d+) × (\d+) см\. Убрали верхнюю грань (\d+) ×/,ctx);assert.equal(a,d);return 2*(a*b+a*c+b*c)-a*b;}
 if(p===3){[a,b,c,d,v]=read(s,/коробки (\d+) × (\d+) × (\d+) см\. Длину (\d+) см увеличили на (\d+) см/,ctx);assert.equal(a,d);return 2*v*(b+c);}
 [a,b,c,d,v]=read(s,/размером (\d+) × (\d+) × (\d+) см склеили гранями (\d+) × (\d+) см/,ctx);
 assert.equal(a,d);assert.equal(b,v);return 4*(a*b+a*c+b*c)-2*a*b;
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(id=>{
   let seed=2026111423;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<40;trial++){
    qid='g5:'+id;
    blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),div=document.createElement('div');div.innerHTML=String(q.text);
    rows.push({level,family,trial,text:div.textContent,html:String(q.text),answer:q.correctLabel,
     choices:q.choices.map(x=>({key:String(x.key),label:String(x.label)})),
     ans:String(q.ans),ex:String(q.ex),source:q.sourceTopicId,template:q.templateId,
     meta:q.mk5Pedagogy,figure:div.querySelectorAll('svg[role="img"]').length,
     cuboidVerts:div.querySelectorAll('.mk-g5-cuboid-diagram circle').length,
     cuboidEdges:div.querySelectorAll('.mk-g5-cuboid-diagram line').length,
     netFaces:div.querySelectorAll('.mk-g5-cuboid-net rect').length});
   }
   renderGrade5();
   return {rows,topics:g5AllTopics().length,lesson:String(g5Lesson(id)),
    links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="cuboid"]').length};
  },ID);
  assert.equal(out.rows.length,600);assert.equal(out.topics,74);
  assert.equal(out.links,1,'Missing correct textbook navigation');
  assert(out.lesson.includes('12 рёбра')||out.lesson.includes('двенадцатью рёбрами'));
  assert(out.lesson.includes('развёртка')||out.lesson.includes('Развёртка'));
  assert(out.lesson.includes('2(ab + ac + bc)'));
  const slots=new Map(),templates=new Set(),steps=[[],[],[]],models={cuboid:0,net:0};
  for(const q of out.rows){
   const ctx=q.level+'/'+q.family+'/'+q.trial,value=answer(q),m=q.meta;
   assert(Number.isSafeInteger(value)&&value>0,'Bad independent geometry calculation '+ctx);
   assert(m&&m.id===ID&&m.stage===q.level&&m.family===q.family,'Wrong live §23 generator '+ctx);
   assert.equal(m.expected,value,'Invalid live generated answer '+ctx);
   assert.equal(Number(q.answer),value,'Incorrect student-visible answer '+ctx);
   assert(q.template&&q.source===ID,'Incorrect source/template attribution '+ctx);
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'Not exactly one right key '+ctx);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Duplicate options '+ctx);
   assert(q.ex.includes('Ответ: '+value+'.'),'Missing numbered final explanation '+ctx);
   assert(!/undefined|Infinity|NaN/.test(q.ex),'Invalid explanation '+ctx);
   assert(!/кубик|кубических сантиметр|объём|см³|V =/i.test(q.text),'§24 volume leaked into §23 '+ctx);
   assert.equal(q.figure,1,'Missing or duplicate SVG drawing '+ctx);
   if(q.netFaces){
    assert.equal(q.netFaces,6,'Bad cuboid net '+ctx);models.net++;
   }else{
    assert.equal(q.cuboidVerts,8,'Must show eight vertices '+ctx);
    assert.equal(q.cuboidEdges,12,'Must draw twelve edges '+ctx);models.cuboid++;
   }
   const slot=q.level+'/'+q.family;
   if(!slots.has(slot))slots.set(slot,new Set());
   slots.get(slot).add(q.text);templates.add(q.template);steps[q.level].push(m.steps);
  }
  assert.equal(templates.size,15);assert.equal(slots.size,15);
  for(const [slot,questions]of slots)assert(questions.size>=10,'Insufficient real variation '+slot+' '+questions.size);
  const means=steps.map(list=>list.reduce((a,b)=>a+b,0)/list.length);
  assert(means[0]<means[1]&&means[1]<means[2],'Difficulty does not grow '+means);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_23_PASS '+JSON.stringify({
   questions:600,families:15,minimumVariants:Math.min(...[...slots.values()].map(x=>x.size)),
   difficulty:means,figures:models,topics:out.topics,volumeLeaks:0}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_23_FAIL',e.stack||e);process.exit(1)});
