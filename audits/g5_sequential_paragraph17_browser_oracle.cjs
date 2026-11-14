'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
function nums(s,re){let m=s.match(re);assert(m,'Unparsed learner question: '+s);return m.slice(1).map(Number)}
function expected(row){
 const s=row.text,t=row.level,p=row.family;
 let a,b,c,d;
 if(t===0){
  if(p===0||p===2){[a]=nums(s,/Вычисли (\d+)²/);return a*a}
  if(p===1){[a]=nums(s,/Вычисли (\d+)³/);return a**3}
  if(p===3){[a,b,c]=nums(s,/Найди значение произведения (\d+) · (\d+) · (\d+)/);assert.equal(a,b);assert.equal(b,c);return a*a*a}
  [a]=nums(s,/Найди квадрат числа (\d+)/);return a*a
 }
 if(t===1){
  if(p===0){[a,b]=nums(s,/Вычисли (\d+)² \+ (\d+)³/);return a*a+b**3}
  if(p===1){[a,b]=nums(s,/Вычисли \((\d+) \+ (\d+)\)²/);return (a+b)**2}
  if(p===2){[a,b]=nums(s,/Вычисли (\d+)² − (\d+)²/);return a*a-b*b}
  if(p===3){[a,b,c]=nums(s,/Найди значение (\d+) · (\d+)² \+ (\d+)/);return a*b*b+c}
  [a,b]=nums(s,/Вычисли (\d+)³ · (\d+)/);return a**3*b
 }
 if(p===0){[a,b,c]=nums(s,/Вычисли \((\d+) \+ (\d+)\)² − (\d+)²/);assert.equal(a,c);return (a+b)**2-a*a}
 if(p===1){[a,b,c]=nums(s,/Вычисли (\d+)² \+ (\d+)³ − (\d+)²/);assert.equal(b,c);return a*a+b**3-b*b}
 if(p===2){[a,b]=nums(s,/Сторона квадрата (\d+) см\. Её увеличили на (\d+) см/);return (a+b)**2-a*a}
 if(p===3){[a,b,c]=nums(s,/Вычисли (\d+)³ · (\d+)² \+ (\d+)²/);return a**3*b*b+c*c}
 [a,b,c,d]=nums(s,/Из числа \((\d+) \+ (\d+)\)² вычли (\d+)² и прибавили (\d+)³/);assert.equal(b,c);return (a+b)**2-b*b+d**3
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(()=>{
   let seed=2026111417;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<40;trial++){
    qid='g5:powers';blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question('powers'),div=document.createElement('div');div.innerHTML=String(q.text);
    rows.push({level,family,trial,text:div.textContent,meta:q.mk126,answer:q.correctLabel,source:q.sourceTopicId,ex:q.ex,choices:q.choices.map(x=>x.label)});
   }
   return {rows,count:g5AllTopics().length,lesson:String(g5Lesson('powers'))};
  });
  assert.equal(out.rows.length,600);assert.equal(out.count,74);
  assert(out.lesson.includes('основанием')&&out.lesson.includes('показателем'));
  const varieties=new Map(),levels=[[],[],[]];
  for(const row of out.rows){
   const ctx=row.level+'/'+row.family+'/'+row.trial,v=expected(row),m=row.meta;
   assert(m&&m.id==='powers'&&m.t===row.level&&m.p===row.family,'Wrong active generator '+ctx);
   assert.equal(row.source,'powers');assert.equal(v,m.expected,'Wrong expression plan '+ctx);
   assert.equal(Number(row.answer),v,'Wrong visible answer '+ctx);
   assert.equal(new Set(row.choices.map(String)).size,row.choices.length,'Duplicated choices '+ctx);
   assert(row.ex.includes('Ответ: '+v+'.'),'Wrong explanation '+ctx);
   assert(!/NaN|undefined|Infinity/.test(row.ex));
   assert(row.ex.includes('·'),'No demonstrated multiplication '+ctx);
   const slot=row.level+'/'+row.family;
   if(!varieties.has(slot))varieties.set(slot,new Set());varieties.get(slot).add(row.text);
   levels[row.level].push(m.steps);
  }
  assert.equal(varieties.size,15);
  for(const [slot,seen]of varieties)assert(seen.size>=10,'Insufficient diversity '+slot+' = '+seen.size);
  const means=levels.map(v=>v.reduce((a,b)=>a+b,0)/v.length);
  assert(means[0]<means[1]&&means[1]<means[2],'Difficulty levels not growing '+means);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_17_PASS '+JSON.stringify({questions:600,families:15,meanSteps:means}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_17_FAIL',e.stack||e);process.exit(1)});
