'use strict';
// Solve the displayed problems using integer arithmetic without reading generator plans.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const topics=['frac_compare_diff','frac_add_diff','frac_sub_diff'];
const abs=n=>n<0n?-n:n;
function rational(n,d=1n){
 assert(d>0n);
 let a=abs(n),b=d;
 while(b)[a,b]=[b,a%b];
 return [n/a,d/a];
}
const plus=(a,b,op='+')=>rational(a[0]*b[1]+(op==='+'?1n:-1n)*b[0]*a[1],a[1]*b[1]);
const order=(a,b)=>a[0]*b[1]-b[0]*a[1];
const key=([n,d])=>d===1n?String(n):n+'/'+d;

function expression(text){
 const tokens=text.trim().match(/\d+(?:\/\d+)?|[()+−]/g);
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
 function expr(){
  let value=atom();
  while(tokens[at]==='+'||tokens[at]==='−'){
   const op=tokens[at++];
   value=plus(value,atom(),op);
   operations++;
  }
  return value;
 }
 const value=expr();
 assert.equal(at,tokens.length);
 return {value,operations};
}

function solveText(text){
 if(text.startsWith('Поставь знак: ')){
  const xs=text.slice('Поставь знак: '.length,-1).split(' □ ').map(expression);
  assert.equal(xs.length,2);
  const delta=order(xs[0].value,xs[1].value);
  return {answer:delta<0n?'<':delta>0n?'>':'=',operations:1+xs[0].operations+xs[1].operations};
 }
 if(text.startsWith('Вычисли ')){
  const {value,operations}=expression(text.slice('Вычисли '.length,-1));
  return {answer:key(value),operations};
 }
 const fractions=(text.match(/\d+\/\d+|\b\d+\b/g)||[]).map(s=>expression(s).value);
 const [a,b,c,d]=fractions;
 const sum=()=>fractions.reduce((x,y)=>plus(x,y));
 let value,operations;
 if(/^Найди на(ибольшую|именьшую) из дробей/.test(text)){
  assert.equal(fractions.length,3);
  const sorted=fractions.sort((x,y)=>Number(order(x,y)));
  value=sorted[text.includes('наибольшую')?2:0];operations=2;
 }else if(/^(До обеда прошли|В кувшин налили|Кабель составили)/.test(text)){
  assert.equal(fractions.length,text.startsWith('До обеда')?2:text.startsWith('В кувшин')?3:5);
  value=sum();operations=fractions.length-1;
 }else if(text.startsWith('Было ')&&text.includes('ткани, отрезали')){
  assert.equal(fractions.length,2);
  value=plus(a,b,'−');operations=1;
 }else if(text.startsWith('На сколько отличаются доли')){
  assert.equal(fractions.length,2);
  const [n,den]=plus(a,b,'−');value=[abs(n),den];operations=2;
 }else if(text.startsWith('В канистре было ')&&text.includes('затем долили')){
  assert.equal(fractions.length,3);
  value=plus(plus(a,b,'−'),c);operations=2;
 }else if(text.startsWith('Первый маршрут состоит из участков')){
  assert.equal(fractions.length,4);
  const [n,den]=plus(plus(a,b),plus(c,d),'−');value=[abs(n),den];operations=4;
 }else throw Error('Unrecognised problem '+text);
 assert(value[0]>=0n,'Negative story result');
 return {answer:key(value),operations};
}

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(topics=>{
   let seed=2026111536;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   function read(html){
    const node=document.createElement('div');
    node.innerHTML=html;
    for(const f of [...node.querySelectorAll('.frac')]){
     f.replaceWith(document.createTextNode(f.querySelector('.num').textContent+'/'+f.querySelector('.den').textContent));
    }
    return node;
   }
   const text=node=>node.textContent.replace(/\s+/g,' ').trim();
   const rows=[];
   for(const id of topics)for(let tier=0;tier<3;tier++)for(let slot=0;slot<5;slot++)for(let i=0;i<40;i++){
    qid='g5:'+id;
    blockSession={kind:'g5quiz',key:qid,stageIndex:tier,done:slot,total:10,usedSignatures:[],items:[],finished:false};
    const question=makeG5Question(id),prompt=read(question.text);
    const svg=prompt.querySelector('svg');
    const bars=svg?[...svg.querySelectorAll('g')].map(group=>[...group.querySelectorAll('rect')].map(rect=>({
     x:Number(rect.getAttribute('x')),w:Number(rect.getAttribute('width')),fill:rect.getAttribute('fill')
    }))):null;
    if(svg)svg.remove();
    rows.push({id,tier,slot,text:text(prompt),bars,template:question.templateId,source:question.sourceTopicId,
     answer:question.ans,ex:text(read(question.ex)),choices:question.choices.map(c=>({label:text(read(c.label)),key:c.key}))});
   }
   const visible=[];
   for(const id of topics)for(let tier=0;tier<3;tier++){
    blockSession=null;qid='';
    startG5QuizStage(id,tier);
    const view=document.getElementById('qstage');
    visible.push({id,tier,text:view.querySelector('.quizq').textContent,options:[...view.querySelectorAll('.answer')].map(button=>text(button))});
    closeModal();
   }
   return {rows,visible,count:g5AllTopics().length};
  },topics);
  assert.equal(data.count,74);
  assert.equal(data.rows.length,1800);
  assert(data.visible.every(stage=>stage.text.trim()&&stage.options.length>=3&&stage.options.every(Boolean)),'Missing quiz in a live stage');
  const reports=[];
  for(const id of topics){
   const rows=data.rows.filter(q=>q.id===id),slots=new Map(),templates=new Set(),depth=[[],[],[]];
   let illustrations=0;
   const signs=new Set(),integers=new Set();
   for(const q of rows){
    const {text,tier,slot}=q,where=id+'/'+tier+'/'+slot+' '+text;
    assert.equal(q.source,id,where);
    assert(q.ex.includes('Разложим знаменатели')&&q.ex.includes('Дополнительные множители'),where+' solution: '+q.ex);
    assert(!/NaN|undefined|Infinity/.test(text+' '+q.ex),where);
    assert(!/[·×÷]/.test(text),where);
    const {answer,operations}=solveText(text);
    const options=q.choices.map(c=>c.label);
    assert.equal(new Set(options).size,options.length,where);
    assert.equal(options.filter(x=>x===answer).length,1,where+' expected '+answer);
    assert.equal(q.choices.find(c=>c.key===q.answer)?.label,answer,where);
    assert(q.ex.endsWith('Ответ: '+answer+'.'),where+' solution and prompt differ');
    if(q.bars){
     illustrations++;
     assert.equal(tier,0);assert.equal(slot,0);
     const [a,b]=[...text.matchAll(/(\d+)\/(\d+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
     const den=b[1],left=a[0]*den/a[1],right=b[0];
     const expected=id===topics[0]?[left,right]:[left,right,id===topics[1]?left+right:left-right];
     assert.equal(q.bars.length,expected.length);
     for(const [i,parts] of q.bars.entries()){
      const whole=parts.pop();
      assert.equal(whole.w,456);assert.equal(whole.x,12);assert.equal(parts.length,den);
      assert.equal(parts.filter(v=>v.fill==='#5d9cdc').length,expected[i]);
      parts.forEach((v,j)=>{
       assert(Math.abs(v.w-456/den)<.001,where);
       assert(Math.abs(v.x-(12+j*456/den))<.001,where);
       assert.equal(v.fill,j<expected[i]?'#5d9cdc':'#edf3fc',where);
      });
     }
    }
    if(/[<=>]/.test(answer))signs.add(answer);
    else if(/^\d+$/.test(answer))integers.add(answer);
    const slotKey=tier+'/'+slot;
    if(!slots.has(slotKey))slots.set(slotKey,new Set());
    slots.get(slotKey).add(text);
    templates.add(q.template);
    depth[tier].push(operations);
   }
   const means=depth.map(xs=>xs.reduce((x,y)=>x+y,0)/xs.length);
   assert(means[0]<means[1]&&means[1]<means[2],id+' '+means);
   assert.equal(templates.size,15);assert.equal(slots.size,15);
   const minimum=Math.min(...[...slots.values()].map(s=>s.size));
   assert(minimum>=10,id+' too few variants '+minimum);
   assert.equal(illustrations,40);
   if(id===topics[0])assert.deepEqual([...signs].sort(),['<','=','>']);
   if(id===topics[1])assert(integers.has('1'));
   if(id===topics[2])assert(integers.has('0'));
   reports.push({id,questions:rows.length,families:templates.size,minimum,means,illustrations});
  }
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_36_PASS '+JSON.stringify(reports));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_36_FAIL',e.stack||e);process.exit(1)});
