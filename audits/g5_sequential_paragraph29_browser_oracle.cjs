'use strict';
// §29 exact independent oracle: parse the fractions and expression VISIBLE to learners,
// never use q.mk115/q.ans/q.correctLabel/q.answerRat to calculate the result.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const IDS=['frac_add','frac_sub'];
const gcd=(x,y)=>{x=x<0n?-x:x;y=y<0n?-y:y;while(y){[x,y]=[y,x%y]}return x};
const frac=(a,b)=>{assert(b!==0n);if(b<0n){a=-a;b=-b}const g=gcd(a,b);return {n:a/g,d:b/g}};
const plus=(x,y)=>frac(x.n*y.d+y.n*x.d,x.d*y.d);
const minus=(x,y)=>frac(x.n*y.d-y.n*x.d,x.d*y.d);
function solveExpression(expr){
 const raw=expr.replace(/\s+/g,'');
 const tokens=raw.match(/\d+\/\d+|[()+−-]/g);
 assert(tokens&&tokens.join('')===raw,'Unrecognised learner expression: '+expr);
 let at=0,operations=0;
 function atom(){
  const next=tokens[at++];
  assert(next,'Missing expression term '+expr);
  if(next==='('){const value=addition();assert.equal(tokens[at++],')','Missing closing parenthesis '+expr);return value}
  assert(/^\d+\/\d+$/.test(next),'Not a visible fraction '+next+' in '+expr);
  const [n,d]=next.split('/').map(BigInt);return frac(n,d);
 }
 function addition(){
  let value=atom();
  while(tokens[at]==='+'||tokens[at]==='−'||tokens[at]==='-'){
   const op=tokens[at++];operations++;
   value=op==='+'?plus(value,atom()):minus(value,atom());
  }
  return value;
 }
 const result=addition();
 assert.equal(at,tokens.length,'Expression was not fully consumed: '+expr);
 assert(result.n>=0n,'Negative total outside §29 learning sequence '+expr);
 const d=[...expr.matchAll(/\d+\/(\d+)/g)].map(m=>BigInt(m[1]));
 assert(d.length>=2,'Not enough source fractions '+expr);
 assert(d.every(x=>x===d[0]),'Different denominators leaked into same-denominator topic '+expr);
 const numerator=(result.n*d[0])/result.d;
 assert.equal(numerator*result.d,result.n*d[0],'Fraction result not expressible with original denominator '+expr);
 return {numerator,d:d[0],result,operations};
}
function independentlySolve(q){
 const m=q.text.match(/(?:Вычисли|Найди числитель результата):\s*([0-9\s\/()+−-]+)\./);
 assert(m,'No visible math expression to solve '+q.ctx+': '+q.text);
 const exp=solveExpression(m[1]);
 const chosen=q.choices.find(x=>x.key===q.ans);
 assert(chosen,'No correct option '+q.ctx);
 if(q.text.includes('Найди числитель результата:')){
  assert.equal(chosen.label,exp.numerator.toString(),'Incorrect independent numerator '+q.ctx+' '+q.text);
 }else{
  const a=chosen.label.match(/^(\d+)\s*\/\s*(\d+)$/);
  assert(a,'Missing actual fraction shown in the correct option '+q.ctx+': '+chosen.label);
  assert.equal(BigInt(a[2]),exp.d,'Fraction denominator changed against instructions '+q.ctx);
  assert.equal(BigInt(a[1]),exp.numerator,'Wrong independent fraction numerator '+q.ctx+': '+q.text);
 }
 return exp;
}
function auditSvg(q){
 if(!q.diagram)return false;
 assert.equal(q.level,0,'Diagram inserted in wrong difficulty '+q.ctx);
 assert([0,3].includes(q.family),'Diagram inserted in wrong visual family '+q.ctx);
 const g=q.diagram;
 const expr=q.text.match(/(?:Вычисли|Найди числитель результата):\s*([0-9\s\/()+−-]+)\./);
 assert(expr,'Visual model without mathematical expression '+q.ctx);
 const source=[...expr[1].matchAll(/(\d+)\/(\d+)/g)].map(m=>({n:+m[1],d:+m[2]}));
 assert.equal(source.length,2,'Visual exercise must contain two source fractions '+q.ctx);
 const [a,b]=source,expected=q.id==='frac_add'?[a.n,b.n,a.n+b.n]:[a.n,b.n,a.n-b.n];
 assert.equal(g.rows.length,3,'Must show first, second, and result whole '+q.ctx);
 assert(g.aria.includes('разделено на '+a.d+' равных частей'),'Accessible denominator wrong '+q.ctx);
 for(let row=0;row<3;row++){
  const r=g.rows[row];
  assert.equal(r.borderWidth,468,'Whole strip length differs '+q.ctx);
  assert.equal(r.cells.length,a.d,'Incorrect number of equal shares '+q.ctx);
  assert.equal(r.cells.filter(x=>x.filled).length,expected[row],'Shading disagrees with learner math '+q.ctx);
  for(let i=0;i<r.cells.length;i++){
   assert(Math.abs(r.cells[i].width-468/a.d)<0.002,'Unequal fraction part widths '+q.ctx);
   if(i)assert(Math.abs(r.cells[i].x-r.cells[i-1].x-r.cells[i-1].width)<0.005,
     'Detached tiles instead of one continuous whole '+q.ctx);
  }
 }
 return true;
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(ids=>{
   let seed=2026111529;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   function read(html,stripSvg=false){
    const root=document.createElement('div');root.innerHTML=String(html);
    for(const el of [...root.querySelectorAll('.frac')]){
     const n=el.querySelector('.num')?.textContent?.trim();
     const d=el.querySelector('.den')?.textContent?.trim();
     if(n!==undefined&&d!==undefined)el.replaceWith(document.createTextNode(n+'/'+d));
    }
    if(stripSvg)root.querySelectorAll('svg').forEach(svg=>svg.remove());
    return root.textContent.replace(/\s+/g,' ').trim();
   }
   const rows=[];
   for(const id of ids)for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let repeat=0;repeat<40;repeat++){
    blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:family,total:10,
     usedSignatures:[],items:[],finished:false};qid='g5:'+id;
    const q=makeG5Question(id),node=document.createElement('div');node.innerHTML=q.text;
    const svg=node.querySelector('svg.mk-g5-fraction-operation');
    let diagram=null;
    if(svg){
     const all=[...svg.querySelectorAll('rect')],rows=[8,53,98].map(y=>{
      const squares=all.filter(r=>Number(r.getAttribute('y'))===y);
      const border=squares.find(r=>r.getAttribute('fill')==='none');
      return {borderWidth:Number(border?.getAttribute('width')),
       cells:squares.filter(r=>r.getAttribute('fill')!=='none').map(r=>({
        x:Number(r.getAttribute('x')),width:Number(r.getAttribute('width')),
        filled:r.getAttribute('fill')==='#5d9cdc'||r.getAttribute('fill')==='#f4ad64'
       }))};
     });
     diagram={rows,aria:String(svg.getAttribute('aria-label'))};
    }
    rows.push({id,level,family,repeat,ctx:id+'/'+level+'/'+family+'/'+repeat,
     text:read(q.text,true),ex:read(q.ex,true),
     choices:q.choices.map(c=>({key:String(c.key),label:read(c.label)})),
     ans:String(q.ans),template:q.templateId,source:q.sourceTopicId,diagram});
   }
   return {rows,topics:g5AllTopics().length,lessons:ids.map(id=>g5Lesson(id))};
  },IDS);
  assert.equal(result.topics,74,'Other Grade 5 topics disappeared');
  assert.equal(result.rows.length,1200,'Wrong sample count');
  const sets=new Map(),familyIds=new Set(),tierOps=[[],[],[]],count={frac_add:0,frac_sub:0};
  let pictured=0,numeric=0,fraction=0;
  for(const q of result.rows){
   assert(q.template&&q.source===q.id,'Wrong live generator '+q.ctx);
   assert(q.ex&&q.text,'Empty learner prompt or explanation '+q.ctx);
   assert(!/undefined|NaN|Infinity/.test(q.text+' '+q.ex),'Corrupt learner content '+q.ctx);
   assert(q.choices.length>=3,'Missing answers '+q.ctx);
   assert.equal(q.choices.filter(c=>c.key===q.ans).length,1,'No unique correct key '+q.ctx);
   assert.equal(new Set(q.choices.map(c=>c.label)).size,q.choices.length,'Ambiguous displayed options '+q.ctx);
   const math=independentlySolve(q);tierOps[q.level].push(math.operations);
   if(q.text.includes('Найди числитель результата:'))numeric++;else fraction++;
   if(auditSvg(q))pictured++;
   const key=q.id+'/'+q.level+'/'+q.family;
   if(!sets.has(key))sets.set(key,new Set());
   sets.get(key).add(q.text);
   familyIds.add(q.template);count[q.id]++;
  }
  assert.equal(sets.size,30,'Not 30 graded task slots');
  assert.equal(familyIds.size,30,'Cognitive family IDs not distinct');
  for(const [slot,variants]of sets)assert(variants.size>=10,'Only '+variants.size+' distinct tasks in '+slot);
  assert.deepEqual(count,{frac_add:600,frac_sub:600});
  assert.equal(pictured,160,'Missing 160 real three-whole visual models');
  const mean=tierOps.map(arr=>arr.reduce((a,b)=>a+b,0)/arr.length);
  assert(mean[0]<mean[1]&&mean[1]<mean[2],'Difficulty not genuinely increasing '+mean);
  assert.deepEqual(errors,[],'Uncaught browser error');
  console.log('G5_SEQUENTIAL_PARAGRAPH_29_PASS '+JSON.stringify({
   tasks:result.rows.length,families:sets.size,pictured,numeric,fraction,
   meanArithmeticOperations:mean,perTopic:count}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_29_FAIL',e.stack||e);process.exit(1)});
