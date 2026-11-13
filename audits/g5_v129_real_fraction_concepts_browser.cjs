'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-fraction-concepts-v129.js"><\/script>/g)||[]).length,1);
 assert(sw.includes('"./g5-fraction-concepts-v129.js"')&&sw.includes('matkvest-iphone-v129'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:850}}),pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const report=await page.evaluate(()=>{
   const issues=[],check=(v,msg)=>{if(!v)issues.push(msg)},topics=window.mkG5V129Tiered||[];
   check(topics.length===7,'Seven fraction topics were not initialized');
   check(g5AllTopics().length===74,'Grade 5 catalog changed');
   function gcd(a,b){a=a<0n?-a:a;while(b){const r=a%b;a=b;b=r;}return a}
   function reduce(n,d){if(d<=0n)throw Error('Bad fraction denominator');const g=gcd(n,d);return {n:n/g,d:d/g};}
   function E(node){
    const [op,...x]=node;
    if(op==='rat')return reduce(BigInt(x[0]),BigInt(x[1]));
    if(op==='add')return x.reduce((a,z)=>{const b=E(z);return reduce(a.n*b.d+b.n*a.d,a.d*b.d);},{n:0n,d:1n});
    if(op==='sub'){const a=E(x[0]),b=E(x[1]);return reduce(a.n*b.d-b.n*a.d,a.d*b.d)}
    if(op==='mul'){const a=E(x[0]),b=E(x[1]);return reduce(a.n*b.n,a.d*b.d)}
    if(op==='div'){const a=E(x[0]),b=E(x[1]);if(b.n===0n)throw Error('Division by zero');return reduce(a.n*b.d,a.d*b.n)}
    if(op==='max'||op==='min'){const v=x.map(E);return v.reduce((a,b)=>{const z=a.n*b.d-b.n*a.d;return op==='max'?(z>=0n?a:b):(z<=0n?a:b)})}
    if(op==='abs'){const a=E(x[0]);return reduce(a.n<0n?-a.n:a.n,a.d)}
    if(op==='num'){const a=E(x[0]);return {n:a.n,d:1n}}
    if(op==='den'){const a=E(x[0]);return {n:a.d,d:1n}}
    if(op==='gcd'||op==='lcm'){let a=BigInt(x[0]),b=BigInt(x[1]);const g=gcd(a,b);return {n:op==='gcd'?g:(a/g)*b,d:1n}}
    throw Error('Unknown fraction AST '+op);
   }
   let count=0;
   for(const id of topics){
    const across=[];
    for(let t=0;t<3;t++){
     const distinct=new Set(),texts=new Set();
     for(let family=0;family<5;family++){
      for(let iteration=0;iteration<24;iteration++){
       blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:t,done:family,total:10,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
       try{
        const q=makeG5Question(id),meta=q?.mk129;
        if(!meta)throw Error('Old generator shown to learner');
        if(meta.id!==id||meta.t!==t||meta.p!==family||meta.steps<t+1)throw Error('Wrong level or topic');
        if(!q.text||!q.ex||!q.templateId||!q.sig||q.choices?.length<3)throw Error('Incomplete task fields '+JSON.stringify({text:!!q.text,ex:!!q.ex,template:!!q.templateId,sig:!!q.sig,length:q.choices?.length,ans:q.ans}));
        const rational=E(meta.plan);
        if(BigInt(meta.expected.n)!==rational.n||BigInt(meta.expected.d)!==rational.d)throw Error('Independent rational calculation mismatch');
        const right=q.choices.filter(a=>String(a.key)===String(q.ans));
        if(right.length!==1)throw Error('Missing unique correct answer');
        if(new Set(q.choices.map(a=>String(a.label))).size!==q.choices.length)throw Error('Duplicate distractor');
        if(meta.mode==='frac'){
         if(rational.d<=1n)throw Error('Integer instead of fraction');
         if(q.ans!==rational.n+'/'+rational.d)throw Error('Wrong fraction key');
         if(right[0].label!==frac(Number(rational.n),Number(rational.d)))throw Error('Wrong displayed numerator/denominator');
        }else{
         if(rational.d!==1n||String(right[0].label)!==String(rational.n))throw Error('Integer answer mismatch');
        }
        if(iteration===0){distinct.add(q.templateId);if(texts.has(q.text))throw Error('Repeated task text');texts.add(q.text);}
        count++;
       }catch(e){issues.push(id+' L'+t+' F'+family+' repeat'+iteration+': '+e.message)}
      }
     }
     check(distinct.size===5,id+' L'+t+' cognitive families not 5');
     across.push(...distinct);
    }
    check(new Set(across).size===15,id+' families repeated across tiers');
   }
   renderGrade5();
   const nav=mainView.querySelector('#mk-g5-textbook-nav');
   check(nav?.querySelectorAll('.mk-g5-toc-list li').length===51,'51 textbook paragraphs disappeared');
   check(nav?.querySelectorAll('input').length===0,'Duplicate lower search is back');
   for(const id of topics){
    blockSession=null;qid='';
    openG5Topic(id);
    const heading=document.getElementById('modal')?.querySelector('h2')?.textContent||'';
    check(heading.includes(g5AllTopics().find(x=>x.id===id).title),'Wrong opened lesson '+id);
    if(typeof startG5QuizStage==='function'){
     startG5QuizStage(id,2);
     check(q?.mk129?.t===2&&q?.mk129?.id===id,'Master stage not using updated generator '+id);
    }else issues.push('Missing real stage opener');
    if(typeof closeModal==='function')closeModal();
   }
   check(document.documentElement.scrollWidth<=innerWidth+2,'Mobile horizontal overflow');
   return {count:issues.length,issues:issues.slice(0,25),checked:count};
  });
  assert.equal(report.count,0,JSON.stringify({width,report}).slice(0,12000));
  assert.deepEqual(pageErrors,[],JSON.stringify({width,pageErrors}));
  console.log('G5_V129_REAL_FRACTION_CONCEPTS_PASS',JSON.stringify({width,topics:7,families:105,checked:report.checked}));
  await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V129_REAL_FRACTION_CONCEPTS_FAIL',e.stack||e);process.exit(1)});
