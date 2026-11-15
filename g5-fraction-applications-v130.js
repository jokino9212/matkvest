/* MatKvest Grade 5 v130: 5 remaining fraction application topics,
 * 75 separate learner-facing task families with rational plans.
 */
(function(){
'use strict';
if(typeof makeG5Question!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof g5FractionChoices!=='function'||typeof frac!=='function')throw Error('v130 missing Grade 5 dependencies');
const IDS=['frac_division','frac_part_number','frac_div_common','frac_restore','frac_word'];
const covered=new Set(IDS),previous=makeG5Question;
const T=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0)),F=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const rnd=(a,b)=>ri(a,b),gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t}return a};
const Q=(n,d=1)=>['rat',n,d],ADD=(...x)=>['add',...x],SUB=(a,b)=>['sub',a,b],MUL=(a,b)=>['mul',a,b],DIV=(a,b)=>['div',a,b],ABS=x=>['abs',x];
function simplify(n,d){
 if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d<=0)throw Error('v130 invalid fraction '+n+'/'+d);
 const g=gcd(n,d)||1;return {n:n/g,d:d/g};
}
function calculate(node){
 const [op,...v]=node,E=calculate;
 if(op==='rat')return simplify(v[0],v[1]);
 if(op==='add')return v.reduce((sum,x)=>{const q=E(x);return simplify(sum.n*q.d+q.n*sum.d,sum.d*q.d)},simplify(0,1));
 if(op==='sub'){const a=E(v[0]),b=E(v[1]);return simplify(a.n*b.d-b.n*a.d,a.d*b.d)}
 if(op==='mul'){const a=E(v[0]),b=E(v[1]);return simplify(a.n*b.n,a.d*b.d)}
 if(op==='div'){const a=E(v[0]),b=E(v[1]);if(!b.n)throw Error('Division by zero');return simplify(a.n*b.d,a.d*b.n)}
 if(op==='abs'){const a=E(v[0]);return simplify(Math.abs(a.n),a.d)}
 throw Error('v130 unknown rational operation '+op);
}
function show(x){const a=calculate(x);return a.d===1?String(a.n):frac(a.n,a.d)}

function divisionSample(){
 // The first direct conversion tasks must genuinely require a fraction, not an integer.
 const d=rnd(4,14),start=rnd(2,Math.min(8,d+2));
 let n=start;
 for(let tries=0;tries<15&&gcd(n,d)!==1;tries++)n=n===8?2:n+1;
 if(gcd(n,d)!==1)throw Error('Cannot select direct fraction conversion');
 return {n,d};
}
function divisionWholePicture(n,d){
 if(!Number.isSafeInteger(n)||n<2||n>8||!Number.isSafeInteger(d)||d<3||d>14)
  throw Error('Invalid §30 sharing picture '+n+'/'+d);
 // Each horizontal strip is one intact whole divided into d equal parts.
 // One learner receives the FIRST 1/d piece from each of n wholes, totaling n/d.
 const left=90,width=480,unit=width/d,h=25,pitch=35;
 const chunks=[];
 for(let row=0;row<n;row++){
  const y=5+row*pitch;
  const cells=Array.from({length:d},(_,i)=>'<rect x="'+(left+i*unit).toFixed(3)+
   '" y="'+y+'" width="'+unit.toFixed(3)+'" height="'+h+'" fill="'+
   (i===0?'#5d9cdc':'#edf3fc')+'"/>').join('');
  const lines=Array.from({length:d-1},(_,i)=>{
   const x=(left+(i+1)*unit).toFixed(3);
   return '<line x1="'+x+'" x2="'+x+'" y1="'+y+'" y2="'+(y+h)+
    '" stroke="#52617a" stroke-width="1.2"/>';
  }).join('');
  chunks.push('<text x="4" y="'+(y+18)+'" font-size="15" fill="currentColor">Целое '+
   (row+1)+'</text>'+cells+lines+'<rect x="'+left+'" y="'+y+'" width="'+width+
   '" height="'+h+'" fill="none" stroke="#52617a" stroke-width="2"/>');
 }
 const desc=n+' одинаковых целых разделили поровну между '+d+
  ' людьми: каждое целое разрезано на '+d+
  ' равных частей; одному человеку досталось по одной части от каждого из '+n+
  ' целых. Всего его доля '+n+'/'+d+'.';
 return '<div style="width:100%;max-width:630px;overflow:hidden;margin:8px auto"><svg '+
  'class="mk-g5-division-wholes" role="img" aria-label="'+desc+'" viewBox="0 0 590 '+
  (n*pitch+5)+'" width="100%" style="display:block;height:auto" '+
  'preserveAspectRatio="xMidYMid meet">'+chunks.join('')+'</svg></div>';
}

function partOfWholePicture(part,den,whole){
 const width=390,cell=width/den;
 const cells=Array.from({length:den},(_,i)=>'<rect x="'+(5+i*cell).toFixed(3)+
  '" y="5" width="'+cell.toFixed(3)+'" height="32" fill="'+(i<part?'#397dbe':'#edf3fc')+
  '" stroke="#52617a" stroke-width=".65"/>').join('');
 return '<svg class="mk-g5-section38" role="img" aria-label="Всего '+whole+
  ' предметов. Полоса разделена на '+den+' равных частей, закрашено '+part+
  '." viewBox="0 0 400 42" width="100%" style="display:block;max-width:400px;height:auto;margin:6px auto">'+cells+'</svg>';
}

function partOfWholeSpec(t,p){
 const d=rnd(3,8+2*t),a=rnd(1,d-1),e=rnd(3,7+2*t),b=rnd(1,e-1);
 const unit=rnd(3,9+3*t),total=d*e*unit,first=total*a/d,second=total*b/e;
 const k=rnd(2,8),other=total+e*k;
 const af=frac(a,d),bf=frac(b,e);
 const portion=(whole,n,den)=>MUL(Q(whole),Q(n,den));
 const A=portion(total,a,d),B=portion(total,b,e);
 const calc=(whole,n,den)=>whole+' : '+den+' = '+whole/den+'. '+whole/den+' · '+n+' = '+whole*n/den+'.';
 const workA=calc(total,a,d),workB=calc(total,b,e);
 const task=(text,plan,explain,steps)=>({text,plan,explain,steps});
 if(t===0){
  if(p===0)return task('Найди '+af+' от числа '+total+'.'+partOfWholePicture(a,d,total),A,workA,2);
  if(p===1)return task('В школьной библиотеке '+total+' учебников. '+af+' из них новые. Сколько учебников из этого числа не новые?',SUB(Q(total),A),workA+' '+total+' − '+first+' = '+(total-first)+'.',3);
  if(p===2)return task('Разделили '+total+' яблок на '+d+' одинаковых групп. Сколько яблок в одной группе?',portion(total,1,d),total+' : '+d+' = '+total/d+'.',1);
  if(p===3)return task('Найди половину от '+(2*total)+' предметов.',portion(2*total,1,2),2*total+' : 2 = '+total+'.',1);
  return task('Сравни две части числа '+total+': '+af+' и '+frac(a+1,d)+'. На сколько предметов вторая часть больше первой?',SUB(portion(total,a+1,d),A),workA+' '+calc(total,a+1,d)+' Разность равна '+total/d+'.',3);
 }
 if(t===1){
  if(p===0)return task('Из '+total+' игрушек подарили '+af+' всех игрушек и ещё '+k+' игрушек. Сколько осталось?',SUB(SUB(Q(total),A),Q(k)),workA+' '+total+' − '+first+' = '+(total-first)+'. '+(total-first)+' − '+k+' = '+(total-first-k)+'.',4);
  if(p===1)return task('На склад поступило '+total+' книг. '+af+' книг отправили в филиал. На сколько книг различаются число отправленных и число оставшихся?',ABS(SUB(SUB(Q(total),A),A)),workA+' Осталось '+total+' − '+first+' = '+(total-first)+'. Разность большего и меньшего количества равна '+Math.abs(total-2*first)+'.',4);
  if(p===2)return task('Найди '+af+' от числа '+total+' и '+bf+' от числа '+other+'. Сложи результаты.',ADD(A,portion(other,b,e)),workA+' '+calc(other,b,e)+' '+first+' + '+other*b/e+' = '+(first+other*b/e)+'.',5);
  if(p===3){
   const remaining=total-first;
   return task('Первый день — '+af+' от '+total+' м маршрута. Во второй день прошли '+frac(1,e)+' от оставшегося пути. Сколько метров прошли во второй день?',MUL(SUB(Q(total),A),Q(1,e)),workA+' '+total+' − '+first+' = '+remaining+'. '+remaining+' : '+e+' = '+remaining/e+'.',4);
  }
  return task('У двух мастерских по '+total+' деталей. Первая использовала '+af+' своих деталей, вторая — '+bf+' своих деталей. На сколько различаются использованные количества?',ABS(SUB(A,B)),workA+' '+workB+' Разность большего и меньшего количества равна '+Math.abs(first-second)+'.',5);
 }
 if(p===0){
  const left=total-first,spent=left*b/e;
  return task('Из '+total+' л воды сначала израсходовали '+af+' всего объёма, затем '+bf+' остатка. Сколько литров осталось?',SUB(SUB(Q(total),A),MUL(SUB(Q(total),A),Q(b,e))),workA+' '+total+' − '+first+' = '+left+'. '+calc(left,b,e)+' '+left+' − '+spent+' = '+(left-spent)+'.',6);
 }
 if(p===1){
  const rest=total-first,secondPart=rest*b/e;
  return task('Было '+total+' кг крупы. В первый день продали '+af+' всей массы, во второй — '+bf+' остатка. Сколько килограммов продали за два дня?',ADD(A,MUL(SUB(Q(total),A),Q(b,e))),workA+' '+total+' − '+first+' = '+rest+'. '+calc(rest,b,e)+' '+first+' + '+secondPart+' = '+(first+secondPart)+'.',6);
 }
 if(p===2)return task('В первом рейсе было '+total+' кг груза, во втором — '+other+' кг. В первом доставили '+af+' груза, во втором — '+bf+'. Сколько килограммов груза из двух рейсов осталось доставить?',SUB(ADD(Q(total),Q(other)),ADD(A,portion(other,b,e))),workA+' '+calc(other,b,e)+' Всего было '+(total+other)+' кг. Доставили '+(first+other*b/e)+' кг. Осталось '+(total+other-first-other*b/e)+' кг.',7);
 if(p===3){
  const secondTotal=d*e*(unit+k);
  return task('Из первой партии массой '+total+' кг выделили '+af+' для одного класса. Из второй партии того же материала массой '+secondTotal+' кг выделили '+bf+' для другого класса. Сколько килограммов выделили вместе?',ADD(A,portion(secondTotal,b,e)),workA+' '+calc(secondTotal,b,e)+' '+first+' + '+secondTotal*b/e+' = '+(first+secondTotal*b/e)+'.',5);
 }
 const enlarged=total+e*k,changed=enlarged*b/e;
 return task('В ёмкости было '+total+' л. В первый раз отмерили '+af+' этого объёма. Для второго замера исходный объём увеличили на '+e*k+' л и отмерили '+bf+' нового объёма. На сколько литров различаются отмеренные части?',ABS(SUB(A,MUL(ADD(Q(total),Q(e*k)),Q(b,e)))),workA+' '+total+' + '+e*k+' = '+enlarged+'. '+calc(enlarged,b,e)+' Разность большего и меньшего объёма равна '+Math.abs(first-changed)+' л.',6);
}

function divisionMeasurePicture(length,den,piece){
 const width=390,cell=width/length,group=piece*cell;
 const ticks=Array.from({length:length+1},(_,i)=>{
  const x=(5+i*cell).toFixed(3);
  return '<line x1="'+x+'" x2="'+x+'" y1="8" y2="35" stroke="#52617a" stroke-width=".75"/>';
 }).join('');
 const groups=Array.from({length:length/piece},(_,i)=>'<rect x="'+(5+i*group).toFixed(3)+
  '" y="8" width="'+group.toFixed(3)+'" height="27" fill="'+(i%2?'#c4ddf5':'#397dbe')+'"/>').join('');
 return '<svg class="mk-g5-section39" role="img" aria-label="Полоса длиной '+length+'/'+den+
  ' разделена на отрезки по '+piece+'/'+den+'." viewBox="0 0 400 43" width="100%" '+
  'style="display:block;max-width:400px;height:auto;margin:6px auto">'+groups+ticks+
  '<rect x="5" y="8" width="390" height="27" fill="none" stroke="#52617a"/></svg>';
}

function divisionWork(plan){
 const lines=[],display=([,n,d])=>d===1?String(n):frac(n,d);
 function visit(node){
  const [op,x,y]=node;
  if(op==='rat')return node;
  const l=visit(x),r=visit(y),[,a,b]=l,[,c,d]=r,value=calculate(node);
  const result=display(Q(value.n,value.d));
  if(op==='div'){
   lines.push(display(l)+' : '+display(r)+' = '+display(l)+' · '+frac(d,c)+
    ' = '+frac(a+' · '+d,b+' · '+c)+' = '+result+'.');
  }else if(op==='mul'){
   lines.push(display(l)+' · '+display(r)+' = '+frac(a+' · '+c,b+' · '+d)+' = '+result+'.');
  }else{
   const common=b/gcd(b,d)*d,first=a*(common/b),second=c*(common/d),sign=op==='add'?'+':'−';
   lines.push(display(l)+' '+sign+' '+display(r)+' = '+frac(first,common)+' '+sign+' '+frac(second,common)+
    ' = '+frac(first+' '+sign+' '+second,common)+' = '+result+'.');
  }
  return Q(value.n,value.d);
 }
 visit(plan);
 return lines.join(' ');
}

function fractionDivisionSpec(t,p){
 const d=rnd(4,11+2*t),a=rnd(1,d-1),e=rnd(3,10+2*t),b=rnd(1,e-1);
 const h=rnd(2,8+2*t),k=rnd(2,7+2*t),j=rnd(5,12+2*t),n=rnd(1,j-1);
 const A=Q(a,d),B=Q(b,e),C=Q(n,j),H=Q(h),K=Q(k),one=Q(1);
 const f=([,x,y])=>y===1?String(x):frac(x,y);
 const expr=(x,sign,y)=>f(x)+' '+sign+' '+f(y);
 const task=(text,plan,steps,diagram='')=>({text:text+diagram,plan,steps,explain:divisionWork(plan)});
 const calc=(text,plan,steps)=>task('Вычисли '+text+'.',plan,steps);
 if(t===0){
  if(p===0)return calc(expr(A,':',B),DIV(A,B),2);
  if(p===1)return calc(expr(A,':',H),DIV(A,H),2);
  if(p===2)return calc(expr(H,':',B),DIV(H,B),2);
  if(p===3){
   const den=rnd(7,16),piece=rnd(1,Math.floor(den/2)),blocks=rnd(2,Math.floor(den/piece)+1),length=piece*blocks;
   return task('Ленту длиной '+frac(length,den)+' м разрезали на куски по '+frac(piece,den)+
    ' м. Сколько кусков получилось?',DIV(Q(length,den),Q(piece,den)),2,divisionMeasurePicture(length,den,piece));
  }
  return calc('0 : '+f(A),DIV(Q(0),A),1);
 }
 if(t===1){
  if(p===0)return calc('('+expr(A,'+',B)+') : '+f(C),DIV(ADD(A,B),C),4);
  if(p===1)return calc(f(A)+' : ('+expr(B,'·',C)+')',DIV(A,MUL(B,C)),4);
  if(p===2)return calc(expr(A,':',B)+' + '+f(C),ADD(DIV(A,B),C),4);
  if(p===3)return calc(expr(H,':',A)+' : '+f(K),DIV(DIV(H,A),K),4);
  return task('Материал массой '+f(H)+' кг расфасовали поровну в '+k+
   ' контейнеров. Масса одной порции другого материала — '+f(B)+
   ' кг. Найди отношение массы первой порции к массе второй.',DIV(DIV(H,K),B),4);
 }
 if(p===0)return calc('('+expr(A,'+',B)+') : ('+expr(B,'·',C)+')',DIV(ADD(A,B),MUL(B,C)),5);
 if(p===1)return calc('('+expr(A,':',B)+') · ('+expr(B,'+',C)+')',MUL(DIV(A,B),ADD(B,C)),5);
 if(p===2)return calc(expr(A,':',B)+' + '+expr(B,':',C),ADD(DIV(A,B),DIV(B,C)),6);
 if(p===3)return calc('('+expr(H,'−',A)+') : ('+expr(one,'−',C)+')',DIV(SUB(H,A),SUB(one,C)),5);
 return calc(f(H)+' : ('+expr(A,':',B)+' + '+f(C)+')',DIV(H,ADD(DIV(A,B),C)),6);
}

function restoreWholeDiagram(known,n,d){
 const width=390/d;
 const cells=Array.from({length:d},(_,i)=>'<rect x="'+(5+i*width).toFixed(3)+
  '" y="8" width="'+width.toFixed(3)+'" height="28" fill="'+(i<n?'#397dbe':'#edf3fc')+
  '" stroke="#52617a" stroke-width=".65"/>').join('');
 return '<svg role="img" aria-label="Целое разделено на '+d+' равных частей. Сумма '+n+
  ' закрашенных частей равна '+known+'." viewBox="0 0 400 44" width="100%" '+
  'style="display:block;max-width:400px;height:auto;margin:6px auto">'+cells+'</svg>';
}

function restoreWholeSpec(t,p){
 const d=rnd(4,11+2*t),n=rnd(2,d-1),unit=rnd(4,21+3*t),known=n*unit,total=d*unit;
 const a=rnd(2,d-1),k=rnd(3,12+t*2),d2=rnd(3,8+t*2),n2=rnd(1,d2-1),unit2=rnd(4,20+2*t);
 const share=frac(n,d),otherShare=frac(n2,d2),remaining=d-n;
 const W=DIV(Q(known),Q(n,d)),otherTotal=d2*unit2,otherKnown=n2*unit2;
 const work=(amount,parts,den)=>amount+' : '+parts+' = '+amount/parts+
  ' — одна доля. '+amount/parts+' · '+den+' = '+amount*den/parts+' — целое.';
 const main=work(known,n,d),remainingPlan=DIV(Q(unit*remaining),Q(remaining,d));
 const otherPlan=DIV(Q(otherKnown),Q(n2,d2));
 const task=(text,plan,explain,steps)=>({text,plan,explain,steps});
 if(t===0){
  if(p===0)return task(share+' числа равны '+known+'. Найди целое.'+restoreWholeDiagram(known,n,d),W,main,2);
  if(p===1){
   const half=rnd(8,20);
   return task('Половина школьного туристического отряда — '+half+' детей. Сколько детей в отряде?',MUL(Q(half),Q(2)),half+' · 2 = '+half*2+'.',1);
  }
  if(p===2)return task(frac(1,d)+' длины ленты равна '+unit+' см. Сколько сантиметров во всей ленте?',MUL(Q(unit),Q(d)),unit+' · '+d+' = '+total+'.',1);
  if(p===3)return task('На '+share+' одинаковых рядов приходится '+known+' деревьев. Сколько деревьев в одном ряду, если всего рядов '+d+'?',DIV(Q(known),Q(n)),known+' : '+n+' = '+unit+'.',1);
  return task('Из '+d+' равных долей запаса использовали '+n+'. Осталось '+(remaining*unit)+' кг. Сколько килограммов было?',remainingPlan,'Осталось '+d+' − '+n+' = '+remaining+' долей. '+work(remaining*unit,remaining,d),3);
 }
 if(t===1){
  if(p===0)return task('После продажи '+share+' запаса осталось '+remaining*unit+' кг. Сколько килограммов было?',remainingPlan,'Осталось '+d+' − '+n+' = '+remaining+' долей. '+work(remaining*unit,remaining,d),3);
  if(p===1)return task(share+' числа равны '+known+'. Найди '+frac(a,d)+' этого числа.',MUL(W,Q(a,d)),main+' '+unit+' · '+a+' = '+unit*a+'.',3);
  if(p===2){
   const delivered=Math.min(k,remaining*unit);
   return task('До склада довезли '+known+' ящиков. Это '+share+' всей партии. Ещё '+delivered+' ящиков привезли позже. Сколько ящиков из первоначальной партии осталось довезти?',SUB(SUB(W,Q(known)),Q(delivered)),main+' '+total+' − '+known+' − '+delivered+' = '+(total-known-delivered)+'.',4);
  }
  if(p===3)return task(share+' массы одного мешка равна '+known+' кг. Сколько килограммов в '+k+' таких мешках?',MUL(W,Q(k)),main+' '+total+' · '+k+' = '+total*k+'.',3);
  return task(share+' запаса равна '+known+' кг. После пополнения масса выросла на '+k+' кг. Сколько килограммов стало?',ADD(W,Q(k)),main+' '+total+' + '+k+' = '+(total+k)+'.',3);
 }
 if(p===0){
  const extra=Math.min(k,remaining*unit-1);
  return task('От катушки отрезали '+share+' ленты и ещё '+extra+' см. Осталось '+(remaining*unit-extra)+' см. Какой длины была лента в сантиметрах?',DIV(ADD(Q(remaining*unit-extra),Q(extra)),Q(remaining,d)),(remaining*unit-extra)+' + '+extra+' = '+remaining*unit+' см. '+work(remaining*unit,remaining,d),4);
 }
 if(p===1)return task('Для первой партии '+share+' массы равна '+known+' кг. Для второй '+otherShare+' массы равна '+otherKnown+' кг. Сколько килограммов в обеих партиях вместе?',ADD(W,otherPlan),main+' '+work(otherKnown,n2,d2)+' '+total+' + '+otherTotal+' = '+(total+otherTotal)+'.',5);
 if(p===2)return task('Из первого бака слили '+share+' воды, осталось '+remaining*unit+' л. Из второго бака слили '+otherShare+' воды, осталось '+(d2-n2)*unit2+' л. На сколько литров различались исходные объёмы?',ABS(SUB(remainingPlan,DIV(Q((d2-n2)*unit2),Q(d2-n2,d2)))),'Находим доли остатков: '+d+' − '+n+' = '+remaining+', '+d2+' − '+n2+' = '+(d2-n2)+'. '+work(remaining*unit,remaining,d)+' '+work((d2-n2)*unit2,d2-n2,d2)+' Разность равна '+Math.abs(total-otherTotal)+' л.',7);
 if(p===3){
  const added=k*d2+(d2-total%d2)%d2;
  return task(share+' массы одной партии равна '+known+' кг. Другую партию сделали на '+added+' кг тяжелее первой. Сколько весят '+otherShare+' второй партии в килограммах?',MUL(ADD(W,Q(added)),Q(n2,d2)),main+' '+total+' + '+added+' = '+(total+added)+'. '+(total+added)+' : '+d2+' · '+n2+' = '+((total+added)*n2/d2)+'.',5);
 }
 return task('Из целого вычли его '+share+' и получили '+(unit*remaining)+'. К первоначальному числу прибавили '+k+'. Найди разность между новым результатом и '+frac(1,d)+' первоначального числа.',SUB(ADD(remainingPlan,Q(k)),DIV(remainingPlan,Q(d))),work(unit*remaining,remaining,d)+' '+total+' + '+k+' = '+(total+k)+'. '+(total+k)+' − '+unit+' = '+(total+k-unit)+'.',6);
}

function spec(id,t,p){
 if(id==='frac_restore')return restoreWholeSpec(t,p);
 if(id==='frac_div_common')return fractionDivisionSpec(t,p);
 if(id==='frac_part_number')return partOfWholeSpec(t,p);
 const d1=rnd(3,9+t*2),d2=rnd(3,10+t*2),d3=rnd(3,9+t*2);
 const a=rnd(1,d1-1),b=rnd(1,d2-1),c=rnd(1,d3-1),h=rnd(2,6+t*2),k=rnd(2,7+t*2);
 const X=Q(a,d1),Y=Q(b,d2),Z=Q(c,d3),one=Q(1),two=Q(2);
 const total=12*d1*d2*h,part=total*a/d1,classSize=2*rnd(9,16);
 let cases;
 if(id==='frac_division'){
  const n=rnd(3,16+t*7),den=rnd(3,12+t*4),boxes=rnd(2,7+t*3);
  const sampleA=divisionSample(),sampleB=divisionSample(),sampleC=divisionSample();
  if(t===0)cases=[
   ['Представь частное '+sampleA.n+' : '+sampleA.d+' обыкновенной дробью.'+divisionWholePicture(sampleA.n,sampleA.d),Q(sampleA.n,sampleA.d),'Делимое '+sampleA.n+' становится числителем, делитель '+sampleA.d+' — знаменателем. Ответ: '+sampleA.n+'/'+sampleA.d+'.',1],
   ['На '+den+' учеников поровну разделили '+n+' пирогов. Сколько пирогов досталось каждому?',Q(n,den),'Разделим количество пирогов на количество учеников.',1],
   ['Между '+sampleB.d+' учениками поровну разделили '+sampleB.n+' одинаковых целых. Запиши долю каждого дробью.'+divisionWholePicture(sampleB.n,sampleB.d),Q(sampleB.n,sampleB.d),'Каждый получает по 1/'+sampleB.d+' от каждого целого. Таких частей '+sampleB.n+', поэтому частное равно '+sampleB.n+'/'+sampleB.d+'.',1],
   ['Ленту длиной '+n+' м разрезали на '+den+' равных частей. Сколько метров в каждой части?',Q(n,den),'Частное натуральных чисел выражает длину одной части.',2],
   ['Запиши частное '+sampleC.n+' : '+sampleC.d+' в виде обыкновенной дроби.'+divisionWholePicture(sampleC.n,sampleC.d),Q(sampleC.n,sampleC.d),'Запись деления дробной чертой: '+sampleC.n+' : '+sampleC.d+' = '+sampleC.n+'/'+sampleC.d+'.',1]
  ];
  else if(t===1)cases=[
   ['Разделили '+n+' и ещё '+boxes+' пирогов поровну на '+den+' учеников. Сколько пирогов каждому?',Q(n+boxes,den),'Сначала общий запас, затем деление.',2],
   ['Из '+(n+boxes)+' метров ленты отрезали '+boxes+' метров, остаток разделили на '+den+' частей. Какова длина части?',Q(n,den),'Сначала вычтем расход, затем разделим остаток.',2],
   ['На '+den+' человек разделили '+n+' л сока и дополнительно '+boxes+' л воды. Сколько литров напитка каждому?',Q(n+boxes,den),'Общий объём поделим поровну.',2],
   ['Вычисли '+n+' : '+den+' + '+boxes+' : '+den+'.',ADD(Q(n,den),Q(boxes,den)),'Два частных записываем дробями с одинаковым знаменателем.',3],
   ['Каждая из '+boxes+' коробок содержала '+n+' конфет. Их разделили поровну между '+den+' людьми. Сколько конфет каждому?',Q(n*boxes,den),'Количество в коробке × число коробок, затем деление.',3]
  ];
  else cases=[
   ['В первой коробке было '+n+' пирогов, во второй — '+boxes+'. Все пироги поделили поровну между '+den+' детьми. Каждый ребёнок съел половину своей порции. Сколько пирога осталось у каждого?',DIV(Q(n+boxes,den),two),'Сложим два запаса, разделим поровну, затем возьмём половину результата.',4],
   [''+n+' м ленты и '+boxes+' м ленты соединили, затем разделили на '+den+' частей, каждую из которых удвоили. Какова длина удвоенной части?',MUL(Q(n+boxes,den),two),'Общая длина, деление на части, удвоение.',4],
   ['Ленту длиной '+n+' м разделили на '+den+' одинаковых отрезков. Другую ленту длиной '+boxes+' м тоже разделили на '+den+' отрезков. Какова общая длина двух отрезков, взятых по одному от каждой ленты?',ADD(Q(n,den),Q(boxes,den)),'Вычислим два частных и сложим их.',4],
   [''+(n+boxes)+' кг разделили на '+den+' равных упаковок. Из каждой упаковки забрали '+show(Q(boxes,den))+' кг. Сколько осталось в одной?',SUB(Q(n+boxes,den),Q(boxes,den)),'Сначала частное всего запаса, затем вычтем убранную долю.',4],
   ['Сначала '+n+' литров разделили на '+den+' сосудов, затем добавили каждому по '+show(Q(boxes,den))+' л. Сколько литров в каждом?',ADD(Q(n,den),Q(boxes,den)),'Частное, затем прибавим указанную долю.',4]
  ];
 }
 if(id==='frac_word'){
  if(t===0)cases=[
   ['На экскурсию прошли '+show(X)+' км и ещё '+show(Y)+' км. Сколько километров прошли?',ADD(X,Y),'Сложим две дробные длины.',2],
   ['Из '+show(ADD(one,X))+' кг сахара использовали '+show(X)+' кг. Сколько осталось?',SUB(ADD(one,X),X),'Вычтем из общего количества расход.',2],
   ['Одна лента длиной '+show(X)+' м, другая '+show(Y)+' м. Найди сумму длин.',ADD(X,Y),'Сумма двух дробей.',2],
   ['Из кувшина с '+show(ADD(one,Y))+' л вылили '+show(Y)+' л. Сколько осталось?',SUB(ADD(one,Y),Y),'Разность объёмов.',2],
   ['Сколько метров в двух одинаковых отрезках длиной '+show(X)+' м?',MUL(X,two),'Два равных отрезка.',2]
  ];
  else if(t===1)cases=[
   ['За три дня прошли '+show(X)+', '+show(Y)+' и '+show(Z)+' км. Найди суммарное расстояние.',ADD(X,Y,Z),'Сложим три дробных расстояния.',3],
   ['На первой полке '+show(X)+' кг, на второй '+show(Y)+' кг. Добавили ещё '+show(Z)+' кг. Сколько всего?',ADD(X,Y,Z),'Три слагаемых с общим знаменателем.',3],
   ['От '+show(ADD(one,X,Y))+' кг отняли '+show(X)+' кг. Сколько осталось?',SUB(ADD(one,X,Y),X),'Вычитание дробной массы.',3],
   ['Два одинаковых пути по '+show(X)+' км и ещё '+show(Y)+' км. Сколько прошли?',ADD(MUL(two,X),Y),'Удваиваем первый путь и прибавляем третий.',3],
   ['Из общей длины '+show(ADD(one,X,Y))+' м отрезали '+show(Y)+' и '+show(X)+' м. Сколько осталось?',SUB(SUB(ADD(one,X,Y),Y),X),'Два последовательных вычитания.',3]
  ];
  else cases=[
   ['В понедельник прошли '+show(X)+' км, во вторник вдвое больше, в среду ещё '+show(Y)+' км. Сколько всего?',ADD(X,MUL(two,X),Y),'Удваиваем один из путей и складываем три величины.',5],
   ['Было '+show(ADD(one,X,Y,Z))+' кг. Потратили '+show(Y)+' и '+show(Z)+' кг, затем купили ещё '+show(X)+' кг. Сколько стало?',ADD(SUB(SUB(ADD(one,X,Y,Z),Y),Z),X),'Два расхода и одно поступление.',5],
   ['Два отрезка длиной '+show(X)+' м и '+show(Y)+' м удвоили, затем добавили третий '+show(Z)+' м. Чему равна общая длина?',ADD(MUL(two,ADD(X,Y)),Z),'Сначала сумма двух, удвоение, затем прибавление.',5],
   ['Из '+show(ADD(one,X,Y))+' кг забрали '+show(X)+' кг, затем половину остатка. Сколько осталось?',DIV(SUB(ADD(one,X,Y),X),two),'Вычислим остаток после первого расхода и половину оставшегося.',4],
   ['На складе '+show(ADD(one,X,Y,Z))+' кг. Забрали '+show(X)+' кг, затем '+show(Y)+' кг и добавили '+show(Z)+' кг. Найди новый запас.',ADD(SUB(SUB(ADD(one,X,Y,Z),X),Y),Z),'Несколько последовательных изменений дробной массы.',5]
  ];
 }
 if(!cases||cases.length!==5)throw Error('v130 incomplete family '+id);
 const [text,plan,explain,steps]=cases[p];
 return {id,t,p,text,plan,explain,steps};
}
function question(id){
 const t=T(),p=F(),d=spec(id,t,p),value=calculate(d.plan);
 if(value.n<0)throw Error('Negative v130 quantity '+id);
 let choices,correct;
 if(value.d===1){choices=g5nums(value.n,[value.n+1,value.n+2,value.n+3]);correct=String(value.n)}
 else if(id==='frac_division'||id==='frac_div_common'){
  // Build four choices for the two division topics, deduplicated by rational value.
  // Distractors must be distinct *mathematical values*, not merely different spellings.
  const chosen=[],seen=new Set();
  const add=(n,d,key)=>{
   if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||n<0||d<2)return;
   const reduced=simplify(n,d),canonical=reduced.n+'/'+reduced.d;
   if(seen.has(canonical))return;
   seen.add(canonical);chosen.push({label:frac(n,d),key});
  };
  correct=value.n+'/'+value.d;
  add(value.n,value.d,correct);
  const candidates=[[value.n+1,value.d],[value.n+2,value.d],
   [Math.max(0,value.n-1),value.d],[value.n,value.d+1],
   [value.n+1,value.d+1],[value.n+3,value.d],
   [value.n,value.d+2],[value.n+4,value.d+1]];
  for(let i=0;i<candidates.length&&chosen.length<4;i++)
   add(candidates[i][0],candidates[i][1],'v130_'+id+'_wrong_'+i);
  if(chosen.length!==4)throw Error('Could not build four unique fraction division options: '+id);
  choices=chosen;
 }
 else{choices=g5FractionChoices(value.n,value.d);correct=value.n+'/'+value.d}
 const q=g5q(d.text,choices,correct,d.explain+' Ответ: '+show(d.plan)+'.','v130_'+id+'_L'+t+'_F'+p);
 const matches=q.choices.filter(x=>String(x.key)===String(q.correct));
 if(matches.length!==1||new Set(q.choices.map(c=>String(c.label))).size!==q.choices.length)throw Error('Invalid fraction answer options '+id+'/'+t+'/'+p);
 return {text:q.text,ans:String(q.correct),choices:q.choices,ex:q.explain,sourceTopicId:id,
  templateId:q.templateId,sig:['g5','v130',id,t,p,q.text,correct].join(':'),
  correctLabel:String(matches[0].label),correctText:String(matches[0].label),
  mk130:{id,t,p,steps:d.steps,plan:d.plan,expected:value}};
}
makeG5Question=function(id){return covered.has(id)?question(id):previous.apply(this,arguments)};
window.mkG5V130Tiered=IDS.slice();
})();
