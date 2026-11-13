/* MathQuest grade 5: Vilenkin 2023–2026 textbook chapter labels and working tasks. */
(function(){
'use strict';
const NEW=[
{id:'natural_compare',ico:'⚖️',title:'Сравнение натуральных чисел',sub:'по разрядам, порядок и сравнение чисел'},
{id:'segments_polygons',ico:'📏',title:'Отрезок и его длина. Ломаная. Многоугольник',sub:'отрезки, длина ломаной, периметр многоугольника'},
{id:'plane_line_ray',ico:'📐',title:'Плоскость, прямая, луч, угол',sub:'геометрические фигуры и их свойства'},
{id:'area_rectangle',ico:'▭',title:'Площадь. Формула площади прямоугольника',sub:'площадь, стороны, составные прямоугольники'},
{id:'cuboid',ico:'📦',title:'Прямоугольный параллелепипед',sub:'вершины, грани, рёбра и развёртка'},
{id:'calculator',ico:'🧮',title:'Калькулятор',sub:'порядок ввода действий, проверка и оценка результата'},
{id:'angle_types',ico:'📐',title:'Виды углов. Чертёжный треугольник',sub:'острый, прямой, тупой, развёрнутый; чертёжный треугольник'}
];
if(typeof G5_CORE==='undefined'||typeof g5DonorQuestion!=='function'||typeof g5Lesson!=='function'||typeof g5q!=='function'||typeof g5nums!=='function')throw Error('v112: grade-five helpers unavailable');
for(const topic of NEW)if(G5_CORE.some(x=>x.id===topic.id))throw Error('v112 duplicate '+topic.id);
const pivot=G5_CORE.findIndex(x=>x.id==='operations');
G5_CORE.splice(pivot<0?G5_CORE.length:pivot,0,...NEW);
const oldDonor=g5DonorQuestion,oldLesson=g5Lesson,oldGrade5=renderGrade5;
const topicTitles={
natural:'Цифры и числа',
coordinate:'Шкалы и координатная прямая',
volume:'Объёмы. Объём прямоугольного параллелепипеда',
angles:'Измерение углов. Транспортир'
};
for(const [id,title] of Object.entries(topicTitles)){
 const found=G5_CORE.find(t=>t.id===id);
 if(!found)throw Error('v112 missing core '+id);
 found.sub=(found.sub||'')+'; '+found.title;
 found.title=title;
}
const rand=(a,b)=>ri(a,b);
const level=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0));
const pos=()=>Math.max(0,Number(blockSession&&blockSession.done)||0)%5;
function numeric(text,answer,ex,family,wrong=[]){
 if(!Number.isSafeInteger(answer))throw Error('v112 invalid answer '+family+' '+answer);
 const extra=[...new Set(wrong.filter(Number.isSafeInteger))].filter(x=>x!==answer);
 let k=1;while(extra.length<3){const v=answer+k++;if(!extra.includes(v))extra.push(v)}
 const q=g5q(text,g5nums(answer,extra),String(answer),ex,family);
 q.mk5Audit={type:'numeric',expected:answer,level:level()};
 return q;
}
function option(text,correct,other,ex,family){
 const labels=[correct,...other.filter(x=>x!==correct)];
 const unique=[...new Set(labels)];
 if(unique.length<3)throw Error('v112 insufficient alternatives '+family);
 return g5q(text,unique.map((label,i)=>({label,key:i===0?'yes':'no'+i})),'yes',ex,family);
}
function make(id){
 const t=level(),p=pos();
 const a=rand(4,9+10*t),b=rand(3,8+7*t),c=rand(2,7+5*t);
 if(id==='natural_compare'){
  const x=a*100+b*10+c,y=(a+t+1)*100+c*10+b;
  if(p===0)return numeric('Какое из чисел больше: '+x+' или '+y+'?',Math.max(x,y),'Сначала сравниваем сотни; больше '+Math.max(x,y)+'.','cmp_digits',[Math.min(x,y),x+y]);
  if(p===1)return numeric('На сколько '+Math.max(x,y)+' больше '+Math.min(x,y)+'?',Math.abs(x-y),'Находим разность '+Math.max(x,y)+' − '+Math.min(x,y)+' = '+Math.abs(x-y)+'.','cmp_difference',[x,y,x+y]);
  if(p===2){const values=[x,y,x+b*12].sort((u,v)=>u-v);return numeric('Числа '+x+', '+y+' и '+(x+b*12)+'. Какое из них среднее по величине?',values[1],'Упорядочиваем числа: '+values.join(' < ')+'. Среднее '+values[1]+'.','cmp_order',[values[0],values[2]]);}
  if(p===3){const n=rand(2,6+t*4);return numeric('Число '+x+' увеличили на '+n*10+'. Найди новое значение.',x+n*10,'Увеличиваем число: '+x+' + '+(n*10)+' = '+(x+n*10)+'.','cmp_increase',[x+n,x-n*10]);}
  const other=Math.min(x,y)+rand(5,30+t*40);
  return numeric('Сравни числа '+x+' и '+y+'. Затем к меньшему прибавь '+other+'. Найди большее из двух полученных чисел.',Math.max(Math.max(x,y),Math.min(x,y)+other),'После изменения меньшее станет '+(Math.min(x,y)+other)+', другое остаётся '+Math.max(x,y)+'. Большее '+Math.max(Math.max(x,y),Math.min(x,y)+other)+'.','cmp_after_change',[x,y,other]);
 }
 if(id==='segments_polygons'){
  const L=a+b,M=b+c,N=a+c;
  if(p===0)return numeric('Отрезок AB состоит из частей AC = '+a+' см и CB = '+b+' см. Найди AB.',L,'Длина целого отрезка равна сумме частей: '+a+' + '+b+' = '+L+' см.','segment_parts',[a,b,L+2]);
  if(p===1)return numeric('Ломаная состоит из звеньев '+a+' см, '+b+' см и '+c+' см. Найди её длину.',L+c,'Складываем длины всех звеньев: '+a+' + '+b+' + '+c+' = '+(L+c)+' см.','polyline_length',[L,M,N]);
  if(p===2)return numeric('Треугольник имеет стороны '+L+' см, '+M+' см и '+N+' см. Найди периметр.',L+M+N,'Периметр — сумма сторон: '+L+' + '+M+' + '+N+' = '+(L+M+N)+' см.','polygon_perimeter',[L+M,L+N]);
  if(p===3)return numeric('У пятиугольника четыре стороны длиной '+a+' см, а пятая '+b+' см. Найди периметр.',4*a+b,'Периметр: '+a+' · 4 + '+b+' = '+(4*a+b)+' см.','polygon_five_edges',[5*a,a+b]);
  const whole=L+c,missing=whole-a-b;
  return numeric('Ломаная из трёх звеньев имеет длину '+whole+' см. Первые звенья '+a+' см и '+b+' см. Найди третье.',missing,'Из общей длины вычитаем две известные: '+whole+' − '+a+' − '+b+' = '+missing+' см.','polyline_inverse',[a+b,whole-a,whole-b]);
 }
 if(id==='plane_line_ray'){
  if(p===0)return option('У какой фигуры два конца?','Отрезок',['Луч','Прямая','Плоскость'],'У отрезка два конца, у луча одно начало, прямая не ограничена.','geometry_figures');
  if(p===1)return numeric('Через две различные точки провели прямые. Сколько различных прямых проходит через обе точки?',1,'Через две различные точки проходит ровно одна прямая.','geometry_two_points',[2,0,3]);
  if(p===2)return option('Как называется фигура с началом, уходящая бесконечно в одну сторону?','Луч',['Отрезок','Прямая','Угол'],'Луч имеет начало и не имеет конца в выбранном направлении.','geometry_ray');
  if(p===3){const n=rand(3,4+t);return numeric('На одной прямой отмечены '+n+' различных точек. Сколько различных отрезков можно выбрать с концами в этих точках?',n*(n-1)/2,'Каждая пара точек образует один отрезок; пар '+n+' · '+(n-1)+' : 2 = '+(n*(n-1)/2)+'.','geometry_choose_segments',[n,n-1,n*n]);}
  const rays=rand(3,4+t);return numeric('Из одной точки выходят '+rays+' различных лучей. Сколько углов можно образовать, выбирая любую пару этих лучей (включая развёрнутый)?',rays*(rays-1)/2,'Каждая пара лучей задаёт один угол: '+rays+' · '+(rays-1)+' : 2 = '+(rays*(rays-1)/2)+'.','geometry_choose_angles',[rays,rays*2]);
 }
 if(id==='area_rectangle'){
  const s=a*b;
  if(p===0)return numeric('Найди площадь прямоугольника со сторонами '+a+' см и '+b+' см.',s,'S = a · b = '+a+' · '+b+' = '+s+' см².','rectangle_area',[a+b,2*(a+b)]);
  if(p===1)return numeric('Площадь прямоугольника '+s+' см², ширина '+b+' см. Найди длину.',a,'Длина = S : b = '+s+' : '+b+' = '+a+' см.','rectangle_side',[b,s]);
  if(p===2)return numeric('К прямоугольнику '+a+' × '+b+' см приставили второй '+c+' × '+b+' см без перекрытия. Найди общую площадь.',s+c*b,'Складываем площади '+a+' · '+b+' + '+c+' · '+b+' = '+(s+c*b)+' см².','rectangle_compound',[s,c*b,a+c]);
  if(p===3)return numeric('Из прямоугольника '+a+' × '+(b+c)+' см вырезали прямоугольник '+a+' × '+c+' см. Найди оставшуюся площадь.',s,'Площадь большого '+a*(b+c)+', вырезали '+a*c+', осталось '+s+' см².','rectangle_cutout',[a*(b+c),a*c,s+c]);
  const increase=c,gain=t+1;return numeric('Длину прямоугольника '+a+' × '+b+' см увеличили на '+increase+' см, а ширину на '+gain+' см. На сколько увеличилась площадь?',(a+increase)*(b+gain)-s,'Новая площадь ('+a+' + '+increase+') · ('+b+' + '+gain+') = '+((a+increase)*(b+gain))+'. Старая '+s+'. Разность '+((a+increase)*(b+gain)-s)+' см².','rectangle_area_change',[increase*b,gain*a,increase+gain]);
 }
 if(id==='cuboid'){
  if(p===0)return option('Сколько граней у прямоугольного параллелепипеда?','6',['4','8','12'],'У прямоугольного параллелепипеда 6 прямоугольных граней.','cuboid_faces');
  if(p===1)return option('Сколько вершин у прямоугольного параллелепипеда?','8',['6','12','4'],'У прямоугольного параллелепипеда 8 вершин.','cuboid_vertices');
  if(p===2)return numeric('У прямоугольного параллелепипеда три разных измерения: '+a+', '+b+' и '+c+' см. Найди сумму длин всех его рёбер.',4*(a+b+c),'Рёбер каждой длины по 4, поэтому 4 · ('+a+' + '+b+' + '+c+') = '+(4*(a+b+c))+' см.','cuboid_edges',[a+b+c,2*(a+b+c)]);
  if(p===3)return numeric('Коробка имеет размеры '+a+' × '+b+' × '+c+' см. Сколько кубиков объёмом 1 см³ укладывается в коробке без пустот?',a*b*c,'Количество кубиков '+a+' · '+b+' · '+c+' = '+(a*b*c)+'.','cuboid_cubes',[a*b,a+b+c]);
  return numeric('Для коробки размерами '+a+' × '+b+' × '+c+' см вычисли площадь всех шести граней.',2*(a*b+a*c+b*c),'Пары граней имеют площади '+(a*b)+', '+(a*c)+' и '+(b*c)+'. Поэтому сумма 2 · ('+(a*b)+' + '+(a*c)+' + '+(b*c)+') = '+(2*(a*b+a*c+b*c))+' см².','cuboid_surface',[a*b+a*c+b*c,a*b*c]);
 }
 if(id==='calculator'){
  const n=a*100+b*10+c,m=b*10+a;
  if(p===0)return numeric('На калькуляторе вычисли сумму '+n+' + '+m+'.',n+m,'Складываем '+n+' и '+m+': '+(n+m)+'.','calc_add',[n,m]);
  if(p===1)return numeric('Калькулятор показывает '+n+'. После нажатия «−» и ввода '+m+' с «=» какое число будет на экране?',n-m,'Результат: '+n+' − '+m+' = '+(n-m)+'.','calc_subtract',[n+m,m]);
  if(p===2)return numeric('Вычисли '+a+' · '+b+' · '+c+' на калькуляторе. Какой результат верный?',a*b*c,'Последовательно умножаем: '+a+' · '+b+' · '+c+' = '+(a*b*c)+'.','calc_multiply',[a+b+c,a*b]);
  if(p===3)return numeric('Вычисли ('+a+' + '+b+') · '+c+'. Какое число должно получиться?',(a+b)*c,'Сначала выполняем сложение в скобках, затем умножение: ('+a+' + '+b+') · '+c+' = '+((a+b)*c)+'.','calc_order',[(a+b*c),a+b+c]);
  const error=rand(2,6+3*t);return numeric('Калькулятор показал '+(n*m+error)+' для произведения '+n+' · '+m+'. На сколько результат отличается от правильного?',error,'Верное произведение '+(n*m)+', показанное больше него на '+error+'.','calc_error',[n,m,error+1]);
 }
 if(id==='angle_types'){
  const acute=rand(15,75),obtuse=rand(95,160);
  if(p===0)return option('Определи вид угла '+acute+'°.','Острый',['Тупой','Прямой','Развёрнутый'],'Угол меньше 90° называется острым.','angle_acute');
  if(p===1)return option('Какой угол гарантированно есть у чертёжного треугольника?','Прямой',['Развёрнутый','Тупой','Полный'],'У чертёжного треугольника есть прямой угол 90°.','angle_square_tool');
  if(p===2)return option('Определи вид угла '+obtuse+'°.','Тупой',['Острый','Прямой','Развёрнутый'],'Угол больше 90°, но меньше 180° — тупой.','angle_obtuse');
  if(p===3)return numeric('Угол '+acute+'° дополняют до прямого угла. Сколько градусов надо добавить?',90-acute,'Прямой угол 90°, недостаёт 90 − '+acute+' = '+(90-acute)+'°.','angle_to_right',[acute,180-acute]);
  const first=rand(20,55),second=rand(30,75);
  return numeric('Два смежных угла образуют развёрнутый угол 180°. Первый угол '+(first+second)+'°. Найди второй.',180-first-second,'Смежные углы в сумме 180°. Значит второй: 180 − ('+first+' + '+second+') = '+(180-first-second)+'°.','angle_supplement',[first+second,90-first]);
 }
 throw Error('v112 unknown '+id);
}
g5DonorQuestion=function(id){return NEW.some(x=>x.id===id)?make(id):oldDonor(id)};
const lessons={
natural_compare:'Натуральные числа сравнивают по количеству цифр, затем по разрядам слева направо. Для упорядочивания располагают числа от меньшего к большему. При решении задач учитывают, что означает «на сколько больше».',
segments_polygons:'Отрезок ограничен двумя концами. Длина ломаной — сумма длин её звеньев. Периметр многоугольника — сумма длин всех сторон; если часть длины неизвестна, из целого вычитают известные части.',
coordinate:'Шкала состоит из делений. Цена деления — значение одного шага между соседними отметками: чтобы прочитать показание, умножь число шагов от нуля на цену деления. Координатный луч начинается в точке O(0) и имеет направление вправо; единичный отрезок показывает расстояние от 0 до 1. Координата точки — число единичных отрезков от начала луча. Для нахождения расстояния между точками вычти меньшую координату из большей. При перемещении вправо координата увеличивается, влево — уменьшается. Середина отрезка находится на равном расстоянии от его концов.',
plane_line_ray:'Плоскость — бесконечная ровная поверхность; на рисунке изображают только её часть. Прямая не имеет ни начала, ни конца. Через две различные точки проходит ровно одна прямая. Луч имеет начало, но не имеет конца. Отрезок ограничен двумя точками. Из точки на прямой выходят два противоположных луча. Угол состоит из двух лучей с общей вершиной. Если несколько лучей выходят из одной точки и располагаются в одной полуплоскости, любая пара задаёт один угол между ними.',
area_rectangle:'Площадь прямоугольника S = a · b. Если прямоугольник составлен из неперекрывающихся частей, площади складывают; вырезанную часть вычитают из общей площади.',
cuboid:'Прямоугольный параллелепипед имеет 6 граней, 12 рёбер и 8 вершин. Сумма длин всех рёбер равна 4(a + b + c), объём V = abc, площадь поверхности S = 2(ab + ac + bc).',
calculator:'При работе с калькулятором проверяй порядок действий и оценивай результат. Сначала выполняют действия в скобках, затем умножение и деление, после — сложение и вычитание.',
angle_types:'Острый угол меньше 90°, прямой — 90°, тупой между 90° и 180°, развёрнутый — 180°. Чертёжный треугольник позволяет строить прямой угол; смежные углы в сумме составляют 180°.'
};
g5Lesson=function(id){return Object.prototype.hasOwnProperty.call(lessons,id)?lessons[id]:oldLesson(id)};
function section(title,subtitle,cards){
 const el=document.createElement('section');el.className='g5-group';
 const head=document.createElement('div');head.className='grade-head';
 const left=document.createElement('div'),h=document.createElement('h2'),p=document.createElement('p');
 h.textContent=title;p.textContent=subtitle;left.append(h,p);
 const badge=document.createElement('span');badge.className='badge';badge.textContent=cards.length+' тем';
 head.append(left,badge);el.append(head);
 const grid=document.createElement('div');grid.className='grid';cards.forEach(card=>grid.appendChild(card));el.appendChild(grid);
 return el;
}
function groupSections(){
 const first=mainView.querySelector('.g5-group');
 if(!first)return;
 const cards=[...first.querySelectorAll('.g5-card')];
 if(cards.length!==G5_CORE.length)return;
 const keyed=new Map(G5_CORE.map((t,i)=>[t.id,cards[i]]));
 const buckets=[
  {title:'§ 1. Натуральные числа и нуль. Шкалы',subtitle:'Пункты 1–7 учебника: числа, геометрические основы, координаты, диаграммы',ids:['number_tables','natural','segments_polygons','plane_line_ray','coordinate','natural_compare','column_charts']},
  {title:'§ 2. Сложение и вычитание натуральных чисел',subtitle:'Пункты 8–11 учебника: действия, буквенные выражения и уравнения',ids:['natural_add','natural_subtract','numeric_literal_expressions','equations']},
  {title:'§ 3. Умножение и деление натуральных чисел',subtitle:'Пункты 12–19: действия, остаток, свойства, выражения, делимость',ids:['natural_multiply','natural_divide','division_remainder','simplify_expressions','expand_brackets','order','powers','divisors_multiples_g5','divisibility_rules_g5']},
  {title:'§ 4. Площади и объёмы',subtitle:'Пункты 20–24: формулы, площади, единицы, параллелепипед и объём',ids:['formulas_g5','area_rectangle','area_units_g5','cuboid','volume','geometry']},
  {title:'Дополнительная практика',subtitle:'Закрепление вычислений и прикладные задачи',ids:['operations','charts','units','word']},
  {title:'§ 7. Инструменты для вычислений и измерений',subtitle:'Пункты 49–51 учебника: калькулятор, виды и измерение углов',ids:['calculator','angle_types','angles']}
 ];
 const used=new Set();
 const pieces=buckets.map(bucket=>{
  const found=bucket.ids.map(id=>{const card=keyed.get(id);if(!card)throw Error('v112 catalog missing in section '+id);used.add(id);return card});
  return section(bucket.title,bucket.subtitle,found);
 });
 const rest=G5_CORE.map(t=>t.id).filter(id=>!used.has(id));
 if(rest.length)throw Error('v112 ungrouped core topics: '+rest.join(','));
 const instrument=pieces.pop();
 first.replaceWith(...pieces);
 const sections=[...mainView.querySelectorAll('.g5-group')];
 sections[sections.length-1].insertAdjacentElement('afterend',instrument);
}
renderGrade5=function(...args){const result=oldGrade5(...args);groupSections();return result};
window.mkG5V112Topics=NEW.map(t=>t.id);
})();