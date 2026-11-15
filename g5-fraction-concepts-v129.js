/* MathQuest Grade 5 v129: seven properly scaffolded fraction concepts.
 * Every learner-facing question goes through makeG5Question, with 5 families
 * on each of the 3 practice tiers; fraction arithmetic uses reduced rationals.
 */
(function(){
'use strict';
if(typeof makeG5Question!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof g5FractionChoices!=='function'||typeof frac!=='function')throw Error('v129 fraction prerequisites unavailable');
const IDS=['frac_equal','frac_reduce','frac_common_lcm','frac_compare_diff','frac_add_diff','frac_sub_diff','frac_mul_common'];
const previous=makeG5Question,covered=new Set(IDS);
const T=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0));
const F=()=>Math.max(0,Number(blockSession?.done)||0)%5,r=(a,b)=>ri(a,b);
const Q=(n,d)=>['rat',n,d],ADD=(...x)=>['add',...x],SUB=(x,y)=>['sub',x,y],MUL=(x,y)=>['mul',x,y],DIV=(x,y)=>['div',x,y],MAX=(...x)=>['max',...x],MIN=(...x)=>['min',...x],ABS=x=>['abs',x];
const NUM=x=>['num',x],DEN=x=>['den',x],LCM=(a,b)=>['lcm',a,b],GCD=(a,b)=>['gcd',a,b];
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const temp=a%b;a=b;b=temp;}return a};
const lcm=(a,b)=>a/gcd(a,b)*b;
function reduce(a,b){
 if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||b<=0)throw Error('Invalid exact fraction');
 const d=gcd(a,b);return {n:a/d,d:b/d};
}
function solve(node){
 if(!Array.isArray(node))throw Error('v129 missing rational expression');
 const [op,...x]=node,E=solve;
 if(op==='rat')return reduce(x[0],x[1]);
 if(op==='cmp')return {n:relation(E(x[0]),E(x[1]))+1,d:1};
 if(op==='add')return x.map(E).reduce((a,b)=>reduce(a.n*b.d+b.n*a.d,a.d*b.d),{n:0,d:1});
 if(op==='sub'){const a=E(x[0]),b=E(x[1]);return reduce(a.n*b.d-b.n*a.d,a.d*b.d)}
 if(op==='mul'){const a=E(x[0]),b=E(x[1]);return reduce(a.n*b.n,a.d*b.d)}
 if(op==='div'){const a=E(x[0]),b=E(x[1]);if(!b.n)throw Error('Division by zero');return reduce(a.n*b.d,a.d*b.n)}
 if(op==='max'||op==='min'){const vals=x.map(E);return vals.reduce((a,b)=>{
  const c=a.n*b.d-b.n*a.d;
  return op==='max'?(c>=0?a:b):(c<=0?a:b);
 })}
 if(op==='abs'){const a=E(x[0]);return reduce(Math.abs(a.n),a.d)}
 if(op==='num'){const a=E(x[0]);return {n:a.n,d:1}}
 if(op==='den'){const a=E(x[0]);return {n:a.d,d:1}}
 if(op==='lcm')return {n:lcm(x[0],x[1]),d:1};
 if(op==='gcd')return {n:gcd(x[0],x[1]),d:1};
 throw Error('Unknown fraction expression '+op);
}
const format=(a,b)=>frac(a,b);
const primeFactors=n=>{
 if(!Number.isSafeInteger(n)||n<1)throw Error('Invalid factorization '+n);
 const f=[],original=n;
 for(let p=2;p*p<=n;p++)while(n%p===0){f.push(p);n/=p;}
 if(n>1)f.push(n);
 return {original,f};
};
function showFactors(n){
 const x=primeFactors(n);return n+' = '+(x.f.length?x.f.join(' · '):'1');
}
function workedLCM(denoms){
 const xs=[...new Set(denoms)].sort((a,b)=>a-b);
 if(xs.length===0||xs.some(x=>!Number.isSafeInteger(x)||x<=0))throw Error('Invalid denominator factors');
 const counts=new Map();
 for(const value of xs){
  const local=new Map();
  for(const p of primeFactors(value).f)local.set(p,(local.get(p)||0)+1);
  for(const [p,c] of local)counts.set(p,Math.max(counts.get(p)||0,c));
 }
 const terms=[...counts.entries()].sort((a,b)=>a[0]-b[0]).flatMap(([p,c])=>Array(c).fill(p));
 const common=terms.reduce((v,p)=>v*p,1);
 const factors=terms.length?terms.join(' · '):'1';
 const additional=xs.map(d=>common+' : '+d+' = '+common/d).join('; ');
 return {common,steps:'Разложим знаменатели на простые множители: '+xs.map(showFactors).join('; ')+'. Берём простые множители в наибольших количествах: '+factors+' = '+common+'. Дополнительные множители: '+additional+'.'};
}
function displayedArithmeticSteps(plan){
 const sequence=[];
 const value=x=>x.d===1?String(x.n):format(x.n,x.d);
 function visit(node){
  const op=node[0],args=node.slice(1);
  if(op==='rat')return {n:args[0],d:args[1]};
  if(op==='abs'){
   const raw=visit(args[0]),positive=reduce(Math.abs(raw.n),raw.d);
   sequence.push('Расстояние между значениями равно модулю разности: |'+value(raw)+'| = '+value(positive)+'.');
   return positive;
  }
  if(!['add','sub','mul','div','max','min'].includes(op))return solve(node);
  if(op==='mul'||op==='div'){
   const left=visit(args[0]),right=visit(args[1]),result=solve(node),operation=op==='mul'?'·':':';
   sequence.push('Вычисляем '+left.n+'/'+left.d+' '+operation+' '+right.n+'/'+right.d+': '+(op==='mul'
    ?left.n+' · '+right.n+' / ('+left.d+' · '+right.d+')'
    :left.n+'/'+left.d+' · '+right.d+'/'+right.n)+'. Получаем '+result.n+'/'+result.d+'.');
   return result;
  }
  if(op==='cmp'||op==='max'||op==='min'){
   const values=args.map(visit),common=workedLCM(values.map(v=>v.d)),nums=values.map(v=>v.n*(common.common/v.d));
   const answer=solve(node);
   const conclusion=op==='cmp'
    ?nums[0]+' '+(comparisonSigns[answer.n]==='<'?'&lt;':comparisonSigns[answer.n])+' '+nums[1]
    :(op==='max'?'Наибольшее':'Наименьшее')+' значение '+value(answer);
   sequence.push(common.steps+' При одном знаменателе сравниваем числители: '+nums.join(', ')+'. '+conclusion+'.');
   return answer;
  }
  const values=args.map(visit);
  let acc=values[0];
  for(let i=1;i<values.length;i++){
   const next=values[i],worked=workedLCM([acc.d,next.d]),common=worked.common;
   const left=acc.n*(common/acc.d),right=next.n*(common/next.d);
   const numerator=op==='add'?left+right:left-right;
   const res=reduce(numerator,common);
   const symbol=op==='add'?'+':'−';
   sequence.push(worked.steps+' Приводим дроби: '+format(acc.n,acc.d)+' = '+format(left,common)+', '+format(next.n,next.d)+' = '+format(right,common)+'. '+format('('+left+' '+symbol+' '+right+')',common)+' = '+format(numerator,common)+'.'+(res.d!==common?' Сокращаем до '+(res.d===1?res.n:format(res.n,res.d))+'.':''));
   acc=res;
  }
  return acc;
 }
 visit(plan);
 return sequence.join(' ');
}
function reductionSteps(values){
 return values.map(([a,b])=>{
  const divisor=gcd(a,b),n=a/divisor,d=b/divisor;
  return 'Разложим числитель и знаменатель: '+showFactors(a)+'; '+showFactors(b)+'. Общие простые множители дают НОД '+divisor+'. Делим оба числа на '+divisor+': '+a+'/'+b+' = '+n+'/'+d+'.';
 }).join(' ');
}

function safeFractionChoices(n,d){
 // The legacy helper sometimes leaves only two choices after deduplication.
 // Construct four mathematically distinct, properly rendered alternatives.
 const list=[],seen=new Set();
 function add(x,y,key){
  if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||x<0||y<2)return;
  const z=reduce(x,y),canonical=z.n+'/'+z.d;
  if(z.d<2||seen.has(canonical))return;
  list.push({key,label:format(z.n,z.d)});seen.add(canonical);
 }
 add(n,d,n+'/'+d);
 const variants=[
  [n+1,d],[n+2,d],[n,d+1],[n+1,d+1],[n,d+2],[Math.max(1,n-1),d],
  [n+3,d],[n+2,d+1],[n+1,d+2],[Math.max(1,n-2),d+1],[n+1,d+3]
 ];
 for(let i=0;i<variants.length&&list.length<4;i++)add(variants[i][0],variants[i][1],'wrong_v129_'+i);
 if(list.length!==4||list[0].key!==n+'/'+d)throw Error('v129 cannot construct distinct fraction distractors');
 return list;
}
// §33: two continuous bars represent exactly the SAME unit interval.
// Splitting every original share into k equal shares preserves the shaded quantity.
function equalFractionPropertyModel(a,d,k){
 if(!Number.isSafeInteger(a)||!Number.isSafeInteger(d)||!Number.isSafeInteger(k)||
    a<1||a>=d||d<2||k<2||d*k>70)
  throw Error('§33 invalid same-whole fraction illustration');
 const x0=94,wholeWidth=480,h=29,rows=[
  {n:a,den:d,y:8,label:'До'},
  {n:a*k,den:d*k,y:55,label:'После'}
 ];
 const pictures=rows.map(({n,den,y,label})=>{
  const cell=wholeWidth/den;
  const cells=Array.from({length:den},(_,i)=>'<rect x="'+(x0+i*cell).toFixed(4)+
   '" y="'+y+'" width="'+cell.toFixed(4)+'" height="'+h+
   '" fill="'+(i<n?'#5d9cdc':'#edf3fc')+'"/>').join('');
  const cuts=Array.from({length:den-1},(_,i)=>{
   const x=(x0+(i+1)*cell).toFixed(4);
   return '<line x1="'+x+'" x2="'+x+'" y1="'+y+'" y2="'+(y+h)+
    '" stroke="#52617a" stroke-width="'+((i+1)%k===0?1.1:0.6)+'"/>';
  }).join('');
  return '<text x="3" y="'+(y+20)+'" font-size="15" fill="currentColor">'+label+
   '</text>'+cells+cuts+'<rect x="'+x0+'" y="'+y+'" width="'+wholeWidth+
   '" height="'+h+'" fill="none" stroke="#52617a" stroke-width="2"/>';
 }).join('');
 const label='Основное свойство дроби: одинаковые целые. '+a+'/'+d+
  ' равно '+(a*k)+'/'+(d*k)+'. Закрашена одна и та же доля, каждая старая часть '+
  'разделена ещё на '+k+' равных частей.';
 return '<div class="mk-g5-equal-property" style="width:100%;max-width:650px;overflow:hidden;margin:8px auto">'+
  '<svg class="mk-g5-equal-property-svg" role="img" aria-label="'+label+
  '" viewBox="0 0 590 100" width="100%" style="display:block;height:auto" '+
  'preserveAspectRatio="xMidYMid meet">'+pictures+'</svg></div>';
}

// §34: demonstrate reduction without changing how much of one whole is shaded.
function reductionWholeDiagram(n,d,k){
 if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||!Number.isSafeInteger(k)||
    n<1||n>=d||k<2||d*k>55)throw Error('§34 invalid reduction diagram');
 const x0=90,width=480,h=29;
 const bars=[{num:n*k,den:d*k,y:8,name:'Было'},
             {num:n,den:d,y:55,name:'Стало'}];
 const rows=bars.map(row=>{
  const unit=width/row.den;
  const cells=Array.from({length:row.den},(_,i)=>'<rect x="'+(x0+i*unit).toFixed(4)+
   '" y="'+row.y+'" width="'+unit.toFixed(4)+'" height="'+h+'" fill="'+
   (i<row.num?'#5d9cdc':'#edf3fc')+'"/>').join('');
  const lines=Array.from({length:row.den-1},(_,i)=>{
   const x=(x0+(i+1)*unit).toFixed(4);
   return '<line x1="'+x+'" x2="'+x+'" y1="'+row.y+'" y2="'+(row.y+h)+
    '" stroke="#52617a" stroke-width="0.9"/>';
  }).join('');
  return '<text x="3" y="'+(row.y+20)+'" font-size="14" fill="currentColor">'+row.name+
   '</text>'+cells+lines+'<rect x="'+x0+'" y="'+row.y+'" width="'+width+
   '" height="'+h+'" fill="none" stroke="#52617a" stroke-width="2"/>';
 }).join('');
 const caption='Сокращение дроби '+(n*k)+'/'+(d*k)+' на '+k+
   ' даёт '+n+'/'+d+'. На двух полосах одинаковое целое: одинаковая длина '+
   'закрашенной части, части каждой полосы равны.';
 return '<div style="width:100%;max-width:650px;overflow:hidden;margin:8px auto">'+
  '<svg class="mk-g5-reduction-diagram" role="img" aria-label="'+caption+
  '" viewBox="0 0 590 100" width="100%" style="display:block;height:auto" '+
  'preserveAspectRatio="xMidYMid meet">'+rows+'</svg></div>';
}

const section36=new Set(['frac_compare_diff','frac_add_diff','frac_sub_diff']);
const comparisonSigns=['<','=','>'];
const relation=(a,b)=>Math.sign(a.n*b.d-b.n*a.d);
const compare=(a,b)=>['cmp',a,b];

function section36Model(rows,den){
 const colors=['#5d9cdc','#edf3fc'];
 const width=456,h=22,x=12,cell=width/den;
 const bars=rows.map((n,i)=>{
  const y=6+30*i;
  const parts=Array.from({length:den},(_,j)=>'<rect x="'+(x+j*cell).toFixed(3)+'" y="'+y+
   '" width="'+cell.toFixed(3)+'" height="'+h+'" fill="'+colors[Number(j>=n)]+'"/>').join('');
  const cuts=Array.from({length:den-1},(_,j)=>{
   const at=(x+(j+1)*cell).toFixed(3);
   return '<line x1="'+at+'" y1="'+y+'" x2="'+at+'" y2="'+(y+h)+'" stroke="#52617a" stroke-width="0.7"/>';
  }).join('');
  return '<g>'+parts+cuts+'<rect x="'+x+'" y="'+y+'" width="'+width+'" height="'+h+
   '" fill="none" stroke="#52617a" stroke-width="1.5"/></g>';
 }).join('');
 return '<svg class="mk-g5-section36" role="img" aria-label="Одинаковые целые, в каждой полосе '+den+
  ' равных долей. Закрашено по строкам: '+rows.join(', ')+
  '." viewBox="0 0 480 '+(rows.length*30+3)+'" width="100%" style="display:block;max-width:480px;height:auto;margin:6px auto">'+bars+'</svg>';
}

function section36Spec(id,t,p){
 // One shared factor, two distinct denominators, and a third denominator for later tiers.
 const g=r(2,5+t),k=r(2,4+t),m=k+1,h=r(2,4+t);
 const d=g*k,e=g*m,j=g*h;
 const a=r(1,d-1),b=r(1,e-1),c=r(1,j-1);
 const A=Q(a,d),B=Q(b,e),C=Q(c,j),ONE=Q(1,1),HALF=Q(1,2);
 const f=format,S=x=>x[2]===1?String(x[1]):f(x[1],x[2]), sum=(x,y)=>S(x)+' + '+S(y), diff=(x,y)=>S(x)+' − '+S(y);
 const order=relation(solve(A),solve(B))>=0?[A,B]:[B,A];
 const [big,small]=order;
 const scaledDen=d*2,partLeft=r(1,d-1),partRight=r(1,scaledDen-1);
 const partA=Q(partLeft,d),partB=Q(partRight,scaledDen);
 const lesson=(text,plan,steps,diagram='')=>({id,t,p,text:text+diagram,plan,
  steps,mode:plan[0]==='cmp'?'sign':solve(plan).d===1?'int':'frac',
  why:displayedArithmeticSteps(plan),factorAudit:null});
 const sign=(left,right,plan,steps,diagram='')=>lesson('Поставь знак: '+left+' □ '+right+'.',plan,steps,diagram);
 const calc=(text,plan,steps,diagram='')=>lesson('Вычисли '+text+'.',plan,steps,diagram);
 if(id==='frac_compare_diff'){
  if(t===0){
   if(p===0)return sign(S(partA),S(partB),compare(partA,partB),2,section36Model([partLeft*2,partRight],scaledDen));
   if(p===1)return sign(S(A),S(B),compare(A,B),2);
   if(p===2){
    const scaled=Q(a*h+r(-1,1),d*h);
    return sign(S(A),S(scaled),compare(A,scaled),3);
   }
   if(p===3){
    const l=Q(r(1,4),5),rr=Q(r(1,6),7);
    return sign(S(l),S(rr),compare(l,rr),2);
   }
   return sign(S(A),S(HALF),compare(A,HALF),2);
  }
  if(t===1){
   if(p===0)return lesson('Найди наибольшую из дробей '+[A,B,C].map(S).join(', ')+'.',MAX(A,B,C),3);
   if(p===1)return lesson('Найди наименьшую из дробей '+[A,B,C].map(S).join(', ')+'.',MIN(A,B,C),3);
   if(p===2)return sign('('+sum(A,C)+')',S(B),compare(ADD(A,C),B),4);
   if(p===3)return sign('('+diff(big,small)+')',S(C),compare(SUB(big,small),C),4);
   return sign(S(A),'('+sum(B,C)+')',compare(A,ADD(B,C)),4);
  }
  if(p===0)return sign('('+sum(A,C)+')','('+sum(B,Q(1,d))+')',compare(ADD(A,C),ADD(B,Q(1,d))),5);
  if(p===1)return sign('('+diff(big,small)+')','('+diff(ONE,C)+')',compare(SUB(big,small),SUB(ONE,C)),5);
  if(p===2)return sign('('+sum(A,B)+' − '+S(C)+')',S(HALF),compare(SUB(ADD(A,B),C),HALF),5);
  if(p===3)return sign('(2 − ('+sum(A,B)+'))','('+diff(Q(2,1),C)+')',compare(SUB(Q(2,1),ADD(A,B)),SUB(Q(2,1),C)),6);
  return sign('('+sum(A,B)+')','('+S(ONE)+' − ('+diff(ONE,C)+'))',compare(ADD(A,B),SUB(ONE,SUB(ONE,C))),6);
 }
 if(id==='frac_add_diff'){
  if(t===0){
   if(p===0){
    const n=r(1,d-1),b=r(1,scaledDen-n*2);
    const first=Q(n,d),second=Q(b,scaledDen);
    return calc(sum(first,second),ADD(first,second),2,section36Model([n*2,b,n*2+b],scaledDen));
   }
   if(p===1)return calc(sum(A,B),ADD(A,B),2);
   if(p===2){
    const left=Q(d-r(1,2),d),right=Q(e-r(1,2),e);
    return calc(sum(left,right),ADD(left,right),3);
   }
   if(p===3)return lesson('До обеда прошли '+S(A)+' км, после обеда — '+S(B)+' км. Сколько километров прошли всего?',ADD(A,B),2);
   const target=r(1,2),n=r(1,g-1),right=Q(k*(target*g-n),d);
   return calc(sum(Q(n,g),right),ADD(Q(n,g),right),3);
  }
  if(t===1){
   if(p===0)return calc(sum(A,B)+' + '+S(C),ADD(A,B,C),4);
   if(p===1)return calc(S(A)+' + ('+sum(B,C)+')',ADD(A,ADD(B,C)),4);
   if(p===2)return lesson('В кувшин налили '+S(A)+' л воды, потом '+S(B)+' л и ещё '+S(C)+' л. Сколько литров налили?',ADD(A,B,C),4);
   if(p===3)return calc(sum(A,Q(d-a,d))+' + '+S(C),ADD(A,Q(d-a,d),C),4);
   return calc('('+sum(A,B)+') + ('+sum(C,Q(1,e))+')',ADD(ADD(A,B),ADD(C,Q(1,e))),5);
  }
  if(p===0)return calc(sum(A,B)+' + '+S(C)+' + '+S(Q(1,e))+' + '+S(Q(1,d)),ADD(A,B,C,Q(1,e),Q(1,d)),6);
  if(p===1)return calc('('+sum(A,B)+') + ('+S(C)+' + ('+sum(Q(1,d),Q(1,e))+'))',ADD(ADD(A,B),ADD(C,ADD(Q(1,d),Q(1,e)))),6);
  if(p===2)return calc(S(A)+' + ('+sum(B,C)+') + ('+sum(Q(d-a,d),Q(e-b,e))+')',ADD(A,ADD(B,C),ADD(Q(d-a,d),Q(e-b,e))),6);
  if(p===3)return lesson('Кабель составили из пяти отрезков длиной '+[A,B,C,Q(1,d),Q(1,e)].map(S).join(', ')+' м. Какова общая длина в метрах?',ADD(A,B,C,Q(1,d),Q(1,e)),6);
  return calc('('+sum(A,B)+') − ('+diff(Q(1,d*e),Q(1,d*e*2))+') + '+S(C),ADD(SUB(ADD(A,B),SUB(Q(1,d*e),Q(1,d*e*2))),C),6);
 }
 if(t===0){
  if(p===0){
   const n=r(1,d-1),b=r(1,n*2-1);
   const first=Q(n,d),second=Q(b,scaledDen);
   return calc(diff(first,second),SUB(first,second),2,section36Model([n*2,b,n*2-b],scaledDen));
  }
  if(p===1)return calc(diff(big,small),SUB(big,small),2);
  if(p===2)return calc(diff(ONE,A),SUB(ONE,A),2);
  if(p===3){
   const length=Q(r(1,3)*d+a,d);
   return lesson('Было '+S(length)+' м ткани, отрезали '+S(B)+' м. Сколько метров осталось?',SUB(length,B),3);
  }
  return lesson('На сколько отличаются доли '+S(A)+' и '+S(B)+'?',ABS(SUB(A,B)),3);
 }
 if(t===1){
  if(p===0){
   const first=Q(d+a,d);
   return calc(S(first)+' − '+S(B)+' − '+f(1,d*e),SUB(SUB(first,B),Q(1,d*e)),4);
  }
  if(p===1)return calc(S(Q(2,1))+' − ('+sum(A,B)+')',SUB(Q(2,1),ADD(A,B)),4);
  if(p===2)return calc(S(ONE)+' − ('+diff(big,small)+')',SUB(ONE,SUB(big,small)),4);
  if(p===3)return lesson('В канистре было '+S(Q(2,1))+' л воды. Из неё вылили '+S(A)+' л, затем долили '+S(B)+' л. Сколько литров стало?',ADD(SUB(Q(2,1),A),B),4);
  return calc('('+sum(A,B)+') − '+S(Q(1,d*e)),SUB(ADD(A,B),Q(1,d*e)),4);
 }
 if(p===0)return calc(S(Q(3,1))+' − '+S(A)+' − '+S(B)+' − '+S(C),SUB(SUB(SUB(Q(3,1),A),B),C),6);
 if(p===1)return calc('('+sum(Q(2,1),A)+') − ('+sum(B,C)+')',SUB(ADD(Q(2,1),A),ADD(B,C)),5);
 if(p===2)return calc(S(Q(2,1))+' − ('+S(A)+' + ('+diff(ONE,C)+'))',SUB(Q(2,1),ADD(A,SUB(ONE,C))),5);
 if(p===3)return lesson('Первый маршрут состоит из участков '+S(ONE)+' км и '+S(A)+' км, второй — из '+S(B)+' км и '+S(C)+' км. На сколько километров различаются длины маршрутов?',ABS(SUB(ADD(ONE,A),ADD(B,C))),6);
 return calc(S(Q(3,1))+' − ('+sum(A,B)+') − ('+diff(ONE,C)+')',SUB(SUB(Q(3,1),ADD(A,B)),SUB(ONE,C)),6);
}

function makeSpec(id,t,p){
 if(section36.has(id))return section36Spec(id,t,p);
 const d=id==='frac_equal'?(t===0?r(4,10):t===1&&p<=1?r(4,8):t===1?r(5,13):r(6,18)):r(4,9+t*2),e=r(3,10+t*2),a=r(1,d-1),b=r(1,e-1),k=id==='frac_equal'&&t===1&&p<=1?r(2,5):r(2,5+t),m=r(2,4+t),c=r(2,5+t),h=r(2,5+t);
 const f1=Q(a,d),f2=Q(b,e),f3=Q(1,d+1),u=Q(1,d),v=Q(1,d+e),lo=Q(1,d*2);
 const s=(n,den)=>format(n,den);
 const common=lcm(d,e);
 let tasks;
 if(id==='frac_equal'){
  if(t===0)tasks=[
   ['Дробь '+s(a,d)+' расширили умножением числителя и знаменателя на '+k+'. Каким стал числитель?',Q(a*k,1),'При расширении дроби умножаем оба компонента на один множитель.',1,'int'],
   ['В дроби '+s(a,d)+' умножили числитель и знаменатель на '+k+'. Каким стал знаменатель?',Q(d*k,1),'Знаменатель умножается на тот же дополнительный множитель.',1,'int'],
   ['Какую несократимую дробь обозначает '+s(a*k,d*k)+'?',f1,'Делим числитель и знаменатель на общий множитель, затем сокращаем до конца.',2,'frac'],
   ['В равенстве '+s(a,d)+' = '+s(a*k,d*k)+' на сколько увеличился числитель?',Q(a*(k-1),1),'Разница между новым и старым числителем.',2,'int'],
   ['Числитель '+a+' при расширении дроби '+s(a,d)+' стал '+(a*k)+'. Во сколько раз расширили дробь?',Q(k,1),'Разделим новый числитель на старый.',2,'int']
  ];else if(t===1)tasks=[
   ['Найди пропущенный числитель: '+s(a,d)+' = x/'+(d*k)+'.',Q(a*k,1),'Знаменатель увеличился в '+k+' раз; умножим и числитель.',2,'int'],
   ['Найди пропущенный знаменатель: '+s(a,d)+' = '+(a*k)+'/x.',Q(d*k,1),'Умножим знаменатель на коэффициент расширения.',2,'int'],
   ['Дробь '+s(a,d)+' расширили на '+k+', затем ещё на '+m+'. Каким стал знаменатель?',Q(d*k*m,1),'Дважды умножим исходный знаменатель.',3,'int'],
   ['Дробь '+s(a*k*m,d*k*m)+' сначала сократили на '+k+'. Какой теперь числитель?',Q(a*m,1),'Делим числитель на первый общий множитель.',2,'int'],
   ['Чему равно в несократимом виде '+s(a*k*m,d*k*m)+'?',f1,'Общие множители '+k+' и '+m+' сокращаются; затем сокращаем полностью.',3,'frac']
  ];else tasks=[
   ['После расширения '+s(a,d)+' сначала на '+k+', затем на '+m+' получили дробь с каким числителем?',Q(a*k*m,1),'Выполним два последовательных расширения.',3,'int'],
   ['Дробь '+s(a*k*m,d*k*m)+' сократили сначала на '+k+', затем на '+m+'. Каков знаменатель после указанных двух сокращений?',Q(d,1),'Последовательно разделим числитель и знаменатель на '+k+' и '+m+'.',3,'int'],
   ['Дробь '+s(a,d)+' расширили на '+k+' и '+m+' последовательно. На сколько итоговый знаменатель больше исходного?',Q(d*(k*m-1),1),'Вычислим новый знаменатель d·k·m и вычтем исходный d.',4,'int'],
   ['Дробь '+s(a*k*m,d*k*m)+' сократили на '+k+', а затем снова расширили на '+c+'. Какой числитель получился?',Q(a*m*c,1),'Сначала делим числитель, затем умножаем.',4,'int'],
   ['Представь '+s(a*k*m,d*k*m)+' в виде несократимой обыкновенной дроби после всех возможных сокращений.',f1,'Сократим общие множители и найдём НОД оставшихся числителя и знаменателя.',4,'frac']
  ];
 }
 if(id==='frac_reduce'){
  // §34 only reduces fractions, including staged reductions and GCD.
  // No premature cross-denominator addition or multiplication from later sections.
  const several=k*m*c,threeNum=a*several,threeDen=d*several;
  if(t===0)tasks=[
   ['Сократи дробь '+s(a*k,d*k)+' до несократимого вида.',f1,
    'Разделим оба числа на общий множитель, потом на их оставшийся НОД.',2,'frac'],
   ['У дроби '+s(b*m,e*m)+' сначала сократи множитель '+m+', затем доведи сокращение до конца. Какая дробь получится?',f2,
    'Сначала делим оба числа на '+m+', затем на НОД '+gcd(b,e)+'.',2,'frac'],
   ['Найди НОД числителя и знаменателя дроби '+s(a*k,d*k)+'.',Q(gcd(a*k,d*k),1),
    'Найдём наибольшее число, на которое делятся оба компонента.',2,'int'],
   ['У дроби '+s(a*k,d*k)+' после деления числителя и знаменателя на '+k+' каким станет знаменатель?',Q(d,1),
    'Знаменатель '+(d*k)+' делим на '+k+'. Получаем '+d+'.',2,'int'],
   ['После деления числителя и знаменателя дроби '+s(a*k,d*k)+' на '+k+' каким станет числитель?',Q(a,1),
    'Числитель '+(a*k)+' делим на '+k+'. Получаем '+a+'.',2,'int']
  ];else if(t===1)tasks=[
   ['Сократи дробь '+s(a*k*m,d*k*m)+' до несократимого вида.',f1,
    'По очереди сократим на '+k+', '+m+' и оставшийся НОД.',3,'frac'],
   ['У дроби '+s(a*k*m,d*k*m)+' сначала сократили на '+k+'. Каким стал знаменатель?',Q(d*m,1),
    'После одного сокращения осталось '+d+' · '+m+' = '+(d*m)+'.',3,'int'],
   ['Найди НОД числителя и знаменателя дроби '+s(a*k*m,d*k*m)+'.',Q(gcd(a*k*m,d*k*m),1),
    'Общие множители '+k+' и '+m+' не забываем: НОД = '+gcd(a,d)+' · '+k+' · '+m+'.',3,'int'],
   ['Дробь '+s(a*k*m,d*k*m)+' сократили сначала на '+k+', затем на '+m+'. Какой числитель получился?',Q(a,1),
    'Числитель последовательно делим на '+k+' и на '+m+'.',3,'int'],
   ['После сокращения дроби '+s(a*k*m,d*k*m)+' сначала на '+k+', затем на '+m+' найди НОД оставшихся числителя и знаменателя.',Q(gcd(a,d),1),
    'После двух сокращений остаётся '+a+'/'+d+'. Найдём НОД оставшихся чисел.',4,'int']
  ];else tasks=[
   ['Найди НОД числителя и знаменателя дроби '+s(threeNum,threeDen)+'.',Q(gcd(threeNum,threeDen),1),
    'Сначала раскладываем числитель и знаменатель на множители, затем ищем полный НОД.',4,'int'],
   ['Дробь '+s(threeNum,threeDen)+' последовательно сократили на '+k+', '+m+' и '+c+'. Каким стал числитель?',Q(a,1),
    'Проводим три последовательных сокращения без изменения значения дроби.',4,'int'],
   ['Дробь '+s(a*k*m,d*k*m)+' сократили на '+k+', затем на '+m+', после этого сократили полностью. Какую несократимую дробь получили?',f1,
    'После двух сокращений получим '+a+'/'+d+', потом сократим на НОД.',5,'frac'],
   ['После сокращения дроби '+s(a*k*m,d*k*m)+' на '+k+' и '+m+' оба оставшихся числа снова умножили на '+c+'. Затем дробь сократили полностью. Какая несократимая дробь получилась?',f1,
    'Сокращение и последующее расширение на одинаковый множитель не изменяют дробь.',5,'frac'],
   ['Дробь '+s(threeNum,threeDen)+' сократили на '+k+', затем на '+m+' и '+c+', затем на НОД полученных чисел. Какой знаменатель остался?',Q(d/gcd(a,d),1),
    'После трёх сокращений остаётся '+a+'/'+d+'. Затем делим знаменатель на НОД '+gcd(a,d)+'.',5,'int']
  ];
 }
 if(id==='frac_common_lcm'){
  if(t===0)tasks=[
   ['Найди наименьший общий знаменатель дробей '+s(1,d)+' и '+s(1,e)+'.',Q(common,1),'НОК двух знаменателей — наименьшее число, кратное обоим.',2,'int'],
   ['К знаменателю '+d+' и кратному ему '+(d*k)+' найди НОК.',Q(d*k,1),'Если одно число кратно другому, НОК — большее.',2,'int'],
   ['Для дробей '+s(a,d)+' и '+s(1,d*k)+' найди наименьший общий знаменатель.',Q(d*k,1),'Второй знаменатель кратен первому.',2,'int'],
   ['Дробь '+s(a,d)+' привели к знаменателю '+(d*k)+'. Найди новый числитель.',Q(a*k,1),'Дополнительный множитель равен '+k+'.',2,'int'],
   ['Какой дополнительный множитель нужен для знаменателя '+d+', чтобы получить '+(d*m)+'?',Q(m,1),'Делим новый знаменатель на старый.',2,'int']
  ];else if(t===1)tasks=[
   ['Найди наименьший общий знаменатель '+d+', '+e+' и '+(d*k)+'.',Q(lcm(common,d*k),1),'Постепенно ищем НОК для трёх знаменателей.',3,'int'],
   ['Первую дробь '+s(a,d)+' привели к НОК знаменателей '+d+' и '+e+'. Каким стал её числитель?',Q(a*(common/d),1),'Найдём НОК и дополнительный множитель для первой дроби.',3,'int'],
   ['Вторую дробь '+s(b,e)+' привели к НОК '+common+'. Какой получился числитель?',Q(b*(common/e),1),'Общий знаменатель делим на исходный и умножаем числитель.',3,'int'],
   ['Найди сумму дополнительных множителей для знаменателей '+d+' и '+e+'.',Q(common/d+common/e,1),'Разложим знаменатели на простые множители, найдём НОК '+common+'. Дополнительные множители: '+common+'/'+d+' = '+(common/d)+' и '+common+'/'+e+' = '+(common/e)+'. Их сумма '+(common/d+common/e)+'.',3,'int'],
   ['Найди НОК знаменателей дробей '+s(a,d*k)+' и '+s(b,e)+'.',Q(lcm(d*k,e),1),'Сопоставим кратные обоих знаменателей.',3,'int']
  ];else tasks=[
   ['Найди НОК для знаменателей '+d+', '+e+' и '+(d*m)+'.',Q(lcm(common,d*m),1),'НОК трёх чисел через разложение на простые множители.',4,'int'],
   ['Приведи '+s(a,d)+' к НОК знаменателей '+d+', '+e+', '+(d*m)+'. Каким станет числитель?',Q(a*(lcm(common,d*m)/d),1),'Сначала НОК трёх, затем дополнительный множитель.',4,'int'],
   ['Приведи '+s(b,e)+' к НОК трёх знаменателей '+d+', '+e+' и '+(e*k)+'. Найди числитель.',Q(b*(lcm(common,e*k)/e),1),'Определяем НОК трёх знаменателей и умножаем числитель.',4,'int'],
   ['Приведи знаменатели '+d+', '+e+' и '+(d*e)+' к наименьшему общему. Найди сумму трёх дополнительных множителей.',Q(lcm(common,d*e)/d+lcm(common,d*e)/e+lcm(common,d*e)/(d*e),1),'Разложим все три знаменателя на простые множители. Найдём НОК '+lcm(common,d*e)+'. Дополнительные множители: '+(lcm(common,d*e)/d)+', '+(lcm(common,d*e)/e)+' и '+(lcm(common,d*e)/(d*e))+'. Сложим их.',5,'int'],
   ['Найди НОК чисел '+(d*k)+', '+(e*m)+' и '+d+'.',Q(lcm(lcm(d*k,e*m),d),1),'Разложим три знаменателя на простые множители и соберём НОК.',4,'int']
  ];
 }
 if(id==='frac_mul_common'){
  if(t===0)tasks=[
   ['Вычисли '+s(1,d)+' · '+s(1,e)+'.',MUL(u,Q(1,e)),'Перемножим числители и знаменатели, затем сократим.',2,'frac'],
   ['Найди произведение '+s(a,d)+' и '+s(1,e)+'.',MUL(f1,Q(1,e)),'Произведение числителей поделим на произведение знаменателей.',2,'frac'],
   ['Площадь прямоугольника со сторонами '+s(1,d)+' м и '+s(1,e)+' м. Найди площадь в м².',MUL(u,Q(1,e)),'Площадь равна произведению дробных длин.',2,'frac'],
   ['Проверь, можно ли сократить множители перед умножением '+s(a,d)+' · '+s(b,e)+'. Вычисли произведение.',MUL(f1,f2),'Сократим общие множители, если они есть, затем перемножим и сократим дробь.',3,'frac'],
   ['Найди половину числа '+s(a,d)+'.',MUL(f1,Q(1,2)),'Умножим дробь на одну вторую.',2,'frac']
  ];else if(t===1)tasks=[
   ['Вычисли ('+s(1,d)+' + '+s(1,e)+') · '+s(1,d+e)+'.',MUL(ADD(u,Q(1,e)),v),'Сложим дроби, затем умножим.',3,'frac'],
   ['Найди произведение '+s(a,d)+' · '+s(b,e)+' и затем раздели результат на 2.',DIV(MUL(f1,f2),Q(2,1)),'Умножим две дроби и разделим пополам.',3,'frac'],
   ['Вычисли '+s(a,d)+' · ('+s(1,e)+' + '+s(1,d*2)+').',MUL(f1,ADD(Q(1,e),lo)),'Сначала сумму внутри скобок, затем произведение.',3,'frac'],
   ['Найди произведение '+s(1,d)+' · '+s(1,e)+' · '+s(1,d+1)+'.',MUL(MUL(u,Q(1,e)),f3),'Последовательно перемножим три дроби.',3,'frac'],
   ['У прямоугольника стороны '+s(a,d)+' м и '+s(b,e)+' м. Вторую сторону уменьшили в 2 раза. Найди площадь нового прямоугольника.',MUL(f1,DIV(f2,Q(2,1))),'Разделим вторую сторону пополам, затем умножим длины.',3,'frac']
  ];else tasks=[
   ['Вычисли ('+s(a,d)+' + '+s(1,e)+') · ('+s(1,d)+' + '+s(1,d+e)+').',MUL(ADD(f1,Q(1,e)),ADD(u,v)),'Найдём две суммы, затем произведение и сократим.',5,'frac'],
   ['Найди произведение '+s(a,d)+' · '+s(b,e)+' · '+s(1,d+e)+' + '+s(1,d*e)+'.',ADD(MUL(MUL(f1,f2),v),Q(1,d*e)),'Три множителя, затем прибавление дроби.',5,'frac'],
   ['У прямоугольника стороны '+s(a,d)+' и '+s(b,e)+' м. Увеличили каждую сторону на '+s(1,d*e)+' м. Вычисли новую площадь.',MUL(ADD(f1,Q(1,d*e)),ADD(f2,Q(1,d*e))),'Две суммы сторон и умножение.',5,'frac'],
   ['Вычисли '+s(a,d)+' · ('+s(b,e)+' + '+s(1,d*2)+') + '+s(1,d*e)+'.',ADD(MUL(f1,ADD(f2,lo)),Q(1,d*e)),'Скобки, произведение и ещё одно сложение.',4,'frac'],
   ['Найди разность: ('+s(a,d)+' + '+s(1,d*2)+') · '+s(1,e)+' − '+s(1,d*2)+' · '+s(1,e)+'.',SUB(MUL(ADD(f1,lo),Q(1,e)),MUL(lo,Q(1,e))),'Вычислим два произведения и вычтем меньшее.',5,'frac']
  ];
 }
 if(!tasks||tasks.length!==5)throw Error('v129 no task family '+id+' '+t);
 let [text,plan,why,steps,mode]=tasks[p];
 if(id==='frac_reduce'&&t===0)text+=' '+reductionWholeDiagram(p===1?b:a,p===1?e:d,p===1?m:k);
 // §33 introductory and first practice models make equivalence visible, never just asserted.
 if(id==='frac_equal'&&(t===0||t===1&&(p===0||p===1)))
  text+=' '+equalFractionPropertyModel(a,d,k);
 let worked='',factorAudit=null;
 if(id==='frac_common_lcm'){
  const byTier=[
   [[d,e],[d,d*k],[d,d*k],[d,d*k],[d,d*m]],
   [[d,e,d*k],[d,e],[d,e],[d,e],[d*k,e]],
   [[d,e,d*m],[d,e,d*m],[d,e,e*k],[d,e,d*e],[d*k,e*m,d]]
  ];
  const detail=workedLCM(byTier[t][p]);worked=detail.steps;factorAudit={denominators:byTier[t][p],lcm:detail.common};
 }else if(id==='frac_reduce'){
  const primary=t===0?(p===1?[b*m,e*m]:[a*k,d*k]):
   t===1?[a*k*m,d*k*m]:
   (p===0||p===1||p===4)?[a*k*m*c,d*k*m*c]:[a*k*m,d*k*m];
  worked=reductionSteps([primary]);
 }else if(id==='frac_equal'&&((t===0&&p===2)||((t===1||t===2)&&p===4))){
  worked=reductionSteps([t===0?[a*k,d*k]:[a*k*m,d*k*m]]);
 }
 return {id,t,p,text,plan,why:why+(worked?' '+worked:''),steps,mode,factorAudit};
}
function question(id){
 const t=T(),p=F();
 let data,v;
 for(let attempt=0;attempt<50;attempt++){
  data=makeSpec(id,t,p);
  v=solve(data.plan);
  // Never present 0 or 1 as an ordinary fraction with denominator >= 2.
  if(data.mode!=='frac'||v.d!==1)break;
 }
 if(data.mode==='frac'&&v.d===1)throw Error('v129 cannot generate fraction '+id+'/'+t+'/'+p);
 if(!Number.isSafeInteger(v.n)||!Number.isSafeInteger(v.d)||v.n<0||v.d<=0||v.n>200000000)throw Error('v129 invalid rational answer '+id+'/'+t+'/'+p+' '+v.n+'/'+v.d);
 const key='v129_'+id+'_L'+t+'_F'+p;
 let options,correct,mode=data.mode;
 if(mode==='sign'){
  options=comparisonSigns.map((label,i)=>({label,key:String(i)}));correct=String(v.n);
 }else if(mode==='frac'){
  if(v.d===1)throw Error('v129 unexpectedly integer fraction '+key);
  options=safeFractionChoices(v.n,v.d);correct=v.n+'/'+v.d;
 }else{
  if(v.d!==1)throw Error('v129 integer family produced fraction '+key);
  options=g5nums(v.n,[v.n+1,v.n+2,v.n+3]);correct=String(v.n);
 }
 const answer=options.find(option=>String(option.key)===correct).label;
 const q=g5q(data.text,options,correct,data.why+' Ответ: '+(answer==='<'?'&lt;':answer)+'.',key);
 const keys=q.choices.filter(c=>String(c.key)===String(q.correct));
 if(keys.length!==1||new Set(q.choices.map(c=>String(c.label))).size!==q.choices.length)throw Error('v129 duplicate answers '+key);
 return {text:q.text,ans:String(q.correct),choices:q.choices,ex:q.explain,
  sourceTopicId:id,templateId:q.templateId,sig:['g5',id,'v129',t,p,q.text,correct].join(':'),
  correctLabel:String(keys[0].label),correctText:String(keys[0].label),
  mk129:{id,t,p,steps:data.steps,mode,plan:data.plan,expected:v,factorAudit:data.factorAudit}};
}
makeG5Question=function(id){return covered.has(id)?question(id):previous.apply(this,arguments)};
window.mkG5V129Tiered=IDS.slice();
})();
