'use strict';
// Solve the displayed problems using integer arithmetic without reading generator plans.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const topic='frac_div_common';
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
 const tokens=text.trim().match(/\d+(?:\/\d+)?|[()+−·:]/g);
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
  while(tokens[at]==='·'||tokens[at]===':'){
   const op=tokens[at++],right=atom();
   value=op==='·'?rational(value[0]*right[0],value[1]*right[1]):rational(value[0]*right[1],value[1]*right[0]);
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
 const arithmetic=text.match(/^Вычисли (.+)\.$/);
 if(arithmetic)return expression(arithmetic[1]);
 const strips=text.match(/^Ленту длиной (\d+\/\d+) м разрезали на куски по (\d+\/\d+) м/);
 if(strips)return expression(strips[1]+' : '+strips[2]);
 const packet=text.match(/^Материал массой (\d+) кг расфасовали поровну в (\d+) контейнеров\. Масса одной порции другого материала — (\d+\/\d+) кг/);
 assert(packet,'Unexpected problem '+text);
 return expression(packet[1]+' : '+packet[2]+' : '+packet[3]);
}

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(id=>{
   let seed=2026111539;
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
    const cells=svg?[...svg.querySelectorAll('rect[fill]:not([fill=none])')].map(cell=>({
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
  let diagrams=0;
  for(const row of data.rows){
   const where=row.tier+'/'+row.slot+' '+row.text;
   assert.equal(row.source,topic,where);
   assert.doesNotMatch(row.text,/NaN|undefined|Infinity/);
   const {value,operations}=solveText(row.text),answer=key(value);
   assert(value[0]>=0n,where);
   assert.equal(row.choices.length,4,where);
   const options=row.choices.map(c=>key(expression(c.label).value));
   assert.equal(new Set(options).size,4,where);
   assert.equal(options.filter(c=>c===answer).length,1,where);
   assert.equal(row.choices.find(c=>c.key===row.answer)?.label,answer,where);
   assert(row.explanation.includes(' : ')&&row.explanation.includes(' · ')&&row.explanation.endsWith('Ответ: '+answer+'.'),where);
   if(row.cells){
    assert.equal(row.tier,0);assert.equal(row.slot,3);
    const [[,length,den1],[,piece,den2]]=[...row.text.matchAll(/(\d+)\/(\d+)/g)].map(m=>m.map(Number));
    assert.equal(den1,den2,where);
    assert.equal(row.cells.length,length/piece,where);
    const width=390*piece/length;
    row.cells.forEach(({x,y,w,h,fill},i)=>{
     assert(Math.abs(w-width)<.001&&Math.abs(x-(5+i*width))<.001,where);
     assert.equal(y,8);assert.equal(h,27);
     assert.equal(fill,i%2?'#c4ddf5':'#397dbe',where);
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
  assert(integers.has('0')&&integers.size>=5);assert.equal(diagrams,40);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_39_PASS '+JSON.stringify({questions:600,families:15,minimum,means,diagrams}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_39_FAIL',e.stack||e);process.exit(1)});
