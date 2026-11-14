'use strict';
// Strict Grade 5 §28 gate: independently solve actual learner-facing tasks; don't use mk5Audit,
// mk115, correctLabel or existing answer-key metadata to calculate a mathematical answer.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const ID='frac_types';
const get=(s,re,ctx)=>{const m=s.match(re);assert(m,'Cannot parse '+ctx+': '+s);return m.slice(1).map(Number)};
const fractions=s=>[...s.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map(x=>({n:+x[1],d:+x[2]}));
function solve(q){
 const s=q.text,t=q.level,p=q.slot,F=fractions(s),f=F[0],ctx=q.ctx;
 if(t===0){
  if(p===0||p===1) return f.n<f.d?'Правильная':'Неправильная';
  if(p===2)return f.n<f.d?'Меньше 1':f.n===f.d?'Равно 1':'Больше 1';
  if(p===3)return get(s,/при знаменателе (\d+) делает дробь неправильной/,ctx)[0];
  const [a,d]=get(s,/числитель (\d+) меньше знаменателя (\d+)/,ctx);return d-a;
 }
 if(t===1){
  if(p===0){const [k]=get(s,/увеличили на (\d+)/,ctx);return f.n+k<f.d?'Правильная':'Неправильная';}
  if(p===1){const [k]=get(s,/уменьшили на (\d+)/,ctx);return f.n-k<f.d?'Правильная':'Неправильная';}
  if(p===2){const proper=F.filter(x=>x.n<x.d);assert.equal(proper.length,1,'More than one proper fraction '+ctx);return proper[0];}
  if(p===3)return Math.floor(f.n/f.d);
  const [a,d]=get(s,/к числителю (\d+) дроби со знаменателем (\d+)/,ctx);return d-a;
 }
 if(p===0){const [d,n]=get(s,/со знаменателем (\d+) числитель (\d+)/,ctx);return n-d+1;}
 if(p===1)return f.d-f.n;
 if(p===2){const [inc,dec]=get(s,/сначала увеличили на (\d+), затем уменьшили на (\d+)/,ctx);
  return f.n+inc-dec<f.d?'Правильная':'Неправильная';}
 if(p===3){assert.equal(F.length,2,'Missing target fraction '+ctx);assert.equal(F[0].d,F[1].d,'Different denominators '+ctx);return F[0].n-F[1].n;}
 const [a,d]=get(s,/к числителю (\d+) дроби со знаменателем (\d+)/i,ctx);return d+1-a;
}
function checkDiagram(q){
 if(!q.diagram)return false;
 assert([['0','0'],['0','1'],['0','2'],['1','3']].some(([t,p])=>q.level===+t&&q.slot===+p),
  'Unexpected drawing '+q.ctx);
 const F=fractions(q.text);assert(F.length>0,'Drawing lacks labelled fraction '+q.ctx);
 const {n,d}=F[0],g=q.diagram;
 const bars=Math.ceil(n/d);
 assert.equal(g.rows.length,bars,'Incorrect number of whole strips '+q.ctx);
 assert(g.rows.every(row=>row.width===480),'Different whole strip widths '+q.ctx);
 assert(g.rows.every(row=>row.cells.length===d),'Wrong number of equal parts '+q.ctx);
 let colored=0;
 for(let j=0;j<g.rows.length;j++){
  const row=g.rows[j];const expect=Math.min(d,Math.max(0,n-j*d));
  const observed=row.cells.filter(cell=>cell.filled).length;
  assert.equal(observed,expect,'Wrong shade count in row '+j+' '+q.ctx);
  colored+=observed;
  for(let i=0;i<row.cells.length;i++){
   assert(Math.abs(row.cells[i].width-480/d)<0.002,'Unequal cell width '+q.ctx);
   if(i){const previous=row.cells[i-1];
    assert(Math.abs(row.cells[i].left-(previous.left+previous.width))<0.004,
     'Detached cells instead of a whole '+q.ctx);}
  }
 }
 assert.equal(colored,n,'Wrong total colored shares '+q.ctx);
 assert(g.aria.includes('закрашено '+n+' частей'),'Accessible description missing actual numerator '+q.ctx);
 assert(g.aria.includes('на '+d+' равных частей'),'Accessible description missing denominator '+q.ctx);
 return true;
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(id=>{
   let seed=2026111428;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const replacements=new Map();
   for(let d=2;d<=24;d++)for(let n=0;n<=80;n++)replacements.set(frac(n,d),n+'/'+d);
   const entities=[...replacements].sort((a,b)=>b[0].length-a[0].length);
   const read=s=>{
    for(const [html,original]of entities)if(s.includes(html))s=s.split(html).join(' '+original+' ');
    const el=document.createElement('div');el.innerHTML=s;el.querySelectorAll('svg').forEach(x=>x.remove());
    return el.textContent.replace(/\s+/g,' ').trim();
   };
   const rows=[];
   for(let level=0;level<3;level++)for(let slot=0;slot<5;slot++)for(let trial=0;trial<40;trial++){
    blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:slot,total:10,
     usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),el=document.createElement('div');el.innerHTML=q.text;
    const svg=el.querySelector('svg.mk-g5-proper-improper');
    let diagram=null;
    if(svg){
     const rects=[...svg.querySelectorAll('rect')],border=rects.filter(r=>r.getAttribute('fill')==='none');
     const rows=border.map(b=>{
      const y=+b.getAttribute('y'),all=rects.filter(r=>+r.getAttribute('y')===y&&r.getAttribute('fill')!=='none');
      return {width:+b.getAttribute('width'),cells:all.map(r=>({left:+r.getAttribute('x'),width:+r.getAttribute('width'),
       filled:r.getAttribute('fill')==='#5d9cdc'}))};
     });
     diagram={rows,aria:svg.getAttribute('aria-label')};
    }
    rows.push({ctx:id+'/'+level+'/'+slot+'/'+trial,level,slot,trial,source:q.sourceTopicId,
     template:q.templateId,text:read(String(q.text)),ans:String(q.ans),
     choices:q.choices.map(o=>({key:String(o.key),label:read(String(o.label))})),
     ex:read(String(q.ex)),diagram});
   }
   return {rows,catalog:g5AllTopics().length,lesson:g5Lesson(id)};
  },ID);
  assert.equal(out.catalog,74,'Grade-five inventory drift');
  assert.equal(out.rows.length,600,'Wrong sample size');
  for(const term of ['правильн','неправильн','числител','знаменател'])assert(
   out.lesson.toLowerCase().includes(term),'Missing textbook rule '+term);
  const familyIds=new Set(),sets=new Map(),answers=new Set();
  let images=0,classification=0,numeric=0,fraction=0;
  for(const q of out.rows){
   assert.equal(q.source,ID,'Inactive topic generator '+q.ctx);
   assert(q.template&&q.text&&q.ex,'Empty learner content '+q.ctx);
   assert(!/undefined|NaN|Infinity/.test(q.text+' '+q.ex),'Invalid UI text '+q.ctx);
   assert(q.choices.length>=3,'Insufficient choices '+q.ctx);
   assert.equal(q.choices.filter(o=>o.key===q.ans).length,1,'Invalid unique answer key '+q.ctx);
   const labels=q.choices.map(o=>o.label);
   assert.equal(new Set(labels).size,labels.length,'Duplicate displayed options '+q.ctx);
   const expected=solve(q);
   const answer=q.choices.find(o=>o.key===q.ans).label;
   if(typeof expected==='object'){
    assert.equal(answer,expected.n+'/'+expected.d,'Incorrect independently solved fraction '+q.ctx);
    fraction++;
   }else{
    assert.equal(answer,String(expected),'Wrong independent answer '+q.ctx+': '+q.text);
    if(typeof expected==='number')numeric++;else classification++;
   }
   answers.add(answer);
   if(checkDiagram(q))images++;
   const slot=q.level+'/'+q.slot;
   familyIds.add(q.template);
   if(!sets.has(slot))sets.set(slot,new Set());
   sets.get(slot).add(q.text);
  }
  assert.equal(sets.size,15,'Not 15 progression families');
  assert.equal(familyIds.size,15,'Duplicate family IDs across levels');
  for(const [slot,strings]of sets)assert(strings.size>=10,'Insufficient variety '+slot+': '+strings.size);
  assert.equal(images,160,'Expected actual visible diagrams in four families');
  assert.deepEqual(errors,[],'Browser JS error');
  console.log('G5_SEQUENTIAL_PARAGRAPH_28_PASS '+JSON.stringify({
   samples:out.rows.length,families:familyIds.size,diagrams:images,classification,numeric,fraction,
   answerVariety:answers.size,levelDesign:['classification and bars','change numerator and interpret','two operations / threshold recovery']}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_28_FAIL',e.stack||e);process.exit(1)});
