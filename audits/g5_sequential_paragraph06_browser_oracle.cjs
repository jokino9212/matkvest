'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const parse=(s,re,ctx)=>{const m=s.match(re);assert(m,'Cannot parse student question '+ctx+': '+s);return m.slice(1).map(Number);};
const nums=s=>s.split(/\s*,\s*/).map(Number),sign=(a,b)=>a<b?'<':a>b?'>':'=';
function fromQuestion(q){
 const s=q.plain,l=q.level,f=q.family,ctx=l+'/'+f;
 if(l===0){
  if(f===0){const [x,y]=parse(s,/между числами (\d+) □ (\d+)/,ctx);return sign(x,y);}
  if(f===1){const [x,y]=parse(s,/число больше: (\d+) или (\d+)/,ctx);return Math.max(x,y);}
  if(f===2){const [x,y]=parse(s,/число меньше: (\d+) или (\d+)/,ctx);return Math.min(x,y);}
  if(f===3){const a=nums(s.match(/по величине: ([\d, ]+)\?/)[1]);assert.equal(a.length,3);return a.sort((x,y)=>x-y)[1];}
  if(f===4){const [x,y]=parse(s,/из чисел (\d+) и (\d+) больше/,ctx);return Math.max(x,y);}
 }
 if(l===1){
  if(f===0){const [x,y]=parse(s,/нужен: (\d+) □ (\d+)/,ctx);return sign(x,y);}
  if(f===1){const m=s.match(/Четыре числа: ([\d, ]+)\./);assert(m);const a=nums(m[1]);assert.equal(a.length,4);assert.equal(new Set(a).size,4);return a.sort((x,y)=>y-x)[1];}
  if(f===2){const [a,b]=parse(s,/строго между (\d+) и (\d+)/,ctx);return b-a-1;}
  if(f===3){const [x,y,delta]=parse(s,/Из двух чисел (\d+) и (\d+) меньшее увеличили на (\d+)/,ctx);return Math.max(Math.max(x,y),Math.min(x,y)+delta);}
  if(f===4){const [h,u,lo,hi]=parse(s,/В числе (\d)□(\d).*строго больше (\d+) и строго меньше (\d+)/,ctx);const valid=Array.from({length:10},(_,d)=>d).filter(d=>100*h+10*d+u>lo&&100*h+10*d+u<hi);assert(valid.length>=1,'No valid digit '+ctx);return Math.min(...valid);}
 }
 if(l===2){
  if(f===0){const m=s.match(/каждую из цифр ([\d, ]+) ровно один раз/);assert(m);const ds=nums(m[1]);assert.equal(ds.length,4);assert.equal(new Set(ds).size,4);return Number(ds.sort((x,y)=>y-x).join(''));}
  if(f===1){const m=s.match(/Из цифр 0, ([\d, ]+) \(каждую используй один раз\)/);assert(m);const ds=nums(m[1]);assert.equal(ds.length,3);assert(ds.every(x=>x>=1&&x<=9));assert.equal(new Set(ds).size,3);ds.sort((x,y)=>x-y);return Number(''+ds[0]+'0'+ds[1]+ds[2]);}
  if(f===2){const [pref,unit,lo,hi]=parse(s,/в числе (\d+)□(\d+), чтобы оно было строго больше (\d+) и строго меньше (\d+)/,ctx);
   return Array.from({length:10},(_,d)=>d).filter(d=>pref*100+10*d+unit>lo&&pref*100+10*d+unit<hi).length;}
  if(f===3){const [lo,down,hi,up]=parse(s,/границу (\d+) уменьшили на (\d+).*границу (\d+) увеличили на (\d+)/,ctx);return hi+up-(lo-down)-1;}
  if(f===4){const [a,b,c,d,up,down]=parse(s,/соответственно (\d+), (\d+), (\d+), (\d+) баллов.*команде А добавили (\d+) баллов, а у команды Б сняли (\d+)/,ctx);
   const scores=[a+up,b-down,c,d];assert.equal(new Set(scores).size,4,'Tied ranks without disambiguation '+ctx);return scores.sort((x,y)=>y-x)[1];}
 }
 throw Error('Unknown question family '+ctx);
}
(async()=>{
 const nav=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
 assert(nav.includes("[6,'Сравнение натуральных чисел',['natural_compare']]"),'§6 navigation ID mismatch');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   let seed=2026111306;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const rows=[],tableDetails={count:0,cellChecks:0};
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<40;trial++){
    qid='g5:natural_compare';blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question('natural_compare'),root=document.createElement('div');root.innerHTML=String(q.text);
    const plain=root.childNodes[0]?.textContent||'';
    const correct=q.choices.find(x=>String(x.key)===String(q.ans));
    const table=root.querySelector('.mk-g5-comparison-table table');
    let drawn=null;
    if(level===0&&family===0||level===1&&family===0){
     if(!table)throw Error('Comparison sign family must show actual place-value table');
     if(!table.querySelector('caption')?.textContent.includes('Разряды'))throw Error('Meaningless place-value heading');
     const headers=[...table.querySelectorAll('thead th')].map(x=>x.textContent.trim());
     const cells=[...table.querySelectorAll('tbody tr')].map(row=>[...row.querySelectorAll('td')].map(x=>Number(x.textContent)));
     if(cells.length!==2||cells[0].length!==cells[1].length)throw Error('Two complete place-value rows required');
     if(cells.some(row=>row.some(d=>!Number.isInteger(d)||d<0||d>9)))throw Error('Non-digit value in the place-value table');
     drawn=cells.map(row=>Number(row.join('')));
     const [a,b]=plain.match(/(\d+) □ (\d+)/).slice(1).map(Number);
     if(drawn[0]!==a||drawn[1]!==b)throw Error('Visible table digits disagree with numbers in question');
     if(headers[0]!=='Число'||headers.length!==cells[0].length+1)throw Error('Missing digit-place column labels');
     tableDetails.count++;tableDetails.cellChecks+=2*cells[0].length;
    }else if(table)throw Error('Off-topic comparison table in non-sign exercise');
    rows.push({level,family,trial,plain,text:String(q.text),ans:String(q.ans),right:String(correct?.label),choices:q.choices.map(x=>({key:String(x.key),label:String(x.label)})),
      meta:q.mk5Pedagogy,audit:q.mk5Audit,template:q.templateId,ex:String(q.ex),drawn});
   }
   renderGrade5();
   return {topics:g5AllTopics().length,rows,tableDetails,navLinks:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="natural_compare"]').length,lesson:String(g5Lesson('natural_compare'))};
  });
  assert.equal(result.topics,74,'Changing topic IDs or count is disallowed');
  assert.equal(result.rows.length,600,'15 topic families × 40 real variants');
  assert.equal(result.navLinks,1,'§6 needs precisely one textbook menu link');
  assert(/возрастанию/.test(result.lesson)&&/убыванию/.test(result.lesson)&&/цифр/.test(result.lesson),'§6 lesson must explain inequalities and ordering');
  const slots=new Map(),variety=new Map(),steps=[[],[],[]],symbolForms=new Set(),equalitySamples=0;
  for(const q of result.rows){
   const ctx=q.level+'/'+q.family+'/'+q.trial,expected=fromQuestion(q),m=q.meta;
   assert(m&&m.id==='natural_compare'&&m.stage===q.level&&m.family===q.family,'Published donor lost topic steps or family metadata '+ctx);
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'No unique correct answer '+ctx);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Duplicate displayed answer '+ctx);
   assert(!/undefined|NaN|Infinity/.test(q.plain+q.ex),'Malformed learner question '+ctx);
   assert.equal(q.right,String(expected),'Independent reading of student question differs from accepted answer '+ctx);
   assert.equal(String(m.expected),String(expected),'Incorrect computed metadata '+ctx);
   if(typeof expected==='string'){
    assert.equal(m.kind,'sign','Wrong comparison answer kind '+ctx);
    assert.deepEqual(new Set(q.choices.map(x=>x.label)),new Set(['<','>','=']),'Comparison must present all three logical signs '+ctx);
    symbolForms.add(expected);
    if(expected==='=')equalitySamples++;
   }else{
    assert(Number.isSafeInteger(expected)&&expected>=0,'Non-natural answer '+ctx);
    assert.equal(m.kind,'number','Wrong numeric answer kind '+ctx);
    assert.equal(q.ans,String(expected),'Wrong numeric answer key '+ctx);
   }
   steps[q.level].push(m.steps);
   const slot=q.level+'/'+q.family;
   if(!slots.has(slot))slots.set(slot,q.template);
   else assert.equal(slots.get(slot),q.template,'Template drift across variants '+ctx);
   const seen=variety.get(slot)||new Set();seen.add(q.plain);variety.set(slot,seen);
  }
  assert.equal(slots.size,15,'Distinct 15 comparison families required');
  assert.equal(new Set(slots.values()).size,15,'Family IDs must not collide between tiers');
  for(const [key,values]of variety)assert(values.size>=5,'Insufficient question variety '+key+': '+values.size);
  assert.deepEqual(symbolForms,new Set(['<','>','=']),'Missing equality or one of the comparison signs');
  assert(equalitySamples>=5,'Equality is almost absent from comparison exercises');
  assert.equal(result.tableDetails.count,80,'Two actual comparison-table families expected at 40 variants each');
  const avg=steps.map(x=>x.reduce((a,b)=>a+b,0)/x.length);
  assert(avg[0]<avg[1]&&avg[1]<avg[2],'Difficulty does not increase '+avg);
  assert.deepEqual(errors,[],'Uncaught browser JS error');
  console.log('G5_SEQUENTIAL_PARAGRAPH_06_PASS '+JSON.stringify({paragraph:6,questions:600,families:15,meanSteps:avg,signs:[...symbolForms],equalitySamples,placeValueTables:result.tableDetails}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_06_FAIL',e.stack||e);process.exit(1)});
