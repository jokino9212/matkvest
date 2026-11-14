'use strict';
// Grade 5 §31: solve 1800 REAL displayed conversion/comparison tasks independently.
// No q.ans, q.answerRat, conversionAudit.answerNumerator, or mk115.expected used as oracle.
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const IDS=['frac_to_mixed','mixed_to_frac','mixed_compare'];
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b]}return a};
const frac=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert(d>0n);const g=gcd(n,d);return {n:n/g,d:d/g}};
const relation=(a,b)=>a.n*b.d>b.n*a.d?'>':a.n*b.d<b.n*a.d?'<':'=';
const add=(a,b)=>frac(a.n*b.d+b.n*a.d,a.d*b.d);
const sub=(a,b)=>frac(a.n*b.d-b.n*a.d,a.d*b.d);
const newRat=(w,n,d)=>frac(BigInt(w)*BigInt(d)+BigInt(n),BigInt(d));
const fail=(q,m)=>{throw Error(m+' '+q.id+'/'+q.level+'/'+q.family+'/'+q.sample+' '+q.text)};
const match=(q,re)=>{const m=q.text.match(re);if(!m)fail(q,'Unrecognised visible wording '+re);return m};
const allMixed=q=>[...q.text.matchAll(/(\d+)\s+(\d+)\/(\d+)/g)].map(m=>({w:BigInt(m[1]),n:BigInt(m[2]),d:BigInt(m[3]),q:newRat(m[1],m[2],m[3])}));
const allFractions=q=>[...q.text.matchAll(/(?<!\d)(\d+)\/(\d+)/g)].map(m=>({n:BigInt(m[1]),d:BigInt(m[2]),q:frac(m[1],m[2])}));
function expectedConversion(q){
 const t=q.level,p=q.family,source=q.id==='frac_to_mixed'?allFractions(q):allMixed(q);
 if(!source.length)fail(q,'No displayed source fraction');
 const a=source[0],d=a.d,n=q.id==='frac_to_mixed'?a.n:a.w*d+a.n;
 assert(d>1n&&n>d,'Not a proper source for the requested conversion '+q.text);
 const w=n/d,rem=n%d;assert(rem>0n,'No proper mixed remainder');
 let desired,kind;
 if(q.id==='frac_to_mixed'){
  if(t===0){desired=[n,w,rem,n,n+d][p];kind=[0,1,1,0,0][p]?'number':'mixed'}
  else if(t===1){desired=[n,w+1n,(rem+1n)%d,n+d,n+2n*d][p];kind=[0,1,1,0,0][p]?'number':'mixed'}
  else {desired=[n+d,w+2n,(rem+1n)%d,n+2n*d,n+3n*d][p];
   kind=[0,1,1,0,0][p]?'number':'mixed'}
 }else{
  if(t===0){desired=[n,n,n,n,n+1n][p];kind=[0,1,0,1,0][p]?'number':'improper'}
  else if(t===1){desired=[n,n+d,n,n+d,n+d+1n][p];kind=[0,1,0,1,0][p]?'number':'improper'}
  else {desired=[n+d,n+2n*d-1n,n+d-1n,n+3n*d-2n,n+2n*d+1n][p];
   kind=[0,1,0,1,0][p]?'number':'improper'}
 }
 const appearance=source[0].q;
 assert.deepEqual(appearance,frac(n,d),'Displayed initial mixed number disagrees with source');
 return {n:desired,d,kind,sourceN:n,sourceW:w,sourceRem:rem};
}
function expectedComparison(q){
 const ms=allMixed(q),fs=allFractions(q),p=q.family,t=q.level;
 const f=(i)=>{if(!fs[i])fail(q,'Missing fractional term '+i);return fs[i].n};
 const x=(i)=>{if(!ms[i])fail(q,'Missing mixed term '+i);return ms[i].q};
 const num=(x)=>frac(x);
 let left,right,value=null;
 if(t===0){
  if(p===0||p===1){if(ms.length!==2)fail(q,'Missing two mixed numbers');left=x(0);right=x(1)}
  else if(p===2){value=ms[0].w>ms[1].w?ms[0].w:ms[1].w}
  else if(p===3){
   const pair=match(q,/Сравни числа (\d+\s+\d+\/\d+|\d+) и (\d+\s+\d+\/\d+|\d+)/);
   function v(s){const m=s.match(/^(\d+)\s+(\d+)\/(\d+)$/);return m?newRat(m[1],m[2],m[3]):num(s)}
   left=v(pair[1]);right=v(pair[2]);
  }else value=ms[1].n>ms[0].n?ms[1].n-ms[0].n:ms[0].n-ms[1].n;
 }else if(t===1){
  if(p===0){left=add(ms[0].q,fs[1].q);right=ms[1].q}
  else if(p===1){left=sub(ms[0].q,fs[1].q);right=ms[1].q}
  else if(p===2){const m=match(q,/К целой части (\d+) .* прибавили (\d+)/);value=BigInt(m[1])+BigInt(m[2])}
  else if(p===3){left=add(ms[0].q,fs[2].q);right=add(ms[1].q,fs[2].q)}
  else {const m=match(q,/числитель уменьшили на (\d+)/);value=ms[0].n-BigInt(m[1])-ms[1].n;if(value<0n)value=-value}
 }else{
  if(p===0){left=sub(add(ms[0].q,fs[1].q),fs[2].q);
   right=sub(ms[1].q,fs[4].q)}
  else if(p===1){value=ms[1].n+f(3)-ms[0].n-f(1);if(value<0n)value=-value}
  else if(p===2){const m=match(q,/вычли (\d+) целых/);
   left=add(sub(ms[0].q,frac(m[1])),fs[1].q);right=ms[1].q}
  else if(p===3){value=ms[1].n-ms[0].n-f(2);if(value<0n)value=-value}
  else {left=sub(add(ms[0].q,fs[1].q),fs[2].q);
   right=add(sub(ms[1].q,fs[4].q),fs[5].q)}
 }
 if(value!==null)return {kind:'number',value};
 assert(left&&right,'No comparison operands '+q.text);
 return {kind:'relation',value:relation(left,right)};
}
function answerValue(label){
 const s=label.trim();
 if(/^\d+$/.test(s))return {kind:'number',rat:frac(s)};
 const m=s.match(/^(\d+)\s+(\d+)\/(\d+)$/);if(m)return {kind:'mixed',rat:newRat(m[1],m[2],m[3]),whole:BigInt(m[1]),rem:BigInt(m[2]),den:BigInt(m[3])};
 const f=s.match(/^(\d+)\/(\d+)$/);if(f)return {kind:'improper',rat:frac(f[1],f[2]),num:BigInt(f[1]),den:BigInt(f[2])};
 if(['<','>','='].includes(s))return {kind:'relation',relation:s};
 throw Error('Invalid rendered learner option: '+label);
}
function oracle(q){
 const right=q.choices.filter(x=>x.key===q.ans);
 assert.equal(right.length,1,'Invalid correct-option key '+q.id+'/'+q.level+'/'+q.family);
 const labels=q.choices.map(x=>x.label),mathematical=new Set();
 assert.equal(labels.length,new Set(labels).size,'Duplicate visible option '+q.text);
 for(const label of labels){const a=answerValue(label);const k=a.kind==='relation'?'rel:'+a.relation:'rat:'+a.rat.n+'/'+a.rat.d;
  assert(!mathematical.has(k),'Equivalent option values '+q.text+' '+labels);mathematical.add(k)}
 const got=answerValue(right[0].label);
 if(q.id==='mixed_compare'){
  const expected=expectedComparison(q);
  if(expected.kind==='relation')assert(got.kind==='relation'&&got.relation===expected.value,'Wrong displayed relation '+q.text);
  else assert(got.kind==='number'&&got.rat.n===expected.value,'Wrong displayed whole/numerator '+q.text);
 }else{
  const a=expectedConversion(q);
  if(a.kind==='number')assert(got.kind==='number'&&got.rat.n===a.n,'Wrong single-cell answer '+q.text);
  else if(a.kind==='mixed'){
   assert(got.kind==='mixed','Expected a mixed-number answer '+q.text);
   assert.equal(got.den,a.d,'Mixed denominator changed '+q.text);
   assert.equal(got.whole,a.n/a.d,'Mixed whole count wrong '+q.text);
   assert.equal(got.rem,a.n%a.d,'Mixed remainder wrong '+q.text);
   assert(got.rem>0n&&got.rem<got.den,'Wrong mixed form '+q.text);
  }else{
   assert(got.kind==='improper','Missing improper fraction form '+q.text);
   assert.equal(got.num,a.n,'Improper numerator not exact '+q.text);
   assert.equal(got.den,a.d,'Improper denominator changed '+q.text);
  }
 }
}
function validateDiagram(q){
 if(!q.diagram)return false;
 const g=q.diagram;
 assert.equal(q.id==='mixed_compare'?q.level===0:
  (q.level===0&&[0,3].includes(q.family))||(q.level===1&&q.family===0),
  true,'Diagram not in intended learning family '+q.text);
 if(q.id==='mixed_compare'){
  assert.equal(g.rows.length,2,'Need two comparable filled strips');
  const ms=allMixed(q),fs=allFractions(q);
  const d=ms[0]?.d??fs[0]?.d;
  assert(d,'No diagram denominator');
  const [a,b]=q.family===3?
   [q.text.match(/Сравни числа (\d+\s+\d+\/\d+|\d+) и (\d+\s+\d+\/\d+|\d+)/)[1],
    q.text.match(/Сравни числа (\d+\s+\d+\/\d+|\d+) и (\d+\s+\d+\/\d+|\d+)/)[2]].map(s=>{const m=s.match(/^(\d+)\s+(\d+)\/(\d+)$/);return m?BigInt(m[1])*BigInt(m[3])+BigInt(m[2]):BigInt(s)*d})
   :[ms[0].w*d+ms[0].n,ms[1].w*d+ms[1].n];
  for(let i=0;i<2;i++){
   const row=g.rows[i];assert.equal(row.width,504,'Comparison bar width differs');
   assert.equal(row.cells.filter(x=>x.filled).length,Number(i?a:b),'Comparison shaded units not grounded in text');
   assert.equal(row.cells.length%Number(d),0,'Whole not split into equal units');
   for(let j=1;j<row.cells.length;j++){
    assert(Math.abs(row.cells[j].x-row.cells[j-1].x-row.cells[j-1].width)<0.005,'Detached comparative model');
   }
  }
 }else{
  const source=expectedConversion(q),w=Number(source.sourceW),rem=Number(source.sourceRem),d=Number(source.d);
  assert.equal(g.rows.length,w+1,'Incorrect number of complete wholes and remaining unit');
  for(let i=0;i<g.rows.length;i++){
   const row=g.rows[i];assert.equal(row.width,480,'Whole bars must share same width');
   assert.equal(row.cells.length,d,'Incorrect denominator on SVG model');
   assert.equal(row.cells.filter(x=>x.filled).length,i<w?d:rem,'Wrong shaded parts of SVG wholes');
   for(let j=1;j<row.cells.length;j++){
    assert(Math.abs(row.cells[j].width-480/d)<0.002,'Unequal partition width');
    assert(Math.abs(row.cells[j].x-row.cells[j-1].x-row.cells[j-1].width)<0.005,'Detached model cells');
   }
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
  const data=await page.evaluate(ids=>{
   let seed=2026111531;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   function read(html,stripSvg=false){
    const root=document.createElement('div');root.innerHTML=String(html||'');
    for(const m of [...root.querySelectorAll('.mixed')]){
     const whole=m.querySelector('.whole')?.textContent?.trim(),f=m.querySelector('.frac');
     const n=f?.querySelector('.num')?.textContent?.trim(),d=f?.querySelector('.den')?.textContent?.trim();
     if(whole&&n&&d)m.replaceWith(document.createTextNode(whole+' '+n+'/'+d));
    }
    for(const f of [...root.querySelectorAll('.frac')]){
     const n=f.querySelector('.num')?.textContent?.trim(),d=f.querySelector('.den')?.textContent?.trim();
     if(n&&d)f.replaceWith(document.createTextNode(n+'/'+d));
    }
    if(stripSvg)for(const svg of root.querySelectorAll('svg'))svg.remove();
    return root.textContent.replace(/\s+/g,' ').trim();
   }
   const rows=[];
   for(const id of ids)for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let sample=0;sample<40;sample++){
    blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:family,total:10,
     usedSignatures:[],items:[],finished:false};qid='g5:'+id;
    const q=makeG5Question(id),el=document.createElement('div');el.innerHTML=q.text;
    const svg=el.querySelector('svg.mk-g5-mixed-wholes,svg.mk-g5-mixed-compare');
    let diagram=null;
    if(svg){
     const rows=[],comp=svg.classList.contains('mk-g5-mixed-compare');
     const all=[...svg.querySelectorAll('rect')],length=comp?2:(el.querySelector('svg.mk-g5-mixed-wholes')
      ?([...(svg.querySelectorAll('text'))].length):0);
     for(let i=0;i<length;i++){
      const y=comp?8+i*44:7+i*36,rects=all.filter(x=>Number(x.getAttribute('y'))===y),
       whole=rects.find(x=>x.getAttribute('fill')==='none');
      rows.push({width:Number(whole?.getAttribute('width')),
       cells:rects.filter(x=>x.getAttribute('fill')!=='none').map(x=>({
        x:Number(x.getAttribute('x')),width:Number(x.getAttribute('width')),
        filled:x.getAttribute('fill')==='#5d9cdc'
       }))});
     }
     diagram={rows,alt:svg.getAttribute('aria-label'),comparison:comp};
    }
    rows.push({id,level,family,sample,text:read(q.text,true),ex:read(q.ex,true),
     ans:String(q.ans),template:q.templateId,source:q.sourceTopicId,mode:q.answerMode,
     form:q.stage18AnswerForm,diagram,
     choices:q.choices.map(c=>({key:String(c.key),label:read(c.label)}))});
   }
   return {topics:g5AllTopics().length,rows};
  },IDS);
  assert.equal(data.topics,74);assert.equal(data.rows.length,1800);
  const families=new Set(),variation=new Map(),sum={frac_to_mixed:0,mixed_to_frac:0,mixed_compare:0};
  let diagrams=0,mixed=0,improper=0,single=0,reversed=0,diffDen=new Set();
  for(const q of data.rows){
   assert(q.text&&q.ex&&q.template,'Blank task '+q.id);
   assert.equal(q.source,q.id,'Wrong donor topic');
   assert(!/undefined|NaN|Infinity/.test(q.text+q.ex),'Malformed learner task '+q.text);
   oracle(q);
   if(validateDiagram(q))diagrams++;
   if(q.id==='mixed_compare'){
    if(q.level===0&&q.family===0){
     const m=allMixed(q);if(m[0].n>m[1].n)reversed++;
     diffDen.add(String(m[0].d));
    }
   }else{
    const a=expectedConversion(q);
    if(a.kind==='mixed')mixed++;else if(a.kind==='improper')improper++;else single++;
    assert(q.mode===(a.kind==='number'?'number':'fraction'),'Wrong intuitive answer-entry mode '+q.text);
    if(a.kind==='mixed')assert.equal(q.form?.kind,'mixed','Wrong input form for mixed answer');
    else if(a.kind==='improper')assert.equal(q.form?.kind,'exact','Wrong input form for improper answer');
   }
   const key=q.id+'/'+q.level+'/'+q.family;
   if(!variation.has(key))variation.set(key,new Set());
   variation.get(key).add(q.text);
   families.add(q.template);
  }
  assert.equal(variation.size,45,'Missing 45 family/tier slots');
  assert.equal(families.size,45,'Repeated cognitive family IDs');
  for(const [key,vs]of variation)assert(vs.size>=12,
   'Only '+vs.size+' visible task variants in '+key);
  assert.equal(diagrams,360,'Must render 240 conversion + 120 comparison SVGs');
  assert(reversed>0&&reversed<40,'Comparison never reverses source order');
  assert(diffDen.size>=8,'Mixed-number comparison denominators still too repetitive');
  assert(mixed>0&&improper>0&&single>0,'Lost required input forms');
  assert.deepEqual(errors,[],'Uncaught browser errors');
  console.log('G5_SEQUENTIAL_PARAGRAPH_31_PASS '+JSON.stringify({
   questions:data.rows.length,topics:IDS.length,families:variation.size,
   diagramChecks:diagrams,reversedComparisons:reversed,denominatorKinds:diffDen.size,
   entryModes:{mixed,improper,single}}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_31_FAIL',e.stack||e);process.exit(1)});
