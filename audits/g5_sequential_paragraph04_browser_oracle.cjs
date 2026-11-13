'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const samplesPerSlot=40,id='plane_line_ray';
function oracle(node){
 const [op,...parts]=node,E=oracle;
 if(op==='v')return BigInt(parts[0]);
 if(op==='add')return parts.reduce((a,v)=>a+E(v),0n);
 if(op==='sub')return E(parts[0])-E(parts[1]);
 if(op==='mul')return E(parts[0])*E(parts[1]);
 if(op==='div'){const x=E(parts[0]),d=E(parts[1]);assert(d!==0n&&x%d===0n,'Noninteger geometry arithmetic');return x/d}
 if(op==='abs'){const n=E(parts[0]);return n<0n?-n:n}
 throw Error('Unexpected plan operation '+op);
}
const take=(text,re)=>{const m=text.match(re);assert(m,'Cannot independently parse actual learner question: '+text);return [...m].slice(1).map(Number)};
function independentAnswer(q){
 const v=q.plain;
 if(q.level===0){
  if(q.family===0){assert.deepEqual([...q.order].sort(),['angle','line','ray','segment']);return q.order.indexOf('line')+1}
  if(q.family===1)return 1;
  if(q.family===2)return 2;
  if(q.family===3)return 2;
  if(q.family===4)return 2*take(v,/точку O проходят (\d+) различные прямые/)[0];
 }
 if(q.level===1){
  if(q.family===0){const [a,b]=take(v,/AC = (\d+) см, CB = (\d+) см/);return a+b}
  if(q.family===1){const [whole,a]=take(v,/AB длиной (\d+) см.*AC = (\d+) см/);return whole-a}
  if(q.family===2)return take(v,/отмечено (\d+) различных точек/)[0]-1;
  if(q.family===3)return take(v,/выходят (\d+) луч/)[0]-1;
  if(q.family===4)return take(v,/На рисунке (\d+) различные прямые/)[0];
 }
 if(q.level===2){
  if(q.family===0){const n=take(v,/выходят (\d+) луч/)[0];return n*(n-1)/2}
  if(q.family===1){const n=take(v,/отмечено (\d+) различных точек/)[0];return n*(n-1)/2}
  if(q.family===2){const n=take(v,/отмечено (\d+) точек/)[0];return 2*n-2}
  if(q.family===3){const [ab,ao,cd,co]=take(v,/AB = (\d+) см, AO = (\d+) см, CD = (\d+) см, CO = (\d+) см/);assert(ab>ao&&cd>co);return ab-ao+cd-co}
  if(q.family===4){const [ab,bc,cd]=take(v,/AB = (\d+) см, BC = (\d+) см, CD = (\d+) см/);return ab+2*bc+cd}
 }
 throw Error('Unknown paragraph-four family '+q.level+'/'+q.family);
}
(async()=>{
 const catalog=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
 assert(catalog.includes("[4,'Плоскость, прямая, луч, угол',['plane_line_ray']]"),'§4 must route to the real reviewed topic');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),browserErrors=[];
  page.on('pageerror',e=>browserErrors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(({id,samplesPerSlot})=>{
   let seed=2026111304;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const rows=[],counters={gallery:0,rays:0,segment:0,angle:0,lines:0,marked:0,cross:0,fourPoints:0};
   const ensure=(cond,message)=>{if(!cond)throw Error('§4 rendered SVG: '+message)};
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<samplesPerSlot;trial++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),root=document.createElement('div');root.innerHTML=String(q.text);
    const svg=root.querySelector('svg'),plain=root.childNodes[0]?.textContent||'',key=level+'/'+family+'/'+trial;
    ensure(svg&&svg.getAttribute('role')==='img'&&svg.getAttribute('viewBox')&&svg.getAttribute('width')==='100%','No accessible responsive visual '+key);
    ensure(!/undefined|NaN|Infinity/.test(svg.outerHTML),'Invalid diagram coordinate '+key);
    ensure(!/координатн|координату|шкал[ауые]/i.test(plain),'§5 coordinate content leaked into §4 '+key);
    const lines=[...svg.querySelectorAll('line')],points=[...svg.querySelectorAll('circle')],aria=svg.getAttribute('aria-label')||'';
    let order=null;
    if(level===0&&family===0){
     order=[...svg.querySelectorAll('g[data-kind]')].map(g=>g.getAttribute('data-kind'));
     ensure(order.length===4&&new Set(order).size===4&&order.includes('line')&&order.includes('angle'),'Incomplete shape gallery '+key);
     ensure(svg.querySelectorAll('g[data-kind] text').length===4,'Missing numeric gallery labels');
     counters.gallery++;
    }else if((level===0&&family===1)||(level===1&&family===3)||(level===2&&family===0)){
     const n=Number(plain.match(/выходят (\d+) луч/)?.[1]);
     ensure(n>=2&&n<=6&&lines.length===n,'Wrong number of drawn rays '+key);
     const angles=lines.map(l=>Math.atan2(210-Number(l.getAttribute('y2')),Number(l.getAttribute('x2'))-255)*180/Math.PI).sort((a,b)=>a-b);
     ensure(angles.at(-1)-angles[0]<180&&angles.every((x,i)=>i===0||x-angles[i-1]>8),'Ambiguous coincident/opposite rays '+key);
     ensure(points.length===1,'All rays must share exactly one origin '+key);
     counters.rays++;
    }else if((level===0&&family===2)||(level===1&&family<=1)){
     ensure(points.length===3&&lines.length===1,'Split segment needs three points and one segment '+key);
     const xs=points.map(c=>Number(c.getAttribute('cx')));
     ensure(xs[0]<xs[1]&&xs[1]<xs[2],'C must be inside segment AB '+key);
     const m=aria.match(/AC равно (\d+) см, CB (?:неизвестно|(\d+) см)/);
     ensure(m,'Split-segment description missing '+key);
     const a=Number(m[1]),b=level===1&&family===1?Number(plain.match(/AB длиной (\d+) см/)?.[1])-a:Number(m[2]);
     ensure(Math.abs((xs[1]-xs[0])/(xs[2]-xs[1])-a/b)<.003,'Sketch segment lengths not proportional '+key);
     if(level===1&&family===1){ensure(svg.textContent.includes('?'),'Unknown part is not visually hidden '+key);ensure(!aria.includes('CB '+b+' см'),'Correct answer exposed to accessibility tree '+key)}
     counters.segment++;
    }else if(level===0&&family===3){
     ensure(lines.length===2&&points.length===1&&svg.textContent.includes('O'),'Angle must have exactly two sides and one vertex '+key);
     counters.angle++;
    }else if((level===0&&family===4)||(level===1&&family===4)){
     const n=Number(plain.match(/(\d+) различные прямые/)?.[1]);
     ensure(lines.length===n&&n>=2&&n<=3&&points.length===1,'Number of intersecting lines differs from question '+key);
     for(const l of lines){
      const x1=Number(l.getAttribute('x1')),y1=Number(l.getAttribute('y1')),x2=Number(l.getAttribute('x2')),y2=Number(l.getAttribute('y2'));
      ensure(Math.abs((x1+x2)/2-260)<.02&&Math.abs((y1+y2)/2-119)<.02,'Lines do not all meet at O '+key);
     }
     counters.lines++;
    }else if((level===1&&family===2)||(level===2&&(family===1||family===2))){
     const n=Number(plain.match(/отмечено (\d+) (?:различных )?точек/)?.[1]);
     ensure(points.length===n&&lines.length===1,'Wrong count of marked points '+key);
     const xs=points.map(c=>Number(c.getAttribute('cx')));
     ensure(xs.every((x,i)=>i===0||x>xs[i-1]),'Marked points must have distinct ordered locations '+key);
     counters.marked++;
    }else if(level===2&&family===3){
     ensure(lines.length===4&&points.length===5,'Intersecting AB and CD must display their four arms '+key);
     const m=plain.match(/AB = (\d+) см, AO = (\d+) см, CD = (\d+) см, CO = (\d+) см/),ab=Number(m?.[1]),ao=Number(m?.[2]),cd=Number(m?.[3]),co=Number(m?.[4]),actual=[ao,ab-ao,co,cd-co];
     const rs=lines.map((l,i)=>Math.hypot(Number(l.getAttribute('x2'))-260,Number(l.getAttribute('y2'))-122)/actual[i]);
     ensure(Math.max(...rs)-Math.min(...rs)<.01,'Four drawn arms are not proportional '+key);
     ensure(!/\d+/.test(aria),'Hidden answers must not appear in accessibility description '+key);
     counters.cross++;
    }else if(level===2&&family===4){
     ensure(lines.length===1&&points.length===4,'A B C D must be four ordered points on one line '+key);
     const m=plain.match(/AB = (\d+) см, BC = (\d+) см, CD = (\d+) см/),lengths=m.slice(1).map(Number);
     const xs=points.map(c=>Number(c.getAttribute('cx'))),ratio=lengths.map((l,i)=>(xs[i+1]-xs[i])/l);
     ensure(Math.max(...ratio)-Math.min(...ratio)<.01,'Four-point segments must be proportional '+key);
     counters.fourPoints++;
    }else throw Error('No visual validation case '+key);
    rows.push({level,family,trial,ans:String(q.ans),plain,choices:q.choices.map(c=>({key:String(c.key),label:String(c.label)})),template:q.templateId,meta:q.mk124,order,visualKey:level===0?(family===0?order.join(','):family===2?points.map(p=>p.getAttribute('cx')).join(','):family===3?lines.map(l=>l.getAttribute('x2')).join(','):null):null,ex:String(q.ex)});
   }
   renderGrade5();
   const links=[...document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="plane_line_ray"]')];
   return {total:g5AllTopics().length,lesson:g5Lesson(id),rows,counters,links:links.length};
  },{id,samplesPerSlot});
  assert.equal(result.total,74,'Must not alter number of Grade 5 topics');
  assert.equal(result.rows.length,600,'Expected 600 real questions for one paragraph');
  assert.equal(result.links,1,'Must have exactly one working §4 textbook navigation link');
  assert(result.lesson.includes('Плоскость')&&result.lesson.includes('Угол'),'§4 theory must teach plane and angle');
  const familyKeys=new Set(),bySlot=new Map(),variations=new Map(),means=[[],[],[]];
  for(const q of result.rows){
   const context=q.level+'/'+q.family+'/'+q.trial;
   assert.equal(q.choices.filter(c=>c.key===q.ans).length,1,'One unambiguous correct key required '+context);
   assert.equal(new Set(q.choices.map(c=>c.label)).size,q.choices.length,'Duplicate visible answers '+context);
   assert(q.meta&&q.meta.id===id&&q.meta.t===q.level&&q.meta.p===q.family,'Incorrect stage metadata '+context);
   assert.equal(q.ans,oracle(q.meta.plan).toString(),'Independent BigInt operation mismatch '+context);
   assert.equal(Number(q.ans),independentAnswer(q),'Displayed question and correct answer mismatch '+context);
   assert.equal(q.meta.expected,Number(q.ans),'Generator expected result mismatch '+context);
   means[q.level].push(q.meta.steps);
   const slot=q.level+'/'+q.family;
   if(!bySlot.has(slot)){bySlot.set(slot,q.template);familyKeys.add(q.template)}
   else assert.equal(bySlot.get(slot),q.template,'Unstable family slot '+context);
   const set=variations.get(slot)||new Set();set.add(q.plain+'|'+(q.visualKey||''));variations.set(slot,set);
  }
  assert.equal(familyKeys.size,15,'§4 must contain 15 distinct cognitive families');
  const avg=means.map(a=>a.reduce((x,y)=>x+y,0)/a.length);
  assert(avg[0]<avg[1]&&avg[1]<avg[2],'No increasing difficulty '+avg);
  for(const [slot,texts]of variations)assert(texts.size>=2,'Family repeats identical question with no variation: '+slot);
  assert.deepEqual(browserErrors,[],'Browser runtime exception');
  console.log('G5_SEQUENTIAL_PARAGRAPH_04_PASS '+JSON.stringify({paragraph:4,topics:1,questions:result.rows.length,families:familyKeys.size,meanSteps:avg,visual:result.counters,links:result.links}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_04_FAIL',e.stack||e);process.exit(1)});
