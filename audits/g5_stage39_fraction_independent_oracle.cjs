'use strict';
const {chromium}=require('playwright'),path=require('node:path'),assert=require('node:assert/strict');
const ids=['frac_equal','frac_reduce','frac_common_lcm','frac_compare_diff','frac_add_diff','frac_sub_diff','frac_mul_common'];
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b]}return a};
const rat=(a,b=1n)=>{a=BigInt(a);b=BigInt(b);assert(b!==0n,'Zero denominator');if(b<0n){a=-a;b=-b}const g=gcd(a,b);return [a/g,b/g]};
function solve(p){
 const [op,...x]=p,ev=solve;
 if(op==='rat')return rat(x[0],x[1]);
 if(op==='add')return x.reduce((a,y)=>{const b=ev(y);return rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1])},[0n,1n]);
 if(op==='sub'){const a=ev(x[0]),b=ev(x[1]);return rat(a[0]*b[1]-b[0]*a[1],a[1]*b[1])}
 if(op==='mul'){const a=ev(x[0]),b=ev(x[1]);return rat(a[0]*b[0],a[1]*b[1])}
 if(op==='div'){const a=ev(x[0]),b=ev(x[1]);return rat(a[0]*b[1],a[1]*b[0])}
 if(op==='abs'){const a=ev(x[0]);return rat(a[0]<0n?-a[0]:a[0],a[1])}
 if(op==='max'||op==='min'){
  return x.map(ev).reduce((a,b)=>{const diff=a[0]*b[1]-b[0]*a[1];return op==='max'?(diff>=0n?a:b):(diff<=0n?a:b)})
 }
 if(op==='num'){const a=ev(x[0]);return rat(a[0])}
 if(op==='den'){const a=ev(x[0]);return rat(a[1])}
 if(op==='gcd')return rat(gcd(BigInt(x[0]),BigInt(x[1])));
 if(op==='lcm'){const a=BigInt(x[0]),b=BigInt(x[1]);return rat(a/gcd(a,b)*b)}
 throw Error('Unsupported oracle '+op);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:810}});
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const rows=await page.evaluate(ids=>{
   let seed=390113;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const out=[];
   for(const id of ids)for(let t=0;t<3;t++)for(let f=0;f<5;f++)for(let j=0;j<10;j++){
    blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:t,done:f,total:10,usedSignatures:[],items:[],finished:false};
    qid='g5:'+id;
    const q=makeG5Question(id);
    out.push({id,t,f,text:String(q.text),answer:String(q.ans),choices:q.choices.map(c=>({key:String(c.key),label:String(c.label)})),meta:q.mk129});
   }
   return out;
  },ids);
  let checks=0;
  for(const q of rows){
   assert(q.meta&&q.meta.id===q.id&&q.meta.t===q.t&&q.meta.p===q.f,'Generator metadata mismatch '+q.id);
   const [n,d]=solve(q.meta.plan),expected=q.meta.expected;
   assert.equal(n.toString(),String(expected.n),'Oracle numerator '+q.id);
   assert.equal(d.toString(),String(expected.d),'Oracle denominator '+q.id);
   const answer=q.meta.mode==='frac'?n+'/'+d:n.toString();
   assert.equal(q.answer,answer,'Incorrect answer shown '+q.id);
   assert.equal(q.choices.filter(c=>c.key===q.answer).length,1,'Missing correct option '+q.id);
   assert.equal(new Set(q.choices.map(c=>c.label)).size,q.choices.length,'Duplicate visible choices '+q.id);
   assert(!/NaN|undefined|Infinity/.test(q.text),'Malformed prompt '+q.id);
   checks++;
  }
  const addition=rows.filter(q=>q.id==='frac_add_diff'&&q.t===1);
  assert.equal(addition.filter(q=>q.f===0).length,10,'Missing original addition samples');
  assert.equal(addition.filter(q=>q.f===4).length,10,'Missing revised addition samples');
  assert(addition.filter(q=>q.f===0).every(q=>q.meta.plan[0]==='add'),'Expected direct addition family');
  assert(addition.filter(q=>q.f===4).every(q=>q.meta.plan[0]==='mul'),'New family must be genuinely two-stage');
  console.log('G5_STAGE39_INDEPENDENT_ORACLE_PASS '+JSON.stringify({topics:ids.length,samples:checks,uniqueFamilySlots:ids.length*15}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_STAGE39_INDEPENDENT_ORACLE_FAIL',e.stack||e);process.exit(1)});
