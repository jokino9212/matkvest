'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const ID='area_rectangle';
function read(text,pattern,ctx){
 const match=text.match(pattern);
 assert(match,'Cannot parse visible student question '+ctx+': '+text);
 return match.slice(1).map(Number);
}
function correct(q){
 const l=q.level,p=q.family,s=q.text,ctx=l+'/'+p+'/'+q.trial;
 let a,b,c,e,area;
 if(l===0){
  if(p===0){[a,b]=read(s,/длину (\d+) см и ширину (\d+) см/,ctx);return a*b;}
  if(p===1){[area,b]=read(s,/Площадь прямоугольника (\d+) см²\. Ширина (\d+) см/,ctx);assert.equal(area%b,0);return area/b;}
  if(p===2){[a]=read(s,/Сторона квадрата (\d+) см/,ctx);return a*a;}
  if(p===3){const all=read(s,/прямоугольников: (\d+)×(\d+) см и (\d+)×(\d+) см/,ctx);return all[0]*all[1]+all[2]*all[3];}
  [b,c]=read(s,/Ширина прямоугольника (\d+) см, длину увеличили на (\d+) см/,ctx);return b*c;
 }
 if(l===1){
  if(p===0){[a,b,c,e]=read(s,/Из прямоугольника (\d+)×(\d+) см вырезали неперекрывающийся прямоугольник (\d+)×(\d+) см/,ctx);assert(c<a&&e<b);return a*b-c*e;}
  if(p===1){[a,b,c]=read(s,/Длину прямоугольника (\d+)×(\d+) см увеличили на (\d+) см/,ctx);return (a+c)*b;}
  if(p===2){[a,b,c,e]=read(s,/Сложили прямоугольники (\d+)×(\d+) и (\d+)×(\d+) см/,ctx);return a*b+c*e;}
  if(p===3){[area,a,e]=read(s,/Площадь прямоугольника (\d+) см²\. Его длина (\d+) см\. Ширину увеличили на (\d+) см/,ctx);assert.equal(area%a,0);return a*(area/a+e);}
  [a,b,e]=read(s,/прямоугольника (\d+)×(\d+) см, если ширину увеличить на (\d+) см/,ctx);return a*(b+e)-a*b;
 }
 if(p===0){const m=read(s,/Из прямоугольника (\d+)×(\d+) см вырезали два непересекающихся прямоугольника (\d+)×1 см и 1×(\d+) см/,ctx);return m[0]*m[1]-m[2]-m[3];}
 if(p===1){[a,b,c,e]=read(s,/прямоугольника (\d+)×(\d+) см длину увеличили на (\d+) см, ширину — на (\d+) см/,ctx);return (a+c)*(b+e)-a*b;}
 if(p===2){[a,b,c,e]=read(s,/размеры (\d+)×(\d+) см и (\d+)×(\d+) см/,ctx);return Math.abs(a*b-c*e);}
 if(p===3){[area,b,c,e]=read(s,/Площадь прямоугольника (\d+) см², ширина (\d+) см\. Длину увеличили на (\d+) см и ширину на (\d+) см/,ctx);assert.equal(area%b,0);return (area/b+c)*(b+e);}
 [a,b,c]=read(s,/шириной (\d+) см и высотой (\d+) см разделили вертикальным разрезом на две части\. Ширина первой части (\d+) см/,ctx);assert(c<a);return Math.abs(c*b-(a-c)*b);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(({id})=>{
   let seed=2026111421;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<40;trial++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),div=document.createElement('div');div.innerHTML=String(q.text);
    rows.push({level,family,trial,text:div.textContent,answer:q.correctLabel,choices:q.choices.map(x=>({label:String(x.label),key:String(x.key)})),ans:String(q.ans),ex:String(q.ex),source:q.sourceTopicId,template:q.templateId,meta:q.mk124});
   }
   renderGrade5();
   return {rows,topics:g5AllTopics().length,lesson:String(g5Lesson(id)),links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="area_rectangle"]').length};
  },{id:ID});
  assert.equal(out.topics,74);assert.equal(out.rows.length,600);assert.equal(out.links,1);
  assert(out.lesson.includes('S = a · b')&&out.lesson.includes('см²')&&out.lesson.includes('S : b'));
  const families=new Set(),slots=new Map(),steps=[[],[],[]];
  for(const q of out.rows){
   const ctx=q.level+'/'+q.family+'/'+q.trial,value=correct(q),m=q.meta;
   assert(Number.isSafeInteger(value)&&value>=0,'Invalid independent area '+ctx);
   assert(m&&m.id===ID&&m.t===q.level&&m.p===q.family,'Incorrect live generator '+ctx);
   assert.equal(m.expected,value,'Wrong generated math plan '+ctx);
   assert.equal(Number(q.answer),value,'Wrong answer on screen '+ctx);
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'Ambiguous correct key '+ctx);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Duplicated visible choices '+ctx);
   assert(q.ex.includes('Ответ: '+value+'.'),'Wrong final explanation '+ctx);
   assert(q.ex.includes('см²')||q.ex.includes('см.'),'Unit or clear intermediate calculation missing '+ctx);
   assert(!/undefined|Infinity|NaN/.test(q.ex),'Invalid math text '+ctx);
   assert(q.template&&q.source===ID,'Wrong template/progress ID '+ctx);
   const slot=q.level+'/'+q.family;if(!slots.has(slot))slots.set(slot,new Set());
   slots.get(slot).add(q.text);families.add(q.template);steps[q.level].push(m.steps);
  }
  assert.equal(families.size,15);assert.equal(slots.size,15);
  for(const [slot,texts]of slots)assert(texts.size>=10,'Insufficient student-visible variation '+slot+' '+texts.size);
  const means=steps.map(v=>v.reduce((a,b)=>a+b,0)/v.length);
  assert(means[0]<means[1]&&means[1]<means[2],'Difficulty not increasing '+means);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_21_PASS '+JSON.stringify({questions:600,families:15,meanSteps:means}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_21_FAIL',e.stack||e);process.exit(1)});
