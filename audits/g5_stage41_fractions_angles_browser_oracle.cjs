'use strict';
const {chromium}=require('playwright'),path=require('node:path'),assert=require('node:assert/strict');
const ids=['frac_parts','frac_ray','mixed_compare','angle_types','angles'];
function numericPlan(plan){
 const [op,...a]=plan,E=numericPlan;
 if(op==='v')return BigInt(a[0]);
 if(op==='add')return a.reduce((s,v)=>s+E(v),0n);
 if(op==='sub')return E(a[0])-E(a[1]);
 if(op==='mul')return E(a[0])*E(a[1]);
 if(op==='div'){const x=E(a[0]),y=E(a[1]);assert(y!==0n&&x%y===0n,'Uneven division');return x/y;}
 if(op==='abs'){const n=E(a[0]);return n<0n?-n:n;}
 throw Error('Unexpected operation '+op);
}
function compareOps(xs,ops){
 assert.equal(xs.length-1,ops.length);
 return xs.reduce((acc,v,i)=>i===0?BigInt(v):ops[i-1]==='+'?acc+BigInt(v):acc-BigInt(v),0n);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const samples=await page.evaluate(ids=>{
   let seed=2026111341;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const topics=g5AllTopics(),rows=[];
   for(const id of ids)for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let repeat=0;repeat<20;repeat++){
    qid='g5:'+id;
    blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id);
    rows.push({id,level,family,repeat,text:String(q.text),ans:String(q.ans),
     choices:q.choices.map(c=>({key:String(c.key),label:String(c.label)})),
     template:q.templateId,ex:String(q.ex),audit:q.mk5Audit,
     methods:q.mk5Pedagogy,mixed:q.mk115,angles:q.mk126});
   }
   return {topics:topics.length,rows};
  },ids);
  assert.equal(samples.topics,74,'Existing 74 Grade 5 topics must remain stable');
  assert.equal(samples.rows.length,1500,'5 topics × 15 families × 20 variations');
  const uniqueFamilies=new Map(),titles=new Map();
  for(const q of samples.rows){
   const right=q.choices.filter(c=>c.key===q.ans);
   assert.equal(right.length,1,'No unique answer '+q.id+' '+q.level+'/'+q.family);
   assert.equal(new Set(q.choices.map(c=>c.label)).size,q.choices.length,'Duplicate visible options '+q.id);
   assert(!/NaN|undefined|Infinity/.test(q.text+q.ex),'Malformed question '+q.id);
   const k=q.id+'_'+q.level+'_'+q.family;
   if(q.repeat===0){
    uniqueFamilies.set(k,q.template);
    if(!titles.has(q.id))titles.set(q.id,new Set());
    titles.get(q.id).add(q.template);
   } else assert.equal(q.template,uniqueFamilies.get(k),'Family ID drift '+k);
   if(q.id==='mixed_compare'){
    assert(q.mixed&&q.mixed.id===q.id,'Missing comparison metadata');
    if(q.mixed.kind==='compare'){
     const l=compareOps(q.mixed.left,q.mixed.opsLeft),r=compareOps(q.mixed.right,q.mixed.opsRight);
     const expected=l<r?'lt':l>r?'gt':'eq';
     assert.equal(q.ans,expected,'Independent comparison key mismatch');
    }else if(q.mixed.kind==='numeric'){
     const x=compareOps(q.mixed.terms,q.mixed.ops);
     const abs=q.mixed.absolute?(x<0n?-x:x):x;
     assert.equal(q.ans,String(abs),'Independent numeric mixed comparison mismatch');
     if(q.level===1&&q.family===4)assert(BigInt(q.mixed.terms[0])>BigInt(q.mixed.terms[1]),'Negative mixed-number numerator after subtraction');
    }else throw Error('Unexpected mixed comparison task '+q.mixed.kind);
   }
   if(q.id==='angles'){
    assert(q.angles&&q.angles.id===q.id,'Missing §51 arithmetic plan');
    assert.equal(q.ans,numericPlan(q.angles.plan).toString(),'Independent angle measurement answer mismatch');
   }
   if(q.id==='angle_types'){
    assert(q.methods&&q.methods.stage===q.level,'Missing §50 lesson difficulty');
    assert(q.audit&&q.audit.expected!==undefined,'Missing §50 oracle metadata');
    const label=right[0].label;
    assert.equal(String(q.audit.expected),label,'§50 displayed answer does not match generator');
   }
   if(q.id==='frac_parts'||q.id==='frac_ray'){
    assert(q.audit&&q.audit.expected!==undefined,'Missing §26 arithmetic metadata');
    assert.equal(q.ans,String(q.audit.expected),'§26 answer is inconsistent with internal computed key');
   }
  }
  for(const id of ids)assert.equal(titles.get(id)?.size,15,'Not 15 lesson families for '+id);
  const visual=await page.evaluate(rows=>{
   const check=(x,m)=>{if(!x)throw Error(m)};
   let angleFigures=0,triangleFigures=0,splitFigures=0,protractors=0,shadedFigures=0,coordinateChecks=0;
   for(const q of rows){
    const element=document.createElement('div');element.innerHTML=q.text;
    if(q.id==='angle_types'&&q.level===0&&(q.family===0||q.family===1)){
     const svg=element.querySelector('svg[aria-label^="Чертёж угла"]');
     check(svg,'Missing §50 visual angle '+q.family);
     const deg=Number(svg.getAttribute('aria-label').match(/(\d+) градусов/)[1]);
     const ln=[...svg.querySelectorAll('line')];
     check(ln.length===2,'Angle must show exactly two sides');
     const x=Number(ln[1].getAttribute('x2'))-210,y=177-Number(ln[1].getAttribute('y2'));
     const measured=Math.atan2(y,x)*180/Math.PI;
     check(Math.abs(measured-deg)<.08,'SVG angle differs from numeric measure: '+measured+' vs '+deg);
     check((q.family===0&&deg<90)||(q.family===1&&deg>90&&deg<180),'Wrong acute/obtuse generation');
     angleFigures++;
    }
    if(q.id==='angle_types'&&q.level===0&&q.family===4){
     const svg=element.querySelector('svg[aria-label^="Чертёжный треугольник"]');
     check(svg&&svg.querySelectorAll('path').length===2,'Missing actual set square right-angle marker');
     triangleFigures++;
    }
    if(q.id==='angle_types'&&q.level===1&&q.family===1){
     const svg=element.querySelector('svg[aria-label^="Прямой угол разделён"]');
     check(svg,'Missing decomposed 90-degree diagram');
     const deg=Number(svg.getAttribute('aria-label').match(/на (\d+) градусов/)[1]);
     const plus=Number(element.textContent.match(/прибавь к нему (\d+)°/)[1]);
     check(q.ans===String(90-deg+plus),'Wrong independent split-right-angle answer');
     splitFigures++;
    }
    if(q.id==='angles'&&((q.level===0&&(q.family===0||q.family===1))||(q.level===1&&q.family===2))){
     const svg=element.querySelector('svg[aria-label^="Транспортир"]');
     check(svg,'Missing protractor drawing');
     const deg=Number(svg.getAttribute('aria-label').match(/углом (\d+) градусов/)[1]);
     const lines=[...svg.querySelectorAll('line[stroke="#de853c"]')];
     check(lines.length===2,'Missing two angle rays in protractor');
     const x=Number(lines[1].getAttribute('x2'))-195,y=189-Number(lines[1].getAttribute('y2'));
     check(Math.abs(Math.atan2(y,x)*180/Math.PI-deg)<.08,'Protractor shown degree differs from problem');
     if(q.level===1)check(q.ans===String(180-deg),'Wrong supplementary protractor answer');
     else check(q.ans===String(deg),'Wrong right/straight protractor answer');
     protractors++;
    }
    if(q.id==='frac_parts'&&q.level===1&&q.family===3){
     const svg=element.querySelector('svg[aria-label^="Равные части целого"]');
     check(svg,'Question referring to diagram must actually include a diagram');
     const rects=[...svg.querySelectorAll('rect')],shaded=rects.filter(x=>x.getAttribute('fill')==='#5d9cdc');
     check(rects.length>=3&&shaded.length>=1&&shaded.length<rects.length,'Invalid fractional bar visual');
     shadedFigures++;
    }
    if(q.id==='frac_ray'&&((q.level===0&&q.family===0)||(q.level===1&&q.family===2))){
     const svg=element.querySelector('svg.mk-v114-ray');
     check(svg,'Missing coordinate line');
     const ticks=[...svg.querySelectorAll('line[y1="43"]')];
     check(ticks.length>=3,'Missing tick marks 0, 1 and 2');
     const dot=svg.querySelector('circle[fill="#e94d65"]');
     check(dot,'Missing plotted point');
     const coord=(Number(dot.getAttribute('cx'))-Number(ticks[0].getAttribute('x1')))/
      (Number(ticks[1].getAttribute('x1'))-Number(ticks[0].getAttribute('x1')));
     const [n,d]=q.ans.split('/').map(Number);
     check(Number.isFinite(n/d)&&Math.abs(coord-n/d)<.0001,'Rendered point does not match accepted fraction');
     coordinateChecks++;
    }
   }
   return {angleFigures,triangleFigures,splitFigures,protractors,shadedFigures,coordinateChecks};
  },samples.rows);
  assert.equal(visual.angleFigures,40);
  assert.equal(visual.triangleFigures,20);
  assert.equal(visual.splitFigures,20);
  assert.equal(visual.protractors,60);
  assert.equal(visual.shadedFigures,20);
  assert.equal(visual.coordinateChecks,40);
  const links=await page.evaluate(()=>{
   renderGrade5();
   const ids=['frac_parts','frac_ray','mixed_compare','angle_types','angles'];
   return ids.map(id=>({id,found:[...document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link')].filter(x=>x.dataset.topicId===id).length}));
  });
  for(const v of links)assert.equal(v.found,1,'Broken textbook link '+v.id);
  console.log('G5_STAGE41_REAL_BROWSER_PASS '+JSON.stringify({topics:ids.length,questions:samples.rows.length,families:75,visual,links:links.length}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_STAGE41_REAL_BROWSER_FAIL',e.stack||e);process.exit(1)});
