'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const topic='frac_restore';

function solveText(s){
 const values=(s.match(/\d+(?:\/\d+)?/g)||[]).map(x=>x.includes('/')?x.split('/').map(BigInt):BigInt(x));
 const [a,b,c,d]=values;
 const whole=(part,[n,den])=>{assert.equal(part*den%n,0n,s);return part*den/n};
 const rest=(value,[n,den])=>whole(value,[den-n,den]);
 const portion=(value,[n,den])=>{assert.equal(value*n%den,0n,s);return value*n/den};
 const distance=(x,y)=>x>y?x-y:y-x;
 if(s.startsWith('Половина школьного'))return [2n*a,1];
 if(s.includes('длины ленты равна'))return [whole(b,a),1];
 if(s.startsWith('На ')&&s.includes('деревьев'))return [b/a[0],1];
 if(s.startsWith('Из ')&&s.includes('равных долей запаса'))return [whole(c,[a-b,a]),3];
 if(s.startsWith('После продажи'))return [rest(b,a),3];
 if(s.startsWith('До склада'))return [whole(a,b)-a-c,4];
 if(s.includes('массы одного мешка'))return [whole(b,a)*c,3];
 if(s.includes('После пополнения'))return [whole(b,a)+c,3];
 if(s.startsWith('От катушки'))return [rest(b+c,a),4];
 if(s.startsWith('Для первой партии'))return [whole(b,a)+whole(d,c),5];
 if(s.startsWith('Из первого бака'))return [distance(rest(b,a),rest(d,c)),7];
 if(s.includes('Другую партию сделали'))return [portion(whole(b,a)+c,d),5];
 if(s.startsWith('Из целого вычли')){
  const value=rest(b,a);return [value+c-portion(value,d),6];
 }
 if(s.includes('этого числа'))return [portion(whole(b,a),c),3];
 if(s.includes('Найди целое'))return [whole(b,a),2];
 throw Error('Unrecognised learner prompt: '+s);
}

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(id=>{
   let seed=2026111540;
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
   assert(/[·:]/.test(row.explanation)&&row.explanation.endsWith('Ответ: '+answer+'.'),where);
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
  assert(minimum>=10,'Too few variants: '+minimum);
  const means=depth.map(a=>a.reduce((sum,n)=>sum+n,0)/a.length);
  assert(means[0]<means[1]&&means[1]<means[2],String(means));
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_40_PASS '+JSON.stringify({questions:600,families:15,minimum,means,diagrams}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_40_FAIL',e.stack||e);process.exit(1)});
