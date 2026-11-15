'use strict';
// Solve the displayed problems using integer arithmetic without reading generator plans.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const topic='frac_mul_common';
const abs=n=>n<0n?-n:n;
function rational(n,d=1n){
 assert(d>0n);
 let a=abs(n),b=d;
 while(b)[a,b]=[b,a%b];
 return [n/a,d/a];
}
const plus=(a,b,op='+')=>rational(a[0]*b[1]+(op==='+'?1n:-1n)*b[0]*a[1],a[1]*b[1]);
const key=([n,d])=>d===1n?String(n):n+'/'+d;

function expression(text){
 const tokens=text.trim().match(/\d+(?:\/\d+)?|[()+−·]/g);
 assert(tokens&&tokens.join('')===text.replace(/\s/g,''),'Unrecognised expression '+text);
 let at=0,operations=0;
 function atom(){
  const token=tokens[at++];
  if(token==='('){
   const value=expr();
   assert.equal(tokens[at++],')');
   return value;
  }
  assert(/^\d+(?:\/\d+)?$/.test(token),'Expected a visible number '+token);
  return rational(...token.split('/').map(BigInt));
 }
 function term(){
  let value=atom();
  while(tokens[at]==='·'){
   at++;
   const right=atom();
   value=rational(value[0]*right[0],value[1]*right[1]);
   operations++;
  }
  return value;
 }
 function expr(){
  let value=term();
  while(tokens[at]==='+'||tokens[at]==='−'){
   const op=tokens[at++];
   value=plus(value,term(),op);
   operations++;
  }
  return value;
 }
 const value=expr();
 assert.equal(at,tokens.length);
 return {value,operations};
}

function solveText(text){
 const arithmetic=text.match(/^(?:Вычисли |Сократи перед умножением и вычисли )(.+)\.$/);
 if(arithmetic)return expression(arithmetic[1]);
 assert.match(text,/^Стороны прямоугольника равны/);
 const pairs=[...text.matchAll(/(\d+)\/(\d+) м/g)].map(m=>rational(BigInt(m[1]),BigInt(m[2])));
 let [a,b,c]=pairs,operations=1;
 assert(a&&b);
 if(text.includes('К первой стороне прибавили')){
  assert(c);a=plus(a,c);operations++;
 }else if(text.includes('Каждую сторону увеличили')){
  assert(c);a=plus(a,c);b=plus(b,c);operations+=2;
 }else assert.equal(pairs.length,2);
 return {value:rational(a[0]*b[0],a[1]*b[1]),operations};
}

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(id=>{
   let seed=2026111537;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const normalize=html=>{
    const div=document.createElement('div');div.innerHTML=html;
    for(const f of div.querySelectorAll('.frac'))f.replaceWith(f.querySelector('.num').textContent+'/'+f.querySelector('.den').textContent);
    return div;
   };
   const text=node=>node.textContent.replace(/\s+/g,' ').trim();
   const rows=[];
   for(let tier=0;tier<3;tier++)for(let slot=0;slot<5;slot++)for(let sample=0;sample<40;sample++){
    qid='g5:'+id;
    blockSession={kind:'g5quiz',key:qid,stageIndex:tier,done:slot,total:10,usedSignatures:[],items:[],finished:false};
    const task=makeG5Question(id),prompt=normalize(task.text),svg=prompt.querySelector('svg');
    const cells=svg?[...svg.querySelectorAll('rect')].map(cell=>({
     x:+cell.getAttribute('x'),y:+cell.getAttribute('y'),
     w:+cell.getAttribute('width'),h:+cell.getAttribute('height'),fill:cell.getAttribute('fill')
    })):null;
    if(svg)svg.remove();
    rows.push({tier,slot,text:text(prompt),cells,source:task.sourceTopicId,template:task.templateId,
     explanation:text(normalize(task.ex)),answer:task.ans,choices:task.choices.map(c=>({key:c.key,label:text(normalize(c.label))}))});
   }
   const screens=[];
   for(let tier=0;tier<3;tier++){
    blockSession=null;qid='';
    startG5QuizStage(id,tier);
    screens.push(document.querySelectorAll('#qstage .answer').length);
    closeModal();
   }
   return {rows,screens,count:g5AllTopics().length};
  },topic);
  assert.equal(data.count,74);
  assert.equal(data.rows.length,600);
  assert.deepEqual(data.screens,[4,4,4]);
  const texts=new Map(),templates=new Set(),depth=[[],[],[]],integers=new Set();
  let diagrams=0,cancellations=0;
  for(const row of data.rows){
   const where=row.tier+'/'+row.slot+' '+row.text;
   assert.equal(row.source,topic,where);
   assert.doesNotMatch(row.text,/NaN|undefined|Infinity|раздели|половину/);
   const {value,operations}=solveText(row.text),answer=key(value);
   assert(value[0]>0n,where);
   assert.equal(row.choices.length,4,where);
   const options=row.choices.map(c=>key(expression(c.label).value));
   assert.equal(new Set(options).size,4,where);
   assert.equal(options.filter(c=>c===answer).length,1,where);
   assert.equal(row.choices.find(c=>c.key===row.answer)?.label,answer,where);
   assert(row.explanation.includes('Умножаем')&&row.explanation.endsWith('Ответ: '+answer+'.'),where);
   if(row.tier===0&&row.slot===3){
    assert(row.explanation.includes('Перед умножением сокращаем'),where);
    cancellations++;
   }
   if(row.cells){
    assert.equal(row.tier,0);assert.equal(row.slot,0);
    const [[,a,d],[,b,e]]=[...row.text.matchAll(/(\d+)\/(\d+)/g)].map(m=>m.map(Number));
    assert.equal(row.cells.length,d*e,where);
    assert.equal(row.cells.filter(c=>c.fill==='#397dbe').length,a*b,where);
    row.cells.forEach(({x,y,w,h,fill},i)=>{
     const col=i%d,line=Math.floor(i/d);
     assert(Math.abs(w-390/d)<.001&&Math.abs(h-132/e)<.001,where);
     assert(Math.abs(x-(5+col*390/d))<.001&&Math.abs(y-(5+line*132/e))<.001,where);
     assert.equal(fill,col<a&&line<b?'#397dbe':col<a||line<b?'#c4ddf5':'#edf3fc',where);
    });
    diagrams++;
   }
   if(value[1]===1n)integers.add(answer);
   const slot=row.tier+'/'+row.slot;
   if(!texts.has(slot))texts.set(slot,new Set());
   texts.get(slot).add(row.text);
   templates.add(row.template);
   depth[row.tier].push(operations);
  }
  assert.equal(templates.size,15);assert.equal(texts.size,15);
  const minimum=Math.min(...[...texts.values()].map(s=>s.size));
  assert(minimum>=15,'Too few variants: '+minimum);
  const means=depth.map(a=>a.reduce((sum,n)=>sum+n,0)/a.length);
  assert(means[0]<means[1]&&means[1]<means[2],String(means));
  assert(integers.size>=5);assert.equal(diagrams,40);assert.equal(cancellations,40);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_37_PASS '+JSON.stringify({questions:600,families:15,minimum,means,diagrams,cancellations}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_37_FAIL',e.stack||e);process.exit(1)});
