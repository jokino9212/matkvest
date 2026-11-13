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
 function visit(node){
  const op=node[0],args=node.slice(1);
  if(op==='rat')return reduce(args[0],args[1]);
  if(!['add','sub'].includes(op))return solve(node);
  const values=args.map(visit);
  let acc=values[0];
  for(let i=1;i<values.length;i++){
   const next=values[i],worked=workedLCM([acc.d,next.d]),common=worked.common;
   const left=acc.n*(common/acc.d),right=next.n*(common/next.d);
   const numerator=op==='add'?left+right:left-right;
   const res=reduce(numerator,common);
   const symbol=op==='add'?'+':'−';
   sequence.push(worked.steps+' Приводим дроби: '+acc.n+'/'+acc.d+' = '+left+'/'+common+', '+next.n+'/'+next.d+' = '+right+'/'+common+'. ('+left+' '+symbol+' '+right+')/'+common+' = '+numerator+'/'+common+'.'+(res.d!==common?' Сокращаем до '+res.n+'/'+res.d+'.':''));
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
function makeSpec(id,t,p){
 const d=r(4,9+t*2),e=r(3,10+t*2),a=r(1,d-1),b=r(1,e-1),k=r(2,5+t),m=r(2,4+t),c=r(2,5+t),h=r(2,5+t);
 const f1=Q(a,d),f2=Q(b,e),f3=Q(1,d+1),u=Q(1,d),v=Q(1,d+e),two=Q(2,d+e+2);
 const half=Q(1,2),hi=Q(1,d),lo=Q(1,d*2),tiny=Q(1,d*4);
 const s=(n,den)=>format(n,den);
 const am=ADD(f1,f2),delta=ABS(SUB(f1,f2)),common=lcm(d,e);
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
  if(t===0)tasks=[
   ['Сократи дробь '+s(a*k,d*k)+' до несократимого вида.',f1,'Разделим числитель и знаменатель на НОД.',2,'frac'],
   ['У дроби '+s(b*m,e*m)+' сначала сократи множитель '+m+', затем доведи сокращение до конца. Какая дробь получится?',f2,'Сначала разделим оба числа на '+m+', затем сократим оставшиеся общие множители.',3,'frac'],
   ['Найди НОД числителя и знаменателя дроби '+s(a*k,d*k)+'.',Q(gcd(a*k,d*k),1),'Для полного сокращения найди наибольший общий делитель числителя и знаменателя.',2,'int'],
   ['У дроби '+s(a*k,d*k)+' после деления числителя и знаменателя на '+k+' каким станет знаменатель?',Q(d,1),'При сокращении делим оба компонента на одно число.',2,'int'],
   ['Сколько раз нужно одновременно поделить числитель и знаменатель дроби '+s(a*k,d*k)+' на '+k+', чтобы вернуться к исходной записи '+s(a,d)+'?',Q(1,1),'Деление обоих чисел на указанный множитель — одно сокращение.',1,'int']
  ];else if(t===1)tasks=[
   ['Сократи дробь '+s(a*k*m,d*k*m)+' до несократимого вида.',f1,'Уберём два общих множителя и затем общий НОД.',3,'frac'],
   ['После сокращения '+s(a*k*m,d*k*m)+' сначала на '+k+' каков знаменатель?',Q(d*m,1),'После одного сокращения остаётся множитель '+m+'.',2,'int'],
   ['Сложи '+s(a*k,d*k)+' и '+s(1,d)+'. Ответ запиши несократимой дробью.',ADD(f1,u),'Сократим первую, затем сложим дроби с одинаковым знаменателем.',3,'frac'],
   ['Умножь сокращённую дробь '+s(a*k,d*k)+' на '+s(1,m)+'. Ответ сократи.',MUL(f1,Q(1,m)),'Сначала сокращение исходной дроби, затем умножение.',3,'frac'],
   ['Из дроби '+s(a*k,d*k)+' после сокращения вычли половину её величины. Какую дробь получили?',SUB(f1,DIV(f1,Q(2,1))),'Сократим исходную, затем найдём и вычтем половину.',3,'frac']
  ];else tasks=[
   ['Сложи две сокращаемые дроби '+s(a*k,d*k)+' и '+s(b*m,e*m)+'. Ответ сократи до конца.',ADD(f1,f2),'Сократим каждую, приведём к общему знаменателю и сложим.',4,'frac'],
   ['Вычисли произведение '+s(a*k,d*k)+' · '+s(b*m,e*m)+'. Ответ сократи.',MUL(f1,f2),'Перекрёстные сокращения множителей и произведение.',4,'frac'],
   ['После сокращения '+s(a*k*m,d*k*m)+' на '+k+' и '+m+' результат увеличили в 2 раза. Запиши несократимую дробь.',MUL(f1,Q(2,1)),'Сокращаем дважды, затем удваиваем дробь.',4,'frac'],
   ['Вычисли '+s(a*k,d*k)+' + '+s(1,d)+' − '+s(1,d*2)+'. Ответ сократи.',SUB(ADD(f1,u),lo),'Сократим, приведём к общему знаменателю, сложим и вычтем.',5,'frac'],
   ['От суммы сокращённых дробей '+s(a*k,d*k)+' и '+s(b*m,e*m)+' вычли '+s(1,d*e)+'. Запиши несократимую дробь.',SUB(ADD(f1,f2),Q(1,d*e)),'Сокращаем, складываем и вычитаем.',5,'frac']
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
   ['Найди сумму '+s(1,d)+' и '+s(1,e)+' после приведения к наименьшему общему знаменателю.',ADD(u,Q(1,e)),'Находим НОК, дополнительные множители, складываем числители.',3,'frac'],
   ['Найди НОК знаменателей дробей '+s(a,d*k)+' и '+s(b,e)+'.',Q(lcm(d*k,e),1),'Сопоставим кратные обоих знаменателей.',3,'int']
  ];else tasks=[
   ['Найди НОК для знаменателей '+d+', '+e+' и '+(d*m)+'.',Q(lcm(common,d*m),1),'НОК трёх чисел через разложение на простые множители.',4,'int'],
   ['Приведи '+s(a,d)+' к НОК знаменателей '+d+', '+e+', '+(d*m)+'. Каким станет числитель?',Q(a*(lcm(common,d*m)/d),1),'Сначала НОК трёх, затем дополнительный множитель.',4,'int'],
   ['Приведи '+s(b,e)+' к НОК трёх знаменателей '+d+', '+e+' и '+(e*k)+'. Найди числитель.',Q(b*(lcm(common,e*k)/e),1),'Определяем НОК трёх знаменателей и умножаем числитель.',4,'int'],
   ['Вычисли сумму '+s(1,d)+' + '+s(1,e)+' + '+s(1,d*e)+'. Ответ запиши несократимой дробью.',ADD(u,Q(1,e),Q(1,d*e)),'Находим общий знаменатель трёх дробей, складываем и сокращаем.',5,'frac'],
   ['Найди НОК чисел '+(d*k)+', '+(e*m)+' и '+d+'.',Q(lcm(lcm(d*k,e*m),d),1),'Разложим три знаменателя на простые множители и соберём НОК.',4,'int']
  ];
 }
 if(id==='frac_compare_diff'){
  const la=Q(1,d),lb=Q(1,e),left=ADD(f1,Q(1,d*e)),right=ADD(f2,Q(1,d*e));
  if(t===0)tasks=[
   ['Из дробей '+s(1,d)+' и '+s(1,d*2)+' найди большую.',hi,'У единичных дробей больше та, у которой меньше знаменатель.',2,'frac'],
   ['Из '+s(1,e)+' и '+s(1,d*e)+' выбери меньшую дробь.',Q(1,d*e),'Сравним единичные дроби по знаменателям.',2,'frac'],
   ['Какая дробь больше: '+s(a,d)+' или '+s(a,d*k)+'?',f1,'При одинаковом числителе больше дробь с меньшим знаменателем.',2,'frac'],
   ['Какая дробь меньше: '+s(a,d)+' или '+s(a,d*m)+'?',Q(a,d*m),'При одинаковом числителе сравним знаменатели.',2,'frac'],
   ['Выбери наибольшее значение из дробей '+s(a,d)+' и '+s(b,e)+'.',MAX(f1,f2),'Приведём к общему знаменателю или перемножим крест-накрест.',2,'frac']
  ];else if(t===1)tasks=[
   ['Найди наибольшее значение из дробей '+s(a,d)+' и '+s(b,e)+' после приведения к общему знаменателю.',MAX(f1,f2),'Найдём НОК знаменателей, затем сравним числители.',3,'frac'],
   ['Найди наименьшее значение из дробей '+s(a,d)+' и '+s(b,e)+'.',MIN(f1,f2),'Приведём к общему знаменателю и выберем меньшую.',3,'frac'],
   ['Сравни результаты: '+s(a,d)+' + '+s(1,d*e)+' и '+s(b,e)+' + '+s(1,d*e)+'. Выбери больший.',MAX(left,right),'Сложим обе пары, затем сравним.',3,'frac'],
   ['Какая дробь меньше из трёх: '+s(a,d)+', '+s(b,e)+' и '+s(1,d*e)+'?',MIN(f1,f2,Q(1,d*e)),'Сравним три дроби с разными знаменателями.',3,'frac'],
   ['Из дробей '+s(a,d)+' и '+s(b,e)+' выбери наибольшее значение, затем найди половину выбранной.',DIV(MAX(f1,f2),Q(2,1)),'Сначала сравнение, затем деление пополам.',3,'frac']
  ];else tasks=[
   ['Сначала сложи '+s(a,d)+' и '+s(1,d*e)+', затем сравни сумму с '+s(b,e)+'. Запиши большую дробь.',MAX(left,f2),'Приведём, сложим и сравним.',4,'frac'],
   ['Сначала сложи '+s(b,e)+' и '+s(1,d*e)+', затем сравни сумму с '+s(a,d)+'. Запиши меньшую.',MIN(right,f1),'Выполним сложение и сравнение.',4,'frac'],
   ['Сравни три величины: '+s(a,d)+', '+s(b,e)+' и '+s(1,d)+' + '+s(1,e)+'. Назови наибольшую.',MAX(f1,f2,ADD(u,Q(1,e))),'Найдём третью сумму, затем сравним три дроби.',4,'frac'],
   ['Из наибольшей из дробей '+s(a,d)+' и '+s(b,e)+' вычли половину наименьшей. Найди результат.',SUB(MAX(f1,f2),DIV(MIN(f1,f2),Q(2,1))),'Сначала сравнение, затем половина меньшего и вычитание.',5,'frac'],
   ['Найди половину наименьшего из '+s(a,d)+', '+s(b,e)+' и '+s(1,d*e)+'.',DIV(MIN(f1,f2,Q(1,d*e)),Q(2,1)),'Сравним три дроби, выберем наименьшую, разделим на 2.',4,'frac']
  ];
 }
 if(id==='frac_add_diff'){
  if(t===0)tasks=[
   ['Вычисли '+s(1,d)+' + '+s(1,e)+'.',ADD(u,Q(1,e)),'Найдём НОК знаменателей, дополнительные множители и сложим числители.',2,'frac'],
   ['Сложи '+s(a,d)+' и '+s(b,e)+'.',ADD(f1,f2),'Приведём к общему знаменателю, сложим числители.',2,'frac'],
   ['К '+s(a,d)+' прибавили '+s(1,d*k)+'. Найди сумму.',ADD(f1,Q(1,d*k)),'Один знаменатель кратен другому, приводим первую дробь.',2,'frac'],
   ['У одной дроби знаменатель вдвое больше, чем у другой: '+s(1,d)+' и '+s(1,d*2)+'. Найди сумму.',ADD(u,lo),'Приведём первую дробь к знаменателю '+(d*2)+' и сложим числители.',2,'frac'],
   ['За два дня прошли '+s(a,d)+' км и '+s(1,e)+' км. Сколько километров прошли?',ADD(f1,Q(1,e)),'Складываем дробные величины с разными знаменателями.',2,'frac']
  ];else if(t===1)tasks=[
   ['Вычисли '+s(a,d)+' + '+s(b,e)+' + '+s(1,d*e)+'.',ADD(f1,f2,Q(1,d*e)),'Приведём три дроби к общему знаменателю и сложим.',3,'frac'],
   ['К сумме '+s(1,d)+' + '+s(1,e)+' прибавили '+s(1,d*k)+'. Найди итог.',ADD(u,Q(1,e),Q(1,d*k)),'Сначала сумма, затем третье слагаемое с новым знаменателем.',3,'frac'],
   ['Найди '+s(a,d)+' + ('+s(b,e)+' + '+s(1,d+e)+').',ADD(f1,ADD(f2,v)),'Сумма в скобках, затем сложение с первой дробью.',3,'frac'],
   ['К '+s(a,d)+' прибавили '+s(1,e)+', затем ещё '+s(1,d+1)+'. Найди общую сумму.',ADD(f1,Q(1,e),f3),'Три последовательных сложения с разными знаменателями.',3,'frac'],
   ['Сначала сложи '+s(a,d)+' и '+s(b,e)+', затем прибавь '+s(1,d*e)+' и удвой полученную сумму.',MUL(ADD(am,Q(1,d*e)),Q(2,1)),'Вычислим сумму трёх дробей, затем умножим результат на 2.',4,'frac']
  ];else tasks=[
   ['Сначала прибавь к '+s(a,d)+' дробь '+s(b,e)+', затем ещё '+s(1,d+e)+' и '+s(1,d*e)+'.',ADD(f1,f2,v,Q(1,d*e)),'Несколько знаменателей, суммы по этапам и сокращение.',5,'frac'],
   ['К сумме '+s(1,d)+' + '+s(1,e)+' прибавили '+s(a,d)+' и '+s(b,e)+'. Вычисли.',ADD(u,Q(1,e),f1,f2),'Сгруппируем дроби, приведём к НОК и сложим.',4,'frac'],
   ['Найди сумму трёх дробей '+s(a,d)+', '+s(1,d*2)+', '+s(1,e)+' и затем прибавь '+s(1,d+1)+'.',ADD(f1,lo,Q(1,e),f3),'Четыре дроби со смешанными кратными знаменателями.',5,'frac'],
   ['Утром прошли '+s(a,d)+' км, днём '+s(b,e)+' км, вечером '+s(1,d+e)+' км, а перед сном ещё '+s(1,d*e)+' км. Найди путь.',ADD(f1,f2,v,Q(1,d*e)),'Сложим четыре дроби после приведения к общему знаменателю.',5,'frac'],
   ['Из суммы '+s(a,d)+' + '+s(b,e)+' + '+s(1,d*e)+' вычли '+s(1,d*e)+'. Найди итог.',SUB(ADD(f1,f2,Q(1,d*e)),Q(1,d*e)),'Приведение к общему знаменателю, сложение и вычитание.',4,'frac']
  ];
 }
 if(id==='frac_sub_diff'){
  if(t===0)tasks=[
   ['Вычисли '+s(1,d)+' − '+s(1,d*2)+'.',SUB(hi,lo),'Приведём к знаменателю '+(d*2)+' и вычтем числители.',2,'frac'],
   ['Из '+s(1,d)+' вычти '+s(1,d*4)+'.',SUB(hi,tiny),'Второй знаменатель кратен первому, разность положительна.',2,'frac'],
   ['На сколько '+s(1,d)+' больше '+s(1,d*2)+'?',SUB(hi,lo),'Из большей дроби вычтем меньшую.',2,'frac'],
   ['Лента '+s(1,d)+' м, отрезали '+s(1,d*2)+' м. Сколько осталось?',SUB(hi,lo),'Вычтем меньшую долю из большей.',2,'frac'],
   ['Найди положительную разницу дробей '+s(a,d)+' и '+s(b,e)+'.',ABS(SUB(f1,f2)),'Приведём к общему знаменателю и вычтем меньшую из большей.',2,'frac']
  ];else if(t===1)tasks=[
   ['Вычисли '+s(1,d)+' − '+s(1,d*2)+' − '+s(1,d*4)+'.',SUB(SUB(hi,lo),tiny),'Приведём к знаменателю '+(d*4)+' и выполним два вычитания.',3,'frac'],
   ['Из '+s(1,d)+' вычли '+s(1,d*4)+', затем ещё '+s(1,d*4)+'. Найди остаток.',SUB(SUB(hi,tiny),tiny),'Два раза вычитаем четверть исходной единичной дроби.',3,'frac'],
   ['Найди разность между '+s(a,d)+' + '+s(1,d*2)+' и '+s(1,d*2)+'.',SUB(ADD(f1,lo),lo),'Сначала сложение, затем вычитание.',3,'frac'],
   ['На сколько дробь '+s(a,d)+' + '+s(b,e)+' больше дроби '+s(b,e)+'?',SUB(am,f2),'Сумма двух разных знаменателей минус одно слагаемое.',3,'frac'],
   ['Вычисли '+s(1,d)+' − ('+s(1,d*2)+' − '+s(1,d*4)+').',SUB(hi,SUB(lo,tiny)),'Сначала разность внутри скобок, затем внешнее вычитание.',3,'frac']
  ];else tasks=[
   ['Вычисли '+s(1,d)+' − '+s(1,d*2)+' − '+s(1,d*4)+' + '+s(1,d*8)+'.',ADD(SUB(SUB(hi,lo),tiny),Q(1,d*8)),'Три действия с кратными знаменателями.',4,'frac'],
   ['Из '+s(a,d)+' + '+s(b,e)+' вычли сначала '+s(b,e)+', затем '+s(1,d*2)+'. Найди результат.',SUB(SUB(am,f2),lo),'Сначала сумму, затем два вычитания.',4,'frac'],
   ['Найди положительную разность между суммами '+s(a,d)+' + '+s(1,d*2)+' и '+s(b,e)+' + '+s(1,d*4)+'.',ABS(SUB(ADD(f1,lo),ADD(f2,tiny))),'Найдём обе суммы и сравним.',5,'frac'],
   ['Из суммы '+s(a,d)+' + '+s(1,d*2)+' вычли '+s(1,d*4)+'. Найди остаток.',SUB(ADD(f1,lo),tiny),'Сложение и вычитание с разными знаменателями.',4,'frac'],
   ['Вычисли '+s(1,d)+' − ('+s(1,d*2)+' − '+s(1,d*4)+') + '+s(1,d*8)+'.',ADD(SUB(hi,SUB(lo,tiny)),Q(1,d*8)),'Сначала внутренние скобки, затем оставшиеся действия.',5,'frac']
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
 const [text,plan,why,steps,mode]=tasks[p];
 let worked='';
 if(id==='frac_common_lcm'){
  const byTier=[
   [[d,e],[d,d*k],[d,d*k],[d,d*k],[d,d*m]],
   [[d,e,d*k],[d,e],[d,e],[d,e],[d*k,e]],
   [[d,e,d*m],[d,e,d*m],[d,e,e*k],[d,e,d*e],[d*k,e*m,d]]
  ];
  worked=workedLCM(byTier[t][p]).steps;
 }else if(id==='frac_add_diff'||id==='frac_sub_diff'){
  worked=displayedArithmeticSteps(plan);
 }else if(id==='frac_compare_diff'){
  const denominators=[];
  const explore=node=>{
   if(!Array.isArray(node))return;
   if(node[0]==='rat')denominators.push(node[2]);
   else for(const child of node.slice(1))if(Array.isArray(child))explore(child);
  };
  explore(plan);
  worked=workedLCM(denominators).steps;
 }else if(id==='frac_reduce'){
  const primary=(t===0?(p===1?[b*m,e*m]:[a*k,d*k]):t===1?(p<2?[a*k*m,d*k*m]:[a*k,d*k]):p===2?[a*k*m,d*k*m]:[a*k,d*k]);
  const inputs=[primary];
  if(t===2&&(p===0||p===1||p===4))inputs.push([b*m,e*m]);
  worked=reductionSteps(inputs);
 }else if(id==='frac_equal'&&(p===2||p===4)){
  worked=reductionSteps([[a*k*m,d*k*m]]);
 }
 return {id,t,p,text,plan,why:why+(worked?' '+worked:''),steps,mode};
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
 if(mode==='frac'){
  if(v.d===1)throw Error('v129 unexpectedly integer fraction '+key);
  options=safeFractionChoices(v.n,v.d);correct=v.n+'/'+v.d;
 }else{
  if(v.d!==1)throw Error('v129 integer family produced fraction '+key);
  options=g5nums(v.n,[v.n+1,v.n+2,v.n+3]);correct=String(v.n);
 }
 const q=g5q(data.text,options,correct,data.why+' Ответ: '+(mode==='frac'?format(v.n,v.d):v.n)+'.',key);
 const keys=q.choices.filter(c=>String(c.key)===String(q.correct));
 if(keys.length!==1||new Set(q.choices.map(c=>String(c.label))).size!==q.choices.length)throw Error('v129 duplicate answers '+key);
 return {text:q.text,ans:String(q.correct),choices:q.choices,ex:q.explain,
  sourceTopicId:id,templateId:q.templateId,sig:['g5',id,'v129',t,p,q.text,correct].join(':'),
  correctLabel:String(keys[0].label),correctText:String(keys[0].label),
  mk129:{id,t,p,steps:data.steps,mode,plan:data.plan,expected:v}};
}
makeG5Question=function(id){return covered.has(id)?question(id):previous.apply(this,arguments)};
window.mkG5V129Tiered=IDS.slice();
})();
