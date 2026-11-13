'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-live-pedagogy-v122.js"><\/script>/g)||[]).length,1);
 assert(sw.includes('"./g5-live-pedagogy-v122.js"'));
 assert(sw.includes('matkvest-iphone-v122'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:780}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   const errs=[],check=(v,msg)=>{if(!v)errs.push(msg)},ids=window.mkG5V122LiveAdvanced||[],topics=g5AllTopics().map(t=>t.id);
   check(ids.length===20,'Expected 20 live topics including line lengths');
   check(topics.length===74,'Original 74 topic IDs lost');
   const families={},reasons={};let generated=0;
   function independent(node){
     const op=node[0],xs=node.slice(1);
     if(op==='v')return Number(xs[0]);
     if(op==='add')return xs.reduce((s,x)=>s+independent(x),0);
     if(op==='sub')return independent(xs[0])-independent(xs[1]);
     if(op==='mul')return independent(xs[0])*independent(xs[1]);
     if(op==='abs')return Math.abs(independent(xs[0]));
     throw Error('Unexpected geometry plan '+op);
   }
   for(const id of topics){
     const stageKinds=[];
     for(let t=0;t<3;t++){
      const firstFamilies=new Set(),taskTexts=new Set();
      const trials=id==='segments_polygons'?45:5;
      for(let p=0;p<trials;p++){
       blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:t,total:10,done:p%5,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
       try{
        const q=makeG5Question(id);
        generated++;
        check(Boolean(q?.text&&q.ex&&q.choices?.length>=3&&q.sig),id+'/'+t+'/'+p+' missing learner question fields');
        check(q.sourceTopicId===id,id+'/'+t+'/'+p+' routed to wrong topic');
        const correct=q.choices.filter(c=>String(c.key)===String(q.ans));
        check(correct.length===1,id+'/'+t+'/'+p+' ambiguous answer key');
        check(new Set(q.choices.map(c=>String(c.label))).size===q.choices.length,id+'/'+t+'/'+p+' duplicate visible answers');
        if(id==='segments_polygons'){
          const meta=q.mk122;check(!!meta,id+'/'+t+'/'+p+' missing geometry metadata');
          if(meta){
           const value=independent(meta.plan);
           check(value===meta.expected,id+'/'+t+'/'+p+' wrong geometry answer');
           check(String(correct[0]?.label)===String(value),id+'/'+t+'/'+p+' displayed answer mismatch');
           check(meta.t===t && meta.p===p%5,id+'/'+t+'/'+p+' stage slot mismatch');
           check(meta.steps>=1+t,id+'/'+t+'/'+p+' insufficient difficulty');
          }
        }
        if(p<5){
          firstFamilies.add(q.templateId);
          if(taskTexts.has(q.text))errs.push('Duplicate task '+id+' L'+t+' p'+p);
          taskTexts.add(q.text);
        }
        if(ids.includes(id)&&id!=='segments_polygons'){
          if(id.startsWith('dec_')&&q.mk116){
             check(q.mk116.t===t,id+' donor tier mismatch');
          }
          if(['frac_add','frac_sub','mixed_add','mixed_sub','frac_compare_num','frac_compare_den','mixed_compare'].includes(id))check(!!q.mk115,id+' is still using old fraction generator');
          if(['natural_compare','cuboid','calculator','angle_types'].includes(id))check(!!q.mk5Pedagogy,id+' is still using old tier generator');
          if(['frac_parts','frac_read','frac_ray','frac_types'].includes(id))check(q.templateId.includes('v114_'),id+' is still using old fraction topic generator');
        }
       }catch(e){errs.push(id+' L'+t+' '+p+' '+e.message)}
      }
      if(ids.includes(id))check(firstFamilies.size===5,id+' L'+t+' missing five distinct cognitive families: '+[...firstFamilies].join(','));
      stageKinds.push([...firstFamilies]);
     }
     if(ids.includes(id)){
      check(stageKinds.every((arr,i)=>i===0||!arr.some(k=>stageKinds[0].includes(k))),id+' uses the same families across training stages');
     }
     families[id]=stageKinds;
   }
   // Spot check actual quiz renderer, not only constructors; run normal Grade 5 topic stages.
   for(const id of ['segments_polygons','natural_compare','frac_add','dec_add']){
    blockSession=null;qid='';
    openG5Topic(id);
    if(typeof startG5QuizStage==='function'){
      startG5QuizStage(id,0);
      check(q&&q.sourceTopicId===id,'Real quiz does not use new donor '+id);
      check(Boolean(q?.templateId),'Real quiz has no generator family '+id);
    }else check(false,'Cannot enter Grade 5 quiz');
    if(typeof closeModal==='function')closeModal();
   }
   check(document.documentElement.scrollWidth<=innerWidth+2,'Horizontal overflow '+innerWidth);
   return {errors:errs.slice(0,30),totalErrors:errs.length,generated,advancedCount:ids.length,geometryFamilies:families.segments_polygons,stageExamples:topics.length};
  });
  assert.equal(result.totalErrors,0,JSON.stringify({width,result}).slice(0,8000));
  assert.deepEqual(errors,[],JSON.stringify({width,errors}));
  console.log('G5_V122_REAL_QUESTION_STAGE_PASS',JSON.stringify({width,total:result.generated,advanced:result.advancedCount,geometryFamilies:result.geometryFamilies}));
  await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V122_LIVE_STAGE_FAIL',e.stack||e);process.exit(1)});
