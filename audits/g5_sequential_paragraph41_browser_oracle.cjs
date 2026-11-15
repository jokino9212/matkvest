'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const topics=['dec_place','dec_to_common'];
const positions=['десятых','сотых','тысячных'];
const scaled=value=>{const [whole,dec='']=value.split(',');return BigInt(whole)*1000n+BigInt(dec.padEnd(3,'0'));};
const normalize=([a,b])=>{let x=a,y=b;while(y)[x,y]=[y,x%y];return [a/x,b/x];};
const toMilli=([n,d])=>{assert.equal(n*1000n%d,0n);return n*1000n/d;};
const parseAnswer=(s,mode)=>mode==='int'?BigInt(s):mode==='dec'?scaled(s):normalize(s.split('/').map(BigInt)).join('/');
const digitsAt=(s,i)=>BigInt(s.split(',')[1][i]||0);
function solveText(s,topic){
 const data=(s.match(/\d+(?:[\/,]\d+)?/g)||[]);
 const [a,b,c,d]=data;
 const place=positions.findIndex(p=>s.includes('разряде '+p)||s.includes('цифру '+p));
 const fixed=(whole,d1,d2,d3)=>scaled(whole+','+d1+d2+d3);
 if(topic==='dec_place'){
  if(s.startsWith('Какая цифра'))return ['int',digitsAt(a,place),1];
  if(s.startsWith('Сколько тысячных в дробной'))return ['int',scaled(a)%1000n,1];
  if(s.startsWith('Назови целую'))return ['int',BigInt(a.split(',')[0]),1];
  if(s.startsWith('Сколько знаков'))return ['int',BigInt(a.split(',')[1].length),1];
  if(s.startsWith('Сколько тысячных составляют'))return ['int',BigInt(a)*10n,2];
  if(s.startsWith('Запиши число:'))return ['dec',fixed(a,b,c,d),2];
  if(s.includes('заменили на'))return ['dec',scaled(a)+(BigInt(b)-digitsAt(a,place))*10n**BigInt(2-place),2];
  if(s.startsWith('Сколько тысячных во всём'))return ['int',scaled(a),2];
  if(s.startsWith('Запиши десятичную дробь'))return ['dec',BigInt(a),2];
  if(s.startsWith('Запиши число с целой'))return ['dec',fixed(a,b,0,c),2];
  if(s.includes('поменяли местами'))return ['dec',fixed(a.split(',')[0],digitsAt(a,2),digitsAt(a,1),digitsAt(a,0)),3];
  if(s.includes('перенеси цифру'))return ['dec',fixed(a.split(',')[0],b,digitsAt(a,0),digitsAt(a,1)),4];
  if(s.startsWith('Разложи число'))return ['int',scaled(a)/100n*100n,3];
  if(s.includes('на ноль')){
   const factor=10n**BigInt(2-place),value=BigInt(a);
   return ['dec',value-value/factor%10n*factor,3];
  }
  if(s.startsWith('Запиши число из')){
   const rest=BigInt(c);
   return ['dec',fixed(a,b,rest%10n,rest/10n),4];
  }
 }else{
  const R=x=>x.split('/').map(BigInt);
  if(s.startsWith('Приведи'))return ['int',toMilli(R(a)),3];
  if(s.includes('назови цифру десятых'))return ['int',toMilli(R(a))/100n%10n,4];
  if(s.includes('цифра сотых равна нулю'))return ['frac',normalize([fixed(a,b,0,c),1000n]).join('/'),4];
  if(s.includes('одной несократимой'))return ['frac',normalize([fixed(a,b,0,c),1000n]).join('/'),4];
  if(s.includes('несократимой обыкновенной'))return ['frac',normalize([scaled(a),1000n]).join('/'),a.startsWith('0,')?2:3];
  if(s.includes('целых и'))return ['dec',BigInt(a)*1000n+toMilli(R(b)),s.includes('/100 ')?3:4];
  if(s.endsWith('десятичной дробью.'))return ['dec',toMilli(R(a)),[10n,100n,1000n].includes(R(a)[1])?2:3];
 }
 throw Error('Unrecognised prompt '+s);
}

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(topics=>{
   let seed=2026111541;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const normalize=html=>{
    const div=document.createElement('div');div.innerHTML=html;
    for(const f of div.querySelectorAll('.frac'))f.replaceWith(f.querySelector('.num').textContent+'/'+f.querySelector('.den').textContent);
    return div;
   };
   const text=node=>node.textContent.replace(/\s+/g,' ').trim();
   const rows=[];
   for(const id of topics)for(let tier=0;tier<3;tier++)for(let slot=0;slot<5;slot++)for(let sample=0;sample<40;sample++){
    qid='g5:'+id;
    blockSession={kind:'g5quiz',key:qid,stageIndex:tier,done:slot,total:10,usedSignatures:[],items:[],finished:false};
    const task=makeG5Question(id),prompt=normalize(task.text),table=prompt.querySelector('table');
    const cells=table?[...table.querySelectorAll('td')].map(td=>td.textContent):null;
    if(table)table.remove();
    rows.push({id,tier,slot,text:text(prompt),cells,source:task.sourceTopicId,template:task.templateId,
     explanation:text(normalize(task.ex)),answer:task.ans,choices:task.choices.map(c=>({key:c.key,label:text(normalize(c.label))}))});
   }
   const screens=[];
   for(const id of topics)for(let tier=0;tier<3;tier++){
    blockSession=null;qid='';
    startG5QuizStage(id,tier);
    screens.push(document.querySelectorAll('#qstage .answer').length);
    closeModal();
   }
   return {rows,screens,count:g5AllTopics().length};
  },topics);
  assert.equal(data.count,74);assert.equal(data.rows.length,1200);assert(data.screens.length===6&&data.screens.every(n=>n===4));
  const reports=[];
  for(const id of topics){
   const texts=new Map(),templates=new Set(),depth=[[],[],[]];
   let tables=0;
   for(const row of data.rows.filter(q=>q.id===id)){
    const where=id+'/'+row.tier+'/'+row.slot+' '+row.text;
    assert.equal(row.source,id,where);
    const [mode,expected,steps]=solveText(row.text,id);
    assert.equal(row.choices.length,4,where);
    const seen=row.choices.map(c=>parseAnswer(c.label,mode));
    assert.equal(new Set(seen).size,4,where);
    assert.equal(seen.filter(x=>x===expected).length,1,where);
    const checked=row.choices.find(c=>c.key===row.answer);
    assert.equal(parseAnswer(checked.label,mode),expected,where);
    const solution=row.explanation.match(/Ответ: (.+)\.$/);
    assert(solution&&parseAnswer(solution[1],mode)===expected,where+' '+row.explanation);
    if(row.cells){
     assert.equal(id,'dec_place');assert.equal(row.tier,0);assert.equal(row.slot,0);
     const [,whole,rest]=row.text.match(/(\d+),(\d+)/);
     assert.deepEqual(row.cells,[whole,...rest],where);
     tables++;
    }
    const slot=row.tier+'/'+row.slot;
    if(!texts.has(slot))texts.set(slot,new Set());
    texts.get(slot).add(row.text);
    templates.add(row.template);
    depth[row.tier].push(steps);
   }
   assert.equal(templates.size,15);assert.equal(texts.size,15);
   assert.equal(tables,id==='dec_place'?40:0);
   const minimum=Math.min(...[...texts.values()].map(s=>s.size));
   assert(minimum>=8,'Too few variants: '+minimum);
   const means=depth.map(a=>a.reduce((sum,n)=>sum+n,0)/a.length);
   assert(means[0]<means[1]&&means[1]<means[2],String(means));
   reports.push({id,questions:600,families:15,minimum,means,tables});
  }
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_41_PASS '+JSON.stringify(reports));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_41_FAIL',e.stack||e);process.exit(1)});
