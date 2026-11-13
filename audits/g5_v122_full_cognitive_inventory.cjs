'use strict';
const {chromium}=require('playwright'),path=require('path');
(async()=>{
 const b=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 const p=await b.newPage({viewport:{width:1280,height:800}});
 await p.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const x=await p.evaluate(()=>{
  const base=makeG5Question('segments_polygons'),donor=g5DonorQuestion('segments_polygons'),conv=makeG5Question('frac_to_mixed');
  const sample={base,donor,conv};
  const code={sample,makeG5Question:String(makeG5Question).slice(0,6800),g5DonorQuestion:String(g5DonorQuestion).slice(0,1500),activeDifficulty:String(activeDifficulty).slice(0,900),generatorKeys:Object.keys(window).filter(x=>/mk5|makeG5/i.test(x)).slice(0,60)};
  const out=[];
  const topics=g5AllTopics();
  for(const {id,title} of topics){
   const tiers=[];
   for(let t=0;t<3;t++){
    const arr=[];
    for(let n=0;n<6;n++){
      blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:t,done:n,total:10,usedSignatures:[],items:[],finished:false};
      qid='g5:'+id;
      try{
        const q=makeG5Question(id);
        arr.push({family:q.templateId||q.family||'',text:String(q.text||'').replace(/<[^>]+>/g,' ').slice(0,95),mode:q.answerMode||'',steps:q.mk5Pedagogy?.steps||q.mk115?.terms?.length||q.mk116?.plan?.length||null});
      }catch(e){arr.push({error:String(e.message).slice(0,100)})}
    }
    tiers.push({unique:new Set(arr.map(x=>x.family)).size,types:arr.map(x=>x.family),prompts:arr.slice(0,3).map(x=>x.text),errors:arr.filter(x=>x.error)});
   }
   out.push({id,title,tiers});
  }
  return {count:out.length,items:out,code};
 });
 console.log('G5_GENERATOR_RUNTIME '+JSON.stringify(x.code));
 for(const item of x.items){
   const sets=item.tiers.map(x=>new Set(x.types));
   const same=sets.slice(1).every(s=>s.size===sets[0].size&&[...s].every(v=>sets[0].has(v)));
   console.log('G5_CURR_AUDIT '+JSON.stringify({id:item.id,title:item.title,unique:item.tiers.map(x=>x.unique),same,stage:item.tiers.map(x=>x.prompts[0]),families:item.tiers.map(x=>x.types.slice(0,5)),errors:item.tiers.map(x=>x.errors).flat()}));
 }
 console.log('G5_CURR_AUDIT_TOTAL '+x.count);
 }finally{await b.close()}
})().catch(e=>{console.error('AUDIT_ERROR',e.stack||e);process.exit(1)});
