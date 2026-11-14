'use strict';
// §30 independent visible-question oracle: derive every rational answer from displayed
// Russian wording and genuine SVG sharing strips, never from generator plans or answer keys.
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const ID='frac_division';
const gcd=(x,y)=>{x=x<0n?-x:x;y=y<0n?-y:y;while(y){[x,y]=[y,x%y]}return x};
function r(n,d=1n){n=BigInt(n);d=BigInt(d);assert(d>0n);const g=gcd(n,d);return {n:n/g,d:d/g}}
function add(a,b){return r(a.n*b.d+b.n*a.d,a.d*b.d)}
function sub(a,b){return r(a.n*b.d-b.n*a.d,a.d*b.d)}
const grab=(s,re,ctx)=>{const m=s.match(re);assert(m,'Unrecognised student text '+ctx+': '+s);return m.slice(1).map(BigInt)};
function solve(q){
 const s=q.text,t=q.level,p=q.slot,ctx=q.ctx;
 if(t===0){
  if(p===0||p===4){const [n,d]=grab(s,/частное (\d+)\s*:\s*(\d+)/,ctx);return r(n,d)}
  if(p===1){const [d,n]=grab(s,/На (\d+) учеников поровну разделили (\d+) пирогов/,ctx);return r(n,d)}
  if(p===2){const [d,n]=grab(s,/Между (\d+) учениками поровну разделили (\d+) одинаковых целых/,ctx);return r(n,d)}
  const [n,d]=grab(s,/Ленту длиной (\d+) м разрезали на (\d+) равных частей/,ctx);return r(n,d);
 }
 if(t===1){
  if(p===0){const [n,boxes,d]=grab(s,/Разделили (\d+) и ещё (\d+) пирогов поровну на (\d+) учеников/,ctx);return r(n+boxes,d)}
  if(p===1){const [total,taken,d]=grab(s,/Из (\d+) метров ленты отрезали (\d+) метров, остаток разделили на (\d+) частей/,ctx);return r(total-taken,d)}
  if(p===2){const [d,juice,water]=grab(s,/На (\d+) человек разделили (\d+) л сока и дополнительно (\d+) л воды/,ctx);return r(juice+water,d)}
  if(p===3){const [a,b,c,d]=grab(s,/Вычисли (\d+) : (\d+) \+ (\d+) : (\d+)/,ctx);return add(r(a,b),r(c,d))}
  const [boxes,candies,d]=grab(s,/Каждая из (\d+) коробок содержала (\d+) конфет\. Их разделили поровну между (\d+) людьми/,ctx);
  return r(boxes*candies,d);
 }
 if(p===0){const [n,boxes,d]=grab(s,/В первой коробке было (\d+) пирогов, во второй — (\d+)\. Все пироги поделили поровну между (\d+) детьми/,ctx);
  return r(n+boxes,d*2n)}
 if(p===1){const [n,boxes,d]=grab(s,/^(\d+) м ленты и (\d+) м ленты соединили, затем разделили на (\d+) частей/,ctx);
  return r(2n*(n+boxes),d)}
 if(p===2){const [n,d1,boxes,d2]=grab(s,/Ленту длиной (\d+) м разделили на (\d+) одинаковых отрезков\. Другую ленту длиной (\d+) м тоже разделили на (\d+) отрезков/,ctx);
  return add(r(n,d1),r(boxes,d2))}
 if(p===3){
  const m=s.match(/^(\d+) кг разделили на (\d+) равных упаковок\. Из каждой упаковки забрали (\d+(?:\/\d+)?) кг/);
  assert(m,'Cannot parse removed quantity '+ctx+': '+s);
  const taken=m[3].includes('/')?r(...m[3].split('/')):r(m[3]);
  return sub(r(m[1],m[2]),taken);
 }
 const m=s.match(/Сначала (\d+) литров разделили на (\d+) сосудов, затем добавили каждому по (\d+(?:\/\d+)?) л/);
 assert(m,'Cannot parse added liquid '+ctx+': '+s);
 const added=m[3].includes('/')?r(...m[3].split('/')):r(m[3]);
 return add(r(m[1],m[2]),added);
}
function readAnswer(s){
 if(/^\d+$/.test(s))return r(s);
 const m=s.match(/^(\d+)\s*\/\s*(\d+)$/);
 assert(m,'Malformed learner answer '+s);
 return r(m[1],m[2]);
}
function visual(q){
 if(!q.diagram)return false;
 assert.equal(q.level,0,'Picture leaked to a harder tier '+q.ctx);
 assert([0,2,4].includes(q.slot),'Picture not in sharing/conversion family '+q.ctx);
 const {n,d}=q.diagram;
 let source;
 if(q.slot===2){const [share,whole]=grab(q.text,/Между (\d+) учениками поровну разделили (\d+) одинаковых целых/,q.ctx);source=[whole,share]}
 else source=grab(q.text,/частное (\d+)\s*:\s*(\d+)/,q.ctx);
 assert.equal(BigInt(n),source[0],'Wrong number of whole models '+q.ctx);
 assert.equal(BigInt(d),source[1],'Wrong number of students '+q.ctx);
 assert.equal(q.diagram.rows.length,n,'Incorrect whole count '+q.ctx);
 for(const row of q.diagram.rows){
  assert.equal(row.borderWidth,480,'Bar should represent one full identical whole '+q.ctx);
  assert.equal(row.cells.length,d,'Wholes divided into wrong equal parts '+q.ctx);
  assert.equal(row.cells.filter(x=>x.selected).length,1,'Each student takes 1/d of each whole '+q.ctx);
  for(let i=0;i<row.cells.length;i++){
   assert(Math.abs(row.cells[i].width-480/d)<0.002,'Parts have unequal lengths '+q.ctx);
   if(i)assert(Math.abs(row.cells[i].x-(row.cells[i-1].x+row.cells[i-1].width))<0.005,
    'Detached whole fragments '+q.ctx);
  }
 }
 assert(q.diagram.alt.includes(n+'/'+d),'Accessible diagram does not identify quotient '+q.ctx);
 return true;
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(id=>{
   let seed=2026111530;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const read=(html,stripSvg=false)=>{
    const root=document.createElement('div');root.innerHTML=String(html);
    for(const el of [...root.querySelectorAll('.frac')]){
     const num=el.querySelector('.num')?.textContent?.trim(),den=el.querySelector('.den')?.textContent?.trim();
     if(num!==undefined&&den!==undefined)el.replaceWith(document.createTextNode(num+'/'+den));
    }
    if(stripSvg)root.querySelectorAll('svg').forEach(x=>x.remove());
    return root.textContent.replace(/\s+/g,' ').trim();
   };
   const rows=[];
   for(let level=0;level<3;level++)for(let slot=0;slot<5;slot++)for(let trial=0;trial<40;trial++){
    blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:slot,total:10,
     usedSignatures:[],items:[],finished:false};qid='g5:'+id;
    const q=makeG5Question(id),el=document.createElement('div');el.innerHTML=q.text;
    const svg=el.querySelector('svg.mk-g5-division-wholes');
    let diagram=null;
    if(svg){
     const m=svg.getAttribute('aria-label').match(/^(\d+) одинаковых целых разделили поровну между (\d+) людьми/);
     if(!m)throw Error('Malformed division model accessibility label');
     const n=+m[1],d=+m[2];
     const all=[...svg.querySelectorAll('rect')],rows=[];
     for(let i=0;i<n;i++){
      const y=5+i*35,rects=all.filter(x=>+x.getAttribute('y')===y);
      const border=rects.find(x=>x.getAttribute('fill')==='none');
      rows.push({borderWidth:+border.getAttribute('width'),
       cells:rects.filter(x=>x.getAttribute('fill')!=='none').map(x=>({
        x:+x.getAttribute('x'),width:+x.getAttribute('width'),
        selected:x.getAttribute('fill')==='#5d9cdc'}))});
     }
     diagram={n,d,rows,alt:svg.getAttribute('aria-label')};
    }
    const correct=q.choices.filter(x=>String(x.key)===String(q.ans));
    rows.push({ctx:id+'/'+level+'/'+slot+'/'+trial,level,slot,trial,source:q.sourceTopicId,
     template:q.templateId,text:read(q.text,true),ex:read(q.ex,true),
     ans:String(q.ans),choices:q.choices.map(x=>({key:String(x.key),label:read(x.label)})),
     diagram,steps:q.mk130?.steps});
   }
   return {rows,catalog:g5AllTopics().length};
  },ID);
  assert.equal(out.catalog,74,'Topic inventory changed');
  assert.equal(out.rows.length,600,'Wrong sample size');
  const slotSet=new Map(),templates=new Set(),ops=[[],[],[]];
  let pictures=0,integers=0,nonIntegers=0;
  for(const q of out.rows){
   assert.equal(q.source,ID,'Wrong active generator '+q.ctx);
   assert(q.text&&q.ex&&q.template,'Blank exercise '+q.ctx);
   assert(!/NaN|Infinity|undefined/.test(q.text+' '+q.ex),'Broken learner text '+q.ctx);
   assert(q.choices.length>=3,'Too few choices '+q.ctx);
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'No unique correct option '+q.ctx);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Duplicate visible choices '+q.ctx);
   const expect=solve(q),choice=q.choices.find(x=>x.key===q.ans),got=readAnswer(choice.label);
   assert.deepEqual(got,expect,'Incorrect answer determined independently from question '+q.ctx+': '+q.text);
   if(q.level===0&&[0,2,4].includes(q.slot)){
    assert(expect.d>1n,'Direct fraction conversion collapsed to a natural number '+q.ctx);
    assert(choice.label.includes('/'),'Required fraction answer was not displayed as a fraction '+q.ctx);
   }
   if(visual(q))pictures++;
   const key=q.level+'/'+q.slot; if(!slotSet.has(key))slotSet.set(key,new Set());
   slotSet.get(key).add(q.text);templates.add(q.template);
   ops[q.level].push(q.steps);if(got.d===1n)integers++;else nonIntegers++;
  }
  assert.equal(slotSet.size,15);
  assert.equal(templates.size,15);
  for(const [key,set]of slotSet)assert(set.size>=10,'Too few distinct questions '+key+': '+set.size);
  assert.equal(pictures,120,'Expected three picture families × 40');
  const means=ops.map(x=>x.reduce((s,y)=>s+y,0)/x.length);
  assert(means[0]<means[1]&&means[1]<means[2],'Difficulty not increasing '+means);
  assert.deepEqual(errors,[],'Uncaught browser errors');
  console.log('G5_SEQUENTIAL_PARAGRAPH_30_PASS '+JSON.stringify({
   problems:out.rows.length,families:templates.size,illustrations:pictures,integers,
   fractions:nonIntegers,meanSteps:means}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_30_FAIL',e.stack||e);process.exit(1)});
