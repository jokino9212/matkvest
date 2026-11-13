/* Grade 5 v125: six natural-number, coordinate, divisibility and measurement topics. */
(function(){
'use strict';
if(typeof makeG5Question!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof activeDifficulty!=='function')throw Error('v125 Grade 5 dependencies unavailable');
const IDS=['natural','coordinate','divisors_multiples_g5','divisibility_rules_g5','area_units_g5','operations'];
const previous=makeG5Question,implemented=new Set(IDS);
const stage=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0)),pos=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const rnd=(a,b)=>ri(a,b);
const V=n=>['v',n],A=(...x)=>['add',...x],S=(x,y)=>['sub',x,y],M=(x,y)=>['mul',x,y],D=(x,y)=>['div',x,y],Abs=(x,y)=>['abs',S(x,y)],Mod=(x,y)=>['mod',x,y];
function calc(n){
 if(!Array.isArray(n))throw Error('Malformed v125 numerical plan');
 const [op,...x]=n;
 if(op==='v')return x[0];
 if(op==='add')return x.reduce((a,y)=>a+calc(y),0);
 if(op==='sub')return calc(x[0])-calc(x[1]);
 if(op==='mul')return calc(x[0])*calc(x[1]);
 if(op==='div'){const a=calc(x[0]),b=calc(x[1]);if(!b||a%b)throw Error('Noninteger v125 division');return a/b;}
 if(op==='mod'){const a=calc(x[0]),b=calc(x[1]);if(b<=0||a<0)throw Error('Invalid v125 remainder');return a%b;}
 if(op==='abs')return Math.abs(calc(x[0]));
 throw Error('Unknown v125 operation '+op);
}
const count=(l,r,k)=>Math.floor(r/k)-Math.floor((l-1)/k);
const digits=(base,k)=>Array.from({length:10},(_,x)=>base+x).filter(n=>n%k===0);
function coordRay(points,options={}){
 const entries=points.filter(p=>p&&Number.isSafeInteger(p.value)&&p.value>=0&&p.name);
 if(!entries.length||entries.length!==points.length)throw Error('Invalid coordinate points');
 const min=Math.min(...entries.map(p=>p.value)),max=Math.max(...entries.map(p=>p.value));
 const low=options.startAtZero?0:Math.max(0,min-2),high=Math.max(max+2,low+5);
 const range=high-low,left=34,right=493,scale=(right-left)/range,baseY=87;
 const hide=new Set(options.hide||[]),svgHeight=181,coordX=n=>left+(n-low)*scale;
 const major=range<=10?1:range<=20?2:range<=32?4:5;
 let ticks='',marks='',labels='';
 for(let n=low;n<=high;n++){
  const x=coordX(n).toFixed(2),large=(n===low||n===0||n===1||n===high||n%major===0),lineEnd=large?99:95;
  ticks+='<line class="mk-g5-coord-tick" data-at="'+n+'" x1="'+x+'" y1="78" x2="'+x+'" y2="'+lineEnd+'" stroke="#557ba4" stroke-width="'+(large?2:1)+'"/>';
  if((large||n===low+1)&&!hide.has(n)){
   labels+='<text class="mk-g5-coord-label" x="'+x+'" y="119" text-anchor="middle" font-size="'+(range>30?12:15)+'" fill="currentColor">'+n+'</text>';
  }
 }
 const groups=new Map();
 for(const p of entries){const group=groups.get(p.value)||[];group.push(p.name);groups.set(p.value,group);}
 for(const [value,names]of groups){
  const x=coordX(value).toFixed(2),caption=names.join(', '),alternate=names.length>1;
  marks+='<circle class="mk-g5-coord-point" cx="'+x+'" cy="'+baseY+'" r="5" fill="#e0773a" stroke="#fff" stroke-width="1.5"/><text class="mk-g5-coord-point-label" x="'+x+'" y="'+(alternate?41:57)+'" text-anchor="middle" font-size="18" font-weight="700" fill="currentColor">'+caption+'</text>';
 }
 const startsAtZero=low===0;
 const arrow='<polygon points="504,87 489,80 489,94" fill="#37689b"/>';
 const shaft='<line class="mk-g5-coord-axis" x1="'+left+'" y1="'+baseY+'" x2="498" y2="'+baseY+'" stroke="#37689b" stroke-width="3"/>';
 const zero=startsAtZero?'<circle cx="'+left+'" cy="'+baseY+'" r="4" fill="#37689b"/>':'<path d="M 36 74 l8 26 M 48 74 l8 26" stroke="#d68b43" stroke-width="2"/>';
 const note='<text x="34" y="159" font-size="16" fill="currentColor">'+(startsAtZero?'Единичный отрезок: 0–1':'Фрагмент координатного луча; шаг шкалы — 1')+'</text>';
 const html=shaft+arrow+zero+ticks+labels+marks+note;
 return '<div class="mk-g5-coordinate-diagram" style="width:100%;max-width:580px;overflow:hidden;margin:9px auto"><svg role="img" aria-label="'+(startsAtZero?'Координатный луч от нуля':'Фрагмент координатного луча')+', деления через одну единицу, точки '+entries.map(x=>x.name).join(', ')+'" viewBox="0 0 525 '+svgHeight+'" width="100%" style="height:auto;display:block">'+html+'</svg></div>';
}

function spec(id,t,p){
 const a=rnd(4,14+5*t),b=rnd(3,11+4*t),c=rnd(2,7+3*t),d=rnd(2,6+2*t),e=rnd(2,6+2*t),k=rnd(3,8+4*t);
 let rows;
 if(id==='natural'){
  const h=rnd(2,9),tens=rnd(t===2?2:0,9),ones=rnd(t===2?1:0,9),newTens=rnd(0,9),n=h*100+tens*10+ones,rev=ones*100+tens*10+h;
  if(t===0)rows=[
   ['Какое натуральное число следует за '+n+'?',A(V(n),V(1)),'Следующее натуральное число на единицу больше.',1],
   ['Какое число непосредственно предшествует '+n+'?',S(V(n),V(1)),'Предыдущее натуральное число на единицу меньше.',1],
   ['Сколько отдельных единиц обозначает цифра '+h+' в разряде сотен числа '+n+'?',V(h*100),'Цифра '+h+' в разряде сотен означает '+(h*100)+' единиц.',1],
   ['Какая цифра стоит в разряде десятков числа '+n+'?',V(tens),'Цифра десятков — '+tens+'.',1],
   ['Сколько полных десятков содержится в числе '+n+'?',D(S(V(n),V(ones)),V(10)),'Отбросим единицы, затем разделим на 10.',2]
  ];
  else if(t===1)rows=[
   ['Число '+n+' увеличили на '+(b*10)+' и уменьшили на '+c+'. Сколько стало?',S(A(V(n),V(b*10)),V(c)),'Последовательно выполним два изменения.',2],
   ['Округли число '+n+' до десятков.',V(Math.floor((n+5)/10)*10),'Посмотрим на последнюю цифру и округлим к ближайшему десятку.',2],
   ['Найди сумму цифр числа '+n+'.',A(V(h),V(tens),V(ones)),'Сложим сотни, десятки и единицы как цифры.',2],
   ['В числе '+n+' заменили цифру десятков на '+newTens+'. Какое число получилось?',A(M(V(h),V(100)),M(V(newTens),V(10)),V(ones)),'Построим число из сотен, новых десятков и единиц.',3],
   ['Округли число '+n+' до сотен.',V(Math.floor((n+50)/100)*100),'Посмотрим на цифру десятков и округлим до сотен.',2]
  ];
  else rows=[
   ['Число '+n+' записали в обратном порядке цифр. Найди разность полученного числа '+rev+' и исходного по модулю.',Abs(V(rev),V(n)),'Составим обратное число, затем найдём положительную разность.',3],
   ['К числу '+n+' прибавили '+d+' сотен, затем вычли '+Math.min(e,tens-1)+' десятков. Найди полученное число.',A(V(n),M(V(d),V(100)),M(V(-10),V(Math.min(e,tens-1)))),'Прибавим новые сотни и вычтем десятки.',3],
   ['К сумме числа '+n+' и числа '+rev+', полученного перестановкой цифр, прибавили разность их цифр сотен '+h+' и '+ones+' по модулю. Найди результат.',A(A(V(n),V(rev)),Abs(V(h),V(ones))),'Сложим два числа, вычислим положительную разность их цифр сотен и прибавим её.',4],
   ['Сколько натуральных чисел строго между '+n+' и '+(n+a+b)+'?',S(S(V(n+a+b),V(n)),V(1)),'Число между двумя границами равно разности минус 1.',3],
   ['Округли сумму чисел '+n+' и '+(a*10+b)+' до десятков.',V(Math.floor((n+a*10+b+5)/10)*10),'Сначала найдём сумму, затем округлим по цифре единиц.',4]
  ];
 }
 if(id==='coordinate'){
  const begin=a+b+e,end=begin+c+d,point=(name,value)=>({name,value});
  if(t===0)rows=[
   ['На координатном луче отмечена точка A. Определи её координату по шкале: одно деление равно единице. '+coordRay([point('A',a)],{startAtZero:true,hide:[a]}),V(a),'Считаем единичные деления от 0 до точки A. Получаем '+a+'.',1],
   ['Точки A('+a+') и B('+(a+b)+') отмечены на координатном луче. Сколько единичных делений между A и B? '+coordRay([point('A',a),point('B',a+b)]),S(V(a+b),V(a)),'Из большей координаты вычитаем меньшую: '+(a+b)+' − '+a+' = '+b+'.',2],
   ['Из точки A('+a+') прошли '+c+' единичных делений вправо и оказались в точке B. Какая координата B? '+coordRay([point('A',a),point('B',a+c)],{hide:[a+c]}),A(V(a),V(c)),'При движении вправо увеличиваем координату на '+c+': '+a+' + '+c+' = '+(a+c)+'.',1],
   ['Из точки C('+(a+b)+') прошли '+b+' делений влево и оказались в точке D. Назови координату D. '+coordRay([point('C',a+b),point('D',a)],{hide:[a]}),S(V(a+b),V(b)),'При движении влево уменьшаем координату: '+(a+b)+' − '+b+' = '+a+'.',1],
   ['На координатном луче A('+a+'), B('+(a+2*b)+'), а M — середина отрезка AB. Какова координата M? '+coordRay([point('A',a),point('M',a+b),point('B',a+2*b)],{hide:[a+b]}),A(V(a),V(b)),'Между A и B '+(2*b)+' делений, половина — '+b+'. Прибавляем к '+a+' и получаем '+(a+b)+'.',2]
  ];
  else if(t===1){
   const middle=begin+c,finish=middle-d,finish2=begin-b+c;
   rows=[
    ['Из точки A('+begin+') прошли вправо '+c+' делений, затем влево '+d+'. Назови конечную координату K. '+coordRay([point('A',begin),point('K',finish)],{hide:[finish]}),S(A(V(begin),V(c)),V(d)),'Первый шаг: '+begin+' + '+c+' = '+middle+'. Второй шаг: '+middle+' − '+d+' = '+finish+'.',2],
    ['Точка A('+begin+'), B('+(begin+2*c)+'). Найди координату середины M отрезка AB. '+coordRay([point('A',begin),point('M',begin+c),point('B',begin+2*c)],{hide:[begin+c]}),D(A(V(begin),V(begin+2*c)),V(2)),'У середины M координата, равная полусумме концов: ('+begin+' + '+(begin+2*c)+') : 2 = '+(begin+c)+'.',2],
    ['Координата точки B равна '+end+'. От A вправо до B прошли '+(c+d)+' делений. Найди координату A. '+coordRay([point('A',begin),point('B',end)],{hide:[begin]}),S(V(end),A(V(c),V(d))),'Из координаты B вычтем всё пройденное расстояние: '+end+' − ('+c+' + '+d+') = '+begin+'.',2],
    ['Из точки A('+begin+') прошли влево '+b+' делений, а затем вправо '+c+' делений. Найди координату K. '+coordRay([point('A',begin),point('K',finish2)],{hide:[finish2]}),A(S(V(begin),V(b)),V(c)),'Сначала '+begin+' − '+b+' = '+(begin-b)+', затем прибавляем '+c+' и получаем '+finish2+'.',2],
    ['Точки A('+begin+'), B('+(begin+b)+'), C('+(begin+b+c)+') лежат на координатном луче в указанном порядке. Найди длину AC в единичных отрезках. '+coordRay([point('A',begin),point('B',begin+b),point('C',begin+b+c)]),A(S(V(begin+b),V(begin)),S(V(begin+b+c),V(begin+b))),'AB = '+b+', BC = '+c+'. Следовательно, AC = '+b+' + '+c+' = '+(b+c)+'.',3]
   ];
  }else{
   const aNew=begin-b,bNew=end+c;
   const A1=begin+Math.min(d,b-1),C1=begin+b+c+e;
   rows=[
    ['Точки A('+begin+') и B('+end+') на координатном луче. A сдвинули влево на '+b+' делений, B — вправо на '+c+'. Найди расстояние между новыми точками A₁ и B₁. '+coordRay([point('A',begin),point('A₁',aNew),point('B',end),point('B₁',bNew)]),Abs(S(V(begin),V(b)),A(V(end),V(c))),'Новые координаты: A₁ = '+aNew+', B₁ = '+bNew+'. Расстояние между ними: '+bNew+' − '+aNew+' = '+(bNew-aNew)+'.',4],
    ['Точка M('+(begin+c)+') — середина отрезка AB, A('+begin+'). Найди координату B. '+coordRay([point('A',begin),point('M',begin+c),point('B',begin+2*c)],{hide:[begin+2*c]}),S(M(V(2),V(begin+c)),V(begin)),'По свойству середины: B = 2 · M − A = 2 · '+(begin+c)+' − '+begin+' = '+(begin+2*c)+'.',3],
    ['Из точки A('+begin+') прошли '+b+' делений вправо, затем ещё '+c+' вправо и после этого '+d+' влево. Найди конечную координату K. '+coordRay([point('A',begin),point('K',begin+b+c-d)],{hide:[begin+b+c-d]}),S(A(V(begin),V(b),V(c)),V(d)),'Выполняем действия по очереди: '+begin+' + '+b+' = '+(begin+b)+'; + '+c+' = '+(begin+b+c)+'; − '+d+' = '+(begin+b+c-d)+'.',4],
    ['На координатном луче A('+begin+'), B('+(begin+b)+'), C('+(begin+b+c)+') идут по порядку. A переместили вправо на '+Math.min(d,b-1)+' делений в A₁, а C — вправо на '+e+' делений в C₁. Найди сумму расстояний A₁B и BC₁. '+coordRay([point('A',begin),point('A₁',A1),point('B',begin+b),point('C',begin+b+c),point('C₁',C1)]),A(S(V(begin+b),A(V(begin),V(Math.min(d,b-1)))),S(A(V(begin+b+c),V(e)),V(begin+b))),'A₁ = '+A1+', C₁ = '+C1+'. A₁B = '+(b-Math.min(d,b-1))+', BC₁ = '+(c+e)+'. Сумма = '+(b-Math.min(d,b-1)+c+e)+'.',4],
    ['От точки A('+begin+') прошли неизвестное число делений вправо, затем вернулись влево на '+d+' делений и оказались в точке B('+(begin+c)+'). Найди первый сдвиг вправо. '+coordRay([point('A',begin),point('B',begin+c)]),S(A(V(begin+c),V(d)),V(begin)),'До возвращения влево дошли до координаты '+(begin+c+d)+'. Поэтому первый сдвиг равен '+(begin+c+d)+' − '+begin+' = '+(c+d)+'.',3]
   ];
  }
 }
 if(id==='divisors_multiples_g5'){
  const factor=rnd(2,9),q=rnd(3,10+t*4),n=factor*q,primes=[2,3,5,7,11],pr=primes[rnd(0,4)],two=primes[(primes.indexOf(pr)+rnd(1,4))%5],prod=pr*two;
  if(t===0)rows=[
   ['Число '+n+' разделили на '+factor+' без остатка. Чему равно частное?',D(V(n),V(factor)),'Делитель '+factor+' входит в число '+n+' ровно '+q+' раз.',1],
   ['Сколько положительных кратных '+factor+' не больше '+(q*factor)+'?',V(q),'Это '+factor+', '+(2*factor)+', …, '+(q*factor)+'.',2],
   ['Найди следующее кратное '+factor+' после '+(factor*q)+'.',M(V(factor),V(q+1)),'К кратному прибавим делитель.',2],
   ['У простого числа '+pr+' сколько натуральных делителей?',V(2),'Простое число имеет ровно два положительных делителя: 1 и само число.',1],
   ['Чему равно наименьшее положительное кратное числа '+factor+'?',V(factor),'Первое положительное кратное числа равно самому числу.',1]
  ];
  else if(t===1)rows=[
   ['Сколько положительных кратных '+factor+' от 1 до '+(n+factor*c)+' включительно?',D(V(n+factor*c),V(factor)),'Вычислим, сколько полных групп по '+factor+' помещается в границе.',2],
   ['У числа '+prod+' (произведение различных простых '+pr+' и '+two+') сколько натуральных делителей?',V(4),'Его делители: 1, '+pr+', '+two+' и '+prod+'.',2],
   ['У числа '+(factor*q)+' исключили '+(factor*Math.min(d,q-1))+' предметов. Сколько полных групп по '+factor+' осталось?',D(S(V(factor*q),V(factor*Math.min(d,q-1))),V(factor)),'Вычтем расход, затем разделим на размер группы.',3],
   ['Число '+n+' разделили поровну на '+q+' групп. Затем число в каждой группе увеличили на '+c+'. Сколько в новой группе?',A(D(V(n),V(q)),V(c)),'Деление и сложение.',2],
   ['Сколько кратных числа '+factor+' между '+(factor*2)+' и '+(factor*(q+2))+' включительно?',V(q+1),'Начинаем со второго кратного, заканчиваем '+(q+2)+'-м; считаем количество.',3]
  ];
  else rows=[
   ['Сколько положительных чисел не больше '+(prod*k)+' кратны одновременно '+pr+' и '+two+'?',D(V(prod*k),V(prod)),'Оба простых множителя должны входить в число; кратные их произведения.',4],
   ['Сколько натуральных делителей имеет число '+(pr*pr)+' (квадрат простого '+pr+')?',V(3),'Делители квадрата простого: 1, '+pr+' и '+(pr*pr)+'.',3],
   ['На отрезке от '+(factor*2)+' до '+(factor*(q+3))+' включительно сколько кратных '+factor+'?',V(q+2),'Это последовательность кратных с номерами 2, 3, …, '+(q+3)+'.',3],
   ['Разложили '+(n+factor*c)+' предметов в коробки по '+factor+'. Затем '+Math.min(d,q+c-1)+' полных коробок отдали. Сколько осталось полных коробок?',S(D(V(n+factor*c),V(factor)),V(Math.min(d,q+c-1))),'Сначала число коробок, затем вычтем отданные.',3],
   ['Для '+(factor*q)+' предметов можно сделать '+q+' упаковок по '+factor+'. Если в каждую добавить ещё '+c+' предметов, сколько всего предметов будет?',M(V(q),A(V(factor),V(c))),'Новая вместимость умножается на число упаковок.',3]
  ];
 }
 if(id==='divisibility_rules_g5'){
  const head=rnd(11,89)*10,base=(head+10)*10,start=rnd(11,25)*10,end=start+rnd(100,170),mod=rnd(2,9);
  if(t===0)rows=[
   ['Сколько цифр от 0 до 9 можно подставить вместо * в числе '+head.toString().slice(0,-1)+'*0, чтобы оно делилось на 2?',V(10),'Любое число с последней цифрой 0 делится на 2; неизвестная цифра может быть любой.',1],
   ['Сколько цифр от 0 до 9 могут быть последней цифрой числа, кратного 5?',V(2),'Последняя цифра должна быть 0 или 5.',1],
   ['Сколько цифр от 0 до 9 могут быть последней цифрой числа, кратного 10?',V(1),'Последняя цифра должна быть 0.',1],
   ['Сколько цифр от 0 до 9 могут быть последней цифрой чётного числа?',V(5),'Подходят цифры 0, 2, 4, 6, 8.',1],
   ['Сколько цифр от 0 до 9 могут быть единицами числа, делящегося на 2 и на 5?',V(1),'Общий признак делимости на 2 и 5 требует последнюю цифру 0.',2]
  ];
  else if(t===1)rows=[
   ['Сколько цифр x от 0 до 9 делают число '+base+' + x делящимся на 3?',V(digits(base,3).length),'Сумма цифр должна делиться на 3; проверим десять возможных цифр.',2],
   ['Сколько цифр x от 0 до 9 дают число '+base+' + x, делящееся на 9?',V(digits(base,9).length),'Подбираем x так, чтобы сумма цифр делилась на 9.',2],
   ['Сколько натуральных чисел от '+start+' до '+end+' включительно делится на 5?',V(count(start,end,5)),'Число кратных 5 на отрезке определим по первым и последним кратным.',2],
   ['Сколько натуральных чисел от '+start+' до '+end+' включительно одновременно чётны и делятся на 5?',V(count(start,end,10)),'Число должно делиться на 10.',3],
   ['Сколько цифр x от 0 до 9 сделают число '+base+' + x делящимся на 2 и 3?',V(digits(base,6).length),'Число должно делиться на 6, проверяем чётность и сумму цифр.',3]
  ];
  else rows=[
   ['Сколько чисел от '+start+' до '+end+' одновременно делится на 2, 3 и 5?',V(count(start,end,30)),'Это кратные 30. Определим их количество между границами.',4],
   ['Сколько цифр x от 0 до 9 сделают число '+base+' + x делящимся на 3 и 5?',V(digits(base,15).length),'Последняя цифра 0 или 5, сумма цифр кратна 3.',4],
   ['Сколько чисел от '+start+' до '+end+' делятся на 9 и одновременно на 2?',V(count(start,end,18)),'Оба признака равносильны делимости на 18.',4],
   ['На участке от '+start+' до '+end+' включительно сколько чисел делятся на 3, но не делятся на 9?',S(V(count(start,end,3)),V(count(start,end,9))),'Из всех кратных 3 исключаем кратные 9.',4],
   ['Сколько чисел от '+start+' до '+end+' делится на 2 или на 5 (включая кратные обоим)?',S(A(V(count(start,end,2)),V(count(start,end,5))),V(count(start,end,10))),'Сложим два множества и один раз вычтем общие кратные 10.',5]
  ];
 }
 if(id==='area_units_g5'){
  const area=a*b;
  if(t===0)rows=[
   ['Сколько квадратных сантиметров в '+a+' дм²?',M(V(a),V(100)),'1 дм² = 100 см².',1],
   ['Сколько квадратных дециметров в '+a+' м²?',M(V(a),V(100)),'1 м² = 100 дм².',1],
   ['Сколько квадратных сантиметров в '+a+' м²?',M(V(a),V(10000)),'1 м² = 10 000 см².',1],
   ['Сколько квадратных метров в '+a+' гектарах?',M(V(a),V(10000)),'1 га = 10 000 м².',1],
   ['Сколько квадратных метров в '+a+' арах?',M(V(a),V(100)),'1 ар = 100 м².',1]
  ];
  else if(t===1)rows=[
   ['Площадь участка '+(a*10000)+' м². Сколько это гектаров?',D(V(a*10000),V(10000)),'Чтобы перейти в гектары, делим на 10 000.',2],
   ['Площадь прямоугольника '+a+' дм на '+b+' дм. Найди площадь в см².',M(M(V(a),V(b)),V(100)),'Сначала произведение сторон в дм², затем умножение на 100.',3],
   ['Площадь двух участков '+a+' и '+b+' м². Сколько это в см² вместе?',M(A(V(a),V(b)),V(10000)),'Сложим две площади и переведём м² в см².',3],
   ['В '+a+' м² сколько квадратных дециметров? Потом отложили '+b+' дм². Сколько дм² осталось?',S(M(V(a),V(100)),V(b)),'Переводим м² в дм² и вычитаем часть.',3],
   ['Сколько квадратных сантиметров составляют '+a+' дм² и ещё '+b+' см² вместе?',A(M(V(a),V(100)),V(b)),'Переведём дм² и сложим площади.',3]
  ];
  else rows=[
   ['Два прямоугольника '+a+'×'+b+' дм и '+c+'×'+d+' дм составляют фигуру без перекрытия. Найди площадь в см².',M(A(M(V(a),V(b)),M(V(c),V(d))),V(100)),'Найдём обе площади в дм², сложим, умножим на 100.',5],
   ['Из '+(a*10000)+' м² участка выделили '+b+' аров. Сколько квадратных метров осталось?',S(V(a*10000),M(V(b),V(100))),'Переведём ары в м² и вычтем из площади участка.',3],
   ['К площади '+a+' м² добавили '+b+' дм². Сколько получилось в дм²?',A(M(V(a),V(100)),V(b)),'Сначала переведём большую единицу в малую.',3],
   ['На складе две комнаты площадью '+a+'×'+b+' м и '+c+'×'+d+' м. Найди суммарную площадь в дм².',M(A(M(V(a),V(b)),M(V(c),V(d))),V(100)),'Вычислим две площади в м², затем переведём в дм².',5],
   ['Участок '+(a+c)+' га и '+b+' аров. На сколько квадратных метров его площадь больше '+c+' га?',S(A(M(V(a+c),V(10000)),M(V(b),V(100))),M(V(c),V(10000))),'Все площади переведём в м², затем найдём разницу.',5]
  ];
 }
 if(id==='operations'){
  const divided=a*b,extra=c*d;
  if(t===0)rows=[
   ['Найди сумму '+a+' + '+b+'.',A(V(a),V(b)),'Выполним сложение.',1],
   ['Найди разность '+(a+b)+' − '+a+'.',S(V(a+b),V(a)),'Выполним вычитание.',1],
   ['Найди произведение '+a+' · '+b+'.',M(V(a),V(b)),'Выполним умножение.',1],
   ['Найди частное '+divided+' : '+a+'.',D(V(divided),V(a)),'Деление — действие, обратное умножению.',1],
   ['Найди значение '+a+' + '+b+' + '+c+'.',A(V(a),V(b),V(c)),'Сложим три натуральных числа.',2]
  ];
  else if(t===1)rows=[
   ['Вычисли ('+a+' + '+b+') · '+c+'.',M(A(V(a),V(b)),V(c)),'Сначала скобки, затем умножение.',2],
   ['Вычисли '+(a*b+c*d)+' − '+c+' · '+d+'.',S(V(a*b+c*d),M(V(c),V(d))),'Сначала произведение, затем разность.',3],
   ['Число '+a+' увеличили в '+d+' раз, затем прибавили '+b+'. Найди результат.',A(M(V(a),V(d)),V(b)),'Умножение, затем сложение.',2],
   ['Из '+(a+b+c)+' рублей потратили '+a+' и '+b+'. Сколько осталось?',S(S(V(a+b+c),V(a)),V(b)),'Два последовательных вычитания.',2],
   ['Найди неизвестное x: x · '+b+' = '+divided+'. Затем прибавь к x число '+c+'.',A(D(V(divided),V(b)),V(c)),'Сначала найди x делением, потом выполни сложение.',2]
  ];
  else rows=[
   ['Вычисли ('+(a+b+d*e)+') · '+c+' − '+d+' · '+e+'.',S(M(V(a+b+d*e),V(c)),M(V(d),V(e))),'Скобки, два произведения, разность.',4],
   ['Число x умножили на '+d+', прибавили '+(b*d)+', получили '+((a+b)*d)+'. Найди x.',D(S(V((a+b)*d),V(b*d)),V(d)),'Обратные действия: вычтем прибавку, разделим.',3],
   ['В '+a+' коробках по '+b+' предметов и '+c+' коробках по '+d+' предметов. Ещё привезли '+e+' предметов. Сколько стало всего?',A(M(V(a),V(b)),M(V(c),V(d)),V(e)),'Два умножения и сложение трёх слагаемых.',4],
   ['Вычисли ('+(a+b+c)+' − '+c+') · '+d+' + '+e+'.',A(M(S(V(a+b+c),V(c)),V(d)),V(e)),'Вычитаем, умножаем и прибавляем.',3],
   ['Из числа '+(a*b+extra)+' вычли '+extra+', затем разделили результат на '+a+' и добавили '+c+'. Найди итог.',A(D(S(V(a*b+extra),V(extra)),V(a)),V(c)),'Три последовательных действия с проверкой порядка.',4]
  ];
 }
 if(!rows||rows.length!==5)throw Error('Missing v125 families '+id);
 const [text,plan,explain,steps]=rows[p];
 return {id,t,p,text,plan,explain,steps};
}
makeG5Question=function(id){
 if(!implemented.has(id))return previous.apply(this,arguments);
 const t=stage(),p=pos(),data=spec(id,t,p),answer=calc(data.plan);
 if(!Number.isSafeInteger(answer)||answer<0)throw Error('Invalid v125 result '+id+' L'+t+' F'+p+' '+answer);
 const q=g5q(data.text,g5nums(answer,[answer+1,answer+2,Math.max(0,answer-1)]),String(answer),data.explain+' Ответ: '+answer+'.','v125_'+id+'_L'+t+'_F'+p);
 const match=q.choices.filter(x=>String(x.key)===String(q.correct));
 if(match.length!==1||new Set(q.choices.map(x=>String(x.label))).size!==q.choices.length)throw Error('Invalid alternatives in '+id);
 return {text:q.text,ans:String(q.correct),choices:q.choices,ex:q.explain,sourceTopicId:id,templateId:q.templateId,
   correctLabel:String(match[0].label),correctText:String(match[0].label),
   sig:['g5',id,'v125',t,p,q.text,answer].join(':'),
   mk125:{id,t,p,steps:data.steps,plan:data.plan,expected:answer}};
};
window.mkG5V125Tiered=IDS.slice();
})();
