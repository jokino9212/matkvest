'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-fraction-progress-v129.js"><\/script>/g)||[]).length,1);
 assert(sw.includes('"./g5-fraction-progress-v129.js"')&&sw.includes('matkvest-iphone-v129'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,768,1280]){
  const p=await browser.newPage({viewport:{width,height:830}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const o=await p.evaluate(()=>{
   const faults=[],check=(ok,msg)=>{if(!ok)faults.push(msg)},ids=window.mkG5V129Tiered||[];
   check(ids.length===5,'Missing five fraction topics');
   check(g5AllTopics().length===74,'Grade 5 catalog lost');
   function gcd(a,b){while(b){const z=a%b;a=b;b=z}return a}
   function rational(n,d){const g=gcd(Math.abs(n),d)||1;return {n:n/g,d:d/g}}
   function exact(t){
    const [op,...x]=t;
    if(op==='v')return rational(x[0],x[1]);
    if(op==='add')return x.reduce((a,b)=>{const q=exact(b);return rational(a.n*q.d+q.n*a.d,a.d*q.d)},rational(0,1));
    if(op==='sub'){const a=exact(x[0]),b=exact(x[1]);return rational(a.n*b.d-b.n*a.d,a.d*b.d)}
    if(op==='mul'){const a=exact(x[0]),b=exact(x[1]);return rational(a.n*b.n,a.d*b.d)}
    if(op==='abs'){const a=exact(x[0]);return rational(Math.abs(a.n),a.d)}
    throw Error('unknown rational plan '+op);
   }
   function lcm(a,b){return a/gcd(a,b)*b}
   let checked=0;
   for(const id of ids){
    const all=[];
    for(let stage=0;stage<3;stage++){
     const families=new Set(),firstTexts=new Set();
     for(let family=0;family<5;family++){
      for(let iteration=0;iteration<22;iteration++){
       blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:stage,done:family,total:10,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
       try{
        const q=makeG5Question(id),m=q?.mk129;
        if(!m||m.id!==id||m.t!==stage||m.p!==family||m.steps<stage+1)throw Error('Wrong topic, family or difficulty');
        if(!q.text||!q.ex||!q.sig||!q.choices?.length||!q.templateId)throw Error('Bad actual student question');
        const correct=q.choices.filter(x=>String(x.key)===String(q.ans));
        if(correct.length!==1)throw Error('No unique correct answer');
        if(new Set(q.choices.map(x=>String(x.label))).size!==q.choices.length)throw Error('Repeated answer labels');
        if(m.mode==='integer'){
         const expected=m.denoms.reduce((x,y)=>lcm(x,y),1);
         if(expected!==m.result||Number(String(correct[0].label).replace(',','.'))!==expected)throw Error('Wrong LCM or student label');
        }else if(m.mode==='sign'){
         const a=exact(m.left),b=exact(m.right),expected=Math.sign(a.n*b.d-b.n*a.d);
         const key=expected<0?'lt':expected>0?'gt':'eq';
         if(key!==q.ans||m.result!==expected)throw Error('Wrong comparison');
        }else{
         const expected=exact(m.plan),actual=m.expectedRational;
         if(!actual||expected.n!==actual.n||expected.d!==actual.d)throw Error('Wrong fraction simplification');
         const key=expected.d===1?String(expected.n):expected.n+'/'+expected.d;
         if(String(q.ans)!==key)throw Error('Wrong rational answer key '+q.ans+' should '+key);
        }
        if(iteration===0){families.add(q.templateId);if(firstTexts.has(q.text))throw Error('Identical task at same stage');firstTexts.add(q.text)}
        checked++;
       }catch(e){faults.push(id+' L'+stage+' F'+family+' #'+iteration+' '+e.message)}
      }
     }
     check(families.size===5,id+' L'+stage+' fewer than five cognitive families');
     all.push(...families);
    }
    check(new Set(all).size===15,id+' not 15 distinct families');
   }
   renderGrade5();
   const nav=mainView.querySelector('#mk-g5-textbook-nav');
   check(nav?.querySelectorAll('.mk-g5-toc-list li').length===51,'Missing 51 textbook topics');
   check(nav?.querySelectorAll('input').length===0,'Second topic search returned');
   for(const id of ids){
    blockSession=null;qid='';
    openG5Topic(id);
    check((document.getElementById('modal')?.querySelector('h2')?.textContent||'').includes(g5AllTopics().find(x=>x.id===id).title),'Wrong dialog '+id);
    if(typeof startG5QuizStage==='function'){startG5QuizStage(id,2);check(q?.mk129?.t===2&&q?.mk129?.id===id,'Real Master ignores new generator '+id)}
    else faults.push('No stage starter '+id);
    if(typeof closeModal==='function')closeModal();
   }
   check(document.documentElement.scrollWidth<=innerWidth+2,'Horizontal overflow');
   return {n:faults.length,faults:faults.slice(0,20),checked};
  });
  assert.equal(o.n,0,JSON.stringify({width,o}).slice(0,9000));
  assert.deepEqual(errors,[],JSON.stringify({width,errors}));
  console.log('G5_V129_75_RATIONAL_FAMILIES_PASS',JSON.stringify({width,samples:o.checked,families:75}));
  await p.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V129_LIVE_RATIONAL_FAIL',e.stack||e);process.exit(1)});
