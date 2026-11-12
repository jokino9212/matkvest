'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 assert(sw.includes('"./g5-textbook-topics.js"'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const report=await page.evaluate(()=>{
    const expected=['division_remainder','expand_brackets','simplify_expressions'];
    const all=g5AllTopics();
    for(const id of expected){
      if(all.filter(x=>x.id===id).length!==1)throw Error('Topic missing/duplicate '+id);
      if(!g5Lesson(id).trim())throw Error('Missing lesson '+id);
    }
    if(all.length!==56)throw Error('Expected 56 fifth-grade topics, got '+all.length);
    const checks=[];
    for(const id of expected)for(let stage=0;stage<3;stage++)for(let session=0;session<12;session++){
      const families=new Set(),stems=new Set();
      for(let pos=0;pos<5;pos++){
        blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:stage,done:pos,total:5,usedSignatures:[],items:[],finished:false};
        qid='g5:'+id;
        const q=makeG5Question(id);
        if(!q.text||!q.ex||!q.templateId)throw Error('Incomplete question '+id+' '+stage+' '+pos);
        if(!q.choices||q.choices.length<3)throw Error('Missing choices '+id);
        if(q.answerMode==='number'&&!Number.isFinite(Number(q.correctText)))throw Error('Wrong numeric answer '+id);
        if(stems.has(q.text))throw Error('Repeated question in session '+id+' '+stage);
        stems.add(q.text);
        families.add(q.templateId);
        const right=q.choices.filter(c=>String(c.key)===String(q.ans));
        if(right.length!==1)throw Error('Correct option count '+id+' '+stage+' '+pos);
        if(q.mk5Audit?.expected!==undefined&&Number(q.correctText)!==q.mk5Audit.expected)throw Error('Wrong numeric audit '+id);
      }
      if(families.size<5)throw Error('Not five families '+id+' '+stage+': '+[...families]);
      checks.push({id,stage,session});
    }
    renderGrade5();
    const cards=[...document.querySelectorAll('.g5-card')].map(x=>x.textContent);
    for(const id of expected){const title=all.find(x=>x.id===id).title;if(!cards.some(x=>x.includes(title)))throw Error('Invisible card '+title)}
    const grade5Page={inputs:[...mainView.querySelectorAll('input')].map(e=>({placeholder:e.placeholder,type:e.type})),cards:mainView.querySelectorAll('.g5-card').length};
    const grade6Page={renderAvailable:typeof renderGrade6==='function'};
    if(grade6Page.renderAvailable){renderGrade6();grade6Page.inputs=[...mainView.querySelectorAll('input')].map(e=>({placeholder:e.placeholder,type:e.type}));grade6Page.cards=[...mainView.querySelectorAll('.topic')].slice(0,4).map(e=>({class:e.className,html:e.outerHTML.slice(0,200)}));grade6Page.sections=[...mainView.querySelectorAll('section')].slice(0,5).map(e=>({class:e.className,html:e.outerHTML.slice(0,120)}));}
    return {topics:all.length,checks:checks.length,questions:checks.length*5,grade5Page,grade6Page};
  });
  assert.deepEqual(errors,[]);
  console.log('G5_TEXTBOOK_3_TOPIC_GATE_PASS',JSON.stringify(report));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_TEXTBOOK_3_TOPIC_GATE_FAIL',e.stack||e);process.exit(1)});
