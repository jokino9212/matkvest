'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert(html.includes('<script src="g5-arithmetic-tiers-v123.js"></script>'));
 assert(sw.includes('"./g5-arithmetic-tiers-v123.js"'));
 assert(sw.includes('matkvest-iphone-v123'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:830}}),pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   const errs=[],check=(val,msg)=>{if(!val)errs.push(msg)},ids=window.mkG5V123Tiered;
   function math(node){
    const op=node[0],xs=node.slice(1);
    if(op==='v')return BigInt(xs[0]);
    if(op==='add')return xs.reduce((sum,x)=>sum+math(x),0n);
    if(op==='sub')return math(xs[0])-math(xs[1]);
    if(op==='mul')return math(xs[0])*math(xs[1]);
    if(op==='div'){const a=math(xs[0]),b=math(xs[1]);if(b===0n||a%b!==0n)throw Error('noninteger');return a/b}
    if(op==='abs'){const v=math(xs[0]);return v<0n?-v:v}
    throw Error('unsupported plan '+op);
   }
   check(ids.length===8,'Expected eight new multi-tier topics');
   check(g5AllTopics().length===74,'Grade 5 catalog count drift');
   let generated=0;
   for(const id of ids){
    const groups=[];
    for(let t=0;t<=2;t++){
     const names=new Set();
     for(let p=0;p<5;p++){
      for(let repeat=0;repeat<28;repeat++){
       blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:t,done:p,total:10,items:[],usedSignatures:[],finished:false};qid='g5:'+id;
       try{
        const q=makeG5Question(id);
        if(!q?.text||!q.ex||!q.choices?.length||!q.templateId)throw Error('missing real question data');
        generated++;
        if(t===0){check(!q.mk123,'Warmup unexpectedly replaced');continue}
        const meta=q.mk123;
        if(!meta)throw Error('New question not wired to student quiz');
        if(meta.id!==id||meta.t!==t||meta.p!==p)throw Error('Wrong stage or cognitive family');
        if(meta.steps<2&&t===1||meta.steps<3&&t===2)throw Error('Insufficient operations');
        const expected=math(meta.plan);
        if(expected!==BigInt(meta.expected))throw Error('Incorrect answer in independent oracle');
        const right=q.choices.filter(c=>String(c.key)===String(q.ans));
        if(right.length!==1)throw Error('Answer key ambiguous');
        if(String(right[0].label)!==String(meta.expected))throw Error('Wrong visible answer');
        if(new Set(q.choices.map(c=>String(c.label))).size!==q.choices.length)throw Error('Duplicate displayed answer');
        if(repeat===0)names.add(q.templateId);
       }catch(e){errs.push(id+' L'+t+' F'+p+' try'+repeat+': '+e.message)}
      }
     }
     if(t>0&&names.size!==5)errs.push(id+' stage '+t+' has '+names.size+' unique families');
     groups.push(names);
    }
    check([...groups[1]].every(x=>!groups[2].has(x)),id+' tiers 1 and 2 reuse same question families');
   }
   for(const id of ['natural_add','natural_divide','number_tables','formulas_g5']){
     blockSession=null;qid='';
     openG5Topic(id);
     if(typeof startG5QuizStage==='function'){
      startG5QuizStage(id,1);
      check(!!q?.mk123&&q.mk123.id===id,'Actual stage quiz did not run v123 '+id);
     }else errs.push('Quiz unavailable '+id);
     if(typeof closeModal==='function')closeModal();
   }
   check(document.documentElement.scrollWidth<=innerWidth+2,'Mobile overflow');
   return {errors:errs.slice(0,18),errorCount:errs.length,generated,topics:ids.length};
  });
  assert.equal(result.errorCount,0,JSON.stringify({width,result}).slice(0,6000));
  assert.deepEqual(pageErrors,[],JSON.stringify({width,pageErrors}));
  console.log('G5_V123_MULTISTEP_LIVE_PASS',JSON.stringify({width,generated:result.generated,topics:result.topics}));
  await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V123_MULTISTEP_LIVE_FAIL',e.stack||e);process.exit(1)});
