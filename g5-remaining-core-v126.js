/* MatKvest Grade 5 v126 — nine subject-specific 3-stage lesson generators.
 * Real learner path: makeG5Question(id); no isolated donor-only testing.
 * Five cognitive families per stage, independent arithmetic expression trees.
 */
(function(){
'use strict';
if(typeof makeG5Question!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof activeDifficulty!=='function')throw Error('v126 prerequisite missing');
const TOPICS=['order','powers','equations','volume','angles','charts','units','word','frac_shapes'];
const covered=new Set(TOPICS),previous=makeG5Question;
const level=()=>Math.min(2,Math.max(0,Number(activeDifficulty())||0));
const family=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const r=(a,b)=>ri(a,b);
const V=n=>['v',n],A=(...ns)=>['add',...ns],S=(a,b)=>['sub',a,b],M=(a,b)=>['mul',a,b],D=(a,b)=>['div',a,b],Abs=(a,b)=>['abs',S(a,b)],Pow=(a,b)=>['pow',a,b];
function evalPlan(n){
 const [op,...v]=n,E=evalPlan;
 if(op==='v')return v[0];
 if(op==='add')return v.reduce((a,b)=>a+E(b),0);
 if(op==='sub')return E(v[0])-E(v[1]);
 if(op==='mul')return E(v[0])*E(v[1]);
 if(op==='div'){const a=E(v[0]),b=E(v[1]);if(b===0||a%b)throw Error('Noninteger v126 division');return a/b}
 if(op==='abs')return Math.abs(E(v[0]));
 if(op==='pow')return E(v[0])**E(v[1]);
 throw Error('Unknown v126 arithmetic '+op);
}
function barGraph(values){
 const max=Math.max(...values),scale=100/max,names=['Пн','Вт','Ср','Чт'];
 const bars=values.map((v,i)=>{const x=33+i*104,h=(v*scale).toFixed(1),y=(134-v*scale).toFixed(1);return '<rect x="'+x+'" y="'+y+'" width="51" height="'+h+'" rx="4" fill="#318fbd"/><text x="'+(x+25)+'" y="'+(134-v*scale-5).toFixed(1)+'" fill="currentColor" font-size="13" text-anchor="middle">'+v+'</text><text x="'+(x+25)+'" y="155" fill="currentColor" font-size="14" text-anchor="middle">'+names[i]+'</text>'}).join('');
 return '<div style="width:100%;max-width:590px;overflow:hidden"><svg role="img" aria-label="Столбчатая диаграмма по дням недели" viewBox="0 0 460 170" width="100%" style="height:auto"><line x1="15" y1="134" x2="453" y2="134" stroke="currentColor" stroke-width="2"/>'+bars+'</svg></div>';
}
function shapeGallery(order){
 const pics={
  ring:'<circle cx="65" cy="62" r="37" fill="none" stroke="#34649a" stroke-width="5"/>',
  disk:'<circle cx="65" cy="62" r="37" fill="#80bde8" stroke="#34649a" stroke-width="3"/>',
  sphere:'<circle cx="65" cy="62" r="37" fill="url(#mk5sphere)" stroke="#34649a" stroke-width="2"/><ellipse cx="59" cy="61" rx="17" ry="36" fill="none" stroke="#34649a" stroke-width="1.7" opacity=".45"/><ellipse cx="52" cy="48" rx="8" ry="5" fill="#fff" opacity=".65"/>',
  cylinder:'<path d="M33 42 V95 A32 12 0 0 0 97 95 V42" fill="#a9d5ed" stroke="#34649a" stroke-width="2"/><ellipse cx="65" cy="42" rx="32" ry="12" fill="#e4f4fc" stroke="#34649a" stroke-width="2"/><path d="M33 95 A32 12 0 0 0 97 95" fill="none" stroke="#34649a" stroke-width="2"/>'
 };
 const artwork=order.map((kind,i)=>'<g transform="translate('+(i*130)+',0)">'+pics[kind]+'<text x="65" y="134" font-size="22" font-weight="700" text-anchor="middle" fill="currentColor">'+(i+1)+'</text></g>').join('');
 return '<div style="width:100%;max-width:620px;overflow:hidden"><svg viewBox="0 0 520 145" width="100%" role="img" aria-label="Четыре фигуры под номерами от одного до четырёх" style="height:auto"><defs><radialGradient id="mk5sphere" cx="35%" cy="25%" r="80%"><stop offset="0%" stop-color="#f4fbff"/><stop offset="100%" stop-color="#468fc4"/></radialGradient></defs>'+artwork+'</svg></div>';
}
function circleFeatureGallery(order){
 const pictures={
  chord:'<circle cx="65" cy="62" r="37" fill="none" stroke="#34649a" stroke-width="2"/><line x1="38" y1="37" x2="38" y2="87" stroke="#d8792d" stroke-width="5"/>',
  diameter:'<circle cx="65" cy="62" r="37" fill="none" stroke="#34649a" stroke-width="2"/><line x1="28" y1="62" x2="102" y2="62" stroke="#d8792d" stroke-width="5"/>',
  arc:'<circle cx="65" cy="62" r="37" fill="none" stroke="#34649a" stroke-width="2"/><path d="M65 25 A37 37 0 0 1 102 62" fill="none" stroke="#d8792d" stroke-width="5"/>',
  sector:'<circle cx="65" cy="62" r="37" fill="none" stroke="#34649a" stroke-width="2"/><path d="M65 62 L65 25 A37 37 0 0 1 102 62 Z" fill="#ffcf87" stroke="#d8792d" stroke-width="3"/>'
 };
 const items=order.map((kind,i)=>'<g transform="translate('+(i*130)+',0)">'+pictures[kind]+'<text x="65" y="134" text-anchor="middle" fill="currentColor" font-size="22" font-weight="700">'+(i+1)+'</text></g>').join('');
 return '<div style="width:100%;max-width:620px;overflow:hidden"><svg viewBox="0 0 520 145" width="100%" role="img" aria-label="Четыре окружности с разными выделенными элементами под номерами" style="height:auto">'+items+'</svg></div>';
}
function radiusDiagram(){
 return '<div style="width:100%;max-width:360px;overflow:hidden"><svg viewBox="0 0 300 180" width="100%" role="img" aria-label="Окружность с центром O и радиусом OA" style="height:auto"><circle cx="140" cy="87" r="64" fill="none" stroke="#34649a" stroke-width="3"/><circle cx="140" cy="87" r="3" fill="#34649a"/><line x1="140" y1="87" x2="204" y2="87" stroke="#db7830" stroke-width="3"/><text x="129" y="80" font-size="17" fill="currentColor">O</text><text x="210" y="86" font-size="17" fill="currentColor">A</text></svg></div>';
}
function g5Protractor(degrees){
 const cx=195,cy=189,r=154,rad=degrees*Math.PI/180;
 const dx=(cx+r*Math.cos(rad)).toFixed(2),dy=(cy-r*Math.sin(rad)).toFixed(2);
 let ticks='',labels='';
 for(let deg=0;deg<=180;deg+=10){
  const a=deg*Math.PI/180,outerX=(cx+r*Math.cos(a)).toFixed(2),outerY=(cy-r*Math.sin(a)).toFixed(2);
  const innerR=deg%30===0?r-15:r-8,innerX=(cx+innerR*Math.cos(a)).toFixed(2),innerY=(cy-innerR*Math.sin(a)).toFixed(2);
  ticks+='<line x1="'+outerX+'" y1="'+outerY+'" x2="'+innerX+'" y2="'+innerY+'" stroke="#527b9e" stroke-width="'+(deg%30===0?2:1)+'"/>';
  if(deg%30===0){const labelR=r-35,lx=(cx+labelR*Math.cos(a)).toFixed(2),ly=(cy-labelR*Math.sin(a)+5).toFixed(2);
   labels+='<text x="'+lx+'" y="'+ly+'" fill="currentColor" font-size="13" text-anchor="middle">'+deg+'</text>';}
 }
 const ar=54,ax=(cx+ar*Math.cos(rad)).toFixed(2),ay=(cy-ar*Math.sin(rad)).toFixed(2);
 return '<div style="width:100%;max-width:460px;overflow:hidden;margin:7px auto"><svg role="img" aria-label="Транспортир с углом '+degrees+' градусов" viewBox="0 0 400 235" width="100%" style="height:auto"><path d="M 41 189 A 154 154 0 0 1 349 189" fill="none" stroke="#547fa4" stroke-width="3"/><line x1="35" y1="'+cy+'" x2="355" y2="'+cy+'" stroke="#547fa4" stroke-width="2"/>'+ticks+labels+'<line x1="'+cx+'" y1="'+cy+'" x2="349" y2="'+cy+'" stroke="#de853c" stroke-width="3"/><line x1="'+cx+'" y1="'+cy+'" x2="'+dx+'" y2="'+dy+'" stroke="#de853c" stroke-width="3"/><path d="M 249 189 A 54 54 0 '+(degrees>180?1:0)+' 0 '+ax+' '+ay+'" fill="none" stroke="#de853c" stroke-width="2"/><circle cx="'+cx+'" cy="'+cy+'" r="4" fill="#345e8e"/><text x="191" y="215" fill="currentColor" font-size="15" text-anchor="middle">'+degrees+'°</text></svg></div>';
}
function gridShape(total,filled){
 const cols=5,rows=Math.ceil(total/cols),sz=30;
 let rects='';
 for(let i=0;i<total;i++){const x=(i%cols)*sz,y=Math.floor(i/cols)*sz;rects+='<rect x="'+(x+2)+'" y="'+(y+2)+'" width="26" height="26" rx="3" fill="'+(i<filled?'#428ec5':'#ffffff')+'" stroke="#445b6a" stroke-width="1"/>'}
 return '<div style="max-width:250px"><svg role="img" aria-label="Прямоугольная фигура, часть клеток закрашена" viewBox="0 0 '+(cols*sz)+' '+(rows*sz)+'" width="100%" style="height:auto">'+rects+'</svg></div>';
}
function spec(id,t,p){
 const a=r(8,18+4*t),b=r(5,14+4*t),c=r(3,10+3*t),d=r(2,7+2*t),e=r(2,6+2*t),k=r(2,7+3*t);
 let rows;
 if(id==='order'){
  const n=r(120,740),x=r(15,45),y=r(5,14),low=n+x,high=low+y;
  if(t===0)rows=[
   ['Какое число больше: '+n+' или '+(n+x)+'?',V(n+x),'Второе число больше первого на '+x+'.',1],
   ['Какое число меньше: '+n+' или '+(n+x)+'?',V(n),'Сравним сначала сотни, затем десятки и единицы.',1],
   ['Сколько натуральных чисел строго между '+n+' и '+(n+x)+'?',S(V(x),V(1)),'Границы не включаются, поэтому чисел на одно меньше разности.',2],
   ['Числа '+n+', '+(n+x)+', '+(n+y)+' записали по возрастанию. Какое стоит последним?',V(n+x),'Последнее в порядке возрастания — наибольшее.',2],
   ['Числа '+n+', '+(n+x)+', '+(n+y)+' расположили по убыванию. Какое стоит первым?',V(n+x),'Первое в порядке убывания — наибольшее.',2]
  ];
  else if(t===1)rows=[
   ['Числа '+n+', '+(n+x)+' и '+(n+y)+' расположили по возрастанию. Чему равна разность между наибольшим и средним?',S(V(n+x),V(n+y)),'Сначала определим два наибольших, затем вычтем.',3],
   ['После увеличения числа '+n+' на '+x+' полученное число сравнили с '+(n+y)+'. На сколько оно больше?',S(A(V(n),V(x)),V(n+y)),'Сначала прибавим, затем сравним значения.',2],
   ['Сколько целых чисел от '+low+' до '+high+' включительно?',A(S(V(high),V(low)),V(1)),'Для включённых границ к разности прибавляем 1.',2],
   ['Из трёх чисел '+n+', '+(n+x)+' и '+(n+y)+' выбери среднее по величине.',V(n+y),'Среднее расположено между наименьшим и наибольшим.',2],
   ['Между числами '+n+' и '+(n+x)+' выбрали натуральное число, которое на '+y+' больше первого. Найди расстояние до второго.',S(V(n+x),A(V(n),V(y))),'Вычтем найденное число из правой границы.',3]
  ];
  else rows=[
   ['Из чисел '+n+', '+(n+x)+' и '+(n+y)+' выбрали наибольшее и наименьшее. К разности прибавили среднее число. Найди результат.',A(S(V(n+x),V(n)),V(n+y)),'Упорядочим три числа, вычислим размах, добавим медиану.',4],
   ['К наименьшему из '+n+' и '+(n+x)+' прибавили '+y+', а из наибольшего вычли '+e+'. Найди разность полученных чисел по модулю.',Abs(A(V(n),V(y)),S(V(n+x),V(e))),'Сначала два изменения, затем расстояние между результатами.',4],
   ['Найди сумму всех натуральных чисел от '+n+' до '+(n+3)+' включительно.',A(V(n),V(n+1),V(n+2),V(n+3)),'Четыре последовательных натуральных числа, сложим их.',4],
   ['Числа '+n+', '+(n+y)+' и '+(n+x)+' расположили по убыванию. Найди сумму первого и третьего, затем вычти второе.',S(A(V(n+x),V(n)),V(n+y)),'Сначала упорядочим числа, затем применим выражение.',4],
   ['Число '+n+' увеличили на '+x+', затем уменьшили на '+y+'. На сколько результат больше исходного?',S(S(A(V(n),V(x)),V(y)),V(n)),'Найдём результат изменений и сравним с исходным.',4]
  ];
 }
 if(id==='powers'){
  const q=r(7,12),z=r(2,5),cube=z*z*z,sq=q*q;
  if(t===0)rows=[
   ['Вычисли '+q+'².',Pow(V(q),V(2)),'Квадрат равен произведению числа на себя.',1],
   ['Вычисли '+z+'³.',Pow(V(z),V(3)),'Куб — произведение трёх одинаковых множителей.',2],
   ['Чему равно 10²?',Pow(V(10),V(2)),'10 · 10 = 100.',1],
   ['Чему равно 2³?',Pow(V(2),V(3)),'2 · 2 · 2 = 8.',2],
   ['Найди квадрат числа '+(q+1)+'.',Pow(V(q+1),V(2)),'Возведём целое число в квадрат.',1]
  ];
  else if(t===1)rows=[
   ['Вычисли '+q+'² + '+z+'³.',A(Pow(V(q),V(2)),Pow(V(z),V(3))),'Сначала обе степени, затем сумму.',3],
   ['Вычисли ('+q+' + '+z+')².',Pow(A(V(q),V(z)),V(2)),'Сначала сложение в скобках, затем квадрат.',2],
   ['Вычисли '+q+'² − '+z+'².',S(Pow(V(q),V(2)),Pow(V(z),V(2))),'Два квадрата, затем разность.',3],
   ['Найди значение 3 · '+z+'² + '+q+'.',A(M(V(3),Pow(V(z),V(2))),V(q)),'Возводим в степень, умножаем и прибавляем.',3],
   ['Вычисли 2³ · '+q+'.',M(Pow(V(2),V(3)),V(q)),'Сначала 2³, затем умножение.',3]
  ];
  else rows=[
   ['Вычисли ('+q+' + '+z+')² − '+q+'².',S(Pow(A(V(q),V(z)),V(2)),Pow(V(q),V(2))),'Сначала сумма, затем два квадрата и разность.',4],
   ['Вычисли '+q+'² + '+z+'³ − '+z+'².',S(A(Pow(V(q),V(2)),Pow(V(z),V(3))),Pow(V(z),V(2))),'Три степени и два арифметических действия.',5],
   ['Сторона квадрата '+q+' см. Увеличили её на '+z+' см. На сколько см² увеличилась площадь?',S(Pow(A(V(q),V(z)),V(2)),Pow(V(q),V(2))),'Сравним площади двух квадратов.',4],
   ['Вычисли 2³ · '+z+'² + '+q+'².',A(M(Pow(V(2),V(3)),Pow(V(z),V(2))),Pow(V(q),V(2))),'Две степени, произведение и сложение.',5],
   ['Из числа ('+q+' + '+z+')² вычли '+z+'³ и прибавили '+z+'². Найди результат.',A(S(Pow(A(V(q),V(z)),V(2)),Pow(V(z),V(3))),Pow(V(z),V(2))),'Сначала скобки и степени, затем вычитание и сложение.',5]
  ];
 }
 if(id==='equations'){
  // §11 Vilenkin: equation equality, inverse operations, and substitution check.
  // The learner sees 15 separate families, all with a unique natural root.
  const root=r(14,56),mult=r(2,9),add=r(4,23),extra=r(3,12),
    rhsSum=root+add,rhsProduct=mult*root,more=r(2,13),take=r(3,15);
  if(t===0)rows=[
   ['Реши уравнение x + '+add+' = '+rhsSum+'.',
    S(V(rhsSum),V(add)),
    'Неизвестное слагаемое: x = '+rhsSum+' − '+add+' = '+root+'. Проверка: '+root+' + '+add+' = '+rhsSum+'.',1],
   ['Реши уравнение x − '+add+' = '+root+'.',
    A(V(root),V(add)),
    'Чтобы найти уменьшаемое, прибавим вычитаемое к разности: x = '+root+' + '+add+' = '+rhsSum+'. Проверка: '+rhsSum+' − '+add+' = '+root+'.',1],
   ['Реши уравнение '+mult+'x = '+rhsProduct+'.',
    D(V(rhsProduct),V(mult)),
    'Неизвестный множитель: x = '+rhsProduct+' : '+mult+' = '+root+'. Проверка: '+mult+' · '+root+' = '+rhsProduct+'.',1],
   ['Реши уравнение x : '+mult+' = '+root+'.',
    M(V(root),V(mult)),
    'Неизвестное делимое: x = '+root+' · '+mult+' = '+rhsProduct+'. Проверка: '+rhsProduct+' : '+mult+' = '+root+'.',1],
   ['Реши уравнение '+rhsSum+' − x = '+add+'.',
    S(V(rhsSum),V(add)),
    'Неизвестное вычитаемое: x = '+rhsSum+' − '+add+' = '+root+'. Проверка: '+rhsSum+' − '+root+' = '+add+'.',1]
  ];
  else if(t===1)rows=[
   ['Реши уравнение '+mult+'x + '+add+' = '+(rhsProduct+add)+'.',
    D(S(V(rhsProduct+add),V(add)),V(mult)),
    'Сначала найдём неизвестное слагаемое: '+mult+'x = '+(rhsProduct+add)+' − '+add+' = '+rhsProduct+'. Затем x = '+rhsProduct+' : '+mult+' = '+root+'. Проверка: '+mult+' · '+root+' + '+add+' = '+(rhsProduct+add)+'.',3],
   ['Реши уравнение '+mult+'(x + '+add+') = '+(mult*rhsSum)+'.',
    S(D(V(mult*rhsSum),V(mult)),V(add)),
    'Неизвестный множитель в скобках: x + '+add+' = '+(mult*rhsSum)+' : '+mult+' = '+rhsSum+'. Затем x = '+rhsSum+' − '+add+' = '+root+'. Проверка: '+mult+' · ('+root+' + '+add+') = '+(mult*rhsSum)+'.',3],
   ['Реши уравнение '+(rhsProduct+add)+' − '+mult+'x = '+add+'.',
    D(S(V(rhsProduct+add),V(add)),V(mult)),
    'Найдём неизвестное вычитаемое: '+mult+'x = '+(rhsProduct+add)+' − '+add+' = '+rhsProduct+'. Затем x = '+rhsProduct+' : '+mult+' = '+root+'. Проверка: '+(rhsProduct+add)+' − '+mult+' · '+root+' = '+add+'.',3],
   ['Реши уравнение x : '+mult+' + '+extra+' = '+(root+extra)+'.',
    M(S(V(root+extra),V(extra)),V(mult)),
    'Неизвестное слагаемое: x : '+mult+' = '+(root+extra)+' − '+extra+' = '+root+'. Делимое x = '+root+' · '+mult+' = '+rhsProduct+'. Проверка: '+rhsProduct+' : '+mult+' + '+extra+' = '+(root+extra)+'.',3],
   ['Реши уравнение x − '+mult+' · '+add+' = '+root+'.',
    A(V(root),M(V(mult),V(add))),
    'Сначала произведение: '+mult+' · '+add+' = '+(mult*add)+'. Чтобы найти уменьшаемое: x = '+root+' + '+(mult*add)+' = '+(root+mult*add)+'. Проверка: '+(root+mult*add)+' − '+mult+' · '+add+' = '+root+'.',3]
  ];
  else rows=[
   ['Реши уравнение '+mult+'(x + '+add+') − '+extra+' = '+(mult*rhsSum-extra)+'.',
    S(D(A(V(mult*rhsSum-extra),V(extra)),V(mult)),V(add)),
    'Сначала вернём вычитание: '+mult+'(x + '+add+') = '+(mult*rhsSum-extra)+' + '+extra+' = '+(mult*rhsSum)+'. Затем x + '+add+' = '+(mult*rhsSum)+' : '+mult+' = '+rhsSum+'. Поэтому x = '+rhsSum+' − '+add+' = '+root+'. Проверка: '+mult+' · ('+root+' + '+add+') − '+extra+' = '+(mult*rhsSum-extra)+'.',5],
   ['Реши уравнение '+mult+'(x − '+extra+') + '+add+' = '+(mult*(root-extra)+add)+'.',
    A(D(S(V(mult*(root-extra)+add),V(add)),V(mult)),V(extra)),
    'Сначала вычтем '+add+': '+mult+'(x − '+extra+') = '+(mult*(root-extra)+add)+' − '+add+' = '+(mult*(root-extra))+'. Разделим: x − '+extra+' = '+(mult*(root-extra))+' : '+mult+' = '+(root-extra)+'. Поэтому x = '+(root-extra)+' + '+extra+' = '+root+'. Проверка: '+mult+' · ('+root+' − '+extra+') + '+add+' = '+(mult*(root-extra)+add)+'.',5],
   ['К некоторому числу x прибавили '+add+', затем умножили полученную сумму на '+mult+' и вычли '+extra+'. Получили '+(mult*rhsSum-extra)+'. Найди исходное число x.',
    S(D(A(V(mult*rhsSum-extra),V(extra)),V(mult)),V(add)),
    'Составим уравнение: (x + '+add+') · '+mult+' − '+extra+' = '+(mult*rhsSum-extra)+'. Вернём '+extra+': '+(mult*rhsSum-extra)+' + '+extra+' = '+(mult*rhsSum)+'. Разделим на '+mult+': x + '+add+' = '+rhsSum+'. Вычтем '+add+': x = '+rhsSum+' − '+add+' = '+root+'. Проверка: ('+root+' + '+add+') · '+mult+' − '+extra+' = '+(mult*rhsSum-extra)+'.',5],
   ['Реши уравнение '+mult+'x + '+extra+'x = '+((mult+extra)*root)+'.',
    D(V((mult+extra)*root),A(V(mult),V(extra))),
    'Сначала объединим одинаковые слагаемые с x: ('+mult+' + '+extra+')x = '+((mult+extra)*root)+'. Сложим коэффициенты: '+(mult+extra)+'x = '+((mult+extra)*root)+'. Разделим на '+(mult+extra)+': x = '+((mult+extra)*root)+' : '+(mult+extra)+' = '+root+'. Проверка: '+mult+' · '+root+' + '+extra+' · '+root+' = '+((mult+extra)*root)+'.',4],
   ['Реши уравнение ('+mult+'x + '+add+') · '+extra+' = '+((rhsProduct+add)*extra)+'.',
    D(S(D(V((rhsProduct+add)*extra),V(extra)),V(add)),V(mult)),
    'Разделим обе части на '+extra+': '+mult+'x + '+add+' = '+((rhsProduct+add)*extra)+' : '+extra+' = '+(rhsProduct+add)+'. Вычтем '+add+': '+mult+'x = '+rhsProduct+'. Разделим на '+mult+': x = '+rhsProduct+' : '+mult+' = '+root+'. Проверка: ('+mult+' · '+root+' + '+add+') · '+extra+' = '+((rhsProduct+add)*extra)+'.',5]
  ];
 }
 if(id==='volume'){
  const x=r(3,10),y=r(3,9),z=r(2,7),volume=x*y*z,square=x*x*x;
  if(t===0)rows=[
   ['Коробка имеет размеры '+x+'×'+y+'×'+z+' см. Найди объём в см³.',M(M(V(x),V(y)),V(z)),'Объём = длина · ширина · высота.',2],
   ['Куб имеет ребро '+x+' см. Найди объём в см³.',Pow(V(x),V(3)),'Объём куба — куб ребра.',2],
   ['Найди объём коробки с основанием '+x+'×'+y+' см и высотой 1 см.',M(V(x),V(y)),'Объём равен площади основания, умноженной на высоту.',2],
   ['Сколько кубиков 1 см³ в коробке '+x+'×'+y+'×2 см?',M(M(V(x),V(y)),V(2)),'Укладываем единичные кубики слоями.',2],
   ['У коробки основание площадью '+(x*y)+' см² и высота '+z+' см. Найди объём.',M(V(x*y),V(z)),'Умножим площадь основания на высоту.',2]
  ];
  else if(t===1)rows=[
   ['Объём коробки '+volume+' см³, основание '+x+'×'+y+' см. Найди высоту.',D(V(volume),M(V(x),V(y))),'Разделим объём на площадь основания.',3],
   ['Две коробки размерами '+x+'×'+y+'×'+z+' и '+x+'×'+y+'×'+(z+1)+' см. На сколько отличаются объёмы?',S(M(M(V(x),V(y)),V(z+1)),M(M(V(x),V(y)),V(z))),'Найдём два объёма и разность.',3],
   ['Куб с ребром '+x+' см разрезали на кубики с ребром 1 см. Сколько кубиков?',Pow(V(x),V(3)),'По '+x+' кубиков по каждой из трёх осей.',3],
   ['Для коробки '+x+'×'+y+'×'+z+' см увеличили высоту на '+d+' см. Найди новый объём.',M(M(V(x),V(y)),A(V(z),V(d))),'Высота меняется, остальные измерения сохраняются.',3],
   ['Объём '+volume+' см³, длина '+x+' см и высота '+z+' см. Какова ширина?',D(V(volume),M(V(x),V(z))),'Делим объём на два известных измерения.',3]
  ];
  else rows=[
   ['Коробка '+x+'×'+y+'×'+z+' см стала на '+d+' см длиннее и на '+e+' см выше. На сколько вырос её объём?',S(M(M(A(V(x),V(d)),V(y)),A(V(z),V(e))),M(M(V(x),V(y)),V(z))),'Найдём объём после двух изменений и вычтем исходный.',5],
   ['Из коробки '+x+'×'+y+'×'+z+' см вырезали прямоугольный блок '+Math.min(x-1,d)+'×'+Math.min(y-1,e)+'×1 см. Найди оставшийся объём.',S(M(M(V(x),V(y)),V(z)),M(V(Math.min(x-1,d)),V(Math.min(y-1,e)))),'Вычтем объём вырезанного блока.',4],
   ['В два одинаковых ящика '+x+'×'+y+'×'+z+' см и три ящика '+x+'×'+y+'×2 см сколько всего см³ можно уложить?',A(M(V(2),M(M(V(x),V(y)),V(z))),M(V(3),M(M(V(x),V(y)),V(2)))),'Посчитаем объёмы двух групп ящиков и сложим.',5],
   ['Из объёма '+volume+' см³ коробки вычли объём слоя высотой 1 см с таким же основанием. Сколько осталось см³?',S(V(volume),M(V(x),V(y))),'Вычтем объём одного слоя из общего.',4],
   ['Измерения параллелепипеда '+x+'×'+y+'×'+z+' см. Увеличили все измерения на 1 см. Чему равна разность объёмов?',S(M(M(A(V(x),V(1)),A(V(y),V(1))),A(V(z),V(1))),V(volume)),'Вычислим объёмы двух разных параллелепипедов.',5]
  ];
 }
 if(id==='angles'){
  const a1=2*r(10,35),a2=2*r(5,25),a3=r(10,35),right=90,straight=180,full=360;
  if(t===0)rows=[
   ['Сколько градусов в прямом угле? '+g5Protractor(right),V(right),'Прямой угол равен 90°.',1],
   ['Сколько градусов в развёрнутом угле? '+g5Protractor(straight),V(straight),'Развёрнутый угол равен 180°.',1],
   ['Два прямых угла вместе образуют угол в сколько градусов?',M(V(2),V(right)),'Сложим два прямых угла.',2],
   ['Угол '+a1+'° увеличили на '+a2+'°. Какова новая градусная мера угла?',A(V(a1),V(a2)),'Сложим градусные меры.',1],
   ['Из прямого угла выделили '+a1+'°. Сколько градусов осталось?',S(V(right),V(a1)),'Вычтем выделенный угол из 90°.',2]
  ];
  else if(t===1)rows=[
   ['Из развёрнутого угла вырезали два угла '+a1+'° и '+a2+'°. Найди оставшийся угол.',S(S(V(straight),V(a1)),V(a2)),'Вычтем два известных угла из 180°.',3],
   ['В прямом угле отложили '+a1+'°. Остаток разделили на '+2+' равных угла. Найди каждый.',D(S(V(right),V(a1)),V(2)),'Остаток прямого угла разделим поровну.',3],
   ['На транспортире показан угол '+a1+'°. Найди градусную меру смежного с ним угла. '+g5Protractor(a1),S(V(straight),V(a1)),'Смежные углы в сумме составляют 180°. Вычитаем известный угол.',2],
   ['Вокруг точки отложили углы '+a1+'°, '+a2+'° и '+a3+'°. Каков четвёртый?',S(V(full),A(V(a1),V(a2),V(a3))),'Сумма углов вокруг точки равна 360°.',3],
   ['Угол '+a1+'° увеличили в два раза, затем уменьшили на '+a3+'°. Чему он стал равен?',S(M(V(2),V(a1)),V(a3)),'Удвоение, затем вычитание.',3]
  ];
  else rows=[
   ['Развёрнутый угол разделили на три части: '+a1+'°, '+a2+'° и x°. Найди x.',S(V(straight),A(V(a1),V(a2))),'Сложим две известные части и вычтем из 180°.',3],
   ['Вокруг точки есть углы '+a1+'°, '+a2+'°, '+a3+'° и оставшийся. Оставшийся угол уменьшили на '+d+'°. Сколько получилось?',S(S(V(full),A(V(a1),V(a2),V(a3))),V(d)),'Сначала вычислим остаток до 360°, затем уменьшение.',4],
   ['Два смежных угла вместе 180°. Один на '+a2+'° больше другого. Найди меньший угол.',D(S(V(straight),V(a2)),V(2)),'Вычтем разность и разделим пополам.',3],
   ['Прямой угол разделили на углы '+a3+'° и x°, а x увеличили на '+a2+'°. Найди новый x.',A(S(V(right),V(a3)),V(a2)),'Определим исходную часть и прибавим увеличение.',4],
   ['Сумма трёх углов равна 180°. Два угла по '+a3+'°, третий увеличили на '+d+'°. Сколько градусов в увеличенном угле?',A(S(V(straight),M(V(2),V(a3))),V(d)),'Вычтем два одинаковых угла, затем прибавим увеличение.',4]
  ];
 }
 if(id==='charts'){
  const v=[a,b,c,d],diagram=barGraph(v),total=a+b+c+d;
  if(t===0)rows=[
   ['По диаграмме найди число за понедельник. '+diagram,V(a),'Считаем высоту первого столбца.',1],
   ['По диаграмме найди число за вторник. '+diagram,V(b),'Считаем высоту второго столбца.',1],
   ['По диаграмме найди сумму данных за понедельник и вторник. '+diagram,A(V(a),V(b)),'Сложим значения двух столбцов.',2],
   ['По диаграмме найди разницу показателей понедельника и среды. '+diagram,Abs(V(a),V(c)),'Найдём больший и меньший показатели.',2],
   ['По диаграмме найди значение за четверг. '+diagram,V(d),'Читаем последний столбец.',1]
  ];
  else if(t===1)rows=[
   ['По диаграмме найди общий результат за понедельник, вторник и среду. '+diagram,A(V(a),V(b),V(c)),'Сложим три показателя.',3],
   ['По диаграмме сравни сумму Пн и Вт с суммой Ср и Чт. Найди положительную разницу. '+diagram,Abs(A(V(a),V(b)),A(V(c),V(d))),'Две суммы и их модуль разности.',3],
   ['За пять дней всего '+(total+e)+' единиц. На диаграмме первые четыре дня. Сколько приходится на пятый? '+diagram,S(V(total+e),A(V(a),V(b),V(c),V(d))),'Из общего результата вычтем четыре известных дня.',3],
   ['По диаграмме среду увеличили на '+e+' единиц. Найди сумму за среду и четверг после изменения. '+diagram,A(V(c),V(e),V(d)),'Сначала изменим среду, затем прибавим четверг.',3],
   ['По диаграмме найди, насколько сумма первого и четвёртого столбцов больше или меньше второго. '+diagram,Abs(A(V(a),V(d)),V(b)),'Сложим два значения и сравним со вторым.',3]
  ];
  else rows=[
   ['По диаграмме все четыре дня дают '+total+' единиц. Если значения вторника и среды удвоить, сколько получится всего? '+diagram,A(V(a),M(V(2),V(b)),M(V(2),V(c)),V(d)),'Удвоим два дня и сложим четыре значения.',5],
   ['По диаграмме после прибавления '+e+' в Пн и вычитания '+Math.min(d,c-1)+' в Ср найди новую сумму за все четыре дня. '+diagram,A(V(a),V(e),V(b),S(V(c),V(Math.min(d,c-1))),V(d)),'Изменим два показателя, затем вычислим сумму.',5],
   ['По диаграмме вычисли разницу между суммой Пн, Ср, Чт и двойным значением Вт. '+diagram,Abs(A(V(a),V(c),V(d)),M(V(2),V(b))),'Сначала сумма трёх дней и двойной второй день, затем разность.',5],
   ['По диаграмме общий результат за пять дней '+(total+b)+'. Пятый день не показан. Его значение удвоили. Найди сумму удвоенного пятого дня и первого дня. '+diagram,A(M(V(2),S(V(total+b),V(total))),V(a)),'Вычислим пятый день обратным действием, удвоим и прибавим Пн.',5],
   ['По диаграмме показатели вторника и четверга объединили и уменьшили на '+Math.min(e,b+d-1)+'. Сколько единиц получилось? '+diagram,S(A(V(b),V(d)),V(Math.min(e,b+d-1))),'Сложим два дня и вычтем расход.',3]
  ];
 }
 if(id==='units'){
  const km=r(2,7),h=r(2,6),kg=r(2,8);
  if(t===0)rows=[
   ['Сколько сантиметров в '+a+' м?',M(V(a),V(100)),'1 метр = 100 сантиметров.',1],
   ['Сколько граммов в '+kg+' кг?',M(V(kg),V(1000)),'1 килограмм = 1000 граммов.',1],
   ['Сколько минут в '+h+' часах?',M(V(h),V(60)),'1 час = 60 минут.',1],
   ['Сколько метров в '+km+' км?',M(V(km),V(1000)),'1 километр = 1000 метров.',1],
   ['Сколько миллиметров в '+b+' см?',M(V(b),V(10)),'1 сантиметр = 10 миллиметров.',1]
  ];
  else if(t===1)rows=[
   [''+a+' м '+b+' см переведи полностью в сантиметры.',A(M(V(a),V(100)),V(b)),'Метры умножим на 100 и прибавим сантиметры.',2],
   [''+kg+' кг '+b+' г переведи полностью в граммы.',A(M(V(kg),V(1000)),V(b)),'Килограммы умножим на 1000 и прибавим граммы.',2],
   ['Сколько минут в '+h+' ч '+b+' мин?',A(M(V(h),V(60)),V(b)),'Часы переведём в минуты и прибавим остаток.',2],
   ['Сколько сантиметров в '+a+' м '+b+' дм?',A(M(V(a),V(100)),M(V(b),V(10))),'Сложим сантиметры из метров и дециметров.',3],
   ['Из '+km+' км вычли '+a+' м. Сколько метров осталось?',S(M(V(km),V(1000)),V(a)),'Сначала переведём километры в метры.',2]
  ];
  else rows=[
   ['К '+a+' м '+b+' см добавили '+c+' м '+d+' см. Сколько всего сантиметров?',A(M(A(V(a),V(c)),V(100)),V(b),V(d)),'Переведём метры в сантиметры и сложим остатки.',4],
   ['Из '+kg+' кг муки израсходовали '+a+' г и '+b+' г. Сколько граммов осталось?',S(S(M(V(kg),V(1000)),V(a)),V(b)),'Переведём килограммы в граммы и вычтем два расхода.',4],
   [''+h+' ч '+a+' мин уменьшили на '+b+' мин, затем прибавили '+c+' мин. Сколько получилось минут?',A(S(A(M(V(h),V(60)),V(a)),V(b)),V(c)),'Приводим к минутам, затем два изменения.',4],
   ['Два отрезка '+a+' м '+b+' см и '+c+' м '+d+' см. На сколько сантиметров они отличаются?',Abs(A(M(V(a),V(100)),V(b)),A(M(V(c),V(100)),V(d))),'Переведём обе длины в сантиметры и найдём разность.',5],
   ['От '+km+' км отсчитали '+a+' м, затем ещё '+(b*10)+' м. Сколько метров осталось?',S(S(M(V(km),V(1000)),V(a)),M(V(b),V(10))),'Перевод в метры и два последовательных вычитания.',4]
  ];
 }
 if(id==='word'){
  const price=r(12,29),pieces=r(3,12),money=price*pieces,ship=r(4,10);
  if(t===0)rows=[
   ['Один карандаш стоит '+price+' руб. Сколько стоят '+pieces+' карандашей?',M(V(price),V(pieces)),'Цена · количество = стоимость.',2],
   ['В коробке '+a+' яблок, во второй '+b+'. Сколько всего яблок?',A(V(a),V(b)),'Сложим два количества.',1],
   ['Из '+(a+b)+' тетрадей раздали '+a+'. Сколько осталось?',S(V(a+b),V(a)),'Разность количества до и после раздачи.',1],
   ['В '+pieces+' равных коробках всего '+money+' предметов. Сколько в каждой?',D(V(money),V(pieces)),'Разделим общее количество на число коробок.',2],
   ['Велосипедист проехал по '+a+' км за два дня. Сколько километров проехал?',M(V(a),V(2)),'Два одинаковых пути складываем.',2]
  ];
  else if(t===1)rows=[
   ['Купили '+pieces+' тетрадей по '+price+' руб. и ручку за '+b+' руб. Сколько заплатили?',A(M(V(pieces),V(price)),V(b)),'Сначала стоимость тетрадей, затем прибавляем ручку.',3],
   ['На склад привезли '+a+' коробок по '+pieces+' предметов, а '+b+' предметов забрали. Сколько осталось?',S(M(V(a),V(pieces)),V(b)),'Умножаем количество коробок и вычитаем расход.',3],
   ['Шли '+a+' км до обеда и '+b+' км после обеда. Затем вернулись на '+c+' км. На сколько километров удалились от начала?',S(A(V(a),V(b)),V(c)),'Сложим путь вперёд и вычтем возвращённое расстояние.',3],
   ['Две семьи собрали '+a+' и '+b+' кг ягод. Разложили всё в пакеты по 1 кг. Сколько пакетов?',A(V(a),V(b)),'Сложим два сбора, каждый килограмм — один пакет.',2],
   ['Из '+(money+b)+' руб. потратили '+money+' руб. на '+pieces+' одинаковых карандашей. Сколько денег осталось?',S(V(money+b),M(V(price),V(pieces))),'Найдём стоимость и вычтем из бюджета.',3]
  ];
  else rows=[
   ['Две группы купили '+a+' и '+b+' билетов по '+price+' руб., затем вернули '+Math.min(c,a+b-1)+' билетов. Сколько рублей заплатили за оставшиеся?',M(S(A(V(a),V(b)),V(Math.min(c,a+b-1))),V(price)),'Сначала количество билетов за вычетом возврата, затем стоимость.',4],
   ['В '+a+' коробках по '+pieces+' предметов. После продажи '+b+' предметов пришло ещё '+ship+' коробок по '+c+' предметов. Сколько товаров стало?',A(S(M(V(a),V(pieces)),V(b)),M(V(ship),V(c))),'Первая партия, расход, затем новая партия.',5],
   ['Путешественники шли '+a+' км утром, '+b+' км днём, и ещё '+c+' км вечером. Осталось пройти вдвое больше, чем прошли утром. Какова длина всего маршрута?',A(V(a),V(b),V(c),M(V(2),V(a))),'Сумма пройденного и остатка.',4],
   ['На покупку '+pieces+' тетрадей по '+price+' руб. и '+ship+' карандашей по '+c+' руб. дали '+(money+ship*c+b)+' руб. Сколько сдачи?',S(V(money+ship*c+b),A(M(V(pieces),V(price)),M(V(ship),V(c)))),'Суммируем две стоимости, затем вычтем из внесённых денег.',5],
   ['Три команды собрали '+a+', '+b+' и '+c+' кг вторсырья. Из общего сбора вывезли '+d+' кг. Сколько кг осталось, если затем привезли ещё '+e+' кг?',A(S(A(V(a),V(b),V(c)),V(d)),V(e)),'Сложим три сбора, вычтем вывоз и добавим поступление.',5]
  ];
 }
 if(id==='frac_shapes'){
  // Vilenkin, Grade 5, Part 2, §25: circle/circumference/sphere/cylinder.
  // Filled-square fraction questions belong to §26, not §25.
  const radius=r(4,10+t*3),other=r(3,9+t*3),increase=r(2,5+t*2),height=r(5,12+t*3),count=r(2,7+t*2);
  const order=['ring','disk','sphere','cylinder'];
  for(let i=order.length-1;i>0;i--){const j=r(0,i);[order[i],order[j]]=[order[j],order[i]];}
  const gallery=shapeGallery(order),find=kind=>V(order.indexOf(kind)+1);
  const features=['chord','diameter','arc','sector'];
  for(let i=features.length-1;i>0;i--){const j=r(0,i);[features[i],features[j]]=[features[j],features[i]];}
  const featureGallery=circleFeatureGallery(features),featureNumber=kind=>V(features.indexOf(kind)+1);
  if(t===0)rows=[
   ['Под каким номером изображена окружность — только замкнутая линия, ограничивающая круг? '+gallery,find('ring'),'Окружность — линия, ограничивающая круг; внутренняя область не закрашена.',1],
   ['Под каким номером изображён круг — плоская фигура вместе с внутренней областью? '+gallery,find('disk'),'Круг включает окружность и все точки внутри неё.',1],
   ['Под каким номером изображён шар — объёмное круглое тело? '+gallery,find('sphere'),'Шар — объёмное тело, а круг — плоская фигура.',1],
   ['Под каким номером изображён цилиндр — тело с двумя круглыми основаниями? '+gallery,find('cylinder'),'Цилиндр имеет два круглых основания.',1],
   ['Радиус окружности '+radius+' см. Найди диаметр в сантиметрах. '+radiusDiagram(),M(V(2),V(radius)),'Диаметр состоит из двух радиусов: d = 2r.',2]
  ];
  else if(t===1)rows=[
   ['Диаметр окружности '+(2*radius)+' см. На рисунке OA — радиус. Найди длину отрезка OA. '+radiusDiagram(),D(V(2*radius),V(2)),'Радиус равен половине диаметра.',2],
   ['Диаметр круга '+(2*radius)+' см. Радиус увеличили на '+increase+' см. Каким стал диаметр?',M(V(2),A(D(V(2*radius),V(2)),V(increase))),'Сначала найдём радиус из диаметра, затем увеличим его и удвоим.',3],
   ['Диаметры двух кругов '+(2*radius)+' см и '+(2*other)+' см. На сколько сантиметров различаются их радиусы?',Abs(D(V(2*radius),V(2)),D(V(2*other),V(2))),'Радиусы равны половинам диаметров; сравним результаты.',3],
   ['На каком рисунке цветом выделен сектор круга — область, ограниченная двумя радиусами и дугой? '+featureGallery,featureNumber('sector'),'Сектор — часть круга между двумя радиусами и соединяющей их дугой.',2],
   ['На каком рисунке цветом выделена дуга окружности — часть линии между двумя её точками? '+featureGallery,featureNumber('arc'),'Дуга — часть окружности, а сектор — часть круга.',2]
  ];
  else rows=[
   ['Радиус первого круга '+radius+' см, радиус второго на '+increase+' см больше. Найди сумму их диаметров.',A(M(V(2),V(radius)),M(V(2),A(V(radius),V(increase)))),'Найдём радиус второго круга, вычислим оба диаметра и сложим.',4],
   ['У трёх окружностей радиусы '+radius+', '+other+' и '+increase+' см. Найди сумму длин их диаметров в сантиметрах.',A(M(V(2),V(radius)),M(V(2),V(other)),M(V(2),V(increase))),'Каждый диаметр — два радиуса. Складываем все три диаметра.',4],
   ['Четыре одинаковых цилиндра высотой '+height+' см поставили друг на друга. Сверху поставили пятый цилиндр высотой на '+increase+' см больше остальных. Какова общая высота башни?',A(M(V(4),V(height)),A(V(height),V(increase))),'Четыре высоты равны 4h, пятая — h + прибавка. Складываем.',4],
   ['У двух окружностей радиусы '+radius+' см и '+other+' см. Радиус первой увеличили на '+increase+' см, второй — на '+count+' см. На сколько увеличилась сумма их диаметров?',S(A(M(V(2),A(V(radius),V(increase))),M(V(2),A(V(other),V(count)))),A(M(V(2),V(radius)),M(V(2),V(other)))),'Вычисляем обе новые длины диаметров, вычитаем исходную сумму.',4],
   ['Радиусы трёх шаров равны '+radius+' см, '+(radius+increase)+' см и '+(radius+2*increase)+' см. Найди сумму их диаметров.',A(M(V(2),V(radius)),M(V(2),A(V(radius),V(increase))),M(V(2),A(V(radius),M(V(2),V(increase))))),'Для каждого шара найдём диаметр, затем сложим три результата.',5]
  ];
 }
 if(!rows||rows.length!==5)throw Error('v126 missing topic families '+id);
 const [text,plan,explain,steps]=rows[p];
 return {id,t,p,text,plan,explain,steps};
}
function build(id){
 const t=level(),p=family(),data=spec(id,t,p),value=evalPlan(data.plan);
 if(!Number.isSafeInteger(value)||value<0)throw Error('v126 generated invalid answer '+id+'/'+t+'/'+p+' '+value);
 const q=g5q(data.text,g5nums(value,[value+1,value+2,Math.max(0,value-1)]),String(value),data.explain+' Ответ: '+value+'.','v126_'+id+'_L'+t+'_F'+p);
 const correct=q.choices.filter(x=>String(x.key)===String(q.correct));
 if(correct.length!==1||new Set(q.choices.map(x=>String(x.label))).size!==q.choices.length)throw Error('v126 duplicate answer choices '+id+'/'+t+'/'+p);
 return {text:q.text,ans:String(q.correct),choices:q.choices,ex:q.explain,
  sourceTopicId:id,templateId:q.templateId,sig:['g5','v126',id,t,p,q.text,value].join(':'),
  correctLabel:String(correct[0].label),correctText:String(correct[0].label),
  mk126:{id,t,p,steps:data.steps,plan:data.plan,expected:value}};
}
makeG5Question=function(id){return covered.has(id)?build(id):previous.apply(this,arguments)};
const priorLesson=g5Lesson;
g5Lesson=function(id){return id==='equations'?'Уравнение — равенство с неизвестным числом, которое обозначают буквой x. Корень уравнения — значение x, при котором левая и правая части равны. Решать уравнение помогают обратные действия: x + a = b ⇒ x = b − a; x − a = b ⇒ x = b + a; a − x = b ⇒ x = a − b; ax = b ⇒ x = b : a; x : a = b ⇒ x = a · b. Если несколько действий, восстанавливай неизвестное с последнего действия и записывай каждое промежуточное равенство. Например, 3(x + 4) = 30 ⇒ x + 4 = 10 ⇒ x = 6. Обязательная проверка: 3 · (6 + 4) = 30, обе стороны равны. Всегда проверяй корень подстановкой в исходное уравнение.':priorLesson(id)};
window.mkG5V126Tiered=TOPICS.slice();
})();
