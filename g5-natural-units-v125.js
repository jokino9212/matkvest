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
function g5ScaleRay(points,options={}){
 const unit=Number(options.unit||1),moves=options.moves||[];
 if(!Number.isSafeInteger(unit)||unit<1||unit>10)throw Error('§5 invalid scale division');
 const allValues=[0,unit,...points.map(p=>p.at),...moves.flatMap(m=>[m.from,m.to])];
 if(allValues.some(v=>!Number.isSafeInteger(v)||v<0))throw Error('§5 coordinate outside natural ray');
 const maxValue=Math.max(...allValues);
 const limit=Math.ceil((maxValue+Math.max(2,unit*2))/unit)*unit;
 const intervals=limit/unit;
 if(intervals>120)throw Error('§5 coordinate scale too dense');
 const left=48,right=674,baseline=84,width=right-left;
 const xOf=v=>left+width*v/limit;
 const px=v=>xOf(v).toFixed(3);
 const every=Math.max(1,Math.ceil(intervals/12));
 let ticks='',labels='';
 for(let i=0;i<=intervals;i++){
  const value=i*unit,x=px(value),long=i%every===0||i===1||i===intervals;
  ticks+='<line class="g5-coordinate-tick" data-value="'+value+'" x1="'+x+'" y1="'+(baseline-(long?10:5))+'" x2="'+x+'" y2="'+(baseline+7)+'" stroke="#6084ab" stroke-width="'+(long?2:1)+'"/>';
  if(i===0||i===1||i===intervals||(i%every===0&&i%2===0)){
   labels+='<text class="g5-coordinate-number" data-value="'+value+'" x="'+x+'" y="'+(baseline+27)+'" font-size="16" text-anchor="middle" fill="currentColor">'+value+'</text>';
  }
 }
 const idSet=new Set(),pLabels=[];
 for(let i=0;i<points.length;i++){
  const p=points[i];if(!/^[A-ZА-ЯМО]$/.test(p.name)||idSet.has(p.name))throw Error('§5 ambiguous point name '+p.name);
  idSet.add(p.name);
  if(p.at>limit)throw Error('§5 point outside visual scale');
  pLabels.push('<circle class="g5-coordinate-point" data-name="'+p.name+'" data-at="'+p.at+'" cx="'+px(p.at)+'" cy="'+baseline+'" r="5.5" fill="#d97935"/><text x="'+px(p.at)+'" y="'+(i%2===0?baseline-19:baseline-33)+'" font-size="19" font-weight="700" text-anchor="middle" fill="currentColor">'+p.name+'</text>');
 }
 let moveMarkup='';
 for(let i=0;i<moves.length;i++){
  const m=moves[i];if(![m.from,m.to].every(Number.isSafeInteger)||m.from<0||m.to<0||m.from>limit||m.to>limit)throw Error('§5 bad move');
  if(m.from===m.to)throw Error('§5 zero-length move');
  const y=135+i*38,tip=m.to>m.from?1:-1,arrowX=xOf(m.to),bodyEnd=arrowX-tip*10;
  moveMarkup+='<line class="g5-coordinate-move" data-from="'+m.from+'" data-to="'+m.to+'" x1="'+px(m.from)+'" y1="'+y+'" x2="'+bodyEnd.toFixed(3)+'" y2="'+y+'" stroke="#d97935" stroke-width="3"/><polygon points="'+arrowX.toFixed(3)+','+y+' '+(arrowX-tip*12).toFixed(3)+','+(y-7)+' '+(arrowX-tip*12).toFixed(3)+','+(y+7)+'" fill="#d97935"/><text x="'+((xOf(m.from)+arrowX)/2).toFixed(3)+'" y="'+(y-10)+'" font-size="18" text-anchor="middle" fill="currentColor">'+(m.label||'')+'</text>';
 }
 const height=165+moves.length*38;
 const caption=unit===1?'Единичный отрезок равен 1':'Цена деления шкалы: '+unit+' ед.';
 const unitBar='<line x1="'+px(0)+'" y1="119" x2="'+px(unit)+'" y2="119" stroke="#598d3e" stroke-width="4"/><circle cx="'+px(0)+'" cy="119" r="3" fill="#598d3e"/><circle cx="'+px(unit)+'" cy="119" r="3" fill="#598d3e"/>';
 return '<div class="mk-g5-coordinate-figure" style="width:100%;max-width:720px;overflow:hidden;margin:7px auto"><svg role="img" aria-label="Координатный луч и шкала. '+caption+'. Отмечены точки: '+points.map(p=>p.name).join(', ')+'. Цифровые ответы на рисунке не подписаны." data-unit="'+unit+'" data-limit="'+limit+'" data-left="'+left+'" data-right="'+right+'" viewBox="0 0 720 '+height+'" width="100%" style="height:auto;display:block"><line x1="'+left+'" y1="'+baseline+'" x2="'+right+'" y2="'+baseline+'" stroke="#376d9d" stroke-width="3"/><polygon points="'+right+','+baseline+' '+(right-15)+','+(baseline-8)+' '+(right-15)+','+(baseline+8)+'" fill="#376d9d"/>'+ticks+labels+pLabels.join('')+unitBar+moveMarkup+'<text x="'+(left+8)+'" y="'+(height-12)+'" font-size="16" text-anchor="start" fill="currentColor">'+caption+'</text></svg></div>';
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
  const begin=a+b+e,end=begin+c+d;
  const show=(points,max=0,unit=1,moves=[])=>g5ScaleRay(points,{unit,moves});
  const pos=n=>[{name:'A',at:n}];
  if(t===0){
   const unit=rnd(2,5),steps=rnd(3,7),scaleValue=unit*steps;
   rows=[
    ['Точка A отмечена на координатном луче. Определи её координату, считая единичные деления от нуля. '+show(pos(a)),V(a),'От начала луча O(0) до A — '+a+' единичных отрезков, значит A('+a+').',1],
    ['На координатном луче отмечены точки A('+a+') и B('+(a+b)+'). Найди расстояние AB. '+show([{name:'A',at:a},{name:'B',at:a+b}]),S(V(a+b),V(a)),'Из координаты правой точки вычтем координату левой: '+(a+b)+' − '+a+' = '+b+'.',2],
    ['Точка A('+a+') сдвинулась на '+c+' единичных делений вправо. Какова её новая координата? '+show(pos(a),0,1,[{from:a,to:a+c,label:'+'+c}]),A(V(a),V(c)),'Сдвиг вправо означает прибавить '+c+': '+a+' + '+c+' = '+(a+c)+'.',1],
    ['Цена деления шкалы — '+unit+' ед. Точка C находится на '+steps+'-м делении после нуля. Какое число она показывает? '+show([{name:'C',at:scaleValue}],0,unit),M(V(unit),V(steps)),'Каждое деление равно '+unit+', от нуля пройдено '+steps+' делений: '+unit+' · '+steps+' = '+scaleValue+'.',2],
    ['На луче A('+a+') и B('+(a+2*b)+'). Отмечена середина M между ними. Найди координату M. '+show([{name:'A',at:a},{name:'M',at:a+b},{name:'B',at:a+2*b}]),A(V(a),V(b)),'Между A и B '+(2*b)+' единичных шагов. Половина расстояния — '+b+', значит M('+(a+b)+').',2]
   ];
  }else if(t===1){
   const unit=rnd(2,5),start=begin*unit,last=(begin-b+c)*unit;
   rows=[
    ['Из точки A('+begin+') прошли вправо '+c+' делений, затем влево '+d+'. Найди конечную координату. '+show(pos(begin),0,1,[{from:begin,to:begin+c,label:'+'+c},{from:begin+c,to:begin+c-d,label:'−'+d}]),S(A(V(begin),V(c)),V(d)),'Сначала прибавляем '+c+', затем вычитаем '+d+': '+begin+' + '+c+' − '+d+' = '+(begin+c-d)+'.',3],
    ['Точки A('+begin+') и B('+(begin+2*c)+') отмечены на луче. Найди координату середины M отрезка AB. '+show([{name:'A',at:begin},{name:'B',at:begin+2*c}]),D(A(V(begin),V(begin+2*c)),V(2)),'Найдём половину расстояния: ('+(2*c)+') : 2 = '+c+'. Середина: '+begin+' + '+c+' = '+(begin+c)+'.',2],
    ['Координата точки B равна '+end+'. От точки A до B вправо прошли '+(c+d)+' единичных делений. Найди координату A. '+show([{name:'B',at:end}],0,1,[{from:end,to:begin,label:'−'+(c+d)}]),S(V(end),A(V(c),V(d))),'Чтобы найти начало пути, вычтем оба сдвига: '+end+' − ('+c+' + '+d+') = '+begin+'.',3],
    ['На шкале каждое деление равно '+unit+' единицам. От точки A('+start+') прошли '+b+' делений влево, затем '+c+' делений вправо. Какое число показывает конечная отметка? '+show([{name:'A',at:start}],0,unit,[{from:start,to:(begin-b)*unit,label:'−'+b+' дел.'},{from:(begin-b)*unit,to:last,label:'+'+c+' дел.'}]),M(A(S(V(begin),V(b)),V(c)),V(unit)),'Сначала '+begin+' − '+b+' + '+c+' = '+(begin-b+c)+' делений от нуля. Цена деления '+unit+', значит координата '+(begin-b+c)+' · '+unit+' = '+last+'.',3],
    ['Точки A('+begin+'), B('+(begin+b)+'), C('+(begin+b+c)+') отмечены по порядку. Найди длину AC. '+show([{name:'A',at:begin},{name:'B',at:begin+b},{name:'C',at:begin+b+c}]),A(S(V(begin+b),V(begin)),S(V(begin+b+c),V(begin+b))),'AB = '+b+', BC = '+c+'. Тогда AC = AB + BC = '+(b+c)+'.',3]
   ];
  }else{
   const unit=rnd(2,5),initial=begin*unit,finish=(begin+b+c-d)*unit;
   rows=[
    ['Точки A('+begin+') и B('+end+') отметили на луче. A сдвинули влево на '+b+' делений, B вправо на '+c+'. Найди расстояние между новыми точками. '+show([{name:'A',at:begin},{name:'B',at:end}],0,1,[{from:begin,to:begin-b,label:'−'+b},{from:end,to:end+c,label:'+'+c}]),Abs(S(V(begin),V(b)),A(V(end),V(c))),'Новые координаты: A = '+(begin-b)+', B = '+(end+c)+'. Расстояние равно '+(end+c)+' − '+(begin-b)+' = '+(end+c-begin+b)+'.',4],
    ['Точка M('+(begin+c)+') — середина AB, A('+begin+'). Какова координата B? '+show([{name:'A',at:begin},{name:'M',at:begin+c}]),S(M(V(2),V(begin+c)),V(begin)),'AM = '+(begin+c)+' − '+begin+' = '+c+'. Поскольку M середина, MB = AM. B = '+(begin+c)+' + '+c+' = '+(begin+2*c)+'.',3],
    ['Цена деления шкалы — '+unit+' ед. От точки A('+initial+') прошли '+b+' делений вправо, затем '+c+' вправо и '+d+' влево. Какое число показывает конечная отметка? '+show([{name:'A',at:initial}],0,unit,[{from:initial,to:(begin+b)*unit,label:'+'+b+' дел.'},{from:(begin+b)*unit,to:(begin+b+c)*unit,label:'+'+c+' дел.'},{from:(begin+b+c)*unit,to:finish,label:'−'+d+' дел.'}]),M(S(A(V(begin),V(b),V(c)),V(d)),V(unit)),'Сдвиги по делениям: '+begin+' + '+b+' + '+c+' − '+d+' = '+(begin+b+c-d)+'. Одно деление равно '+unit+' единицам; число '+(begin+b+c-d)+' · '+unit+' = '+finish+'.',5],
    ['На координатном луче A('+begin+'), B('+(begin+2*b)+'), C('+(begin+2*b+c)+'). M — середина AB. Найди расстояние MC. '+show([{name:'A',at:begin},{name:'B',at:begin+2*b},{name:'C',at:begin+2*b+c}]),S(V(begin+2*b+c),D(A(V(begin),V(begin+2*b)),V(2))),'Сначала середина AB: '+begin+' + '+b+' = '+(begin+b)+'. Теперь MC = '+(begin+2*b+c)+' − '+(begin+b)+' = '+(b+c)+'.',4],
    ['Из точки A('+begin+') прошли неизвестное число делений вправо, затем вернулись влево на '+d+' и оказались в точке C('+(begin+c)+'). Найди первый сдвиг. '+show([{name:'A',at:begin},{name:'C',at:begin+c}],0,1,[{from:begin+c+d,to:begin+c,label:'−'+d}]),S(A(V(begin+c),V(d)),V(begin)),'До возврата точка была в положении '+(begin+c)+' + '+d+' = '+(begin+c+d)+'. Первый сдвиг '+(begin+c+d)+' − '+begin+' = '+(c+d)+' делений.',4]
   ];
  }
 }
 if(id==='divisibility_rules_g5'){
  // §19. Divisibility properties and criteria, distinct tasks for all 15 slots.
  const prefix=rnd(20,990),head=rnd(11,89)*10,base=(head+10)*10;
  const start=rnd(110,350),end=start+rnd(110,420);
  const candidates10=Array.from({length:4},()=>rnd(101,999));
  candidates10[rnd(0,3)]=rnd(11,90)*10;
  const candidates2=Array.from({length:4},()=>rnd(101,999));
  candidates2[rnd(0,3)]=rnd(52,470)*2;
  const values10=candidates10.filter(n=>n%10===0);
  const values2=candidates2.filter(n=>n%2===0);
  const digitsFor=k=>digits(base,k).map(n=>n-base);
  const sumDigits=n=>String(n).split('').reduce((total,d)=>total+Number(d),0);
  const intervalProof=(k)=>{
   const fst=Math.ceil(start/k)*k,last=Math.floor(end/k)*k;
   const countMatches=count(start,end,k);
   return 'Первое кратное '+k+' в промежутке: '+fst+'. Последнее: '+last+'. Количество: '+(last/k)+' − '+(fst/k)+' + 1 = '+countMatches+'.';
  };
  if(t===0)rows=[
   ['Сколько цифр от 0 до 9 можно подставить вместо * в числе '+prefix+'*0, чтобы оно делилось на 2?',V(10),'Последняя цифра всегда 0: любое число вида '+prefix+'*0 оканчивается на чётную цифру. Подойдут все 10 цифр: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9.',1],
   ['Сколько цифр от 0 до 9 подходят вместо * в числе '+prefix+'*, чтобы оно делилось на 5?',V(2),'Число делится на 5, если оканчивается цифрой 0 или 5. Подходят две цифры: 0 и 5; число '+prefix+'* получит нужную последнюю цифру.',1],
   ['Среди чисел '+candidates10.join(', ')+' сколько делятся на 10?',V(values10.length),'На 10 делятся числа, у которых последняя цифра 0. Подходят: '+values10.join(', ')+'. Их '+values10.length+'.',2],
   ['Сколько чётных чисел среди '+candidates2.join(', ')+'?',V(values2.length),'Чётные числа оканчиваются на 0, 2, 4, 6 или 8. Подходящие числа: '+values2.join(', ')+'. Всего '+values2.length+'.',2],
   ['Сколько цифр от 0 до 9 подойдут вместо * в числе '+prefix+'*, если оно должно делиться и на 2, и на 5?',V(1),'Чтобы делиться и на 2, и на 5, число должно оканчиваться на 0. Единственная подходящая цифра для '+prefix+'* — 0.',2]
  ];
  else if(t===1)rows=[
   ['Сколько цифр x от 0 до 9 делают число '+base+' + x делящимся на 3?',V(digitsFor(3).length),'Сумма цифр числа '+base+' равна '+sumDigits(base)+'. Перебираем x от 0 до 9: подходят '+digitsFor(3).join(', ')+'. Всего '+digitsFor(3).length+'.',3],
   ['Сколько цифр x от 0 до 9 дают число '+base+' + x, делящееся на 9?',V(digitsFor(9).length),'Сумма цифр основы '+base+' равна '+sumDigits(base)+'. Для делимости на 9 подходят цифры: '+digitsFor(9).join(', ')+'. Подходящих цифр '+digitsFor(9).length+'.',3],
   ['Сколько натуральных чисел от '+start+' до '+end+' включительно делится на 5?',V(count(start,end,5)),intervalProof(5),3],
   ['Сколько натуральных чисел от '+start+' до '+end+' включительно одновременно чётны и делятся на 5?',V(count(start,end,10)),'Одновременная делимость на 2 и на 5 означает делимость на 10. '+intervalProof(10),3],
   ['Сколько цифр x от 0 до 9 сделают число '+base+' + x делящимся на 2 и 3?',V(digitsFor(6).length),'Делимость и на 2, и на 3 означает делимость на 6. Подходящие цифры x: '+digitsFor(6).join(', ')+'. Подходящих цифр '+digitsFor(6).length+'.',4]
  ];
  else rows=[
   ['Сколько чисел от '+start+' до '+end+' одновременно делится на 2, 3 и 5?',V(count(start,end,30)),'Число делится на 2, 3 и 5 одновременно, если делится на 30. '+intervalProof(30),4],
   ['Сколько цифр x от 0 до 9 сделают число '+base+' + x делящимся на 3 и 5?',V(digitsFor(15).length),'Делимость на 5 требует последнюю цифру 0 или 5, делимость на 3 — сумму цифр, кратную 3. У '+base+' сумма цифр '+sumDigits(base)+'. Из вариантов 0 и 5 подходят: '+(digitsFor(15).join(', ')||'ни одна')+'. Подходящих цифр '+digitsFor(15).length+'.',4],
   ['Сколько чисел от '+start+' до '+end+' делятся на 9 и одновременно на 2?',V(count(start,end,18)),'Общие кратные 9 и 2 — кратные 18. '+intervalProof(18),4],
   ['На участке от '+start+' до '+end+' включительно сколько чисел делятся на 3, но не делятся на 9?',S(V(count(start,end,3)),V(count(start,end,9))),'Кратных 3: '+count(start,end,3)+'. Из них кратных 9: '+count(start,end,9)+'. Вычитаем: '+count(start,end,3)+' − '+count(start,end,9)+' = '+(count(start,end,3)-count(start,end,9))+'.',5],
   ['Сколько чисел от '+start+' до '+end+' делится на 2 или на 5 (включая кратные обоим)?',S(A(V(count(start,end,2)),V(count(start,end,5))),V(count(start,end,10))),'Кратных 2: '+count(start,end,2)+', кратных 5: '+count(start,end,5)+'. Общие кратные 10: '+count(start,end,10)+'. Чтобы не посчитать их дважды: '+count(start,end,2)+' + '+count(start,end,5)+' − '+count(start,end,10)+' = '+(count(start,end,2)+count(start,end,5)-count(start,end,10))+'.',5]
  ];
 }
 if(id==='area_units_g5'){
  // §22: genuine squared-unit conversions, inverse tasks, mixed areas, then multi-step applications.
  // Each of the 15 visible families has an independently auditable calculation and numerical explanation.
  const x=rnd(12,84+16*t),y=rnd(6,28+7*t),z=rnd(3,17+5*t),w=rnd(2,13+4*t),r=rnd(2,23+4*t);
  if(t===0)rows=[
   ['Переведи '+x+' дм² в квадратные сантиметры. Сколько см² получится?',
    M(V(x),V(100)),
    '1 дм = 10 см, значит 1 дм² = 10 · 10 = 100 см². '+x+' · 100 = '+(x*100)+' см².',1],
   ['Площадь равна '+(x*100)+' см². Вырази её в дм².',
    D(V(x*100),V(100)),
    '1 дм² = 100 см². Делим '+(x*100)+' на 100: '+(x*100)+' : 100 = '+x+' дм².',1],
   ['Площадь равна '+x+' м². Сколько это квадратных дециметров?',
    M(V(x),V(100)),
    '1 м = 10 дм, поэтому 1 м² = 100 дм². '+x+' · 100 = '+(x*100)+' дм².',1],
   ['Сколько квадратных сантиметров составляют '+x+' м²?',
    M(M(V(x),V(100)),V(100)),
    '1 м² = 100 дм², а 1 дм² = 100 см². '+x+' · 100 = '+(x*100)+' дм²; '+(x*100)+' · 100 = '+(x*10000)+' см².',2],
   ['Участок занимает '+x+' га. Сколько это аров (а)?',
    M(V(x),V(100)),
    '1 га = 10 000 м², 1 а = 100 м²; 10 000 : 100 = 100 а. '+x+' · 100 = '+(x*100)+' а.',2]
  ];
  else if(t===1)rows=[
   ['Площадь комнаты '+(x*100)+' дм². Сколько это квадратных метров?',
    D(V(x*100),V(100)),
    '1 м² = 100 дм². '+(x*100)+' : 100 = '+x+' м².',2],
   ['На листе отметили '+x+' дм² и ещё '+y+' см² без перекрытия. Сколько всего см²?',
    A(M(V(x),V(100)),V(y)),
    x+' дм² = '+(x*100)+' см²; затем '+(x*100)+' + '+y+' = '+(x*100+y)+' см².',3],
   ['Прямоугольник имеет длину '+x+' дм и ширину '+y+' дм. Найди его площадь в см².',
    M(M(V(x),V(y)),V(100)),
    'Площадь: '+x+' · '+y+' = '+(x*y)+' дм². Переводим: '+(x*y)+' · 100 = '+(x*y*100)+' см².',3],
   ['Участок занимает '+x+' а и ещё '+y+' м². Сколько м² надо добавить до '+(x+1)+' а?',
    S(M(V(x+1),V(100)),A(M(V(x),V(100)),V(y))),
    x+' а = '+(x*100)+' м²; вместе с '+y+' м² это '+(x*100+y)+' м². '+(x+1)+' а = '+((x+1)*100)+' м²; добавить '+((x+1)*100)+' − '+(x*100+y)+' = '+(100-y)+' м².',3],
   ['От площади '+x+' м² отрезали '+y+' дм². Сколько дм² осталось?',
    S(M(V(x),V(100)),V(y)),
    x+' м² = '+(x*100)+' дм². Вычитаем: '+(x*100)+' − '+y+' = '+(x*100-y)+' дм².',3]
  ];
  else{
   const smallerX=rnd(2,x-1),smallerY=rnd(2,y-1),full=x*y*100;
   rows=[
    ['Площадь участка '+x+' га и '+y+' а. Под дорожку отвели '+z+' м². Сколько м² осталось?',
     S(A(M(V(x),V(10000)),M(V(y),V(100))),V(z)),
     x+' га = '+(x*10000)+' м²; '+y+' а = '+(y*100)+' м². Всего '+(x*10000)+' + '+(y*100)+' = '+(x*10000+y*100)+' м². Осталось '+(x*10000+y*100)+' − '+z+' = '+(x*10000+y*100-z)+' м².',5],
    ['Первая комната '+x+' м × '+y+' м, вторая '+z+' м × '+w+' м. Сколько всего квадратных дециметров?',
     M(A(M(V(x),V(y)),M(V(z),V(w))),V(100)),
     'Первая: '+x+' · '+y+' = '+(x*y)+' м²; вторая: '+z+' · '+w+' = '+(z*w)+' м². Вместе '+(x*y)+' + '+(z*w)+' = '+(x*y+z*w)+' м². Переводим: '+(x*y+z*w)+' · 100 = '+((x*y+z*w)*100)+' дм².',5],
    ['Первый прямоугольник '+x+' дм × '+y+' см, второй '+smallerX+' дм × '+smallerY+' см. На сколько см² первый больше второго?',
     S(M(M(V(x),V(10)),V(y)),M(M(V(smallerX),V(10)),V(smallerY))),
     x+' дм = '+(x*10)+' см; '+smallerX+' дм = '+(smallerX*10)+' см. Площади: '+(x*10)+' · '+y+' = '+(x*10*y)+' см² и '+(smallerX*10)+' · '+smallerY+' = '+(smallerX*10*smallerY)+' см². Разность '+(x*10*y)+' − '+(smallerX*10*smallerY)+' = '+(x*10*y-smallerX*10*smallerY)+' см².',5],
    ['Участок занимает '+x+' а. Сначала заняли '+y+' м², затем ещё '+z+' дм². Сколько дм² осталось?',
     S(S(M(M(V(x),V(100)),V(100)),M(V(y),V(100))),V(z)),
     x+' а = '+(x*100)+' м² = '+(x*10000)+' дм². '+y+' м² = '+(y*100)+' дм². Вычитаем: '+(x*10000)+' − '+(y*100)+' − '+z+' = '+(x*10000-y*100-z)+' дм².',5],
    ['Площадь прямоугольника '+full+' см², его длина '+x+' дм. Ширину увеличили на '+z+' см. Найди новую площадь в см².',
     M(M(V(x),V(10)),A(D(V(full),M(V(x),V(10))),V(z))),
     'Длина '+x+' дм = '+(x*10)+' см. Исходная ширина: '+full+' : '+(x*10)+' = '+(y*10)+' см. Новая ширина '+(y*10)+' + '+z+' = '+(y*10+z)+' см. Новая площадь '+(x*10)+' · '+(y*10+z)+' = '+(x*10*(y*10+z))+' см².',5]
   ];
  }
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
 if(id==='divisors_multiples_g5'){
  // §18's authoritative, textbook-specific generator is defined in v111.
  // Keep the v125 metadata contract for legacy lesson and UI QA.
  const t=stage(),p=pos(),q=g5DonorQuestion(id),m=q.mk18;
  if(!m||m.t!==t||m.p!==p||m.id!==id)throw Error('§18 authentic generator not active');
  const correct=q.choices.filter(x=>String(x.key)===String(q.correct));
  if(correct.length!==1||new Set(q.choices.map(x=>String(x.label))).size!==q.choices.length)throw Error('§18 invalid alternatives');
  return {text:q.text,ans:String(q.correct),choices:q.choices,ex:q.explain,
   sourceTopicId:id,templateId:q.templateId,correctLabel:String(correct[0].label),correctText:String(correct[0].label),
   sig:['g5',id,'v153',t,p,q.text,m.expected].join(':'),
   mk18:m,mk125:{id,t,p,steps:m.steps,plan:['v',m.expected],expected:m.expected}};
 }
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
