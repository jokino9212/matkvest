'use strict';
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {chromium}=require('playwright');
// Solve using the quantities in the rendered prompt/table/diagram, without generator metadata.
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const average=xs=>sum(xs)/xs.length;
const pct=(part,whole)=>100*part/whole;
const change=(a,p)=>a*(1+p/100);
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const rules={
 triangle_types:[
  [a=>3*a,(a,b)=>2*a+b,()=>3,(...angles)=>angles.filter(a=>a===90).length,(...angles)=>angles.filter(a=>a<90).length],
  [a=>a/3,(p,b)=>(p-b)/2,a=>90-a,a=>180-a,(a,b)=>180-a-b],
  [(d,p)=>(p-d)/3+d,a=>a-(180-a)/2,d=>(90-d)/2,(p,a)=>p/3-(p-2*a),(a,b)=>b-(180-a-b)]
 ],
 sets_intro:[
  [(...x)=>new Set(x).size,(...x)=>new Set(x).size,(a,b)=>Math.max(0,b-a-1),a=>range(a,9).length,(...x)=>x.filter(v=>v%2===0).length],
  [(a,b,c,d)=>range(a,b).filter(x=>x>=c&&x<=d).length,(a,b,c,d)=>new Set([...range(a,b),...range(c,d)]).size,(a,b)=>a-b,(a,b)=>Math.floor(b/2),(a,b)=>a-b],
  [(a,b,c)=>a+b-c,(a,b,c)=>a+b-c,(n,a,b,c)=>n-a-b+c,(a,b,c)=>a+b-2*c,(n,a,b,c)=>n-c-a]
 ],
 arithmetic_mean:[
  [ (...values)=>average(values.slice(0,2)),(...values)=>average(values.slice(0,3)),(n,s)=>s/n,(n,m)=>n*m,(_a,table)=>average(table)],
  [(m,a,b)=>3*m-a-b,(a,b,h)=>(a+b)/(2*h),(n,m,a)=>m+a,average,(n,m)=>m],
  [(n,a,m,b)=>n*a+m*b,(h1,a,h2,b)=>(a+b)/(h1+h2),(n,m,a,b)=>m+(b-a)/n,(n,a,b)=>n*a-(n-1)*b,(m,a,b)=>(4*m-a-b)/2]
 ],
 percent_of_number:[
  [(p,a)=>a*p/100,(a,p)=>a*p/100,(a,p)=>a*p/100,(p,a)=>a*p/100,(a,p)=>a*p/100],
  [(a,p)=>change(a,-p),(a,p)=>change(a,-p),(a,b,p)=>(a+b)*p/100,(a,p)=>change(a,p),(a,p,q)=>a*(p+q)/100],
  [(a,p,q)=>change(change(a,-p),-q),(a,p,q)=>a-change(change(a,p),-q),(a,b,p,q)=>(a*p+b*q)/100,(a,p,b)=>change(a,-p)+b,(p,a,q,b)=>(a*p-b*q)/100]
 ],
 number_by_percent:[
  [(p,a)=>100*a/p,(p,a)=>100*a/p,(p,a)=>100*a/p,(a,p)=>100*a/p,(p,a)=>100*a/p],
  [(p,a)=>a/(1-p/100),(p,a)=>a/(1+p/100),(p,a)=>a/(1-p/100)-a,(p,a)=>100*a/p-a,(p,a)=>100*a/p+a],
  [(p,a)=>a/(1-p/100)**2,(p,a,b)=>(a+b)/(1-p/100),(p,a,b)=>(b-a)/(1+p/100),(p,a,q,b)=>a/(1-p/100)+b/(1-q/100),(p,q,a)=>a/(1-(p+q)/100)]
 ],
 percent_ratio:[
  [pct,()=>50,(n,a)=>pct(a,n), (n,a)=>pct(a,n),()=>100],
  [(n,a)=>pct(n-a,n),(a,b)=>pct(b-a,a),(a,b)=>pct(a-b,a),(a,b)=>pct(b-a,a),(n,a,b)=>pct(a+b,n)],
  [(p,q)=>change(change(100,p),-q),(n,a,b)=>pct(n-a+b,n),(n,a)=>pct(n-a,n),(p,q)=>100-change(change(100,-p),-q),(a,b,p,q)=>(a*p+b*q)/(a+b)]
 ],
 percent_word_problems:[
  [(a,p)=>a*p/100,a=>a/4,a=>a/2,(p,a)=>a*p/100,(a,p)=>a*p/100],
  [(a,p)=>change(a,-p),(p,a)=>a/(1-p/100),(n,a)=>pct(n-a,n),(p,a)=>100*a/p-a,(a,p,q)=>change(a,-p-q)],
  [(p,q,a)=>change(change(a,-p),-q),(p,q,a)=>a/((1-p/100)*(1-q/100)),(n,a,b)=>pct(n+a-b,n),(p,a,q,b)=>(a*p+b*q)/100,(a,p,q)=>a-change(change(a,p),-q)]
 ]
};
const gcd=(...ns)=>Array.from({length:Math.min(...ns)},(_,i)=>i+1).filter(x=>ns.every(n=>n%x===0)).at(-1);
const lcm=(...ns)=>{let n=Math.max(...ns);while(!ns.every(x=>n%x===0))n++;return n;};
const divisors=n=>range(1,n).filter(x=>n%x===0);
const prime=n=>n>1&&divisors(n).length===2;
const factors=n=>{const out=[];for(let d=2;n>1;d++)while(n%d===0){out.push(d);n/=d}return out;};
const unique=xs=>[...new Set(xs)];
const composite=n=>n>1&&!prime(n);
Object.assign(rules,{
 prime_factorization:[
  [n=>factors(n)[0],n=>factors(n).at(-1),n=>factors(n).length,n=>unique(factors(n)).length,(n,a,b)=>n/a/b],
  [(n,p)=>factors(n/p).length,(p,n)=>factors(n).filter(x=>x===p).length,n=>sum(unique(factors(n))),(n,p)=>n/p/p,n=>sum(factors(n))],
  [(n,k)=>factors(n*k).length,(n,k)=>sum(factors(n*k)),(a,b)=>unique(factors(a)).filter(x=>factors(b).includes(x)).reduce((x,y)=>x*y,1),(n,q,p)=>{while(n%q===0)n/=q;return n-p;},(n,k)=>factors(n*k).length-unique(factors(n*k)).length]
 ],
 prime_composite:[
  [n=>divisors(n).length,(one,n)=>divisors(n).length-2,(n,one)=>divisors(n)[1],(one,n)=>n,(...ns)=>ns.filter(prime).length],
  [(...ns)=>ns.filter(composite).length,n=>divisors(n).length,n=>divisors(n).filter(prime).length,n=>divisors(n).filter(composite).length,(...ns)=>sum(ns.filter(prime))],
  [n=>divisors(n).filter(x=>unique(factors(x)).length===2).length,n=>sum(divisors(n).filter(x=>x<n&&composite(x))),(a,b)=>unique([...divisors(a),...divisors(b)]).filter(prime).length,(...ns)=>{const ps=ns.filter(prime);return sum(ps)-Math.min(...ps)},(a,b)=>divisors(a).filter(x=>b%x!==0&&composite(x)).length]
 ],
 gcd:[
  [(a,b)=>gcd(a,b),(a,b)=>gcd(a,b),(a,b)=>gcd(a,b),(a,b)=>gcd(a,b),(a,b)=>gcd(a,b)],
  [(a,b)=>gcd(a,b),(a,b,c)=>gcd(a,b,c),(a,b)=>(a+b)/gcd(a,b),(a,b)=>2*gcd(a,b),(a,b)=>divisors(gcd(a,b)).length],
  [(a,b)=>(a+b)/gcd(a,b),(a,b,x)=>gcd(a-x,b-x),(n,a)=>(n-a)/gcd(a,n-a),(a,b,c,d)=>gcd(a,b)-gcd(c,d),(a,b)=>divisors(gcd(a,b)).filter(x=>x>1).length]
 ],
 coprime:[
  [(a,b)=>gcd(a,b),(a,b)=>gcd(a,b),(a,b)=>divisors(gcd(a,b)).length,(a,b)=>gcd(a,b),(a,b)=>divisors(gcd(a,b)).length],
  [(a,b,c,p)=>[a,b,c].filter(x=>gcd(x,p)===1).length,(a,b,c,p)=>[a,b,c].filter(x=>gcd(x,p)===1).length,(a,b,d)=>gcd(a/d,b/d),(a,b,c,p)=>sum([a,b,c].filter(x=>gcd(x,p)===1)),(a,b,c,d,one,n)=>[a,b,c,d].filter(x=>gcd(x,n)>1).length],
  [(a,b,c,d,e,p,q)=>[a,b,c,d,e].filter(x=>gcd(x,p)===1&&gcd(x,q)===1).length,(a,b)=>divisors(gcd(a,b)).find(x=>gcd(a/x,b/x)===1),(a,b,c,d,n)=>sum([a,b,c,d].filter(x=>gcd(x,n)===1)),(a,b,c)=>[[a,b],[a,c],[b,c]].filter(([x,y])=>gcd(x,y)===1).length,(a,b,c,d,p)=>Math.max(...[a,b,c,d].filter(x=>gcd(x,p)===1))]
 ],
 lcm:[
  [(a,b)=>lcm(a,b),(a,b)=>lcm(a,b),(a,b)=>lcm(a,b),(a,b)=>lcm(a,b),(a,b)=>lcm(a,b)],
  [(a,b,c)=>lcm(a,b,c),(a,b)=>2*lcm(a,b),(a,b,c)=>lcm(b,c)/a,(a,b)=>lcm(a,b)-gcd(a,b),(a,b,n)=>range(1,n).filter(x=>x%a===0&&x%b===0).length],
  [(a,b,n)=>{const d=lcm(a,b);return (Math.floor(n/d)+1)*d;},(a,b)=>lcm(a,b)+2*lcm(a,b),(a,b,c,d)=>range(c+1,d-1).filter(x=>x%a===0&&x%b===0).length,(l,g,a)=>range(1,l).find(b=>lcm(a,b)===l&&gcd(a,b)===g),(a,b,c,d)=>lcm(a,b)-lcm(c,d)]
 ]
});
const fractionTopics=['fraction_common_denominator','fraction_compare','fraction_add_subtract','mixed_add_subtract'];
function visibleFractions(text){
 return [...text.matchAll(/(?:(\d+)\s*)?\[(\d+)\/(\d+)\]/g)]
  .map(([,whole,num,den])=>({num:Number(num),den:Number(den),value:Number(whole||0)+Number(num)/Number(den)}));
}
function solveFractions({topic,text,level,family}){
 const fs=visibleFractions(text);
 const [a,b,c]=fs.map(f=>f.den);
 if(topic==="fraction_common_denominator"){
  const integers=[...text.replace(/\[\d+\/\d+\]/g,'').matchAll(/\d+/g)].map(x=>Number(x[0]));
  const target=integers[0];
  if(level===0)return [()=>lcm(a,b),()=>target/a,()=>target*fs[0].num/a,()=>lcm(a,b),()=>target-a][family]();
  if(level===1)return [()=>lcm(a,b)/a,()=>lcm(a,b)*fs[1].num/b,()=>lcm(a,b)/a+lcm(a,b)/b,()=>target-lcm(a,b),()=>fs[0].num*lcm(a,b)/a][family]();
  const den=lcm(a,b,c);
  return [()=>den,()=>fs.reduce((s,f)=>s+den/f.den,0),()=>den/a-den/b,()=>target-den,()=>fs.reduce((s,f)=>s+den*f.num/f.den,0)][family]();
 }
 if(topic==="fraction_compare"){
  const value=expr=>{
   const [x,y]=visibleFractions(expr).map(f=>f.value);
   return y===undefined?x:expr.includes(' − ')?x-y:x+y;
  };
  const [left,right]=text.split('□').map(value);
  return Math.abs(left-right)<1e-12?'=':left>right?'>':'<';
 }
 const terms=[...text.matchAll(/(?:(\d+)\s*)?\[(\d+)\/(\d+)\]|(\d+)/g)]
  .map(([,whole,num,den,integer])=>integer===undefined?Number(whole||0)+Number(num)/Number(den):Number(integer));
 const [x,y,z]=terms;
 if(text.includes('неизвестное слагаемое'))return y-x;
 if(text.includes('уменьшаемое'))return x+y;
 if(text.includes('вычитаемое'))return x-y;
 if(z===undefined)return text.includes(' − ')?x-y:x+y;
 if(text.includes('− ('))return x-(y-z);
 return text.includes(' − ')?x+y-z:x+y+z;
}
const productTopics=['fraction_multiply','mixed_multiplication','fraction_of_number','fraction_distributive'];
function solveProduct({topic,text,level,family}){
 const tokens=[...text.matchAll(/(?:(\d+)\s*)?\[(\d+)\/(\d+)\]|(\d+)/g)]
  .map(([,whole,num,den,integer])=>integer===undefined?Number(whole||0)+Number(num)/Number(den):Number(integer));
 const [a,b,c,d,e]=tokens;
 if(topic==="fraction_of_number"){
  const fs=visibleFractions(text).map(f=>f.value);
  const nums=[...text.replace(/\[\d+\/\d+\]/g,'').matchAll(/\d+/g)].map(x=>Number(x[0]));
  const [x,y]=nums,[u,v]=fs;
  return [
   [()=>x*u,()=>x*u,()=>x*u,()=>x*u,()=>x*u],
   [()=>x*(1-u),()=>(x+y)*u,()=>x*(u+v),()=>x*(u-v),()=>x*u+y*v],
   [()=>x*u*v,()=>x*(1-u)*(1-v),()=>(x*(1-u)+y)*v,()=>x*(1-u)+y*(1-v),()=>u*v]
  ][level][family]();
 }
 if(topic==="fraction_distributive")return solveExpression(text);
 if(level===1&&family===1)return b/a;
 if(level===2)return [a*b*c,a*b,2*a*b,a*b+c-d,a*b+c][family];
 return a*b;
}
const divisionTopics=['fraction_divide','mixed_division','fraction_restore_whole','fraction_expressions'];
function solveExpression(text){
 const plain=text.replace(/^Вычисли /,'').replace(/\.$/,'');
 const expression=plain.replace(/(?:(\d+)\s*)?\[(\d+)\/(\d+)\]/g,(_,w,n,d)=>String(Number(w||0)+Number(n)/Number(d)))
  .replaceAll('·','*').replaceAll('−','-').replaceAll(':','/');
 assert(/^[\d. +*/()\-]+$/.test(expression),plain);
 return Function('return ('+expression+')')();
}
function solveDivision({topic,text,level,family}){
 if(topic==="fraction_expressions")return solveExpression(text);
 const tokens=[...text.matchAll(/(?:(\d+)\s*)?\[(\d+)\/(\d+)\]|(\d+)/g)]
  .map(([,whole,num,den,integer])=>integer===undefined?Number(whole||0)+Number(num)/Number(den):Number(integer));
 const [a,b,c]=tokens;
 if(topic==="fraction_restore_whole")return [
  [()=>b/a,()=>b/a,()=>b/a,()=>b/a,()=>b/a],
  [()=>b/(1-a),()=>b/a-b,()=>b/a-b+c,()=>tokens[3]/c-b/a,()=>b/a-b],
  [()=>c/(1-a-b),()=>(b+c)/(1-a),()=>2*b/a,()=>(b+c)/a,()=>c/(1-a)/(1-b)]
 ][level][family]();
 if(level===2)return [a/b/c,a/b,2*a/b,a/b,(a+b)/c][family];
 if(level===1&&family===1)return a*b;
 return a/b;
}
const ratioTopics=['ratio','ratio_value','divide_in_ratio','proportion','proportion_unknown','direct_proportion','inverse_proportion'];
function solveRatios({topic,text,level,family}){
 const ns=[...text.matchAll(/\d+/g)].map(m=>+m[0]),[a,b,c,d]=ns;
 const simple=(x,y)=>{const g=gcd(x,y);return [x/g,y/g];};
 const first=(x,y)=>simple(x,y)[0],second=(x,y)=>simple(x,y)[1],total=(x,y)=>sum(simple(x,y));
 if(topic==="ratio")return [
  [()=>first(a,b),()=>second(a,b),()=>total(a,b),()=>gcd(a,b),()=>first(b,a)],
  [()=>first(2*a,b),()=>second(a,b*100),()=>first(a*100,b),()=>total(a*1000,b),()=>total(a,b*60)],
  [()=>gcd(a+c,b+d),()=>first(100*a+b,100*c),()=>second(b,a-b),()=>total(a*1000+c,b),()=>first(a-c,b+c)]
 ][level][family]();
 if(topic==="ratio_value")return [
  [()=>a/b,()=>a/b,()=>a/b,()=>a/b,()=>a/b],
  [()=>a*100/b,()=>a/(b*1000),()=>a/(60*b),()=>a/b-b/a,()=>a/b+c/d],
  [()=>2*a/c,()=>(a*100+b)/(100*c),()=>(a-b)/b,()=>a/b-c/d,()=>a/b*c/d]
 ][level][family]();
 if(topic==="divide_in_ratio")return [
  [()=>a*b/(b+c),()=>a*c/(b+c),()=>a/(b+c),()=>a+b,()=>(a+b)*c],
  [()=>a*(c-b)/(b+c),()=>c*b/a,()=>c*(a+b)/b,()=>a*b/(b+c)-d,()=>a*c/(b-a)],
  [()=>a*d/(b+c+d),()=>a*(b+d)/(b+c+d),()=>c*(a+b)/(b-a),()=>d*(a+b+c)/b,()=>a*Math.abs(b+d-c)/(b+c+d)]
 ][level][family]();
 if(topic==="proportion"||topic==="proportion_unknown"){
  const f=(family+(topic==="proportion_unknown"?2:0))%5;
  return [
   [()=>a*d,()=>b*c,()=>a*b/c,()=>a*c/b,()=>b*c/a],
   [()=>a*c/b,()=>a+b*c/a,()=>a*c/b+b,()=>a*b,()=>c/b],
   [()=>b*c/d-a,()=>a*d/c-b,()=>a*d/b+c,()=>b*c/a+d,()=>a+b*c/d]
  ][level][f]();
 }
 if(topic==="inverse_proportion")return [
  [()=>a*b/c,()=>a*b/c,()=>a*b/c,()=>a*b/c,()=>a*b/c],
  [()=>a*b/c,()=>c-a*c/b,()=>c/a,()=>a*b/c,()=>a*b/c-b],
  [()=>a*b/(a+c),()=>b-a*b/(a+c),()=>a*b/(a-c),()=>b+a*b/c,()=>a-a*b/(b+c)]
 ][level][family]();
 return [
  [()=>b*c/a,()=>b*c/a,()=>b*c/a,()=>b/a,()=>b/a],
  [()=>c/(b/a),()=>b*(c-a)/a,()=>b*(c-a)/a,()=>b*c/a,()=>b*(c+d)/a],
  [()=>b*(c+d)/a,()=>d-b*(a+c)/a,()=>c-b*d/a,()=>(c+d)*a/b,()=>b*c/a-b-ns[4]]
 ][level][family]();
}

const geometryTopics=['scale','symmetry','circle','circumference','circle_area','sphere'];
function solveGeometry({topic,text,level,family}){
 const numbers=[...text.matchAll(/-?\d+(?:,\d+)?/g)].map(m=>Number(m[0].replace(',','.')));
 const [a,b,c,d,e,f]=numbers;
 const pi=3.14;
 if(topic==="symmetry"){
  const first=text.includes('абсцисс'), center=text.includes('центра O'), vertical=text.split('Полученную точку')[0].includes('относительно прямой x');
  let xx=a,yy=b;
  if(center||vertical)xx=2*c-a;
  if(center||!vertical)yy=2*(center?d:c)-b;
  if(level===2){
   const second=text.split('Полученную точку')[1];
   if(second.includes('прямой x'))xx=-xx;else yy=-yy;
  }
  const answer=first?xx:yy;
  return text.includes('На сколько')?Math.abs(answer-(first?a:b)):answer;
 }
 if(topic==="scale")return [
  [()=>b*c,()=>c/b,()=>a,()=>b/100,()=>b/a],
  [()=>b*(c+d)/100,()=>100*c/b,()=>100*b/a,()=>d*(b-a)/100,()=>b*(c+d)/100],
  [()=>b*e/d,()=>b*c/100+d,()=>2*(a+b)*d/100,()=>b/2,()=>(a*c+d*f)/100]
 ][level][family]();
 if(topic==="circle")return [
  [()=>2*a,()=>a/2,()=>b-a,()=>2*a,()=>b-a],
  [()=>2*(a+b),()=>(b-a)/2,()=>a/2+b,()=>2*(a+b),()=>b/2],
  [()=>b,()=>(b-a)/2,()=>2*(a+b),()=>b-2*a,()=>2]
 ][level][family]();
 if(topic==="sphere")return [
  [()=>2*a,()=>a/2,()=>a-b,()=>a/2,()=>b-a],
  [()=>a+b/2,()=>(b-a)/2,()=>a/2,()=>2*(a+b),()=>a-2*b],
  [()=>a+b,()=>(a+b)/2,()=>2*(a+b),()=>(b-a)/2,()=>2*(a+b)]
 ][level][family]();
 if(topic==="circumference")return [
  [()=>2*pi*a,()=>pi*a,()=>pi*a,()=>pi*a/2,()=>2*pi*a*b],
  [()=>2*pi*a*b,()=>2*pi*(a+b),()=>a/(2*pi),()=>a/pi,()=>pi*(b-a)],
  [()=>2*pi*b*(a+c),()=>a/(2*pi)-b,()=>2*pi*b,()=>b/(2*pi*a),()=>pi*(b-a)*c]
 ][level][family]();
 return [
  [()=>pi*a*a,()=>pi*(a/2)**2,()=>pi*a*a/2,()=>pi*(a/2)**2/2,()=>pi*a*a/4],
  [()=>pi*(a*a+b*b),()=>pi*(b*b-a*a),()=>Math.sqrt(a/pi),()=>2*Math.sqrt(a/pi),()=>pi*a*a/2],
  [()=>pi*(a*a-b*b),()=>Math.sqrt(a/pi-b*b),()=>pi*(b*b-a*a),()=>pi*(a+b)**2,()=>pi*(a*a+b*b/2)]
 ][level][family]();
}

const signedTopics=['positive_negative','number_line','opposite_numbers','absolute_value'];
function solveSigned({topic,text,level,family}){
 const nums=[...text.matchAll(/[−-]?\d+/g)].map(n=>Number(n[0].replace('−','-')));
 const [a,b,c]=nums;
 const m=Math.abs;
 const plans={
  positive_negative:[
   [()=>-a,()=>a,()=>-a,()=>a,()=>-a],
   [()=>a+b,()=>nums.filter(n=>n>0).length,()=>nums.filter(n=>n<0).length,()=>-a+b,()=>b],
   [()=>sum(nums.filter(n=>n>0)),()=>sum(nums.filter(n=>n<0).map(m)),()=>-a+b,()=>-a+b,()=>Math.min(...nums)]
  ],
  number_line:[
   [()=>-a,()=>a,()=>m(a),()=>m(a),()=>-a],
   [()=>m(a-b),()=>a+b,()=>a-b,()=>(a+b)/2,()=>b/a],
   [()=>a+b-c,()=>a-b+c,()=>(a+b)/2,()=>b-a,()=>a*(c-b)]
  ],
  opposite_numbers:[
   [()=>-a,()=>-a,()=>-a,()=>-a,()=>-a],
   [()=>-a-b,()=>b-a,()=>m(a-b)-m(c),()=>a/2,()=>-a+b],
   [()=>-a/2,()=>-a-b,()=>b-a,()=>(a+b)/2,()=>-a-b]
  ],
  absolute_value:[
   [()=>m(a),()=>m(a),()=>m(a),()=>m(a),()=>-a],
   [()=>m(a)+m(b),()=>m(a)-m(b),()=>a+m(b),()=>m(a)*m(b),()=>2],
   [()=>m(a+b)+m(c),()=>m(m(a)-b),()=>-m(a)-m(b),()=>a/2,()=>m(a)+m(b)-m(c-nums[3])]
  ]
 };
 return plans[topic][level][family]();
}
const compareTopics=['rational_compare','quantity_change','line_addition'];
function solveCompare({topic,text,level,family}){
 const nums=[...text.matchAll(/−?\d+(?:,\d+)?/g)].map(m=>Number(m[0].replace('−','-').replace(',','.')));
 const [a,b,c]=nums;
 if(topic==="rational_compare"){
  const values=text.replace(/^Сравни: /,'').replace(/\.$/,'').split('□').map(part=>{
   const expression=part.replaceAll('−','-').replaceAll(':','/').replaceAll(',','.');
   assert(/^[\d. +\/()\-]+$/.test(expression),expression);
   return Function('return ('+expression+')')();
  });
  return values[0]===values[1]?'=':values[0]>values[1]?'>':'<';
 }
 if(topic==="line_addition"){
  const moves=[...text.matchAll(/(\d+) (влево|вправо)/g)];
  return a+sum(moves.map(([,count,direction])=>Number(count)*(direction==='влево'?-1:1)));
 }
 return [
  [()=>b-a,()=>-a,()=>b-a,()=>a,()=>b-a],
  [()=>a+b,()=>a+b,()=>b-a,()=>b-a,()=>b-a],
  [()=>a+b-c,()=>a-b-c,()=>b-c-a,()=>c-a+b,()=>c+b-a]
 ][level][family]();
}
const signedOperations=['negative_sum','negative_add','negative_subtract','negative_multiply','negative_divide'];
function solveOperations({topic,text,level,family}){
 if(text.startsWith('Вычисли '))return solveExpression(text);
 const values=[...text.matchAll(/−?\d+/g)].map(m=>Number(m[0].replace('−','-')));
 const [a,b,c,d]=values;
 const plans={
  negative_sum:[
   [null,()=>a-b,()=>-a-b,null,()=>a-b],
   [null,()=>b-a,()=>2*a,null,()=>a+b+c],
   [null,()=>c-a-b,()=>a-3*b-c,()=>a+b+c+d,()=>c-a-b]
  ],
  negative_add:[
   [null,null,null,()=>a+b,()=>a-b],
   [null,()=>b-a,()=>b-a,null,null],
   [null,()=>c-a-b,()=>a+b-c+d,null,()=>c-a-b]
  ],
  negative_subtract:[
   [],
   [null,()=>a+b,()=>a-b,()=>a-b,null],
   [null,()=>c+a+b,()=>a-b-c,null,null]
  ],
  negative_multiply:[
   [],[null,()=>b/a,null,null,null],
   [null,null,()=>(c-b)/a,null,null]
  ],
  negative_divide:[
   [],[null,()=>a*b,()=>a/b,null,null],
   [null,null,()=>a/(b+c),()=>a*(c-b),null]
  ]
 };
 return plans[topic][level][family]();
}
const algebraTopics=['rational_numbers','rational_expressions','brackets','coefficient','like_terms','expression_simplify','expression_value','linear_equations','equation_word_problems'];
function evalAlgebra(text,x=0,y=0){
 const expression=text.replaceAll('−','-').replaceAll('·','*').replaceAll(':','/').replace(/(\d)\s*([xy(])/g,'$1*$2');
 assert(/^[\dxy. +*/()\-]+$/.test(expression),text);
 return Function('x','y','return ('+expression+')')(x,y);
}
function solveAlgebra({topic,text,level,family}){
 const values=[...text.matchAll(/−?\d+/g)].map(m=>Number(m[0].replace('−','-')));
 const [a,b,c,d]=values;
 if(topic==="rational_expressions")return evalAlgebra(text.slice(8,-1));
 if(topic==="rational_numbers"){
  if(!text.includes('□'))return evalAlgebra(text.replace(/^Найди значение |^Вычисли /,'').slice(0,-1));
  if(level===1)return [()=>a*b,()=>a/b,null,()=>a*b/c,null][family]();
  return [null,null,()=>(c-b)*a,()=>a/(c-b),null][family]();
 }
 if(topic==="linear_equations"){
  const [left,right]=text.replace('Реши уравнение ','').slice(0,-1).split(' = ');
  const zero=evalAlgebra(left)-evalAlgebra(right);
  const one=evalAlgebra(left,1)-evalAlgebra(right,1);
  return -zero/(one-zero);
 }
 if(topic==="expression_value"){
  const [expression,vars]=text.slice(8,-1).split(' при ');
  const numbers=[...vars.matchAll(/−?\d+/g)].map(m=>Number(m[0].replace('−','-')));
  return evalAlgebra(expression,...numbers);
 }
 if(topic==="equation_word_problems"){
  if(level===0)return [b-a,b+a,b/a,b*a,a-b][family];
  if(level===1)return [(b-a)/2,b/(a+1),(c-b)/a,(b+a)/2,c/b-a][family];
  return [(c-a+b)/2,c/a+b,(c-b)/(a+1),a+b,(c-a+b)/2][family];
 }
 if(text.startsWith('При каком коэффициенте'))return b-a;
 if(text.startsWith('У выражения'))return a*b*c;
 const expr=text.replace(/^Раскрой скобки в |^Найди коэффициент при [xy] (?:после раскрытия скобок )?в |^Сложи подобные: |^Вычти подобные: |^Приведи подобные: |^Приведи подобные в /,'').split('.')[0];
 const constant=evalAlgebra(expr);
 if(text.includes('свободный член'))return constant;
 const variable=text.includes('коэффициент при y')?'y':'x';
 return evalAlgebra(expr,variable==='x'?1:0,variable==='y'?1:0)-constant;
}

const coordinateTopics=['coordinate_plane','point_coordinates','plot_point','parallel_perpendicular','perpendicular_lines','parallel_lines','line_graphs'];
function solveCoordinates({topic,text,level,family,data}){
 text=text.replaceAll('−','-');
 const nums=[...text.matchAll(/-?\d+(?:,\d+)?/g)].map(m=>Number(m[0].replace(",", "."))),[a,b,c,d]=nums;
 if(topic==="line_graphs"){
  const [u,v,w,x,y]=data;
  return [[u,v,w,x,y],[w-u,w-x,y-x,u+x,w-v],[(w-u)+(y-x),w+y-u-x,y-u,Math.abs(y-w),(u+y)/2]][level][family];
 }
 if(topic==="parallel_perpendicular"){
  const [ax,ay,bx,by]=data;
  const isPerpendicular=Math.abs(ax*bx+ay*by)<.3;
  if(level===1&&family%2===1)return isPerpendicular?'Нет, они могут совпадать':'Да, обязательно';
  return Math.abs(ax*by-ay*bx)<.3?'Параллельные':isPerpendicular?'Перпендикулярные':'Пересекающиеся под непрямым углом';
 }
 if(topic==="perpendicular_lines")return [
  [90,90/a,90-a,a-90,90-a],
  [90-a,90-a,90*a,180-a,180-a],
  [(a-b)/2,(a+b)/2,90/(1+a),(90-a)/2,180/a]
 ][level][family];
 if(topic==="parallel_lines")return [
  [a,2*a,a-1,a+b,b-a],
  [a/2,3*a,(a-1)*b,a-b,a/b+1],
  [a/8,(a-3)*b,(a-b)/c,b/a-1,b/(a-1)*(a-1+c)]
 ][level][family];
 if(topic==='plot_point'){
  const fractionParts=visibleFractions(text);
  const coords=fractionParts.length?[...text.replace(/(-?)(?:(\d+)\s*)?\[(\d+)\/(\d+)\]/g,(_,minus,whole,num,den)=>String((minus?-1:1)*(Number(whole||0)+Number(num)/Number(den)))).matchAll(/-?\d+(?:\.\d+)?/g)].map(m=>Number(m[0])):nums;
  return data.find(point=>point.x===coords[0]&&point.y===coords[1])?.label;
 }
 if(topic==='point_coordinates'){
  const point=data[0];
  const move=word=>Number(text.match(new RegExp('(\\d+) '+word))?.[1]||0);
  return [point.x+move('вправо')-move('влево'),point.y+move('вверх')-move('вниз')];
 }
 let [x,y]=data?.length?[data[0].x,data[0].y]:[a,b];
 if(level===2)[x,y]=[[x,-y],[-x,y],[-x,-y],[y,x],[x,2*y]][family];
 if(!x)return 'На Oy';
 if(!y)return 'На Ox';
 return (x>0?(y>0?'I':'IV'):(y>0?'II':'III'))+' четверть';
}

const reviewTopics=['divisibility_2_5_10','divisibility_3_9','fraction_properties','fraction_reduction','mixed_multiply_divide','prism','tables_charts','volume'];
function solveReview({topic,text,level,family,data}){
 if(topic==='mixed_multiply_divide')return solveExpression(text);
 if(topic==='tables_charts'){
  const [m,t,w,h]=data;
  return [[m,t,w,h,Math.max(...data)],[t-m,w-t,h-w,m+t,m+h],[h-m,m+t+w+h,w-m,h-t,(t+h)/2]][level][family];
 }
 const numbers=[...text.replace(/\[\d+\/\d+\]/g,'').matchAll(/\d+/g)].map(m=>Number(m[0]));
 const [a,b,c,d,e,f]=numbers;
 if(topic.startsWith('divisibility_')){
  if(family===0)return a%b===0?'ДА':'НЕТ';
  if(family===1){
   const valid=[a,b,c].filter(n=>n%d===0);
   assert.equal(valid.length,1,text);
   return String(valid[0]);
  }
  if(family===2||family===3){
   const digits=range(0,9).filter(x=>(10*a+x)%b===0);
   assert(digits.length>0,text);
   return family===2?digits[0]:digits.at(-1);
  }
  return a%b===0&&a%c===0?'ДА':'НЕТ';
 }
 if(topic.startsWith('fraction_')){
  const index=(family+(topic==='fraction_reduction'?2:0))%5;
  const fraction=visibleFractions(text)[0];
  if(topic==="fraction_reduction"&&family===0)return fraction?fraction.value:b/a;
  if(!fraction){const g=gcd(a,b);return(a+b)/g;}
  const {num,den}=fraction,g=gcd(num,den),n=num/g,k=den/g;
  return [[num*a,den*a,n,k,g],[a*num/den,a*den/num,n+k,den*a,num*den/(a*a)],[(num+den)*a/den,den-k,num-n,(n+k)*a,NaN]][level][index];
 }
 const v=a*b*c, surface=2*(a*b+a*c+b*c);
 if(topic==='volume')return [[v,a*b,a**3,v,b*c*d/a],[a/(b*c),a/b,2*v,2*v,d*e*f-v],[a*b*d,v/2,a*b*(c-f),2*(a+d)*b*c,v/d]][level][family];
 return [[d*e,2*(a+b),12*a,a+b+c,4*a],[4*(a+b+c),surface,6*a*a,2*d*e,surface-d*e],[4*d,2*(a+b)*d,a/4-b-c,6*((a+b)**2-a*a),2*surface-2*d*e]][level][family];
}

function solve(question){
 if(reviewTopics.includes(question.topic))return solveReview(question);
 if(coordinateTopics.includes(question.topic))return solveCoordinates(question);
 if(algebraTopics.includes(question.topic))return solveAlgebra(question);
 if(signedOperations.includes(question.topic))return solveOperations(question);
 if(compareTopics.includes(question.topic))return solveCompare(question);
 if(signedTopics.includes(question.topic))return solveSigned(question);
 if(geometryTopics.includes(question.topic))return solveGeometry(question);
 if(ratioTopics.includes(question.topic))return solveRatios(question);
 if(divisionTopics.includes(question.topic))return solveDivision(question);
 if(productTopics.includes(question.topic))return solveProduct(question);
 if(fractionTopics.includes(question.topic))return solveFractions(question);
 const n=[...question.text.matchAll(/\d+(?:,\d+)?/g)].map(m=>Number(m[0].replace(',','.')));
 const [a,b,c,d]=question.data||[];
 if(question.topic==="pie_charts"){
  const [x,y]=n;
  return [
   [()=>a,()=>c,()=>a+b,()=>a-c,()=>question.data.filter(value=>value===x).length],
   [()=>x*a/100,()=>x*(b+c)/100,()=>x*(a-c)/100,()=>360*a/100,()=>100*x/b],
   [()=>x*d/a,()=>x-x*b/200,()=>x*(b+d)/100,()=>pct(x*a/100+y,x+y),()=>x*(c+d)/(a+b)]
  ][question.level][question.family]();
 }
 if(question.topic==="arithmetic_mean"){
  if(question.level===0&&question.family===4)return average(question.data);
  if(question.level===1&&question.family===1){
   const [a,b,h]=n;
   return (a+b)/(2*h);
  }
  if(question.level===1&&question.family===3)return average(n);
 }
 return rules[question.topic][question.level][question.family](...n);
}

(async()=>{
 const early=['arithmetic_mean','percent_of_number','number_by_percent','percent_ratio','percent_word_problems','pie_charts','triangle_types','sets_intro'];
 const latest=['prime_factorization','prime_composite','gcd','coprime','lcm'];
 const batches=[early,latest,fractionTopics,productTopics,divisionTopics,ratioTopics,geometryTopics,signedTopics,compareTopics,signedOperations,algebraTopics,coordinateTopics,reviewTopics];
 const only=process.argv.find(arg=>arg.startsWith('--batch='));
 if(!only){
  const {execFileSync}=require('node:child_process');
  for(const [i] of batches.entries()){
   execFileSync(process.execPath,[...process.execArgv,__filename,'--batch='+(i+1)],{stdio:'inherit'});
  }
  assert.equal(new Set(batches.flat()).size,74);
  execFileSync(process.execPath,[...process.execArgv,path.join(__dirname,'g6_divisors_multiples_browser.cjs')],{stdio:'inherit'});
  console.log('G6_BOOK_FULL_PASS',JSON.stringify({trainers:75,questions:74*12*22+704}));
  return;
 }
 const topics=batches[Number(only.split('=')[1])-1];
 assert(topics?.length,'Unknown batch');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  assert.deepEqual(await page.evaluate(()=>g6AllTopics().map(t=>t.id.slice(3)).sort()),[...batches.flat(),'divisors_multiples'].sort());
  const questions=[];
  for(const topic of topics){
   for(let level=0;level<3;level++)questions.push(...await page.evaluate(({topic,level})=>{
   let seed=61103+level;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};
   const rows=[];
     for(let training=0;training<12;training++){
      state.attemptHistory=[];
      startG6QuizStage('g6:'+topic,level);
      for(let slot=0;slot<blockSession.total;slot++){
       const node=document.querySelector('#qstage .quizq')?.cloneNode(true);
       if(!node)throw Error('No visible question');
       const pie=document.querySelector('#qstage .g7-pie-wrap');
       const table=document.querySelector('#qstage table');
       const bars=[...document.querySelectorAll('#qstage .bar-value')];
       let data;
       if(topic==='line_graphs'){
        const graph=document.querySelector('#qstage .g7-process-svg');
        const scale=[...graph.querySelectorAll('text[text-anchor="end"]')];
        const highest=Number(scale.at(-1).textContent);
        data=[...graph.querySelectorAll('.g7-process-point')].map(p=>Math.round((320-Number(p.getAttribute('cy')))*highest/290));
        if(data.length!==5)throw Error('The graph has to contain five data points');
       }
       if(topic==='parallel_perpendicular'){
        const lines=[...document.querySelectorAll('#qstage .geometry-svg line.geo-line')];
        if(lines.length!==2)throw Error('Two lines must be drawn');
        data=lines.flatMap(line=>[Number(line.getAttribute('x2'))-Number(line.getAttribute('x1')),Number(line.getAttribute('y2'))-Number(line.getAttribute('y1'))]);
       }
       if(pie){
        if(pie.querySelectorAll('svg path').length!==4)throw Error('Incomplete sectors');
        data=[...pie.querySelectorAll('.g7-pie-legend span')].map(el=>Number(el.textContent.split('—').at(-1).trim()));
        if(data.reduce((sum,x)=>sum+x,0)!==100)throw Error('Pie sectors do not cover 100%');
       }
       const plane=document.querySelector('#qstage .coordinate-plane-svg');
       if(plane){
        const unit=484/16;
        data=[...plane.querySelectorAll('.coord-point')].map(pt=>({
         label:pt.parentElement.querySelector('.coord-point-label').textContent,
         x:Math.round(2*(Number(pt.getAttribute('cx'))-300)/unit)/2,
         y:Math.round(2*(300-Number(pt.getAttribute('cy')))/unit)/2
        }));
       }
       if(bars.length)data=bars.map(bar=>Number(bar.textContent));
       if(table){
        data=[...table.querySelectorAll('tr')].filter(el=>el.querySelector('td')).map(el=>Number(el.querySelector('td:last-child').textContent.trim()));
       }
       for(const fraction of node.querySelectorAll('.frac')){
        const num=fraction.querySelector('.num')?.textContent;
        const den=fraction.querySelector('.den')?.textContent;
        if(num&&den)fraction.replaceWith(document.createTextNode('['+num+'/'+den+']'));
       }
       const text=node.textContent.replace(/\s+/g,' ').trim();
       const family=slot%5;
       if(q.audit.variant!=='book'+family||q.audit.level!==level)throw Error('Unexpected family or level');
       if(!q.ex)throw Error('Missing explanation');
       const answer=q.answerMode==='fraction'?q.answerRat.n/q.answerRat.d:q.answerMode==='coordinate'?[q.answerPoint.x.n/q.answerPoint.x.d,q.answerPoint.y.n/q.answerPoint.y.d]:q.choices.length?q.ans:Number(q.ans.replace(',', '.').replace('−','-'));
       rows.push({topic,level,family,text,data,answer});
       if(training===0&&slot===0){
        if(q.choices.length)pick(q.choices.findIndex(c=>String(c.key)===String(q.ans)));
        else if(q.answerMode==='coordinate'){
         document.getElementById('quizInputX').value=String(answer[0]);
         document.getElementById('quizInputY').value=String(answer[1]);
         checkQuizInput();
        }else if(q.answerMode!=='fraction'){
         document.getElementById('quizInput').value=q.ans;
         checkQuizInput();
        }else{
         const {n,d}=q.answerRat;
         const field=(id,value)=>{document.getElementById(id).value=String(value);};
         if(d===1)field('quizFracWhole',n);
         else if(q.preferMixed&&Math.abs(n)>=d){
          field('quizFracWhole',Math.trunc(n/d));
          field('quizFracNum',Math.abs(n)%d);
          field('quizFracDen',d);
         }else{
          field('quizFracNum',n);
          field('quizFracDen',d);
         }
         checkQuizInput();
        }
        if(!answered||blockSession.correct!==1)throw Error('Correct answer rejected: '+text);
       }else if(!skipNormalQuiz())throw Error('Could not skip');
       if(blockSession.done!==slot+1)throw Error('Progress mismatch');
       if(!blockSession.finished)nextQ();
      }
     }
   return rows;
  },{topic,level}));
  }
  assert.equal(questions.length,topics.length*12*22);
  const seen=new Map();
  for(const q of questions){
   const expected=solve(q);
   if(Array.isArray(expected))assert.deepEqual(q.answer,expected,JSON.stringify(q));
   else assert(typeof expected==='string'?q.answer===expected:Number.isFinite(expected)&&Math.abs(q.answer-expected)<1e-8,JSON.stringify({q,expected}));
   const key=[q.topic,q.level,q.family].join('/');
   if(!seen.has(key))seen.set(key,new Set());
   seen.get(key).add(JSON.stringify([q.text,q.data]));
  }
  assert.equal(seen.size,topics.length*15);
  for(const [key,variants] of seen){
   const fixed=['perpendicular_lines/0/0','perpendicular_lines/0/3'];
   assert(variants.size>=(fixed.includes(key)?1:4),key);
  }
  assert.deepEqual(errors,[]);
  console.log('G6_BOOK_01_44_PASS',JSON.stringify({questions:questions.length,families:seen.size,topics:topics.length}));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
