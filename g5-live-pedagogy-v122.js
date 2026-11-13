/* Grade 5 v122: actual on-screen curriculum and real cognitive tiers. */
(function(){
'use strict';
if(typeof makeG5Question!=='function'||typeof g5DonorQuestion!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof activeDifficulty!=='function')throw Error('v122 prerequisites missing');
const originalMake=makeG5Question;
// These 19 already-written advanced generators were tested as donors but not consumed by the learner's makeG5Question path.
const PUBLISHED_ADVANCED=[
 'natural_compare','cuboid','calculator','angle_types',
 'frac_parts','frac_read','frac_ray','frac_types',
 'frac_compare_den','frac_compare_num','frac_add','frac_sub','mixed_compare','mixed_add','mixed_sub',
 'dec_compare','dec_add','dec_sub','dec_round'
];
const advancedSet=new Set(PUBLISHED_ADVANCED);
const segmentsId='segments_polygons';
const tier=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0));
const family=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const rnd=(a,b)=>ri(a,b),sum=(...xs)=>xs.reduce((a,b)=>a+b,0);
const val=x=>['v',x],add=(...args)=>['add',...args],sub=(x,y)=>['sub',x,y],mul=(x,y)=>['mul',x,y],abs=x=>['abs',x];
function evaluate(node){
 if(!Array.isArray(node))throw Error('v122 malformed plan');
 const [op,...a]=node;
 if(op==='v')return a[0];
 if(op==='add')return a.reduce((x,y)=>x+evaluate(y),0);
 if(op==='sub')return evaluate(a[0])-evaluate(a[1]);
 if(op==='mul')return evaluate(a[0])*evaluate(a[1]);
 if(op==='abs')return Math.abs(evaluate(a[0]));
 throw Error('v122 unsupported operation '+op);
}
function lengthQuestion(t,p,text,plan,explain,steps){
 const n=evaluate(plan),id='segments_polygons',name='v122_'+id+'_L'+t+'_F'+p;
 if(!Number.isSafeInteger(n)||n<1)throw Error('v122 impossible segment result '+name+': '+n);
 const q=g5q(text,g5nums(n,[n+1,n+2,Math.max(0,n-1)]),String(n),explain+' Ответ: '+n+' см.',name);
 q.mk122={id,t,p,steps,plan,expected:n};
 return q;
}
function segment(t,p){
 const a=rnd(5,12+t*4),b=rnd(4,10+t*4),c=rnd(3,9+t*4),d=rnd(2,7+t*4);
 // A triangle built as (a+b,b+c,c+a) ALWAYS meets the strict triangle inequalities.
 const x=a+b,y=b+c,z=c+a,P=x+y+z;
 if(t===0){
  if(p===0)return lengthQuestion(t,p,'Отрезок AB разбили точкой C на части '+a+' см и '+b+' см. Найди длину AB.',add(val(a),val(b)),'Длина отрезка — сумма двух его частей: '+a+' + '+b+'.',1);
  if(p===1)return lengthQuestion(t,p,'Ломаная имеет три звена: '+a+', '+b+' и '+c+' см. Чему равна её длина?',add(val(a),val(b),val(c)),'Сложим длины всех звеньев: '+a+' + '+b+' + '+c+'.',2);
  if(p===2)return lengthQuestion(t,p,'Найди периметр треугольника со сторонами '+x+', '+y+' и '+z+' см.',add(val(x),val(y),val(z)),'Периметр треугольника равен сумме трёх сторон.',2);
  if(p===3)return lengthQuestion(t,p,'У прямоугольника стороны '+a+' и '+b+' см. Найди периметр.',mul(val(2),add(val(a),val(b))),'Две стороны равны '+a+' см, другие две равны '+b+' см. P = 2 · ('+a+' + '+b+').',2);
  return lengthQuestion(t,p,'У квадрата сторона '+a+' см. Найди периметр.',mul(val(4),val(a)),'Все четыре стороны равны: P = 4 · '+a+'.',1);
 }
 if(t===1){
  if(p===0){const total=a+b+c;return lengthQuestion(t,p,'Длина ломаной из трёх звеньев '+total+' см. Два звена имеют длины '+a+' и '+b+' см. Найди третье.',sub(sub(val(total),val(a)),val(b)),'От общей длины последовательно вычтем известные звенья.',2)}
  if(p===1)return lengthQuestion(t,p,'Периметр треугольника '+P+' см. Две его стороны равны '+x+' и '+y+' см. Найди третью сторону.',sub(sub(val(P),val(x)),val(y)),'Третья сторона равна периметру минус две известные стороны.',2);
  if(p===2)return lengthQuestion(t,p,'Ломаная состоит из четырёх звеньев: два по '+a+' см, одно '+b+' см и одно '+c+' см. Найди длину.',add(mul(val(2),val(a)),val(b),val(c)),'Сначала считаем два одинаковых звена, затем прибавляем оставшиеся.',3);
  if(p===3){const total=2*(a+b);return lengthQuestion(t,p,'Периметр прямоугольника '+total+' см. Одна сторона равна '+a+' см. Найди другую.',sub(val(a+b),val(a)),'Полупериметр равен '+(a+b)+' см. Вычтем известную сторону.',2)}
  return lengthQuestion(t,p,'У пятиугольника три стороны по '+a+' см, четвёртая '+b+' см, пятая '+c+' см. Найди периметр.',add(mul(val(3),val(a)),val(b),val(c)),'Три равные стороны дают '+(3*a)+' см. Прибавим остальные две.',3);
 }
 if(p===0){const total=sum(a,b,c,d),increase=rnd(2,6);return lengthQuestion(t,p,'Ломаная состоит из четырёх звеньев длиной '+a+', '+b+', '+c+', '+d+' см. Второе звено удлинили на '+increase+' см, четвёртое укоротили на 1 см. Найди новую длину.',sub(add(val(a),val(b),val(c),val(d),val(increase)),val(1)),'Сначала сумма четырёх звеньев '+total+' см; прибавим удлинение '+increase+' см и вычтем укорочение 1 см.',5)}
 if(p===1){const inc=rnd(2,5);return lengthQuestion(t,p,'Треугольник имеет стороны '+x+', '+y+' и '+z+' см. Каждую сторону увеличили на '+inc+' см. Чему равен новый периметр?',add(add(val(x),val(y),val(z)),mul(val(3),val(inc))),'Найдём исходный периметр '+P+' см и прибавим три увеличения по '+inc+' см.',4)}
 if(p===2){const a1=a+b,b1=a+c;const old=2*(a1+b1),newP=2*((a1+d)+(b1+c));return lengthQuestion(t,p,'Стороны прямоугольника '+a1+' и '+b1+' см. Длину увеличили на '+d+' см, ширину на '+c+' см. На сколько сантиметров вырос периметр?',sub(mul(val(2),add(add(val(a1),val(d)),add(val(b1),val(c)))),val(old)),'Сначала P₁ = 2 · ('+a1+' + '+b1+') = '+old+' см. Затем P₂ = 2 · ('+(a1+d)+' + '+(b1+c)+') = '+newP+' см. Разность P₂ − P₁.',5)}
 if(p===3){const leg=a+b,halfBase=Math.min(c,leg-1),base=2*halfBase,per=2*leg+base;return lengthQuestion(t,p,'Равнобедренный треугольник имеет периметр '+per+' см. Основание равно '+base+' см, а боковые стороны равны. Найди длину боковой стороны.',sub(val(per/2),val(halfBase)),'Из периметра '+per+' вычтем основание '+base+' и разделим остаток на 2: '+leg+' см.',3)}
 const lengthA=a+b+c,lengthB=b+c+d,extra=rnd(2,5),start=lengthA+lengthB;
 return lengthQuestion(t,p,'Две ломаные имеют длины '+lengthA+' и '+lengthB+' см. Первую удлинили на '+extra+' см, вторую укоротили на '+Math.min(d,extra)+' см. На сколько первая теперь длиннее или короче второй? Найди модуль разности длин.',abs(sub(add(val(lengthA),val(extra)),sub(val(lengthB),val(Math.min(d,extra))))),'После изменений длины равны '+(lengthA+extra)+' и '+(lengthB-Math.min(d,extra))+' см. Вычитаем меньшее из большего.',4);
}
function fromDonor(id){
 const original=g5DonorQuestion(id);
 if(!original||!Array.isArray(original.choices)||!original.choices.length||!original.text||!original.explain)throw Error('v122 invalid donor '+id);
 const matches=original.choices.filter(c=>String(c.key)===String(original.correct));
 if(matches.length!==1)throw Error('v122 ambiguous donor answer '+id);
 const correct=matches[0];
 const q={
  text:original.text,
  ans:String(original.correct),
  choices:original.choices,
  ex:original.explain,
  correctLabel:String(original.correctLabel??correct.label),
  correctText:String(original.correctLabel??correct.label),
  sourceTopicId:id,
  templateId:original.templateId||('v122_'+id),
  sig:['g5',id,'live',tier(),original.templateId,original.text,original.correct].join(':')
 };
 // Keep the independent arithmetic plans and family/step annotations intact.
 for(const tag of ['mk5Audit','mk5Pedagogy','mk115','mk116','mk122'])
  if(original[tag])q[tag]=original[tag];
 return q;
}
makeG5Question=function(id){
 if(id===segmentsId){
  const t=tier(),p=family();
  return fromSource(segment(t,p),id);
 }
 if(advancedSet.has(id))return fromDonor(id);
 return originalMake.apply(this,arguments);
};
function fromSource(src,id){
 const correct=src.choices.find(c=>String(c.key)===String(src.correct));
 if(!correct)throw Error('v122 missing geometric answer');
 return {
  text:src.text,ans:String(src.correct),choices:src.choices,ex:src.explain,
  correctLabel:String(correct.label),correctText:String(correct.label),
  sourceTopicId:id,templateId:src.templateId,
  sig:['g5',id,tier(),src.templateId,src.text,src.correct].join(':'),
  mk122:src.mk122
 };
}
window.mkG5V122LiveAdvanced=[...PUBLISHED_ADVANCED,segmentsId];
})();
