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
 if(d===0) {
  const n=ri(110,999), power=pickOne([1,10,100]), names={1:'единиц',10:'десятков',100:'сотен'};
  const answer=Math.floor(n/power)%10;
  return number(`Какая цифра стоит в разряде ${names[power]} числа ${n}?`,answer,`В этом разряде стоит цифра ${answer}.`);
 }
 if(d===1) {
  const a=ri(1,9),b=ri(0,9),c=ri(0,9);
  return number(`Запиши число: ${a} сот. ${b} дес. ${c} ед.`,100*a+10*b+c,`${a} × 100 + ${b} × 10 + ${c} = ${100*a+10*b+c}.`);
 }
 const hundreds=ri(3,9), difference=ri(1,hundreds-1), tens=hundreds-difference, units=ri(0,5), result=100*hundreds+10*tens+units;
 return number(`В числе ${hundreds} сотен. Десятков на ${difference} меньше, чем сотен. Единиц ${units}. Запиши число.`,result,
  `${hundreds} − ${difference} = ${tens} (десятков)<br>${100*hundreds} + ${10*tens} + ${units} = ${result}`);
}

function orderWithin1000(d) {
 const a=ri(12,49), b=ri(2,9), c=ri(2,7), e=ri(2,8), p=ri(2,6);
 if (d === 0) return number(`Вычисли ${a} + ${b} × ${c}.`, a+b*c, `${b} × ${c} = ${b*c}<br>${a} + ${b*c} = ${a+b*c}`);
 if (d === 1) return number(`Вычисли (${a} − ${b}) × ${c} + ${e}.`, (a-b)*c+e, `${a} − ${b} = ${a-b}<br>${a-b} × ${c} = ${(a-b)*c}<br>${(a-b)*c} + ${e} = ${(a-b)*c+e}`);
 return number(`Вычисли (${a} + ${b}) × ${c} − ${e*p} : ${p}.`, (a+b)*c-e, `${a} + ${b} = ${a+b}<br>${a+b} × ${c} = ${(a+b)*c}<br>${e*p} : ${p} = ${e}<br>${(a+b)*c} − ${e} = ${(a+b)*c-e}`);
}

function addSub(d, limit) {
 const scale=limit===1000?1:100;
 if(d===0) {
  const first=100*ri(2,5)+10*ri(3,5)+ri(3,5), second=100*ri(1,2)+10*ri(1,3)+ri(1,3);
  const subtract=ri(0,1)===1, a=first*scale, b=second*scale, sign=subtract?'−':'+', result=subtract?a-b:a+b;
  return number(`Вычисли ${format(a)} ${sign} ${format(b)}.`,result,`Считаем по разрядам: ${format(a)} ${sign} ${format(b)} = ${format(result)}.`);
 }
 if(d===1) {
  const low=ri(0,3), high=ri(6,9), a=(100*ri(4,8)+low)*scale, b=(100*ri(1,3)+10*ri(1,9)+high)*scale;
  return number(`Вычти с переходом через разряд: ${format(a)} − ${format(b)}.`,a-b,
   `Занимаем единицу из старшего разряда через разряд с нулём. Проверка: ${format(a-b)} + ${format(b)} = ${format(a)}.`);
 }
 const a=ri(370,610)*scale,b=ri(110,290)*scale,c=ri(30,170)*scale, result=a-b+c;
 return number(`Сначала вычти ${format(b)} из ${format(a)}, затем прибавь ${format(c)}. Запиши результат.`,result,
  `${format(a)} − ${format(b)} = ${format(a-b)}<br>${format(a-b)} + ${format(c)} = ${format(result)}`);
}

function multiply(d, mode) {
 const bounds={
  small:[[11,29],[31,96],[32,99]],
  one:[[123,854],[1206,9908],[1205,9509]],
  trailing:[[12,89],[121,879],[103,900]],
  trailingOne:[[12,89],[121,879],[130,900]],
  double:[[12,96],[123,862],[101,909]],
  triple:[[12,96],[110,745],[102,890]]
 };
 const [low,high]=bounds[mode][d];
 const raw=ri(low,high), nonRound=d===1&&raw%10===0?raw+1:raw;
 const a=nonRound*(mode==='trailingOne'?10**(d+1):1);
 const b={
  small:()=>ri(2,9),one:()=>ri(2,9),trailingOne:()=>ri(2,9),
  trailing:()=>ri(2,d===0?9:89)*10**(d===2?ri(2,3):1),
  double:()=>10*ri(1,9)+ri(2,9),triple:()=>100*ri(1,8)+10*(d===2?0:ri(1,9))+ri(2,9)
 }[mode]();
 const result=a*b, parts=[...String(b)].map((digit,i)=>Number(digit)*10**(String(b).length-i-1)).filter(Boolean);
 if(d===0) return number(`Вычисли ${format(a)} × ${format(b)}.`,result,`${format(a)} × ${format(b)} = ${format(result)}.`);
 if(d===1){
  const splitLeft=parts.length===1;
  const value=splitLeft?a:b, other=splitLeft?b:a;
  const head=Number(String(value)[0])*10**(String(value).length-1), tail=value-head;
  return number(`Разложили ${format(value)} на ${format(head)} и ${format(tail)}. При умножении на ${format(other)} первый частичный результат равен ${format(head*other)}. Найди второе частичное произведение.`,
   tail*other,`${format(tail)} × ${format(other)} = ${format(tail*other)}.`);
 }
 const other=ri(2,8), combined=(a+other)*b;
 if(mode==='double'||mode==='triple'){
  const productRows=parts.map(p=>`${format(a)} × ${format(p)} = ${format(a*p)}`).join('<br>');
  const final=result+other*b;
  return number(`Проверь два заказа: в первом ${format(a)} наборов по ${format(b)} деталей, во втором ${other} таких наборов. Сколько деталей в обоих заказах?`,final,
   `${productRows}<br>В первом заказе ${format(result)} деталей.<br>${other} × ${format(b)} = ${format(other*b)}<br>${format(result)} + ${format(other*b)} = ${format(final)}`);
 }
 return number(`В равенстве □ × ${format(b)} + ${format(other*b)} = ${format(combined)} пропущен множитель. Найди его.`,a,
  `${format(combined)} − ${format(other*b)} = ${format(result)}<br>${format(result)} : ${format(b)} = ${format(a)}`);
}

function divide(d, mode) {
 const divisor={
  small:()=>ri(2,9),one:()=>ri(2,9),
  trailing:()=>ri(2,d===0?9:49)*10**(d===2?ri(2,3):1),
  double:()=>ri(11,99),triple:()=>ri(101,999)
 }[mode]();
 const [lo,hi]=mode==='small'?[[11,35],[36,74],[47,90]][d]:[[12,79],[101,590],[1001,2909]][d];
 const quotient=d===1&&mode==='one'?100*ri(1,8)+ri(1,9):ri(lo,hi), dividend=divisor*quotient;
 if(d===0) return number(`Вычисли ${format(dividend)} : ${format(divisor)}.`,quotient,
  `Проверка: ${format(quotient)} × ${format(divisor)} = ${format(dividend)}.`);
 if(d===1){
  const part=divisor*ri(1,9);
  return number(`Раздели сумму ${format(dividend)} + ${format(part)} на ${format(divisor)}. Укажи частное.`,quotient+part/divisor,
   `${format(dividend)} : ${format(divisor)} = ${format(quotient)}<br>${format(part)} : ${format(divisor)} = ${part/divisor}<br>${format(quotient)} + ${part/divisor} = ${format(quotient+part/divisor)}`);
 }
 if(['trailing','double','triple'].includes(mode)){
  const rest=ri(1,divisor-1), carry=ri(1,4), total=dividend+rest, putAside=divisor*carry;
  return number(`Было ${format(total)} карточек. ${format(putAside)} карточек отложили. Остальные распределяют по ${format(divisor)} в каждую полную группу. Сколько полных групп получится?`,quotient-carry,
   `${format(total)} − ${format(putAside)} = ${format(total-putAside)}<br>${format(divisor)} × ${format(quotient-carry)} + ${rest} = ${format(total-putAside)}<br>Полных групп ${format(quotient-carry)}, остаток ${rest}.`);
 }
 const taken=ri(2,9), used=divisor*taken;
 return number(`В запасе ${format(dividend)} карандашей. ${used} карандашей отложили, а оставшиеся разложили по ${divisor} в каждую группу. Сколько групп получилось?`,quotient-taken,
  `${format(dividend)} − ${used} = ${format(dividend-used)}<br>${format(dividend-used)} : ${divisor} = ${quotient-taken}`);
}

function numberClasses(d, large=false) {
 const groups = ['единиц','тысяч','миллионов','миллиардов'];
 if(large&&d===2){
  const billions=ri(2,99), millions=ri(1,99), thousands=ri(0,9), units=ri(1,9);
  const result=billions*1e9+millions*1e6+thousands*1000+units;
  return number(`Собери число: ${billions} млрд ${millions} млн ${thousands} тыс. ${units} ед.`,result,
   `Каждый класс после миллиардов пишем тремя цифрами: ${format(result)}.`);
 }
 if(!large && d===2) {
  const thousands=ri(110,986), units=ri(1,99), value=thousands*1000+units;
  return number(`Собери число из двух классов: класс тысяч — ${thousands}, класс единиц — ${String(units).padStart(3,'0')}.`,
   value,`${thousands} × 1 000 + ${units} = ${format(value)}.`);
 }
 if(!large&&d===1){
  const thousands=ri(21,990), units=ri(1,999), decrease=ri(2,15);
  const numberBefore=thousands*1000+units, result=(thousands-decrease)*1000+units;
  return number(`В числе ${format(numberBefore)} уменьши число в классе тысяч на ${decrease}, сохрани класс единиц. Запиши результат.`,result,
   `${thousands} − ${decrease} = ${thousands-decrease} (тыс.)<br>${format(result)}`);
 }
 const index=large?[2,3][d]:0;
 const chosen = ri(102,987), scale = 1000**index, tail = ri(1,999);
 const higher=index===0?ri(1,99)*1000:0;
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
 if(d===1) return choice(`Как записать цифрами: <b>${spoken(upper,tail)}</b>?`,format(value),alternatives.map(format),steps);
 return number(`При записи числа «${spoken(upper,tail)}» забыли нули в классе единиц. Запиши число правильно.`,value,steps);
}

function numberWriting(d) {
 const thousands=ri([2,12,105][d],[9,90,999][d]), units=d===0?ri(10,999):ri(1,9);
 if(d===0){
  const value=thousands*1000+units;
  return number(`Запиши число: ${thousands} тыс. ${units} ед.`,value,`${thousands} × 1 000 + ${units} = ${format(value)}.`);
 }
 const hundreds=ri(1,9);
 if(d===1){
  const value=thousands*1000+hundreds*100+units;
  return number(`Запиши число: ${thousands} тыс., ${hundreds} сот., десятков нет, ${units} ед.`,value,
   `${thousands} × 1 000 + ${hundreds} × 100 + ${units} = ${format(value)}. В разряде десятков стоит 0.`);
 }
 const tens=pickOne([1,2,3,4,5,6,7,8,9].filter(x=>x!==hundreds)), value=thousands*1000+100*hundreds+10*tens+units;
 const difference=Math.abs(hundreds-tens);
 return number(`Запиши шестизначное число. В классе тысяч записано ${thousands}, в классе единиц ${hundreds} сот., на ${difference} ${tens<hundreds?'меньше':'больше'} десятков и ${units} ед.`,
  value,`Десятков ${hundreds} ${tens<hundreds?'−':'+'} ${difference} = ${tens}.<br>${thousands} × 1 000 + ${hundreds*100} + ${tens*10} + ${units} = ${format(value)}.`);
}

function expanded(d) {
 const n=ri([1001,10011,102001][d],[9989,99898,998998][d]);
 const parts=[...String(n)].map((digit,index)=>Number(digit)*10**(String(n).length-index-1)).filter(Boolean), sum=parts.map(format).join(' + ');
 if(d===0) return number(`Запиши одним числом: ${sum}.`,n,`Складываем разрядные слагаемые: ${format(n)}.`);
 if(d===1){
  const part=pickOne(parts);
  return number(`Какое разрядное слагаемое в числе ${format(n)} соответствует цифре ${String(part)[0]} в разряде ${['единиц','десятков','сотен','тысяч','десятков тысяч'][String(part).length-1]}?`,part,
   `Разложим число: ${format(n)} = ${sum}. Нужное слагаемое ${format(part)}.`);
 }
 const index=ri(0,parts.length-1), missing=parts[index];
 return number(`Восстанови пропущенное разрядное слагаемое:<br>${format(n)} = ${parts.map((p,i)=>i===index?'□':format(p)).join(' + ')}.`,missing,
  `${format(n)} = ${sum}.`);
}

function compareNumbers(d) {
 if(d===2) {
  const middle=ri(120001,939997), distances=[ri(10,99),ri(1,9)], values=sh([middle-distances[0],middle,middle+distances[1]]);
  return number(`Расположи числа ${values.map(format).join(', ')} по возрастанию. Запиши среднее число в этом порядке.`,middle,
   `${format(middle-distances[0])} &lt; ${format(middle)} &lt; ${format(middle+distances[1])}.`);
 }
 const a=ri(d===0?1200:12000,d===0?9400:94000);
 const b=d===0?pickOne([ri(110,999),ri(11000,16000)]):a+ri(-8,8);
 const [left,right]=sh([a,b]), answer=left>right?'>':left<right?'<':'=';
 return choice(`${d===0?'Сравни числа с разным количеством цифр':'Сравни числа одинаковой длины'}:<br>${format(left)} □ ${format(right)}`,
  answer,['>','<','='].filter(value=>value!==answer),`${format(left)} ${esc(answer)} ${format(right)}. ${d===0?'Сначала сравниваем количество цифр.':'Сравниваем цифры слева направо.'}`);
}

function timesTen(d) {
 const a=ri(13,849);
 if(d===0){
  const factor=pickOne([10,100,1000]);
  return number(`Увеличь ${format(a)} в ${format(factor)} раз.`,a*factor,`${format(a)} × ${format(factor)} = ${format(a*factor)}.`);
 }
 if(d===1){
  const factor=pickOne([10,100,1000]);
  return number(`Во сколько раз надо уменьшить ${format(a*factor)}, чтобы получить ${format(a)}?`,factor,
   `${format(a*factor)} : ${format(a)} = ${format(factor)}.`);
 }
 const first=pickOne([100,1000]), second=first/10, product=a*first;
 return number(`Число ${format(a)} сначала увеличили в ${format(first)} раз, а затем уменьшили в ${format(second)} раз. Какое число получилось?`,a*10,
  `${format(a)} × ${format(first)} = ${format(product)}<br>${format(product)} : ${format(second)} = ${format(a*10)}`);
}

const units = {
 length: [['мм','см',10],['см','дм',10],['см','м',100],['м','км',1000]],
 area: [['мм²','см²',100],['см²','дм²',100],['см²','м²',10000],['м²','км²',1000000]],
 mass: [['г','кг',1000],['кг','ц',100],['кг','т',1000],['ц','т',10]],
 time: [['с','мин',60],['мин','ч',60],['ч','сут',24],['лет','в.',100]]
};

function convert(d, kind, pairs=units[kind]) {
 const [small,big,factor]=pairs[d===0?ri(0,Math.min(1,pairs.length-1)):ri(0,pairs.length-1)];
 const amount=ri(2,24), base=amount*factor;
 if(d===0) return number(`Сколько ${small} в ${amount} ${big}?`,base,
  `1 ${big} = ${format(factor)} ${small}<br>${amount} × ${format(factor)} = ${format(base)}`,small);
 if(d===1){
  const rest=ri(1,Math.min(factor-1,99)), result=base+rest;
  return number(`Вырази ${amount} ${big} ${rest} ${small} в ${small}.`,result,
   `${amount} × ${format(factor)} + ${rest} = ${format(result)}.`,small);
 }
 const rest=ri(3,Math.min(factor-1,99)), smaller=base+ri(1,rest-1), result=base+rest;
 return number(`На сколько ${small} величина ${amount} ${big} ${rest} ${small} больше величины ${format(smaller)} ${small}?`,
  result-smaller,`${amount} × ${format(factor)} + ${rest} = ${format(result)} (${small})<br>${format(result)} − ${format(smaller)} = ${result-smaller} (${small})`,small);
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
 const another=area*ri(1,3);
 const compare=d===2?` На сколько квадратных сантиметров площадь закрашенной фигуры больше ${another} см²?`:' Найди площадь закрашенной фигуры.';
 const steps=`Площадь клетки: ${side} × ${side} = ${area} см².<br>Полных клеток ${fullCells}, половинок ${partial}.<br>Площадь фигуры ${answer} см².`;
 const question=number(`Сторона клетки ${side} см.${compare}<br>${svg}`,d===2?answer-another:answer,
  steps+(d===2?`<br>${answer} − ${another} = ${answer-another} см².`:''),'см²');
 question.sig=['grid',width,height,cutX,cutY,partial,side,d===2?another:0].join(':');
 return question;
}

function clock(d) {
 const minute=ri(0,4)*5, hour=ri(8,17), display=time=>`${Math.floor(time/60)%24}:${String(time%60).padStart(2,'0')}`;
 if(d===0){
  const start=hour*60+minute, length=ri(1,7)*5, end=start+length;
  return number(`Занятие началось в ${display(start)}, закончилось в ${display(end)}. Сколько минут оно длилось?`,length,
   `Час тот же. Вычитаем минуты: ${end%60} − ${start%60} = ${length} мин.`,'мин');
 }
 if(d===1){
  const start=hour*60+ri(8,11)*5, length=ri(7,14)*5, end=start+length;
  return g3TimeInputQuestion(`Событие началось в ${display(start)} и длилось ${length} мин. Во сколько оно закончилось?`,end,
   `${display(start)} + ${length} мин = ${display(end)}.`,`clock:end:${start}:${length}`);
 }
 const before=ri(1,11)*5, after=ri(2,15)*5, stop=ri(1,Math.min(5,(before+after)/5-1))*5;
 return number(`Поезд вышел в ${display(1440-before)} и прибыл в ${display(after)} уже на следующий день. Стоянка заняла ${stop} мин. Сколько минут поезд был в движении?`,
  before+after-stop,`До полуночи ${before} мин, после полуночи ${after} мин.<br>${before} + ${after} − ${stop} = ${before+after-stop} мин.`,'мин');
}

function calendar(d) {
 const years=ri(2,17);
 if(d===0) return number(`Сколько месяцев в ${years} полных годах?`,years*12,`${years} × 12 = ${years*12}.`,'мес');
 if(d===1){
  const month=ri(1,11);
  return number(`До ремонта осталось ${years} г. ${month} мес. Сколько всего месяцев до ремонта?`,
   years*12+month,`${years} × 12 + ${month} = ${years*12+month}.`,'мес');
 }
 const ordinary=ri(2,9), leap=ri(2,5), result=ordinary*365+leap*366;
 return number(`Сколько дней в ${ordinary} обычных и ${leap} високосных годах вместе?`,result,
  `${ordinary} × 365 + ${leap} × 366 = ${result}.`,'дн.');
}

function centuries(d) {
 const century=ri(2,21), first=(century-1)*100+1, last=century*100;
 if(d===0){
  const year=first+ri(1,98);
  return number(`К какому веку относится ${year} год? Напиши номер века.`,century,`${century}-й век: от ${first}-го до ${last}-го года.`);
 }
 if(d===1){
  const end=ri(0,1)===1, year=end?last:first;
  return number(`Какой год ${end?'завершает':'открывает'} ${century}-й век?`,year,`Годы ${century}-го века идут от ${first} до ${last}.`);
 }
 const elapsed=ri(16,80), year=first+elapsed;
 return number(`Событие произошло в ${year} году. Сколько полных лет оставалось от начала этого года до начала следующего века?`,
  last+1-year,`Следующий век начинается ${last+1}-м годом.<br>${last+1} − ${year} = ${last+1-year} (лет).`,'лет');
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
 const [left, right]=equation.split(' = '), target=Number(right), offset=ri(3,12);
 const rhs=d===0?right:d===1?`${target+offset} − ${offset}`:`(${2*target+offset} − ${offset}) : 2`;
 const preparation=d===0?'':d===1?`${rhs} = ${target}<br>`:
  `${2*target+offset} − ${offset} = ${2*target}<br>${2*target} : 2 = ${target}<br>`;
 const answer = type==='dividend'?x*b:type==='subFrom'?x+a:x;
 return number(`Реши уравнение ${left} = ${rhs}.`,answer,`${preparation}${rule}<br>x = ${expression}<br>x = ${answer}`);
}

function fractionsOf(d) {
 const den=ri(4+d,10+d), numerator=d===0?2:ri(2,den-1), one=ri(3,23+d*20), all=den*one, part=numerator*one;
 const steps=`${all} : ${den} = ${one}<br>${one} × ${numerator} = ${part}`;
 if(d===0) return number(`Найди ${frac(numerator,den)} от ${all}.`,part,steps);
 if(d===1) return number(`В альбоме ${all} страниц. Ученик заполнил ${frac(numerator,den)} всех страниц. Сколько страниц он заполнил?`,part,steps);
 return number(`В ленте ${all} см. Сколько сантиметров останется, если отрезать ${frac(numerator,den)} ленты?`,
  all-part,`${steps}<br>${all} − ${part} = ${all-part}`,'см');
}

function quantityOperation(d, product) {
 const kind=pickOne(['length','mass','time']);
 const [small,big,factor]=pickOne(units[kind].filter(pair=>pair[2]<=1000&&pair[1]!=='в.'));
 const major=ri(2,12+d*4), minor=ri(1,factor-1), value=major*factor+minor;
 const sign=ri(0,1)===1?'−':'+';
 if(d===0){
  const b=ri(1,major-1), count=ri(2,8);
  const answer=product?major*count:sign==='−'?major-b:major+b;
  const expression=product?`${major} ${big} × ${count}`:`${major} ${big} ${sign} ${b} ${big}`;
  return number(`Вычисли ${expression}. Ответ запиши в ${big}.`,answer,
   `${product?`${major} × ${count}`:`${major} ${sign} ${b}`} = ${answer} (${big}).`,big);
 }
 if(d===1){
  const b=product?ri(2,8):ri(1,factor-1), operator=product?'×':sign;
  const answer=product?value*b:sign==='−'?value-b:value+b;
  return number(`Вычисли (${major} ${big} ${minor} ${small}) ${operator} ${b}${product?'':` ${small}`}. Ответ запиши в ${small}.`,
   answer,`${major} × ${factor} + ${minor} = ${value} (${small})<br>${value} ${operator} ${b} = ${answer}`,small);
 }
 if(product){
  const count=ri(2,8), other=ri(1,9), total=value*count+other;
  return number(`Чтобы получить ${format(total)} ${small}, несколько раз взяли по ${major} ${big} ${minor} ${small}, а затем прибавили ${other} ${small}. Сколько раз взяли эту величину?`,
   count,`${major} × ${factor} + ${minor} = ${value} (${small})<br>${format(total)} − ${other} = ${format(value*count)}<br>${format(value*count)} : ${value} = ${count}`);
 }
 const major2=ri(1,major-1), minor2=ri(1,factor-1), value2=major2*factor+minor2;
 return number(`На сколько ${small} величина ${major} ${big} ${minor} ${small} больше величины ${major2} ${big} ${minor2} ${small}?`,
  value-value2,`${major} × ${factor} + ${minor} = ${value}<br>${major2} × ${factor} + ${minor2} = ${value2}<br>${value} − ${value2} = ${value-value2} (${small})`,small);
}

function propertyProduct(d, property) {
 const a = ri(12,65+d*12), b = ri(2,9), c = ri(2,8), result = a*b*c;
 if(property==='multiply') {
  if(d===0) return number(`В выражении ${a} × (${b} × ${c}) найди произведение в скобках.`,b*c,`${b} × ${c} = ${b*c}.`);
  if(d===1) return number(`Вычисли (${a} × ${b}) × ${c} удобным способом.`,result,`${b} × ${c} = ${b*c}<br>${a} × ${b*c} = ${result}`);
  return number(`Какое число пропущено в равенстве? ${a} × (□ × ${c}) = ${result}`,b,`${result} : ${a} = ${b*c}<br>${b*c} : ${c} = ${b}`);
 }
 const dividend = a*b*c, divisor = b*c;
 if(d===2) return number(`Восстанови пропуск: ${format(dividend)} : (${b} × □) = ${a}.`,c,`${format(dividend)} : ${a} = ${divisor}<br>${divisor} : ${b} = ${c}`);
 if(d===0) return number(`Чему равен делитель в записи ${format(dividend)} : (${b} × ${c})?`,divisor,
  `${b} × ${c} = ${divisor}.`);
 return number(`Раздели ${format(dividend)} на произведение ${b} и ${c}. Запиши частное.`,a,
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
  const gap=second-speed;
  return number(`Два велосипедиста выехали ${path} одновременно. ${kind==='meeting'?`Между пунктами ${whole} км, встреча через ${time} ч.`:`Через ${time} ч между ними ${whole} км.`} Первый ехал со скоростью ${speed} км/ч. На сколько километров в час второй ехал быстрее первого?`,gap,
   `${whole} : ${time} = ${sum} (км/ч)<br>${sum} − ${speed} = ${second} (км/ч)<br>${second} − ${speed} = ${gap} (км/ч)`,'км/ч');
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
  const difference=per*(b-a), common=`${b} − ${a} = ${b-a}<br>${difference} : ${b-a} = ${per}`;
  if(d===1) return number(`В первой коробке ${b} одинаковых наборов, во второй ${a}. В первой на ${difference} карандашей больше. Сколько карандашей во второй коробке?`,per*a,
   `${common}<br>${per} × ${a} = ${per*a}`);
  return number(`В первой коробке ${b} одинаковых наборов, во второй ${a}. В первой на ${difference} карандашей больше. Сколько карандашей в обеих коробках вместе?`,total,
   `${common}<br>${b} + ${a} = ${a+b}<br>${per} × ${a+b} = ${total}`);
 }
 if(kind==='partition') {
  if(d===0) return number(`Из ${total} м ткани сшили ${a+b} одинаковых костюмов. Сколько метров ушло на ${a} из них?`,per*a,
   `${total} : ${a+b} = ${per} (м на костюм)<br>${per} × ${a} = ${per*a} (м)`,'м');
  const count=b;
  const result = d===2?per*(b-a):per*count;
  return number(`Из ${total} метров ткани сшили ${a} костюмов для первой группы и ${b} костюмов для второй. На один костюм уходит одинаковое количество ткани. ${d===2?'На сколько метров больше ткани ушло на вторую группу?':`Сколько метров ткани ушло на вторую группу?`}`,result,
   `${a} + ${b} = ${a+b}<br>${total} : ${a+b} = ${per}<br>${d===2?`${b} − ${a} = ${b-a}<br>${per} × ${b-a} = ${result}`:`${per} × ${count} = ${result}`}`,'м');
 }
 if(kind==='work') {
  if(d===0) return number(`Мастер делает ${per} деталей за час. Сколько деталей он изготовит за ${a} ч?`,per*a,`${per} × ${a} = ${per*a}.`);
  if(d===1){
   const extra=ri(2,21), withExtra=per*a+extra;
   return number(`За ${a} ч мастер изготовил ${withExtra} деталей, включая ${extra} деталей сверх нормы. Сколько деталей в час составляет обычная норма?`,per,
    `${withExtra} − ${extra} = ${per*a}<br>${per*a} : ${a} = ${per} (деталей в час)`);
  }
  return number(`За ${a} ч мастер изготовил ${per*a} деталей. Всего он должен изготовить ${total} деталей. Сколько ещё часов ему нужно работать с той же производительностью?`,b,
   `${per*a} : ${a} = ${per} (деталей в час)<br>${total} − ${per*a} = ${per*b} (деталей осталось)<br>${per*b} : ${per} = ${b} (ч)`,'ч');
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
 const a=ri([22,103,1028][d],[99,997,9998][d])*10**(d===0?1:2), b=ri(d===0?102:111,a-(d===2?100:20));
 if(d===0) return number(`Вычисли столбиком ${a} − ${b}. Запиши разность.`,a-b,`Проверка: ${a-b} + ${b} = ${a}.`);
 if(d===1) {
  const withUnits=b%10===0?b+1:b;
  return number(`Вычти столбиком через разряды с нулями: ${format(a)} − ${format(withUnits)}.`,a-withUnits,
   `Занимаем через разряды с нулями. Проверим сложением: ${format(a-withUnits)} + ${format(withUnits)} = ${format(a)}.`);
 }
 const c=ri(11,98);
 return number(`После двух вычитаний из ${format(a)} получили ${format(a-b-c)}. Сначала вычли ${format(b)}. Какое число вычли вторым?`,c,
  `${format(a)} − ${format(b)} = ${format(a-b)}<br>${format(a-b)} − ${format(a-b-c)} = ${c}`);
}

function trailingBoth(d) {
 const a=ri(12,99+d*50), b=ri(2,8+d*7), k=1+d, left=a*10**k, right=b*10;
 const out=left*right, zeros=k+1;
 if(d===0) return number(`Вычисли ${format(left)} × ${format(right)}.`,out,
  `${a} × ${b} = ${a*b}<br>${a*b} × ${format(10**zeros)} = ${format(out)}`);
 if(d===1) return number(`Вычисли произведение ${format(left)} × ${format(right)}. Затем раздели полученный результат на 10.`,out/10,
  `${a} × ${b} = ${a*b}<br>${a*b} × ${format(10**zeros)} = ${format(out)}<br>${format(out)} : 10 = ${format(out/10)}`);
 const partial=ri(2,9)*right;
 return number(`Вычисли пропущенный множитель: □ × ${format(right)} − ${format(partial)} = ${format(out-partial)}.`,left,
  `${format(out-partial)} + ${format(partial)} = ${format(out)}<br>${format(out)} : ${format(right)} = ${format(left)}`);
}

function remainderStages(d, divisor, quotient, rest) {
 const dividend=divisor*quotient+rest;
 if(d===0) return remainder(dividend,divisor);
 if(d===1) return number(`При делении на ${format(divisor)} получили частное ${format(quotient)} и остаток ${rest}. Найди делимое.`,dividend,
  `${format(divisor)} × ${format(quotient)} + ${rest} = ${format(dividend)}.`);
 const remove=ri(1,Math.min(8,quotient-1)), removed=divisor*remove, after=dividend-removed;
 const q=remainder(after,divisor);
 return {...q,
  text:`Было ${format(dividend)} единиц. Убрали ${format(removed)}. Остальные делят на ${format(divisor)}. Найди частное и остаток.`,
  ex:`${format(dividend)} − ${format(removed)} = ${format(after)}<br>${q.ex}`};
}

function remainderPowers(d) {
 const divisor=[10,100,1000][d];
 return remainderStages(d,divisor,ri(12,987),ri(1,divisor-1));
}

function cubed(d) {
 const n=ri(2,12+d*3);
 if(d===0) return number(`Вычисли ${n}<sup>3</sup>.`,n**3,`${n}<sup>3</sup> = ${n} × ${n} × ${n} = ${n**3}.`);
 if(d===1){
  const second=n+ri(1,4);
  return number(`Рёбра двух кубов равны ${n} см и ${second} см. На сколько кубических сантиметров объём большего куба больше?`,second**3-n**3,
   `${n} × ${n} × ${n} = ${n**3}<br>${second} × ${second} × ${second} = ${second**3}<br>${second**3} − ${n**3} = ${second**3-n**3} (см³)`,'см³');
 }
 const out=n**3, diff=ri(1,4), bigger=n+diff;
 return number(`Объём куба ${out} см³, его ребро — целое число сантиметров. Каков будет объём куба, если увеличить ребро на ${diff} см?`,
  bigger**3,`${n} × ${n} × ${n} = ${out}<br>${n} + ${diff} = ${bigger} (см)<br>${bigger} × ${bigger} × ${bigger} = ${bigger**3} (см³)`,'см³');
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
 const sides=ri(3,d===0?10:14), count=ri(2,9);
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
 if(d===1){
  const other=a+b;
  return number(`Диаметры двух окружностей ${a*2} см и ${other*2} см. Найди сумму их радиусов.`,a+other,
   `${a*2} : 2 = ${a}<br>${other*2} : 2 = ${other}<br>${a} + ${other} = ${a+other} (см)`,'см');
 }
 return number(`Диаметр первой окружности ${a*2} см. Радиус второй на ${b} см больше радиуса первой. Найди диаметр второй окружности.`,
  (a+b)*2,`${a*2} : 2 = ${a}<br>${a} + ${b} = ${a+b}<br>${a+b} × 2 = ${(a+b)*2} (см)`,'см');
}

function yearReview(d,slot=null) {
 const skills=[orderWithin1000,placeTo1000,expanded,timesTen,fractionsOf,clock,groupedSum,circle];
 const generate=slot===null?pickOne(skills):skills[(slot+d)%skills.length];
 const q=generate(d);
 return {...q,text:`Итоговое повторение. ${q.text}`};
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
  topic('moro_add_units','Сложение и вычитание величин',d=>quantityOperation(d,false),'Сначала вырази обе величины в одной единице измерения.')
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
   return remainderStages(d,divisor,quotient,ri(1,divisor-1));
  },'Остаток должен быть меньше делителя. При проверке прибавь остаток к произведению.'),
  topic('moro_circle','Окружность и круг. Радиус и диаметр',circle,'Диаметр проходит через центр и равен двум радиусам.'),
  topic('moro_work','Задачи на производительность труда',d=>proportions(d,'work'),'Объём работы равен производительности, умноженной на время.'),
  topic('moro_div_triple','Письменное деление на трёхзначное число',d=>divide(d,'triple'),'Подбери частное и проверь произведение с делителем.')
 ]},
 {part:2,title:'Итоговое повторение',icon:'📘',topics:[
  {id:'numbers',title:'Нумерация'},
  {id:'equations',title:'Выражения и уравнения'},
  topic('moro_review_calculation','Арифметические действия. Сложение и вычитание',d=>pickOne([level=>addSub(level,1000000),groupedSum,writtenSubtract])(d),'Проверь переходы между разрядами и используй обратное действие.'),
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
  ${chapters.map(chapter=>`<section class="g6-group g4-textbook-group"><div class="grade-head"><div><h2>${esc(chapter.title)}</h2></div></div>
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
