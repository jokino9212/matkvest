'use strict';
// §26 pre-certification smoke: 3 live topics, 45 families, 1800 actual prompts.
// This is deliberately NOT an independent mathematical oracle or full §26 certification.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const IDS=['frac_parts','frac_read','frac_ray'];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(ids=>{
   let seed=2026111426;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const rows=[];
   for(const id of ids)for(let level=0;level<3;level++)for(let slot=0;slot<5;slot++)
    for(let trial=0;trial<40;trial++){
     blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:slot,total:10,
      usedSignatures:[],items:[],finished:false};
     const q=makeG5Question(id),div=document.createElement('div');div.innerHTML=q.text;
     rows.push({id,level,slot,trial,html:String(q.text),visible:div.textContent,
      ans:String(q.ans),choices:q.choices.map(o=>({key:String(o.key),label:String(o.label)})),
      ex:String(q.ex),family:q.templateId,audit:q.mk5Audit,source:q.sourceTopicId});
    }
   return {rows,topics:g5AllTopics().length,lessons:ids.map(id=>g5Lesson(id))};
  },IDS);
  assert.equal(result.topics,74,'Grade 5 catalog changed');
  assert.equal(result.rows.length,1800,'Not all 1800 live questions generated');
  const families=new Set(),variety=new Map(),pictures={frac_parts:0,frac_read:0,frac_ray:0};
  for(const q of result.rows){
   const ctx=q.id+'/'+q.level+'/'+q.slot+'/'+q.trial;
   assert(q.family&&q.source===q.id,'Incorrect active topic or template '+ctx);
   assert(q.audit&&['numeric','fraction','choice'].includes(q.audit.type),'Missing answer audit '+ctx);
   assert(q.visible.trim()&&q.ex.trim(),'Empty learner question or explanation '+ctx);
   assert(!/undefined|NaN|Infinity/.test(q.html+q.ex),'Broken learner content '+ctx);
   assert(q.choices.length>=3,'Too few choices '+ctx);
   assert.equal(new Set(q.choices.map(o=>o.key)).size,q.choices.length,'Duplicate choice keys '+ctx);
   assert.equal(q.choices.filter(o=>o.key===q.ans).length,1,'No unique correct option '+ctx);
   const key=q.id+'/'+q.level+'/'+q.slot;families.add(key);
   if(!variety.has(key))variety.set(key,new Set());
   variety.get(key).add(q.html);
   if(q.html.includes('<svg'))pictures[q.id]++;
   if(q.id==='frac_parts'&&q.html.includes('mk-v114-graphic')){
    assert(q.html.includes('Одна целая полоска разделена'),'Fraction diagram must show one whole '+ctx);
    assert(!q.html.includes('rx="3"'),'Detached tiles must not reappear '+ctx);
    const m=q.html.match(/закрашено (\d+), не закрашено (\d+)/);
    assert(m,'Diagram has no meaningful accessible count '+ctx);
    const d=Number(m[1])+Number(m[2]);
    const cells=[...q.html.matchAll(/<rect x="[^"]+" y="8" width="[^"]+" height="44" fill="#/g)];
    assert.equal(cells.length,d,'Whole is not divided into equal cells '+ctx);
   }
  }
  assert.equal(families.size,45,'Not 15 distinct family slots in each of three topics');
  for(const [slot,variants]of variety)assert(variants.size>=10,'Not enough variants '+slot+': '+variants.size);
  assert(pictures.frac_parts>0&&pictures.frac_ray>0,'Missing share/number-line SVGs');
  assert.deepEqual(errors,[],'JavaScript runtime errors');
  console.log('G5_PARAGRAPH26_SMOKE_PASS '+JSON.stringify({questions:result.rows.length,familySlots:families.size,pictures}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_PARAGRAPH26_SMOKE_FAIL',e.stack||e);process.exit(1);});
