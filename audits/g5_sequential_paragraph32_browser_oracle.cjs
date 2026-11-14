'use strict';
// Grade 5 §32: 1200 mixed-addition/subtraction tasks solved independently
// from the displayed learner text. Do not use mk115, q.ans, or generator plans as oracle.
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const IDS=['mixed_add','mixed_sub'];
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b]}return a};
function rat(n,d=1n){n=BigInt(n);d=BigInt(d);assert(d>0n);const g=gcd(n,d);return {n:n/g,d:d/g}}
function add(a,b){return rat(a.n*b.d+b.n*a.d,a.d*b.d)}
function sub(a,b){return rat(a.n*b.d-b.n*a.d,a.d*b.d)}
function mul(a,b){return rat(a.n*b.n,a.d*b.d)}
const wh=n=>rat(n);
function mixedParts(s){return [...s.matchAll(/(\d+)\s+(\d+)\/(\d+)/g)].map(m=>({
 w:BigInt(m[1]),n:BigInt(m[2]),d:BigInt(m[3]),
 value:add(wh(m[1]),rat(m[2],m[3]))}))}
function fractions(s){return [...s.matchAll(/(?<!\d)(\d+)\/(\d+)/g)].map(m=>({
 n:BigInt(m[1]),d:BigInt(m[2]),value:rat(m[1],m[2])}))}
function req(condition,msg,q){assert(condition,msg+' '+q.id+'/'+q.level+'/'+q.family+'/'+q.sample+': '+q.text)}
function originalDen(s){const m=s.match(/(\d+)\s+\d+\/(\d+)/);return m?BigInt(m[2]):null}
function solve(q){
 const ms=mixedParts(q.text),fs=fractions(q.text),t=q.level,p=q.family,d=originalDen(q.text);
 if(!(q.id==='mixed_sub'&&t===2&&p===2))
  req(ms.length>=1,'No visible mixed number',q);
 const M=i=>{req(ms[i],'Missing visible mixed operand '+i,q);return ms[i].value};
 const F=i=>{req(fs[i],'Missing visible fraction '+i,q);return fs[i].value};
 const num=(x)=>rat(x);
 let expected,kind='mixed';
 if(q.id==='mixed_add'){
  if(t===0){
   if(p===0||p===2)expected=add(M(0),M(1));
   else if(p===1){expected=num(ms[0].w+ms[1].w);kind='number'}
   else if(p===3){expected=num(ms[0].n+ms[1].n);kind='number'}
   else{const m=q.text.match(/прибавили (\d+) целых/);
    req(m,'No integer addition printed',q);expected=add(add(M(0),num(m[1])),F(1))}
  }else if(t===1){
   if(p===0||p===3)expected=add(M(0),M(1));
   else if(p===1){const m=q.text.match(/затем ещё (\d+) целых/);
    req(m,'Missing extra whole',q);expected=add(add(M(0),F(1)),num(m[1]))}
   else if(p===2){expected=num(ms[0].n+ms[1].n-d);kind='number'}
   else expected=add(add(M(0),M(1)),F(2));
  }else{
   if(p===0||p===3)expected=add(add(M(0),M(1)),M(2));
   else if(p===1)expected=add(add(add(M(0),M(1)),F(2)),num(1));
   else if(p===2){
    const result=add(add(M(0),M(1)),F(2));
    expected=mul(result,num(d));kind='number';
   }else expected=add(add(M(0),M(1)),mul(F(2),num(2)));
  }
 }else{
  if(t===0){
   if(p===0||p===2)expected=sub(M(0),M(1));
   else if(p===1){expected=num(ms[0].w-ms[1].w);kind='number'}
   else if(p===3){expected=num(ms[0].n-ms[1].n);kind='number'}
   else {const m=q.text.match(/вычли (\d+) целых/);
    req(m,'No whole subtraction printed',q);expected=sub(sub(M(0),num(m[1])),F(1))}
  }else if(t===1){
   if(p===0||p===3)expected=sub(M(0),M(1));
   else if(p===1)expected=sub(sub(M(0),M(1)),F(2));
   else if(p===2){expected=num(ms[0].n+d);kind='number'}
   else expected=add(sub(M(0),M(1)),F(2));
  }else{
   if(p===0)expected=sub(sub(sub(M(0),M(1)),F(2)),F(3));
   else if(p===1)expected=sub(add(sub(M(0),M(1)),F(2)),F(3));
   else if(p===2){
    const m=q.text.match(/Из числителя неправильной дроби (\d+)\/(\d+) вычли числитель дроби (\d+)\/(\d+), потом ещё (\d+) долей/);
    req(m,'Cannot parse improper numerator task',q);
    expected=num(BigInt(m[1])-BigInt(m[3])-BigInt(m[5]));kind='number';
   }else if(p===3)expected=add(sub(sub(M(0),M(1)),F(2)),num(1));
   else expected=add(sub(sub(M(0),M(1)),F(2)),F(3));
  }
 }
 req(expected&&expected.n>=0n,'Invalid or negative mathematical outcome',q);
 if(kind==='mixed'&&expected.n%expected.d===0n)kind='integer';
 return {expected,kind,d};
}
function value(s){
 s=s.trim();if(/^\d+$/.test(s))return {kind:'integer',rat:rat(s)};
 const m=s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
 if(m)return {kind:'mixed',rat:add(wh(m[1]),rat(m[2],m[3])),w:BigInt(m[1]),n:BigInt(m[2]),d:BigInt(m[3])};
 const f=s.match(/^(\d+)\/(\d+)$/);
 if(f)return {kind:'fraction',rat:rat(f[1],f[2])};
 throw Error('Invalid displayed numeric/mixed choice '+s);
}
function visibleAnswers(q,expected){
 const right=q.choices.filter(c=>c.key===q.ans);
 assert.equal(right.length,1,'No unique correct answer key '+q.id+'/'+q.level+'/'+q.family);
 req(q.choices.length>=3,'Too few learner options',q);
 const distinct=new Set(),labels=new Set();
 for(const c of q.choices){
  req(!labels.has(c.label),'Two identical learner choices',q);labels.add(c.label);
  const v=value(c.label),k=v.rat.n+'/'+v.rat.d;
  req(!distinct.has(k),'Equivalent learner options with distinct notation',q);
  distinct.add(k);
 }
 const shown=value(right[0].label);
 assert.deepEqual(shown.rat,expected.expected,
  'Visible correct option disagrees with independently evaluated prompt '+q.text);
 if(expected.kind==='number')assert(shown.kind==='integer','Single-number answer should be numeric '+q.text);
 if(expected.kind==='mixed'){
  assert(shown.kind==='mixed','Mixed arithmetic needs correctly formatted mixed number '+q.text);
  assert(shown.n>0n&&shown.n<shown.d,'Mixed remainder incorrect '+q.text);
  assert.equal(shown.d,expected.d,'Mixed denominator changed unexpectedly '+q.text);
 }
}
function visual(q,math){
 if(!q.diagram)return false;
 req(q.level<2&&[0,2].includes(q.family)||
     q.level===1&&q.family===3,'Diagram in wrong family/tier',q);
 const g=q.diagram,ms=mixedParts(q.text),d=Number(ms[0].d);
 assert.equal(g.rows.length,3,'Mixed arithmetic image must show both operands and result');
 const nums=[ms[0].w*ms[0].d+ms[0].n,ms[1].w*ms[1].d+ms[1].n,
   math.expected.n*BigInt(d)/math.expected.d];
 req(math.expected.n*BigInt(d)%math.expected.d===0n,'Incompatible diagram denominator',q);
 for(let i=0;i<3;i++){
  const row=g.rows[i];
  assert.equal(row.width,504,'Inconsistent scale of three wholes');
  assert.equal(row.cells.filter(x=>x.filled).length,Number(nums[i]),
   'Illustrated result is mathematically wrong '+q.text);
  assert(row.cells.length%d===0,'Whole parts not equally subdivided');
  for(let j=0;j<row.cells.length;j++){
   const cell=row.cells[j];
   assert(Math.abs(cell.width-504/row.cells.length)<0.003,'Unequal fractional shares');
   if(j)assert(Math.abs(cell.x-row.cells[j-1].x-row.cells[j-1].width)<0.005,
     'Detached equal parts of a whole '+q.text);
  }
 }
 assert(g.alt.includes(String(math.expected.n))||g.alt.includes('/'+d),
  'Accessible diagram has no rational description');
 return true;
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(ids=>{
   let seed=2026111532;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   function read(html,stripSvg=false){
    const root=document.createElement('div');root.innerHTML=String(html);
    for(const m of [...root.querySelectorAll('.mixed')]){
     const w=m.querySelector('.whole')?.textContent?.trim(),f=m.querySelector('.frac');
     const n=f?.querySelector('.num')?.textContent?.trim(),d=f?.querySelector('.den')?.textContent?.trim();
     if(w&&n&&d)m.replaceWith(document.createTextNode(w+' '+n+'/'+d));
    }
    for(const f of [...root.querySelectorAll('.frac')]){
     const n=f.querySelector('.num')?.textContent?.trim(),d=f.querySelector('.den')?.textContent?.trim();
     if(n&&d)f.replaceWith(document.createTextNode(n+'/'+d));
    }
    if(stripSvg)root.querySelectorAll('svg').forEach(x=>x.remove());
    return root.textContent.replace(/\s+/g,' ').trim();
   }
   const rows=[];
   for(const id of ids)for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let sample=0;sample<40;sample++){
    blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:family,total:10,
      usedSignatures:[],items:[],finished:false};qid='g5:'+id;
    const q=makeG5Question(id),root=document.createElement('div');root.innerHTML=q.text;
    const svg=root.querySelector('svg.mk-g5-mixed-arithmetic');
    let diagram=null;
    if(svg){
     const rects=[...svg.querySelectorAll('rect')],modelRows=[];
     for(const y of [8,53,98]){
      const rs=rects.filter(x=>Number(x.getAttribute('y'))===y),outer=rs.find(x=>x.getAttribute('fill')==='none');
      modelRows.push({width:Number(outer?.getAttribute('width')),
       cells:rs.filter(x=>x.getAttribute('fill')!=='none').map(x=>({
        x:Number(x.getAttribute('x')),width:Number(x.getAttribute('width')),
        filled:x.getAttribute('fill')==='#5d9cdc'
       }))});
     }
     diagram={rows:modelRows,alt:svg.getAttribute('aria-label')};
    }
    rows.push({id,level,family,sample,text:read(q.text,true),ex:read(q.ex,true),
     choices:q.choices.map(c=>({key:String(c.key),label:read(c.label)})),
     ans:String(q.ans),source:q.sourceTopicId,template:q.templateId,diagram});
   }
   return {rows,topics:g5AllTopics().length};
  },IDS);
  assert.equal(data.topics,74);assert.equal(data.rows.length,1200);
  const families=new Set(),variants=new Map(),denominators=new Set(),remainderVariants=new Set();
  let diagrams=0,sum=0,sub=0;
  for(const q of data.rows){
   assert.equal(q.source,q.id,'Wrong Grade 5 active generator');
   req(q.text&&q.ex&&q.template,'Blank or unidentifiable learner exercise',q);
   req(!/undefined|NaN|Infinity/.test(q.text+q.ex),'Malformed arithmetic statement',q);
   const expected=solve(q);
   visibleAnswers(q,expected);
   if(visual(q,expected))diagrams++;
   if(q.id==='mixed_add'){sum++;if(q.level===1&&q.family===2)remainderVariants.add(String(expected.expected.n))}
   else sub++;
   if(q.level===0&&q.family===0)denominators.add(String(expected.d));
   const key=q.id+'/'+q.level+'/'+q.family;
   if(!variants.has(key))variants.set(key,new Set());
   variants.get(key).add(q.text);families.add(q.template);
  }
  assert.equal(diagrams,320,'Must have 8 SVG families ×40 questions');
  assert.equal(sum,600);assert.equal(sub,600);
  assert.equal(variants.size,30);assert.equal(families.size,30);
  for(const [k,s]of variants)assert(s.size>=12,'Only '+s.size+' distinct prompts in '+k);
  assert(denominators.size>=10,'Denominator diversity still too low '+denominators.size);
  assert(remainderVariants.size>=4,'Exercise on addition with carry still produces same answer');
  assert.deepEqual(errors,[],'Uncaught JavaScript errors');
  console.log('G5_SEQUENTIAL_PARAGRAPH_32_PASS '+JSON.stringify({
   total:data.rows.length,addition:sum,subtraction:sub,families:families.size,
   equalWholeSVG:diagrams,denominators:denominators.size,
   distinctCarryRemainderAnswers:remainderVariants.size}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_32_FAIL',e.stack||e);process.exit(1)});
