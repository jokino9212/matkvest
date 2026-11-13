'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const ID='coordinate',REPEAT=40;
function math(node){
 const [op,...args]=node,E=math;
 if(op==='v')return BigInt(args[0]);
 if(op==='add')return args.reduce((s,v)=>s+E(v),0n);
 if(op==='sub')return E(args[0])-E(args[1]);
 if(op==='mul')return E(args[0])*E(args[1]);
 if(op==='div'){const a=E(args[0]),b=E(args[1]);assert(b!==0n&&a%b===0n);return a/b;}
 if(op==='abs'){const a=E(args[0]);return a<0n?-a:a;}
 if(op==='mod'){const a=E(args[0]),b=E(args[1]);assert(a>=0n&&b>0n);return a%b;}
 throw Error('Unknown integer arithmetic operation '+op);
}
const capture=(str,re,context)=>{const m=str.match(re);assert(m,'Cannot read actual question '+context+': '+str);return m.slice(1).map(Number)};
function expectedByQuestion(q){
 const t=q.level,f=q.family,s=q.question,pts=q.points,n=(a)=>pts[a];
 if(t===0){
  if(f===0)return n('A'); // Read the ACTUAL visible x-location on an independently graduated axis.
  if(f===1){const [a,b]=capture(s,/A\((\d+)\).*B\((\d+)\)/,'0/1');assert.equal(n('A'),a);assert.equal(n('B'),b);return b-a;}
  if(f===2){const [a,c]=capture(s,/A\((\d+)\).*прошли (\d+) единичных делений вправо/,'0/2');assert.equal(n('A'),a);assert.equal(n('B'),a+c);return a+c;}
  if(f===3){const [c,b]=capture(s,/C\((\d+)\).*прошли (\d+) делений влево/,'0/3');assert.equal(n('C'),c);assert.equal(n('D'),c-b);return c-b;}
  if(f===4){const [a,b]=capture(s,/A\((\d+)\), B\((\d+)\)/,'0/4');assert.equal(n('A'),a);assert.equal(n('B'),b);assert.equal(n('M')*2,a+b);return (a+b)/2;}
 }
 if(t===1){
  if(f===0){const [a,c,d]=capture(s,/A\((\d+)\).*вправо (\d+) делений, затем влево (\d+)/,'1/0');assert.equal(n('A'),a);assert.equal(n('K'),a+c-d);return a+c-d;}
  if(f===1){const [a,b]=capture(s,/A\((\d+)\), B\((\d+)\)/,'1/1');assert.equal(n('M')*2,a+b);return (a+b)/2;}
  if(f===2){const [b,delta]=capture(s,/точки B равна (\d+).*прошли (\d+) делений/,'1/2');assert.equal(n('B'),b);assert.equal(n('A'),b-delta);return b-delta;}
  if(f===3){const [a,b,c]=capture(s,/A\((\d+)\).*влево (\d+) делений.*вправо (\d+) делений/,'1/3');assert.equal(n('A'),a);assert.equal(n('K'),a-b+c);return a-b+c;}
  if(f===4){const [a,b,c]=capture(s,/A\((\d+)\), B\((\d+)\), C\((\d+)\)/,'1/4');assert.equal(n('A'),a);assert.equal(n('B'),b);assert.equal(n('C'),c);return c-a;}
 }
 if(t===2){
  if(f===0){const [a,b,da,db]=capture(s,/A\((\d+)\) и B\((\d+)\).*влево на (\d+) делений.*вправо на (\d+)/,'2/0');assert.equal(n('A'),a);assert.equal(n('B'),b);assert.equal(n('A₁'),a-da);assert.equal(n('B₁'),b+db);return b+db-a+da;}
  if(f===1){const [m,a]=capture(s,/M\((\d+)\).*A\((\d+)\)/,'2/1');assert.equal(n('M'),m);assert.equal(n('A'),a);assert.equal(n('B'),2*m-a);return 2*m-a;}
  if(f===2){const [a,b,c,d]=capture(s,/A\((\d+)\).*прошли (\d+) делений вправо.*затем ещё (\d+) вправо.*после этого (\d+) влево/,'2/2');assert.equal(n('K'),a+b+c-d);return a+b+c-d;}
  if(f===3){const [a,b,c,da,dc]=capture(s,/A\((\d+)\), B\((\d+)\), C\((\d+)\).*A переместили вправо на (\d+) делений.*C — вправо на (\d+) делений/,'2/3');assert(da>0&&da<b-a);assert.equal(n('A₁'),a+da);assert.equal(n('C₁'),c+dc);return b-a-da+c+dc-b;}
  if(f===4){const [a,d,b]=capture(s,/A\((\d+)\).*вернулись влево на (\d+) делений.*точке B\((\d+)\)/,'2/4');assert.equal(n('A'),a);assert.equal(n('B'),b);return b+d-a;}
 }
 throw Error('No independent semantic answer for '+t+'/'+f);
}
(async()=>{
 const nav=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
 assert(nav.includes("[5,'Шкалы и координатная прямая',['coordinate']]"),'Wrong §5 textbook mapping');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(({id,repeats})=>{
   let seed=2026111305;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const rows=[],details={ticks:0,pointChecks:0,axisChecks:0,hiddenChecks:0,fragments:0,zeroOrigin:0};
   const requireVisual=(cond,message)=>{if(!cond)throw Error('§5 visual geometry: '+message)};
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<repeats;trial++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),root=document.createElement('div');root.innerHTML=String(q.text);
    const question=root.childNodes[0]?.textContent||'';
    const svg=root.querySelector('.mk-g5-coordinate-diagram svg'),key=level+'/'+family+'/'+trial;
    requireVisual(svg?.getAttribute('role')==='img'&&svg.getAttribute('width')==='100%'&&svg.getAttribute('viewBox'),'Missing responsive accessible coordinate ray '+key);
    requireVisual(svg.querySelector('.mk-g5-coord-axis')&&svg.querySelector('polygon'),'Missing coordinate ray with direction arrow '+key);
    requireVisual(svg.getAttribute('aria-label').includes('деления через одну единицу'),'No unit scale declaration '+key);
    requireVisual(!/NaN|undefined|Infinity/.test(svg.outerHTML),'Invalid SVG geometry '+key);
    const ticks=[...svg.querySelectorAll('.mk-g5-coord-tick')].map(e=>({at:Number(e.getAttribute('data-at')),x:Number(e.getAttribute('x1'))}));
    requireVisual(ticks.length>=6,'Too few actual coordinate graduations '+key);
    const scale=(ticks.at(-1).x-ticks[0].x)/(ticks.length-1);
    requireVisual(scale>0,'Coordinate scale must increase from left to right '+key);
    for(let j=1;j<ticks.length;j++){
     requireVisual(ticks[j].at===ticks[j-1].at+1,'Axis jumps over a unit coordinate '+key);
     requireVisual(Math.abs(ticks[j].x-ticks[0].x-j*scale)<.015,'Non-uniform interval widths '+key);
    }
    const numericLabels=[...svg.querySelectorAll('.mk-g5-coord-label')].map(e=>({number:Number(e.textContent),x:Number(e.getAttribute('x'))}));
    for(const label of numericLabels){
     const tick=ticks.find(p=>p.at===label.number);requireVisual(tick&&Math.abs(tick.x-label.x)<.015,'Wrong number under tick '+key);
    }
    details.ticks+=ticks.length;details.axisChecks++;
    if(ticks[0].at===0){requireVisual(svg.textContent.includes('Единичный отрезок'),'Unexplained origin '+key);details.zeroOrigin++;}
    else{requireVisual(svg.textContent.includes('Фрагмент координатного луча'),'Nonzero start disguised as origin '+key);details.fragments++;}
    const dots=[...svg.querySelectorAll('.mk-g5-coord-point')],labels=[...svg.querySelectorAll('.mk-g5-coord-point-label')];
    requireVisual(dots.length===labels.length,'Every coordinate point needs an own name '+key);
    const points={};
    for(let j=0;j<dots.length;j++){
     const cx=Number(dots[j].getAttribute('cx')),on=ticks.find(z=>Math.abs(z.x-cx)<.015);
     requireVisual(on,'Point is not precisely on an integer graduation '+key);
     const names=labels[j].textContent.split(/,\s*/).filter(Boolean);
     requireVisual(names.length>=1,'Nameless point '+key);
     for(const name of names){
      requireVisual(points[name]===undefined,'Duplicate plotted point label '+name+' '+key);
      points[name]=on.at;details.pointChecks++;
     }
    }
    const hidden=level===0
      ?(family===0?'A':family===2?'B':family===3?'D':family===4?'M':null)
      :level===1
       ?(family===0?'K':family===1?'M':family===2?'A':family===3?'K':null)
       :[null,'B','K',null,null][family];
    if(hidden){
     requireVisual(points[hidden]!==undefined,'Missing hidden unknown point '+key);
     requireVisual(!numericLabels.some(l=>l.number===points[hidden]),'Unknown point coordinate is explicitly printed next to its tick '+key);
     details.hiddenChecks++;
    }
    rows.push({level,family,trial,question,ans:String(q.ans),
      choices:q.choices.map(e=>({label:String(e.label),key:String(e.key)})),
      template:q.templateId,meta:q.mk125,points,questionHtml:String(q.text),ex:String(q.ex)});
   }
   renderGrade5();
   const links=[...document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="coordinate"]')];
   return {topics:g5AllTopics().length,rows,details,links:links.length,lesson:String(g5Lesson(id))};
  },{id:ID,repeats:REPEAT});
  assert.equal(result.topics,74,'Keep all existing 74 grade-five topics');
  assert.equal(result.rows.length,600,'15 families × 40 examples');
  assert.equal(result.links,1,'Wrong §5 textbook link count');
  assert(/Шкала|Шкале|Шкалу/.test(result.lesson)&&result.lesson.includes('единичн'),'Missing §5 explanatory theory');
  const slots=new Map(),variety=new Map(),complexity=[[],[],[]],byFamily={};
  for(const q of result.rows){
   const key=q.level+'/'+q.family+'/'+q.trial,slot=q.level+'/'+q.family,meta=q.meta;
   assert.equal(q.choices.filter(x=>x.key===q.ans).length,1,'Incorrect unique answer key '+key);
   assert.equal(new Set(q.choices.map(x=>x.label)).size,q.choices.length,'Duplicated answer label '+key);
   assert(meta&&meta.id===ID&&meta.t===q.level&&meta.p===q.family,'Wrong learner-facing generator selected '+key);
   assert.equal(q.ans,math(meta.plan).toString(),'BigInt answer different from generator '+key);
   const visibleAnswer=expectedByQuestion(q);
   assert(Number.isSafeInteger(visibleAnswer)&&visibleAnswer>=0,'Invalid grade-five coordinate result '+key);
   assert.equal(q.ans,String(visibleAnswer),'Independent answer from REAL wording and geometry differs '+key);
   assert.equal(meta.expected,visibleAnswer,'Metadata answer mismatch '+key);
   complexity[q.level].push(meta.steps);
   if(!slots.has(slot))slots.set(slot,q.template);
   else assert.equal(q.template,slots.get(slot),'Family template unexpectedly changed '+key);
   const set=variety.get(slot)||new Set();set.add(JSON.stringify({q:q.question,points:q.points}));variety.set(slot,set);
  }
  assert.equal(slots.size,15,'All 15 §5 slots required');
  for(const [slot,set]of variety)assert(set.size>=5,'Numerical and geometric variety too low '+slot+': '+set.size);
  const avg=complexity.map(a=>a.reduce((x,y)=>x+y,0)/a.length);
  assert(avg[0]<avg[1]&&avg[1]<avg[2],'Unrealistic difficulty progression '+avg);
  assert.equal(result.details.axisChecks,600);
  assert.equal(result.details.hiddenChecks,400,'Some secret coordinates are not protected'); // 4+4+2 hidden families × 40 = 400
  assert(result.details.fragments>0&&result.details.zeroOrigin>0,'Must teach both original ray and fragment');
  assert.deepEqual(errors,[],'Uncaught browser runtime error');
  console.log('G5_SEQUENTIAL_PARAGRAPH_05_PASS '+JSON.stringify({paragraph:5,topics:1,questions:result.rows.length,families:slots.size,meanSteps:avg,geometry:result.details,links:result.links}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_05_FAIL',e.stack||e);process.exit(1)});
