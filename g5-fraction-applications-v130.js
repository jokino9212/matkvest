/* MatKvest Grade 5 v130: 5 remaining fraction application topics,
 * 75 separate learner-facing task families with rational plans.
 */
(function(){
'use strict';
if(typeof makeG5Question!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof g5FractionChoices!=='function'||typeof frac!=='function')throw Error('v130 missing Grade 5 dependencies');
const IDS=['frac_division','frac_part_number','frac_div_common','frac_restore','frac_word'];
const covered=new Set(IDS),previous=makeG5Question;
const T=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0)),F=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const rnd=(a,b)=>ri(a,b),gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t}return a};
const Q=(n,d=1)=>['rat',n,d],ADD=(...x)=>['add',...x],SUB=(a,b)=>['sub',a,b],MUL=(a,b)=>['mul',a,b],DIV=(a,b)=>['div',a,b],ABS=x=>['abs',x];
function simplify(n,d){
 if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d<=0)throw Error('v130 invalid fraction '+n+'/'+d);
 const g=gcd(n,d)||1;return {n:n/g,d:d/g};
}
function calculate(node){
 const [op,...v]=node,E=calculate;
 if(op==='rat')return simplify(v[0],v[1]);
 if(op==='add')return v.reduce((sum,x)=>{const q=E(x);return simplify(sum.n*q.d+q.n*sum.d,sum.d*q.d)},simplify(0,1));
 if(op==='sub'){const a=E(v[0]),b=E(v[1]);return simplify(a.n*b.d-b.n*a.d,a.d*b.d)}
 if(op==='mul'){const a=E(v[0]),b=E(v[1]);return simplify(a.n*b.n,a.d*b.d)}
 if(op==='div'){const a=E(v[0]),b=E(v[1]);if(!b.n)throw Error('Division by zero');return simplify(a.n*b.d,a.d*b.n)}
 if(op==='abs'){const a=E(v[0]);return simplify(Math.abs(a.n),a.d)}
 throw Error('v130 unknown rational operation '+op);
}
function show(x){const a=calculate(x);return a.d===1?String(a.n):frac(a.n,a.d)}
function spec(id,t,p){
 const d1=rnd(3,9+t*2),d2=rnd(3,10+t*2),d3=rnd(3,9+t*2);
 const a=rnd(1,d1-1),b=rnd(1,d2-1),c=rnd(1,d3-1),h=rnd(2,6+t*2),k=rnd(2,7+t*2);
 const X=Q(a,d1),Y=Q(b,d2),Z=Q(c,d3),one=Q(1),two=Q(2);
 const total=12*d1*d2*h,part=total*a/d1,classSize=2*rnd(9,16);
 let cases;
 if(id==='frac_division'){
  const n=rnd(3,16+t*7),den=rnd(3,12+t*4),boxes=rnd(2,7+t*3);
  if(t===0)cases=[
   ['Представь частное '+n+' : '+den+' обыкновенной дробью.',Q(n,den),'Числитель — делимое, знаменатель — делитель.',1],
   ['На '+den+' учеников поровну разделили '+n+' пирогов. Сколько пирогов досталось каждому?',Q(n,den),'Разделим количество пирогов на количество учеников.',1],
   ['Запиши деление '+(n+1)+' : '+den+' дробью.',Q(n+1,den),'Деление натуральных чисел можно записать дробной чертой.',1],
   ['Сколько метра приходится на одну часть, если '+n+' м разрезали на '+den+' равных частей?',Q(n,den),'Частное натуральных чисел выражает длину одной части.',2],
   ['Запиши результат деления '+n+' на '+(den+1)+' обыкновенной дробью.',Q(n,den+1),'Результат — дробь с делимым в числителе.',1]
  ];
  else if(t===1)cases=[
   ['Разделили '+n+' и ещё '+boxes+' пирогов поровну на '+den+' учеников. Сколько пирогов каждому?',Q(n+boxes,den),'Сначала общий запас, затем деление.',2],
   ['Из '+(n+boxes)+' метров ленты отрезали '+boxes+' метров, остаток разделили на '+den+' частей. Какова длина части?',Q(n,den),'Сначала вычтем расход, затем разделим остаток.',2],
   ['На '+den+' человек разделили '+n+' л сока и дополнительно '+boxes+' л воды. Сколько литров напитка каждому?',Q(n+boxes,den),'Общий объём поделим поровну.',2],
   ['Вычисли '+n+' : '+den+' + '+boxes+' : '+den+'.',ADD(Q(n,den),Q(boxes,den)),'Два частных записываем дробями с одинаковым знаменателем.',3],
   ['Каждая из '+boxes+' коробок содержала '+n+' конфет. Их разделили поровну между '+den+' людьми. Сколько конфет каждому?',Q(n*boxes,den),'Количество в коробке × число коробок, затем деление.',3]
  ];
  else cases=[
   ['Из '+n+' и '+boxes+' одинаковых пирогов '+(n+boxes)+' пирогов разделили на '+den+' человек. Каждый отдал половину своей доли. Сколько пирога осталось у каждого?',DIV(Q(n+boxes,den),two),'Сложим два запаса, разделим поровну, затем возьмём половину результата.',4],
   [''+n+' м ленты и '+boxes+' м ленты соединили, затем разделили на '+den+' частей, каждую из которых удвоили. Какова длина удвоенной части?',MUL(Q(n+boxes,den),two),'Общая длина, деление на части, удвоение.',4],
   ['В первой группе '+n+' пирогов разделили на '+den+' человек, во второй '+boxes+' пирогов на '+den+' человек. Какова суммарная доля одного участника каждой группы?',ADD(Q(n,den),Q(boxes,den)),'Вычислим два частных и сложим их.',4],
   [''+(n+boxes)+' кг разделили на '+den+' равных упаковок. Из каждой упаковки забрали '+show(Q(boxes,den))+' кг. Сколько осталось в одной?',SUB(Q(n+boxes,den),Q(boxes,den)),'Сначала частное всего запаса, затем вычтем убранную долю.',4],
   ['Сначала '+n+' литров разделили на '+den+' сосудов, затем добавили каждому по '+show(Q(boxes,den))+' л. Сколько литров в каждом?',ADD(Q(n,den),Q(boxes,den)),'Частное, затем прибавим указанную долю.',4]
  ];
 }
 if(id==='frac_part_number'){
  const fraction=Q(a,d1),whole=Q(total),result=Q(part);
  if(t===0)cases=[
   ['Найди '+show(fraction)+' от числа '+total+'.',MUL(whole,fraction),'Разделим число на знаменатель и умножим на числитель.',2],
   ['В школьной библиотеке '+total+' учебников. '+show(fraction)+' из них новые. Сколько новых?',MUL(whole,fraction),'Найдём заданную часть целого.',2],
   ['Из '+total+' яблок '+show(fraction)+' зелёные. Сколько зелёных яблок?',MUL(whole,fraction),'Умножим общее число на долю.',2],
   ['Найди половину от '+(total*2)+' предметов.',MUL(Q(total*2),Q(1,2)),'Половина равна делению на 2.',1],
   ['Найди третью часть от '+(total*3)+' книг.',MUL(Q(total*3),Q(1,3)),'Треть числа равна частному от деления на 3.',1]
  ];
  else if(t===1)cases=[
   ['Из '+total+' игрушек '+show(fraction)+' подарили. Сколько осталось?',SUB(whole,MUL(whole,fraction)),'Найдём подаренную долю, затем вычтем из общего числа.',3],
   ['На склад поступило '+total+' книг. '+show(fraction)+' книг отправили в филиал. На сколько книг различаются число отправленных и число оставшихся?',ABS(SUB(SUB(whole,MUL(whole,fraction)),MUL(whole,fraction))),'Найдём отправленную долю, остаток и положительную разность двух количеств.',4],
   ['Найди '+show(fraction)+' от числа '+total+' и прибавь '+k+'.',ADD(MUL(whole,fraction),Q(k)),'Доля целого, затем прибавление.',3],
   ['В библиотеке '+total+' книг. '+show(fraction)+' отправили в класс, затем ещё '+k+' книг. Сколько всего отправили?',ADD(MUL(whole,fraction),Q(k)),'Сначала дробная часть, затем дополнительное количество.',3],
   ['Найди '+show(fraction)+' от '+total+' и удвой результат.',MUL(MUL(whole,fraction),two),'Найдём часть, затем умножим на 2.',3]
  ];
  else cases=[
   ['В магазине '+total+' товаров. Продали '+show(fraction)+' всех товаров, затем ещё '+k+' товаров. Сколько осталось?',SUB(SUB(whole,MUL(whole,fraction)),Q(k)),'Доля от целого, затем два вычитания.',4],
   ['Найди '+show(fraction)+' от '+total+', затем возьми половину найденного количества.',DIV(MUL(whole,fraction),two),'Находим долю и от неё половину.',4],
   ['Сколько предметов будет, если найти '+show(fraction)+' от '+total+', удвоить и прибавить '+k+'?',ADD(MUL(MUL(whole,fraction),two),Q(k)),'Вычислим часть, удвоим её и прибавим число.',4],
   ['Из '+total+' кг выделили '+show(fraction)+' для первого класса. Для второго столько же. Сколько килограммов выделили вместе?',MUL(MUL(whole,fraction),two),'Два одинаковых дробных количества складываются.',4],
   ['Вычисли разность между целым '+total+' и удвоенным значением '+show(fraction)+' от него по модулю.',ABS(SUB(whole,MUL(MUL(whole,fraction),two))),'Вычислим часть, удвоим и найдём положительную разность.',5]
  ];
 }
 if(id==='frac_div_common'){
  if(t===0)cases=[
   ['Вычисли '+show(X)+' : '+show(Y)+'.',DIV(X,Y),'Умножим первую дробь на дробь, обратную второй.',2],
   ['Найди частное дробей '+show(Y)+' и '+show(X)+'.',DIV(Y,X),'Перевернём делитель и перемножим дроби.',2],
   ['Вычисли '+show(X)+' : '+h+'.',DIV(X,Q(h)),'Деление на натуральное — умножение на обратную дробь.',2],
   ['Вычисли '+show(X)+' : '+show(Z)+'.',DIV(X,Z),'Переведём деление в умножение.',2],
   ['Первый отрезок имеет длину '+show(X)+' м, второй — '+show(Y)+' м. Найди отношение длины первого к длине второго.',DIV(X,Y),'Отношение длин — частное первой величины и второй.',2]
  ];
  else if(t===1)cases=[
   ['Вычисли ('+show(X)+' + '+show(Y)+') : '+show(Z)+'.',DIV(ADD(X,Y),Z),'Сначала сложение, затем деление дробей.',3],
   ['Вычисли '+show(X)+' : ('+show(Y)+' · '+show(Z)+').',DIV(X,MUL(Y,Z)),'Сначала произведение в скобках, затем частное.',3],
   ['Вычисли '+show(X)+' : '+show(Y)+' + '+show(Z)+'.',ADD(DIV(X,Y),Z),'Частное, затем сумма.',3],
   ['Найди частное '+show(X)+' : '+show(Y)+' и умножь его на 2.',MUL(DIV(X,Y),two),'Деление двух дробей, затем удвоение.',3],
   ['Первый отрезок имеет длину '+show(X)+' м, второй — '+show(Y)+' м. Вычисли отношение первой длины ко второй, затем увеличь полученный результат на '+show(Z)+'.',ADD(DIV(X,Y),Z),'Найдём отношение длин и прибавим дополнительную величину.',4]
  ];
  else cases=[
   ['Вычисли ('+show(X)+' + '+show(Y)+') : ('+show(Y)+' · '+show(Z)+').',DIV(ADD(X,Y),MUL(Y,Z)),'Сумма, произведение, затем деление.',5],
   ['Вычисли ('+show(X)+' : '+show(Y)+') · ('+show(Y)+' + '+show(Z)+').',MUL(DIV(X,Y),ADD(Y,Z)),'Частное, сумма и их произведение.',5],
   ['Вычисли '+show(X)+' : '+show(Y)+' + '+show(Y)+' : '+show(Z)+'.',ADD(DIV(X,Y),DIV(Y,Z)),'Два частных и итоговое сложение.',5],
   ['Найди '+show(X)+' : ('+show(Y)+' + '+show(Z)+') и затем удвой.',MUL(DIV(X,ADD(Y,Z)),two),'Сначала сумма делителя, затем частное и удвоение.',5],
   ['Вычисли ('+show(X)+' + '+show(Y)+' + '+show(Z)+') : '+show(Y)+'.',DIV(ADD(X,Y,Z),Y),'Сложим три дроби и разделим на одну из них.',4]
  ];
 }
 if(id==='frac_restore'){
  const known=Q(part),fraction=Q(a,d1),all=Q(total);
  if(t===0)cases=[
   [''+show(fraction)+' числа равны '+part+'. Найди целое.',DIV(known,fraction),'Чтобы найти целое по части, разделим часть на дробь.',2],
   ['Известно, что '+show(fraction)+' запаса составляет '+part+' кг. Сколько килограммов весь запас?',DIV(known,fraction),'Делим массу части на её долю.',2],
   ['Половина школьного туристического отряда — '+(classSize/2)+' детей. Сколько детей в отряде?',DIV(Q(classSize/2),Q(1,2)),'Удвоим известную половину отряда.',2],
   ['Треть запаса — '+(total/3)+' кг. Сколько в запасе?',DIV(Q(total/3),Q(1,3)),'Треть умножаем на 3.',2],
   ['Четверть коллекции — '+(total/4)+' предметов. Сколько предметов всего?',DIV(Q(total/4),Q(1,4)),'Восстановим целое из четверти.',2]
  ];
  else if(t===1)cases=[
   [''+show(fraction)+' целого составляет '+part+'. Найди целое и прибавь '+k+'.',ADD(DIV(known,fraction),Q(k)),'Сначала восстанавливаем целое, затем прибавляем.',3],
   [''+show(fraction)+' количества равны '+part+'. Найди целое, затем вычти '+k+'.',SUB(DIV(known,fraction),Q(k)),'Делим часть на долю и вычитаем число.',3],
   ['После продажи '+show(fraction)+' запаса осталось '+(total-part)+' товаров. Сколько было первоначально?',DIV(Q(total-part),SUB(one,fraction)),'Остаток составляет 1 минус проданная доля.',3],
   [''+show(fraction)+' количества составляют '+part+'. Сколько составляют половина всего количества?',MUL(DIV(known,fraction),Q(1,2)),'Найдём исходное число и его половину.',3],
   [''+show(fraction)+' числа равны '+part+'. Найди число, затем найди четверть этого числа.',MUL(DIV(known,fraction),Q(1,4)),'Восстановим целое, затем найдём четвертую часть.',3]
  ];
  else cases=[
   ['После продажи '+show(fraction)+' всех товаров и ещё '+k+' товаров осталось '+(total-part-k)+'. Сколько товаров было сначала?',DIV(ADD(Q(total-part-k),Q(k)),SUB(one,fraction)),'Сначала отменим вторую продажу, затем восстановим целое по оставшейся доле.',5],
   [''+show(fraction)+' целого равно '+part+'. Восстанови целое и увеличь его на '+k+', затем умножь на 2.',MUL(ADD(DIV(known,fraction),Q(k)),two),'Найдём целое, увеличим и удвоим.',5],
   [''+show(fraction)+' числа равно '+part+'. Найди 3/4 от восстановленного числа.',MUL(DIV(known,fraction),Q(3,4)),'Восстановим целое, затем найдём три четверти.',4],
   ['Известно, что '+show(fraction)+' целого равно '+part+'. Сколько составляет целое, уменьшенное на его треть?',SUB(DIV(known,fraction),MUL(DIV(known,fraction),Q(1,3))),'Вычислим целое и его треть, затем вычтем.',5],
   [''+show(fraction)+' запаса равно '+part+' кг. Найди весь запас, затем вычти '+k+' кг и прибавь '+h+' кг.',ADD(SUB(DIV(known,fraction),Q(k)),Q(h)),'Восстановление целого и два последовательных изменения.',5]
  ];
 }
 if(id==='frac_word'){
  if(t===0)cases=[
   ['На экскурсию прошли '+show(X)+' км и ещё '+show(Y)+' км. Сколько километров прошли?',ADD(X,Y),'Сложим две дробные длины.',2],
   ['Из '+show(ADD(one,X))+' кг сахара использовали '+show(X)+' кг. Сколько осталось?',SUB(ADD(one,X),X),'Вычтем из общего количества расход.',2],
   ['Одна лента длиной '+show(X)+' м, другая '+show(Y)+' м. Найди сумму длин.',ADD(X,Y),'Сумма двух дробей.',2],
   ['Из кувшина с '+show(ADD(one,Y))+' л вылили '+show(Y)+' л. Сколько осталось?',SUB(ADD(one,Y),Y),'Разность объёмов.',2],
   ['Сколько метров в двух одинаковых отрезках длиной '+show(X)+' м?',MUL(X,two),'Два равных отрезка.',2]
  ];
  else if(t===1)cases=[
   ['За три дня прошли '+show(X)+', '+show(Y)+' и '+show(Z)+' км. Найди суммарное расстояние.',ADD(X,Y,Z),'Сложим три дробных расстояния.',3],
   ['На первой полке '+show(X)+' кг, на второй '+show(Y)+' кг. Добавили ещё '+show(Z)+' кг. Сколько всего?',ADD(X,Y,Z),'Три слагаемых с общим знаменателем.',3],
   ['От '+show(ADD(one,X,Y))+' кг отняли '+show(X)+' кг. Сколько осталось?',SUB(ADD(one,X,Y),X),'Вычитание дробной массы.',3],
   ['Два одинаковых пути по '+show(X)+' км и ещё '+show(Y)+' км. Сколько прошли?',ADD(MUL(two,X),Y),'Удваиваем первый путь и прибавляем третий.',3],
   ['Из общей длины '+show(ADD(one,X,Y))+' м отрезали '+show(Y)+' и '+show(X)+' м. Сколько осталось?',SUB(SUB(ADD(one,X,Y),Y),X),'Два последовательных вычитания.',3]
  ];
  else cases=[
   ['В понедельник прошли '+show(X)+' км, во вторник вдвое больше, в среду ещё '+show(Y)+' км. Сколько всего?',ADD(X,MUL(two,X),Y),'Удваиваем один из путей и складываем три величины.',5],
   ['Было '+show(ADD(one,X,Y,Z))+' кг. Потратили '+show(Y)+' и '+show(Z)+' кг, затем купили ещё '+show(X)+' кг. Сколько стало?',ADD(SUB(SUB(ADD(one,X,Y,Z),Y),Z),X),'Два расхода и одно поступление.',5],
   ['Два отрезка длиной '+show(X)+' м и '+show(Y)+' м удвоили, затем добавили третий '+show(Z)+' м. Чему равна общая длина?',ADD(MUL(two,ADD(X,Y)),Z),'Сначала сумма двух, удвоение, затем прибавление.',5],
   ['Из '+show(ADD(one,X,Y))+' кг забрали '+show(X)+' кг, затем половину остатка. Сколько осталось?',DIV(SUB(ADD(one,X,Y),X),two),'Вычислим остаток после первого расхода и половину оставшегося.',4],
   ['На складе '+show(ADD(one,X,Y,Z))+' кг. Забрали '+show(X)+' кг, затем '+show(Y)+' кг и добавили '+show(Z)+' кг. Найди новый запас.',ADD(SUB(SUB(ADD(one,X,Y,Z),X),Y),Z),'Несколько последовательных изменений дробной массы.',5]
  ];
 }
 if(!cases||cases.length!==5)throw Error('v130 incomplete family '+id);
 const [text,plan,explain,steps]=cases[p];
 return {id,t,p,text,plan,explain,steps};
}
function question(id){
 const t=T(),p=F(),d=spec(id,t,p),value=calculate(d.plan);
 if(value.n<0)throw Error('Negative v130 quantity '+id);
 let choices,correct;
 if(value.d===1){choices=g5nums(value.n,[value.n+1,value.n+2,value.n+3]);correct=String(value.n)}
 else{choices=g5FractionChoices(value.n,value.d);correct=value.n+'/'+value.d}
 const q=g5q(d.text,choices,correct,d.explain+' Ответ: '+show(d.plan)+'.','v130_'+id+'_L'+t+'_F'+p);
 const matches=q.choices.filter(x=>String(x.key)===String(q.correct));
 if(matches.length!==1||new Set(q.choices.map(c=>String(c.label))).size!==q.choices.length)throw Error('Invalid fraction answer options '+id+'/'+t+'/'+p);
 return {text:q.text,ans:String(q.correct),choices:q.choices,ex:q.explain,sourceTopicId:id,
  templateId:q.templateId,sig:['g5','v130',id,t,p,q.text,correct].join(':'),
  correctLabel:String(matches[0].label),correctText:String(matches[0].label),
  mk130:{id,t,p,steps:d.steps,plan:d.plan,expected:value}};
}
makeG5Question=function(id){return covered.has(id)?question(id):previous.apply(this,arguments)};
window.mkG5V130Tiered=IDS.slice();
})();
