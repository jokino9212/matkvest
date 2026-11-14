'use strict';
// §27: independent answers derived from the actual text, options and SVG, not mk115 or its key.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const IDS=['frac_compare_den','frac_compare_num'];
const grab=(s,re,where)=>{const m=s.match(re);assert(m,'Cannot read '+where+': '+s);return m.slice(1).map(Number)};
const fs=s=>[...s.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map(m=>({n:+m[1],d:+m[2]}));
const cmp=(a,b)=>a>b?'>':a<b?'<':'=';
function solve(q){
 const s=q.text,t=q.level,p=q.slot,F=fs(s),get=i=>{assert(F[i],q.ctx+' missing fraction '+i+' in '+s);return F[i].n},
 den=i=>{assert(F[i],q.ctx+' missing denominator '+i+' in '+s);return F[i].d};
 if(q.id==='frac_compare_den'){
  if(t===0){
   if(p===0||p===2||p===4)return cmp(get(0),get(1));
   if(p===1)return Math.max(get(0),get(1));
   return get(0)-get(1);
  }
  if(t===1){
   if(p===0)return cmp(get(0)+get(1),get(2));
   if(p===1)return cmp(get(0)+get(2),get(1)+get(2));
   if(p===2)return cmp(get(0)-get(1),get(2));
   if(p===3)return get(1)-get(0);
   return [get(0),get(1),get(2)].sort((x,y)=>x-y)[1];
  }
  if(p===0)return cmp(get(0)+get(1),get(2)+get(3));
  if(p===1)return cmp(get(0)+get(1)-get(2),get(3)-get(4));
  if(p===2)return Math.abs(get(1)-get(0)-get(2));
  if(p===3)return cmp(get(0)-get(1)+get(2),get(3)+get(4));
  const [d,a,b,c,e]=grab(s,/со знаменателем (\d+) числители (\d+) и (\d+)\. К первому добавили (\d+), от второго отняли (\d+)/,q.ctx);
  return Math.abs((a+c)-(b-e));
 }
 // Same numerator: reverse the order of the denominators.
 if(t===0){
  if(p===0||p===2)return cmp(den(1),den(0));
  if(p===1)return Math.min(den(0),den(1));
  if(p===3)return den(0)-den(1);
  const options=q.choices.map(x=>fs(x.label));
  assert(options.every(a=>a.length===1),q.ctx+' choice not a visible fraction');
  const ordered=options.map((x,i)=>({i,...x[0]})).sort((a,b)=>b.n*a.d-a.n*b.d);
  assert(ordered.length===4 && ordered[0].n*ordered[1].d!==ordered[1].n*ordered[0].d,q.ctx+' multiple greatest choices');
  return q.choices[ordered[0].i].label;
 }
 if(t===1){
  const a=(p===0||p===2)?grab(s,/увеличили на (\d+)/,q.ctx)[0]:null;
  if(p===0)return cmp(den(1),den(0)+a);
  if(p===1){const b=grab(s,/уменьшили на (\d+)/,q.ctx)[0];return cmp(den(1),den(0)-b);}
  if(p===2){const b=grab(s,/уменьшили на (\d+)/,q.ctx)[0];return cmp(den(1)-b,den(0)+a);}
  if(p===3){const b=grab(s,/прибавили по (\d+)/,q.ctx)[0];return cmp(den(1)+b,den(0)+b);}
  const [d1,d2,a1,b1]=grab(s,/знаменатели (\d+) и (\d+)\. Первый увеличили на (\d+), второй уменьшили на (\d+)/,q.ctx);
  return Math.abs((d1+a1)-(d2-b1));
 }
 if(p===0){const [a,b]=grab(s,/увеличили на (\d+) и затем ещё на (\d+)/,q.ctx);return cmp(den(1)-b,den(0)+a+b);}
 if(p===1){const [n,d1,d2,a,b]=grab(s,/числитель (\d+), знаменатели (\d+) и (\d+)\. К первому знаменателю прибавили (\d+), из второго вычли (\d+)/,q.ctx);return Math.abs((d1+a)-(d2-b));}
 if(p===2){const [a,b]=grab(s,/первой дроби .+ прибавили (\d+), к знаменателю второй .+ прибавили (\d+)/,q.ctx);return cmp(den(1)+b-1,den(0)+a-1);}
 if(p===3){const [n,d1,d2,a,b]=grab(s,/числителем (\d+) знаменатели (\d+) и (\d+)\. Первый увеличили на (\d+), второй уменьшили на (\d+)/,q.ctx);return cmp(d2-b,d1+a);}
 const [a,b]=grab(s,/знаменатель увеличили на (\d+), затем уменьшили на (\d+)/,q.ctx);
 return cmp(den(1)-a+b,den(0)+a-b);
}
function checkDiagram(q){
 const svg=q.diagram;
 if(!svg)return false;
 assert.equal(q.level,0,'Diagram appears at unintended difficulty '+q.ctx);
 assert.equal(q.slot,0,'Diagram appears at unintended family '+q.ctx);
 const [first,second]=svg.rows;
 const F=fs(q.text);
 assert.equal(svg.fullWidth[0],svg.fullWidth[1],q.ctx+' different wholes in two bars');
 assert.equal(first.cells,F[0].d,q.ctx+' first bar subdivisions wrong');
 assert.equal(second.cells,F[1].d,q.ctx+' second bar subdivisions wrong');
 assert.equal(first.filled,F[0].n,q.ctx+' first shading does not match visible fraction');
 assert.equal(second.filled,F[1].n,q.ctx+' second shading does not match visible fraction');
 assert(svg.aria.includes('первая разделена')&&svg.aria.includes('вторая разделена'),q.ctx+' missing accessible explanation');
 return true;
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(ids=>{
   let seed=2026111427;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const markup=new Map();
   for(let d=2;d<=35;d++)for(let n=0;n<=45;n++)markup.set(frac(n,d),n+'/'+d);
   const substitutes=[...markup.entries()].sort((a,b)=>b[0].length-a[0].length);
   const decode=(s,withoutSvg=false)=>{
    for(const [html,value]of substitutes)if(s.includes(html))s=s.split(html).join(' '+value+' ');
    const el=document.createElement('div');el.innerHTML=s;
    if(withoutSvg)el.querySelectorAll('svg').forEach(x=>x.remove());
    return el.textContent.replace(/\s+/g,' ').trim();
   };
   const rows=[];
   for(const id of ids)for(let level=0;level<3;level++)for(let slot=0;slot<5;slot++)for(let trial=0;trial<40;trial++){
    blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:slot,total:10,
     usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),v=document.createElement('div');v.innerHTML=q.text;
    const svg=v.querySelector('svg.mk-g5-compare-fractions');
    let diagram=null;
    if(svg){
     const row=(y)=>{
      const rects=[...svg.querySelectorAll('rect')].filter(r=>+r.getAttribute('y')===y&&r.getAttribute('fill')!=='none');
      const border=[...svg.querySelectorAll('rect')].find(r=>+r.getAttribute('y')===y&&r.getAttribute('fill')==='none');
      return {cells:rects.length,filled:rects.filter(r=>r.getAttribute('fill')==='#5d9cdc').length,
       width:+border?.getAttribute('width')};
     };
     const a=row(6),b=row(52);
     diagram={aria:svg.getAttribute('aria-label'),rows:[a,b],fullWidth:[a.width,b.width]};
    }
    rows.push({id,level,slot,trial,ctx:id+'/'+level+'/'+slot+'/'+trial,
     text:decode(String(q.text),true),choices:q.choices.map(x=>({key:String(x.key),label:decode(String(x.label))})),
     ans:String(q.ans),ex:decode(String(q.ex)),source:q.sourceTopicId,template:q.templateId,
     diagram,steps:q.mk115?.steps});
   }
   return {rows,topics:g5AllTopics().length,lessons:ids.map(id=>g5Lesson(id))};
  },IDS);
  assert.equal(out.topics,74,'Topic inventory changed');
  assert.equal(out.rows.length,1200);
  const slots=new Map(),families=new Set(),per={frac_compare_den:0,frac_compare_num:0};
  let diagrams=0,comparisons=0,numeric=0,choices=0;
  for(const q of out.rows){
   assert.equal(q.source,q.id,'Inactive generator '+q.ctx);
   assert(q.template&&q.ex.trim()&&q.text.trim(),'Incomplete learner question '+q.ctx);
   assert(!/NaN|undefined|Infinity/.test(q.text+' '+q.ex),'Broken display '+q.ctx);
   assert(q.choices.length>=3,'Insufficient options '+q.ctx);
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'Wrong or repeated answer key '+q.ctx);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Duplicate displayed answer '+q.ctx);
   const expected=solve(q),picked=q.choices.find(x=>x.key===q.ans).label;
   assert.equal(picked,String(expected),'Student-visible mathematical answer wrong '+q.ctx+': '+q.text);
   if(checkDiagram(q))diagrams++;
   const k=q.id+'/'+q.level+'/'+q.slot;
   if(!slots.has(k))slots.set(k,new Set());
   slots.get(k).add(q.text);
   families.add(q.template);
   per[q.id]++;
   if(typeof expected==='number')numeric++;else if('<>='.includes(String(expected))&&String(expected).length===1)comparisons++;else choices++;
  }
  assert.equal(slots.size,30);
  assert.equal(families.size,30);
  for(const [slot,values]of slots)assert(values.size>=10,'Only '+values.size+' distinct visible questions '+slot);
  assert.equal(diagrams,80,'Expected two visual families × 40');
  assert.deepEqual(per,{frac_compare_den:600,frac_compare_num:600});
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_27_PASS '+JSON.stringify({questions:out.rows.length,slots:slots.size,diagrams,comparisons,numeric,choices,per}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_27_FAIL',e.stack||e);process.exit(1)});
