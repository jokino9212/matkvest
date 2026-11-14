'use strict';
// §33 independent browser oracle: answers are computed ONLY from visible student wording,
// not mk129.plan/expected, q.ans, or the generator's own calculation.
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const ID='frac_equal';
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b]}return a};
const frac=(a,b=1n)=>{a=BigInt(a);b=BigInt(b);assert(b>0n);const g=gcd(a,b);return {n:a/g,d:b/g}};
const parse=(s)=>{if(/^\d+$/.test(s))return {kind:'int',value:frac(s)};const m=s.match(/^(\d+)\s*\/\s*(\d+)$/);assert(m,'Unknown displayed choice: '+s);return {kind:'frac',value:frac(m[1],m[2])}};
function parsePrompt(q){
 const s=q.text,t=q.level,f=q.family,c=q.ctx;
 const get=(re)=>{const m=s.match(re);assert(m,'Could not derive answer from student text '+c+': '+s);return m.slice(1).map(BigInt)};
 let expected,kind='int',steps;
 if(t===0){
  if(f===0){const [a,d,k]=get(/Дробь (\d+)\/(\d+) расширили умножением числителя и знаменателя на (\d+)/);expected=frac(a*k);steps=1}
  else if(f===1){const [a,d,k]=get(/В дроби (\d+)\/(\d+) умножили числитель и знаменатель на (\d+)/);expected=frac(d*k);steps=1}
  else if(f===2){const [a,d]=get(/Какую несократимую дробь обозначает (\d+)\/(\d+)/);expected=frac(a,d);kind='frac';steps=2}
  else if(f===3){const [a,d,b,e]=get(/В равенстве (\d+)\/(\d+) = (\d+)\/(\d+) на сколько увеличился числитель/);assert(a*e===b*d,'Incorrect fraction equality '+s);expected=frac(b-a);steps=2}
  else {const [a,n,d,b]=get(/Числитель (\d+) при расширении дроби (\d+)\/(\d+) стал (\d+)/);assert(a===n&&b%a===0n,'Contradictory expansion prompt '+s);expected=frac(b/a);steps=2}
 }else if(t===1){
  if(f===0){const [a,d,D]=get(/Найди пропущенный числитель: (\d+)\/(\d+) = x\/(\d+)/);assert(D%d===0n,'Nonintegral enlargement coefficient');expected=frac(a*D/d);steps=2}
  else if(f===1){const [a,d,A]=get(/Найди пропущенный знаменатель: (\d+)\/(\d+) = (\d+)\/x/);assert(A%a===0n,'Nonintegral enlargement');expected=frac(d*A/a);steps=2}
  else if(f===2){const [a,d,k,m]=get(/Дробь (\d+)\/(\d+) расширили на (\d+), затем ещё на (\d+)/);expected=frac(d*k*m);steps=3}
  else if(f===3){const [a,d,k]=get(/Дробь (\d+)\/(\d+) сначала сократили на (\d+)/);assert(a%k===0n&&d%k===0n,'Illegal simplification');expected=frac(a/k);steps=2}
  else {const [a,d]=get(/Чему равно в несократимом виде (\d+)\/(\d+)/);expected=frac(a,d);kind='frac';steps=3}
 }else{
  if(f===0){const [a,d,k,m]=get(/После расширения (\d+)\/(\d+) сначала на (\d+), затем на (\d+)/);expected=frac(a*k*m);steps=3}
  else if(f===1){const [a,d,k,m]=get(/Дробь (\d+)\/(\d+) сократили сначала на (\d+), затем на (\d+)/);assert(a%(k*m)===0n&&d%(k*m)===0n,'Invalid multiple reductions');expected=frac(d/(k*m));steps=3}
  else if(f===2){const [a,d,k,m]=get(/Дробь (\d+)\/(\d+) расширили на (\d+) и (\d+) последовательно/);expected=frac(d*k*m-d);steps=4}
  else if(f===3){const [a,d,k,m]=get(/Дробь (\d+)\/(\d+) сократили на (\d+), а затем снова расширили на (\d+)/);assert(a%k===0n&&d%k===0n,'Invalid reduction then expansion');expected=frac(a/k*m);steps=4}
  else {const [a,d]=get(/Представь (\d+)\/(\d+) в виде несократимой обыкновенной дроби/);expected=frac(a,d);kind='frac';steps=4}
 }
 assert(expected.n>0n,'Nonpositive expected result '+c);
 return {kind,expected,steps};
}
function checkAnswers(q,solved){
 const options=q.choices.map(c=>({...c,value:parse(c.label)})),correct=options.filter(x=>x.key===q.ans);
 assert.equal(correct.length,1,'Missing or duplicated correct selection '+q.ctx);
 assert(options.length>=3,'Less than three options '+q.ctx);
 const seen=new Set();
 for(const item of options){
  assert.equal(item.value.kind,solved.kind,'Answer formats mixed '+q.ctx);
  const key=item.value.value.n+'/'+item.value.value.d;
  assert(!seen.has(key),'Equivalent options with different labels '+q.ctx+': '+q.choices.map(c=>c.label));
  seen.add(key);
 }
 assert.deepEqual(correct[0].value.value,solved.expected,'Wrong answer derived from learner text '+q.ctx+': '+q.text);
 if(solved.kind==='frac')assert(solved.expected.d>1n,'Fraction task asks an integer value '+q.ctx);
}
function checkPicture(q){
 if(!q.picture)return false;
 assert(q.level===0||(q.level===1&&[0,1].includes(q.family)),
  'SVG leaked into advanced tasks '+q.ctx);
 const model=q.picture,caption=model.alt.match(/одинаковые целые\. (\d+)\/(\d+) равно (\d+)\/(\d+).* на (\d+) равных частей/);
 assert(caption,'Malformed accessible fraction-property description '+q.ctx);
 const [a,d,n,D,k]=caption.slice(1).map(Number);
 assert(a>0&&d>a&&k>=2&&n===a*k&&D===d*k,'Incorrect fraction equivalence picture label '+q.ctx);
 const source=q.text.match(/(\d+)\/(\d+)/);
 assert(source,'Picture without visible fraction '+q.ctx);
 assert(Number(source[1])/Number(source[2])===a/d,'Picture shows a different fraction '+q.ctx);
 const rows=model.rows;assert.equal(rows.length,2,'Both original and expanded strips required');
 for(let j=0;j<2;j++){
  const row=rows[j],num=j===0?a:n,den=j===0?d:D;
  assert.equal(row.width,480,'Incorrect single-whole width '+q.ctx);
  assert.equal(row.cells.length,den,'Incorrect number of equal parts '+q.ctx);
  assert.equal(row.cells.filter(x=>x.filled).length,num,'Shaded shares incorrect '+q.ctx);
  for(let i=0;i<row.cells.length;i++){
   const cell=row.cells[i];assert(Math.abs(cell.width-480/den)<0.002,'Unequal width '+q.ctx);
   if(i)assert(Math.abs(cell.x-row.cells[i-1].x-row.cells[i-1].width)<0.005,'Disconnected shares '+q.ctx);
  }
 }
 assert.equal(rows[0].width,rows[1].width,'Two models represent unequal wholes');
 assert.equal(a/d,n/D,'Picture equivalence false');
 return true;
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate((id)=>{
   let seed=2026111533;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   function read(html,stripSvg=false){
    const root=document.createElement('div');root.innerHTML=String(html);
    for(const f of [...root.querySelectorAll('.frac')]){
     const n=f.querySelector('.num')?.textContent?.trim(),d=f.querySelector('.den')?.textContent?.trim();
     if(n&&d)f.replaceWith(document.createTextNode(n+'/'+d));
    }
    if(stripSvg)for(const svg of root.querySelectorAll('svg'))svg.remove();
    return root.textContent.replace(/\s+/g,' ').trim();
   }
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let sample=0;sample<40;sample++){
    blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
    const q=makeG5Question(id),el=document.createElement('div');el.innerHTML=q.text;
    const svg=el.querySelector('svg.mk-g5-equal-property-svg');
    let picture=null;
    if(svg){
     const rects=[...svg.querySelectorAll('rect')],rows=[];
     for(const y of [8,55]){
      const same=rects.filter(r=>Number(r.getAttribute('y'))===y),border=same.find(r=>r.getAttribute('fill')==='none');
      rows.push({width:Number(border?.getAttribute('width')),
       cells:same.filter(r=>r.getAttribute('fill')!=='none').map(r=>({x:Number(r.getAttribute('x')),
        width:Number(r.getAttribute('width')),filled:r.getAttribute('fill')==='#5d9cdc'}))});
     }
     picture={rows,alt:svg.getAttribute('aria-label')};
    }
    rows.push({ctx:id+'/'+level+'/'+family+'/'+sample,level,family,sample,
     text:read(q.text,true),ex:read(q.ex,true),ans:String(q.ans),
     choices:q.choices.map(c=>({key:String(c.key),label:read(c.label)})),
     source:q.sourceTopicId,template:q.templateId,picture});
   }
   return {rows,topics:g5AllTopics().length};
  },ID);
  assert.equal(data.topics,74);assert.equal(data.rows.length,600);
  const variation=new Map(),families=new Set(),distinctDen=[new Set(),new Set(),new Set()],stepLevels=[[],[],[]];
  let images=0,integerAnswers=0,fractionAnswers=0;
  for(const q of data.rows){
   assert(q.text&&q.ex&&q.template,'Blank learner content '+q.ctx);
   assert.equal(q.source,ID,'Wrong active topic '+q.ctx);
   assert(!/NaN|undefined|Infinity/.test(q.text+q.ex),'Broken lesson text '+q.ctx);
   const solved=parsePrompt(q);
   checkAnswers(q,solved);
   if(checkPicture(q))images++;
   if(solved.kind==='int')integerAnswers++;else fractionAnswers++;
   const m=q.text.match(/(\d+)\/(\d+)/);if(m)distinctDen[q.level].add(m[2]);
   stepLevels[q.level].push(solved.steps);
   const key=q.level+'/'+q.family;
   if(!variation.has(key))variation.set(key,new Set());
   variation.get(key).add(q.text);families.add(q.template);
  }
  assert.equal(variation.size,15);assert.equal(families.size,15);
  for(const [k,values]of variation)assert(values.size>=12,'Too few different tasks '+k+': '+values.size);
  assert.equal(images,280,'Expected 7 illustrated families ×40 samples');
  assert(integerAnswers>0&&fractionAnswers>0,'Missing conceptual + exact fraction types');
  assert(distinctDen.every((s,i)=>s.size>=(i===0?7:i===1?8:11)),'Too few denominators '+distinctDen.map(x=>x.size));
  const means=stepLevels.map(a=>a.reduce((x,y)=>x+y,0)/a.length);
  assert(means[0]<means[1]&&means[1]<means[2],'Stages do not increase in mathematical steps '+means);
  assert.deepEqual(errors,[],'Browser raised JS exception');
  console.log('G5_SEQUENTIAL_PARAGRAPH_33_PASS '+JSON.stringify({
   questions:data.rows.length,families:families.size,diagrams:images,integerAnswers,fractionAnswers,
   denominatorCounts:distinctDen.map(x=>x.size),meanSteps:means}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_33_FAIL',e.stack||e);process.exit(1)});
