(function () {
'use strict';

const legacyTopics = new Map(g1AllTopics().map(item => [rawCourseId(item.id), item]));

function extra(id, title, rule, example, generate) {
 return {id:'moro_'+id, title, rule, example, generate};
}

function existing(id, title) {
 return {id,title};
}

function visual(type, data) {
 return {type,data};
}

function counters(count) {
 return visual('g1Counters',{count});
}

function choose(list) {
 return list[ri(0,list.length-1)];
}

function numeric(text, answer, explanation, picture = null) {
 return {text,answer,explanation,picture};
}

function select(text, answer, options, explanation, picture = null) {
 return {...numeric(text,answer,explanation,picture),options};
}

const signs = ['<','=','>'];

function compare(a,b) {
 return a===b?'=':a>b?'>':'<';
}

function counting(d, limit = 9) {
 const n=ri(1,limit);
 if(d===0) {
  const mark=choose(['○','□','△']);
  return select('Сколько фигур в ряду? '+Array(n).fill(mark).join(' '),n,
   [n,...g1UniqueNums(n,1,limit)],'Посчитай фигуры по одной. Их '+n+'.');
 }
 if(d===1) {
  const size=ri(3,limit), position=ri(1,size);
  const row=Array.from({length:size},(_,i)=>i===position-1?'★':'○').join(' ');
  return numeric('На каком месте звезда, если считать слева? '+row,position,'Начинаем отсчёт слева. Место звезды — '+position+'.');
 }
 const size=ri(3,limit), position=ri(1,size), fromRight=size-position+1;
 const row=Array.from({length:size},(_,i)=>i===position-1?'★':'○').join(' ');
 return numeric('На каком месте звезда, если считать справа? '+row,fromRight,'Начинаем отсчёт справа. Место звезды — '+fromRight+'.');
}

const dailySequences=[
 ['проснуться','одеться','позавтракать','выйти из дома'],
 ['взять книгу','открыть книгу','прочитать страницу','закрыть книгу'],
 ['взять лейку','набрать воду','полить цветок','убрать лейку'],
 ['взять лист','нарисовать картинку','раскрасить картинку','показать рисунок'],
 ['взять мяч','положить мяч на землю','ударить по мячу','догнать мяч'],
 ['взять конверт','вложить письмо','заклеить конверт','отнести письмо на почту']
];

function timeOrder(d) {
 const sequence=choose(dailySequences), row=sequence.map((step,i)=>String(i+1)+'. '+step).join('<br>');
 const index=ri(0,1), first=sequence[index], third=sequence[index+2];
 if(d===0) {
  const askFirst=ri(0,1)===0, step=sequence[askFirst?0:3];
  return select(row+'<br>Что сделали '+(askFirst?'сначала':'в последнюю очередь')+'?',step,sequence,'Найди '+(askFirst?'первое':'последнее')+' действие в списке.');
 }
 if(d===1) {
  const after=ri(0,1)===1, edge=after?ri(0,2):ri(1,3);
  const answer=sequence[edge+(after?1:-1)];
  return select(row+'<br>Какое действие было сразу '+(after?'после':'перед')+' шагом '+(edge+1)+'?',answer,sequence,'Соседнее действие: '+answer+'.');
 }
 return select('События идут по порядку:<br>'+row+'<br>Какое действие было после «'+first+'», но перед «'+third+'»?',sequence[index+1],sequence,'Между этими шагами было действие «'+sequence[index+1]+'».');
}

function groups(d, difference) {
 const larger=ri(2,d===0?6:10), smaller=ri(1,larger-(difference?1:0));
 const leftFirst=ri(0,1)===0, a=leftFirst?larger:smaller, b=leftFirst?smaller:larger;
 const picture=visual('g1Groups',{a,b});
 if(difference) {
  const rest=larger-smaller, direction=leftFirst?'слева':'справа';
  if(d===0) return numeric('Соедини кружки парами. Сколько кружков осталось без пары?',rest,larger+' − '+smaller+' = '+rest,picture);
  if(d===1) return numeric('На сколько кружков '+direction+' больше?',rest,larger+' − '+smaller+' = '+rest,picture);
  return numeric('Сколько кружков нужно добавить '+(leftFirst?'справа':'слева')+', чтобы стало поровну?',rest,smaller+' + '+rest+' = '+larger,picture);
 }
 const more=ri(0,1)===1, where=a===b?'Поровну':(a>b)===more?'Слева':'Справа';
 if(d===0) return select('Где кружков '+(more?'больше':'меньше')+'?',where,['Слева','Справа','Поровну'],'Слева '+a+', справа '+b+'.',picture);
 if(d===1) {
  const options=['Столько же, сколько справа','Больше, чем справа','Меньше, чем справа'];
  return select('Сравни группы. Сколько кружков слева?',options[a===b?0:a>b?1:2],options,'Слева '+a+', справа '+b+'.',picture);
 }
 const text='В какой группе фигур было '+(more?'больше':'меньше')+'? Слева '+a+', справа '+b+'.';
 return select(text,where,['Слева','Справа','Поровну'],'Сравни '+a+' и '+b+'.');
}

function compareNumbers(d) {
 const left=ri(0,10), a=ri(1,9), amount=ri(1,10-a);
 if(d===0) {
  const right=ri(0,10), sign=compare(left,right);
  return select('Выбери знак: '+left+' □ '+right+'.',sign,signs,left+' '+sign+' '+right+'.');
 }
 if(d===1) {
  const right=a+amount, sign=compare(left,right);
  return select('Вычисли сумму и сравни: '+left+' □ '+a+' + '+amount+'.',sign,signs,a+' + '+amount+' = '+right+'. Значит, '+left+' '+sign+' '+right+'.');
 }
 const right=10-a, addend=Math.min(amount,10-left), sign=compare(left+addend,right);
 return select('Вычисли слева и справа, затем сравни: '+left+' + '+addend+' □ 10 − '+a+'.',sign,signs,'Слева '+(left+addend)+', справа '+right+'.');
}

function firstSigns(d) {
 const a=ri(1,4), addition=ri(0,1)===1, b=ri(1,addition?5-a:a);
 const result=addition?a+b:a-b, sign=addition?'+':'−';
 if(d===0) return select('Было столько фишек. '+(addition?'Добавили':'Убрали')+' '+b+'. Какой знак нужен?',sign,['+','−'],'Запись: '+a+' '+sign+' '+b+' = '+result+'.',counters(a));
 if(d===1) return select('Выбери знак действия: '+a+' □ '+b+' = '+result+'.',sign,['+','−'],'Подходит знак '+sign+'.');
 if(ri(0,1)===0) return select('Закончи запись равенства: '+a+' '+sign+' '+b+' □ '+result+'.', '=', ['+','−','='],'Слева тоже '+result+'. Между равными значениями ставим =.');
 return select('В записи '+a+' □ '+b+' = '+result+' пропал знак. Каким действием получим '+result+'?',sign,['+','−','='],'Подходит знак '+sign+'.');
}

function lengthComparison(d) {
 const a=ri(1,9), b=ri(1,9), askLonger=ri(0,1)===1;
 const equal=a===b, answer=equal?'Одинаковые':(a>b)===askLonger?'A':'B';
 const explanation=equal?'Длины отрезков одинаковые.':'A занимает '+a+' равных частей, B занимает '+b+'.';
 if(d===0) return select('Какой отрезок '+(askLonger?'длиннее':'короче')+'?',answer,['A','B','Одинаковые'],explanation,visual('g1MoroLengths',{a,b,aligned:true}));
 if(d===1) return select('У отрезков разные начала. Какой '+(askLonger?'длиннее':'короче')+'?',answer,['A','B','Одинаковые'],explanation,visual('g1MoroLengths',{a,b,aligned:false}));
 return select('Сравни длины. A занимает '+a+' клетки, B занимает '+b+' клетки. Какой '+(askLonger?'длиннее':'короче')+'?',answer,['A','B','Одинаковые'],explanation);
}

function lines(d) {
 const types=['Прямая линия','Кривая линия','Отрезок','Ломаная','Точка'];
 const type=choose(types);
 if(d===0) return select('Что показано на рисунке?',type,[type,...types.filter(value=>value!==type).slice(0,3)],
  'На рисунке — '+type.toLowerCase()+'.',visual('g1MoroLines',{type,style:ri(0,3)}));
 const count=ri(2,d===1?6:8), style=ri(0,3);
 if(d===1) return numeric('Сколько звеньев у ломаной?',count,'Каждая прямая часть — звено. Их '+count+'.',visual('g1MoroLines',{type:'Ломаная',count,style}));
 return numeric('Сколько вершин у незамкнутой ломаной, включая её концы?',count+1,'У '+count+' звеньев на одну вершину больше: '+count+' + 1 = '+(count+1)+'.',visual('g1MoroLines',{type:'Ломаная',count,style}));
}

function angle(d) {
 const isRight=ri(0,1)===1, turn=ri(0,7)*45, opening=isRight?90:choose([40,55,110,130,145]);
 const drawing=visual('g1MoroAngle',{turn,opening});
 if(d===0) {
  if(ri(0,1)===0) return select('Что образуют две линии на рисунке?', 'Угол',['Угол','Отрезок','Круг'],'Две стороны с общей вершиной образуют угол.',drawing);
  return select('Как называется отмеченная точка угла?', 'Вершина',['Вершина','Сторона','Отрезок'],'Общая точка двух сторон — это вершина угла.',drawing);
 }
 if(d===1) return select('Это прямой угол?',isRight?'Да':'Нет',['Да','Нет'],isRight?'Он совпадает с уголком листа.':'Он отличается от уголка листа.',drawing);
 const diff=opening<90?'Меньше':opening>90?'Больше':'Такой же';
 return select('Сравни этот угол с углом листа бумаги.',diff,['Меньше','Такой же','Больше'],'Уголок листа — прямой. Показанный угол '+(isRight?'тоже прямой.':diff.toLowerCase()+' прямого.'),drawing);
}

function step(d, amount) {
 const b=Array.isArray(amount)?choose(amount):amount, add=ri(0,1)===1;
 const a=ri(add?0:b,add?10-b:10), result=add?a+b:a-b, sign=add?'+':'−';
 if(d===0) return numeric('Вычисли '+a+' '+sign+' '+b+'.',result,a+' '+sign+' '+b+' = '+result+'.');
 if(d===1) return numeric('Восстанови число: '+a+' '+sign+' □ = '+result+'.',b,a+' '+sign+' '+b+' = '+result+'.');
 return numeric('Восстанови начало: □ '+sign+' '+b+' = '+result+'.',a,result+(add?' − ':' + ')+b+' = '+a+'.');
}

function change(d) {
 const a=ri(2,8), more=ri(0,1)===1, b=ri(1,more?10-a:a), result=more?a+b:a-b;
 if(d===0) return numeric((more?'Увеличь ':'Уменьши ')+a+' на '+b+'.',result,a+(more?' + ':' − ')+b+' = '+result+'.');
 if(d===1) return numeric('У Лены '+a+' фишек. У Веры на '+b+(more?' больше':' меньше')+'. Сколько фишек у Веры?',result,a+(more?' + ':' − ')+b+' = '+result+'.');
 return numeric('Число '+(more?'увеличили':'уменьшили')+' на '+b+' и получили '+result+'. Какое число было сначала?',a,result+(more?' − ':' + ')+b+' = '+a+'.');
}

function terms(d, subtraction) {
 const a=ri(3,8), b=ri(1,subtraction?a:10-a), result=subtraction?a-b:a+b, sign=subtraction?'−':'+';
 const names=subtraction?['уменьшаемое','вычитаемое','разность']:['первое слагаемое','второе слагаемое','сумма'];
 const index=ri(0,2), operation=a+' '+sign+' '+b+' = '+result;
 if(d===0) return select('Посмотри на запись '+operation+'. Как называется '+(index===0?'первое число':index===1?'второе число':'результат')+'?',names[index],names,'Это '+names[index]+'.');
 if(d===1) return numeric('Записано '+operation+'. Найди число, которое называется «'+names[index]+'».',[a,b,result][index],names[index]+' — '+[a,b,result][index]+'.');
 return numeric('Известно: '+names[0]+' — '+a+', '+names[1]+' — '+b+'. Найди число, которое называется «'+names[2]+'».',result,operation+'.');
}

function differenceStory(d) {
 const a=ri(3,10), b=ri(1,a-1), delta=a-b, item=choose(['фишек','жетонов','карандашей','кубиков','кружков']);
 const first=ri(0,1)===0?'Лены':'Тани', second=first==='Лены'?'Тани':'Лены';
 if(d===0) return numeric('У '+first+' '+a+' '+item+', у '+second+' — '+b+'. На сколько у '+first+' больше?',delta,a+' − '+b+' = '+delta+'.');
 if(d===1) return numeric('У '+second+' '+b+' '+item+', у '+first+' — '+a+'. На сколько у '+second+' меньше?',delta,a+' − '+b+' = '+delta+'.');
 return numeric('У '+first+' '+a+' '+item+', у '+second+' — '+b+'. Сколько предметов должна добавить вторая девочка, чтобы стало поровну?',delta,b+' + '+delta+' = '+a+'.');
}

function commutation(d) {
 const a=ri(1,4), b=ri(5,10-a), result=a+b;
 if(d===0) return numeric('Поменяй слагаемые местами: '+a+' + '+b+' = '+b+' + □.',a,'Слагаемые '+a+' и '+b+' поменялись местами.');
 if(d===1) return numeric('Известно, что '+b+' + '+a+' = '+result+'. Чему равно '+a+' + '+b+'?',result,'От перестановки слагаемых сумма не меняется.');
 return numeric('Что пропущено: '+a+' + □ = '+b+' + '+a+'?',b,'В обеих суммах одинаковые слагаемые: '+a+' и '+b+'.');
}

function rectangles(d) {
 const square=ri(0,1)===0, side=ri(2,6), width=square?side:side+ri(1,4);
 const drawing=visual('g1MoroRectangle',{side,width,turn:ri(0,3)*25});
 if(d===0) return select('У фигуры четыре прямых угла. Какое название точнее?',square?'Квадрат':'Прямоугольник с разными сторонами',
  ['Квадрат','Прямоугольник с разными сторонами'],'Длины соседних сторон '+side+' и '+width+' клетки.',drawing);
 if(d===1) return select('Можно ли назвать эту фигуру квадратом?',square?'Да':'Нет',['Да','Нет'],square?'Все четыре стороны равны.':'Соседние стороны имеют разную длину.',drawing);
 const other=ri(1,5);
 return select('У прямоугольника соседние стороны '+side+' см и '+(square?side:side+other)+' см. Можно ли назвать его квадратом?',square?'Да':'Нет',['Да','Нет'],square?'В прямоугольнике с равными сторонами все стороны равны.':'У квадрата все стороны равны.');
}

function connected(d) {
 const result=ri(4,10), a=ri(1,result-1), b=result-a;
 if(d===0) return numeric('Два слагаемых — '+a+' и '+b+'. Найди сумму.',result,a+' + '+b+' = '+result+'.');
 if(d===1) return numeric('Известно: '+a+' + '+b+' = '+result+'. Чему равно '+result+' − '+a+'?',b,'Вычли одно слагаемое, осталось второе.');
 return numeric('Сумма равна '+result+', одно слагаемое равно '+a+'. Найди другое слагаемое.',b,result+' − '+a+' = '+b+'.');
}

function smallTable(d) {
 const a=ri(6,10), b=ri(1,a-1), result=a-b;
 if(d===0) return numeric('Вычисли '+a+' − '+b+'.',result,a+' − '+b+' = '+result+'.');
 if(d===1) return numeric('Известно, что '+result+' + '+b+' = '+a+'. Чему равно '+a+' − '+b+'?',result,a+' − '+b+' = '+result+'.');
 return numeric('Разность равна '+result+'. Какое число вычли из '+a+'?',b,a+' − '+result+' = '+b+'.');
}

function measure(d, liquid) {
 const unit=liquid?'л':'кг', name=liquid?'воды':'яблок', a=ri(2,7), b=ri(1,8-a), total=a+b;
 const prompt=liquid?'В одной канистре ':'В одном пакете ', other=liquid?'в другой':'в другом';
 if(d===0) return select('Сравни: '+a+' '+unit+' □ '+b+' '+unit+'.',compare(a,b),signs,'Единицы одинаковые. Сравни '+a+' и '+b+'.');
 if(d===1) return numeric(prompt+a+' '+unit+' '+name+', '+other+' — '+b+' '+unit+'. Сколько '+unit+' вместе?',total,a+' + '+b+' = '+total+' ('+unit+').');
 return numeric('Всего '+total+' '+unit+' '+name+' в двух '+(liquid?'канистрах':'пакетах')+'. '+prompt+a+' '+unit+'. Сколько '+unit+' '+other+'?',b,total+' − '+a+' = '+b+' ('+unit+').');
}

function decimeters(d) {
 const cm=ri(11,19), rest=cm-10;
 if(d===0) {
  const n=ri(4,16), sign=compare(10,n);
  return select('Сравни: 1 дм □ '+n+' см.',sign,signs,'1 дм = 10 см. Сравни 10 и '+n+'.');
 }
 if(d===1) return numeric('Сколько сантиметров в 1 дм '+rest+' см?',cm,'1 дм = 10 см. 10 + '+rest+' = '+cm+' (см).');
 const object=choose(['Лента','Тесьма','Полоска бумаги']);
 return numeric(object+' длиной '+cm+' см состоит из полного дециметра и ещё нескольких сантиметров. Сколько сантиметров после дециметра?',rest,cm+' − 10 = '+rest+' (см).');
}

function numerationArithmetic(d) {
 const n=ri(1,9), full=10+n;
 if(d===0) return numeric('Вычисли 10 + '+n+'.',full,'Один десяток и '+n+' единиц: '+full+'.');
 if(d===1) {
  const removeTen=ri(0,1)===1, b=removeTen?10:n, answer=full-b;
  return numeric('Вычисли '+full+' − '+b+'.',answer,full+' состоит из 10 и '+n+'. Осталось '+answer+'.');
 }
 if(ri(0,1)===0) return numeric('Какое число прибавили к 10, чтобы получить '+full+'?',n,full+' − 10 = '+n+'.');
 return numeric('Какое число потеряло '+n+' единиц и стало равно 10?',full,'Возвращаем '+n+' единиц: 10 + '+n+' = '+full+'.');
}

function twoStep(d) {
 const a=ri(2,d===2?7:9), b=ri(1,5), first=a+b;
 if(d===0) {
  const c=ri(1,3), result=first+c;
  return numeric('На полке было '+a+' книг. Поставили ещё '+b+', а потом ещё '+c+'. Сколько книг стало?',result,
   'Сначала '+a+' + '+b+' = '+first+'. Потом '+first+' + '+c+' = '+result+'.');
 }
 const removed=ri(1,Math.min(first-1,6)), result=first-removed;
 const path='Сначала '+a+' + '+b+' = '+first+'. Потом '+first+' − '+removed+' = '+result+'.';
 if(d===1) return numeric('Было '+a+' кубиков. Добавили '+b+', затем убрали '+removed+'. Сколько кубиков стало?',result,path);
 if(ri(0,1)===0) return numeric('У Веры '+a+' фишек. У Димы на '+b+' больше. Сколько фишек у них вместе?',a+first,
  'У Димы '+a+' + '+b+' = '+first+'. Вместе '+a+' + '+first+' = '+(a+first)+'.');
 return numeric('У Веры '+a+' фишек. У Димы на '+b+' больше. Дима отдал '+removed+' фишек. Сколько у него осталось?',result,path);
}

function tabular(d, subtraction) {
 const a=ri(2,9), b=ri(11-a,9), result=a+b, toTen=10-a, after=b-toTen;
 if(!subtraction) {
  if(d===0) return numeric('Вычисли '+a+' + '+b+'.',result,a+' + '+toTen+' = 10; 10 + '+after+' = '+result+'.');
  if(d===1) return numeric('В сумме '+a+' + '+b+' сначала прибавь '+toTen+' до 10. Сколько ещё надо прибавить?',after,b+' − '+toTen+' = '+after+'.');
  return numeric('Сумма двух однозначных чисел — '+result+'. Первое слагаемое — '+a+'. Найди второе.',b,result+' − '+a+' = '+b+'. Проверка: '+a+' + '+b+' = '+result+'.');
 }
 if(d===0) return numeric('Вычисли '+result+' − '+b+'.',a,result+' − '+after+' = 10; 10 − '+toTen+' = '+a+'.');
 if(d===1) return numeric('В примере '+result+' − '+b+' сначала вычли '+after+' и получили 10. Сколько осталось вычесть?',toTen,b+' − '+after+' = '+toTen+'.');
 return numeric('После вычитания из '+result+' осталось '+a+'. Какое число вычли?',b,result+' − '+a+' = '+b+'.');
}

function review(d) {
 const n=ri(11,20), a=ri(2,9), b=ri(1,8);
 if(d===0) {
  const type=ri(0,2);
  if(type===0) return numeric('Какое число стоит перед '+n+'?',n-1,'Сделай один шаг назад: '+n+' − 1 = '+(n-1)+'.');
  if(type===1) return lines(0);
  return numeric('Вычисли '+a+' + '+b+'.',a+b,a+' + '+b+' = '+(a+b)+'.');
 }
 if(d===1) {
  const type=ri(0,2);
  if(type===0) return numeric('Записано '+n+' см. Сколько сантиметров окажется после одного полного дециметра?',n-10,n+' − 10 = '+(n-10)+' (см).');
  if(type===1) return measure(1,ri(0,1)===1);
  return numeric('Из '+n+' фишек убрали '+a+'. Сколько осталось?',n-a,n+' − '+a+' = '+(n-a)+'.');
 }
 if(ri(0,1)===0) return select('Вставь знак: '+n+' − '+a+' □ '+b+' + 3.',compare(n-a,b+3),signs,'Слева '+(n-a)+', справа '+(b+3)+'.');
 const rest=n-b, add=ri(1,Math.min(8,20-rest)), result=rest+add;
 return numeric('Было '+n+' карандашей. Взяли '+b+', а потом положили ещё '+add+'. Сколько стало?',result,
  'Сначала '+n+' − '+b+' = '+rest+'. Потом '+rest+' + '+add+' = '+result+'.');
}

function firstFive(d) {
 if(d===0) return counting(0,5);
 const a=ri(1,4), b=ri(1,5-a), total=a+b;
 if(d===1) {
  const small=ri(0,1)===0, smallerFirst=ri(0,1)===0, left=smallerFirst?a:total, right=smallerFirst?total:a;
  return numeric('Какое число '+(small?'меньше':'больше')+': '+left+' или '+right+'?',small?a:total,a+' стоит перед '+total+' при счёте.');
 }
 const mark=choose(['○','□','△']), row=Array(total).fill(mark).join(' ');
 return numeric('Есть '+row+'. '+a+' из этих фигур закроем. Сколько фигур останется?',b,total+' − '+a+' = '+b+'.');
}

function drawing(question) {
 const data=question.visual.data;
 let body='', label='';
 if(question.visual.type==='g1MoroLengths') {
  const {a,b,aligned}=data;
  const startA=55, startB=aligned?startA:105;
  body='<text x="19" y="44">A</text><text x="19" y="94">B</text>'+
   '<path d="M'+startA+' 40 h'+(24*a)+' M'+startB+' 90 h'+(24*b)+'"/>';
  label='Два отрезка, A и B';
 }else if(question.visual.type==='g1MoroLines') {
  const {type,style,count}=data;
  if(type==='Ломаная'){
   const steps=count||3;
   const points=Array.from({length:steps+1},(_,index)=>{
    const x=30+index*270/steps, high=(index+style)%2===0;
    return x+','+(high?31+(index%3)*4+style*2:93-(index%3)*4-style*2);
   });
   body='<polyline points="'+points.join(' ')+'"/>';
  }else if(type==='Кривая линия') {
   body='<path d="M25 '+(70+style*6)+' Q105 8 164 64 T304 '+(60-style*6)+'"/>';
  }else if(type==='Точка') {
   body='<circle cx="'+(135+style*24)+'" cy="64" r="5" fill="currentColor"/>';
  }else{
   const y1=42+style*10, y2=88-style*10;
   body='<path d="M25 '+y1+' L305 '+y2+'"/>';
   if(type==='Отрезок')body+='<circle cx="25" cy="'+y1+'" r="4"/><circle cx="305" cy="'+y2+'" r="4"/>';
  }
  label='Линия';
 }else if(question.visual.type==='g1MoroAngle') {
  const {turn,opening}=data, length=51;
  const rad=(turn+opening)*Math.PI/180, x=length*Math.cos(rad), y=length*Math.sin(rad);
  const first=turn*Math.PI/180, x1=length*Math.cos(first), y1=length*Math.sin(first);
  body='<path d="M'+(165+x1)+' '+(64+y1)+' L165 64 '+(165+x)+' '+(64+y)+'"/><circle cx="165" cy="64" r="4"/>';
  label='Две стороны с отмеченной общей вершиной';
 }else if(question.visual.type==='g1MoroRectangle') {
  const {side,width,turn}=data, scale=9;
  const w=width*scale,h=side*scale;
  body='<rect x="'+(165-w/2)+'" y="'+(64-h/2)+'" width="'+w+'" height="'+h+'" transform="rotate('+turn+' 165 64)"/>';
  label='Четырёхугольник';
 }
 if(!label)return null;
 return '<div class="g1-geometry-wrap"><svg class="g1-shape-svg g1-shape-compact" viewBox="0 0 330 128" role="img" aria-label="'+label+'" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'+body.replaceAll('<text ','<text fill="currentColor" stroke="none" ')+'</g></svg></div>';
}

const chapters=[
 {part:1,id:'preparation',title:'Подготовка к изучению чисел',topics:[
  extra('count','Сколько? Который по счёту?','Чтобы узнать количество, посчитай все предметы. Чтобы узнать место, считай от указанного края.','В ряду ○ ★ ○ звезда вторая слева.',counting),
  existing('spatial_relations','Вверху, внизу, слева, справа'),
  extra('time','Раньше, позже, сначала, потом','События можно поставить по порядку от первого к последнему.','Сначала открыли книгу, потом прочитали страницу.',timeOrder),
  extra('group_compare','Столько же, больше, меньше','Соедини каждый предмет одной группы с предметом другой. Если пары есть у всех, предметов поровну.','3 кружка и 3 квадрата можно соединить в 3 пары.',d=>groups(d,false)),
  extra('group_difference','На сколько больше? На сколько меньше?','Когда пары составлены, посчитай предметы, которым не хватило пары.','В группе из 5 кружков и группе из 3 кружков без пары останутся 2.',d=>groups(d,true)),
  existing('object_properties','Странички для любознательных. Цвет, форма и размер')
 ]},
 {part:1,id:'numbers_to_10',title:'Числа от 1 до 10. Нумерация',topics:[
  extra('first_five','Числа и цифры от 1 до 5','Число говорит, сколько предметов. Цифра помогает записать это число.','○ ○ ○ — три кружка. Число три пишем цифрой 3.',firstFive),
  extra('first_signs','Знаки +, −, =','Знак + показывает прибавление, − показывает убавление. Знак = ставят между равными значениями.','Уже было 2 фишки и дали ещё 1. Получим 2 + 1 = 3.',firstSigns),
  extra('compare_lengths','Длиннее, короче, одинаковые по длине','Совмести начала отрезков или сравни их длины по одинаковым клеткам.','Отрезок из 5 клеток длиннее отрезка из 3 клеток.',lengthComparison),
  extra('lines','Точка, отрезок, прямая, кривая и ломаная','У отрезка два конца. Ломаная составлена из отрезков, соединённых концами.','Два соединённых отрезка — ломаная из двух звеньев.',lines),
  existing('geometric_figures','Треугольники, четырёхугольники и другие фигуры'),
  extra('compare_numbers','Сравнение чисел. Знаки >, <, =','Раскрытая сторона знака смотрит на большее число. Когда числа равны, пиши =.','7 > 4, 2 < 6, 5 = 5.',compareNumbers),
  existing('numbers_1_9','Числа от 1 до 9. Счёт и порядок'),
  extra('ten','Число 10. Собираем десяток','Десять предметов можно собрать в одну группу. Такая группа — десяток.','Если есть 8 фишек, до 10 ещё 2 фишки.',d=>{
   const a=ri(1,9), b=10-a;
   if(d===0) return select('Сколько кружков до полного десятка?',b,[b,...g1UniqueNums(b,1,9)],a+' + '+b+' = 10.',counters(a));
   if(d===1) return numeric('Дополни до 10: '+a+' + □ = 10.',b,'10 − '+a+' = '+b+'.');
   const objects=choose(['карандашей','фломастеров','кубиков']);
   return numeric('В коробке было 10 '+objects+'. Достали несколько, осталось '+a+'. Сколько достали?',b,'10 − '+a+' = '+b+'.');
  }),
  existing('length_measurement','Сантиметр. Измерение отрезков'),
  extra('change','Увеличить на несколько. Уменьшить на несколько','Чтобы увеличить число, прибавь. Чтобы уменьшить, вычти.','Увеличим 4 на 2 и получим 6.',change),
  existing('numbers_0_10','Число 0. Числа от 0 до 10')
 ]},
 {part:1,id:'operations_to_10',title:'Числа от 1 до 10. Сложение и вычитание',topics:[
  extra('steps_1_2','Прибавляем и вычитаем 1 и 2','На числовом ряду прибавить — шагнуть вправо, вычесть — влево.','6 − 2 = 4, а 6 + 2 = 8.',d=>step(d,[1,2])),
  extra('sum_names','Первое и второе слагаемые. Сумма','Складываем слагаемые, получаем сумму.','В записи 4 + 2 = 6 числа 4 и 2 — слагаемые, 6 — сумма.',d=>terms(d,false)),
  existing('word_problems','Задача. Условие, вопрос, решение и ответ'),
  extra('angle','Угол и прямой угол','Две стороны с общей вершиной образуют угол. Уголок тетрадного листа — прямой угол.','Сравни угол с уголком листа, приложив его к вершине.',angle),
  extra('step_3','Прибавляем и вычитаем 3','Число 3 можно прибавлять и вычитать по частям: 2 и 1.','7 − 3 = 7 − 2 − 1 = 4.',d=>step(d,3)),
  existing('add_sub_10','Повторение сложения и вычитания в пределах 10')
 ]},
 {part:2,id:'operations_to_10_continued',title:'Числа от 1 до 10. Сложение и вычитание (продолжение)',topics:[
  extra('step_4','Прибавляем и вычитаем 4','Число 4 можно разложить на 2 и 2. Удобно сделать два одинаковых шага.','5 + 4 = 5 + 2 + 2 = 9.',d=>step(d,4)),
  extra('difference_story','Задачи на разностное сравнение','Чтобы узнать, на сколько одно число больше другого, из большего вычти меньшее.','У одного 8, у другого 5. Разница: 8 − 5 = 3.',differenceStory),
  extra('commute','Перестановка слагаемых. Сложение с 5, 6, 7, 8 и 9','От перестановки слагаемых сумма не меняется. Легче начать с большего слагаемого.','2 + 7 = 7 + 2 = 9.',commutation),
  extra('rectangle','Прямоугольник и квадрат','У прямоугольника четыре прямых угла. Квадрат — прямоугольник, у которого все стороны равны.','Если у прямоугольника две соседние стороны по 3 см, это квадрат.',rectangles),
  extra('sum_link','Связь между суммой и слагаемыми','Если из суммы вычесть одно слагаемое, получится второе.','5 + 3 = 8, поэтому 8 − 5 = 3.',connected),
  extra('sub_names','Уменьшаемое, вычитаемое и разность','Из уменьшаемого вычитаем вычитаемое и получаем разность.','В записи 9 − 4 = 5 числа 9, 4 и 5 — уменьшаемое, вычитаемое и разность.',d=>terms(d,true)),
  extra('sub_6_10','Вычитание из 6, 7, 8, 9 и 10','Вычитание можно проверить обратным сложением.','8 − 3 = 5, потому что 5 + 3 = 8.',smallTable),
  extra('kilogram','Килограмм','Килограмм — единица массы. Его обозначают кг.','Пакеты по 2 кг и 3 кг вместе весят 5 кг.',d=>measure(d,false)),
  extra('liter','Литр','Литр помогает узнать, сколько жидкости в сосуде. Его обозначают л.','В кувшин на 3 л налили 2 л. Можно долить ещё 1 л.',d=>measure(d,true))
 ]},
 {part:2,id:'numbers_to_20',title:'Числа от 11 до 20. Нумерация',topics:[
  existing('numbers_11_20','Числа от 11 до 20. Десятки и единицы'),
  extra('decimeter','Дециметр и сантиметр','В одном дециметре ровно 10 сантиметров.','1 дм 4 см = 10 см + 4 см = 14 см.',decimeters),
  extra('tens_ones','Сложение и вычитание десятка и единиц','В числе 14 есть 1 десяток и 4 единицы. Можно прибавлять или убирать десяток и единицы.','14 − 10 = 4, 14 − 4 = 10.',numerationArithmetic),
  extra('two_step','Задачи в два действия','Сначала найди то, что нужно для ответа. Во втором действии используй полученное число.','Было 6 книг. Дали 2 и убрали 3. Сначала 6 + 2 = 8, потом 8 − 3 = 5.',twoStep)
 ]},
 {part:2,id:'operations_to_20',title:'Числа от 11 до 20. Сложение и вычитание',topics:[
  extra('table_add','Табличное сложение с переходом через десяток','Сначала прибавь столько, сколько не хватает до 10, потом прибавь остаток.','8 + 5 = 8 + 2 + 3 = 13.',d=>tabular(d,false)),
  extra('table_sub','Табличное вычитание с переходом через десяток','Сначала вычти до 10, затем вычти оставшуюся часть.','13 − 5 = 13 − 3 − 2 = 8.',d=>tabular(d,true)),
  existing('add_sub_20','Сложение и вычитание в пределах 20. Повторение')
 ]},
 {part:2,id:'review',title:'Что узнали, чему научились в 1 классе',topics:[
  existing('tables','Читаем простые таблицы'),
  extra('review','Смешанные задания за год','Прочитай задание, вспомни правило и проверь ответ.','Что больше: 15 см или 1 дм? 1 дм = 10 см, значит, 15 см больше.',review)
 ]}
];

const newTopics=new Map();
let order=0;
const groupsByTextbook=chapters.map(chapter=>({
 id:chapter.id,title:chapter.title,icon:'',desc:'',
 topics:chapter.topics.map(item=>{
  if(item.generate)newTopics.set(item.id,item);
  return {
   rendererType:'quiz',plannedRendererType:'quiz',reuseEngine:'elementary quiz',implemented:true,
   ...legacyTopics.get(item.id),
   id:'g1:'+item.id,grade:1,course:ELEMENTARY_COURSE,
   title:item.title,shortTitle:legacyTopics.get(item.id)?.shortTitle||'',
   section:chapter.title,group:chapter.title,order:++order,
   programRef:'М. И. Моро, С. И. Волкова, С. В. Степанова · 1 класс · часть '+chapter.part
  };
 })
}));
G1_GROUPS.splice(0,G1_GROUPS.length,...groupsByTextbook);

const previousMakeQuestion=makeG1Question;
makeG1Question=function(id,stage=null) {
 const item=newTopics.get(rawCourseId(id));
 if(!item)return previousMakeQuestion(id,stage);
 const d=stage===null?activeDifficulty():Math.max(0,Math.min(2,Number(stage)||0));
 const {text,answer,options,explanation,picture}=item.generate(d);
 const signature='g1:'+item.id+':'+text+'|'+JSON.stringify(picture);
 const metadata={visual:picture,templateId:item.id};
 return options?g1Choice(text,answer,options.filter(value=>value!==answer),explanation,signature,metadata)
  :g1NumberInput(text,answer,explanation,signature,metadata);
};

const previousFreshQuiz=freshG1Quiz;
freshG1Quiz=function(id) {
 if(!newTopics.has(rawCourseId(id)))return previousFreshQuiz(id);
 return freshCandidate(()=>makeG1Question(id),question=>question.sig,90);
};

const previousTheory=g1TheoryHtml;
g1TheoryHtml=function(id) {
 const item=newTopics.get(rawCourseId(id));
 if(!item)return previousTheory(id);
 return '<div class="elementary-theory"><p><b>'+esc(item.rule)+'</b></p><div class="elementary-example">'+esc(item.example)+'</div></div>';
};

const previousVisual=quizVisualHtml;
quizVisualHtml=function(question) {
 return question?.visual?.type?.startsWith('g1Moro')?drawing(question):previousVisual(question);
};

window.grade1Textbook={
 chapters:chapters.map(chapter=>({part:chapter.part,title:chapter.title,items:chapter.topics.map(item=>[null,item.title,[item.id]])})),
 catalog:g1AllTopics
};
})();
