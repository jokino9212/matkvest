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

// §15: show the actual coefficients and intermediate distributions, not only a generic rule.
function symbolProof(plan,computed){
 const terms=plan[0]==='psum'?plan.slice(1):[plan];
 const expanded=terms.map(x=>polynomial(x));
 const written=expanded.map(showPoly).map(x=>'('+x+')').join(' + ');
 const a=expanded.map(x=>x[0]).join(' + '),b=expanded.map(x=>x[1]).join(' + '),c=expanded.map(x=>x[2]).join(' + ');
 return 'Раскрываем скобки и записываем полученные слагаемые: '+written+'. '
   +'Складываем коэффициенты отдельно: при a — '+a+' = '+computed[0]
   +'; при b — '+b+' = '+computed[1]
   +'; свободные числа — '+c+' = '+computed[2]+'.';
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
  const baseX=cx+(r-13)*dx,baseY=cy-(r-13)*dy;
  const arrow=[[cx+r*dx,cy-r*dy],[baseX+6*dy,baseY+6*dx],[baseX-6*dy,baseY-6*dx]].map(point=>point.map(v=>v.toFixed(2)).join(',')).join(' ');
  return '<line x1="'+cx+'" y1="'+cy+'" x2="'+x+'" y2="'+y+'" stroke="#37689b" stroke-width="3"/><polygon points="'+arrow+'" fill="#37689b"/><text x="'+x+'" y="'+y+'" font-size="19" fill="currentColor" text-anchor="middle" dy="-8">'+String.fromCharCode(65+i)+'</text>';
 }).join('');
 return g4Figure(rays+'<circle cx="'+cx+'" cy="'+cy+'" r="5" fill="#37689b"/><text x="'+(cx+14)+'" y="'+(cy+24)+'" fill="currentColor" font-size="20">O</text>',
 'Из точки O выходят '+n+' различных '+g4RaysWord(n)+', изображённых в одной полуплоскости',245);
}
function g4AngleSketch(opening){
 const cx=225,cy=185,r=125,ang=opening*Math.PI/180;
 const x=(cx+r*Math.cos(ang)).toFixed(2),y=(cy-r*Math.sin(ang)).toFixed(2);
 return g4Figure('<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+r)+'" y2="'+cy+'" stroke="#37689b" stroke-width="3"/><line x1="'+cx+'" y1="'+cy+'" x2="'+x+'" y2="'+y+'" stroke="#37689b" stroke-width="3"/><circle cx="'+cx+'" cy="'+cy+'" r="5" fill="#37689b"/><text x="'+(cx-12)+'" y="'+(cy+23)+'" fill="currentColor" font-size="19">O</text><text x="'+(cx+r+7)+'" y="'+(cy+7)+'" fill="currentColor" font-size="19">A</text><text x="'+x+'" y="'+y+'" dy="-10" fill="currentColor" font-size="19">B</text>', 'Угол AOB из двух лучей с общей вершиной O',245);
}
function g4LinesThroughO(n){
 const cx=260,cy=119,r=93;
 let art='';
 for(let i=0;i<n;i++){
  const rad=(20+i*132/(n-1))*Math.PI/180,vx=Math.cos(rad),vy=Math.sin(rad);
  const x1=cx-r*vx,y1=cy-r*vy,x2=cx+r*vx,y2=cy+r*vy;
  art+='<line x1="'+x1.toFixed(2)+'" y1="'+y1.toFixed(2)+'" x2="'+x2.toFixed(2)+'" y2="'+y2.toFixed(2)+'" stroke="#37689b" stroke-width="3"/>';
  for(const sign of [-1,1]){
   const x=cx+sign*r*vx,y=cy+sign*r*vy,nx=-vy,ny=vx,back=12;
   const points=[[x,y],[x-sign*back*vx+nx*6,y-sign*back*vy+ny*6],[x-sign*back*vx-nx*6,y-sign*back*vy-ny*6]].map(p=>p.map(k=>k.toFixed(2)).join(',')).join(' ');
   art+='<polygon points="'+points+'" fill="#37689b"/>';
  }
 }
 art+='<circle cx="'+cx+'" cy="'+cy+'" r="5" fill="#d37b35"/><text x="'+(cx+10)+'" y="'+(cy+24)+'" font-size="20" fill="currentColor">O</text>';
 return g4Figure(art,'На плоскости '+n+' различные прямые пересекаются в точке O',245);
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
 return g4Figure(rays,'Прямые AB и CD пересекаются в точке O, лежащей внутри обоих отрезков',245);
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
 const symbolic=id==='simplify_expressions'||id==='expand_brackets';
 const k=rnd(3,symbolic?24+7*t:8+3*t),m=rnd(2,symbolic?19+5*t:6+2*t),u=rnd(2,5+2*t);
 let cases;
 if(id==='division_remainder'){
  // §14: a=b*q+r, 0<=r<b; the displayed text determines the answer.
  const divisor=rnd(4,19+4*t),q=rnd(5+3*t,18+6*t),rem=rnd(1,divisor-1),n=q*divisor+rem;
  const extra=rnd(1,divisor+3),added=n+extra,addedQ=Math.floor(added/divisor),addedR=added%divisor;
  const groupAdd=rnd(2,6+t),leaveGroups=rnd(1,Math.min(q-1,5+t));
  const rem2=rnd(0,divisor-1),otherQ=rnd(4,14+5*t),other=otherQ*divisor+rem2;
  const joint=n+other,jointQ=Math.floor(joint/divisor),jointR=joint%divisor;
  const desired=rnd(0,divisor-1),delta=(desired-rem+divisor)%divisor||divisor,changed=n+delta,changedQ=Math.floor(changed/divisor);
  const newDivisor=divisor+rnd(1,4+t),removed=rnd(2,Math.min(n-1,20+4*t));
  const changedN=n+divisor*groupAdd-removed,changedR=changedN%newDivisor,changedQ2=Math.floor(changedN/newDivisor);
  const secondItems=rnd(4,divisor+11),secondDivisor=rnd(3,divisor+3),lastR=(rem+secondItems)%secondDivisor,lastQ=Math.floor((rem+secondItems)/secondDivisor);
  if(t===0)cases=[
   ['Найди остаток от деления '+n+' на '+divisor+'.',R(V(n),V(divisor)),
    'Неполное частное '+q+': '+divisor+' · '+q+' = '+(divisor*q)+'. Остаток '+n+' − '+(divisor*q)+' = '+rem+'. Проверка: '+n+' = '+divisor+' · '+q+' + '+rem+', причём 0 ≤ '+rem+' < '+divisor+'.',2],
   ['Какое неполное частное при делении '+n+' на '+divisor+'?',V(q),
    'Берём '+q+' полных групп по '+divisor+': '+divisor+' · '+q+' = '+(divisor*q)+'. После них осталось '+rem+' предметов. Проверка: '+n+' = '+divisor+' · '+q+' + '+rem+' и '+rem+' < '+divisor+'.',2],
   ['Найди делимое, если делитель '+divisor+', неполное частное '+q+' и остаток '+rem+'.',A(M(V(divisor),V(q)),V(rem)),
    'По правилу деления с остатком делимое = делитель · неполное частное + остаток. '+divisor+' · '+q+' = '+(divisor*q)+', '+(divisor*q)+' + '+rem+' = '+n+'. Проверка: 0 ≤ '+rem+' < '+divisor+'.',2],
   ['Какой наибольший возможный остаток при делении на '+divisor+'?',S(V(divisor),V(1)),
    'Остаток должен удовлетворять 0 ≤ r < '+divisor+'. Наибольшее целое число меньше '+divisor+' — '+(divisor-1)+'. Проверка: '+(divisor-1)+' < '+divisor+'.',1],
   ['Разложили '+n+' пуговиц в пакеты по '+divisor+' штук. Сколько пуговиц не вошло в полные пакеты?',R(V(n),V(divisor)),
    'Полных пакетов '+q+': '+q+' · '+divisor+' = '+(q*divisor)+' пуговиц. Вне пакетов '+n+' − '+(q*divisor)+' = '+rem+'. Проверка: '+n+' = '+divisor+' · '+q+' + '+rem+' (остаток меньше '+divisor+').',2]
  ];
  else if(t===1)cases=[
   ['К '+n+' прибавили '+extra+' и разделили сумму на '+divisor+'. Сколько получилось полных групп?',D(S(V(added),V(addedR)),V(divisor)),
    'Новое делимое: '+n+' + '+extra+' = '+added+'. В нём '+addedQ+' полных групп: '+divisor+' · '+addedQ+' = '+(divisor*addedQ)+'. Остаток '+added+' − '+(divisor*addedQ)+' = '+addedR+'. Проверка: '+added+' = '+divisor+' · '+addedQ+' + '+addedR+'; 0 ≤ '+addedR+' < '+divisor+'.',3],
   ['Сколько минимум прибавить к '+n+', чтобы число делилось на '+divisor+' без остатка?',S(V(divisor),V(rem)),
    'Ближайшее большее кратное '+divisor+': '+divisor+' · '+(q+1)+' = '+((q+1)*divisor)+'. Добавить нужно '+((q+1)*divisor)+' − '+n+' = '+(divisor-rem)+'. Проверка: '+(n+divisor-rem)+' = '+divisor+' · '+(q+1)+' + 0.',3],
   ['Из '+n+' жетонов убрали '+rem+' жетонов и ещё '+leaveGroups+' полных групп по '+divisor+' жетонов. Сколько полных групп по '+divisor+' осталось?',D(S(S(V(n),V(rem)),M(V(leaveGroups),V(divisor))),V(divisor)),
    'Вначале убираем остаток: '+n+' − '+rem+' = '+(q*divisor)+'. Убираем '+leaveGroups+' группы: '+leaveGroups+' · '+divisor+' = '+(leaveGroups*divisor)+'. Остаётся '+(q*divisor)+' − '+(leaveGroups*divisor)+' = '+((q-leaveGroups)*divisor)+'. Полных групп '+(q-leaveGroups)+', остаток 0. Проверка: '+((q-leaveGroups)*divisor)+' = '+divisor+' · '+(q-leaveGroups)+' + 0.',4],
   ['Сложили '+n+' и '+other+' предметов. Какой остаток будет при делении суммы на '+divisor+'?',R(A(V(n),V(other)),V(divisor)),
    'Первое число: '+n+' = '+divisor+' · '+q+' + '+rem+'. Второе: '+other+' = '+divisor+' · '+otherQ+' + '+rem2+'. Сумма '+n+' + '+other+' = '+joint+'. Неполное частное '+jointQ+', остаток '+jointR+'. Проверка: '+joint+' = '+divisor+' · '+jointQ+' + '+jointR+'; 0 ≤ '+jointR+' < '+divisor+'.',4],
   ['К '+n+' прибавили несколько предметов так, чтобы получить '+(q+groupAdd)+' полных групп по '+divisor+' и остаток '+desired+'. Сколько предметов добавили?',S(A(M(V(q+groupAdd),V(divisor)),V(desired)),V(n)),
    'Нужное количество: '+divisor+' · '+(q+groupAdd)+' + '+desired+' = '+((q+groupAdd)*divisor+desired)+'. Уже есть '+n+'. Добавляем '+((q+groupAdd)*divisor+desired)+' − '+n+' = '+(groupAdd*divisor+desired-rem)+'. Проверка: '+((q+groupAdd)*divisor+desired)+' = '+divisor+' · '+(q+groupAdd)+' + '+desired+', 0 ≤ '+desired+' < '+divisor+'.',4]
  ];
  else cases=[
   ['В одной партии '+n+' предметов, во второй '+other+'. Сколько полных упаковок по '+divisor+' получится из обеих партий вместе?',D(S(A(V(n),V(other)),V(jointR)),V(divisor)),
    'Общее количество: '+n+' + '+other+' = '+joint+'. Из него '+jointQ+' полных упаковок: '+divisor+' · '+jointQ+' = '+(divisor*jointQ)+'. Остаток '+jointR+'. Проверка: '+joint+' = '+divisor+' · '+jointQ+' + '+jointR+'; 0 ≤ '+jointR+' < '+divisor+'.',5],
   ['Привезли '+n+' и '+other+' карандашей. Их раскладывают по '+divisor+' в коробку. Сколько коробок потребуется, если последнюю неполную коробку тоже нужно взять?',A(D(S(V(joint),V(jointR)),V(divisor)),V(jointR?1:0)),
    'Всего '+n+' + '+other+' = '+joint+' карандашей. Полных коробок '+jointQ+', остаток '+jointR+'. Проверка: '+joint+' = '+divisor+' · '+jointQ+' + '+jointR+'.'+(jointR?' Для остальных '+jointR+' карандашей нужна ещё одна коробка. Всего '+(jointQ+1)+'.':' Все коробки полные, дополнительных не требуется. Всего '+jointQ+'.'),5],
   ['Число '+n+' при делении на '+divisor+' даёт остаток '+rem+'. Сколько минимально положительных единиц нужно добавить, чтобы новый остаток стал '+desired+'?',V(delta),
    'Чтобы остаток сменился с '+rem+' на '+desired+', нужно добавить '+delta+' (только положительное число). Получим '+n+' + '+delta+' = '+changed+'. Проверка: '+changed+' = '+divisor+' · '+changedQ+' + '+desired+', 0 ≤ '+desired+' < '+divisor+'. Меньшее положительное прибавление не даёт нужного остатка.',5],
   ['Было '+n+' предметов, добавили '+(divisor*groupAdd)+', затем забрали '+removed+'. Оставшееся разделили в группы по '+newDivisor+'. Сколько предметов останется вне полных групп?',R(S(A(V(n),V(divisor*groupAdd)),V(removed)),V(newDivisor)),
    'После поступления и выдачи: '+n+' + '+(divisor*groupAdd)+' − '+removed+' = '+changedN+'. Размер группы '+newDivisor+'. Неполное частное '+changedQ2+', остаток '+changedR+'. Проверка: '+changedN+' = '+newDivisor+' · '+changedQ2+' + '+changedR+'; 0 ≤ '+changedR+' < '+newDivisor+'.',5],
   ['После раскладывания '+n+' шариков по '+divisor+' в коробку осталось '+rem+' шариков. Их объединили с ещё '+secondItems+' шариками и разложили по '+secondDivisor+' в пакет. Сколько шариков останется после второго раскладывания?',R(A(V(rem),V(secondItems)),V(secondDivisor)),
    'Первый шаг: '+n+' = '+divisor+' · '+q+' + '+rem+'. Для второй раздачи '+rem+' + '+secondItems+' = '+(rem+secondItems)+' шариков. Неполное частное '+lastQ+', остаток '+lastR+'. Проверка: '+(rem+secondItems)+' = '+secondDivisor+' · '+lastQ+' + '+lastR+'; 0 ≤ '+lastR+' < '+secondDivisor+'.',5]
  ];
 }
 if(id==='simplify_expressions'){
  if(t===0)cases=[
   ['Собери подобные слагаемые: '+k+'a + '+m+'a.',PA(P(k),P(m)),'Сумма одинаковых буквенных слагаемых: ('+k+' + '+m+')a.',1],
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
  const a1=rnd(5,11+3*t),b1=rnd(4,10+3*t),c1=rnd(3,9+3*t),d1=rnd(2,8+3*t),throughLines=rnd(2,3),initialRays=rnd(2,5),opening=rnd(32,146);
  const n=t===1?rnd(4,6):rnd(5,7);
  if(t===0)cases=[
   ['На каком рисунке показана прямая — линия без начала и конца? '+gallery,pick('line'),'Прямая бесконечна в обе стороны. Среди рисунков выбираем линию со стрелками на обоих концах.',1],
   ['Из одной точки O выходят '+initialRays+' '+g4RaysWord(initialRays)+'. Сколько различных начальных точек у этих лучей? '+g4FanRays(initialRays),V(1),'Все изображённые лучи имеют одну и ту же начальную точку O.',1],
   ['Точка C лежит внутри отрезка AB. На сколько частей она делит отрезок? '+g4SplitSegment(a1,b1),V(2),'Точка C делит отрезок AB на AC и CB.',1],
   ['Сколько сторон-лучей образуют угол AOB? '+g4AngleSketch(opening),V(2),'Угол состоит из двух лучей OA и OB с общей вершиной O.',1],
   ['На плоскости через точку O проходят '+throughLines+' различные прямые. Сколько лучей с началом O образуют эти прямые? '+g4LinesThroughO(throughLines),M(V(2),V(throughLines)),'Каждая прямая задаёт два противоположных луча. Всего 2 · '+throughLines+' = '+(throughLines*2)+'.',1]
  ];
  else if(t===1){
   const rayCount=rnd(3,5);
   cases=[
    ['На отрезке AB точка C находится между A и B. AC = '+a1+' см, CB = '+b1+' см. Найди AB. '+g4SplitSegment(a1,b1),A(V(a1),V(b1)),'Целый отрезок состоит из AC и CB: '+a1+' + '+b1+' = '+(a1+b1)+' см.',2],
    ['На отрезке AB длиной '+(a1+b1)+' см точка C расположена между A и B. AC = '+a1+' см. Найди CB. '+g4SplitSegment(a1,b1,true),S(V(a1+b1),V(a1)),'Из длины AB вычитаем AC: '+(a1+b1)+' − '+a1+' = '+b1+' см.',2],
    ['На прямой отмечено '+n+' различных точек. Сколько отрезков соединяют соседние точки? '+g4MarkedLine(n),S(V(n),V(1)),'Между '+n+' последовательно отмеченными точками '+(n-1)+' промежутков.',2],
    ['Из точки O выходят '+rayCount+' '+g4RaysWord(rayCount)+' в одной полуплоскости. Сколько углов расположено между соседними лучами на рисунке? '+g4FanRays(rayCount),S(V(rayCount),V(1)),'Углы между соседними лучами: '+rayCount+' − 1 = '+(rayCount-1)+'.',2],
    ['На рисунке '+throughLines+' различные прямые проходят через точку O. Сколько пар противоположных лучей с началом O они задают? '+g4LinesThroughO(throughLines),V(throughLines),'Одна прямая задаёт ровно одну пару противоположных лучей. Пар столько же, сколько прямых: '+throughLines+'.',2]
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
  // §21: area of rectangles/squares, inverse formula, compound parts,
  // subtraction of cutouts and multi-step area differences. Use genuine,
  // independently varied operands instead of fixed '+1 cm' prompts.
  const a=rnd(6,35+7*t),b=rnd(4,26+5*t),c=rnd(2,12+2*t),e=rnd(2,10+2*t);
  const area=a*b,short=Math.min(c,a-1),smallWidth=Math.min(e,b-1);
  if(t===0)cases=[
   ['Прямоугольник имеет длину '+a+' см и ширину '+b+' см. Найди площадь в см².',
    M(V(a),V(b)),'По формуле S = a · b подставляем стороны: '+a+' · '+b+' = '+area+' см².',2],
   ['Площадь прямоугольника '+area+' см². Ширина '+b+' см. Найди длину.',
    D(V(area),V(b)),'Из S = a · b находим a = S : b. Делим '+area+' : '+b+' = '+a+' см. Проверка: '+a+' · '+b+' = '+area+' см².',2],
   ['Сторона квадрата '+a+' см. Найди его площадь в см².',
    M(V(a),V(a)),'У квадрата обе стороны равны '+a+' см. S = a · a = '+a+' · '+a+' = '+(a*a)+' см².',2],
   ['Фигура состоит из двух неперекрывающихся прямоугольников: '+a+'×'+b+' см и '+c+'×'+b+' см. Найди общую площадь.',
    A(M(V(a),V(b)),M(V(c),V(b))),'Первая площадь: '+a+' · '+b+' = '+area+' см². Вторая: '+c+' · '+b+' = '+(c*b)+' см². Складываем: '+area+' + '+(c*b)+' = '+((a+c)*b)+' см².',3],
   ['Ширина прямоугольника '+b+' см, длину увеличили на '+c+' см. На сколько см² выросла площадь?',
    M(V(b),V(c)),'Добавилась прямоугольная полоска шириной '+c+' см и высотой '+b+' см. Её площадь '+c+' · '+b+' = '+(c*b)+' см².',2]
  ];
  else if(t===1)cases=[
   ['Из прямоугольника '+a+'×'+b+' см вырезали неперекрывающийся прямоугольник '+short+'×'+smallWidth+' см. Сколько см² осталось?',
    S(M(V(a),V(b)),M(V(short),V(smallWidth))),'Первоначальная площадь: '+a+' · '+b+' = '+area+' см². Вырезанная: '+short+' · '+smallWidth+' = '+(short*smallWidth)+' см². Осталось: '+area+' − '+(short*smallWidth)+' = '+(area-short*smallWidth)+' см².',3],
   ['Длину прямоугольника '+a+'×'+b+' см увеличили на '+c+' см. Какова новая площадь?',
    M(A(V(a),V(c)),V(b))),'Новая длина: '+a+' + '+c+' = '+(a+c)+' см. По S = a · b новая площадь: '+(a+c)+' · '+b+' = '+((a+c)*b)+' см².',3],
   ['Сложили прямоугольники '+a+'×'+b+' и '+c+'×'+e+' см без наложения. Найди общую площадь.',
    A(M(V(a),V(b)),M(V(c),V(e))),'Первая площадь: '+a+' · '+b+' = '+area+' см². Вторая площадь: '+c+' · '+e+' = '+(c*e)+' см². Общая: '+area+' + '+(c*e)+' = '+(area+c*e)+' см².',3],
   ['Площадь прямоугольника '+area+' см². Его длина '+a+' см. Ширину увеличили на '+e+' см. Найди новую площадь.',
    M(V(a),A(D(V(area),V(a)),V(e))),'Сначала старая ширина: '+area+' : '+a+' = '+b+' см. Новая ширина: '+b+' + '+e+' = '+(b+e)+' см. Новая площадь: '+a+' · '+(b+e)+' = '+(a*(b+e))+' см².',4],
   ['На сколько увеличится площадь прямоугольника '+a+'×'+b+' см, если ширину увеличить на '+e+' см?',
    S(M(V(a),A(V(b),V(e))),M(V(a),V(b))),'Старая площадь: '+a+' · '+b+' = '+area+' см². Новая ширина: '+b+' + '+e+' = '+(b+e)+' см; новая площадь: '+a+' · '+(b+e)+' = '+(a*(b+e))+' см². Прирост: '+(a*(b+e))+' − '+area+' = '+(a*e)+' см².',4]
  ];
  else cases=[
   ['Из прямоугольника '+a+'×'+b+' см вырезали два непересекающихся прямоугольника '+short+'×1 см и 1×'+smallWidth+' см. Сколько см² осталось?',
    S(S(M(V(a),V(b)),V(short)),V(smallWidth)),'Общая площадь '+a+' · '+b+' = '+area+' см². Первый вырез: '+short+' · 1 = '+short+' см². Второй вырез: 1 · '+smallWidth+' = '+smallWidth+' см². Так как вырезы не пересекаются, осталось: '+area+' − '+short+' − '+smallWidth+' = '+(area-short-smallWidth)+' см².',4],
   ['У прямоугольника '+a+'×'+b+' см длину увеличили на '+c+' см, ширину — на '+e+' см. На сколько выросла площадь?',
    S(M(A(V(a),V(c)),A(V(b),V(e))),M(V(a),V(b))),'Исходная площадь: '+a+' · '+b+' = '+area+' см². Новые размеры: '+(a+c)+' см и '+(b+e)+' см; новая площадь '+(a+c)+' · '+(b+e)+' = '+((a+c)*(b+e))+' см². Разность: '+((a+c)*(b+e))+' − '+area+' = '+((a+c)*(b+e)-area)+' см².',5],
   ['Два независимых прямоугольника имеют размеры '+a+'×'+b+' см и '+c+'×'+e+' см. На сколько см² различаются их площади?',
    Abs(M(V(a),V(b)),M(V(c),V(e))),'Первый прямоугольник: '+a+' · '+b+' = '+area+' см². Второй: '+c+' · '+e+' = '+(c*e)+' см². Абсолютная разность: |'+area+' − '+(c*e)+'| = '+Math.abs(area-c*e)+' см².',4],
   ['Площадь прямоугольника '+area+' см², ширина '+b+' см. Длину увеличили на '+c+' см и ширину на '+e+' см. Какова новая площадь?',
    M(A(D(V(area),V(b)),V(c)),A(V(b),V(e))),'Исходная длина: '+area+' : '+b+' = '+a+' см. Новая длина '+a+' + '+c+' = '+(a+c)+' см. Новая ширина '+b+' + '+e+' = '+(b+e)+' см. Площадь: '+(a+c)+' · '+(b+e)+' = '+((a+c)*(b+e))+' см².',5],
   ['Прямоугольник шириной '+a+' см и высотой '+b+' см разделили вертикальным разрезом на две части. Ширина первой части '+short+' см. Найди абсолютную разность площадей двух частей в см².',
    Abs(M(V(short),V(b)),M(S(V(a),V(short)),V(b))),'Вторая ширина: '+a+' − '+short+' = '+(a-short)+' см. Первая площадь: '+short+' · '+b+' = '+(short*b)+' см². Вторая площадь: '+(a-short)+' · '+b+' = '+((a-short)*b)+' см². Абсолютная разность: |'+(short*b)+' − '+((a-short)*b)+'| = '+Math.abs((2*short-a)*b)+' см².',5]
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
 const explanation=kind==='symbol'?data.explain+' '+symbolProof(data.plan,computed):data.explain;
 const q=g5q(data.text,options,kind==='symbol'?'ok':String(computed),explanation+' Ответ: '+answer+'.',key);
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
