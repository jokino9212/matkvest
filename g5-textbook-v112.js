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
function cmpPlaceTable(x,y){
 const digits=Math.max(String(x).length,String(y).length),head=['Тысячи','Сотни','Десятки','Единицы'].slice(4-digits);
 const columns=head.map(label=>'<th scope="col" style="padding:6px;border:1px solid #7795b3">'+label+'</th>').join('');
 const row=(name,n)=>'<tr><th scope="row" style="padding:6px;border:1px solid #7795b3">'+name+'</th>'+
  String(n).padStart(digits,'0').split('').map(d=>'<td style="padding:6px;border:1px solid #7795b3;font-weight:600">'+d+'</td>').join('')+'</tr>';
 return '<div class="mk-g5-comparison-table" style="width:100%;max-width:590px;overflow-x:auto;margin:7px auto"><table style="width:100%;border-collapse:collapse;text-align:center"><caption style="text-align:left;padding:4px 0">Разряды двух натуральных чисел</caption><thead><tr><th scope="col" style="padding:6px;border:1px solid #7795b3">Число</th>'+columns+'</tr></thead><tbody>'+row('Первое',x)+row('Второе',y)+'</tbody></table></div>';
}
function cmpQuestion(t,p,text,answer,ex,steps,wrong=[]){
 const id='v141_natural_compare_L'+t+'_F'+p;
 const isSign=typeof answer==='string',q=isSign?option(text,answer,['<','>','='],ex,id):numeric(text,answer,ex,id,wrong);
 q.mk5Pedagogy={id:'natural_compare',stage:t,family:p,steps,expected:answer,kind:isSign?'sign':'number'};
 if(isSign)q.mk5Audit={type:'choice',expected:answer,level:t};
 return q;
}
function cmpShuffle(values){
 for(let i=values.length-1;i>0;i--){const j=rand(0,i);[values[i],values[j]]=[values[j],values[i]];}
 return values;
}
function cmpSign(a,b){return a<b?'<':a>b?'>':'=';}
function compareNatural(t,p){
 const h=rand(2,9),ten=rand(0,9),units=rand(0,9),n=h*100+ten*10+units;
 if(t===0){
  if(p===0){
   const diff=rand(1,25),mode=rand(0,3),other=mode===0?n:mode%2?n+diff:n-diff;
   const sign=cmpSign(n,other);
   return cmpQuestion(t,p,'Поставь правильный знак сравнения между числами '+n+' □ '+other+'. '+cmpPlaceTable(n,other),sign,'Сравниваем слева направо: сначала сотни, затем десятки, затем единицы. Получаем '+n+' '+sign+' '+other+'.',1);
  }
  if(p===1){let other=rand(120,979);if(other===n)other++;const greater=Math.max(n,other);return cmpQuestion(t,p,'Какое число больше: '+n+' или '+other+'?',greater,'Сравним цифры по разрядам: '+greater+' больше '+Math.min(n,other)+'.',1,[Math.min(n,other)]);}
  if(p===2){let other=rand(120,979);if(other===n)other++;const smaller=Math.min(n,other);return cmpQuestion(t,p,'Какое число меньше: '+n+' или '+other+'?',smaller,'Сравним цифры от старшего разряда. Меньшее число — '+smaller+'.',1,[Math.max(n,other)]);}
  if(p===3){
   const base=rand(120,810),u=rand(3,35),v=rand(3,35),items=cmpShuffle([base,base+u,base+u+v]);const answer=base+u;
   return cmpQuestion(t,p,'Какое из чисел находится между двумя другими по величине: '+items.join(', ')+'?',answer,'Упорядочим числа: '+base+' < '+answer+' < '+(base+u+v)+'. Между меньшим и большим — '+answer+'.',2,[base,base+u+v]);
  }
  const small=rand(800,999),large=rand(1000,1299),items=cmpShuffle([small,large]);
  return cmpQuestion(t,p,'Одно число трёхзначное, другое четырёхзначное. Какое из чисел '+items.join(' и ')+' больше?',large,'У четырёхзначного числа четыре цифры, у трёхзначного — три. Следовательно, '+large+' > '+small+'.',1,[small]);
 }
 if(t===1){
  if(p===0){
   const thousands=rand(2,8),hundreds=rand(0,9),tens=rand(1,7),u=rand(0,9),first=1000*thousands+100*hundreds+10*tens+u;
   const mode=rand(0,3),second=mode===0?first:mode%2?first+rand(11,19):first-rand(11,19);
   const sign=cmpSign(first,second);
   return cmpQuestion(t,p,'Сравни близкие четырёхзначные числа. Какой знак нужен: '+first+' □ '+second+'? '+cmpPlaceTable(first,second),sign,'Сравним тысячи, сотни, десятки и единицы по очереди: '+first+' '+sign+' '+second+'.',2);
  }
  if(p===1){
   const base=rand(1100,6300),a=rand(3,30),b=rand(3,30),c=rand(3,30),items=cmpShuffle([base,base+a,base+a+b,base+a+b+c]),answer=base+a+b;
   return cmpQuestion(t,p,'Четыре числа: '+items.join(', ')+'. Найди второе по величине число при расположении по убыванию.',answer,'Записываем по убыванию: '+[...items].sort((x,y)=>y-x).join(' > ')+'. Второе число — '+answer+'.',3,[base+a,base+a+b+c]);
  }
  if(p===2){const left=rand(220,960),right=left+rand(4,31),ans=right-left-1;return cmpQuestion(t,p,'Сколько натуральных чисел строго между '+left+' и '+right+'?',ans,'Разность границ '+right+' − '+left+' = '+(right-left)+'. Не учитываем обе границы: '+(right-left)+' − 1 = '+ans+'.',2,[right-left,right-left+1]);}
  if(p===3){
   const small=rand(260,670),large=small+rand(20,100),increase=rand(9,150),items=cmpShuffle([small,large]),newSmall=small+increase,ans=Math.max(large,newSmall);
   return cmpQuestion(t,p,'Из двух чисел '+items.join(' и ')+' меньшее увеличили на '+increase+'. Какое число стало большим после изменения?',ans,'Меньшее число '+small+' стало '+small+' + '+increase+' = '+newSmall+'. Сравним с '+large+': большее — '+ans+'.',3,[small,newSmall,large]);
  }
  const hundred=rand(2,8),unit=rand(0,9),low=rand(1,4),high=rand(low+2,9),lowNum=100*hundred+10*low+unit,highNum=100*hundred+10*high+unit;
  return cmpQuestion(t,p,'В числе '+hundred+'□'+unit+' на месте десятков стоит цифра □. Какую наименьшую цифру следует поставить вместо □, чтобы число было строго больше '+lowNum+' и строго меньше '+highNum+'?',low+1,'Сотни и единицы совпадают. Цифра десятков должна быть больше '+low+' и меньше '+high+'. Наименьшая подходящая цифра '+(low+1)+'.',3,[low,high,high-1]);
 }
 if(p===0){
  const digits=cmpShuffle([0,1,2,3,4,5,6,7,8,9]).slice(0,4),sorted=[...digits].sort((a,b)=>b-a),answer=Number(sorted.join(''));
  return cmpQuestion(t,p,'Используя каждую из цифр '+digits.join(', ')+' ровно один раз, составь наибольшее возможное четырёхзначное число.',answer,'Наибольшее число получаем, располагая разные цифры по убыванию: '+sorted.join('')+'.',4);
 }
 if(p===1){
  const digits=cmpShuffle([1,2,3,4,5,6,7,8,9]).slice(0,3),sorted=[...digits].sort((a,b)=>a-b),answer=Number(''+sorted[0]+'0'+sorted[1]+sorted[2]);
  return cmpQuestion(t,p,'Из цифр 0, '+digits.join(', ')+' (каждую используй один раз) составь наименьшее четырёхзначное число.',answer,'Первая цифра не может быть нулём. Ставим меньшую ненулевую цифру '+sorted[0]+', затем 0, затем '+sorted[1]+' и '+sorted[2]+': '+answer+'.',4);
 }
 if(p===2){
  const prefix=rand(21,79),unit=rand(0,9),low=rand(1,5),high=rand(low+2,9),left=prefix*100+10*low+unit,right=prefix*100+10*high+unit,answer=high-low-1;
  return cmpQuestion(t,p,'Сколько разных цифр можно поставить вместо □ в числе '+prefix+'□'+unit+', чтобы оно было строго больше '+left+' и строго меньше '+right+'?',answer,'Первые две цифры и единицы совпадают, поэтому сравним десятки: подходят цифры от '+(low+1)+' до '+(high-1)+'. Их количество '+answer+'.',4,[high-low,high-low+1]);
 }
 if(p===3){
  const left=rand(260,730),gap=rand(24,85),right=left+gap,down=rand(5,18),up=rand(5,18),answer=(right+up)-(left-down)-1;
  return cmpQuestion(t,p,'Левую границу '+left+' уменьшили на '+down+', а правую границу '+right+' увеличили на '+up+'. Сколько натуральных чисел стало строго между новыми границами?',answer,'Новые границы: '+(left-down)+' и '+(right+up)+'. Разность '+(right+up-left+down)+', исключаем обе границы и получаем '+answer+'.',4,[right-left-1,right+up-left+down]);
 }
 const base=rand(130,410),scoreA=base+25,scoreB=base+55,scoreC=base+100,scoreD=base+150;
 let deltaA=rand(60,150);if(deltaA===75||deltaA===125)deltaA++;
 const deltaB=rand(5,20),after=[scoreA+deltaA,scoreB-deltaB,scoreC,scoreD],order=[...after].sort((a,b)=>b-a),answer=order[1];
 if(new Set(after).size!==4)throw Error('Unexpected tied scores in comparison master');
 return cmpQuestion(t,p,'Команды А, Б, В, Г набрали соответственно '+scoreA+', '+scoreB+', '+scoreC+', '+scoreD+' баллов. После пересчёта команде А добавили '+deltaA+' баллов, а у команды Б сняли '+deltaB+'. Сколько баллов оказалось у команды, занявшей второе место?',answer,'После пересчёта результаты: А — '+after[0]+', Б — '+after[1]+', В — '+after[2]+', Г — '+after[3]+'. Упорядочим: '+order.join(' > ')+'. Второе место — '+answer+'.',5,[order[0],order[2],order[3]]);
}

function make(id){
 const t=level(),p=pos();
 const a=rand(4,9+10*t),b=rand(3,8+7*t),c=rand(2,7+5*t);
 if(id==='natural_compare')return compareNatural(t,p);
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
natural_compare:'Чтобы сравнить два натуральных числа, сначала сравни количество цифр: число с большим количеством цифр больше. Если количество цифр одинаковое, сравнивай разряды от самого старшего слева направо до первого различия. Записывай результат знаками <, > или =. При порядке по возрастанию числа идут от меньшего к большему, а по убыванию — от большего к меньшему. В строгом неравенстве границы не учитываются: между числами a и b (a < b) находится b − a − 1 натуральных чисел. При составлении четырёхзначного числа первая цифра не может быть нулём. Условия на неизвестную цифру проверяй по её разряду.',
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