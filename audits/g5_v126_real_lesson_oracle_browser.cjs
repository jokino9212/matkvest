'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-remaining-core-v126.js"><\/script>/g)||[]).length,1);
 assert(sw.includes('"./g5-remaining-core-v126.js"')&&sw.includes('matkvest-iphone-v126'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:820}}),browserErrors=[];
   page.on('pageerror',e=>browserErrors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const result=await page.evaluate(()=>{
    const issues=[],check=(v,m)=>{if(!v)issues.push(m)},ids=window.mkG5V126Tiered||[],all=g5AllTopics();
    check(ids.length===9,'Expected 9 topic IDs');
    check(all.length===74,'Existing 74-topic catalog lost');
    function independentlyEvaluate(node){
     const [op,...x]=node;
     if(op==='v')return BigInt(x[0]);
     const E=independentlyEvaluate;
     if(op==='add')return x.reduce((s,n)=>s+E(n),0n);
     if(op==='sub')return E(x[0])-E(x[1]);
     if(op==='mul')return E(x[0])*E(x[1]);
     if(op==='div'){const a=E(x[0]),b=E(x[1]);if(b===0n||a%b!==0n)throw Error('Invalid division');return a/b}
     if(op==='abs'){const d=E(x[0]);return d<0n?-d:d}
     if(op==='pow')return E(x[0])**E(x[1]);
     throw Error('Unsupported plan '+op);
    }
    let count=0,allF=[];
    for(const id of ids){
     const stageKinds=[];
     for(let stage=0;stage<3;stage++){
      const families=new Set(),questionTemplates=new Set();
      for(let p=0;p<5;p++){
       for(let n=0;n<22;n++){
        blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:stage,total:10,done:p,usedSignatures:[],items:[],finished:false};
        qid='g5:'+id;
        try{
         const question=makeG5Question(id),meta=question?.mk126;
         if(!meta)throw Error('Student receives old generator instead of v126');
         if(meta.id!==id||meta.t!==stage||meta.p!==p||meta.steps<stage+1)throw Error('Bad question family or difficulty');
         if(!question.text||!question.ex||!question.choices?.length||!question.templateId||!question.sig)throw Error('Missing question fields');
         const result=independentlyEvaluate(meta.plan);
         if(result!==BigInt(meta.expected))throw Error('Math oracle disagrees with generator');
         const correct=question.choices.filter(x=>String(x.key)===String(question.ans));
         if(correct.length!==1||String(correct[0].label)!==String(result))throw Error('Wrong displayed answer');
         if(new Set(question.choices.map(x=>String(x.label))).size!==question.choices.length)throw Error('Duplicate distractor');
         if(n===0){
          families.add(question.templateId);
          if(questionTemplates.has(question.text))throw Error('Duplicate question inside same stage');
          questionTemplates.add(question.text);
         }
         if(['frac_shapes','charts'].includes(id)&&!question.text.includes('<svg'))throw Error('Missing visual diagram');
         count++;
        }catch(e){issues.push(id+' / stage '+stage+' / family '+p+' / repeat '+n+': '+e.message)}
       }
      }
      check(families.size===5,id+': '+families.size+' unique families instead of 5 on stage '+stage);
      stageKinds.push(...families);
     }
     check(new Set(stageKinds).size===15,id+': repeated templates across stages');
     allF.push(...stageKinds);
    }
    check(allF.length===135&&new Set(allF).size===135,'Expected unique 135 topic-specific family IDs');
    renderGrade5();
    const nav=mainView.querySelector('#mk-g5-textbook-nav');
    check(nav?.querySelectorAll('.mk-g5-toc-list li').length===51,'51 textbook paragraphs not preserved');
    check(nav?.querySelectorAll('input').length===0,'Duplicate search resurrected');
    for(const id of ids){
     blockSession=null;qid='';
     openG5Topic(id);
     const heading=document.getElementById('modal')?.querySelector('h2')?.textContent||'';
     check(heading.includes(all.find(t=>t.id===id).title),'Wrong lesson opened for '+id);
     if(typeof startG5QuizStage==='function'){
      startG5QuizStage(id,2);
      check(q?.mk126?.id===id&&q?.mk126?.t===2,'Actual Master stage is not v126 '+id);
     }else issues.push('Cannot enter actual lesson stage '+id);
     if(typeof closeModal==='function')closeModal();
    }
    check(document.documentElement.scrollWidth<=innerWidth+2,'Horizontal overflow '+innerWidth);
    return {errorCount:issues.length,issues:issues.slice(0,25),count};
   });
   assert.equal(result.errorCount,0,JSON.stringify({width,result}).slice(0,9000));
   assert.deepEqual(browserErrors,[],JSON.stringify({width,browserErrors}));
   console.log('G5_V126_135_LEARNER_FAMILIES_PASS',JSON.stringify({width,topics:9,families:135,questions:result.count}));
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V126_LEARNER_FAMILIES_FAIL',e.stack||e);process.exit(1)});
