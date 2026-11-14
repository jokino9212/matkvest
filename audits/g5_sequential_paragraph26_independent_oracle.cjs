'use strict';
// Independent learner-visible §26 oracle, with no use of mk5Audit, expected, correctLabel
// or mathematical metadata when computing an answer. Three topics, 45 families.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const IDS=['frac_parts','frac_read','frac_ray'];
const numerals=['ноль','одна','две','три','четыре','пять','шесть','семь','восемь','девять'];
const denWords={
 2:['вторая','вторых'],3:['третья','третьих'],4:['четвёртая','четвёртых'],
 5:['пятая','пятых'],6:['шестая','шестых'],7:['седьмая','седьмых'],
 8:['восьмая','восьмых'],9:['девятая','девятых'],10:['десятая','десятых'],
 11:['одиннадцатая','одиннадцатых'],12:['двенадцатая','двенадцатых'],
 13:['тринадцатая','тринадцатых'],14:['четырнадцатая','четырнадцатых'],
 15:['пятнадцатая','пятнадцатых'],16:['шестнадцатая','шестнадцатых']
};
const word=(n,d)=>numerals[n]+' '+denWords[d][n===1?0:1];
function named(s){
 const m=s.match(/(одна|две|три|четыре|пять|шесть|семь|восемь|девять) (вторая|вторых|третья|третьих|четвёртая|четвёртых|пятая|пятых|шестая|шестых|седьмая|седьмых|восьмая|восьмых|девятая|девятых|десятая|десятых|одиннадцатая|одиннадцатых|двенадцатая|двенадцатых|тринадцатая|тринадцатых|четырнадцатая|четырнадцатых|пятнадцатая|пятнадцатых|шестнадцатая|шестнадцатых)/);
 assert(m,'Cannot read Russian fractional number: '+s);
 const n=numerals.indexOf(m[1]),d=Number(Object.keys(denWords).find(k=>denWords[k].includes(m[2])));
 assert(n>0&&d>=2,'Invalid spoken fraction: '+s);return {n,d};
}
const grab=(s,re,ctx)=>{const m=s.match(re);assert(m,'Cannot independently parse '+ctx+': '+s);return m.slice(1).map(Number)};
const fracs=s=>[...s.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
const counts=q=>{
 const m=q.bar;assert(m&&m.d>=2,'Missing original whole-share picture '+q.ctx);
 return m;
};
function model(q){
 const m=q.ray;assert(m&&m.d>=2,'Missing original number-line drawing '+q.ctx);return m;
}
function solveParts(q){
 const {level:t,slot:p,text:s,ctx}=q,F=fracs(s);
 if(t===0){
  if(p===0)return F[0][0];
  if(p===1)return F[0][1];
  if(p===2)return grab(s,/Круг разделили на (\d+) равных долей/,ctx)[0];
  if(p===3)return counts(q).filled;
  const [n,d]=F[0];return d-n;
 }
 if(t===1){
  if(p===0)return counts(q).filled+grab(s,/закрасили ещё (\d+) частей/,ctx)[0];
  if(p===1){const [d,unfilled]=grab(s,/В целой полоске (\d+) равных частей\. Не закрашено (\d+)/,ctx);return d-unfilled;}
  if(p===2)return F[0][0]+F[1][0];
  if(p===3){assert.equal(counts(q).filled,F[0][0]);return F[1][0]-F[0][0];}
  const [d,a,b]=grab(s,/Целое разделили на (\d+) частей: (\d+) части закрасили синим и (\d+) — красным/,ctx);
  return [a+b,d];
 }
 if(p===0){const [d,a,b,erase]=grab(s,/В полоске (\d+) частей\. Сначала закрасили (\d+), затем ещё (\d+), после чего стёрли (\d+)/,ctx);return a+b-erase;}
 if(p===1){const [d,a,erase,b]=grab(s,/Из (\d+) долей сначала закрасили (\d+), потом стёрли (\d+), затем закрасили (\d+)/,ctx);return a-erase+b;}
 if(p===2){const [d,a,b,free]=grab(s,/Из (\d+) долей целого сначала заняли (\d+), затем ещё (\d+), после чего освободили (\d+)/,ctx);return [a+b-free,d];}
 if(p===3)return F[0][0]-F[1][0]-F[2][0];
 const [boxes,d,a,b]=grab(s,/Было (\d+) целых шоколадки, каждую поделили на (\d+) одинаковых долек\. Из первой взяли (\d+) дольки, из второй (\d+)/,ctx);
 return boxes*d-a-b;
}
function solveRead(q){
 const {level:t,slot:p,text:s,ctx}=q,F=fracs(s),W=[...s.matchAll(/«([^»]+)»/g)].map(m=>m[1]);
 if(t===0){
  if(p===0){const a=named(W[0]);return [a.n,a.d];}
  if(p===1)return word(...F[0]);
  if(p===2)return named(W[0]).n;
  if(p===3)return named(W[0]).d;
  return denWords[named(W[0]).d][named(W[0]).n===1?0:1];
 }
 if(t===1){
  if(p===0){const [d,n]=grab(s,/В коробке (\d+) одинаковых печений\. Взяли (\d+)/,ctx);return [n,d];}
  if(p===1)return word(F[1][0]+F[2][0],F[1][1]);
  if(p===2)return named(W[0]).n+named(W[1]).n;
  if(p===3){const a=named(W[0]),b=named(W[1]);return [a.n-b.n,a.d];}
  return named(W[0]).n+grab(s,/увеличили числитель на (\d+)/,ctx)[0];
 }
 if(p===0){const [d,a,b]=grab(s,/Из (\d+) одинаковых частей сначала взяли (\d+), затем ещё (\d+)/,ctx);return [a+b-1,d];}
 if(p===1)return named(W[0]).n+F[0][0]-named(W[1]).n;
 if(p===2)return word(named(W[0]).n+F[0][0]-F[1][0],named(W[0]).d);
 if(p===3){const [d,n]=grab(s,/От целого, разделённого на (\d+) долей, сначала взяли 1 долю, затем ещё (\d+) долей/,ctx);return [(n+1)/2,d];}
 const [b,remain,d]=grab(s,/потом добавили ещё (\d+) долей\. Вернули одну взятую долю — осталось (\d+) из (\d+)/,ctx);
 return [remain+1-b,d];
}
function solveRay(q){
 const {level:t,slot:p,text:s,ctx}=q,{d,A,B}=model(q);
 if(t===0){
  if(p===0)return [A,d];
  if(p===1||p===2)return A;
  if(p===3)return d;
  return d-A;
 }
 if(t===1){
  if(p===0)return B-A;
  if(p===1)return A+grab(s,/сделали (\d+) маленьких шагов вправо/,ctx)[0];
  if(p===2)return [A,d];
  if(p===3)return A;
  return d-B;
 }
 if(p===0){const [right,left]=grab(s,/сдвинулись вправо на (\d+) деления, затем влево на (\d+)/,ctx);return [A+right-left,d];}
 if(p===1)return [B+grab(s,/ещё (\d+) деления вправо/,ctx)[0],d];
 if(p===2)return [B-A,d];
 if(p===3)return B-grab(s,/вернулись на (\d+) делений/,ctx)[0];
 return B+grab(s,/ещё (\d+) деления вправо/,ctx)[0];
}
function check(q){
 const expected=q.id==='frac_parts'?solveParts(q):q.id==='frac_read'?solveRead(q):solveRay(q);
 const key=Array.isArray(expected)?expected.join('/'):String(expected);
 const answer=q.choices.find(x=>x.key===q.ans);
 assert(answer,'No actual keyed option '+q.ctx);
 if(Array.isArray(expected)){
  const [n,d]=expected;
  assert(Number.isInteger(n)&&Number.isInteger(d)&&d>=2,'Noninteger oracle fraction '+q.ctx);
  assert.equal(q.ans,key,'Wrong independently derived fraction '+q.ctx+': '+q.text);
 }else if(typeof expected==='number'){
  assert(Number.isSafeInteger(expected)&&expected>=0,'Invalid independent answer '+q.ctx);
  assert.equal(q.ans,key,'Wrong independent arithmetic '+q.ctx+': '+q.text);
 }else{
  assert.equal(answer.label,expected,'Wrong independently read verbal answer '+q.ctx+': '+q.text);
 }
 return {key,expected};
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const rows=await page.evaluate(ids=>{
   let seed=2026111526;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const results=[];
   const markup=new Map();
   for(let d=2;d<=20;d++)for(let n=0;n<=40;n++)markup.set(frac(n,d),n+'/'+d);
   const arr=[...markup.entries()].sort((a,b)=>b[0].length-a[0].length);
   function visible(html){
    let s=html;
    // Recover the literal numerator and denominator from rendered classroom fractions.
    for(const [htmlFraction,number] of arr)if(s.includes(htmlFraction))s=s.split(htmlFraction).join(' '+number+' ');
    const v=document.createElement('div');v.innerHTML=s;v.querySelectorAll('svg').forEach(x=>x.remove());
    return v.textContent.replace(/\s+/g,' ').trim();
   }
   function geo(html){
    const v=document.createElement('div');v.innerHTML=html;
    const svg=v.querySelector('svg.mk-v114-ray');
    let ray=null,bar=null;
    if(svg){
     const majors=[...svg.querySelectorAll('line[y1="43"]')].map(e=>+e.getAttribute('x1'));
     const minors=[...svg.querySelectorAll('line[y1="48"]')].map(e=>+e.getAttribute('x1'));
     const d=minors.filter(x=>x>majors[0]&&x<majors[1]).length+1;
     function index(name){
      const label=[...svg.querySelectorAll('text')].find(e=>e.textContent===name);
      if(!label)return null;
      const x=+label.getAttribute('x');
      return Math.round((x-majors[0])/(majors[1]-majors[0])*d);
     }
     ray={d,A:index('A'),B:index('B')};
    }
    const strip=v.querySelector('svg[aria-label^="Равные части целого"]');
    if(strip){
     const cells=[...strip.querySelectorAll('rect[fill]')];
     bar={d:cells.length,filled:cells.filter(x=>x.getAttribute('fill')==='#5d9cdc').length};
    }
    return {ray,bar};
   }
   for(const id of ids)for(let level=0;level<3;level++)for(let slot=0;slot<5;slot++)
    for(let trial=0;trial<40;trial++){
     blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:level,done:slot,total:10,
      usedSignatures:[],items:[],finished:false};
     const q=makeG5Question(id);
     results.push({id,level,slot,trial,ctx:id+'/'+level+'/'+slot+'/'+trial,
      text:visible(q.text),choices:q.choices.map(o=>({key:String(o.key),label:String(o.label)})),
      ans:String(q.ans),...geo(q.text)});
    }
   return results;
  },IDS);
  assert.equal(rows.length,1800);
  const per={frac_parts:0,frac_read:0,frac_ray:0};
  for(const q of rows){check(q);per[q.id]++;}
  assert.deepEqual(per,{frac_parts:600,frac_read:600,frac_ray:600});
  assert.deepEqual(errors,[]);
  console.log('G5_PARAGRAPH26_INDEPENDENT_ORACLE_PASS '+JSON.stringify(per));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_PARAGRAPH26_INDEPENDENT_ORACLE_FAIL',e.stack||e);process.exit(1);});
