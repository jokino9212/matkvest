'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const topic='frac_part_number';

function solveText(s){
 const values=(s.match(/\d+(?:\/\d+)?/g)||[]).map(x=>x.includes('/')?x.split('/').map(BigInt):BigInt(x));
 const [a,b,c,d,e]=values;
 const share=(whole,[n,den])=>{assert.equal(whole*n%den,0n,s);return whole*n/den};
 const distance=(x,y)=>x>y?x-y:y-x;
 if(s.startsWith('Найди половину'))return [a/2n,1];
 if(s.startsWith('Найди ')&&s.includes('Сложи результаты'))return [share(b,a)+share(d,c),5];
 if(s.startsWith('Найди '))return [share(b,a),2];
 if(s.startsWith('В школьной библиотеке'))return [a-share(a,b),3];
 if(s.startsWith('Разделили'))return [share(a,[1n,b]),1];
 if(s.startsWith('Сравни две части'))return [share(a,c)-share(a,b),5];
 if(s.startsWith('Из ')&&s.includes('игрушек'))return [a-share(a,b)-c,4];
 if(s.startsWith('На склад'))return [distance(a-share(a,b),share(a,b)),4];
 if(s.startsWith('Первый день'))return [share(b-share(b,a),c),4];
 if(s.startsWith('У двух мастерских'))return [distance(share(a,b),share(a,c)),5];
 if(s.startsWith('Из ')&&s.includes('л воды')){const left=a-share(a,b);return [left-share(left,c),6];}
 if(s.startsWith('Было ')&&s.includes('кг крупы')){const first=share(a,b);return [first+share(a-first,c),6];}
 if(s.startsWith('В первом рейсе'))return [a-share(a,c)+b-share(b,d),7];
 if(s.startsWith('Из первой партии'))return [share(a,b)+share(c,d),5];
 if(s.startsWith('В ёмкости'))return [distance(share(a,b),share(a+c,d)),6];
 throw Error('Unrecognised learner prompt: '+s+' '+e);
}

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(id=>{
   let seed=2026111538;
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
     x:+cell.getAttribute('x'),w:+cell.getAttribute('width'),fill:cell.getAttribute('fill')
    })):null;
    if(svg)svg.remove();
    rows.push({tier,slot,text:text(prompt),cells,source:task.sourceTopicId,template:task.templateId,
     explanation:text(normalize(task.ex)),answer:task.ans,choices:task.choices});
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
  assert.equal(data.count,74);assert.equal(data.rows.length,600);assert.deepEqual(data.screens,[4,4,4]);
  const texts=new Map(),templates=new Set(),depth=[[],[],[]];
  let diagrams=0;
  for(const row of data.rows){
   const where=row.tier+'/'+row.slot+' '+row.text;
   assert.equal(row.source,topic,where);
   const [value,steps]=solveText(row.text),answer=String(value);
   assert(value>=0n,where);
   assert.equal(row.choices.length,4,where);
   const choices=row.choices.map(c=>c.label);
   assert(choices.every(label=>/^\d+$/.test(label)),where);
   assert.equal(new Set(choices).size,4,where);
   assert.equal(row.choices.find(c=>c.key===row.answer)?.label,answer,where);
   assert(row.explanation.includes(' : ')&&row.explanation.endsWith('Ответ: '+answer+'.'),where);
   if(row.cells){
    assert.equal(row.tier,0);assert.equal(row.slot,0);
    const [,a,d]=row.text.match(/(\d+)\/(\d+)/).map(Number);
    assert.equal(row.cells.length,d,where);
    row.cells.forEach(({x,w,fill},i)=>{
     assert(Math.abs(w-390/d)<.001&&Math.abs(x-(5+i*390/d))<.001,where);
     assert.equal(fill,i<a?'#397dbe':'#edf3fc',where);
    });
    diagrams++;
   }
   const slot=row.tier+'/'+row.slot;
   if(!texts.has(slot))texts.set(slot,new Set());
   texts.get(slot).add(row.text);
   templates.add(row.template);
   depth[row.tier].push(steps);
  }
  assert.equal(templates.size,15);assert.equal(texts.size,15);assert.equal(diagrams,40);
  const minimum=Math.min(...[...texts.values()].map(s=>s.size));
  assert(minimum>=15,'Too few variants: '+minimum);
  const means=depth.map(a=>a.reduce((sum,n)=>sum+n,0)/a.length);
  assert(means[0]<means[1]&&means[1]<means[2],String(means));
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_38_PASS '+JSON.stringify({questions:600,families:15,minimum,means,diagrams}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_38_FAIL',e.stack||e);process.exit(1)});
