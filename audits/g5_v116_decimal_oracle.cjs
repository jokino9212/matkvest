'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 const hash=crypto.createHash('sha256').update(html).digest('hex');
 assert(sw.includes('APP_BUILD_HASH = "'+hash+'"'),'v116 PWA index fingerprint mismatch');
 assert(sw.includes('"./g5-decimals-v116.js"'),'v116 JS not precached');
 assert(sw.includes('matkvest-iphone-v116'),'v116 service-worker version missing');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let total=0,ui=0;
 try{
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:790}}),pageErrors=[];
   page.on('pageerror',e=>pageErrors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const report=await page.evaluate(()=>{
    const required=['dec_compare','dec_add','dec_sub','dec_round'],issues=[],families={},counts={};
    if(!Array.isArray(window.mkG5V116DecimalTopics)||window.mkG5V116DecimalTopics.join('|')!==required.join('|'))issues.push('v116 ID metadata absent');
    if(g5AllTopics().length!==74)issues.push('Existing grade-five topic count drift '+g5AllTopics().length);
    const all=G5_DECIMALS.map(t=>t.id);
    if(all.length!==15||all.some((id,i)=>id!==['dec_place','dec_compare','dec_add','dec_sub','dec_round','dec_mul10','dec_div10','dec_mul_nat','dec_div_nat','dec_mul_dec','dec_div_dec','dec_to_common','percent','percent_whole','average'][i]))issues.push('Original fifteen decimal IDs or order changed');
    function big(node){
      if(!Array.isArray(node))throw Error('Malformed arithmetic expression');
      const [op,...args]=node;
      if(op==='v'){if(!Number.isSafeInteger(args[0]))throw Error('Noninteger source');return BigInt(args[0]);}
      if(op==='add')return args.reduce((sum,term)=>sum+big(term),0n);
      if(op==='sub')return big(args[0])-big(args[1]);
      if(op==='abs'){const n=big(args[0]);return n<0n?-n:n}
      if(op==='max')return args.map(big).reduce((a,b)=>a>b?a:b);
      if(op==='min')return args.map(big).reduce((a,b)=>a<b?a:b);
      if(op==='round'){
       const a=big(args[0]),step=BigInt(args[1]);
       if(a<0n||![10n,100n,1000n].includes(step))throw Error('Invalid rounding step');
       return ((a+step/2n)/step)*step;
      }
      throw Error('Unexpected arithmetic operation '+op);
    }
    function complexity(node){
     const [op,...args]=node;
     if(op==='v')return 0;
     if(op==='round'||op==='abs')return 1+complexity(args[0]);
     if(op==='sub')return 1+complexity(args[0])+complexity(args[1]);
     return (args.length-1)+args.reduce((total,e)=>total+complexity(e),0);
    }
    function parseDecimal(label){
     const s=String(label).trim(),m=s.match(/^(\d+)(?:[,.](\d{1,3}))?$/);
     if(!m)throw Error('Invalid decimal answer '+s);
     return BigInt(m[1])*1000n+BigInt((m[2]||'').padEnd(3,'0')||'000');
    }
    function literal(n){
     const x=BigInt(n),whole=x/1000n,tail=String(x%1000n).padStart(3,'0').replace(/0+$/,'');
     return tail?whole+','+tail:String(whole);
    }
    const R=required;
    for(const id of R){
      if(!G5_DECIMALS.some(x=>x.id===id))issues.push('Missing lesson card '+id);
      if(!g5Lesson(id)?.trim())issues.push('Missing grade-five lesson '+id);
      families[id]=[new Set(),new Set(),new Set()];
      for(let level=0;level<3;level++)for(let session=0;session<10;session++){
       const seriesTemplates=new Set(),seriesSignatures=new Set();
       for(let step=0;step<5;step++){
        blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,total:5,done:step,usedSignatures:[],items:[],finished:false};
        qid='g5:'+id;
        try{
         const q=g5DonorQuestion(id),a=q.mk116;
         if(!a||a.id!==id||a.t!==level||a.p!==step)throw Error('Incorrect missing generator stage');
         const expectedTemplate='g5v116_'+id+'_L'+level+'_F'+step;
         if(q.templateId!==expectedTemplate)throw Error('Missing/incorrect family ID '+q.templateId);
         if(!q.text?.trim()||!q.explain?.trim())throw Error('Question or explanation empty');
         if(!Array.isArray(q.choices)||q.choices.length<3)throw Error('Insufficient answer options');
         const answerChoices=q.choices.filter(c=>String(c.key)===String(q.correct));
         if(answerChoices.length!==1)throw Error('Correct key unavailable or duplicate');
         if(new Set(q.choices.map(c=>String(c.label))).size!==q.choices.length)throw Error('Duplicate answer label');
         const correct=answerChoices[0],label=String(correct.label);
         if(a.kind==='numeric'){
          const x=big(a.plan);
          if(a.mode==='integer'){
           if(x!==BigInt(a.answerInt)||parseDecimal(label)!==x*1000n)throw Error('Incorrect integer answer: '+label+' should '+x);
          }else{
           if(x!==BigInt(a.answerMilli)||parseDecimal(label)!==x)throw Error('Incorrect decimal answer: '+label+' should '+literal(x));
          }
          if(level===2&&complexity(a.plan)<3)throw Error('Advanced level has fewer than three cognitive operations');
          if(id==='dec_round'&&level===0&&step===3&&String(q.text).includes('сотые равны 5')){
           const source=a.sources[0];
           if(source%100!==50)throw Error('Decimal rounding boundary does not show exact 5 hundredths');
          }
          if(id==='dec_round'&&level===0&&step===4&&String(q.text).includes('тысячные равны 5')){
           if(a.sources[0]%10!==5)throw Error('Rounding boundary does not show 5 thousandths');
          }
         }else if(a.kind==='sign'){
          const x=big(a.left),y=big(a.right),relation=x>y?'>':x<y?'<':'=';
          if(a.sign!==relation||label!==relation)throw Error('Incorrect decimal comparison');
          if(level===2&&complexity(a.left)+complexity(a.right)<3)throw Error('Advanced comparison lacks multi-step calculation');
         }else throw Error('Unrecognized answer mode');
         for(const source of a.sources||[]){
           const display=literal(source);
           if(!q.text.includes(display))throw Error('Operand missing from text '+display+' '+q.text.slice(0,130));
         }
         if(seriesTemplates.has(q.templateId))throw Error('Repeated question family in five-question session');
         seriesTemplates.add(q.templateId);families[id][level].add(q.templateId);
         const signature=q.text+'|'+label;
         if(seriesSignatures.has(signature))throw Error('Repeated exact question in session');
         seriesSignatures.add(signature);
         counts[id]=(counts[id]||0)+1;
        }catch(e){issues.push('FAILED '+id+'/'+level+'/'+session+'/'+step+': '+String(e))}
       }
       if(seriesTemplates.size!==5)issues.push('Missing five distinct templates '+id+'/'+level+'/'+session);
      }
      for(let t=0;t<3;t++)if(families[id][t].size!==5)issues.push('Not five template families per level '+id+'/'+t);
      const union=[...families[id][0],...families[id][1],...families[id][2]];
      if(new Set(union).size!==15)issues.push('Template names do not change between levels '+id);
    }
    let normalized=0;
    for(const id of R)for(let tier=0;tier<3;tier++){
      blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:tier,total:5,done:0,usedSignatures:[],items:[],finished:false};
      qid='g5:'+id;
      try{
       const q=makeG5Question(id);
       if(!q?.text?.trim()||!q.ex?.trim()||!q.correctText?.trim()||q.choices.length<3)throw Error('Quiz model missing essential data');
       if(!q.choices.some(c=>String(c.key)===String(q.ans)))throw Error('Correct quiz key not in choices');
       normalized++;
      }catch(e){issues.push('Malformed grade-five quiz '+id+'/'+tier+': '+e)}
    }
    renderGrade5();
    const cards=[...mainView.querySelectorAll('.g5-card')],search=mainView.querySelector('#mk-textbook-search-input-5');
    if(cards.length!==74)issues.push('Grade-five card count '+cards.length);
    if(!search)issues.push('Textbook search missing');
    else{
      for(const id of R){
       const name=G5_DECIMALS.find(t=>t.id===id).title;
       search.value=name;search.dispatchEvent(new Event('input',{bubbles:true}));
       if(cards.filter(x=>!x.hidden).length!==1)issues.push('Exact textbook search failed '+name);
      }
      search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
      if(cards.filter(x=>!x.hidden).length!==74)issues.push('Cleared textbook search failed');
    }
    if(document.documentElement.scrollWidth>window.innerWidth+2)issues.push('Horizontal page overflow at '+window.innerWidth);
    return {counts,ui:normalized,issueCount:issues.length,issues:issues.slice(0,25)};
   });
   assert.deepEqual(pageErrors,[],'Browser script errors');
   assert.equal(report.issueCount,0,JSON.stringify(report.issues));
   const questions=Object.values(report.counts).reduce((a,b)=>a+b,0);
   assert.equal(questions,4*3*10*5);assert.equal(report.ui,4*3);
   total+=questions;ui+=report.ui;
   console.log('G5_V116_DECIMAL_WIDTH_PASS',JSON.stringify({width,questions,normalized:report.ui}));
   await page.close();
  }
  console.log('G5_V116_DECIMAL_ORACLE_PASS',JSON.stringify({questions:total,quizModels:ui,topics:4,families:60,stages:3,widths:4}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V116_DECIMAL_ORACLE_FAIL',e.stack||e);process.exit(1)});
