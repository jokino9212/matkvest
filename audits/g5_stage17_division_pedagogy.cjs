'use strict';
// Stage17: read-only pedagogical baseline for fraction division in Grade 5.
// No HTML, PWA or player data is changed by this audit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

function gcd(a,b) { while(b){const t=a%b;a=b;b=t;} return a<0n?-a:a; }
function rational(n,d=1n) {
 n=BigInt(n);d=BigInt(d);
 assert(d!==0n,'zero denominator');
 if(d<0n){n=-n;d=-d}
 const g=gcd(n,d);
 return [n/g,d/g];
}
function divide(a,b) {return rational(a[0]*b[1],a[1]*b[0]);}
function multiply(a,b) {return rational(a[0]*b[0],a[1]*b[1]);}
function fraction(s) {
 const m=String(s).replace(/\s/g,'').match(/^(\d+)\/(\d+)$/);
 assert(m,'unrecognized visible fraction '+s);
 return rational(m[1],m[2]);
}
function expectedFromVisible(q) {
 const visible=String(q.text);
 const parts=(visible.match(/\d+\s*\/\s*\d+/g)||[]).map(fraction);
 if(q.template==='frac_div_pair'){
  assert.equal(parts.length,2,'pair fractions: '+visible);
  return divide(parts[0],parts[1]);
 }
 if(q.template==='frac_div_integer'){
  assert.equal(parts.length,1,'integer division fractions: '+visible);
  const m=visible.match(/:\s*(\d+)(?:\D|$)/) || visible.match(/\s(?:на|в)\s+(\d+)\s+(?:част|стакан)/i);
  assert(m,'whole-number divisor missing: '+visible);
  return divide(parts[0],rational(m[1]));
 }
 if(q.template==='frac_div_then_multiply'){
  assert.equal(parts.length,3,'compound division fractions: '+visible);
  return multiply(divide(parts[0],parts[1]),parts[2]);
 }
 throw Error('unknown division template: '+q.template);
}
function displayedAnswer(s) {
 const text=String(s).trim().replace(/\s/g,'');
 const m=text.match(/^(\d+)(?:\/(\d+))?$/);
 assert(m,'unrecognized answer '+s);
 return rational(m[1],m[2]||'1');
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  const page=await browser.newPage(),pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e.message)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const raw=await page.evaluate(()=>{
   const topic=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS].find(x=>x.id==='frac_div_common');
   if(!topic)throw Error('frac_div_common topic not found');
   const stages=[];
   for(let stage=0;stage<3;stage++){
    const items=[],uniqueSessions=[];
    for(let run=0;run<60;run++){
     blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};
     qid='g5:'+topic.id;
     const unique=new Set();
     for(let pos=0;pos<5;pos++){
      blockSession.done=pos;
      const q=freshQuiz(qid);
      const text=stripHtmlText(String(q.text||''));
      const answer=String(q.correctText||'');
      const template=String(q.templateId||'base');
      const signature=text+'|'+answer;
      unique.add(signature);
      items.push({stage,run,pos,text,answer,template,
        context:!(/^(?:Вычисли|Сложи|Найди значение)\b/i.test(text)) &&
          /(?:площад|ширин|длин|лент|бутылк|стакан|полос|грядк|м²|метр|литр|часть|турист|скорост|прошёл|пути|сосуд|воды)/i.test(text)});
     }
     uniqueSessions.push(unique.size);
    }
    stages.push({stage,items,uniqueSessions});
   }
   return {topic:topic.id,stages};
  });
  assert.deepEqual(pageErrors,[],'browser errors');
  const summary=[],bad=[];
  for(const stage of raw.stages){
   const modes={},samples={},contexts={};
   for(const q of stage.items) {
    modes[q.template]=(modes[q.template]||0)+1;
    if(!samples[q.template])samples[q.template]={text:q.text,answer:q.answer};
    if(q.context) {contexts[q.template]=(contexts[q.template]||0)+1;}
    const decl=q.text.match(/разделили поровну на\s+(\d+)\s+([А-Яа-яЁё]+)/i);
    if(decl){
     const n=Number(decl[1]);
     const word=(n%100!==11&&n%10===1)?'часть':(n%100<12||n%100>14)&&n%10>=2&&n%10<=4?'части':'частей';
     if(decl[2]!==word)bad.push({stage:q.stage,text:q.text,error:'Wrong numeral declension: expected '+word});
    }
    try{
     const expected=expectedFromVisible(q),actual=displayedAnswer(q.answer);
     if(expected[0]!==actual[0]||expected[1]!==actual[1])bad.push({stage:q.stage,template:q.template,text:q.text,answer:q.answer,expected:expected.join('/')});
    }catch(e){bad.push({stage:q.stage,template:q.template,text:q.text,answer:q.answer,error:String(e)})}
   }
   assert.equal(stage.items.length,300);
   const duplicates=stage.uniqueSessions.filter(x=>x!==5).length;
   summary.push({stage:stage.stage,questions:stage.items.length,modes,contextual:stage.items.filter(q=>q.context).length,
     contexts,duplicateSessions:duplicates,samples});
  }
  assert.equal(raw.stages.length,3);
  assert.equal(bad.length,0,JSON.stringify(bad.slice(0,6)));
  for(const r of summary){
   assert.equal(Object.keys(r.modes).length,3,'three independent mathematical modes must remain');
   assert.equal(r.duplicateSessions,0,'duplicate visible question in session');
   if(process.env.STAGE17_REQUIRE_CONTEXT==='1')assert(r.contextual>=40,'too few contextual division tasks at stage '+r.stage);
  }
  const output={topic:raw.topic,questions:900,independentMathChecks:900,incorrectAnswers:bad.length,stages:summary};
  fs.mkdirSync('audits/out',{recursive:true});
  fs.writeFileSync('audits/out/g5_stage17_division_pedagogy.json',JSON.stringify(output,null,2));
  console.log('STAGE17_DIVISION_PEDAGOGY_SUMMARY',JSON.stringify(output));
  console.log('STAGE17_DIVISION_PEDAGOGY_PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE17_DIVISION_PEDAGOGY_FAIL',e.stack||e);process.exit(1)});
