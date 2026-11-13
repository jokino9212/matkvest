/* Grade 5 v124: authentic three-stage exercises in six textbook topics.
   Every learner-visible exercise is built here, not in disconnected donor factories. */
(function(){
'use strict';
if(typeof makeG5Question!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof activeDifficulty!=='function')
 throw Error('v124: Grade 5 learner quiz dependencies unavailable');
const IDS=['division_remainder','simplify_expressions','expand_brackets','plane_line_ray','area_rectangle','geometry'];
const previous=makeG5Question,covered=new Set(IDS);
const L=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0));
const F=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const rnd=(a,b)=>ri(a,b);
const V=x=>['v',x],A=(...x)=>['add',...x],S=(x,y)=>['sub',x,y],M=(x,y)=>['mul',x,y],D=(x,y)=>['div',x,y],R=(x,y)=>['mod',x,y],Abs=(x,y)=>['abs',S(x,y)];
const P=(a=0,b=0,c=0)=>['poly',a,b,c],PA=(...x)=>['psum',...x],PM=(k,x)=>['pscale',k,x],PN=x=>PM(-1,x);
function solve(node){
 if(!Array.isArray(node))throw Error('v124 non-operation plan');
 const [op,...x]=node;
 if(op==='v')return x[0];
 if(op==='add')return x.reduce((v,t)=>v+solve(t),0);
 if(op==='sub')return solve(x[0])-solve(x[1]);
 if(op==='mul')return solve(x[0])*solve(x[1]);
 if(op==='div'){const a=solve(x[0]),b=solve(x[1]);if(!b||a%b)throw Error('v124 noninteger quotient');return a/b;}
 if(op==='mod'){const a=solve(x[0]),b=solve(x[1]);if(!b||a<0||b<0)throw Error('v124 invalid modulus');return a%b;}
 if(op==='abs')return Math.abs(solve(x[0]));
 throw Error('v124 unknown arithmetic '+op);
}
function polynomial(node){
 const [op,...x]=node;
 if(op==='poly')return x;
 if(op==='psum')return x.reduce((res,t)=>{const y=polynomial(t);return res.map((n,i)=>n+y[i]);},[0,0,0]);
 if(op==='pscale')return polynomial(x[1]).map(n=>x[0]*n);
 throw Error('v124 unsupported polynomial '+op);
}
function showPoly(coef){
 const names=['a','b',''],parts=[];
 coef.forEach((c,i)=>{
  if(!c)return;
  const sign=c<0?'−':'+',abs=Math.abs(c),term=names[i]&&abs===1?names[i]:String(abs)+names[i];
  parts.push((parts.length?' '+sign+' ':sign==='−'?'−':'')+term);
 });
 return parts.join('')||'0';
}

function g4Figure(art,alt,height=170){
 return '<div class="mk-g4-figure" style="width:100%;max-width:560px;overflow:hidden;margin:8px auto"><svg role="img" aria-label="'+alt+'" viewBox="0 0 520 '+height+'" width="100%" style="height:auto;display:block">'+art+'</svg></div>';
}
function g4LineArt(){
 return '<line x1="30" y1="74" x2="490" y2="74" stroke="#37689b" stroke-width="3"/><path d="M30 74 l13 -7 v14 Z M490 74 l-13 -7 v14 Z" fill="#37689b"/>';
}
function g4ChoicePicture(order){
 const pieces={
  line:'<line x1="17" y1="58" x2="113" y2="58" stroke="#37689b" stroke-width="3"/><path d="M17 58 l10 -6 v12 Z M113 58 l-10 -6 v12 Z" fill="#37689b"/>',
  ray:'<line x1="29" y1="58" x2="113" y2="58" stroke="#37689b" stroke-width="3"/><circle cx="29" cy="58" r="4" fill="#37689b"/><path d="M113 58 l-10 -6 v12 Z" fill="#37689b"/>',
  segment:'<line x1="25" y1="58" x2="105" y2="58" stroke="#37689b" stroke-width="3"/><circle cx="25" cy="58" r="4" fill="#37689b"/><circle cx="105" cy="58" r="4" fill="#37689b"/>',
  angle:'<line x1="33" y1="82" x2="107" y2="82" stroke="#37689b" stroke-width="3"/><line x1="33" y1="82" x2="78" y2="13" stroke="#37689b" stroke-width="3"/><circle cx="33" cy="82" r="4" fill="#37689b"/><path d="M107 82 l-10 -6 v12 Z M78 13 l-10 8 l10 5 Z" fill="#37689b"/>'
 };
 const nodes=order.map((kind,i)=>'<g transform="translate('+(i*130)+',0)" data-kind="'+kind+'">'+pieces[kind]+'<text x="65" y="123" font-size="22" text-anchor="middle" font-weight="700" fill="currentColor">'+(i+1)+'</text></g>').join('');
 return g4Figure(nodes,'Фигуры под номерами 1, 2, 3, 4: прямая, луч, отрезок и угол в разном порядке',145);
}
function g4RaySketch(){
 return g4Figure('<line x1="100" y1="85" x2="432" y2="85" stroke="#37689b" stroke-width="3"/><circle cx="100" cy="85" r="5" fill="#37689b"/><path d="M432 85 l-13 -7 v14 Z" fill="#37689b"/><text x="100" y="116" text-anchor="middle" fill="currentColor" font-size="20">O</text><text x="312" y="68" text-anchor="middle" fill="currentColor" font-size="20">A</text>','Луч OA с началом O');
}
function g4SplitSegment(a,b,hide=false){
 const left=45,right=475,x=left+(right-left)*a/(a+b);
 return g4Figure('<line x1="'+left+'" y1="83" x2="'+right+'" y2="83" stroke="#37689b" stroke-width="3"/>'+[left,x,right].map(v=>'<circle cx="'+v.toFixed(2)+'" cy="83" r="5" fill="#37689b"/>').join('')+'<text x="'+left+'" y="116" font-size="20" text-anchor="middle" fill="currentColor">A</text><text x="'+x.toFixed(2)+'" y="116" font-size="20" text-anchor="middle" fill="currentColor">C</text><text x="'+right+'" y="116" font-size="20" text-anchor="middle" fill="currentColor">B</text><text x="'+((left+x)/2).toFixed(2)+'" y="60" font-size="17" text-anchor="middle" fill="currentColor">'+a+' см</text><text x="'+((right+x)/2).toFixed(2)+'" y="60" font-size="17" text-anchor="middle" fill="currentColor">'+(hide?'?':b+' см')+'</text>',
 'Отрезок AB, C между A и B; AC равно '+a+' см, CB '+(hide?'неизвестно':b+' см'));
}
function g4MarkedLine(n){
 const points=Array.from({length:n},(_,i)=>65+i*390/(n-1));
 const dots=points.map((v,i)=>'<circle cx="'+v.toFixed(2)+'" cy="74" r="5" fill="#37689b"/><text x="'+v.toFixed(2)+'" y="108" font-size="18" text-anchor="middle" fill="currentColor">'+String.fromCharCode(65+i)+'</text>').join('');
 return g4Figure(g4LineArt()+dots,'Прямая с '+n+' различными отмеченными точками A, B и далее по алфавиту');
}
function g4RaysWord(n){return n%10===1&&n%100!==11?'луч':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'луча':'лучей';}
function g4FanRays(n){
 const cx=255,cy=210,r=147,span=142;
 const rays=Array.from({length:n},(_,i)=>{
  const angle=(19+i*span/(n-1))*Math.PI/180,dx=Math.cos(angle),dy=Math.sin(angle),x=(cx+r*dx).toFixed(2),y=(cy-r*dy).toFixed(2);
  const arrowX=(cx+(r-14)*dx).toFixed(2),arrowY=(cy-(r-14)*dy).toFixed(2);
  return '<line x1="'+cx+'" y1="'+cy+'" x2="'+x+'" y2="'+y+'" stroke="#37689b" stroke-width="3"/><circle cx="'+arrowX+'" cy="'+arrowY+'" r="3" fill="#37689b"/><text x="'+x+'" y="'+y+'" font-size="19" fill="currentColor" text-anchor="middle" dy="-8">'+String.fromCharCode(65+i)+'</text>';
 }).join('');
 return g4Figure(rays+'<circle cx="'+cx+'" cy="'+cy+'" r="5" fill="#37689b"/><text x="'+(cx+14)+'" y="'+(cy+24)+'" fill="currentColor" font-size="20">O</text>',
 'Из точки O выходят '+n+' различных '+g4RaysWord(n)+', изображённых в одной полуплоскости',245);
}
function g4AngleSketch(){
 return g4FanRays(2);
}
function g4Crossing(a=0,b=0,c=0,d=0){
 const cx=260,cy=122;
 const measured=[a,b,c,d].every(x=>x>0),values=measured?[a,b,c,d]:[1,1,1,1],unit=measured?Math.min(175/Math.max(...values),70):145;
 const labels=[
  {name:'A',length:values[0],vx:-.87,vy:-.49},{name:'B',length:values[1],vx:.87,vy:.49},
  {name:'C',length:values[2],vx:.87,vy:-.49},{name:'D',length:values[3],vx:-.87,vy:.49}
 ];
 let rays='';
 for(const o of labels){
  const x=(cx+o.length*unit*o.vx).toFixed(2),y=(cy+o.length*unit*o.vy).toFixed(2);
  rays+='<line x1="'+cx+'" y1="'+cy+'" x2="'+x+'" y2="'+y+'" stroke="#37689b" stroke-width="3"/><circle cx="'+x+'" cy="'+y+'" r="4" fill="#37689b"/><text x="'+x+'" y="'+y+'" dy="'+(o.vy>0?22:-11)+'" text-anchor="middle" font-size="19" fill="currentColor">'+o.name+'</text>';
 }
 rays+='<circle cx="'+cx+'" cy="'+cy+'" r="5" fill="#37689b"/><text x="'+(cx+10)+'" y="'+(cy-8)+'" font-size="19" fill="currentColor">O</text>';
 return g4Figure(rays,'Прямые AB и CD пересекаются в точке O'+(a?' с размерами AO '+a+', OB '+b+', CO '+c+', OD '+d:'') ,245);
}
function g4FourPointSegments(a,b,c){
 const x=[50,50+a*410/(a+b+c),50+(a+b)*410/(a+b+c),460];
 const labs=['A','B','C','D'],lengths=[a,b,c];
 let html=g4LineArt();
 for(let i=0;i<4;i++)html+='<circle cx="'+x[i].toFixed(2)+'" cy="74" r="5" fill="#37689b"/><text x="'+x[i].toFixed(2)+'" y="108" text-anchor="middle" font-size="18" fill="currentColor">'+labs[i]+'</text>';
 for(let i=0;i<3;i++)html+='<text x="'+((x[i]+x[i+1])/2).toFixed(2)+'" y="51" text-anchor="middle" font-size="17" fill="currentColor">'+lengths[i]+' см</text>';
 return g4Figure(html,'Точки A, B, C, D по порядку на прямой, AB '+a+', BC '+b+', CD '+c+' сантиметров');
}

function spec(id,t,p){
 const a=rnd(4,12+4*t),b=rnd(3,10+4*t),c=rnd(2,8+3*t),e=rnd(2,6+2*t);
 const k=rnd(3,8+3*t),m=rnd(2,6+2*t),u=rnd(2,5+2*t);
 let cases;
 if(id==='division_remainder'){
  const divisor=rnd(4,10+3*t),q=rnd(5+2*t,15+7*t),rem=rnd(1,divisor-1),n=q*divisor+rem;
  const plus=rnd(2,5);
  if(t===0)cases=[
   ['Остаток от деления '+n+' на '+divisor+' равен чему?',V(rem),'Проверка: '+n+' = '+divisor+' · '+q+' + '+rem+'. Остаток меньше делителя.',2],
   ['Какое неполное частное получается при делении '+n+' на '+divisor+'?',V(q),'В числе '+n+' содержится '+q+' полных групп по '+divisor+'.',2],
   ['Найди делимое, если делитель '+divisor+', неполное частное '+q+', остаток '+rem+'.',A(M(V(divisor),V(q)),V(rem)),'Делимое = делитель · частное + остаток.',2],
   ['Какой наибольший возможный остаток при делении на '+divisor+'?',S(V(divisor),V(1)),'Остаток всегда строго меньше делителя.',1],
   ['В коробке '+n+' бусин. Их раскладывают по '+divisor+' штук. Сколько бусин останется?',R(V(n),V(divisor)),'Разложим '+q+' полных упаковок и найдём остаток.',2]
  ];
  else if(t===1)cases=[
   ['К '+n+' прибавили '+(plus*divisor)+' и разделили на '+divisor+'. Найди новое неполное частное.',D(S(A(V(n),V(plus*divisor)),V(rem)),V(divisor)),'Добавление '+plus+' полных делителей увеличит частное на '+plus+'.',3],
   ['Сколько минимум прибавить к '+n+', чтобы число делилось на '+divisor+' без остатка?',S(V(divisor),V(rem)),'Следующее кратное '+((q+1)*divisor)+'; до него не хватает '+(divisor-rem)+'.',3],
   ['Из '+n+' карандашей убрали остаток '+rem+'. Сколько полных групп по '+divisor+' получилось?',D(S(V(n),V(rem)),V(divisor)),'Вычтем остаток, затем разделим на '+divisor+'.',3],
   ['К '+n+' добавили '+(plus*divisor)+' предметов. Найди остаток от деления нового количества на '+divisor+'.',R(A(V(n),M(V(plus),V(divisor))),V(divisor)),'Добавили целое число групп. Остаток остался '+rem+'.',3],
   ['Из '+n+' предметов забрали '+(divisor*plus+rem)+'. Сколько полных групп по '+divisor+' осталось?',D(S(V(n),A(M(V(divisor),V(plus)),V(rem))),V(divisor)),'Убрали '+plus+' полных групп и исходный остаток.',4]
  ];
  else cases=[
   ['В двух пакетах '+n+' и '+(divisor*u+c)+' предметов. Сложили вместе. Какой остаток при делении всей суммы на '+divisor+'?',R(A(V(n),V(divisor*u+c)),V(divisor)),'Сложим содержимое, найдём неполное частное и остаток.',4],
   ['На сколько минимум увеличить число '+n+', чтобы неполное частное от деления на '+divisor+' стало ровно '+(q+plus)+'?',S(M(V(q+plus),V(divisor)),V(n)),'Минимальное число с таким частным равно '+((q+plus)*divisor)+'. Вычитаем исходное.',4],
   ['Из '+n+' яблок убрали '+rem+' штук и разложили по '+divisor+' в пакет. Затем отдали '+plus+' пакетов. Сколько пакетов осталось?',S(D(S(V(n),V(rem)),V(divisor)),V(plus)),'Сначала вычтем остаток, разделим и вычтем отданные пакеты.',4],
   ['Товаров '+n+'. Первоначально их делили на группы по '+divisor+'. Сколько останется предметов, если изменить размер группы на '+(divisor+1)+'?',R(V(n),V(divisor+1)),'Вычислим новое неполное частное для групп по '+(divisor+1)+'. Остаток изменится.',4],
   ['К числу '+n+' прибавили '+(divisor*plus)+', затем вычли '+e+'. Найди остаток от деления результата на '+divisor+'.',R(S(A(V(n),V(divisor*plus)),V(e)),V(divisor)),'Сначала изменим делимое, затем вычислим остаток.',5]
  ];
 }
 if(id==='simplify_expressions'){
  if(t===0)cases=[
   ['Собери подобные слагаемые: a + a + a.',P(3,0,0),'Три одинаковых слагаемых дают 3a.',1],
   ['Упрости: '+k+'a + '+m+'a.',PA(P(k),P(m)),'Складываем коэффициенты перед буквой a.',1],
   ['Упрости: '+k+'b + '+m+'b.',PA(P(0,k),P(0,m)),'Одинаковая буквенная часть b позволяет сложить коэффициенты.',1],
   ['Упрости: '+k+'a + a + '+m+'a.',PA(P(k),P(1),P(m)),'Сложим все коэффициенты перед a.',2],
   ['Собери подобные: '+k+'a + '+m+'a + '+c+'.',PA(P(k),P(m),P(0,0,c)),'Свободное число '+c+' не объединяется с a.',2]
  ];
  else if(t===1)cases=[
   ['Упрости: '+k+'(a + b) + '+m+'a.',PA(PM(k,P(1,1)),P(m)),'Раскроем скобки и соберём слагаемые с a.',3],
   ['Приведи подобные: '+k+'(a + b) + '+m+'b.',PA(PM(k,P(1,1)),P(0,m)),'Раскрываем скобки и складываем коэффициенты b.',3],
   ['Упрости: '+k+'(a − b) + '+(k+e)+'b.',PA(PM(k,P(1,-1)),P(0,k+e)),'После раскрытия скобок коэффициент b равен '+e+'.',3],
   ['Упрости: '+m+'(a + '+c+') + '+k+'a.',PA(PM(m,P(1,0,c)),P(k)),'Перемножим числа в скобках и соберём a.',3],
   ['Приведи подобные: '+(k+e)+'a + '+m+'b − '+e+'a.',PA(P(k+e,0),P(0,m),P(-e,0)),'Сгруппируем коэффициенты a: '+(k+e)+' − '+e+' = '+k+'.',3]
  ];
  else cases=[
   ['Упрости: '+(k+m)+'(a + b) + '+m+'(a − b).',PA(PM(k+m,P(1,1)),PM(m,P(1,-1))),'Раскроем обе скобки и соберём коэффициенты отдельно при a и b.',4],
   ['Упрости: '+(k+m)+'(2a + b) − '+m+'(a + b).',PA(PM(k+m,P(2,1)),PN(PM(m,P(1,1)))),'Сначала раскрываем две скобки, затем вычитаем соответствующие коэффициенты.',5],
   ['Упрости: '+k+'(a + b + '+c+') + '+m+'(a − b).',PA(PM(k,P(1,1,c)),PM(m,P(1,-1))),'Раскроем трёхчлен и двучлен, сгруппируем подобные.',5],
   ['Упрости: '+(k+m)+'(2a + b) − '+m+'(a − b) + '+e+'.',PA(PM(k+m,P(2,1)),PN(PM(m,P(1,-1))),P(0,0,e)),'После раскрытия скобок объединяем a, b и свободное число.',5],
   ['Упрости: '+(k+m)+'(a + b) + '+m+'(a − b) − '+e+'a.',PA(PM(k+m,P(1,1)),PM(m,P(1,-1)),P(-e)),'Раскрываем скобки, затем приводим a и b отдельно.',5]
  ];
 }
 if(id==='expand_brackets'){
  if(t===0)cases=[
   ['Раскрой скобки: '+k+'(a + b).',PM(k,P(1,1)),'Умножаем каждое слагаемое на '+k+'.',1],
   ['Раскрой скобки: '+k+'(a − b).',PM(k,P(1,-1)),'Умножаем на '+k+' и a, и b. Знак минус сохраняется.',1],
   ['Раскрой скобки: '+k+'(a + '+c+').',PM(k,P(1,0,c)),'Каждое слагаемое умножаем на множитель перед скобкой.',2],
   ['Раскрой скобки: '+k+'(2a + b).',PM(k,P(2,1)),'Умножаем '+k+' на 2a и b.',2],
   ['Раскрой скобки: '+m+'(b + '+c+').',PM(m,P(0,1,c)),'Распределим множитель по двум слагаемым.',2]
  ];
  else if(t===1)cases=[
   ['Раскрой скобки и упрости: '+k+'(2a + b) + '+m+'a.',PA(PM(k,P(2,1)),P(m)),'После раскрытия скобок складываем коэффициенты a.',3],
   ['Раскрой скобки: '+(k+m)+'(a + b) − '+m+'a.',PA(PM(k+m,P(1,1)),P(-m)),'Умножим на оба слагаемых и вычтем m·a.',3],
   ['Раскрой скобки: '+k+'(a + b) + '+m+'(b + '+c+').',PA(PM(k,P(1,1)),PM(m,P(0,1,c))),'Два раза применим распределительное свойство, сгруппируем b.',4],
   ['Раскрой скобки: '+k+'(2a − b) + '+(k+m)+'b.',PA(PM(k,P(2,-1)),P(0,k+m)),'После раскрытия скобок соберём b.',3],
   ['Раскрой скобки: '+k+'(a + '+c+') + '+m+'(a + b).',PA(PM(k,P(1,0,c)),PM(m,P(1,1))),'Раскроем обе скобки и приведём слагаемые с a.',4]
  ];
  else cases=[
   ['Раскрой все скобки: '+(k+m)+'(2a + b) − '+m+'(a − b) + '+e+'.',PA(PM(k+m,P(2,1)),PN(PM(m,P(1,-1))),P(0,0,e)),'Раскрываем, вычитаем второй многочлен и группируем подобные.',5],
   ['Раскрой скобки: '+k+'(a + b) + '+m+'(2a − b).',PA(PM(k,P(1,1)),PM(m,P(2,-1))),'Раскрываем обе скобки и суммируем коэффициенты.',4],
   ['Раскрой скобки: '+(k+m)+'(3a + 2b) − '+m+'(a + 2b).',PA(PM(k+m,P(3,2)),PN(PM(m,P(1,2)))),'Четыре произведения затем два объединения подобных слагаемых.',5],
   ['Раскрой скобки: '+(k+m)+'(2a + '+c+') − '+m+'(a − '+e+').',PA(PM(k+m,P(2,0,c)),PN(PM(m,P(1,0,-e)))),'Раскроем обе скобки со свободными членами, учтём знак вычитания.',5],
   ['Раскрой скобки: '+k+'(a + 2(b + '+c+')) + '+m+'a.',PA(PM(k,PA(P(1),PM(2,P(0,1,c)))),P(m)),'Сначала внутренние скобки, затем внешние; объединим a.',5]
  ];
 }
 if(id==='plane_line_ray'){
  // §4 Vilenkin: point, plane, line, segment, ray, angle, intersections.
  // §5 coordinate-scale questions are deliberately not generated here.
  const order=['line','ray','segment','angle'];
  for(let i=order.length-1;i>0;i--){const j=rnd(0,i);[order[i],order[j]]=[order[j],order[i]];}
  const pick=kind=>V(order.indexOf(kind)+1),gallery=g4ChoicePicture(order);
  const a1=rnd(5,11+3*t),b1=rnd(4,10+3*t),c1=rnd(3,9+3*t),d1=rnd(2,8+3*t);
  const n=t===1?rnd(4,6):rnd(5,7);
  if(t===0)cases=[
   ['На каком рисунке показана прямая — линия без начала и конца? '+gallery,pick('line'),'Прямая бесконечна в обе стороны. Среди рисунков выбираем линию со стрелками на обоих концах.',1],
   ['Сколько начальных точек у луча OA? '+g4RaySketch(),V(1),'У луча есть одно начало O; другого конца у него нет.',1],
   ['Точка C лежит внутри отрезка AB. На сколько частей она делит отрезок? '+g4SplitSegment(a1,b1),V(2),'Точка C делит отрезок AB на AC и CB.',1],
   ['Сколько сторон-лучей образуют угол AOB? '+g4AngleSketch(),V(2),'Угол состоит из двух лучей OA и OB с общей вершиной O.',1],
   ['На рисунке две пересекающиеся в O прямые. Сколько лучей с началом O лежит на этих прямых? '+g4Crossing(),V(4),'На каждой прямой из точки O выходят два противоположных луча: 2 + 2 = 4.',1]
  ];
  else if(t===1){
   const rayCount=rnd(3,5);
   cases=[
    ['На отрезке AB точка C находится между A и B. AC = '+a1+' см, CB = '+b1+' см. Найди AB. '+g4SplitSegment(a1,b1),A(V(a1),V(b1)),'Целый отрезок состоит из AC и CB: '+a1+' + '+b1+' = '+(a1+b1)+' см.',2],
    ['На отрезке AB длиной '+(a1+b1)+' см точка C расположена между A и B. AC = '+a1+' см. Найди CB. '+g4SplitSegment(a1,b1,true),S(V(a1+b1),V(a1)),'Из длины AB вычитаем AC: '+(a1+b1)+' − '+a1+' = '+b1+' см.',2],
    ['На прямой отмечено '+n+' различных точек. Сколько отрезков соединяют соседние точки? '+g4MarkedLine(n),S(V(n),V(1)),'Между '+n+' последовательно отмеченными точками '+(n-1)+' промежутков.',2],
    ['Из точки O выходят '+rayCount+' '+g4RaysWord(rayCount)+' в одной полуплоскости. Сколько углов расположено между соседними лучами на рисунке? '+g4FanRays(rayCount),S(V(rayCount),V(1)),'Углы между соседними лучами: '+rayCount+' − 1 = '+(rayCount-1)+'.',2],
    ['На рисунке две пересекающиеся прямые AB и CD. Сколько пар противоположных лучей с началом O образуют эти прямые? '+g4Crossing(),V(2),'Каждая из двух прямых задаёт одну пару противоположных лучей: OA и OB, OC и OD.',2]
   ];
  }else{
   const rayCount=rnd(4,6),marks=rnd(5,7);
   cases=[
    ['Из точки O выходят '+rayCount+' '+g4RaysWord(rayCount)+', расположенных в одной полуплоскости. Сколько углов с вершиной O задают все различные пары лучей? '+g4FanRays(rayCount),D(M(V(rayCount),S(V(rayCount),V(1))),V(2)),'Из '+rayCount+' лучей можно составить '+(rayCount*(rayCount-1)/2)+' пар: '+rayCount+' · '+(rayCount-1)+' : 2.',4],
    ['На одной прямой отмечено '+marks+' различных точек. Сколько разных отрезков с концами в этих точках можно построить? '+g4MarkedLine(marks),D(M(V(marks),S(V(marks),V(1))),V(2)),'У каждой из '+marks+' точек есть '+(marks-1)+' партнёров; каждый отрезок посчитан дважды. Ответ: '+marks+' · '+(marks-1)+' : 2.',4],
    ['На прямой отмечено '+marks+' точек. Сколько различных лучей можно задать, если начало луча должно быть в отмеченной точке и луч проходит хотя бы через одну другую отмеченную точку? '+g4MarkedLine(marks),A(M(V(2),S(V(marks),V(2))),V(2)),'Из двух крайних точек выходит по одному такому лучу; из '+(marks-2)+' внутренних точек — по два: 2 · '+(marks-2)+' + 2.',4],
    ['Прямые AB и CD пересекаются в O; O находится между A и B и между C и D. AB = '+(a1+b1)+' см, AO = '+a1+' см, CD = '+(c1+d1)+' см, CO = '+c1+' см. Найди OB + OD. '+g4Crossing(a1,b1,c1,d1),A(S(V(a1+b1),V(a1)),S(V(c1+d1),V(c1))),'Найдём OB = AB − AO = '+b1+' см; OD = CD − CO = '+d1+' см. Сумма '+(b1+d1)+' см.',4],
    ['На прямой точки A, B, C, D расположены по порядку. AB = '+a1+' см, BC = '+b1+' см, CD = '+c1+' см. Найди сумму AC + BD. '+g4FourPointSegments(a1,b1,c1),A(A(V(a1),V(b1)),A(V(b1),V(c1))),'AC = AB + BC = '+(a1+b1)+' см; BD = BC + CD = '+(b1+c1)+' см. Складываем: '+(a1+2*b1+c1)+' см.',4]
   ];
  }
 }
 if(id==='area_rectangle'){
  const area=a*b,short=Math.min(c,a-1),smallWidth=Math.min(e,b-1);
  if(t===0)cases=[
   ['Прямоугольник имеет стороны '+a+' и '+b+' см. Найди площадь в см².',M(V(a),V(b)),'Площадь прямоугольника равна произведению соседних сторон.',1],
   ['Площадь прямоугольника '+area+' см². Ширина '+b+' см. Найди длину.',D(V(area),V(b)),'Из формулы S = ab находим неизвестную длину делением.',2],
   ['Сторона квадрата '+a+' см. Найди его площадь в см².',M(V(a),V(a)),'Площадь квадрата равна квадрату его стороны.',1],
   ['Фигура из двух неперекрывающихся прямоугольников: '+a+'×'+b+' см и '+c+'×'+b+' см. Найди общую площадь.',A(M(V(a),V(b)),M(V(c),V(b))),'Суммируем площади двух частей.',2],
   ['Ширина прямоугольника '+b+' см, длину увеличили на 1 см. На сколько см² выросла площадь?',V(b),'Добавилась полоска шириной 1 см и высотой '+b+' см.',2]
  ];
  else if(t===1)cases=[
   ['Из прямоугольника '+a+'×'+b+' см вырезали прямоугольник '+short+'×'+smallWidth+' см. Сколько см² осталось?',S(M(V(a),V(b)),M(V(short),V(smallWidth))),'Из площади большого прямоугольника вычитаем вырезанную.',3],
   ['Длину прямоугольника '+a+'×'+b+' см увеличили на '+c+' см. Какова новая площадь?',M(A(V(a),V(c)),V(b)),'Находим новую длину и умножаем на ширину.',2],
   ['Сложили прямоугольники '+a+'×'+b+' и '+c+'×'+e+' см без наложения. Найди общую площадь.',A(M(V(a),V(b)),M(V(c),V(e))),'Вычислим площади по отдельности и сложим.',3],
   ['Площадь прямоугольника '+(a*b)+' см². Его длина '+a+' см. Ширину увеличили на '+e+' см. Найди новую площадь.',M(V(a),A(D(V(a*b),V(a)),V(e))),'Сначала восстановим ширину, затем пересчитаем площадь.',3],
   ['На сколько увеличится площадь прямоугольника '+a+'×'+b+' см, если ширину увеличить на '+e+' см?',S(M(V(a),A(V(b),V(e))),M(V(a),V(b))),'Вычтем старую площадь из новой.',3]
  ];
  else cases=[
   ['Из прямоугольника '+a+'×'+b+' см вырезали два непересекающихся прямоугольника '+short+'×1 см и 1×'+smallWidth+' см. Сколько см² осталось?',S(S(M(V(a),V(b)),V(short)),V(smallWidth)),'Сначала площадь большой фигуры, затем площади двух непересекающихся вырезов.',4],
   ['У прямоугольника '+a+'×'+b+' см длину увеличили на '+c+', ширину — на '+e+' см. На сколько выросла площадь?',S(M(A(V(a),V(c)),A(V(b),V(e))),M(V(a),V(b))),'Находим обе площади и их разность.',5],
   ['Два прямоугольника: '+a+'×'+b+' и '+(a+c)+'×'+(b+e)+' см. На сколько см² отличается их площадь?',Abs(M(V(a),V(b)),M(A(V(a),V(c)),A(V(b),V(e)))),'Вычислим площади двух фигур и модуль разности.',5],
   ['Площадь прямоугольника '+area+' см², ширина '+b+' см. Длину увеличили на '+c+' см и ширину на '+e+' см. Какова новая площадь?',M(A(D(V(area),V(b)),V(c)),A(V(b),V(e))),'Восстановим длину, затем изменим оба измерения и умножим.',5],
   ['Прямоугольник '+a+'×'+b+' см разбит на две части вертикальным разрезом. Первая имеет ширину '+short+' см. Чему равна разность площадей двух частей?',Abs(M(V(short),V(b)),M(S(V(a),V(short)),V(b))),'Находим ширину второй части, две площади и их разность.',5]
  ];
 }
 if(id==='geometry'){
  const x=a+b,y=b+c,z=a+c,tri=x+y+z,per=2*(a+b);
  if(t===0)cases=[
   ['Найди периметр квадрата со стороной '+a+' см.',M(V(4),V(a)),'Все четыре стороны равны.',1],
   ['Найди периметр прямоугольника со сторонами '+a+' и '+b+' см.',M(V(2),A(V(a),V(b))),'P = 2(a + b).',2],
   ['Треугольник имеет стороны '+x+', '+y+' и '+z+' см. Найди периметр.',A(V(x),V(y),V(z)),'Сложим длины трёх сторон.',2],
   ['Найди площадь квадрата со стороной '+b+' см (см²).',M(V(b),V(b)),'S = b · b.',1],
   ['Найди площадь прямоугольника '+a+'×'+b+' см (см²).',M(V(a),V(b)),'S = a · b.',1]
  ];
  else if(t===1)cases=[
   ['Периметр прямоугольника '+per+' см, одна сторона '+a+' см. Найди другую сторону.',S(D(V(per),V(2)),V(a)),'Полупериметр равен '+(a+b)+'; вычтем известную сторону.',2],
   ['Площадь прямоугольника '+(a*b)+' см², одна сторона '+b+' см. Найди вторую.',D(V(a*b),V(b)),'Разделим площадь на известную сторону.',2],
   ['Два прямоугольника примыкают без наложения и имеют общую высоту '+b+' см, длины '+a+' и '+c+' см. Найди общую площадь.',M(A(V(a),V(c)),V(b)),'Сначала общая ширина, затем площадь полученного прямоугольника.',3],
   ['Периметр треугольника '+tri+' см, две стороны '+x+' и '+y+' см. Найди третью.',S(S(V(tri),V(x)),V(y)),'Из периметра вычтем две известные стороны.',2],
   ['Длину прямоугольника '+a+'×'+b+' см увеличили на '+c+' см. На сколько сантиметров вырос периметр?',S(M(V(2),A(A(V(a),V(c)),V(b))),V(per)),'Сначала новый периметр, затем разность со старым.',3]
  ];
  else cases=[
   ['К прямоугольнику '+a+'×'+b+' см без перекрытия приставили прямоугольник '+c+'×'+b+' см по общей стороне '+b+' см. Найди периметр общей фигуры.',M(V(2),A(A(V(a),V(c)),V(b))),'После соединения получился прямоугольник шириной '+(a+c)+' см и высотой '+b+' см.',4],
   ['У прямоугольника '+a+'×'+b+' см длину увеличили на '+c+', ширину на '+e+' см. На сколько вырос периметр?',S(M(V(2),A(A(V(a),V(c)),A(V(b),V(e)))),M(V(2),A(V(a),V(b)))),'Вычислим новый периметр и вычтем исходный.',5],
   ['В двух прямоугольниках стороны '+a+'×'+b+' см и '+(a+c)+'×'+(b+e)+' см. Найди разность их площадей в см².',Abs(M(V(a),V(b)),M(A(V(a),V(c)),A(V(b),V(e)))),'Сначала две площади, затем разность.',5],
   ['Периметр прямоугольника '+per+' см. Его ширину '+b+' см увеличили на '+e+' см, а длину '+a+' см уменьшили на '+Math.min(c,a-1)+' см. Найди новый периметр.',M(V(2),A(S(V(a),V(Math.min(c,a-1))),A(V(b),V(e)))),'Найдём две новые стороны, сложим их и удвоим.',5],
   ['Периметр треугольника '+tri+' см. Одну сторону '+x+' см увеличили на '+c+' см, другую '+y+' см уменьшили на '+Math.min(e,c-1)+' см. Каким стал периметр?',S(A(V(tri),V(c)),V(Math.min(e,c-1))),'К прежнему периметру добавим увеличение и вычтем уменьшение.',4]
  ];
 }
 if(!cases||cases.length!==5)throw Error('v124 unrecognized topic or incomplete cognitive families '+id);
 const [text,plan,explain,steps]=cases[p];
 return {id,t,p,kind:typeof plan[0]==='string'&&['poly','psum','pscale'].includes(plan[0])?'symbol':'numeric',text,plan,explain,steps};
}
function make(id){
 const t=L(),p=F(),data=spec(id,t,p),kind=data.kind;
 const computed=kind==='symbol'?polynomial(data.plan):solve(data.plan);
 const answer=kind==='symbol'?showPoly(computed):String(computed);
 if(kind==='numeric'&&(!Number.isSafeInteger(computed)||computed<0))throw Error('v124 invalid arithmetic '+id+'/'+t+'/'+p+' '+computed);
 const options=kind==='symbol'
 ?[{label:answer,key:'ok'},...[[1,0,0],[0,1,0],[0,0,1]].map((d,i)=>({label:showPoly(computed.map((v,j)=>v+d[j])),key:'bad'+i}))]
 :g5nums(computed,[computed+1,computed+2,Math.max(0,computed-1)]);
 const key='v124_'+id+'_L'+t+'_F'+p;
 const q=g5q(data.text,options,kind==='symbol'?'ok':String(computed),data.explain+' Ответ: '+answer+'.',key);
 const matching=q.choices.filter(c=>String(c.key)===String(q.correct));
 if(matching.length!==1||new Set(q.choices.map(c=>String(c.label))).size!==q.choices.length)throw Error('v124 answer options are not unique '+key);
 const meta={id,t,p,kind,steps:data.steps,plan:data.plan,expected:computed,answer};
 return {text:q.text,ans:String(q.correct),choices:q.choices,ex:q.explain,
  correctLabel:String(matching[0].label),correctText:String(matching[0].label),
  sourceTopicId:id,templateId:q.templateId,sig:['g5',id,'v124',t,p,q.text,answer].join(':'),
  mk124:meta};
}
makeG5Question=function(id){return covered.has(id)?make(id):previous.apply(this,arguments);};
window.mkG5V124Tiered=IDS.slice();
})();
