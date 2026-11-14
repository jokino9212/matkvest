'use strict';
// Independent §25 textbook gate: answers derived only from visible questions and actual SVG shapes.
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const ID='frac_shapes';
const read=(s,re,ctx)=>{const m=s.match(re);assert(m,'Cannot parse student question '+ctx+': '+s);return m.slice(1).map(Number);};
function figureAnswer(html,kind,feature,ctx){
 const groupRx=/<g transform="translate\((?:0|130|260|390),0\)">([\s\S]*?)<text x="65" y="134"/g;
 const groups=[...html.matchAll(groupRx)].map(m=>m[1]);
 assert.equal(groups.length,4,'Four pictures not rendered '+ctx);
 const identify=h=>feature
   ? (h.includes('fill="#ffcf87"')?'sector':h.includes('<path d="M65 25 A37')?'arc':h.includes('<line x1="28"')?'diameter':h.includes('<line x1="38"')?'chord':'unknown')
   : (h.includes('<path d="M33 42')?'cylinder':h.includes('fill="url(#mk5sphere)"')?'sphere':h.includes('fill="#80bde8"')?'disk':h.includes('fill="none"')?'ring':'unknown');
 const pictures=groups.map(identify);
 assert.equal(new Set(pictures).size,4,'Duplicate/missing visual types '+ctx+' '+pictures);
 const expected=feature?['chord','diameter','arc','sector']:['ring','disk','sphere','cylinder'];
 assert(expected.every(x=>pictures.includes(x)),'Incorrect illustration '+ctx);
 return pictures.indexOf(kind)+1;
}
function solve(q){
 const s=q.text,ctx=q.level+'/'+q.family+'/'+q.trial,t=q.level,p=q.family;
 if(t===0){
  if(p<4)return figureAnswer(q.html,['ring','disk','sphere','cylinder'][p],false,ctx);
  const [r]=read(s,/радиус длиной (\d+) см/,ctx);return 2*r;
 }
 if(t===1){
  if(p===0){const [d]=read(s,/Диаметр окружности (\d+) см/,ctx);assert.equal(d%2,0);return d/2;}
  if(p===1){const [d,inc]=read(s,/Диаметр круга (\d+) см\. Радиус увеличили на (\d+) см/,ctx);assert.equal(d%2,0);return d+2*inc;}
  if(p===2){const [a,b]=read(s,/Диаметры двух кругов (\d+) см и (\d+) см/,ctx);assert(a%2===0&&b%2===0);return Math.abs(a-b)/2;}
  return figureAnswer(q.html,p===3?'sector':'arc',true,ctx);
 }
 if(p===0){const [r,d]=read(s,/Радиус первого круга (\d+) см, радиус второго на (\d+) см больше/,ctx);return 4*r+2*d;}
 if(p===1){const [a,b,c]=read(s,/У трёх окружностей радиусы (\d+) см, (\d+) см и (\d+) см/,ctx);return 2*(a+b+c);}
 if(p===2){const [h,d]=read(s,/Четыре цилиндра высотой (\d+) см.*пят.*на (\d+) см больше/,ctx);return 5*h+d;}
 if(p===3){const [a,b,c,d]=read(s,/радиусы (\d+) см и (\d+) см\. Радиус первой увеличили на (\d+) см, второй — на (\d+) см/,ctx);return 2*(c+d);}
 const [a,b,c]=read(s,/Радиусы трёх шаров равны (\d+) см, (\d+) см и (\d+) см/,ctx);assert.equal(b-a,c-b);return 2*(a+b+c);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(id=>{
   let seed=2026111425;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<40;trial++){
    qid='g5:'+id;
    blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),div=document.createElement('div');div.innerHTML=q.text;
    rows.push({level,family,trial,html:String(q.text),text:div.textContent,
     answer:String(q.correctLabel),ans:String(q.ans),choices:q.choices.map(x=>({key:String(x.key),label:String(x.label)})),
     ex:String(q.ex),template:q.templateId,source:q.sourceTopicId,meta:q.mk126});
   }
   renderGrade5();
   const links=[...document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="frac_shapes"]')];
   return {rows,topics:g5AllTopics().length,links:links.length,title:links[0]?.textContent||'',lesson:g5Lesson(id)};
  },ID);
  assert.equal(out.topics,74,'Other Grade 5 topics disappeared');
  assert.equal(out.links,1,'Textbook §25 missing or duplicated');
  assert(out.title.includes('Окружность, круг, шар, цилиндр'),'Wrong §25 title');
  for(const term of ['окружност','круг','радиус','диаметр','Шар','сфера','Цилиндр','Дуга','Сектор'])
   assert(out.lesson.toLowerCase().includes(term.toLowerCase()),'Missing theory '+term);
  assert(!/площадь круга вычисляем|длина окружности =/.test(out.lesson),'Incorrect sixth-grade formulas leaked');
  const slotSets=new Map(),families=new Set(),levels=[[],[],[]];
  let pictured=0,numeric=0;
  for(const q of out.rows){
   const ctx=q.level+'/'+q.family+'/'+q.trial,expected=solve(q),m=q.meta;
   assert(Number.isSafeInteger(expected)&&expected>=0,'Bad math '+ctx);
   assert(m&&m.id===ID&&m.t===q.level&&m.p===q.family,'Wrong live generator '+ctx);
   assert.equal(m.expected,expected,'Math plan disagrees with visible question '+ctx);
   assert.equal(Number(q.answer),expected,'Visible answer incorrect '+ctx);
   assert.equal(Number(q.ans),expected,'Correct key incorrect '+ctx);
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'Ambiguous answer '+ctx);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,4,'Not four distinct options '+ctx);
   assert(q.ex.includes('Ответ: '+expected+'.'),'Worked answer wrong '+ctx);
   assert(!/undefined|NaN|Infinity/.test(q.html+q.ex),'Corrupt display '+ctx);
   assert(q.source===ID&&q.template,'Wrong source topic '+ctx);
   assert(!/закрашенн[ые] (?:клетк|квадрат)|долей квадрата/.test(q.text),'§26 fraction tasks leaked '+ctx);
   const picture=(q.level===0&&q.family<4)||(q.level===1&&q.family>=3);
   if(picture){
    pictured++;
    assert.deepEqual(q.choices.map(x=>x.key).sort(),['1','2','3','4'],'Illustration answers must be 1–4 '+ctx);
    assert(q.html.includes('<svg')&&q.html.includes('viewBox="0 0 520 145"'),'Missing responsive gallery '+ctx);
   }else{
    numeric++;
    assert(/\d+/.test(q.ex)&&/[·:−+]/.test(q.ex),'No numerical calculation in solution '+ctx);
    assert(/см/.test(q.ex),'Missing unit in numerical solution '+ctx);
   }
   const slot=q.level+'/'+q.family;if(!slotSets.has(slot))slotSets.set(slot,new Set());
   slotSets.get(slot).add(q.text);families.add(q.template);levels[q.level].push(m.steps);
  }
  assert.equal(out.rows.length,600);assert.equal(families.size,15);assert.equal(slotSets.size,15);
  for(const [slot,set]of slotSets)assert(set.size>=10,'Insufficient variation '+slot+': '+set.size);
  const means=levels.map(x=>x.reduce((a,b)=>a+b,0)/x.length);
  assert(means[0]<means[1]&&means[1]<means[2],'No rising difficulty '+means);
  assert.deepEqual(errors,[],'Browser runtime errors');
  console.log('G5_SEQUENTIAL_PARAGRAPH_25_PASS '+JSON.stringify({samples:out.rows.length,families:families.size,pictured,numeric,meanSteps:means}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_25_FAIL',e.stack||e);process.exit(1)});
