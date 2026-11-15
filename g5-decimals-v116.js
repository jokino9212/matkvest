/* MathQuest Grade 5 v116: exact-thousandth decimal arithmetic, three meaningful stages. */
(function(){
'use strict';
const IDS=['dec_compare','dec_add','dec_sub','dec_round'];
if(typeof G5_DECIMALS==='undefined'||typeof g5DonorQuestion!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof g5Lesson!=='function')throw Error('G5 v116 missing decimal prerequisites');
const previousDonor=g5DonorQuestion,previousLesson=g5Lesson;
const headings={
 dec_compare:['Сравнение десятичных дробей','Сравнение по разрядам, приписывание нулей, порядок и сравнение с границами'],
 dec_add:['Сложение десятичных дробей','Поразрядное сложение, перенос, задачи на несколько действий'],
 dec_sub:['Вычитание десятичных дробей','Поразрядное вычитание, неизвестные компоненты и обратные задачи'],
 dec_round:['Округление десятичных дробей','Округление до целых, десятых и сотых; граничные случаи']
};
for(const [id,[title,sub]] of Object.entries(headings)){
 const t=G5_DECIMALS.find(x=>x.id===id);if(!t)throw Error('G5 v116 missing topic '+id);
 t.sub=sub+'; '+t.title;t.title=title;
}
const rnd=(a,b)=>ri(a,b);
const level=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0));
const slot=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const K=n=>['v',n];
const add=(...terms)=>['add',...terms],subtract=(a,b)=>['sub',a,b],absolute=a=>['abs',a];
const maximum=(...terms)=>['max',...terms],minimum=(...terms)=>['min',...terms];
const round=(val,step)=>['round',val,step];
function result(node){
 if(!Array.isArray(node))throw Error('Invalid decimal plan');
 const [op,...args]=node;
 if(op==='v')return args[0];
 if(op==='add')return args.reduce((a,x)=>a+result(x),0);
 if(op==='sub')return result(args[0])-result(args[1]);
 if(op==='abs')return Math.abs(result(args[0]));
 if(op==='max')return Math.max(...args.map(result));
 if(op==='min')return Math.min(...args.map(result));
 if(op==='round'){
  const x=result(args[0]),step=args[1];
  if(x<0||![10,100,1000].includes(step))throw Error('Invalid rounding input');
  return Math.floor((x+step/2)/step)*step;
 }
 throw Error('Unknown decimal calculation '+op);
}
function fmt(value,places){
 if(!Number.isSafeInteger(value)||value<0)throw Error('Bad decimal value '+value);
 const whole=Math.floor(value/1000),decimal=String(value%1000).padStart(3,'0');
 if(places!==undefined){
  if(!Number.isInteger(places)||places<0||places>3)throw Error('Bad display precision '+places);
  if(value%(10**(3-places))!==0)throw Error('Unrepresentable precision '+value+'/'+places);
  return places?whole+','+decimal.slice(0,places):String(whole);
 }
 const trim=decimal.replace(/0+$/,'');
 return trim?whole+','+trim:String(whole);
}
function unit(n){return Number((n/1000).toFixed(3))}
function nQ(id,t,p,text,plan,ex,mode='decimal',sources=[],alternatives=null){
 const value=result(plan),key='g5v116_'+id+'_L'+t+'_F'+p;
 if(!Number.isSafeInteger(value)||value<0||value>2000000)throw Error('Unsafe decimal answer '+key+' '+value);
 const answer=mode==='integer'?value:unit(value);
 const options=g5nums(answer,alternatives||(mode==='integer'?[answer+1,answer+2,answer+3]:[unit(value+10),unit(value+100),unit(value+1000)]));
 const q=g5q(text,options,String(answer),ex+' Ответ: '+(mode==='integer'?answer:fmt(value))+'.',key);
 q.mk116={id,t,p,kind:'numeric',mode,plan,answerMilli:mode==='integer'?null:value,answerInt:mode==='integer'?value:null,sources};
 return q;
}
function cQ(id,t,p,text,left,right,ex,sources=[]){
 const x=result(left),y=result(right),correct=x<y?'lt':x>y?'gt':'eq';
 const q=g5q(text,[{label:'<',key:'lt'},{label:'>',key:'gt'},{label:'=',key:'eq'}],correct,ex+' Итак, '+fmt(x)+' '+(x<y?'&lt;':x>y?'>':'=')+' '+fmt(y)+'.','g5v116_'+id+'_L'+t+'_F'+p);
 q.mk116={id,t,p,kind:'sign',left,right,sign:x<y?'<':x>y?'>':'=',sources};
 return q;
}
function compare(t,p){
 const id='dec_compare',F=fmt;
 const whole=rnd(0,17+4*t),a=rnd(1,9),b=rnd(0,9),c=rnd(1,9);
 const base=whole*1000,a10=base+a*100,a100=a10+b*10,a1000=a100+c;
 const comparePair=(x,y,sx,sy)=>{
  const columns=['целых','десятых','сотых','тысячных'];
  const values=n=>[Math.floor(n/1000),Math.floor(n/100)%10,Math.floor(n/10)%10,n%10];
  const l=values(x),r=values(y),first=l.findIndex((d,i)=>d!==r[i]);
  const alignment='Запишем с одинаковым числом знаков: '+F(x,3)+' и '+F(y,3)+'. ';
  const ex=alignment+(first<0?'Все разряды равны.':'Первое различие в разряде '+columns[first]+': '+l[first]+' и '+r[first]+'.');
  return cQ(id,t,p,'Поставь знак между '+sx+' и '+sy+'.',K(x),K(y),ex,[x,y]);
 };
 const reverse=rnd(0,1);
 const pair=(x,y,dx,dy)=>reverse?comparePair(y,x,F(y,dy),F(x,dx)):comparePair(x,y,F(x,dx),F(y,dy));
 const ordered=(values,kind)=>{
  const sorted=[...values].sort((x,y)=>x-y),labels=sh(values).map(v=>F(v)).join('; ');
  const prompt=kind==='среднее по порядку'?'Упорядочи три числа: '+labels+'. Какое стоит посередине?':
   'Выбери '+kind+' из чисел: '+labels+'.';
  const tree=kind==='наибольшее'?maximum(...values.map(K)):kind==='наименьшее'?minimum(...values.map(K)):K(sorted[1]);
  const answer=result(tree),alternatives=values.filter(v=>v!==answer).map(unit);
  alternatives.push(unit(sorted.at(-1)+1));
  return nQ(id,t,p,prompt,tree,'Допишем нули до тысячных и сравним разряды слева направо. От меньшего к большему: '+sorted.map(v=>F(v,3)).join(' &lt; ')+'.','decimal',values,alternatives);
 };
 const otherDigits=digit=>[1,2,3].map(offset=>(digit+offset)%10);
 const chooseDecimal=(prompt,answer,options,ex,sources)=>{
  const q=g5q(prompt,options.map(x=>({label:F(x,3),key:String(unit(x))})),String(unit(answer)),
   ex,'g5v116_'+id+'_L'+t+'_F'+p);
  q.mk116={id,t,p,kind:'numeric',mode:'decimal',plan:K(answer),answerMilli:answer,answerInt:null,sources};
  return q;
 };
 if(t===0){
  if(p===0){const second=(whole+rnd(1,5))*1000+rnd(0,999);return pair(a1000,second,3,3);}
  if(p===1){const next=(a+rnd(1,8))%10;return pair(a10,base+next*100+rnd(1,9)*10,1,2);}
  if(p===2)return pair(a10,a10,1,3);
  if(p===3)return pair(a100,a1000,2,3);
  return pair(base+a*10,a*100+base,2,1);
 }
 if(t===1){
  if(p===0)return ordered([a1000,a10,base+(a+1)*100], 'наибольшее');
  if(p===1)return ordered([a1000,a100,base+(a-1)*100+c], 'наименьшее');
  if(p===2)return ordered([a1000,a10,base+(a+1)*100], 'среднее по порядку');
  if(p===3){
   const x=base+a*100+c,y=base+a*100+b*10;
   return pair(x,y,3,2);
  }
  const target=F(a100,2),variants=[a100,a1000,a100+10,a100-100];
  return chooseDecimal('Какое число равно '+target+'? Выбери из вариантов.',a100,variants,
   'Допишем нуль справа: '+target+' = '+F(a100,3)+'. Остальные варианты различаются хотя бы в одном разряде.',variants);
 }
 const lead=rnd(1,8),lower=base+lead*100,upper=lower+100;
 if(p===0){
  const options=[lower,(lower+upper)/2,upper,upper+10];
  const prompt='Какое число строго между '+F(lower)+' и '+F(upper)+'?';
  const answer=options[1];
  return chooseDecimal(prompt,answer,options,
   'Проверяем оба сравнения: '+F(lower)+' &lt; '+F(answer)+' &lt; '+F(upper)+'.',[lower,upper]);
 }
 if(p===1){
  const digit=rnd(1,8),offset=rnd(1,9),cap=base+lead*100+digit*10+offset;
  const prompt='В записи '+F(base+lead*100,1)+'□ пропущена цифра сотых. Какую наибольшую цифру можно поставить, чтобы число было строго меньше '+F(cap,3)+'?';
  return nQ(id,t,p,prompt,K(digit),'Допишем нуль в разряде тысячных. При цифре '+digit+' получим '+F(cap-offset,3)+' &lt; '+F(cap,3)+'. При следующей цифре получим '+F(cap-offset+10,3)+' > '+F(cap,3)+'.','integer',[cap],otherDigits(digit));
 }
 if(p===2){
  const low=b*10+c,digit=rnd(2,8),cap=base+digit*100+low,option=base+(digit+1)*100+low;
  const prompt='В записи '+whole+',□'+b+c+' пропущена цифра десятых. Какую наименьшую цифру можно поставить, чтобы число стало строго больше '+F(cap,3)+'?';
  return nQ(id,t,p,prompt,K(digit+1),'При цифре '+digit+' числа равны. Следующая цифра даёт '+F(option,3)+' > '+F(cap,3)+'.','integer',[cap],otherDigits(digit+1));
 }
 if(p===3){
  const tied=a10,high=a1000,includeThird=rnd(0,1);
  const values=[F(tied,1),F(tied,3),F(includeThird?tied:high,3),F(base+(a-1)*100,1)];
  const prompt='Сколько записей в списке обозначают '+F(tied,1)+'? Список: '+values.join('; ')+'.';
  return nQ(id,t,p,prompt,K(2+includeThird),'Дополним записи нулями до тысячных: '+[tied,tied,includeThird?tied:high,base+(a-1)*100].map(v=>F(v,3)).join('; ')+'. Сравним каждую с '+F(tied,3)+'.','integer',[tied,high],[0,1,includeThird?2:3]);
 }
 const next=rnd(0,1)?a1000+(1000-c)%10:a100;
 const values=[F(a10,1),F(a1000,3),F(a100,2),F(next,3)];
 return nQ(id,t,p,'Сколько записей в списке строго больше '+F(a100,2)+'? Список: '+values.join('; ')+'.',
  K(1+Number(next>a100)),'Дополним границу нулём: '+F(a100,3)+'. Больше неё: '+[a1000,next].filter(v=>v>a100).map(v=>F(v,3)).join('; ')+'.','integer',[a10,a1000,a100,next],[0,3,next>a100?1:2]);
}
function writtenDecimal(x,y,operator){
 const answer=operator==='+'?x+y:x-y;
 const places=Math.max(...[x,y].map(value=>fmt(value).split(',')[1]?.length||0));
 const rows=[fmt(x,places),fmt(y,places),fmt(answer,places)];
 const width=Math.max(...rows.map(text=>text.length));
 const operation=rows.map((text,i)=>(i===1?operator+' ':'  ')+text.padStart(width));
 operation.splice(2,0,'─'.repeat(width+2));
 return '<pre class="g5-decimal-column" aria-label="Вычисление столбиком" style="display:inline-block;max-width:100%;margin:.35em 0;padding:.35em .6em;white-space:pre;line-height:1.25;font:inherit;font-family:monospace">'+operation.join('\n')+'</pre>';
}
function decimalStep(x,y,operator){
 const result=operator==='+'?x+y:x-y;
 return fmt(x)+' '+operator+' '+fmt(y)+' = '+fmt(result);
}
function addQuestions(t,p){
 const id='dec_add',F=fmt;
 const a=rnd(3,16)*1000+rnd(1,9)*100,b=rnd(1,5)*1000+rnd(1,9)*10;
 const c=rnd(2,15)*100+rnd(1,9)*10+rnd(1,9),d=rnd(2,20)*100+rnd(1,9)*10+rnd(1,9);
 const A=K(a),B=K(b),C=K(c),D=K(d);
 const ask=(text,plan,ex,inputs)=>nQ(id,t,p,text,plan,ex,'decimal',inputs);
 const sum=(x,y)=>decimalStep(x,y,'+'),diff=(x,y)=>decimalStep(x,y,'−');
 if(t===0){
  if(p===0){
   const left=rnd(2,18)*1000+rnd(1,4)*100, right=rnd(1,9)*1000+rnd(1,4)*100;
   return ask('Вычисли '+F(left)+' + '+F(right)+'.',add(K(left),K(right)),
    'Ставим запятую под запятой. Складываем отдельно десятые и целые.<br>'+writtenDecimal(left,right,'+'),[left,right]);
  }
  if(p===1){
   const right=rnd(10,89)*10+rnd(1,9);
   return ask('Сложи '+F(a)+' и '+F(right)+'.',add(A,K(right)),
    'Дописываем нули справа, чтобы дробные части были одной длины.<br>'+writtenDecimal(a,right,'+'),[a,right]);
  }
  if(p===2){
   const tenth=rnd(5,9),left=a-a%1000+tenth*100,right=rnd(10-tenth,9)*100;
   return ask('Найди сумму '+F(left)+' + '+F(right)+'.',add(K(left),K(right)),
    'Сумма десятых — '+((left%1000+right)/100)+' десятых. Переносим одну целую в разряд единиц.<br>'+writtenDecimal(left,right,'+'),[left,right]);
  }
  if(p===3)return ask('Было '+F(a)+' м ленты. Добавили '+F(b)+' м. Сколько метров стало?',add(A,B),
   'Складываем длины: '+sum(a,b)+'.',[a,b]);
  const whole=rnd(2,20)*1000;
  return ask('Прибавь целое число '+F(whole)+' к '+F(c)+'.',add(K(whole),C),
   'У целого числа после запятой можно записать нули.<br>'+writtenDecimal(whole,c,'+'),[whole,c]);
 }
 if(t===1){
  if(p===0)return ask('Вычисли '+F(a)+' + '+F(b)+' + '+F(c)+'.',add(A,B,C),
   'Сначала '+sum(a,b)+'. Затем '+sum(a+b,c)+'.',[a,b,c]);
  if(p===1){
   const pair=(Math.floor(c/1000)+1)*1000,complement=pair-c;
   return ask('Сгруппируй слагаемые до целого: '+F(c)+' + '+F(b)+' + '+F(complement)+'. Найди сумму.',add(C,B,K(complement)),
    'По переместительному и сочетательному свойствам сначала сложим удобную пару: '+sum(c,complement)+'. Затем '+sum(pair,b)+'.',[c,b,complement]);
  }
  if(p===2)return ask('Сумма двух чисел равна '+F(a+b)+'. Одно слагаемое равно '+F(b)+'. Найди второе.',subtract(K(a+b),B),
   'Вычитаем известное слагаемое: '+diff(a+b,b)+'. Проверка: '+sum(a,b)+'.',[a+b,b]);
  if(p===3)return ask('В первой коробке '+F(a)+' кг. Во второй на '+F(c)+' кг больше. Сколько килограммов в двух коробках?',add(A,add(A,C)),
   'Во второй коробке '+sum(a,c)+' кг. Всего '+sum(a,a+c)+' кг.',[a,c]);
  return ask('К '+F(a)+' прибавили разность '+F(b+c)+' и '+F(b)+'. Найди результат.',add(A,subtract(K(b+c),B)),
   'Разность равна '+diff(b+c,b)+'. Прибавляем её: '+sum(a,c)+'.',[a,b+c,b]);
 }
 if(p===0)return ask('Вычисли ('+F(a)+' + '+F(b)+') + ('+F(c)+' + '+F(d)+').',add(add(A,B),add(C,D)),
  'В первых скобках '+sum(a,b)+'. Во вторых '+sum(c,d)+'. Складываем результаты: '+sum(a+b,c+d)+'.',[a,b,c,d]);
 if(p===1)return ask('До остановки прошли '+F(a)+' км. После остановки прошли на '+F(c)+' км больше, чем до неё. До дома осталось '+F(d)+' км. Какова длина маршрута?',add(A,add(A,C),D),
  'После остановки: '+sum(a,c)+' км. Всего прошли '+sum(a,a+c)+' км. Весь маршрут: '+sum(2*a+c,d)+' км.',[a,c,d]);
 if(p===2)return ask('Вычисли '+F(a+c)+' + '+F(b)+' + '+F(d)+' − '+F(c)+'.',subtract(add(K(a+c),B,D),C),
  'Перегруппируем: '+diff(a+c,c)+'. Затем '+sum(a,b)+'. В конце '+sum(a+b,d)+'.',[a+c,b,d,c]);
 if(p===3)return ask('Известно, что x + '+F(b)+' + '+F(c)+' = '+F(a+b+c)+'. Найди x, затем прибавь к нему '+F(d)+'.',add(subtract(K(a+b+c),add(B,C)),D),
  'Известные слагаемые: '+sum(b,c)+'. Находим x: '+diff(a+b+c,b+c)+'. Прибавляем: '+sum(a,d)+'.',[a+b+c,b,c,d]);
 return ask('В первый день потратили '+F(a)+' кг. Во второй потратили на '+F(c)+' кг меньше, чем в первый. В третий потратили '+F(d)+' кг. Сколько килограммов потратили за три дня?',add(A,subtract(A,C),D),
  'Во второй день '+diff(a,c)+' кг. За первые два дня '+sum(a,a-c)+' кг. За три дня '+sum(2*a-c,d)+' кг.',[a,c,d]);
}
function subtractQuestions(t,p){
 const id='dec_sub',F=fmt;
 const a=rnd(17,35)*1000+rnd(1,9)*100,b=rnd(3,5)*1000+rnd(1,9)*10;
 const c=rnd(2,15)*100+rnd(1,9)*10+rnd(1,9),d=rnd(2,20)*100+rnd(1,9)*10+rnd(1,9);
 const A=K(a),B=K(b),C=K(c),D=K(d);
 const ask=(text,plan,ex,inputs)=>nQ(id,t,p,text,plan,ex,'decimal',inputs);
 const sum=(x,y)=>decimalStep(x,y,'+'),diff=(x,y)=>decimalStep(x,y,'−');
 if(t===0){
  if(p===0){
   const left=rnd(10,19)*1000+rnd(5,9)*100,right=rnd(1,9)*1000+rnd(1,4)*100;
   return ask('Вычисли '+F(left)+' − '+F(right)+'.',subtract(K(left),K(right)),
    'Вычитаем десятые из десятых, а целые из целых.<br>'+writtenDecimal(left,right,'−'),[left,right]);
  }
  if(p===1)return ask('Из '+F(a)+' вычти '+F(b)+'.',subtract(A,B),
   'Допишем нуль в разряде сотых. Занимаем одну десятую: это 10 сотых.<br>'+writtenDecimal(a,b,'−'),[a,b]);
  if(p===2){
   const whole=rnd(3,19)*1000;
   return ask('Из целого числа '+F(whole)+' вычти '+F(c)+'.',subtract(K(whole),C),
    'Пишем целое с нулями. Для вычитания дробной части одну целую заменяем 10 десятыми, затем занимаем в следующих разрядах.<br>'+writtenDecimal(whole,c,'−'),[whole,c]);
  }
  if(p===3)return ask('Было '+F(a)+' л воды, отлили '+F(c)+' л. Сколько литров осталось?',subtract(A,C),
   'Из первоначального количества вычитаем отлитое: '+diff(a,c)+' л.',[a,c]);
  const other=a-c,values=sh([a,other]);
  return ask('На сколько различаются длины '+F(values[0])+' м и '+F(values[1])+' м?',subtract(A,K(other)),
   'Большая длина: '+F(a)+' м. Из неё вычитаем меньшую: '+diff(a,other)+' м.',values);
 }
 if(t===1){
  if(p===0)return ask('Вычисли '+F(a)+' − '+F(b)+' − '+F(c)+'.',subtract(subtract(A,B),C),
   'Слева направо: '+diff(a,b)+'. Затем '+diff(a-b,c)+'.',[a,b,c]);
  if(p===1)return ask('Вычисли '+F(a)+' − ('+F(b)+' + '+F(d)+').',subtract(A,add(B,D)),
   'В скобках '+sum(b,d)+'. Затем '+diff(a,b+d)+'.',[a,b,d]);
  if(p===2)return ask('После вычитания '+F(c)+' получили '+F(a-c)+'. Найди уменьшаемое.',add(C,K(a-c)),
   'Прибавляем вычитаемое к разности: '+sum(a-c,c)+'. Проверка: '+diff(a,c)+'.',[c,a-c]);
  if(p===3)return ask('Из '+F(a)+' вычли неизвестное число и получили '+F(a-b)+'. Найди вычитаемое.',subtract(A,K(a-b)),
   'Из уменьшаемого вычитаем разность: '+diff(a,a-b)+'. Проверка: '+diff(a,b)+'.',[a,a-b]);
  return ask('В коробке '+F(a)+' кг. Из неё убрали '+F(b)+' кг, затем добавили '+F(d)+' кг. Сколько килограммов стало?',add(subtract(A,B),D),
   'После первого действия '+diff(a,b)+' кг. После добавления '+sum(a-b,d)+' кг.',[a,b,d]);
 }
 if(p===0)return ask('Вычисли ('+F(a)+' − '+F(b)+') − ('+F(c+d)+' − '+F(d)+').',subtract(subtract(A,B),subtract(K(c+d),D)),
  'Первые скобки: '+diff(a,b)+'. Вторые: '+diff(c+d,d)+'. Разность: '+diff(a-b,c)+'.',[a,b,c+d,d]);
 if(p===1)return ask('В баке '+F(a)+' л. Утром отлили '+F(b)+' л, вечером на '+F(c)+' л больше, чем утром. Сколько литров осталось?',subtract(A,add(B,add(B,C))),
  'Вечером отлили '+sum(b,c)+' л. За день отлили '+sum(b,b+c)+' л. Осталось '+diff(a,2*b+c)+' л.',[a,b,c]);
 if(p===2)return ask('Из числа вычли '+F(b)+' и прибавили '+F(c)+'. Получили '+F(a-b+c)+'. Найди первоначальное число.',add(subtract(K(a-b+c),C),B),
  'Вычтем прибавленное: '+diff(a-b+c,c)+'. Вернём вычтенное: '+sum(a-b,b)+'. Проверка: '+sum(a-b,c)+'.',[b,c,a-b+c]);
 if(p===3)return ask('По первому пути расстояние '+F(a)+' км. По второму оно меньше на '+F(b)+' км, но из-за ремонта ко второму добавили '+F(d)+' км. На сколько километров второй путь теперь короче?',subtract(A,add(subtract(A,B),D)),
  'Второй путь до ремонта: '+diff(a,b)+' км. После: '+sum(a-b,d)+' км. Разница: '+diff(a,a-b+d)+' км.',[a,b,d]);
 return ask('В двух ящиках вместе '+F(a)+' кг. В первом '+F(b)+' кг. Из второго взяли '+F(c)+' кг и переложили в первый. Сколько килограммов осталось во втором?',subtract(subtract(A,B),C),
  'Во втором было '+diff(a,b)+' кг. После переноса осталось '+diff(a-b,c)+' кг. В первом теперь '+sum(b,c)+' кг. В сумме снова '+sum(b+c,a-b-c)+' кг.',[a,b,c]);
}
function roundQuestions(t,p){
 const id='dec_round';
 const r=rnd(1900,37500),whole=rnd(2,22)*1000,base=rnd(18,32)*1000+rnd(100,970);
 const b=rnd(230,840),c=rnd(110,650),e=rnd(60,290);
 const R=K(r),A=K(base),B=K(b),C=K(c),E=K(e),F=fmt;
 if(t===0){
  if(p===0)return nQ(id,t,p,'Округли '+F(r)+' до сотых.',round(R,10),'Смотрим на цифру тысячных и округляем сотые.','decimal',[r]);
  if(p===1)return nQ(id,t,p,'Округли '+F(r)+' до десятых.',round(R,100),'Смотрим на сотые; цифры 5–9 увеличивают десятые на 1.','decimal',[r]);
  if(p===2)return nQ(id,t,p,'Округли '+F(r)+' до целых.',round(R,1000),'Смотрим на первую цифру после запятой.','decimal',[r]);
  if(p===3){const k=rnd(1,8)*1000+rnd(1,8)*100+50;return nQ(id,t,p,'Округли '+F(k)+' до десятых (сотые равны 5).',round(K(k),100),'При цифре 5 округляем вверх.','decimal',[k]);}
  const k=rnd(1,9)*1000+rnd(10,80)*10+5;return nQ(id,t,p,'Округли '+F(k)+' до сотых (тысячные равны 5).',round(K(k),10),'При ровно пяти тысячных сотые увеличиваются на 1.','decimal',[k]);
 }
 if(t===1){
  if(p===0)return nQ(id,t,p,'Найди сумму '+F(base)+' + '+F(b)+' и округли её до десятых.',round(add(A,B),100),'Сначала сложение, затем округление результата.','decimal',[base,b]);
  if(p===1)return nQ(id,t,p,'Вычисли '+F(base)+' − '+F(c)+' и округли результат до сотых.',round(subtract(A,C),10),'Сначала разность, затем округление до сотых.','decimal',[base,c]);
  if(p===2)return nQ(id,t,p,'Число '+F(r)+' сначала округли до сотых, затем полученное число до десятых.',round(round(R,10),100),'Это последовательное округление в два этапа.','decimal',[r]);
  if(p===3)return nQ(id,t,p,'Сложи '+F(base)+' и '+F(b)+', затем округли сумму до целых.',round(add(A,B),1000),'Сначала сумма, потом проверяем десятые и округляем целую часть.','decimal',[base,b]);
  return nQ(id,t,p,'Вычисли '+F(base)+' − '+F(b)+', затем округли значение до десятых.',round(subtract(A,B),100),'Сначала выполняем вычитание, затем округление.','decimal',[base,b]);
 }
 if(p===0)return nQ(id,t,p,'Округли '+F(r)+' до сотых, затем до десятых. На сколько полученное значение отличается от прямого округления '+F(r)+' до десятых?',absolute(subtract(round(round(R,10),100),round(R,100))),'Сравниваем прямое и двухэтапное округление.','decimal',[r]);
 if(p===1)return nQ(id,t,p,'Сначала вычисли '+F(base)+' + '+F(b)+' − '+F(c)+' + '+F(e)+'. Округли результат до десятых.',round(add(subtract(add(A,B),C),E),100),'Три арифметических действия, затем округление.','decimal',[base,b,c,e]);
 if(p===2)return cQ(id,t,p,'Округли суммы '+F(base)+' + '+F(b)+' и '+F(base)+' + '+F(c)+' до десятых, затем сравни.',round(add(A,B),100),round(add(A,C),100),'Сначала два сложения, затем два округления и сравнение.',[base,b,c]);
 if(p===3)return nQ(id,t,p,'Вычисли '+F(base)+' − '+F(b)+' − '+F(c)+'. Округли разность до сотых.',round(subtract(subtract(A,B),C),10),'После двух вычитаний смотрим на тысячные.','decimal',[base,b,c]);
 return nQ(id,t,p,'Округли '+F(base)+' и '+F(base+b)+' до сотых. На сколько отличаются два округлённых значения?',absolute(subtract(round(K(base+b),10),round(A,10))),'Сначала независимо округляем, затем вычитаем меньшее из большего.','decimal',[base,base+b]);
}
function build(id){
 const t=level(),p=slot();
 if(id==='dec_compare')return compare(t,p);
 if(id==='dec_add')return addQuestions(t,p);
 if(id==='dec_sub')return subtractQuestions(t,p);
 if(id==='dec_round')return roundQuestions(t,p);
 return previousDonor(id);
}
g5DonorQuestion=function(id){return IDS.includes(id)?build(id):previousDonor(id)};
const lessons={
 dec_compare:'Сначала сравни целые части. Если они равны, допиши нули справа до одинакового числа знаков после запятой и сравни цифры слева направо. Например, 4,3 = 4,30, а 4,30 &lt; 4,37: десятые равны, в сотых 0 &lt; 7. Если все разряды равны, числа равны. Чтобы проверить, что число строго между двумя границами, сравни его с каждой: 4,30 &lt; 4,35 &lt; 4,37.',
 dec_add:'Поставь запятые одну под другой и допиши справа нули, если нужно. Складывай цифры справа налево. Если в разряде набралось 10, перенеси единицу в соседний разряд слева. В ответе запятая остаётся под запятыми слагаемых.<br>'+writtenDecimal(3750,860,'+')+'<br>При нескольких действиях сначала вычисли скобки. Известные слагаемые иногда можно перегруппировать так, чтобы получить целое число.',
 dec_sub:'Поставь запятые одну под другой. Допиши справа нули, чтобы в обоих числах было одинаковое количество знаков после запятой. Вычитай справа налево. Если цифры не хватает, займи одну единицу из соседнего разряда слева и преврати её в десять единиц текущего разряда.<br>'+writtenDecimal(4300,1750,'−')+'<br>Для проверки прибавь вычитаемое к разности. Должно получиться уменьшаемое.',
 dec_round:'Округляя до десятых, смотри на сотые; до сотых — на тысячные; до целых — на десятые. Если следующая цифра 5–9, увеличь сохраняемый разряд. Последовательное округление иногда отличается от прямого.'
};
g5Lesson=function(id){return Object.prototype.hasOwnProperty.call(lessons,id)?lessons[id]:previousLesson(id)};
window.mkG5V116DecimalTopics=IDS.slice();
})();
