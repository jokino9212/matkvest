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
 q.mk5Audit={type:'numeric',expected:value,level:stage()};
 q.mk5Pedagogy={stage:stage(),steps,family:name,expected:value};
 return q;
}
function choice(text,correct,distractors,why,name,steps=1){
 const distinct=[...new Set([correct,...distractors])];
 if(distinct.length<3)throw Error('v113 duplicate alternatives '+name);
 const q=g5q(text,distinct.map((label,i)=>({key:i===0?'ok':'no'+i,label})), 'ok',why,name);
 q.mk5Audit={type:'choice',expected:correct,level:stage()};
 q.mk5Pedagogy={stage:stage(),steps,family:name,expected:correct};
 return q;
}
const rand=(a,b)=>ri5(a,b);
function cmpPlaceTable(x,y){
 const digits=Math.max(String(x).length,String(y).length),head=['Тысячи','Сотни','Десятки','Единицы'].slice(4-digits);
 const columns=head.map(label=>'<th scope="col" style="padding:6px;border:1px solid #7795b3">'+label+'</th>').join('');
 const row=(name,n)=>'<tr><th scope="row" style="padding:6px;border:1px solid #7795b3">'+name+'</th>'+
  String(n).padStart(digits,'0').split('').map(d=>'<td style="padding:6px;border:1px solid #7795b3;font-weight:600">'+d+'</td>').join('')+'</tr>';
 return '<div class="mk-g5-comparison-table" style="width:100%;max-width:590px;overflow-x:auto;margin:7px auto"><table style="width:100%;border-collapse:collapse;text-align:center"><caption style="text-align:left;padding:4px 0">Разряды двух натуральных чисел</caption><thead><tr><th scope="col" style="padding:6px;border:1px solid #7795b3">Число</th>'+columns+'</tr></thead><tbody>'+row('Первое',x)+row('Второе',y)+'</tbody></table></div>';
}
function cmpQuestion(t,p,text,answer,ex,steps,wrong=[]){
 const id='v141_natural_compare_L'+t+'_F'+p;
 const isSign=typeof answer==='string',q=isSign?choice(text,answer,['<','>','='],ex,id,steps):number(text,answer,ex,id,steps,wrong);
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

function compare(p,t){return compareNatural(t,p);}
function cuboidDiagram(){
 const edges=[
  [72,88,284,88],[284,88,284,211],[284,211,72,211],[72,211,72,88],
  [72,88,134,39],[284,88,346,39],[284,211,346,162],
  [134,39,346,39],[346,39,346,162]
 ];
 const hidden=[[72,211,134,162],[134,162,346,162],[134,162,134,39]];
 const line=(v,dashed)=>'<line x1="'+v[0]+'" y1="'+v[1]+'" x2="'+v[2]+'" y2="'+v[3]+'" stroke="#396a9f" stroke-width="2.8" '+(dashed?'stroke-dasharray="7 6" opacity=".72"':'')+'/>';
 const vertices=[['A',72,88,-15,-8],['B',284,88,5,-8],['C',284,211,6,18],['D',72,211,-16,18],
  ['E',134,39,-13,-9],['F',346,39,7,-9],['G',346,162,8,18],['H',134,162,-17,17]];
 return '<div class="mk-g5-cuboid-diagram" style="width:100%;max-width:470px;overflow:hidden;margin:8px auto">'
  +'<svg role="img" aria-label="Прямоугольный параллелепипед с восемью обозначенными вершинами A, B, C, D, E, F, G, H; скрытые рёбра пунктиром" viewBox="0 0 420 250" width="100%" style="display:block;height:auto">'
  +'<polygon points="72,88 134,39 346,39 284,88" fill="#cde9fd" fill-opacity=".74"/>'
  +'<polygon points="284,88 346,39 346,162 284,211" fill="#b6d5ee" fill-opacity=".58"/>'
  +'<polygon points="72,88 284,88 284,211 72,211" fill="#e5f1fa" fill-opacity=".85"/>'
  +hidden.map(v=>line(v,true)).join('')+edges.map(v=>line(v,false)).join('')
  +vertices.map(v=>'<circle cx="'+v[1]+'" cy="'+v[2]+'" r="3.8" fill="#245c8c"/>'
   +'<text x="'+(v[1]+v[3])+'" y="'+(v[2]+v[4])+'" fill="currentColor" font-size="17" font-weight="700">'+v[0]+'</text>').join('')
  +'</svg></div>';
}
function cuboidNetDiagram(){
 const R=(x,y,w,h,label)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="2" fill="#dbeefa" stroke="#356da5" stroke-width="2.6"/>'
  +'<text x="'+(x+w/2)+'" y="'+(y+h/2+6)+'" text-anchor="middle" fill="#244e78" font-size="18">'+label+'</text>';
 return '<div class="mk-g5-cuboid-net" style="width:100%;max-width:540px;overflow:hidden;margin:8px auto">'
  +'<svg role="img" aria-label="Корректная развёртка прямоугольного параллелепипеда: две грани a×b, две a×c и две b×c" viewBox="0 0 510 310" width="100%" style="display:block;height:auto">'
  +R(190,90,122,68,'a×b')+R(190,35,122,55,'a×c')+R(190,158,122,55,'a×c')
  +R(135,90,55,68,'b×c')+R(312,90,55,68,'b×c')+R(190,213,122,68,'a×b')
  +'</svg></div>';
}
function box(p,t){
 // §23 geometry only: count faces/edges/vertices, read the model, reason
 // about its nets and exposed faces. No cube counting or volume (reserved §24).
 const a=ri5(5,18+5*t),b=ri5(4,15+4*t),c=ri5(3,13+3*t),d=ri5(2,8+2*t),n=ri5(2,22+3*t);
 const S=2*(a*b+a*c+b*c),P=4*(a+b+c),pic=cuboidDiagram(),net=cuboidNetDiagram();
 const family='cuboid_v159_L'+t+'_F'+p;
 function task(text,answer,ex,steps,wrong=[],drawing=pic){
  const q=number(text+drawing,answer,ex+' Ответ: '+answer+'.',family,steps,wrong);
  q.mk5Pedagogy={id:'cuboid',stage:t,family:p,steps,expected:answer,fig:drawing===net?'net':'cuboid'};
  return q;
 }
 if(t===0){
  if(p===0)return task('В школьном кабинете '+n+' отдельных макетов прямоугольного параллелепипеда. Сколько граней у всех макетов?',6*n,'У каждого макета 6 граней. '+n+' · 6 = '+6*n+' граней.',1,[6,8*n]);
  if(p===1)return task('На выставке '+n+' отдельных прямоугольных параллелепипедов. Сколько всего вершин?',8*n,'У каждого 8 вершин. '+n+' · 8 = '+8*n+' вершин.',1,[6*n,12*n]);
  if(p===2)return task('Одна прямоугольная грань коробки имеет длину '+a+' см и ширину '+b+' см. Найди её площадь в см².',a*b,'Грань — прямоугольник. '+a+' · '+b+' = '+a*b+' см².',2,[a+b,2*a*b]);
  if(p===3)return task('У '+n+' отдельных коробок одинаковая форма прямоугольного параллелепипеда. Сколько всего рёбер длины '+c+' см, если это одно из трёх разных измерений?',4*n,'У каждого такого параллелепипеда 4 параллельных ребра заданной длины. '+n+' · 4 = '+4*n+' ребра.',2,[12*n,8*n]);
  return task('У коробки две противоположные грани размером '+a+' × '+c+' см каждая. Найди их общую площадь в см².',2*a*c,'Одна грань: '+a+' · '+c+' = '+a*c+' см². Две: '+a*c+' · 2 = '+2*a*c+' см².',2,[a*c,2*(a+c)]);
 }
 if(t===1){
  if(p===0)return task('Коробка имеет три разных измерения: '+a+' см, '+b+' см и '+c+' см. Найди сумму длин всех 12 рёбер в см.',P,'Рёбер каждой длины по 4. '+a+' + '+b+' + '+c+' = '+(a+b+c)+' см; 4 · '+(a+b+c)+' = '+P+' см.',3,[a+b+c,S]);
  if(p===1)return task('У прямоугольного параллелепипеда измерения '+a+' × '+b+' × '+c+' см. Сколько см² составляют три грани, сходящиеся в одной вершине?',a*b+a*c+b*c,'Их площади: '+a+' · '+b+' = '+a*b+'; '+a+' · '+c+' = '+a*c+'; '+b+' · '+c+' = '+b*c+'. Всего '+a*b+' + '+a*c+' + '+b*c+' = '+(a*b+a*c+b*c)+' см².',3,[a*b+a*c,S]);
  if(p===2)return task('Развёртка закрытой коробки размером '+a+' × '+b+' × '+c+' см состоит из шести прямоугольников. Сколько см² картона нужно без клапанов?',S,'Две грани: '+a+' · '+b+' = '+a*b+' см² каждая; две: '+a+' · '+c+' = '+a*c+' см²; ещё две: '+b+' · '+c+' = '+b*c+' см². Итого 2 · ('+a*b+' + '+a*c+' + '+b*c+') = '+S+' см².',4,[a*b+a*c+b*c,P],net);
  if(p===3)return task('Периметр передней прямоугольной грани со сторонами '+a+' см и '+b+' см. Найди его в см.',2*(a+b),'Передняя грань — прямоугольник. '+a+' + '+b+' = '+(a+b)+' см; 2 · '+(a+b)+' = '+2*(a+b)+' см.',2,[a*b,a+b]);
  return task('На верхней и нижней гранях коробки длина '+a+' см, ширина '+b+' см. Найди общую длину восьми рёбер по их периметрам в см.',4*(a+b),'На каждой грани по два ребра длиной '+a+' и '+b+' см. Два периметра: 4 · ('+a+' + '+b+') = '+4*(a+b)+' см.',3,[2*(a+b),P]);
 }
 if(p===0)return task('Сумма длин всех 12 рёбер прямоугольного параллелепипеда '+P+' см. Длина '+a+' см, ширина '+b+' см. Найди третье измерение в см.',c,'Разделим сумму рёбер на 4: '+P+' : 4 = '+(a+b+c)+' см. Вычтем '+a+' и '+b+': '+(a+b+c)+' − '+a+' − '+b+' = '+c+' см.',4,[a,b,P]);
 if(p===1)return task('Площадь всех шести граней закрытой коробки '+S+' см². Длина '+a+' см, ширина '+b+' см. Найди высоту в см.',c,'Половина площади: '+S+' : 2 = '+(S/2)+' см². Площадь пары измерений '+a+' · '+b+' = '+a*b+' см². Осталось '+(S/2)+' − '+a*b+' = '+(c*(a+b))+' см². Делим на сумму '+a+' + '+b+' = '+(a+b)+' см: '+c*(a+b)+' : '+(a+b)+' = '+c+' см.',5,[a,b,S]);
 if(p===2)return task('У закрытой коробки размеры '+a+' × '+b+' × '+c+' см. Убрали верхнюю грань '+a+' × '+b+' см. Найди площадь пяти оставшихся граней в см².',S-a*b,'Все шесть: 2 · ('+a*b+' + '+a*c+' + '+b*c+') = '+S+' см². Верхняя грань '+a+' · '+b+' = '+a*b+' см². Остаётся '+S+' − '+a*b+' = '+(S-a*b)+' см².',5,[S,a*b],net);
 if(p===3)return task('Размеры закрытой коробки '+a+' × '+b+' × '+c+' см. Длину '+a+' см увеличили на '+d+' см. На сколько см² выросла общая площадь шести граней?',2*d*(b+c),'Новые дополнительные полосы на двух парах граней: 2 · '+d+' · '+b+' = '+2*d*b+' см² и 2 · '+d+' · '+c+' = '+2*d*c+' см². Всего '+2*d*b+' + '+2*d*c+' = '+2*d*(b+c)+' см².',4,[d*(b+c),S]);
 return task('Две одинаковые закрытые коробки размером '+a+' × '+b+' × '+c+' см склеили гранями '+a+' × '+b+' см. Найди общую наружную площадь в см².',2*S-2*a*b,'Площадь одной коробки: 2 · ('+a*b+' + '+a*c+' + '+b*c+') = '+S+' см². У двух '+(2*S)+' см². Две склеенные грани по '+a*b+' см² стали внутренними, поэтому '+(2*S)+' − 2 · '+a*b+' = '+(2*S-2*a*b)+' см².',5,[2*S,S]);
}
function calc(p,t){
 const a=ri5(120,950+t*150),b=ri5(35,290),c=ri5(12,39),d=ri5(5,29);
 const plus=(x,y)=>x+' + '+y+' = '+(x+y),minus=(x,y)=>x+' − '+y+' = '+(x-y);
 const times=(x,y)=>x+' · '+y+' = '+(x*y),div=(x,y)=>x+' : '+y+' = '+(x/y);
 function keys(...items){
  return '<div class="g5-calculator-keys" role="group" aria-label="Клавиши по порядку" style="display:flex;flex-wrap:wrap;gap:.35em;margin:.6em 0">'+
   items.map(key=>'<kbd style="min-width:1.8em;padding:.3em;border:1px solid #638582;border-radius:.3em;text-align:center">'+key+'</kbd>').join('')+'</div>';
 }
 const task=(text,answer,solution,steps)=>number(text,answer,solution+' Ответ: '+answer+'.','calc_L'+t+'_F'+p,steps,[answer+1,answer+10,answer+100]);
 if(t===0){
  if(p===0)return task('Что покажет калькулятор?'+keys(a,'+',b,'='),a+b,'Нажми цифры первого числа, затем «+», второе число и «=»: '+plus(a,b)+'.',1);
  if(p===1)return task('Что покажет калькулятор?'+keys(a+b,'−',b,'='),a,'Клавиша «−» вычитает второе число: '+minus(a+b,b)+'.',1);
  if(p===2)return task('Что покажет калькулятор?'+keys(b,'×',c,'='),b*c,'«×» означает умножение: '+times(b,c)+'.',1);
  if(p===3)return task('Что покажет калькулятор?'+keys(b*c,'÷',c,'='),b,'«÷» означает деление: '+div(b*c,c)+'.',1);
  return task('Какое число будет на экране после сброса и ввода?'+keys(a,'AC',b,'+',d,'='),b+d,
   'AC очищает введённое число. После сброса вводим '+b+' и прибавляем '+d+': '+plus(b,d)+'.',2);
 }
 if(t===1){
  if(p===0)return task('На калькуляторе сложи '+a+' и '+b+'. Затем умножь полученную сумму на '+c+'. Какое число получится?',(a+b)*c,
   'Набираем '+a+' + '+b+' и нажимаем «=»: '+plus(a,b)+'. Умножаем показанный результат: '+times(a+b,c)+'.',2);
  if(p===1)return task('На экране '+a+'. Нажали следующие клавиши. Что получится?'+keys('+',b,'=','−',d,'='),a+b-d,
   'После первого «=»: '+plus(a,b)+'. После второго: '+minus(a+b,d)+'.',2);
  if(p===2){
   const wrong=b+ri5(1,9);
   return task('На калькуляторе набрали '+a+' + '+wrong+' вместо '+a+' + '+b+'. На сколько показание больше верного результата?',wrong-b,
    'Неверный ввод: '+plus(a,wrong)+'. Правильный: '+plus(a,b)+'. Разница: '+minus(a+wrong,a+b)+'.',3);
  }
  if(p===3)return task('Вычисли на калькуляторе ('+b*c+' − '+b+') : '+b+'. Для скобок сначала получи промежуточное показание.',c-1,
   'Сначала '+minus(b*c,b)+'. Затем '+div(b*(c-1),b)+'.',2);
  return task('Калькулятор запомнил число '+a+'. Прибавь к нему '+b+' и затем прибавь исходное запомненное число. Что получится?',2*a+b,
   'Сначала '+plus(a,b)+'. Прибавляем исходное число: '+plus(a+b,a)+'.',2);
 }
 if(p===0)return task('На калькуляторе последовательно вычисли ('+a+' + '+b+') · '+c+' − '+d+'.',(a+b)*c-d,
  'Сначала '+plus(a,b)+', затем '+times(a+b,c)+', в конце '+minus((a+b)*c,d)+'.',3);
 if(p===1)return task('Вычисли на калькуляторе '+a+' · '+c+' и '+b+' · '+c+'. Сложи два показания и вычти '+d+'.',(a+b)*c-d,
  'Отдельно '+times(a,c)+' и '+times(b,c)+'. Сумма: '+plus(a*c,b*c)+'. Вычитаем: '+minus((a+b)*c,d)+'.',4);
 if(p===2)return task('Начальное число неизвестно. На калькуляторе прибавили '+b+', нажали «=», умножили на '+c+' и получили '+(a+b)*c+'. Найди исходное число.',a,
  'Отменяем умножение: '+div((a+b)*c,c)+'. Отменяем сложение: '+minus(a+b,b)+'. Проверка: '+times(a+b,c)+'.',3);
 if(p===3)return task('На калькуляторе вычисли два выражения: '+a+' · '+(c+1)+' + '+b+' и '+a+' · '+c+' + '+b+' − '+d+'. На сколько первое значение больше второго?',a+d,
  'Первое произведение: '+times(a,c)+'. Затем '+plus(a*c,b)+' и '+minus(a*c+b,d)+'. Второе: '+times(a,c+1)+', затем '+plus(a*(c+1),b)+'. Разница: '+minus(a*(c+1)+b,a*c+b-d)+'.',5);
 return task('На экране '+a+'. Выполни последовательность. Что покажет калькулятор?'+keys('+',b,'=','×',c,'=','−',d,'='),(a+b)*c-d,
  'Первое показание: '+plus(a,b)+'. Второе: '+times(a+b,c)+'. Последнее: '+minus((a+b)*c,d)+'.',3);
}
function g5AngleSketch(degrees){
 const rad=degrees*Math.PI/180,cx=210,cy=177,r=115,ar=46;
 const endX=(cx+r*Math.cos(rad)).toFixed(2),endY=(cy-r*Math.sin(rad)).toFixed(2);
 const arcX=(cx+ar*Math.cos(rad)).toFixed(2),arcY=(cy-ar*Math.sin(rad)).toFixed(2);
 const labelX=(cx+73*Math.cos(rad/2)).toFixed(2),labelY=(cy-73*Math.sin(rad/2)-6).toFixed(2);
 return '<div style="width:100%;max-width:450px;overflow:hidden;margin:6px auto"><svg role="img" aria-label="Чертёж угла '+degrees+' градусов" viewBox="0 0 420 225" width="100%" style="height:auto"><line x1="'+cx+'" y1="'+cy+'" x2="345" y2="'+cy+'" stroke="#35629b" stroke-width="3"/><line x1="'+cx+'" y1="'+cy+'" x2="'+endX+'" y2="'+endY+'" stroke="#35629b" stroke-width="3"/><path d="M '+(cx+ar)+' '+cy+' A '+ar+' '+ar+' 0 0 0 '+arcX+' '+arcY+'" fill="none" stroke="#e07d37" stroke-width="3"/><circle cx="'+cx+'" cy="'+cy+'" r="4" fill="#35629b"/><text x="'+labelX+'" y="'+labelY+'" text-anchor="middle" font-size="21" fill="currentColor">'+degrees+'°</text></svg></div>';
}
function g5RightTriangleSketch(height,width,mirror){
 const x=mirror?285:105,y=170,direction=mirror?-1:1,end=x+direction*width;
 const vertices=x+' '+y+' '+x+' '+(y-height)+' '+end+' '+y;
 return '<div style="max-width:450px;width:100%;margin:6px auto"><svg role="img" aria-label="Чертёжный треугольник. Один угол отмечен маленьким квадратом." viewBox="0 0 420 205" width="100%" style="height:auto"><polygon points="'+vertices+'" fill="#d4e9fb" stroke="#35629b" stroke-width="3"/><polyline class="g5-right-mark" points="'+x+' '+(y-19)+' '+(x+direction*19)+' '+(y-19)+' '+(x+direction*19)+' '+y+'" fill="none" stroke="#ad552c" stroke-width="3"/></svg></div>';
}
function g5RightSplitSketch(degrees){
 const theta=degrees*Math.PI/180,cx=165,cy=175;
 const x=(cx+120*Math.cos(theta)).toFixed(2),y=(cy-120*Math.sin(theta)).toFixed(2);
 const label=angle=>[(cx+91*Math.cos(angle*Math.PI/180)).toFixed(2),(cy-91*Math.sin(angle*Math.PI/180)).toFixed(2)];
 const [givenX,givenY]=label(degrees/2),[unknownX,unknownY]=label((degrees+90)/2);
 return '<div style="max-width:420px;width:100%;overflow:hidden;margin:6px auto"><svg role="img" aria-label="Прямой угол разделён на '+degrees+' градусов и неизвестный угол x" viewBox="0 0 420 220" width="100%" style="height:auto"><path d="M '+cx+' 40 L '+cx+' '+cy+' L 315 '+cy+'" fill="none" stroke="#35629b" stroke-width="3"/><line x1="'+cx+'" y1="'+cy+'" x2="'+x+'" y2="'+y+'" stroke="#de7e35" stroke-width="3"/><path d="M '+cx+' 157 L 183 157 L 183 '+cy+'" fill="none" stroke="#35629b" stroke-width="2"/><text x="'+givenX+'" y="'+givenY+'" text-anchor="middle" font-size="17" fill="currentColor">'+degrees+'°</text><text x="'+unknownX+'" y="'+unknownY+'" text-anchor="middle" font-size="17" fill="currentColor">x°</text></svg></div>';
}
function angles(p,t){
 const acute=ri5(16,78),obtuse=ri5(102,166),first=ri5(13,38),second=ri5(41,72),extra=ri5(3,15);
 const type=value=>value<90?'Острый':value===90?'Прямой':value<180?'Тупой':'Развёрнутый';
 const all=['Острый','Прямой','Тупой','Развёрнутый'];
 const numeric=(text,answer,why,steps)=>number(text,answer,why+' Ответ: '+answer+'.','angle_L'+t+'_F'+p,steps,[answer+1,answer+10,answer+20]);
 const classify=(text,value,why,steps)=>choice(text,type(value),all.filter(item=>item!==type(value)),why+' Ответ: '+type(value)+'.','angle_L'+t+'_F'+p,steps);
 const sum=(a,b)=>a+' + '+b+' = '+(a+b),diff=(a,b)=>a+' − '+b+' = '+(a-b);
 if(t===0){
  if(p===0)return classify('Как называется изображённый угол?'+g5AngleSketch(acute),acute,'На рисунке '+acute+'°. Это меньше 90°.',1);
  if(p===1)return classify('Как называется угол на втором рисунке?'+g5AngleSketch(acute)+g5AngleSketch(obtuse),obtuse,'На втором рисунке '+obtuse+'°. Это больше 90° и меньше 180°.',1);
  if(p===2){
   const variants=[acute,obtuse,90,180],value=variants[ri5(0,3)];
   return classify('Как называется угол '+value+'°?',value,'Сравниваем '+value+'° с прямым углом 90° и развёрнутым 180°.',1);
  }
  if(p===3)return numeric('Сколько градусов не хватает углу '+acute+'° до прямого?',90-acute,'Прямой угол равен 90°. Находим недостающую часть: '+diff(90,acute)+'°.',1);
  return classify('Какой угол отмечен квадратом на чертёжном треугольнике?'+g5RightTriangleSketch(ri5(78,132),ri5(90,155),ri5(0,1)),90,'Маленьким квадратом обозначают прямой угол. У чертёжного треугольника он равен 90°.',1);
 }
 if(t===1){
  if(p===0)return classify('Сложили углы '+first+'° и '+second+'°. Какого вида получился угол?',first+second,'Складываем меры: '+sum(first,second)+'°. Сравниваем с 90°.',2);
  if(p===1)return numeric('Прямой угол на рисунке разделили на '+acute+'° и x°. Найди x и прибавь к нему '+extra+'°.'+g5RightSplitSketch(acute),90-acute+extra,
   'Недостающая часть: '+diff(90,acute)+'°. Затем прибавляем: '+sum(90-acute,extra)+'°.',2);
  if(p===2)return classify('От тупого угла '+obtuse+'° отрезали угол '+first+'°. Какого вида оставшийся угол?',obtuse-first,'Находим остаток: '+diff(obtuse,first)+'°. Сравниваем его с 90°.',2);
  if(p===3)return numeric('Развёрнутый угол разделили на '+obtuse+'° и второй угол. На сколько градусов второму углу не хватает до прямого?',obtuse-90,
   'Второй угол: '+diff(180,obtuse)+'°. До прямого не хватает '+diff(90,180-obtuse)+'°.',2);
  const mixed=first+second,values=[first,second,mixed,obtuse,90];
  return numeric('Сколько из углов '+values.map(value=>value+'°').join('; ')+' меньше прямого?',values.filter(value=>value<90).length,
   'Меньше 90°: '+values.filter(value=>value<90).map(value=>value+'°').join('; ')+'.',2);
 }
 if(p===0)return classify('Прямой угол разделили на '+acute+'° и оставшуюся часть. К оставшейся части прибавили угол '+second+'°. Какого вида итоговый угол?',90-acute+second,
  'Остаток: '+diff(90,acute)+'°. Затем '+sum(90-acute,second)+'°. Сравниваем с 90° и 180°.',3);
 if(p===1)return numeric('Развёрнутый угол разделили на '+first+'°, '+second+'° и x°. На сколько градусов x отличается от прямого?',Math.abs(90-first-second),
  'Две части: '+sum(first,second)+'°. Третья: '+diff(180,first+second)+'°. Разница с прямым: '+diff(Math.max(180-first-second,90),Math.min(180-first-second,90))+'°.',3);
 if(p===2){
  const maximum=89-second;
  return numeric('Какой наибольший целый угол в градусах можно добавить к '+second+'°, чтобы сумма осталась острым углом?',maximum,
   'Наибольшая целая мера острого угла — 89°. Находим добавку: '+diff(89,second)+'°. Проверка: '+sum(second,maximum)+'°.',3);
 }
 if(p===3)return classify('К прямому углу прибавили '+first+'°, а затем вычли '+extra+'°. Какого вида получился угол?',90+first-extra,
  'После прибавления: '+sum(90,first)+'°. После вычитания: '+diff(90+first,extra)+'°. Сравним с 90°.',3);
 const measures=[acute,obtuse,90+extra,180-obtuse,first+second];
 return numeric('Сколько из углов '+measures.map(value=>value+'°').join('; ')+' являются тупыми?',measures.filter(value=>value>90&&value<180).length,
  'Тупые углы больше 90° и меньше 180°. Условие выполняют '+measures.filter(value=>value>90&&value<180).map(value=>value+'°').join('; ')+'.',3);
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
natural_compare:'Сначала сравни количество цифр в двух натуральных числах. Если оно одинаковое, сравнивай разряды слева направо до первого различия. Используй знаки <, >, =. Порядок по возрастанию — от меньшего числа к большему, по убыванию — наоборот. Между натуральными числами a и b при a < b находится b − a − 1 натуральных чисел, если границы исключены. В четырёхзначном числе ноль не может стоять первым. Для задач с неизвестной цифрой проверь оба строгих неравенства по разрядам.',
cuboid:'Прямоугольный параллелепипед — объёмная геометрическая фигура с шестью прямоугольными гранями, двенадцатью рёбрами и восемью вершинами. Противоположные грани равны и параллельны. Каждая из трёх длин a, b, c встречается ровно на четырёх рёбрах, поэтому сумма длин всех рёбер равна 4(a + b + c). Площади трёх типов граней — ab, ac и bc, каждая встречается дважды: площадь всех шести граней S = 2(ab + ac + bc). Развёртка должна содержать шесть прямоугольников: две грани a×b, две a×c, две b×c, которые можно сложить в коробку. Например, для a = 6 см, b = 4 см, c = 3 см сумма рёбер 4 · (6 + 4 + 3) = 52 см, площадь шести граней 2 · (24 + 18 + 12) = 108 см². Если убрали крышку a×b, вычти ab из полной площади. Если два тела склеены по одной грани, обе соприкасающиеся грани становятся внутренними: их площади нужно вычесть. Объём и кубические единицы изучаются в следующем параграфе.',
calculator:'Набери первое число, нажми клавишу действия, набери второе число и нажми «=». Клавиши «×» и «÷» обозначают умножение и деление. Клавиша AC очищает экран. Для вычисления со скобками на простом калькуляторе сначала вычисли выражение в скобках, затем продолжи с полученным числом. Например, для (12 + 8) · 4 набери 12 + 8 =, затем × 4 =. На экране будет 80.',
angle_types:'У прямого угла 90°, у развёрнутого 180°. Острый угол меньше прямого. Тупой угол больше прямого и меньше развёрнутого. Чтобы построить или проверить прямой угол, приложи к вершине прямой угол чертёжного треугольника, совместив одну его сторону со стороной угла. Если совпадёт и вторая сторона, угол прямой.'
};
g5Lesson=function(id){return Object.prototype.hasOwnProperty.call(improved,id)?improved[id]:oldLesson(id)};
window.mkG5V113Tiered=IDS.slice();
})();