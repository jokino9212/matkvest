/* Grade 5 v123: increasingly complex, subject-specific arithmetic, tables and charts. */
(function(){
'use strict';
if(typeof makeG5Question!=='function'||typeof g5q!=='function'||typeof g5nums!=='function')throw Error('v123 dependencies missing');
const IDS=['natural_add','natural_subtract','natural_multiply','natural_divide','numeric_literal_expressions','number_tables','column_charts','formulas_g5'];
const roster=new Set(IDS),previous=makeG5Question;
const level=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0));
const slot=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const V=n=>['v',n],A=(...x)=>['add',...x],S=(a,b)=>['sub',a,b],M=(a,b)=>['mul',a,b],D=(a,b)=>['div',a,b],AB=(a,b)=>['abs',S(a,b)];
function oracle(node){
 if(!Array.isArray(node))throw Error('v123 invalid operation plan');
 const [op,...x]=node;
 if(op==='v')return x[0];
 if(op==='add')return x.reduce((a,v)=>a+oracle(v),0);
 if(op==='sub')return oracle(x[0])-oracle(x[1]);
 if(op==='mul')return oracle(x[0])*oracle(x[1]);
 if(op==='div'){const a=oracle(x[0]),b=oracle(x[1]);if(b===0||a%b!==0)throw Error('v123 noninteger division');return a/b}
 if(op==='abs')return Math.abs(oracle(x[0]));
 throw Error('v123 unknown operation '+op);
}
function table(a,b,c,d,extra){
 const row=(title,values)=>'<tr><th scope="row">'+title+'</th>'+values.map(n=>'<td>'+n+'</td>').join('')+'</tr>';
 return '<div class="mk-g5-v123-table" style="width:100%;overflow-x:auto"><table style="width:100%;border-collapse:collapse;text-align:center"><caption style="text-align:left;padding:4px 0">Продано изданий, шт.</caption><thead><tr><th scope="col">Издание</th><th scope="col">Пн</th><th scope="col">Вт</th><th scope="col">Ср</th><th scope="col">Чт</th></tr></thead><tbody>'+row('Книги',[a,b,c,d])+(extra?row('Журналы',extra):'')+'</tbody></table></div>';
}
function bars(primary,secondary=null){
 const days=['Пн','Вт','Ср','Чт'],cols=4,series=[{name:'Тетради',key:'books',values:primary,color:'#3678bf'}];
 if(secondary)series.push({name:'Альбомы',key:'albums',values:secondary,color:'#cc7a33'});
 if(series.some(row=>row.values.length!==cols||row.values.some(v=>!Number.isInteger(v)||v<=0||v>100||v%10)))throw Error('Invalid meaningful chart unit or range');
 const upper=100,left=66,baseline=248,height=190,pxPerValue=height/upper;
 let grid='',barsSvg='',legend='';
 for(let value=0;value<=upper;value+=10){
  const y=(baseline-pxPerValue*value).toFixed(2),major=value%20===0;
  grid+='<line class="mk-g5-chart-grid" data-unit="'+value+'" x1="'+left+'" y1="'+y+'" x2="585" y2="'+y+'" stroke="#a8bed4" stroke-opacity="'+(major?'0.54':'0.22')+'" stroke-width="'+(major?'1.2':'0.8')+'"/>';
  if(major)grid+='<text class="mk-g5-chart-tick-label" data-unit="'+value+'" x="'+(left-13)+'" y="'+(Number(y)+5).toFixed(2)+'" text-anchor="end" font-size="16" fill="currentColor">'+value+'</text>';
 }
 days.forEach((day,i)=>{
  const cx=125+i*130;
  series.forEach((row,j)=>{
   const value=row.values[i],y=baseline-pxPerValue*value,h=pxPerValue*value;
   const width=secondary?34:60,x=secondary?cx-36+j*41:cx-30;
   barsSvg+='<rect class="mk-g5-chart-bar" data-day="'+day+'" data-series="'+row.key+'" data-value="'+value+'" x="'+x+'" y="'+y.toFixed(2)+'" width="'+width+'" height="'+h.toFixed(2)+'" rx="3" fill="'+row.color+'" aria-label="'+row.name+' '+day+', '+value+' штук"><title>'+row.name+', '+day+': '+value+' шт.</title></rect>';
  });
  barsSvg+='<text class="mk-g5-chart-day" x="'+cx+'" y="276" text-anchor="middle" font-size="21" fill="currentColor">'+day+'</text>';
 });
 if(secondary){
  legend=series.map((row,j)=>{
   const x=130+j*205;
   return '<rect x="'+x+'" y="315" width="18" height="14" rx="2" fill="'+row.color+'"/><text x="'+(x+25)+'" y="328" font-size="16" fill="currentColor">'+row.name+'</text>';
  }).join('');
 }
 const html='<text x="19" y="26" font-size="17" fill="currentColor">Количество, шт.</text>'+
  '<line x1="'+left+'" y1="50" x2="'+left+'" y2="'+baseline+'" stroke="#56728c" stroke-width="2"/>'+
  grid+barsSvg+
  '<line x1="'+left+'" y1="'+baseline+'" x2="590" y2="'+baseline+'" stroke="#56728c" stroke-width="2"/>'+
  legend;
 return '<div class="mk-g5-chart-figure" style="width:100%;max-width:740px;overflow:hidden;margin:10px auto"><svg role="img" aria-label="Столбчатая диаграмма с равномерной шкалой количества от 0 до 100 штук, деления по 10 штук, дни Пн, Вт, Ср, Чт'+(secondary?'; синие столбцы — тетради, оранжевые — альбомы':'')+'" data-chart-max="100" data-chart-baseline="'+baseline+'" viewBox="0 0 620 '+(secondary?358:300)+'" width="100%" style="height:auto;display:block">'+html+'</svg></div>';
}
function specification(id,t,p){
 const a=ri(20,70+t*18),b=ri(6,24+t*8),c=ri(3,15+t*5),d=ri(2,9+t*3),e=ri(2,8+t*3);
 const total=a+b+c+d,tab=table(a,b,c,d);
 let data;
 if(id==='natural_add'){
  // §8 Виленкин: сложение, перестановка слагаемых, удобное сочетание
  // и решение задач на сумму. Три уровня — 15 разных когнитивных семей.
  const u=ri(11,89),v=ri(12,83),w=ri(10,79),z=ri(9,68),
    half=ri(12,88),complement=100-half,extra=ri(8,67),
    x=ri(23,93),y=ri(15,78),otherComplement=100-y,
    sumBase=ri(120,490),shift=ri(21,77);
  if(t===0)data=[
   ['Найди сумму натуральных чисел '+a+' и '+b+'.',A(V(a),V(b)),
    'Слагаемые: '+a+' и '+b+'. Складываем: '+a+' + '+b+' = '+(a+b)+'.',1],
   ['В равенстве '+a+' + '+b+' = □ + '+a+' найди число вместо □.',V(b),
    'От перестановки слагаемых сумма не меняется: '+a+' + '+b+' = '+b+' + '+a+'. Вместо □ ставим '+b+'.',1],
   ['Вычисли, используя свойство нуля: '+a+' + 0 + '+b+'.',A(V(a),V(b)),
    'Прибавление нуля не изменяет число: '+a+' + 0 = '+a+'. Поэтому '+a+' + '+b+' = '+(a+b)+'.',2],
   ['Утром привезли '+a+' книг, днём — '+b+' книг. Сколько книг привезли за день?',A(V(a),V(b)),
    'Ищем общее количество: '+a+' + '+b+' = '+(a+b)+' книг.',2],
   ['Вычисли удобным способом: '+extra+' + '+half+' + '+complement+'.',A(V(extra),V(half),V(complement)),
    'По сочетательному свойству сгруппируем последние слагаемые: '+extra+' + ('+half+' + '+complement+') = '+extra+' + 100 = '+(extra+100)+'.',2]
  ];
  else if(t===1)data=[
   ['Вычисли удобным способом: '+half+' + '+extra+' + '+complement+'.',A(V(half),V(extra),V(complement)),
    'По переместительному и сочетательному свойствам: ('+half+' + '+complement+') + '+extra+' = 100 + '+extra+' = '+(100+extra)+'.',3],
   ['Найди сумму '+a+' + '+half+' + '+b+' + '+complement+' удобной группировкой.',A(V(a),V(half),V(b),V(complement)),
    'Переставим и сгруппируем слагаемые: ('+half+' + '+complement+') + ('+a+' + '+b+') = 100 + '+(a+b)+' = '+(100+a+b)+'.',4],
   ['В сумме '+a+' + '+y+' + '+w+' + '+otherComplement+' сначала сложи пару слагаемых до 100. Найди итог.',A(V(a),V(y),V(w),V(otherComplement)),
    'Сочетательное свойство: ('+y+' + '+otherComplement+') + ('+a+' + '+w+') = 100 + '+(a+w)+' = '+(100+a+w)+'.',4],
   ['В равенстве x + '+a+' + '+b+' = '+(sumBase+a+b)+' найди неизвестное слагаемое x.',S(V(sumBase+a+b),A(V(a),V(b))),
    'Сначала сложим известные слагаемые: '+a+' + '+b+' = '+(a+b)+'. Затем x = '+(sumBase+a+b)+' − '+(a+b)+' = '+sumBase+'.',3],
   ['В понедельник получили '+a+' тетрадей, во вторник '+b+', в среду '+c+', в четверг '+d+'. Сколько тетрадей получили за четыре дня?',A(V(a),V(b),V(c),V(d)),
    'Удобно группировать по два дня: ('+a+' + '+b+') + ('+c+' + '+d+') = '+(a+b)+' + '+(c+d)+' = '+(a+b+c+d)+' тетрадей.',3]
  ];
  else{
   const aa=ri(125,389),bb=500-aa,cc=ri(145,365),dd=500-cc,
    value=ri(17,89),goal=ri(430,790),
    l1=ri(21,79),l2=100-l1,l3=ri(24,76),l4=100-l3,
    q1=ri(22,78),q2=100-q1,q3=ri(11,89),q4=100-q3,
    bins=ri(55,130),box2=ri(40,100),box3=ri(35,95);
   data=[
    ['Вычисли, применяя свойства сложения: '+aa+' + '+cc+' + '+bb+' + '+dd+' + '+value+'.',
     A(V(aa),V(cc),V(bb),V(dd),V(value)),
     'Переставляем и группируем: ('+aa+' + '+bb+') + ('+cc+' + '+dd+') + '+value+' = 500 + 500 + '+value+' = '+(1000+value)+'.',5],
    ['Используя сочетательное свойство, вычисли '+l1+' + '+l3+' + '+l2+' + '+l4+' + '+a+' + '+b+'.',
     A(V(l1),V(l3),V(l2),V(l4),V(a),V(b)),
     'Образуем круглые сотни: ('+l1+' + '+l2+') + ('+l3+' + '+l4+') + ('+a+' + '+b+') = 100 + 100 + '+(a+b)+' = '+(200+a+b)+'.',5],
    ['Найди неизвестное слагаемое x в равенстве x + '+q1+' + '+q3+' + '+q2+' + '+q4+' = '+(goal+200)+'.',
     S(V(goal+200),A(V(q1),V(q3),V(q2),V(q4))),
     'Переставляем известные слагаемые: ('+q1+' + '+q2+') + ('+q3+' + '+q4+') = 100 + 100 = 200. Поэтому x = '+(goal+200)+' − 200 = '+goal+'.',5],
    ['Для трёх классов приобрели две партии тетрадей: в первой '+bins+', '+box2+' и '+box3+' штук, во второй '+a+', '+b+' и '+c+'. Сколько тетрадей купили всего?',
     A(A(V(bins),V(box2),V(box3)),A(V(a),V(b),V(c))),
     'Первая партия: '+bins+' + '+box2+' + '+box3+' = '+(bins+box2+box3)+'. Вторая: '+a+' + '+b+' + '+c+' = '+(a+b+c)+'. Общая сумма: '+(bins+box2+box3)+' + '+(a+b+c)+' = '+(bins+box2+box3+a+b+c)+' тетрадей.',5],
    ['Вычисли сумму семи слагаемых, группируя удобные пары: '+q1+' + '+a+' + '+q3+' + '+q2+' + '+b+' + '+q4+' + '+shift+'.',
     A(V(q1),V(a),V(q3),V(q2),V(b),V(q4),V(shift)),
     'Переставим и сгруппируем: ('+q1+' + '+q2+') + ('+q3+' + '+q4+') + ('+a+' + '+b+' + '+shift+') = 100 + 100 + '+(a+b+shift)+' = '+(200+a+b+shift)+'.',6]
   ];
  }
 }
 if(id==='natural_subtract'){
  // §9: subtract a sum, subtract from a sum, invert a difference, regroup.
  const x=ri(155,380),y=ri(31,96),z=ri(13,67),k=ri(8,29),m=ri(7,21),
    u=ri(17,83),v=100-u,uu=ri(21,79),vv=100-uu,
    big=x+y+z+k+m;
  if(t===0)data=[
   ['Найди разность: '+(x+y)+' − '+y+'.',S(V(x+y),V(y)),
    'Уменьшаемое '+(x+y)+', вычитаемое '+y+'. Получаем '+(x+y)+' − '+y+' = '+x+'.',1],
   ['В равенстве '+(x+y)+' − □ = '+x+' найди неизвестное вычитаемое.',S(V(x+y),V(x)),
    'Чтобы найти вычитаемое, из уменьшаемого вычтем разность: '+(x+y)+' − '+x+' = '+y+'.',2],
   ['Вычисли, вычитая сумму: '+big+' − ('+y+' + '+z+').',S(V(big),A(V(y),V(z))),
    'Сумма в скобках: '+y+' + '+z+' = '+(y+z)+'. Затем '+big+' − '+(y+z)+' = '+(big-y-z)+'.',2],
   ['Вычисли: '+big+' − '+y+' − '+z+'. Как можно заменить два последовательных вычитания?',S(S(V(big),V(y)),V(z)),
    'Из числа можно вычесть сразу сумму: '+big+' − ('+y+' + '+z+') = '+big+' − '+(y+z)+' = '+(big-y-z)+'.',2],
   ['В коробке было '+big+' листов. Утром забрали '+y+', вечером '+z+'. Сколько листов осталось?',S(V(big),A(V(y),V(z))),
    'Всего забрали '+y+' + '+z+' = '+(y+z)+' листов. Осталось '+big+' − '+(y+z)+' = '+(big-y-z)+'.',2]
  ];
  else if(t===1)data=[
   ['Вычисли удобным способом: ('+x+' + '+y+') − '+z+'. Вычти '+z+' из первого слагаемого.',A(S(V(x),V(z)),V(y)),
    'Из суммы можно вычесть число из первого слагаемого, если его хватает: ('+x+' − '+z+') + '+y+' = '+(x-z)+' + '+y+' = '+(x+y-z)+'.',3],
   ['Вычисли удобным способом: ('+x+' + '+y+') − '+k+'. Вычти '+k+' из второго слагаемого.',A(V(x),S(V(y),V(k))),
    'Так как '+y+' ≥ '+k+', вычтем число из второго слагаемого: '+x+' + ('+y+' − '+k+') = '+x+' + '+(y-k)+' = '+(x+y-k)+'.',3],
   ['Вычисли: '+big+' − ('+u+' + '+v+' + '+k+').',S(V(big),A(V(u),V(v),V(k))),
    'Сгруппируем вычитаемые: ('+u+' + '+v+') + '+k+' = 100 + '+k+' = '+(100+k)+'. Теперь '+big+' − '+(100+k)+' = '+(big-100-k)+'.',4],
   ['Из неизвестного числа x последовательно вычли '+y+' и '+z+' и получили '+x+'. Найди x.',A(V(x),V(y),V(z)),
    'Чтобы восстановить уменьшаемое, прибавим оба вычитаемых: x = '+x+' + ('+y+' + '+z+') = '+(x+y+z)+'.',3],
   ['В первом ящике было '+(x+y)+' яблок, во втором '+(x+z)+'. Из первого взяли '+y+', из второго '+k+'. На сколько отличаются остатки?',AB(S(V(x+y),V(y)),S(V(x+z),V(k))),
    'Первый остаток: '+(x+y)+' − '+y+' = '+x+'. Второй: '+(x+z)+' − '+k+' = '+(x+z-k)+'. Их положительная разность '+(z-k)+'.',4]
  ];
  else{
   const current=ri(480,790),more=ri(19,79),less=ri(10,75),
     collected=ri(230,420),first=ri(45,100),second=ri(32,87),third=ri(11,45),
     left1=ri(110,280),left2=ri(100,265),spent1=ri(22,73),spent2=ri(18,68),
     a1=ri(130,380),a2=ri(120,330),r1=ri(22,89),r2=ri(18,72);
   data=[
    ['Вычисли удобной группировкой: '+current+' − ('+u+' + '+v+') − ('+uu+' + '+vv+').',
     S(S(V(current),A(V(u),V(v))),A(V(uu),V(vv))),
     'Суммы в скобках: '+u+' + '+v+' = 100 и '+uu+' + '+vv+' = 100. Значит '+current+' − 100 − 100 = '+(current-200)+'.',5],
    ['Вычисли разность суммы и суммы: ('+a1+' + '+a2+' + '+more+') − ('+r1+' + '+r2+'). Вычти '+r1+' из первого слагаемого, а '+r2+' — из второго.',
     A(S(V(a1),V(r1)),S(V(a2),V(r2)),V(more)),
     'Группируем удобным способом: ('+a1+' − '+r1+') + ('+a2+' − '+r2+') + '+more+' = '+(a1-r1)+' + '+(a2-r2)+' + '+more+' = '+(a1+a2+more-r1-r2)+'.',5],
    ['Найди неизвестное уменьшаемое x: x − ('+u+' + '+v+') − ('+uu+' + '+vv+') = '+collected+'.',
     A(V(collected),V(u),V(v),V(uu),V(vv)),
     'Две вычитаемые суммы дают по 100: x − 100 − 100 = '+collected+'. Значит x = '+collected+' + 200 = '+(collected+200)+'.',5],
    ['В библиотеке было '+(collected+first+second+third)+' книг. В первый день выдали '+first+', во второй '+second+', в третий '+third+'. Затем вернули '+less+' книг. Сколько книг стало?',
     A(S(V(collected+first+second+third),A(V(first),V(second),V(third))),V(less)),
     'Всего выдали '+first+' + '+second+' + '+third+' = '+(first+second+third)+'. Осталось '+(collected+first+second+third)+' − '+(first+second+third)+' = '+collected+'. После возврата: '+collected+' + '+less+' = '+(collected+less)+'.',5],
    ['В двух хранилищах было '+left1+' и '+left2+' коробок. Из первого забрали '+spent1+', из второго '+spent2+'. На сколько отличается общий остаток от исходного общего количества?',
     S(A(V(left1),V(left2)),A(S(V(left1),V(spent1)),S(V(left2),V(spent2)))),
     'Первоначально '+left1+' + '+left2+' = '+(left1+left2)+'. После выдачи ('+left1+' − '+spent1+') + ('+left2+' − '+spent2+') = '+(left1-spent1)+' + '+(left2-spent2)+' = '+(left1+left2-spent1-spent2)+'. Разность '+(spent1+spent2)+' коробок.',5]
   ];
  }
 }
 if(id==='natural_multiply'){
  if(t===1)data=[
   ['Вычисли по распределительному свойству: '+d+' · ('+a+' + '+b+').',M(V(d),A(V(a),V(b))),'Раскроем скобки или сложим и умножим.',2],
   ['На одной полке '+a+' книг, на другой '+b+'. Таких пар полок '+d+'. Сколько всего книг?',M(A(V(a),V(b)),V(d)),'В одной паре '+(a+b)+' книг. Умножаем на '+d+'.',2],
   ['Сложи произведения: '+a+' · '+d+' + '+b+' · '+d+'.',A(M(V(a),V(d)),M(V(b),V(d))),'Два умножения, затем сложение.',3],
   ['В одной партии '+d+' коробок по '+a+' предметов, во второй '+d+' коробок по '+b+' предметов. На сколько предметов различаются партии?',AB(M(V(d),V(a)),M(V(d),V(b))),'Находим число предметов в каждой партии и вычитаем.',3],
   ['Если '+d+' одинаковых пакетов содержат '+(d*(a+b))+' тетрадей, а в каждом уже лежит '+a+' тетрадей, сколько ещё положат в каждый?',S(D(V(d*(a+b)),V(d)),V(a)),'Найдём вместимость одного пакета и вычтем уже положенные.',2]
  ];
  else data=[
   ['Вычисли ('+a+' + '+b+') · ('+c+' + '+d+').',M(A(V(a),V(b)),A(V(c),V(d))),'Сначала обе суммы, затем их произведение.',3],
   ['В школьный склад привезли '+b+' партий коробок. В каждой партии '+d+' больших ящиков, в каждом большом ящике '+a+' предметов. Затем привезли ещё '+b+' партий по '+e+' ящиков, в каждом по '+c+' предметов. Сколько предметов привезли всего?',A(M(M(V(a),V(d)),V(b)),M(M(V(c),V(e)),V(b))),'Первая партия a·d·b, вторая c·e·b. Складываем.',5],
   ['Вычисли '+d+' · ('+a+' + '+b+') − '+d+' · '+c+'.',S(M(V(d),A(V(a),V(b))),M(V(d),V(c))),'Вычисляем выражение со скобками, отдельное произведение и разность.',4],
   ['Магазин получил '+d+' коробок по '+a+' карандашей и '+e+' коробок по '+b+' ручек. Сколько всего предметов?',A(M(V(d),V(a)),M(V(e),V(b))),'Два умножения и одно сложение.',3],
   ['Найди разницу двух произведений ('+a+' + '+b+') · '+d+' и ('+c+' + '+e+') · '+d+'.',AB(M(A(V(a),V(b)),V(d)),M(A(V(c),V(e)),V(d))),'Сначала суммы, затем два умножения и разность.',5]
  ];
 }
 if(id==='natural_divide'){
  const pack=d,all=(a+b+c)*pack;
  if(t===1)data=[
   ['Вычисли ('+a+' + '+b+') · '+pack+' : '+pack+'.',D(M(A(V(a),V(b)),V(pack)),V(pack)),'Сначала сумма, затем умножение и обратное деление.',3],
   [''+(a*b*pack)+' предметов разделили на '+b+' равных групп, затем каждую на '+pack+' равных частей. Сколько в части?',D(D(V(a*b*pack),V(b)),V(pack)),'Два последовательных деления.',2],
   ['В '+pack+' одинаковых пачках '+(pack*(a+b))+' листов. В каждую пачку положили ещё '+c+' листов. Сколько теперь в одной?',A(D(V(pack*(a+b)),V(pack)),V(c)),'Сначала найдём прежнее число в пачке, затем прибавим.',2],
   ['Вычисли ('+(a*pack)+' + '+(b*pack)+') : '+pack+'.',D(A(V(a*pack),V(b*pack)),V(pack)),'Сложим два произведения и разделим сумму.',2],
   ['Число x разделили на '+b+', затем на '+pack+' и получили '+a+'. Найди первоначальное число x.',M(M(V(a),V(b)),V(pack)),'Восстановим исходное число двумя обратными умножениями: сначала на '+pack+', затем на '+b+'.',3]
  ];
  else data=[
   ['Вычисли ('+a+' + '+b+' + '+c+') · '+pack+' : '+pack+' − '+b+'.',S(D(M(A(V(a),V(b),V(c)),V(pack)),V(pack)),V(b)),'Сумма трёх, умножение, деление и вычитание.',5],
   ['Вычисли (('+a+' · '+b+' + '+c+' · '+b+') · '+pack+') : ('+b+' · '+pack+').',D(M(A(M(V(a),V(b)),M(V(c),V(b))),V(pack)),M(V(b),V(pack))),'Вычислим числитель и знаменатель, затем разделим.',5],
   ['В коробках по '+pack+' предметов было '+(a*pack)+' вещей. Принесли ещё '+(b*pack)+' вещей и всё разложили поровну по '+pack+' штук. Сколько полных коробок получилось?',D(A(V(a*pack),V(b*pack)),V(pack)),'Складываем две партии и делим на вместимость.',3],
   ['Некоторое число умножили на '+pack+', затем разделили на '+b+' и получили '+(a*pack)+'. Найди первоначальное число.',D(M(V(a*pack),V(b)),V(pack)),'Обратными действиями умножаем на '+b+' и делим на '+pack+'.',3],
   ['Вычисли разность частных ('+(a*pack)+' + '+(b*pack)+') : '+pack+' и '+(c*pack)+' : '+pack+'.',S(D(A(V(a*pack),V(b*pack)),V(pack)),D(V(c*pack),V(pack))),'Найдём оба частных, затем вычтем.',4]
  ];
 }
 if(id==='numeric_literal_expressions'){
  const x=ri(3,12+t*4),y=ri(2,9+t*4),z=ri(2,7+t*3);
  if(t===1)data=[
   ['При a = '+x+' и b = '+y+' найди значение 3a + 2b.',A(M(V(3),V(x)),M(V(2),V(y))),'Подставим обе переменные и вычислим два произведения и сумму.',3],
   ['При a = '+x+' и b = '+y+' вычисли 4(a + b).',M(V(4),A(V(x),V(y))),'Сначала сумма в скобках, затем умножение.',2],
   ['Если x + '+y+' = '+(x+y)+', найдите 3x.',M(V(3),S(V(x+y),V(y))),'Выделим x и умножим на 3.',2],
   ['При a = '+x+' и b = '+y+' вычисли 10a − 2b.',S(M(V(10),V(x)),M(V(2),V(y))),'Подставляем и вычисляем два произведения и разность.',3],
   ['При a = '+x+' вычисли значение 3(a + '+z+') − '+y+'.',S(M(V(3),A(V(x),V(z))),V(y)),'Сначала скобки, затем умножение и вычитание.',3]
  ];
  else data=[
   ['При a = '+x+', b = '+y+', c = '+z+' вычисли 6(a + b) − 2c.',S(M(V(6),A(V(x),V(y))),M(V(2),V(z))),'Сначала сумма, затем два произведения и разность.',4],
   ['При a = '+x+' и b = '+y+' найди разность значений 5(a + b) и 2(a + 2b).',S(M(V(5),A(V(x),V(y))),M(V(2),A(V(x),M(V(2),V(y))))),'Подставляем обе переменные, вычисляем две суммы, произведения и разность.',5],
   ['Реши уравнение 3x + '+(2*y)+' = '+(3*x+2*y)+'. Найди x и затем вычисли 2x + '+z+'.',A(M(V(2),D(S(V(3*x+2*y),V(2*y)),V(3))),V(z)),'Из правой части вычтем '+(2*y)+', разделим на 3, затем подставим x.',4],
   ['При a = '+x+', b = '+y+' вычисли 3(a + b) + 2(a − b).',A(M(V(3),A(V(x),V(y))),M(V(2),S(V(x),V(y)))),'Сначала действия в обеих скобках, затем умножения и сумма.',5],
   ['Если a = '+x+', b = '+y+', c = '+z+', вычисли (a + b)(b + c) − a(b − 1).',S(M(A(V(x),V(y)),A(V(y),V(z))),M(V(x),S(V(y),V(1)))),'Вычисляем суммы и разности, два произведения и итог.',5]
  ];
 }
 if(id==='number_tables'){
  const display=tab,alt=table(a,b,c,d,[b,c,d,e]);
  if(t===1)data=[
   ['По таблице найди разницу между продажами книг во вторник и четверг. '+display,AB(V(d),V(b)),'Из большего показателя вычтем меньший.',2],
   ['Сколько книг продали с понедельника по среду? '+display,A(V(a),V(b),V(c)),'Сумма данных за три дня.',2],
   ['Во вторник и четверг вместе продали сколько книг? '+display,A(V(b),V(d)),'Выбираем нужные столбцы и складываем.',2],
   ['На сколько отличаются продажи за понедельник и среду вместе от продаж вторника? '+display,AB(A(V(a),V(c)),V(b)),'Сложим два дня и найдём положительную разницу с одним.',3],
   ['На сколько отличаются суммарные продажи за вторник и среду от продажи четверга? '+display,AB(A(V(b),V(c)),V(d)),'Вычислим сумму двух дней и найдём положительную разницу с четвергом.',3]
  ];
  else data=[
   ['По таблице найди продажи книг за четыре дня. В пятницу продали столько же, сколько во вторник и среду вместе. Сколько книг продали за пять дней? '+display,A(V(a),V(b),V(c),V(d),A(V(b),V(c))),'Складываем данные за первые четыре дня, затем добавляем продажи пятницы — сумму вторника и среды.',4],
   ['В таблице есть книги и журналы. Сколько всего печатных изданий продано в понедельник и четверг? '+alt,A(V(a),V(b),V(d),V(e)),'Для Пн и Чт складываем обе категории.',4],
   ['Чем отличается суммарная продажа книг в Пн и Ср от продажи журналов во Вт и Ср? '+alt,AB(A(V(a),V(c)),A(V(c),V(d))),'Сложим два показателя каждой категории и найдём разность.',5],
   ['За пять дней продали '+(a+b+c+d+e)+' книг. В таблице показаны первые четыре дня. Сколько книг продали в пятый? '+display,S(V(a+b+c+d+e),A(V(a),V(b),V(c),V(d))),'Из недельного итога вычтем сумму первых четырёх дней.',4],
   ['Найди число книг за вторник, среду, четверг и дополнительно '+e+' книг, проданных в пятницу. '+display,A(V(b),V(c),V(d),V(e)),'Сумма трёх значений таблицы и пятничного количества.',4]
  ];
 }
 if(id==='column_charts'){
  // §7: a chart really carries the data. Values aren't copied into the prompt.
  const aa=ri(3,9)*10,bb=ri(2,8)*10,cc=ri(2,7)*10,dd=ri(1,6)*10;
  const primary=[aa,bb,cc,dd],secondary=[ri(2,8)*10,ri(1,7)*10,ri(2,8)*10,ri(1,7)*10];
  const chart=bars(primary),dual=bars(primary,secondary),count=primary.reduce((x,y)=>x+y,0);
  const countExtra=secondary.reduce((x,y)=>x+y,0),sorted=[...primary].sort((x,y)=>y-x),small=[...primary].sort((x,y)=>x-y);
  const gap=(x,y)=>Math.abs(x-y);
  const fifth=ri(2,12)*5,added=ri(2,8)*5,loss=ri(1,5)*5;
  if(t===0)data=[
   ['По диаграмме определи, сколько тетрадей продали во вторник. '+chart,V(bb),'Сравним верхнюю границу столбца Вт со шкалой: она стоит на уровне '+bb+' шт.',1],
   ['Прочитай диаграмму. Каково наибольшее число проданных тетрадей за один из четырёх дней? '+chart,V(sorted[0]),'Находим самый высокий столбец и читаем по вертикальной шкале: '+sorted[0]+' шт.',1],
   ['На сколько тетрадей различаются продажи в понедельник и среду? '+chart,AB(V(aa),V(cc)),'По шкале: Пн — '+aa+', Ср — '+cc+'. Положительная разность: '+Math.max(aa,cc)+' − '+Math.min(aa,cc)+' = '+gap(aa,cc)+'.',2],
   ['Сколько тетрадей продали во вторник и четверг вместе? '+chart,A(V(bb),V(dd)),'По шкале: Вт — '+bb+', Чт — '+dd+'. Складываем: '+bb+' + '+dd+' = '+(bb+dd)+'.',2],
   ['Какова разница между самым высоким и самым низким столбцами диаграммы? '+chart,S(V(sorted[0]),V(small[0])),'Самое большое значение '+sorted[0]+', самое маленькое '+small[0]+'. Вычитаем: '+sorted[0]+' − '+small[0]+' = '+(sorted[0]-small[0])+'.',2]
  ];
  else if(t===1)data=[
   ['Сколько всего тетрадей продали за понедельник, вторник, среду и четверг? '+chart,A(...primary.map(V)),'Читаем столбцы: '+primary.join(' + ')+' = '+count+' шт.',3],
   ['Насколько различаются суммы продаж за понедельник и вторник и за среду и четверг? '+chart,AB(A(V(aa),V(bb)),A(V(cc),V(dd))),'Первая сумма '+aa+' + '+bb+' = '+(aa+bb)+'. Вторая '+cc+' + '+dd+' = '+(cc+dd)+'. Разность положительная: '+gap(aa+bb,cc+dd)+'.',4],
   ['За пять дней продали '+(count+fifth)+' тетрадей. Диаграмма показывает первые четыре дня. Сколько тетрадей продали в пятницу? '+chart,S(V(count+fifth),A(...primary.map(V))),'За четыре дня: '+primary.join(' + ')+' = '+count+'. Пятница: '+(count+fifth)+' − '+count+' = '+fifth+' шт.',4],
   ['На диаграмме синие столбцы — тетради, оранжевые — альбомы. Сколько всего тетрадей и альбомов продали в среду? '+dual,A(V(cc),V(secondary[2])),'В среду: тетрадей '+cc+', альбомов '+secondary[2]+'. Всего '+cc+' + '+secondary[2]+' = '+(cc+secondary[2])+' шт.',3],
   ['Сколько вместе составляют два наибольших значения продаж тетрадей на диаграмме? '+chart,A(V(sorted[0]),V(sorted[1])),'Два наибольших показателя: '+sorted[0]+' и '+sorted[1]+'. Сумма '+sorted[0]+' + '+sorted[1]+' = '+(sorted[0]+sorted[1])+' шт.',3]
  ];
  else data=[
   ['В пятницу продали столько же тетрадей, сколько в два дня с наименьшими показателями вместе. Сколько всего продали за пять дней? '+chart,A(A(...primary.map(V)),V(small[0]),V(small[1])),'Четыре дня: '+count+' шт. Два самых низких показателя: '+small[0]+' и '+small[1]+'. Пятница '+(small[0]+small[1])+'. За пять дней '+(count+small[0]+small[1])+' шт.',5],
   ['Два вида товаров: синие столбцы — тетради, оранжевые — альбомы. Сколько всего товаров обоих видов продали за четыре дня? '+dual,A(...primary.concat(secondary).map(V)),'Тетради: '+primary.join(' + ')+' = '+count+'. Альбомы: '+secondary.join(' + ')+' = '+countExtra+'. Всего '+count+' + '+countExtra+' = '+(count+countExtra)+' шт.',6],
   ['На диаграмме синие столбцы показывают тетради, оранжевые — альбомы. На сколько различаются общие продажи двух видов за четыре дня? '+dual,AB(A(...primary.map(V)),A(...secondary.map(V))),'Сумма тетрадей: '+primary.join(' + ')+' = '+count+'. Сумма альбомов: '+secondary.join(' + ')+' = '+countExtra+'. Разность '+gap(count,countExtra)+' шт.',6],
   ['В магазине записали продажи тетрадей (синий) и альбомов (оранжевый) за четыре дня. В пятницу дополнительно продали '+added+' тетрадей, а из покупок альбомов за предыдущие дни вернули '+loss+' штук. Сколько товаров числится проданными после этих изменений? '+dual,S(A(A(...primary.concat(secondary).map(V)),V(added)),V(loss)),'Проданные товары обоих видов: '+count+' + '+countExtra+' = '+(count+countExtra)+'. С учётом поступления и возврата: '+(count+countExtra)+' + '+added+' − '+loss+' = '+(count+countExtra+added-loss)+'.',5],
   ['На диаграмме показаны тетради (синий) и альбомы (оранжевый). На сколько отличается сумма тетрадей за вторник и четверг от суммы альбомов за понедельник и среду? '+dual,AB(A(V(bb),V(dd)),A(V(secondary[0]),V(secondary[2]))),'Синие Вт + Чт: '+bb+' + '+dd+' = '+(bb+dd)+'. Оранжевые Пн + Ср: '+secondary[0]+' + '+secondary[2]+' = '+(secondary[0]+secondary[2])+'. Разность: '+gap(bb+dd,secondary[0]+secondary[2])+' шт.',4]
  ];
 }
 if(id==='formulas_g5'){
  const P=2*(a+b),S0=a*b,V0=a*b*c;
  if(t===1)data=[
   ['Периметр прямоугольника '+P+' см. Длина '+a+' см. Найди ширину.',S(D(V(P),V(2)),V(a)),'По формуле P = 2(a+b): полупериметр минус длина.',2],
   ['Площадь прямоугольника '+S0+' см², его ширина '+b+' см. Найди длину.',D(V(S0),V(b)),'Из S = ab получаем a = S : b.',2],
   ['Параллелепипед имеет рёбра '+a+', '+b+', '+c+' см. Найди объём.',M(M(V(a),V(b)),V(c)),'По формуле V=abc умножим три измерения.',2],
   ['Длина прямоугольника '+a+' см, ширина '+b+' см. Длину увеличили на '+d+' см. На сколько выросла площадь?',S(M(A(V(a),V(d)),V(b)),M(V(a),V(b))),'Вычислим новую и прежнюю площади, найдём разницу.',4],
   ['Два прямоугольника имеют размеры '+a+'×'+b+' и '+c+'×'+d+' см. Найди сумму площадей.',A(M(V(a),V(b)),M(V(c),V(d))),'Находим обе площади и складываем.',3]
  ];
  else data=[
   ['Из прямоугольника '+a+'×'+b+' см вырезали прямоугольник '+Math.min(c,a-1)+'×'+Math.min(d,b-1)+' см. Найди оставшуюся площадь.',S(M(V(a),V(b)),M(V(Math.min(c,a-1)),V(Math.min(d,b-1)))),'Площадь исходной фигуры минус площадь выреза.',3],
   ['Фигура составлена из прямоугольников '+a+'×'+b+' и '+c+'×'+d+' см, без перекрытия. Найди общую площадь и добавь '+e+' см².',A(M(V(a),V(b)),M(V(c),V(d)),V(e)),'Вычислим две площади, сложим и добавим.',4],
   ['Коробка '+a+'×'+b+'×'+c+' см стала выше на '+d+' см. На сколько увеличился объём?',S(M(M(V(a),V(b)),A(V(c),V(d))),M(M(V(a),V(b)),V(c))),'Новый объём минус старый: ab(c+d) − abc.',5],
   ['Периметр прямоугольника '+P+' см. После увеличения ширины на '+d+' см чему равен новый периметр?',M(V(2),A(V(a),V(b),V(d))),'Полупериметр меняется на '+d+', удвоим новую сумму.',3],
   ['Найди разность объёмов коробок '+a+'×'+b+'×'+c+' и '+c+'×'+d+'×'+e+' см.',AB(M(M(V(a),V(b)),V(c)),M(M(V(c),V(d)),V(e))),'Вычисляем два объёма и находим модуль разности.',5]
  ];
 }
 if(!data)throw Error('No v123 generator '+id);
 const [text,plan,explain,steps]=data[p];
 return {id,t,p,text,plan,explain,steps};
}
function make(id){
 const t=level(),p=slot();
 if(t===0&&id!=='column_charts'&&id!=='natural_add'&&id!=='natural_subtract')return previous.apply(this,arguments);
 const data=specification(id,t,p);
 const answer=oracle(data.plan);
 if(!Number.isSafeInteger(answer)||answer<0)throw Error('v123 impossible result '+id+' L'+t+' F'+p+' = '+answer);
 const opts=g5nums(answer,[answer+1,answer+2,Math.max(0,answer-1)]);
 const key='v123_'+id+'_L'+t+'_F'+p;
 const q=g5q(data.text,opts,String(answer),data.explain+' Ответ: '+answer+'.',key);
 const correct=q.choices.filter(c=>String(c.key)===String(q.correct));
 if(correct.length!==1)throw Error('v123 cannot select a unique correct answer '+key);
 return {text:q.text,ans:String(q.correct),choices:q.choices,correctLabel:String(correct[0].label),
  correctText:String(correct[0].label),ex:q.explain,sourceTopicId:id,templateId:q.templateId,
  sig:['g5',id,t,p,q.text,String(q.correct)].join(':'),mk123:{id,t,p,steps:data.steps,plan:data.plan,expected:answer}};
}
makeG5Question=function(id){return roster.has(id)?make.apply(this,arguments):previous.apply(this,arguments)};
window.mkG5V123Tiered=IDS.slice();
})();
