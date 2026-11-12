'use strict';
const assert=require('node:assert/strict'),path=require('path'),fs=require('fs'),crypto=require('crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8'),hash=crypto.createHash('sha256').update(html).digest('hex');
 assert(sw.includes('APP_BUILD_HASH = "'+hash+'"'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const result={};
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:760}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const data=await page.evaluate(({width})=>{
    const topics=g5AllTopics(),unexpected=[],seen=new Set(),counts={};
    if(topics.length!==61)throw Error('Expected 61 grade-five topics, got '+topics.length);
    for(const t of topics){
     if(seen.has(t.id))throw Error('Duplicate topic '+t.id);
     seen.add(t.id);
     for(let difficulty=0;difficulty<3;difficulty++){
      const types=new Set(),signatures=new Set();
      for(let step=0;step<5;step++){
       blockSession={kind:'g5quiz',key:'g5:'+t.id,stageIndex:difficulty,total:5,done:step,usedSignatures:[],items:[],finished:false};
       qid='g5:'+t.id;
       const q=freshQuiz(qid);
       if(!q?.text||!q?.ex||!String(q.correctText||'').trim())unexpected.push({id:t.id,difficulty,step,reason:'no question/explanation/answer'});
       const keys=(q.choices||[]).map(x=>String(x.key));
       if(!keys.includes(String(q.ans)))unexpected.push({id:t.id,difficulty,step,reason:'correct key not among choices'});
       if(new Set(keys).size!==keys.length)unexpected.push({id:t.id,difficulty,step,reason:'duplicate option key'});
       types.add(String(q.templateId||'unknown'));
       const sig=JSON.stringify([q.text,q.correctText,(q.choices||[]).map(x=>String(x.label)).sort()]);
       if(signatures.has(sig))unexpected.push({id:t.id,difficulty,step,reason:'exact duplicate'});
       signatures.add(sig);
      }
      counts[t.id+'-'+difficulty]=types.size;
     }
    }
    renderGrade5();
    const cardCount=mainView.querySelectorAll('.g5-card').length;
    if(cardCount!==topics.length)throw Error('Missing cards '+cardCount);
    const total=mainView.scrollWidth,client=mainView.clientWidth;
    const viewportOverflow=document.documentElement.scrollWidth>window.innerWidth+2;
    const search=mainView.querySelector('#mk-textbook-search-input-5');
    if(!search)throw Error('Search missing');
    for(const phrase of ['деление с остатком','сложение натуральных чисел','вычитание натуральных чисел','умножение натуральных чисел','деление натуральных чисел','числовые и буквенные выражения','упростить выражение']){
      search.value=phrase;search.dispatchEvent(new Event('input',{bubbles:true}));
      const found=[...mainView.querySelectorAll('.g5-card')].filter(x=>!x.hidden);
      if(!found.length)throw Error('Search term missing: '+phrase);
    }
    return {width,topics:topics.length,questions:topics.length*3*5,issues:unexpected.slice(0,15),issueCount:unexpected.length,cardCount,viewportOverflow,mainWidth:total,mainClient:client,minimumFamilyCount:Math.min(...Object.values(counts))};
   },{width});
   assert.deepEqual(errors,[]);
   assert.equal(data.issueCount,0,JSON.stringify(data.issues));
   assert.equal(data.viewportOverflow,false,'Page overflow at '+width+'px');
   result[width]=data;
   await page.close();
  }
  console.log('GRADE5_STAGE18T_FULL_REGRESSION_PASS',JSON.stringify(result));
 }finally{await browser.close()}
})().catch(e=>{console.error('GRADE5_STAGE18T_FULL_REGRESSION_FAIL',e.stack||e);process.exit(1)});
