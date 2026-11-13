'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-decimal-tiers-v127.js"><\/script>/g)||[]).length,1);
 assert(sw.includes('"./g5-decimal-tiers-v127.js"')&&sw.includes('matkvest-iphone-v127'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:850}}),exceptions=[];
  page.on('pageerror',e=>exceptions.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   const problems=[],check=(x,msg)=>{if(!x)problems.push(msg)},topics=window.mkG5V127Tiered||[];
   check(topics.length===5,'Wrong v127 topic count');
   check(g5AllTopics().length===74,'Original Grade 5 topic count changed');
   function independent(node){
    const [op,...args]=node,E=independent;
    if(op==='v')return BigInt(args[0]);
    if(op==='add')return args.reduce((s,x)=>s+E(x),0n);
    if(op==='sub')return E(args[0])-E(args[1]);
    if(op==='mul')return E(args[0])*BigInt(args[1]);
    if(op==='div'){const a=E(args[0]),b=BigInt(args[1]);if(!b||a%b)throw Error('Noninteger math oracle');return a/b}
    if(op==='digit')return (E(args[0])/BigInt(args[1]))%10n;
    if(op==='abs'){const v=E(args[0]);return v<0n?-v:v}
    throw Error('Unsupported integer plan '+op);
   }
   let checked=0;
   for(const id of topics){
    const allFamilies=[];
    for(let stage=0;stage<3;stage++){
     const distinct=new Set(),questions=new Set();
     for(let family=0;family<5;family++){
      for(let trial=0;trial<28;trial++){
       blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:stage,done:family,total:10,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
       try{
        const q=makeG5Question(id),meta=q?.mk127;
        if(!meta)throw Error('Real learner-facing question uses old generator');
        if(meta.id!==id||meta.t!==stage||meta.p!==family||meta.steps<stage+1)throw Error('Wrong topic, difficulty or question family');
        if(!q.text||!q.ex||!q.choices?.length||!q.templateId||!q.sig)throw Error('Incomplete question fields');
        const oracle=independent(meta.tree);
        const value=meta.mode==='int'?Number(oracle):Number(oracle)/1000;
        if((meta.mode==='int'?meta.expectedInt:meta.expectedMilli)!==Number(oracle))throw Error('Incorrect expected integer/milli');
        const answer=q.choices.filter(c=>String(c.key)===String(q.ans));
        if(answer.length!==1)throw Error('No unique correct answer key');
        const visible=Number(String(answer[0].label).replace(',','.'));
        if(!Number.isFinite(visible)||Math.abs(visible-value)>0.0000001)throw Error('Wrong student-visible answer '+visible+' should be '+value);
        if(new Set(q.choices.map(c=>String(c.label))).size!==q.choices.length)throw Error('Duplicate possible answers');
        if(trial===0){
         if(questions.has(q.text))throw Error('Identical question on same stage');
         distinct.add(q.templateId);questions.add(q.text);
        }
        checked++;
       }catch(e){problems.push(id+' L'+stage+' F'+family+' trial'+trial+' '+e.message)}
      }
     }
     check(distinct.size===5,id+' L'+stage+' cognitive diversity not 5');
     allFamilies.push(...distinct);
    }
    check(new Set(allFamilies).size===15,id+' does not have 15 unique cognitive families');
   }
   renderGrade5();
   const nav=mainView.querySelector('#mk-g5-textbook-nav');
   check(nav?.querySelectorAll('.mk-g5-toc-list li').length===51,'Lost textbook navigation paragraphs');
   check(nav?.querySelectorAll('input').length===0,'Lower duplicate topic search has returned');
   for(const id of topics){
    blockSession=null;qid='';
    openG5Topic(id);
    const title=document.getElementById('modal')?.querySelector('h2')?.textContent||'';
    check(title.includes(g5AllTopics().find(t=>t.id===id).title),'Wrong lesson window '+id);
    if(typeof startG5QuizStage==='function'){
      startG5QuizStage(id,2);
      check(q?.mk127?.t===2&&q?.mk127?.id===id,'Live Master is not v127 for '+id);
    }else problems.push('No learner stage opener');
    if(typeof closeModal==='function')closeModal();
   }
   check(document.documentElement.scrollWidth<=innerWidth+2,'Horizontal overflow '+innerWidth);
   return {problemCount:problems.length,problems:problems.slice(0,22),checked};
  });
  assert.equal(result.problemCount,0,JSON.stringify({width,result}).slice(0,9000));
  assert.deepEqual(exceptions,[],JSON.stringify({width,exceptions}));
  console.log('G5_V127_LEARNER_DECIMAL_TIER_PASS',JSON.stringify({width,topics:5,checked:result.checked,families:75}));
  await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V127_LEARNER_DECIMAL_TIER_FAIL',e.stack||e);process.exit(1)});
