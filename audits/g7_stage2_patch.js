/* МатКвест 8.72 · аудит 7 класса, этап 2 · 2026-11-03.
   Только генераторы G7: #9, #37, #39, #59, #61, #62, #66, #67.
   Текущий этап 1 для #63-65, 78, 85 остаётся нетронутым;
   случайный 8%-й откат к старым вопросам #63-65 отключается отдельной
   однострочной правкой существующего кода (см. скрипт установки).
   Не меняет профиль, экономику, магазин, G8, PWA и backend. */
(function(){
 'use strict';
 const g7BeforeAudit2 = makeG7Question;
 const pick = xs => xs[ri(0,xs.length-1)];
 const triangle = d => {
  const a=ri(5+d,11+d*3), b=ri(5+d,11+d*3);
  return {a,b,c:ri(Math.abs(a-b)+1,a+b-1)};
 };
 const triangleDistinct = d => {
  for(let i=0;i<100;i++){
   const t=triangle(d);
   if(new Set([t.a,t.b,t.c]).size===3)return t;
  }
  return {a:8,b:9,c:11};
 };
 const mkN = (raw,d,v,text,answer,ex,parts=[],data=null,unit='') => {
  const sig=g7QuestionSig(raw,d,`audit2_${v}`,parts);
  const audit={type:'g7AuditStage2',raw,d,variant:v,answer:Number(answer),parts};
  if(data)return g7GeoNumber(text,answer,ex,sig,audit,data,'Чертёж схематический; используем данные условия.',unit);
  return g7Number(text,answer,ex,sig,{audit,unitSuffix:unit});
 };
 const mkC = (raw,d,v,text,answer,wrong,ex,parts=[],data=null) => {
  const sig=g7QuestionSig(raw,d,`audit2_${v}`,parts);
  const audit={type:'g7AuditStage2',raw,d,variant:v,answer:String(answer),parts};
  if(data)return g7GeoChoice(text,answer,wrong,ex,sig,audit,data,'Чертёж схематический; используем данные условия.');
  return g7StrictChoice(text,answer,wrong,ex,sig,audit);
 };
 const iso = () => g7TriangleData('isosceles',{sideMarks:[{side:'AB',count:1},{side:'AC',count:1}]});
 const eq = () => g7TriangleData('equilateral',{sideMarks:[{side:'AB',count:1},{side:'BC',count:1},{side:'AC',count:1}]});
 const ordinary = () => g7TriangleData('scalene');

 // #37. В прежнем генераторе скобка оставалась одной и той же для каждого уровня.
 // Подбираем взаимно простые коэффициенты, чтобы общий множитель был максимальным.
 const originalCommonFactor = g7CommonFactorModel;
 g7CommonFactorModel = function(level=0){
  if(level<0 || level>2)return originalCommonFactor(level);
  const commonCoef=pick(level===0?[2,3,4,5,6,7,8]:[3,4,5,6,7,8,9,10,12]);
  const gx=level===0?ri(0,1):ri(1,3), gy=level===2?ri(0,2):0;
  const g={coef:commonCoef,powers:{...(gx?{x:gx}:{}),...(gy?{y:gy}:{})}};
  const a=pick(level===0?[2,3,4,5]:[2,3,4,5,6,7]);
  const b=pick([1,2,3,4,5,6,7,8,9].filter(n=>gcd(n,a)===1));
  const c=level===0?0:pick([-7,-5,-3,-1,1,2,3,5,7]);
  let residual;
  if(level===0)residual=[{coef:a,powers:{x:1}},{coef:b,powers:{}}];
  else if(level===1)residual=[{coef:a,powers:{x:2}},{coef:c,powers:{x:1}},{coef:b,powers:{}}];
  else residual=[{coef:a,powers:{x:1,y:1}},{coef:c,powers:{x:1}},{coef:b,powers:{y:1}}];
  // b взаимно просто с a; если c кратно общему делителю a,b, он всё равно =1.
  return {g,residual,original:g7PolynomialScale(residual,g)};
 };

 // #39. Больше не используем одни и те же (a+b)(x+y) на разминке.
 const originalGrouping = g7GroupingModel;
 g7GroupingModel = function(level=0){
  if(level<0 || level>2)return originalGrouping(level);
  const ca=level===0?1:ri(1,4),cb=level===0?ri(1,5):pick([-5,-4,-3,-2,1,2,3,4,5]);
  const cx=ri(1,level===0?4:5),cy=level===0?1:pick([-4,-3,-2,-1,1,2,3,4]);
  const left=[{coef:ca,powers:{a:1}},{coef:cb,powers:{b:1}}];
  const right=[{coef:cx,powers:{x:1}},{coef:cy,powers:{y:1}}];
  const expanded=[];
  for(const A of left)for(const B of right)expanded.push(g7MonomialMul(A,B));
  const poly=g7PolynomialNormalize(expanded);
  return {left,right,expanded:poly,displayTerms:level===2?shuffleOptions(poly):poly};
 };

 function newG7Question(raw,d){
  // #9. На разминке ранее два текста про тетради и рабочих были всегда одинаковы.
  if(raw==='direct_inverse_proportion'){
   const variants=d===0?['direct_relation','inverse_relation','direct_unknown']:
     d===1?['inverse_time','direct_unknown','inverse_workers']:
     ['inverse_workers','combined_cost','reverse_price','inverse_time'];
   const v=pick(variants);
   if(v==='direct_relation'){
    const times=ri(2,6),thing=pick(['тетрадей','ручек','блокнотов']),answer=`увеличится в ${times} раз`;
    return mkC(raw,d,v,`Цена одной штуки неизменна. Количество купленных ${thing} увеличили в ${times} раз. Как изменится общая стоимость?`,answer,[`уменьшится в ${times} раз`,'не изменится',`увеличится в ${times*times} раз`],`При постоянной цене стоимость прямо пропорциональна количеству: увеличится в ${times} раз.`,[thing,times]);
   }
   if(v==='inverse_relation'){
    const times=ri(2,5),answer=`уменьшится в ${times} раз`;
    return mkC(raw,d,v,`Одинаковые по производительности станки вместе выполняют неизменный заказ. Число одновременно работающих станков увеличили в ${times} раз. Как изменится время работы?`,answer,[`увеличится в ${times} раз`,'не изменится',`уменьшится в ${times+1} раз`],`При неизменном объёме работы произведение числа станков на время постоянно. Время уменьшится в ${times} раз.`,[times]);
   }
   if(v==='direct_unknown'){
    const k=ri(3,12),x=ri(2,8),y=ri(9,20),sum=k*y;
    return mkN(raw,d,v,`За ${x} одинаковых тетрадей заплатили ${x*k} ₽. Сколько стоят ${y} таких тетрадей без скидки?`,sum,`Цена одной: ${x*k} : ${x} = ${k} ₽. Стоимость ${y} тетрадей: ${k} · ${y} = ${sum} ₽.`,[k,x,y],null,'₽');
   }
   if(v==='inverse_time'){
    const w1=ri(3,8),t1=ri(8,18),total=w1*t1;
    const choices=allDivisors(total).filter(w=>w>w1 && w<=18);
    if(!choices.length)return null;
    const w2=pick(choices),ans=total/w2;
    return mkN(raw,d,v,`${w1} одинаковых станков выполняют заказ за ${t1} ч. За сколько часов его выполнят ${w2} таких станков при совместной работе?`,ans,`При постоянном объёме работы t = (${w1} · ${t1}) : ${w2} = ${total} : ${w2} = ${ans} ч.`,[w1,w2,t1],null,'ч');
   }
   if(v==='inverse_workers'){
    const w1=pick([3,4,5,6]),days1=pick([8,10,12,18,20]);
    const total=w1*days1,w2=pick(allDivisors(total).filter(w=>w>w1 && w<=15));
    const ans=total/w2;
    return mkN(raw,d,v,`${w1} рабочих выполняют задание за ${days1} дней. Сколько дней понадобится ${w2} рабочим при одинаковой производительности?`,ans,`Человеко-дней всего ${w1} · ${days1} = ${total}. Время работы: ${total} : ${w2} = ${ans} дней.`,[w1,w2,days1],null,'дн.');
   }
   if(v==='combined_cost'){
    const n1=ri(3,7),price=pick([25,40,50,60,75,80,90]),n2=ri(8,15),discount=pick([50,100,125,150]),cost=n2*price-discount;
    return mkN(raw,d,v,`${n1} одинаковых наборов стоят ${n1*price} ₽. Купили ${n2} таких наборов и получили скидку ${discount} ₽ на всю покупку. Сколько заплатили?`,cost,`Цена набора ${n1*price}:${n1}=${price} ₽. Стоимость до скидки ${n2*price} ₽, после скидки — ${cost} ₽.`,[n1,n2,price,discount],null,'₽');
   }
   const n1=ri(3,8),n2=ri(10,17),unit=pick([30,40,50,60,75,80,90,100]),cost=n1*unit,answer=unit*n2;
   return mkN(raw,d,v,`${n1} одинаковых пакетов стоят ${cost} ₽. Сколько таких пакетов можно купить на ${answer} ₽ без сдачи?`,n2,`Цена пакета ${cost}:${n1}=${unit} ₽. Значит, ${answer}:${unit}=${n2} пакетов.`,[n1,n2,cost]);
  }
  // #59. На сложных уровнях — не только называние сторон и углов.
  if(raw==='geo_triangle_elements'){
   const v=pick(d===0?['perimeter','opposite']:
      d===1?['perimeter','missing','find_sum']:
      ['missing','double_perimeter','compare_perimeters']);
   const t=triangle(d),p=t.a+t.b+t.c, data=ordinary();
   if(v==='opposite'){
    const vertex=pick(['A','B','C']),side={A:'BC',B:'AC',C:'AB'}[vertex];
    return mkC(raw,d,v,`Какая сторона △ABC расположена напротив вершины ${vertex}?`,side,['AB','BC','AC'].filter(x=>x!==side),`Напротив вершины ${vertex} находится ${side}.`,[vertex],data);
   }
   if(v==='perimeter')return mkN(raw,d,v,`Стороны △ABC равны AB=${t.a} см, BC=${t.b} см, AC=${t.c} см. Найди периметр.`,p,`P=${t.a}+${t.b}+${t.c}=${p} см.`,[t.a,t.b,t.c],data,'см');
   if(v==='missing')return mkN(raw,d,v,`Периметр △ABC равен ${p} см, AB=${t.a} см, BC=${t.b} см. Найди AC.`,t.c,`AC = ${p} − ${t.a} − ${t.b} = ${t.c} см.`,[t.a,t.b,t.c],data,'см');
   if(v==='find_sum')return mkN(raw,d,v,`У △ABC стороны AB=${t.a}, BC=${t.b}, AC=${t.c} см. Найди сумму сторон AB и AC.`,t.a+t.c,`AB + AC = ${t.a}+${t.c}=${t.a+t.c} см.`,[t.a,t.b,t.c],data,'см');
   if(v==='double_perimeter'){
    const delta=ri(1,4),newP=p+3*delta;
    return mkN(raw,d,v,`Все три стороны △ABC увеличили на ${delta} см. Первоначальные стороны ${t.a}, ${t.b}, ${t.c} см. Каким стал периметр?`,newP,`Было ${p} см. Каждая из трёх сторон выросла на ${delta} см, значит новый периметр ${p}+3·${delta}=${newP} см.`,[t.a,t.b,t.c,delta],data,'см');
   }
   const scale=ri(2,4);
   return mkN(raw,d,v,`Стороны △ABC равны ${t.a}, ${t.b}, ${t.c} см. Стороны △DEF в ${scale} раза больше соответствующих сторон △ABC. Найди периметр △DEF.`,p*scale,`P(ABC)=${p} см. При увеличении всех сторон в ${scale} раза периметр увеличится в ${scale} раза: ${p}·${scale}=${p*scale} см.`,[t.a,t.b,t.c,scale],null,'см');
  }
  // #61. Расширяем задачи на основание, боковые стороны, углы, периметр.
  if(raw==='geo_isosceles_equilateral'){
   const v=pick(d===0?['equal','eq_perimeter','base']:
      d===1?['iso_perimeter','eq_perimeter','base_from_perimeter','vertex_angle']:
      ['base_from_perimeter','side_from_perimeter','vertex_angle','iso_perimeter']);
   const b=ri(3+d,12+d*2),a=ri(Math.floor(b/2)+1,15+d*4),p=2*a+b;
   if(v==='equal')return mkC(raw,d,v,`В равнобедренном △ABC AB=AC=${a} см. Какая пара сторон равна?`,'AB и AC',['AB и BC','BC и AC','все три обязательно равны'],`По условию боковые стороны AB и AC равны.`,[a],iso());
   if(v==='base')return mkC(raw,d,v,`В равнобедренном △ABC AB=AC=${a} см и BC=${b} см. Назови основание.`,'BC',['AB','AC','AB и AC'],`Основание — сторона напротив вершины между равными боковыми сторонами: BC.`,[a,b],iso());
   if(v==='eq_perimeter'){
    const side=ri(3+d,15+d*2);
    return mkN(raw,d,v,`В равностороннем треугольнике каждая сторона равна ${side} см. Найди периметр.`,3*side,`P=3·${side}=${3*side} см.`,[side],eq(),'см');
   }
   if(v==='iso_perimeter')return mkN(raw,d,v,`В равнобедренном треугольнике боковые стороны по ${a} см, основание ${b} см. Найди периметр.`,p,`P=2·${a}+${b}=${p} см.`,[a,b],iso(),'см');
   if(v==='base_from_perimeter')return mkN(raw,d,v,`Периметр равнобедренного △ABC равен ${p} см; AB=AC=${a} см. Найди основание BC.`,b,`BC=${p}−2·${a}=${b} см.`,[a,b],iso(),'см');
   if(v==='side_from_perimeter')return mkN(raw,d,v,`Периметр равнобедренного △ABC равен ${p} см, основание BC=${b} см. Найди длину каждой боковой стороны.`,a,`AB=AC=(${p}−${b}):2=${a} см.`,[a,b],iso(),'см');
   const angle=pick([40,50,60,70,80,90,100]);
   return mkN(raw,d,v,`В равнобедренном △ABC AB=AC; угол при вершине A равен ${angle}°. Найди угол B.`,(180-angle)/2,`Углы при основании равны: ∠B=(180°−${angle}°):2=${(180-angle)/2}°.`,[angle],iso(),'°');
  }
  // #62. Разные числовые связи свойств равнобедренного треугольника.
  if(raw==='geo_isosceles_properties_criteria'){
   const v=pick(d===0?['base_equal','criterion']:
      d===1?['vertex_from_base','base_from_vertex','bisector_half']:
      ['vertex_from_base','base_from_vertex','bisector_half','angle_difference']);
   const baseAngle=ri(d?35:30,70),vertexAngle=180-2*baseAngle;
   if(v==='base_equal')return mkN(raw,d,v,`В △ABC AB=AC, ∠B=${baseAngle}°. Найди ∠C.`,baseAngle,`Углы при основании BC равны: ∠C=∠B=${baseAngle}°.`,[baseAngle],iso(),'°');
   if(v==='criterion'){
    const a=ri(30,65);
    return mkC(raw,d,v,`В △ABC известно ∠B=∠C=${a}°. Какие стороны обязательно равны?`,'AB и AC',['AB и BC','BC и AC','все стороны равны'],`Равным углам B и C противоположны стороны AC и AB.`,[a],iso());
   }
   if(v==='vertex_from_base')return mkN(raw,d,v,`△ABC равнобедренный: AB=AC, ∠B=${baseAngle}°. Найди ∠A.`,vertexAngle,`∠A=180°−2·${baseAngle}°=${vertexAngle}°.`,[baseAngle],iso(),'°');
   if(v==='base_from_vertex')return mkN(raw,d,v,`△ABC равнобедренный: AB=AC, ∠A=${vertexAngle}°. Найди ∠C.`,baseAngle,`∠B=∠C=(180°−${vertexAngle}°):2=${baseAngle}°.`,[vertexAngle],iso(),'°');
   if(v==='bisector_half')return mkN(raw,d,v,`В равнобедренном △ABC AB=AC и ∠A=${vertexAngle}°. AD — биссектриса угла A. Найди ∠BAD.`,vertexAngle/2,`Биссектриса делит угол пополам: ∠BAD=${vertexAngle}°:2=${vertexAngle/2}°.`,[vertexAngle],iso(),'°');
   return mkN(raw,d,v,`В равнобедренном △ABC AB=AC, угол B=${baseAngle}°. Найди разность ∠B − ∠A в градусах.`,baseAngle-vertexAngle,`∠A=180°−2·${baseAngle}°=${vertexAngle}°. Разность ∠B−∠A=${baseAngle}−${vertexAngle}=${baseAngle-vertexAngle}°.`,[baseAngle],iso(),'°');
  }
  // #66. Условия существования, целые границы и подсчёт вариантов.
  if(raw==='geo_triangle_inequality'){
   const v=pick(d===0?['existence','max_integer']:
      d===1?['existence','max_integer','min_integer']:
      ['max_integer','min_integer','count_integer','existence']);
   const a=ri(4,9+d*2),b=ri(4,9+d*2),min=Math.abs(a-b)+1,max=a+b-1;
   if(v==='existence'){
    const valid=Math.random()<.5,c=valid?ri(min,max):pick([a+b,a+b+ri(1,5),(Math.abs(a-b)||a+b)]);
    const answer=valid?'да':'нет';
    return mkC(raw,d,v,`Могут ли ${a} см, ${b} см и ${c} см быть сторонами невырожденного треугольника?`,answer,[answer==='да'?'нет':'да'],`Для третьей стороны нужно |${a}−${b}| < c < ${a}+${b}. Здесь c=${c}, поэтому ответ «${answer}».`,[a,b,c,valid?1:0]);
   }
   if(v==='max_integer')return mkN(raw,d,v,`Две стороны треугольника равны ${a} см и ${b} см. Найди наибольшую целую длину третьей стороны.`,max,`c < ${a}+${b}=${a+b}; максимальное целое c=${max}. Нижняя граница тоже выполняется.`,[a,b]);
   if(v==='min_integer')return mkN(raw,d,v,`Две стороны треугольника равны ${a} см и ${b} см. Найди наименьшую целую длину третьей стороны.`,min,`c > |${a}−${b}|=${Math.abs(a-b)}; минимальное целое c=${min}. Верхняя граница тоже выполняется.`,[a,b]);
   const count=max-min+1;
   return mkN(raw,d,v,`Две стороны треугольника равны ${a} см и ${b} см. Сколько различных целых положительных значений может иметь третья сторона?`,count,`|${a}−${b}| < c < ${a}+${b}. Целые c от ${min} до ${max} включительно, их ${max}−${min}+1=${count}.`,[a,b]);
  }
  // #67. Строго разные длины исключают неоднозначный «наибольший угол».
  if(raw==='geo_side_angle_relation'){
   const v=pick(d===0?['largest','opposite']:
      d===1?['largest','smallest','which_side']:
      ['largest','smallest','angle_order','side_order']);
   const t=triangleDistinct(d);
   const bySide=[{side:'AB',n:t.a,angle:'∠C'},
                 {side:'AC',n:t.b,angle:'∠B'},
                 {side:'BC',n:t.c,angle:'∠A'}];
   const sorted=bySide.slice().sort((x,y)=>y.n-x.n);
   if(v==='largest'||v==='smallest'){
    const target=v==='largest'?sorted[0]:sorted[2];
    return mkC(raw,d,v,`AB=${t.a} см, AC=${t.b} см, BC=${t.c} см. Какой угол ${v==='largest'?'наибольший':'наименьший'}?`,target.angle,['∠A','∠B','∠C'].filter(x=>x!==target.angle),`${v==='largest'?'Наибольшему':'Наименьшему'} углу противоположна ${v==='largest'?'наибольшая':'наименьшая'} сторона. Это ${target.side}=${target.n} см, значит ${target.angle}.`,[t.a,t.b,t.c],null);
   }
   if(v==='opposite'){
    const side=pick(['AB','AC','BC']),target={AB:'∠C',AC:'∠B',BC:'∠A'}[side];
    return mkC(raw,d,v,`Какой угол в треугольнике ABC находится напротив стороны ${side}?`,target,['∠A','∠B','∠C'].filter(x=>x!==target),`Стороне ${side} противоположен ${target}.`,[side],ordinary());
   }
   if(v==='which_side'){
    const angle=pick(['∠A','∠B','∠C']),target={'∠A':'BC','∠B':'AC','∠C':'AB'}[angle];
    return mkC(raw,d,v,`Какую сторону треугольника ABC нужно сравнивать с другими, чтобы определить величину ${angle}?`,target,['AB','BC','AC'].filter(x=>x!==target),`Угол ${angle} лежит напротив стороны ${target}.`,[angle],ordinary());
   }
   if(v==='angle_order'){
    const correct=sorted.map(x=>x.angle).join(' > ');
    const ordered=sorted.map(x=>x.angle);
    const distractors=[ordered.slice().reverse().join(' > '),[ordered[1],ordered[0],ordered[2]].join(' > '),[ordered[0],ordered[2],ordered[1]].join(' > ')];
    return mkC(raw,d,v,`В △ABC AB=${t.a} см, AC=${t.b} см, BC=${t.c} см. Расположи углы по убыванию.`,correct,distractors,`Порядок сторон по убыванию: ${sorted.map(x=>x.side+'='+x.n).join(' > ')}. Противоположные углы имеют тот же порядок: ${correct}.`,[t.a,t.b,t.c]);
   }
   const correct=sorted.map(x=>x.side).join(' > '),order=sorted.map(x=>x.side),distractors=[order.slice().reverse().join(' > '),[order[1],order[0],order[2]].join(' > '),[order[0],order[2],order[1]].join(' > ')];
   return mkC(raw,d,v,`В △ABC AB=${t.a} см, AC=${t.b} см, BC=${t.c} см. Расположи стороны по убыванию.`,correct,distractors,`Сравниваем длины всех сторон: ${correct}, так как ${sorted[0].n} > ${sorted[1].n} > ${sorted[2].n}.`,[t.a,t.b,t.c]);
  }
  return null;
 }
 makeG7Question = function(id,stageOverride=null){
  const raw=rawCourseId(id),d=Math.max(0,Math.min(2,Number.isInteger(stageOverride)?stageOverride:activeDifficulty()));
  const q=newG7Question(raw,d);
  return q?gPolishQuestionObject(q):g7BeforeAudit2(id,stageOverride);
 };
})();
