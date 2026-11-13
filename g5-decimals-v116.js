/* MathQuest Grade 5 v116: exact-thousandth decimal arithmetic, three meaningful stages. */
(function(){
'use strict';
const IDS=['dec_compare','dec_add','dec_sub','dec_round'];
if(typeof G5_DECIMALS==='undefined'||typeof g5DonorQuestion!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof g5Lesson!=='function')throw Error('G5 v116 missing decimal prerequisites');
const previousDonor=g5DonorQuestion,previousLesson=g5Lesson;
const headings={
 dec_compare:['Сравнение десятичных дробей','Сравнение по разрядам, приписывание нулей, сравнение выражений'],
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
function nQ(id,t,p,text,plan,ex,mode='decimal',sources=[]){
 const value=result(plan),key='g5v116_'+id+'_L'+t+'_F'+p;
 if(!Number.isSafeInteger(value)||value<0||value>2000000)throw Error('Unsafe decimal answer '+key+' '+value);
 const answer=mode==='integer'?value:unit(value);
 const options=mode==='integer'?g5nums(answer,[answer+1,answer+2,answer+3]):g5nums(answer,[unit(value+10),unit(value+100),unit(value+1000)]);
 const q=g5q(text,options,String(answer),ex+' Ответ: '+(mode==='integer'?answer:fmt(value))+'.',key);
 q.mk116={id,t,p,kind:'numeric',mode,plan,answerMilli:mode==='integer'?null:value,answerInt:mode==='integer'?value:null,sources};
 return q;
}
function cQ(id,t,p,text,left,right,ex,sources=[]){
 const x=result(left),y=result(right),correct=x<y?'lt':x>y?'gt':'eq';
 const q=g5q(text,[{label:'<',key:'lt'},{label:'>',key:'gt'},{label:'=',key:'eq'}],correct,ex+' Итак, '+fmt(x)+' '+(x<y?'<':x>y?'>':'=')+' '+fmt(y)+'.','g5v116_'+id+'_L'+t+'_F'+p);
 q.mk116={id,t,p,kind:'sign',left,right,sign:x<y?'<':x>y?'>':'=',sources};
 return q;
}
function compare(t,p){
 const id='dec_compare';
 const x=rnd(3,17)*1000+rnd(0,999),y=rnd(3,17)*1000+rnd(0,999);
 const b=rnd(120,980),c=rnd(20,790),e=rnd(30,530);
 const X=K(x),Y=K(y),B=K(b),C=K(c),E=K(e);
 const F=fmt;
 if(t===0){
  if(p===0)return cQ(id,t,p,'Поставь знак между '+F(x)+' и '+F(y)+'.',X,Y,'Сравни целые, затем десятые, сотые и тысячные.',[x,y]);
  if(p===1)return nQ(id,t,p,'Из чисел '+F(x)+' и '+F(y)+' выбери большее.',maximum(X,Y),'Сравним разряды; выбираем большее.', 'decimal',[x,y]);
  if(p===2)return nQ(id,t,p,'Из двух чисел '+F(x)+' и '+F(y)+' назови меньшее.',minimum(X,Y),'Выбираем число с меньшей первой различающейся цифрой.', 'decimal',[x,y]);
  if(p===3){const val=rnd(2,15)*1000+rnd(1,9)*100;return cQ(id,t,p,'Сравни '+F(val,1)+' и '+F(val,2)+' (к первой записи приписали ноль справа).',K(val),K(val),'Приписывание нуля справа после запятой не меняет значение.',[val]);}
  const whole=rnd(2,8)*1000,less=whole+rnd(1,9)*100,more=whole+rnd(1,9)*100+rnd(1,9)*10;
  return cQ(id,t,p,'Сравни '+F(less,1)+' и '+F(more,2)+'.',K(less),K(more),'Сначала сравним десятые, затем сотые.',[less,more]);
 }
 if(t===1){
  if(p===0)return cQ(id,t,p,'Сравни выражения ('+F(x)+' + '+F(b)+') и ('+F(y)+' + '+F(c)+').',add(X,B),add(Y,C),'Сначала вычислим суммы, затем сравним результаты.',[x,b,y,c]);
  if(p===1)return cQ(id,t,p,'Из '+F(x)+' вычли '+F(b)+'. Сравни остаток с '+F(y)+'.',subtract(X,B),Y,'Сначала выполним вычитание, затем сравним разряды.',[x,b,y]);
  if(p===2)return nQ(id,t,p,'Какое из двух значений больше: '+F(x)+' + '+F(b)+' или '+F(y)+' + '+F(c)+'?',maximum(add(X,B),add(Y,C)),'Вычислим обе суммы и выберем большее.','decimal',[x,b,y,c]);
  if(p===3)return nQ(id,t,p,'На сколько большее из чисел '+F(x)+' и '+F(y)+' превосходит меньшее?',absolute(subtract(X,Y)),'Находим положительную разность большего и меньшего.','decimal',[x,y]);
  return cQ(id,t,p,'Первое число '+F(x)+' увеличили на '+F(b)+'. Второе число '+F(x+b)+' оставили без изменений. Сравни результаты.',add(X,B),K(x+b),'Сначала выполняем сложение и проверяем равенство.',[x,b,x+b]);
 }
 if(p===0)return cQ(id,t,p,'Сравни ('+F(x)+' + '+F(b)+' − '+F(c)+') и ('+F(y)+' + '+F(e)+').',subtract(add(X,B),C),add(Y,E),'Сначала вычислим обе суммы, затем вычтем и сравним.',[x,b,c,y,e]);
 if(p===1)return nQ(id,t,p,'Вычисли три суммы: '+F(x)+' + '+F(b)+', '+F(y)+' + '+F(c)+', '+F(x)+' + '+F(c)+' + '+F(e)+'. Найди наибольшую.',maximum(add(X,B),add(Y,C),add(X,C,E)),'Найдём значения всех выражений, затем максимум.','decimal',[x,b,y,c,e]);
 if(p===2)return nQ(id,t,p,'Сколько нужно прибавить к меньшему из значений ('+F(x)+' + '+F(b)+') и ('+F(y)+' + '+F(c)+'), чтобы получить большее?',absolute(subtract(add(X,B),add(Y,C))),'Вычисляем обе суммы, затем их положительную разность.','decimal',[x,b,y,c]);
 if(p===3)return cQ(id,t,p,'Округли суммы ('+F(x)+' + '+F(b)+') и ('+F(y)+' + '+F(c)+') до десятых. Сравни полученные значения.',round(add(X,B),100),round(add(Y,C),100),'После вычисления сумм округлим обе до десятых и сравним.',[x,b,y,c]);
 return nQ(id,t,p,'Найди модуль разности значений ('+F(x)+' + '+F(b)+' − '+F(c)+') и ('+F(y)+' + '+F(e)+').',absolute(subtract(subtract(add(X,B),C),add(Y,E))),'Сначала вычислим значения в скобках, затем модуль их разности.','decimal',[x,b,c,y,e]);
}
function addQuestions(t,p){
 const id='dec_add';
 const a=rnd(9,25)*1000+rnd(0,999),b=rnd(1,5)*1000+rnd(0,999),c=rnd(1,3)*1000+rnd(0,999),e=rnd(150,870);
 const A=K(a),B=K(b),C=K(c),E=K(e),F=fmt;
 if(t===0){
  if(p===0)return nQ(id,t,p,'Вычисли '+F(a)+' + '+F(b)+'.',add(A,B),'Поставь запятые под запятыми и сложи одинаковые разряды.','decimal',[a,b]);
  if(p===1)return nQ(id,t,p,'К '+F(a)+' м ленты добавили '+F(b)+' м. Сколько метров стало?',add(A,B),'Складываем длины с одинаковыми единицами измерения.','decimal',[a,b]);
  if(p===2){const ten=rnd(2,9)*100,cent=rnd(1,9)*10;return nQ(id,t,p,'Сложи '+F(ten,1)+' и '+F(cent,2)+'.',add(K(ten),K(cent)),'Для сложения допишем нуль после десятых и сложим разряды.','decimal',[ten,cent]);}
  if(p===3)return nQ(id,t,p,'Сумма двух чисел равна '+F(a+b)+'. Одно слагаемое равно '+F(b)+'. Найди второе.',subtract(K(a+b),B),'Неизвестное слагаемое равно сумме минус известное.','decimal',[a+b,b]);
  const v=rnd(2,9)*1000+rnd(1,9)*100;return nQ(id,t,p,'Сложи '+F(v,2)+' и '+F(b)+'.',add(K(v),B),'Выравниваем десятичные разряды.','decimal',[v,b]);
 }
 if(t===1){
  if(p===0)return nQ(id,t,p,'Вычисли '+F(a)+' + '+F(b)+' + '+F(c)+'.',add(A,B,C),'Сначала сложим первые два, затем прибавим третье слагаемое.','decimal',[a,b,c]);
  if(p===1)return nQ(id,t,p,'Найди '+F(a)+' + ('+F(b)+' + '+F(e)+').',add(A,add(B,E)),'В скобках складываем, затем прибавляем первое число.','decimal',[a,b,e]);
  if(p===2)return nQ(id,t,p,'Утром привезли '+F(a)+' кг, днём '+F(b)+' кг, вечером '+F(c)+' кг. Сколько всего?',add(A,B,C),'Суммируем три массы в килограммах.','decimal',[a,b,c]);
  if(p===3)return nQ(id,t,p,'Из суммы '+F(a)+' + '+F(b)+' + '+F(c)+' вычли слагаемое '+F(b)+'. Чему равна оставшаяся сумма?',subtract(add(A,B,C),B),'Вычисляем сумму, затем вычитаем одно слагаемое.','decimal',[a,b,c]);
  return nQ(id,t,p,'К '+F(a)+' прибавили '+F(b)+', затем ещё '+F(e)+'. Найди результат.',add(A,B,E),'Это последовательное сложение трёх десятичных чисел.','decimal',[a,b,e]);
 }
 if(p===0)return nQ(id,t,p,'Вычисли ('+F(a)+' + '+F(b)+') + ('+F(c)+' + '+F(e)+').',add(add(A,B),add(C,E)),'Сначала вычисляем две суммы в скобках, затем их общую сумму.','decimal',[a,b,c,e]);
 if(p===1)return nQ(id,t,p,'За три дня собрали '+F(a)+', '+F(b)+' и '+F(c)+' кг. Потом добавили ещё '+F(e)+' кг. Сколько килограммов всего?',add(A,B,C,E),'Сумма всех четырёх величин.','decimal',[a,b,c,e]);
 if(p===2)return nQ(id,t,p,'Из суммы четырёх чисел '+F(a)+' + '+F(b)+' + '+F(c)+' + '+F(e)+' вычли '+F(b)+'. Найди остаток.',subtract(add(A,B,C,E),B),'Вычислим сумму, затем вычтем указанное слагаемое.','decimal',[a,b,c,e]);
 if(p===3)return nQ(id,t,p,'Известно, что x + '+F(b)+' + '+F(c)+' = '+F(a+b+c)+'. Найди x, затем прибавь к нему '+F(e)+'.',add(subtract(K(a+b+c),add(B,C)),E),'Сначала восстановим x, затем прибавим новое слагаемое.','decimal',[a+b+c,b,c,e]);
 return nQ(id,t,p,'Первую сумму составили из '+F(a)+' и '+F(b)+', вторую — из '+F(c)+' и '+F(e)+'. Найди общую сумму четырёх чисел.',add(add(A,B),add(C,E)),'Сложим по парам и объединим результаты.','decimal',[a,b,c,e]);
}
function subtractQuestions(t,p){
 const id='dec_sub',a=rnd(17,35)*1000+rnd(100,999),b=rnd(1,4)*1000+rnd(1,999),c=rnd(1,3)*1000+rnd(1,999),e=rnd(200,890);
 const A=K(a),B=K(b),C=K(c),E=K(e),F=fmt;
 if(t===0){
  if(p===0)return nQ(id,t,p,'Вычисли '+F(a)+' − '+F(b)+'.',subtract(A,B),'Запятая под запятой. Вычитаем одинаковые разряды.','decimal',[a,b]);
  if(p===1)return nQ(id,t,p,'Было '+F(a)+' кг, израсходовали '+F(c)+' кг. Сколько осталось?',subtract(A,C),'Из первоначальной массы вычтем израсходованную.','decimal',[a,c]);
  if(p===2)return nQ(id,t,p,'Из числа '+F(a)+' вычти '+F(e)+'.',subtract(A,E),'Уменьшаемое больше вычитаемого; выполняем вычитание по разрядам.','decimal',[a,e]);
  if(p===3)return nQ(id,t,p,'Какова разность между '+F(a)+' и '+F(b)+'?',subtract(A,B),'Разность равна большему минус меньшее.','decimal',[a,b]);
  return nQ(id,t,p,'В сосуде '+F(a)+' л воды. Вылито '+F(e)+' л. Сколько литров осталось?',subtract(A,E),'Вычтем отлитый объём из первоначального.','decimal',[a,e]);
 }
 if(t===1){
  if(p===0)return nQ(id,t,p,'Вычисли '+F(a)+' − '+F(b)+' − '+F(c)+'.',subtract(subtract(A,B),C),'Последовательно выполни два вычитания по разрядам.','decimal',[a,b,c]);
  if(p===1)return nQ(id,t,p,'Вычисли '+F(a)+' − ('+F(b)+' + '+F(c)+').',subtract(A,add(B,C)),'Сначала сложим вычитаемые в скобках, затем вычтем сумму.','decimal',[a,b,c]);
  if(p===2)return nQ(id,t,p,'От '+F(a)+' вычли '+F(b)+', а затем прибавили '+F(e)+'. Найди итог.',add(subtract(A,B),E),'После вычитания прибавим десятичную дробь.','decimal',[a,b,e]);
  if(p===3)return nQ(id,t,p,'Из '+F(a)+' вычли неизвестное x и получили '+F(a-b-c)+'. Найди x.',subtract(A,K(a-b-c)),'Неизвестное вычитаемое находим обратным действием.','decimal',[a,a-b-c]);
  return nQ(id,t,p,'После двух вычитаний из '+F(a)+' сначала '+F(b)+', потом '+F(e)+' сколько осталось?',subtract(subtract(A,B),E),'Уменьшаем сначала на одно, затем на другое число.','decimal',[a,b,e]);
 }
 if(p===0)return nQ(id,t,p,'Вычисли '+F(a)+' − '+F(b)+' − '+F(c)+' − '+F(e)+'.',subtract(subtract(subtract(A,B),C),E),'Выполняем три последовательных вычитания.','decimal',[a,b,c,e]);
 if(p===1)return nQ(id,t,p,'Вычисли '+F(a)+' − ('+F(b)+' + '+F(c)+') − '+F(e)+'.',subtract(subtract(A,add(B,C)),E),'Сначала скобки, затем два вычитания.','decimal',[a,b,c,e]);
 if(p===2)return nQ(id,t,p,'Из '+F(a)+' вычли '+F(b)+', прибавили '+F(c)+' и вычли '+F(e)+'. Найди результат.',subtract(add(subtract(A,B),C),E),'Чередуем три действия слева направо.','decimal',[a,b,c,e]);
 if(p===3)return nQ(id,t,p,'В баке было '+F(a)+' л, израсходовали '+F(b)+' л и '+F(c)+' л. Затем долили '+F(e)+' л. Сколько стало?',add(subtract(subtract(A,B),C),E),'Вычитаем расходы и прибавляем долив.','decimal',[a,b,c,e]);
 return nQ(id,t,p,'Реши задачу: из '+F(a)+' м вычли сначала '+F(b)+' м, затем сумму '+F(c)+' м и '+F(e)+' м. Какова оставшаяся длина?',subtract(subtract(A,B),add(C,E)),'Сложим вторую пару вычитаемых, затем найдём остаток.','decimal',[a,b,c,e]);
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
 dec_compare:'Сначала сравнивай целые части, затем десятые, сотые и тысячные. Приписывание нуля справа в десятичной части не меняет значение. На более сложных уровнях сначала вычисли выражения, потом сравни их результаты.',
 dec_add:'При сложении десятичных дробей запиши числа запятая под запятой. Дополни короткую дробную часть нулями при необходимости. Сложи одинаковые разряды, не меняя положение запятой. Для нескольких действий соблюдай скобки и порядок вычислений.',
 dec_sub:'При вычитании десятичных дробей выровняй запятые, дополни разряды нулями и вычти по разрядам. Неизвестное вычитаемое находи обратным действием. В многошаговых заданиях сначала вычисли скобки.',
 dec_round:'Округляя до десятых, смотри на сотые; до сотых — на тысячные; до целых — на десятые. Если следующая цифра 5–9, увеличь сохраняемый разряд. Последовательное округление иногда отличается от прямого.'
};
g5Lesson=function(id){return Object.prototype.hasOwnProperty.call(lessons,id)?lessons[id]:previousLesson(id)};
window.mkG5V116DecimalTopics=IDS.slice();
})();