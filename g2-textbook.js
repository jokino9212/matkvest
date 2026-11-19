(function () {
'use strict';

const previousTopics=new Map(g2AllTopics().map(t=>[rawCourseId(t.id),t]));
const pick=values=>values[ri(0,values.length-1)];
const sum=items=>items.reduce((a,b)=>a+b,0);
const picture=(type,data)=>({type,data});
const numeric=(text,answer,ex,visual=null)=>({text,answer,ex,visual});
const choice=(text,answer,options,ex,visual=null)=>({...numeric(text,answer,ex,visual),options});
const signs=['<','=','>'];
const relation=(a,b)=>a===b?'=':a>b?'>':'<';
const pair=(a,b,minus)=>minus?a-b:a+b;
const operator=minus=>minus?'−':'+';

function compare(text,a,b,ex,visual=null) {
 return choice(text,relation(a,b),signs,ex,visual);
}

function withinTwenty(d) {
 const a=ri(5,9), b=ri(11-a,9), total=a+b;
 if(d===0) {
  const minus=ri(0,1)===1;
  return numeric('Вычисли '+(minus?total+' − '+b:a+' + '+b)+'.',minus?a:total,a+' + '+b+' = '+total+'.');
 }
 if(d===1){
  const c=ri(5,9), e=ri(11-c,9);
  return compare('Сравни выражения: '+a+' + '+b+' □ '+c+' + '+e+'.',total,c+e,'Слева '+total+', справа '+(c+e)+'.');
 }
 return numeric('Закончи равенство: '+total+' − □ = '+a+'.',b,total+' − '+a+' = '+b+'.');
}

function countingTens(d) {
 const a=ri(1,d===1?8:9), b=ri(1,10-a), total=a+b;
 if(d===0) return numeric('Сколько единиц в '+a+' дес.?',a*10,a+' дес. = '+(a*10)+' ед.');
 if(d===1) return numeric('В ряду '+(a*10)+', □, '+((a+2)*10)+' считают десятками. Какое число пропущено?',
  (a+1)*10,(a*10)+' + 10 = '+((a+1)*10)+'.');
 return numeric('Число '+(a*10)+' увеличивали на 10, пока не получили '+(total*10)+'. Сколько сделали шагов?',b,
  (total*10)+' − '+(a*10)+' = '+(b*10)+', то есть '+b+' дес.');
}

function lengthUnits(d,big,small,factor) {
 const a=ri(1,d===0?10:9), b=ri(1,factor-1), total=a*factor+b;
 if(d===0) {
  const backward=ri(0,1)===1;
  return backward?numeric('Сколько '+big+' в '+(a*factor)+' '+small+'?',a,(a*factor)+' '+small+' = '+a+' '+big+'.'):
   numeric('Сколько '+small+' в '+a+' '+big+'?',a*factor,a+' '+big+' = '+(a*factor)+' '+small+'.');
 }
 if(d===1) return numeric('Вырази '+a+' '+big+' '+b+' '+small+' в '+small+'.',total,
  a+' '+big+' = '+(a*factor)+' '+small+'. '+(a*factor)+' + '+b+' = '+total+'.');
 const c=total+ri(-9,Math.min(9,100-total));
 return compare('Сравни: '+a+' '+big+' '+b+' '+small+' □ '+c+' '+small+'.',total,c,
  a+' '+big+' '+b+' '+small+' = '+total+' '+small+'. Сравни '+total+' и '+c+'.');
}

function money(d) {
 const x=5*ri(1,19), y=5*ri(1,Math.max(1,20-x/5)), total=x+y;
 if(d===0) {
  const count=ri(1,9), coin=pick([1,2,5,10]);
  return numeric('Есть '+count+' монет по '+coin+' коп. Сколько это копеек?',count*coin,'Сложи '+count+' одинаковых стоимостей по '+coin+' коп.');
 }
 if(d===1) return numeric('Было 1 р. Потратили '+x+' коп. Сколько копеек осталось?',100-x,'1 р. = 100 коп. 100 − '+x+' = '+(100-x)+'.');
 return numeric('Было 1 р. Купили ластик за '+x+' коп. и карандаш за '+y+' коп. Сколько копеек сдачи?',100-total,
  'Покупки стоят '+x+' + '+y+' = '+total+' коп. Сдача: 100 − '+total+' = '+(100-total)+' коп.');
}

function inverseStory(d) {
 const a=ri(12,65), b=ri(5,Math.min(29,99-a)), total=a+b;
 if(d===0) return numeric('В коробке было '+a+' фишек. Добавили '+b+' фишек. Сколько стало?',total,a+' + '+b+' = '+total+'.');
 if(d===1) return numeric('После добавления '+b+' фишек в коробке стало '+total+'. Сколько фишек было сначала?',a,total+' − '+b+' = '+a+'.');
 return numeric('В двух коробках вместе '+total+' фишек. В первой '+a+'. Сколько фишек переложить из второй в пустую коробку, чтобы во второй осталось 4?',b-4,
  'Во второй было '+total+' − '+a+' = '+b+'. Перекладываем '+b+' − 4 = '+(b-4)+'.');
}

function time(d) {
 const hours=ri(1,2), minutes=5*ri(1,11);
 if(d===0) return numeric('Сколько минут в '+hours+' ч '+minutes+' мин?',hours*60+minutes,
  hours+' ч = '+(hours*60)+' мин. Прибавляем '+minutes+' мин.');
 const hour=ri(8,17), start=pick([10,15,20,25,30,35,40,45,50,55]), duration=5*ri(2,10);
 const end=hour*60+start+duration;
 const clock=t=>Math.floor(t/60)+':'+String(t%60).padStart(2,'0');
 if(d===1) return numeric('Занятие началось в '+clock(hour*60+start)+' и закончилось в '+clock(end)+'. Сколько минут оно длилось?',duration,
  'От начала до конца прошло '+duration+' мин.');
 const other=5*ri(1,6);
 return numeric('Урок начался в '+clock(hour*60+start)+', длился '+duration+' мин. После него был перерыв '+other+' мин. Сколько минут прошло от начала урока до конца перерыва?',duration+other,
  duration+' + '+other+' = '+(duration+other)+' (мин).');
}

function pathLength(d,closed) {
 const lengths=()=>{
  const a=ri(3,9), b=ri(3,9), c=closed?ri(Math.abs(a-b)+1,Math.min(a+b-1,12)):ri(2,9);
  return [a,b,c];
 };
 const sides=lengths(), [a,b,c]=sides;
 const title=closed?'Периметр треугольника':'Длина ломаной';
 const shape=closed?'triangle':'polyline';
 if(d===0) return numeric(title+'. Найди сумму длин всех '+(closed?'сторон':'звеньев')+'.',sum(sides),
  sides.join(' + ')+' = '+sum(sides)+' (см).',picture('g2Perimeter',{shape,lengths:sides,a,b,c}));
 if(d===1) {
  const other=lengths(), first=sum(sides), second=sum(other);
  return compare('Сравни '+(closed?'периметры':'длины')+'. '+(closed?'Стороны фигур':'Звенья ломаных')+' в сантиметрах: A — '+sides.join(', ')+'. B — '+other.join(', ')+'.',first,second,
   'У A '+first+' см. У B '+second+' см.');
 }
 const total=a+b+c;
 return numeric(title+' — '+total+' см. Две известные длины '+a+' см и '+b+' см. Какова третья длина в сантиметрах?',c,
  total+' − ('+a+' + '+b+') = '+c+' (см).');
}

function brackets(d) {
 const a=ri(20,48), b=ri(3,15), c=ri(2,b-1);
 if(d===0) return numeric('Вычисли '+a+' − ('+b+' − '+c+').',a-b+c,'В скобках '+(b-c)+'. Затем '+a+' − '+(b-c)+' = '+(a-b+c)+'.');
 if(d===1) return numeric('На сколько '+a+' − ('+b+' − '+c+') больше, чем '+a+' − '+b+'?',c,
  'Первое выражение равно '+(a-b+c)+', второе '+(a-b)+'. Разница '+c+'.');
 return numeric('Найди пропуск: '+a+' − (□ − '+c+') = '+(a-b+c)+'.',b,
  'В скобках '+a+' − '+(a-b+c)+' = '+(b-c)+'. Значит, пропуск равен '+(b-c)+' + '+c+' = '+b+'.');
}

function numericExpressions(d) {
 const a=ri(13,60), b=ri(5,15), c=ri(2,9);
 if(d===0) return numeric('Найди значение выражения '+a+' + '+b+' − '+c+'.',a+b-c,
  a+' + '+b+' = '+(a+b)+'. '+(a+b)+' − '+c+' = '+(a+b-c)+'.');
 if(d===1) {
  const a2=ri(12,60), b2=ri(1,19);
  return compare('Сравни значения: '+a+' + '+b+' − '+c+' □ '+a2+' + '+b2+'.',a+b-c,a2+b2,'Слева '+(a+b-c)+', справа '+(a2+b2)+'.');
 }
 return numeric('Значение выражения '+a+' + □ − '+c+' равно '+(a+b-c)+'. Какое число пропущено?',b,
  (a+b-c)+' + '+c+' = '+(a+b)+'. '+(a+b)+' − '+a+' = '+b+'.');
}

function addProperties(d) {
 const a=ri(13,48), b=10-a%10, c=ri(3,24), total=a+b+c;
 if(d===0) return numeric('Поменяй слагаемые местами: '+a+' + '+c+' = '+c+' + □.',a,'При перестановке слагаемых сумма не меняется.');
 if(d===1) return numeric('Сначала сложи '+a+' и '+b+', затем прибавь '+c+'. Чему равна сумма?',total,
  a+' + '+b+' = '+(a+b)+'. '+(a+b)+' + '+c+' = '+total+'.');
 return numeric('Найди пропуск, группируя слагаемые: '+c+' + '+a+' + □ = '+total+'. Сначала вычти '+c+' из суммы.',b,
  total+' − '+c+' = '+(a+b)+'. '+(a+b)+' − '+a+' = '+b+'.');
}

function charts(d) {
 const labels=['Пн','Вт','Ср','Чт'], values=labels.map(()=>ri(2,14)), i=ri(0,3), j=(i+ri(1,3))%4;
 const display=picture('barChart',g6ChartData(labels,values));
 if(d===0) return numeric('Сколько книг прочитали в день «'+labels[i]+'»?',values[i],
  'Столбец «'+labels[i]+'» доходит до '+values[i]+'.',display);
 if(d===1) return numeric('На сколько отличаются столбцы «'+labels[i]+'» и «'+labels[j]+'»?',Math.abs(values[i]-values[j]),
  'Сравни значения '+values[i]+' и '+values[j]+'. Вычти меньшее из большего.',display);
 const rest=labels.filter((_,index)=>index!==i&&index!==j);
 return numeric('Сколько книг прочитали за все дни, кроме «'+rest[0]+'» и «'+rest[1]+'»?',values[i]+values[j],
  'Сложи два оставшихся значения: '+values[i]+' + '+values[j]+' = '+(values[i]+values[j])+'.',display);
}

function mentalOperands(kind) {
 const tens=ri(2,8);
 const digit=ri(1,8);
 if(kind==='simple') {
  const minus=ri(0,1)===1, a=tens*10+digit;
  const b=ri(0,1)===0?ri(1,minus?digit:9-digit):10*ri(1,minus?tens:9-tens);
  return {a,b,minus};
 }
 if(kind==='round_add') return {a:tens*10+digit,b:10-digit,minus:false};
 if(kind==='round_sub') return {a:tens*10,b:ri(0,1)===0?ri(2,9):10*ri(1,tens-1)+digit,minus:true};
 const minus=ri(0,1)===1;
 return {a:tens*10+digit,b:minus?ri(digit+1,9):ri(10-digit,9),minus};
}

function mental(d,kind) {
 const {a,b,minus}=mentalOperands(kind), op=operator(minus), total=pair(a,b,minus);
 if(d===0) return numeric('Вычисли устно '+a+' '+op+' '+b+'.',total,a+' '+op+' '+b+' = '+total+'.');
 if(d===1) return numeric('Получили '+total+' из '+a+' действием «'+op+'». Какое число было вторым?',b,
  (minus?a+' − '+total:total+' − '+a)+' = '+b+'.');
 return numeric('Какое число было первым, если □ '+op+' '+b+' = '+total+'?',a,
  total+' '+operator(!minus)+' '+b+' = '+a+'.');
}

function letters(d) {
 const a=ri(17,58), b=ri(4,Math.min(a,21)), c=ri(1,9);
 if(d===0) return numeric('Найди значение a + '+b+' при a = '+a+'.',a+b,a+' + '+b+' = '+(a+b)+'.');
 if(d===1) return numeric('Найди значение a − ('+b+' − '+Math.min(c,b-1)+') при a = '+a+'.',a-b+Math.min(c,b-1),
  'Подставь '+a+' вместо a. Сначала выполни действие в скобках.');
 return numeric('Выражение a + '+b+' − '+c+' равно '+(a+b-c)+'. Какое значение подставили вместо a?',a,
  (a+b-c)+' + '+c+' − '+b+' = '+a+'.');
}

function equation(d) {
 const x=ri(13,56), b=ri(4,Math.min(x,23)), c=ri(2,9);
 if(d===0) return numeric('Реши уравнение x + '+b+' = '+(x+b)+'.',x,'x = '+(x+b)+' − '+b+' = '+x+'.');
 if(d===1) return numeric('Найди x из равенства '+(x+b)+' − x = '+b+'.',x,'x = '+(x+b)+' − '+b+' = '+x+'.');
 return numeric('Реши уравнение x − '+b+' = '+(x+c)+' − '+(b+c)+'.',x,
  'Справа '+(x-b)+'. Значит, x = '+(x-b)+' + '+b+' = '+x+'.');
}

function checkOperation(d) {
 const a=ri(24,70), b=ri(7,24), minus=ri(0,1)===0, result=pair(a,b,minus);
 if(d===0) return numeric('Выполни '+a+' '+operator(minus)+' '+b+'.',result,a+' '+operator(minus)+' '+b+' = '+result+'.');
 if(d===1) return numeric('Проверяем '+a+' '+operator(minus)+' '+b+' = '+result+'. Допиши обратное действие: '+result+' '+operator(!minus)+' '+b+' = □.',a,
  'Обратное действие возвращает исходное число '+a+'.');
 const wrong=result+pick(result>=2?[-2,-1,1,2]:[1,2]);
 return numeric('Ученик записал '+a+' '+operator(minus)+' '+b+' = '+wrong+'. Проверь обратным действием и запиши верный результат.',result,
  'Верно '+a+' '+operator(minus)+' '+b+' = '+result+'. Проверка: '+result+' '+operator(!minus)+' '+b+' = '+a+'.');
}

function writtenPair(kind) {
 if(kind==='add_plain'){
  const t=ri(1,7), u=ri(1,9), k=ri(1,9-t), v=ri(0,9-u);
  return {a:10*t+u,b:10*k+v,minus:false};
 }
 if(kind==='add_carry'){
  const t=ri(1,6), u=ri(2,9), k=ri(1,8-t), v=ri(10-u,9);
  return {a:10*t+u,b:10*k+v,minus:false};
 }
 if(kind==='add_round'){
  const a=10*ri(2,7)+ri(1,9);
  const target=10*ri(Math.ceil((a+11)/10),10);
  return {a,b:target-a,minus:false};
 }
 if(kind==='sub_plain'){
  const t=ri(3,9), u=ri(1,9), k=ri(1,t-1), v=ri(0,u);
  return {a:10*t+u,b:10*k+v,minus:true};
 }
 if(kind==='sub_round'){
  const t=ri(3,10);
  return {a:10*t,b:10*ri(0,t-1)+ri(1,9),minus:true};
 }
 const t=ri(3,9), u=ri(1,8), k=ri(1,t-1), v=ri(u+1,9);
 return {a:10*t+u,b:10*k+v,minus:true};
}

function written(d,kind) {
 const {a,b,minus}=writtenPair(kind), result=pair(a,b,minus), op=operator(minus);
 const steps=a+' '+op+' '+b+' = '+result+'.';
 if(d===0) return numeric('Реши пример столбиком. Запиши ответ.',result,steps,picture('g2MoroColumn',{a,b,op,result:'?'}));
 if(d===1){
  const shown=String(result), distance=shown.length===1?1:ri(1,shown.length);
  const index=shown.length-distance, display=shown.slice(0,index)+'□'+shown.slice(index+1);
  return numeric('Какая цифра пропущена в ответе?',Number(shown[index]),steps,picture('g2MoroColumn',{a,b,op,result:display}));
 }
 const units=ri(0,1)===0||b<10, hidden=units?String(b).slice(0,-1)+'□':'□'+(b%10);
 return numeric('Восстанови цифру во втором числе.',units?b%10:Math.floor(b/10),
  'Проверяем обратным действием: '+(minus?a+' − '+result:result+' − '+a)+' = '+b+'.',
  picture('g2MoroColumn',{a,b:hidden,op,result}));
}

function angle(d) {
 const types=['Острый','Прямой','Тупой'];
 const make=()=>({size:pick([35,50,65,85,90,90,90,105,120,140]),turn:45*ri(0,7)});
 const first=make(), second=make(), third=make();
 const type=size=>size<90?types[0]:size>90?types[2]:types[1];
 if(d===0) return choice('Какой угол показан?',type(first.size),types,
  type(first.size)+' угол '+(first.size===90?'совпадает с уголком листа.':first.size<90?'меньше прямого.':'больше прямого.'),picture('g2MoroAngles',{items:[first]}));
 if(d===1) {
  const right={size:90,turn:second.turn};
  return compare('Сравни углы A и B. Угол B — прямой. Поставь знак: A □ B.',first.size,right.size,
   'Угол A — '+type(first.size).toLowerCase()+', угол B — прямой.',picture('g2MoroAngles',{items:[first,right]}));
 }
 return numeric('Сколько среди этих углов непрямых?', [first,second,third].filter(a=>a.size!==90).length,
  'Слева направо: '+[first,second,third].map(a=>type(a.size).toLowerCase()).join(', ')+'.',picture('g2MoroAngles',{items:[first,second,third]}));
}

function rectangle(d,perimeter) {
 const a=ri(3,13), b=ri(2,12), total=2*(a+b);
 if(perimeter){
  if(d===0) return numeric('Найди периметр прямоугольника со сторонами '+a+' см и '+b+' см.',total,a+' + '+b+' + '+a+' + '+b+' = '+total+' (см).',
   picture('g2Perimeter',{shape:'rectangle',a,b}));
  if(d===1) return numeric('Стороны прямоугольника '+a+' см и '+b+' см. Какую длину получим, если обойти его два раза?',total*2,
   'За один обход '+total+' см. За два — '+(total*2)+' см.');
  return numeric('Периметр прямоугольника '+total+' см. Одна сторона '+a+' см. Чему равна соседняя сторона?',b,
   'Две известные стороны дают '+(2*a)+' см. Остаётся '+(2*b)+' см на две равные стороны, по '+b+' см.');
 }
 const display=picture('g2Perimeter',{shape:'rectangle',a,b});
 if(d===0) return numeric('На рисунке прямоугольник. Сколько сантиметров у его нижней стороны?',a,
  'Верхняя и нижняя стороны равны. Значит, внизу '+a+' см.',display);
 if(d===1) return numeric('Сколько сантиметров в сумме у двух вертикальных сторон прямоугольника?',2*b,
  'Вертикальных сторон две, обе по '+b+' см.',display);
 return numeric('Две вертикальные стороны прямоугольника вместе составляют '+(2*b)+' см. На сколько изменится их сумма, если каждую удлинить на '+a+' см?',2*a,
  'Каждая сторона станет длиннее на '+a+' см. Вместе прибавится '+(2*a)+' см.');
}

function symmetry(d) {
 const left=Array.from({length:4},()=>Array.from({length:3},()=>ri(0,2)===0));
 const marks=left.flatMap((row,y)=>row.flatMap((filled,x)=>filled?[[y,x]]:[]));
 if(!marks.length){left[1][1]=true;marks.push([1,1]);}
 const right=left.map(row=>row.slice().reverse());
 if(d===0) {
  const [y,x]=pick(marks), same=ri(0,1)===0;
  if(!same)right[y][2-x]=false;
  return choice('Симметричен ли рисунок относительно линии?',same?'Да':'Нет',['Да','Нет'],
   same?'Каждой синей клетке есть пара на таком же расстоянии от оси.':'У одной из клеток нет зеркальной пары.',picture('g2MoroMirror',{left,right}));
 }
 if(d===1) {
  const [y,x]=pick(marks);right[y][2-x]=false;
  return numeric('В ряду '+(y+1)+' не хватает одной синей клетки. Какой у неё номер столбца?',6-x,
   'Нужна клетка на таком же расстоянии от линии в том же ряду.',picture('g2MoroMirror',{left,right}));
 }
 const missing=Math.min(marks.length,ri(2,4));
 for(const [y,x] of marks.slice(0,missing))right[y][2-x]=false;
 return numeric('Сколько синих клеток нужно добавить справа, чтобы восстановить зеркальный рисунок?',missing,
  'Сверь пары в каждом ряду. Без пары '+missing+'.',picture('g2MoroMirror',{left,right}));
}

function multiplication(d) {
 const a=ri(2,8), b=ri(2,8), product=a*b, expression=Array(b).fill(a).join(' + ');
 if(d===0) return numeric('Сколько всего кружков на рисунке?',product,
  'В каждой из '+b+' групп по '+a+' кружков.',picture('g2EqualGroups',{groups:b,each:a}));
 if(d===1) return numeric('Замени сложение умножением и найди результат: '+expression+'.',product,a+' × '+b+' = '+product+'.');
 return numeric('В '+b+' пакетах по '+a+' яблок. Принесли ещё один такой пакет. Сколько яблок стало?',product+a,
  'Теперь пакетов '+(b+1)+'. '+a+' × '+(b+1)+' = '+(product+a)+'.');
}

function division(d) {
 const each=ri(2,9), groups=ri(2,9), total=each*groups;
 if(d===0) return numeric('Разложи '+total+' кружков поровну в '+groups+' коробок. Сколько в каждой?',each,
  total+' : '+groups+' = '+each+'.');
 if(d===1) return numeric('Есть '+total+' кубиков. В каждую коробку кладут по '+each+'. Сколько коробок нужно?',groups,
  total+' : '+each+' = '+groups+'.');
 return numeric('Из '+total+' фишек отложили '+each+'. Остальные разложили по '+each+' в коробку. Сколько коробок занято?',groups-1,
  total+' − '+each+' = '+(total-each)+'. '+(total-each)+' : '+each+' = '+(groups-1)+'.');
}

function mulTerms(d,divide) {
 const a=ri(2,9), b=ri(2,9), product=a*b, values=divide?[product,b,a]:[a,b,product];
 const names=divide?['Делимое','Делитель','Частное']:['Первый множитель','Второй множитель','Произведение'];
 const expr=values[0]+(divide?' : ':' × ')+values[1]+' = '+values[2];
 const index=ri(0,2);
 if(d===0) return choice('В записи '+expr+' как называется '+['первое число','второе число','число после знака ='][index]+'?',
  names[index],names,names[index]+' — '+values[index]+'.');
 if(d===1) return numeric('В записи '+expr+' найди число, которое называется «'+names[index].toLowerCase()+'».',
  values[index],names[index]+' — '+values[index]+'.');
 return numeric(names[0]+' — '+values[0]+', '+names[1].toLowerCase()+' — '+values[1]+'. Найди '+names[2].toLowerCase()+'.',values[2],expr+'.');
}

function commute(d) {
 const a=ri(2,8), b=ri(2,9), product=a*b;
 if(d===0) return numeric('Поменяй множители местами: '+a+' × '+b+' = '+b+' × □.',a,'Порядок множителей меняется, а произведение — нет.');
 if(d===1) return numeric('Дано: '+a+' × '+b+' = '+product+'. Найди '+b+' × '+a+'.',product,'Произведение равно '+product+' при любом порядке этих множителей.');
 return numeric('В первом ряду по '+b+' кнопок, всего рядов '+a+'. Во втором прямоугольнике ряды и столбцы поменяли местами. Сколько кнопок во втором?',product,
  a+' × '+b+' = '+b+' × '+a+' = '+product+'.');
}

function mulReverse(d) {
 const a=ri(2,9), b=ri(2,9), product=a*b;
 if(d===0) return numeric('Составь обратный пример. '+a+' × '+b+' = '+product+', поэтому '+product+' : '+a+' = □.',b,
  'Из произведения и одного множителя находим второй множитель.');
 if(d===1) return numeric('Произведение двух чисел равно '+product+', один множитель '+b+'. Найди другой множитель.',a,product+' : '+b+' = '+a+'.');
 return numeric('После деления '+product+' на неизвестное число получили '+a+'. На какое число делили?',b,product+' : '+a+' = '+b+'.');
}

function table(d,factors,mode) {
 const base=pick(factors), count=ri(1,9), result=base*count;
 const dividing=mode==='division'||(mode==='both'&&ri(0,1)===1);
 if(d===0) return dividing?numeric('Вычисли '+result+' : '+base+'.',count,base+' × '+count+' = '+result+'.'):
  numeric('Чему равно '+base+' × '+count+'?',result,Array(count).fill(base).join(' + ')+' = '+result+'.');
 if(d===1) return dividing?numeric('Восстанови делимое: □ : '+base+' = '+count+'.',result,base+' × '+count+' = '+result+'.'):
  numeric('Восстанови множитель: '+base+' × □ = '+result+'.',count,result+' : '+base+' = '+count+'.');
 if(dividing){
  const shape=pick(['жетонов','карандашей','кубиков']);
  return numeric('Разложили '+result+' '+shape+' по '+base+' в каждую коробку. Ещё 2 коробки остались пустыми. Сколько было коробок всего?',count+2,
   result+' : '+base+' = '+count+'. Всего '+count+' + 2 = '+(count+2)+' коробок.');
 }
 const object=pick(['фишек','кубиков','значков']);
 const target=result+base;
 return numeric('Было '+count+' групп по '+base+' '+object+'. Добавили ещё одну такую группу. Сколько предметов стало?',target,
  'Теперь групп '+(count+1)+'. '+base+' × '+(count+1)+' = '+target+'.');
}

function parity(d) {
 const n=ri(11,98), even=n%2===0;
 if(d===0) return choice('Какое число '+n+'?',even?'Чётное':'Нечётное',['Чётное','Нечётное'],
  even?'Число делится на 2 без остатка.':'После деления на пары остаётся один предмет.');
 if(d===1) return numeric('Какое ближайшее следующее чётное число после '+n+'?',n+(even?2:1),
  'Следующее чётное число — '+(n+(even?2:1))+'.');
 const a=ri(2,Math.min(58,n-1));
 return choice('Чётна ли разность '+n+' − '+a+'?',(n-a)%2===0?'Да':'Нет',['Да','Нет'],'Разность равна '+(n-a)+'.');
}

function orderWithProducts(d) {
 const a=ri(2,7), b=ri(2,5), c=ri(2,6);
 if(ri(0,1)===0){
  const product=a*b;
  if(d===0) return numeric('Соблюдай порядок действий: '+c+' + '+product+' : '+b+'.',c+a,
   'Сначала '+product+' : '+b+' = '+a+'. Затем '+c+' + '+a+' = '+(c+a)+'.');
  if(d===1) return numeric('Соблюдай порядок действий: ('+product+' + '+(c*b)+') : '+b+'.',a+c,
   'В скобках '+((a+c)*b)+'. Раздели эту сумму на '+b+'.');
  return numeric('Вставь число: '+c+' + □ : '+b+' = '+(c+a)+'.',product,
   'Частное равно '+(c+a)+' − '+c+' = '+a+'. Делимое равно '+a+' × '+b+' = '+product+'.');
 }
 if(d===0) return numeric('Соблюдай порядок действий: '+c+' + '+a+' × '+b+'.',c+a*b,
  'Сначала умножь '+a+' на '+b+', потом прибавь '+c+'.');
 if(d===1) return numeric('Соблюдай порядок действий: ('+a+' + '+c+') × '+b+'.',(a+c)*b,
  'В скобках '+(a+c)+'. Затем умножь на '+b+'.');
 return numeric('Вставь число: '+c+' + □ × '+b+' = '+(c+a*b)+'.',a,
  'Из '+(c+a*b)+' вычти '+c+'. Получится '+(a*b)+'. Раздели на '+b+'.');
}

function timesComparison(d,kind) {
 const a=ri(2,10), k=ri(kind==='compare'&&d===2?3:2,8), large=a*k;
 if(kind==='increase'){
  if(d===0) return numeric('Увеличь '+a+' в '+k+' раз.',large,a+' × '+k+' = '+large+'.');
  if(d===1) return numeric('У Вани '+a+' наклеек, у Ани в '+k+' раз больше. Сколько наклеек у Ани?',large,a+' × '+k+' = '+large+'.');
  return numeric('Число увеличили в '+k+' раз и получили '+large+'. Найди исходное число.',a,large+' : '+k+' = '+a+'.');
 }
 if(kind==='decrease'){
  if(d===0) return numeric('Уменьши '+large+' в '+k+' раз.',a,large+' : '+k+' = '+a+'.');
  if(d===1) return numeric('На полке '+large+' книг. В ящике в '+k+' раз меньше. Сколько книг в ящике?',a,large+' : '+k+' = '+a+'.');
  return numeric('Число уменьшили в '+k+' раз и получили '+a+'. Восстанови число.',large,a+' × '+k+' = '+large+'.');
 }
 if(d===0) return numeric('Во сколько раз '+large+' больше '+a+'?',k,large+' : '+a+' = '+k+'.');
 if(d===1) return numeric('Во сколько раз '+a+' меньше '+large+'?',k,large+' : '+a+' = '+k+'.');
 return numeric('У Кати '+large+' бусин. Она отдала '+a+' бусин. Во сколько раз оставшееся число больше числа отданных бусин?',k-1,
  large+' − '+a+' = '+(large-a)+'. '+(large-a)+' : '+a+' = '+(k-1)+'.');
}

function review(d) {
 return pick([numericExpressions,checkOperation,rectangle,orderWithProducts,charts])(d,false);
}

function columnHtml(data) {
 const row=value=>'<span class="g2-moro-digits">'+[...String(value)].map(digit=>'<span>'+esc(digit)+'</span>').join('')+'</span>';
 return '<div class="g2-moro-column" role="img" aria-label="'+esc(data.a+' '+data.op+' '+data.b+' равно '+data.result)+'">'+
  row(data.a)+'<span class="g2-moro-column-second"><b>'+data.op+'</b>'+row(data.b)+'</span>'+row(data.result)+'</div>';
}

function anglesHtml(items) {
 const label=items.length===1?'Угол':'Углы '+items.map((_,i)=>'ABC'[i]).join(', ');
 const polar=(turn,radius)=>[60+radius*Math.cos(turn*Math.PI/180),57+radius*Math.sin(turn*Math.PI/180)].join(' ');
 return '<div class="g2-moro-angles">'+items.map((item,i)=>{
  const pts=[polar(item.turn,42),'60 57',polar(item.turn+item.size,42)];
  return '<div class="g2-geometry-visual"><svg class="g2-geometry-svg" viewBox="0 0 120 113" role="img" aria-label="'+esc(items.length===1?label:'Угол '+('ABC'[i]))+'">'+
   '<polyline class="g2-geo-line" points="'+pts.join(' ')+'"/></svg>'+(items.length===1?'':'<div class="g2-geo-caption">'+('ABC'[i])+'</div>')+'</div>';
 }).join('')+'</div>';
}

function mirrorHtml({left,right}) {
 const rows=left.map((row,y)=>'<tr><th scope="row">'+(y+1)+'</th>'+row.concat(right[y]).map(filled=>
  '<td class="'+(filled?'g2-moro-filled':'')+'" aria-label="'+(filled?'Синяя клетка':'Пустая клетка')+'"></td>').join('')+'</tr>');
 return '<table class="g2-moro-mirror" aria-label="Клетки слева и справа от оси симметрии"><thead><tr><th></th>'+
  [1,2,3,4,5,6].map(col=>'<th scope="col">'+col+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table>';
}

const topic=(id,title,rule,example,generate)=>({id:'moro_'+id,title,rule,example,generate});
const original=(id,title)=>({id,title});
const chapters=[
 {part:1,id:'numbers_to_100',title:'Числа от 1 до 100. Нумерация',topics:[
  topic('review_20','Числа до 20. Повторение','Если переходишь через 10, сначала дополни число до 10, затем прибавь остаток.','8 + 7 = 8 + 2 + 5 = 15.',withinTwenty),
  topic('tens','Десяток. Счёт десятками до 100','В одном десятке 10 единиц. При счёте десятками каждый шаг равен 10.','30, 40, 50, 60.',countingTens),
  original('numbers_100','Числа до 100. Десятки и единицы'),
  topic('millimeter','Миллиметр','В одном сантиметре 10 миллиметров.','3 см 4 мм = 30 мм + 4 мм = 34 мм.',d=>lengthUnits(d,'см','мм',10)),
  topic('meter','Метр','В одном метре 10 дециметров или 100 сантиметров.','2 м 4 дм = 20 дм + 4 дм = 24 дм.',d=>lengthUnits(d,'м','дм',10)),
  topic('money','Рубль и копейка','В одном рубле 100 копеек. Чтобы найти сдачу, вычти стоимость покупок.','1 р. − 35 коп. = 100 коп. − 35 коп. = 65 коп.',money)
 ]},
 {part:1,id:'oral',title:'Числа от 1 до 100. Сложение и вычитание',topics:[
  topic('inverse_tasks','Задачи, обратные данной','В обратной задаче известный результат становится данным. Одно из прежних данных нужно найти.','Было 30, добавили 8, стало 38. Обратно: стало 38, добавили 8, было 30.',inverseStory),
  topic('clock','Час и минута','В часе 60 минут. Если событие переходит через целый час, можно посчитать сначала до него, потом после него.','С 9:45 до 10:10 прошло 15 + 10 = 25 мин.',time),
  topic('broken_line','Длина ломаной','Сложи длины всех звеньев ломаной.','Ломаная с длинами звеньев 4 см, 3 см и 5 см имеет длину 12 см.',d=>pathLength(d,false)),
  topic('brackets','Порядок действий. Скобки','Действие в скобках выполняют первым.','40 − (9 − 3) = 40 − 6 = 34.',brackets),
  topic('number_expressions','Числовые выражения','В выражении из сложений и вычитаний без скобок считают слева направо.','50 + 8 − 5 = 58 − 5 = 53.',numericExpressions),
  topic('polygon_perimeter','Периметр многоугольника','Периметр — сумма длин всех сторон.','4 см + 6 см + 7 см = 17 см.',d=>pathLength(d,true)),
  topic('add_properties','Свойства сложения','Слагаемые можно менять местами и по-разному объединять в группы.','27 + 15 + 3 = (27 + 3) + 15 = 45.',addProperties),
  topic('charts','Столбчатые диаграммы','Найди столбец и посмотри, какому числу на шкале соответствует его верхушка.','У столбцов со значениями 7 и 4 разница 3.',charts),
  topic('mental_simple','Устный счёт. Прибавляем и вычитаем десятки и единицы','Десятки считают с десятками, единицы — с единицами.','57 − 20 = 37, а 57 − 2 = 55.',d=>mental(d,'simple')),
  topic('mental_round_add','Устное сложение до круглого числа','Узнай, сколько единиц не хватает до следующего десятка.','26 + 4 = 30.',d=>mental(d,'round_add')),
  topic('mental_round_sub','Устное вычитание из круглого числа','Вычитай по частям: сначала десятки, затем единицы.','60 − 24 = 60 − 20 − 4 = 36.',d=>mental(d,'round_sub')),
  topic('mental_cross','Устный счёт с переходом через десяток','Сделай первый шаг до круглого десятка. Затем прибавь или вычти остаток.','35 − 7 = 35 − 5 − 2 = 28.',d=>mental(d,'cross')),
  topic('letters','Буквенные выражения','Подставь указанное число вместо буквы, затем выполни действия.','При a = 30 выражение a + 16 равно 46.',letters),
  topic('equations','Уравнения','В уравнении находят значение неизвестного, при котором равенство верно.','x + 7 = 30. Число 23 подходит, потому что 23 + 7 = 30.',equation),
  topic('verify','Проверка сложения и вычитания','Сложение проверяют вычитанием, а вычитание можно проверить сложением.','47 − 18 = 29. Проверка: 29 + 18 = 47.',checkOperation),
  original('add_sub_100','Сложение и вычитание до 100. Повторение'),
  original('word_problems','Решение задач. Смешанная тренировка')
 ]},
 {part:1,id:'written',title:'Числа от 1 до 100. Сложение и вычитание столбиком',topics:[
  topic('column_add_plain','Сложение столбиком без переноса','Запиши единицы под единицами и десятки под десятками. Начинай считать справа.','35 + 23 = 58.',d=>written(d,'add_plain')),
  topic('column_sub_plain','Вычитание столбиком без займа','Сначала вычти единицы, затем десятки.','57 − 26 = 31.',d=>written(d,'sub_plain')),
  topic('angles','Виды углов','Прямой угол совпадает с уголком листа. Острый меньше прямого, тупой больше.','Сравни углы, совместив вершины и одну сторону.',angle),
  topic('column_add_carry','Сложение столбиком с переносом','Если сумма единиц не меньше 10, запиши её единицы, а один десяток перенеси в разряд десятков.','37 + 48 = 85.',d=>written(d,'add_carry')),
  topic('column_add_round','Сложение столбиком до круглого числа','Если сумма единиц равна 10, запиши 0 в разряде единиц и прибавь один десяток.','37 + 53 = 90, а 87 + 13 = 100.',d=>written(d,'add_round')),
  topic('column_sub_round','Вычитание столбиком из круглого числа','Если единиц сверху нет, возьми один десяток и представь его как 10 единиц.','50 − 24 = 26.',d=>written(d,'sub_round'))
 ]},
 {part:2,id:'written_continued',title:'Сложение и вычитание столбиком (продолжение)',topics:[
  topic('column_sub_carry','Вычитание столбиком с займом','Если верхних единиц меньше, разменяй один десяток на 10 единиц.','52 − 24 = 28.',d=>written(d,'sub_carry')),
  topic('rectangle_sides','Противоположные стороны прямоугольника','У прямоугольника равны верхняя и нижняя стороны, а также левая и правая.','Если верхняя сторона 8 см, нижняя тоже 8 см.',d=>rectangle(d,false)),
  topic('symmetry','Симметричные фигуры','Зеркальные клетки лежат на одном уровне по разные стороны от оси на одинаковом расстоянии.','Если слева закрашена первая клетка от линии, справа тоже закрашивают первую.',symmetry),
  original('geometric_figures','Геометрические фигуры и построения')
 ]},
 {part:2,id:'multiplication_division',title:'Числа от 1 до 100. Умножение и деление',topics:[
  topic('multiply','Смысл умножения','Сумму одинаковых слагаемых можно записать произведением.','4 + 4 + 4 = 4 × 3 = 12.',multiplication),
  topic('rectangle_perimeter','Периметр прямоугольника','Сложи длины соседних сторон и возьми эту сумму два раза.','У прямоугольника со сторонами 5 см и 3 см периметр равен 16 см.',d=>rectangle(d,true)),
  topic('multiply_names','Множители и произведение','Числа, которые умножают, называют множителями. Результат называют произведением.','В записи 6 × 4 = 24 множители — 6 и 4, произведение — 24.',d=>mulTerms(d,false)),
  topic('commute','Переместительное свойство умножения','От перемены мест множителей произведение не меняется.','3 × 7 = 7 × 3 = 21.',commute),
  topic('divide','Деление на равные части и по содержанию','Можно узнать, сколько предметов будет в каждой части, или сколько частей получится.','24 : 4 = 6. В 4 коробках будет по 6 предметов.',division),
  topic('divide_names','Делимое, делитель и частное','Делимое делят на делитель и получают частное.','В записи 24 : 4 = 6 число 24 — делимое, 4 — делитель, 6 — частное.',d=>mulTerms(d,true)),
  topic('mul_reverse','Связь множителей с произведением','Если произведение разделить на один множитель, получится другой.','6 × 4 = 24, поэтому 24 : 6 = 4.',mulReverse),
  topic('ten','Умножение и деление с числом 10','Умножить на 10 — взять данное число десятков. При делении на 10 узнаём, сколько всего десятков.','7 × 10 = 70, а 70 : 10 = 7.',d=>table(d,[10],'both')),
  original('multiply_divide','Умножение и деление. Смешанная тренировка')
 ]},
 {part:2,id:'tabular',title:'Табличное умножение и деление',topics:[
  topic('times_2','Умножение на 2','Умножить на 2 — взять число два раза или посчитать одинаковые пары.','6 × 2 = 6 + 6 = 12.',d=>table(d,[2],'multiply')),
  topic('divide_2','Деление на 2','Деление на 2 можно проверить обратным умножением.','16 : 2 = 8, потому что 8 × 2 = 16.',d=>table(d,[2],'division')),
  topic('parity','Чётные и нечётные числа','Чётное число делится на 2. Нечётные числа идут между чётными.','36 — чётное, 37 — нечётное.',parity),
  topic('times_3','Умножение на 3','Умножить на 3 — взять число три раза или посчитать тройки.','5 × 3 = 5 + 5 + 5 = 15.',d=>table(d,[3],'multiply')),
  topic('divide_3','Деление на 3','Узнать результат деления на 3 помогает таблица умножения на 3.','21 : 3 = 7, потому что 7 × 3 = 21.',d=>table(d,[3],'division')),
  topic('order_four_ops','Порядок действий с умножением и делением','Сначала действия в скобках, затем умножение и деление, потом сложение и вычитание.','6 + 4 × 3 = 6 + 12 = 18.',orderWithProducts),
  topic('table_4','Умножение и деление с числом 4','Для проверки деления используй обратное умножение.','4 × 7 = 28, поэтому 28 : 4 = 7.',d=>table(d,[4],'both')),
  topic('increase','Увеличение числа в несколько раз','Чтобы увеличить число в несколько раз, умножь его.','Увеличим 7 в 3 раза: 7 × 3 = 21.',d=>timesComparison(d,'increase')),
  topic('decrease','Уменьшение числа в несколько раз','Чтобы уменьшить число в несколько раз, раздели его.','Уменьшим 24 в 4 раза: 24 : 4 = 6.',d=>timesComparison(d,'decrease')),
  topic('times_comparison','Во сколько раз больше или меньше','Чтобы узнать, во сколько раз числа отличаются, раздели большее число на меньшее.','24 больше 6 в 4 раза.',d=>timesComparison(d,'compare')),
  topic('tables_5_7','Умножение и деление с числами 5, 6 и 7','Связывай табличное умножение с соответствующими примерами на деление.','6 × 7 = 42, значит, 42 : 6 = 7.',d=>table(d,[5,6,7],'both')),
  topic('tables_8_9','Умножение и деление с числами 8 и 9','Таблица помогает решать прямые и обратные примеры.','9 × 8 = 72. Значит, 72 : 9 = 8.',d=>table(d,[8,9],'both')),
  topic('tables_all','Таблица умножения и деления. Повторение','Каждое произведение связывает примеры на умножение и деление.','Из 8 × 7 = 56 получаем 56 : 8 = 7 и 56 : 7 = 8.',d=>table(d,[2,3,4,5,6,7,8,9],'both'))
 ]},
 {part:2,id:'review',title:'Что узнали, чему научились во 2 классе',topics:[
  original('operations_100','Числовые выражения и порядок действий. Повторение'),
  original('quantities','Величины. Длина, масса и время'),
  original('geometric_quantities','Длина отрезка и периметр. Повторение'),
  original('math_information','Таблицы, закономерности и алгоритмы'),
  topic('review','Смешанные задания за год','Определи, к какой теме относится задание, и проверь ответ.','Чтобы узнать длину рамки, сложи длины всех её сторон.',review)
 ]}
];

const newTopics=new Map();
let order=0;
const textbookGroups=chapters.map(chapter=>({
 id:chapter.id,title:chapter.title,icon:'',desc:'',
 topics:chapter.topics.map(item=>{
  if(item.generate)newTopics.set(item.id,item);
  const previous=previousTopics.get(item.id);
  return {
   rendererType:'quiz',plannedRendererType:'quiz',reuseEngine:'elementary quiz',implemented:true,
   ...previous,id:'g2:'+item.id,grade:2,course:ELEMENTARY_COURSE,
   title:item.title,shortTitle:previous?.shortTitle||'',section:chapter.title,group:chapter.title,order:++order,
   programRef:'М. И. Моро и др. · 2 класс · часть '+chapter.part
  };
 })
}));
G2_GROUPS.splice(0,G2_GROUPS.length,...textbookGroups);

const previousMakeQuestion=makeG2Question;
makeG2Question=function(id,stage=null) {
 const item=newTopics.get(rawCourseId(id));
 if(!item)return previousMakeQuestion(id,stage);
 const d=stage===null?activeDifficulty():Math.max(0,Math.min(2,Number(stage)||0));
 const {text,answer,options,ex,visual}=item.generate(d);
 const sig='g2:'+item.id+':'+text+'|'+JSON.stringify(visual);
 const meta={visual,templateId:item.id};
 const question=options?g2Choice(text,answer,options.filter(v=>v!==answer),ex,sig,meta):g2NumberInput(text,answer,ex,sig,meta);
 return {...question,text,ex};
};

const previousFreshQuiz=freshG2Quiz;
freshG2Quiz=function(id) {
 if(!newTopics.has(rawCourseId(id)))return previousFreshQuiz(id);
 return freshCandidate(()=>makeG2Question(id),question=>question.sig,90);
};

const previousTheory=g2TheoryHtml;
g2TheoryHtml=function(id) {
 const item=newTopics.get(rawCourseId(id));
 if(!item)return previousTheory(id);
 return '<div class="elementary-theory"><p><b>'+esc(item.rule)+'</b></p><div class="elementary-example">'+esc(item.example)+'</div></div>';
};

const previousVisual=quizVisualHtml;
quizVisualHtml=function(question) {
 const visual=question?.visual;
 if(visual?.type==='g2MoroColumn')return columnHtml(visual.data);
 if(visual?.type==='g2MoroAngles')return anglesHtml(visual.data.items);
 if(visual?.type==='g2MoroMirror')return mirrorHtml(visual.data);
 return previousVisual(question);
};

window.grade2Textbook={
 chapters:chapters.map(chapter=>({part:chapter.part,title:chapter.title,items:chapter.topics.map(item=>[null,item.title,[item.id]])})),
 catalog:g2AllTopics
};
})();
