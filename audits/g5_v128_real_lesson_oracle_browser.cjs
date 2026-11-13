'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-decimal-percent-v128.js"><\/script>/g)||[]).length,1);
 assert(sw.includes('"./g5-decimal-percent-v128.js"')&&sw.includes('matkvest-iphone-v128'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:820}}),pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   const faults=[],assertion=(value,msg)=>{if(!value)faults.push(msg)};
   const topics=window.mkG5V128Tiered||[];
   assertion(topics.length===6,'Expected 6 improved topics');
   assertion(g5AllTopics().length===74,'Original catalog changed');
   function gcd(a,b){while(b){const r=a%b;a=b;b=r}return a}
   function independent(node){
    const [op,...x]=node;const E=independent;
    if(op==='v')return BigInt(x[0]);
    if(op==='add')return x.reduce((s,n)=>s+E(n),0n);
    if(op==='sub')return E(x[0])-E(x[1]);
    if(op==='mulNat')return E(x[0])*BigInt(x[1]);
    if(op==='divNat'){const a=E(x[0]),b=BigInt(x[1]);if(b===0n||a%b!==0n)throw Error('Noninteger division');return a/b}
    if(op==='mulDec'){const p=E(x[0])*E(x[1]);if(p%1000n!==0n)throw Error('Inexact product');return p/1000n}
    if(op==='divDec'){const a=E(x[0])*1000n,b=E(x[1]);if(b===0n||a%b!==0n)throw Error('Nonterminating quotient');return a/b}
    if(op==='percent'){const a=E(x[0])*BigInt(x[1]);if(a%100n!==0n)throw Error('Inexact percent');return a/100n}
    if(op==='average'){const sum=x.reduce((s,n)=>s+E(n),0n);if(sum%BigInt(x.length)!==0n)throw Error('Inexact average');return sum/BigInt(x.length)}
    if(op==='abs'){const v=E(x[0]);return v<0n?-v:v}
    throw Error('Bad operation '+op);
   }
   let checked=0;
   for(const id of topics){
    const allFamilies=[];
    for(let stage=0;stage<3;stage++){
     const types=new Set(),questions=new Set();
     for(let family=0;family<5;family++){
      for(let k=0;k<25;k++){
       blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:stage,total:10,done:family,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
       try{
        const q=makeG5Question(id),m=q?.mk128;
        if(!m||m.id!==id||m.t!==stage||m.p!==family||m.steps<stage+1)throw Error('Wrong subject, stage or steps');
        if(!q.text||!q.ex||!q.choices?.length||!q.templateId||!q.sig)throw Error('Incomplete real question fields');
        const value=independent(m.plan),right=q.choices.filter(c=>String(c.key)===String(q.ans));
        if(right.length!==1)throw Error('Ambiguous correct key');
        if(new Set(q.choices.map(x=>String(x.label))).size!==q.choices.length)throw Error('Duplicate answers');
        if(m.mode==='frac'){
         const int=Number(value),g=gcd(int,1000),expected=int/g+'/'+(1000/g);
         if(m.expectedFraction?.n!==int/g||m.expectedFraction?.d!==1000/g)throw Error('Fraction not reduced');
         if(!q.choices.some(x=>String(x.key)===String(q.ans)))throw Error('Fraction choices inconsistent');
        }else{
         const expected=m.mode==='int'?m.expectedInt:m.expectedMilli;
         if(expected!==Number(value))throw Error('Incorrect expected answer');
         const shown=Number(String(right[0].label).replace(',','.'));
         if(!Number.isFinite(shown)||Math.abs(shown-(m.mode==='int'?Number(value):Number(value)/1000))>0.000001)throw Error('Displayed answer mismatch');
        }
        if(k===0){types.add(q.templateId);if(questions.has(q.text))throw Error('Duplicate family wording');questions.add(q.text)}
        checked++;
       }catch(e){faults.push(id+' L'+stage+' F'+family+' #'+k+': '+e.message)}
      }
     }
     assertion(types.size===5,id+' missing five distinct families on stage '+stage);
     allFamilies.push(...types);
    }
    assertion(new Set(allFamilies).size===15,id+' reuses families across stages');
   }
   renderGrade5();
   const menu=mainView.querySelector('#mk-g5-textbook-nav');
   assertion(menu?.querySelectorAll('.mk-g5-toc-list li').length===51,'Lost textbook paragraphs');
   assertion(menu?.querySelectorAll('input').length===0,'Duplicate topic search');
   for(const id of topics){
    blockSession=null;qid='';
    openG5Topic(id);
    assertion((document.getElementById('modal')?.querySelector('h2')?.textContent||'').includes(g5AllTopics().find(x=>x.id===id).title),'Wrong lesson '+id);
    if(typeof startG5QuizStage==='function'){
      startG5QuizStage(id,2);
      assertion(q?.mk128?.t===2&&q?.mk128?.id===id,'Real Master stage does not use new generator '+id);
    }else faults.push('No quiz stage opener '+id);
    if(typeof closeModal==='function')closeModal();
   }
   assertion(document.documentElement.scrollWidth<=innerWidth+2,'Horizontal overflow');
   return {errorCount:faults.length,errors:faults.slice(0,24),checked};
  });
  assert.equal(result.errorCount,0,JSON.stringify({width,result}).slice(0,9000));
  assert.deepEqual(pageErrors,[],JSON.stringify({width,pageErrors}));
  console.log('G5_V128_90_LIVE_FAMILIES_PASS',JSON.stringify({width,checked:result.checked,topics:6,families:90}));
  await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V128_LIVE_FAIL',e.stack||e);process.exit(1)});
