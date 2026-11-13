/* МатКвест Grade 5 v129 — real progressive ordinary fraction tasks (5 chapters).
 * Exact rational plans. Actual on-screen makeG5Question; classwork fraction rendering.
 */
(function(){
'use strict';
if(typeof makeG5Question!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof frac!=='function'||typeof g5FractionChoices!=='function')throw Error('v129 prerequisites missing');
const TOPICS=['frac_common_lcm','frac_compare_diff','frac_add_diff','frac_sub_diff','frac_mul_common'];
const covered=new Set(TOPICS),oldMake=makeG5Question;
const level=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0)),slot=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const rnd=(a,b)=>ri(a,b);
const gcd=(a,b)=>{while(b){const t=a%b;a=b;b=t}return Math.abs(a)};
const lcm=(a,b)=>a/gcd(a,b)*b;
const V=(n,d=1)=>['v',n,d],A=(...x)=>['add',...x],S=(a,b)=>['sub',a,b],M=(a,b)=>['mul',a,b],ABS=x=>['abs',x];
function rat(n,d){
 if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d<=0)throw Error('v129 invalid rational '+n+'/'+d);
 const g=gcd(Math.abs(n),d)||1;return {n:n/g,d:d/g};
}
function math(tree){
 const [op,...x]=tree;
 if(op==='v')return rat(x[0],x[1]);
 if(op==='add'){let v=rat(0,1);for(const a of x){const y=math(a);v=rat(v.n*y.d+y.n*v.d,v.d*y.d)}return v}
 if(op==='sub'){const a=math(x[0]),b=math(x[1]);return rat(a.n*b.d-b.n*a.d,a.d*b.d)}
 if(op==='mul'){const a=math(x[0]),b=math(x[1]);return rat(a.n*b.n,a.d*b.d)}
 if(op==='abs'){const a=math(x[0]);return rat(Math.abs(a.n),a.d)}
 throw Error('v129 unsupported operation '+op);
}
const shown=t=>{const x=math(t);return x.d===1?String(x.n):frac(x.n,x.d)};
function spec(id,t,p){
 const d1=rnd(3,7+t*2),d2=rnd(4,9+t*2),d3=rnd(3,8+t*2);
 const a=rnd(1,d1-1),b=rnd(1,d2-1),c=rnd(1,d3-1);
 const X=V(a,d1),Y=V(b,d2),Z=V(c,d3),one=V(1,1),two=V(2,1);
 let rows,mode='fraction';
 if(id==='frac_common_lcm'){
  mode='integer';
  const m1=2*rnd(2,5+t),m2=3*rnd(2,5+t),m3=5*rnd(2,4+t);
  const f1=rnd(1,m1-1),f2=rnd(1,m2-1);
  if(t===0)rows=[
   ['Найди наименьший общий знаменатель дробей со знаменателями '+m1+' и '+m2+'.',[m1,m2],'Разложи оба знаменателя на простые множители и найди НОК.',2],
   ['К какому наименьшему общему знаменателю привести '+shown(X)+' и '+shown(Y)+'?',[d1,d2],'Используй наименьшее общее кратное знаменателей.',2],
   ['Найди наименьший общий знаменатель '+frac(1,m1)+' и '+frac(1,m1*2)+'.',[m1,m1*2],'Если один знаменатель кратен другому, берём больший.',2],
   ['Назови наименьший общий знаменатель '+frac(1,3)+' и '+frac(1,5)+'.',[3,5],'Взаимно простые знаменатели перемножаются.',2],
   ['Найди НОК знаменателей '+m2+' и '+m3+'.',[m2,m3],'Составим наименьшее число, делящееся на оба знаменателя.',2]
  ];
  else if(t===1)rows=[
   ['Найди наименьший общий знаменатель трёх дробей со знаменателями '+m1+', '+m2+', '+m3+'.',[m1,m2,m3],'Сначала НОК первых двух, затем с третьим.',3],
   ['Сократи '+frac(2*f1,2*m1)+' и '+frac(3*f2,3*m2)+'. Каков наименьший общий знаменатель сокращённых дробей?',[m1/gcd(f1,m1),m2/gcd(f2,m2)],'Сначала сокращаем каждую дробь, затем ищем НОК новых знаменателей.',3],
   ['Для дробей '+frac(1,m1)+' и '+frac(1,m2)+' нашли общий знаменатель. Добавили дробь '+frac(1,m3)+'. Каков теперь минимальный общий знаменатель?',[m1,m2,m3],'НОК трёх знаменателей.',3],
   ['Наименьший общий знаменатель дробей '+shown(X)+', '+shown(Y)+' и '+shown(Z)+' равен чему?',[d1/gcd(a,d1),d2/gcd(b,d2),d3/gcd(c,d3)],'Если дроби сокращаются, сначала сократим их.',3],
   ['Каков минимальный общий знаменатель для '+frac(1,m1)+' и '+frac(1,2*m2)+'?',[m1,2*m2],'Учтём простой множитель 2 во втором знаменателе.',3]
  ];
  else rows=[
   ['Сократи три дроби '+frac(2*f1,2*m1)+', '+frac(3*f2,3*m2)+' и '+frac(1,m3)+'. Найди наименьший общий знаменатель.',[m1/gcd(f1,m1),m2/gcd(f2,m2),m3],'Три сокращения и НОК полученных знаменателей.',5],
   ['Для '+frac(1,m1)+' и '+frac(1,m2)+' первоначально нашли НОК. Добавили '+frac(1,m3)+'. Найди новый НОК.',[m1,m2,m3],'К двум знаменателям добавлен третий — пересчитаем НОК.',4],
   ['Найди НОК знаменателей дробей '+frac(2,2*m1)+', '+frac(3,3*m2)+', '+frac(5,5*m3)+', предварительно сократив все дроби.',[m1,m2,m3],'Каждую дробь сокращаем, потом последовательно берём НОК.',5],
   ['Две дроби '+frac(1,m1)+' и '+frac(1,m2)+' имеют общий знаменатель. Чтобы прибавить '+frac(1,m3)+', какой минимальный общий знаменатель понадобится?',[m1,m2,m3],'Используем разложение знаменателей на множители.',4],
   ['Сократи дроби '+shown(X)+' и '+shown(Y)+', затем прибавь знаменатель дроби '+shown(Z)+' к перечню знаменателей. Найди их НОК.',[d1/gcd(a,d1),d2/gcd(b,d2),d3/gcd(c,d3)],'Сначала сокращение, затем общий знаменатель трёх дробей.',5]
  ];
  const [text,denoms,ex,steps]=rows[p];
  const result=denoms.reduce((v,x)=>lcm(v,x),1);
  return {id,t,p,mode,denoms,result,text,ex,steps};
 }
 if(id==='frac_compare_diff'){
  mode='sign';
  if(t===0)rows=[
   ['Сравни дроби '+shown(X)+' и '+shown(Y)+'.',X,Y,'Приведи дроби к общему знаменателю.',2],
   ['Поставь знак между '+frac(1,d1)+' и '+frac(1,d2)+'.',V(1,d1),V(1,d2),'При одинаковом числителе больше дробь с меньшим знаменателем.',2],
   ['Сравни '+frac(a,d1)+' и '+frac(a,d1*2)+'.',V(a,d1),V(a,d1*2),'Вторая дробь имеет удвоенный знаменатель.',2],
   ['Сравни дроби '+frac(2*a,2*d1)+' и '+frac(a,d1)+'.',V(2*a,2*d1),V(a,d1),'Сокращение не меняет величину дроби.',2],
   ['Сравни '+shown(Y)+' и '+shown(Z)+'.',Y,Z,'Используй перекрёстное умножение.',2]
  ];
  else if(t===1)rows=[
   ['Сравни суммы '+shown(X)+' + '+shown(Y)+' и '+shown(Y)+' + '+shown(Z)+'.',A(X,Y),A(Y,Z),'Вычислим обе суммы, затем сравним.',3],
   ['Поставь знак между '+shown(X)+' + '+shown(Y)+' и 1.',A(X,Y),one,'Приведём к общему знаменателю и сравним с единицей.',3],
   ['Сравни результаты '+shown(X)+' · 2 и '+shown(Y)+'.',M(X,two),Y,'Удвоим первую дробь и сравним.',3],
   ['Сравни '+shown(X)+' и результат '+shown(Y)+' − '+shown(Z)+'.',X,S(Y,Z),'Сначала выполним вычитание, затем сравнение.',3],
   ['Какой знак между '+shown(X)+' + '+shown(Z)+' и '+shown(Y)+' + '+shown(Z)+'?',A(X,Z),A(Y,Z),'Одинаковое слагаемое можно сократить при сравнении.',3]
  ];
  else rows=[
   ['Сравни выражения '+shown(X)+' + '+shown(Y)+' − '+shown(Z)+' и '+shown(X)+' − '+shown(Y)+' + '+shown(Z)+'.',S(A(X,Y),Z),A(S(X,Y),Z),'Вычислим составные выражения с разными знаками.',5],
   ['Поставь знак между '+shown(X)+' · '+shown(Y)+' и '+shown(Z)+' · '+shown(Y)+'.',M(X,Y),M(Z,Y),'Найдём оба произведения и сравним.',4],
   ['Сравни '+shown(X)+' + '+shown(Y)+' и '+shown(Z)+' + '+shown(Z)+'.',A(X,Y),A(Z,Z),'Две суммы с разными знаменателями.',4],
   ['Сравни '+shown(X)+' − '+shown(Y)+' и '+shown(Z)+' − '+shown(X)+'.',S(X,Y),S(Z,X),'Два вычитания, затем сравнение.',4],
   ['Сравни '+shown(X)+' + '+shown(Y)+' − '+shown(Z)+' и 1.',S(A(X,Y),Z),one,'Сначала вычислим выражение, затем сравним с единицей.',4]
  ];
  const [text,left,right,ex,steps]=rows[p];
  const x=math(left),y=math(right),cmp=Math.sign(x.n*y.d-y.n*x.d);
  return {id,t,p,mode,text,left,right,result:cmp,ex,steps};
 }
 if(id==='frac_add_diff'){
  if(t===0)rows=[
   ['Вычисли '+shown(X)+' + '+shown(Y)+'.',A(X,Y),'Приведём к общему знаменателю и сложим числители.',2],
   ['В одну банку налили '+shown(X)+' л, в другую '+shown(Y)+' л. Сколько литров вместе?',A(X,Y),'Сложим дробные части объёма.',2],
   ['Сумма двух долей '+shown(X)+' и '+shown(Z)+'. Найди её.',A(X,Z),'НОК знаменателей, затем сложение.',2],
   ['Найди '+frac(a,d1)+' + '+frac(1,d2)+'.',A(X,V(1,d2)),'Сложим две дроби с разными знаменателями.',2],
   ['К дроби '+shown(Y)+' прибавь '+shown(X)+'.',A(Y,X),'Сумма не меняется от перестановки слагаемых.',2]
  ];
  else if(t===1)rows=[
   ['Вычисли '+shown(X)+' + '+shown(Y)+' + '+shown(Z)+'.',A(X,Y,Z),'Сложим три дроби с общим знаменателем.',3],
   ['Две части пути '+shown(X)+' км и '+shown(Y)+' км, затем ещё '+shown(Z)+' км. Найди весь путь.',A(X,Y,Z),'Сумма трёх дробных длин.',3],
   ['Известно, что x − '+shown(Y)+' = '+shown(X)+'. Найди x.',A(X,Y),'Применим обратное действие к вычитанию.',3],
   ['Вычисли ('+shown(X)+' + '+shown(Y)+') + '+shown(Z)+'.',A(A(X,Y),Z),'Две последовательные суммы.',3],
   ['Найди '+shown(X)+' + 1 + '+shown(Y)+'.',A(X,one,Y),'Сложим дроби и целую единицу.',3]
  ];
  else rows=[
   ['Вычисли ('+shown(X)+' + '+shown(Y)+') + ('+shown(Z)+' + '+shown(X)+').',A(A(X,Y),A(Z,X)),'Две суммы в скобках, затем итоговая сумма.',5],
   ['В коробку положили '+shown(X)+' кг, затем '+shown(Y)+' кг, а потом ещё '+shown(Z)+' кг и '+shown(X)+' кг. Сколько стало?',A(X,Y,Z,X),'Сложим четыре слагаемых.',4],
   ['Если x − '+shown(Y)+' − '+shown(Z)+' = '+shown(X)+', найди x.',A(X,Y,Z),'Восстановим неизвестное двумя обратными действиями.',4],
   ['Вычисли 2 · ('+shown(X)+' + '+shown(Y)+') + '+shown(Z)+'.',A(M(two,A(X,Y)),Z),'Сумма в скобках, удвоение, добавление третьей дроби.',5],
   ['Найди '+shown(X)+' + '+shown(Y)+' + '+shown(Z)+' + 1.',A(X,Y,Z,one),'Общий знаменатель и четыре слагаемых.',4]
  ];
 }
 if(id==='frac_sub_diff'){
  const large=A(one,X,Y),small=Y;
  if(t===0)rows=[
   ['Вычисли '+shown(large)+' − '+shown(Y)+'.',S(large,Y),'Приведём к общему знаменателю и вычтем.',2],
   ['Из '+shown(A(one,X))+' л жидкости вылили '+shown(X)+' л. Сколько осталось?',S(A(one,X),X),'Вычитаем дробную часть объёма.',2],
   ['Найди разность '+shown(A(X,Y))+' и '+shown(X)+'.',S(A(X,Y),X),'Сначала найдём сумму, затем разность.',2],
   ['От 1 отними '+shown(X)+'.',S(one,X),'Представим 1 как дробь с нужным знаменателем.',2],
   ['Найди '+shown(A(one,Y))+' − '+shown(X)+'.',S(A(one,Y),X),'Приведи к общему знаменателю, затем вычти.',2]
  ];
  else if(t===1)rows=[
   ['Вычисли '+shown(A(one,X,Y))+' − '+shown(Y)+' − '+shown(X)+'.',S(S(A(one,X,Y),Y),X),'Два последовательных вычитания.',3],
   ['Из '+shown(A(one,X,Y,Z))+' кг убрали '+shown(Y)+' и '+shown(Z)+' кг. Сколько осталось?',S(S(A(one,X,Y,Z),Y),Z),'Вычтем две разные дроби по очереди.',3],
   ['Вычисли '+shown(A(one,X))+' − ('+shown(Y)+' − '+shown(Z)+').',S(A(one,X),S(Y,Z)),'Сначала скобки, затем вычитание.',3],
   ['Найди x, если x + '+shown(Y)+' = '+shown(A(one,X,Y))+'.',S(A(one,X,Y),Y),'Неизвестное слагаемое находим вычитанием.',3],
   ['Вычисли '+shown(A(one,X,Y))+' − ('+shown(X)+' + '+shown(Y)+').',S(A(one,X,Y),A(X,Y)),'Сумма в скобках, затем разность.',3]
  ];
  else rows=[
   ['Вычисли '+shown(A(one,X,Y,Z))+' − '+shown(Y)+' − '+shown(Z)+' − '+shown(X)+'.',S(S(S(A(one,X,Y,Z),Y),Z),X),'Три последовательных вычитания.',5],
   ['Из '+shown(A(one,X,Y,Z))+' кг забрали ('+shown(Y)+' + '+shown(Z)+') кг, затем '+shown(X)+' кг. Сколько осталось?',S(S(A(one,X,Y,Z),A(Y,Z)),X),'Сначала сумма расходов, затем два вычитания.',5],
   ['Найди x: x − '+shown(X)+' + '+shown(Y)+' = '+shown(A(one,Y))+'.',S(A(one,Y,X),Y),'Перенесём оба слагаемых обратными действиями.',4],
   ['Вычисли '+shown(A(one,X,Y))+' − '+shown(X)+' − ('+shown(Y)+' − '+shown(Z)+').',S(S(A(one,X,Y),X),S(Y,Z)),'Вычислим внутреннюю разность, затем итог.',5],
   ['Найди разность между '+shown(A(one,X,Y,Z))+' и суммой '+shown(X)+' + '+shown(Y)+'.',S(A(one,X,Y,Z),A(X,Y)),'Сложим два слагаемых и вычтем их из общей величины.',4]
  ];
 }
 if(id==='frac_mul_common'){
  if(t===0)rows=[
   ['Вычисли '+shown(X)+' · '+shown(Y)+'.',M(X,Y),'Умножим числители и знаменатели.',2],
   ['Найди '+shown(X)+' от величины '+shown(Y)+' кг.',M(X,Y),'Найти долю величины — умножить.',2],
   ['Вычисли '+shown(X)+' · '+shown(Z)+'.',M(X,Z),'Сократим общие множители после умножения.',2],
   ['Умножь '+shown(Y)+' на '+shown(X)+'.',M(Y,X),'Произведение не меняется при перестановке множителей.',2],
   ['Прямоугольник со сторонами '+shown(X)+' и '+shown(Y)+' м. Найди площадь в м².',M(X,Y),'Площадь — произведение сторон.',2]
  ];
  else if(t===1)rows=[
   ['Вычисли ('+shown(X)+' + '+shown(Y)+') · '+shown(Z)+'.',M(A(X,Y),Z),'Сначала сумма, затем произведение.',3],
   ['Найди '+shown(X)+' · '+shown(Y)+' + '+shown(Z)+'.',A(M(X,Y),Z),'Умножение выполняем до сложения.',3],
   ['От величины '+shown(A(one,X))+' кг взяли '+shown(Y)+' часть. Сколько килограммов взяли?',M(A(one,X),Y),'Умножим величину на указанную долю.',3],
   ['Найди произведение трёх дробей '+shown(X)+', '+shown(Y)+', '+shown(Z)+'.',M(M(X,Y),Z),'Последовательно перемножим три дроби.',3],
   ['Найди '+shown(X)+' · 2 + '+shown(Y)+'.',A(M(X,two),Y),'Сначала удвоим, затем прибавим дробь.',3]
  ];
  else rows=[
   ['Вычисли ('+shown(X)+' + '+shown(Y)+') · ('+shown(Z)+' + '+shown(X)+').',M(A(X,Y),A(Z,X)),'Две суммы и их произведение.',5],
   ['Вычисли '+shown(X)+' · '+shown(Y)+' + '+shown(Y)+' · '+shown(Z)+'.',A(M(X,Y),M(Y,Z)),'Два произведения, затем сумма.',5],
   ['Найди '+shown(X)+' · ('+shown(Y)+' + '+shown(Z)+') · 2.',M(M(X,A(Y,Z)),two),'Сумма, затем два последовательных умножения.',5],
   ['Найди площадь прямоугольника: одну сторону '+shown(X)+' м увеличили на '+shown(Y)+' м, вторую сторону '+shown(Z)+' м оставили. Чему равна площадь?',M(A(X,Y),Z),'Сначала новая длина, затем площадь.',5],
   ['Вычисли ('+shown(X)+' · '+shown(Y)+') · ('+shown(Z)+' + 1).',M(M(X,Y),A(Z,one)),'Два множителя, скобки, составное произведение.',5]
  ];
 }
 if(!rows||rows.length!==5)throw Error('v129 missing family '+id);
 const [text,plan,ex,steps]=rows[p];
 return {id,t,p,mode:'fraction',text,plan,ex,steps};
}
function build(id){
 const t=level(),p=slot(),d=spec(id,t,p);
 let answers,correct,expected;
 if(d.mode==='integer'){
  expected=d.result;
  answers=g5nums(expected,[expected+1,expected+2,expected+3]);
  correct=String(expected);
 }else if(d.mode==='sign'){
  expected=d.result;
  answers=[{label:'<',key:'lt'},{label:'=',key:'eq'},{label:'>',key:'gt'}];
  correct=expected<0?'lt':expected>0?'gt':'eq';
 }else{
  const value=math(d.plan);
  // Integer-valued fractions are displayed as integers, not malformed 1/1 widgets.
  expected=value;
  if(value.n<0)throw Error('v129 negative fraction '+id+'/'+t+'/'+p);
  if(value.d===1){answers=g5nums(value.n,[value.n+1,value.n+2,value.n+3]);correct=String(value.n)}
  else{answers=g5FractionChoices(value.n,value.d);correct=value.n+'/'+value.d}
 }
 const q=g5q(d.text,answers,correct,d.ex+' Ответ: '+(d.mode==='sign'?(expected<0?'<':expected>0?'>':'='):d.mode==='integer'?String(expected):shown(d.plan))+'.','v129_'+id+'_L'+t+'_F'+p);
 const matching=q.choices.filter(x=>String(x.key)===String(q.correct));
 if(matching.length!==1||new Set(q.choices.map(x=>String(x.label))).size!==q.choices.length)throw Error('v129 ambiguous answer '+id+'/'+t+'/'+p);
 return {text:q.text,choices:q.choices,ans:String(q.correct),ex:q.explain,
  sourceTopicId:id,templateId:q.templateId,sig:['g5',id,'v129',t,p,d.text,correct].join(':'),
  correctLabel:String(matching[0].label),correctText:String(matching[0].label),
  mk129:{id,t,p,mode:d.mode,steps:d.steps,plan:d.plan||null,denoms:d.denoms||null,
   left:d.left||null,right:d.right||null,result:d.mode==='sign'||d.mode==='integer'?expected:null,
   expectedRational:d.mode==='fraction'?expected:null}};
}
makeG5Question=function(id){return covered.has(id)?build(id):oldMake.apply(this,arguments)};
window.mkG5V129Tiered=TOPICS.slice();
})();
