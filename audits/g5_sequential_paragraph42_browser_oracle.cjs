'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const topic='dec_compare';
const milli=s=>{const [w,f='']=s.split(',');return BigInt(w)*1000n+BigInt(f.padEnd(3,'0'));};
function solveText(s,options){
 const tokens=s.match(/\d+(?:,[\d□]+)?/g)||[],[a,b]=tokens;
 const cmp=(x,y)=>x<y?'<':x>y?'>':'=';
 if(s.startsWith('Поставь знак'))return ['sign',cmp(milli(a),milli(b)),1];
 if(s.startsWith('Выбери ')||s.startsWith('Упорядочи')){
  const sorted=tokens.map(milli).sort((x,y)=>Number(x-y));
  const i=s.includes('наименьшее')?0:s.includes('наибольшее')?2:1;
  return ['dec',sorted[i],2];
 }
 if(s.startsWith('Какое число строго между')){
  const matches=options.map(milli).filter(x=>milli(a)<x&&x<milli(b));
  assert.equal(matches.length,1,s);
  return ['dec',matches[0],4];
 }
 if(s.startsWith('Какое число равно'))return ['dec',milli(a),2];
 if(s.startsWith('В записи')){
  const below=s.includes('строго меньше');
  const matches=Array.from({length:10},(_,i)=>i).filter(i=>{
   const candidate=milli(a.replace('□',String(i)));
   return below?candidate<milli(b):candidate>milli(b);
  });
  assert(matches.length,s);
  return ['int',BigInt(below?matches.at(-1):matches[0]),4];
 }
 if(s.startsWith('Сколько записей')){
  const value=milli(a),greater=s.includes('строго больше');
  return ['int',BigInt(tokens.slice(1).map(milli).filter(x=>greater?x>value:x===value).length),4];
 }
 throw Error('Unrecognised learner prompt '+s);
}

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(id=>{
   let seed=2026111542;
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
    const task=makeG5Question(id);
    rows.push({tier,slot,text:text(normalize(task.text)),source:task.sourceTopicId,template:task.templateId,
     explanation:text(normalize(task.ex)),answer:task.ans,
     choices:task.choices.map(c=>({key:c.key,label:text(normalize(c.label))}))});
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
  assert.equal(data.count,74);assert.equal(data.rows.length,600);assert.deepEqual(data.screens,[3,4,4]);
  const texts=new Map(),templates=new Set(),depth=[[],[],[]];
  const relations=new Set(),groups=new Map();
  for(const row of data.rows){
   const where=row.tier+'/'+row.slot+' '+row.text;
   assert.equal(row.source,topic,where);
   assert.doesNotMatch(row.text,/округл|вычисли|прибав|вычти/i,where);
   const choices=row.choices.map(c=>c.label);
   const [mode,expected,steps]=solveText(row.text,choices);
   const parse=x=>mode==='sign'?x:mode==='int'?BigInt(x):milli(x);
   const values=choices.map(parse);
   assert.equal(values.length,mode==='sign'?3:4,where);
   assert.equal(new Set(values).size,values.length,where);
   assert.equal(values.filter(x=>x===expected).length,1,where);
   assert.equal(parse(row.choices.find(c=>c.key===row.answer)?.label),expected,where);
   assert(row.explanation.length>20,where);
   if(mode==='sign'){
    relations.add(expected);
    assert(row.explanation.includes('одинаковым числом знаков'),where);
    assert(row.explanation.endsWith(' '+expected+' '+row.text.match(/\d+(?:,\d+)?/g)[1].replace(/(,\d*?[1-9])0+$|,0+$/,'$1')+'.'),where+' '+row.explanation);
   }
   if(mode==='int')assert(row.explanation.endsWith('Ответ: '+expected+'.'),where);
   if(row.tier===2&&(row.slot===1||row.slot===2))assert(values.every(value=>value>=0n&&value<=9n),where);
   if(row.tier===2&&row.slot>=3){
    if(!groups.has(row.slot))groups.set(row.slot,new Set());
    groups.get(row.slot).add(expected);
   }
   const slot=row.tier+'/'+row.slot;
   if(!texts.has(slot))texts.set(slot,new Set());
   texts.get(slot).add(row.text);
   templates.add(row.template);
   depth[row.tier].push(steps);
  }
  assert.equal(templates.size,15);assert.equal(texts.size,15);assert.deepEqual([...relations].sort(),['<','=','>']);
  assert([...groups.values()].every(x=>x.size===2));
  const minimum=Math.min(...[...texts.values()].map(s=>s.size));
  assert(minimum>=10,'Too few variants: '+minimum);
  const means=depth.map(a=>a.reduce((sum,n)=>sum+n,0)/a.length);
  assert(means[0]<means[1]&&means[1]<means[2],String(means));
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_42_PASS '+JSON.stringify({questions:600,families:15,minimum,means,relations:[...relations]}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_42_FAIL',e.stack||e);process.exit(1)});
