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
  const page=await browser.newPage({viewport:{width,height:860}}),pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const res=await page.evaluate(()=>{
   const issues=[],check=(ok,msg)=>{if(!ok)issues.push(msg)},ids=window.mkG5V128Tiered||[];
   check(ids.length===6,'Expected six topics');
   check(g5AllTopics().length===74,'74 textbook topics not preserved');
   function independent(node){
    const [op,...x]=node,E=independent;
    if(op==='v')return BigInt(x[0]);
    if(op==='add')return x.reduce((s,y)=>s+E(y),0n);
    if(op==='sub')return E(x[0])-E(x[1]);
    if(op==='mulNat')return E(x[0])*BigInt(x[1]);
    if(op==='divNat'){const a=E(x[0]),b=BigInt(x[1]);if(!b||a%b!==0n)throw Error('Noninteger fixed-point division');return a/b;}
    if(op==='mulDec'){const v=E(x[0])*E(x[1]);if(v%1000n!==0n)throw Error('Unexpected sub-thousandth');return v/1000n;}
    if(op==='divDec'){const a=E(x[0])*1000n,b=E(x[1]);if(!b||a%b!==0n)throw Error('Nonterminating decimal quotient');return a/b;}
    if(op==='percent'){const a=E(x[0])*BigInt(x[1]);if(a%100n!==0n)throw Error('Fractional percent');return a/100n;}
    if(op==='average'){const sum=x.reduce((s,y)=>s+E(y),0n);if(sum%BigInt(x.length)!==0n)throw Error('Noninteger mean');return sum/BigInt(x.length);}
    if(op==='abs'){const d=E(x[0]);return d<0n?-d:d;}
    throw Error('Unknown operation '+op);
   }
   const gcd=(a,b)=>{while(b){const m=a%b;a=b;b=m;}return a};
   let checked=0;
   for(const id of ids){
    const cross=[];
    for(let t=0;t<3;t++){
     const templates=new Set(),texts=new Set();
     for(let p=0;p<5;p++){
      for(let rep=0;rep<28;rep++){
       blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:t,done:p,total:10,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
       try{
        const q=makeG5Question(id),meta=q?.mk128;
        if(!meta)throw Error('Student still receives old question');
        if(meta.id!==id||meta.t!==t||meta.p!==p||meta.steps<t+1)throw Error('Incorrect topic or difficulty');
        if(!q.text||!q.ex||!q.choices?.length||!q.templateId||!q.sig)throw Error('No actual student answer data');
        const v=independent(meta.plan);
        const keys=q.choices.filter(c=>String(c.key)===String(q.ans));
        if(keys.length!==1)throw Error('Ambiguous answer key');
        if(new Set(q.choices.map(c=>String(c.label))).size!==q.choices.length)throw Error('Duplicate visible answers');
        if(meta.mode==='frac'){
         const d=gcd(v,1000n),n=v/d,den=1000n/d,expected=n+'/'+den;
         if(meta.expectedFraction?.n!==Number(n)||meta.expectedFraction?.d!==Number(den))throw Error('Fraction reduction wrong');
         if(String(q.ans)!==expected)throw Error('Incorrect fraction answer key '+q.ans+' vs '+expected);
         if(keys[0].label!==frac(Number(n),Number(den)))throw Error('Displayed fraction not formatted correctly');
        }else{
         if(BigInt(meta.mode==='int'?meta.expectedInt:meta.expectedMilli)!==v)throw Error('Fixed-point answer mismatch');
         const expected=meta.mode==='int'?Number(v):Number(v)/1000;
         const displayed=Number(String(keys[0].label).replace(',','.'));
         if(!Number.isFinite(displayed)||Math.abs(displayed-expected)>1e-8)throw Error('Incorrect visible answer '+displayed+' vs '+expected);
        }
        if(rep===0){templates.add(q.templateId);if(texts.has(q.text))throw Error('Repeated same task text');texts.add(q.text);}
        checked++;
       }catch(e){issues.push(id+' stage'+t+' slot'+p+' trial'+rep+': '+e.message)}
      }
     }
     check(templates.size===5,id+' stage '+t+' has '+templates.size+' families');
     cross.push(...templates);
    }
    check(new Set(cross).size===15,id+' cognitive families not 15');
   }
   renderGrade5();
   const menu=mainView.querySelector('#mk-g5-textbook-nav');
   check(menu?.querySelectorAll('.mk-g5-toc-list li').length===51,'Textbook paragraphs not all present');
   check(menu?.querySelectorAll('input').length===0,'Duplicate lower search returned');
   for(const id of ids){
    blockSession=null;qid='';
    openG5Topic(id);
    const heading=document.getElementById('modal')?.querySelector('h2')?.textContent||'';
    check(heading.includes(g5AllTopics().find(x=>x.id===id)?.title),'Wrong topic modal '+id);
    if(typeof startG5QuizStage==='function'){
     startG5QuizStage(id,2);
     check(q?.mk128?.id===id&&q?.mk128?.t===2,'Real Master stage missing new exercises '+id);
    }else issues.push('No real lesson quiz launcher');
    if(typeof closeModal==='function')closeModal();
   }
   check(document.documentElement.scrollWidth<=innerWidth+2,'Horizontal overflow');
   return {count:issues.length,issues:issues.slice(0,22),checked};
  });
  assert.equal(res.count,0,JSON.stringify({width,res}).slice(0,12000));
  assert.deepEqual(pageErrors,[],JSON.stringify({width,pageErrors}));
  console.log('G5_V128_REAL_DECIMAL_PERCENT_PASS',JSON.stringify({width,topics:6,families:90,checked:res.checked}));
  await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V128_REAL_DECIMAL_PERCENT_FAIL',e.stack||e);process.exit(1)});
