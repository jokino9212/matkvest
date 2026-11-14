'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const ID='volume';
function read(text,re,ctx){const m=text.match(re);assert(m,'Unparseable visible question '+ctx+': '+text);return m.slice(1).map(Number);}
function calc(q){
 const s=q.text,t=q.level,p=q.family,k=t+'/'+p+'/'+q.trial;
 let a,b,c,d,e,f,v;
 if(t===0){
  if(p===0){[a,b,c]=read(s,/длину (\d+) см, ширину (\d+) см и высоту (\d+) см/,k);return a*b*c;}
  if(p===1){[a]=read(s,/Ребро куба равно (\d+) см/,k);return a**3;}
  if(p===2){[a,b,c]=read(s,/помещается (\d+) рядов по (\d+) кубиков.*Всего (\d+) одинаковых слоёв/,k);return a*b*c;}
  if(p===3){[a,c]=read(s,/Площадь основания коробки (\d+) см², высота (\d+) см/,k);return a*c;}
  [a]=read(s,/Объём равен (\d+) дм³/,k);return a*1000;
 }
 if(t===1){
  if(p===0){[v,a,b]=read(s,/Объём прямоугольного параллелепипеда (\d+) см³\. Длина основания (\d+) см, ширина (\d+) см/,k);assert.equal(v%(a*b),0);return v/(a*b);}
  if(p===1){[v,a,c]=read(s,/Объём параллелепипеда (\d+) см³\. Длина (\d+) см, высота (\d+) см/,k);assert.equal(v%(a*c),0);return v/(a*c);}
  if(p===2){[a,b,c,d]=read(s,/длину (\d+) см и ширину (\d+) см\. Высоты первой (\d+) см, второй (\d+) см/,k);return a*b*(d-c);}
  if(p===3){[a]=read(s,/Переведи (\d+) м³ в кубические дециметры/,k);return a*1000;}
  [a,b,c,d,e,f]=read(s,/Один ящик имеет размеры (\d+)×(\d+)×(\d+) см, второй — (\d+)×(\d+)×(\d+) см/,k);return a*b*c+d*e*f;
 }
 if(p===0){[a,b,c,d,e]=read(s,/Коробка имела размеры (\d+)×(\d+)×(\d+) см\. Длину увеличили на (\d+) см, высоту — на (\d+) см/,k);return (a+d)*b*(c+e)-a*b*c;}
 if(p===1){[a,b,c,d,e,f]=read(s,/Из прямоугольного блока (\d+)×(\d+)×(\d+) см вырезали.*блок размером (\d+)×(\d+)×(\d+) см/,k);assert(d<a&&e<b&&f<c);return a*b*c-d*e*f;}
 if(p===2){[a,b,c,d,e,f]=read(s,/Большой ящик имеет размеры (\d+) дм × (\d+) дм × (\d+) дм.*меньшего блока (\d+) см × (\d+) см × (\d+) см/,k);return a*b*c*1000-d*e*f;}
 if(p===3){[v,a,c,e,d]=read(s,/Объём коробки (\d+) см³, длина (\d+) см, высота (\d+) см\. Ширину увеличили на (\d+) см, а высоту — на (\d+) см/,k);assert.equal(v%(a*c),0);return a*(v/(a*c)+e)*(c+d);}
 [a,b,c,d,e,f]=read(s,/Есть 2 коробки по (\d+)×(\d+)×(\d+) см и 3 коробки по (\d+)×(\d+)×(\d+) см/,k);return 2*a*b*c+3*d*e*f;
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(id=>{
   let seed=2026111424;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<40;trial++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),div=document.createElement('div');div.innerHTML=String(q.text);
    rows.push({level,family,trial,text:div.textContent,answer:String(q.correctLabel),
      choices:q.choices.map(x=>({key:String(x.key),label:String(x.label)})),ans:String(q.ans),ex:String(q.ex),
      source:q.sourceTopicId,template:q.templateId,meta:q.mk126});
   }
   renderGrade5();
   return {rows,topics:g5AllTopics().length,links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="volume"]').length,lesson:String(g5Lesson(id))};
  },ID);
  assert.equal(out.rows.length,600);assert.equal(out.topics,74);assert.equal(out.links,1,'§24 navigation missing');
  assert(out.lesson.includes('V = a · b · c')&&out.lesson.includes('1 дм³')&&out.lesson.includes('1000 см³')&&out.lesson.includes('V = a³'));
  const slotSets=new Map(),families=new Set(),levels=[[],[],[]];
  for(const q of out.rows){
   const ctx=q.level+'/'+q.family+'/'+q.trial,expected=calc(q),m=q.meta;
   assert(Number.isSafeInteger(expected)&&expected>=0,'Bad math '+ctx);
   assert(m&&m.id===ID&&m.t===q.level&&m.p===q.family,'Wrong active generator '+ctx);
   assert.equal(m.expected,expected,'Internal plan mismatches visible condition '+ctx);
   assert.equal(Number(q.answer),expected,'Wrong visible right answer '+ctx);
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'Ambiguous correct option '+ctx);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Duplicate choices '+ctx);
   assert(q.ex.includes('Ответ: '+expected+'.'),'Wrong worked answer '+ctx);
   assert(q.ex.includes(' · ')&&/см³|дм³|кубиков/.test(q.ex),'Missing intermediate multiplication / unit '+ctx);
   assert(!/undefined|NaN|Infinity/.test(q.ex),'Invalid explanation '+ctx);
   assert(q.source===ID&&q.template,'Wrong topic ID '+ctx);
   const slot=q.level+'/'+q.family;
   if(!slotSets.has(slot))slotSets.set(slot,new Set());
   slotSets.get(slot).add(q.text);families.add(q.template);levels[q.level].push(m.steps);
  }
  assert.equal(families.size,15);assert.equal(slotSets.size,15);
  for(const [slot,set]of slotSets)assert(set.size>=10,'No visible diversity '+slot+': '+set.size);
  const means=levels.map(a=>a.reduce((sum,x)=>sum+x,0)/a.length);
  assert(means[0]<means[1]&&means[1]<means[2],'Difficulty not increasing '+means);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_24_PASS '+JSON.stringify({questions:600,families:15,meanSteps:means}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_24_FAIL',e.stack||e);process.exit(1)});
