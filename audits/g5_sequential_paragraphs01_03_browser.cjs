'use strict';
const {chromium}=require('playwright'),path=require('node:path'),assert=require('node:assert/strict'),fs=require('node:fs');
const topics=[['number_tables',1],['natural',2],['segments_polygons',3]];
const N=20;
function evalInt(plan){
 const [op,...x]=plan,E=evalInt;
 if(op==='v')return BigInt(x[0]);
 if(op==='add')return x.reduce((a,y)=>a+E(y),0n);
 if(op==='sub')return E(x[0])-E(x[1]);
 if(op==='mul')return E(x[0])*E(x[1]);
 if(op==='div'){const a=E(x[0]),b=E(x[1]);assert(b!==0n&&a%b===0n,'Invalid exact integer division');return a/b}
 if(op==='abs'){const n=E(x[0]);return n<0n?-n:n}
 if(op==='mod'){const a=E(x[0]),b=E(x[1]);assert(a>=0n&&b>0n);return a%b}
 throw Error('Unknown independent math opcode '+op);
}
function expectTable(q){
 const rows=q.grid;
 assert(rows&&rows.length>=1,'Missing real table '+q.level+'/'+q.family);
 const a=rows[0][0],b=rows[0][1],c=rows[0][2],d=rows[0][3],e=rows[1]?.[3];
 assert([a,b,c].every(Number.isSafeInteger),'§1 table must contain valid values');
 if(q.level===0){
  const values=[
   a,a+b,a+b+c,Math.max(a,b,c)-Math.min(a,b,c),
   Number((q.text.match(/За четыре дня продали (\d+) товаров/)||[])[1])-(a+b+c)
  ];
  assert.equal(String(values[q.family]),q.ans,'§1 warmup table not aligned with answer');
  assert.equal(rows[0].length,3,'Warmup must have three shown days');
 }else if(q.level===1){
  const values=[Math.abs(d-b),a+b+c,b+d,Math.abs(a+c-b),Math.abs(b+c-d)];
  assert.equal(String(values[q.family]),q.ans,'§1 training table not aligned with answer');
 }else{
  const journal=rows[1];
  const values=[
   a+2*b+2*c+d,
   a+d+journal[0]+journal[3],
   Math.abs(a+c-journal[1]-journal[2]),
   Number((q.text.match(/За пять дней продали (\d+) книг/)||[])[1])-(a+b+c+d),
   b+c+d+Number((q.text.match(/дополнительно (\d+) книг/)||[])[1])
  ];
  assert.equal(String(values[q.family]),q.ans,'§1 master must compute what table and question actually say');
 }
}
(async()=>{
 const nav=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
 for(const [id,n]of topics)assert(nav.includes("["+n+",'"),'Missing paragraph '+n);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const output=await page.evaluate(topics=>{
   let seed=202611130103;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const out=[],stages=[],ids=topics.map(([id])=>id);
   for(const id of ids)for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<20;trial++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),container=document.createElement('div');
    container.innerHTML=String(q.text);
    const table=container.querySelector('table');
    const rows=table?[...table.querySelectorAll('tbody tr')].map(row=>[...row.querySelectorAll('td')].map(el=>Number(el.textContent))):null;
    const svg=container.querySelector('svg'),shape=svg?{
     svg:svg.outerHTML,role:svg.getAttribute('role'),viewBox:svg.getAttribute('viewBox'),
     type:svg.getAttribute('data-lengths')?'polyline':svg.getAttribute('data-sides')?'triangle':svg.getAttribute('aria-label')?.startsWith('Отрезок AB')?'segment':'unknown',
     lengths:svg.getAttribute('data-lengths'),sides:svg.getAttribute('data-sides'),
     lines:[...svg.querySelectorAll('line')].map(l=>['x1','y1','x2','y2'].map(a=>Number(l.getAttribute(a)))),
     circles:[...svg.querySelectorAll('circle')].map(c=>Number(c.getAttribute('cx'))),
     trianglePath:svg.querySelector('path')?.getAttribute('d'),
     labels:[...svg.querySelectorAll('text')].map(x=>x.textContent)
    }:null;
    out.push({id,level,family,trial,text:String(q.text).replace(/<[^>]*>/g,''),ex:q.ex,ans:String(q.ans),choices:q.choices.map(x=>({key:String(x.key),label:String(x.label)})),
      template:q.templateId,meta:q.mk125||q.mk123||q.mk122||q.mk5Audit,grid:rows,caption:table?.querySelector('caption')?.textContent||null,
      colHeaders:table?[...table.querySelectorAll('thead th')].map(x=>x.textContent):null,shape});
   }
   renderGrade5();
   const links=ids.map(id=>({id,number:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="'+id+'"]').length}));
   return {count:g5AllTopics().length,questions:out,links};
  },topics);
  assert.equal(output.count,74,'74-topic catalog must remain unchanged');
  assert.equal(output.questions.length,900,'Expected 3×3×5×20 real questions');
  assert(output.links.every(x=>x.number===1),'Textbook links missing or duplicated '+JSON.stringify(output.links));
  const families=new Map(),difficulty=new Map(),pictures={segment:0,polyline:0,triangle:0},zeroDigit=0,tableChecks=0;
  for(const q of output.questions){
   const k=q.id+' '+q.level+' '+q.family+' '+q.trial;
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'Correct choice missing '+k);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Visible answer repetition '+k);
   assert(!/undefined|NaN|Infinity/.test(q.text+q.ex),'Malformed task '+k);
   const slot=q.id+'/'+q.level+'/'+q.family;
   if(q.trial===0){assert(!families.has(slot));families.set(slot,q.template)}
   else assert.equal(q.template,families.get(slot),'Family changed unexpectedly '+k);
   if(q.meta?.plan){
    const independent=evalInt(q.meta.plan);
    assert.equal(independent.toString(),String(q.meta.expected),'Mathematical formula differs from its answer '+k);
    assert.equal(q.ans,independent.toString(),'Learner answer differs from independent oracle '+k);
    const key=q.id+'#'+q.level;const a=difficulty.get(key)||[];a.push(Number(q.meta.steps));difficulty.set(key,a);
   }else if(q.id==='number_tables'&&q.level===0){
    assert.equal(q.ans,String(q.meta?.expected),'Incorrect warmup answer '+k);
   }else throw Error('Missing numerical verification plan '+k);
   if(q.id==='natural'&&q.level<2&&q.trial!==0&&/\b\d*0\d*\b/.test(q.text))zeroDigit++;
   if(q.id==='number_tables'){
    assert(q.caption&&/продаж/i.test(q.caption),'Missing table caption '+k);
    assert(q.colHeaders[0]===(q.level===0?'Показатель':'Издание'),'Wrong first column name '+k);
    expectTable(q);tableChecks++;
   }
   if(q.id==='segments_polygons'){
    if(!q.shape)continue;
    assert.equal(q.shape.role,'img','SVG must be accessible '+k);
    const sh=q.shape;
    if(sh.type==='segment'){
     assert(q.level===0&&q.family===0,'Segment image in wrong family');
     const m=sh.svg.match(/части (\d+) и (\d+) сантиметров/),[a,b]=m.slice(1).map(Number);
     const [x1,x2,x3]=sh.circles,ratio=(x2-x1)/(x3-x2);
     assert(Math.abs(ratio-a/b)<0.002,'A–C / C–B diagram not proportional '+k);
     pictures.segment++;
    }else if(sh.type==='polyline'){
     const lengths=sh.lengths.split(',').map(Number);
     assert.equal(sh.lines.length,lengths.length,'Missing polyline link '+k);
     const scales=sh.lines.map(([x1,y1,x2,y2],i)=>Math.hypot(x2-x1,y2-y1)/lengths[i]);
     assert(Math.max(...scales)-Math.min(...scales)<0.008,'Broken-line drawing misleading lengths '+k);
     if(q.level===1&&q.family===0)assert(sh.labels.includes('?'),'Unknown link must be hidden');
     pictures.polyline++;
    }else if(sh.type==='triangle'){
     const sides=sh.sides.split(',').map(Number);
     const nums=(sh.trianglePath.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
     assert(nums.length>=6,'Missing triangle vertices');
     const [ax,ay,bx,by,cx,cy]=nums;
     const drawn=[Math.hypot(ax-cx,ay-cy),Math.hypot(bx-cx,by-cy),Math.hypot(ax-bx,ay-by)];
     const scaled=drawn.map((v,i)=>v/sides[i]);
     assert(Math.max(...scaled)-Math.min(...scaled)<0.008,'Triangle is not drawn to the given side lengths '+k);
     if(q.level===1&&q.family===1)assert(sh.labels.includes('?'),'Unknown triangle side must be hidden');
     pictures.triangle++;
    }else throw Error('Unexpected geometry artwork '+k);
   }
  }
  assert.equal(families.size,45,'Three sequential paragraphs should contain 45 different slots');
  assert.deepEqual(pictures,{segment:20,polyline:60,triangle:60},'Expected 140 genuinely measured geometric drawings');
  assert.equal(tableChecks,300,'Every table problem must read a table');
  assert(zeroDigit>0,'§2 should really practice the zero digit');
  for(const id of ['natural','segments_polygons']){
   const means=[0,1,2].map(level=>{const a=difficulty.get(id+'#'+level);return a.reduce((s,x)=>s+x,0)/a.length});
   assert(means[0]<means[1]&&means[1]<means[2],'Difficulty must increase across three stages for '+id+' '+means);
  }
  const means=[1,2].map(level=>{const a=difficulty.get('number_tables#'+level);return a.reduce((s,x)=>s+x,0)/a.length});
  assert(means[0]<means[1],'§1 training and master difficulty must increase');
  assert.deepEqual(errors,[],'Uncaught browser runtime exception');
  console.log('G5_SEQUENTIAL_PARAGRAPHS_01_03_PASS '+JSON.stringify({paragraphs:[1,2,3],topics:topics.map(t=>t[0]),questions:output.questions.length,families:families.size,tableChecks,zeroDigitSamples:zeroDigit,visualChecks:pictures,links:output.links.length}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPHS_01_03_FAIL',e.stack||e);process.exit(1)});
