'use strict';
// §34: independent arithmetic oracle for 600 learner-rendered reduction tasks.
// Never use q.mk129.plan, q.mk129.expected, q.ans or the generator's own arithmetic.
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const ID='frac_reduce';
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b]}return a};
const rational=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert(d>0n);const g=gcd(n,d);return {n:n/g,d:d/g}};
function solveVisible(q){
 const s=q.text,t=q.level,f=q.family;
 function take(regex){
  const m=s.match(regex);
  assert(m,'Unrecognised reduction instruction '+q.ctx+': '+s);
  return m.slice(1).map(BigInt);
 }
 let n,d,k,m,c,answer,kind='number',steps;
 if(t===0){
  if(f===0||f===1){[n,d]=take(/(?:Сократи дробь|У дроби) (\d+)\/(\d+)/);answer=rational(n,d);kind='fraction';steps=2}
  else if(f===2){[n,d]=take(/Найди НОД числителя и знаменателя дроби (\d+)\/(\d+)/);answer=rational(gcd(n,d));steps=2}
  else if(f===3){[n,d,k]=take(/У дроби (\d+)\/(\d+) после деления числителя и знаменателя на (\d+)/);
   assert(n%k===0n&&d%k===0n,'Illegal reduction '+s);answer=rational(d/k);steps=2}
  else{[n,d,k]=take(/После деления числителя и знаменателя дроби (\d+)\/(\d+) на (\d+)/);
   assert(n%k===0n&&d%k===0n,'Illegal reduction '+s);answer=rational(n/k);steps=2}
 }else if(t===1){
  if(f===0){[n,d]=take(/Сократи дробь (\d+)\/(\d+)/);answer=rational(n,d);kind='fraction';steps=3}
  else if(f===1){[n,d,k]=take(/У дроби (\d+)\/(\d+) сначала сократили на (\d+)/);
   assert(n%k===0n&&d%k===0n,'Illegal reduction '+s);answer=rational(d/k);steps=3}
  else if(f===2){[n,d]=take(/Найди НОД числителя и знаменателя дроби (\d+)\/(\d+)/);
   answer=rational(gcd(n,d));steps=3}
  else if(f===3){[n,d,k,m]=take(/Дробь (\d+)\/(\d+) сократили сначала на (\d+), затем на (\d+)/);
   assert(n%(k*m)===0n&&d%(k*m)===0n,'Illegal multiple reduction '+s);answer=rational(n/(k*m));steps=3}
  else {[n,d,k,m]=take(/После сокращения дроби (\d+)\/(\d+) сначала на (\d+), затем на (\d+) найди НОД/);
   assert(n%(k*m)===0n&&d%(k*m)===0n,'Illegal reductions '+s);
   answer=rational(gcd(n/(k*m),d/(k*m)));steps=4}
 }else{
  if(f===0){[n,d]=take(/Найди НОД числителя и знаменателя дроби (\d+)\/(\d+)/);
   answer=rational(gcd(n,d));steps=4}
  else if(f===1){[n,d,k,m,c]=take(/Дробь (\d+)\/(\d+) последовательно сократили на (\d+), (\d+) и (\d+)/);
   assert(n%(k*m*c)===0n&&d%(k*m*c)===0n,'Illegal triple reduction '+s);
   answer=rational(n/(k*m*c));steps=4}
  else if(f===2){[n,d,k,m]=take(/Дробь (\d+)\/(\d+) сократили на (\d+), затем на (\d+), после этого сократили полностью/);
   assert(n%(k*m)===0n&&d%(k*m)===0n,'Illegal intermediate fraction '+s);
   answer=rational(n,d);kind='fraction';steps=5}
  else if(f===3){[n,d,k,m,c]=take(/После сокращения дроби (\d+)\/(\d+) на (\d+) и (\d+) оба оставшихся числа снова умножили на (\d+)/);
   assert(n%(k*m)===0n&&d%(k*m)===0n,'Illegal intermediate fraction '+s);
   answer=rational(n/(k*m)*c,d/(k*m)*c);kind='fraction';steps=5}
  else {[n,d,k,m,c]=take(/Дробь (\d+)\/(\d+) сократили на (\d+), затем на (\d+) и (\d+), затем на НОД/);
   assert(n%(k*m*c)===0n&&d%(k*m*c)===0n,'Illegal triple reduction '+s);
   answer=rational(d/(k*m*c)/gcd(n/(k*m*c),d/(k*m*c)));steps=5}
 }
 assert(answer.n>0n,'Nonpositive result '+q.ctx);
 return {answer,kind,steps};
}
function displayedValue(label){
 if(/^\d+$/.test(label))return {kind:'number',value:rational(label)};
 const m=label.match(/^(\d+)\s*\/\s*(\d+)$/);
 assert(m,'Unexpected learner option '+label);
 return {kind:'fraction',value:rational(m[1],m[2])};
}
function checkLearnerAnswer(q,solved){
 const correct=q.choices.filter(c=>c.key===q.ans);
 assert.equal(correct.length,1,'No unique correct selection '+q.ctx);
 assert(q.choices.length>=3,'Too few available choices '+q.ctx);
 const values=new Set();
 for(const option of q.choices){
  const a=displayedValue(option.label);
  assert.equal(a.kind,solved.kind,'Incorrect fraction/number answer type '+q.ctx);
  const key=a.value.n+'/'+a.value.d;
  assert(!values.has(key),'Mathematically equivalent options '+q.ctx+': '+q.choices.map(c=>c.label).join(','));
  values.add(key);
 }
 assert.deepEqual(displayedValue(correct[0].label).value,solved.answer,
  'Wrong arithmetic according to the actual learner prompt '+q.ctx+': '+q.text);
 if(solved.kind==='fraction')assert(solved.answer.d>1n,'Fraction exercise became a whole number '+q.ctx);
}
function inspectPicture(q){
 if(!q.diagram)return false;
 assert.equal(q.level,0,'Reduction visuals are for introductory tier '+q.ctx);
 const m=q.diagram.alt.match(/Сокращение дроби (\d+)\/(\d+) на (\d+) даёт (\d+)\/(\d+)/);
 assert(m,'Malformed accessible SVG label '+q.ctx);
 const [n,D,k,a,d]=m.slice(1).map(Number);
 assert.equal(n,a*k,'Wrong shaded numerator '+q.ctx);
 assert.equal(D,d*k,'Wrong subdivided denominator '+q.ctx);
 const source=q.text.match(/(\d+)\/(\d+)/);
 assert(source,'No visible fraction in picture exercise '+q.ctx);
 assert.equal(n/D,Number(source[1])/Number(source[2]),'Diagram disagrees with learner fraction '+q.ctx);
 assert.equal(q.diagram.rows.length,2);
 for(let rowIndex=0;rowIndex<2;rowIndex++){
  const row=q.diagram.rows[rowIndex],count=rowIndex===0?D:d,filled=rowIndex===0?n:a;
  assert.equal(row.wholeWidth,480,'Unequal source unit whole length '+q.ctx);
  assert.equal(row.cells.length,count,'Wrong fractional parts '+q.ctx);
  assert.equal(row.cells.filter(c=>c.filled).length,filled,'Wrong shaded part count '+q.ctx);
  for(let i=0;i<row.cells.length;i++){
   const cell=row.cells[i];assert(Math.abs(cell.width-480/count)<0.002,'Unequal share widths '+q.ctx);
   if(i)assert(Math.abs(cell.x-row.cells[i-1].x-row.cells[i-1].width)<0.005,
      'Disconnected fraction shares '+q.ctx);
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
  const result=await page.evaluate(id=>{
   let seed=2026111534;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   function read(html,stripSvg=false){
    const root=document.createElement('div');root.innerHTML=String(html||'');
    for(const node of [...root.querySelectorAll('.frac')]){
     const a=node.querySelector('.num')?.textContent?.trim(),b=node.querySelector('.den')?.textContent?.trim();
     if(a&&b)node.replaceWith(document.createTextNode(a+'/'+b));
    }
    if(stripSvg)for(const svg of root.querySelectorAll('svg'))svg.remove();
    return root.textContent.replace(/\s+/g,' ').trim();
   }
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let sample=0;sample<40;sample++){
    blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
    const q=makeG5Question(id),root=document.createElement('div');root.innerHTML=q.text,
     svg=root.querySelector('svg.mk-g5-reduction-diagram');
    let diagram=null;
    if(svg){
     const rects=[...svg.querySelectorAll('rect')],modelRows=[];
     for(const y of [8,55]){
      const group=rects.filter(x=>Number(x.getAttribute('y'))===y),border=group.find(x=>x.getAttribute('fill')==='none');
      modelRows.push({wholeWidth:Number(border?.getAttribute('width')),
       cells:group.filter(x=>x.getAttribute('fill')!=='none').map(x=>({
        x:Number(x.getAttribute('x')),width:Number(x.getAttribute('width')),
        filled:x.getAttribute('fill')==='#5d9cdc'}))});
     }
     diagram={alt:svg.getAttribute('aria-label'),rows:modelRows};
    }
    rows.push({ctx:id+'/'+level+'/'+family+'/'+sample,level,family,sample,
     text:read(q.text,true),ex:read(q.ex,true),ans:String(q.ans),
     source:q.sourceTopicId,template:q.templateId,diagram,
     choices:q.choices.map(c=>({key:String(c.key),label:read(c.label)}))});
   }
   return {rows,topicCount:g5AllTopics().length};
  },ID);
  assert.equal(result.topicCount,74);assert.equal(result.rows.length,600);
  let diagrams=0,number=0,fractions=0;
  const families=new Set(),variants=new Map(),steps=[[],[],[]],denoms=[new Set(),new Set(),new Set()];
  for(const q of result.rows){
   assert(q.text&&q.ex&&q.template,'Blank student content '+q.ctx);
   assert.equal(q.source,ID,'Wrong source topic '+q.ctx);
   assert(!/undefined|NaN|Infinity/.test(q.text+q.ex),'Malformed student exercise '+q.ctx);
   const solved=solveVisible(q);
   checkLearnerAnswer(q,solved);
   if(inspectPicture(q))diagrams++;
   if(solved.kind==='number')number++;else fractions++;
   const match=q.text.match(/(\d+)\/(\d+)/);if(match)denoms[q.level].add(match[2]);
   steps[q.level].push(solved.steps);
   const k=q.level+'/'+q.family;
   if(!variants.has(k))variants.set(k,new Set());
   variants.get(k).add(q.text);families.add(q.template);
  }
  assert.equal(families.size,15);assert.equal(variants.size,15);
  for(const [k,s]of variants)assert(s.size>=12,'No diversity in '+k+' count '+s.size);
  assert.equal(diagrams,200,'Need 200 real whole-reduction diagrams');
  assert(number>0&&fractions>0,'Only one input form remains');
  const mean=steps.map(a=>a.reduce((s,x)=>s+x,0)/a.length);
  assert(mean[0]<mean[1]&&mean[1]<mean[2],'No real cognitive escalation '+mean);
  assert.deepEqual(errors,[],'Uncaught browser JS error');
  console.log('G5_SEQUENTIAL_PARAGRAPH_34_PASS '+JSON.stringify({
   questions:result.rows.length,families:families.size,diagrams,number,fractions,
   uniqueDenominators:denoms.map(x=>x.size),meanSteps:mean}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_34_FAIL',e.stack||e);process.exit(1)});
