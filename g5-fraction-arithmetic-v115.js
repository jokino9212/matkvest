/* MatKvest grade-five fraction arithmetic: 7 topics x 3 tiers x 5 cognitive families. */
(function(){
'use strict';
const IDS=['frac_compare_den','frac_compare_num','frac_add','frac_sub','mixed_compare','mixed_add','mixed_sub'];
if(typeof g5DonorQuestion!=='function'||typeof g5Lesson!=='function'||typeof g5q!=='function'||typeof frac!=='function'||typeof mixed!=='function')throw Error('v115: fraction prerequisites unavailable');
const oldDonor=g5DonorQuestion,oldLesson=g5Lesson;
const rnd=(a,b)=>ri(a,b),stage=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0)),pos=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const D=[5,7,11,13],pickD=()=>D[rnd(0,D.length-1)];
// §29-only: broaden the four repeated denominators without changing other curricula.
const arithmeticDenominators=[5,6,7,8,9,10,11,12,13,14,15,16,18,20];
const pickArithmeticD=()=>arithmeticDenominators[rnd(0,arithmeticDenominators.length-1)];
// §27 samples a broader range; arithmetic (§29+) deliberately keeps its original denominators.
const comparisonDenominators=[5,6,7,8,9,10,11,12,14,15,16,18,20];
const pickComparisonD=()=>comparisonDenominators[rnd(0,comparisonDenominators.length-1)];
function fractionComparisonStrips(n1,d1,n2,d2){
 const row=(n,d,y)=>{
  const left=18,width=504,h=30,cell=width/d;
  const cells=Array.from({length:d},(_,i)=>'<rect x="'+(left+i*cell).toFixed(3)+'" y="'+y+'" width="'+cell.toFixed(3)+'" height="'+h+'" fill="'+(i<n?'#5d9cdc':'#edf3fc')+'"/>').join('');
  const partitions=Array.from({length:d-1},(_,i)=>{const x=(left+(i+1)*cell).toFixed(3);return '<line x1="'+x+'" x2="'+x+'" y1="'+y+'" y2="'+(y+h)+'" stroke="#52617a" stroke-width="1"/>';}).join('');
  return cells+partitions+'<rect x="'+left+'" y="'+y+'" width="'+width+'" height="'+h+'" fill="none" stroke="#52617a" stroke-width="2"/>';
 };
 const desc='Две одинаковые по длине полоски: первая разделена на '+d1+' равных частей, закрашено '+n1+'; вторая разделена на '+d2+' равных частей, закрашено '+n2+'.';
 return '<div style="width:100%;max-width:580px;overflow:hidden;margin:6px auto"><svg class="mk-g5-compare-fractions" role="img" aria-label="'+desc+'" viewBox="0 0 540 88" width="100%" style="display:block;height:auto" preserveAspectRatio="xMidYMid meet">'+row(n1,d1,6)+row(n2,d2,52)+'</svg></div>';
}

const F=(n,d)=>frac(n,d),M=(w,n,d)=>mixed(w,n,d);
const whole=(w,n,d)=>w*d+n;
function renderTotal(n,d){
 if(n<0)throw Error('Negative fraction result '+n+'/'+d);
 if(n===0)return '0';
 const w=Math.floor(n/d),rem=n%d;
 return !w?F(rem,d):!rem?String(w):M(w,rem,d);
}
function question(id,t,p,kind,text,d,terms,ops,ex,meta={}){
 const key='v115_'+id+'_L'+t+'_F'+p;
 if(!Array.isArray(terms)||!terms.length||ops.length!==terms.length-1||!Number.isSafeInteger(d)||d<1)throw Error('Invalid plan '+key);
 const raw=terms.reduce((v,x,i)=>i?ops[i-1]==='+'?v+x:v-x:x,0);
 const total=meta.absolute?Math.abs(raw):raw;
 if(!Number.isSafeInteger(total)||total<0)throw Error('Negative/invalid plan '+key+': '+JSON.stringify({terms,ops}));
 let choices,correct,answerLabel;
 if(kind==='fraction'){
  if(d<=1)throw Error('Fraction denominator missing '+key);
  answerLabel=F(total,d);correct='ok';
  choices=[{label:answerLabel,key:'ok'},{label:F(total+1,d),key:'a'},
   {label:F(total+2,d),key:'b'},{label:F(total+3,d),key:'c'}];
 }else if(kind==='mixed'){
  if(d<=1)throw Error('Mixed denominator missing '+key);
  answerLabel=renderTotal(total,d);correct='ok';
  choices=[{label:answerLabel,key:'ok'},{label:renderTotal(total+d,d),key:'a'},
   {label:renderTotal(total+2*d,d),key:'b'},{label:renderTotal(total+3*d,d),key:'c'}];
 }else if(kind==='numeric'){
  answerLabel=String(total);correct=String(total);
  choices=g5nums(total,[total+1,total+2,total+3]);
 }else throw Error('Unknown v115 kind '+kind);
 const q=g5q(text,choices,correct,ex,key);
 q.mk115={id,t,p,kind,d,terms:terms.slice(),ops:ops.slice(),expected:total,correctLabel:String(answerLabel),...meta};
 return q;
}
function compare(id,t,p,text,d,termsLeft,opsLeft,termsRight,opsRight,ex){
 const sum=(v,ops)=>v.reduce((a,x,i)=>i?ops[i-1]==='+'?a+x:a-x:x,0);
 const x=sum(termsLeft,opsLeft),y=sum(termsRight,opsRight),rel=x>y?'>':x<y?'<':'=';
 const q=g5q(text,[{label:'<',key:'lt'},{label:'>',key:'gt'},{label:'=',key:'eq'}],rel==='>'?'gt':rel==='<'?'lt':'eq',ex,'v115_'+id+'_L'+t+'_F'+p);
 q.mk115={id,t,p,kind:'compare',d,left:termsLeft,opsLeft,right:termsRight,opsRight,relation:rel};
 return q;
}
function choose(id,t,p,text,choice,wrong,ex,meta){
 const opts=[choice,...wrong].map(String),unique=[...new Set(opts)];
 if(unique.length<3)throw Error('Ambiguous options '+id+'/'+t+'/'+p);
 const q=g5q(text,unique.map((label,i)=>({label,key:i===0?'yes':'no'+i})),'yes',ex,'v115_'+id+'_L'+t+'_F'+p);
 q.mk115={id,t,p,kind:'choice',expected:choice,...meta};
 return q;
}
function relation(x,y){return x>y?'>':x<y?'<':'='}
function denCompare(t,p){
 const id='frac_compare_den',d=pickComparisonD(),a=rnd(1,d-4),b=rnd(a+1,d-2),c=rnd(1,Math.min(2,d-b-1)),e=rnd(1,Math.min(2,d-b-1));
 if(t===0){
  if(p===0)return compare(id,t,p,'Сравни '+F(a,d)+' и '+F(b,d)+'.'+fractionComparisonStrips(a,d,b,d),d,[a],[],[b],[],'Знаменатели одинаковые: '+a+' < '+b+', поэтому '+F(a,d)+' < '+F(b,d)+'.');
  if(p===1)return question(id,t,p,'numeric','Какой числитель у большей дроби: '+F(a,d)+' или '+F(b,d)+'?',1,[b],[],'Большая дробь имеет больший числитель '+b+'.');
  if(p===2)return compare(id,t,p,'Поставь знак между '+F(b,d)+' и '+F(a,d)+'.',d,[b],[],[a],[],'С одинаковым знаменателем '+d+' дробь с числителем '+b+' больше дроби с '+a+'.');
  if(p===3)return question(id,t,p,'numeric','На сколько числитель большей дроби '+F(b,d)+' больше числителя '+F(a,d)+'?',1,[b,a],['-'],'Вычитаем числители: '+b+' − '+a+' = '+(b-a)+'.');
  return compare(id,t,p,'Сравни '+F(a,d)+' и единицу '+F(d,d)+'.',d,[a],[],[d],[],'Числитель '+a+' меньше знаменателя '+d+', значит дробь меньше единицы.');
 }
 if(t===1){
  if(p===0)return compare(id,t,p,'К дроби '+F(a,d)+' прибавили '+F(c,d)+'. Сравни результат с '+F(b,d)+'.',d,[a,c],['+'],[b],[],'После сложения получаем '+F(a+c,d)+' и сравниваем числители '+(a+c)+' и '+b+'.');
  if(p===1)return compare(id,t,p,'К обеим дробям '+F(a,d)+' и '+F(b,d)+' прибавили '+F(e,d)+'. Сравни полученные дроби.',d,[a,e],['+'],[b,e],['+'],'Одинаковое слагаемое не меняет порядок дробей: '+(a+e)+' и '+(b+e)+'.');
  if(p===2){const k=Math.min(c,b-1);return compare(id,t,p,'Из '+F(b,d)+' вычли '+F(k,d)+'. Сравни с '+F(a,d)+'.',d,[b,k],['-'],[a],[],'Получили '+F(b-k,d)+', теперь сравним числители '+(b-k)+' и '+a+'.');}
  if(p===3)return question(id,t,p,'numeric','У дробей '+F(a,d)+' и '+F(b,d)+' одинаковый знаменатель. Сколько ещё долей '+F(1,d)+' надо прибавить к первой, чтобы они стали равны?',1,[b,a],['-'],'Нужно увеличить числитель на '+b+' − '+a+' = '+(b-a)+'.');
  return question(id,t,p,'numeric','Найди средний по величине числитель для дробей '+F(a,d)+', '+F(b,d)+' и '+F(a+1,d)+'.',1,[a+1],[],'Нумераторы по возрастанию: '+a+', '+(a+1)+', '+b+' (при совпадении средний всё равно '+(a+1)+').');
 }
 // Hard: both quantities change, then compare or recover unknown.
 if(p===0)return compare(id,t,p,'Сравни результаты: ('+F(a,d)+' + '+F(c,d)+') и ('+F(b,d)+' + '+F(e,d)+').',d,[a,c],['+'],[b,e],['+'],'Числители сумм: '+(a+c)+' и '+(b+e)+'. Сравни их.');
 if(p===1)return compare(id,t,p,'Первую дробь '+F(a,d)+' увеличили на '+F(c,d)+' и затем уменьшили на '+F(1,d)+'. Вторую '+F(b,d)+' уменьшили на '+F(e,d)+'. Сравни новые значения.',d,[a,c,1],['+','-'],[b,e],['-'],'Первая имеет числитель '+(a+c-1)+', вторая '+(b-e)+'.');
 if(p===2)return question(id,t,p,'numeric','Чтобы из '+F(a,d)+' получить '+F(b,d)+', сначала прибавили '+F(c,d)+'. Сколько долей '+F(1,d)+' надо прибавить или убрать после этого? Укажи модуль изменения.',1,[b,a,c],['-','-'],'После прибавления числитель '+(a+c)+'. До '+b+' не хватает или лишние '+Math.abs(b-a-c)+' долей.',{absolute:true,terms:[b,a,c]});
 if(p===3)return compare(id,t,p,'Сравни величины '+F(b,d)+' − '+F(c,d)+' + '+F(e,d)+' и '+F(a,d)+' + '+F(e,d)+'.',d,[b,c,e],['-','+'],[a,e],['+'],'После вычислений получим числители '+(b-c+e)+' и '+(a+e)+'.');
 return question(id,t,p,'numeric','У двух дробей со знаменателем '+d+' числители '+a+' и '+b+'. К первому добавили '+c+', от второго отняли '+e+'. Найди модуль разности новых числителей.',1,[b,e,a,c],['-','-','-'],'Новые числители '+(a+c)+' и '+(b-e)+'. Расстояние между ними '+Math.abs(a+c-(b-e))+'.',{absolute:true,terms:[b,e,a,c]});
}
function numCompare(t,p){
 const id='frac_compare_num',n=rnd(1,6),d1=rnd(n+4,18),d2=d1+rnd(2,9),a=rnd(1,3),b=rnd(1,3);
 if(t===0){
  if(p===0)return compare(id,t,p,'Сравни дроби с одинаковыми числителями: '+F(n,d1)+' и '+F(n,d2)+'.'+fractionComparisonStrips(n,d1,n,d2),1,[d2],[],[d1],[],'Полоски одинаковой длины: при числителе '+n+' более крупные доли у меньшего знаменателя '+d1+'. Поэтому '+F(n,d1)+' > '+F(n,d2)+'.');
  if(p===1)return question(id,t,p,'numeric','У дробей '+F(n,d1)+' и '+F(n,d2)+' одинаковый числитель. Какой знаменатель у большей дроби?',1,[d1],[],'Больше дробь с меньшим знаменателем '+d1+'.');
  if(p===2)return compare(id,t,p,'Сравни дроби '+F(n,d2)+' и '+F(n,d1)+'.',1,[d1],[],[d2],[],'Чем больше знаменатель при одинаковом числителе, тем меньше дробь.');
  if(p===3)return question(id,t,p,'numeric','На сколько знаменатель '+F(n,d2)+' больше знаменателя '+F(n,d1)+'?',1,[d2,d1],['-'],'Разность '+d2+' − '+d1+' = '+(d2-d1)+'.');
  return choose(id,t,p,'Из четырёх дробей с числителем '+n+' и знаменателями '+d1+', '+d2+', '+(d2+2)+' и '+(d2+4)+' выбери наибольшую.',F(n,d1),[F(n,d2),F(n,d2+2),F(n,d2+4)],'Сравни знаменатели '+d1+', '+d2+', '+(d2+2)+' и '+(d2+4)+'. Наименьший '+d1+' даёт наибольшую дробь '+F(n,d1)+'.',{numerator:n,denominators:[d1,d2,d2+2,d2+4]});
 }
 if(t===1){
  if(p===0)return compare(id,t,p,'Знаменатель первой дроби '+F(n,d1)+' увеличили на '+a+'. Сравни новую дробь с '+F(n,d2)+'.',1,[d2],[],[d1,a],['+'],'Сравниваем новые знаменатели '+(d1+a)+' и '+d2+' в обратном порядке.');
  if(p===1)return compare(id,t,p,'Знаменатель '+F(n,d2)+' уменьшили на '+b+'. Сравни результат с '+F(n,d1)+'.',1,[d1],[],[d2,b],['-'],'Изменённый знаменатель '+(d2-b)+'. Меньший знаменатель даёт большую дробь.');
  if(p===2)return compare(id,t,p,'У дробей '+F(n,d1)+' и '+F(n,d2)+' одинаковые числители. Первый знаменатель увеличили на '+a+', второй уменьшили на '+b+'. Сравни полученные дроби.',1,[d2,b],['-'],[d1,a],['+'],'После изменений знаменатели '+(d1+a)+' и '+(d2-b)+'. При равном числителе меньше знаменатель — больше дробь.');
  if(p===3)return compare(id,t,p,'К знаменателям '+F(n,d1)+' и '+F(n,d2)+' прибавили по '+b+'. Сравни новые дроби.',1,[d2,b],['+'],[d1,b],['+'],'Новые знаменатели '+(d1+b)+' и '+(d2+b)+'. Чем меньше знаменатель, тем больше дробь.');
  return question(id,t,p,'numeric','У дробей с числителем '+n+' знаменатели '+d1+' и '+d2+'. Первый увеличили на '+a+', второй уменьшили на '+b+'. Найди модуль разности знаменателей.',1,[d2,b,d1,a],['-','-','-'],'Новые знаменатели '+(d1+a)+' и '+(d2-b)+'. Разность по модулю '+Math.abs(d2-b-d1-a)+'.',{absolute:true,terms:[d2,b,d1,a]});
 }
 if(p===0)return compare(id,t,p,'В дроби '+F(n,d1)+' знаменатель увеличили на '+a+' и затем ещё на '+b+'. В дроби '+F(n,d2)+' знаменатель уменьшили на '+b+'. Сравни итоговые дроби.',1,[d2,b],['-'],[d1,a,b],['+','+'],'Получились знаменатели '+(d1+a+b)+' и '+(d2-b)+'. Меньший знаменатель даёт большую дробь.');
 if(p===1)return question(id,t,p,'numeric','В двух дробях числитель '+n+', знаменатели '+d1+' и '+d2+'. К первому знаменателю прибавили '+a+', из второго вычли '+b+'. Сколько единиц нужно прибавить к меньшему новому знаменателю, чтобы они сравнялись?',1,[d2,b,d1,a],['-','-','-'],'Новые знаменатели '+(d1+a)+' и '+(d2-b)+'. Их расстояние '+Math.abs(d2-b-d1-a)+'.',{absolute:true,terms:[d2,b,d1,a]});
 if(p===2)return compare(id,t,p,'К знаменателю первой дроби '+F(n,d1)+' прибавили '+a+', к знаменателю второй '+F(n,d2)+' прибавили '+b+'. Потом оба уменьшили на 1. Сравни новые дроби.',1,[d2,b,1],['+','-'],[d1,a,1],['+','-'],'Сравни новые знаменатели '+(d1+a-1)+' и '+(d2+b-1)+' в обратном порядке.');
 if(p===3)return compare(id,t,p,'У двух дробей с числителем '+n+' знаменатели '+d1+' и '+d2+'. Первый увеличили на '+a+', затем уменьшили на '+b+'. Второй уменьшили на '+b+', затем увеличили на '+a+'. Сравни дроби после всех изменений.',1,[d2,b,a],['-','+'],[d1,a,b],['+','-'],'Первый знаменатель '+d1+' + '+a+' − '+b+' = '+(d1+a-b)+'. Второй '+d2+' − '+b+' + '+a+' = '+(d2-b+a)+'. При равном числителе большая дробь имеет меньший знаменатель.');
 return compare(id,t,p,'У первой дроби '+F(n,d1)+' знаменатель увеличили на '+a+', затем уменьшили на '+b+'. У второй '+F(n,d2)+' знаменатель уменьшили на '+a+' и увеличили на '+b+'. Сравни полученные дроби.',1,[d2,a,b],['-','+'],[d1,a,b],['+','-'],'Итоговые знаменатели '+(d1+a-b)+' и '+(d2-a+b)+'. Чем меньше знаменатель, тем больше дробь.');
}
// §29: Every strip represents ONE intact, equally divided whole; comparisons are by unit fractions.
function fractionOperationDiagram(d,a,b,op){
 if(!Number.isInteger(d)||d<2||!Number.isInteger(a)||!Number.isInteger(b)||a<1||b<1||
    a>d||b>d||(op==='+'?a+b>d:a<b))throw Error('§29 diagram operands out of range');
 const counts=[a,b,op==='+'?a+b:a-b],captions=op==='+'?['Первое','Второе','Сумма']:['Было','Вычли','Осталось'];
 const left=104,width=468,h=30,rowHeight=45,content=[];
 for(let row=0;row<3;row++){
  const y=8+row*rowHeight,unit=width/d;
  const cells=Array.from({length:d},(_,i)=>'<rect x="'+(left+i*unit).toFixed(3)+
   '" y="'+y+'" width="'+unit.toFixed(3)+'" height="'+h+'" fill="'+
   (i<counts[row]?(row===1?'#f4ad64':'#5d9cdc'):'#edf3fc')+'"/>').join('');
  const divisions=Array.from({length:d-1},(_,i)=>{
   const x=(left+(i+1)*unit).toFixed(3);
   return '<line x1="'+x+'" x2="'+x+'" y1="'+y+'" y2="'+(y+h)+
    '" stroke="#52617a" stroke-width="1.2"/>';
  }).join('');
  content.push('<text x="3" y="'+(y+20)+'" font-size="16" fill="currentColor">'+captions[row]+
   '</text>'+cells+divisions+'<rect x="'+left+'" y="'+y+'" width="'+width+'" height="'+h+
   '" stroke="#52617a" stroke-width="2" fill="none"/>');
 }
 const caption='Одинаковые целые, каждое разделено на '+d+' равных частей. '+
   captions.map((name,i)=>name+': '+counts[i]+' частей').join('; ')+'.';
 return '<div style="width:100%;max-width:660px;overflow:hidden;margin:8px auto"><svg '+
  'class="mk-g5-fraction-operation" role="img" aria-label="'+caption+'" viewBox="0 0 590 145" '+
  'width="100%" style="display:block;height:auto" preserveAspectRatio="xMidYMid meet">'+
  content.join('')+'</svg></div>';
}
function exercise29(id,t,p,kind,story,expression,terms,ops,ex,diagram=''){
 const d=kind==='numeric'?1:terms.d;
 // terms must be numerator sequence, with its unit denominator attached only as metadata.
 const nums=terms.n;
 const prompt=story+' '+(kind==='numeric'?'Найди числитель результата: ':'Вычисли: ')+
  expression+'.'+diagram;
 return question(id,t,p,kind,prompt,d,nums,ops,ex);
}
function addFraction(t,p){
 const id='frac_add',d=pickArithmeticD(),
  cap=t===2?Math.max(2,Math.ceil(d/3)):Math.max(1,Math.floor((d-1)/3)),
  a=rnd(1,cap),b=rnd(1,cap),c=rnd(1,cap),e=rnd(1,cap);
 const X=(n)=>F(n,d),sum=a+b,total=a+b+c,all=total+e;
 const ex2='Складываем числители: '+a+' + '+b+' = '+sum+'. Знаменатель '+d+' не меняется. Ответ: '+X(sum)+'.';
 const expr=(xs)=>xs.map(X).join(' + ');
 const q=(p,kind,story,xs,nums=xs,ops=Array(xs.length-1).fill('+'),why='')=>
  exercise29(id,t,p,kind,story,expr(xs),{d,n:nums},ops,why);
 if(t===0){
  if(p===0)return exercise29(id,t,p,'fraction','Два слагаемых с одинаковыми знаменателями.',
   expr([a,b]),{d,n:[a,b]},['+'],ex2,fractionOperationDiagram(d,a,b,'+'));
  if(p===1)return q(p,'numeric','Сложи две доли одного целого и укажи только новый числитель.',
   [a,b],[a,b],['+'],'Числители: '+a+' + '+b+' = '+sum+'. Ответ: '+sum+'.');
  if(p===2)return q(p,'fraction','К ленте длиной '+X(a)+' м прибавили '+X(b)+' м. Найди новую длину в метрах.',
   [a,b],[a,b],['+'],'Одинаковые доли метра: '+a+' + '+b+' = '+sum+'. Итого '+X(sum)+' м.');
  if(p===3)return exercise29(id,t,p,'fraction',
   'На рисунке сравни одинаковые доли и найди их сумму.',expr([a,b]),{d,n:[a,b]},['+'],
   ex2,fractionOperationDiagram(d,a,b,'+'));
  return q(p,'fraction','В первой коробке '+a+' долей из '+d+', во второй '+b+' таких же долей. Сколько долей одного целого вместе?',
   [a,b],[a,b],['+'],'Всего '+a+' + '+b+' = '+sum+' долей из '+d+'. Ответ: '+X(sum)+'.');
 }
 if(t===1){
  if(p===0)return q(p,'fraction','Сложи три дроби с одинаковым знаменателем.',
   [a,b,c],[a,b,c],['+','+'],'Сначала '+a+' + '+b+' = '+sum+', затем '+sum+' + '+c+' = '+total+'. Ответ: '+X(total)+'.');
  if(p===1)return q(p,'fraction','Для поделки взяли три отрезка ленты. Найди общую длину в метрах.',
   [a,b,e],[a,b,e],['+','+'],'Сначала '+a+' + '+b+' = '+sum+' долей, затем добавляем '+e+
   '. Ответ: '+X(a+b+e)+' м.');
  if(p===2)return q(p,'numeric','К числителю первой дроби добавили числители ещё двух дробей с тем же знаменателем.',
   [a,b,c],[a,b,c],['+','+'],'Новый числитель: '+a+' + '+b+' + '+c+' = '+total+'. Ответ: '+total+'.');
  if(p===3)return q(p,'fraction','На координатном луче последовательно отложили три дробных отрезка. Найди пройденное расстояние в единицах.',
   [a,c,b],[a,c,b],['+','+'],'Промежуточная сумма числителей '+a+' + '+c+' = '+(a+c)+
   ', затем + '+b+' = '+total+'. Ответ: '+X(total)+'.');
  return q(p,'fraction','Сначала взяли две доли, а затем добавили третью часть. Найди общую долю целого.',
   [b,e,a],[b,e,a],['+','+'],'Сложим по порядку: '+b+' + '+e+' = '+(b+e)+
   ', затем + '+a+' = '+(a+b+e)+'. Ответ: '+X(a+b+e)+'.');
 }
 if(p===0)return exercise29(id,t,p,'fraction','Сначала вычисли суммы в каждой скобке.',
  '('+X(a)+' + '+X(b)+') + ('+X(c)+' + '+X(e)+')',{d,n:[a,b,c,e]},['+','+','+'],
  'Первая сумма '+(a+b)+'/'+d+', вторая '+(c+e)+'/'+d+
  '. Складываем '+(a+b)+' + '+(c+e)+' = '+all+'. Ответ: '+X(all)+'.');
 if(p===1){
  const target=all,missing=a;
  return exercise29(id,t,p,'fraction','Известна сумма '+X(target)+'. Найди неизвестное первое слагаемое:',
   X(target)+' − ('+X(b)+' + '+X(c)+' + '+X(e)+')',{d,n:[target,b,c,e]},['-','-','-'],
   'Сначала '+b+' + '+c+' + '+e+' = '+(b+c+e)+
   '. Из '+target+' вычитаем '+(b+c+e)+' и получаем '+missing+'/'+d+'.');
 }
 if(p===2)return exercise29(id,t,p,'numeric',
  'Вычисли числитель суммы четырёх дробей, сгруппировав их попарно.',
  '('+X(a)+' + '+X(c)+') + ('+X(b)+' + '+X(e)+')',{d,n:[a,c,b,e]},['+','+','+'],
  'Две суммы числителей: '+(a+c)+' и '+(b+e)+'. Их сумма '+all+
  '. Знаменатель остаётся '+d+'. Ответ: '+all+'.');
 if(p===3)return q(p,'fraction','В четырёх порциях содержались одинаковые доли килограмма. Сколько килограммов всего?',
  [a,b,c,e],[a,b,c,e],['+','+','+'],
  'Сначала '+a+' + '+b+' = '+sum+', затем + '+c+' = '+total+
  ', затем + '+e+' = '+all+'. Ответ: '+X(all)+' кг.');
 return exercise29(id,t,p,'fraction','Вычисли сумму двух сумм и проверь знаменатель.',
  '('+X(b)+' + '+X(e)+') + ('+X(a)+' + '+X(c)+')',{d,n:[b,e,a,c]},['+','+','+'],
  'Группы дают '+(b+e)+' и '+(a+c)+' долей; всего '+all+'/'+d+
  '. Ответ: '+X(all)+'.');
}
function subFraction(t,p){
 const id='frac_sub',d=pickArithmeticD(),A=rnd(4,d-1),b=rnd(1,A-2),
  c=rnd(1,Math.max(1,Math.min(3,A-b))),e=rnd(1,Math.max(1,Math.min(3,A-b)));
 const B=A+b+c+e,K=B+b+c+e,X=n=>F(n,d);
 const q=(kind,story,expression,nums,ops,why,diagram='')=>
  exercise29(id,t,p,kind,story,expression,{d,n:nums},ops,why,diagram);
 const two=X(A)+' − '+X(b),remain=A-b;
 if(t===0){
  if(p===0)return q('fraction','От одной дроби вычти другую с тем же знаменателем.',
   two,[A,b],['-'],'Числители: '+A+' − '+b+' = '+remain+
   '. Знаменатель '+d+' сохраняется. Ответ: '+X(remain)+'.',
   fractionOperationDiagram(d,A,b,'-'));
  if(p===1)return q('numeric','При вычитании одинаковых долей целого найди только числитель результата.',
   two,[A,b],['-'],'Вычитаем '+A+' − '+b+' = '+remain+'. Ответ: '+remain+'.');
  if(p===2)return q('fraction','Лента имела длину '+X(A)+' м, отрезали '+X(b)+' м. Найди остаток.',
   two,[A,b],['-'],'Сохраняем знаменатель '+d+
   ', из '+A+' долей вычтем '+b+'. Ответ: '+X(remain)+' м.');
  if(p===3)return q('fraction','По рисунку определи, какая доля целого остаётся после удаления части.',
   two,[A,b],['-'],'На исходной полоске '+A+' долей, удалили '+b+
   ', осталось '+remain+' из '+d+'. Ответ: '+X(remain)+'.',
   fractionOperationDiagram(d,A,b,'-'));
  return q('fraction','Было '+A+' долей единицы, '+b+' долей использовали. Запиши остаток дробью.',
   two,[A,b],['-'],'Осталось '+A+' − '+b+' = '+remain+' долей. Ответ: '+X(remain)+'.');
 }
 if(t===1){
  if(p===0)return q('fraction','Вычти из дроби две последовательные части.',
   X(B)+' − '+X(b)+' − '+X(c),[B,b,c],['-','-'],
   'Сначала '+B+' − '+b+' = '+(B-b)+', затем − '+c+
   ' = '+(B-b-c)+'. Ответ: '+X(B-b-c)+'.');
  if(p===1)return q('fraction','Из начальной доли вычти сумму двух долей.',
   X(B)+' − ('+X(b)+' + '+X(c)+')',[B,b,c],['-','-'],
   'Сначала сумма в скобках '+b+' + '+c+' = '+(b+c)+
   '. Затем '+B+' − '+(b+c)+' = '+(B-b-c)+'. Ответ: '+X(B-b-c)+'.');
  if(p===2)return q('numeric','От начального числителя нужно вычесть два последовательных изменения.',
   X(B)+' − '+X(c)+' − '+X(e),[B,c,e],['-','-'],
   'Промежуточный числитель '+(B-c)+', затем '+(B-c)+' − '+e+' = '+(B-c-e)+'.');
  if(p===3)return q('fraction','Из рулона ленты отрезали сначала одну часть, затем другую. Сколько осталось метров?',
   X(B)+' − '+X(b)+' − '+X(e),[B,b,e],['-','-'],
   'Сначала осталось '+(B-b)+' долей, затем '+(B-b)+' − '+e+
   ' = '+(B-b-e)+'. Ответ: '+X(B-b-e)+' м.');
  return q('fraction','Вычти разность двух дробей из первой дроби.',
   X(B)+' − ('+X(b)+' − '+X(c)+')',[B,b,c],['-','+'],
   'В скобках '+b+' − '+c+' = '+(b-c)+
   ' (может быть отрицательно как промежуточное изменение); вычитаем его: '+
   B+' − ('+(b-c)+') = '+(B-b+c)+'. Ответ: '+X(B-b+c)+'.');
 }
 if(p===0)return q('fraction','Вычти сумму двух дробей и ещё одну дробь.',
  X(K)+' − ('+X(b)+' + '+X(c)+') − '+X(e),[K,b,c,e],['-','-','-'],
  'Сумма в скобках '+(b+c)+'. Далее '+K+' − '+(b+c)+
  ' − '+e+' = '+(K-b-c-e)+'. Ответ: '+X(K-b-c-e)+'.');
 if(p===1)return q('fraction','Из большего количества последовательно вычти три доли.',
  X(K)+' − '+X(b)+' − '+X(c)+' − '+X(e),[K,b,c,e],['-','-','-'],
  'Сначала '+K+' − '+b+' = '+(K-b)+
  ', затем − '+c+' = '+(K-b-c)+', затем − '+e+
  ' = '+(K-b-c-e)+'. Ответ: '+X(K-b-c-e)+'.');
 if(p===2)return q('numeric','Найди числитель неизвестной дроби, если после двух вычитаний получился указанный остаток.',
  X(A)+' + '+X(b)+' + '+X(c),[A,b,c],['+','+'],
  'Восстанавливаем исходный числитель: '+A+' + '+b+
  ' + '+c+' = '+(A+b+c)+'. Ответ: '+(A+b+c)+'.');
 if(p===3)return q('fraction','Из одной целой партии вычли два равных куска и ещё одну часть. Сколько осталось?',
  X(K)+' − '+X(b)+' − '+X(b)+' − '+X(c),[K,b,b,c],['-','-','-'],
  'Всего вычли '+(2*b+c)+' долей. Осталось '+K+' − '+(2*b+c)+
  ' = '+(K-2*b-c)+'. Ответ: '+X(K-2*b-c)+'.');
 return q('fraction','Вычти сумму трёх дробей с одинаковым знаменателем.',
  X(K)+' − ('+X(b)+' + '+X(c)+' + '+X(e)+')',[K,b,c,e],['-','-','-'],
  'В скобках '+b+' + '+c+' + '+e+' = '+(b+c+e)+
  '. Затем '+K+' − '+(b+c+e)+' = '+(K-b-c-e)+'. Ответ: '+X(K-b-c-e)+'.');
}
function mixCompare(t,p){
 const id='mixed_compare',d=pickD(),w=rnd(2,5),v=rnd(1,3),a=rnd(1,Math.max(1,d-3)),b=rnd(a+1,d-1),c=rnd(1,Math.min(3,b-1));
 const A=whole(w,a,d),B=whole(w,b,d),C=whole(w+v,a,d);
 if(t===0){
  if(p===0)return compare(id,t,p,'Сравни '+M(w,a,d)+' и '+M(w,b,d)+'.',d,[A],[],[B],[],'Целые части одинаковы, сравни дробные числители '+a+' и '+b+'.');
  if(p===1)return compare(id,t,p,'Сравни '+M(w+v,a,d)+' и '+M(w,b,d)+'.',d,[C],[],[B],[],'Сначала сравни целые части '+(w+v)+' и '+w+'.');
  if(p===2)return question(id,t,p,'numeric','Какое целое число стоит перед дробной частью в большем из чисел '+M(w,a,d)+' и '+M(w+v,b,d)+'?',1,[w+v],[],'У второго числа больше целая часть: '+(w+v)+'.');
  if(p===3)return compare(id,t,p,'Сравни смешанное число '+M(w,a,d)+' и целое '+(w+1)+'.',d,[A],[],[(w+1)*d],[],'Дробная часть меньше единицы, поэтому '+M(w,a,d)+' < '+(w+1)+'.');
  return question(id,t,p,'numeric','У смешанных чисел '+M(w,a,d)+' и '+M(w,b,d)+' одинаковы целые части. На сколько различаются числители?',1,[b,a],['-'],'Разность числителей '+(b-a)+'.');
 }
 if(t===1){
  if(p===0)return compare(id,t,p,'К '+M(w,a,d)+' прибавили '+F(c,d)+'. Сравни итог с '+M(w,b,d)+'.',d,[A,c],['+'],[B],[],'Сравним числители после прибавления '+(a+c)+' и '+b+'.');
  if(p===1)return compare(id,t,p,'Из '+M(w,b,d)+' вычли '+F(c,d)+'. Сравни с '+M(w,a,d)+'.',d,[B,c],['-'],[A],[],'Оба числа выражаем в долях одного знаменателя '+d+'.');
  if(p===2)return question(id,t,p,'numeric','К целой части '+w+' смешанного числа '+M(w,a,d)+' прибавили '+v+'. Какой стала целая часть?',1,[w,v],['+'],'Целая часть стала '+(w+v)+'.');
  if(p===3)return compare(id,t,p,'К '+M(w,a,d)+' и '+M(w,b,d)+' прибавили по '+F(c,d)+'. Сравни новые значения.',d,[A,c],['+'],[B,c],['+'],'Одинаковые прибавки не меняют порядок: '+(A+c)+' и '+(B+c)+' долей.');
  return question(id,t,p,'numeric','В смешанном числе '+M(w,b,d)+' дробный числитель уменьшили на '+c+'. На сколько отличается новый числитель от числителя '+M(w,a,d)+'?',1,[b,c,a],['-','-'],'Новый числитель '+(b-c)+'. Расстояние до '+a+' равно '+Math.abs(b-c-a)+'.',{absolute:true,terms:[b,c,a]});
 }
 if(p===0)return compare(id,t,p,'К '+M(w,a,d)+' прибавили '+F(c,d)+' и затем вычли '+F(1,d)+'. Из '+M(w,b,d)+' вычли '+F(c,d)+'. Сравни результаты.',d,[A,c,1],['+','-'],[B,c],['-'],'После изменений числители '+(A+c-1)+' и '+(B-c)+'.');
 if(p===1)return question(id,t,p,'numeric','К '+M(w,a,d)+' прибавили '+F(c,d)+'. Затем к '+M(w,b,d)+' прибавили '+F(1,d)+'. На сколько долей '+F(1,d)+' различаются результаты?',1,[b,1,a,c],['+','-','-'],'Разница в единичных долях равна '+Math.abs((B+1)-(A+c))+'.',{absolute:true,terms:[b,1,a,c]});
 if(p===2)return compare(id,t,p,'Из первого числа '+M(w+v,a,d)+' вычли '+v+' целых, затем прибавили '+F(c,d)+'. Второе число '+M(w,b,d)+' не меняли. Сравни результаты.',d,[C,v*d,c],['-','+'],[B],[],'Первое число стало '+(A+c)+'/'+d+', второе '+B+'/'+d+'.');
 if(p===3)return question(id,t,p,'numeric','У чисел '+M(w,a,d)+' и '+M(w,b,d)+' целые части равны. К меньшему добавили '+F(c,d)+'. Сколько долей '+F(1,d)+' нужно добавить или убрать, чтобы числа стали равны?',1,[b,a,c],['-','-'],'Сначала разница '+(b-a)+', после изменения модуль разницы '+Math.abs(b-a-c)+'.',{absolute:true,terms:[b,a,c]});
 return compare(id,t,p,'Сравни выражения '+M(w,a,d)+' + '+F(c,d)+' − '+F(1,d)+' и '+M(w,b,d)+' − '+F(c,d)+' + '+F(1,d)+'.',d,[A,c,1],['+','-'],[B,c,1],['-','+'],'Сравни суммы в долях: '+(A+c-1)+' и '+(B-c+1)+'.');
}
function mixedAdd(t,p){
 const id='mixed_add',d=pickD(),w=rnd(1,3),v=rnd(1,3),a=rnd(2,Math.max(2,d-3)),b=rnd(1,d-a-1),c=rnd(1,Math.min(3,d-1));
 const A=whole(w,a,d),B=whole(v,b,d),carry=d-a+1,BB=whole(v,carry,d);
 if(t===0){
  if(p===0)return question(id,t,p,'mixed','Вычисли '+M(w,a,d)+' + '+M(v,b,d)+'.',d,[A,B],['+'],'Целые: '+w+' + '+v+'. Дроби: '+a+' + '+b+' = '+(a+b)+' долей; итог '+renderTotal(A+B,d)+'.');
  if(p===1)return question(id,t,p,'numeric','Найди целую часть суммы '+M(w,a,d)+' + '+M(v,b,d)+' (перехода через единицу нет).',1,[w,v],['+'],'Дробные части меньше 1 целой, поэтому целая часть '+(w+v)+'.');
  if(p===2)return question(id,t,p,'mixed','Два отрезка имеют длины '+M(w,a,d)+' м и '+M(v,b,d)+' м. Найди их общую длину.',d,[A,B],['+'],'Сумма длин '+renderTotal(A+B,d)+' м.');
  if(p===3)return question(id,t,p,'numeric','В сумме '+M(w,a,d)+' + '+M(v,b,d)+' сколько долей будет в числителе дробной части без сокращения?',1,[a,b],['+'],'Складываем числители '+a+' + '+b+' = '+(a+b)+'.');
  return question(id,t,p,'mixed','К числу '+M(w,a,d)+' прибавили '+v+' целых и '+F(b,d)+'. Запиши итог.',d,[A,v*d,b],['+','+'],'Целые и дробные части суммируются отдельно: '+renderTotal(A+B,d)+'.');
 }
 if(t===1){
  if(p===0)return question(id,t,p,'mixed','Сложи '+M(w,a,d)+' и '+M(v,carry,d)+'. При сложении дробных частей выдели целую.',d,[A,BB],['+'],'Числители '+a+' + '+carry+' = '+(a+carry)+' — больше '+d+'. Переносим 1 целую: '+renderTotal(A+BB,d)+'.');
  if(p===1)return question(id,t,p,'mixed','К '+M(w,a,d)+' прибавили '+F(carry,d)+', затем ещё '+v+' целых. Найди итог.',d,[A,carry,v*d],['+','+'],'Сумма дробных числителей '+(a+carry)+'; переносим одну целую. Получаем '+renderTotal(A+carry+v*d,d)+'.');
  if(p===2)return question(id,t,p,'numeric','Смешанные числа '+M(w,a,d)+' и '+M(v,carry,d)+' сложили. На сколько увеличилась сумма целых частей из-за переноса из дробной части?',1,[1],[],'Числители '+a+' + '+carry+' = '+(a+carry)+' ≥ '+d+', поэтому переносится одна целая.');
  if(p===3)return question(id,t,p,'mixed','Для проекта использовали '+M(w,a,d)+' м ткани и '+M(v,carry,d)+' м. Сколько метров ткани всего?',d,[A,BB],['+'],'Складываем как неправильные дроби и выделяем целую часть: '+renderTotal(A+BB,d)+'.');
  return question(id,t,p,'mixed','После сложения '+M(w,a,d)+' и '+M(v,carry,d)+' к результату прибавили '+F(c,d)+'. Найди новую сумму.',d,[A,BB,c],['+','+'],'Добавляем дробь к полученной сумме: '+renderTotal(A+BB+c,d)+'.');
 }
 // advanced always uses multiple operands (at least two arithmetic steps).
 if(p===0)return question(id,t,p,'mixed','Вычисли ('+M(w,a,d)+' + '+M(v,carry,d)+') + '+M(1,c,d)+'.',d,[A,BB,d+c],['+','+'],'Первое сложение с переносом, затем прибавляем третье число: '+renderTotal(A+BB+d+c,d)+'.');
 if(p===1)return question(id,t,p,'mixed','К '+M(w,a,d)+' добавили '+M(v,carry,d)+', потом ещё '+F(c,d)+' и 1 целую. Найди сумму.',d,[A,BB,c,d],['+','+','+'],'Суммируем четыре части в долях: '+renderTotal(A+BB+c+d,d)+'.');
 if(p===2)return question(id,t,p,'numeric','Вычисли числитель неправильной дроби, равной '+M(w,a,d)+' + '+M(v,carry,d)+' + '+F(c,d)+'. Знаменатель '+d+' не меняй.',1,[A,BB,c],['+','+'],'Переведём смешанные в неправильные: '+A+' + '+BB+' + '+c+' = '+(A+BB+c)+' долей.');
 if(p===3)return question(id,t,p,'mixed','На складе было '+M(w,a,d)+' кг муки. Привезли '+M(v,carry,d)+' кг и ещё '+M(1,c,d)+' кг. Сколько всего?',d,[A,BB,d+c],['+','+'],'Сумма трёх величин: '+renderTotal(A+BB+d+c,d)+' кг.');
 return question(id,t,p,'mixed','К сумме '+M(w,a,d)+' и '+M(v,carry,d)+' дважды прибавили по '+F(c,d)+'. Найди результат.',d,[A,BB,c,c],['+','+','+'],'Дважды прибавляем по '+c+'/'+d+', результат '+renderTotal(A+BB+2*c,d)+'.');
}
function mixedSub(t,p){
 const id='mixed_sub',d=pickD(),w=rnd(4,7),v=rnd(1,w-2),a=rnd(2,d-2),b=rnd(1,a-1),borrow=rnd(a+1,d-1),c=rnd(1,Math.min(2,a));
 const A=whole(w,a,d),B=whole(v,b,d),Borrow=whole(v,borrow,d),C=whole(w-1,a,d);
 if(t===0){
  if(p===0)return question(id,t,p,'mixed','Вычисли '+M(w,a,d)+' − '+M(v,b,d)+'.',d,[A,B],['-'],'Целые: '+w+' − '+v+', дробные: '+a+' − '+b+'. Итог '+renderTotal(A-B,d)+'.');
  if(p===1)return question(id,t,p,'numeric','У смешанных чисел '+M(w,a,d)+' и '+M(v,b,d)+' сколько целых останется после вычитания (занимать целую не нужно)?',1,[w,v],['-'],'Целые части: '+w+' − '+v+' = '+(w-v)+'.');
  if(p===2)return question(id,t,p,'mixed','Было '+M(w,a,d)+' м ленты, отрезали '+M(v,b,d)+' м. Сколько осталось?',d,[A,B],['-'],'Вычитаем целые и дробные части: '+renderTotal(A-B,d)+' м.');
  if(p===3)return question(id,t,p,'numeric','В дробной части разности '+M(w,a,d)+' − '+M(v,b,d)+' какой числитель (до сокращения)?',1,[a,b],['-'],'Знаменатели равны; числитель остатка '+a+' − '+b+' = '+(a-b)+'.');
  return question(id,t,p,'mixed','От числа '+M(w,a,d)+' вычли '+v+' целых и ещё '+F(b,d)+'. Запиши результат.',d,[A,v*d,b],['-','-'],'Вычитаем '+v+' целых и '+b+' долей: '+renderTotal(A-B,d)+'.');
 }
 if(t===1){
  if(p===0)return question(id,t,p,'mixed','Вычисли '+M(w,a,d)+' − '+M(v,borrow,d)+'. В дробной части нужно занять целую.',d,[A,Borrow],['-'],'Занимаем целую: дробная часть '+(a+d)+'/'+d+'. Вычтем '+borrow+'/'+d+', получим '+renderTotal(A-Borrow,d)+'.');
  if(p===1)return question(id,t,p,'mixed','От '+M(w,a,d)+' вычли '+M(v,borrow,d)+', затем вычли ещё '+F(c,d)+'. Найди остаток.',d,[A,Borrow,c],['-','-'],'После займа вычитаем две величины: '+renderTotal(A-Borrow-c,d)+'.');
  if(p===2)return question(id,t,p,'numeric','В примере '+M(w,a,d)+' − '+M(v,borrow,d)+' после займа одной целой сколько долей будет в числителе первой дробной части?',1,[a,d],['+'],'После займа первая дробная часть становится '+(a+d)+'/'+d+'.');
  if(p===3)return question(id,t,p,'mixed','Было '+M(w,a,d)+' кг, использовали '+M(v,borrow,d)+' кг. Найди остаток.',d,[A,Borrow],['-'],'Сначала занимаем одну целую и вычитаем: '+renderTotal(A-Borrow,d)+' кг.');
  return question(id,t,p,'mixed','Из '+M(w,a,d)+' вычли '+M(v,borrow,d)+', после этого прибавили '+F(c,d)+'. Найди значение.',d,[A,Borrow,c],['-','+'],'Сначала выполняем вычитание с заниманием, затем прибавление: '+renderTotal(A-Borrow+c,d)+'.');
 }
 if(p===0)return question(id,t,p,'mixed','Вычисли '+M(w,a,d)+' − ('+M(v,borrow,d)+' + '+F(c,d)+' + '+F(1,d)+').',d,[A,Borrow,c,1],['-','-','-'],'Сначала найдём сумму в скобках, затем выполним вычитание с займом: '+renderTotal(A-Borrow-c-1,d)+'.');
 if(p===1)return question(id,t,p,'mixed','От '+M(w,a,d)+' сначала вычли '+M(v,borrow,d)+', затем прибавили '+F(c,d)+' и вычли '+F(1,d)+'. Найди результат.',d,[A,Borrow,c,1],['-','+','-'],'Последовательно выполняем три действия: '+renderTotal(A-Borrow+c-1,d)+'.');
 if(p===2)return question(id,t,p,'numeric','Из числителя неправильной дроби '+A+'/'+d+' вычли числитель дроби '+Borrow+'/'+d+', потом ещё '+c+' долей. Каков полученный числитель?',1,[A,Borrow,c],['-','-'],'Новые числители: '+A+' − '+Borrow+' − '+c+' = '+(A-Borrow-c)+'.');
 if(p===3)return question(id,t,p,'mixed','Было '+M(w,a,d)+' м ткани. Отрезали '+M(v,borrow,d)+' м и ещё '+F(c,d)+' м, после чего купили дополнительно 1 м ткани. Сколько ткани стало?',d,[A,Borrow,c,d],['-','-','+'],'Сначала вычтем два расхода с займами, затем прибавим 1 м: '+renderTotal(A-Borrow-c+d,d)+' м.');
 return question(id,t,p,'mixed','Найди '+M(w,a,d)+' − ('+M(v,borrow,d)+' + '+F(c,d)+') + '+F(1,d)+'.',d,[A,Borrow,c,1],['-','-','+'],'Сначала складываем в скобках, потом вычитаем сумму с займами и прибавляем '+F(1,d)+': '+renderTotal(A-Borrow-c+1,d)+'.');
}
function build(id){
 const t=stage(),p=pos();
 switch(id){
  case 'frac_compare_den':return denCompare(t,p);
  case 'frac_compare_num':return numCompare(t,p);
  case 'frac_add':return addFraction(t,p);
  case 'frac_sub':return subFraction(t,p);
  case 'mixed_compare':return mixCompare(t,p);
  case 'mixed_add':return mixedAdd(t,p);
  case 'mixed_sub':return mixedSub(t,p);
  default:return oldDonor(id);
 }
}
g5DonorQuestion=function(id){return IDS.includes(id)?build(id):oldDonor(id)};
const lessons={
 frac_compare_den:'Если знаменатели одинаковые, больше дробь с большим числителем. В задачах со сложением и вычитанием сначала найди новые числители и только затем сравни. Например: 3/7 + 2/7 = 5/7, поэтому 5/7 больше 4/7.',
 frac_compare_num:'При одинаковых положительных числителях больше та дробь, у которой знаменатель меньше: её доли крупнее. Если знаменатель изменили, сначала вычисли новое число долей целого, затем сравни знаменатели.',
 frac_add:'При сложении дробей с одинаковыми знаменателями складывают числители, а знаменатель оставляют прежним. Несколько слагаемых можно объединить в скобки. Если числитель не меньше знаменателя, можно выделить целую часть.',
 frac_sub:'При вычитании дробей с одинаковыми знаменателями вычитают числители, знаменатель оставляют прежним. Для выражений со скобками сначала выполни действия в скобках, затем остальные; проверяй, что уменьшаемое не меньше вычитаемого.',
 mixed_compare:'Смешанные числа сравнивают сначала по целой части, а если они равны — по дробной. При добавлении или вычитании частей удобнее перевести числа в неправильные дроби с одинаковыми знаменателями.',
 mixed_add:'Чтобы сложить смешанные числа, сложи целые и дробные части. Если сумма дробных частей не меньше 1, выдели из неё целую часть и добавь к целой сумме. Для многошаговых задач удобно работать с неправильными дробями.',
 mixed_sub:'При вычитании смешанных чисел сначала сравни дробные части. Если у уменьшаемого дробная часть меньше, займи одну целую: 1 = d/d. Затем вычти целые и дробные части, при необходимости сократи результат.'
};
g5Lesson=function(id){return Object.prototype.hasOwnProperty.call(lessons,id)?lessons[id]:oldLesson(id)};
window.mkG5V115Arithmetic=IDS.slice();
})();