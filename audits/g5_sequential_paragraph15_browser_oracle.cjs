'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
function parseExpression(task,a,b){
 const src=task.split(':').slice(1).join(':').trim().replace(/[.。]$/,'').replace(/−/g,'-').replace(/\s/g,'');
 assert(src,'Empty symbolic task: '+task);
 const tokens=src.match(/\d+|[ab()+\-]/g)||[];
 assert.equal(tokens.join(''),src,'Unsupported operation in task '+task);
 let i=0;
 function factor(){
  const tok=tokens[i++];
  if(tok==='-')return -factor();
  if(tok==='+')return factor();
  if(tok==='('){const v=expression();assert.equal(tokens[i++],')','Missing ) '+task);return v;}
  if(tok==='a')return a;
  if(tok==='b')return b;
  assert(/^\d+$/.test(tok||''),'Bad factor '+tok+' '+task);
  return Number(tok);
 }
 function product(){
  let n=factor();
  while(i<tokens.length&&tokens[i]!==')'&&tokens[i]!=='+'&&tokens[i]!=='-')n*=factor();
  return n;
 }
 function expression(){
  let n=product();
  while(i<tokens.length&&tokens[i]!==')'){
   const op=tokens[i++];assert(op==='+'||op==='-','Bad operator '+op);
   const rhs=product();n+=op==='+'?rhs:-rhs;
  }
  return n;
 }
 const value=expression();assert.equal(i,tokens.length,'Unconsumed input '+task);
 return value;
}
function coeffs(task){
 const c=parseExpression(task,0,0);
 return [parseExpression(task,1,0)-c,parseExpression(task,0,1)-c,c];
}
function printedCoeffs(ex){
 const m=ex.match(/при a — [^;]+ = (-?\d+); при b — [^;]+ = (-?\d+); свободные числа — [^.]+ = (-?\d+)\./);
 assert(m,'No concrete coefficient proof: '+ex);
 return m.slice(1).map(Number);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(()=>{
   let seed=2026111415;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const rows=[];
   for(const topic of ['simplify_expressions','expand_brackets'])
    for(let level=0;level<3;level++)
     for(let family=0;family<5;family++)
      for(let trial=0;trial<40;trial++){
       qid='g5:'+topic;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
       const q=makeG5Question(topic);
       const div=document.createElement('div');div.innerHTML=String(q.text);
       rows.push({topic,level,family,trial,text:div.textContent,answer:q.correctLabel,choices:q.choices.map(x=>x.label),ex:q.ex,meta:q.mk124,source:q.sourceTopicId});
      }
   return {rows,count:g5AllTopics().length};
  });
  assert.equal(data.count,74,'No loss of Grade 5 topics');
  assert.equal(data.rows.length,1200,'Must check 2 × 3 × 5 × 40 live learner questions');
  const diversity=new Map(),steps=[[],[],[]];
  for(const row of data.rows){
   const ctx=row.topic+'/'+row.level+'/'+row.family+'/'+row.trial;
   const expected=coeffs(row.text),m=row.meta;
   assert.equal(row.source,row.topic,'Broken source identity '+ctx);
   assert(m&&m.kind==='symbol'&&m.id===row.topic,'Expected true live symbolic family '+ctx);
   assert.deepEqual(expected,m.expected,'Generator polynomial differs from independently evaluated task '+ctx);
   const normalized=String(row.answer).replace(/−/g,'-').replace(/\s/g,'');
   function fmt(xs){
    const parts=[];['a','b',''].forEach((name,i)=>{
     const v=xs[i];if(!v)return;
     const atom=(name&&Math.abs(v)===1?'':String(Math.abs(v)))+name;
     parts.push((parts.length?(v<0?'-':'+'):(v<0?'-':''))+atom);
    });return parts.join('')||'0';
   }
   assert.equal(normalized,fmt(expected),'Wrong displayed answer '+ctx);
   assert.equal(new Set(row.choices.map(String)).size,row.choices.length,'Duplicate answer choices '+ctx);
   assert.deepEqual(printedCoeffs(row.ex),expected,'Incorrect numeric worked proof '+ctx);
   assert(!/NaN|undefined|Infinity/.test(row.ex),'Invalid explanation '+ctx);
   steps[row.level].push(m.steps);
   const slot=row.topic+'/'+row.level+'/'+row.family;
   if(!diversity.has(slot))diversity.set(slot,new Set());
   diversity.get(slot).add(row.text);
  }
  assert.equal(diversity.size,30,'Missing one of 30 distinct level/family slots');
  for(const [slot,items]of diversity)assert(items.size>=10,'Repeated tasks despite randomized numbers '+slot+': '+items.size);
  const mean=steps.map(v=>v.reduce((a,b)=>a+b,0)/v.length);
  assert(mean[0]<mean[1]&&mean[1]<mean[2],'Difficulty does not grow '+mean);
  assert.deepEqual(errors,[],'Browser execution errors');
  console.log('G5_SEQUENTIAL_PARAGRAPH_15_PASS',JSON.stringify({paragraph:15,questions:data.rows.length,slots:diversity.size,meanSteps:mean}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_15_FAIL',e.stack||e);process.exit(1)});
