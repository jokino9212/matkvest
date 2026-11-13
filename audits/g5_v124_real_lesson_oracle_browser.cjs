'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),worker=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-textbook-tiers-v124.js"><\/script>/g)||[]).length,1);
 assert(worker.includes('"./g5-textbook-tiers-v124.js"'));
 assert(worker.includes('matkvest-iphone-v124'));
 assert(worker.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:800}}),pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const outcome=await page.evaluate(()=>{
   const issues=[],fail=(condition,why)=>{if(!condition)issues.push(why)};
   const ids=window.mkG5V124Tiered,all=g5AllTopics();
   fail(ids?.length===6,'Wrong six-topic module');
   fail(all?.length===74,'Original topic count changed');
   function calc(plan){
    const [op,...args]=plan;
    const e=n=>calc(n);
    if(op==='v')return BigInt(args[0]);
    if(op==='add')return args.reduce((acc,n)=>acc+e(n),0n);
    if(op==='sub')return e(args[0])-e(args[1]);
    if(op==='mul')return e(args[0])*e(args[1]);
    if(op==='div'){const a=e(args[0]),b=e(args[1]);if(!b||a%b)throw Error('noninteger calculation');return a/b}
    if(op==='mod'){const a=e(args[0]),b=e(args[1]);if(!b||a<0n||b<=0n)throw Error('invalid remainder');return a%b}
    if(op==='abs'){const v=e(args[0]);return v<0n?-v:v}
    throw Error('Unknown numeric operation '+op);
   }
   function poly(node){
    const [op,...args]=node;
    if(op==='poly')return args.map(BigInt);
    if(op==='psum')return args.reduce((res,n)=>res.map((a,i)=>a+poly(n)[i]),[0n,0n,0n]);
    if(op==='pscale')return poly(args[1]).map(v=>BigInt(args[0])*v);
    throw Error('Unknown symbolic operation '+op);
   }
   function readable(coeff){
    const out=[];
    coeff.forEach((n,i)=>{
     if(!n)return;
     const unit=['a','b',''][i],abs=n<0n?-n:n,label=unit&&abs===1n?unit:String(abs)+unit;
     out.push((out.length?(n<0n?' − ':' + '):(n<0n?'−':''))+label);
    });
    return out.join('')||'0';
   }
   const audit={};let samples=0;
   for(const id of ids){
    audit[id]=[[],[],[]];
    for(let level=0;level<3;level++){
     const families=new Set(),texts=new Set();
     for(let slot=0;slot<5;slot++){
      for(let repeat=0;repeat<32;repeat++){
       blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,total:10,done:slot,usedSignatures:[],items:[],finished:false};
       qid='g5:'+id;
       try{
        const q=makeG5Question(id),meta=q?.mk124;
        if(!meta)throw Error('No v124 metadata on real learner question');
        if(meta.id!==id||meta.t!==level||meta.p!==slot)throw Error('Wrong stage or topic IDs');
        if(meta.steps<level+1)throw Error('No cognitive difficulty progression');
        if(!q.text||!q.ex||!q.sig||!q.templateId||!q.choices?.length)throw Error('Missing exercise display');
        const answers=q.choices.filter(a=>String(a.key)===String(q.ans));
        if(answers.length!==1)throw Error('Ambiguous choice');
        if(new Set(q.choices.map(c=>String(c.label))).size!==q.choices.length)throw Error('Duplicate displayed answer');
        const computed=meta.kind==='numeric'?String(calc(meta.plan)):readable(poly(meta.plan));
        if(String(meta.answer)!==computed||String(answers[0].label)!==computed)throw Error('Wrong student-visible answer: '+computed+' / '+meta.answer);
        if(repeat===0){
         families.add(q.templateId);
         if(texts.has(q.text))throw Error('Repeated visible question in same level');
         texts.add(q.text);
        }
        samples++;
       }catch(e){issues.push(id+' L'+level+' F'+slot+' try'+repeat+': '+e.message)}
      }
     }
     fail(families.size===5,id+' L'+level+' has '+families.size+' unique task families instead of 5');
     audit[id][level]=[...families];
    }
    const allNames=audit[id].flat();
    fail(new Set(allNames).size===15,id+' repeats types across the three stages');
   }
   // Verify the content survives the ordinary lesson entry and stage-picker flows.
   renderGrade5();
   const menu=mainView.querySelector('#mk-g5-textbook-nav');
   fail(!!menu,'No grade-five textbook menu');
   fail(menu?.querySelectorAll('.mk-g5-toc-list li').length===51,'Textbook has lost one of its 51 paragraphs');
   fail(menu?.querySelectorAll('input').length===0,'Duplicate topic search came back');
   for(const id of ids){
    blockSession=null;qid='';
    openG5Topic(id);
    const h=document.getElementById('modal')?.querySelector('h2')?.textContent||'';
    fail(h.includes(all.find(t=>t.id===id)?.title),'Wrong topic dialog for '+id);
    if(typeof startG5QuizStage!=='function')issues.push('Cannot launch real quiz stages');
    else{
     startG5QuizStage(id,2);
     fail(q?.mk124?.t===2&&q?.mk124?.id===id,'Real master-stage quiz is not v124 '+id);
    }
    if(typeof closeModal==='function')closeModal();
   }
   fail(document.documentElement.scrollWidth<=innerWidth+2,'Horizontal overflow at '+innerWidth);
   return {issues:issues.slice(0,20),count:issues.length,samples,families:audit};
  });
  assert.equal(outcome.count,0,JSON.stringify({width,outcome}).slice(0,7500));
  assert.deepEqual(pageErrors,[],JSON.stringify({width,pageErrors}));
  console.log('G5_V124_90_REAL_TASK_FAMILIES_PASS',JSON.stringify({width,samples:outcome.samples,topics:6,uniqueTypes:90}));
  await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V124_90_REAL_TASK_FAMILIES_FAIL',e.stack||e);process.exit(1)});
