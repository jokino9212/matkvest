'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert(sw.includes('APP_BUILD_HASH = "'+crypto.createHash('sha256').update(html).digest('hex')+'"'));
 assert(sw.includes('"./g5-fraction-arithmetic-v115.js"'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});let total=0,checkedUI=0;
 try{
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:790}}),pageErrors=[];
   page.on('pageerror',e=>pageErrors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const result=await page.evaluate(()=>{
    const ids=window.mkG5V115Arithmetic,issues=[],families={},counts={},tierExamples={};
    const chosen=['frac_compare_den','frac_compare_num','frac_add','frac_sub','mixed_compare','mixed_add','mixed_sub'];
    if(ids.join('|')!==chosen.join('|'))issues.push('Target topic list drift');
    if(g5AllTopics().length!==74)issues.push('Catalog count drift: '+g5AllTopics().length);
    const div=document.createElement('div');
    function ratio(label){
      div.innerHTML=String(label);
      const wholeSpan=div.querySelector('.mixed .whole'),f=div.querySelector('.frac');
      if(f){
       const num=Number(f.querySelector('.num')?.textContent),den=Number(f.querySelector('.den')?.textContent);
       if(!Number.isInteger(num)||!Number.isInteger(den)||den<=0)throw Error('Malformed displayed fraction '+label);
       return {num:(wholeSpan?Number(wholeSpan.textContent)*den:0)+num,den};
      }
      const text=div.textContent.trim().replace(',','.');
      const n=Number(text);if(!Number.isFinite(n))throw Error('Unparseable answer '+label);
      return {num:n,den:1};
    }
    function reducedNum(v){return v.reduce((acc,n,i)=>i?acc+n:acc,0)}
    function calculate(terms,ops,absolute){
      let total=BigInt(terms[0]);
      for(let i=1;i<terms.length;i++){
       const curr=BigInt(terms[i]);
       if(ops[i-1]==='+')total+=curr;
       else if(ops[i-1]==='-')total-=curr;
       else throw Error('Unrecognized arithmetic operation '+ops[i-1]);
      }
      if(absolute&&total<0n)total=-total;
      if(total>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Unsafe arithmetic result');
      return Number(total);
    }
    for(const id of ids){
     families[id]=[new Set(),new Set(),new Set()];
     if(!g5Lesson(id)?.trim())issues.push('Missing lesson '+id);
     for(let t=0;t<3;t++)for(let batch=0;batch<10;batch++){
      const inSession=new Set(),signatures=new Set();
      for(let p=0;p<5;p++){
       blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:t,total:5,done:p,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
       try{
        const q=g5DonorQuestion(id),meta=q.mk115;
        if(!meta)throw Error('Missing v115 math plan');
        if(q.templateId!=='v115_'+id+'_L'+t+'_F'+p||meta.t!==t||meta.p!==p)throw Error('Wrong stage family');
        if(!q.text?.trim()||!q.explain?.trim()||q.choices?.length<3)throw Error('Missing question, solution or answers');
        if(q.choices.filter(c=>String(c.key)===String(q.correct)).length!==1)throw Error('No unique correct choice key');
        const labels=q.choices.map(c=>String(c.label));
        if(new Set(labels).size!==labels.length)throw Error('Duplicated displayed choices');
        const correct=q.choices.find(c=>String(c.key)===String(q.correct));
        if(meta.kind==='compare'){
         const left=calculate(meta.left,meta.opsLeft,false),right=calculate(meta.right,meta.opsRight,false);
         const expected=left>right?'>':left<right?'<':'=';
         if(String(correct.label)!==expected||meta.relation!==expected)throw Error('Incorrect relation '+JSON.stringify(meta));
        }else if(meta.kind==='choice'){
         if(String(correct.label)!==String(meta.expected))throw Error('Wrong chosen answer');
         if(meta.denominators){
          const fraction=ratio(correct.label),selected=fraction.num/fraction.den;
          for(const item of q.choices.filter(c=>c!==correct)){
           const other=ratio(item.label);
           if(other.num/other.den>=selected)throw Error('Selected fraction is not largest');
          }
         }
        }else{
         const x=calculate(meta.terms,meta.ops,meta.absolute),a=ratio(correct.label);
         if(x!==meta.expected)throw Error('Internal arithmetic value mismatch');
         if(a.num*meta.d!==x*a.den)throw Error('Wrong arithmetic answer '+JSON.stringify({id,t,p,meta,x,label:correct.label}));
         if(meta.kind==='fraction'&&meta.d===1)throw Error('Fraction denominator missing');
         if(meta.kind==='numeric'&&!Number.isInteger(a.num/a.den))throw Error('Numeric answer not integer');
        }
        const signature=q.text+'|'+String(correct.label);
        if(inSession.has(q.templateId))throw Error('Duplicate question family in session');
        if(signatures.has(signature))throw Error('Identical question in session');
        inSession.add(q.templateId);families[id][t].add(q.templateId);signatures.add(signature);
        counts[id]=(counts[id]||0)+1;
       }catch(e){issues.push('FAILED '+id+'/'+t+'/'+batch+'/'+p+': '+String(e))}
      }
      if(inSession.size!==5)issues.push('Not 5 families '+id+'/'+t+'/'+batch);
     }
     for(let t=0;t<3;t++)if(families[id][t].size!==5)issues.push('Not 5 types '+id+' level '+t);
     const all=[...families[id][0],...families[id][1],...families[id][2]];
     if(new Set(all).size!==15)issues.push('Not 15 distinct family names '+id);
    }
    let ui=0;
    for(const id of ids)for(let t=0;t<3;t++){
     blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:t,total:5,done:0,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
     try{
      const q=makeG5Question(id);
      if(!q.text?.trim()||!q.ex?.trim()||!q.correctText?.trim()||q.choices?.length<3)throw Error('Malformed normalized quiz');
      if(!q.choices.some(c=>String(c.key)===String(q.ans)))throw Error('Normalized correct answer missing');
      ui++;
     }catch(e){issues.push('Normalizer failed '+id+'/'+t+': '+e)}
    }
    renderGrade5();
    const cards=[...mainView.querySelectorAll('.g5-card')];
    if(cards.length!==74)issues.push('Grade 5 card count '+cards.length);
    const search=mainView.querySelector('#mk-textbook-search-input-5');
    if(!search)issues.push('Missing topic search');
    else for(const id of ids){
     const title=g5AllTopics().find(x=>x.id===id)?.title;
     search.value=title;search.dispatchEvent(new Event('input',{bubbles:true}));
     const shown=cards.filter(c=>!c.hidden);
     if(!shown.length)issues.push('Could not search topic '+title);
    }
    if(document.documentElement.scrollWidth>window.innerWidth+2)issues.push('Horizontal page overflow at '+window.innerWidth);
    return {issues:issues.slice(0,30),issueCount:issues.length,counts,ui};
   });
   assert.deepEqual(pageErrors,[]);
   assert.equal(result.issueCount,0,JSON.stringify(result.issues));
   const count=Object.values(result.counts).reduce((a,b)=>a+b,0);
   assert.equal(count,7*3*10*5);
   assert.equal(result.ui,7*3);
   total+=count;checkedUI+=result.ui;
   console.log('G5_V115_WIDTH_PASS',JSON.stringify({width,validatedQuestions:count,normalizedQuizModels:result.ui}));
   await page.close();
  }
  console.log('G5_V115_ARITHMETIC_ORACLE_PASS',JSON.stringify({questions:total,ui:checkedUI,topics:7,stages:3,families:105,deviceWidths:4}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V115_ARITHMETIC_ORACLE_FAIL',e.stack||e);process.exit(1)});
