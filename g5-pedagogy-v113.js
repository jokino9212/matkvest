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
function g5AngleSketch(degrees){
 const rad=degrees*Math.PI/180,cx=210,cy=177,r=115,ar=46;
 const endX=(cx+r*Math.cos(rad)).toFixed(2),endY=(cy-r*Math.sin(rad)).toFixed(2);
 const arcX=(cx+ar*Math.cos(rad)).toFixed(2),arcY=(cy-ar*Math.sin(rad)).toFixed(2);
 const labelX=(cx+73*Math.cos(rad/2)).toFixed(2),labelY=(cy-73*Math.sin(rad/2)-6).toFixed(2);
 return '<div style="width:100%;max-width:450px;overflow:hidden;margin:6px auto"><svg role="img" aria-label="Чертёж угла '+degrees+' градусов" viewBox="0 0 420 225" width="100%" style="height:auto"><line x1="'+cx+'" y1="'+cy+'" x2="345" y2="'+cy+'" stroke="#35629b" stroke-width="3"/><line x1="'+cx+'" y1="'+cy+'" x2="'+endX+'" y2="'+endY+'" stroke="#35629b" stroke-width="3"/><path d="M '+(cx+ar)+' '+cy+' A '+ar+' '+ar+' 0 0 0 '+arcX+' '+arcY+'" fill="none" stroke="#e07d37" stroke-width="3"/><circle cx="'+cx+'" cy="'+cy+'" r="4" fill="#35629b"/><text x="'+labelX+'" y="'+labelY+'" text-anchor="middle" font-size="21" fill="currentColor">'+degrees+'°</text></svg></div>';
}
function g5RightTriangleSketch(){
 return '<div style="max-width:450px;width:100%;overflow:hidden;margin:6px auto"><svg role="img" aria-label="Чертёжный треугольник с обозначением прямого угла" viewBox="0 0 420 225" width="100%" style="height:auto"><path d="M 105 178 L 105 34 L 320 178 Z" fill="#d4e9fb" stroke="#35629b" stroke-width="3"/><path d="M 105 157 L 126 157 L 126 178" fill="none" stroke="#d97735" stroke-width="3"/><circle cx="105" cy="178" r="3" fill="#35629b"/></svg></div>';
}
function g5RightSplitSketch(degrees){
 const theta=degrees*Math.PI/180,cx=165,cy=175;
 const x=(cx+120*Math.cos(theta)).toFixed(2),y=(cy-120*Math.sin(theta)).toFixed(2);
 return '<div style="max-width:420px;width:100%;overflow:hidden;margin:6px auto"><svg role="img" aria-label="Прямой угол разделён на '+degrees+' градусов и неизвестный угол x" viewBox="0 0 420 220" width="100%" style="height:auto"><path d="M '+cx+' 40 L '+cx+' '+cy+' L 315 '+cy+'" fill="none" stroke="#35629b" stroke-width="3"/><line x1="'+cx+'" y1="'+cy+'" x2="'+x+'" y2="'+y+'" stroke="#de7e35" stroke-width="3"/><path d="M '+cx+' 157 L 183 157 L 183 '+cy+'" fill="none" stroke="#35629b" stroke-width="2"/><text x="255" y="134" font-size="19" fill="currentColor">'+degrees+'°</text><text x="180" y="76" font-size="22" fill="currentColor">x°</text></svg></div>';
}
function angles(p,t){
 const a=ri5(20,67),b=ri5(15,45),c=ri5(12,36);
 if(t===0){
  if(p===0)return choice('Как называется изображённый угол?'+g5AngleSketch(a),'Острый',['Прямой','Тупой','Развёрнутый'],'Угол '+a+'° меньше 90°. Он острый.','angle_classify_acute');
  if(p===1)return choice('Как называется изображённый угол?'+g5AngleSketch(a+90),'Тупой',['Острый','Прямой','Развёрнутый'],'Между 90° и 180° — тупой угол.','angle_classify_obtuse');
  if(p===2)return number('Сколько градусов не хватает углу '+a+'° до прямого?',90-a,'Прямой угол равен 90°, значит 90 − '+a+' = '+(90-a)+'°.','angle_right_gap',1,[a,180-a]);
  if(p===3)return number('Сколько градусов не хватает углу '+(a+90)+'° до развёрнутого?',90-a,'Развёрнутый угол 180°; 180 − '+(a+90)+' = '+(90-a)+'°.','angle_straight_gap',1,[a,180-a]);
  return choice('Какой угол отмечен на чертёжном треугольнике?'+g5RightTriangleSketch(),'Прямой',['Развёрнутый','Тупой','Полный'],'У чертёжного треугольника есть прямой угол 90°.','angle_square');
 }
 if(t===1){
  if(p===0)return number('Угол составили из двух частей '+a+'° и '+b+'°, затем увеличили на '+c+'°. Чему равен новый угол?',a+b+c,'Сначала '+a+' + '+b+' = '+(a+b)+'°, затем '+(a+b)+' + '+c+' = '+(a+b+c)+'°.','angle_sum_parts',2,[a+b,a+c]);
  if(p===1)return number('Прямой угол на рисунке разделили на '+a+'° и x°. Найди x и прибавь к нему '+c+'°.'+g5RightSplitSketch(a),90-a+c,'Недостающая часть 90 − '+a+' = '+(90-a)+'°. Затем прибавим '+c+'° и получим '+(90-a+c)+'°.','angle_missing_right',2,[a,90-a]);
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
natural_compare:'Сначала сравни количество цифр в двух натуральных числах. Если оно одинаковое, сравнивай разряды слева направо до первого различия. Используй знаки <, >, =. Порядок по возрастанию — от меньшего числа к большему, по убыванию — наоборот. Между натуральными числами a и b при a < b находится b − a − 1 натуральных чисел, если границы исключены. В четырёхзначном числе ноль не может стоять первым. Для задач с неизвестной цифрой проверь оба строгих неравенства по разрядам.',
cuboid:'Начальный уровень: грани, рёбра, вершины и одна грань. Средний: площадь пар граней, сумма рёбер, объём и неизвестное измерение. Сложный: боковая поверхность, обратные задачи, изменение объёма и составные расчёты.',
calculator:'Начальный уровень: простые действия с калькулятором. Средний: два последовательных действия, скобки и поиск ошибки. Сложный: многошаговые вычисления, порядок действий и восстановление неизвестного числа.',
angle_types:'Начальный уровень: виды углов и дополнение до прямого или развёрнутого. Средний: части угла, смежные углы и полный угол вокруг точки. Сложный: задачи с несколькими частями и несколькими действиями.'
};
g5Lesson=function(id){return Object.prototype.hasOwnProperty.call(improved,id)?improved[id]:oldLesson(id)};
window.mkG5V113Tiered=IDS.slice();
})();