(function () {
'use strict';

const oldTopics=new Map(g3AllTopics().map(t=>[rawCourseId(t.id),t]));
const pick=values=>values[ri(0,values.length-1)];
const numeric=(text,answer,ex,visual=null)=>({text,answer,ex,visual});
const choice=(text,answer,options,ex,visual=null)=>({...numeric(text,answer,ex,visual),options});
const model=(type,data)=>({type,data});
const signs=['<','=','>'];
const relation=(a,b)=>a===b?'=':a>b?'>':'<';
const op=minus=>minus?'−':'+';
const total=(a,b,minus)=>minus?a-b:a+b;
const format=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');

function addSub(d,large) {
 const a=large?ri(210,690):ri(25,64), minus=ri(0,1)===0;
 const b=large?ri(21,Math.min(a,999-a)):ri(11,Math.min(a,99-a)), c=ri(1,9);
 const result=total(a,b,minus), sign=op(minus);
 if(d===0) return numeric('Вычисли устно '+a+' '+sign+' '+b+'.',result,a+' '+sign+' '+b+' = '+result+'.');
 if(d===1) return numeric('Вычисли по действиям '+a+' '+sign+' '+b+' − '+Math.min(c,result)+'.',result-Math.min(c,result),
  'Сначала '+result+'. Затем '+result+' − '+Math.min(c,result)+' = '+(result-Math.min(c,result))+'.');
 return numeric('Восстанови первое число: □ '+sign+' '+b+' = '+result+'.',a,result+' '+op(!minus)+' '+b+' = '+a+'.');
}

function additiveEquation(d) {
 const x=ri(25,69), b=ri(5,23), c=ri(2,9), sum=x+b;
 if(d===0) return numeric('Реши уравнение x + '+b+' = '+sum+'.',x,'Неизвестное слагаемое: '+sum+' − '+b+' = '+x+'.');
 if(d===1) return numeric('Реши уравнение '+sum+' − x = '+b+'.',x,'Неизвестное вычитаемое: '+sum+' − '+b+' = '+x+'.');
 return numeric('Реши уравнение x − '+b+' = '+(x+c)+' − '+(b+c)+'.',x,
  'Справа '+(x-b)+'. Восстанавливаем уменьшаемое: '+(x-b)+' + '+b+' = '+x+'.');
}

function letters(d) {
 const names=shuffleOptions(['A','B','C','D','E','K','M','P']).slice(0,4), [a,b,c,e]=names;
 const visual=model('g3MoroLetters',{names,turn:ri(0,3)});
 if(d===0) return choice('Как называется закрашенная точка?',a,names,
  'У закрашенной точки стоит буква '+a+'.',visual);
 if(d===1) return choice('Как называется выделенная сторона?',a+b,[a+b,b+c,c+e,e+a],
  'Концы выделенной стороны — '+a+' и '+b+'.',visual);
 const vertex=pick([b,e]), answer=vertex===b?a+b:e+a;
 return choice('Какая сторона соединяет точки '+a+' и '+vertex+'?',answer,[a+b,b+c,c+e,e+a],
  'Отрезок называют по двум его концам: '+answer+'.',visual);
}

function table(d,factors) {
 const a=pick(factors), b=ri(2,9), product=a*b, divide=ri(0,1)===1;
 if(d===0) return divide?numeric('Вычисли '+product+' : '+a+'.',b,a+' × '+b+' = '+product+'.'):
  numeric('Вычисли '+a+' × '+b+'.',product,a+' × '+b+' = '+product+'.');
 if(d===1) return divide?numeric('Восстанови делимое: □ : '+a+' = '+b+'.',product,a+' × '+b+' = '+product+'.'):
  numeric('Восстанови множитель: '+a+' × □ = '+product+'.',b,product+' : '+a+' = '+b+'.');
 const change=pick(['отложили','добавили']), result=change==='отложили'?product-a:product+a;
 if(divide) return numeric('В упаковке '+product+' фишек. Изменили их число: '+change+' '+a+'. Сколько полных пакетов по '+a+' фишек получится теперь?',result/a,
  'Теперь фишек '+result+'. Делим '+result+' на '+a+'.');
 return numeric('Подготовили '+b+' конвертов по '+a+' открыток в каждом. Затем '+change+' '+a+' открыток. Сколько открыток осталось в работе?',result,
  a+' × '+b+' = '+product+'. После изменения получили '+result+'.');
}

function areaUnits(d,large) {
 const factor=100, a=ri(1,8), b=ri(1,80), base=a*factor, small=large?'дм²':'см²', big=large?'м²':'дм²';
 if(d===0) return numeric('Сколько '+small+' в '+a+' '+big+'?',base,a+' '+big+' = '+base+' '+small+'.');
 if(d===1) return numeric('Вырази '+a+' '+big+' '+b+' '+small+' в '+small+'.',base+b,base+' + '+b+' = '+(base+b)+' '+small+'.');
 const c=base+b+ri(-25,25);
 return choice('Сравни '+a+' '+big+' '+b+' '+small+' и '+c+' '+small+'.',relation(base+b,c),signs,
  'Слева '+(base+b)+' '+small+'. Справа '+c+' '+small+'.');
}

function unitSquares(d) {
 const a=ri(3,11), b=ri(2,8), square=a*b;
 const visual=model('g3MoroGrid',{a,b});
 if(d===0) return numeric('Каждая клетка имеет площадь 1 см². Сколько квадратных сантиметров занимает рисунок?',square,
  'В '+b+' рядах по '+a+' клеток. '+a+' × '+b+' = '+square+' (см²).',visual);
 if(d===1) return numeric('По рисунку найди площадь, если мысленно убрать один полный горизонтальный ряд.',square-a,
  'Убираем '+a+' клеток. Остаётся '+square+' − '+a+' = '+(square-a)+' (см²).',visual);
 return numeric('Площадь рисунка '+square+' см². Известно, что в каждом ряду '+a+' клеток по 1 см². Сколько рядов?',b,square+' : '+a+' = '+b+'.');
}

function circle(d) {
 const names=shuffleOptions(['A','B','C','K','M','O','P','T']).slice(0,4), [a,b,c,e]=names;
 const visual=model('g3MoroCircle',{names,turn:45*ri(0,7),r:ri(33,47)});
 if(d===0) return choice('Какая из обозначенных точек находится в центре круга?',a,names,'Центр отмечен буквой '+a+'.',visual);
 if(d===1) return choice('Какая точка лежит на окружности?',b,names,'На границе круга находится точка '+b+'.',visual);
 return choice('Какой из отрезков является радиусом?',a+b,[a+b,b+c,a+c,a+e],
  'Радиус соединяет центр '+a+' с точкой '+b+' на окружности.',visual);
}

function diameter(d) {
 const r=ri(3,25), length=2*r;
 if(d===0) return numeric('Радиус окружности '+r+' см. Найди диаметр в сантиметрах.',length,r+' × 2 = '+length+' (см).');
 if(d===1) return numeric('Диаметр окружности '+length+' см. Найди радиус в сантиметрах.',r,length+' : 2 = '+r+' (см).');
 const delta=ri(1,8);
 return numeric('Диаметр окружности '+length+' см. На сколько сантиметров увеличится диаметр, если радиус увеличить на '+delta+' см?',2*delta,
  'Диаметр вдвое больше радиуса, поэтому прибавится '+delta+' × 2 = '+(2*delta)+' (см).');
}

const months=['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
function calendar(d) {
 const a=ri(0,11), k=ri(2,10), x=(a+k)%12;
 if(d===0) return choice('Какой месяц идёт сразу после месяца «'+months[a]+'»?',months[(a+1)%12],
  [(a+1)%12,a,(a+11)%12,(a+2)%12].map(i=>months[i]),'После него идёт '+months[(a+1)%12]+'.');
 if(d===1) return choice('Какой месяц будет через '+k+' мес. после месяца «'+months[a]+'»?',months[x],
  [x,(x+1)%12,(x+11)%12,a].map(i=>months[i]),'Двигаемся вперёд на '+k+' месяцев, после декабря снова январь.');
 return numeric('Сколько месяцев от месяца «'+months[a]+'» до ближайшего следующего месяца «'+months[x]+'»?',k,
  'Начальный месяц не считаем. До нужного месяца '+k+' шагов.');
}

function days(d) {
 const a=ri(1,8), b=ri(1,23), h=24*a+b;
 if(d===0) return numeric('Сколько часов в '+a+' сут.?',24*a,a+' × 24 = '+(24*a)+' (ч).');
 if(d===1) return numeric('Сколько часов в '+a+' сут. '+b+' ч?',h,24*a+' + '+b+' = '+h+' (ч).');
 const used=ri(1,23);
 return numeric('Поездка длится '+a+' сут. '+b+' ч. Уже прошло '+used+' ч. Сколько часов осталось?',h-used,h+' − '+used+' = '+(h-used)+' (ч).');
}

function tensArithmetic(d,divide) {
 const b=ri(2,5), c=ri(2,Math.floor(10/b)), value=10*b*c;
 if(d===0) return divide?numeric('Вычисли '+value+' : '+(10*b)+'.',c,b*c+' дес. : '+b+' дес. = '+c+'.'):
  numeric('Вычисли '+(10*b)+' × '+c+'.',value,b+' дес. × '+c+' = '+(b*c)+' дес.');
 if(d===1) return divide?numeric('Восстанови делитель: '+value+' : □ = '+c+'.',10*b,value+' : '+c+' = '+(10*b)+'.'):
  numeric('Восстанови множитель: □ × '+c+' = '+value+'.',10*b,value+' : '+c+' = '+(10*b)+'.');
 const left=ri(1,4);
 if(divide){
  const extra=ri(1,7);
  return numeric('Было '+(value+extra)+' карточек. '+extra+' отложили, остальное сложили пачками по '+(10*b)+'. Сколько пачек получилось?',c,
   'После откладывания '+value+' карточек. '+value+' : '+(10*b)+' = '+c+'.');
 }
 return numeric('В '+c+' упаковках по '+(10*b)+' карточек. Отдали '+left+' карточек. Сколько осталось?',value-left,
  'Сначала '+value+' карточек. Затем '+value+' − '+left+' = '+(value-left)+'.');
}

function distribute(d,divide) {
 const k=ri(2,5), a=ri(2,9), b=ri(2,9), product=(a+b)*k;
 if(!divide){
  if(d===0) return numeric('Умножь сумму на число: ('+a+' + '+b+') × '+k+'.',product,
   a+' × '+k+' + '+b+' × '+k+' = '+product+'.');
  if(d===1) return numeric('Найди пропуск: ('+a+' + '+b+') × '+k+' = '+(a*k)+' + □.',b*k,
   'Второе слагаемое равно '+b+' × '+k+' = '+(b*k)+'.');
  return numeric('Восстанови слагаемое: ('+a+' + □) × '+k+' = '+product+'.',b,product+' : '+k+' − '+a+' = '+b+'.');
 }
 if(d===0) return numeric('Раздели сумму на число: ('+(a*k)+' + '+(b*k)+') : '+k+'.',a+b,a+' + '+b+' = '+(a+b)+'.');
 if(d===1) return numeric('Вставь число: ('+(a*k)+' + '+(b*k)+') : '+k+' = '+a+' + □.',b,
  (b*k)+' : '+k+' = '+b+'.');
 return numeric('Восстанови число: ('+(a*k)+' + □) : '+k+' = '+(a+b)+'.',b*k,
  'Сумма в скобках '+(a+b)+' × '+k+' = '+product+'. Второе слагаемое '+product+' − '+(a*k)+' = '+(b*k)+'.');
}

function twoDigitDivision(d) {
 const b=ri(12,32), c=ri(2,Math.min(7,Math.floor(99/b))), a=b*c;
 if(d===0) return numeric('Подбери частное: '+a+' : '+b+'.',c,b+' × '+c+' = '+a+'.');
 if(d===1) return numeric('Какое число нужно разделить на '+b+', чтобы получить '+c+'?',a,b+' × '+c+' = '+a+'.');
 const extra=ri(1,9);
 return numeric('После того как из коробки взяли '+extra+' предметов, остаток разделили по '+b+' в '+c+' наборов. Сколько предметов было сначала?',a+extra,
  'В наборах '+b+' × '+c+' = '+a+'. До этого было '+a+' + '+extra+' = '+(a+extra)+'.');
}

function verify(d,kind) {
 const large=kind==='large', multiply=kind==='multiply', a=large?ri(105,291):ri(11,23), b=ri(2,Math.min(9,Math.floor((large?999:99)/a))), v=a*b;
 if(d===0) return multiply?numeric('Проверь '+a+' × '+b+' = '+v+' делением. Найди '+v+' : '+b+'.',a,'Если '+v+' : '+b+' = '+a+', равенство верно.'):
  numeric('Проверь '+v+' : '+b+' = '+a+' умножением. Какое число получится?',v,a+' × '+b+' = '+v+'.');
 if(d===1) return multiply?numeric('Ученик записал '+a+' × '+b+' = '+(v+1)+'. Запиши правильное произведение и проверь его делением.',v,
  v+' : '+b+' = '+a+'.'):numeric('Ученик получил частное '+(a+1)+' в примере '+v+' : '+b+'. Проверь и запиши правильное частное.',a,a+' × '+b+' = '+v+'.');
 return multiply?numeric('В примере умножения один множитель неизвестен, второй равен '+b+', произведение равно '+v+'. Найди первый множитель.',a,
  v+' : '+b+' = '+a+'.'):numeric('Частное равно '+a+', делитель равен '+b+'. Какое делимое проверит это деление?',v,a+' × '+b+' = '+v+'.');
}

function verifyRemainder(d) {
 const b=ri(3,10), q=ri(2,8), r=ri(1,b-1), a=b*q+r;
 if(d===0) return numeric('При делении на '+b+' получили '+q+' и остаток '+r+'. Найди делимое.',a,b+' × '+q+' + '+r+' = '+a+'.');
 if(d===1) return numeric('При делении '+a+' на '+b+' частное равно '+q+'. Какой остаток проверяет это равенство?',r,a+' − '+b+' × '+q+' = '+r+'.');
 const wrong=b+ri(0,4);
 return numeric('Ученик записал '+a+' : '+b+' и предложил остаток '+wrong+'. Найди правильный остаток.',r,
  'Остаток меньше '+b+'. '+a+' = '+b+' × '+q+' + '+r+'.');
}

function hundreds(d) {
 const n=ri(1,10), a=ri(2,8), k=ri(1,9-a);
 if(d===0) return numeric('Сколько единиц в '+n+' сотнях?',100*n,n+' × 100 = '+format(100*n)+'.');
 if(d===1) return numeric('Сколько сотен в числе '+format(100*n)+'?',n,format(100*n)+' : 100 = '+n+'.');
 return numeric('Число '+(a*100)+' увеличивали на 100, пока не получили '+((a+k)*100)+'. Сколько раз прибавили 100?',k,
  'Разница '+(k*100)+'. В ней '+k+' сотен.');
}

function scale(d) {
 const factor=pick([10,100]), a=ri(2,factor===10?99:10), result=a*factor;
 if(d===0) return numeric('Увеличь '+a+' в '+factor+' раз.',result,a+' × '+factor+' = '+format(result)+'.');
 if(d===1) return numeric('Уменьши '+format(result)+' в '+factor+' раз.',a,format(result)+' : '+factor+' = '+a+'.');
 const k=ri(2,9);
 return numeric('Число '+format(result)+' уменьшили в '+factor+' раз, затем прибавили '+k+'. Какой результат?',a+k,
  'Сначала '+format(result)+' : '+factor+' = '+a+'. Затем '+a+' + '+k+' = '+(a+k)+'.');
}

function digitTotals(d) {
 const a=ri(1,9), b=ri(0,a===9?8:9), c=ri(0,9), n=100*a+10*b+c;
 if(d===0) return numeric('Сколько в числе '+n+' полных десятков?',10*a+b,'Сотни тоже содержат десятки. '+n+' = '+(10*a+b)+' дес. и '+c+' ед.');
 if(d===1) return numeric('Число содержит '+(10*a+b)+' полных десятков и '+c+' отдельных единиц. Восстанови число.',n,
  (10*a+b)+' × 10 + '+c+' = '+n+'.');
 const add=ri(1,Math.min(8,99-(10*a+b))), given=n+10*add;
 return numeric('Было '+n+' отдельных предметов, стало '+given+'. Их раскладывают по 10. На сколько стало больше полных десятков?',Math.floor(given/10)-Math.floor(n/10),
  'Было '+Math.floor(n/10)+' полных десятков, стало '+Math.floor(given/10)+'.');
}

function triangleSides(d) {
 const a=ri(5,20), b=ri(2,a-1), c=ri(a+1,a+b-1), equilateral=ri(0,1)===1;
 const options=['Равносторонний','Равнобедренный с двумя равными сторонами','Разносторонний'];
 if(d===0) {
  const kind=ri(0,2), sides=kind===0?[a,a,a]:kind===1?shuffleOptions([a,a,b]):shuffleOptions([a,b,c]);
  return choice('Стороны треугольника: '+sides.join(' см, ')+' см. Какой это треугольник?',options[kind],options,
   kind===0?'Все три стороны равны.':kind===1?'Равны две стороны.':'Все три стороны различны.');
 }
 const base=d===1&&equilateral?a:b, perimeter=2*a+base;
 if(d===1) return numeric('У треугольника две стороны по '+a+' см, третья '+base+' см. Найди периметр в сантиметрах.',perimeter,
  a+' + '+a+' + '+base+' = '+perimeter+' (см).');
 return numeric('У равнобедренного треугольника периметр '+perimeter+' см и основание '+base+' см. Найди длину каждой из равных сторон.',a,
  'Две равные стороны вместе '+(perimeter-base)+' см. Каждая по '+a+' см.');
}

function triangleAngles(d) {
 const types=['Остроугольный','Прямоугольный','Тупоугольный'];
 function make() {
  const kind=ri(0,2);
  const a=kind===0?ri(50,75):kind===1?90:ri(105,130);
  const b=kind===0?ri(50,72):ri(20,180-a-14);
  return {kind,a,b};
 }
 const first=make(), second=make(), third=make();
 if(d===0) return choice('Какой треугольник изображён?',types[first.kind],types,
  first.kind===0?'Все углы острые.':first.kind===1?'Один из углов прямой.':'В треугольнике один тупой угол.',model('g3MoroTriangles',[first]));
 const target=ri(0,2);
 if(d===1) {
  const items=[first,second], result=items.filter(t=>t.kind===target).length;
  return numeric('Сколько из двух треугольников относятся к виду «'+types[target].toLowerCase()+'»?',result,
   'Слева '+types[first.kind].toLowerCase()+', справа '+types[second.kind].toLowerCase()+'.',model('g3MoroTriangles',items));
 }
 const items=[first,second,third];
 return numeric('Сколько показано треугольников, в которых ни один угол не является прямым?',items.filter(x=>x.kind!==1).length,
  'Слева направо: '+items.map(t=>types[t.kind].toLowerCase()).join(', ')+'.',model('g3MoroTriangles',items));
}

function oralMultiply(d) {
 const a=ri(21,123), b=ri(2,7), prod=a*b;
 if(d===0) {
  const multiplier=ri(0,1)===0;
  return multiplier?numeric('Вычисли устно '+a+' × '+b+'.',prod,a+' × '+b+' = '+prod+'.'):
   numeric('Вычисли устно '+prod+' : '+b+'.',a,a+' × '+b+' = '+prod+'.');
 }
 if(d===1) {
  const head=Math.floor(a/10)*10, tail=a-head;
  return numeric('Раздели '+prod+' на '+b+'. Первое частичное частное равно '+head+'. Найди второе.',tail,
   'Первая часть делимого '+(head*b)+'. Осталось '+(tail*b)+', а '+(tail*b)+' : '+b+' = '+tail+'.');
 }
 const other=ri(1,12);
 return numeric('В '+b+' коробках по '+a+' листов. Добавили '+other+' листов в общий запас. Сколько листов теперь?',prod+other,
  'В коробках '+prod+' листов. После добавления '+(prod+other)+'.');
}

function calculator(d) {
 const a=ri(18,94), b=ri(4,17), neg=ri(0,1)===0, result=total(a,b,neg);
 if(d===0) return numeric('На калькуляторе нажали ['+a+'] ['+op(neg)+'] ['+b+'] [=]. Какое число появится?',result,a+' '+op(neg)+' '+b+' = '+result+'.');
 if(d===1) return choice('Чтобы получить '+result+', что нажать между кнопками ['+a+'] и ['+b+']?',op(neg),['+','−','×',':'],
  'Нужна запись '+a+' '+op(neg)+' '+b+' = '+result+'.');
 return numeric('На экране '+result+'. Ввели ['+b+'] после знака ['+op(neg)+'] и нажали [=]. До знака было другое число. Какое?',
  a,result+' '+op(!neg)+' '+b+' = '+a+'.');
}

function review(d) {
 return pick([addSub,distribute,oralMultiply,diameter,verifyRemainder,calendar])(d,true);
}

function visualHtml(visual) {
 const v=visual.data;
 const svg=(body,label,w=210,h=140)=>'<div class="g3-moro-figure"><svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+label+'" xmlns="http://www.w3.org/2000/svg">'+body+'</svg></div>';
 const point=(x,y,name,fill)=>'<circle cx="'+x+'" cy="'+y+'" r="3" fill="'+fill+'"/><text x="'+(x+5)+'" y="'+(y-5)+'">'+esc(name)+'</text>';
 if(visual.type==='g3MoroGrid'){
  const size=13, w=v.a*size,h=v.b*size;
  const grid=Array.from({length:v.a+1},(_,i)=>'M'+(7+i*size)+' 7 v'+h).join(' ')+
   ' '+Array.from({length:v.b+1},(_,i)=>'M7 '+(7+i*size)+' h'+w).join(' ');
  return svg('<rect x="7" y="7" width="'+w+'" height="'+h+'" fill="#e1f1eb"/><path d="'+grid+'" fill="none" stroke="#4a7b69"/>','Клетчатый прямоугольник',w+14,h+14);
 }
 if(visual.type==='g3MoroLetters'){
  const points=[[42,39],[152,39],[152,98],[42,98]];
  const ordered=points.slice(v.turn).concat(points.slice(0,v.turn)), [a,b]=ordered;
  return svg('<polygon points="'+points.map(x=>x.join(',')).join(' ')+'" fill="#e4f4ea" stroke="#356951" stroke-width="2"/>'+
   '<path d="M'+a.join(' ')+' L'+b.join(' ')+'" stroke="#1976b9" stroke-width="4"/>'+
   ordered.map(([x,y],i)=>point(x,y,v.names[i],i===0?'#1976b9':'#356951')).join(''),'Четырёхугольник с обозначенными вершинами');
 }
 if(visual.type==='g3MoroCircle'){
  const theta=v.turn*Math.PI/180, x=Math.cos(theta),y=Math.sin(theta), cx=105,cy=70;
  const points=[[cx,cy],[cx+v.r*x,cy+v.r*y],[cx+v.r*.47*y,cy-v.r*.47*x],[cx-1.22*v.r*x,cy-1.22*v.r*y]];
  return svg('<circle cx="'+cx+'" cy="'+cy+'" r="'+v.r+'" fill="#e2f4ed" stroke="#356951" stroke-width="2"/>'+
   points.map(([a,b],i)=>point(a,b,v.names[i],'#256a4c')).join(''),'Круг и четыре обозначенные точки');
 }
 return '<div class="g3-moro-triangles">'+v.map(t=>{
  const a=t.a*Math.PI/180,b=t.b*Math.PI/180,h=Math.sin(a)*Math.sin(b)/Math.sin(a+b),x=h*Math.cos(a)/Math.sin(a);
  const scale=Math.min(87/(Math.max(1,x)-Math.min(0,x)),67/h),left=16-Math.min(0,x)*scale;
  const coord=[[left,86],[left+scale,86],[left+x*scale,86-h*scale]];
  const right=t.kind===1?'<path d="M'+(left+9)+' 86 v-9 h-9" fill="none" stroke="#356951" stroke-width="1.5"/>':'';
  return svg('<polygon points="'+coord.map(p=>p.join(',')).join(' ')+'" fill="#e2f4ed" stroke="#356951" stroke-width="2"/>'+right,'Треугольник',120,100);
 }).join('')+'</div>';
}

const topic=(id,title,rule,example,generate)=>({id:'moro_'+id,title,rule,example,generate});
const existing=(id,title)=>({id,title});
const chapters=[
 {part:1,id:'add_sub_100',icon:'➕',title:'Числа от 1 до 100. Сложение и вычитание',topics:[
  topic('add_sub_100','Сложение и вычитание до 100. Повторение','Разложи числа на десятки и единицы или дополни до круглого десятка.','58 + 7 = 58 + 2 + 5 = 65.',d=>addSub(d,false)),
  topic('equations_add_sub','Решение уравнений на сложение и вычитание','Неизвестное находят обратным действием. Подставь найденное значение и проверь равенство.','В уравнении x + 13 = 59 получаем x = 59 − 13 = 46.',additiveEquation),
  topic('figure_letters','Обозначение геометрических фигур буквами','Точки обозначают заглавными буквами. Отрезок называют по двум его концам.','Сторону с концами A и B можно назвать AB или BA.',letters),
  existing('geometry_figures','Точка, прямая, угол и многоугольники. Повторение')
 ]},
 {part:1,id:'tabular',icon:'✖️',title:'Числа от 1 до 100. Табличное умножение и деление',topics:[
  existing('properties','Свойства сложения и умножения. Повторение'),
  existing('multiplication_table','Таблица умножения. Повторение'),
  existing('division_table','Связь деления с умножением. Табличное деление'),
  existing('order_operations','Порядок действий'),
  existing('price_quantity_cost','Цена, количество и стоимость'),
  existing('increase_decrease_times','Увеличение и уменьшение числа в несколько раз'),
  existing('multiplicative_compare','Во сколько раз больше или меньше'),
  existing('multiplicative_compare_tasks','Задачи на кратное сравнение'),
  topic('table_5_7','Умножение и деление с числами 5, 6 и 7','Примеры на деление проверяют обратным умножением.','42 : 7 = 6, потому что 7 × 6 = 42.',d=>table(d,[5,6,7])),
  existing('area_measure','Площадь фигуры. Измерение и сравнение'),
  topic('square_cm','Квадратный сантиметр','Квадрат со стороной 1 см имеет площадь 1 см².','В четырёх рядах по 5 таких квадратов площадь равна 20 см².',unitSquares),
  existing('rectangle_square_area','Площадь прямоугольника и квадрата'),
  topic('table_8_9','Умножение и деление с числами 8 и 9','У каждого табличного произведения есть связанные примеры на деление.','8 × 9 = 72, значит, 72 : 8 = 9.',d=>table(d,[8,9])),
  topic('square_dm','Квадратный дециметр','В 1 дм² содержится 100 см²: 10 рядов по 10 квадратных сантиметров.','3 дм² 5 см² = 305 см².',d=>areaUnits(d,false)),
  topic('square_m','Квадратный метр','В 1 м² содержится 100 дм²: 10 рядов по 10 квадратных дециметров.','2 м² 14 дм² = 214 дм².',d=>areaUnits(d,true)),
  existing('area_units','Сравнение и перевод единиц площади. Повторение'),
  existing('zero_one','Умножение и деление с 0 и 1')
 ]},
 {part:1,id:'parts',icon:'◐',title:'Доли',topics:[
  existing('parts_intro','Доли целого. Половина, треть и четверть'),
  existing('parts_compare','Сравнение долей одного целого'),
  existing('part_of_quantity','Нахождение доли величины'),
  topic('circle','Окружность и круг','Окружность — граница круга. Все её точки находятся на одинаковом расстоянии от центра.','Радиус идёт из центра к любой точке на окружности.',circle),
  topic('diameter','Радиус и диаметр','Диаметр проходит через центр и соединяет две точки окружности. Его длина равна двум радиусам.','При радиусе 6 см диаметр равен 12 см.',diameter),
  topic('calendar','Единицы времени. Год и месяц','В году 12 месяцев. После декабря начинается январь следующего года.','Через 2 месяца после ноября наступит январь.',calendar),
  topic('days','Сутки','В одних сутках 24 часа. Число суток можно перевести в часы и прибавить оставшиеся часы.','2 сут. 5 ч = 48 ч + 5 ч = 53 ч.',days),
  existing('time_tasks','Задачи на начало, окончание и продолжительность события')
 ]},
 {part:2,id:'offtable',icon:'➗',title:'Числа от 1 до 100. Внетабличное умножение и деление',topics:[
  topic('tens_multiply','Умножение круглых десятков','Круглый десяток удобно представить как несколько десятков, умножить и перевести в единицы.','20 × 4 = 8 дес. = 80.',d=>tensArithmetic(d,false)),
  topic('tens_divide','Деление круглого числа на круглое', 'Если делимое и делитель — круглые десятки, вырази оба числа в десятках.','80 : 20 = 8 дес. : 2 дес. = 4.',d=>tensArithmetic(d,true)),
  topic('sum_multiply','Умножение суммы на число','Умножь каждое слагаемое на число и сложи произведения.','(10 + 6) × 4 = 40 + 24 = 64.',d=>distribute(d,false)),
  existing('offtable_multiply','Внетабличное умножение двузначного числа'),
  topic('sum_divide','Деление суммы на число','Если каждое слагаемое делится на данное число, раздели их по отдельности и сложи частные.','(30 + 18) : 6 = 5 + 3 = 8.',d=>distribute(d,true)),
  existing('offtable_divide','Внетабличное деление двузначного числа'),
  existing('unknown_component','Связь компонентов действий. Неизвестное число'),
  topic('check_division','Проверка деления','Умножь частное на делитель. Если получишь делимое, вычисление верно.','72 : 8 = 9. Проверяем: 9 × 8 = 72.',d=>verify(d,'divide')),
  topic('two_digit_divisor','Деление на двузначное число','Подбери частное так, чтобы произведение делителя и частного равнялось делимому.','84 : 28 = 3, потому что 28 × 3 = 84.',twoDigitDivision),
  topic('check_multiply','Проверка умножения','Раздели произведение на один из множителей. Должен получиться второй множитель.','17 × 4 = 68. Проверяем: 68 : 4 = 17.',d=>verify(d,'multiply')),
  existing('division_remainder','Деление с остатком'),
  topic('check_remainder','Проверка деления с остатком','Умножь делитель на частное и прибавь остаток. Остаток должен быть меньше делителя.','39 : 8 = 4 (ост. 7), потому что 8 × 4 + 7 = 39.',verifyRemainder),
  existing('remainder_tasks','Задачи на деление с остатком')
 ]},
 {part:2,id:'numeration',icon:'🔢',title:'Числа от 1 до 1000. Нумерация',topics:[
  topic('hundreds','Сотня. Счёт сотнями','В сотне 100 единиц или 10 десятков. Десять сотен составляют тысячу.','7 сотен = 700.',hundreds),
  existing('numbers_1000','Числа от 1 до 1000. Образование и запись'),
  existing('place_value','Разряды и сумма разрядных слагаемых'),
  topic('scale','Увеличение и уменьшение в 10 и в 100 раз','При умножении число становится больше во столько раз, а при делении — меньше.','8 × 100 = 800, а 800 : 10 = 80.',scale),
  existing('compare_order','Сравнение и упорядочивание трёхзначных чисел'),
  topic('digit_totals','Общее количество единиц, десятков и сотен','Общее число десятков учитывает и десятки, которые входят в сотни.','В числе 426 — 42 полных десятка и 6 единиц.',digitTotals),
  existing('mass','Грамм и килограмм'),
  existing('length_units','Километр и другие единицы длины'),
  existing('time','Секунда, минута и час')
 ]},
 {part:2,id:'add_sub_1000',icon:'➕',title:'Числа от 1 до 1000. Сложение и вычитание',topics:[
  topic('mental_add_sub','Устное сложение и вычитание до 1000','В устном счёте удобно складывать и вычитать части числа по разрядам или округлять с поправкой.','480 − 170 = 480 − 100 − 70 = 310.',d=>addSub(d,true)),
  existing('written_add','Письменное сложение до 1000'),
  existing('written_subtract','Письменное вычитание до 1000'),
  topic('triangle_sides','Виды треугольников по сторонам','У равнобедренного треугольника хотя бы две стороны равны. Если равны все три, он также равносторонний. Если все различны, он разносторонний.','Стороны 5 см, 5 см и 6 см образуют равнобедренный треугольник.',triangleSides),
  existing('quantity_operations','Сложение, вычитание и другие действия с величинами'),
  existing('two_step_tasks','Задачи в два действия')
 ]},
 {part:2,id:'multiply_divide_1000',icon:'✖️',title:'Числа от 1 до 1000. Умножение и деление',topics:[
  existing('round_numbers','Устные действия с десятками и сотнями'),
  topic('oral_multiply_divide','Устное умножение и деление до 1000','Разложи числа на удобные части. Умножь или раздели каждую часть и сложи результаты.','96 : 3 = (90 + 6) : 3 = 30 + 2 = 32.',oralMultiply),
  topic('triangle_angles','Виды треугольников по углам','Остроугольный треугольник имеет три острых угла. Один прямой угол бывает у прямоугольного треугольника, один тупой — у тупоугольного.','Если один угол совпадает с уголком листа, треугольник прямоугольный.',triangleAngles),
  existing('written_multiply','Письменное умножение трёхзначного на однозначное'),
  existing('written_divide','Письменное деление трёхзначного на однозначное'),
  topic('check_written_division','Проверка деления до 1000 умножением','При делении без остатка произведение частного и делителя равно делимому.','846 : 6 = 141. Проверяем: 141 × 6 = 846.',d=>verify(d,'large')),
  topic('calculator','Знакомство с калькулятором','Набери первое число, выбери знак, набери второе число и нажми =.','Кнопки [48] [−] [16] [=] дают 32.',calculator)
 ]},
 {part:2,id:'review',icon:'📘',title:'Что узнали, чему научились в 3 классе',topics:[
  existing('task_model','Данные, вопрос, схема и план решения задачи'),
  existing('operation_word_problems','Задачи на смысл четырёх действий'),
  existing('difference_compare_tasks','Задачи на разностное сравнение'),
  existing('increase_decrease_tasks','Задачи с отношениями «на» и «в»'),
  existing('money','Рубли и копейки. Повторение'),
  existing('geometry_construction','Построения на клетчатой бумаге'),
  existing('broken_line_length','Длина ломаной. Повторение'),
  existing('perimeter','Периметр многоугольников. Повторение'),
  existing('classification_patterns','Классификация и закономерности'),
  existing('true_false_logic','Истинные и ложные утверждения'),
  existing('tables','Чтение и заполнение таблиц'),
  existing('bar_charts','Столбчатые диаграммы'),
  existing('algorithms_logic','Алгоритмы, последовательности и логика'),
  topic('review','Смешанные задания за год','Вспомни нужное правило, найди результат и проверь его.','При делении с остатком проверь, что остаток меньше делителя.',review)
 ]}
];

const extra=new Map();
let order=0;
const groups=chapters.map(chapter=>({
 id:chapter.id,title:chapter.title,icon:chapter.icon,desc:'',
 topics:chapter.topics.map(item=>{
  const old=oldTopics.get(item.id);
  if(item.generate)extra.set(item.id,item);
  return {
   rendererType:'quiz',implemented:true,...old,id:'g3:'+item.id,grade:3,
   title:item.title,shortTitle:old?.shortTitle||'',group:chapter.title,order:++order
  };
 })
}));
G3_GROUPS.splice(0,G3_GROUPS.length,...groups);

const previousMake=makeG3Question;
makeG3Question=function(id,stage=null) {
 const item=extra.get(rawCourseId(id));
 if(!item)return previousMake(id,stage);
 const d=stage===null?activeDifficulty():Math.max(0,Math.min(2,Number(stage)||0));
 const {text,answer,options,ex,visual}=item.generate(d);
 const sig='g3:'+item.id+':'+text+'|'+JSON.stringify(visual),audit={variant:item.id};
 const rows=options?.map(x=>({key:String(x),label:esc(x)}));
 const q=rows?g3ChoiceQuestion(text,answer,rows,ex,sig,audit,true):g3StoryNumberQuestion(text,answer,ex,sig,audit);
 if(visual)q.visual=visual;
 return q;
};

const previousLesson=g3Lesson;
g3Lesson=function(id) {
 const item=extra.get(rawCourseId(id));
 if(!item)return previousLesson(id);
 return '<div class="elementary-theory"><p><b>'+esc(item.rule)+'</b></p><div class="elementary-example">'+esc(item.example)+'</div></div>';
};

const previousVisual=quizVisualHtml;
quizVisualHtml=function(question) {
 return question?.visual?.type?.startsWith('g3Moro')?visualHtml(question.visual):previousVisual(question);
};

window.grade3Textbook={
 chapters:chapters.map(chapter=>({part:chapter.part,title:chapter.title,items:chapter.topics.map(item=>[null,item.title,[item.id]])})),
 catalog:g3AllTopics
};
})();
