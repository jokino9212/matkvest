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
  const x=r(15,99)*100,y=r(12,89)*100,u=r(1,9)*10,v=r(11,48)*100;
  const factor=(n)=>f(n).split(',')[1]?.length||0;
  const value=(a,b)=>a*b/1000;
  const mul=(a,b)=>f(a)+' · '+f(b)+' = '+f(value(a,b));
  const plus=(a,b)=>f(a)+' + '+f(b)+' = '+f(a+b);
  const minus=(a,b)=>f(a)+' − '+f(b)+' = '+f(a-b);
  const explain=(a,b)=>{
   const m=factor(a),n=factor(b),first=a*10**m/1000,second=b*10**n/1000;
   return 'Без запятых: '+first+' · '+second+' = '+first*second+'. После запятой всего '+m+' + '+n+' = '+(m+n)+' знаков. Записываем '+mul(a,b)+'.';
  };
  if(t===0)rows=[
   ['Вычисли '+f(x)+' · '+f(y)+'.',MD(V(x),V(y)),explain(x,y),1,'dec'],
   ['Найди произведение '+f(x)+' и '+f(u)+'.',MD(V(x),V(u)),explain(x,u),2,'dec'],
   ['Площадь прямоугольника со сторонами '+f(x)+' м и '+f(y)+' м. Найди площадь в м².',MD(V(x),V(y)),
    'Площадь прямоугольника равна произведению длин сторон. '+explain(x,y),2,'dec'],
   ['Длина второго отрезка составляет '+f(u)+' длины первого отрезка '+f(y)+' м. Какова длина второго?',MD(V(u),V(y)),
    'Умножаем длину первого отрезка на указанную долю. '+explain(u,y),2,'dec'],
   ['Сколько знаков после запятой нужно отделить при умножении '+f(y)+' на '+f(u)+' до отбрасывания нулей?',V(factor(y)+factor(u)),
    'Складываем число знаков у множителей: '+factor(y)+' + '+factor(u)+' = '+(factor(y)+factor(u))+'.',2,'int']
  ];
  if(t===1)rows=[
   ['Вычисли ('+f(x)+' + '+f(y)+') · '+f(u)+'.',MD(A(V(x),V(y)),V(u)),
    'Скобки: '+plus(x,y)+'. Затем '+explain(x+y,u),2,'dec'],
   ['Вычисли '+f(x)+' · '+f(y)+' + '+f(u)+'.',A(MD(V(x),V(y)),V(u)),
    explain(x,y)+' Прибавляем: '+plus(value(x,y),u)+'.',2,'dec'],
   ['Найди сумму произведений '+f(x)+' · '+f(y)+' и '+f(u)+' · '+f(v)+'.',A(MD(V(x),V(y)),MD(V(u),V(v))),
    'Два произведения: '+mul(x,y)+' и '+mul(u,v)+'. Складываем: '+plus(value(x,y),value(u,v))+'.',3,'dec'],
   ['Стороны прямоугольника '+f(x)+' м и '+f(y)+' м. Первую сторону удлинили на '+f(u)+' м. Какова новая площадь?',MD(A(V(x),V(u)),V(y)),
    'Новая длина: '+plus(x,u)+' м. Площадь: '+mul(x+u,y)+' м².',2,'dec'],
   ['Сравни произведения '+f(x)+' · '+f(y)+' и '+f(v)+' · '+f(u)+'. Найди наибольшее значение.',V(Math.max(value(x,y),value(v,u))),
    'Первое: '+mul(x,y)+'. Второе: '+mul(v,u)+'. '+(value(x,y)===value(v,u)?'Значения равны.':'Берём большее значение.'),3,'dec']
  ];
  if(t===2)rows=[
   ['Вычисли ('+f(x)+' + '+f(y)+') · '+f(v)+' − '+f(x)+' · '+f(v)+'.',MD(V(y),V(v)),
    'Распределяем множитель: '+mul(x,v)+' и '+mul(y,v)+'. Складываем: '+plus(value(x,v),value(y,v))+'. Вычитаем первое произведение: '+minus(value(x+y,v),value(x,v))+'.',4,'dec'],
   ['Стороны прямоугольника '+f(x)+' м и '+f(y)+' м. Первую сторону увеличили на '+f(u)+' м, вторую — на '+f(v)+' м. На сколько выросла площадь?',
    S(MD(A(V(x),V(u)),A(V(y),V(v))),MD(V(x),V(y))),
    'Новые стороны: '+plus(x,u)+' и '+plus(y,v)+'. Новая площадь: '+mul(x+u,y+v)+'. Старая: '+mul(x,y)+'. Разность: '+minus(value(x+u,y+v),value(x,y))+' м².',5,'dec'],
   ['Вычисли ('+f(x)+' + '+f(u)+') · ('+f(y)+' + '+f(v)+') − '+f(u)+' · '+f(v)+'.',
    S(MD(A(V(x),V(u)),A(V(y),V(v))),MD(V(u),V(v))),
    'Скобки: '+plus(x,u)+' и '+plus(y,v)+'. Произведения: '+mul(x+u,y+v)+' и '+mul(u,v)+'. Разность: '+minus(value(x+u,y+v),value(u,v))+'.',5,'dec'],
   ['На первый участок ушло '+f(x)+' м материала. На второй — '+f(u)+' от первого, на третий — '+f(y)+' от первого. Сколько метров ушло всего?',
    A(V(x),MD(V(x),V(u)),MD(V(x),V(y))),
    'На второй участок ушло '+mul(x,u)+' м. На третий '+mul(x,y)+' м. Первые два: '+plus(x,value(x,u))+'. Всего: '+plus(x+value(x,u),value(x,y))+' м.',4,'dec'],
   ['К произведению '+f(x)+' · '+f(y)+' прибавили произведение '+f(u)+' · '+f(v)+' и ещё '+f(u)+'. Найди ответ.',
    A(MD(V(x),V(y)),MD(V(u),V(v)),V(u)),
    'Произведения: '+mul(x,y)+' и '+mul(u,v)+'. Сумма: '+plus(value(x,y),value(u,v))+'. Прибавляем: '+plus(value(x,y)+value(u,v),u)+'.',4,'dec']
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
  const whole=r(1,35+12*t),x=r(1,9),y=r(1,9),z=r(1,9);
  const d1=r(11,96),d2=r(101,996);
  const numeric=(w,n,d)=>w*1000+n*(1000/d);
  const number=(w,n,d)=>w+','+String(n).padStart(String(d).length-1,'0');
  const asFrac=(w,n,d,lead='Запиши ')=>{
   const numerator=w*d+n,g=gcd(numerator,d),value=numeric(w,n,d);
   const why='По числу знаков после запятой получаем знаменатель '+d+'. '+
    (w?'Переводим целую часть: '+w+' · '+d+' + '+n+' = '+numerator+'. ':'Числитель равен '+n+'. ')+
    'Исходная дробь '+frac(numerator,d)+'. '+(g>1?'Делим числитель и знаменатель на '+g+'.':'Дробь уже несократима.');
   return [lead+number(w,n,d)+' несократимой обыкновенной дробью.',V(value),why,w?3:2,'frac'];
  };
  const asDec=(n,d)=>{
   const answer=n*1000/d,places=String(d).length-1;
   const shown=Math.floor(n/d)+','+String(n%d).padStart(places,'0');
   return ['Запиши '+frac(n,d)+' десятичной дробью.',V(answer),'Знаменатель '+d+' задаёт '+places+' цифры после запятой. Получаем '+shown+'.',2,'dec'];
  };
  if(t===0)rows=[
   asFrac(0,x,10),asFrac(0,d1,100),asDec(d2,1000),asDec(d1,100),asFrac(whole,x,10)
  ];
  else if(t===1){
   const den=[2,4,5,8,20,25][r(0,5)],factor=1000/den,base=r(1,den-1);
   rows=[
    asFrac(whole,x*10+y,100),asFrac(0,y*10+z,1000),
    ['Запиши '+frac(whole*den+base,den)+' десятичной дробью.',V((whole*den+base)*factor),'Расширяем на '+factor+': '+frac((whole*den+base)*factor,1000)+'. Затем записываем тысячные десятичной дробью.',3,'dec'],
    asDec(whole*1000+d2,1000),
    ['Запиши '+whole+' целых и '+frac(d1,100)+' десятичной дробью.',V(whole*1000+d1*10),'Числитель дробной части даёт две цифры после запятой, целые пишем перед ней.',3,'dec']
   ];
  }else{
   const den=[4,8,20,25,40,125][r(0,5)],base=r(1,den-1),coeff=1000/den;
   const changed=whole*100+z*10+x;
   const value=numeric(whole,x*100+z,1000);
   const v2=whole*1000+x*100+y;
   rows=[
    ['Запиши '+whole+' целых и '+frac(base,den)+' десятичной дробью.',V(whole*1000+base*coeff),'Приводим дробную часть к тысячным: '+frac(base*coeff,1000)+'. Записываем '+f(whole*1000+base*coeff)+'.',4,'dec'],
    ['Запиши '+frac(changed,100)+' десятичной дробью. Затем назови цифру десятых.',V(z),'Дробь соответствует '+number(whole,z*10+x,100)+'. Первая цифра после запятой — '+z+'.',4,'int'],
    ['Запиши '+whole+' целых, '+x+' десятых и '+z+' тысячных одной несократимой обыкновенной дробью.',V(value),'Запись числа — '+number(whole,x*100+z,1000)+'. Записываем '+frac(value,1000)+' и сокращаем.',4,'frac'],
    ['Целая часть числа '+whole+', цифра десятых '+x+', цифра тысячных '+y+', а цифра сотых равна нулю. Запиши число несократимой обыкновенной дробью.',V(v2),'Ноль сохраняет разряд сотых: '+number(whole,x*100+y,1000)+'. Записываем '+frac(v2,1000)+' и сокращаем.',4,'frac'],
    ['Приведи '+frac(whole*den+base,den)+' к знаменателю 1000. Найди числитель.',V((whole*den+base)*coeff),'1000 : '+den+' = '+coeff+'. Умножаем числитель '+(whole*den+base)+' на '+coeff+'.',3,'int']
   ];
  }
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
   ['На складе было '+base+' кг муки. Продали 20% муки. Сколько килограммов муки продали?',P(V(base),20),'20% — пятая часть.',2,'int'],
   ['Из '+base+' участников городской спортивной программы 30% выбрали плавание. Сколько участников выбрали плавание?',P(V(base),30),'Находим тридцать сотых исходного числа.',2,'int'],
   ['К цене '+base+' руб. применили скидку 10%. На сколько рублей уменьшилась цена?',P(V(base),10),'Стоимость скидки составляет 10% первоначальной цены.',2,'int'],
   ['К числу '+base+' прибавили 10% этого числа. Сколько получилось?',A(V(base),P(V(base),10)),'Найдём 10% и прибавим к исходному.',3,'int']
  ];
  else rows=[
   ['Из '+base+' книг 25% выдали в понедельник и ещё 10% во вторник. Сколько книг осталось?',S(S(V(base),P(V(base),25)),P(V(base),10)),'Вычислим две доли исходного количества и вычтем их.',4,'int'],
   ['Цена '+base+' руб. выросла на 20%, затем снизилась на 10% от новой цены. Найди итоговую цену.',S(A(V(base),P(V(base),20)),P(A(V(base),P(V(base),20)),10)),'Проценты во втором действии считаем от новой цены.',5,'int'],
   ['На фестивале было '+base+' участников. 30% участвовали в первом конкурсе, 25% во втором. Сколько участников выступили в этих конкурсах, если никто не участвовал дважды?',A(P(V(base),30),P(V(base),25)),'Обе доли считаются от исходного количества.',4,'int'],
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
   ['На районном спортивном празднике 40% участников — '+(total*40/100)+' человек. Сколько участников было всего?',D(M(V(total*40/100),100),40),'Составим соотношение часть/целое × 100.',3,'int']
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
  const optionsWithValue=new Set();
  options=[];
  for(const [num,den] of [[n,d],[n+1,d],[n+2,d],[n,d+1],[n+1,d+1],[n+2,d+1]]){
   const divisor=gcd(num,den),key=num/divisor+'/'+den/divisor;
   if(optionsWithValue.has(key))continue;
   optionsWithValue.add(key);
   options.push({key,label:frac(num/divisor,den/divisor)});
   if(options.length===4)break;
  }
  if(options.length!==4)throw Error('Missing unique decimal conversion choices');
  answer=n+'/'+d;visible=frac(n,d);
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
