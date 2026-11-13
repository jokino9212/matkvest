'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-fraction-applications-v130.js"><\/script>/g)||[]).length,1);
 assert(sw.includes('"./g5-fraction-applications-v130.js"')&&sw.includes('matkvest-iphone-v130'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:800}}),pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(()=>{
   const errors=[],ok=(c,s)=>{if(!c)errors.push(s)},topics=window.mkG5V130Tiered||[];
   ok(topics.length===5,'Expected 5 upgraded topics');
   ok(g5AllTopics().length===74,'Lost existing 74 grade-five topics');
   function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const z=a%b;a=b;b=z}return a}
   function exact(n,d){const g=gcd(n,d)||1;return {n:n/g,d:d/g}}
   function solve(plan){
    const [op,...x]=plan,E=solve;
    if(op==='rat')return exact(x[0],x[1]);
    if(op==='add')return x.reduce((a,y)=>{const b=E(y);return exact(a.n*b.d+b.n*a.d,a.d*b.d)},exact(0,1));
    if(op==='sub'){const a=E(x[0]),b=E(x[1]);return exact(a.n*b.d-b.n*a.d,a.d*b.d)}
    if(op==='mul'){const a=E(x[0]),b=E(x[1]);return exact(a.n*b.n,a.d*b.d)}
    if(op==='div'){const a=E(x[0]),b=E(x[1]);if(!b.n)throw Error('Division by zero');return exact(a.n*b.d,a.d*b.n)}
    if(op==='abs'){const a=E(x[0]);return exact(Math.abs(a.n),a.d)}
    throw Error('Unknown independent plan '+op);
   }
   let count=0;
   for(const id of topics){
    const stageFamilies=[];
    for(let stage=0;stage<3;stage++){
     const names=new Set(),texts=new Set();
     for(let family=0;family<5;family++){
      for(let repeat=0;repeat<28;repeat++){
       blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:stage,total:10,done:family,items:[],usedSignatures:[],finished:false};qid='g5:'+id;
       try{
        const q=makeG5Question(id),m=q?.mk130;
        if(!m||m.id!==id||m.t!==stage||m.p!==family||m.steps<stage+1)throw Error('Wrong stage or cognitive family');
        if(!q.text||!q.ex||!q.choices?.length||!q.sig||!q.templateId)throw Error('Missing student question data');
        const expected=solve(m.plan);
        if(m.expected.n!==expected.n||m.expected.d!==expected.d||expected.n<0)throw Error('Math oracle mismatch');
        const matches=q.choices.filter(x=>String(x.key)===String(q.ans));
        if(matches.length!==1)throw Error('Ambiguous answer');
        const key=expected.d===1?String(expected.n):expected.n+'/'+expected.d;
        if(String(q.ans)!==key)throw Error('Wrong answer key '+q.ans+' expected '+key);
        if(new Set(q.choices.map(x=>String(x.label))).size!==q.choices.length)throw Error('Duplicate answer distractors');
        if(repeat===0){names.add(q.templateId);if(texts.has(q.text))throw Error('Duplicate question in same level');texts.add(q.text)}
        count++;
       }catch(e){errors.push(id+' L'+stage+' F'+family+' #'+repeat+': '+e.message)}
      }
     }
     ok(names.size===5,id+' L'+stage+' has fewer than five distinct families');
     stageFamilies.push(...names);
    }
    ok(new Set(stageFamilies).size===15,id+' reuses cognitive family across difficulty stages');
   }
   renderGrade5();
   const nav=mainView.querySelector('#mk-g5-textbook-nav');
   ok(nav?.querySelectorAll('.mk-g5-toc-list li').length===51,'Missing 51 original textbook paragraphs');
   ok(nav?.querySelectorAll('input').length===0,'Duplicate topic search');
   for(const id of topics){
    blockSession=null;qid='';
    openG5Topic(id);
    ok((document.getElementById('modal')?.querySelector('h2')?.textContent||'').includes(g5AllTopics().find(x=>x.id===id).title),'Wrong lesson dialog '+id);
    if(typeof startG5QuizStage==='function'){startG5QuizStage(id,2);ok(q?.mk130?.id===id&&q?.mk130?.t===2,'Real master quiz is not v130 '+id)}
    else errors.push('No stage function '+id);
    if(typeof closeModal==='function')closeModal();
   }
   ok(document.documentElement.scrollWidth<=innerWidth+2,'Mobile horizontal overflow');
   return {n:errors.length,errors:errors.slice(0,25),count};
  });
  assert.equal(out.n,0,JSON.stringify({width,out}).slice(0,8500));
  assert.deepEqual(pageErrors,[],JSON.stringify({width,pageErrors}));
  console.log('G5_V130_RATIONAL_APPLICATIONS_PASS',JSON.stringify({width,topics:5,families:75,count:out.count}));
  await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V130_LIVE_APPLICATIONS_FAIL',e.stack||e);process.exit(1)});
