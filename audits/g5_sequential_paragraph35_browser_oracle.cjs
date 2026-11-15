'use strict';
// §35 independent learner-visible oracle: never reads generator plans, answers or metadata to solve.
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const ID='frac_common_lcm';
const gcd=(a,b)=>{while(b){[a,b]=[b,a%b]}return a},lcm=(a,b)=>a/gcd(a,b)*b;
const lcms=(...xs)=>xs.reduce(lcm,1);
function match(text,pattern,ctx){
 const m=text.match(pattern);assert(m,'Unrecognised learner prompt '+ctx+': '+text);
 return m.slice(1).map(Number);
}
function solveText(q){
 const {text:s,level:t,family:p,ctx}=q;
 let a,b,c,d,e,den,k,num,answer,steps;
 if(t===0){
  if(p===0){[d,e]=match(s,/Найди наименьший общий знаменатель дробей 1\/(\d+) и 1\/(\d+)/,ctx);answer=lcms(d,e)}
  if(p===1){[d,b]=match(s,/К знаменателю (\d+) и кратному ему (\d+) найди НОК/,ctx);assert.equal(b%d,0);answer=lcms(d,b)}
  if(p===2){[a,d,b]=match(s,/Для дробей (\d+)\/(\d+) и 1\/(\d+) найди наименьший общий знаменатель/,ctx);assert.equal(b%d,0);answer=lcms(d,b)}
  if(p===3){[a,d,b]=match(s,/Дробь (\d+)\/(\d+) привели к знаменателю (\d+)\. Найди новый числитель/,ctx);assert.equal(b%d,0);answer=a*b/d}
  if(p===4){[d,b]=match(s,/Какой дополнительный множитель нужен для знаменателя (\d+), чтобы получить (\d+)/,ctx);assert.equal(b%d,0);answer=b/d}
  steps=2;
 }else if(t===1){
  if(p===0){[d,e,c]=match(s,/Найди наименьший общий знаменатель (\d+), (\d+) и (\d+)/,ctx);answer=lcms(d,e,c)}
  if(p===1){[a,d,b,e]=match(s,/Первую дробь (\d+)\/(\d+) привели к НОК знаменателей (\d+) и (\d+)/,ctx);assert.equal(d,b);answer=a*lcms(b,e)/d}
  if(p===2){[a,d,b]=match(s,/Вторую дробь (\d+)\/(\d+) привели к НОК (\d+)/,ctx);assert.equal(b%d,0);answer=a*b/d}
  if(p===3){[d,e]=match(s,/Найди сумму дополнительных множителей для знаменателей (\d+) и (\d+)/,ctx);const n=lcms(d,e);answer=n/d+n/e}
  if(p===4){[a,d,b,e]=match(s,/Найди НОК знаменателей дробей (\d+)\/(\d+) и (\d+)\/(\d+)/,ctx);answer=lcms(d,e)}
  steps=3;
 }else{
  if(p===0){[d,e,c]=match(s,/Найди НОК для знаменателей (\d+), (\d+) и (\d+)/,ctx);answer=lcms(d,e,c)}
  if(p===1){[a,d,b,e,c]=match(s,/Приведи (\d+)\/(\d+) к НОК знаменателей (\d+), (\d+), (\d+)/,ctx);assert.equal(d,b);answer=a*lcms(b,e,c)/d}
  if(p===2){[a,d,b,e,c]=match(s,/Приведи (\d+)\/(\d+) к НОК трёх знаменателей (\d+), (\d+) и (\d+)/,ctx);assert.equal(d,e);answer=a*lcms(b,e,c)/d}
  if(p===3){[d,e,c]=match(s,/Приведи знаменатели (\d+), (\d+) и (\d+) к наименьшему общему/,ctx);const n=lcms(d,e,c);answer=n/d+n/e+n/c}
  if(p===4){[d,e,c]=match(s,/Найди НОК чисел (\d+), (\d+) и (\d+)/,ctx);answer=lcms(d,e,c)}
  steps=4+(p===3?1:0);
 }
 assert(Number.isSafeInteger(answer)&&answer>0,'Invalid independent solution '+ctx+': '+answer);
 return {answer,steps};
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(id=>{
   let seed=2026111535;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const read=(html)=>{
    const root=document.createElement('div');root.innerHTML=String(html||'');
    for(const f of [...root.querySelectorAll('.frac')]){
     const n=f.querySelector('.num')?.textContent?.trim(),d=f.querySelector('.den')?.textContent?.trim();
     if(n&&d)f.replaceWith(document.createTextNode(n+'/'+d));
    }
    root.querySelectorAll('svg').forEach(s=>s.remove());
    return root.textContent.replace(/\s+/g,' ').trim();
   };
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let sample=0;sample<40;sample++){
    blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
    const q=makeG5Question(id);
    rows.push({ctx:id+'/'+level+'/'+family+'/'+sample,level,family,sample,text:read(q.text),
      ex:read(q.ex),source:q.sourceTopicId,template:q.templateId,ans:String(q.ans),
      choices:q.choices.map(c=>({key:String(c.key),label:read(c.label)}))});
   }
   return {rows,topics:g5AllTopics().length};
  },ID);
  assert.equal(data.topics,74);assert.equal(data.rows.length,600);
  const unique=new Map(),families=new Set(),steps=[[],[],[]],denoms=[new Set(),new Set(),new Set()];
  for(const q of data.rows){
   assert(q.text&&q.ex&&q.template,'Blank learner content '+q.ctx);
   assert.equal(q.source,ID,'Wrong topic '+q.ctx);
   assert(!/NaN|undefined|Infinity/.test(q.text+q.ex),'Malformed exercise '+q.ctx);
   assert(!/Найди сумму.*дробей|Вычисли сумму.*\+/.test(q.text),'Out-of-scope fraction addition '+q.ctx);
   const {answer,steps:step}=solveText(q);
   const correct=q.choices.filter(c=>c.key===q.ans);
   assert.equal(correct.length,1,'No unique keyed answer '+q.ctx);
   assert(q.choices.length>=3,'Insufficient choices '+q.ctx);
   const parsed=q.choices.map(c=>{assert(/^\d+$/.test(c.label),'Unexpected non-integer choice '+q.ctx+': '+c.label);return Number(c.label)});
   assert.equal(new Set(parsed).size,parsed.length,'Duplicate mathematical choices '+q.ctx);
   assert.equal(Number(correct[0].label),answer,'Incorrect learner-visible answer '+q.ctx+': '+q.text);
   const key=q.level+'/'+q.family;
   if(!unique.has(key))unique.set(key,new Set());unique.get(key).add(q.text);
   families.add(q.template);steps[q.level].push(step);
   const m=q.text.match(/\d+\/(\d+)/g)||[];m.forEach(z=>denoms[q.level].add(z.split('/')[1]));
  }
  assert.equal(families.size,15);assert.equal(unique.size,15);
  for(const [key,values]of unique)assert(values.size>=10,'Repetitive family '+key+': '+values.size);
  const means=steps.map(a=>a.reduce((x,y)=>x+y,0)/a.length);
  assert(means[0]<means[1]&&means[1]<means[2],'No three-tier progression '+means);
  assert.deepEqual(errors,[],'Browser JavaScript errors');
  console.log('G5_SEQUENTIAL_PARAGRAPH_35_PASS '+JSON.stringify({questions:data.rows.length,
    families:families.size,uniquePerFamily:[...unique].map(([k,v])=>[k,v.size]),
    meanSteps:means,denominators:denoms.map(s=>s.size)}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_35_FAIL',e.stack||e);process.exit(1)});
