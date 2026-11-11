'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const abs=x=>x<0n?-x:x;
const gcd=(a,b)=>{a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t}return a||1n};
const rat=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);if(d===0n)throw Error('zero denominator');if(d<0n){n=-n;d=-d}const g=gcd(n,d);return [n/g,d/g]};
const plus=(a,b)=>rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const minus=(a,b)=>rat(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);
const times=(a,b)=>rat(a[0]*b[0],a[1]*b[1]);
const divide=(a,b)=>rat(a[0]*b[1],a[1]*b[0]);
const eq=(a,b)=>a&&b&&a[0]*b[1]===a[1]*b[0];
const parse=v=>{
 v=String(v).trim();
 let m=v.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
 if(m)return rat(BigInt(m[1])*BigInt(m[3])+BigInt(m[2]),m[3]);
 m=v.match(/^(-?\d+)\/(\d+)$/);if(m)return rat(m[1],m[2]);
 m=v.match(/^(-?\d+)(?:[.,](\d+))?$/);
 if(m){const digits=m[2]||'',d=10n**BigInt(digits.length),sign=m[1].startsWith('-')?-1n:1n;
  return rat(BigInt(m[1])*d+sign*BigInt(digits||0),d)}
 return null;
};
const nums=t=>(String(t).match(/\d+\s+\d+\/\d+|\d+\/\d+|\d+[,.]\d+|\d+/g)||[]).map(parse);
const rel=(a,b)=>a[0]*b[1]===b[0]*a[1]?'=':a[0]*b[1]>b[0]*a[1]?'>':'<';
const exprEval=e=>{
 e=String(e).trim().replace(/[.?]$/,'').replace(/(\d+)\s+(\d+)\/(\d+)/g,'($1+$2/$3)')
 .replace(/(\d+),(\d+)/g,'$1.$2').replace(/[·×]/g,'*').replace(/[:÷]/g,'/').replace(/−/g,'-');
 const tokens=e.match(/\d+(?:\.\d+)?|[()+\-*/]/g)||[];
 if(tokens.join('')!==e.replace(/\s+/g,''))throw Error('unsupported expression '+e);
 let p=0;
 const atom=()=>{if(tokens[p]==='+'){p++;return atom()}if(tokens[p]==='-'){p++;return times(rat(-1),atom())}
  if(tokens[p]==='('){p++;const v=sum();if(tokens[p++]!==')')throw Error('unclosed parentheses');return v}
  const token=tokens[p++];if(!token||!/^\d/.test(token))throw Error('atom '+token);return parse(token)};
 const prod=()=>{let v=atom();while(tokens[p]==='*'||tokens[p]==='/'){const op=tokens[p++],b=atom();v=op==='*'?times(v,b):divide(v,b)}return v};
 const sum=()=>{let v=prod();while(tokens[p]==='+'||tokens[p]==='-'){const op=tokens[p++],b=prod();v=op==='+'?plus(v,b):minus(v,b)}return v};
 const v=sum();if(p!==tokens.length)throw Error('unread tokens '+e);return v;
};
const expression=t=>{
 let m=t.match(/^(?:Вычисли|Найди)\s*:?\s*([\d,.\s·×:+−\-()]+)(?:[.]|$)/);
 if(m&&/[·×:+−\-]/.test(m[1]))return m[1];
 m=t.match(/^([\d,.\s·×:+−\-()]+)\s*=\s*\?/);
 return m?m[1]:null;
};
const oracle=q=>{
 const t=q.topic,id=q.template,x=q.text,ns=nums(x),answer=parse(q.answer);
 let expected=null,format=null;
 const e=expression(x);
 if(e&&/^(dec_add|dec_sub|dec_mul10|dec_div10|dec_mul_nat|dec_div_nat|dec_mul_dec|dec_div_dec)$/.test(t))
  expected=exprEval(e);
 if(t==='dec_compare'){
  if(id.includes('max')||id.includes('three')){
   const vals=ns;expected=vals.reduce((a,b)=>rel(a,b)==='<'?b:a);
  }else if(ns.length>=2){format=rel(ns[0],ns[1])}
 }
 if(t==='dec_place'){
  const m=x.match(/В числе (\d+),(\d+)/);
  if(m){
   const digits=m[2],rank=/тысячных/.test(x)?2:/сотых/.test(x)?1:0;
   if(id==='decimal_digit')expected=rat(BigInt(digits[rank]||'0'));
   else if(id==='decimal_digits_count')expected=rat(BigInt(digits.length));
   else if(id==='decimal_replace_digit'){
    const nd=x.match(/заменили на (\d+)/);
    if(nd&&nd[1].length===1){
     const newDigits=digits.slice(0,rank)+nd[1]+digits.slice(rank+1);expected=parse(m[1]+','+newDigits);
    }
   }
  }
 }
 if(t==='dec_place'&&id==='decimal_digits_count'){const m=x.match(/дроби (\d+),(\d+)/);if(m)expected=rat(m[2].length)}
 if(t==='dec_round'){
  const m=x.match(/Округли число (\d+),(\d+) до (целых|десятых|сотых)/);
  if(m){
   const place={целых:0,десятых:1,сотых:2}[m[3]],digits=m[2],value=BigInt(m[1]+digits);
   const scale=10n**BigInt(digits.length),target=10n**BigInt(place);
   expected=rat((value*target*2n+scale)/(2n*scale),target);
  }
 }
 if((t==='dec_mul10'||t==='dec_div10')&&id.endsWith('_inverse')&&ns.length>=2)
  expected=t==='dec_mul10'?divide(ns[1],ns[0]):times(ns[1],ns[0]);
 if((t==='dec_add'||t==='dec_sub')&&id.includes('context')){
  if(ns.length>=2)expected=ns.slice(1).reduce((a,b)=>t==='dec_add'?plus(a,b):minus(a,b),ns[0]);
 }
 if(t==='dec_mul_nat'&&id.includes('context')&&ns.length>=2)expected=times(ns[0],ns[1]);
 if(t==='dec_div_nat'&&id.includes('price')&&ns.length>=2)expected=divide(ns[1],ns[0]);
 if(t==='dec_mul_dec'&&id.includes('area')&&ns.length>=2)expected=times(ns[0],ns[1]);
 if(t==='dec_div_dec'&&id.includes('context')&&ns.length>=2)expected=divide(ns[1],ns[0]);
 if(t==='dec_to_common'){
  const f=x.match(/\d+\/\d+/),d=x.match(/\d+,\d+/);
  if(f)expected=parse(f[0]);else if(d)expected=parse(d[0]);
  if(id==='convert_dec_to_fraction')format='lowest-terms';
 }
 if(t==='percent'){
  if(id==='percent_of_number'&&ns.length>=2)expected=times(ns[1],divide(ns[0],rat(100)));
  if(id==='percent_discount_amount'&&ns.length>=2)expected=times(ns[0],divide(ns[1],rat(100)));
  if(id==='percent_price_increase'&&ns.length>=2)expected=times(ns[0],plus(rat(1),divide(ns[1],rat(100))));
 }
 if(t==='percent_whole'&&ns.length>=2)expected=divide(times(ns[1],rat(100)),ns[0]);
 if(t==='average'){
  if(id==='average_missing'&&ns.length>=3)expected=minus(minus(times(ns[0],rat(3)),ns[1]),ns[2]);
  else if(id==='average_three'&&ns.length>=3)expected=divide(ns.slice(0,3).reduce(plus,rat(0)),rat(3));
  else if(id==='average_four'&&ns.length>=4)expected=divide(ns.slice(0,4).reduce(plus,rat(0)),rat(4));
 }
 if(!expected&&format===null)return {check:false,why:'unsupported'};
 if(format==='lowest-terms'){
  if(!/^\d+\/\d+$/.test(q.answer))return {check:true,ok:false,expected:'fully reduced ordinary fraction'};
  const [n,d]=q.answer.split('/').map(BigInt);
  return {check:true,ok:eq(expected,answer)&&gcd(n,d)===1n,expected:'irreducible fraction equivalent to '+expected.join('/')};
 }
 if(expected&&!answer)return {check:true,ok:false,expected:expected.join('/')};
 return {check:true,ok:format!==null?q.answer.trim()===format:eq(expected,answer),expected:format??expected.join('/')};
};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const samples=await page.evaluate(()=>{
   const ids=['dec_place','dec_compare','dec_add','dec_sub','dec_round','dec_mul10','dec_div10','dec_mul_nat','dec_div_nat','dec_mul_dec','dec_div_dec','dec_to_common','percent','percent_whole','average'];
   const items=[],problems=[];
   for(const topic of ids)for(let stage=0;stage<3;stage++)for(let session=0;session<45;session++){
    blockSession={kind:'g5quiz',key:'g5:'+topic,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};qid='g5:'+topic;
    for(let pos=0;pos<5;pos++){blockSession.done=pos;try{
     const q=freshQuiz(qid);items.push({topic,stage,template:q.templateId||'base',text:stripHtmlText(String(q.text||'')),answer:String(q.correctText||'')});
    }catch(e){problems.push({topic,stage,session,pos,error:String(e)})}}
   }
   return {topics:ids.length,items,problems};
  });
  const incorrect=[],unsupported={},verified={};
  for(const item of samples.items){
   try{
    const result=oracle(item);
    if(!result.check){const k=item.topic+'/'+item.template;unsupported[k]=(unsupported[k]||0)+1;continue}
    verified[item.topic]=(verified[item.topic]||0)+1;
    if(!result.ok)incorrect.push({topic:item.topic,stage:item.stage,template:item.template,text:item.text,actual:item.answer,expected:result.expected});
   }catch(e){incorrect.push({topic:item.topic,stage:item.stage,template:item.template,text:item.text,error:String(e)})}
  }
  incorrect.push(...samples.problems,...errors.map(e=>({type:'browser error',error:e})));
  const grouped={};
  for(const x of incorrect){const id=x.topic+'/'+x.template;const a=grouped[id]||(grouped[id]={count:0,examples:[]});a.count++;if(a.examples.length<2)a.examples.push(x)}
  const report={topics:samples.topics,sampled:samples.items.length,verified:Object.values(verified).reduce((a,b)=>a+b,0),verifiedByTopic:verified,unsupported,problemCount:incorrect.length,grouped,problems:incorrect.slice(0,35)};
  fs.mkdirSync('audits/out',{recursive:true});fs.writeFileSync('audits/out/g5_stage14b_decimal_oracle.json',JSON.stringify(report,null,2));
  console.log('STAGE14B_DECIMAL_AUDIT',JSON.stringify({...report,unsupported:Object.entries(unsupported).slice(0,30),problems:report.problems.slice(0,8)}));
  assert.equal(report.sampled,15*3*45*5);
  assert.equal(report.problemCount,0,'Independent decimal math mismatch');
  assert(report.verified>9000,'Decimal independent verification coverage unexpectedly low');
  console.log('STAGE14B_DECIMAL_ORACLE_PASS',JSON.stringify({topics:report.topics,sampled:report.sampled,verified:report.verified,problems:report.problemCount}));
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE14B_DECIMAL_ORACLE_FAIL',e.stack||e);process.exit(1)});
