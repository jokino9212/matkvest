(function () {
'use strict';

const stageDescriptions = [
 'Определи правило и примени его на простых примерах.',
 'Закрепи приём на более сложных заданиях.',
 'Реши задачи повышенной сложности.'
];
const format = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const pickOne = items => items[ri(0, items.length - 1)];

function number(text, answer, steps, unitSuffix = '') {
 return g6NumberInputQuestion(text, answer, steps, '', {unitSuffix, inputHint:'Введи число.'});
}

function choice(text, answer, alternatives, steps) {
 const choices = [answer, ...alternatives].map(value => ({key:String(value), label:esc(String(value))}));
 return {text, ans:String(answer), choices:finalizeChoices(String(answer), choices, choices.length), ex:steps};
}

function remainder(dividend, divisor) {
 const quotient = Math.floor(dividend / divisor), rest = dividend % divisor;
 const steps = `${format(divisor)} × ${format(quotient)} + ${rest} = ${format(dividend)}. ${rest} < ${format(divisor)}.`;
 return g3RemainderInputQuestion(dividend, divisor, quotient, rest, steps, '');
}

function placeTo1000(d) {
 if (d === 0) {
  const n = ri(110, 999), power = pickOne([1, 10, 100]), names = {1:'единиц',10:'десятков',100:'сотен'};
  const answer = Math.floor(n / power) % 10;
  return number(`Сколько ${names[power]} записано в соответствующем разряде числа ${n}?`, answer, `В разряде ${names[power]} стоит цифра ${answer}.`);
 }
 if (d === 1) {
  const a = ri(1,9), b = ri(0,9), c = ri(0,9);
  return number(`Запиши число: ${a} сот. ${b} дес. ${c} ед.`, 100*a+10*b+c, `${a} × 100 + ${b} × 10 + ${c} = ${100*a+10*b+c}.`);
 }
 const step = ri(2,9), a = ri(105,1000-3*step);
 return number(`Какое число пропущено в ряду: ${a}, □, ${a+2*step}, ${a+3*step}?`, a+step, `Разность соседних чисел ${step}. ${a} + ${step} = ${a+step}.`);
}

function orderWithin1000(d) {
 const a=ri(12,49), b=ri(2,9), c=ri(2,7), e=ri(2,8), p=ri(2,6);
 if (d === 0) return number(`Вычисли ${a} + ${b} × ${c}.`, a+b*c, `${b} × ${c} = ${b*c}<br>${a} + ${b*c} = ${a+b*c}`);
 if (d === 1) return number(`Вычисли (${a} − ${b}) × ${c} + ${e}.`, (a-b)*c+e, `${a} − ${b} = ${a-b}<br>${a-b} × ${c} = ${(a-b)*c}<br>${(a-b)*c} + ${e} = ${(a-b)*c+e}`);
 return number(`Вычисли (${a} + ${b}) × ${c} − ${e*p} : ${p}.`, (a+b)*c-e, `${a} + ${b} = ${a+b}<br>${a+b} × ${c} = ${(a+b)*c}<br>${e*p} : ${p} = ${e}<br>${(a+b)*c} − ${e} = ${(a+b)*c-e}`);
}

function addSub(d, limit) {
 const a = limit === 1000 ? ri(101,420) : ri([1500,13500,130000][d],[4200,42000,420000][d]);
 const b = ri(Math.ceil(a/5), Math.floor(a/2)), c = ri(15,Math.floor(a/4));
 if (d === 2) {
  const start = a+b, result = a+c;
  return number(`Вычисли (${format(start)} − ${format(b)}) + ${format(c)}.`, result,
   `${format(start)} − ${format(b)} = ${format(a)}<br>${format(a)} + ${format(c)} = ${format(result)}`);
 }
 const subtract = d === 1 || ri(0,1) === 1;
 const result = subtract ? a-b : a+b;
 return number(`Вычисли ${format(a)} ${subtract?'−':'+'} ${format(b)}.`, result, `Результат ${format(result)}. Проверим обратным действием: ${format(result)} ${subtract?'+':'−'} ${format(b)} = ${format(a)}.`);
}

function multiply(d, mode) {
 const multiplicands = {
  small:[[11,27],[28,75],[101,109]],
  one:[[123,854],[1206,9908],[12005,95090]],
  trailing:[[12,89],[121,879],[1030,9008]],
  trailingOne:[[12,89],[121,879],[130,900]],
  double:[[12,96],[123,862],[901,1009]],
  triple:[[12,96],[110,745],[1002,1980]]
 };
 const [low, high] = multiplicands[mode][d], a = ri(low,high)*(mode==='trailingOne'?10**(d+1):1);
 const multiplier = {
  small: () => ri(2,9), one: () => ri(2,9), trailingOne: () => ri(2,9),
  trailing: () => ri(2,d === 0 ? 9 : 89) * 10 ** (d === 2 ? ri(2,3) : 1),
  double: () => ri(11,99), triple: () => d === 2 ? (ri(1,8) * 100 + ri(1,9)) : ri(101,999)
 };
 const b = multiplier[mode](), result = a*b;
 const parts = [...String(b)].map((digit,index)=>Number(digit)*10**(String(b).length-index-1)).filter(Boolean);
 const partial = parts.map(p=>a*p);
 const steps = parts.length === 1 ? `${format(a)} × ${format(b)} = ${format(result)}.` :
  parts.map((p,i)=>`${format(a)} × ${format(p)} = ${format(partial[i])}`).join('<br>') +
  `<br>${partial.map(format).join(' + ')} = ${format(result)}`;
 if (d === 2 && mode === 'double') {
  const [tens, units = 0] = parts;
  const ask = ri(0,1) && units ? units : tens;
  return number(`При умножении ${format(a)} × ${b} найди неполное произведение ${format(a)} × ${ask}.`, a*ask, steps);
 }
 if (d === 2 && mode === 'triple') {
  const ask = pickOne(parts);
  return number(`Разложи ${b} на разрядные слагаемые. Найди только неполное произведение ${format(a)} × ${ask}.`, a*ask, steps);
 }
 return number(`Вычисли ${format(a)} × ${format(b)}.`, result, steps);
}

function divide(d, mode) {
 const divisor = {
  small: () => ri(2,9), one: () => ri(2,9),
  trailing: () => ri(2,d === 0 ? 9 : 49)*10**(d === 2 ? ri(2,3) : 1),
  double: () => ri(11,99), triple: () => ri(101,999)
 }[mode]();
 const [low, high] = mode === 'small' ? [[11,35],[36,75],[76,109]][d] : [[12,79],[101,590],[1001,2909]][d];
 const ordinary = ri(low,high);
 const quotient = d === 2 && mode === 'one' ? 1000*ri(1,8)+ri(1,9) : ordinary;
 const dividend = divisor * quotient;
 const steps = `Проверка: ${format(quotient)} × ${format(divisor)} = ${format(dividend)}.`;
 if (d === 2 && ['trailing','double','triple'].includes(mode)) return remainder(dividend+ri(1,divisor-1),divisor);
 return number(`Вычисли ${format(dividend)} : ${format(divisor)}.`, quotient, steps);
}

function numberClasses(d, large=false) {
 const groups = ['единиц','тысяч','миллионов','миллиардов'];
 if(!large && d===2) {
  const thousands=ri(110,986), units=ri(1,99), value=thousands*1000+units;
  return number(`Собери число из двух классов: класс тысяч — ${thousands}, класс единиц — ${String(units).padStart(3,'0')}.`,
   value,`${thousands} × 1 000 + ${units} = ${format(value)}.`);
 }
 const index = large ? (d===0 ? 2 : d===1 ? 3 : ri(2,3)) : d;
 const chosen = ri(102,987), scale = 1000**index, tail = ri(1,999);
 const higher = index === 0 ? ri(1,99)*1000 : large && index===2 && d===2 ? ri(1,888)*scale*1000 : 0;
 const n = higher + chosen*scale + (index === 0 ? 0 : tail);
 return number(`В числе ${format(n)} запиши число, образованное цифрами класса ${groups[index]}.`, chosen,
  `Отделяем тройки цифр справа налево: ${format(n)}. В нужном классе — ${chosen}.`);
}

function numberReading(d) {
 const upper = ri([1,11,101][d],[9,99,999][d]), tail = d===2 ? ri(1,9) : ri(10,89);
 const value = upper*1000+tail;
 function spoken(thousands, units) {
  const group=g3NumberWords(thousands).replace(/(один|два)$/u,x=>x==='один'?'одна':'две');
  return `${group} ${ruCount(thousands,'тысяча','тысячи','тысяч')} ${g3NumberWords(units)}`;
 }
 const steps = `В классе тысяч — ${upper}, в классе единиц — ${String(tail).padStart(3,'0')}. Получаем ${format(value)}.`;
 if(d===0) return choice(`Как прочитать число <b>${format(value)}</b>?`,spoken(upper,tail),
  [spoken(upper+1,tail),spoken(upper,tail+1),spoken(upper+2,tail+5)],steps);
 const alternatives=[upper*10000+tail, upper*1000+tail*10, upper*1000+100+tail];
 return choice(`Как записать цифрами: <b>${spoken(upper,tail)}</b>?`,format(value),alternatives.map(format),steps);
}

function numberWriting(d) {
 const thousands = ri([2,12,105][d],[9,90,999][d]), units = d === 2 ? ri(1,9) : ri(10,999);
 const value = thousands*1000+units;
 if (d === 0) return number(`Запиши число: ${thousands} тыс. ${units} ед.`, value, `${thousands} × 1 000 + ${units} = ${format(value)}.`);
 if (d === 1) return number(`Запиши число, в котором ${thousands} единиц класса тысяч и ${units} единиц класса единиц.`,value,`${thousands} × 1 000 + ${units} = ${format(value)}.`);
 const hundreds = ri(1,9);
 return number(`Запиши число: ${thousands} единиц класса тысяч, ${hundreds} сот. и ${units} ед. класса единиц.`,
   value+100*hundreds,`${thousands} × 1 000 + ${hundreds} × 100 + ${units} = ${format(value+100*hundreds)}.`);
}

function expanded(d) {
 const n = ri([1001,10011,102001][d],[9989,99898,998998][d]);
 const parts = [...String(n)].map((digit,index)=>Number(digit)*10**(String(n).length-index-1)).filter(Boolean);
 if(d === 2) {
  const index = ri(0,parts.length-1), missing = parts[index];
  return number(`Восстанови пропущенное разрядное слагаемое:<br>${format(n)} = ${parts.map((p,i)=>i===index?'□':format(p)).join(' + ')}.`, missing,
   `${format(n)} = ${parts.map(format).join(' + ')}.`);
 }
 return number(`Запиши одним числом: ${parts.map(format).join(' + ')}.`, n, `Складываем разрядные слагаемые. Получаем ${format(n)}.`);
}

function compareNumbers(d) {
 const a = ri([1200,12000,120000][d],[9400,94000,940000][d]), delta = pickOne([-2,-1,0,1,2]) * [100,10,1][d], b = a+delta;
 const answer = a>b?'&gt;':a<b?'&lt;':'=';
 const labels = {'&gt;':'>','&lt;':'<','=':'='};
 return choice(`Какой знак подходит?<br>${format(a)} □ ${format(b)}`,labels[answer],Object.values(labels).filter(x=>x!==labels[answer]),
  `${format(a)} ${answer} ${format(b)}. Сравниваем разряды слева направо.`);
}

function timesTen(d) {
 const factor = [10,100,1000][d], a = ri(12,d===2?979:99), product = a*factor;
 const shrink = ri(0,1) === 1;
 return number(shrink?`Уменьши ${format(product)} в ${format(factor)} раз.`:`Увеличь ${format(a)} в ${format(factor)} раз.`,
  shrink?a:product, shrink?`${format(product)} : ${format(factor)} = ${format(a)}.`:`${format(a)} × ${format(factor)} = ${format(product)}.`);
}

const units = {
 length: [['мм','см',10],['см','дм',10],['см','м',100],['м','км',1000]],
 area: [['мм²','см²',100],['см²','дм²',100],['см²','м²',10000],['м²','км²',1000000]],
 mass: [['г','кг',1000],['кг','ц',100],['кг','т',1000],['ц','т',10]],
 time: [['с','мин',60],['мин','ч',60],['ч','сут',24],['лет','в.',100]]
};

function convert(d, kind, pairs=units[kind]) {
 const [small,big,factor] = pairs[d === 0 ? ri(0,Math.min(1,pairs.length-1)) : ri(0,pairs.length-1)];
 const amount = ri(2,d === 2 ? 38 : 24), rest = ri(1,Math.min(factor-1,99));
 if(d === 0) return number(`Сколько ${small} в ${amount} ${big}?`,amount*factor,`1 ${big} = ${format(factor)} ${small}<br>${amount} × ${format(factor)} = ${format(amount*factor)}`,small);
 if(d === 1) return number(`Вырази ${format(amount*factor)} ${small} в ${big}.`,amount,`${format(amount*factor)} : ${format(factor)} = ${amount}.`,big);
 const result = amount*factor+rest;
 return number(`Вырази ${amount} ${big} ${rest} ${small} в ${small}.`,result,`${amount} × ${format(factor)} + ${rest} = ${format(result)}.`,small);
}

function gridArea(d) {
 const height = ri(3+d,5+d), width = ri(4+d,7+d), cutX = ri(1,width-1), cutY = d === 0 ? 1 : ri(2,height-1);
 const whole = width*height-cutX*cutY;
 const cutStart = width-cutX, partial = d === 0 ? 0 : ri(1,Math.min(5,cutStart*cutY));
 const partialCells = new Set(Array.from({length:partial},(_,i)=>i));
 const cells = Array.from({length:width*height}, (_,i)=>{
  const col = i%width, row = Math.floor(i/width), x = 4+col*17, y = 4+row*17;
  const empty = col>=cutStart && row<cutY;
  const half = !empty && col<cutStart && row<cutY && partialCells.has(row*cutStart+col);
  const background = empty||half?'#fff':'#bfe3e9';
  return `<rect x="${x}" y="${y}" width="17" height="17" fill="${background}" stroke="#4c6a76"/>${half?`<path d="M${x} ${y}h17l-17 17z" fill="#80bed3" stroke="#4c6a76"/>`:''}`;
 }).join('');
 const fullCells = whole-partial;
 const side = d < 2 ? ri(1,3)*2 : ri(4,8)*2, area = side*side;
 const answer = (fullCells+partial/2)*area;
 const svg = `<svg width="${width*17+8}" height="${height*17+8}" viewBox="0 0 ${width*17+8} ${height*17+8}" role="img" aria-label="Палетка с закрашенными клетками">${cells}</svg>`;
 const question=number(`Найди площадь закрашенной фигуры. Сторона клетки ${side} см.<br>${svg}`,answer,
  `Площадь клетки: ${side} × ${side} = ${area} см².<br>Полных клеток ${fullCells}, половинок ${partial}.<br>Площадь фигуры ${answer} см².`,'см²');
 question.sig=['grid',width,height,cutX,cutY,partial,side].join(':');
 return question;
}

function clock(d) {
 const hour = ri(8,17), minute = ri(0,11)*5, minutes = ([0,1,2][d]+1)*60+ri(1,8)*5;
 const start = hour*60+minute, end = start+minutes;
 const display = time => `${Math.floor(time/60)}:${String(time%60).padStart(2,'0')}`;
 if(d===0) return number(`Занятие началось в ${display(start)} и закончилось в ${display(end)}. Сколько минут оно длилось?`,minutes,
  `${end} − ${start} = ${minutes} мин — длительность занятия.`,'мин');
 if(d===1) {
  const finishHour=Math.floor(end/60);
  return number(`Событие началось в ${display(start)} и длилось ${minutes} минут. В ответ запиши час окончания по 24-часовым часам (без минут).`,
   finishHour,`${display(start)} + ${minutes} мин = ${display(end)}. Час окончания — ${finishHour}.`);
 }
 return number(`Встреча закончилась в ${display(end)} и длилась ${minutes} минут. Сколько минут оставалось от её начала до 18:00?`,
  1080-start,`${display(end)} − ${minutes} мин = ${display(start)}.<br>${1080} − ${start} = ${1080-start} мин.`,'мин');
}

function calendar(d) {
 const start = ri(2001,2089), years = ri(2,17), y = start+years;
 if(d === 0) return number(`Сколько месяцев в ${years} полных годах?`,years*12,`${years} × 12 = ${years*12}.`,'мес');
 if(d === 1) return number(`Сколько лет пройдёт от 1 января ${start} года до 1 января ${y} года?`,years,`${y} − ${start} = ${years}.`,'лет');
 const ordinary = ri(2,9), leap = ri(2,5), result=ordinary*365+leap*366;
 return number(`Сколько дней в ${ordinary} обычных и ${leap} високосных годах вместе?`,result,
  `${ordinary} × 365 + ${leap} × 366 = ${result}.`,'дн.');
}

function centuries(d) {
 const century = ri(2,21), years = ri(1,99);
 const year = (century-1)*100 + (d===0?years:d===1?100:1);
 if(d===0) return number(`К какому веку относится ${year} год? Напиши номер века.`,century,`Это один из годов с ${(century-1)*100+1}-го по ${century*100}-й — ${century}-й век.`);
 if(d===1) return number(`Какой год завершает ${century}-й век?`,year,`${century} × 100 = ${year}.`);
 return number(`Какой год открывает ${century}-й век?`,year,`Последний год предыдущего века — ${year-1}. Следующий год — ${year}.`);
}

function unknown(d, type) {
 const x = ri([4,19,110][d],[38,89,350][d]), a = ri([3,12,23][d],[9,30,74][d]), b = ri(2,8);
 const model = {
  add:[`x + ${a} = ${x+a}`,`${x+a} − ${a}`,`Из суммы вычитаем известное слагаемое.`],
  subFrom:[`x − ${a} = ${x}`,`${x} + ${a}`,`К разности прибавляем вычитаемое.`],
  subBy:[`${x+a} − x = ${a}`,`${x+a} − ${a}`,`Из уменьшаемого вычитаем разность.`],
  mul:[`${b} × x = ${b*x}`,`${b*x} : ${b}`,`Произведение делим на известный множитель.`],
  dividend:[`x : ${b} = ${x}`,`${x} × ${b}`,`Частное умножаем на делитель.`],
  divisor:[`${x*b} : x = ${b}`,`${x*b} : ${b}`,`Делимое делим на частное.`]
 }[type];
 const [equation, expression, rule] = model;
 const answer = type==='dividend'?x*b:type==='subFrom'?x+a:x;
 return number(`Реши уравнение ${equation}.`,answer,`${rule}<br>x = ${expression}<br>x = ${answer}`);
}

function fractionsOf(d) {
 const den = ri(3+d,10+d), numerator = d === 0 ? 2 : ri(2,den-1), one = ri(3,23+d*20), all = den*one, part = numerator*one;
 if (d === 2) return number(`В ленте ${all} см. Сколько сантиметров останется, если отрезать ${frac(numerator,den)} ленты?`,
  all-part,`${all} : ${den} = ${one}<br>${one} × ${numerator} = ${part}<br>${all} − ${part} = ${all-part}`,'см');
 return number(`Найди ${frac(numerator,den)} от ${all}.`,part,`${all} : ${den} = ${one}<br>${one} × ${numerator} = ${part}`);
}

function quantityOperation(d, product=false) {
 const kind = pickOne(['length','mass','time']), [small,big,factor] = pickOne(units[kind].filter(pair=>pair[2]<=1000&&pair[1]!=='в.'));
 const major = ri(2,12+d*4), minor = ri(1,factor-1), quantity=major*factor+minor;
 const b = product ? ri(2,7+d) : ri(d===2?factor+1:2,d===0?factor-1:Math.min(factor*2,quantity));
 const op = product?'×':d===0?'+':'−', answer = product?quantity*b:d===0?quantity+b:quantity-b;
 const amount = d===2 ? `${Math.floor(b/factor)} ${big} ${b%factor} ${small}` : `${b} ${small}`;
 return number(`Вычисли (${major} ${big} ${minor} ${small}) ${op} ${product?b:amount}. Ответ запиши в ${small}.`, answer,
  `${major} × ${factor} + ${minor} = ${quantity} (${small})<br>${quantity} ${op} ${b} = ${answer}`,small);
}

function propertyProduct(d, property) {
 const a = ri(12,65+d*12), b = ri(2,9), c = ri(2,8), result = a*b*c;
 if(property==='multiply') {
  if(d===0) return number(`Вычисли ${a} × (${b} × ${c}).`,result,`${b} × ${c} = ${b*c}<br>${a} × ${b*c} = ${result}`);
  if(d===1) return number(`Вычисли (${a} × ${b}) × ${c} удобным способом.`,result,`${b} × ${c} = ${b*c}<br>${a} × ${b*c} = ${result}`);
  return number(`Какое число пропущено в равенстве? ${a} × (□ × ${c}) = ${result}`,b,`${result} : ${a} = ${b*c}<br>${b*c} : ${c} = ${b}`);
 }
 const dividend = a*b*c, divisor = b*c;
 if(d===2) return number(`Восстанови пропуск: ${format(dividend)} : (${b} × □) = ${a}.`,c,`${format(dividend)} : ${a} = ${divisor}<br>${divisor} : ${b} = ${c}`);
 return number(d===0?`Вычисли ${format(dividend)} : (${b} × ${c}).`:`Вычисли (${format(dividend)} : ${c}) : ${b}.`,a,
  `${format(dividend)} : ${c} = ${a*b}<br>${a*b} : ${b} = ${a}`);
}

function multiplyProperty(d) {
 const a = ri(12,97+d*10), b = ri(2,8);
 if(d===0) return number(`Вставь число: ${a} × ${b} = ${b} × □.`,a,`При перестановке множителей произведение не меняется.`);
 if(d===1) return number(`Вычисли (${a} + ${b}) × ${b}.`,(a+b)*b,`${a} × ${b} = ${a*b}<br>${b} × ${b} = ${b*b}<br>${a*b} + ${b*b} = ${(a+b)*b}`);
 const c=ri(10,99);
 return number(`Найди общий множитель в равенстве: ${a} × □ + ${c} × □ = ${(a+c)*b}. В оба пропуска впиши одно число.`,b,`(${a} + ${c}) × □ = ${(a+c)*b}<br>${(a+c)*b} : ${a+c} = ${b}`);
}

function grouping(d) {
 const base = pickOne([[2,5],[4,25],[8,125]]), [a,b]=base, c = ri(12,69+d*12), product = a*b*c;
 if(d===0) return number(`Сгруппируй множители и вычисли ${a} × ${c} × ${b}.`,product,
  `${a} × ${b} = ${a*b}<br>${a*b} × ${c} = ${product}`);
 if(d===1) return number(`Какой множитель пропущен? ${a} × □ × ${b} = ${format(product)}.`,c,
  `${a} × ${b} = ${a*b}<br>${format(product)} : ${a*b} = ${c}`);
 const last = ri(2,8);
 return number(`Вычисли удобным способом ${a} × ${c} × ${b} × ${last}.`,product*last,
  `${a} × ${b} = ${a*b}<br>${c} × ${last} = ${c*last}<br>${a*b} × ${c*last} = ${format(product*last)}`);
}

function multiplySum(d) {
 const a=ri(13,89+d*20), b=ri(11,79), tens=10*Math.floor(b/10), ones=b%10;
 if(d===0) return number(`Вычисли ${a} × (${tens} + ${ones}).`,a*b,`${a} × ${tens} = ${a*tens}<br>${a} × ${ones} = ${a*ones}<br>${a*tens} + ${a*ones} = ${a*b}`);
 if(d===1) return number(`Представь ${b} суммой десятков и единиц. Вычисли ${a} × ${b}.`,a*b,`${a} × ${tens} + ${a} × ${ones} = ${a*tens} + ${a*ones} = ${a*b}.`);
 const fill=ri(2,9);
 return number(`Восстанови пропуск: ${a} × (${tens} + □) = ${a*(tens+fill)}.`,fill,`${a*(tens+fill)} : ${a} = ${tens+fill}<br>${tens+fill} − ${tens} = ${fill}`);
}

function movement(d, kind) {
 const speed = ri(12,38), second = speed+ri(3,20), time = ri(2,8+d), distance = speed*time;
 if(kind==='meeting'||kind==='opposite') {
  const sum=speed+second, whole=sum*time;
  const path=kind==='meeting'?'из двух пунктов навстречу друг другу':'из одного пункта в противоположных направлениях';
  if(d===0) return number(`Два велосипедиста выехали ${path} одновременно. Скорости ${speed} км/ч и ${second} км/ч. ${kind==='meeting'?`Каково расстояние между пунктами, если велосипедисты встретились через ${time} ч?`:`Какое расстояние будет между велосипедистами через ${time} ч?`}`,whole,`${speed} + ${second} = ${sum} (км/ч)<br>${sum} × ${time} = ${whole} (км)`,'км');
  if(d===1) return number(`Два велосипедиста выехали ${path} одновременно со скоростями ${speed} км/ч и ${second} км/ч. Через сколько часов ${kind==='meeting'?`они встретятся, если между пунктами ${whole} км`:`между ними будет ${whole} км`}?`,time,
   `${speed} + ${second} = ${sum} (км/ч)<br>${whole} : ${sum} = ${time} (ч)`,'ч');
  return number(`Два велосипедиста выехали ${path} одновременно. ${kind==='meeting'?`Между пунктами ${whole} км, встреча через ${time} ч.`:`Через ${time} ч между ними ${whole} км.`} Первый ехал со скоростью ${speed} км/ч. Найди скорость второго.`,second,
   `${whole} : ${time} = ${sum} (км/ч)<br>${sum} − ${speed} = ${second} (км/ч)`,'км/ч');
 }
 if(d===0) return number(`Велосипедист едет со скоростью ${speed} км/ч. Какое расстояние он проедет за ${time} ч?`,distance,`${speed} × ${time} = ${distance} (км)`,'км');
 if(d===1) return number(`Велосипедист проехал ${distance} км за ${time} ч. Найди скорость.`,speed,`${distance} : ${time} = ${speed} (км/ч)`,'км/ч');
 return number(`Велосипедист проехал ${distance} км со скоростью ${speed} км/ч. После остановки он проехал ещё ${speed*2} км с той же скоростью. Сколько часов он был в движении?`,
  time+2,`${distance} + ${speed*2} = ${distance+speed*2} (км)<br>${distance+speed*2} : ${speed} = ${time+2} (ч)`,'ч');
}

function proportions(d, kind) {
 const per = ri(3,19+d*10), a = ri(2,9), b = a+ri(2,8+d), total = per*(a+b);
 if(kind==='two') {
  if(d===0) return number(`В двух коробках одинаковые наборы карандашей. В первой ${b} наборов, во второй ${a}. В первой коробке на ${per*(b-a)} карандашей больше. Сколько карандашей в наборе?`,per,
   `${b} − ${a} = ${b-a} (наборов)<br>${per*(b-a)} : ${b-a} = ${per} (карандашей)`);
  const count = d===1?a:b;
  return number(`В первой коробке ${b} одинаковых наборов, во второй ${a}. В первой на ${per*(b-a)} карандашей больше. Сколько карандашей ${d===1?'во второй':'в первой'} коробке?`,per*count,
   `${b} − ${a} = ${b-a}<br>${per*(b-a)} : ${b-a} = ${per}<br>${per} × ${count} = ${per*count}`);
 }
 if(kind==='partition') {
  const count=d===0?a:b;
  const result = d===2?per*(b-a):per*count;
  return number(`Из ${total} метров ткани сшили ${a} костюмов для первой группы и ${b} костюмов для второй. На один костюм уходит одинаковое количество ткани. ${d===2?'На сколько метров больше ткани ушло на вторую группу?':`Сколько метров ткани ушло на ${d===0?'первую':'вторую'} группу?`}`,result,
   `${a} + ${b} = ${a+b}<br>${total} : ${a+b} = ${per}<br>${d===2?`${b} − ${a} = ${b-a}<br>${per} × ${b-a} = ${result}`:`${per} × ${count} = ${result}`}`,'м');
 }
 if(kind==='work') {
  if(d===0) return number(`Мастер делает ${per} деталей за час. Сколько деталей он изготовит за ${a} ч?`,per*a,`${per} × ${a} = ${per*a}.`);
  if(d===1) return number(`За ${a} ч мастер изготовил ${per*a} деталей поровну за каждый час. Найди его производительность.`,per,
   `${per*a} : ${a} = ${per} деталей в час.`);
  return number(`За ${a} ч мастер изготовил ${per*a} деталей. Сколько часов займёт изготовление ещё ${per*b} деталей в том же темпе?`,b,
   `${per*a} : ${a} = ${per} (деталей в час)<br>${per*b} : ${per} = ${b} (ч)`,'ч');
 }
 if(d===0) return number(`За ${a} одинаковых тетрадей заплатили ${per*a} ₽. Сколько стоят ${b} таких тетрадей?`,per*b,
  `${per*a} : ${a} = ${per} (₽)<br>${per} × ${b} = ${per*b} (₽)`,'₽');
 if(d===1) return number(`За ${a} одинаковых тетрадей заплатили ${per*a} ₽. Сколько таких тетрадей можно купить за ${per*b} ₽?`,b,
  `${per*a} : ${a} = ${per} (₽)<br>${per*b} : ${per} = ${b}`);
 return number(`${a} одинаковых тетрадей стоили ${per*a} ₽. Сколько рублей сдачи получат с ${total} ₽ при покупке ${b} таких тетрадей?`,total-per*b,
  `${per*a} : ${a} = ${per} (₽)<br>${per} × ${b} = ${per*b} (₽)<br>${total} − ${per*b} = ${total-per*b} (₽)`,'₽');
}

function groupedSum(d) {
 const target=ri(3,9)*100, a=ri(20,99), b=ri(22,95), c=ri(101,199), other=target-a;
 if(d===0) return number(`Найди значение суммы ${a} + ${b} + ${other}.`,target+b,
  `${a} + ${other} = ${target}<br>${target} + ${b} = ${target+b}`);
 if(d===1) return number(`Сгруппируй слагаемые: ${b} + ${a} + ${c} + ${other}. Найди сумму.`,target+b+c,
  `${a} + ${other} = ${target}<br>${b} + ${c} = ${b+c}<br>${target} + ${b+c} = ${target+b+c}`);
 return number(`Найди пропуск: ${a} + ${b} + □ + ${c} = ${target+b+c}.`,other,
  `${target+b+c} − (${b} + ${c}) = ${target}<br>${target} − ${a} = ${other}`);
}

function writtenSubtract(d) {
 const a = ri([22,102,1028][d],[99,997,9998][d])*10, b = ri(101,a-(d===2?100:20));
 if(d===0) return number(`Вычисли столбиком ${a} − ${b}. Введи разность.`,a-b,`Проверка: ${a-b} + ${b} = ${a}.`);
 if(d===1) return number(`Вычитание столбиком: ${format(a)} − ${format(b)}. Чему равна цифра единиц разности?`,(a-b)%10,
  `${format(a)} − ${format(b)} = ${format(a-b)}. В разряде единиц стоит ${(a-b)%10}.`);
 const c = ri(11,98);
 return number(`Найди, на сколько ${format(a)} больше числа ${format(b+c)}, выполнив вычитание столбиком.`,a-b-c,
  `${format(a)} − ${format(b+c)} = ${format(a-b-c)}.`);
}

function trailingBoth(d) {
 const a=ri(12,99+d*50), b=ri(2,8+d*7), k=1+d, left=a*10**k, right=b*10;
 const out=left*right, zeros=k+1;
 if(d===2) return number(`Вычисли ${format(left)} × ${format(right)}.`,out,
  `${a} × ${b} = ${a*b}<br>${a*b} × ${format(10**zeros)} = ${format(out)}`);
 return number(d===0?`Вычисли ${format(left)} × ${format(right)}.`:`Запиши результат произведения ${format(left)} × ${format(right)} после группировки множителей.`,out,
  `${format(left)} × ${format(right)} = (${a} × ${b}) × ${format(10**zeros)} = ${format(out)}.`);
}

function remainderPowers(d) {
 const divisor=[10,100,1000][d], q=ri(12,987), rest=ri(1,divisor-1);
 return remainder(divisor*q+rest,divisor);
}

function cubed(d) {
 const n=ri(2,12+d*3);
 if(d===0) return number(`Вычисли ${n}<sup>3</sup>.`,n**3,`${n}<sup>3</sup> = ${n} × ${n} × ${n} = ${n**3}.`);
 if(d===1) return number(`Найди объём куба с ребром ${n} см.`,n**3,`${n} × ${n} × ${n} = ${n**3} (см³).`,'см³');
 const out=n**3, diff=ri(1,9);
 return number(`Объём куба ${out} см³, его ребро — целое число сантиметров. Чему будет равна длина ребра, если увеличить её на ${diff} см?`,
  n+diff,`${n} × ${n} × ${n} = ${out}<br>${n} + ${diff} = ${n+diff} (см)`,'см');
}

function box(d) {
 const a=ri(3,18+d*6), b=ri(4,14+d*3), c=ri(5,25+d*3), volume=a*b*c;
 if(d===0) return number(`Найди объём прямоугольного параллелепипеда со сторонами ${a} см, ${b} см и ${c} см.`,volume,
  `${a} × ${b} × ${c} = ${volume} (см³).`,'см³');
 if(d===1) return number(`У прямоугольной коробки длина ${a} см, ширина ${b} см, высота ${c} см. Какова сумма длин её 12 рёбер?`,
  4*(a+b+c),`По четыре ребра каждой длины.<br>4 × (${a} + ${b} + ${c}) = ${4*(a+b+c)} (см)`,'см');
 return number(`Объём прямоугольной коробки ${volume} см³. Длина ${a} см, ширина ${b} см. Найди высоту.`,c,
  `${a} × ${b} = ${a*b} (см²)<br>${volume} : ${a*b} = ${c} (см)`,'см');
}

function pyramid(d) {
 const sides=ri(3,d===0?7:14), count=ri(2,9);
 if(d===0) return number(`Сколько боковых граней у пирамиды, если у её основания ${sides} сторон?`,sides,
  `Каждой стороне основания соответствует одна боковая треугольная грань.`);
 if(d===1) return number(`У пирамиды ${sides+1} граней, включая основание. Сколько вершин у основания?`,sides,
  `${sides+1} − 1 = ${sides} боковых граней. У основания столько же сторон и вершин.`);
 return number(`В наборе ${count} одинаковых пирамид. У каждой в основании многоугольник с ${sides} сторонами. Сколько всего рёбер у этих пирамид?`,count*sides*2,
  `${sides} × 2 = ${sides*2} рёбер у одной пирамиды.<br>${sides*2} × ${count} = ${sides*2*count}.`);
}

function roundSolids(d) {
 const count = ri(2,9), coneCount = ri(2,8);
 if(d===0) {
  const [solid, text] = pickOne([
   ['Цилиндр','У какого тела два основания в форме круга?'],
   ['Цилиндр','Какую форму напоминает неоткрытая консервная банка с двумя одинаковыми круглыми крышками?'],
   ['Цилиндр','Какое тело можно получить, если поставить круглый диск на стопку таких же дисков?'],
   ['Конус','У какого тела одно круглое основание и одна вершина?'],
   ['Конус','Какую форму имеет бумажный колпак с круглым краем и острой вершиной?'],
   ['Конус','Какое тело образуется, если поверхность от края круглого основания плавно сужается к одной вершине?']
  ]);
  const rule=solid==='Цилиндр'?'У цилиндра два одинаковых круглых основания.':'У конуса одно круглое основание и вершина.';
  return choice(text,solid,['Цилиндр','Конус','Куб','Пирамида'].filter(x=>x!==solid),rule);
 }
 if(d===1) return number(`Сколько круглых оснований суммарно у ${count} цилиндров?`,count*2,
  `У цилиндра два круглых основания. ${count} × 2 = ${count*2}.`);
 return number(`В наборе ${count} цилиндров и ${coneCount} конусов. Сколько всего круглых оснований у этих тел?`,count*2+coneCount,
  `У цилиндров ${count} × 2 = ${count*2} оснований.<br>У конусов ${coneCount} × 1 = ${coneCount}.<br>Всего ${count*2+coneCount}.`);
}

function circle(d) {
 const a=ri(4,50+d*18), b=ri(2,11);
 if(d===0) return number(`Радиус окружности ${a} см. Найди диаметр.`,a*2,`${a} × 2 = ${a*2} (см).`,'см');
 if(d===1) return number(`Диаметр окружности ${a*2} см. Найди радиус.`,a,`${a*2} : 2 = ${a} (см).`,'см');
 return number(`Диаметр первой окружности ${a*2} см. Радиус второй на ${b} см больше радиуса первой. Найди диаметр второй окружности.`,
  (a+b)*2,`${a*2} : 2 = ${a}<br>${a} + ${b} = ${a+b}<br>${a+b} × 2 = ${(a+b)*2} (см)`,'см');
}

function yearReview(d) {
 const skills=[orderWithin1000,placeTo1000,expanded,timesTen,fractionsOf,clock,groupedSum,circle];
 return pickOne(skills)(d);
}

const topic = (id, title, generate, hint, sub = '') => ({id,title,generate,hint,sub});
const chapters = [
 {part:1,title:'Числа от 1 до 1 000. Повторение',icon:'🔢',topics:[
  topic('moro_to_1000','Нумерация. Счёт предметов. Разряды',placeTo1000,'Смотри на место каждой цифры в записи числа.'),
  topic('moro_order_1000','Числовые выражения. Порядок действий',orderWithin1000,'Сначала выполни действия в скобках, затем умножение и деление, после них сложение и вычитание.'),
  topic('moro_add_sub_1000','Сложение и вычитание в пределах 1 000',d=>addSub(d,1000),'Вычисляй по разрядам. Проверь результат обратным действием.'),
  topic('moro_small_multiply','Умножение в пределах 1 000',d=>multiply(d,'small'),'Разложи множитель на удобные части и сложи произведения.'),
  topic('moro_small_divide','Деление в пределах 1 000',d=>divide(d,'small'),'Частное можно проверить умножением на делитель.'),
  topic('moro_charts','Столбчатые диаграммы',(d,slot)=>g3BarChartsQuestion(d,{slot,readScale:true}),'Прочитай подписи и проверь цену деления вертикальной шкалы.')
 ]},
 {part:1,title:'Числа, которые больше 1 000. Нумерация',icon:'🔢',topics:[
  topic('moro_classes','Разряды и классы',d=>numberClasses(d),'Разбей число на классы по три цифры справа налево.'),
  topic('moro_read','Чтение многозначных чисел',numberReading,'Прочитай классы по очереди, начиная со старшего.'),
  topic('moro_write','Запись многозначных чисел',numberWriting,'Запиши каждый класс тремя цифрами, кроме старшего. Пустые разряды обозначь нулями.'),
  topic('moro_expanded','Разрядные слагаемые',expanded,'Умножь каждую цифру на единицу её разряда.'),
  topic('moro_compare','Сравнение многозначных чисел',compareNumbers,'Сравни число цифр. При одинаковой длине сравни цифры слева направо.'),
  topic('moro_times_ten','Увеличение и уменьшение в 10, 100 и 1 000 раз',timesTen,'При умножении дописываем нули. При точном делении на 10, 100 или 1 000 убираем соответствующее число нулей.'),
  topic('moro_millions','Класс миллионов. Класс миллиардов',d=>numberClasses(d,true),'После классов единиц и тысяч идут классы миллионов и миллиардов.')
 ]},
 {part:1,title:'Величины',icon:'📏',topics:[
  topic('moro_length','Единицы длины. Таблица единиц длины',d=>convert(d,'length'),'1 км = 1 000 м, 1 м = 100 см, 1 дм = 10 см, 1 см = 10 мм.'),
  topic('moro_area','Единицы площади. Таблица единиц площади',d=>convert(d,'area'),'Площадь измеряют квадратными единицами. 1 см² = 100 мм², 1 м² = 10 000 см².'),
  topic('moro_grid_area','Палетка',gridArea,'Сложи площади полных клеток и половинок. Две половинки дают площадь одной клетки.'),
  topic('moro_mass','Единицы массы. Тонна и центнер',d=>convert(d,'mass'),'1 т = 1 000 кг = 10 ц, 1 ц = 100 кг, 1 кг = 1 000 г.'),
  topic('moro_year','Единицы времени. Год',calendar,'В году 12 месяцев. В обычном году 365 дней, в високосном — 366.'),
  topic('moro_clock','Время от 0 до 24 часов',clock,'Переведи время в минуты от полуночи. Для длительности вычти время начала из времени конца.'),
  topic('moro_century','Век',centuries,'Век длится 100 лет. 1900 год завершает XIX век, 1901 год открывает XX век.'),
  topic('moro_time','Таблица единиц времени',d=>convert(d,'time'),'В минуте 60 секунд, в часе 60 минут, в сутках 24 часа, в веке 100 лет.')
 ]},
 {part:1,title:'Сложение и вычитание',icon:'➕',topics:[
  topic('moro_add_sub','Устные и письменные приёмы сложения и вычитания',d=>addSub(d,1000000),'Записывай одинаковые разряды друг под другом. Сложение и вычитание начинай с единиц.'),
  topic('moro_sum_terms','Нахождение суммы нескольких слагаемых',groupedSum,'Сгруппируй слагаемые так, чтобы удобно получить круглые числа.'),
  topic('moro_written_sub','Письменные приёмы вычитания',writtenSubtract,'Если верхняя цифра меньше нижней, займи единицу соседнего старшего разряда.'),
  topic('moro_missing_add','Неизвестное слагаемое',d=>unknown(d,'add'),'Из суммы вычти известное слагаемое.'),
  topic('moro_missing_sub','Неизвестное уменьшаемое и вычитаемое',d=>unknown(d,d===0?'subFrom':d===1?'subBy':pickOne(['subFrom','subBy'])),'Уменьшаемое находят сложением, вычитаемое — вычитанием.'),
  topic('moro_share','Нахождение нескольких долей целого',fractionsOf,'Раздели целое на число равных долей. Затем умножь на число взятых долей.'),
  topic('moro_add_units','Сложение и вычитание величин',quantityOperation,'Сначала вырази обе величины в одной единице измерения.')
 ]},
 {part:1,title:'Умножение и деление на однозначное число',icon:'✖️',topics:[
  topic('moro_mul_properties','Свойства умножения',multiplyProperty,'Множители можно переставлять. При умножении суммы умножь каждое слагаемое.'),
  topic('moro_mul_one','Письменное умножение на однозначное число',d=>multiply(d,'one'),'Умножай цифры по разрядам справа налево и учитывай переносы.'),
  topic('moro_mul_units','Умножение величины на число',d=>quantityOperation(d,true),'Вырази величину в одной единице, затем умножь.'),
  topic('moro_mul_trailing_one','Умножение на однозначное число, когда один множитель оканчивается нулями',d=>multiply(d,'trailingOne'),'Умножь значащую часть и учти, во сколько раз она меньше исходного множителя.'),
  topic('moro_missing_muldiv','Неизвестный множитель, делимое и делитель',d=>unknown(d,['mul','dividend','divisor'][d]),'Используй связь между умножением и делением.'),
  topic('moro_div_one','Письменное деление на однозначное число',d=>divide(d,'one'),'Работай слева направо. Если неполное делимое меньше делителя, в частном может появиться ноль.'),
  topic('moro_partition','Задачи на пропорциональное деление',d=>proportions(d,'partition'),'Найди общее число одинаковых долей и величину одной доли.')
 ]},
 {part:2,title:'Умножение и деление на однозначное число. Продолжение',icon:'🚲',topics:[
  topic('moro_speed','Скорость. Единицы скорости. Задачи на движение',d=>movement(d,'direct'),'Расстояние равно произведению скорости и времени. Для обратной задачи используй деление.')
 ]},
 {part:2,title:'Умножение на числа, оканчивающиеся нулями',icon:'✖️',topics:[
  topic('moro_mul_product','Умножение числа на произведение',d=>propertyProduct(d,'multiply'),'Чтобы умножить на произведение, можно умножать на его множители по очереди.'),
  topic('moro_mul_zeros','Умножение на числа, оканчивающиеся нулями',d=>multiply(d,'trailing'),'Представь второй множитель как произведение числа и степени десяти.'),
  topic('moro_mul_two_zeros','Умножение двух чисел, оканчивающихся нулями',trailingBoth,'Учти нули на конце обоих множителей.'),
  topic('moro_meeting','Задачи на встречное движение',d=>movement(d,'meeting'),'При встречном движении расстояние между участниками уменьшается на сумму скоростей за час.'),
  topic('moro_mul_group','Перестановка и группировка множителей',grouping,'Переставь множители и собери удобные пары, например 4 × 25.'),
  topic('moro_cube','Куб числа и куб',cubed,'Куб числа — произведение трёх одинаковых множителей. Объём куба равен кубу длины ребра.'),
  topic('moro_box','Прямоугольный параллелепипед',box,'У прямоугольного параллелепипеда по четыре ребра каждой длины. Объём равен произведению трёх размеров.')
 ]},
 {part:2,title:'Деление на числа, оканчивающиеся нулями',icon:'➗',topics:[
  topic('moro_div_product','Деление числа на произведение',d=>propertyProduct(d,'divide'),'Если деление точное, раздели на один множитель делителя, затем на другой.'),
  topic('moro_div_powers','Деление с остатком на 10, 100 и 1 000',remainderPowers,'Остаток меньше делителя. Проверь равенство: делитель × частное + остаток = делимое.'),
  topic('moro_div_zeros','Письменное деление на числа, оканчивающиеся нулями',d=>divide(d,'trailing'),'Вычисли частное и проверь умножением. При делении с остатком проверяй на исходных числах.'),
  topic('moro_fourth','Задачи на нахождение четвёртого пропорционального',d=>proportions(d,'fourth'),'Найди величину на одну единицу, затем используй её для ответа.'),
  topic('moro_opposite','Задачи на движение в противоположных направлениях',d=>movement(d,'opposite'),'Расстояние между участниками увеличивается на сумму скоростей за час.')
 ]},
 {part:2,title:'Умножение на двузначное и трёхзначное число',icon:'✖️',topics:[
  topic('moro_mul_sum','Умножение числа на сумму',multiplySum,'Умножь число на каждое слагаемое и сложи результаты.'),
  topic('moro_mul_double','Письменное умножение на двузначное число',d=>multiply(d,'double'),'Отдельно умножь на единицы и на десятки, затем сложи неполные произведения.'),
  topic('moro_pyramid','Пирамида',pyramid,'У каждой стороны основания есть боковая грань. Все боковые грани имеют общую вершину.'),
  topic('moro_cylinder_cone','Цилиндр и конус',roundSolids,'У цилиндра два круглых основания. У конуса одно круглое основание и вершина.'),
  topic('moro_mul_triple','Письменное умножение на трёхзначное число',d=>multiply(d,'triple'),'Отдельно умножь на единицы, десятки и сотни. Нулевой разряд даёт нулевое произведение.'),
  topic('moro_two_differences','Задачи на нахождение неизвестных по двум разностям',d=>proportions(d,'two'),'Раздели разность величин на разность количества, чтобы найти величину одной единицы.')
 ]},
 {part:2,title:'Деление на двузначное и трёхзначное число',icon:'➗',topics:[
  topic('moro_div_double','Письменное деление на двузначное число',d=>divide(d,'double'),'Подбери цифру частного и проверь её умножением на делитель.'),
  topic('moro_div_double_rest','Деление с остатком на двузначное число',d=>{
   const divisor=ri(11,99), quotient=ri([2,11,102][d],[9,97,990][d]);
   return remainder(divisor*quotient+ri(1,divisor-1),divisor);
  },'Остаток должен быть меньше делителя. При проверке прибавь остаток к произведению.'),
  topic('moro_circle','Окружность и круг. Радиус и диаметр',circle,'Диаметр проходит через центр и равен двум радиусам.'),
  topic('moro_work','Задачи на производительность труда',d=>proportions(d,'work'),'Объём работы равен производительности, умноженной на время.'),
  topic('moro_div_triple','Письменное деление на трёхзначное число',d=>divide(d,'triple'),'Подбери частное и проверь произведение с делителем.')
 ]},
 {part:2,title:'Итоговое повторение',icon:'📘',topics:[
  {id:'numbers',title:'Нумерация'},
  {id:'equations',title:'Выражения и уравнения'},
  topic('moro_review_calculation','Арифметические действия. Сложение и вычитание',d=>pickOne([addSub,groupedSum,writtenSubtract])(d),'Проверь переходы между разрядами и используй обратное действие.'),
  topic('moro_review_muldiv','Арифметические действия. Умножение и деление',d=>pickOne([multiply,divide])(d,['one','double','triple'][d]),'Проверь частное умножением. При умножении разложи множитель по разрядам.'),
  {id:'order',title:'Правила о порядке выполнения действий'},
  {id:'quantities',title:'Величины'},
  {id:'geometry',title:'Геометрические фигуры'},
  {id:'word',title:'Задачи'},
  topic('moro_review_all','Смешанные задания за год',yearReview,'Прочитай вопрос и выбери подходящее правило.')
 ]}
];

const catalog = new Map();
for (const chapter of chapters) {
 for (const item of chapter.topics) {
  catalog.set(item.id,{...item,chapter:chapter.title,icon:chapter.icon});
  if (item.generate) TOPICS.push({id:item.id,title:item.title,ico:chapter.icon,sub:item.sub || chapter.title});
 }
}

function getTopic(key) {
 return keyGrade(key)===4 ? catalog.get(rawCourseId(key)) : undefined;
}

const previousTheory = g4TheoryHtml;
g4TheoryHtml = function (key) {
 const item=getTopic(key);
 return item?.generate ? `<div class="theory847"><p>${esc(item.hint)}</p></div>` : previousTheory(key);
};

const previousHint = g4WrongHint;
g4WrongHint = function (key) {
 return getTopic(key)?.hint || previousHint(key);
};

const previousMake = makeQ;
makeQ = function (key) {
 const item = getTopic(key);
 if (!item?.generate) return previousMake(key);
 const level = activeDifficulty();
 const isOwnBlock = blockSession?.kind === 'quiz' && rawCourseId(blockSession.key) === item.id;
 const question = gPolishQuestionObject(item.generate(level,isOwnBlock?blockSession.done:null));
 question.sig = `g4:${item.id}:${question.sig||question.text}`;
 return question;
};

const previousQuizPath = openQuizPath;
openQuizPath = function (id) {
 const item = getTopic(id);
 if (!item?.generate) return previousQuizPath(id);
 return openStagePicker(id,item.title,item.icon,`startQuizStage.bind(null,'${id}')`,{descriptions:stageDescriptions});
};

const previousAnalytics = analyticsTopicMeta;
analyticsTopicMeta = function (key) {
 const data = previousAnalytics(key), item = getTopic(key);
 return data && item ? {...data,group:item.chapter} : data;
};

const previousKnowledge = knowledgeGradeSections;
knowledgeGradeSections = function (grade) {
 const previous=previousKnowledge(grade);
 if (Number(grade)!==4) return previous;
 return [
  ...chapters.map(chapter=>({id:`g4-${chapter.topics[0].id}`,title:chapter.title,desc:'',keys:chapter.topics.map(t=>`g4:${t.id}`)})),
  ...previous.filter(group=>group.id==='table'||group.id==='column')
 ];
};

function card(id, chapterTitle = '') {
 const item = TOPICS.find(t=>t.id===id);
 return `<button type="button" class="topic ${chapterTitle?'g4-textbook-card':''}" onclick="openTopic('${id}')" data-topic-id="g4:${id}">
  <span class="ico" aria-hidden="true">${item.ico}</span><strong>${esc(catalog.get(id)?.title||item.title)}</strong>
  <small>${esc(chapterTitle || item.sub)}</small><span class="topic-progress">${topicProgressText(id)}</span></button>`;
}

renderGrade4 = function () {
 document.body.classList.remove('elementary-mode');
 mainView.innerHTML = `<div class="home-back-row"><button class="home-back-btn" onclick="renderHome()">← Главный экран</button></div>
  <section class="grade-hero"><div><h1>Математика 4 класса</h1><p>Моро и др. • «Школа России»</p></div>
  <span class="grade-chip">${gradeBookIcon(4,true)} 4 класс</span></section>
  <section class="g6-group" aria-label="Отдельные тренажёры">
   <div class="grade-head"><h2>Отдельные тренажёры</h2></div><div class="grid">${card('column')}${card('table')}</div>
  </section>
  ${chapters.map(chapter=>`<section class="g6-group g4-textbook-group"><div class="grade-head"><h2>${esc(chapter.title)}</h2></div>
   <div class="grid">${chapter.topics.map(item=>card(item.id,chapter.title)).join('')}</div></section>`).join('')}`;
};

window.grade4Textbook = {
 chapters:chapters.map(chapter=>({
  part:chapter.part, title:chapter.title,
  items:chapter.topics.map(item=>[null,item.title,[item.id]])
 })),
 catalog:()=>[...catalog.values()].map(item=>({...item,id:`g4:${item.id}`}))
};
})();
