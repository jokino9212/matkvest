/* MatKvest grade 5 / Vilenkin textbook: six independent missing curriculum sections. */
(function(){
'use strict';
const NEW=[
{id:'number_tables',ico:'▦',title:'Представление числовой информации в таблицах',sub:'чтение таблиц, суммы, разности и сравнение данных'},
{id:'column_charts',ico:'📊',title:'Представление числовой информации в столбчатых диаграммах',sub:'чтение столбчатых диаграмм и задач с данными'},
{id:'divisors_multiples_g5',ico:'🔢',title:'Делители и кратные',sub:'делимость, делители и кратные натурального числа'},
{id:'divisibility_rules_g5',ico:'✅',title:'Свойства и признаки делимости',sub:'признаки делимости на 2, 3, 5, 9, 10'},
{id:'formulas_g5',ico:'ƒ',title:'Формулы',sub:'буквенная запись зависимостей и подстановка значений'},
{id:'area_units_g5',ico:'📐',title:'Единицы измерения площадей',sub:'см², дм², м², гектар и перевод единиц'}
];
if(typeof G5_CORE==='undefined'||typeof g5DonorQuestion!=='function'||typeof g5Lesson!=='function'||typeof g5q!=='function'||typeof g5nums!=='function')throw Error('G5 curriculum dependencies unavailable');
const piv=G5_CORE.findIndex(t=>t.id==='operations');
for(const topic of NEW)if(G5_CORE.some(t=>t.id===topic.id))throw Error('Duplicate topic '+topic.id);
G5_CORE.splice(piv<0?G5_CORE.length:piv,0,...NEW);
const previous=g5DonorQuestion,previousLesson=g5Lesson;
const rand=(a,b)=>ri(a,b);
const tier=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0));
const step=()=>Math.max(0,Number(blockSession?.done)||0)%5;
function numeric(text,answer,ex,family,wrong=[]){
 if(!Number.isSafeInteger(answer))throw Error('Unsafe answer: '+family);
 const unique=[...new Set(wrong.map(Number).filter(Number.isSafeInteger))].filter(n=>n!==answer);
 while(unique.length<3)unique.push(answer+unique.length+1);
 const q=g5q(text,g5nums(answer,unique),String(answer),ex,family);
 q.mk5Audit={type:'numeric',expected:answer};
 return q;
}
function choose(text,correct,wrong,ex,family){
 const alternatives=[correct,...wrong.filter(w=>w!==correct)];
 const unique=[...new Set(alternatives)];if(unique.length<3)throw Error('Duplicate distractors: '+family);
 return g5q(text,unique.map((label,i)=>({label,key:i===0?'right':'wrong'+i})),'right',ex,family);
}
// §18. Exactly 15 different cognitive families; textbook topic §19 is separate.
function divisorGcd(a,b){
 while(b){const rem=a%b;a=b;b=rem;}
 return a;
}
function allDivisors(n){
 const arr=[];for(let d=1;d<=n;d++)if(n%d===0)arr.push(d);
 return arr;
}
function makeDivisors(t,p){
 const a=rand(3+2*t,25+9*t),b=rand(3,19+4*t),k=rand(3,16+5*t);
 const n=a*b,rest=rand(1,a-1),first=rand(13,170+40*t);
 let text,answer,ex,steps;
 if(t===0){
  if(p===0){
   text='Число '+n+' — положительное кратное числа '+a+'. Найди следующее положительное кратное числа '+a+'.';
   answer=n+a;ex='Все положительные кратные '+a+' идут с шагом '+a+': '+n+' + '+a+' = '+answer+'.';steps=1;
  }else if(p===1){
   text='Найди '+k+'-е положительное кратное числа '+a+'.';
   answer=a*k;ex='Положительные кратные '+a+': '+a+', '+(a*2)+', '+(a*3)+' и далее. На месте '+k+' стоит '+a+' · '+k+' = '+answer+'.';steps=1;
  }else if(p===2){
   text='Число '+n+' делится на '+a+' без остатка. Найди частное.';
   answer=b;ex='Деление без остатка: '+n+' : '+a+' = '+b+'. Проверка: '+a+' · '+b+' = '+n+'.';steps=2;
  }else if(p===3){
   const d=allDivisors(first);
   text='Сколько положительных делителей у числа '+first+'?';
   answer=d.length;ex='Положительные делители '+first+': '+d.join(', ')+'. Всего '+answer+'. Проверка: на каждый из них '+first+' делится без остатка.';steps=2;
  }else{
   const limit=n+rest;
   text='Сколько положительных кратных числа '+a+' не превышают '+limit+'?';
   answer=b;ex='Последнее подходящее кратное '+a+' · '+b+' = '+n+'. Следующее '+a+' · '+(b+1)+' = '+(n+a)+' > '+limit+'. Значит, кратных '+b+'.';steps=2;
  }
 }else if(t===1){
  if(p===0){
   const bigger=n;
   text='Найди наименьшее общее положительное кратное чисел '+a+' и '+bigger+'.';
   answer=bigger;ex=bigger+' = '+a+' · '+b+' и '+bigger+' : '+bigger+' = 1. Само число '+bigger+' — его наименьшее положительное кратное и одновременно кратное '+a+'.';steps=3;
  }else if(p===1){
   const other=a*rand(4,21),g=divisorGcd(n,other),ds=allDivisors(g);
   text='Сколько общих положительных делителей у чисел '+n+' и '+other+'?';
   answer=ds.length;ex='Наибольший общий делитель чисел '+n+' и '+other+' равен '+g+'. Его делители: '+ds.join(', ')+'. Они и только они делят оба числа. Всего '+answer+'.';steps=3;
  }else if(p===2){
   const left=a*rand(2,12)+rand(1,a-1),right=left+a*rand(3,18)+rand(0,a-1);
   const start=Math.ceil(left/a)*a,end=Math.floor(right/a)*a;
   text='Сколько положительных кратных числа '+a+' находится от '+left+' до '+right+' включительно?';
   answer=Math.floor(right/a)-Math.floor((left-1)/a);
   ex='Первое кратное в промежутке '+start+' = '+a+' · '+(start/a)+'. Последнее '+end+' = '+a+' · '+(end/a)+'. Количество: '+(end/a)+' − '+(start/a)+' + 1 = '+answer+'.';steps=3;
  }else if(p===3){
   const limit=n+rest,add=a-rest;
   text='К числу '+limit+' нужно прибавить наименьшее положительное число, чтобы получилось кратное '+a+'. Сколько прибавить?';
   answer=add;ex='Ближайшее большее кратное: '+a+' · '+(b+1)+' = '+(n+a)+'. Значит, '+(n+a)+' − '+limit+' = '+add+'. Проверка: '+limit+' + '+add+' = '+(n+a)+'.';steps=3;
  }else{
   const multiple=n,count=rand(3,16),limit=multiple*count+rand(1,multiple-1);
   text='Сколько общих положительных кратных чисел '+a+' и '+multiple+' не превышают '+limit+'?';
   answer=count;ex='Так как '+multiple+' = '+a+' · '+b+', общие кратные идут через '+multiple+'. Последнее подходящее '+multiple+' · '+count+' = '+(multiple*count)+'. Следующее '+multiple+' · '+(count+1)+' = '+(multiple*(count+1))+' больше '+limit+'. Ответ: '+answer+'.';steps=4;
  }
 }else{
  // Pick two factors with gcd=1: neither resulting number divides the other.
  const coprimePairs=[[3,4],[3,5],[4,7],[5,6],[5,7],[7,8],[7,9],[8,9],[9,11],[5,11],[4,9],[6,11]];
  const [x,y]=coprimePairs[rand(0,coprimePairs.length-1)];
  const d=rand(3,18),u=d*x,v=d*y,common=d*x*y;
  if(p===0){
   text='Найди наименьшее общее положительное кратное чисел '+u+' и '+v+'.';
   answer=common;
   const tested=[];for(let i=1;i<=x;i++)tested.push(v*i);
   ex='Перебираем кратные '+v+': '+tested.join(', ')+'. Первое кратное, которое делится и на '+u+', равно '+common+'. Проверка: '+common+' : '+u+' = '+y+'; '+common+' : '+v+' = '+x+'.';steps=5;
  }else if(p===1){
   text='Найди наибольший общий положительный делитель чисел '+u+' и '+v+'.';
   answer=d;ex='Общие делители: '+allDivisors(d).join(', ')+'. Наибольший — '+d+'. Проверка: '+u+' : '+d+' = '+x+'; '+v+' : '+d+' = '+y+'. Числа '+x+' и '+y+' не имеют общего делителя больше 1.';steps=4;
  }else if(p===2){
   text='Из '+u+' карандашей и '+v+' фломастеров составляют наибольшее число одинаковых наборов без остатка. Сколько наборов получится?';
   answer=d;ex='Число наборов должно делить и '+u+', и '+v+'. Наибольший общий делитель — '+d+'. В каждом наборе '+u+' : '+d+' = '+x+' карандаша и '+v+' : '+d+' = '+y+' фломастеров.';steps=5;
  }else if(p===3){
   const left=common*rand(1,5)+rand(1,common-1),right=left+common*rand(4,15)+rand(0,common-1);
   text='Сколько чисел от '+left+' до '+right+' включительно делятся без остатка и на '+u+', и на '+v+'?';
   answer=Math.floor(right/common)-Math.floor((left-1)/common);
   const firstCommon=Math.ceil(left/common)*common,lastCommon=Math.floor(right/common)*common;
   ex='Общие кратные этих чисел идут с шагом '+common+'. Первое в промежутке '+firstCommon+', последнее '+lastCommon+'. Всего '+lastCommon+' : '+common+' − '+(firstCommon-common)+' : '+common+' = '+answer+'.';steps=5;
  }else{
   const limit=common*rand(2,13)+rand(1,common-1),next=common*(Math.floor(limit/common)+1);
   text='Найди наименьшее натуральное число, большее '+limit+', которое делится без остатка и на '+u+', и на '+v+'.';
   answer=next;ex='Наименьшее общее положительное кратное '+u+' и '+v+' равно '+common+'. Последнее общее кратное до '+limit+': '+common+' · '+Math.floor(limit/common)+' = '+(next-common)+'. Следующее: '+common+' · '+(Math.floor(limit/common)+1)+' = '+next+'. Проверка: '+next+' : '+u+' = '+(next/u)+', '+next+' : '+v+' = '+(next/v)+'.';steps=5;
  }
 }
 if(!Number.isSafeInteger(answer)||answer<0)throw Error('Invalid §18 answer '+t+'/'+p);
 const family='g5_divisors18_L'+t+'_F'+p,q=numeric(text,answer,ex+' Ответ: '+answer+'.',family,[answer+1,answer+2,Math.max(0,answer-1)]);
 q.mk18={id:'divisors_multiples_g5',t,p,steps,expected:answer,family};
 return q;
}
function make(id){
 const t=tier(),p=step(),a=rand(4,12+12*t),b=rand(3,10+10*t),c=rand(2,7+7*t);
 if(id==='number_tables'){
   const data=[a,b,c],sum=a+b+c;
   const table='<div style="max-width:100%;overflow-x:auto"><table style="width:100%;border-collapse:collapse;text-align:center"><caption style="text-align:left;padding:4px 0">Продажи товаров за три дня, шт.</caption><thead><tr><th scope="col">Показатель</th><th scope="col">Пн</th><th scope="col">Вт</th><th scope="col">Ср</th></tr></thead><tbody><tr><th scope="row">Продано</th><td>'+a+'</td><td>'+b+'</td><td>'+c+'</td></tr></tbody></table></div>';
   if(p===0)return numeric('Сколько товаров продали в понедельник? '+table,a,'В таблице в столбце «Пн» записано '+a+'.','table_read',[b,c,sum]);
   if(p===1)return numeric('Сколько товаров продали за понедельник и вторник? '+table,a+b,'Складываем '+a+' + '+b+' = '+(a+b)+'.','table_two_days',[a,b,sum]);
   if(p===2)return numeric('Сколько товаров продали за три дня? '+table,sum,'Сумма '+a+' + '+b+' + '+c+' = '+sum+'.','table_total',[a+b,b+c,a+c]);
   if(p===3){const v=Math.max(a,b,c),u=Math.min(a,b,c);return numeric('На сколько больше товаров продали в самый успешный день, чем в самый слабый? '+table,v-u,'Наибольшее '+v+', наименьшее '+u+', разность '+(v-u)+'.','table_spread',[v,u,v+u]);}
   return numeric('За четыре дня продали '+(sum+a)+' товаров. Сколько продали в четвёртый день? '+table,a,'В таблице за три дня: '+sum+'. Четвёртый день: '+(sum+a)+' − '+sum+' = '+a+'.','table_reverse',[sum,b,c]);
 }
 if(id==='column_charts'){
   const h=[a,b,c],min=Math.min(...h),max=Math.max(...h);
   const chart='<div role="img" aria-label="Столбчатая диаграмма: Пн '+a+', Вт '+b+', Ср '+c+'" style="display:flex;align-items:flex-end;gap:12px;min-height:160px;padding:10px 4px"><div style="height:'+(a*3)+'px;max-height:150px;width:46px;background:#629cd9;text-align:center">'+a+'</div><div style="height:'+(b*3)+'px;max-height:150px;width:46px;background:#629cd9;text-align:center">'+b+'</div><div style="height:'+(c*3)+'px;max-height:150px;width:46px;background:#629cd9;text-align:center">'+c+'</div></div><p>Столбцы слева направо: понедельник, вторник, среда. Значения подписаны над ними.</p>';
   if(p===0)return numeric('Какое значение у столбца за вторник? '+chart,b,'Столбец вторника показывает '+b+'.','chart_read',[a,c,a+b]);
   if(p===1)return numeric('Найди сумму значений столбцов понедельника и среды. '+chart,a+c,'Складываем '+a+' + '+c+' = '+(a+c)+'.','chart_sum',[a,b,c]);
   if(p===2)return numeric('На сколько самый высокий столбец превышает самый низкий? '+chart,max-min,'Сравниваем '+max+' и '+min+', разность '+(max-min)+'.','chart_compare',[max,min,max+min]);
   if(p===3)return numeric('Найди сумму значений всех трёх столбцов. '+chart,a+b+c,'Сумма '+a+' + '+b+' + '+c+' = '+(a+b+c)+'.','chart_total',[a+b,b+c,a+c]);
   return numeric('В четверг показатель равен сумме вторника и среды. Найди общий показатель за четыре дня. '+chart,a+2*b+2*c,'Четверг '+b+' + '+c+' = '+(b+c)+'. За четыре дня '+(a+b+c)+' + '+(b+c)+' = '+(a+2*b+2*c)+'.','chart_multistep',[a+b+c,a+2*b+c]);
 }
 if(id==='divisors_multiples_g5')return makeDivisors(t,p);
 if(id==='divisibility_rules_g5'){
   const n=rand(11,80+100*t),m=n*10+rand(0,9);
   if(p===0)return choose('Какой признак делимости на 2 верен?','Последняя цифра чётная',['Сумма цифр чётная','Число оканчивается цифрой 5','Число содержит цифру 2'],'Число делится на 2, если его последняя цифра — 0, 2, 4, 6 или 8.','rule_even');
   if(p===1)return numeric('Какую цифру надо поставить вместо □ в числе '+n+'□, чтобы число делилось на 10?',0,'Число делится на 10, если оканчивается цифрой 0.','rule_ten',[2,5,9]);
   if(p===2)return numeric('Найди наименьшее натуральное число, которое надо прибавить к '+m+', чтобы сумма делилась на 5.',(5-m%5)%5,'Ближайшее кратное пяти не меньше '+m+' равно '+(m+(5-m%5)%5)+'. Прибавим '+((5-m%5)%5)+'.','rule_five',[1,2,4]);
   if(p===3){const digitSum=String(m).split('').reduce((acc,d)=>acc+Number(d),0);return numeric('Чему равен остаток при делении числа '+m+' на 3?',digitSum%3,'Сумма цифр '+digitSum+'. Остатки при делении числа и суммы его цифр на 3 совпадают: '+(digitSum%3)+'.','rule_three',[3,4,5]);}
   const ds=String(m).split('').reduce((sum,d)=>sum+Number(d),0);return numeric('Сколько нужно прибавить к '+m+', чтобы получить ближайшее число, делящееся на 9?',(9-ds%9)%9,'Сумма цифр '+ds+', чтобы получить кратное 9, нужно добавить '+((9-ds%9)%9)+'.','rule_nine',[9,ds%9,ds]);
 }
 if(id==='formulas_g5'){
   const length=a,width=b,height=c,perimeter=2*(a+b),area=a*b,volume=area*c;
   if(p===0)return numeric('Прямоугольник: длина '+a+' см, ширина '+b+' см. Найди периметр по формуле P = 2(a + b).',perimeter,'P = 2 · ('+a+' + '+b+') = '+perimeter+' см.','formula_perimeter',[a+b,area]);
   if(p===1)return numeric('По формуле S = ab найди площадь прямоугольника со сторонами '+a+' см и '+b+' см.',area,'S = '+a+' · '+b+' = '+area+' см².','formula_area',[perimeter,a+b]);
   if(p===2)return numeric('По формуле V = abc найди объём коробки размерами '+a+' см, '+b+' см и '+c+' см.',volume,'V = '+a+' · '+b+' · '+c+' = '+volume+' см³.','formula_volume',[area,perimeter]);
   if(p===3)return numeric('Периметр прямоугольника '+perimeter+' см, длина '+a+' см. Найди ширину по формуле P = 2(a + b).',b,'Полупериметр '+(a+b)+', ширина '+(a+b)+' − '+a+' = '+b+'.','formula_reverse',[a,a+b]);
   return numeric('Прямоугольник '+a+' на '+b+' см. Его длину увеличили на '+c+' см. На сколько увеличилась площадь?',c*b,'Новая площадь ('+a+' + '+c+') · '+b+'. Старая '+area+'. Разница '+c+' · '+b+' = '+(c*b)+' см².','formula_difference',[c*a,c*(a+b)]);
 }
 if(id==='area_units_g5'){
   const factor=[100,10000,1000000][t],value=rand(2,9+t*5),ha=10000;
   if(p===0)return numeric('Сколько квадратных сантиметров в '+value+' дм²?',value*100,'1 дм² = 100 см². Поэтому '+value+' дм² = '+(value*100)+' см².','units_dm_cm',[value*10,value+100]);
   if(p===1)return numeric('Сколько квадратных дециметров в '+value+' м²?',value*100,'1 м² = 100 дм², значит '+value+' · 100 = '+(value*100)+' дм².','units_m_dm',[value*10,value*10000]);
   if(p===2)return numeric('Сколько квадратных сантиметров в '+value+' м²?',value*10000,'1 м² = 10 000 см², значит '+value+' · 10 000 = '+(value*10000)+' см².','units_m_cm',[value*100,value*1000]);
   if(p===3)return numeric('Площадь участка '+value+' гектаров. Сколько это квадратных метров?',value*ha,'1 га = 10 000 м². Получаем '+(value*ha)+' м².','units_ha_m',[value*1000,value*100]);
   const w=rand(2,10+t*10);return numeric('Прямоугольник имеет длину '+value+' дм и ширину '+w+' дм. Сколько квадратных сантиметров составляет его площадь?',value*w*100,'Площадь '+value+' · '+w+' = '+(value*w)+' дм². Каждый дм² равен 100 см². Итого '+(value*w*100)+' см².','units_area_multistep',[value*w,value*w*10]);
 }
 throw Error('Unknown curriculum topic '+id);
}
g5DonorQuestion=function(id){return NEW.some(t=>t.id===id)?make(id):previous(id)};
const lessons={
number_tables:'Числовую информацию удобно записывать в таблице. Столбец и строка показывают, к чему относится число. Для общего результата складывают данные, для сравнения — вычитают.',
column_charts:'Столбчатая диаграмма показывает количество предметов высотой прямоугольных столбцов. Сначала прочитай название, единицы измерения и подписи дней на горизонтальной оси. На вертикальной оси найдёшь шкалу: между соседними короткими линиями 10 штук, между подписанными крупными делениями 20 штук. Чтобы прочитать значение, проведи мысленно горизонтальную линию от верхнего края столбца к шкале. Если два столбца расположены рядом, цвета и легенда обозначают два разных вида товаров: синие — тетради, оранжевые — альбомы. Для сравнения найди разность, для общего количества — сумму; в задачах про изменения сначала найди показатели по диаграмме, затем прибавь или вычти изменения.',
divisors_multiples_g5:'Делитель натурального числа — число, на которое оно делится без остатка. Например, 4 — делитель 12, так как 12 : 4 = 3. Число 1 и само число являются его делителями. Кратные числа a: 0, a, 2a, 3a, …; положительные кратные начинаются с a. Например, 12, 24, 36 — положительные кратные 12. Чтобы проверить общий делитель, делим на него оба числа без остатка. Наибольший общий делитель — самый большой из общих положительных делителей. Общее кратное делится без остатка на каждое исходное число; наименьшее общее положительное кратное можно найти перебором кратных. Например, у 6 и 8 общие кратные 24, 48, …, самое маленькое — 24. Для промежутка сначала найди первое подходящее кратное, затем последнее и пересчитай шаги включительно.',
divisibility_rules_g5:'Признак делимости позволяет узнать, делится ли число без остатка. На 2 делятся числа, заканчивающиеся на 0, 2, 4, 6, 8; на 5 — заканчивающиеся на 0 или 5; на 10 — заканчивающиеся на 0. На 3 и на 9 число делится, если сумма его цифр делится соответственно на 3 или на 9. Например, 234 делится на 3, поскольку 2 + 3 + 4 = 9. Чтобы число делилось одновременно на 2 и на 3, проверяй оба признака (получаются кратные 6); на 3 и 5 — кратные 15; на 2 и 9 — кратные 18; на 2, 3 и 5 — кратные 30. При подсчёте подходящих чисел в промежутке границы включают, только если они сами соответствуют условию. Для чисел, делящихся на 2 или на 5, сложи количества и один раз вычти общие кратные 10, чтобы их не посчитать дважды.',
formulas_g5:'Формула — равенство с буквами, которое показывает связь между величинами. Чтобы вычислить результат, подставь известные значения букв и выполни действия в нужном порядке. Например, путь s = v · t: при v = 60 км/ч и t = 3 ч получим s = 60 · 3 = 180 км. Обратно: скорость v = s : t, время t = s : v. Периметр прямоугольника P = 2(a + b): при a = 7 см и b = 4 см P = 2 · (7 + 4) = 22 см. Чтобы найти ширину по периметру и длине, сначала раздели P на 2, потом вычти a. Стоимость покупок C = p · n, где p — цена, n — число товаров; с доставкой d формула C = p · n + d. При вычислении буквенных выражений сначала раскрой скобки или найди их значение, затем выполни умножение и сложение. В ответе укажи единицы величины.',
area_units_g5:'Единицы площади — квадратные: 1 см², 1 дм², 1 м². Поскольку 1 дм = 10 см, то 1 дм² = 10 · 10 = 100 см². Поскольку 1 м = 10 дм, то 1 м² = 100 дм² = 10 000 см². Земельные меры: 1 а = 100 м²; 1 га = 100 а = 10 000 м². При переходе к более мелкой единице умножаем на коэффициент для ПЛОЩАДИ; к более крупной — делим. Например, 3 дм² = 3 · 100 = 300 см²; 700 см² = 700 : 100 = 7 дм². Если в задаче несколько площадей, сначала выражаем ВСЕ в одинаковых единицах, затем складываем или вычитаем. Для прямоугольника сначала вычисляем площадь S = a · b по сторонам, выраженным в одинаковых единицах длины, и только после этого переводим результат.'
};
g5Lesson=function(id){return Object.prototype.hasOwnProperty.call(lessons,id)?lessons[id]:previousLesson(id)};
window.mkG5V111Topics=NEW.map(t=>t.id);
})();