'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
const abs=x=>x<0n?-x:x;
const gcd=(a,b)=>{a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t}return a||1n};
const rat=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);if(d===0n)throw Error('divide by zero');if(d<0n){n=-n;d=-d}const g=gcd(n,d);return [n/g,d/g]};
const plus=(a,b)=>rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const minus=(a,b)=>rat(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);
const times=(a,b)=>rat(a[0]*b[0],a[1]*b[1]);
const div=(a,b)=>rat(a[0]*b[1],a[1]*b[0]);
const eq=(a,b)=>a&&b&&a[0]*b[1]===a[1]*b[0];
const parseVal=v=>{
 v=String(v||'').trim();
 let m=v.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);if(m)return rat(BigInt(m[1])*BigInt(m[3])+BigInt(m[2]),m[3]);
 m=v.match(/^(-?\d+)\/(\d+)$/);if(m)return rat(m[1],m[2]);
 m=v.match(/^(-?\d+)[.,](\d+)$/);if(m)return rat(BigInt(m[1])*(10n**BigInt(m[2].length))+(m[1].startsWith('-')?-1n:1n)*BigInt(m[2]),10n**BigInt(m[2].length));
 if(/^-?\d+$/.test(v))return rat(v);
 return null;
};
const nums=text=>(String(text).match(/\d+\s+\d+\/\d+|\d+\/\d+|\d+,\d+|\d+/g)||[]).map(parseVal);
const toString=v=>v[0]+'/'+v[1];
const lcm=(a,b)=>a/gcd(a,b)*b;
const sign=(a,b)=>{const d=a[0]*b[1]-b[0]*a[1];return d>0n?'>':d<0n?'<':'='};
const exactExpr=e=>{
 e=String(e).trim().replace(/[\s]*[.?]$/,'');
 e=e.replace(/(\d+)\s+(\d+)\/(\d+)/g,'($1+$2/$3)');
 e=e.replace(/(\d+),(\d+)/g,'$1.$2').replace(/[·×]/g,'*').replace(/[÷:]/g,'/').replace(/−/g,'-').replace(/²/g,'^2').replace(/³/g,'^3');
 const tokens=e.match(/\d+(?:\.\d+)?|[()+\-*/^]/g)||[];
 if(tokens.join('')!==e.replace(/\s+/g,''))throw Error('unsupported expression '+e);
 let p=0;
 const atom=()=>{
  if(tokens[p]==='+'){p++;return atom()}
  if(tokens[p]==='-'){p++;return times(rat(-1n),atom())}
  if(tokens[p]==='('){p++;const v=expression();if(tokens[p++]!==')')throw Error('closing parenthesis missing');return v}
  const t=tokens[p++];if(!t||!/^\d/.test(t))throw Error('invalid atom '+t);return parseVal(t);
 };
 const power=()=>{let v=atom();if(tokens[p]==='^'){p++;const k=atom();if(k[1]!==1n||k[0]>4n||k[0]<0n)throw Error('bad exponent');const base=v;for(let i=1n;i<k[0];i++)v=times(v,base)}return v};
 const product=()=>{let v=power();while(tokens[p]==='*'||tokens[p]==='/'){const op=tokens[p++],b=power();v=op==='*'?times(v,b):div(v,b)}return v};
 const expression=()=>{let v=product();while(tokens[p]==='+'||tokens[p]==='-'){const op=tokens[p++],b=product();v=op==='+'?plus(v,b):minus(v,b)}return v};
 const value=expression();if(p!==tokens.length)throw Error('unparsed expression '+e+' '+tokens.slice(p));return value;
};
const exprInText=t=>{
 let m=t.match(/^(?:Вычисли|Сложи)\s*:?\s*(.*?)(?:\s*=\s*\?|[.]|$)/);
 if(m)return m[1];
 m=t.match(/^(\d[\d\/.,\s()+−·×:²³*+-]*)\s*=\s*\?/);
 return m?m[1]:null;
};
const mathOracle=x=>{
 const t=x.topic,k=x.template,text=x.text,ns=nums(text),an=x.answer;
 const n=i=>ns[i],C=parseVal(an);
 let expected=null,format=null;
 const f=text.match(/(\d+)\/(\d+)/g)||[];
 const fr=f.map(parseVal);
 const expr=exprInText(text);
 if(expr&&/^(?:frac_add|frac_sub|mixed_add|frac_add_diff|frac_sub_diff|frac_mul_common|frac_div_common)$/.test(t))
  expected=exactExpr(expr);
 if((t==='frac_add'||t==='frac_sub')&&k.endsWith('_story')&&fr.length>=2)
  expected=fr.slice(1).reduce((a,b)=>t==='frac_add'?plus(a,b):minus(a,b),fr[0]);
 if(t==='frac_add_diff'&&k.endsWith('_story')&&fr.length>=2)expected=plus(fr[0],fr[1]);
 if(t==='frac_sub_diff'&&k.endsWith('_story')&&fr.length>=2)expected=minus(fr[0],fr[1]);
 if(t==='frac_mul_common'&&k==='frac_mul_integer'&&ns.length>=2)expected=times(n(0),n(1));
 if(t==='frac_to_mixed'&&fr.length>=1){
  if(k==='improper_whole_part')expected=rat(fr[0][0]/fr[0][1]);
  else {expected=fr[0];format='mixed'}
 }
 if(t==='mixed_to_frac'&&ns.length>=1){
  if(k==='mixed_numerator')expected=rat(ns[0][0]);
  else {expected=ns[0];format='improper'}
 }
 if(t==='frac_reduce'&&fr.length>=1){
  if(k==='reduce_fraction')expected=fr[0];
  if(k==='reduce_new_numerator')expected=rat(fr[0][0]);
  if(k==='reduce_gcd'){
   const original=f[0].split('/').map(BigInt);expected=rat(gcd(original[0],original[1]));
  }
 }
 if(t==='frac_equal'){
  if(k==='equal_fraction'&&fr.length>=1)expected=fr[0];
  if(k==='equal_missing_numerator'&&fr.length>=2)expected=times(fr[0],rat(BigInt(f[1].split('/')[1]||1))); // handled below if missing
  if(k==='equal_missing_denominator')expected=null;
 }
 if(t==='frac_common_lcm'){
  if(k==='common_find_lcm'&&fr.length===2){
   const a=f[0].split('/').map(BigInt),b=f[1].split('/').map(BigInt);expected=rat(lcm(a[1],b[1]));
  }
  if(k==='common_find_numerator'){
   const m=text.match(/Дробь (\d+)\/(\d+) привели к знаменателю (\d+)/);
   if(m)expected=rat(BigInt(m[1])*BigInt(m[3])/BigInt(m[2]));
  }
  if(k==='common_fraction'){
   const m=text.match(/Приведи (\d+)\/(\d+) к общему знаменателю (\d+)/);
   if(m){const N=BigInt(m[1]),D=BigInt(m[2]),T=BigInt(m[3]);
    if(T%D!==0n)throw Error('invalid target denominator');expected=rat(N*T,D);format=String(N*T/D)+'/'+m[3];
   }
  }
 }
 if(t==='frac_compare_diff'&&fr.length>=2){format=sign(fr[0],fr[1]);expected=null}
 if(t==='frac_division'){
  if(k==='quotient_as_fraction'||k==='division_story'){if(ns.length>=2)expected=div(ns[0],ns[1])}
  if(k==='fraction_as_quotient'&&f.length){format=f[0].replace('/',' : ')}
 }
 if(t==='frac_part_number'){
  if(k==='part_of_number')expected=times(fr[0],ns[1]);
  if(k==='part_in_context')expected=times(ns[0],fr[0]);
  if(k==='part_remainder')expected=minus(ns[0],times(ns[0],fr[0]));
 }
 if(t==='frac_restore'){
  if(k==='restore_whole'||k==='restore_book')expected=div(ns[1],fr[0]);
  if(k==='restore_from_used')expected=div(ns[1],fr[0]);
 }
 if(t==='frac_parts'){
  if(k==='parts_numerator'&&f.length)expected=rat(f[0].split('/')[0]);
  if(k==='parts_denominator'&&f.length)expected=rat(f[0].split('/')[1]);
  if(k==='parts_story'&&ns.length>=2)expected=div(ns[1],ns[0]);
  if(k==='parts_complement'&&ns.length>=2)expected=div(minus(ns[0],ns[1]),ns[0]);
 }
 if(t==='frac_ray'){
  if(k==='ray_count_ticks'&&fr.length)expected=rat(fr[0][0]); // denominator is unit step; tick index equals numerator
  if(k==='ray_steps'&&ns.length>=2)expected=div(ns[1],ns[0]);
  if(k==='ray_beyond_one'&&ns.length>=2)expected=div(ns[1],ns[0]);
  if(k==='ray_shift_fraction'&&fr.length>=2)expected=plus(fr[0],times(ns[2],fr[1]));
 }
 if(!expected&&!format)return {check:false,reason:'unsupported-template'};
 if(expected&&!C)return {check:false,reason:'unparseable-answer'};
 const ok=format!==null?an.trim()===format:eq(expected,C);
 return {check:true,ok,expected:format??toString(expected)};
};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const samples=await page.evaluate(()=>{
   const checkedIds=['frac_parts','frac_ray','frac_division','frac_to_mixed','mixed_to_frac','frac_add','frac_sub','mixed_add','frac_equal','frac_reduce','frac_common_lcm','frac_compare_diff','frac_add_diff','frac_sub_diff','frac_mul_common','frac_div_common','frac_part_number','frac_restore'];
   const out=[],problems=[];
   for(const topic of checkedIds)for(let stage=0;stage<3;stage++)for(let s=0;s<36;s++){
    blockSession={kind:'g5quiz',key:'g5:'+topic,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};qid='g5:'+topic;
    for(let pos=0;pos<5;pos++){
     blockSession.done=pos;
     try{const q=freshQuiz(qid);out.push({topic,stage,template:String(q.templateId||''),text:stripHtmlText(String(q.text||'')),answer:String(q.correctText||''),ex:stripHtmlText(String(q.ex||'')),choices:(q.choices||[]).map(c=>({key:String(c.key),label:stripHtmlText(String(c.label))}))})}
     catch(e){problems.push({topic,stage,s,pos,error:String(e)})}
    }
   }
   return {topics:checkedIds.length,out,problems};
  });
  const bad=[],unsupported={},verified={},total=samples.out.length;
  for(const q of samples.out){
   try{const a=mathOracle(q);
    if(!a.check){const key=q.topic+'/'+q.template;unsupported[key]=(unsupported[key]||0)+1}
    else {verified[q.topic]=(verified[q.topic]||0)+1;if(!a.ok)bad.push({topic:q.topic,stage:q.stage,template:q.template,question:q.text,actual:q.answer,expected:a.expected})}
   }catch(e){bad.push({topic:q.topic,template:q.template,question:q.text,error:String(e)})}
  }
  bad.push(...samples.problems);bad.push(...errors.map(e=>({type:'browser-error',message:e})));
  const report={topics:samples.topics,sampled:total,verified:Object.values(verified).reduce((a,b)=>a+b,0),verifiedByTopic:verified,unsupported,problemCount:bad.length,problems:bad.slice(0,80)};
  fs.mkdirSync('audits/out',{recursive:true});fs.writeFileSync('audits/out/g5_stage14b_fraction_oracle.json',JSON.stringify(report,null,2));
  console.log('STAGE14B_FRACTION_AUDIT',JSON.stringify({...report,unsupported:Object.entries(unsupported).sort((a,b)=>b[1]-a[1]).slice(0,30),problems:report.problems.slice(0,10)}));
  assert.equal(report.sampled,18*3*36*5);assert.equal(report.problemCount,0,'Independent fraction math mismatch');
  assert((verified.frac_common_lcm||0)>400,'Common denominator oracle did not exercise intended cases');
  assert(report.verified>5000,'Too few independently calculated fraction questions');
  console.log('STAGE14B_FRACTION_ORACLE_PASS',JSON.stringify({topics:report.topics,sampled:report.sampled,verified:report.verified,problems:report.problemCount}));
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE14B_FRACTION_ORACLE_FAIL',e.stack||e);process.exit(1)});
