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
 if(id==='divisors_multiples_g5'){
   const n=a*b, k=rand(2,5+t*3);
   if(p===0)return numeric('Найди наименьшее положительное кратное числа '+a+'.',a,'Первое положительное кратное числа '+a+' — само число '+a+'.','multiple_small',[2*a,b,n]);
   if(p===1)return numeric('Найди пятое положительное кратное числа '+b+'.',5*b,'Последовательность: '+b+', '+2*b+', '+3*b+', '+4*b+', '+5*b+'.','multiple_fifth',[4*b,6*b,b]);
   if(p===2)return numeric('Число '+n+' делится на '+a+' без остатка. Найди частное.',b,n+' : '+a+' = '+b+'.','divisor_quotient',[a,a+b,n]);
   if(p===3)return choose('Какое число является делителем числа '+n+'?',String(a),[String(n+1),String(n+2),String(n+3)],n+' = '+a+' · '+b+', поэтому '+a+' — делитель.','divisor_select');
   return numeric('Найди наименьшее общее положительное кратное чисел '+a+' и '+(a*k)+'.',a*k,'Число '+(a*k)+' делится и на '+a+', и на '+(a*k)+'. Любое их общее кратное должно быть кратно '+(a*k)+'.','common_multiple',[a,2*a*k,b*k]);
 }
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
divisors_multiples_g5:'Число a называют делителем числа b, если b делится на a без остатка. Кратные числа a: a, 2a, 3a, … . Например, 4 — делитель 12, а 12 — кратное 4.',
divisibility_rules_g5:'На 2 делятся числа с чётной последней цифрой; на 5 — с последней цифрой 0 или 5; на 10 — с последней цифрой 0; на 3 и 9 — если сумма цифр делится соответственно на 3 или 9.',
formulas_g5:'Формула — равенство, описывающее зависимость величин. Для прямоугольника P = 2(a + b), S = ab. Для прямоугольного параллелепипеда V = abc. Чтобы найти значение, подставь известные числа.',
area_units_g5:'1 дм² = 100 см²; 1 м² = 100 дм² = 10 000 см²; 1 га = 10 000 м². При переводе площадей коэффициент единиц длины возводят в квадрат.'
};
g5Lesson=function(id){return Object.prototype.hasOwnProperty.call(lessons,id)?lessons[id]:previousLesson(id)};
window.mkG5V111Topics=NEW.map(t=>t.id);
})();