'use strict';
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
(async()=>{
 const h=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert(sw.includes('APP_BUILD_HASH = "'+crypto.createHash('sha256').update(h).digest('hex')+'"'));
 assert(sw.includes('"./g5-textbook-v111.js"'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  let total=0;
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:790}}),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message)));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const result=await page.evaluate(()=>{
    const all=g5AllTopics(),ids=window.mkG5V111Topics,issues=[],families={},counts={};
    if(all.length!==67)issues.push('Topic count '+all.length);
    for(const id of ids){
     if(all.filter(t=>t.id===id).length!==1)issues.push('Missing '+id);
     if(!g5Lesson(id)?.trim())issues.push('Missing lesson '+id);
     families[id]={};
     for(let stage=0;stage<3;stage++){
      let signatures=new Set(),templateIds=new Set();
      for(let session=0;session<12;session++){
       signatures.clear();templateIds.clear();
       for(let i=0;i<5;i++){
        blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:stage,total:5,done:i,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
        let q;
        try{q=freshQuiz(qid)}catch(e){issues.push('Throw '+id+': '+e);continue}
        if(!q||!q.text||!q.ex||!q.choices?.length||!String(q.correctText??'').trim())issues.push('Incomplete '+id+'/'+stage+'/'+i);
        if(!q.choices.some(x=>String(x.key)===String(q.ans)))issues.push('Wrong key '+id+'/'+stage+'/'+i);
        if(q.mk5Audit&&Number(q.correctText)!==q.mk5Audit.expected)issues.push('Wrong audited numeric '+id+'/'+stage+'/'+i);
        const sign=JSON.stringify([q.text,q.correctText,(q.choices||[]).map(c=>c.label).sort()]);
        if(signatures.has(sign))issues.push('Repeated '+id+'/'+stage+'/'+i);
        signatures.add(sign);templateIds.add(String(q.templateId));
       }
       if(templateIds.size!==5)issues.push('Five families absent: '+id+'/'+stage+'/'+[...templateIds]);
       total++;
      }
      families[id][stage]=12;
     }
    }
    renderGrade5();
    const cards=[...mainView.querySelectorAll('.g5-card')];
    if(cards.length!==67)issues.push('Cards '+cards.length);
    const search=mainView.querySelector('#mk-textbook-search-input-5');
    if(!search)issues.push('Search absent');
    else for(const id of ids){
     const title=all.find(t=>t.id===id).title;
     search.value=title;search.dispatchEvent(new Event('input',{bubbles:true}));
     if(cards.filter(x=>!x.hidden).length!==1)issues.push('Exact search failed '+title);
    }
    if(document.documentElement.scrollWidth>window.innerWidth+2)issues.push('Overflow '+window.innerWidth);
    return {count:all.length,questions:ids.length*3*12*5,issues:issues.slice(0,40),issueCount:issues.length};
   });
   assert.deepEqual(errors,[],'Browser JS error');
   assert.equal(result.issueCount,0,JSON.stringify(result.issues));
   total+=result.questions;
   console.log('G5_V111_WIDTH_PASS',width,JSON.stringify(result));
   await page.close();
  }
  console.log('G5_V111_CANDIDATE_PASS',total);
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V111_CANDIDATE_FAIL',e.stack||e);process.exit(1)});
