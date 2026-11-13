'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-natural-units-v125.js"><\/script>/g)||[]).length,1);
 assert(sw.includes('"./g5-natural-units-v125.js"'));
 assert(sw.includes('matkvest-iphone-v125'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,768,1280]){
  const p=await browser.newPage({viewport:{width,height:830}}),browserErrors=[];
  p.on('pageerror',e=>browserErrors.push(e.message));
  await p.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const report=await p.evaluate(()=>{
   const issues=[],check=(ok,msg)=>{if(!ok)issues.push(msg)};
   const topics=g5AllTopics(),ids=window.mkG5V125Tiered;
   check(topics.length===74,'Grade 5 catalog changed');
   check(ids?.length===6,'Wrong number of improved topics');
   function independent(node){
    const [op,...args]=node;
    const E=n=>independent(n);
    if(op==='v')return BigInt(args[0]);
    if(op==='add')return args.reduce((sum,n)=>sum+E(n),0n);
    if(op==='sub')return E(args[0])-E(args[1]);
    if(op==='mul')return E(args[0])*E(args[1]);
    if(op==='div'){const a=E(args[0]),b=E(args[1]);if(b===0n||a%b!==0n)throw Error('invalid division');return a/b}
    if(op==='mod'){const a=E(args[0]),b=E(args[1]);if(a<0n||b<=0n)throw Error('invalid mod');return a%b}
    if(op==='abs'){const x=E(args[0]);return x<0n?-x:x}
    throw Error('Unsupported operation '+op);
   }
   let count=0;
   for(const id of ids){
    const levelFamilies=[];
    for(let level=0;level<3;level++){
     const families=new Set(),texts=new Set();
     for(let slot=0;slot<5;slot++){
      for(let iteration=0;iteration<35;iteration++){
       blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:slot,total:10,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
       try{
        const q=makeG5Question(id),meta=q?.mk125;
        if(!meta)throw Error('Learner still seeing old quiz');
        if(meta.id!==id||meta.t!==level||meta.p!==slot||meta.steps<level+1)throw Error('Incorrect topic/tier cognitive metadata');
        if(!q.text||!q.ex||!q.sig||q.choices?.length<3)throw Error('Incomplete student question');
        const actual=independent(meta.plan);
        if(actual!==BigInt(meta.expected))throw Error('Wrong computed answer');
        const matches=q.choices.filter(c=>String(c.key)===String(q.ans));
        if(matches.length!==1||String(matches[0].label)!==String(actual))throw Error('Incorrect answer displayed');
        if(new Set(q.choices.map(c=>String(c.label))).size!==q.choices.length)throw Error('Duplicate distractors');
        if(!iteration){
         families.add(q.templateId);
         if(texts.has(q.text))throw Error('Identical question wording within a stage');
         texts.add(q.text);
        }
        count++;
       }catch(e){issues.push(id+' '+level+'/'+slot+' '+iteration+': '+e.message)}
      }
     }
     check(families.size===5,id+' tier '+level+' has fewer than 5 families');
     levelFamilies.push(...families);
    }
    check(new Set(levelFamilies).size===15,'Repeated question families between tiers '+id);
   }
   renderGrade5();
   const menu=mainView.querySelector('#mk-g5-textbook-nav');
   check(menu?.querySelectorAll('.mk-g5-toc-list li').length===51,'Textbook paragraphs are missing');
   check(menu?.querySelectorAll('input').length===0,'Duplicate search resurrected');
   for(const id of ids){
    blockSession=null;qid='';
    openG5Topic(id);
    check(document.getElementById('modal')?.querySelector('h2')?.textContent.includes(topics.find(x=>x.id===id).title),'Wrong topic modal '+id);
    if(typeof startG5QuizStage==='function'){
     startG5QuizStage(id,2);
     check(q?.mk125?.t===2&&q?.mk125?.id===id,'Actual master exercise not v125 '+id);
    }else issues.push('Stage launcher unavailable');
    if(typeof closeModal==='function')closeModal();
   }
   check(document.documentElement.scrollWidth<=innerWidth+2,'Horizontal overflow');
   return {issues:issues.slice(0,22),issueCount:issues.length,count};
  });
  assert.equal(report.issueCount,0,JSON.stringify({width,report}).slice(0,8500));
  assert.deepEqual(browserErrors,[]);
  console.log('G5_V125_90_LEARNER_EXERCISE_FAMILIES_PASS',JSON.stringify({width,samples:report.count,topics:6,families:90}));
  await p.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V125_90_LEARNER_EXERCISE_FAMILIES_FAIL',e.stack||e);process.exit(1)});
