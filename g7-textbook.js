(function(){
'use strict';

const signed=n=>n<0?' − '+Math.abs(n):' + '+n;
const pair=(x,y)=>'('+x+'; '+y+')';
const rules=Object.create(null);
const sources={algebra:'Макарычев и др., 2024',geometry:'Атанасян и др., 2023',probability_statistics:'Высоцкий и Ященко, 2023'};

const math=text=>'<span class="math">'+text+'</span>';
const fmt=value=>(Number.isInteger(value)?String(value):String(Number(value.toFixed(6)))).replace(/^-/, '−').replace('.', ',');
const exact=value=>g7SignedHtml(value,{fraction:value.d!==1&&rationalFiniteDecimal(value)===null});
const sum=(left,right)=>left+signed(right);
const readResult=(expression,answer,...steps)=>[
 'Вычисли '+expression+'.',answer,steps.join('<br>')
];
const choice=(prompt,answer,options,ex)=>[prompt,answer,options,ex];

function decimalExpansion(value){
 const remainderPositions=new Map(),digits=[];
 const n=Math.abs(value.n),d=value.d;
 let remainder=n%d;
 while(remainder&&!remainderPositions.has(remainder)){
  remainderPositions.set(remainder,digits.length);
  const next=remainder*10;
  digits.push(Math.floor(next/d));
  remainder=next%d;
 }
 const start=remainder?remainderPositions.get(remainder):digits.length;
 return {whole:(value.n<0?'−':'')+Math.floor(n/d),
  prefix:digits.slice(0,start).join(''),period:digits.slice(start).join('')};
}

const reviewedLessons={
 rational_numbers_forms:'Натуральные числа начинаются с 1. Целые числа включают натуральные, ноль и отрицательные целые. Рациональное число можно записать дробью с целым числителем и натуральным знаменателем. При делении либо получаем остаток 0, либо остатки начинают повторяться. Во втором случае записываем период в скобках.',
 rational_arithmetic:'При сложении и вычитании дробей приведи их к общему знаменателю. При умножении перемножь числители и знаменатели. Деление замени умножением на обратную дробь. Учитывай знаки и выполняй действия в скобках первыми.',
 variables_expression_value:'Выражение с переменной описывает число, которое зависит от значения буквы. При вычислении подставляй заданное число. Отрицательное число подставляй в скобках.',
 admissible_values:'Подставлять можно любые значения, при которых определены все действия. Для выражения с дробью найди, при каких значениях знаменатель равен нулю. Эти значения исключи.',
 rational_compare_order:'У отрицательных чисел больше то, у которого модуль меньше. Дроби можно сравнить, приведя их к общему знаменателю. В двойном неравенстве должны быть верны оба сравнения.',
 expression_properties:'Переместительное свойство позволяет менять порядок, сочетательное — группировать слагаемые и множители. По распределительному свойству a(b + c) = ab + ac. Можно раскрыть скобки или вынести общий множитель.',
 identities:'Тождество верно при всех допустимых значениях переменных. Чтобы доказать тождество, приведи обе части к одному выражению. Чтобы опровергнуть равенство, достаточно одного допустимого значения, при котором части различны.',
 brackets_like_terms:'Если перед скобками стоит минус, поменяй знак каждого слагаемого. Приводи только подобные слагаемые: складывай коэффициенты при одинаковых буквенных частях.',
 equation_root_equivalence:'Корень уравнения превращает его в верное равенство. Равносильные уравнения имеют один и тот же набор корней. К обеим частям можно прибавить одно и то же число или умножить обе части на одно и то же ненулевое число.',
 linear_equation_one_variable:'Раскрой скобки и приведи подобные слагаемые. Собери слагаемые с x слева, числа справа. В уравнении ax = b при a ≠ 0 раздели обе части на a.',
 linear_equation_cases:'После приведения к ax = b при a ≠ 0 корень один. При a = 0 проверь правую часть: из 0x = 0 следует, что подходит любое число, из 0x = b при b ≠ 0 следует, что корней нет.',
 equation_word_problems:'Обозначь искомое или удобную для расчёта величину через x. Вырази через x остальные величины и найди в условии равенство. После решения проверь, подходит ли найденное значение.'
};

function compare(prompt,left,right,explanation){
 const signs=['&lt;','=','&gt;'],sign=signs[rationalCmp(left,right)+1];
 return choice(prompt,sign,signs.filter(item=>item!==sign),explanation+' Получаем '+exact(left)+' '+sign+' '+exact(right)+'.');
}
const checkStatement=(prompt,truth,explanation)=>choice(prompt,truth?'Да':'Нет',[truth?'Нет':'Да'],explanation);
const simplify=(expression,coefficient,constant,explanation)=>[
 'Упрости '+math(expression)+'.',g7Lin(coefficient,constant),explanation,'linear'
];
const solve=(equation,answer,...steps)=>['Реши уравнение '+equation+'.',answer,steps.join('<br>')];
function equationCases(prompt,left,right){
 const kind=g7EquationCase(left,right),labels={one:'Один корень',none:'Нет корней',infinite:'Бесконечно много корней'};
 const coefficient=rationalSub(left.a,right.a),constant=rationalSub(right.b,left.b);
 const reasons={
  one:'Коэффициент при x отличен от нуля. Делим обе части и получаем x = '+(kind.root?exact(kind.root):'')+'.',
  none:'Равенство ложно при любом x, потому что 0 не равно '+exact(constant)+'.',
  infinite:'Равенство 0 = 0 верно при любом x.'
 };
 return choice(prompt,labels[kind.kind],Object.values(labels).filter(label=>label!==labels[kind.kind]),
  'После упрощения получаем '+exact(coefficient)+' · x = '+exact(constant)+'. '+reasons[kind.kind]);
}

function add(section,id,title,rule,build){
 const group=G7_GROUPS.find(item=>item.id===section);
 if(!group)throw new Error('Неизвестный раздел: '+section);
 group.topics.push({id:'g7:'+id,grade:7,course:group.course,section:group.title,group:group.title,title,shortTitle:title,source:sources[group.course],
  rendererType:'quiz',implemented:true,order:108+Object.keys(rules).length});
 rules[id]={rule,build};
}

add('alg_expressions_equations','numerical_expressions','Числовые выражения',
 'Числовое выражение составляют из чисел, знаков действий и скобок. Сначала выполни действия в скобках, затем умножение и деление, потом сложение и вычитание. Действия одной ступени выполняй слева направо. Если делитель равен нулю, выражение не имеет смысла.',
 null);

const reviewed = {
 rational_numbers_forms: [
  {
   number_sets: ({a,b,c})=>{
    const r=[rational(a),rational(-a),rational(a*b+1,b)][c%3];
    const labels=['Натуральные числа','Целые числа','Рациональные числа'];
    const set=r.d!==1?2:r.n<1?1:0;
    return choice('В каком из этих множеств находится '+g7FracHtml(r)+'? Выбери самое узкое множество.',
     labels[set],labels.filter((_,i)=>i!==set),
     set===0?'Это положительное целое число.':set===1?'Это отрицательное целое число.':'Числитель на знаменатель нацело не делится.');
   },
   opposite: ({a,b})=>{
    const value=b%2===0?a:-a;
    return ['Запиши число, противоположное '+math(fmt(value))+'.',-value,fmt(value)+' и '+fmt(-value)+' находятся на одинаковом расстоянии от нуля по разные стороны.'];
   },
   modulus: ({a})=>['Найди '+math('|'+fmt(-a/10)+'|')+'.',rational(a,10),'Расстояние от '+fmt(-a/10)+' до нуля равно '+fmt(a/10)+'.'],
   equivalent: ({b,c})=>{
    return ['Запиши числитель дроби '+frac('?',b)+', равной '+math(c)+'.',b*c,math(c)+' = '+frac(b*c,b)+'. Умножаем '+c+' на '+b+' и делаем знаменатель равным '+b+'.'];
   }
  },
  {
   finite_decimal: ({a,b})=>{
    const d=[4,5,8,20,25][b%5];
    return choice('Какая десятичная запись равна −'+frac(a,d)+'?',fmt(-a/d),
     [fmt(a/d),fmt((1-a)/d),fmt(-10*a/d)],'Делим '+a+' на '+d+' и ставим знак минус: '+fmt(-a/d)+'.');
   },
   simple_period: ({a,c})=>{
    const n=a*9+c%8+1;
    return ['Дробь '+frac(n,9)+' запиши в виде бесконечной десятичной дроби. Какая цифра повторяется?',n%9,
     n+' = '+a+' · 9 + '+n%9+'. При делении остаток '+n%9+' повторяется после каждого шага, поэтому '+frac(n,9)+' = '+fmt(a)+',('+n%9+').'];
   },
   reduce_signed: ({a,b,c})=>{
    const r=rational(-a,b),answer=g7FracHtml(r);
    return choice('Выбери несократимую запись числа −'+frac(a*c,b*c)+'.',answer,
     ['−'+frac(r.n*-2,r.d*2),g7FracHtml(rational(a,b)),g7FracHtml(rational(-a,b+1))],
     'Делим числитель и знаменатель на их НОД '+gcd(a*c,b*c)+'. Получаем '+answer+'.');
   },
   compare_mixed: ({a,b})=>{
    const r=rational(-a,10),s=rational(-a+b%3-1,10),cmp=rationalCmp(r,s);
    const labels=['&lt;','=','&gt;'];
    return choice('Сравни '+g7FracHtml(r)+' и '+g7DecHtml(s)+'.',labels[cmp+1],labels.filter((_,i)=>i!==cmp+1),
     g7DecHtml(r)+' '+labels[cmp+1]+' '+g7DecHtml(s)+'. Обе записи привели к десятичным дробям.');
   }
  },
  {
   mixed_period: ({a,b})=>{
    const r=rational((b%2===0?-1:1)*(12*a+(b%2===0?5:7)),12);
    const {whole,prefix,period}=decimalExpansion(r);
    const correct=whole+','+prefix+'('+period+')';
    return choice('Как записать '+g7FracHtml(r)+' в виде периодической дроби?',correct,
     [whole+',('+prefix+period+')',whole+','+prefix+period,whole+',('+period+')'],
     'При делении получаем '+whole+','+prefix+period+period+'… . Цифра '+period+' повторяется, поэтому записываем '+correct+'.');
   },
   periodic_compare: ({a,b,c})=>{
    const digit=1+b%8,r=rational(a*9+digit,9),s=rational(a*100+11*digit+(c%2),100),cmp=rationalCmp(r,s);
    const label=a+',('+digit+')',labels=['&lt;','=','&gt;'];
    return choice('Сравни '+math(label)+' и '+g7DecHtml(s)+'.',labels[cmp+1],labels.filter((_,i)=>i!==cmp+1),
     label+' = '+a+','+String(digit).repeat(4)+'… . Сравниваем цифры после запятой слева направо, дополняя конечную дробь нулями.');
   },
   between_fractions: ({a,b})=>{
    const denominator=2*b,n=2*a+1,answer=g7FracHtml(rational(n,denominator));
    return choice('Какое число строго между '+frac(a,b)+' и '+frac(a+1,b)+'?',answer,
     [g7FracHtml(rational(a,b)),g7FracHtml(rational(a+1,b)),g7FracHtml(rational(a+2,b))],
     'При знаменателе '+denominator+' у границ числители '+2*a+' и '+(2*a+2)+'. Числитель '+n+' между ними.');
   },
   opposite_difference: ({a,b,c})=>{
    const r=rational(a,b),s=rational(c,b),answer=rational(c-a,b);
    return ['Вычисли '+g7FracHtml(r)+' − '+g7FracHtml(s)+' и запиши противоположное число.',answer,
     'Разность равна '+g7FracHtml(rational(a-c,b))+'. Меняем знак и получаем '+g7FracHtml(answer)+'.'];
   }
  }
 ],
 rational_arithmetic: [
  {
   signed_sum: ({a,b})=>readResult(math('−'+a+' + '+b),b-a,'Складываем числа с разными знаками: '+b+' − '+a+' = '+fmt(b-a)+'.'),
   subtract_negative: ({a,b})=>readResult(math(a+' − (−'+b+')'),a+b,'Заменяем вычитание на сложение: '+a+' + '+b+' = '+(a+b)+'.'),
   signed_product: ({a,b})=>readResult(math('(−'+a+') · '+b),-a*b,a+' · '+b+' = '+a*b+'. У множителей разные знаки, поэтому ответ '+fmt(-a*b)+'.'),
   signed_quotient: ({a,b})=>readResult(math('(−'+a*b+') : (−'+b+')'),a,a*b+' : '+b+' = '+a+'. У делимого и делителя одинаковые знаки, поэтому ответ положительный.')
  },
  {
   different_denominators: ({a,b,c})=>{
    const left=rational(a,b),right=rational(c,b+1),answer=rationalSub(left,right);
    return readResult(frac(a,b)+' − '+frac(c,b+1),answer,
     frac(a,b)+' − '+frac(c,b+1)+' = '+frac(a*(b+1),b*(b+1))+' − '+frac(c*b,b*(b+1))+' = '+g7FracHtml(answer)+'.');
   },
   signed_decimal: ({a,b,c})=>readResult(math('(−'+fmt(a/10)+') − (−'+fmt(b/10)+') + '+fmt(c/10)),rational(-a+b+c,10),
    'Вычитание отрицательного числа заменяем сложением: −'+fmt(a/10)+' + '+fmt(b/10)+' = '+fmt((b-a)/10)+'.',
    fmt((b-a)/10)+' + '+fmt(c/10)+' = '+fmt((b-a+c)/10)+'.'),
   divide_fractions: ({a,b,c})=>{
    const answer=rational(-a,c);
    return readResult('(−'+frac(a,b)+') : '+frac(c,b),answer,
     'Умножаем на дробь, обратную делителю: (−'+frac(a,b)+') · '+frac(b,c)+' = '+g7FracHtml(answer)+'.');
   },
   signed_bracket: ({a,b,c})=>readResult(math('(−'+a+' + '+b+') · (−'+c+')'),(a-b)*c,
    '−'+a+' + '+b+' = '+fmt(b-a)+'.','('+fmt(b-a)+') · (−'+c+') = '+fmt((a-b)*c)+'.')
  },
  {
   fraction_brackets: ({a,b,c,y})=>{
    const first=rational(a-c,b),answer=rational((a-c)*y,b);
    return readResult('('+frac(a,b)+' − '+frac(c,b)+') : '+frac(1,y),answer,
     'Сначала вычитаем дроби: '+g7FracHtml(first)+'.',
     'Деление заменяем умножением: '+g7FracHtml(first)+' · '+y+' = '+g7FracHtml(answer)+'.');
   },
   decimal_fraction_mix: ({a,b,c})=>{
    const term=rational(b,c),product=rational(a*b,10*c),answer=rationalSub(product,rational(b,10));
    return readResult(fmt(a/10)+' · '+g7FracHtml(term)+' − '+fmt(b/10),answer,
     fmt(a/10)+' = '+g7FracHtml(rational(a,10))+'.',
     'Произведение равно '+g7FracHtml(product)+'.',
     g7FracHtml(product)+' − '+g7FracHtml(rational(b,10))+' = '+g7FracHtml(answer)+'.');
   },
   signed_quotient_chain: ({a,b,c,y})=>readResult(math('('+a+' − '+(a+b*c)+') : '+b+' + '+c+' · (−'+y+')'),-c-c*y,
    a+' − '+(a+b*c)+' = '+fmt(-b*c)+'.',fmt(-b*c)+' : '+b+' = '+fmt(-c)+', а '+c+' · (−'+y+') = '+fmt(-c*y)+'.',
    sum(fmt(-c),-c*y)+' = '+fmt(-c-c*y)+'.'),
   reverse_arithmetic: ({a,b,c,y})=>{
    const result=c-b*y;
    return ['Какое число нужно поставить вместо □, чтобы '+math('(□ − '+a+') : '+b+signed(-c)+' = '+fmt(-b*y))+'?',
     a+b*result,'Прибавляем '+c+' к обеим частям: (□ − '+a+') : '+b+' = '+fmt(result)+'.<br>Значит □ − '+a+' = '+fmt(b*result)+', поэтому □ = '+fmt(a+b*result)+'.'];
   }
  }
 ],
 variables_expression_value: [
  {
   single_substitution: ({a,b,c})=>['При '+math('x = '+c)+' найди значение '+math(a+'x − '+b)+'.',a*c-b,
    'Подставляем '+c+' вместо x: '+a+' · '+c+' − '+b+' = '+a*c+' − '+b+' = '+fmt(a*c-b)+'.'],
   signed_substitution: ({a,b,c})=>['При '+math('x = −'+c)+' найди значение '+math(a+' + '+b+'x')+'.',a-b*c,
    a+' + '+b+' · (−'+c+') = '+a+' − '+b*c+' = '+fmt(a-b*c)+'.'],
   read_expression: ({a,b})=>choice('Как прочитать '+math(a+'x − '+b)+'?',
    'Разность произведения '+a+' и x и числа '+b,['Произведение '+a+' и разности x и '+b,'Сумма произведения '+a+' и x и числа '+b,'Разность числа '+b+' и произведения '+a+' и x'],
    'Сначала '+a+' умножают на x. Затем из произведения вычитают '+b+'.'),
   write_expression: ({a,b})=>choice('Как записать произведение числа '+a+' и суммы x и '+b+'?',
    math(a+'(x + '+b+')'),[math(a+'x + '+b),math(a+'(x − '+b+')'),math('x + '+a*b)],
    'Сумма равна x + '+b+'. Умножаем всю сумму на '+a+', поэтому нужны скобки.')
  },
  {
   quadratic_substitution: ({a,b,c})=>['Вычисли '+math('x² − '+a+'x + '+b)+' при '+math('x = −'+c)+'.',c*c+a*c+b,
    '(−'+c+')² = '+c*c+', а −'+a+' · (−'+c+') = '+a*c+'. Складываем: '+c*c+' + '+a*c+' + '+b+' = '+(c*c+a*c+b)+'.'],
   two_variables: ({a,b,c,y})=>['При '+math('x = −'+c+', y = '+y)+' найди значение '+math(a+'x + '+b+'y')+'.',-a*c+b*y,
    a+' · (−'+c+') + '+b+' · '+y+' = '+sum(fmt(-a*c),b*y)+' = '+fmt(-a*c+b*y)+'.'],
   fractional_substitution: ({a,b,c})=>{
    const x=rational(-a,b),answer=rational(a+c*b,b);
    return ['При x = '+g7FracHtml(x)+' вычисли '+math(c+' − x')+'.',answer,
     c+' − ('+g7FracHtml(x)+') = '+frac(c*b,b)+' + '+frac(a,b)+' = '+g7FracHtml(answer)+'.'];
   },
   build_context: ({a,b})=>choice('В одной группе '+a+' наборов по x деталей, в другой '+b+' наборов по y деталей. Как записать общее количество деталей?',
    math(a+'x + '+b+'y'),[math((a+b)+'(x + y)'),math(b+'x + '+(a+1)+'y'),math(a+'x − '+b+'y')],
    'В первой группе '+a+'x деталей, во второй '+b+'y деталей. Складываем два количества.')
  },
  {
   substitute_two_fractions: ({a,b,c,y})=>{
    const x=rational(-a,b),z=rational(c,y),first=rational(a*a,b*b),second=rational(a*c,b*y),answer=rationalAdd(first,second);
    return ['Вычисли '+math('x(x − y)')+' при x = '+g7FracHtml(x)+', y = '+g7FracHtml(z)+'.',answer,
     'Произведение x² − xy даёт '+g7FracHtml(first)+' + '+g7FracHtml(second)+' = '+g7FracHtml(answer)+'.'];
   },
   translate_and_evaluate: ({a,b,c,y})=>{
    const answer=a*c+b*y;
    return ['В школьном шкафу '+a+' коробок по x карандашей и '+b+' коробок по y карандашей. Составь выражение и вычисли общее количество при x = '+c+', y = '+y+'.',
     answer,'Выражение имеет вид '+math(a+'x + '+b+'y')+'. После подстановки: '+a+' · '+c+' + '+b+' · '+y+' = '+a*c+' + '+b*y+' = '+answer+'.'];
   },
   expression_quotient: ({a,b,c,y})=>{
    const x=-c,z=y,top=x*x-a*z,bottom=z-x,answer=rational(top,bottom);
    return ['Найди значение '+frac('x² − '+a+'y','y − x')+' при x = '+fmt(x)+', y = '+z+'.',answer,
     'Числитель: ('+fmt(x)+')² − '+a+' · '+z+' = '+fmt(top)+'.<br>Знаменатель: '+z+' − ('+fmt(x)+') = '+bottom+'.<br>Частное равно '+g7FracHtml(answer)+'.'];
   },
   two_brackets_value: ({a,b,c,y})=>{
    const answer=a*(b-c)-b*(y+c);
    return ['При '+math('x = −'+c)+' вычисли '+math(a+'(x + '+b+') − '+b+'('+y+' − x)')+'.',answer,
     'Первая скобка: −'+c+' + '+b+' = '+fmt(b-c)+'.<br>Вторая: '+y+' − (−'+c+') = '+(y+c)+'.<br>Получаем '+fmt(a*(b-c))+' − '+b*(y+c)+' = '+fmt(answer)+'.'];
   }
  }
 ],
 admissible_values: [
  {
   direct_denominator: ({a})=>['При каком x выражение '+frac(a,'x')+' не имеет смысла?',0,'Знаменатель равен x. Деление на ноль невозможно.'],
   shifted_denominator: ({a,b})=>['При каком x выражение '+frac(a,'x − '+b)+' не имеет смысла?',b,'Знаменатель равен нулю при x − '+b+' = 0, то есть при x = '+b+'.'],
   constant_denominator: ({a,b})=>choice('При каких x имеет смысл '+frac('x − '+a,b)+'?','При любых x',
    ['Только при положительных x','При всех x, кроме '+a,'При всех x, кроме 0'],
    'В знаменателе ненулевое число '+b+'. Если числитель равен нулю, значение всей дроби равно нулю.'),
   allowed_from_list: ({a,b})=>choice('Из предложенных чисел выбери допустимое x для '+frac(a,'x + '+b)+'.',fmt(b),
    [fmt(-b)],'При x = '+fmt(-b)+' знаменатель обнуляется. При x = '+b+' он равен '+2*b+'.')
  },
  {
   linear_denominator: ({a,b,c})=>['При каком x выражение '+frac(c,a+'x + '+a*b)+' не имеет смысла?',-b,
    a+'x + '+a*b+' = 0, значит '+a+'x = '+fmt(-a*b)+' и x = '+fmt(-b)+'.'],
   signs_in_denominator: ({a,b,c})=>['При каком x выражение '+frac(c,a*b+' − '+a+'x')+' не имеет смысла?',b,
    a*b+' − '+a+'x = 0, значит '+a+'x = '+a*b+' и x = '+b+'.'],
   fractional_exclusion: ({a,b,c})=>{
    const answer=rational(a,b);
    return ['При каком x выражение '+frac(c,b+'x − '+a)+' не имеет смысла?',answer,
     b+'x − '+a+' = 0, значит '+b+'x = '+a+' и x = '+g7FracHtml(answer)+'.'];
   },
   guaranteed_nonzero: ({a,b})=>choice('У какой дроби знаменатель отличен от нуля при любом x?',frac(a,'x² + '+b),
    [frac(a,'x − '+b),frac(a,'x²'),frac(a,'x + '+b)],
    'Квадрат x² ≥ 0. Прибавляем '+b+' и получаем положительный знаменатель для любого x.')
  },
  {
   product_denominator: ({a,b,c})=>choice('Какие значения x нужно исключить в '+frac(c,'(x − '+a+')(x + '+b+')')+'?',
    fmt(-b)+' и '+a,[b+' и '+a,fmt(-b-1)+' и '+a,fmt(-b)+' и '+(a+1)],
    'Произведение равно нулю, если хотя бы один множитель равен нулю. Получаем x = '+a+' или x = '+fmt(-b)+'.'),
   two_denominators: ({a,b,c,y})=>choice('При каких x имеет смысл '+frac(a,'x − '+c)+' + '+frac(b,'x + '+y)+'?',
    'При всех x, кроме '+fmt(-y)+' и '+c,['При всех x, кроме '+c,'При всех x, кроме '+fmt(-y),'При любых x'],
    'Первая дробь требует x ≠ '+c+', вторая — x ≠ '+fmt(-y)+'. Оба ограничения действуют одновременно.'),
   cancellation_exclusion: ({a,b,c})=>['При каком x исходное выражение '+frac('(x − '+a+')(x + '+b+')','x − '+a)+' не имеет смысла?',a,
    'Сократить множитель x − '+a+' можно только при x ≠ '+a+'. При x = '+a+' исходный знаменатель равен нулю.'],
   evaluate_or_exclude: ({a,b,c})=>choice('При каком x имеет смысл '+frac(c,'(x − '+a+')(x + '+b+')')+'?',
    fmt(a+1),[fmt(-b),fmt(a)],'При x = '+fmt(-b)+' или x = '+a+' один из множителей знаменателя равен нулю. При x = '+(a+1)+' оба отличны от нуля.')
  }
 ],
 numerical_expressions: [
  {
   product_first: ({a,b,c})=>readResult(math(a+' + '+b+' · '+c),a+b*c,
    b+' · '+c+' = '+b*c+'.',a+' + '+b*c+' = '+(a+b*c)+'.'),
   brackets_first: ({a,b,c})=>readResult(math('('+a+' + '+b+') · '+c),(a+b)*c,
    a+' + '+b+' = '+(a+b)+'.',(a+b)+' · '+c+' = '+((a+b)*c)+'.'),
   quotient_difference: ({a,b,c})=>readResult(math(b*c+' : '+b+' − '+a),c-a,
    b*c+' : '+b+' = '+c+'.',c+' − '+a+' = '+fmt(c-a)+'.'),
   outer_operation: ({a,b,c})=>[
    'Как называется всё выражение '+math('('+a+' + '+b+') : '+c)+'?',
    'Частное',['Сумма','Разность','Произведение'],
    'Сначала вычисляем сумму в скобках, потом делим её на '+c+'. Последнее действие — деление.'
   ]
  },
  {
   three_operations: ({a,b,c,y})=>readResult(math(a+' + '+b+' · ('+c+' − '+y+')'),a+b*(c-y),
    c+' − '+y+' = '+fmt(c-y)+'.',b+' · ('+fmt(c-y)+') = '+fmt(b*(c-y))+'.',sum(a,b*(c-y))+' = '+fmt(a+b*(c-y))+'.'),
   decimals: ({a,b,c})=>readResult(math(fmt(a/10)+' − '+fmt(b/10)+' · '+c),rational(a-b*c,10),
    fmt(b/10)+' · '+c+' = '+fmt(b*c/10)+'.',fmt(a/10)+' − '+fmt(b*c/10)+' = '+fmt((a-b*c)/10)+'.'),
   fraction_product: ({a,b,c})=>readResult(c+' · ('+frac(a,c)+' − '+frac(a+b,c)+')',-b,
    frac(a,c)+' − '+frac(a+b,c)+' = −'+frac(b,c)+'.',c+' · (−'+frac(b,c)+') = '+fmt(-b)+'.'),
   zero_divisor: ({a,b,c})=>{
    const invalid=math(a+' : ('+b*c+' − '+b+' · '+c+')');
    return ['Какое выражение не имеет смысла?',invalid,[
     math(a+' : ('+(b*c+1)+' − '+b+' · '+c+')'),math('('+b*c+' − '+b+' · '+c+') : '+a),
     math(a+' · ('+b*c+' − '+b+' · '+c+')')
    ],'В скобках '+b*c+' − '+b*c+' = 0. В первом действии вне скобок пришлось бы делить '+a+' на ноль.'];
   }
  },
  {
   nested_divisor: ({a,b,c,y})=>readResult(math(b*c*(a+1)+' : ('+b+' · ('+(c+y)+' − '+y+')) − '+a),1,
    (c+y)+' − '+y+' = '+c+'.',b+' · '+c+' = '+b*c+'.',b*c*(a+1)+' : '+b*c+' = '+(a+1)+'.',(a+1)+' − '+a+' = 1.'),
   two_fractions: ({a,b,c})=>{
    const answer=rational(a+b-c,2);
    return readResult('('+frac(a,2*b)+' + '+frac(1,2)+') · '+b+' − '+frac(c,2),answer,
     frac(a,2*b)+' + '+frac(b,2*b)+' = '+frac(a+b,2*b)+'.',
     frac(a+b,2*b)+' · '+b+' = '+g7FracHtml(rational(a+b,2))+'.',
     g7FracHtml(rational(a+b,2))+' − '+frac(c,2)+' = '+g7FracHtml(answer)+'.');
   },
   solve_by_expression: ({a,b,c,y})=>{
    const distance=(a+b)*c+y;
    return ['Два велосипедиста выехали навстречу друг другу со скоростями '+a+' и '+b+' км/ч. Через '+c+' ч между ними ещё было '+y+' км. Какое выражение даёт начальное расстояние?',
     math('('+a+' + '+b+') · '+c+' + '+y),[
      math('('+a+' + '+b+') · ('+c+' + '+y+')'),math('('+a+' + '+b+') · '+c+' − '+y),math(a+' + '+b+' · '+c+' + '+y)
     ],'За час расстояние уменьшается на '+(a+b)+' км. За '+c+' ч оно уменьшилось на '+((a+b)*c)+' км. Прибавляем оставшиеся '+y+' км и получаем '+distance+' км.'];
   },
   insert_brackets: ({a,b,c})=>{
    const left=math('('+a+' + '+b+') · '+c+' − '+a);
    return ['Выбери расстановку скобок, при которой значение выражения равно '+((a+b)*c-a)+'.',left,[
     math(a+' + '+b+' · ('+c+' − '+a+')'),math(a+' + ('+b+' · '+c+' − '+a+')'),math('('+a+' + '+b+') · ('+c+' − '+a+')')
    ],'Сначала '+a+' + '+b+' = '+(a+b)+', затем '+(a+b)+' · '+c+' = '+((a+b)*c)+'. После вычитания '+a+' получается '+((a+b)*c-a)+'.'];
   }
  }
 ],
 compare_expression_values: [
  {
   sums: ({a,b,c,y})=>compare('Сравни '+math(a+' + '+b)+' и '+math(c+' + '+y)+'.',
    rational(a+b),rational(c+y),'Вычислим обе суммы.'),
   product_and_quotient: ({a,b,c})=>compare('Сравни '+math(a+' · '+b)+' и '+math(a*b*c+' : '+c)+'.',
    rational(a*b),rational(a*b),'В правой части сокращаем множитель '+c+' и получаем то же произведение.'),
   common_minuend: ({a,b,c})=>compare('Сравни без полного вычисления '+math(a+' − '+b)+' и '+math(a+' − '+(b+c))+'.',
    rational(a-b),rational(a-b-c),'Уменьшаемое одинаковое. Чем больше вычитаемое, тем меньше разность.'),
   compare_signed_products: ({a,b,c})=>compare('Сравни '+math(a+' · (−'+b+')')+' и '+math(c+' · '+b)+'.',
    rational(-a*b),rational(c*b),'Слева произведение отрицательное, справа — положительное.')
  },
  {
   compare_decimal_operations: ({a,b,c,y})=>compare('Сравни '+math(fmt(a/10)+' · '+b)+' и '+math(fmt(c*y/10)+' : '+y)+'.',
    rational(a*b,10),rational(c,10),'Вычисляем произведение и частное.'),
   compare_with_substitution: ({a,b,c,y})=>compare('При x = −'+c+' сравни '+math(a+'x + '+b)+' и '+math(y+' − x')+'.',
    rational(-a*c+b),rational(y+c),'Вместо x в обеих частях подставляем (−'+c+').'),
   multiply_or_divide: ({a,b,c})=>compare('Сравни без полного вычисления '+a+' · '+frac(b,b+c)+' и '+a+' : '+frac(b,b+c)+'.',
    rational(a*b,b+c),rational(a*(b+c),b),'Дробь между 0 и 1. Умножение на неё уменьшает положительное число, деление увеличивает.'),
   double_inequality: ({a,b,c})=>{
    const value=a+c%(b+2),upper=a+b,truth=value<upper;
    return checkStatement('Верно ли '+math(a+' ≤ '+value+' &lt; '+upper)+'?',truth,
     'Левая граница допускает равенство, правая требует строго меньше. '+value+(truth?' меньше ':' больше или равно ')+upper+'.');
   }
  },
  {
   fraction_expressions: ({a,b,c,y})=>compare('Сравни '+frac(a,b)+' − '+frac(c,b+1)+' и '+frac(y,b)+' + '+frac(1,b+1)+'.',
    rational(a*(b+1)-c*b,b*(b+1)),rational(y*(b+1)+b,b*(b+1)),
    'Приводим четыре дроби к знаменателю '+b*(b+1)+', затем считаем обе части.'),
   compare_average_speeds: ({a,b,c,y})=>compare('Первый велосипедист проехал '+a*b+' км за '+c+' ч, второй — '+a*y+' км за '+b+' ч. Сравни скорость первого со скоростью второго.',
    rational(a*b,c),rational(a*y,b),'Делим пройденные расстояния на время. Значения указаны в км/ч.'),
   check_substituted_bounds: ({a,b,c,y})=>{
    const value=a*c-b,upper=a*y,truth=value>=a&&value<upper;
    return checkStatement('При x = '+c+' верно ли '+math(a+' ≤ '+a+'x − '+b+' &lt; '+upper)+'?',truth,
     'Подставляем x: '+a+' · '+c+' − '+b+' = '+fmt(value)+'. Проверяем отдельно '+a+' ≤ '+fmt(value)+' и '+fmt(value)+' &lt; '+upper+'.');
   },
   compare_without_products: ({a,b,c})=>compare('Сравни без раскрытия скобок '+math('(−'+a+') · ('+b+' + '+c+')')+' и '+math('(−'+a+') · '+b)+'.',
    rational(-a*(b+c)),rational(-a*b),'Сумма '+b+' + '+c+' больше '+b+'. При умножении обеих частей на отрицательное число знак неравенства меняется.')
  }
 ],
 rational_compare_order: [
  {
   signed_integers: ({a,b})=>compare('Сравни '+fmt(-a)+' и '+b+'.',rational(-a),rational(b),'Положительные числа расположены правее отрицательных.'),
   negative_decimals: ({a,b})=>compare('Сравни '+fmt(-a/10)+' и '+fmt(-b/10)+'.',rational(-a,10),rational(-b,10),'Среди отрицательных чисел больше то, у которого модуль меньше.'),
   same_denominator: ({a,b,c})=>compare('Сравни '+frac(a,c)+' и '+frac(b,c)+'.',rational(a,c),rational(b,c),'При одинаковом положительном знаменателе сравниваем числители.'),
   between_integers: ({a,b})=>{
    const above=b%2===0,offset=above?b/20:-b/20;
    return checkStatement('Верно ли '+math(fmt(-a-1)+' &lt; '+fmt(-a+offset)+' &lt; '+fmt(-a))+'?',!above,
     above?'Среднее число больше правой границы, так как к ней прибавили '+fmt(offset)+'.':
     'От '+fmt(-a)+' отняли '+fmt(-offset)+', то есть меньше единицы. Число строго между границами.');
   }
  },
  {
   different_denominators: ({a,b,c})=>compare('Сравни '+frac(a,b)+' и '+frac(c,b+1)+'.',rational(a,b),rational(c,b+1),
    'К знаменателю '+b*(b+1)+' приводятся числители '+a*(b+1)+' и '+c*b+'.'),
   mixed_notation: ({a,b,c})=>compare('Сравни '+fmt(a/10)+' и '+frac(b,c)+'.',rational(a,10),rational(b,c),
    'После приведения к знаменателю '+10*c+' получаем числители '+a*c+' и '+10*b+'.'),
   negative_fractions: ({a,b,c})=>compare('Сравни −'+frac(a,c)+' и −'+frac(b,c+1)+'.',rational(-a,c),rational(-b,c+1),
    'К знаменателю '+c*(c+1)+' приводятся числители '+fmt(-a*(c+1))+' и '+fmt(-b*c)+'.'),
   sort_three: ({a,b,c})=>{
    const low=fmt(-a/10),mid='0',high=fmt((b+c)/10),correct=low+' &lt; '+mid+' &lt; '+high;
    return choice('Расположи по возрастанию '+high+', '+low+', '+mid+'.',correct,
     [mid+' &lt; '+low+' &lt; '+high,high+' &lt; '+mid+' &lt; '+low,low+' &lt; '+high+' &lt; '+mid],
     'Отрицательное число слева от нуля, положительное справа.');
   }
  },
  {
   signed_decimal_fraction: ({a,b,c})=>compare('Сравни '+fmt(-a/10)+' и −'+frac(b,c)+'.',rational(-a,10),rational(-b,c),
    'Общий знаменатель '+10*c+'. Сравниваем отрицательные числители '+fmt(-a*c)+' и '+fmt(-10*b)+'.'),
   compare_absolute_values: ({a,b,c})=>compare('Сравни модули '+math('|'+fmt(-a/10)+'|')+' и |−'+frac(b,c)+'|.',
    rational(a,10),rational(b,c),'Убираем минус у каждого числа и сравниваем их расстояния до нуля.'),
   strict_between_rationals: ({a,b,c})=>{
    const left=rational(-a,b),value=rational(-c,b+1),truth=rationalCmp(left,value)<0;
    return checkStatement('Лежит ли −'+frac(c,b+1)+' строго между −'+frac(a,b)+' и 0?',truth,
     'Число отрицательное. Для нижней границы сравниваем числители '+fmt(-a*(b+1))+' и '+fmt(-c*b)+' при знаменателе '+b*(b+1)+'.');
   },
   order_negative_mixed: ({a,b})=>{
    const first=fmt(-a-.5),second='−'+frac(a*b+1,b),third=fmt(-a-1);
    const order=[third,first,second],equal=b===2;
    const join=(items,signs)=>items[0]+signs[0]+items[1]+signs[1]+items[2];
    const correct=join(order,[' &lt; ',equal?' = ':' &lt; ']);
    return choice('Выбери верное сравнение чисел '+first+', '+second+', '+third+'.',correct,
     [join(order,[' &lt; ',equal?' &lt; ':' = ']),join(order,[' &gt; ',' &lt; ']),join(order,[' &lt; ',' &gt; '])],
     third+' меньше обоих чисел. В записи '+second+' модуль равен '+a+' + '+frac(1,b)+'. Сравниваем '+frac(1,b)+' с '+frac(1,2)+'.');
   }
  }
 ],
 expression_properties: [
  {
   identify_swap: ({a,b})=>choice('Какое свойство объясняет равенство '+math(a+' + '+(a+b)+' = '+(a+b)+' + '+a)+'?',
    'Переместительное',['Сочетательное','Распределительное'],'Слагаемые поменялись местами. Сумма сохранилась.'),
   identify_grouping: ({a,b,c})=>choice('Какое свойство объясняет '+math('('+a+' · '+b+') · '+c+' = '+a+' · ('+b+' · '+c+')')+'?',
    'Сочетательное',['Переместительное','Распределительное'],'Порядок множителей прежний, изменилась только группировка.'),
   expand_numerical_product: ({a,b,c})=>choice('Раскрой скобки в '+math(a+' · ('+b+' + '+c+')')+'.',
    math(a+' · '+b+' + '+a+' · '+c),[math(a+' · '+b+' + '+c),math(a+' + '+b+' + '+c),math(a+' · '+b+' − '+a+' · '+c)],
    'На '+a+' умножаем каждое слагаемое: '+b+' и '+c+'.'),
   complete_a_hundred: ({a,b,c})=>readResult(math((30+a)+' + '+(b+c)+' + '+(70-a)),100+b+c,
    'Переставляем слагаемые и складываем '+(30+a)+' + '+(70-a)+' = 100.','100 + '+(b+c)+' = '+(100+b+c)+'.')
  },
  {
   convenient_product: ({a,b})=>readResult(math('25 · '+(a*b)+' · 4'),100*a*b,
    'По переместительному и сочетательному свойствам группируем 25 и 4.','25 · 4 = 100. Значит, результат '+100*a*b+'.'),
   common_multiplier: ({a,b,c})=>readResult(math(a+' · '+b+' + '+a+' · '+c),a*(b+c),
    'Выносим общий множитель '+a+': '+a+' · ('+b+' + '+c+').',a+' · '+(b+c)+' = '+a*(b+c)+'.'),
   group_signed_decimals: ({a,b,c})=>readResult(math(fmt(a/10)+' − '+fmt((b+c)/10)+' + '+fmt((20-a)/10)),rational(20-b-c,10),
    'Вычитание считаем сложением отрицательного числа. Группируем '+fmt(a/10)+' + '+fmt((20-a)/10)+' = 2.',
    '2 − '+fmt((b+c)/10)+' = '+fmt((20-b-c)/10)+'.'),
   expand_difference: ({a,b,c})=>{
    const bigger=b+c;
    return choice('Раскрой скобки в '+math(a+' · ('+bigger+' − '+c+')')+'.',
     math(a+' · '+bigger+' − '+a+' · '+c),[math(a+' · '+bigger+' − '+c),math(a+' · '+bigger+' + '+a+' · '+c),math(a+' − '+bigger+' · '+c)],
     'Умножаем оба члена разности на '+a+' и сохраняем знак вычитания.');
   }
  },
  {
   factor_decimal_difference: ({a,b,c})=>readResult(math(fmt(a/10)+' · '+fmt((b+c+20)/10)+' − '+fmt(a/10)+' · '+fmt((b+c)/10)),rational(a,5),
    'Выносим '+fmt(a/10)+' за скобки. Разность оставшихся множителей равна 2.',fmt(a/10)+' · 2 = '+fmt(a/5)+'.'),
   distribute_to_three: ({a,b,c,y})=>readResult(math('(−'+a+') · ('+b+' − '+c+' + '+y+')'),-a*b+a*c-a*y,
    'Распределяем отрицательный множитель на все три слагаемых: '+sum(sum(fmt(-a*b),a*c),-a*y)+'.',
    'Итог: '+fmt(-a*b+a*c-a*y)+'.'),
   divisibility_via_factoring: ({a,b,c})=>{
    const left=a+b,right=left+c;
    return ['Какое частное получится при делении '+math(left+' · '+b+' + '+right+' · '+b)+' на '+b+'?',
     left+right,'Выносим общий множитель '+b+': '+b+' · ('+left+' + '+right+'). После деления остаётся '+(left+right)+'.'];
   },
   grouped_fraction_sum: ({a,b,c,y})=>{
    const answer=rational(c+y,b+1);
    return readResult(frac(a,b)+' + '+frac(c,b+1)+' − '+frac(a,b)+' + '+frac(y,b+1),answer,
     frac(a,b)+' и −'+frac(a,b)+' дают в сумме 0.',frac(c,b+1)+' + '+frac(y,b+1)+' = '+g7FracHtml(answer)+'.');
   }
  }
 ],
 identities: [
  {
   distributive_identity: ({a,b,c})=>{
    const truth=c%2===0;
    return checkStatement('Является ли равенство '+math(a+'(x + '+b+') = '+a+'x + '+(a*b+Number(!truth)))+' тождеством?',truth,
     'После раскрытия скобок левая часть равна '+math(a+'x + '+a*b)+'. '+(truth?'Обе части совпадают при любом x.':'Свободные члены различны.'));
   },
   commutative_identity: ({a,b})=>choice('Какое выражение тождественно равно '+math(a+'x + '+b)+'?',
    math(b+' + '+a+'x'),[math(b+' − '+a+'x'),math(a+'x − '+b),math(b+' + '+(a+1)+'x')],
    'При перестановке слагаемых сумма сохраняется.'),
   inverse_terms: ({a,b})=>choice('Что получится после упрощения '+math(a+'x + '+b+' − '+a+'x')+'?',
    math(b),[math(-b),math(2*a+'x + '+b),math(a+'x + '+b)],'Противоположные слагаемые '+a+'x и −'+a+'x дают 0.'),
   check_at_zero: ({a,b})=>checkStatement('Верно ли '+math(a+'x + '+b+' = '+(a+b)+'x')+' при x = 0?',false,
    'Слева остаётся '+b+', справа 0. Одного значения x = 0 достаточно, чтобы опровергнуть тождество.')
  },
  {
   counterexample: ({a,b,c})=>choice('Какое x опровергает равенство '+math(a+'x + '+a*b+' = '+a*(b+1)+'x')+'?',
    String(c),['1'],'Разность левой и правой частей равна '+a*b+'(1 − x). Она обращается в ноль только при x = 1.'),
   missing_constant: ({a,b,c})=>['Какое число нужно записать вместо □, чтобы равенство '+math(a+'(x − '+b+') + '+c+' = '+a+'x + (□)')+' стало тождеством?',
    c-a*b,'Раскрываем скобки: '+a+'x − '+a*b+' + '+c+'. Свободный член равен '+fmt(c-a*b)+'.'],
   factor_identity: ({a,b,c})=>choice('Какое выражение тождественно равно '+math(a*b+'x − '+a*c)+'?',
    math(a+'('+b+'x − '+c+')'),[math(a+'('+b+'x + '+c+')'),math(a+'('+b+'x − '+(c+1)+')'),math(a+'('+(b+1)+'x − '+c+')')],
    'Делим оба слагаемых на общий множитель '+a+' и записываем их в скобках.'),
   decimal_identity: ({a,b,c})=>{
    const truth=c%2===0,coefficient=rational(a-b,10);
    const right=g7LinHtml(truth?coefficient:rational(a+b,10),c);
    return checkStatement('Является ли '+math(fmt(a/10)+'x − '+fmt(b/10)+'x + '+c)+' = '+right+' тождеством?',truth,
     'Слева после приведения подобных получается '+g7LinHtml(coefficient,c)+'.');
   }
  },
  {
   identity_missing_coefficient: ({a,b,c,y})=>['Найди коэффициент □, чтобы '+math(a+'(x + '+b+') − '+c+'(x − '+y+') = (□)x + '+(a*b+c*y))+' было тождеством.',
    a-c,'Раскрываем обе скобки: '+a+'x + '+a*b+' − '+c+'x + '+c*y+'. Коэффициент при x равен '+fmt(a-c)+'.'],
   remove_variable: ({a,b,c})=>['Какое значение при любом x принимает '+math(a+'(x − '+b+') − ('+a+'x − '+c+')')+'?',
    c-a*b,'После раскрытия скобок '+a+'x − '+a*b+' − '+a+'x + '+c+'. Слагаемые с x сокращаются. Остаётся '+fmt(c-a*b)+'.'],
   proves_for_two_variables: ({a,b,c})=>choice('Какое выражение тождественно равно '+math(a+'(x − '+b+'y) − '+c+'(x − '+b+'y)')+'?',
    math('('+fmt(a-c)+')(x − '+b+'y)'),[math('('+(a+c)+')(x − '+b+'y)'),math('('+fmt(a-c+1)+')(x + '+b+'y)'),math('('+fmt(a-c-1)+')(x − '+b+'y)')],
    'Выносим двучлен x − '+b+'y за скобки. В другом множителе остаётся '+a+' − '+c+' = '+fmt(a-c)+'.'),
   equality_vs_identity: ({a,b,c})=>{
    const value=a*b+c;
    return choice('При x = '+b+' значение '+math(a+'x + '+c)+' равно '+value+'. Что верно?',
     'Равенство выполняется только при указанном x',['Это тождество','Равенство выполняется при каждом положительном x','Равенство выполняется при x = 0'],
     'При подстановке равенство верно. Если x изменится, значение левой части изменится, так как коэффициент '+a+' отличен от нуля.');
   }
  }
 ],
 brackets_like_terms: [
  {
   combine_x: ({a,b,c})=>simplify(a+'x + '+b+'x − '+c+'x',a+b-c,0,
    'Складываем коэффициенты: '+a+' + '+b+' − '+c+' = '+fmt(a+b-c)+'. Ответ '+g7LinHtml(a+b-c,0)+'.'),
   drop_plus_brackets: ({a,b,c})=>simplify(a+' + ('+b+'x − '+c+')',b,a-c,
    'Перед скобками плюс, поэтому знаки сохраняются: '+a+' + '+b+'x − '+c+'. Ответ '+g7LinHtml(b,a-c)+'.'),
   drop_minus_brackets: ({a,b,c})=>simplify(a+' − ('+b+'x − '+c+')',-b,a+c,
    'Меняем оба знака в скобках: '+a+' − '+b+'x + '+c+'. Ответ '+g7LinHtml(-b,a+c)+'.'),
   combine_two_letters: ({a,b,c})=>choice('Приведи подобные в '+math(a+'x + '+b+'y + '+c+'x')+'.',
    math((a+c)+'x + '+b+'y'),[math((a+b+c)+'x'),math(a+'x + '+(b+c)+'y'),math((a+c)+'x − '+b+'y')],
    'Складываем коэффициенты при x. Единственное слагаемое с y сохраняется.')
  },
  {
   multiply_then_combine: ({a,b,c,y})=>simplify(a+'('+b+'x − '+c+') + '+y+'x',a*b+y,-a*c,
    'Раскрываем скобки: '+a*b+'x − '+a*c+' + '+y+'x. Получаем '+g7LinHtml(a*b+y,-a*c)+'.'),
   sum_two_brackets: ({a,b,c,y})=>simplify('('+a+'x − '+b+') + ('+c+' − '+y+'x)',a-y,c-b,
    'Перед скобками знаки плюс. Группируем коэффициенты '+a+' − '+y+' и свободные числа '+c+' − '+b+'. Ответ '+g7LinHtml(a-y,c-b)+'.'),
   negative_multiplier: ({a,b,c,y})=>simplify('−'+a+'('+b+'x + '+c+') + '+y,-a*b,y-a*c,
    'Умножаем два слагаемых на (−'+a+'): −'+a*b+'x − '+a*c+' + '+y+'. Получаем '+g7LinHtml(-a*b,y-a*c)+'.'),
   decimal_coefficients: ({a,b,c,y})=>{
    const coefficient=rational(a-c,10),constant=rational(b+y,10);
    return simplify(fmt(a/10)+'x + '+fmt(b/10)+' − ('+fmt(c/10)+'x − '+fmt(y/10)+')',coefficient,constant,
     'Меняем знаки в скобках. Коэффициент при x равен '+fmt((a-c)/10)+', свободный член '+fmt((b+y)/10)+'.');
   }
  },
  {
   two_products: ({a,b,c,y})=>simplify(a+'('+b+'x − '+c+') − '+b+'('+c+'x + '+y+')',a*b-b*c,-a*c-b*y,
    'После раскрытия получаем '+a*b+'x − '+a*c+' − '+b*c+'x − '+b*y+'. Приводим подобные: '+g7LinHtml(a*b-b*c,-a*c-b*y)+'.'),
   simplify_and_substitute: ({a,b,c,y})=>{
    const coefficient=a+c,constant=-b-y,answer=coefficient*(-c)+constant;
    return ['Упрости '+math('('+a+'x − '+b+') − ('+y+' − '+c+'x)')+' и вычисли при x = '+fmt(-c)+'.',
     answer,'Раскрываем скобки и приводим подобные: '+g7LinHtml(coefficient,constant)+'. При x = '+fmt(-c)+' получаем '+fmt(answer)+'.'];
   },
   simplify_context: ({a,b,c})=>{
    const coefficient=c+2,constant=(c+1)*a+b;
    const left=g7LinHtml(coefficient,constant);
    return choice('В первой коробке x тетрадей, во второй на '+a+' больше. В третьей в '+c+' раз больше, чем во второй, и ещё '+b+' тетрадей. Выбери упрощённое выражение для общего количества.',
     left,[g7LinHtml(coefficient,c*a+b),g7LinHtml(c+1,constant),g7LinHtml(coefficient,constant-b)],
     'Складываем x + (x + '+a+') + '+c+'(x + '+a+') + '+b+'. После раскрытия скобок получаем '+left+'.');
   },
   nested_brackets: ({a,b,c,y})=>simplify(a+'x − ('+b+' − ('+c+'x − '+y+'))',a+c,-b-y,
    'Внешний минус меняет знаки: '+a+'x − '+b+' + ('+c+'x − '+y+'). Собираем подобные: '+g7LinHtml(a+c,-b-y)+'.')
  }
 ],
 equation_root_equivalence: [
  {
   direct_check: ({a,b,c})=>{
    const value=a+b,truth=c%2===0,right=value+Number(!truth);
    return checkStatement('Является ли '+a+' корнем '+math('x + '+b+' = '+right)+'?',truth,
     'Подставляем x = '+a+': слева '+value+', справа '+right+'.');
   },
   choose_root: ({a,b})=>choice('Какое число является корнем '+math(b+'x = '+b*a)+'?',
    String(a),[fmt(-a),String(a+1),String(b*a)],b+' · '+a+' = '+b*a+'.'),
   definition: ({a,b})=>choice('Что нужно проверить, чтобы признать '+a+' корнем уравнения '+math('x + '+b+' = '+(a+b))+'?',
    'Равенство обеих частей при подстановке '+a,['Равенство обеих частей при x = 0','Наличие x в обеих частях','Равенство коэффициентов при x'],
    'Вместо x подставляем '+a+'. Обе части принимают значение '+(a+b)+'.'),
   no_root_shift: ({a,b})=>choice('Сколько корней у '+math('x + '+a+' = x + '+(a+b))+'?',
    'Нет корней',['Один корень','Два корня','Бесконечно много корней'],'Правая часть всегда на '+b+' больше левой.')
  },
  {
   both_sides_addition: ({a,b,c})=>choice('Выбери результат вычитания '+b+' из обеих частей '+math(a+'x + '+b+' = '+(a*c+b))+'.',
    math(a+'x = '+a*c),[math(a+'x = '+(a*c+b)),math(a+'x = '+(a*c+2*b)),math('x = '+a*c)],
    'После вычитания '+b+' слева остаётся '+a+'x, справа '+(a*c+b)+' − '+b+' = '+a*c+'.'),
   equivalent_equation: ({a,b,c})=>choice('Какое уравнение равносильно '+math(a+'x − '+b+' = '+fmt(a*c-b))+'?',
    math('x = '+c),[math('x = '+(c+1)),math('x = 0'),math('x = '+fmt(-c))],
    'Прибавляем '+b+' к обеим частям и делим на '+a+'. Получаем единственный корень x = '+c+'.'),
   product_root_check: ({a,b,c})=>{
    const first=a,second=a+b,x=c%2===0?first:a+1,truth=x===first;
    return checkStatement('Корень ли x = '+x+' для '+math('(x − '+first+')(x − '+second+') = 0')+'?',truth,
     'При подстановке множители равны '+fmt(x-first)+' и '+fmt(x-second)+'. Их произведение '+(truth?'равно':'отлично от')+' нулю.');
   },
   equivalent_negative_multiplier: ({a,b,c})=>choice('Какое уравнение получается после умножения обеих частей '+math(a+'x − '+b+' = '+c)+' на −2?',
    math('−'+2*a+'x + '+2*b+' = −'+2*c),[math('−'+2*a+'x − '+2*b+' = −'+2*c),math('−'+2*a+'x + '+2*b+' = '+2*c),math(2*a+'x + '+2*b+' = −'+2*c)],
    'Умножаем каждое слагаемое слева и всё число справа на −2.')
  },
  {
   all_product_roots: ({a,b,c})=>{
    const second=a+b,third=second+c;
    return choice('Какие числа составляют все корни '+math('(x − '+a+')(x − '+second+')(x − '+third+') = 0')+'?',
     [a,second,third].join(', '),[[a,second].join(', '),[a,second,third+1].join(', '),[-a,-second,-third].join(', ')],
     'Поочерёдно приравниваем к нулю каждый множитель. Если ни один не равен нулю, произведение тоже отлично от нуля.');
   },
   reject_bad_operation: ({a,b,c})=>choice('Какое действие может изменить множество корней уравнения '+math(a+'x + '+b+' = '+(a*c+b))+'?',
    'Умножить обе части на 0',['Вычесть '+b+' из обеих частей','Умножить обе части на '+a,'Разделить обе части на '+a],
    'После умножения на 0 получаем 0 = 0. В новом уравнении подходит любое x, хотя в исходном единственный корень '+c+'.'),
   compare_root_sets: ({a,b})=>checkStatement('Равносильны ли '+math('(x − '+a+')(x − '+(a+b)+') = 0')+' и '+math(b+'x = '+a*b)+'?',false,
    'Первое уравнение имеет корни '+a+' и '+(a+b)+'. У второго единственный корень '+a+'.'),
   same_fractional_root: ({a,b,c})=>{
    const first=a+'x = '+b,second=c*a+'x = '+c*b;
    return checkStatement('Равносильны ли '+math(first)+' и '+math(second)+'?',true,
     'Второе получено умножением обеих частей на '+c+'. Обе записи имеют один и тот же корень '+g7FracHtml(rational(b,a))+'.');
   }
  }
 ],
 linear_equation_one_variable: [
  {
   isolated_signed_sum: ({a,b})=>solve(math('x + '+a+' = '+fmt(a-b)),-b,
    'Вычитаем '+a+' из обеих частей.','x = '+fmt(a-b)+' − '+a+' = '+fmt(-b)+'.'),
   isolated_product: ({a,b})=>solve(math('−'+a+'x = '+a*b),-b,
    'Делим обе части на (−'+a+').','x = '+a*b+' : (−'+a+') = '+fmt(-b)+'.'),
   isolated_difference: ({a,b})=>solve(math(a+' − x = '+(a+b)),-b,
    'Вычитаем '+a+' из обеих частей: −x = '+b+'.','Меняем знаки обеих частей, получаем x = '+fmt(-b)+'.'),
   isolated_quotient: ({a,b})=>solve(frac('x',a)+' = '+math(fmt(-b)),-a*b,
    'Умножаем обе части на '+a+'.','x = '+fmt(-b)+' · '+a+' = '+fmt(-a*b)+'.')
  },
  {
   signed_affine: ({a,b,c})=>solve(math(a+'x − '+b+' = '+fmt(a*c-b)),c,
    'Прибавляем '+b+' к обеим частям: '+a+'x = '+a*c+'.','Делим на '+a+': x = '+c+'.'),
   variables_both_sides: ({a,b,c})=>solve(math((a+b)+'x + '+c+' = '+a+'x + '+(c+b*a)),a,
    'Переносим '+a+'x влево и '+c+' вправо.','Получаем '+b+'x = '+b*a+'. Делим на '+b+' и получаем x = '+a+'.'),
   open_single_bracket: ({a,b,c})=>solve(math(a+'(x − '+b+') = '+fmt(a*(c-b))),c,
    'Делим обе части на '+a+', получаем x − '+b+' = '+fmt(c-b)+'.','Прибавляем '+b+', получаем x = '+c+'.'),
   decimal_coefficient: ({a,b,c})=>solve(math(fmt(a/10)+'x + '+fmt(b/10)+' = '+fmt((a*c+b)/10)),c,
    'Умножаем обе части на 10: '+a+'x + '+b+' = '+(a*c+b)+'.','Вычитаем '+b+', затем делим на '+a+'. Получаем x = '+c+'.')
  },
  {
   signed_two_brackets: ({a,b,c,y})=>{
    const constant=(a+b)*c-a*y-b*c;
    return solve(math(a+'(x − '+y+') − '+b+'('+c+' − x) = '+fmt(constant)),c,
     'Раскрываем обе скобки: '+a+'x − '+a*y+' − '+b*c+' + '+b+'x = '+fmt(constant)+'.',
     'Собираем подобные: '+(a+b)+'x = '+(a+b)*c+'. Делим на '+(a+b)+' и получаем x = '+c+'.');
   },
   denominators_both_sides: ({a,b,c,y})=>{
    const divisor=a+b,constant=a*c+y,root=rational(constant,b);
    return solve(frac('x',a)+' = '+frac('x + '+c,divisor)+' + '+frac(y,a*divisor),root,
     'Умножаем на '+a*divisor+': '+divisor+'x = '+a+'(x + '+c+') + '+y+'.',
     'После раскрытия и переноса: '+b+'x = '+constant+'. Делим и получаем x = '+exact(root)+'.');
   },
   noninteger_root: ({a,b,c})=>{
    const left=a+b,right=left+c,root=rational(b,c);
    return solve(math(right+'x + '+a+' = '+left+'x + '+(a+b)),root,
     'Коэффициент при x слева после переноса равен '+right+' − '+left+' = '+c+'.',
     'Справа остаётся '+(a+b)+' − '+a+' = '+b+'. Получаем x = '+g7FracHtml(root)+'.');
   },
   negative_bracket_fraction: ({a,b,c,y})=>{
    const root=rational(-b,c);
    return solve(math('−'+a+'('+c+'x + '+y+') = '+fmt(a*(b-y))),root,
     'Делим обе части на (−'+a+'): '+c+'x + '+y+' = '+fmt(y-b)+'.',
     'Вычитаем '+y+': '+c+'x = '+fmt(-b)+'. Делим и получаем x = '+g7FracHtml(root)+'.');
   }
  }
 ],
 linear_equation_cases: [
  {
   zero_equals_zero: ({a})=>equationCases('Сколько корней у '+math('0x + '+a+' = '+a)+'?',g7Lin(0,a),g7Lin(0,a)),
   zero_equals_positive: ({a,b})=>equationCases('Сколько корней у '+math('0x + '+a+' = '+(a+b))+'?',g7Lin(0,a),g7Lin(0,a+b)),
   nonzero_coefficient: ({a,b})=>equationCases('Сколько корней у '+math(a+'x = '+b)+'?',g7Lin(a,0),g7Lin(0,b)),
   negative_coefficient: ({a,b})=>equationCases('Сколько корней у '+math('−'+a+'x = −'+b)+'?',g7Lin(-a,0),g7Lin(0,-b))
  },
  {
   cancel_variable: ({a,b,c})=>equationCases('Сколько корней у '+math(a+'x + '+b+' = '+a+'x + '+(b+c))+'?',g7Lin(a,b),g7Lin(a,b+c)),
   coinciding_sides: ({a,b})=>equationCases('Сколько корней у '+math(a+'x − '+b+' = −'+b+' + '+a+'x')+'?',g7Lin(a,-b),g7Lin(a,-b)),
   distinct_coefficients: ({a,b,c})=>equationCases('Сколько корней у '+math((a+b)+'x − '+c+' = '+a+'x + '+c)+'?',g7Lin(a+b,-c),g7Lin(a,c)),
   from_bracket: ({a,b,c})=>{
    const extra=c%2,constant=a*b+extra;
    return equationCases('Сколько корней у '+math(a+'(x + '+b+') = '+a+'x + '+constant)+'?',g7Lin(a,a*b),g7Lin(a,constant));
   }
  },
  {
   two_brackets_case: ({a,b,c,y})=>{
    const coef=a+b,constant=a*c,short=constant+y%2;
    return equationCases('Сколько корней у '+math(a+'(x + '+c+') + '+b+'x = '+coef+'(x + '+y+')'+signed(short-coef*y))+'?',
     g7Lin(coef,constant),g7Lin(coef,short));
   },
   rational_cancellation: ({a,b,c})=>{
    const second=c%2?b+a:b;
    return equationCases('Сколько корней у '+frac('x + '+b,a)+' = '+frac('x + '+second,a)+'?',
     g7Lin(rational(1,a),rational(b,a)),g7Lin(rational(1,a),rational(second,a)));
   },
   determine_parameter: ({a,b})=>['При каком числе k у '+math(a+'(x + '+b+') = kx + '+a*b)+' бесконечно много корней?',a,
    'Обе части должны совпасть при каждом x. Свободные члены равны '+a*b+', поэтому коэффициенты при x тоже должны совпасть: k = '+a+'.'],
   determine_constant: ({a,b,c})=>choice('При каком k у '+math(a+'x + k = '+a+'(x + '+b+')')+' нет корней?',
    String(a*b+c),[String(a*b)],'После сокращения '+a+'x остаётся k = '+a*b+'. Если k равно '+(a*b+c)+', это равенство ложно.')
  }
 ],
 equation_word_problems: [
  {
   initial_quantity: ({a,b})=>['К нескольким маркерам добавили '+b+', получилось '+(a+b)+'. Сколько маркеров было сначала?',a,
    'Пусть x — исходное количество. Тогда x + '+b+' = '+(a+b)+'. Вычитаем '+b+' и получаем x = '+a+'.'],
   price_per_item: ({a,b})=>['За '+b+' одинаковых ручек заплатили '+(10*a*b)+' рублей. Сколько рублей стоит одна ручка?',10*a,
    'Пусть x — цена одной ручки. Тогда '+b+'x = '+(10*a*b)+'. Делим обе части на '+b+' и получаем '+10*a+' рублей.'],
   identify_equation: ({a,b,c})=>choice('У Лены было x наклеек. Она отдала '+b+' и получила '+c+'. Стало '+(a+c)+' наклеек. Какое уравнение составить?',
    math('x − '+b+' + '+c+' = '+(a+c)),[math('x + '+b+' + '+c+' = '+(a+c)),math('x − '+b+' − '+c+' = '+(a+c)),math('x − '+b+' + '+c+' = '+(a+c+b))],
    'Отданные наклейки вычитаем, полученные прибавляем, получившееся количество приравниваем к '+(a+c)+'.'),
   age_one_step: ({a,b})=>['Через '+b+' лет Диме будет '+(a+b)+' лет. Сколько ему сейчас?',a,
    'Если сейчас x лет, через '+b+' лет будет x + '+b+'. Решаем x + '+b+' = '+(a+b)+' и получаем x = '+a+'.']
  },
  {
   two_related_numbers: ({a,b})=>['Сумма двух чисел равна '+(2*a+b)+'. Одно число на '+b+' больше другого. Найди меньшее.',a,
    'Меньшее равно x, большее — x + '+b+'. Из x + x + '+b+' = '+(2*a+b)+' получаем 2x = '+2*a+' и x = '+a+'.'],
   rectangle_from_perimeter: ({a,b})=>['Длина прямоугольника на '+b+' см больше ширины, а периметр равен '+2*(2*a+b)+' см. Найди ширину в сантиметрах.',a,
    'Ширина x, длина x + '+b+'. Получаем 2(x + x + '+b+') = '+2*(2*a+b)+'.<br>Делим на 2 и вычитаем '+b+': 2x = '+2*a+'. Отсюда x = '+a+'.'],
   journey_time: ({a,b,c})=>['Велосипедист ехал со скоростью '+(10+b)+' км/ч. Ещё '+c+' км он прошёл пешком. Весь путь '+((10+b)*a+c)+' км. Сколько часов он ехал?',a,
    'Пусть x — время на велосипеде. Тогда '+(10+b)+'x + '+c+' = '+((10+b)*a+c)+'.<br>Вычитаем '+c+' и делим на '+(10+b)+', получаем x = '+a+'.'],
   consecutive_numbers: ({a})=>['Сумма двух последовательных натуральных чисел равна '+(2*a+1)+'. Найди большее число.',a+1,
    'Числа x и x + 1. Из 2x + 1 = '+(2*a+1)+' получаем x = '+a+'. Значит, большее равно '+(a+1)+'.']
  },
  {
   transfer_between_groups: ({a,b})=>['Во второй коробке на '+2*b+' карандашей больше, чем в первой. Всего '+(2*a+2*b)+' карандашей. Из второй в первую переложили несколько карандашей, и их стало поровну. Сколько переложили?',b,
    'Изначально в первой коробке ('+(2*a+2*b)+' − '+2*b+') : 2 = '+a+' карандашей, во второй '+(a+2*b)+'.<br>После переноса x карандашей получаем '+a+' + x = '+(a+2*b)+' − x. Значит, 2x = '+2*b+' и x = '+b+'.'],
   combined_age: ({a,b,c})=>['Настя на '+b+' лет старше брата. Через '+c+' лет сумма их возрастов составит '+(2*a+b+2*c)+' лет. Сколько лет сейчас брату?',a,
    'Сейчас брату x, Насте x + '+b+'. Через '+c+' лет их возраста x + '+c+' и x + '+b+' + '+c+'.<br>Сумма равна '+(2*a+b+2*c)+'. Вычитаем '+(b+2*c)+', получаем 2x = '+2*a+', значит x = '+a+'.'],
   compare_purchases: ({a,b,c})=>{
    const difference=c*b,base=10*a,expensive=base+c,total=(b+2)*base+b*expensive;
    return ['Тетрадь в клетку стоит на '+c+' руб. дороже тетради в линейку. За '+b+' тетрадей в клетку и '+(b+2)+' в линейку заплатили '+total+' руб. Сколько стоит тетрадь в клетку?',expensive,
     'Пусть x — цена тетради в линейку. Тогда '+b+'(x + '+c+') + '+(b+2)+'x = '+total+'.<br>Получаем '+(2*b+2)+'x = '+(total-difference)+', откуда x = '+base+'. Прибавляем '+c+' и получаем '+expensive+' руб.'];
   },
   work_before_and_after: ({a,b,c,y})=>{
    const f=a+2,h=b+y,total=f*b+(f+c)*y;
    return ['Мастер работал '+h+' ч. Сначала он делал '+f+' деталей в час, затем увеличил выработку на '+c+' '+ruCount(c,'деталь','детали','деталей')+' в час. Всего он изготовил '+total+' деталей. Сколько часов он работал в новом темпе?',y,
     'Пусть x — число часов в новом темпе. В прежнем темпе он работал '+h+' − x ч.<br>'+f+'('+h+' − x) + '+(f+c)+'x = '+total+'.<br>После упрощения '+c+'x = '+(total-f*h)+'. Получаем x = '+y+'.'];
   }
  }
 ]
};
add('alg_expressions_equations','compare_expression_values','Сравнение значений выражений',
 'Чтобы сравнить выражения, вычисли оба значения или используй свойства действий. При указанном значении переменной сначала подставь его в обе части. Для двойного неравенства проверь обе границы.',
 null);
add('alg_functions','function_formula_values','Вычисление значений функции по формуле','В прямой задаче подставь аргумент. В обратной задаче приравняй формулу к известному значению функции и реши уравнение.',
 ({a,b,c,y,d,n})=>n(...(d===0?[
  ['f(x) = '+a+'x'+signed(b)+'. Найди f('+c+').',a*c+b],
  ['g(t) = t²'+signed(a)+'. Найди g('+y+').',y*y+a],
  ['h(x) = '+a+' − x. Найди h('+b+').',a-b]
 ]:d===1?[
  ['f(x) = '+a+'x'+signed(-b)+'. Найди f(−'+c+').',-a*c-b],
  ['g(x) = x² − '+a+'x. Найди g('+y+').',y*y-a*y],
  ['h(x) = '+a+'(x − '+b+'). Найди h('+c+') − h('+y+').',a*(c-y)]
 ]:[
  ['f(x) = '+a+'x'+signed(-b)+'. Найди x, если f(x) = '+(a*c-b)+'.',c],
  ['g(x) = '+a+'x'+signed(y)+'. Найди x, если g(x) + g(x + 1) = '+(a*(2*c+1)+2*y)+'.',c],
  ['f(x) = '+a+'x'+signed(b)+', g(x) = '+(a+1)+'x'+signed(b-c)+'. При каком x значения совпадут?',c]
 ])));
add('alg_functions','piecewise_functions','Кусочно-заданные функции','Сначала сравни аргумент с границей. Подставляй его только в формулу той ветви, условие которой выполнено.',
 ({a,b,c,y,d,k})=>{
 const fn='f(x) = '+a+'x'+signed(b)+' при x < '+c+' и f(x) = '+b+'x'+signed(-y)+' при x ≥ '+c+'. ';
 const left=x=>a*x+b, right=x=>b*x-y;
 const anchor=c-d-1, end=c+d+1;
 const rows=d===0?[
  ['Найди f('+anchor+').',left(anchor)],
  ['Найди f('+c+').',right(c)],
  ['Найди f('+end+').',right(end)]
 ]:d===1?[
  ['Найди f('+end+') − f('+anchor+').',right(end)-left(anchor)],
  ['Найди f('+c+') + f('+anchor+').',right(c)+left(anchor)],
  ['Найди f('+end+') − f('+c+').',right(end)-right(c)]
 ]:[
  ['Найди аргумент x < '+c+', для которого f(x) = '+left(anchor)+'.',anchor],
  ['Найди аргумент x ≥ '+c+', для которого f(x) = '+right(end)+'.',end],
  ['Найди f('+anchor+') + f('+c+') + f('+end+').',left(anchor)+right(c)+right(end)]
 ];
 return [fn+rows[k][0],rows[k][1]];
});
add('alg_polynomials','division_with_remainder','Деление с остатком','Если a = bq + r, то q — неполное частное, а остаток r удовлетворяет условию 0 ≤ r < b.',
 ({a,b,c,d,n})=>{
 const divisor=b+3, r=c%divisor, dividend=a*divisor+r;
 return n(...(d===0?[
  ['Каков остаток при делении '+dividend+' на '+divisor+'?',r],
  ['Каково неполное частное при делении '+dividend+' на '+divisor+'?',a],
  ['Делитель '+divisor+', неполное частное '+a+', остаток '+r+'. Найди делимое.',dividend]
 ]:d===1?[
  ['Каков наибольший остаток при делении на '+divisor+'?',divisor-1],
  ['Сколько прибавить к '+dividend+', чтобы получить следующее большее кратное '+divisor+'?',divisor-r],
  ['Сколько полных коробок по '+divisor+' предметов можно собрать из '+dividend+' предметов?',a]
 ]:[
  ['Найди неотрицательный остаток от деления числа −'+(dividend+1)+' на '+divisor+'.',(divisor-(r+1)%divisor)%divisor],
  ['Число '+dividend+' при делении на неизвестный делитель даёт частное '+a+' и остаток '+r+'. Найди делитель.',divisor],
  ['Найди остаток от деления произведения '+dividend+' · '+(a+1)+' на '+divisor+'.',r*(a+1)%divisor]
 ]));
});
function binomialCoefficient(power,position,a,b){
 let coefficient=1;
 for(let i=0;i<position;i++)coefficient=coefficient*(power-i)/(i+1);
 return coefficient*a**(power-position)*b**position;
}
function binomialPower(power,context){
 const {a,b,c,d,k}=context, factor=d===0?1:a, sign=k===1?-b:b;
 const position=d===0?[0,1,power][k]:k+1, coefficient=binomialCoefficient(power,position,factor,sign);
 const exponent=power-position, expression='('+factor+'x'+signed(sign)+')'+superscriptInt(power);
 if(d===2&&k===2)return ['Найди значение '+expression+' при x = '+c+'.',(factor*c+sign)**power];
 const term=exponent===0?'свободный член':exponent===1?'коэффициент при x':'коэффициент при x'+superscriptInt(exponent);
 return ['Найди '+term+' после раскрытия '+expression+'.',coefficient,'Коэффициент равен '+coefficient+'. Степень x равна '+exponent+', поскольку выбираем '+position+' свободных членов из '+power+' скобок.'];
}
add('alg_formulas','binomial_cube','Куб суммы и куб разности','Раскрой три одинаковых множителя. Коэффициенты в формуле куба — 1, 3, 3, 1. В кубе разности знаки чередуются.',
 context=>binomialPower(3,context));
add('alg_formulas','higher_binomial_power','Возведение двучлена в степень','Представь степень как произведение одинаковых скобок. Для каждого члена посчитай, сколько раз при умножении получается одна и та же степень x.',
 context=>binomialPower(4+context.d,context));
add('alg_formulas','perfect_square_factor','Разложение по формуле квадрата двучлена','Проверь квадраты крайних членов и удвоенное произведение в середине. Знак среднего члена определяет знак в двучлене.',
 ({a,b,c,d,k,y})=>{
 const u=d===0&&k===0?1:a, v=k===1?-b:b, variable=d===2?'xy':'x';
 const left=u===1?variable:u+variable;
 const polynomial=(u*u===1?'':u*u)+variable+(variable==='xy'?'':'²');
 const full=variable==='xy'?(u*u)+'x²y²'+signed(2*u*v)+variable+' + '+v*v:polynomial+signed(2*u*v)+variable+' + '+v*v;
 const correct='('+left+signed(v)+')²';
 if(d===2&&k===2)return ['Разложи '+full+' и вычисли значение при x = '+c+', y = '+y+'.',(u*c*y+v)**2];
 return ['Как выглядит разложение '+full+' на одинаковые множители?',correct,
  ['('+left+signed(-v)+')²','('+left+signed(2*v)+')²','('+left+signed(v)+')³'],'Удвоенное произведение членов двучлена равно '+(2*u*v)+variable+'.'];
});
add('alg_formulas','factor_difference_squares','Разложение разности квадратов','Разность квадратов раскладывается на произведение разности и суммы: A² − B² = (A − B)(A + B).',
 ({a,b,c,d,k})=>{
 const factor=d===0&&k===0?1:a;
 const x=factor===1?'x':factor+'x', y=d===2&&k!==2?b+'y':String(b);
 const expression=(factor===1?'x²':factor*factor+'x²')+' − '+(d===2&&k!==2?b*b+'y²':b*b);
 if(k===2&&d>0)return ['Разложи '+expression+' и вычисли значение при x = '+c+'.',(a*c-b)*(a*c+b)];
 const correct='('+x+' − '+y+')('+x+' + '+y+')';
 return ['Выбери разложение '+expression+'.',correct,['('+x+' − '+y+')²','('+x+' + '+y+')²','('+x+' − '+y+')('+x+' + '+(d===2?b+1+'y':b+1)+')']];
});
add('alg_systems','linear_inequalities_two_variables','Неравенства с двумя переменными','Для проверки точки подставь её координаты во все неравенства. В строгом неравенстве точки на границе не входят в решение.',
 ({a,b,c,y,d,k})=>{
 const bound=a*c+b*y;
 if(d===0){
  const strict=k===1, x=c+(k===0?1:0), yes=!strict;
  return ['Удовлетворяет ли '+pair(x,y)+' неравенству '+a+'x + '+b+'y '+(strict?'>':'≥')+' '+bound+'?',yes?'Да':'Нет',['Да','Нет'],a+' · '+x+' + '+b+' · '+y+' = '+(a*x+b*y)+'.'];
 }
 if(d===2&&k===2)return ['Сколько целых x удовлетворяет системе x ≥ '+c+', x + y < '+(c+a+y)+', если y = '+y+'?',a];
 const strict=k===1;
 return ['Найди наименьшее целое x при y = '+y+', если '+a+'x + '+b+'y '+(strict?'>':'≥')+' '+bound+(d===2?' и x − y ≥ '+(c-y)+'.':'.'),c+Number(strict)];
});

add('geo_basics','geo_field_line','Провешивание прямой','Чтобы отметить прямую на местности, сначала поставь вехи в двух заданных точках. Затем выставляй промежуточные вехи на линии наблюдения.',
 ({a,b,c,d,k})=>{
 const x=a*b, y=c*b;
 const rows=d===0?[
  ['Сколько исходных вех нужно, чтобы задать прямую?',2,'Через две различные точки проходит ровно одна прямая.'],
  ['Между крайними вехами поставили '+a+' промежуточных. Сколько вех всего?',a+2],
  ['Вдоль прямой AB поставили '+(a+b+2)+' вех. Сколько вех между A и B?',a+b]
 ]:d===1?[
  ['Между вехами '+b+' м, все '+(a+1)+' вех стоят в ряд. Каково расстояние от первой до последней (в метрах)?',x],
  ['От первой до последней вехи '+x+' м, шаг '+b+' м. Сколько вех вместе с крайними?',a+1],
  ['От первой вехи до последней '+x+' м. Всего '+(a+1)+' вех через равные промежутки. Найди шаг в метрах.',b]
 ]:[
  ['На двух участках одной прямой дороги длиной '+x+' и '+y+' м ставят вехи через '+b+' м. В месте стыка веха одна. Сколько вех всего?',a+c+1],
  ['На прямой от A до B '+x+' м, от B до C '+y+' м. B между A и C. Сколько промежуточных вех нужно для шага '+b+' м от A до C?',a+c-1],
  ['От A до B '+x+' м. Затем прямую продлили на '+y+' м. На каком расстоянии от A стоит '+(a+2)+'-я веха при шаге '+b+' м?',(a+1)*b]
 ];
 return rows[k];
});
add('geo_basics','geo_congruent_figures','Равные геометрические фигуры','Равные фигуры совпадают при наложении. У соответствующих отрезков и углов равны длины и градусные меры.',
 ({a,b,c,y,d,k,n})=>n(...(d===0?[
  ['AB и CD совпали при наложении. AB = '+a+' см. Найди CD в сантиметрах.',a],
  ['Угол A равен углу B. ∠B = '+(a+b)+'°. Найди ∠A в градусах.',a+b],
  ['После наложения квадратов сторона одного совпала со стороной '+b+' см. Найди периметр первого в сантиметрах.',4*b]
 ]:d===1?[
  ['При наложении отрезков AM переходит в CP, MB — в PD. AM = '+a+' см, MB = '+b+' см. Найди CD.',a+b],
  ['Равные углы имеют меры '+a+'x и '+(a*b)+'°. Найди x.',b],
  ['Точки A, M, B идут по порядку. Равный AB отрезок CD равен '+(c+b)+' см, AM = '+c+' см. Найди MB.',b]
 ]:[
  ['У равных углов меры '+a+'x + '+c+' и '+(a-1)+'x + '+(c+b)+'. Найди общую градусную меру.',a*b+c],
  ['Отрезки длиной '+a+'x + '+y+' и '+(a-1)+'x + '+(y+c)+' равны. Найди удвоенную длину одного отрезка.',2*(a*c+y)],
  ['Два равных прямоугольника сложили длинными сторонами '+(a+b)+' см. Ширина каждого '+b+' см. Найди периметр получившегося прямоугольника.',2*(a+3*b)]
 ])));
add('geo_basics','geo_length_units','Единицы длины и измерение отрезков','При измерении линейкой вычитай показание начала от показания конца. Для сравнения или сложения сначала приведи длины к одной единице.',
 ({a,b,c,y,d,n})=>n(...(d===0?[
  [a+' см. Сколько это миллиметров?',10*a],
  ['Отрезок начинается у деления '+a+' см и заканчивается у '+(a+b)+' см. Какова его длина в сантиметрах?',b],
  [a+' дм. Сколько это сантиметров?',10*a]
 ]:d===1?[
  [a+' см '+b%10+' мм. Сколько это миллиметров?',10*a+b%10],
  ['Концы отрезка на делениях '+a+' см и '+(a+b)+','+y%10+' см. Найди длину в миллиметрах.',10*b+y%10],
  ['Один отрезок '+a+' дм, другой '+b+' см. На сколько сантиметров первый длиннее?',10*a-b]
 ]:[
  ['Ломаная состоит из звеньев '+a+' дм, '+b+' см и '+c+' мм. Найди длину в миллиметрах.',100*a+10*b+c],
  ['Начало отрезка у деления '+a+' см. Его длина '+(10*b+y%10)+' мм. У какого деления в миллиметрах находится конец?',10*(a+b)+y%10],
  ['Проволока '+a+' дм. От неё отрезали '+b+' см и '+c+' мм. Сколько миллиметров осталось?',100*a-10*b-c]
 ])));
add('geo_basics','geo_field_angles','Углы на местности','При визировании направления отсчитывают от общего нуля. Для лучей по одну сторону от нуля меньший угол равен разности отсчётов.',
 ({a,b,c,y,d,n})=>{
 const first=2*a,second=3*b+35, third=second+c+y;
 return n(...(d===0?[
  ['Визир сначала показал '+first+'°, затем '+second+'°. На сколько градусов он повернулся?',second-first],
  ['Визир повернулся от отметки '+first+'° на '+b+'° в сторону увеличения. Какой стал отсчёт?',first+b],
  ['Между направлением нуля и целью '+second+'°. Что покажет визир, если его ноль совмещён с исходным направлением?',second]
 ]:d===1?[
  ['Два направления отклонены от нуля в противоположные стороны на '+first+'° и '+second+'°. Найди угол между ними.',first+second],
  ['Оба направления справа от нуля. Первое имеет отсчёт '+first+'°, угол между ними '+b+'° и второе правее. Найди второй отсчёт.',first+b],
  ['Отсчёт '+second+'° уменьшился на '+c+'°, затем вырос на '+y+'°. Каков итоговый отсчёт?',second-c+y]
 ]:[
  ['По круговой шкале направления имеют отсчёты '+(360-first)+'° и '+second+'°. Найди меньший угол через ноль.',first+second],
  ['По часовой стрелке от A до B '+first+'°, от B до C '+second+'°. Найди величину оставшейся дуги от C до A.',360-first-second],
  ['В одном секторе отсчёты трёх лучей '+first+'°, '+second+'° и '+third+'°. На сколько градусов угол между крайними больше угла между первым и вторым?',c+y]
 ]));
});
add('geo_basics','geo_field_right_angles','Прямой угол на местности','Направления взаимно перпендикулярны, если меньший угол между ними равен 90°. Углы на одной стороне прямой в сумме дают 180°.',
 ({a,b,d,k,n})=>{
 const first=3*a+b;
 return n(...(d===0?[
  ['Каков угол в градусах между прямой дорогой и перпендикулярной ей тропой?',90,'Прямой угол равен 90°.'],
  ['Вдоль дороги сделали поворот от отсчёта '+first+'° на прямой угол в сторону роста. Каков новый отсчёт?',first+90],
  ['Эккер показал прямой угол. Отклонились от него на '+a+'° к дороге. Какой угол остался?',90-a]
 ]:d===1?[
  ['Между дорогой и тропой '+first+'°. На сколько градусов надо увеличить угол до прямого?',90-first],
  ['Тропа образует с лучом дороги '+first+'°. Какой угол она образует с противоположным лучом?',180-first],
  ['Повернули от направления дороги на '+a+'°, затем ещё на '+b+'°. Сколько градусов осталось до перпендикуляра?',90-a-b]
 ]:[
  ['Направление дороги '+(360-first)+'°. Найди отсчёт перпендикуляра на 90° по часовой стрелке, от 0° до 359°.',90-first],
  ['Две тропы выходят в разные стороны от направления дороги: одна под '+a+'°, другая под '+b+'°. На сколько градусов их меньший угол меньше прямого?',90-a-b],
  ['От направления дороги отклонились на '+first+'°. Далее повернули на 90° в ту же сторону. Найди острый угол между новым направлением и дорогой.',90-first]
 ]));
});
add('geo_parallels','geo_construct_parallel','Построение параллельных прямых','Для построения параллельной через точку можно провести две прямые, перпендикулярные одной прямой, или отложить равный соответственный угол.',
 ({a,b,d,k})=>{
 const angle=3*a+b;
 const rows=d===0?[
  ['К прямой a провели перпендикуляр c. Как должна пройти искомая параллельная к a относительно c?','Перпендикулярно',['Параллельно','Под углом 45°']],
  ['Какой соответственный угол нужно отложить, если исходный равен '+angle+'°?',angle],
  ['Линейка фиксирует направление, угольник сдвигают, сохраняя его положение. Как расположены прямые вдоль одной и той же стороны угольника?','Параллельно',['Перпендикулярно','Под углом 45°']]
 ]:d===1?[
  ['Накрест лежащий угол равен '+angle+'°. Какой второй накрест лежащий угол обеспечит параллельность?',angle],
  ['Первый односторонний угол равен '+angle+'°. Какой второй угол нужен для построения параллельных прямых?',180-angle],
  ['Две прямые перпендикулярны третьей. Одна образует с секущей '+angle+'°. Найди смежный с соответственным угол для другой прямой.',180-angle]
 ]:[
  ['Односторонние углы выражены как '+a+'x и 180 − '+a*b+'. При каком x получится параллельность?',b],
  ['Накрест лежащие углы выражены как '+a+'x + '+b+' и '+(a+1)+'x. При каком x прямые параллельны?',b],
  ['Один соответственный угол равен '+angle+'°, второй после поворота уменьшился на '+b+'° относительно первоначального. Если теперь прямые параллельны, чему равнялся второй угол до поворота?',angle+b]
 ];
 return rows[k];
});
add('geo_parallels','geo_axiom_parallel','Аксиомы и единственность параллельной','Аксиому принимают без доказательства. Через точку вне прямой можно провести ровно одну прямую, параллельную данной.',
 ({a,b,c,d,k})=>{
 const rows=d===0?[
  ['Сколько прямых, параллельных a, можно провести через точку P на расстоянии '+a+' см от a?',1],
  ['В учебнике утверждение о единственной параллельной принято без доказательства. Как оно называется?','Аксиома',['Теорема','Следствие']],
  ['На прямой a отмечено '+c+' точек. Сколько прямых, параллельных a, можно провести хотя бы через одну из них?',0,'Параллельные прямые не пересекаются.']
 ]:d===1?[
  ['Через '+a+' точек вне a провели параллельные к a. Все точки лежат на одной параллельной к a. Сколько различных прямых получили?',1],
  ['Две прямые через точку P вне a обе параллельны a. Как они расположены?','Совпадают',['Перпендикулярны','Образуют острый угол']],
  ['Через каждую из '+b+' точек вне a провели параллельную, и никакие две точки не оказались на одной такой прямой. Сколько прямых получилось?',b]
 ]:[
  ['Есть '+a+' точек на одной параллельной к a и '+b+' точек на другой параллельной к a. Сколько разных параллельных к a можно получить через эти точки?',2],
  ['На прямой a лежат '+a+' точек, а ещё '+c+' лежат на одной прямой, параллельной a. Сколько различных параллельных к a пройдёт хотя бы через одну из отмеченных точек?',1],
  ['Прямые b и c параллельны a и различаются. Может ли прямая через точку на b, параллельная c, отличаться от b?','Нет',['Да','Зависит от точки'],'Прямая b уже параллельна c. Через данную точку такая прямая единственна.']
 ];
 return rows[k];
});
add('geo_parallels','geo_angles_matching_sides','Углы с соответственно параллельными или перпендикулярными сторонами','При соответственно параллельных или перпендикулярных сторонах углы либо равны, либо дополняют друг друга до 180°. Если оба угла острые, они равны.',
 ({a,b,d,k})=>{
 const angle=3*a+b;
 const rows=d===0?[
  ['Острые углы имеют соответственно параллельные стороны. Первый равен '+angle+'°. Найди второй.',angle],
  ['Острые углы имеют соответственно перпендикулярные стороны. Первый равен '+angle+'°. Найди второй.',angle],
  ['У углов соответственно параллельные стороны. Первый острый и равен '+angle+'°, второй тупой. Найди второй.',180-angle]
 ]:d===1?[
  ['Углы с соответственно параллельными сторонами в сумме дают '+(2*angle)+'°. Найди каждый.',angle],
  ['Углы с соответственно перпендикулярными сторонами не равны. Один равен '+angle+'°. Найди разность большего и меньшего.',180-2*angle],
  ['Оба угла тупые, стороны соответственно параллельны. Их сумма '+(360-2*angle)+'°. Найди один угол.',180-angle]
 ]:[
  ['Углы с соответственно перпендикулярными сторонами не равны, их разность '+(180-2*angle)+'°. Найди меньший.',angle],
  ['Углы с соответственно параллельными сторонами равны. Их меры '+a+'x + '+b+' и '+(a+1)+'x. Найди x.',b],
  ['Один из двух неравных углов с соответственно параллельными сторонами в '+a+' раз больше другого. Найди меньший угол в градусах. При необходимости запиши дробь.',rational(180,a+1)]
 ];
 return rows[k];
});
add('geo_triangles','geo_triangle_angle_types','Виды треугольников по углам','Найди или оцени наибольший угол. При 90° треугольник прямоугольный, при угле больше 90° — тупоугольный, иначе — остроугольный.',
 ({a,b,c,d,k})=>{
 const rows=d===0?[[60+a,50+b],[90,2*a],[95+a,30+b]]:
 d===1?[[40+a,50-a],[30+a,40+b],[70+a,45+b]]:
 [[2*a,90-2*a],[2*a,40+b],[50+a,60+b]];
 const [A,B]=rows[k], C=180-A-B, max=Math.max(A,B,C);
 const options=['Остроугольный','Прямоугольный','Тупоугольный'];
 const pick=max===90?1:max<90?0:2;
 if(d===2&&k===2){
  return ['В треугольнике внешний угол при C равен '+(A+B)+'°, угол A — '+A+'°. Определи вид треугольника по углам.',options[pick],options,'∠B = '+B+'°, ∠C = '+C+'°. Наибольший угол равен '+max+'°.'];
 }
 const text=d===0?'Углы треугольника равны '+A+'°, '+B+'° и '+C+'°.':d===1?'Два угла треугольника '+A+'° и '+B+'°.':'Угол A равен '+A+'°, угол B '+(B===A?'равен углу A.':(B>A?'больше':'меньше')+' угла A на '+Math.abs(B-A)+'°.');
 return [text+' Какого вида треугольник?',options[pick],options,'Три угла равны '+A+'°, '+B+'° и '+C+'°. Наибольший равен '+max+'°.'];
});

add('stat_data','stat_table_calculations','Вычисления по таблице','Найди нужные строки и столбцы, затем выполни действие из вопроса. Среднее — сумма значений, делённая на их число.',
 ({a,b,c,y,d,k})=>{
 const table=g7TextbookTable(['День','Утро','Вечер'],[['Пн',a,b],['Вт',c,y]]);
 const rows=d===0?[
  ['Сколько записано на вечер вторника?',y],
  ['Сколько записано на утро понедельника?',a],
  ['Найди сумму за понедельник.',a+b]
 ]:d===1?[
  ['Найди разность между значениями за два дня: вторник минус понедельник.',c+y-a-b],
  ['Найди суммарное утреннее значение.',a+c],
  ['На сколько вечерняя сумма отличается от утренней? Возьми модуль разности.',Math.abs(b+y-a-c)]
 ]:[
  ['Вычти среднее вторника из среднего понедельника. При необходимости запиши ответ дробью.',rational(a+b-c-y,2)],
  ['Каково среднее по всем четырём наблюдениям? При необходимости запиши ответ дробью.',rational(a+b+c+y,4)],
  ['Чему должно равняться вечернее значение вторника, чтобы итог вторника был на '+(a+c)+' больше итога понедельника?',2*a+b]
 ];
 if(d===2&&k===2)return [g7TextbookTable(['День','Утро','Вечер'],[['Пн',a,b],['Вт',c,'?']])+rows[k][0],rows[k][1]];
 return [table+rows[k][0],rows[k][1]];
});
add('stat_data','stat_bar_charts','Столбчатые диаграммы','Высота столбца показывает значение. Сравнивай столбцы по общей шкале. Долю можно найти, разделив значение на сумму всех значений.',
 ({d,k})=>{
 const m=g7StatBarModel(), i=ri(0,m.values.length-1), j=(i+ri(1,m.values.length-1))%m.values.length;
 const label=m.categories[i], other=m.categories[j], a=m.values[i], b=m.values[j];
 const sum=m.values.reduce((total,value)=>total+value,0), high=Math.max(...m.values);
 const rows=d===0?[
  ['Какое значение показывает столбец «'+label+'»?',a],
  ['Какое значение показывает самый высокий столбец?',high],
  ['Какое значение показывает самый низкий столбец?',Math.min(...m.values)]
 ]:d===1?[
  ['На сколько различаются значения «'+label+'» и «'+other+'»?',Math.abs(a-b)],
  ['Чему равна сумма значений «'+label+'» и «'+other+'»?',a+b],
  ['Найди размах значений.',high-Math.min(...m.values)]
 ]:[
  ['Какую долю общего числа составляет «'+label+'»? Ответ дай дробью.',rational(a,sum)],
  ['Найди среднее значение всех столбцов. При необходимости запиши дробь.',rational(sum,m.values.length)],
  ['Вычти сумму значений «'+label+'» и «'+other+'» из суммы остальных значений.',sum-2*(a+b)]
 ];
 return [...rows[k],null,null,q=>g6AttachBarChart(q,m.bar)];
});
add('stat_data','stat_pie_charts','Круговые диаграммы','Весь круг — это 100% или 360°. Чтобы получить угол сектора, умножь долю на 360°. Чтобы найти количество объектов в секторе, умножь долю на общее количество.',
 ({a,d,k})=>{
 const pie=g7StatPieModel(), i=ri(0,pie.values.length-1), j=(i+ri(1,pie.values.length-1))%pie.values.length;
 const label=pie.labels[i], other=pie.labels[j], p=pie.values[i], q=pie.values[j], total=20*a;
 const rows=d===0?[
  ['Какой процент составляет «'+label+'»?',p],
  ['Какой процент составляет «'+other+'»?',q],
  ['Какой процент составляет наименьший сектор?',Math.min(...pie.values)]
 ]:d===1?[
  ['Найди суммарный процент секторов «'+label+'» и «'+other+'».',p+q],
  ['Найди центральный угол сектора «'+label+'» в градусах.',p*18/5],
  ['Всего '+total+' объектов. Сколько приходится на «'+label+'»?',total*p/100]
 ]:[
  ['В секторе «'+label+'» '+(total*p/100)+' объектов. Сколько объектов во всех секторах?',total],
  ['Найди долю «'+label+'» среди секторов «'+label+'» и «'+other+'». Ответ дай дробью.',rational(p,p+q)],
  ['Всего '+total+' объектов. На сколько различаются количества в секторах «'+label+'» и «'+other+'»?',total*Math.abs(p-q)/100]
 ];
 return [...rows[k],null,null,question=>g7AttachPie(question,pie)];
});
function g7TextbookTable(headers,rows){
 return '<div class="g7-data-table-wrap"><table class="g7-data-table"><thead><tr>'+headers.map(header=>'<th scope="col">'+header+'</th>').join('')+'</tr></thead><tbody>'+
  rows.map(([label,...values])=>'<tr><th scope="row">'+label+'</th>'+values.map(value=>'<td>'+value+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
add('stat_data','stat_population_pyramid','Возрастно-половые диаграммы','Сравнивай полосы на одной шкале. Для выбранного возраста складывай значения двух групп. Сумма каждой стороны даёт общий размер своей группы.',
 ({a,b,c,y,d,k})=>{
 const max=Math.max(a,b,c,y)*3;
 const bar=(x,w,value,label)=>'<rect x="'+x+'" y="'+w+'" width="'+(value*100/max)+'" height="16" fill="'+(label==='Мужчины'?'#3972a1':'#804a80')+'"><title>'+label+': '+value+'</title></rect>';
 const line=(x,w,label)=>'<text x="'+x+'" y="'+w+'" fill="currentColor" text-anchor="middle" font-size="11">'+label+'</text>';
 const chart='<svg viewBox="0 0 280 106" role="img" aria-label="Возрастная диаграмма: до 18 лет мужчин '+a+', женщин '+b+'; 18 лет и старше мужчин '+(2*c)+', женщин '+(2*y)+'" style="width:min(100%,460px);display:block;margin:8px auto">'+
  line(65,11,'Мужчины')+line(215,11,'Женщины')+bar(112-a*100/max,25,a,'Мужчины')+bar(168,25,b,'Женщины')+
  bar(112-2*c*100/max,66,2*c,'Мужчины')+bar(168,66,2*y,'Женщины')+
  line(140,36,'до 18')+line(140,77,'18+')+line(105-a*100/max,37,a)+line(177+b*100/max,37,b)+line(104-2*c*100/max,78,2*c)+line(179+2*y*100/max,78,2*y)+'</svg>';
 const rows=d===0?[
  ['Сколько мальчиков до 18 лет?',a],['Сколько девочек до 18 лет?',b],['Сколько мужчин в группе 18+?',2*c]
 ]:d===1?[
  ['Сколько всего человек в группе до 18 лет?',a+b],['Сколько женщин на диаграмме?',b+2*y],['На сколько различается число мужчин и женщин в группе 18+?',2*Math.abs(c-y)]
 ]:[
  ['Найди разность общей численности групп 18+ и до 18 лет.',2*(c+y)-a-b],
  ['Найди долю людей до 18 лет от всех людей на диаграмме. Ответ дай дробью.',rational(a+b,a+b+2*c+2*y)],
  ['Найди долю женщин среди всех людей 18+. Ответ дай дробью.',rational(y,c+y)]
 ];
 return [chart+rows[k][0],rows[k][1]];
});
add('stat_characteristics','stat_mean_properties','Свойства среднего арифметического','При добавлении числа ко всем значениям среднее меняется на это число. При умножении всех значений среднее умножается на тот же множитель.',
 ({a,b,c,y,d,n})=>n(...(d===0?[
  ['Среднее равно '+a+'. Каждое значение увеличили на '+b+'. Каково новое среднее?',a+b],
  ['Среднее равно '+a+'. Каждое значение умножили на '+b+'. Найди новое среднее.',a*b],
  ['Среднее равно '+(a+b)+'. От каждого значения отняли '+b+'. Найди новое среднее.',a]
 ]:d===1?[
  ['Было три числа со средним '+a+'. Добавили число '+(a+4*b)+'. Найди новое среднее.',a+b],
  ['Среднее четырёх чисел '+(a+b)+'. Три числа равны '+a+'. Найди четвёртое число.',a+4*b],
  ['Два числа имеют среднее '+a+', ещё три — среднее '+(a+5)+'. Найди общее среднее.',a+3]
 ]:[
  ['У пяти чисел среднее '+a+'. Каждое умножили на '+b+' и уменьшили на '+c+'. Найди новое среднее.',a*b-c],
  ['Среднее '+a+' чисел равно '+c+'. После добавления ещё одного числа среднее увеличилось на '+b+'. Какое число добавили?',c+(a+1)*b],
  ['Среднее '+a+' чисел '+c+'. Одно значение '+y+' исправили на '+(y+a*b)+'. Найди новое среднее.',c+b]
 ])));
add('stat_characteristics','stat_measurement_error','Точность и погрешность измерений','Абсолютная погрешность — модуль разности измеренного и точного значений. При погрешности не более δ истинное значение находится в пределах x − δ и x + δ.',
 ({a,b,c,d,n})=>n(...(d===0?[
  ['Прибор показал '+(a+b)+', точное значение '+a+'. Найди абсолютную погрешность.',b],
  ['Прибор показал '+a+', точное значение '+(a+b)+'. Найди абсолютную погрешность.',b],
  ['Цена деления линейки '+(2*b)+' мм. Результат округляют до ближайшего деления. Какова наибольшая погрешность округления в миллиметрах?',b]
 ]:d===1?[
  ['Отсчёт '+(30+a)+', погрешность не более '+b+'. Найди нижнюю границу.',30+a-b],
  ['Отсчёт '+a+', погрешность не более '+b+'. Найди верхнюю границу.',a+b],
  ['Измерение '+(a+b)+' ± '+b+'. Какова длина всего допустимого интервала?',2*b]
 ]:[
  ['Два измерения одной величины: '+(30+a)+' ± '+c+' и '+(33+a)+' ± '+c+'. Найди нижнюю границу их общей части.',33+a-c],
  ['Измерения A и B равны '+(30+a)+' ± '+b+' и '+(50+a)+' ± '+c+'. Найди наибольшее возможное B − A.',20+b+c],
  ['Величину '+(40+a)+' измерили дважды. Приборы показали '+(40+a+b)+' и '+(40+a-c)+'. Найди модуль разности абсолютных погрешностей.',Math.abs(c-b)]
 ])));
add('stat_characteristics','stat_sample','Выборка и генеральная совокупность','Генеральная совокупность — все объекты исследования. Выборка — обследованная часть. Для сравнения групп выбирай данные из каждой группы.',
 ({a,b,c,d,k})=>{
 const total=(a+b)*10, selected=a+b;
 const rows=d===0?[
  ['В школе '+total+' учеников. Опросили '+selected+'. Каков размер выборки?',selected],
  ['Для изучения всех '+total+' деревьев отметили '+selected+'. Сколько деревьев в генеральной совокупности?',total],
  ['Из '+total+' деталей проверили '+c+'. Что является выборкой?','Проверенные детали',['Все детали','Оставшиеся детали']]
 ]:d===1?[
  ['Опросили '+a+' учеников 7А и '+b+' учеников 7Б. Сколько всего участников в выборке?',selected],
  ['Из '+total+' упаковок отобрали '+selected+'. Сколько не вошло в выборку?',total-selected],
  ['Для оценки всей школы какой способ лучше?','Случайно выбрать учеников из каждого класса',['Опросить только один класс','Опросить только отличников']]
 ]:[
  ['Из '+total+' записей отобрали '+selected+'. Какая доля записей вошла в выборку? Ответ дай дробью.',rational(selected,total)],
  ['Нужно обследовать одинаковую долю в двух группах из '+(10*a)+' и '+(10*b)+' объектов. Из первой выбрали '+a+'. Сколько взять из второй?',b],
  ['В исследовании '+selected+' разных объектов. Из первого списка взяли '+(a+c)+' объектов, из второго '+b+'. Сколько объектов попало в оба списка?',c]
 ];
 return rows[k];
});
add('stat_characteristics','stat_sample_estimation','Оценка по выборке','Найди долю признака в выборке. Для оценки числа объектов во всей совокупности умножь долю на размер совокупности. Это оценка.',
 ({a,b,c,y,d,k})=>{
 const n=5*(a+b), sample=a+b, fav=a;
 return (d===0?[
  ['В выборке '+sample+' объектов, из них '+fav+' имеют признак. Какова доля? Ответ дай дробью.',rational(fav,sample)],
  ['В выборке '+sample+' объектов, у '+fav+' есть признак. У скольких признака нет?',b],
  ['В выборке '+n+' объектов, каждый пятый имеет признак. Сколько таких объектов?',sample]
 ]:d===1?[
  ['В представительной выборке '+fav+' из '+sample+' объектов имеют признак. Оцени их число среди '+n+' объектов.',5*fav],
  ['В выборке '+fav+' из '+sample+' объектов с недостатком. Оцени число объектов без недостатка в партии из '+n+' штук.',5*b],
  ['В выборке каждый четвёртый объект с признаком. Оцени число таких объектов среди '+(4*c*5)+' объектов.',5*c]
 ]:[
  ['В двух выборках '+a+' из '+sample+' и '+c+' из '+(c+y)+' объектов с признаком. Какова общая доля? Ответ дай дробью.',rational(a+c,sample+c+y)],
  ['В выборке из '+sample+' объектов '+a+' имеют признак. После добавления '+(c*sample)+' объектов доля та же. Сколько добавленных объектов имеет признак?',c*a],
  ['В двух группах было по '+n+' объектов. Доли признака оценили как '+g7FracHtml(rational(a,sample))+' и '+g7FracHtml(rational(b,sample))+'. Оцени общее число объектов с признаком.',n]
 ])[k];
});

const logicRows={
 logic_statements:[
  ['Какая фраза является высказыванием?','7 — простое число.',['Который час?','Реши пример.']],
  ['Какая запись является высказыванием с определённой истинностью?','6 > 4',['x > 4','Как сравнить числа?']],
  ['Какая фраза не является высказыванием?','Нарисуй квадрат.',['У квадрата четыре стороны.','У квадрата пять сторон.']]
 ],
 logic_negation:[
  ['Отрицание фразы «Все записи верны».','Хотя бы одна запись неверна.',['Ни одна запись не верна.','Хотя бы одна запись верна.']],
  ['Отрицание фразы «Хотя бы один ответ верен».','Ни один ответ не верен.',['Все ответы верны.','Хотя бы один ответ неверен.']],
  ['Отрицание неравенства x > 5.','x ≤ 5',['x < 5','x ≥ 5']]
 ],
 logic_implication:[
  ['В утверждении «Если число кратно 10, то оно чётное» назови условие.','Число кратно 10.',['Число чётное.','Число нечётное.']],
  ['Что является заключением: «Если пошёл дождь, то площадка мокрая»?','Площадка мокрая.',['Пошёл дождь.','Дождя не было.']],
  ['В каком случае опровергнуто правило «Если деталь красная, то она круглая»?','Красная квадратная деталь.',['Синяя круглая деталь.','Красная круглая деталь.']]
 ],
 logic_converse:[
  ['Какое утверждение обратное к «Если число кратно 6, то оно чётное»?','Если число чётное, то оно кратно 6.',['Если число нечётное, то оно не кратно 6.','Если число кратно 6, то оно чётное.']],
  ['Нужно ли числу быть чётным, чтобы делиться на 6?','Да, это необходимое условие.',['Нет, это условие не нужно.','Это достаточное условие.']],
  ['Как связаны «x — чётное целое число» и «x делится на 2»?','Равносильны.',['Только первое влечёт второе.','Только второе влечёт первое.']]
 ],
 logic_contradiction:[
  ['Что предполагают, доказывая утверждение от противного?','Отрицание самого утверждения.',['Само утверждение.','Утверждение без заключения.']],
  ['Что опровергает «Все простые числа нечётные»?','Число 2.',['Число 3.','Число 9.']],
  ['Чтобы от противного доказать x ≥ 7, что сначала предполагают?','x < 7',['x > 7','x ≤ 7']]
 ]
};
add('probability','logic_statements','Высказывания','Высказывание — фраза, для которой можно определить, истинна она или ложна. Вопрос, просьба или запись со свободной переменной без значения этим свойством не обладают.',
 ({a,b,c,d,k})=>{
 if(d===0){
  const row=logicRows.logic_statements[k];
  if(k===0)return [row[0],a+' — натуральное число.',row[2]];
  if(k===1)return [row[0],(a+b)+' > '+a,['x > '+a,'Как сравнить числа?']];
  return [row[0],'Нарисуй '+a+' фигур.',['У квадрата четыре стороны.','У квадрата пять сторон.']];
 }
 if(d===1){
  const statements=[a+' > '+(a+b),a+' + '+b+' = '+(a+b),c+'² = '+(c*c+k-1)];
  const truth=[false,true,k===1][k];
  return ['Истинно ли высказывание «'+statements[k]+'»?',truth?'Да':'Нет',['Да','Нет']];
 }
 const statements=[a+' + '+b+' = '+(a+b),c+'² < '+(c*c+1),b+' · '+c+' > '+(b*c+k-1)];
 return ['Сколько истинных высказываний: '+statements.join('; ')+'?',k===0?3:2,'Первые два равенства или сравнения верны. Третье сравниваем с '+b*c+'.'];
});
add('probability','logic_negation','Отрицание высказывания','Чтобы отрицать «все», достаточно одного исключения. Отрицание «хотя бы один» — «ни одного». Отрицание x > a — x ≤ a.',
 ({a,b,c,d,k})=>{
 if(d===0)return k===2?['Отрицание неравенства x > '+a+'.','x ≤ '+a,['x < '+a,'x ≥ '+a]]:logicRows.logic_negation[k];
 if(d===1){
  const op=['≥','<','≤'][k], opposite=['<','≥','>'][k];
  return ['Как отрицать «x '+op+' '+a+'»?','x '+opposite+' '+a,['<','≤','>','≥'].filter(v=>v!==opposite).map(v=>'x '+v+' '+a)];
 }
 const variable=['целое число','треугольник','ответ'][k];
 const [original,correct,options]=[
  ['Больше '+a+' и меньше '+(a+b),'Не больше '+a+' или не меньше '+(a+b),['Больше '+a+' или меньше '+(a+b),'Не больше '+a+' и не меньше '+(a+b)]],
  ['Остроугольный или прямоугольный','Тупоугольный',['Остроугольный','Прямоугольный']],
  ['По крайней мере '+c+' ответов верны','Верно меньше '+c+' ответов',['Верно ровно '+c+' ответов','Верно больше '+c+' ответов']]
 ][k];
 return ['Речь про '+variable+'. Выбери отрицание: «'+original+'».',correct,options];
});
add('probability','logic_implication','Условные утверждения','В утверждении «если A, то B» условие — A, заключение — B. Для опровержения найди случай, когда A выполнено, а B ложно.',
 ({a,b,d,k})=>{
 if(d===0)return k===0?['В утверждении «Если число кратно '+(2*a)+', то оно чётное» назови условие.','Число кратно '+(2*a)+'.',['Число чётное.','Число нечётное.']]:logicRows.logic_implication[k];
 const multiple=a*b, counter=multiple+a;
 if(d===1)return [
  'Правило: если число кратно '+a+', то оно кратно '+multiple+'. Выбери контрпример.',counter,[multiple,2*multiple,3*multiple],
  counter+' делится на '+a+', но не на '+multiple+'.'
 ];
 const n=multiple*(k+2)+a;
 return ['Проверяют правило «Если число делится на '+a+', то оно делится на '+multiple+'». Число '+n+' удовлетворяет условию. Какой остаток показывает, что это контрпример?',a,'Остаток от деления '+n+' на '+multiple+' равен '+a+'.'];
});
add('probability','logic_converse','Обратное утверждение и равносильность','Чтобы получить обратное утверждение, поменяй местами условие и заключение. Утверждения равносильны, если истинны оба направления.',
 ({a,b,d,k})=>{
 if(d===0)return k===0?['Какое утверждение обратное к «Если число кратно '+(2*a)+', то оно чётное»?','Если число чётное, то оно кратно '+(2*a)+'.',['Если число нечётное, то оно не кратно '+(2*a)+'.','Если число кратно '+(2*a)+', то оно чётное.']]:logicRows.logic_converse[k];
 const multiple=a*b;
 if(d===1){
  const forms=[
   ['кратно '+multiple,'кратно '+a,'Необходимое'],
   ['кратно '+a,'кратно '+multiple,'Достаточное'],
   ['делится на '+a,'кратно '+a,'Необходимое и достаточное']
  ];
  const [event,condition,key]=forms[k];
  return ['Для условия «число '+event+'» каким является требование «число '+condition+'»?',key,['Необходимое','Достаточное','Необходимое и достаточное']];
 }
 const n=multiple*(k+1);
 return ['Если целое число делится на '+multiple+', оно делится на '+a+'. Какое число опровергает обратное утверждение?',n+a,[n,2*n,3*n],(n+a)+' кратно '+a+', но не кратно '+multiple+'.'];
});
add('probability','logic_contradiction','Контрпримеры и доказательство от противного','Один контрпример опровергает утверждение о всех объектах. В доказательстве от противного принимают отрицание цели и получают противоречие.',
 ({a,b,c,d,k})=>{
 if(d===0)return k===2?['Чтобы от противного доказать x ≥ '+a+', что сначала предполагают?','x < '+a,['x > '+a,'x ≤ '+a]]:logicRows.logic_contradiction[k];
 if(d===1)return [
  'Какой пример опровергает «Все числа, делящиеся на '+a+', делятся на '+(a*b)+'»?',a*b+a,[a*b,2*a*b,3*a*b],
  (a*b+a)+' делится на '+a+' и даёт остаток '+a+' при делении на '+(a*b)+'.'
 ];
 return [
  ['Доказываем, что сумма положительных целых '+a+' и '+b+' больше '+a+'. Что следует из предположения о сумме ≤ '+a+'?','Получилось бы '+b+' ≤ 0.',['Получилось бы '+a+' ≤ 0.','Получилось бы '+b+' ≥ '+a+' + '+b+'.']],
  ['Нужно доказать, что у двух различных прямых не больше одной общей точки. Что противоречит предположению о двух общих точках?','Через две точки проходит единственная прямая.',['Прямая бесконечна.','Пересекающиеся прямые образуют углы.']],
  ['Какое число опровергает «Каждое число больше '+c+' больше и '+(c+a)+'»?',c+1,[c,c+a+1,c+a+b]]
 ][k];
});
add('probability','prob_error_protection','Вероятностная защита от ошибок','При повторной передаче можно принять значение, полученное большинством. Для трёх копий ошибка большинства возникает, если испорчены две или три копии.',
 ({a,b,c,d,k})=>{
 const den=b+2;
 const questions=d===0?[
  ['Передали один бит трижды. Получили 0, 1, 0. Какой бит примет правило большинства?',0],
  ['Передано '+(a+b)+' битов, из них '+b+' нулей. Сколько единиц?',a],
  ['Сколько из '+(2*a+1)+' копий нужны для большинства?',a+1]
 ]:d===1?[
  ['Из '+(2*a+1)+' одинаковых копий испорчено '+a+'. Сколько осталось верных?',a+1],
  ['Передали '+(2*a+1)+' копий. Сколько ошибок максимум исправляет правило большинства?',a],
  ['Из '+(2*a+1)+' копий '+a+' ошибочны. Какова их доля? Ответ дай дробью.',rational(a,2*a+1)]
 ]:[
  ['Три копии передают независимо, вероятность ошибки каждой '+g7FracHtml(rational(1,den))+'. Найди вероятность ошибки во всех трёх копиях.',rational(1,den**3)],
  ['Три независимые копии, шанс ошибки одной '+g7FracHtml(rational(1,den))+'. Найди вероятность, что ошибочны ровно две.',rational(3*(den-1),den**3),'Есть три варианта выбора двух ошибочных копий. Для каждого перемножаем вероятности двух ошибок и одного верного значения.'],
  ['Три независимые копии, вероятность ошибки каждой '+g7FracHtml(rational(1,den))+'. Найди вероятность ошибки правила большинства.',rational(3*(den-1)+1,den**3),'Складываем вероятность ровно двух ошибок и вероятность трёх ошибок.']
 ];
 return questions[k];
});
add('probability','prob_likelihood_methods','Как узнать вероятность события','Если все исходы равновозможны, раздели число подходящих исходов на общее число. В опытах с неизвестной вероятностью её оценивают по относительной частоте в большой серии.',
 ({a,b,c,d,k})=>{
 const trials=100*(b+1), successes=a*(b+1);
 const rows=d===0?[
  ['В колоде '+(a+b)+' одинаковых карточек, из них '+a+' красных. Найди вероятность вытянуть красную карточку. Ответ дай дробью.',rational(a,a+b)],
  ['При '+trials+' опытах событие произошло '+successes+' раз. Найди его относительную частоту в процентах.',a],
  ['Нужно оценить вероятность задержки автобуса. Какие данные подойдут?','Статистика наблюдений за автобусом',['Число остановок маршрута','Число букв в названии остановки']]
 ]:d===1?[
  ['В первой серии '+trials+' опытов, во второй столько же. Событие произошло '+successes+' и '+(successes+2*c)+' раз соответственно. Найди общую относительную частоту. Ответ дай дробью.',rational(successes+c,trials)],
  ['В коробке '+(a+b+c)+' жетонов, из них '+a+' красных, '+b+' синих, остальные зелёные. Найди вероятность вынуть жетон, который не зелёный. Ответ дай дробью.',rational(a+b,a+b+c)],
  ['Для события относительная частота '+a+'%. Опыт повторили '+trials+' раз. Сколько раз наблюдали событие?',successes]
 ]:[
  ['В случайной выборке из '+trials+' упаковок '+successes+' с дефектом. Примерно сколько упаковок с дефектом в партии из '+(trials*c)+' штук?',successes*c],
  ['Из '+(a+b)+' равновозможных исходов '+a+' благоприятны. В серии из '+((a+b)*c)+' опытов событие случилось '+(a*c+1)+' раз. На сколько частота превысила вероятность? Ответ дай дробью.',rational(1,(a+b)*c)],
  ['Два опыта дали '+a+' успешных исходов из '+(a+b)+' и '+b+' из '+(a+b+c)+'. Найди общую относительную частоту. Ответ дай дробью.',rational(a+b,2*(a+b)+c)]
 ];
 return rows[k];
});

Object.assign(rules,{
 geo_polygon_angle_sum_intro:{
  rule:'Сумма углов выпуклого n-угольника равна (n − 2) · 180°. Чтобы найти число сторон, раздели сумму на 180° и прибавь 2.',
  build:({a,b,c,d,k})=>{
   const sides=a+2, angleSum=180*a;
   return (d===0?[
    ['Выпуклый многоугольник имеет '+sides+' сторон. Найди сумму его углов.',angleSum],
    ['Сумма внутренних углов выпуклого многоугольника '+angleSum+'°. Сколько у него сторон?',sides],
    ['Из одной вершины выпуклого многоугольника провели все диагонали и получили '+a+' треугольников. Сколько у многоугольника сторон?',sides]
   ]:d===1?[
    ['В четырёхугольнике три угла равны '+(50+a)+'°, '+(70+b)+'° и '+(85+c)+'°. Найди четвёртый угол.',155-a-b-c],
    ['Найди внутренний угол правильного '+sides+'-угольника. При необходимости запиши дробь.',rational(angleSum,sides)],
    ['Один угол выпуклого '+sides+'-угольника равен '+(90+b)+'°. Какова сумма остальных углов?',angleSum-90-b]
   ]:[
    ['Сумма углов одного выпуклого многоугольника '+angleSum+'°, у второго на '+b+' сторон больше. Найди сумму углов второго.',angleSum+180*b],
    ['У правильного '+sides+'-угольника и квадрата по одному углу. На сколько градусов угол первого больше? При необходимости запиши дробь.',rational(angleSum-90*sides,sides)],
    ['Сумма углов одного многоугольника вдвое больше, чем у выпуклого '+sides+'-угольника. Сколько сторон у первого?',2*a+2]
   ])[k];
  }
 },
 functions_x2_x3:{
  rule:'Для y = x² противоположные аргументы дают одинаковые значения. Для y = x³ противоположным аргументам соответствуют противоположные значения.',
  build:({a,b,c,d,k})=>{
   const x=d===0?a:-(a+1), graphX=-(1+a%2);
   return (d===0?[
    ['Для y = x² найди y при x = '+x+'.',x*x],
    ['Для y = x³ найди y при x = −'+x+'.',-(x**3)],
    ['При x = '+x+' чему равна разность значений функций y = x³ и y = x²?',x**3-x*x]
   ]:d===1?[
    ['По графику y = x² найди отрицательную абсциссу точки с ординатой '+graphX**2+'.',graphX],
    ['По графику y = x³ найди абсциссу точки с ординатой '+graphX**3+'.',graphX],
    ['На сколько значение y = x² при x = '+x+' больше значения при x = '+(x+1)+'?',1-2*x]
   ]:[
    ['Найди сумму значений x³ при x = '+x+' и x = '+(-x+b)+'.',x**3+(-x+b)**3],
    ['У точек графика y = x² ординаты равны '+x*x+'. Найди расстояние между точками.',2*Math.abs(x)],
    ['Найди отрицательное целое x, если x² + x³ = '+(x*x+x**3)+'.',x,'Для отрицательных целых x ≤ −2 значение x²(1 + x) строго уменьшается, когда модуль x увеличивается. Подстановка x = '+x+' даёт '+(x*x+x**3)+'.']
   ])[k];
  }
 },
 prob_random_experiment_event:{
  rule:'Исход — один возможный результат опыта, а событие — набор исходов. Достоверному событию подходят все исходы, невозможному — ни одного.',
  build:({a,b,c,d,k})=>{
   const total=a+b+c;
   return (d===0?[
    ['На карточках числа от 1 до '+total+'. Наугад вытягивают одну. Что является одним исходом?','Выпало число '+a+'.',['Выпало чётное число.','Выпало число не больше '+total+'.']],
    ['На карточках числа от 1 до '+total+'. Наугад вытягивают одну. Сколько исходов у опыта?',total],
    ['На карточках числа от 1 до '+total+'. Какое событие невозможно?','Выпало число '+(total+1)+'.',['Выпало число '+a+'.','Выпало число '+(total-1)+'.']]
   ]:d===1?[
    ['На карточках числа от 1 до '+total+'. Сколько различных исходов у события «Выпало число больше '+a+'»?',total-a],
    ['На карточках числа от 1 до '+total+'. Сколько исходов у события «Выпало число, кратное '+b+'»?',Math.floor(total/b)],
    ['На карточках числа от 1 до '+total+'. Сколько исходов принимает событие «выпало число между '+a+' и '+(a+b+1)+', не включая границы»?',b]
   ]:[
    ['Вытягивают карточку с числом от 1 до '+total+'. Сколько исходов у события «Число чётное и не меньше '+a+'»?',Math.floor(total/2)-Math.floor((a-1)/2)],
    ['Вытягивают карточку с числом от 1 до '+total+'. Сколько исходов у события «Число кратно '+b+' или нечётное»?',Math.ceil(total/2)+(b%2===0?Math.floor(total/b):Math.floor(total/(2*b)))],
    ['Вытягивают карточку с числом от 1 до '+total+'. Сколько исходов у события «Число не кратно '+b+' и больше '+a+'»?',total-a-Math.floor(total/b)+Math.floor(a/b)]
   ])[k];
  }
 }
});

const previousQuestion=makeG7Question, previousLesson=g7Lesson;
g7Lesson=function(id){
 const raw=rawCourseId(id),rule=reviewedLessons[raw]||rules[raw]?.rule;
 return rule?'<div class="g6-theory"><h3>Правило</h3><p>'+rule+'</p></div>':previousLesson(id);
};
makeG7Question=function(id,stageOverride=null){
 const raw=rawCourseId(id),topic=rules[raw],tiered=reviewed[raw];
 if(!topic&&!tiered)return previousQuestion(id,stageOverride);
 const d=Math.max(0,Math.min(2,Number.isInteger(stageOverride)?stageOverride:activeDifficulty()));
 if(tiered){
  const [variant,build]=g7Pick(Object.entries(tiered[d]));
  const [text,answer,options,detail]=build({a:ri(3,13),b:ri(2,13),c:ri(3,14),y:ri(2,13)});
  const audit={variant,level:d};
  const sig=g7QuestionSig(raw,d,variant,[text]);
  if(Array.isArray(options))return g7StrictChoice(text,answer,options,detail,sig,audit);
  if(detail==='linear')return g7LinearInput(text,answer,options,sig,audit);
  return g7InputQuestionForRat(text,typeof answer==='number'?rational(answer):answer,options,sig,{audit,
   inputHint:'Введи точное значение. Обыкновенную дробь можно записать через /.'});
 }
 const k=ri(0,2), a=ri(3,13), b=ri(2,13), c=ri(3,14), y=ri(2,13);
 const n=(first,second,third,prefix='')=>{
  const [text,answer,ex]=[first,second,third][k];
  return [prefix+text,answer,ex];
 };
 const [text,answer,options,detail,attach]=topic.build({a,b,c,y,d,k,n});
 const sig=g7QuestionSig(raw,d,'textbook'+k,[a,b,c,y]);
 const audit={variant:'textbook'+k,level:d};
 const explain=(value)=>detail||(typeof options==='string'?options:topic.rule+' Ответ: '+value+'.');
 let question;
 if(Array.isArray(options))question=g7StrictChoice(text,answer,options,explain(answer),sig,audit);
 else if(typeof answer==='object')question=g7Fraction(text,answer,explain(g7FracHtml(answer)),sig,{audit,preferMixed:false});
 else question=g7Number(text,answer,explain(answer),sig,{audit});
 if(attach)return attach(question);
 if(raw==='functions_x2_x3'&&d===1&&k<2)return g7AttachGraph(question,g7PowerFunctionGraph(k+2));
 return question;
};

// The initial Home render precedes the external textbook scripts.
if(!currentGrade){
 const home=document.querySelector('.grade-card button[onclick="openGrade(7)"]')?.closest('.grade-card');
 const progress=home?.querySelector('.grade-summary');
 if(progress)progress.textContent='Пройдено тем: '+gradeCompletedTopics(7)+'/'+g7AllTopics().length+' • этапов: '+g7CompletedStages()+'/'+g7TotalStages();
}
})();
