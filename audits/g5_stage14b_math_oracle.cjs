'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const bg=x=>BigInt(String(x));
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b]}return a||1n}
function rat(n,d=1n){n=bg(n);d=bg(d);if(!d)throw Error('zero denominator');const g=gcd(n,d);return {n:(d<0n?-n:n)/g,d:(d<0n?-d:d)/g}}
function add(a,b){return rat(a.n*b.d+b.n*a.d,a.d*b.d)}
function sub(a,b){return rat(a.n*b.d-b.n*a.d,a.d*b.d)}
function mul(a,b){return rat(a.n*b.n,a.d*b.d)}
function div(a,b){return rat(a.n*b.d,a.d*b.n)}
function plain(s){s=String(s).trim().replace(/,/g,'.');if(/^-?\d+\/\d+$/.test(s)){const [n,d]=s.split('/');return rat(n,d)}
 if(/^-?\d+\s+\d+\/\d+$/.test(s)){const [w,rest]=s.split(/\s+/),[n,d]=rest.split('/');return add(rat(w),rat(n,d))}
 if(/^-?\d+(?:\.\d+)?$/.test(s)){const negative=s.startsWith('-');if(negative)s=s.slice(1);const [int,dec='']=s.split('.');let v=rat(BigInt(int+dec),10n**BigInt(dec.length));return negative?rat(-v.n,v.d):v}
 return null}
function expression(input){
 let s=String(input).trim().replace(/−/g,'-').replace(/[×·]/g,'*').replace(/:/g,'/').replace(/,/g,'.')
 s=s.replace(/(\d+)\s+(\d+)\/(\d+)/g,'($1+$2/$3)');
 const tokens=s.match(/\d+\/\d+|\d+(?:\.\d+)?|[()+\-*/]/g)||[];
 const stripped=s.replace(/\s+/g,'');if(tokens.join('')!==stripped)throw Error('Unknown token '+s);
 let i=0;
 function atom(){let t=tokens[i++];if(t==='('){const v=sum();if(tokens[i++]!==')')throw Error('unclosed');return v}
  if(t==='-'){const x=atom();return rat(-x.n,x.d)}
  if(t==='+')return atom();const v=plain(t);if(!v)throw Error('bad number '+t);return v}
 function prod(){let x=atom();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],v=atom();x=op==='*'?mul(x,v):div(x,v)}return x}
 function sum(){let x=prod();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],v=prod();x=op==='+'?add(x,v):sub(x,v)}return x}
 const result=sum();if(i!==tokens.length)throw Error('unused '+tokens.slice(i));return result
}
function same(a,b){return !!a&&!!b&&a.n*b.d===b.n*a.d}
function integer(x){return rat(x)}
function numberList(t){return (t.match(/\d+(?:[,.]\d+)?/g)||[]).map(Number)}
function expected(q){
 const t=q.text,k=q.template, nums=numberList(t),take=(n=0)=>nums[n];
 const mk=(val)=>({val});const ss=(str)=>({str:String(str)});
 const frac=(s)=>{const v=plain(s);if(!v)throw Error('fraction '+s);return v};
 const f=(t.match(/\d+\/\d+/g)||[]);
 const mixed=(t.match(/\d+\s+\d+\/\d+/g)||[]);
 let m;
 // All visible arithmetic statements are parsed independently with exact rational arithmetic.
 m=t.match(/^(?:Вычисли|Сложи|Найди)\s*([()\d,\s+/·×:−*-]+)(?:\s*=\s*\?|\.|$)/);
 if(m&&/[+·×:−*-]/.test(m[1]))return mk(expression(m[1]));
 m=t.match(/^([()\d,\s+/·×:−*-]+)\s*=\s*\?/);
 if(m)return mk(expression(m[1]));
 if(k==='natural_compare')return mk(integer(Math.max(...nums)));
 if(k==='natural_digit'){const digits={единиц:1,десятков:10,сотен:100,тысяч:1000,'десятков тысяч':10000};const place=Object.keys(digits).sort((a,b)=>b.length-a.length).find(s=>t.includes('разряде '+s));if(place)return mk(integer(Math.floor(take(0)/digits[place])%10))}
 if(k==='natural_round'){const units={десятков:10,сотен:100,тысяч:1000,'десятков тысяч':10000};const key=Object.keys(units).sort((a,b)=>b.length-a.length).find(x=>t.includes('до '+x));if(key){const n=units[key];return mk(integer(Math.floor((take(0)+n/2)/n)*n))}}
 if(k==='coord_distance')return mk(integer(Math.abs(take(1)-take(0))));
 if(k==='coord_twosteps')return mk(integer(nums.reduce((a,b)=>a+b,0)));
 if(k==='coord_midpoint')return mk(integer((take(0)+take(1))/2));
 if(k==='geom_rectangle_area')return mk(integer(take(0)*take(1)));
 if(k==='geom_inverse_perimeter')return mk(integer(take(0)/2-take(1)));
 if(k==='geom_composite_area')return mk(integer(take(0)*take(1)-take(2)*take(3)));
 if(k==='volume_box')return mk(integer(take(0)*take(1)*take(2)));
 if(k==='volume_missing_edge')return mk(integer(take(0)/(take(1)*take(2))));
 if(k==='volume_unit_cubes')return mk(integer(nums.reduce((a,b)=>a*b,1)));
 if(k==='angle_complement')return mk(integer(90-take(1)));
 if(k==='chart_one_sector')return mk(integer(360/take(0)));
 if(k==='chart_fraction_to_angle')return mk(mul(frac(f[0]),integer(360)));
 if(k==='chart_angle_fraction')return mk(rat(take(0),360));
 if(k==='unit_mixed_time')return mk(integer(take(0)*60+take(1)));
 if(k==='unit_mixed_length')return mk(integer(take(0)*100+take(1)));
 if(k==='word_price')return mk(integer(take(0)*take(1)));
 if(k==='word_distance')return mk(integer(take(0)*take(1)));
 if(k==='word_three_steps')return mk(integer(take(4)-take(0)*take(1)-take(2)*take(3)));
 if(k==='parts_numerator')return mk(integer(take(0)));
 if(k==='parts_denominator')return mk(integer(take(1)));
 if(k==='parts_story')return mk(rat(take(1),take(0)));
 if(k==='ray_steps')return mk(rat(take(2),take(1)));
 if(k==='ray_beyond_one')return mk(rat(take(2),take(1)));
 if(k==='ray_count_ticks')return mk(integer(take(2)));
 if(k==='quotient_as_fraction'||k==='division_story')return mk(rat(take(0),take(1)));
 if(k==='improper_whole_part')return mk(integer(Math.floor(take(0)/take(1))));
 if(k.startsWith('improper_to_mixed'))return mk(frac(f[0]));
 if(k.startsWith('mixed_to_improper'))return mk(frac(mixed[0]));
 if(k==='mixed_numerator'){const v=plain(mixed[0]);return mk(integer(v.n))}
 if(k==='equal_fraction')return mk(frac(f[0]));
 if(k==='equal_missing_numerator'){const [a,b]=f.map(frac);return mk(integer(a.n*b.d/a.d))}
 if(k==='equal_missing_denominator'){const a=frac(f[0]);const num=take(2);return mk(rat(num*a.d,a.n))}
 if(k==='reduce_fraction'||k==='common_fraction')return mk(frac(f[0]));
 if(k==='reduce_gcd'){const a=frac(f[0]);return mk(integer(gcd(a.n,a.d)))}
 if(k==='reduce_new_numerator')return mk(integer(frac(f[0]).n));
 if(k==='common_find_lcm'){const a=frac(f[0]),b=frac(f[1]);const da=BigInt(f[0].split('/')[1]),db=BigInt(f[1].split('/')[1]);return mk(rat(da*db/gcd(da,db)))}
 if(k==='common_find_numerator'){const a=frac(f[0]),target=BigInt(t.match(/знаменателю (\d+)/)?.[1]);return mk(rat(a.n*target,a.d))}
 if(k.startsWith('compare_different')){const a=frac(f[0]),b=frac(f[1]);return ss(a.n*b.d>b.n*a.d?'>':a.n*b.d<b.n*a.d?'<':'=')}
 if(k==='part_of_number')return mk(mul(frac(f[0]),integer(take(2))));
 if(k==='part_in_context')return mk(mul(integer(take(0)),frac(f[0])));
 if(k==='part_remainder'||k==='frac_word_remainder')return mk(sub(integer(take(0)),mul(integer(take(0)),frac(f[0]))));
 if(k==='restore_whole'||k==='restore_book')return mk(div(integer(take(2)),frac(f[0])));
 if(k==='restore_from_used')return mk(div(integer(take(2)),frac(f[0])));
 if(k==='frac_word_reverse'){const all=div(integer(take(0)),frac(f[0]));return mk(sub(all,integer(take(0))))}
 if(k==='frac_word_two_steps')return mk(sub(sub(integer(take(0)),mul(integer(take(0)),frac(f[0]))),integer(Number(t.match(/затем ещё (\d+)/)?.[1]))));
 if(k==='decimal_digit'){const m=t.match(/числе ([\d,]+) .*разряде (десятых|сотых|тысячных)/);if(m){const d=m[1].split(',')[1]||'',idx={десятых:0,сотых:1,тысячных:2}[m[2]];return mk(integer(Number(d[idx]||0)))}}
 if(k==='decimal_digits_count'){const m=t.match(/дроби ([\d,]+)/);if(m)return mk(integer((m[1].split(',')[1]||'').length))}
 if(k==='decimal_replace_digit'){const m=t.match(/числе ([\d,]+) цифру (десятых|сотых|тысячных) заменили на (\d+)/);if(m){const [w,d='']=m[1].split(',');const idx={десятых:0,сотых:1,тысячных:2}[m[2]],a=d.split('');a[idx]=m[3];return mk(plain(w+'.'+a.join('')))}}
 if(k==='decimal_compare_sign'||k==='decimal_compare_zeroes'){const a=plain(t.match(/\d+,\d+/g)[0]),b=plain(t.match(/\d+,\d+/g)[1]);return ss(a.n*b.d>b.n*a.d?'>':a.n*b.d<b.n*a.d?'<':'=')}
 if(k==='decimal_max_three'){const arr=(t.match(/\d+,\d+/g)||[]).map(plain);return mk(arr.reduce((a,b)=>a.n*b.d>b.n*a.d?a:b))}
 if(k.startsWith('decimal_round')){const a=plain(t.match(/\d+,\d+/)[0]);const dp=t.includes('до целых')?0:t.includes('до десятых')?1:2;const p=10n**BigInt(dp);const rounded=(2n*a.n*p+a.d)/(2n*a.d);return mk(rat(rounded,p))}
 if(k.startsWith('decimal_shift')){const m=t.match(/([\d,]+)\s*[·:]\s*(10|100|1000)(?:\s*[·:]\s*(10|100|1000))?/);if(m){const x=plain(m[1]);const result=m[0].includes('·')?mul(x,integer(m[3]?Number(m[2])*Number(m[3]):Number(m[2]))):div(x,integer(m[3]?Number(m[2])*Number(m[3]):Number(m[2])));return mk(result)}
  const inv=t.match(/(?:умножили на|разделили на) (\d+) и получили ([\d,]+)/);if(inv){const val=plain(inv[2]);return mk(t.includes('умножили')?div(val,integer(inv[1])):mul(val,integer(inv[1])))}
 }
 if(k==='convert_dec_to_fraction'||k==='convert_by_denominator')return mk(plain(t.match(/\d+,\d+/)[0]));
 if(k==='convert_fraction_to_dec')return mk(frac(f[0]));
 if(k==='percent_of_number')return mk(rat(take(0)*take(1),100));
 if(k==='percent_discount_amount')return mk(rat(take(0)*take(1),100));
 if(k==='percent_price_increase')return mk(rat(take(0)*(100+take(1)),100));
 if(k.startsWith('percent_restore'))return mk(rat(take(1)*100,take(0)));
 if(k==='average_three'||k==='average_four'){const arr=t.match(/чисел?[: ]+([\d,\s]+)\./)?.[1]?.split(',').map(Number);if(arr)return mk(rat(arr.reduce((a,b)=>a+b,0),arr.length))}
 if(k==='average_missing')return mk(integer(take(0)*3-take(1)-take(2)));
 return null;
}
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const batch=await page.evaluate(()=>{
  const exclude=new Set(['frac_compare_den','frac_compare_num','mixed_compare','mixed_sub']);
  const topics=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS].filter(t=>!exclude.has(t.id)),all=[],faults=[];
  for(const topic of topics)for(let stage=0;stage<3;stage++)
   for(let session=0;session<30;session++){
    blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};
    qid='g5:'+topic.id;
    for(let pos=0;pos<5;pos++){blockSession.done=pos;
     try{const q=freshQuiz(qid);all.push({topic:topic.id,stage,tpl:String(q.templateId||'base'),
       text:stripHtmlText(q.text||''),answer:String(q.correctText||''),ex:stripHtmlText(q.ex||'')})}
     catch(e){faults.push({topic:topic.id,stage,session,pos,error:String(e)})}
    }
   }
  return {topics:topics.length,all,faults};
 });
 const checks=[],unsupported={},mistakes=[],parsing=[];
 for(const q of batch.all){
  let out;
  try{out=expected({...q,template:q.tpl})}catch(err){parsing.push({...q,error:String(err)});continue}
  if(!out){unsupported[q.topic+'::'+q.tpl]=(unsupported[q.topic+'::'+q.tpl]||0)+1;continue}
  const val=plain(q.answer);
  const ok=out.str!==undefined?q.answer===out.str:same(out.val,val);
  checks.push({topic:q.topic,tpl:q.tpl,ok});
  if(!ok)mistakes.push({topic:q.topic,stage:q.stage,tpl:q.tpl,text:q.text,answer:q.answer,expect:out.str!==undefined?out.str:String(out.val.n)+'/'+String(out.val.d),ex:q.ex});
 }
 const covered=new Set(checks.map(x=>x.topic)),checkedTemplates=new Set(checks.map(x=>x.topic+'::'+x.tpl));
 const result={topics:batch.topics,questions:batch.all.length,independentlyChecked:checks.length,
  independentlyCheckedTopics:covered.size,independentlyCheckedTemplates:checkedTemplates.size,
  unhandledTemplates:Object.keys(unsupported).length,unhandled:Object.entries(unsupported).sort((a,b)=>b[1]-a[1]).slice(0,120),
  generationFaults:batch.faults.slice(0,10),parsingFailures:parsing.slice(0,30),parsingCount:parsing.length,
  arithmeticErrors:mistakes.slice(0,40),arithmeticErrorCount:mistakes.length,errors};
 fs.mkdirSync('audits/out',{recursive:true});
 fs.writeFileSync('audits/out/g5_stage14b_math_oracle.json',JSON.stringify(result,null,2));
 console.log('STAGE14B_ORACLE_RESULT',JSON.stringify({...result,unhandled:result.unhandled.slice(0,90),arithmeticErrors:result.arithmeticErrors.slice(0,16),parsingFailures:result.parsingFailures.slice(0,12)}));
 assert.equal(batch.topics,49);
 assert.equal(batch.all.length,22050);
 assert.equal(batch.faults.length,0);
 assert.equal(errors.length,0);
 // This is diagnostic until enough distinct mathematical topics are verified.
 console.log('STAGE14B_ORACLE_DIAGNOSTIC_COMPLETE',JSON.stringify({questions:result.questions,
  independentlyChecked:result.independentlyChecked,checkedTopics:result.independentlyCheckedTopics,
  checkedTemplates:result.independentlyCheckedTemplates,unhandledTemplates:result.unhandledTemplates,
  arithmeticErrors:result.arithmeticErrorCount,parserErrors:result.parsingCount}));
}finally{await browser.close()}
})().catch(e=>{console.error('STAGE14B_ORACLE_FAILED',e.stack||e);process.exit(1)});
