'use strict';
// Independent browser oracle for the exact 15 learner-visible families of §22.
// Derive answers exclusively from text shown to the student, not the generator's math plan.
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const ID='area_units_g5';
function read(s,re,ctx){
 const m=s.match(re);
 assert(m,'Unreadable §22 student condition '+ctx+': '+s);
 return m.slice(1).map(Number);
}
function solution(q){
 const s=q.text,l=q.level,p=q.family,ctx=l+'/'+p+'/'+q.trial;
 let v;
 if(l===0){
  if(p===0)return read(s,/Переведи (\d+) дм² в квадратные сантиметры/,ctx)[0]*100;
  if(p===1){v=read(s,/Площадь равна (\d+) см²\. Вырази её в дм²/,ctx)[0];assert.equal(v%100,0);return v/100;}
  if(p===2)return read(s,/Площадь равна (\d+) м²\. Сколько это квадратных дециметров/,ctx)[0]*100;
  if(p===3)return read(s,/Сколько квадратных сантиметров составляют (\d+) м²/,ctx)[0]*10000;
  return read(s,/Участок занимает (\d+) га\. Сколько это аров/,ctx)[0]*100;
 }
 if(l===1){
  if(p===0){v=read(s,/Площадь комнаты (\d+) дм²/,ctx)[0];assert.equal(v%100,0);return v/100;}
  if(p===1){v=read(s,/отметили (\d+) дм² и ещё (\d+) см²/,ctx);return v[0]*100+v[1];}
  if(p===2){v=read(s,/длину (\d+) дм и ширину (\d+) дм/,ctx);return v[0]*v[1]*100;}
  if(p===3){v=read(s,/занимает (\d+) а и ещё (\d+) м²\. Сколько м² надо добавить до (\d+) а/,ctx);assert.equal(v[2],v[0]+1);assert(v[1]<100);return (v[2]-v[0])*100-v[1];}
  v=read(s,/От площади (\d+) м² отрезали (\d+) дм²/,ctx);return v[0]*100-v[1];
 }
 if(p===0){v=read(s,/Площадь участка (\d+) га и (\d+) а\. Под дорожку отвели (\d+) м²/,ctx);return v[0]*10000+v[1]*100-v[2];}
 if(p===1){v=read(s,/Первая комната (\d+) м × (\d+) м, вторая (\d+) м × (\d+) м/,ctx);return (v[0]*v[1]+v[2]*v[3])*100;}
 if(p===2){v=read(s,/Первый прямоугольник (\d+) дм × (\d+) см, второй (\d+) дм × (\d+) см/,ctx);assert(v[0]>v[2]&&v[1]>v[3]);return (v[0]*v[1]-v[2]*v[3])*10;}
 if(p===3){v=read(s,/Участок занимает (\d+) а\. Сначала заняли (\d+) м², затем ещё (\d+) дм²/,ctx);return v[0]*10000-v[1]*100-v[2];}
 v=read(s,/Площадь прямоугольника (\d+) см², его длина (\d+) дм\. Ширину увеличили на (\d+) см/,ctx);
 assert.equal(v[0]%(v[1]*10),0);return v[0]+v[1]*10*v[2];
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(({id})=>{
   let seed=2026111422;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<40;trial++){
    qid='g5:'+id;
    blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),div=document.createElement('div');
    div.innerHTML=String(q.text);
    rows.push({level,family,trial,text:div.textContent,answer:q.correctLabel,
     choices:q.choices.map(x=>({label:String(x.label),key:String(x.key)})),
     ans:String(q.ans),ex:String(q.ex),source:q.sourceTopicId,template:q.templateId,meta:q.mk125});
   }
   renderGrade5();
   return {rows,topics:g5AllTopics().length,lesson:String(g5Lesson(id)),
    links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="area_units_g5"]').length};
  },{id:ID});
  assert.equal(out.topics,74);
  assert.equal(out.rows.length,600);
  assert.equal(out.links,1);
  assert(out.lesson.includes('1 га = 100 а')&&out.lesson.includes('1 а = 100 м²'),'§22 lesson missing squared-unit conversions');
  const templates=new Set(),slots=new Map(),meanSteps=[[],[],[]];
  for(const q of out.rows){
   const ctx=q.level+'/'+q.family+'/'+q.trial,correct=solution(q),m=q.meta;
   assert(Number.isSafeInteger(correct)&&correct>0,'Invalid external answer '+ctx);
   assert(m&&m.id===ID&&m.t===q.level&&m.p===q.family,'Not the live v125 generator '+ctx);
   assert.equal(m.expected,correct,'Bad operation plan '+ctx);
   assert.equal(Number(q.answer),correct,'Incorrect on-screen answer '+ctx);
   assert.equal(q.source,ID,'Wrong curriculum ID '+ctx);
   assert(q.template,'Missing template ID '+ctx);
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'Missing or multiple correct keys '+ctx);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Duplicate visible alternatives '+ctx);
   assert(q.ex.includes('Ответ: '+correct+'.'),'Incorrect final response '+ctx);
   assert(/\d+\s*[·:+−]\s*\d+/.test(q.ex),'No demonstrated numerical step '+ctx);
   assert(/см²|дм²|м²| га| а\b/.test(q.ex),'Missing squared-unit explanation '+ctx);
   assert(!/undefined|Infinity|NaN/.test(q.ex),'Invalid math text '+ctx);
   let slot=q.level+'/'+q.family;
   if(!slots.has(slot))slots.set(slot,new Set());
   slots.get(slot).add(q.text);
   templates.add(q.template);
   meanSteps[q.level].push(m.steps);
  }
  assert.equal(templates.size,15);
  assert.equal(slots.size,15);
  for(const [slot,tests]of slots)assert(tests.size>=10,'Poor variation '+slot+': '+tests.size);
  const means=meanSteps.map(arr=>arr.reduce((a,b)=>a+b,0)/arr.length);
  assert(means[0]<means[1]&&means[1]<means[2],'No graded difficulty '+means);
  assert.deepEqual(errors,[],'Browser JavaScript errors');
  console.log('G5_SEQUENTIAL_PARAGRAPH_22_PASS '+JSON.stringify({
   paragraph:22,questions:600,families:15,minimumVariantsPerSlot:Math.min(...[...slots.values()].map(s=>s.size)),meanSteps:means,
   lesson:'squared units, ares, hectares',topics:out.topics}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_22_FAIL',e.stack||e);process.exit(1);});
