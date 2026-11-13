'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const id='coordinate',N=40,fmt=q=>q.level+'/'+q.family+'/'+q.trial;
const numbers=(text,re)=>{const m=text.match(re);assert(m,'Cannot parse actual §5 learner prompt '+text);return m.slice(1).map(Number)};
function independent(q){
 const p=q.plain;
 if(q.level===0){
  if(q.family===0)return q.fig.points.find(x=>x.name==='A')?.at;
  if(q.family===1){const [a,b]=numbers(p,/A\((\d+)\) и B\((\d+)\)/);return b-a}
  if(q.family===2){const [a,c]=numbers(p,/A\((\d+)\) сдвинулась на (\d+) единичных/);return a+c}
  if(q.family===3){const [unit,n]=numbers(p,/Цена деления шкалы — (\d+) ед\. Точка C находится на (\d+)-м/);return n*unit}
  if(q.family===4){const [a,b]=numbers(p,/A\((\d+)\) и B\((\d+)\)/);assert((b-a)%2===0);return(a+b)/2}
 }
 if(q.level===1){
  if(q.family===0){const [a,c,d]=numbers(p,/A\((\d+)\) прошли вправо (\d+) делений, затем влево (\d+)/);return a+c-d}
  if(q.family===1){const [a,b]=numbers(p,/A\((\d+)\) и B\((\d+)\)/);assert((a+b)%2===0);return(a+b)/2}
  if(q.family===2){const [b,d]=numbers(p,/точки B равна (\d+).*прошли (\d+) единичных/);return b-d}
  if(q.family===3){const [u,a,b,c]=numbers(p,/каждое деление равно (\d+) единицам\. От точки A\((\d+)\) прошли (\d+) делений влево, затем (\d+) делений вправо/);return a+(c-b)*u}
  if(q.family===4){const [a,b,c]=numbers(p,/A\((\d+)\), B\((\d+)\), C\((\d+)\)/);assert(a<b&&b<c);return c-a}
 }
 if(q.level===2){
  if(q.family===0){const [a,b,db,dc]=numbers(p,/A\((\d+)\) и B\((\d+)\).*влево на (\d+) делений, B вправо на (\d+)/);return b+dc-a+db}
  if(q.family===1){const [m,a]=numbers(p,/M\((\d+)\).* A\((\d+)\)/);return 2*m-a}
  if(q.family===2){const [u,a,b,c,d]=numbers(p,/Цена деления шкалы — (\d+) ед\. От точки A\((\d+)\) прошли (\d+) делений вправо, затем (\d+) вправо и (\d+) влево/);return a+(b+c-d)*u}
  if(q.family===3){const [a,b,c]=numbers(p,/A\((\d+)\), B\((\d+)\), C\((\d+)\)/);assert((a+b)%2===0);return c-(a+b)/2}
  if(q.family===4){const [a,d,c]=numbers(p,/A\((\d+)\) прошли неизвестное число делений вправо, затем вернулись влево на (\d+) и оказались в точке C\((\d+)\)/);return c+d-a}
 }
 throw Error('Unexpected stage or family '+fmt(q));
}
function checkSvg(q){
 const m=q.fig,key=fmt(q);
 assert(m,'Missing real coordinate drawing '+key);
 assert.equal(m.role,'img','SVG not accessible '+key);
 assert.equal(m.width,'100%','Coordinate figure not responsive '+key);
 assert(Number(m.unit)>=1&&Number(m.unit)<=10,'Invalid scale division '+key);
 assert(Number(m.limit)>=Number(m.unit)&&m.limit%m.unit===0,'Scale maximum not aligned to division '+key);
 assert.equal(m.ticks.length,m.limit/m.unit+1,'Non-unit-scaled tick intervals '+key);
 const xOf=v=>m.left+(m.right-m.left)*v/m.limit;
 const tolerance=.003;
 for(let i=0;i<m.ticks.length;i++){
  const t=m.ticks[i];assert.equal(t.value,i*m.unit,'Scale ticks must be exact multiples of unit '+key);
  assert(Math.abs(t.x-xOf(t.value))<tolerance,'Tick appears at mathematically wrong coordinate '+key);
 }
 assert(m.labels.some(v=>v.value===0)&&m.labels.some(v=>v.value===m.unit),'Scale must show 0 and first tick '+key);
 for(const label of m.labels){
  assert.equal(label.text,String(label.value),'Numeric label mismatch on scale '+key);
  assert(Math.abs(label.x-xOf(label.value))<tolerance,'Printed number at incorrect location '+key);
 }
 assert.equal(new Set(m.points.map(p=>p.name)).size,m.points.length,'Duplicate point name '+key);
 for(const p of m.points){
  assert(p.at>=0&&p.at<=m.limit,'Point outside coordinate ray '+key);
  assert(Math.abs(p.x-xOf(p.at))<tolerance,'Point coordinate not proportional '+key);
  assert(!/NaN|undefined|Infinity/.test(p.name),'Bad point name '+key);
 }
 for(const move of m.moves){
  assert(move.from!==move.to&&move.from>=0&&move.to>=0,'Zero or negative range '+key);
  assert(Math.abs(move.x1-xOf(move.from))<tolerance,'Move starts at wrong coordinate '+key);
  assert(Math.abs(move.x2-(xOf(move.to)+(move.from>move.to?10:-10)))<tolerance,'Move arrow has wrong endpoint '+key);
 }
 if(m.unit>1)assert(/Цена деления шкалы/.test(m.aria),'Missing scale interpretation '+key);
 if(q.level===0&&q.family===0)assert.equal(m.points.find(p=>p.name==='A')?.at,Number(q.ans),'First illustrated coordinate read must match actual point');
 if(q.level===0&&q.family===3)assert(m.unit>1&&m.points.length===1&&m.points[0].name==='C','Warmup needs graduated scale not plain arithmetic');
 if(q.level===1&&q.family===2)assert(!m.points.some(p=>p.name==='A'),'Unknown initial coordinate must not be explicitly marked');
 if(q.level===2&&q.family===1)assert(!m.points.some(p=>p.name==='B'),'Unknown B endpoint must not be explicitly revealed');
 if(q.level===2&&q.family===2)assert(m.unit>1&&m.moves.length===3,'Master needs three real jumps on non-unit scale');
 const expectedMoves=[[0,0,1,0,0],[2,0,1,2,0],[2,0,3,0,1]][q.level][q.family];
 assert.equal(m.moves.length,expectedMoves,'Number of shown movements is wrong '+key);
}
(async()=>{
 const src=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
 assert(src.includes("[5,'Шкалы и координатная прямая',['coordinate']]"),'§5 textbook navigation was changed');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(({id,N})=>{
   let seed=2026111305;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<N;trial++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),node=document.createElement('div');node.innerHTML=String(q.text);
    const svg=node.querySelector('svg'),plain=node.childNodes[0]?.textContent||'';
    const fig=svg?{
     role:svg.getAttribute('role'),width:svg.getAttribute('width'),aria:svg.getAttribute('aria-label'),
     unit:Number(svg.getAttribute('data-unit')),limit:Number(svg.getAttribute('data-limit')),
     left:Number(svg.getAttribute('data-left')),right:Number(svg.getAttribute('data-right')),
     ticks:[...svg.querySelectorAll('.g5-coordinate-tick')].map(x=>({value:Number(x.getAttribute('data-value')),x:Number(x.getAttribute('x1'))})),
     labels:[...svg.querySelectorAll('.g5-coordinate-number')].map(x=>({value:Number(x.getAttribute('data-value')),x:Number(x.getAttribute('x')),text:x.textContent})),
     points:[...svg.querySelectorAll('.g5-coordinate-point')].map(x=>({name:x.getAttribute('data-name'),at:Number(x.getAttribute('data-at')),x:Number(x.getAttribute('cx'))})),
     moves:[...svg.querySelectorAll('.g5-coordinate-move')].map(x=>({from:Number(x.getAttribute('data-from')),to:Number(x.getAttribute('data-to')),x1:Number(x.getAttribute('x1')),x2:Number(x.getAttribute('x2'))}))
    }:null;
    rows.push({level,family,trial,ans:String(q.ans),plain,fig,meta:q.mk125,template:q.templateId,choices:q.choices.map(c=>({key:String(c.key),label:String(c.label)}))});
   }
   renderGrade5();
   return {count:g5AllTopics().length,lesson:g5Lesson(id),links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="coordinate"]').length,rows};
  },{id,N});
  assert.equal(data.count,74,'Grade 5 topic catalog lost topics');
  assert.equal(data.rows.length,600,'Missing generated exercises');
  assert.equal(data.links,1,'§5 must have one direct nav link');
  for(const term of ['Шкала','Цена деления','Координатный','единичный'])assert(data.lesson.toLowerCase().includes(term.toLowerCase()),'§5 theory missing '+term);
  const families=new Map(),variations=new Map(),difficulty=[[],[],[]],divisions=new Set();
  for(const q of data.rows){
   const k=fmt(q);
   assert(!/NaN|undefined|Infinity/.test(q.plain),'Malformed learner condition '+k);
   assert.equal(q.choices.filter(c=>c.key===q.ans).length,1,'Correct answer missing '+k);
   assert.equal(new Set(q.choices.map(c=>c.label)).size,q.choices.length,'Duplicate visible answer '+k);
   assert(q.meta&&q.meta.id===id&&q.meta.t===q.level&&q.meta.p===q.family,'Wrong generator metadata '+k);
   assert.equal(q.ans,String(q.meta.expected),'Incorrect generator answer '+k);
   assert.equal(q.ans,String(independent(q)),'Learner-facing question has wrong answer '+k);
   checkSvg(q);
   const slot=q.level+'/'+q.family;
   if(!families.has(slot))families.set(slot,q.template);
   else assert.equal(families.get(slot),q.template,'Question family not stable '+k);
   const variants=variations.get(slot)||new Set();
   variants.add(q.plain+'|'+q.fig.points.map(p=>p.name+':'+p.at)+'|'+q.fig.moves.map(m=>m.from+':'+m.to));
   variations.set(slot,variants);
   difficulty[q.level].push(q.meta.steps);
   divisions.add(q.fig.unit);
  }
  assert.equal(families.size,15,'§5 must have 15 cognitive families across three levels');
  for(const [slot,items]of variations)assert(items.size>1,'§5 family only repeats a single question '+slot);
  const avgs=difficulty.map(xs=>xs.reduce((a,b)=>a+b,0)/xs.length);
  assert(avgs[0]<avgs[1]&&avgs[1]<avgs[2],'No progression from warmup to master '+avgs);
  assert([...divisions].some(x=>x>1),'No real graduated non-unit scales');
  assert.deepEqual(errors,[],'Uncaught browser errors');
  console.log('G5_SEQUENTIAL_PARAGRAPH_05_PASS '+JSON.stringify({paragraph:5,questions:data.rows.length,families:families.size,geometryChecks:600,difficulty:avgs,scaleDivisions:[...divisions].sort((a,b)=>a-b),navLinks:data.links}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_05_FAIL',e.stack||e);process.exit(1)});
