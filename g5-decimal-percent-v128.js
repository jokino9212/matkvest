/* MatKvest Grade 5 v128: decimal × decimal, decimal : decimal,
 * decimal to ordinary fraction, percent, base from percent, arithmetic mean.
 * Real question dispatch, distinct 5 families × 3 stages per topic.
 * Exact thousandth arithmetic, no floating-point answer computation.
 */
(function(){
'use strict';
if(typeof makeG5Question!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof g5FractionChoices!=='function')
 throw Error('v128 Grade 5 decimal/fraction choice dependencies unavailable');
const TOPICS=['dec_mul_dec','dec_div_dec','dec_to_common','percent','percent_whole','average'];
const available=new Set(TOPICS),previous=makeG5Question;
const L=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0)),F=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const r=(a,b)=>ri(a,b);
const V=n=>['v',n],A=(...x)=>['add',...x],S=(a,b)=>['sub',a,b],M=(a,k)=>['mulNat',a,k],
 D=(a,k)=>['divNat',a,k],MD=(a,b)=>['mulDec',a,b],DD=(a,b)=>['divDec',a,b],P=(a,p)=>['percent',a,p],AVG=(...x)=>['average',...x],Abs=(a,b)=>['abs',S(a,b)];
function oracle(node){
 const [op,...v]=node,E=oracle;
 if(op==='v')return v[0];
 if(op==='add')return v.reduce((a,x)=>a+E(x),0);
 if(op==='sub')return E(v[0])-E(v[1]);
 if(op==='mulNat')return E(v[0])*v[1];
 if(op==='divNat'){const a=E(v[0]),b=v[1];if(!b||a%b)throw Error('v128 noninteger division');return a/b;}
 if(op==='mulDec'){const prod=E(v[0])*E(v[1]);if(prod%1000)throw Error('v128 fractional thousandth product');return prod/1000;}
 if(op==='divDec'){const a=E(v[0])*1000,b=E(v[1]);if(!b||a%b)throw Error('v128 nonterminating quotient');return a/b;}
 if(op==='percent'){const a=E(v[0])*v[1];if(a%100)throw Error('v128 noninteger percent');return a/100;}
 if(op==='average'){const a=v.reduce((s,x)=>s+E(x),0);if(a%v.length)throw Error('v128 noninteger average');return a/v.length;}
 if(op==='abs')return Math.abs(E(v[0]));
 throw Error('v128 unknown operation '+op);
}
function f(n){
 if(!Number.isSafeInteger(n)||n<0)throw Error('Unsafe decimal representation '+n);
 const whole=Math.floor(n/1000),fraction=String(n%1000).padStart(3,'0').replace(/0+$/,'');
 return fraction?whole+','+fraction:String(whole);
}
function gcd(a,b){while(b){const r=a%b;a=b;b=r}return a}
function expression(id,t,p){
 const a=r(2,8+t*2),b=r(2,8+t*2),c=r(2,7+t*2),d=r(2,6+t*2),e=r(2,5+t*2),k=r(2,6+t*2);
 let rows;
 if(id==='dec_mul_dec'){
  const X=a*100,Y=b*100,Z=c*10,Q=(a+2)*100;
  const product=(x,y)=>x*y/1000;
  if(t===0)rows=[
   ['Вычисли '+f(X)+' · '+f(Y)+'.',MD(V(X),V(Y)),'Умножаем дроби как целые, затем отсчитываем суммарное число десятичных знаков.',1,'dec'],
   ['Найди произведение '+f(X)+' и '+f(Z)+'.',MD(V(X),V(Z)),'Одна цифра после запятой у первого множителя и две у второго.',2,'dec'],
   ['Площадь прямоугольника со сторонами '+f(X)+' м и '+f(Y)+' м. Найди площадь в м².',MD(V(X),V(Y)),'Площадь равна произведению длин сторон.',2,'dec'],
   ['Площадь основания прямоугольного параллелепипеда '+f(Q)+' см², высота '+f(Y)+' см. Найди объём в см³.',MD(V(Q),V(Y)),'Объём равен площади основания, умноженной на высоту.',2,'dec'],
   ['Длина второго отрезка составляет '+f(Y)+' длины первого отрезка '+f(Z)+' м. Какова длина второго?',MD(V(Z),V(Y)),'Длину первого отрезка умножим на десятичный коэффициент.',2,'dec']
  ];
  else if(t===1)rows=[
   ['Вычисли ('+f(X)+' + '+f(Y)+') · '+f(Z)+'.',MD(A(V(X),V(Y)),V(Z)),'Сначала сумма дробей, затем умножение на десятичную.',2,'dec'],
   ['Вычисли '+f(X)+' · '+f(Y)+' + '+f(Z)+'.',A(MD(V(X),V(Y)),V(Z)),'Произведение перед сложением.',2,'dec'],
   ['Две площади: '+f(X)+' · '+f(Y)+' и '+f(Z)+' · '+f(Q)+'. Найди их сумму.',A(MD(V(X),V(Y)),MD(V(Z),V(Q))),'Вычислим произведения отдельно, затем сложим.',3,'dec'],
   ['Вычисли ('+f(Q)+' − '+f(X)+') · '+f(Y)+'.',MD(S(V(Q),V(X)),V(Y)),'Вычислим разность и умножим на вторую дробь.',2,'dec'],
   ['Если прямоугольник '+f(X)+'×'+f(Y)+' м сделать длиннее на '+f(Z)+' м, какой станет площадь?',MD(A(V(X),V(Z)),V(Y)),'Новую длину умножим на ширину.',2,'dec']
  ];
  else rows=[
   ['Найди разность произведений ('+f(X)+' + '+f(Y)+') · '+f(Q)+' и '+f(Z)+' · '+f(Y)+'.',S(MD(A(V(X),V(Y)),V(Q)),MD(V(Z),V(Y))),'Сумма, два умножения, затем вычитание.',4,'dec'],
   ['Площадь прямоугольника '+f(Q)+'×'+f(Y)+' м. Длину увеличили на '+f(X)+', ширину — на '+f(Z)+' м. На сколько м² выросла площадь?',S(MD(A(V(Q),V(X)),A(V(Y),V(Z))),MD(V(Q),V(Y))),'Сначала новую площадь, затем исходную и их разность.',5,'dec'],
   ['Вычисли ('+f(Q)+' + '+f(X)+') · ('+f(Y)+' + '+f(Z)+') − '+f(X)+' · '+f(Y)+'.',S(MD(A(V(Q),V(X)),A(V(Y),V(Z))),MD(V(X),V(Y))),'Две суммы, два произведения и разность.',5,'dec'],
   ['Число x умножили на '+f(Y)+' и получили '+f(product(X,Y))+'. Найди x, затем умножь его на '+f(Q)+'.',MD(DD(V(product(X,Y)),V(Y)),V(Q)),'Обратным делением восстановим x и умножим на новое число.',4,'dec'],
   ['К произведению '+f(X)+' · '+f(Y)+' прибавили произведение '+f(Z)+' · '+f(Q)+' и ещё '+f(Z)+'. Найди ответ.',A(MD(V(X),V(Y)),MD(V(Z),V(Q)),V(Z)),'Два умножения, сумма и разность.',4,'dec']
  ];
 }
 if(id==='dec_div_dec'){
  const quotient=a*100,divisor=b*10,dividend=quotient*divisor/1000;
  const quotient2=c*100,divisor2=d*10,dividend2=quotient2*divisor2/1000;
  if(t===0)rows=[
   ['Вычисли '+f(dividend)+' : '+f(divisor)+'.',DD(V(dividend),V(divisor)),'Умножим делимое и делитель на одинаковую разрядную единицу, затем разделим.',1,'dec'],
   ['Длина '+f(a*divisor)+' м состоит из отрезков по '+f(divisor)+' м. Сколько целых отрезков?',DD(V(a*divisor),V(divisor)),'Разделим общую длину на длину одного отрезка.',2,'dec'],
   ['Найди частное '+f(dividend2)+' и '+f(divisor2)+'.',DD(V(dividend2),V(divisor2)),'Чтобы делитель стал целым, перенесём запятую в обоих числах.',1,'dec'],
   ['Вычисли '+f(dividend)+' : '+f(divisor)+' и увеличь результат в 2 раза.',M(DD(V(dividend),V(divisor)),2),'Деление и умножение на натуральное число.',2,'dec'],
   ['Сколько полных отрезков по '+f(divisor)+' м получится из '+f(a*divisor*2)+' м?',DD(V(a*divisor*2),V(divisor)),'Деление на десятичную дробь.',2,'dec']
  ];
  else if(t===1)rows=[
   ['Вычисли '+f(dividend)+' : '+f(divisor)+' + '+f(dividend2)+' : '+f(divisor2)+'.',A(DD(V(dividend),V(divisor)),DD(V(dividend2),V(divisor2))),'Два десятичных частных, затем их сумма.',3,'dec'],
   ['Найди разницу частных '+f(dividend)+' : '+f(divisor)+' и '+f(dividend2)+' : '+f(divisor2)+'.',Abs(DD(V(dividend),V(divisor)),DD(V(dividend2),V(divisor2))),'Вычислим оба частных и положительную разность.',3,'dec'],
   ['После деления '+f(dividend)+' на '+f(divisor)+' прибавили '+f(c*100)+'. Найди результат.',A(DD(V(dividend),V(divisor)),V(c*100)),'Деление с запятой и сложение.',2,'dec'],
   ['Число x разделили на '+f(divisor)+' и получили '+f(quotient)+'. Найди x.',MD(DD(V(dividend),V(divisor)),V(divisor)),'Умножим частное на делитель.',2,'dec'],
   ['Два одинаковых отрезка по '+f(a*divisor)+' м разделили на части длиной '+f(divisor)+' м. Сколько целых частей всего?',M(DD(V(a*divisor),V(divisor)),2),'Число частей на одном отрезке умножим на два.',3,'dec']
  ];
  else rows=[
   ['Вычисли ('+f(dividend)+' + '+f(dividend*2)+') : '+f(divisor)+'.',DD(A(V(dividend),V(dividend*2)),V(divisor)),'Сложим два делимых, затем разделим на десятичный делитель.',4,'dec'],
   ['Из суммы результатов делений '+f(dividend)+' : '+f(divisor)+' и '+f(dividend2)+' : '+f(divisor2)+' вычли '+f(c*100)+'. Найди итог.',S(A(DD(V(dividend),V(divisor)),DD(V(dividend2),V(divisor2))),V(c*100)),'Два деления, сложение и вычитание.',4,'dec'],
   ['Найди положительную разницу частных ('+f(dividend*2)+' : '+f(divisor)+') и ('+f(dividend2)+' : '+f(divisor2)+').',Abs(DD(V(dividend*2),V(divisor)),DD(V(dividend2),V(divisor2))),'Два частных и разность.',3,'dec'],
   ['Число x умножили на '+f(divisor)+', прибавили '+f(dividend2)+' и получили '+f(dividend+dividend2)+'. Найди x.',DD(S(V(dividend+dividend2),V(dividend2)),V(divisor)),'Вычтем прибавленное число и разделим на десятичный множитель.',3,'dec'],
   ['Найди значение ('+f(dividend*3)+' : '+f(divisor)+') + ('+f(dividend2*2)+' : '+f(divisor2)+').',A(DD(V(dividend*3),V(divisor)),DD(V(dividend2*2),V(divisor2))),'Вычислим оба частных и сложим.',4,'dec']
  ];
 }
 if(id==='dec_to_common'){
  const cf=r(1,9),x=a*100+b*10+cf, y=b*100+c*10+cf,whole=1000+x,twice=2*x;
  if(t===0)rows=[
   ['Запиши десятичную дробь '+f(a*100)+' несократимой обыкновенной дробью.',V(a*100),'Любая десятая — дробь со знаменателем 10.',1,'frac'],
   ['Запиши '+f(b*10)+' несократимой обыкновенной дробью.',V(b*10),'Сотые записываются со знаменателем 100 и сокращаются при необходимости.',1,'frac'],
   ['Запиши '+f(c)+' обыкновенной дробью.',V(c),'Тысячные записываются со знаменателем 1000.',1,'frac'],
   ['Представь '+f(x)+' несократимой обыкновенной дробью.',V(x),'Запишем тысячи долей и сократим дробь.',2,'frac'],
   ['Представь '+f(1000+a*100)+' неправильной обыкновенной дробью.',V(1000+a*100),'Целая часть превращается в 10 десятых, затем прибавим оставшиеся десятые.',2,'frac']
  ];
  else if(t===1)rows=[
   ['Преврати '+f(whole)+' в несократимую обыкновенную дробь.',V(whole),'Переведём целое и дробную часть в тысячные, затем сократим.',2,'frac'],
   ['Запиши '+f(y)+' как несократимую обыкновенную дробь.',V(y),'Сначала знаменатель 1000, затем сокращение.',2,'frac'],
   ['Сложи '+f(a*100)+', '+f(b*10)+' и '+f(cf)+', запиши сумму несократимой обыкновенной дробью.',A(V(a*100),V(b*10),V(cf)),'Сложим десятичные дроби, затем переведём в обыкновенную.',3,'frac'],
   ['Найди разность '+f(whole)+' и 1; вырази её несократимой обыкновенной дробью.',S(V(whole),V(1000)),'Сначала вычтем целую единицу, затем сократим.',3,'frac'],
   ['Запиши число '+f(2000+x)+' несократимой неправильной обыкновенной дробью.',V(2000+x),'Приведём всю величину к тысячным и сократим.',3,'frac']
  ];
  else rows=[
   ['Вычисли '+f(x)+' + '+f(b*10)+' и представь результат несократимой обыкновенной дробью.',A(V(x),V(b*10)),'Сумма десятичных дробей → тысячные → сокращение.',3,'frac'],
   ['Вычисли '+f(whole)+' − '+f(b*10)+' и переведи ответ в обыкновенную дробь.',S(V(whole),V(b*10)),'Вычитаем, затем сокращаем полученную дробь.',3,'frac'],
   ['Вычисли '+f(x)+' · 2 и запиши результат обыкновенной несократимой дробью.',M(V(x),2),'Удвоим десятичную дробь и сократим дробь со знаменателем 1000.',3,'frac'],
   ['От '+f(2000+x)+' вычли '+f(1000+a*100)+'. Запиши остаток как несократимую обыкновенную дробь.',S(V(2000+x),V(1000+a*100)),'Два действия: вычитание смешанных чисел и сокращение.',4,'frac'],
   ['Найди сумму '+f(x)+' и '+f(y)+' − '+f(b*10)+' + 0,001. Ответ запиши несократимой обыкновенной дробью.',A(S(A(V(x),V(y)),V(b*10)),V(1)),'Сначала сумма, затем вычитание и сокращение.',4,'frac']
  ];
 }
 if(id==='percent'){
  const base=100*(a+b),half=base/2;
  if(t===0)rows=[
   ['Найди 10% от числа '+base+'.',P(V(base),10),'10% — это одна десятая числа.',1,'int'],
   ['На складе '+base+' товаров. Четверть товаров отправили в магазин. Сколько товаров отправили?',P(V(base),25),'Четверть количества составляет 25%; разделим на 4.',2,'int'],
   ['В резервуаре '+base+' л воды. Израсходовали половину объёма. Сколько литров израсходовали?',P(V(base),50),'Половина — это 50% исходного объёма.',2,'int'],
   ['В банке хранилось '+base+' руб. Пять процентов суммы потратили. Сколько рублей потратили?',P(V(base),5),'5% — одна двадцатая исходной суммы.',2,'int'],
   ['Под клумбу выделили 1% участка площадью '+base+' м². Сколько квадратных метров занимает клумба?',P(V(base),1),'Один процент — это одна сотая всей площади.',2,'int']
  ];
  else if(t===1)rows=[
   ['Найди 15% от '+base+'.',P(V(base),15),'15% = 10% + 5%.',2,'int'],
   ['На складе '+base+' кг. Продали 20%. Сколько килограммов продали?',P(V(base),20),'20% — пятая часть.',2,'int'],
   ['Из '+base+' учеников 30% занимаются спортом. Сколько учеников?',P(V(base),30),'Находим тридцать сотых исходного числа.',2,'int'],
   ['К цене '+base+' руб. применили скидку 10%. На сколько рублей уменьшилась цена?',P(V(base),10),'Стоимость скидки составляет 10% первоначальной цены.',2,'int'],
   ['К числу '+base+' прибавили 10% этого числа. Сколько получилось?',A(V(base),P(V(base),10)),'Найдём 10% и прибавим к исходному.',3,'int']
  ];
  else rows=[
   ['Из '+base+' книг 25% выдали в понедельник и ещё 10% во вторник. Сколько книг осталось?',S(S(V(base),P(V(base),25)),P(V(base),10)),'Вычислим две доли исходного количества и вычтем их.',4,'int'],
   ['Цена '+base+' руб. выросла на 20%, затем снизилась на 10% от новой цены. Найди итоговую цену.',S(A(V(base),P(V(base),20)),P(A(V(base),P(V(base),20)),10)),'Проценты во втором действии считаем от новой цены.',5,'int'],
   ['Было '+base+' учеников. 30% участвовали в первом конкурсе, 25% во втором. Сколько участвовали в двух конкурсах суммарно, если никто не участвовал дважды?',A(P(V(base),30),P(V(base),25)),'Обе доли считаются от исходного количества.',4,'int'],
   ['В магазин привезли '+base+' товаров, продали 20%, затем продали 25% от оставшегося. Сколько товаров осталось?',S(S(V(base),P(V(base),20)),P(S(V(base),P(V(base),20)),25)),'Второй процент берётся от остатка, не от первоначального числа.',5,'int'],
   ['Сначала число '+base+' увеличили на 10%, потом на 20% от получившегося. На сколько оно выросло по сравнению с исходным?',S(A(A(V(base),P(V(base),10)),P(A(V(base),P(V(base),10)),20)),V(base)),'Применим проценты последовательно, затем вычислим общий прирост.',5,'int']
  ];
 }
 if(id==='percent_whole'){
  const total=100*(a+b),ten=total/10,twenty=total/5,quarter=total/4;
  if(t===0)rows=[
   ['10% числа равны '+ten+'. Найди всё число.',M(V(ten),10),'Всё число в 10 раз больше своих 10%.',1,'int'],
   ['Четверть партии составляет '+quarter+' товаров. Сколько товаров во всей партии?',M(V(quarter),4),'Четверть умножим на 4, чтобы восстановить целое.',2,'int'],
   ['Половина урожая составляет '+(total/2)+' кг. Сколько килограммов собрали всего?',M(V(total/2),2),'Удвоим известную половину урожая.',2,'int'],
   ['В библиотеке учебники составляют 20% всех книг. Учебников '+twenty+'. Сколько книг всего?',M(V(twenty),5),'20% — одна пятая; умножим количество учебников на 5.',2,'int'],
   ['Пять процентов площади участка составляют '+(total/20)+' м². Найди площадь всего участка.',M(V(total/20),20),'Умножим площадь одной двадцатой части на 20.',2,'int']
  ];
  else if(t===1)rows=[
   ['15% числа равны '+(total*15/100)+'. Найди исходное число.',D(M(V(total*15/100),100),15),'Разделим часть на 15, получим 1%, затем умножим на 100.',3,'int'],
   ['После скидки 20% товар стоит '+(total*80/100)+' руб. Какова была цена?',D(M(V(total*80/100),100),80),'Новая цена — 80% исходной.',3,'int'],
   ['30% количества составляют '+(total*30/100)+' предметов. Сколько было предметов?',D(M(V(total*30/100),100),30),'Находим один процент и всё количество.',3,'int'],
   ['75% числа равны '+(total*75/100)+'. Найди исходное число.',D(M(V(total*75/100),100),75),'Восстановление целого по его доле.',3,'int'],
   ['В классе 40% учеников — '+(total*40/100)+' человек. Сколько учеников всего?',D(M(V(total*40/100),100),40),'Составим соотношение часть/целое × 100.',3,'int']
  ];
  else rows=[
   ['После увеличения цены на 20% товар стоит '+(total*120/100)+' руб. Найди старую цену.',D(M(V(total*120/100),100),120),'Новая цена равна 120% первоначальной.',3,'int'],
   ['В магазине продали 25% товара, осталось '+(total*75/100)+' единиц. Сколько единиц было изначально?',D(M(V(total*75/100),100),75),'Осталось 75%, восстановим весь запас.',3,'int'],
   ['Сначала продали 20% товаров, затем половину оставшихся. Осталось '+(total*40/100)+' товаров. Сколько было сначала?',D(M(V(total*40/100),100),40),'После двух продаж осталось 40% первоначального количества.',4,'int'],
   ['После скидки 10%, а затем ещё скидки 20% итоговая цена '+(total*72/100)+' руб. Найди первоначальную цену.',D(M(V(total*72/100),100),72),'Осталось 0,9 · 0,8 = 0,72 первоначальной цены.',5,'int'],
   ['К количеству прибавили 25% и получили '+(total*125/100)+' предметов. Найди начальное количество.',D(M(V(total*125/100),100),125),'Результат — 125% исходного.',3,'int']
  ];
 }
 if(id==='average'){
  const mean=20*(a+b+c),diff=5*c,one=mean-diff,two=mean+diff,n1=mean-diff,n2=mean,n3=mean+diff;
  if(t===0)rows=[
   ['Найди среднее арифметическое чисел '+one+' и '+two+'.',AVG(V(one),V(two)),'Сложим два числа и разделим на 2.',2,'int'],
   ['Среднее арифметическое '+n1+', '+n2+', '+n3+' равно чему?',AVG(V(n1),V(n2),V(n3)),'Сумма трёх чисел делится на 3.',2,'int'],
   ['Два измерения: '+(mean-2*diff)+' и '+(mean+2*diff)+'. Найди среднее.',AVG(V(mean-2*diff),V(mean+2*diff)),'Сумму делим на количество измерений.',2,'int'],
   ['Каково среднее арифметическое '+mean+' и '+mean+'?',AVG(V(mean),V(mean)),'Среднее двух равных чисел равно этому числу.',1,'int'],
   ['Найди среднее из четырёх чисел: '+(mean-diff)+', '+(mean+diff)+', '+mean+', '+mean+'.',AVG(V(mean-diff),V(mean+diff),V(mean),V(mean)),'Складываем четыре числа и делим на 4.',2,'int']
  ];
  else if(t===1)rows=[
   ['Среднее трёх чисел '+(mean-diff)+', '+mean+' и x равно '+mean+'. Найди x.',S(M(V(mean),3),A(V(mean-diff),V(mean))),'Сумма трёх равна утроенному среднему, вычтем два известных.',3,'int'],
   ['За три дня собрали '+(mean-diff)+', '+mean+' и '+(mean+diff)+' кг. На сколько средний дневной сбор выше первого дня?',S(AVG(V(mean-diff),V(mean),V(mean+diff)),V(mean-diff)),'Сначала среднее, затем разница.',3,'int'],
   ['Среднее четырёх чисел '+(mean-diff)+', '+(mean+diff)+', '+(mean-diff)+' и '+(mean+diff)+' равно чему?',AVG(V(mean-diff),V(mean+diff),V(mean-diff),V(mean+diff)),'Сумму четырёх разделим на 4.',2,'int'],
   ['Среднее двух чисел '+(mean-diff)+' и '+(mean+diff)+' увеличили на '+c+'. Найди итог.',A(AVG(V(mean-diff),V(mean+diff)),V(c)),'Среднее сначала, увеличение затем.',3,'int'],
   ['Среднее трёх чисел '+n1+', '+n2+', '+n3+' уменьшили на '+d+'. Сколько получилось?',S(AVG(V(n1),V(n2),V(n3)),V(d)),'Сначала среднее, затем вычитание.',3,'int']
  ];
  else rows=[
   ['Среднее четырёх чисел равно '+mean+'. Три из них равны '+(mean-diff)+', '+mean+' и '+(mean+diff)+'. Найди четвёртое.',S(M(V(mean),4),A(V(mean-diff),V(mean),V(mean+diff))),'Общая сумма равна 4·среднее, вычтем три известных.',4,'int'],
   ['Среднее трёх величин '+(mean-diff)+', '+mean+', '+(mean+diff)+' увеличили на '+c+', затем уменьшили на '+d+'. Найди результат.',S(A(AVG(V(mean-diff),V(mean),V(mean+diff)),V(c)),V(d)),'Вычислим среднее и применим два изменения.',4,'int'],
   ['В первой группе два числа '+(mean-diff)+' и '+(mean+diff)+', во второй три числа '+(mean-diff)+', '+mean+' и '+(mean+diff)+'. Найди среднее всех пяти.',AVG(V(mean-diff),V(mean+diff),V(mean-diff),V(mean),V(mean+diff)),'Сумму всех пяти делим на 5, не усредняем два отдельных средних.',4,'int'],
   ['Среднее четырёх чисел '+(mean-diff)+', '+(mean+diff)+', '+(mean-diff)+' и x равно '+mean+'. Найди x.',S(M(V(mean),4),A(V(mean-diff),V(mean+diff),V(mean-diff))),'Восстановим сумму четырёх и вычтем три известных.',4,'int'],
   ['После добавления пятого числа '+mean+' к четырём значениям '+(mean-diff)+', '+(mean+diff)+', '+mean+', '+mean+' каким станет среднее?',AVG(V(mean-diff),V(mean+diff),V(mean),V(mean),V(mean)),'Сложим пять величин и разделим на их число.',4,'int']
  ];
 }
 if(!rows||rows.length!==5)throw Error('v128 missing topic '+id+' stage '+t);
 const [text,plan,explain,steps,mode]=rows[p];
 return {id,t,p,text,plan,explain,steps,mode};
}
function build(id){
 const t=L(),p=F(),data=expression(id,t,p),value=oracle(data.plan);
 if(!Number.isSafeInteger(value)||value<0||value>1000000000)throw Error('v128 invalid answer '+id+'/'+t+'/'+p+' '+value);
 let options,answer,visible,expectedFraction=null;
 if(data.mode==='frac'){
  const g=gcd(value,1000),n=value/g,d=1000/g;
  if(d<2)throw Error('v128 unexpected integer in decimal-to-fraction conversion '+id+'/'+t+'/'+p);
  options=g5FractionChoices(n,d);
  answer=n+'/'+d;visible=answer;
  expectedFraction={n,d};
 }else{
  answer=data.mode==='int'?value:Number((value/1000).toFixed(3));
  visible=data.mode==='int'?String(value):f(value);
  const extra=data.mode==='int'?[answer+1,answer+2,answer+3]:[
   Number(((value+10)/1000).toFixed(3)),Number(((value+100)/1000).toFixed(3)),Number(((value+1000)/1000).toFixed(3))];
  options=g5nums(answer,extra);answer=String(answer);
 }
 const q=g5q(data.text,options,String(answer),data.explain+' Ответ: '+visible+'.','v128_'+id+'_L'+t+'_F'+p);
 const right=q.choices.filter(c=>String(c.key)===String(q.correct));
 if(right.length!==1||new Set(q.choices.map(c=>String(c.label))).size!==q.choices.length)throw Error('v128 ambiguous answers '+id+'/'+t+'/'+p);
 return {text:q.text,ans:String(q.correct),choices:q.choices,ex:q.explain,
  correctText:String(right[0].label),correctLabel:String(right[0].label),sourceTopicId:id,
  templateId:q.templateId,sig:['g5',id,'v128',t,p,q.text,answer].join(':'),
  mk128:{id,t,p,steps:data.steps,plan:data.plan,mode:data.mode,
   expectedInt:data.mode==='int'?value:null,expectedMilli:data.mode==='dec'?value:null,expectedFraction}};
}
makeG5Question=function(id){return available.has(id)?build(id):previous.apply(this,arguments)};
window.mkG5V128Tiered=TOPICS.slice();
})();
