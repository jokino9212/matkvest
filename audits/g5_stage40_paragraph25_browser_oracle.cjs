'use strict';
const {chromium}=require('playwright'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const route=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
assert(route.includes("[25,'Окружность, круг, шар, цилиндр',['frac_shapes']]"),'§25 must route to corrected topic ID');
function intPlan(node){
 const [op,...v]=node,E=intPlan;
 if(op==='v')return BigInt(v[0]);
 if(op==='add')return v.reduce((s,x)=>s+E(x),0n);
 if(op==='sub')return E(v[0])-E(v[1]);
 if(op==='mul')return E(v[0])*E(v[1]);
 if(op==='div'){const a=E(v[0]),b=E(v[1]);assert(b!==0n&&a%b===0n,'Noninteger division');return a/b;}
 if(op==='abs'){const x=E(v[0]);return x<0n?-x:x;}
 throw Error('Unsupported independent operation '+op);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(()=>{
   let seed=2026111340;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const topics=g5AllTopics(),found=topics.find(t=>t.id==='frac_shapes');
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let repeat=0;repeat<20;repeat++){
    blockSession={kind:'g5quiz',key:'g5:frac_shapes',stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    qid='g5:frac_shapes';
    const q=makeG5Question('frac_shapes');
    rows.push({level,family,repeat,text:String(q.text),ans:String(q.ans),
     choices:q.choices.map(c=>({key:String(c.key),label:String(c.label)})),meta:q.mk126,template:q.templateId});
   }
   return {count:topics.length,title:found&&found.title,sub:found&&found.sub,lesson:g5Lesson('frac_shapes'),rows};
  });
  assert.equal(data.count,74,'Must preserve all 74 Grade 5 topics');
  assert.equal(data.title,'Окружность, круг, шар, цилиндр','Grade 5 topic card must match §25');
  assert(/радиус|Радиус/.test(data.lesson)&&/Цилиндр/.test(data.lesson)&&/Дуга/.test(data.lesson)&&/Сектор/.test(data.lesson),'§25 geometry explanation incomplete');
  const families=new Set(),levels=[[],[],[]],varied=new Set();
  for(const q of data.rows){
   const tag='L'+q.level+' F'+q.family;
   assert(q.meta&&q.meta.id==='frac_shapes'&&q.meta.t===q.level&&q.meta.p===q.family,'Lost generator metadata '+tag);
   assert(q.text&&!/клет(к|ок|ки)|закрашенн/i.test(q.text),'Old grid fraction quiz leaked into §25 '+tag);
   assert(!/undefined|NaN|Infinity/.test(q.text),'Malformed generated question '+tag);
   assert.equal(q.ans,intPlan(q.meta.plan).toString(),'Independent arithmetic mismatch '+tag);
   assert.equal(q.ans,String(q.meta.expected),'Question metadata mismatch '+tag);
   assert.equal(q.choices.filter(c=>c.key===q.ans).length,1,'Correct answer missing '+tag);
   assert.equal(new Set(q.choices.map(c=>c.label)).size,q.choices.length,'Duplicate visible choices '+tag);
   families.add(q.template);levels[q.level].push(q.meta.steps);
   if(q.level===0&&q.family<4){
    const d=page; // DOM parser below uses the browser in a separate evaluation.
    assert(q.text.includes('<svg')&&q.text.includes('viewBox="0 0 520 145"'),'Gallery missing '+tag);
    varied.add(q.text.match(/<g transform="translate\(0,0\)">([^]*?)<text x="65" y="134"/)?.[1]?.slice(0,115)||'');
   }
  }
  assert.equal(data.rows.length,300,'Expected 300 real browser samples');
  assert.equal(families.size,15,'Must maintain 15 cognitive families');
  const means=levels.map(x=>x.reduce((a,b)=>a+b,0)/x.length);
  assert(means[0]<means[1]&&means[1]<means[2],'Three-level difficulty must increase '+means);
  assert(varied.size>2,'Gallery order should vary across generations');
  const semantic=await page.evaluate(rows=>{
   const labels=['ring','disk','sphere','cylinder'];let checked=0;
   for(const q of rows.filter(x=>x.level===0&&x.family<4)){
    const container=document.createElement('div');container.innerHTML=q.text;
    const svg=container.querySelector('svg'),groups=[...svg.querySelectorAll('g')];
    if(groups.length!==4)throw Error('Gallery must include exactly four numbered figures');
    const identify=el=>el.querySelector('path')?'cylinder':
     el.querySelector('circle[fill^="url("]')?'sphere':
     el.querySelector('circle[fill="#80bde8"]')?'disk':
     el.querySelector('circle[fill="none"]')?'ring':'unknown';
    const kinds=groups.map(identify);
    if(new Set(kinds).size!==4||kinds.includes('unknown'))throw Error('Not four distinct visible shapes: '+kinds);
    if(Number(q.ans)!==kinds.indexOf(labels[q.family])+1)throw Error('Wrong correct figure '+q.family+': '+q.ans+' vs '+kinds);
    checked++;
   }
   let detailChecks=0;
   for(const q of rows.filter(x=>x.level===1&&(x.family===3||x.family===4))){
    const container=document.createElement('div');container.innerHTML=q.text;
    const svg=container.querySelector('svg'),groups=[...svg.querySelectorAll('g')];
    if(groups.length!==4)throw Error('Arc/sector SVG must show four different geometry elements');
    const identify=el=>el.querySelector('path[fill="#ffcf87"]')?'sector':
      el.querySelector('path[fill="none"][stroke="#d8792d"]')?'arc':
      el.querySelector('line[x1="28"]')?'diameter':
      el.querySelector('line[x1="38"]')?'chord':'unknown';
    const kinds=groups.map(identify);
    if(new Set(kinds).size!==4||kinds.includes('unknown'))throw Error('Missing geometry element '+kinds);
    if(Number(q.ans)!==kinds.indexOf(q.family===3?'sector':'arc')+1)throw Error('Wrong arc/sector key');
    detailChecks++;
   }
   return {basic:checked,details:detailChecks};
  },data.rows);
  assert.equal(semantic.basic,80,'Must validate all shuffled basic SVG figures');
  assert.equal(semantic.details,40,'Must validate every shuffled arc and sector SVG');
  const nav=await page.evaluate(()=>{
   renderGrade5();
   const links=[...document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="frac_shapes"]')];
   return {links:links.length,text:links[0]?.textContent||'',label:links[0]?.getAttribute('data-topic-id')};
  });
  assert.equal(nav.links,1,'§25 textbook navigation must render one live corrected topic');
  assert(nav.text.includes('Окружность, круг, шар, цилиндр'),'§25 button must have textbook title');
  console.log('G5_STAGE40_CIRCLES_PASS '+JSON.stringify({topics:data.count,samples:data.rows.length,families:families.size,meanSteps:means.map(x=>Math.round(x*100)/100),svgShapeChecks:semantic.basic,arcSectorChecks:semantic.details,paragraph25Links:nav.links}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_STAGE40_CIRCLES_FAIL',e.stack||e);process.exit(1)});
