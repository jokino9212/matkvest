/* MatKvest G5 v127 — new pedagogical diversity in 5 decimal topics.
 * All learner questions run through makeG5Question, not detached donor tests.
 * Fixed-point arithmetic uses exact thousandths with independent validation.
 */
(function(){
'use strict';
if(typeof makeG5Question!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof activeDifficulty!=='function')throw Error('v127 Grade 5 decimal prerequisites unavailable');
const IDS=['dec_place','dec_mul10','dec_div10','dec_mul_nat','dec_div_nat'];
const covered=new Set(IDS),old=makeG5Question;
const tier=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0));
const family=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const r=(a,b)=>ri(a,b);
const V=x=>['v',x],A=(...v)=>['add',...v],S=(a,b)=>['sub',a,b],M=(a,k)=>['mul',a,k],D=(a,k)=>['div',a,k],DI=(a,place)=>['digit',a,place],AB=(a,b)=>['abs',S(a,b)];
function evaluate(node){
 const [op,...v]=node,E=evaluate;
 if(op==='v')return v[0];
 if(op==='add')return v.reduce((x,y)=>x+E(y),0);
 if(op==='sub')return E(v[0])-E(v[1]);
 if(op==='mul')return E(v[0])*v[1];
 if(op==='div'){const a=E(v[0]);if(v[1]<=0||a%v[1])throw Error('Noninteger fixed-point division');return a/v[1]}
 if(op==='digit')return Math.floor(E(v[0])/v[1])%10;
 if(op==='abs')return Math.abs(E(v[0]));
 throw Error('v127 unrecognized operation '+op);
}
function f(n){
 if(!Number.isSafeInteger(n)||n<0)throw Error('Unsafe decimal formatting');
 const whole=Math.floor(n/1000),places=String(n%1000).padStart(3,'0').replace(/0+$/,'');
 return places?whole+','+places:String(whole);
}
function decWhole(a,b=0,c=0){return a*1000+b*100+c*10}
function spec(id,t,p){
 const a=r(3,24+t*8),b=r(2,11+t*5),c=r(2,9+t*3),d=r(2,6+t*2),e=r(2,5+t*2);
 const X=decWhole(a,b,c),Y=decWhole(b,c,d),Z=decWhole(c,d,e);
 const k=r(2,8+t*3),h=r(2,6+t*2),q=r(2,5+t*2);
 const d100=a*1000+b*10,d1=a*1000,d10=a*1000+b*100,d3=a*1000+b*100+c*10+e;
 let rows;
 if(id==='dec_place'){
  const whole=r(0,38+12*t),x=r(0,9),y=r(0,9),z=r(1,9);
  const displayDigits=r(1,3),short=whole+','+[x,y,z].slice(0,displayDigits).join('');
  const full=whole*1000+x*100+y*10+z,shown=whole+','+x+y+z;
  const places=['десятых','сотых','тысячных'],digits=[x,y,z],pScale=[100,10,1];
  const place=r(0,2),position=['первая','вторая','третья'][place],v=pScale[place];
  const table='<table aria-label="Разряды десятичной дроби" style="margin:8px auto;text-align:center;border-spacing:8px 2px"><thead><tr><th>Целые</th><th>Десятые</th><th>Сотые</th><th>Тысячные</th></tr></thead><tbody><tr><td>'+whole+'</td><td>'+x+'</td><td>'+y+'</td><td>'+z+'</td></tr></tbody></table>';
  if(t===0)rows=[
   ['Какая цифра стоит в разряде '+places[place]+' числа '+shown+'?'+table,DI(V(full),v),'После запятой '+position+' цифра — '+digits[place]+'.',1,'int'],
   ['Сколько тысячных в дробной части числа '+shown+'?',V(full%1000),'Записываем три цифры после запятой как число: '+(full%1000)+'.',1,'int'],
   ['Назови целую часть числа '+shown+'.',V(whole),'Слева от запятой записано '+whole+'.',1,'int'],
   ['Сколько знаков после запятой в записи '+short+'?',V(displayDigits),'Считаем все записанные цифры после запятой, включая нули.',1,'int'],
   ['Сколько тысячных составляют '+(whole*100+x*10+y)+' сотых?',V((whole*100+x*10+y)*10),'В одной сотой 10 тысячных. Умножаем '+(whole*100+x*10+y)+' на 10.',2,'int']
  ];
  else if(t===1){
   const replacement=(digits[place]+r(1,9))%10;
   const changed=full+(replacement-digits[place])*v;
   rows=[
    ['Запиши число: '+whole+' целых, '+x+' десятых, '+y+' сотых и '+z+' тысячных.',V(full),'Записываем целые и три указанных разряда: '+shown+'.',2,'dec'],
    ['В числе '+shown+' цифру '+places[place]+' заменили на '+replacement+'. Запиши новое число.',V(changed),'Меняем только '+position+' цифру после запятой. Получаем '+f(changed)+'.',2,'dec'],
    ['Сколько тысячных во всём числе '+shown+'?',V(full),whole+' целых — это '+whole*1000+' тысячных. Вместе с дробной частью получаем '+full+'.',2,'int'],
    ['Запиши десятичную дробь, в которой '+full+' тысячных.',V(full),'Ставим запятую перед последними тремя цифрами: '+shown+'.',2,'dec'],
    ['Запиши число с целой частью '+whole+', цифрой десятых '+x+' и цифрой тысячных '+z+'. Цифра сотых — ноль.',V(whole*1000+x*100+z),'Сотые занимают своё место даже при нулевом значении.',2,'dec']
   ];
  }else{
   const swapped=whole*1000+z*100+y*10+x;
   const both=whole*1000+(z+1)%10*100+x*10+y;
   const selected=r(0,2);
   rows=[
    ['В числе '+shown+' поменяли местами цифры десятых и тысячных. Запиши результат.',V(swapped),'На первом месте после запятой будет '+z+', на втором '+y+', на третьем '+x+'.',3,'dec'],
    ['В числе '+shown+' перенеси цифру тысячных на место десятых, цифру десятых на место сотых, а цифру сотых на место тысячных. Затем замени новую цифру десятых на '+((z+1)%10)+'. Запиши результат.',V(both),'После перестановки получаем '+whole+','+z+x+y+'. Меняем цифру десятых.',4,'dec'],
    ['Разложи число '+shown+' на целые и дробные разряды. Сколько тысячных получится, если перевести в них только целые и десятые?',V(whole*1000+x*100),whole+' целых — '+whole*1000+' тысячных. '+x+' десятых — '+x*100+' тысячных. Складываем эти количества.',3,'int'],
    ['Запиши '+full+' тысячных десятичной дробью. Замени её цифру '+places[selected]+' на ноль. Запиши полученное число.',V(full-digits[selected]*pScale[selected]),'Запись до замены — '+shown+'. Обнуляем только указанный разряд.',3,'dec'],
    ['Запиши число из '+whole+' целых, '+x+' десятых и '+(y*10+z)+' тысячных. Цифру сотых и цифру тысячных поменяй местами.',V(whole*1000+x*100+z*10+y),'Сначала получаем '+shown+'. После перестановки сотых и тысячных дробные цифры идут в порядке '+x+z+y+'.',4,'dec']
   ];
  }
 }
 if(id==='dec_mul10'){
  if(t===0)rows=[
   ['Вычисли '+f(X)+' · 10.',M(V(X),10),'При умножении на 10 запятая сдвигается вправо на один разряд.',1,'dec'],
   ['Число '+f(Y)+' увеличили в 100 раз. Какое число получилось?',M(V(Y),100),'Увеличить в 100 раз — умножить на 100 и перенести запятую вправо на два разряда.',1,'dec'],
   ['В числе '+f(Z)+' перенесли запятую на три разряда вправо. Запиши полученное число.',M(V(Z),1000),'Сдвиг вправо на три разряда равносилен умножению на 1000.',1,'dec'],
   ['Одна лента длиной '+f(X)+' м. Сколько метров в 10 таких лентах?',M(V(X),10),'Длину одной ленты умножим на 10.',2,'dec'],
   ['Сколько рублей стоят 100 одинаковых тетрадей по '+f(Y)+' руб.?',M(V(Y),100),'Цена × количество.',2,'dec']
  ];
  else if(t===1)rows=[
   ['Вычисли ('+f(X)+' + '+f(Y)+') · 10.',M(A(V(X),V(Y)),10),'В скобках найдём сумму, затем умножим на 10.',2,'dec'],
   ['Вычисли '+f(X)+' · 100 + '+f(Y)+' · 10.',A(M(V(X),100),M(V(Y),10)),'Два умножения на разрядные единицы и сумма.',3,'dec'],
   ['Найди модуль разности '+f(X)+' и '+f(Y)+', затем умножь на 100.',M(AB(V(X),V(Y)),100),'Найдём положительную разность двух чисел и умножим на 100.',2,'dec'],
   ['Из десяти коробок по '+f(X)+' кг достали '+f(Y)+' кг. Сколько килограммов осталось?',S(M(V(X),10),V(Y)),'Масса десяти коробок минус израсходованное.',3,'dec'],
   ['Число умножили на 100 и получили '+f(X*100)+'. Найди исходное число.',D(V(X*100),100),'Обратное действие к умножению на 100 — деление.',2,'dec']
  ];
  else rows=[
   ['Вычисли ('+f(X)+' + '+f(Y)+') · 100 − '+f(Z)+' · 10.',S(M(A(V(X),V(Y)),100),M(V(Z),10)),'Сначала сумма, затем два умножения и вычитание.',4,'dec'],
   ['Продали 100 товаров по '+f(X)+' руб. и 10 товаров по '+f(Y)+' руб. Вернули покупателям '+f(Z)+' руб. Найди итог выручки.',S(A(M(V(X),100),M(V(Y),10)),V(Z)),'Посчитаем две выручки, сложим, затем вычтем возврат.',4,'dec'],
   ['Из 100 упаковок по '+f(X+Y)+' кг вывезли '+k+' упаковок по '+f(Y)+' кг. Сколько килограммов осталось?',S(M(V(X+Y),100),M(V(Y),k)),'Вычислим две массы и их разность.',4,'dec'],
   ['Число x сначала увеличили на '+f(Y)+', затем умножили на 100 и получили '+f((X+Y)*100)+'. Найди x.',S(D(V((X+Y)*100),100),V(Y)),'Сначала разделим результат на 100, затем вычтем прибавку.',4,'dec'],
   ['Вычисли ('+f(X)+' + '+f(Y)+' + '+f(Z)+') · 10 − '+f(Y)+' · 10.',S(M(A(V(X),V(Y),V(Z)),10),M(V(Y),10)),'Сумма трёх дробей, два умножения и разность.',5,'dec']
  ];
 }
 if(id==='dec_div10'){
  if(t===0)rows=[
   ['Вычисли '+f(d100)+' : 10.',D(V(d100),10),'Запятая сдвигается влево на один разряд.',1,'dec'],
   ['Число '+f(d1)+' уменьшили в 100 раз. Какое число получилось?',D(V(d1),100),'Уменьшить в 100 раз — разделить на 100.',1,'dec'],
   ['В числе '+f(d1)+' перенесли запятую на три разряда влево. Запиши полученное число.',D(V(d1),1000),'Сдвиг влево на три разряда равносилен делению на 1000.',1,'dec'],
   ['Ленту длиной '+f(d100)+' м разрезали на 10 равных частей. Какова длина каждой?',D(V(d100),10),'Разделим общую длину на 10.',2,'dec'],
   ['Сумму '+f(d10)+' руб. разделили поровну на 10 человек. Сколько получил каждый?',D(V(d10),10),'Делим на число равных долей.',2,'dec']
  ];
  else if(t===1)rows=[
   ['Вычисли ('+f(d100)+' + '+f(b*1000)+') : 10.',D(A(V(d100),V(b*1000)),10),'Сначала сумма, затем деление на 10.',2,'dec'],
   ['Вычисли '+f(d1)+' : 100 + '+f(b*1000)+' : 10.',A(D(V(d1),100),D(V(b*1000),10)),'Два деления, затем сложение.',3,'dec'],
   ['Вычисли ('+f(d1+b*1000)+' − '+f(b*1000)+') : 100.',D(S(V(d1+b*1000),V(b*1000)),100),'Сначала вычтем, затем разделим на 100.',2,'dec'],
   ['После деления числа на 10 получили '+f(d100/10)+'. Найди первоначальное число.',M(D(V(d100),10),10),'Умножим результат на 10.',2,'dec'],
   ['Из числа '+f(d100)+' десятую часть взяли как первую величину и прибавили '+f(c*1000/100)+'. Найди сумму.',A(D(V(d100),10),D(V(c*1000),100)),'Два деления и сложение.',3,'dec']
  ];
  else rows=[
   ['Вычисли '+f(d1)+' : 10 : 10 + '+f(b*1000)+' : 100.',A(D(D(V(d1),10),10),D(V(b*1000),100)),'Последовательно делим на 10, затем выполняем второе деление и складываем.',4,'dec'],
   ['Вычисли ('+f(d1)+' + '+f(b*1000)+') : 100 − '+f(c*1000)+' : 1000.',S(D(A(V(d1),V(b*1000)),100),D(V(c*1000),1000)),'Скобки, два частных и вычитание.',4,'dec'],
   ['Из '+f(d1)+' м верёвки взяли десятую часть, затем эту часть разделили ещё на 10. Найди длину отрезка.',D(D(V(d1),10),10),'Два последовательных деления на 10.',3,'dec'],
   ['После деления числа x на 100 и прибавления '+f(b*1000/100)+' получили '+f(d1/100+b*1000/100)+'. Найди x.',M(S(V(d1/100+b*1000/100),V(b*1000/100)),100),'Сначала вычтем прибавку, затем умножим на 100.',3,'dec'],
   ['Найди разность частных '+f(d1)+' : 100 и '+f(b*1000)+' : 1000.',S(D(V(d1),100),D(V(b*1000),1000)),'Два деления на 100 и 1000, затем разность.',3,'dec']
  ];
 }
 if(id==='dec_mul_nat'){
  const mul=(x,n)=>f(x)+' · '+n+' = '+f(x*n);
  const plus=(x,y)=>f(x)+' + '+f(y)+' = '+f(x+y);
  const minus=(x,y)=>f(x)+' − '+f(y)+' = '+f(x-y);
  const explain=(x,n)=>{
   const places=f(x).split(',')[1]?.length||0, scale=10**places;
   const digits=x*scale/1000;
   return 'Убираем запятую: '+digits+' · '+n+' = '+digits*n+'. Возвращаем запятую, отделяя справа '+places+' '+(places===1?'знак':'знака')+': '+f(x*n)+'.';
  };
  const x=r(8,18)*1000+r(1,9)*100,y=r(1,12)*1000+r(1,9)*10+r(1,9),z=r(1,7)*1000+r(1,9)*100+r(1,9)*10;
  const n=r(2,7+t*3),m=r(2,5+t*2),hundredths=r(1,9)*10;
  if(t===0)rows=[
   ['Вычисли '+f(x)+' · '+n+'.',M(V(x),n),explain(x,n),1,'dec'],
   ['Вычисли '+f(hundredths)+' · '+n+' и запиши произведение.',M(V(hundredths),n),explain(hundredths,n),2,'dec'],
   ['К длине '+f(z)+' м прибавили такую же длину. Найди удвоенную длину.',M(V(z),2),'Два равных слагаемых заменяем умножением на 2. '+explain(z,2),2,'dec'],
   ['В одном пакете '+f(y)+' кг. Сколько килограммов в '+m+' одинаковых пакетах?',M(V(y),m),'Массу пакета умножаем на количество пакетов. '+explain(y,m),2,'dec'],
   ['Сколько получится при умножении '+f(x)+' на '+(n*10)+'?',M(V(x),n*10),'Представим множитель как '+n+' · 10. Сначала '+mul(x,n)+', затем '+mul(x*n,10)+'.',2,'dec']
  ];
  if(t===1)rows=[
   ['Вычисли '+f(y)+' · '+n+' + '+f(z)+'.',A(M(V(y),n),V(z)),explain(y,n)+' Затем '+plus(y*n,z)+'.',2,'dec'],
   ['Вычисли ('+f(x)+' + '+f(z)+') · '+m+'.',M(A(V(x),V(z)),m),'Сначала '+plus(x,z)+'. Затем '+explain(x+z,m),2,'dec'],
   ['Выбери способ: используй разложение '+(n+10)+' = 10 + '+n+' и вычисли '+f(y)+' · '+(n+10)+'.',M(V(y),n+10),
    'По распределительному свойству найдём два произведения: '+mul(y,10)+' и '+mul(y,n)+'. Сложим: '+plus(y*10,y*n)+'.',3,'dec'],
   ['Сравни произведения '+f(x)+' · '+n+' и '+f(z)+' · '+m+'. Найди наибольшее значение.',V(Math.max(x*n,z*m)),
    'Находим оба значения: '+mul(x,n)+' и '+mul(z,m)+'. '+(x*n===z*m?'Значения равны.':'Выбираем большее.'),3,'dec'],
   ['В баке '+f(x+y*n)+' л. Разлили '+n+' бутылок по '+f(y)+' л. Сколько литров осталось?',S(V(x+y*n),M(V(y),n)),
    'Разлили '+mul(y,n)+' л. Остаток: '+minus(x+y*n,y*n)+' л.',2,'dec']
  ];
  if(t===2)rows=[
   ['Вычисли ('+f(x)+' + '+f(y)+') · '+n+' − '+f(y)+' · '+n+'.',S(M(A(V(x),V(y)),n),M(V(y),n)),
    'Распределим множитель: '+mul(x,n)+' и '+mul(y,n)+'. Сложим: '+plus(x*n,y*n)+'. Вычтем второе произведение: '+minus((x+y)*n,y*n)+'.',4,'dec'],
   ['Изготовили '+n+' деталей по '+f(x)+' кг и '+m+' деталей по '+f(z)+' кг. Затем сняли '+f(y)+' кг материала. Сколько килограммов осталось?',
    S(A(M(V(x),n),M(V(z),m)),V(y)),
    'Первая партия: '+mul(x,n)+' кг. Вторая: '+mul(z,m)+' кг. Вместе '+plus(x*n,z*m)+' кг. Остаток: '+minus(x*n+z*m,y)+' кг.',4,'dec'],
   ['Найди разницу стоимости: '+n+' тетрадей по '+f(x+y)+' руб. каждая и '+n+' тетрадей по '+f(x)+' руб. каждая.',M(V(y),n),
    'Цена одной тетради отличается на '+minus(x+y,x)+' руб. Для одинакового количества тетрадей разницу цен умножаем на '+n+': '+mul(y,n)+'. Проверка: '+mul(x+y,n)+' и '+mul(x,n)+', их разность '+minus((x+y)*n,x*n)+'.',4,'dec'],
   ['Вычисли '+f(y)+' · '+n+' + '+f(y)+' · '+m+' − '+f(y)+'.',S(A(M(V(y),n),M(V(y),m)),V(y)),
    'Сначала '+n+' + '+m+' = '+(n+m)+'. Убираем один множитель: '+(n+m)+' − 1 = '+(n+m-1)+'. '+explain(y,n+m-1),3,'dec'],
   ['В '+n+' ящиках лежит по '+f(x)+' кг. В каждый доложили по '+f(z)+' кг. Из всей партии забрали '+f(y)+' кг. Сколько килограммов осталось?',
    S(M(A(V(x),V(z)),n),V(y)),
    'В каждом ящике стало '+plus(x,z)+' кг. Всего '+mul(x+z,n)+' кг. После расхода '+minus((x+z)*n,y)+' кг.',3,'dec']
  ];
 }
 if(id==='dec_div_nat'){
  const whole=r(4,24)*1000+r(1,9)*100,small=r(1,9)*10+r(1,9),piece=r(1,6)*1000+r(1,9)*10+2*r(1,4);
  const n=r(2,8+t*3),m=r(2,5+t*2),remainder=r(1,8)*100+r(1,9)*10;
  const quot=(amount,count)=>f(amount)+' : '+count+' = '+f(amount/count);
  const sum=(a,b)=>f(a)+' + '+f(b)+' = '+f(a+b);
  const diff=(a,b)=>f(a)+' − '+f(b)+' = '+f(a-b);
  const product=(a,count)=>f(a)+' · '+count+' = '+f(a*count);
  const verify=(amount,count)=>'Проверка умножением: '+product(amount/count,count)+'.';
  const division=(amount,count)=>{
   const digits=f(amount).split(',')[1]?.length||0;
   const scale=10**digits;
   const precision=f(amount/count).split(',')[1]?.length||0;
   const units=['целых','десятых','сотых','тысячных'];
   const direct=amount*scale/1000;
   if(direct%count===0)return 'Запишем делимое в '+units[digits]+': '+direct+'. Делим: '+direct+' : '+count+' = '+direct/count+'. В десятичной записи это '+f(amount/count)+'. '+verify(amount,count);
   const factor=10**precision;
   const extended=amount*factor/1000;
   return 'Допишем нули, чтобы выразить делимое в '+units[precision]+': '+extended+'. Делим: '+extended+' : '+count+' = '+extended/count+'. Записываем частное: '+f(amount/count)+'. '+verify(amount,count);
  };
  const total=whole*n,group=piece*m,comparison=piece+small;
  if(t===0)rows=[
   ['Вычисли '+f(total)+' : '+n+'.',D(V(total),n),division(total,n),1,'dec'],
   ['Вычисли '+f(small*n)+' : '+n+' и запиши частное меньше единицы.',D(V(small*n),n),division(small*n,n),2,'dec'],
   ['Вычисли '+f(piece*10)+' : 10. Сколько получится?',D(V(piece*10),10),'При делении на 10 запятая сдвигается на один разряд влево: '+quot(piece*10,10)+'.',1,'dec'],
   ['Верёвку длиной '+f(group)+' м разрезали на '+m+' равных частей. Чему равна длина одной?',D(V(group),m),division(group,m),2,'dec'],
   ['Найди половину числа '+f((piece+1)*2)+'.',D(V((piece+1)*2),2),'Половина — это результат деления на два. '+division((piece+1)*2,2),2,'dec']
  ];
  if(t===1)rows=[
   ['Вычисли ('+f(total)+' + '+f(piece*n)+') : '+n+'.',D(A(V(total),V(piece*n)),n),
    'Сначала объединим партии: '+sum(total,piece*n)+'. Делим: '+quot(total+piece*n,n)+'. '+verify(total+piece*n,n),2,'dec'],
   ['Вычисли '+f(total)+' : '+n+' + '+f(group)+' : '+m+'.',A(D(V(total),n),D(V(group),m)),
    'Находим частные: '+quot(total,n)+' и '+quot(group,m)+'. Складываем: '+sum(whole,piece)+'.',3,'dec'],
   ['В '+n+' ёмкостей поровну разлили '+f(total)+' л. Из каждой перелили '+f(remainder)+' л в другую тару. Сколько литров осталось в одной ёмкости?',S(D(V(total),n),V(remainder)),
    'В одной ёмкости было '+quot(total,n)+' л. После переливания '+diff(whole,remainder)+' л.',2,'dec'],
   ['После деления x на '+n+' получили '+f(whole)+'. Найди делимое x.',M(V(whole),n),
    'Умножаем частное на делитель: '+product(whole,n)+'. Проверяем: '+quot(total,n)+'.',2,'dec'],
   ['Сравни частные '+f(group)+' : '+m+' и '+f(comparison*n)+' : '+n+'. Чему равно большее частное?',V(comparison),
    'Вычислим '+quot(group,m)+' и '+quot(comparison*n,n)+'. Второе частное больше на '+diff(comparison,piece)+'.',3,'dec']
  ];
  if(t===2)rows=[
   ['Вычисли '+f(total*m)+' : '+m+' : '+n+'.',D(D(V(total*m),m),n),
    'Выполняем слева направо: '+quot(total*m,m)+'. Затем '+quot(total,n)+'. '+verify(total,n),3,'dec'],
   ['Из '+f(total+group)+' кг сырья '+f(group)+' кг отложили. Остальное разделили на '+n+' равных частей. Из каждой взяли '+f(remainder)+' кг. Сколько килограммов осталось в одной части?',
    S(D(S(V(total+group),V(group)),n),V(remainder)),
    'После отбора '+diff(total+group,group)+' кг. Одна часть: '+quot(total,n)+' кг. Осталось '+diff(whole,remainder)+' кг.',3,'dec'],
   ['Число x увеличили на '+f(piece*n)+', разделили на '+n+' и получили '+f(whole+piece)+'. Найди x.',S(M(V(whole+piece),n),V(piece*n)),
    'Возвращаем делимое: '+product(whole+piece,n)+'. Вычитаем прибавку: '+diff((whole+piece)*n,piece*n)+'. Проверяем: '+quot((whole+piece)*n,n)+'.',3,'dec'],
   ['Найди сумму '+f(total)+' : '+n+' и '+f(group)+' : '+m+', затем раздели результат пополам.',D(A(D(V(total),n),D(V(group),m)),2),
    'Частные: '+quot(total,n)+' и '+quot(group,m)+'. Сумма: '+sum(whole,piece)+'. Половина: '+quot(whole+piece,2)+'.',4,'dec'],
   ['В одной группе '+n+' участников, им поровну выдали '+f(comparison*n)+' кг материала. В другой группе '+m+' участников и '+f(group)+' кг. На сколько килограммов больше получил один участник первой группы?',
    S(D(V(comparison*n),n),D(V(group),m)),
    'В первой группе '+quot(comparison*n,n)+' кг на участника. Во второй '+quot(group,m)+' кг. Разница: '+diff(comparison,piece)+' кг.',3,'dec']
  ];
 }
 if(!rows||rows.length!==5)throw Error('v127 missing families '+id);
 const [text,tree,why,steps,mode]=rows[p];
 return {id,t,p,text,tree,why,steps,mode};
}
function question(id){
 const t=tier(),p=family(),d=spec(id,t,p),v=evaluate(d.tree);
 if(!Number.isSafeInteger(v)||v<0||v>1000000000)throw Error('v127 impossible result '+id+' L'+t+' F'+p+': '+v);
 const answer=d.mode==='int'?v:Number((v/1000).toFixed(3));
 const extra=d.mode==='int'?[answer+1,answer+2,answer+3]:[Number(((v+1)/1000).toFixed(3)),Number(((v+10)/1000).toFixed(3)),Number(((v+100)/1000).toFixed(3))];
 const qq=g5q(d.text,g5nums(answer,extra),String(answer),d.why+' Ответ: '+(d.mode==='int'?answer:f(v))+'.','v127_'+id+'_L'+t+'_F'+p);
 const correct=qq.choices.filter(x=>String(x.key)===String(qq.correct));
 if(correct.length!==1||new Set(qq.choices.map(x=>String(x.label))).size!==qq.choices.length)throw Error('v127 ambiguous answers '+id+' L'+t+' F'+p);
 return {text:qq.text,choices:qq.choices,ans:String(qq.correct),ex:qq.explain,
   correctText:String(correct[0].label),correctLabel:String(correct[0].label),sourceTopicId:id,
   templateId:qq.templateId,sig:['g5','v127',id,t,p,d.text,answer].join(':'),
   mk127:{id,t,p,steps:d.steps,tree:d.tree,expectedMilli:d.mode==='dec'?v:null,expectedInt:d.mode==='int'?v:null,mode:d.mode}};
}
makeG5Question=function(id){return covered.has(id)?question(id):old.apply(this,arguments)};
const previousLesson=g5Lesson;
g5Lesson=function(id){
 if(id==='dec_div_nat')return 'Дели как натуральные числа. Когда переходишь к первой цифре после запятой в делимом, поставь запятую и в частном. Если делимое меньше делителя, начни частное с 0. При остатке можно дописать справа нуль и продолжить деление. Например, 4,2 : 4 = 1,05. Для проверки умножь частное на делитель: 1,05 · 4 = 4,2.';
 if(id!=='dec_mul_nat')return previousLesson(id);
 return 'Умножь число на натуральный множитель, временно убрав запятую. В произведении отдели справа столько знаков, сколько было после запятой в исходном числе. Если знаков не хватает, допиши нули слева. Например, 0,07 · 3 = 0,21: 7 · 3 = 21, отделяем два знака. В задаче с одинаковыми группами умножаем величину одной группы на количество групп.';
};
window.mkG5V127Tiered=IDS.slice();
})();
