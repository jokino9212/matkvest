/* Grade 5 v113: genuine changes of reasoning between three difficulty stages. */
(function(){
'use strict';
const IDS=['natural_compare','cuboid','calculator','angle_types'];
if(typeof g5DonorQuestion!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof activeDifficulty!=='function')throw Error('v113 missing prerequisites');
const oldDonor=g5DonorQuestion, oldLesson=g5Lesson;
const ri5=(a,b)=>ri(a,b),stage=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0));
const familyIndex=()=>Math.max(0,Number(blockSession?.done)||0)%5;
function number(text,value,why,name,steps,values=[]){
 if(!Number.isSafeInteger(value)||steps<1)throw Error('v113 invalid computed answer '+name+' '+value);
 const q=g5q(text,g5nums(value,values.filter(Number.isSafeInteger)),String(value),why,name);
 q.mk5Pedagogy={stage:stage(),steps,family:name,expected:value};
 return q;
}
function choice(text,correct,distractors,why,name,steps=1){
 const distinct=[...new Set([correct,...distractors])];
 if(distinct.length<3)throw Error('v113 duplicate alternatives '+name);
 const q=g5q(text,distinct.map((label,i)=>({key:i===0?'ok':'no'+i,label})), 'ok',why,name);
 q.mk5Pedagogy={stage:stage(),steps,family:name,expected:correct};
 return q;
}
function compare(p,t){
 const a=ri5(12,80+t*50),b=ri5(8,45+t*30),c=ri5(3,24+t*16),d=ri5(2,16+t*10),e=ri5(2,10+t*10);
 if(t===0){
  if(p===0)return number('Какое число больше: '+(a+b)+' или '+a+'?',a+b,'Сравниваем '+(a+b)+' и '+a+'. Первое число больше.','cmp_max',1,[a,b]);
  if(p===1)return number('На сколько число '+(a+b)+' больше числа '+a+'?',b,'Вычитаем '+(a+b)+' − '+a+' = '+b+'.','cmp_delta',1,[a,b+a]);
  if(p===2)return number('Какое натуральное число следует сразу за '+a+'?',a+1,'Следующее натуральное число '+a+' + 1 = '+(a+1)+'.','cmp_successor',1,[a-1,a]);
  if(p===3)return number('Назови наибольшее из чисел '+a+', '+(a+b)+' и '+(a+c)+'.',a+Math.max(b,c),'Сравниваем слагаемые '+b+' и '+c+'. Большее значение '+(a+Math.max(b,c))+'.','cmp_three',1,[a,a+b,a+c]);
  return number('Сколько натуральных чисел находится строго между '+a+' и '+(a+c)+'?',c-1,'Исключая оба конца, чисел '+c+' − 1 = '+(c-1)+'.','cmp_between',1,[c,c+1]);
 }
 if(t===1){
  if(p===0){const x=a+b,y=a+c;return number('Сравни суммы '+a+' + '+b+' и '+a+' + '+c+'. На сколько одна сумма больше другой?',Math.abs(b-c),'Суммы равны '+x+' и '+y+'. Разность '+Math.abs(x-y)+'.','cmp_sum_gap',2,[x,y]);}
  if(p===1){const x=a+b,y=a+c,z=a+d;const ordered=[x,y,z].sort((u,v)=>u-v);return number('Упорядочь '+x+', '+y+', '+z+'. Назови среднее по величине число.',ordered[1],'По возрастанию: '+ordered.join(', ')+'. Среднее '+ordered[1]+'.','cmp_median',2,[ordered[0],ordered[2]]);}
  if(p===2){const x=a+b,y=a+c;return number('Число '+x+' уменьшили на '+d+', а '+y+' увеличили на '+e+'. Найди большее из получившихся.',Math.max(x-d,y+e),'После двух действий числа '+(x-d)+' и '+(y+e)+'. Большее '+Math.max(x-d,y+e)+'.','cmp_adjusted',3,[x,y]);}
  if(p===3)return number('Найди наименьшее натуральное число, которое больше '+(a+b)+' и одновременно больше '+(a+c)+'.',a+Math.max(b,c)+1,'Искомое число на единицу больше максимума '+Math.max(a+b,a+c)+': '+(a+Math.max(b,c)+1)+'.','cmp_lower_bound',2,[a+b,a+c]);
  return number('После уменьшения числа '+(a+b)+' на '+d+' и увеличения числа '+(a+c)+' на '+e+' сколько натуральных чисел строго между результатами?',Math.max(0,Math.abs(a+b-d-(a+c+e))-1),'Получились '+(a+b-d)+' и '+(a+c+e)+'. Между ними '+Math.max(0,Math.abs(a+b-d-(a+c+e))-1)+' натуральных чисел.','cmp_new_between',3,[a+b-d,a+c+e]);
 }
 if(p===0){const A=(a+b)*c,B=a*c+b*d;return number('Вычисли выражения ('+a+' + '+b+') · '+c+' и '+a+' · '+c+' + '+b+' · '+d+'. На сколько большее значение превосходит меньшее?',Math.abs(A-B),'Первое '+A+', второе '+B+', разность '+Math.abs(A-B)+'.','cmp_complex_values',4,[A,B]);}
 if(p===1){const nums=[a+b,a+c,a+d,a+e].sort((u,v)=>u-v);return number('Упорядочь числа '+[a+b,a+c,a+d,a+e].join(', ')+'. Найди разность двух средних чисел.',nums[2]-nums[1],'После упорядочивания '+nums.join(' < ')+'. Разность средних '+nums[2]+' − '+nums[1]+' = '+(nums[2]-nums[1])+'.','cmp_middle_gap',3,[nums[0],nums[3]]);}
 if(p===2){const x=a+b+c,y=a+d+e;return number('Из числа '+x+' вычли '+b+', затем прибавили '+d+'. Из числа '+y+' вычли '+e+', затем прибавили '+c+'. Какова разность получившихся чисел?',Math.abs((x-b+d)-(y-e+c)),'Получилось '+(x-b+d)+' и '+(y-e+c)+'. Модуль разности '+Math.abs((x-b+d)-(y-e+c))+'.','cmp_transform_difference',5,[x,y]);}
 if(p===3){const left=a+b,right=a+c;return number('Сколько натуральных чисел строго между числами ('+left+' + '+d+') и ('+right+' + '+e+')?',Math.max(0,Math.abs(left+d-right-e)-1),'Границы '+(left+d)+' и '+(right+e)+'. Разность границ '+Math.abs(left+d-right-e)+'. Исключаем концы, получаем '+Math.max(0,Math.abs(left+d-right-e)-1)+'.','cmp_expression_interval',4,[left,right]);}
 const X=a+b+c,Y=a+d+e,Z=a+b+d;return number('Три числа: '+X+', '+Y+', '+Z+'. К самому большому прибавили '+c+', а из самого маленького вычли '+d+'. Найди новую разность между ними.',Math.max(X,Y,Z)+c-(Math.min(X,Y,Z)-d),'Наибольшее '+Math.max(X,Y,Z)+', наименьшее '+Math.min(X,Y,Z)+'. После изменения разность '+(Math.max(X,Y,Z)+c-(Math.min(X,Y,Z)-d))+'.','cmp_extremes_shift',4,[Math.max(X,Y,Z),Math.min(X,Y,Z)]);
}
function box(p,t){
 const a=ri5(3,7+t*4),b=ri5(3,8+t*4),c=ri5(2,6+t*3),d=ri5(2,4+t*3);
 const V=a*b*c,S=2*(a*b+a*c+b*c);
 if(t===0){
  if(p===0)return choice('Сколько граней у прямоугольного параллелепипеда?','6',['8','12','4'],'Прямоугольный параллелепипед имеет 6 граней.','cuboid_faces_basic');
  if(p===1)return choice('Сколько рёбер у прямоугольного параллелепипеда?','12',['6','8','10'],'У прямоугольного параллелепипеда 12 рёбер.','cuboid_edges_basic');
  if(p===2)return number('Сколько единичных кубиков образуют параллелепипед с измерениями '+a+' и '+b+' и высотой 1?',a*b,'Умножаем '+a+' · '+b+' · 1 = '+(a*b)+'.','cuboid_base_cubes',1,[a+b,a+b+1]);
  if(p===3)return choice('Сколько вершин у прямоугольного параллелепипеда?','8',['6','10','12'],'У параллелепипеда 8 вершин.','cuboid_vertices_basic');
  return number('Найди площадь одной прямоугольной грани со сторонами '+a+' см и '+b+' см.',a*b,'Площадь прямоугольника '+a+' · '+b+' = '+(a*b)+' см².','cuboid_single_face',1,[a+b,a*b+1]);
 }
 if(t===1){
  if(p===0)return number('Найди сумму площадей двух противоположных граней '+a+' × '+b+' см.',2*a*b,'Площадь одной грани '+a*b+' см², двух: 2 · '+a+' · '+b+' = '+(2*a*b)+' см².','cuboid_opposite_faces',2,[a*b,2*(a+b)]);
  if(p===1)return number('Коробка имеет рёбра '+a+', '+b+', '+c+' см. Найди сумму длин всех 12 рёбер.',4*(a+b+c),'Каждое измерение встречается четырежды, поэтому 4 · ('+a+' + '+b+' + '+c+') = '+4*(a+b+c)+' см.','cuboid_total_edges',3,[a+b+c,V]);
  if(p===2)return number('Объём прямоугольного параллелепипеда '+V+' см³, длина '+a+' см и ширина '+b+' см. Найди высоту.',c,'Из V = abc находим c = '+V+' : ('+a+' · '+b+') = '+c+' см.','cuboid_missing_height',2,[a,b,V]);
  if(p===3)return number('Найди площадь трёх граней, сходящихся в одной вершине, для коробки '+a+' × '+b+' × '+c+' см.',a*b+a*c+b*c,'Сумма ab + ac + bc = '+(a*b)+' + '+(a*c)+' + '+(b*c)+' = '+(a*b+a*c+b*c)+' см².','cuboid_three_faces',3,[S,V]);
  return number('Две одинаковые коробки '+a+' × '+b+' × '+c+' см. Найди их общий объём.',2*V,'Объём одной '+V+' см³, двух '+(2*V)+' см³.','cuboid_pair_volume',3,[V,S]);
 }
 if(p===0)return number('Коробка '+a+' × '+b+' × '+c+' см. Найди площадь четырёх боковых граней (без дна и крышки).',2*c*(a+b),'Две боковые грани c·a и две c·b: 2 · '+c+' · ('+a+' + '+b+') = '+2*c*(a+b)+' см².','cuboid_lateral_area',4,[S,2*a*b]);
 if(p===1){const perimeter=4*(a+b+c);return number('Сумма длин всех рёбер коробки '+perimeter+' см. Её длина '+a+' см, ширина '+b+' см. Найди высоту.',c,'Каждая из трёх длин встречается четыре раза. Высота '+perimeter+' : 4 − '+a+' − '+b+' = '+c+' см.','cuboid_inverse_edges',3,[a,b,perimeter]);}
 if(p===2)return number('Была коробка '+a+' × '+b+' × '+c+' см. Длину увеличили на '+d+' см. На сколько кубических сантиметров увеличился объём?',b*c*d,'Разность объёмов ('+a+' + '+d+') · '+b+' · '+c+' − '+a+' · '+b+' · '+c+' = '+b*c*d+' см³.','cuboid_volume_increase',4,[V,V+b*c*d]);
 if(p===3)return number('Из коробки '+a+' × '+b+' × '+c+' см убрали верхнюю грань. Найди площадь пяти оставшихся граней.',S-a*b,'Полная площадь '+S+' см². Убрали верхнюю грань '+a*b+' см². Осталось '+(S-a*b)+' см².','cuboid_open_box',5,[S,a*b]);
 return number('Коробка '+a+' × '+b+' × '+c+' см. Её длину увеличили на '+d+' см. Затем изготовили ещё две такие же увеличенные коробки. Найди суммарный объём трёх новых коробок.',3*(a+d)*b*c,'Объём увеличенной коробки ('+a+' + '+d+') · '+b+' · '+c+' = '+(a+d)*b*c+' см³. Три коробки: '+3*(a+d)*b*c+' см³.','cuboid_three_new_boxes',5,[V,(a+d)*b*c]);
}
function calc(p,t){
 const a=ri5(20,85+t*30),b=ri5(5,25+t*15),c=ri5(2,9+t*5),d=ri5(2,7+t*4);
 if(t===0){
  if(p===0)return number('Найди на калькуляторе '+a+' + '+b+'.',a+b,a+' + '+b+' = '+(a+b)+'.','calc_simple_add',1,[a,b]);
  if(p===1)return number('Найди на калькуляторе '+(a+b)+' − '+b+'.',a,(a+b)+' − '+b+' = '+a+'.','calc_simple_sub',1,[b,a+b]);
  if(p===2)return number('Найди на калькуляторе '+b+' · '+c+'.',b*c,b+' · '+c+' = '+(b*c)+'.','calc_simple_mul',1,[b+c,c]);
  if(p===3)return number('Найди на калькуляторе '+b*c+' : '+c+'.',b,b*c+' : '+c+' = '+b+'.','calc_simple_div',1,[b*c,c]);
  return number('Какое значение получится при вводе на калькуляторе '+a+' + '+b+' + '+c+'?',a+b+c,'Последовательно складываем '+a+' + '+b+' + '+c+' = '+(a+b+c)+'.','calc_three_add',2,[a+b,b+c]);
 }
 if(t===1){
  if(p===0)return number('На калькуляторе вычисли ('+a+' + '+b+') · '+c+'.',(a+b)*c,'Сначала сумма '+(a+b)+', затем умножаем на '+c+': '+((a+b)*c)+'.','calc_parenthesized',2,[a+b,a+b*c]);
  if(p===1)return number('На экране '+a+'. Нажали «+ '+b+'», затем «− '+c+'». Какое число получится?',a+b-c,'Последовательно: '+a+' + '+b+' − '+c+' = '+(a+b-c)+'.','calc_screen_chain',2,[a+b,a-c]);
  if(p===2)return number('Вычисли ('+(b*c)+' − '+b+') : '+b+'.',c-1,'Сначала '+b*c+' − '+b+' = '+b*(c-1)+'. Затем делим на '+b+': '+(c-1)+'.','calc_div_brackets',2,[c,c+1]);
  if(p===3)return number('Калькулятор показал '+(a*b+d)+'. Какова ошибка по сравнению с точным произведением '+a+' · '+b+'?',d,'Точное произведение '+(a*b)+'. Разница '+(a*b+d)+' − '+a*b+' = '+d+'.','calc_result_error',2,[a,b]);
  return number('Число '+a+' увеличили на '+b+', а затем умножили результат на '+c+'. Что покажет калькулятор?',(a+b)*c,'Два действия: ('+a+' + '+b+') · '+c+' = '+((a+b)*c)+'.','calc_story_chain',2,[a+b,a+b*c]);
 }
 if(p===0){const k=Math.min(d,c);return number('Вычисли ('+a+' + '+b+') · '+c+' − '+k+' · '+b+'.',(a+b)*c-k*b,'Сначала скобки и два произведения, затем разность: '+(a+b)*c+' − '+k*b+' = '+((a+b)*c-k*b)+'.','calc_four_operations',4,[a+b,(a+b)*c]);}
 if(p===1){const result=(a+b)*c-d;return number('На экране было '+a+'. После «+ '+b+'», «× '+c+'», «− '+d+'» какое число получится?',result,'Последовательно: ('+a+' + '+b+') · '+c+' − '+d+' = '+result+'.','calc_three_buttons',3,[a+b,(a+b)*c]);}
 if(p===2){const target=(a+b)*c;return number('На калькуляторе вычисли (x + '+b+') · '+c+' = '+target+'. Найди x, затем увеличь его на '+d+'.',a+d,'Сначала '+target+' : '+c+' = '+(a+b)+', затем '+(a+b)+' − '+b+' = '+a+'. Увеличиваем результат на '+d+': '+(a+d)+'.','calc_reverse_chain',3,[a,a+b,target]);
 }
 if(p===3){const A=(a+b)*c,B=a*c+b*d;return number('Найди разницу результатов двух вычислений: ('+a+' + '+b+') · '+c+' и '+a+' · '+c+' + '+b+' · '+d+'.',Math.abs(A-B),'Результаты '+A+' и '+B+'. Разность '+Math.abs(A-B)+'.','calc_compare_formulas',4,[A,B]);}
 const total=a+b*c;return number('Для '+c+' одинаковых групп купили по '+b+' тетрадей, а отдельно ещё '+a+' тетрадей. Затем '+d+' тетрадей отдали. Сколько осталось?',total-d,'Всего '+c+' · '+b+' + '+a+' = '+total+'. После передачи осталось '+(total-d)+'.','calc_multistep_story',3,[total,a+b+c]);
}
function angles(p,t){
 const a=ri5(20,67),b=ri5(15,45),c=ri5(12,36);
 if(t===0){
  if(p===0)return choice('Как называется угол '+a+'°?','Острый',['Прямой','Тупой','Развёрнутый'],'Угол '+a+'° меньше 90°. Он острый.','angle_classify_acute');
  if(p===1)return choice('Как называется угол '+(a+90)+'°?','Тупой',['Острый','Прямой','Развёрнутый'],'Между 90° и 180° — тупой угол.','angle_classify_obtuse');
  if(p===2)return number('Сколько градусов не хватает углу '+a+'° до прямого?',90-a,'Прямой угол равен 90°, значит 90 − '+a+' = '+(90-a)+'°.','angle_right_gap',1,[a,180-a]);
  if(p===3)return number('Сколько градусов не хватает углу '+(a+90)+'° до развёрнутого?',90-a,'Развёрнутый угол 180°; 180 − '+(a+90)+' = '+(90-a)+'°.','angle_straight_gap',1,[a,180-a]);
  return choice('Какой угол можно построить чертёжным треугольником без транспортира?','Прямой',['Развёрнутый','Тупой','Полный'],'У чертёжного треугольника есть прямой угол 90°.','angle_square');
 }
 if(t===1){
  if(p===0)return number('Угол составили из двух частей '+a+'° и '+b+'°, затем увеличили на '+c+'°. Чему равен новый угол?',a+b+c,'Сначала '+a+' + '+b+' = '+(a+b)+'°, затем '+(a+b)+' + '+c+' = '+(a+b+c)+'°.','angle_sum_parts',2,[a+b,a+c]);
  if(p===1)return number('Прямой угол 90° разделили на углы '+a+'° и x°. Найди x и прибавь к нему '+c+'°.',90-a+c,'Недостающая часть 90 − '+a+' = '+(90-a)+'°. Затем прибавим '+c+'° и получим '+(90-a+c)+'°.','angle_missing_right',2,[a,90-a]);
  if(p===2)return number('Угол '+(a+b)+'° разделили на две части. Первая '+a+'°. На сколько градусов вторая часть отличается от первой?',Math.abs(b-a),'Вторая часть '+b+'°. Разность между частями '+Math.abs(a-b)+'°.','angle_compare_parts',3,[a,b,a+b]);
  if(p===3)return number('Смежные углы дают 180°. Один из них '+(a+90)+'°. Второй увеличили на '+c+'°. Чему равен новый угол?',90-a+c,'Второй угол равен 180 − '+(a+90)+' = '+(90-a)+'°. После увеличения на '+c+'° получаем '+(90-a+c)+'°.','angle_adjacent',2,[a,180-a]);
  return number('Вокруг точки четыре угла: '+a+'°, '+b+'°, '+c+'° и x°. Найди x.',360-a-b-c,'Вокруг точки 360°. Оставшийся угол 360 − '+a+' − '+b+' − '+c+' = '+(360-a-b-c)+'°.','angle_around_point',3,[a+b+c,180-a-b]);
 }
 if(p===0)return number('Развёрнутый угол 180° состоит из трёх частей: '+a+'°, '+b+'° и x°. Найди x.',180-a-b,'Сначала сумма частей '+(a+b)+'°. Вычитаем из 180° и получаем '+(180-a-b)+'°.','angle_three_parts',3,[a+b,180-a]);
 if(p===1)return number('Вокруг точки четыре угла: '+a+'°, '+(a+b)+'°, '+c+'° и x°. Найди x.',360-2*a-b-c,'Складываем три известных угла '+(2*a+b+c)+'°, затем вычитаем из 360°: '+(360-2*a-b-c)+'°.','angle_four_parts',4,[a+b,360-a-b-c]);
 if(p===2)return number('Смежные углы дают 180°. Первый угол состоит из частей '+a+'° и '+b+'°. На сколько второй угол больше части '+c+'°?',180-a-b-c,'Первый угол '+(a+b)+'°, второй '+(180-a-b)+'°. Разность с '+c+'° равна '+(180-a-b-c)+'°.','angle_supplement_compare',4,[180-a-b,a+b]);
 if(p===3){const x=a+b;return number('Два угла вместе составляют '+(x+c)+'°. Первый угол '+x+'°, а его часть равна '+a+'°. Чему равна сумма второй части первого угла и всего второго угла?',b+c,'Второй угол '+c+'°, оставшаяся часть первого '+b+'°. Сумма '+(b+c)+'°.','angle_two_subtractions',4,[x,c]);}
 const take=Math.min(c,90-a-1);return number('Прямой угол разделили на части '+a+'° и '+(90-a)+'°. От второй части отняли '+take+'°, а результат прибавили к первому углу. Найди сумму.',90-take,'Вторая часть '+(90-a)+'°. После уменьшения '+(90-a-take)+'°. С первой частью получаем '+(90-take)+'°.','angle_rebalance',4,[90,a]);
}
g5DonorQuestion=function(id){
 const p=familyIndex(),t=stage();
 if(id==='natural_compare')return compare(p,t);
 if(id==='cuboid')return box(p,t);
 if(id==='calculator')return calc(p,t);
 if(id==='angle_types')return angles(p,t);
 return oldDonor(id);
};
const improved={
natural_compare:'Начальный уровень: сравнивай числа и выполняй одно действие. Средний: сравнивай несколько чисел и результаты преобразований. Сложный: сначала вычисляй составные выражения, потом упорядочивай и сравнивай результаты.',
cuboid:'Начальный уровень: грани, рёбра, вершины и одна грань. Средний: площадь пар граней, сумма рёбер, объём и неизвестное измерение. Сложный: боковая поверхность, обратные задачи, изменение объёма и составные расчёты.',
calculator:'Начальный уровень: простые действия с калькулятором. Средний: два последовательных действия, скобки и поиск ошибки. Сложный: многошаговые вычисления, порядок действий и восстановление неизвестного числа.',
angle_types:'Начальный уровень: виды углов и дополнение до прямого или развёрнутого. Средний: части угла, смежные углы и полный угол вокруг точки. Сложный: задачи с несколькими частями и несколькими действиями.'
};
g5Lesson=function(id){return Object.prototype.hasOwnProperty.call(improved,id)?improved[id]:oldLesson(id)};
window.mkG5V113Tiered=IDS.slice();
})();