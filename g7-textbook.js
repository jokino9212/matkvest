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
 equation_word_problems:'Обозначь искомое или удобную для расчёта величину через x. Вырази через x остальные величины и найди в условии равенство. После решения проверь, подходит ли найденное значение.',
 formulas_dependencies:'Формула связывает величины. Чтобы найти значение, подставь известные числа в согласованных единицах. Чтобы выразить одну букву через остальные, выполни одинаковые обратные действия с обеими частями.',
 number_intervals:'Квадратная скобка у границы означает, что граница входит в промежуток. Круглая скобка исключает границу. У бесконечности всегда круглая скобка. На прямой включённая граница отмечена закрашенной точкой.',
 number_line_distance:'Расстояние между точками равно модулю разности их координат. Координата середины отрезка — полусумма координат концов.',
 function_concept_values:'Функция каждому допустимому аргументу ставит в соответствие ровно одно значение. Область определения — множество допустимых аргументов. Разным аргументам может соответствовать одно и то же значение.',
 function_formula_values:'Чтобы найти значение функции, подставь аргумент в формулу. Если известно значение, приравняй к нему формулу и найди аргумент. Проверь, допустим ли он.',
 function_graph_reading:'Чтобы прочитать y по заданному x, двигайся от отметки x вертикально до графика и затем горизонтально к оси Oy. Если задан y, ищи все пересечения графика с горизонталью на этой высоте.',
 coordinate_plane:'Абсцисса x показывает положение по горизонтали, ордината y — по вертикали. Точки оси Ox имеют y = 0, точки оси Oy имеют x = 0.',
 direct_proportionality_function:'Прямая пропорциональность задаётся формулой y = kx, где k ≠ 0. Её график — прямая через начало координат. Если известна точка с x ≠ 0, найди k делением y на x.',
 linear_function:'У функции y = kx + b число b равно ординате пересечения с Oy. Коэффициент k показывает изменение y при увеличении x на 1. При k = 0 график горизонтальный.',
 piecewise_functions:'Для каждого аргумента сначала выбери ветвь по её условию. Особое внимание удели границе: в неё входит ветвь с нестрогим знаком.',
 absolute_value_function:'При x ≥ 0 имеем |x| = x, а при x &lt; 0 имеем |x| = −x. У противоположных аргументов одинаковый модуль. График y = |x| симметричен относительно Oy.',
 natural_power_definition:'Степень aⁿ — произведение n одинаковых множителей a. Чётная степень отрицательного основания положительна, нечётная — отрицательна. Скобки показывают, входит ли минус в основание.',
 power_properties:'При умножении степеней с одинаковым основанием складывай показатели. При делении вычитай показатель делителя из показателя делимого. Для ненулевого a имеем a⁰ = 1.',
 power_product_power:'Чтобы возвести произведение в степень, возведи в неё каждый множитель. При возведении степени в степень показатели перемножаются.',
 monomial_standard_form:'В стандартном виде одночлена числовой множитель записан первым, а каждая буква встречается один раз. Степень ненулевого одночлена равна сумме показателей его букв.',
 monomial_operations:'При умножении одночленов перемножь коэффициенты и сложи показатели одинаковых букв. При возведении одночлена в степень возведи в неё коэффициент и умножь показатели букв на показатель степени.',
 functions_x2_x3:'У y = x² при противоположных x значения совпадают, график симметричен относительно Oy. У y = x³ при противоположных x значения противоположны, график симметричен относительно начала координат.',
 divisibility_factorization:'У простого числа два натуральных делителя: 1 и само число. У составного есть другие делители. Число 1 не относится ни к простым, ни к составным. При разложении составного числа перемножение простых множителей восстанавливает исходное число.',
 polynomial_standard_degree:'Приведи подобные слагаемые и убери нулевые члены. Степень ненулевого многочлена — наибольшая степень среди оставшихся членов.',
 polynomial_add_subtract:'При сложении раскрывай скобки без изменения знаков. При вычитании меняй знак каждого члена вычитаемого многочлена. Затем складывай коэффициенты при одинаковых буквенных частях.',
 monomial_times_polynomial:'Умножь одночлен на каждый член многочлена. В каждом произведении перемножь коэффициенты и сложи показатели одинаковых букв.',
 common_factor:'У числовых коэффициентов найди НОД, а у общей буквы возьми наименьший показатель. Раздели каждый член на общий множитель и запиши частные в скобках.',
 polynomial_times_polynomial:'Умножь каждый член первого многочлена на каждый член второго. Сложи полученные произведения и приведи подобные слагаемые.',
 factorization_grouping:'Сгруппируй слагаемые так, чтобы после вынесения множителей в группах остался одинаковый многочлен в скобках. Затем вынеси этот многочлен как общий множитель.',
 square_sum_difference:'В квадрате суммы или разности крайние члены — квадраты. Средний член равен удвоенному произведению и имеет знак внутри исходной скобки.',
 binomial_cube:'В кубе двучлена коэффициенты формулы идут как 1, 3, 3, 1. В кубе разности знаки чередуются, начиная с плюса.',
 perfect_square_factor:'Проверь квадраты крайних членов и удвоенное произведение в середине. Знак среднего члена определяет знак в двучлене.',
 difference_of_squares:'При умножении суммы на разность средние члены взаимно уничтожаются: (A − B)(A + B) = A² − B².',
 factor_difference_squares:'Представь оба члена квадратами. Тогда A² − B² = (A − B)(A + B). Если у всех членов есть общий множитель, сначала можно вынести его.',
 sum_difference_cubes:'Для суммы кубов используй (A + B)(A² − AB + B²). Для разности кубов используй (A − B)(A² + AB + B²).',
 integer_expression_transform:'Узнай формулу, раскрой скобки и приведи подобные. Если нужно вычислить значение, обычно удобно сначала упростить выражение.',
 combined_factorization:'Сначала проверь общий множитель. Затем ищи формулу или группировку. Если один из полученных множителей ещё раскладывается, продолжи разложение.',
 higher_binomial_power:'Запиши степень как произведение одинаковых скобок. Каждый член получается выбором одного слагаемого из каждой скобки. Коэффициент учитывает, сколькими способами можно сделать такой выбор.',
 linear_equation_two_variables:'Решение уравнения с двумя переменными — пара чисел. Подставь x и y в свои места. Если задана одна координата, найди другую, решив уравнение.',
 linear_equation_two_variables_graph:'График уравнения ax + by = c при ненулевой паре коэффициентов — прямая. Координаты каждой её точки удовлетворяют уравнению. Для пересечения с осью подставь ноль вместо другой координаты.',
 linear_system_concept:'Пара является решением системы, если она удовлетворяет обоим уравнениям одновременно.',
 graphical_equations_systems:'Решение системы находится в точке пересечения графиков. Пересекающиеся прямые дают одно решение, различные параллельные прямые — ни одного, совпадающие — бесконечно много.',
 linear_system_substitution:'Вырази удобную переменную из одного уравнения и подставь во второе. Найди оставшуюся переменную и вернись к первой формуле.',
 linear_system_addition:'Подбери множители, чтобы коэффициенты одной переменной стали противоположными. Сложи уравнения, найди первую координату и подставь её в исходное уравнение.',
 linear_system_word_problems:'Выбери две неизвестные и выпиши два независимых условия. Составь по ним систему, реши её и проверь ответ по смыслу задачи.',
 linear_inequalities_two_variables:'Чтобы проверить точку, подставь её координаты. Точки граничной прямой входят при знаках ≤ и ≥ и исключены при строгих знаках.',
 fraction_word_problems:'Чтобы найти часть от целого, умножь целое на дробь. Чтобы восстановить целое по части, раздели известное значение на дробь. Проверь, от какой величины взята каждая доля.',
 percent_fraction_conversion:'p% означает p сотых. Для перевода процентов в дробь дели на 100. Чтобы записать число в процентах, умножай его на 100 и ставь знак процента.',
 percent_word_problems:'Выясни, какая величина равна 100%. Увеличение на p% означает умножение на 1 + p/100, уменьшение — на 1 − p/100.',
 direct_inverse_proportion:'При прямой пропорциональности отношение y к x постоянно. При обратной постоянно произведение xy. В задачах сначала проверь, какая величина фиксирована.',
 geo_primitives:'Через две различные точки проходит ровно одна прямая. Отрезок AB состоит из точек A, B и всех точек прямой между ними. В обозначении отрезка порядок концов можно менять.',
 geo_field_line:'Чтобы провесить прямую, сначала ставят вехи в двух известных точках. Затем промежуточные вехи выставляют по линии визирования. Между соседними вехами один промежуток.',
 geo_rays:'Луч имеет начало и продолжается в одну сторону. В названии AB первой пишут точку начала A, второй — точку B, задающую направление. Два луча с общим началом и противоположными направлениями образуют прямую.',
 geo_angle:'Угол образован двумя лучами с общим началом. Лучи называются сторонами, их общее начало — вершиной. В обозначении угла тремя буквами вершина стоит посередине.',
 geo_congruent_figures:'Равные фигуры совмещаются при наложении. При этом равны длины соответствующих отрезков и величины соответствующих углов.',
 geo_compare_segments_angles:'При сравнении отрезков совмещают один конец и направляют их по одному лучу. При сравнении углов совмещают вершины и одну сторону. Если вторая сторона одного угла проходит внутри другого, первый меньше.',
 geo_angle_bisector:'Биссектриса — луч, который исходит из вершины и делит угол на два равных угла. На чертеже равные части угла часто отмечают одинаковыми дугами.'
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
function intervalVisual(left,right,leftClosed,rightClosed){
 const interval={left:left===null?null:rational(left),right:right===null?null:rational(right),leftClosed,rightClosed};
 const min=left===null?right-4:Math.min(left-2,(right??left)-4);
 const max=right===null?left+4:Math.max(right+2,(left??right)+4);
 return question=>{
  const attached=g7AttachInterval(question,interval);
  attached.visual.data.min=rational(min);
  attached.visual.data.max=rational(max);
  return attached;
 };
}
function functionTable(rows){
 return question=>g6AttachTable(question,{headers:['Аргумент x','Значение y'],rows});
}
function functionGraph(points,{line=null,range=6}={}){
 const coordinates=points.map(([x,y])=>({x:rational(x),y:rational(y)}));
 const series=line?[g7LineSeries(line[0],line[1],{range})]:[{points:coordinates}];
 return question=>g7AttachGraph(question,g7GraphData(series,{range,caption:'Координатная плоскость'}));
}
function pointVisual(points){
 const marked=points.map(([x,y,label])=>g7PointOnLine(x,0,y,label));
 return question=>g6AttachCoordinatePlane(question,g7GraphData([],{points:marked}));
}
const withVisual=(task,attach)=>task.length===3?[...task,null,attach]:[...task,attach];
const piecewise=(left,right,edge)=>math('f(x) = '+left+' при x &lt; '+fmt(edge)+', а f(x) = '+right+' при x ≥ '+fmt(edge));
const pow=(base,degree)=>base+superscriptInt(degree);
const monomial=(coef,x,y)=>({coef,powers:{x,y}});
function monomialSelect(prompt,answer,wrong,ex){
 return choice(prompt,g7MonomialHtml(answer),wrong.map(g7MonomialHtml),ex);
}
function powerCurve(power){
 return question=>g7AttachGraph(question,g7PowerFunctionGraph(power,{caption:'График функции'}));
}
const xTerm=(coef,degree)=>monomial(coef,degree,0);
const polynomial=(...terms)=>terms.map(([coef,degree])=>xTerm(coef,degree));
const polyChoice=(prompt,correct,options,ex)=>choice(prompt,g7PolynomialHtml(correct),options.map(g7PolynomialHtml),ex);
const parenthesized=terms=>'('+g7PolynomialBodyHtml(terms)+')';
const system=(left,right)=>math('⎧ '+left+'<br>⎩ '+right);
const coordinates=(prompt,x,y,ex,attach)=>[prompt,{x:g6CoordRat(x),y:g6CoordRat(y)},ex,'coordinate',attach];
function systemGraph(lines){
 const series=lines.map(([k,b],i)=>g7LineSeries(k,b,{alt:i>0,label:i?'Вторая прямая':'Первая прямая'}));
 return question=>g7AttachGraph(question,g7GraphData(series,{caption:'Графики уравнений системы'}));
}
const geometryLetters='ABCDEFGHKLMNPQRSTUVXYZ';
const geometryLabels=(a,b)=>Array.from({length:4},(_,i)=>geometryLetters[(4*(a-3)+i+(b-2)*3)%geometryLetters.length]);
function geometryLine(labels,kind='line',offPoint=''){
 const data={kind:'g7-textbook-line',figure:kind,labels,offPoint};
 return question=>g7GeoAttach(question,data,'Отмеченные точки: '+[...labels,offPoint].filter(Boolean).join(', ')+'.');
}
function geometryAngle(labels,angles,{equalArcs=false}={}){
 const data={kind:'g7-textbook-angle',labels,angles,equalArcs};
 return question=>g7GeoAttach(question,data,'Точки '+labels.join(', ')+'.');
}
const originalGeometrySvg=geometrySvg;
geometrySvg=function(data){
 if(data?.kind==='g7-textbook-angle'){
  const center={x:320,y:225},radius=140;
  const sides=data.angles.map((degrees,i)=>{
   const point=g7GeoAnglePoint(center,degrees,radius),end=g7GeoAnglePoint(center,degrees,radius+27);
   return g6GeoLine(center.x,center.y,end.x,end.y,'geo-line')+
    '<polygon fill="currentColor" points="'+g7GeoArrowTip(end,{x:end.x-center.x,y:end.y-center.y})+'"></polygon>'+
    g6GeoPoint(point.x,point.y,data.labels[i+1],degrees>90?-25:10,degrees>15?-10:24);
  }).join('');
  const arcs=data.equalArcs?data.angles.slice(1).map((degrees,i)=>g7GeoArcPath(center,48,data.angles[i],degrees,'geo-guide')).join(''):'';
  return '<div class="geometry-wrap"><svg class="geometry-svg" viewBox="45 25 550 245" role="img" aria-label="Лучи с общей вершиной">'+
   sides+g6GeoPoint(center.x,center.y,data.labels[0],-5,24)+arcs+'</svg></div>';
 }
 if(data?.kind!=='g7-textbook-line')return originalGeometrySvg(data);
 const positions=data.labels.map((label,i)=>({label,x:120+i*125,y:122}));
 const first=positions[0],last=positions.at(-1),left=data.figure==='line'?60:first.x,right=data.figure==='segment'?last.x:580;
 const arrows=[];
 if(data.figure==='line')arrows.push([left,-1]);
 if(data.figure!=='segment')arrows.push([right,1]);
 const arrowHtml=arrows.map(([x,dx])=>'<polygon fill="currentColor" points="'+g7GeoArrowTip({x,y:122},{x:dx,y:0})+'"></polygon>').join('');
 const points=positions.map(({x,y,label})=>g6GeoPoint(x,y,label,-5,-18)).join('');
 const outside=data.offPoint?g6GeoPoint(350,65,data.offPoint,-5,-18):'';
 return '<div class="geometry-wrap"><svg class="geometry-svg" viewBox="0 0 640 205" role="img" aria-label="Геометрический чертёж">'+
  g6GeoLine(left,122,right,122,data.figure==='segment'?'geo-segment':'geo-line')+arrowHtml+points+outside+'</svg></div>';
};

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
 ],
 formulas_dependencies: [
  {
   uniform_speed_formula: ({a,b})=>['Машина ехала '+b+' ч со скоростью '+(5*a)+' км/ч. Найди путь по формуле '+math('s = vt')+' (в км).',5*a*b,
    'Подставляем скорость и время: s = '+(5*a)+' · '+b+' = '+5*a*b+' км.'],
   use_perimeter_formula: ({a,b})=>['Прямоугольник со сторонами '+a+' см и '+b+' см. Найди его периметр по формуле '+math('P = 2(a + b)')+' (в см).',2*(a+b),
    'Сначала складываем стороны: '+a+' + '+b+' = '+(a+b)+'. Удваиваем сумму: '+2*(a+b)+' см.'],
   temperature_formula: ({a,b})=>['Переведи '+5*(a+b)+' °C в градусы Фаренгейта по формуле '+math('F = 1,8C + 32')+'.',9*(a+b)+32,
    'F = 1,8 · '+5*(a+b)+' + 32 = '+9*(a+b)+' + 32 = '+(9*(a+b)+32)+' °F.'],
   formula_meaning: ({a,b})=>choice('Для '+a+' прямоугольников со сторонами x и y и '+b+' прямоугольников со сторонами x и z какая формула даёт суммарную площадь?',
    math('S = '+a+'xy + '+b+'xz'),[math('S = '+(a+b)+'xyz'),math('S = '+a+'xy − '+b+'xz'),math('S = '+a+'x + '+b+'z')],
    'Площадь одного прямоугольника равна произведению сторон. Умножаем каждую площадь на количество и складываем.')
  },
  {
   recover_rectangle_side: ({a,b})=>['Площадь прямоугольника '+a*b+' см², одна сторона '+a+' см. Найди вторую сторону (в см) по формуле '+math('S = ab')+'.',b,
    'Из S = ab получаем b = S : a. Подставляем: '+a*b+' : '+a+' = '+b+' см.'],
   express_height: ({a})=>choice('В формуле объёма '+math('V = '+a+'Sh')+', где S &gt; 0, вырази h.',
    'h = '+frac('V',a+'S'),['h = '+frac(a+'V','S'),'h = '+frac('S',a+'V'),math('h = '+a+'SV')],
    'Делим обе части равенства на '+a+'S.'),
   formula_with_units: ({a,b})=>['Объём прямоугольного ящика равен '+math('V = abc')+'. Длины сторон '+a+' дм, '+b+' см и 10 см. Вычисли объём в см³.',
    100*a*b,'Переводим '+a+' дм в '+10*a+' см. Умножаем: '+10*a+' · '+b+' · 10 = '+100*a*b+' см³.'],
   reverse_temperature: ({a})=>['Температура '+(32+9*a)+' °F. Сколько это градусов Цельсия, если '+math('F = 1,8C + 32')+'?',5*a,
    'Вычитаем 32: 1,8C = '+9*a+'. Делим на 1,8 и получаем '+5*a+' °C.']
  },
  {
   express_from_perimeter: ({a,b})=>choice('В формуле '+math('P = 2(x + '+a+') + '+b)+' вырази x.',
    'x = '+frac('P − '+b,2)+' − '+a,['x = '+frac('P',2)+' − '+a+' − '+b,'x = '+frac('P + '+b,2)+' − '+a,'x = '+frac('P − '+b,2)+' + '+a],
    'Вычитаем '+b+' из обеих частей, делим на 2, затем вычитаем '+a+'.'),
   rectangle_percent_change: ({a,b})=>{
    const answer=rational(100*(a+b)+a*b,100);
    return ['Длину прямоугольника увеличили на '+a+'%, ширину — на '+b+'%. На сколько процентов увеличилась площадь?',answer,
     'Площадь меняется в '+frac(100+a,100)+' · '+frac(100+b,100)+' раза. Вычитаем 1 и умножаем на 100%. Прирост '+exact(answer)+'%.'];
   },
   reverse_unit_consumption: ({a,b,c})=>['Площадь четырёх стен комнаты без учёта проёмов равна '+math('S = 2(l + w)h')+'. Площадь стен '+2*(a+b)*c+' м², высота '+c+' м, ширина '+b+' м. Найди длину комнаты в метрах.',a,
    'Выражаем l: делим S на 2h и вычитаем w. Получаем '+2*(a+b)*c+' : '+2*c+' − '+b+' = '+(a+b)+' − '+b+' = '+a+' м.'],
   combine_formulas: ({a,b,c,y})=>['В двух ёмкостях '+a+' л и '+b+' л раствора. В первом '+c+' г соли на литр, во втором '+y+' г на литр. Найди концентрацию полученной смеси в г/л.',
    rational(a*c+b*y,a+b),'Масса соли: '+a+' · '+c+' + '+b+' · '+y+' = '+(a*c+b*y)+' г. Общий объём '+(a+b)+' л.<br>Делим массу на объём и получаем '+exact(rational(a*c+b*y,a+b))+' г/л.']
  }
 ],
 number_intervals: [
  {
   right_ray_notation: ({a,b})=>choice('Запиши промежутком '+math('x &gt; '+fmt(a-b))+'.',
    '('+fmt(a-b)+'; +∞)',['['+fmt(a-b)+'; +∞)','(−∞; '+fmt(a-b)+')','(−∞; '+fmt(a-b)+']'],
    'Берём числа правее '+fmt(a-b)+'. Граница исключена, так как знак строгий.'),
   left_ray_notation: ({a,b})=>choice('Запиши промежутком '+math('x ≤ '+fmt(b-a))+'.',
    '(−∞; '+fmt(b-a)+']',['(−∞; '+fmt(b-a)+')','['+fmt(b-a)+'; +∞)','('+fmt(b-a)+'; +∞)'],
    'Берём числа левее '+fmt(b-a)+' и саму границу.'),
   open_boundary: ({a,b,c})=>{
    const closed=c%2===0;
    return checkStatement('Входит ли '+a+' в промежуток '+(closed?'[':'(')+a+'; '+(a+b)+']?',closed,
     (closed?'Квадратная скобка слева включает число ':'Круглая скобка слева исключает число ')+a+'.');
   },
   identify_endpoint: ({a,b})=>choice('Какая из границ входит в ['+fmt(-a)+'; '+b+')?',fmt(-a),[String(b),'Обе границы','Ни одна'],
    'Левая скобка квадратная, правая круглая, поэтому входит только '+fmt(-a)+'.')
  },
  {
   mixed_bounded_notation: ({a,b})=>choice('Запиши промежутком '+math(fmt(-a)+' &lt; x ≤ '+b)+'.',
    '('+fmt(-a)+'; '+b+']',['['+fmt(-a)+'; '+b+']','('+fmt(-a)+'; '+b+')','['+fmt(-a)+'; '+b+')'],
    'Нижняя граница исключается, верхняя включается.'),
   decode_marked_ray: ({a,b})=>{
    const edge=a-b,correct='x ≥ '+fmt(edge);
    return ['Какое неравенство задаёт изображённый луч?',correct,['x &gt; '+fmt(edge),'x ≤ '+fmt(edge),'x &lt; '+fmt(edge)],
     'Точка закрашена, луч идёт вправо. Значит, x больше границы или равно ей.',intervalVisual(edge,null,true,false)];
   },
   decode_marked_segment: ({a,b})=>{
    const left=1-a,right=b-1,correct='['+fmt(left)+'; '+right+')';
    return ['Как записать изображённый промежуток?',correct,['('+fmt(left)+'; '+right+')','['+fmt(left)+'; '+right+']','('+fmt(left)+'; '+right+']'],
     'Левая точка закрашена, правая пустая. Включаем только левую границу.',intervalVisual(left,right,true,false)];
   },
   decimal_boundary: ({a,b,c})=>{
    const left=a/10,right=(a+b)/10,test=(a+b-c%2)/10,truth=test<right;
    return checkStatement('Принадлежит ли '+fmt(test)+' промежутку ['+fmt(left)+'; '+fmt(right)+')?',truth,
     'Нужны числа от '+fmt(left)+' включительно до '+fmt(right)+' строго. '+(truth?'Число проходит оба сравнения.':'Число равно исключённой правой границе.'));
   }
  },
  {
   count_integer_points: ({a,b})=>['Сколько целых чисел принадлежит ('+fmt(-a)+'; '+b+']?',a+b,
    'Первое подходящее целое число '+fmt(1-a)+', последнее '+b+'. Их '+b+' − ('+fmt(1-a)+') + 1 = '+(a+b)+'.'],
   fraction_membership: ({a,b,c})=>{
    const lower=rational(a,b),upper=rational(a+2,b),value=rational(2*a+c%4,2*b);
    const truth=rationalCmp(lower,value)<0&&rationalCmp(value,upper)<=0;
    return checkStatement('Принадлежит ли '+g7FracHtml(value)+' промежутку ('+g7FracHtml(lower)+'; '+g7FracHtml(upper)+']?',truth,
     'При знаменателе '+2*b+' нужно, чтобы числитель был больше '+2*a+' и не больше '+(2*a+4)+'. Проверяем числитель '+(2*a+c%4)+'.');
   },
   overlapping_requirements: ({a,b,c})=>{
    const upper=a+b+c,lower=a+b;
    return choice('Какой промежуток одновременно удовлетворяет '+math(a+' ≤ x &lt; '+upper)+' и '+math('x &gt; '+lower)+'?',
     '('+lower+'; '+upper+')',['['+lower+'; '+upper+')','('+a+'; '+upper+')','('+lower+'; '+upper+']'],
     'Из первого условия сохраняем верхнюю границу '+upper+'. Второе условие даёт более строгую нижнюю границу '+lower+'. Обе границы исключены.');
   },
   explain_left_endpoint: ({a,b})=>{
    const left=-a,right=b,correct=fmt(left);
    return ['Какое целое число является наименьшим среди показанных на промежутке?',correct,[fmt(left-1),fmt(left+1),String(right)],
     'Левая граница '+fmt(left)+' закрашена и входит в промежуток. Все остальные числа правее.',intervalVisual(left,right,true,false)];
   }
  }
 ],
 number_line_distance: [
  {
   positive_points: ({a,b})=>['На координатной прямой A('+a+'), B('+(a+b)+'). Найди AB.',b,
    'Вычитаем меньшую координату из большей: '+(a+b)+' − '+a+' = '+b+'.'],
   negative_points: ({a,b})=>['Найди расстояние от '+fmt(-a-b)+' до '+fmt(-a)+'.',b,
    'Вычитаем: '+fmt(-a)+' − ('+fmt(-a-b)+') = '+b+'.'],
   opposite_sides: ({a,b})=>['На координатной прямой A('+fmt(-a)+'), B('+b+'). Найди AB.',a+b,
    'Точки по разные стороны нуля. Складываем расстояния до нуля: '+a+' + '+b+' = '+(a+b)+'.'],
   distance_to_origin: ({a})=>['Найди расстояние от точки с координатой '+fmt(-a/10)+' до нуля.',rational(a,10),
    'Расстояние до нуля равно модулю координаты: '+fmt(a/10)+'.']
  },
  {
   decimal_coordinates: ({a,b,c})=>['Найди расстояние от '+fmt(a/10)+' до '+fmt((a+b+c)/10)+'.',rational(b+c,10),
    'Из большей координаты вычитаем меньшую: '+fmt((a+b+c)/10)+' − '+fmt(a/10)+' = '+fmt((b+c)/10)+'.'],
   one_side_coordinate: ({a,b})=>['Точка B левее A('+a+') на '+b+' единиц. Найди координату B.',a-b,
    'Движение влево уменьшает координату. '+a+' − '+b+' = '+fmt(a-b)+'.'],
   two_equidistant_points: ({a,b})=>choice('Какие точки удалены от '+a+' ровно на '+b+' единиц?',
    fmt(a-b)+' и '+(a+b),[fmt(a-b)+' и '+(a+b+1),a+' и '+(a+b),fmt(a-b-1)+' и '+(a+b)],
    'От '+a+' можно отложить '+b+' единиц влево или вправо.'),
   midpoint_coordinate: ({a,b})=>['Найди координату середины отрезка с концами '+fmt(-a)+' и '+b+'.',rational(b-a,2),
    'Координата середины равна полусумме: ('+fmt(-a)+' + '+b+') : 2 = '+exact(rational(b-a,2))+'.']
  },
  {
   midpoint_distance: ({a,b,c,y})=>{
    const midFirst=rational(-a+b,2),midSecond=rational(2*c+y,2);
    const answer=g6AbsRat(rationalSub(midSecond,midFirst));
    return ['На координатной прямой концы первого отрезка имеют координаты '+fmt(-a)+' и '+b+', второго — '+c+' и '+(c+y)+'. Найди расстояние между серединами отрезков.',
     answer,'Первая середина '+exact(midFirst)+'. Вторая середина '+exact(midSecond)+'. Модуль их разности равен '+exact(answer)+'.'];
   },
   fraction_coordinates: ({a,b,c})=>{
    const denominator=b*(b+1),answer=rational(a*(b+1)+c*b,denominator);
    return ['Найди расстояние от −'+frac(a,b)+' до '+frac(c,b+1)+'.',answer,
     'Точки по разные стороны нуля. Складываем модули, приведя дроби к знаменателю '+denominator+'. Получаем '+g7FracHtml(answer)+'.'];
   },
   from_midpoint_and_end: ({a,b,c})=>['Середина отрезка имеет координату '+b+'. Один конец имеет координату '+fmt(-a)+'. На каком расстоянии от второго конца находится точка '+fmt(-c)+'?',2*b+a+c,
    'Координата второго конца '+2*b+' − ('+fmt(-a)+') = '+(2*b+a)+'. До точки '+fmt(-c)+' расстояние '+(2*b+a+c)+'.'],
   compare_point_distances: ({a,b,c})=>compare('На прямой A('+fmt(-a)+'), B('+b+'), C('+(b+c)+'). Сравни расстояния AB и BC.',
    rational(a+b),rational(c),'AB = '+b+' − ('+fmt(-a)+'), BC = '+(b+c)+' − '+b+'.')
  }
 ],
 function_concept_values: [
  {
   choose_argument: ({a,b})=>choice('Путь задан формулой '+math('s = '+(a+b)+'t')+'. Что здесь аргумент?',
    'Время t',['Путь s','Скорость '+(a+b),'Число 0'],
    'Время выбирают, а путь вычисляют для выбранного времени. Поэтому t — независимая переменная.'),
   one_output: ({a,b})=>checkStatement('Правило сопоставляет каждому числу x число '+math(a+'x + '+b)+'. Задаёт ли это правило функцию?',true,
    'Для каждого x умножение на '+a+' и прибавление '+b+' дают единственный результат.'),
   read_function_value: ({a,b,c})=>['По таблице найди значение функции при x = '+b+'.',a*b+c,
    'В строке с x = '+b+' записано y = '+(a*b+c)+'.',null,functionTable([[b-1,a*(b-1)+c],[b,a*b+c],[b+1,a*(b+1)+c]])],
   interpret_function_notation: ({a,b})=>choice('Что означает '+math('f('+a+') = '+b)+'?',
    'Значение функции при x = '+a+' равно '+b,['Значение функции при x = '+b+' равно '+a,'Функция принимает только значение '+b,'Аргумент всегда равен '+a],
    'В скобках стоит аргумент. Справа после знака равенства указано соответствующее значение.')
  },
  {
   reverse_table: ({a,b,c})=>['По таблице найди аргумент, при котором y = '+(a*(b+1)+c)+'.',b+1,
    'Находим нужное значение y и читаем x в той же строке: x = '+(b+1)+'.',null,functionTable([[b,a*b+c],[b+1,a*(b+1)+c],[b+2,a*(b+2)+c]])],
   conflicting_outputs: ({a,b,c})=>[
    ...checkStatement('Задаёт ли таблица функцию y от x?',false,
     'Одному аргументу '+a+' соответствуют разные значения '+b+' и '+(b+c)+'.'),
    functionTable([[a,b],[a,b+c],[a+1,c]])
   ],
   input_constraints: ({a,b})=>choice('Число x — количество купленных билетов. Можно купить от 0 до '+(a+b)+' билетов. Какие x входят в область определения общей стоимости?',
    'Целые числа от 0 до '+(a+b),['Все числа от 0 до '+(a+b),'Все целые числа','Только положительные числа'],
    'Билет покупают целиком. Число купленных билетов начинается с 0 и ограничено числом '+(a+b)+'.'),
   remainder_rule: ({a,b,c})=>{
    const n=a*b+c,answer=n%b;
    return ['Функция сопоставляет натуральному числу n остаток от деления на '+b+'. Найди значение при n = '+n+'.',answer,
     'Записываем '+n+' = '+b+' · '+Math.floor(n/b)+' + '+answer+'. Остаток равен '+answer+'.'];
   }
  },
  {
   same_output_allowed: ({a,b,c})=>choice('Может ли таблица задавать функцию y от x?', 'Да, каждому x соответствует одно y',
    ['Нет, одинаковые y запрещены','Нет, должно быть только одно значение x','Да, но только если y строго возрастает'],
    'У всех аргументов есть по одному значению. Совпадение y у разных аргументов допустимо.').concat(functionTable([[a,b],[a+1,b+c],[a+2,b]])),
   all_matching_inputs: ({a,b,c})=>choice('Найди все аргументы, при которых y = '+b+'.',
    a+' и '+(a+2),[String(a),String(a+2),(a+1)+' и '+(a+2)],
    'Значение '+b+' встречается дважды, при x = '+a+' и x = '+(a+2)+'.').concat(functionTable([[a,b],[a+1,b+c],[a+2,b]])),
   distinguish_domain_values: ({a,b,c})=>choice('Определи множество значений y, записанных в таблице.',
    b+' и '+(b+c),[a+', '+(a+1)+' и '+(a+2),b+', '+(b+c)+' и '+(b+2*c),String(b)],
    'Смотрим только на столбец y. В нём два различных числа.').concat(functionTable([[a,b],[a+1,b+c],[a+2,b]])),
   complete_consistent_table: ({a,b,c})=>['В таблице требуется восстановить пропуск так, чтобы каждому аргументу соответствовало единственное значение. Какое y нужно записать?',
    b+c,'Аргумент '+a+' уже встречается в первой строке, его значение '+(b+c)+'.',null,functionTable([[a,b+c],[a+1,b],[a,'?']])]
  }
 ],
 function_formula_values: [
  {
   affine_at_positive: ({a,b,c})=>['Для '+math('f(x) = '+a+'x + '+b)+' найди f('+c+').',a*c+b,
    'Подставляем '+c+': '+a+' · '+c+' + '+b+' = '+(a*c+b)+'.'],
   square_at_negative: ({a,b})=>['Для '+math('f(x) = x² + '+b)+' найди f('+fmt(-a)+').',a*a+b,
    'Квадрат (−'+a+')² равен '+a*a+'. Прибавляем '+b+' и получаем '+(a*a+b)+'.'],
   zero_argument: ({a,b})=>['Для '+math('g(x) = '+a+' − '+b+'x')+' найди g(0).',a,
    'Произведение '+b+' · 0 равно 0. Остаётся '+a+'.'],
   choose_substitution: ({a,b,c})=>choice('Для '+math('f(t) = '+a+' − '+b+'t')+' какое выражение даёт f('+fmt(-c)+')?',
    math(a+' − '+b+' · (−'+c+')'),[math(a+' − '+b+' · '+c),math('−'+a+' − '+b+' · (−'+c+')'),math(a+' + '+b+' · (−'+c+')')],
    'Вместо t подставляем (−'+c+'), а знак вычитания в формуле сохраняем.')
  },
  {
   fractional_argument: ({a,b,c})=>['Пусть '+math('f(x) = '+b+'x − '+c)+'. Найди f('+g7FracHtml(rational(a,b))+').',a-c,
    'После подстановки '+b+' · '+frac(a,b)+' − '+c+' = '+a+' − '+c+' = '+fmt(a-c)+'.'],
   evaluate_two_arguments: ({a,b,c,y})=>['При '+math('f(x) = '+a+'x − '+b)+' вычисли f('+c+') − f('+fmt(-y)+').',a*(c+y),
    'Значения равны '+fmt(a*c-b)+' и '+fmt(-a*y-b)+'. Их разность: '+fmt(a*c-b)+' − ('+fmt(-a*y-b)+') = '+a*(c+y)+'.'],
   nonlinear_decimal: ({a,b,c})=>['Для '+math('f(x) = x² − '+a+'x + '+b)+' вычисли f('+fmt(-c/10)+').',
    rational(c*c+10*a*c+100*b,100),
    'Квадрат аргумента равен '+fmt(c*c/100)+', а слагаемое −'+a+'x равно '+fmt(a*c/10)+'. Складываем оба числа и '+b+'.'],
   function_with_denominator: ({a,b,c})=>['Для '+math('g(x) = ')+frac(a,'x + '+b)+' найди g('+c+').',rational(a,b+c),
    'В знаменателе '+c+' + '+b+' = '+(b+c)+'. Значение функции равно '+g7FracHtml(rational(a,b+c))+'.']
  },
  {
   solve_for_argument: ({a,b,c})=>['При каком x функция '+math('f(x) = '+a+'x − '+b)+' принимает значение '+c+'?',rational(b+c,a),
    'Приравниваем '+a+'x − '+b+' к '+c+'. После прибавления '+b+' получаем '+a+'x = '+(b+c)+'. Делим на '+a+'.'],
   two_outputs_equal: ({a,b,c})=>['При каком x совпадут значения '+math('f(x) = '+a+'x + '+b)+' и '+math('g(x) = '+(a+c)+'x − '+b)+'?',rational(2*b,c),
    'Из '+a+'x + '+b+' = '+(a+c)+'x − '+b+' получаем '+c+'x = '+2*b+'. Делим на '+c+'.'],
   two_square_arguments: ({a,b})=>choice('Какие x дают '+math('f(x) = '+(a*a+b))+' для '+math('f(x) = x² + '+b)+'?',
    fmt(-a)+' и '+a,[String(a),fmt(-a),fmt(-a-1)+' и '+(a+1)],
    'Вычитаем '+b+' и получаем x² = '+a*a+'. Подходят оба числа с модулем '+a+'.'),
   shifted_arguments: ({a,b,c})=>['Для '+math('f(x) = '+a+'x + '+b)+' найди x, если f(x + 1) + f(x − 1) = '+(2*a*c+2*b)+'.',c,
    'Сумма равна '+a+'(x + 1) + '+a+'(x − 1) + '+2*b+' = '+2*a+'x + '+2*b+'. После вычитания '+2*b+' получаем '+2*a+'x = '+2*a*c+'. Значит, x = '+c+'.']
  }
 ],
 function_graph_reading: [
  {
   read_ordinate: ({a,b})=>{
    const x=a%5+1,y=b%5+1;
    return withVisual(['По графику найди y при x = '+x+'.',y,'Находим x = '+x+' на оси Ox. У графика на этой вертикали ордината '+y+'.'],
     functionGraph([[0,0],[x,y],[6,y]]));
   },
   read_abscissa: ({a,b})=>{
    const x=a%4+1,y=b%4+1;
    return withVisual(['По графику найди x, при котором y = '+y+'.',x,'Горизонталь y = '+y+' пересекает график при x = '+x+'.'],
     functionGraph([[0,0],[x,y],[6,y+1]]));
   },
   read_y_intercept: ({a,b})=>{
    const offset=a%5-2,slope=b%2?1:-1;
    return withVisual(['Каково значение функции при x = 0?',offset,'График пересекает ось Oy в точке с ординатой '+fmt(offset)+'.'],
     functionGraph([],{line:[slope,offset]}));
   },
   graph_membership: ({a,b})=>{
    const x=a%4+1,truth=b%2===0,y=x+Number(!truth);
    return withVisual(checkStatement('Принадлежит ли точка ('+x+'; '+y+') графику?',truth,
     'На графике при x = '+x+' ордината равна '+x+'.'),functionGraph([],{line:[1,0]}));
   }
  },
  {
   read_difference_on_graph: ({a,b,c})=>{
    const left=a%4+1,right=b%4+1,middle=c%4+1,answer=right-left;
    return withVisual(['По графику вычисли f(4) − f(−4).',answer,'Читаем f(4) = '+right+' и f(−4) = '+left+'. Разность '+fmt(answer)+'.'],
     functionGraph([[-4,left],[0,middle],[4,right]]));
   },
   find_two_zeros: ({a,b})=>{
    const left=-(a%4+1),right=b%4+1;
    return withVisual(choice('При каких значениях x показанная функция равна нулю?',fmt(left)+' и '+right,
     [fmt(left-1)+' и '+right,fmt(left)+' и '+(right+1),String(right)],
     'В точках пересечения с Ox значение y равно 0. Абсциссы этих точек '+fmt(left)+' и '+right+'.'),
     functionGraph([[left-1,-2],[left,0],[0,2],[right,0],[right+1,-2]]));
   },
   constant_segment: ({a,b})=>{
    const x=a%3+1,y=b%3+1;
    return withVisual(choice('На каком отрезке показанная функция постоянна?', '['+fmt(-x)+'; '+x+']',
     ['[−5; '+fmt(-x)+']','['+x+'; 5]','[−5; 5]'],'Горизонтальный участок идёт от x = '+fmt(-x)+' до x = '+x+'.'),
     functionGraph([[-5,y-2],[-x,y],[x,y],[5,y+2]]));
   },
   increasing_or_decreasing: ({a,b})=>{
    const slope=b%2===0?1:-1,offset=a%3-1;
    return withVisual(choice('Как меняется y при увеличении x на показанном графике?',slope>0?'Увеличивается':'Уменьшается',
     [slope>0?'Уменьшается':'Увеличивается','Остаётся постоянным'],'Идём по графику слева направо. Точки становятся '+(slope>0?'выше.':'ниже.')),
     functionGraph([],{line:[slope,offset]}));
   }
  },
  {
   all_level_intersections: ({a,b})=>{
    const x=a%3+1,y=b%3+1;
    return withVisual(choice('При каких x значение функции равно '+y+'?',fmt(-x)+' и '+x,
     [fmt(-x),String(x),fmt(-x-1)+' и '+(x+1)],'Горизонталь y = '+y+' пересекает ломаную в двух точках. Их абсциссы '+fmt(-x)+' и '+x+'.'),
     functionGraph([[-x-1,y-1],[-x,y],[0,y+2],[x,y],[x+1,y-1]]));
   },
   argmax_on_piecewise_graph: ({a,b})=>{
    const x=a%4+1,y=b%3+3;
    return withVisual(['При каком x показанная функция достигает наибольшего значения?',x,
     'Самая высокая точка имеет ординату '+y+'. Её абсцисса равна '+x+'.'],
     functionGraph([[-5,0],[-1,y-1],[x,y],[6,1]]));
   },
   range_of_shown_graph: ({a,b})=>{
    const min=-(a%4+1),max=b%4+1,correct='['+fmt(min)+'; '+max+']';
    return withVisual(choice('Какое множество значений имеет показанная функция?',correct,
     ['[−5; 5]','('+fmt(min)+'; '+max+')','['+fmt(min+1)+'; '+max+']'],
     'Минимальное значение y равно '+fmt(min)+', максимальное '+max+'. Все промежуточные значения есть на ломаной.'),
     functionGraph([[-5,min],[0,max],[5,1]]));
   },
   positive_x_span: ({a,b})=>{
    const left=-(a%4+2),right=b%4+1;
    return withVisual(choice('При каких x на рисунке функция принимает положительные значения?', '('+fmt(left)+'; '+right+')',
     ['['+fmt(left)+'; '+right+']','['+fmt(left-1)+'; '+fmt(left)+')','('+right+'; '+(right+1)+']'],
     'Функция положительна над осью Ox. В точках с абсциссами '+fmt(left)+' и '+right+' она равна нулю, поэтому границы исключены.'),
     functionGraph([[left-1,-1],[left,0],[0,3],[right,0],[right+1,-1]]));
   }
  }
 ],
 coordinate_plane: [
  {
   read_point_positive: ({a,b})=>{
    const x=a%5+1,y=b%5+1;
    return ['Введи координаты точки A.',{x:rational(x),y:rational(y)},'По горизонтали x = '+x+', по вертикали y = '+y+'.','coordinate',pointVisual([[x,y,'A']])];
   },
   identify_x_axis: ({a,b})=>choice('Какая точка лежит на Ox?', '('+a+'; 0)',['(0; '+a+')','('+a+'; '+b+')','('+b+'; '+a+')'].filter((label,i,list)=>list.indexOf(label)===i),
    'У точек на Ox ордината равна нулю.'),
   identify_y_axis: ({a,b})=>choice('Какая точка лежит на Oy?', '(0; '+b+')',['('+b+'; 0)','('+a+'; '+(b+1)+')','('+a+'; '+b+')'],
    'У точек на Oy абсцисса равна нулю.'),
   read_one_coordinate: ({a,b})=>{
    const x=-(a%4+1),y=b%4+1;
    return withVisual(['Найди абсциссу точки B.',x,'Абсциссу читаем по горизонтальной оси: '+fmt(x)+'.'],pointVisual([[x,y,'B']]));
   }
  },
  {
   read_negative_point: ({a,b})=>{
    const x=-(a%5+1),y=-(b%5+1);
    return ['Введи координаты точки B.',{x:rational(x),y:rational(y)},
     'Точка находится левее Oy и ниже Ox. Её координаты ('+fmt(x)+'; '+fmt(y)+').','coordinate',pointVisual([[x,y,'B']])];
   },
   choose_quadrant: ({a,b,c})=>{
    const x=a%4+1,y=b%4+1,points=[[x,y],[-x,y],[-x,-y],[x,-y]],index=c%4;
    return withVisual(choice('В какой четверти расположена точка A?', ['I','II','III','IV'][index],['I','II','III','IV'].filter((_,i)=>i!==index),
     'Знаки координат точки: x '+(points[index][0]>0?'&gt;':'&lt;')+' 0, y '+(points[index][1]>0?'&gt;':'&lt;')+' 0.'),
     pointVisual([[...points[index],'A']]));
   },
   compare_point_ordinates: ({a,b})=>{
    const x=a%4+1,y=b%5-2;
    return withVisual(compare('Сравни ординату точки A с ординатой точки B.',rational(y),rational(-y),'Сравниваем высоты точек, а не положение по горизонтали.'),
     pointVisual([[x,y,'A'],[-x,-y,'B']]));
   },
   line_through_two_points: ({a,b})=>{
    const x=a%3+1,y=b%4+1;
    return withVisual(choice('Как расположена прямая AB?', 'Параллельна Ox',['Параллельна Oy','Проходит через начало координат','Наклонена к обеим осям'],
     'У A и B одинаковая ордината '+y+'. Поэтому прямая через них горизонтальная.'),pointVisual([[-x,y,'A'],[x,y,'B']]));
   }
  },
  {
   point_on_both_grid_lines: ({a,b})=>{
    const x=-(a%5+1),y=b%5+1;
    return ['Найди точку пересечения вертикали через A и горизонтали через B.',{x:rational(x),y:rational(y)},
     'У вертикали абсцисса A, то есть '+fmt(x)+'. У горизонтали ордината B, то есть '+y+'.','coordinate',pointVisual([[x,-y,'A'],[-x,y,'B']])];
   },
   midpoint_on_plane: ({a,b})=>{
    const x=-(a%3+1),y=b%3+1;
    return ['Найди координаты середины AB.',{x:rational(x+1),y:rational(y-1)},
     'Берём полусуммы координат: x = ('+fmt(x)+' + ('+fmt(x+2)+')) : 2 = '+fmt(x+1)+', y = ('+y+' + ('+fmt(y-2)+')) : 2 = '+fmt(y-1)+'.',
     'coordinate',pointVisual([[x,y,'A'],[x+2,y-2,'B']])];
   },
   reflect_across_Oy: ({a,b})=>{
    const x=a%5+1,y=-(b%5+1);
    return ['Найди координаты точки, симметричной A относительно Oy.',{x:rational(-x),y:rational(y)},
     'При отражении относительно Oy меняется знак абсциссы, ордината сохраняется.','coordinate',pointVisual([[x,y,'A']])];
   },
   rectangle_fourth_point: ({a,b})=>{
    const x=a%4+1,y=b%4+1;
    return ['A, B, C — последовательные вершины прямоугольника со сторонами, параллельными осям. Введи координаты D.',
     {x:rational(x),y:rational(-y)},'Точка D должна лежать на горизонтали через A и вертикали через C. Значит, D('+x+'; '+fmt(-y)+').',
     'coordinate',pointVisual([[-x,-y,'A'],[-x,y,'B'],[x,y,'C']])];
   }
  }
 ],
 direct_proportionality_function: [
  {
   origin_property: ({a})=>choice('Через какую точку проходит график '+math('y = '+a+'x')+'?',
    '(0; 0)',['(0; '+a+')','('+a+'; 0)','(1; 0)'],'При x = 0 произведение равно 0.'),
   formula_from_description: ({a})=>choice('Величина y прямо пропорциональна x, коэффициент равен '+fmt(-a)+'. Выбери формулу.',
    math('y = −'+a+'x'),[math('y = '+a+'x'),math('y = x − '+a),math('y = x : '+a)],
    'Подставляем отрицательный коэффициент k в y = kx.'),
   compute_output: ({a,b})=>['Для '+math('y = '+a+'x')+' найди y при x = '+fmt(-b)+'.',-a*b,
    'Умножаем '+a+' на (−'+b+'): y = '+fmt(-a*b)+'.'],
   read_k_at_one: ({a,b})=>{
    const k=(a%2+1)*(b%2===0?1:-1);
    return withVisual(['Найди коэффициент k по графику прямой пропорциональности.',k,'При x = 1 ордината равна k. По графику y = '+fmt(k)+'.'],
     functionGraph([],{line:[k,0]}));
   }
  },
  {
   coefficient_from_point: ({a,b,c})=>{
    const k=rational((c%2===0?-1:1)*a,b);
    return ['График '+math('y = kx')+' проходит через ('+b+'; '+fmt(k.n*b/k.d)+'). Найди k.',k,
     'Коэффициент равен y : x. Подстановка даёт '+g7FracHtml(k)+'.'];
   },
   membership_check: ({a,b,c})=>{
    const truth=c%2===0,y=-a*b+Number(!truth);
    return checkStatement('Лежит ли точка ('+b+'; '+fmt(y)+') на графике '+math('y = −'+a+'x')+'?',truth,
     'При x = '+b+' функция даёт y = '+fmt(-a*b)+'. Сравниваем с ординатой '+fmt(y)+'.');
   },
   find_negative_input: ({a,b})=>['Для '+math('y = −'+a+'x')+' найди x, если y = '+a*b+'.',-b,
    'Из −'+a+'x = '+a*b+' делением на (−'+a+') получаем x = '+fmt(-b)+'.'],
   spot_proportional_formula: ({a,b})=>choice('Какая зависимость является прямой пропорциональностью?',
    math('y = '+a+'x'),[math('y = '+a+'x + '+b),math('y = '+a+' + x'),math('y = x²')],
    'В прямой пропорциональности y равно произведению постоянного ненулевого коэффициента и x.')
  },
  {
   coefficient_from_fractional_x: ({a,b})=>{
    const k=rational(-2*b,a);
    return ['График прямой пропорциональности содержит точку с x = '+fmt(-a/2)+', y = '+b+'. Найди k.',k,
     'Коэффициент k = y : x = '+b+' : ('+fmt(-a/2)+') = '+g7FracHtml(k)+'.'];
   },
   recover_another_point: ({a,b,c})=>['График прямой пропорциональности проходит через A('+a+'; '+a*b+'). Чему равна абсцисса точки B, если её ордината '+fmt(-c*b)+'?',-c,
    'По точке A коэффициент k = '+a*b+' : '+a+' = '+b+'. Для B решаем '+b+'x = '+fmt(-c*b)+' и получаем x = '+fmt(-c)+'.'],
   compare_graph_values: ({a,b,c})=>compare('Сравни значения '+math('y₁ = '+a+'x')+' и '+math('y₂ = '+(a+b)+'x')+' при x = '+fmt(-c)+'.',
    rational(-a*c),rational(-(a+b)*c),'При отрицательном x больший коэффициент даёт меньшее значение.'),
   two_graphs_intersection: ({a,b})=>choice('При каком x совпадают значения '+math('y₁ = '+a+'x')+' и '+math('y₂ = '+(a+b)+'x')+'?',
    'Только при x = 0',['При любом x','Только при x = '+a,'Ни при каком x'],
    'После вычитания '+a+'x из обеих частей остаётся '+b+'x = 0. Так как '+b+' ≠ 0, единственное решение x = 0.')
  }
 ],
 linear_function: [
  {
   read_k: ({a,b})=>['Чему равен коэффициент k в '+math('y = −'+a+'x + '+b)+'?',-a,
    'Коэффициент при x равен '+fmt(-a)+'.'],
   read_b: ({a,b})=>['В какой ординате график '+math('y = '+a+'x − '+b)+' пересекает Oy?',-b,
    'На оси Oy абсцисса равна нулю. Подставляем 0 и получаем '+fmt(-b)+'.'],
   horizontal_function: ({a,b})=>choice('У какого графика все точки имеют ординату '+a+'?',
    math('y = '+a),[math('y = '+b+'x + '+a),math('y = '+a+'x'),math('y = x − '+a)],
    'Для горизонтальной прямой ордината постоянна при всех x.'),
   substitute_value: ({a,b,c})=>['Для '+math('y = '+a+'x + '+b)+' найди y при x = '+fmt(-c)+'.',b-a*c,
    'Подставляем: '+a+' · (−'+c+') + '+b+' = '+fmt(b-a*c)+'.']
  },
  {
   graph_read_offset: ({a,b})=>{
    const offset=a%7-3,k=b%2?1:-1;
    return withVisual(['По графику найди свободный член b в y = kx + b.',offset,'График пересекает ось Oy при y = '+fmt(offset)+'.'],
     functionGraph([],{line:[k,offset]}));
   },
   find_axis_crossing: ({a,b})=>['Найди абсциссу пересечения '+math('y = '+a+'x + '+a*b)+' с Ox.',-b,
    'На Ox значение y равно 0. После переноса постоянного члена получаем '+a+'x = '+fmt(-a*b)+', откуда x = '+fmt(-b)+'.'],
   write_from_k_b: ({a,b})=>choice('Коэффициент k равен '+fmt(-a)+', свободный член b равен '+b+'. Какая формула подходит?',
    math('y = −'+a+'x + '+b),[math('y = '+a+'x + '+b),math('y = −'+a+'x − '+b),math('y = '+b+'x − '+a)],
    'Подставляем k = '+fmt(-a)+' и b = '+b+' в y = kx + b.'),
   compare_two_values: ({a,b,c})=>compare('Для '+math('f(x) = −'+a+'x + '+b)+' сравни f('+c+') и f('+(c+1)+').',
    rational(b-a*c),rational(b-a*(c+1)),'При увеличении x на 1 значение y уменьшается на '+a+'.')
  },
  {
   find_from_two_points: ({a,b,c})=>{
    const h=c%4+1,offset=1-b,first=a+offset,second=a*(1+h)+offset;
    return ['График y = kx + b проходит через (1; '+fmt(first)+') и ('+(1+h)+'; '+fmt(second)+'). Найди k.',a,
     'Изменение x равно '+h+', изменение y равно '+(second-first)+'. Делим второе изменение на первое: k = '+a+'.'];
   },
   recover_formula_from_two_points: ({a,b})=>{
    const k=a%4+1,offset=b%5-2;
    return choice('Через точки ('+fmt(-1)+'; '+fmt(offset-k)+') и (2; '+fmt(offset+2*k)+') проходит график линейной функции. Выбери её формулу.',
     'y = '+g7LinHtml(k,offset),['y = '+g7LinHtml(-k,offset),'y = '+g7LinHtml(k,offset+1),'y = '+g7LinHtml(k+1,offset)],
     'Разность ординат равна '+3*k+', разность абсцисс равна 3. Значит, k = '+k+'. Из первой точки находим b = '+fmt(offset)+'.');
   },
   two_linear_functions: ({a,b,c})=>['При каком x совпадают '+math('y₁ = '+a+'x + '+b)+' и '+math('y₂ = '+(a+c)+'x − '+b)+'?',rational(2*b,c),
    'Приравниваем выражения. После переноса слагаемых получаем '+c+'x = '+2*b+'. Делим на '+c+'.'],
   interpolate_from_graph: ({a,b})=>{
    const k=a%2+1,offset=b%3-1;
    return withVisual(['Найди свободный член b в уравнении показанной прямой и коэффициент k. В ответ запиши произведение kb.',k*offset,
     'Свободный член равен f(0) = '+fmt(offset)+'. При увеличении x на 1 ордината увеличилась на '+k+'. Поэтому kb = '+fmt(k*offset)+'.'],
     functionGraph([],{line:[k,offset]}));
   }
  }
 ],
 piecewise_functions: [
  {
   left_branch: ({a,b})=>['Дано '+piecewise(a+'x','x + '+b,0)+'. Найди f(−2).',-2*a,
    'Аргумент отрицательный. Выбираем первую формулу и получаем '+a+' · (−2) = '+fmt(-2*a)+'.'],
   right_branch: ({a,b,c})=>['Дано '+piecewise(a+'x','x + '+b,0)+'. Найди f('+c+').',c+b,
    'Аргумент положительный. Выбираем вторую формулу: '+c+' + '+b+' = '+(c+b)+'.'],
   at_boundary: ({a,b})=>['Дано '+piecewise(a+'x','x + '+b,0)+'. Найди f(0).',b,
    'Вторая ветвь включает x = 0. Подставляем: 0 + '+b+' = '+b+'.'],
   select_formula: ({a,b,c})=>choice('Дано '+piecewise('x − '+a,b+'x + '+a,c)+'. Какую формулу берут для x = '+(c-1)+'?',
    math('x − '+a),[math(b+'x + '+a),math('x + '+a),math(b+'x − '+a)],
    (c-1)+' меньше '+c+', поэтому берём первую ветвь.')
  },
  {
   values_from_both_branches: ({a,b,c})=>['Дано '+piecewise(a+'x','x + '+b,c)+'. Найди f('+c+') − f('+(c-1)+').',c+b-a*(c-1),
    'На границе используем вторую формулу: f('+c+') = '+(c+b)+'. Слева используем первую: f('+(c-1)+') = '+a*(c-1)+'. Вычитаем.'],
   weighted_first_branch: ({a,b,c})=>['Дано '+piecewise(a+'x + '+b,'x − '+b,c)+'. Найди f('+fmt(-c)+') + f('+c+').',-a*c+c,
    'Для '+fmt(-c)+' берём первую формулу и получаем '+fmt(-a*c+b)+'. Для '+c+' берём вторую и получаем '+fmt(c-b)+'. Складываем.'],
   compare_at_boundary: ({a,b,c})=>compare('Дано '+piecewise('x + '+a,'x − '+b,c)+'. Сравни f('+(c-1)+') и f('+c+').',
    rational(c-1+a),rational(c-b),'Слева от '+c+' используем первую формулу, на границе — вторую.'),
   piecewise_tariff: ({a,b,c})=>['Для x минут, где x — целое, цена равна '+a+'x руб. при x ≤ '+b+' и '+a*b+' + '+(a-1)+'(x − '+b+') руб. при x &gt; '+b+'. Сколько рублей стоят '+(b+c)+' минут?',
    a*b+(a-1)*c,'Время больше '+b+' минут, поэтому берём вторую формулу. Подставляем '+(b+c)+' и вычисляем '+a*b+' + '+(a-1)+' · '+c+'.']
  },
  {
   solve_filter_branch: ({a,b,c})=>['Дано '+piecewise('x + '+a,'x + '+(a+b),0)+'. Найди x, если f(x) = '+(a+b+c)+'.',c,
    'Первая формула даёт x = '+(b+c)+', но это число не меньше 0. Вторая формула даёт x = '+c+', и оно входит в область этой ветви.'],
   same_value_two_branches: ({a,b})=>choice('Дано '+piecewise('−x + '+a,'x + '+a,0)+'. Найди все x, для которых f(x) = '+(a+b)+'.',
    fmt(-b)+' и '+b,[fmt(-b),String(b),'0'],
    'В первой ветви −x = '+b+', значит x = '+fmt(-b)+'. Во второй x = '+b+'. Оба корня удовлетворяют своим условиям.'),
   match_at_boundary: ({a,b,c})=>['Первая формула '+math('y = '+a+'x + '+b)+', вторая '+math('y = x + m')+'. Найди m, чтобы обе формулы давали одинаковое значение при x = '+c+'.',(a-1)*c+b,
    'При x = '+c+' первое значение равно '+(a*c+b)+'. Из '+c+' + m = '+(a*c+b)+' получаем m = '+((a-1)*c+b)+'.'],
   exclude_unreachable_value: ({a,b})=>checkStatement('Дано '+piecewise('−x + '+a,'x + '+(a+b),0)+'. Может ли f(x) равняться '+a+'?',false,
    'На левой ветви −x положительно, поэтому f(x) больше '+a+'. На правой ветви f(x) не меньше '+(a+b)+'.')
  }
 ],
 absolute_value_function: [
  {
   positive_absolute_argument: ({a})=>['Найди |'+a+'|.',a,'Положительное число равно своему модулю.'],
   negative_absolute_argument: ({a})=>['Найди |'+fmt(-a)+'|.',a,'Расстояние от '+fmt(-a)+' до нуля равно '+a+'.'],
   sign_select: ({a,b})=>choice('Чему равен |x|, если x = −'+frac(a,b)+'?',
    g7FracHtml(rational(a,b)),[g7FracHtml(rational(-a,b)),'0'],
    'При отрицательном x модуль равен противоположному числу '+g7FracHtml(rational(a,b))+'.'),
   graph_vertex: ({a,b})=>choice('Координаты вершины графика y = |x| + '+b+'?', '(0; '+b+')',
    ['('+a+'; 0)','(0; 0)','('+a+'; '+b+')'],'Наименьший модуль равен 0 и достигается при x = 0. Прибавляем '+b+' и получаем ординату вершины.')
  },
  {
   shifted_absolute_value: ({a,b})=>['Вычисли '+math('|x − '+b+'|')+' при x = '+fmt(-a)+'.',a+b,
    'Внутри модуля '+fmt(-a)+' − '+b+' = '+fmt(-a-b)+'. Его модуль '+(a+b)+'.'],
   compare_abs: ({a,b})=>compare('Сравни |'+fmt(-a)+'| и |'+b+'|.',rational(a),rational(b),'Берём расстояние каждого числа до нуля.'),
   symmetric_absolute_pair: ({a})=>choice('Какие x дают y = '+a+' на графике y = |x|?',fmt(-a)+' и '+a,
    [fmt(-a),String(a),'0'], 'На расстоянии '+a+' от нуля лежат две точки.'),
   solve_shifted_y: ({a,b})=>['Найди y = |x| − '+b+' при x = '+fmt(-a)+'.',a-b,
    'Модуль '+fmt(-a)+' равен '+a+'. Вычитаем '+b+' и получаем '+fmt(a-b)+'.']
  },
  {
   two_shifted_solutions: ({a,b})=>choice('Какие x удовлетворяют '+math('|x − '+a+'| = '+b)+'?',fmt(a-b)+' и '+(a+b),
    [fmt(a-b),String(a+b),fmt(-a-b)+' и '+(a+b)],'Число x находится на расстоянии '+b+' от '+a+', поэтому x = '+a+' ± '+b+'.'),
   branch_difference: ({a,b,c})=>['Для f(x) = |x − '+a+'| найди f('+(a+b)+') − f('+(a-c)+').',b-c,
    'Расстояния до '+a+' равны '+b+' и '+c+'. Их разность равна '+fmt(b-c)+'.'],
   graph_level_shifted: ({a,b})=>{
    const shift=a%3-1,level=b%3+1,left=shift-level,right=shift+level;
    return withVisual(choice('При каких x на графике y = '+level+'?',fmt(left)+' и '+fmt(right),
     [fmt(left),fmt(right),fmt(left-1)+' и '+fmt(right+1)],'Горизонталь пересекает обе ветви. Абсциссы точек '+fmt(left)+' и '+fmt(right)+'.'),
     functionGraph([[shift-4,4],[shift,0],[shift+4,4]]));
   },
   minimum_and_argument: ({a,b})=>['При каком x функция '+math('y = |x + '+a+'| − '+b)+' принимает наименьшее значение?',-a,
    'Минимум модуля равен 0. Для этого x + '+a+' = 0, значит x = '+fmt(-a)+'.']
  }
 ],
 natural_power_definition: [
  {
   recognize_base: ({a,b})=>['Чему равно основание степени '+math(g7PowPlain(a,b%4+2))+'?',a,
    'Основание — число, которое умножают само на себя. Здесь это '+a+'.'],
   recognize_exponent: ({a,b})=>['Каков показатель степени '+math(g7PowPlain(a,b%4+2))+'?',b%4+2,
    'Показатель степени равен '+(b%4+2)+'. Столько раз основание входит в произведение.'],
   write_product: ({a,b})=>{
    const n=b%3+2,base=a%5+2;
    return choice('Представь '+math(Array(n).fill(base).join(' · '))+' степенью.',g7PowHtml(base,n),
     [g7PowHtml(base,n+1),g7PowHtml(base+1,n),g7PowHtml(base*n,n)],
     'Множитель '+base+' повторяется '+n+' '+ruCount(n,'раз','раза','раз')+'.');
   },
   compute_square: ({a})=>['Вычисли '+math(a+'²')+'.',a*a,'Квадрат равен '+a+' · '+a+' = '+a*a+'.']
  },
  {
   even_negative_power: ({a,b})=>{
    const n=2*(b%2+1),base=a%5+2;
    return ['Вычисли '+g7PowHtml(-base,n)+'.',base**n,'Отрицательный множитель повторяется чётное число раз. Результат положительный: '+base**n+'.'];
   },
   odd_negative_power: ({a,b})=>{
    const n=2*(b%2)+3,base=a%4+2;
    return ['Вычисли '+g7PowHtml(-base,n)+'.',-(base**n),'Отрицательный множитель повторяется нечётное число раз. Результат '+fmt(-(base**n))+'.'];
   },
   distinguish_minus: ({a})=>compare('Сравни '+g7PowHtml(-a,2)+' и '+math('−'+a+'²')+'.',
    rational(a*a),rational(-a*a),'В первом выражении минус входит в основание. Во втором сначала вычисляем квадрат, затем берём противоположное число.'),
   fraction_power: ({a,b})=>['Вычисли ('+frac(a,b)+')².',rational(a*a,b*b),
    'Дважды умножаем одну и ту же дробь. Получаем '+frac(a*a,b*b)+' = '+g7FracHtml(rational(a*a,b*b))+'.']
  },
  {
   signed_power_expression: ({a,b})=>{
    const x=a%5+2,y=b%4+2,answer=x*x-y**3;
    return ['Вычисли '+g7PowHtml(-x,2)+' + '+g7PowHtml(-y,3)+'.',answer,
     'Первая степень равна '+x*x+', вторая равна '+fmt(-(y**3))+'. Складываем и получаем '+fmt(answer)+'.'];
   },
   find_exponent: ({a,b})=>{
    const base=a%4+2,n=b%4+2;
    return ['Найди натуральное n, если '+math(base+'ⁿ = '+base**n)+'.',n,
     base**n+' получается при умножении '+n+' одинаковых множителей '+base+'.'];
   },
   power_of_product_literal: ({a,b})=>{
    const product=a*b;
    return ['Найди разность '+g7PowHtml(-a,2)+' · '+g7PowHtml(-b,2)+' − '+g7PowHtml(product,2)+'.',0,
     'Первое произведение равно '+a*a+' · '+b*b+' = '+product*product+'. Второй квадрат тоже равен '+product*product+'.'];
   },
   compare_powers: ({a,b})=>{
    const x=a%6+2,y=b%4+2;
    return compare('Сравни '+g7PowHtml(x,2)+' и '+g7PowHtml(y,3)+'.',rational(x*x),rational(y**3),
     'Умножаем '+x+' на себя и отдельно находим произведение трёх множителей '+y+'.');
   }
  }
 ],
 power_properties: [
  {
   multiply_powers: ({a,b})=>['Найди показатель степени в '+math(pow('x',a)+' · '+pow('x',b))+' после приведения к одной степени.',a+b,
    'Одинаковое основание x сохраняется. Складываем показатели: '+a+' + '+b+' = '+(a+b)+'.'],
   divide_powers: ({a,b})=>['Найди показатель степени в '+math(pow('x',a+b)+' : '+pow('x',b))+' при x ≠ 0.',a,
    'Вычитаем показатель делителя из показателя делимого: '+(a+b)+' − '+b+' = '+a+'.'],
   equal_powers_quotient: ({a})=>['Вычисли '+math(pow('x',a)+' : '+pow('x',a))+' при x ≠ 0.',1,
    'Делим ненулевое число на само себя и получаем 1. Это соответствует x⁰ = 1.'],
   identify_same_base: ({a,b})=>choice('Какой результат даёт '+math(pow('x',a)+' · '+pow('x',b))+'?',
    math(pow('x',a+b)),[math(pow('x',a+b+1)),math(pow('x',Math.abs(a-b))),math(pow('y',a+b))],
    'Складываем показатели, сохраняя исходное основание x.')
  },
  {
   multiply_divide_chain: ({a,b,c})=>['Найди показатель результата '+math(pow('x',a+c)+' : '+pow('x',c)+' · '+pow('x',b))+' при x ≠ 0.',a+b,
    'Первое действие даёт показатель '+a+'. Добавляем '+b+' при умножении.'],
   solve_exponent_in_product: ({a,b})=>['Найди n, если '+math(pow('x',a)+' · xⁿ = '+pow('x',a+b))+' при любом x.',b,
    'Показатели дают a + n = '+(a+b)+' при a = '+a+'. Значит n = '+b+'.'],
   power_product_numeric: ({a,b})=>{
    const n=a%3+1,m=b%3+1;
    return readResult(math(pow(2,n)+' · '+pow(2,m)),2**(n+m),'Заменяем произведение степенью '+pow(2,n+m)+'.',
     pow(2,n+m)+' = '+2**(n+m)+'.');
   },
   division_to_power: ({a,b})=>choice('Запиши '+math(pow('x',a+b)+' : '+pow('x',a))+' одной степенью при x ≠ 0.',
    math(pow('x',b)),[math(pow('x',b+1)),math(pow('x',2*a+b)),math(pow('y',b))],
    'Из '+(a+b)+' вычитаем '+a+', получаем '+b+'.')
  },
  {
   powers_fraction_chain: ({a,b,c,y})=>['Найди показатель степени '+frac(pow('x',a+b)+' · '+pow('x',c+y),pow('x',b)+' · '+pow('x',y))+' при x ≠ 0.',a+c,
    'Степень числителя '+(a+b+c+y)+', степень знаменателя '+(b+y)+'. Разность показателей '+(a+c)+'.'],
   missing_denominator_power: ({a,b,c})=>['Найди n для равенства '+frac(pow('x',a)+' · '+pow('x',b+c),'xⁿ')+' = '+math(pow('x',a+c))+' при любом x ≠ 0.',b,
    'После деления показатель равен '+(a+b+c)+' − n. Приравниваем к '+(a+c)+' и получаем n = '+b+'.'],
   simplify_two_bases: ({a,b,c})=>choice('Упрости '+frac(pow('x',a+b)+' · '+pow('y',c+b),pow('x',b)+' · '+pow('y',b))+' при x ≠ 0 и y ≠ 0.',
    math(pow('x',a)+pow('y',c)),[math(pow('x',a+1)+pow('y',c)),math(pow('x',a)+pow('y',c+1)),math(pow('x',a+b)+pow('y',c+b))],
    'Вычитаем показатели отдельно для x и для y. Остаются '+a+' и '+c+'.'),
   signed_exponent_chain: ({a,b,c})=>{
    const n=a%3+1,m=b%3+1,k=c%3+1,result=(-2)**(n+m);
    return readResult(frac(g7PowHtml(-2,n+k)+' · '+g7PowHtml(-2,m),g7PowHtml(-2,k)),result,
     'Из суммы показателей '+(n+k+m)+' вычитаем '+k+'.',g7PowPlain(-2,n+m)+' = '+fmt(result)+'.');
   }
  }
 ],
 power_product_power: [
  {
   distribute_power: ({a})=>choice('Раскрой степень произведения '+math(pow('(xy)',a))+'.',
    math(pow('x',a)+pow('y',a)),[math(pow('x',a)+'y'),math('x'+pow('y',a)),math(pow('x',a+1)+pow('y',a+1))],
    'Возводим в степень '+a+' каждый множитель, x и y.'),
   exponent_multiplication: ({a,b})=>['Каков итоговый показатель в '+math(pow('('+pow('x',a)+')',b))+'?',a*b,
    'При возведении степени в степень показатели перемножаются: '+a+' · '+b+' = '+a*b+'.'],
   compute_product_square: ({a,b})=>readResult(math(pow('('+a+' · '+b+')',2)),(a*b)**2,
    'Возводим оба множителя в квадрат: '+a*a+' · '+b*b+' = '+(a*b)**2+'.'),
   numeric_coefficient_square: ({a})=>['Чему равен числовой множитель в '+math(pow('('+a+'x)',2))+' после возведения в степень?',a*a,
    'Возводим число '+a+' и переменную x в квадрат. Числовой множитель равен '+a*a+'.']
  },
  {
   expand_negative_cube: ({a})=>choice('Как раскрыть '+math(pow('(−'+a+'xy)',3))+'?',
    math('−'+a**3+'x³y³'),[math(a**3+'x³y³'),math('−'+a+'x³y³'),math('−'+a**3+'xy³')],
    'Нечётная степень сохраняет минус. Кубуем число '+a+' и обе переменные.'),
   power_on_existing_exponents: ({a,b,c})=>choice('Раскрой степень '+math(pow('('+pow('x',a)+pow('y',b)+')',c))+'.',
    math(pow('x',a*c)+pow('y',b*c)),[math(pow('x',a+c)+pow('y',b+c)),math(pow('x',a*c)+pow('y',b*c+1)),math(pow('x',a*c+1)+pow('y',b*c))],
    'Показатель x равен '+a+' · '+c+', показатель y равен '+b+' · '+c+'.'),
   combine_nested_power: ({a,b,c})=>['Каков показатель степени x после упрощения '+math(pow('('+pow('x',a)+')',b)+' · '+pow('x',c))+'?',a*b+c,
    'В первой степени перемножаем '+a+' и '+b+'. При умножении прибавляем '+c+'.'],
   compare_nested_powers: ({a,b})=>compare('Сравни '+math(pow('('+pow(2,a%3+1)+')',b%3+2))+' и '+math(pow(2,a%3+b%3+3))+'.',
    rational(2**((a%3+1)*(b%3+2))),rational(2**(a%3+b%3+3)),
    'У обеих степеней основание 2. Сравниваем произведение показателей слева и показатель справа.')
  },
  {
   inverse_nested_degree: ({a,b,c})=>['Найди n в равенстве '+math('('+pow('x',a)+')ⁿ · '+pow('x',c)+' = '+pow('x',a*b+c))+' при любом x.',b,
    'Слева показатель '+a+'n + '+c+'. После вычитания '+c+' получаем '+a+'n = '+a*b+'.'],
   combine_product_powers: ({a,b,c})=>{
    const answer=math(pow('x',a*b+c)+pow('y',b*c));
    return choice('Упрости '+math(pow('('+pow('x',a)+pow('y',c)+')',b)+' · '+pow('x',c))+'.',
     answer,[math(pow('x',a*b+c+1)+pow('y',b*c)),math(pow('x',a*b)+pow('y',b*c+c)),math(pow('x',a*b+c)+pow('y',b*c+1))],
     'Возводим в степень показатели в скобках. Затем прибавляем '+c+' только к показателю x.');
   },
   nested_fractional_coefficient: ({a,b})=>{
    const n=a%4+2,m=b%4+2;
    return ['Найди коэффициент в '+math('(')+frac('−x',n)+math(')² · '+n*n*m)+'.',m,
     'Квадрат коэффициента равен '+frac(1,n*n)+'. Умножаем на '+n*n*m+' и получаем '+m+'.'];
   },
   simplify_nested_quotient: ({a,b,c})=>['Найди показатель x после упрощения '+frac(pow('('+pow('x',a+c)+')',b),pow('('+pow('x',c)+')',b))+' при x ≠ 0.',a*b,
    'Показатели равны '+(a+c)*b+' и '+c*b+'. Вычитаем: '+(a+c)*b+' − '+c*b+' = '+a*b+'.']
  }
 ],
 monomial_standard_form: [
  {
   identify_monomial: ({a,b})=>choice('Какое выражение является одночленом?',
    math(a+'x²y'),[math(a+'x + '+b),math('x − y'),frac(a,'x')],
    'В одночлене переменные с неотрицательными целыми показателями перемножаются с числом. Буква в знаменателе этому определению не отвечает.'),
   identify_coefficient: ({a,b})=>['Найди коэффициент одночлена '+math('−'+a+pow('x',b)+'y')+'.',-a,
    'Числовой множитель перед буквенной частью равен '+fmt(-a)+'.'],
   identify_degree: ({a,b})=>['Найди степень одночлена '+math('−'+(a+b)+pow('x',a)+pow('y',b))+'.',a+b,
    'Складываем показатели букв: '+a+' + '+b+' = '+(a+b)+'. Коэффициент в степень не входит.'],
   implicit_coefficient: ({a,b})=>['Найди коэффициент одночлена '+math('−'+pow('x',a)+pow('y',b))+'.',-1,
    'Знак минус перед буквами означает множитель −1.']
  },
  {
   normalize_repeated_variable: ({a,b,c})=>monomialSelect('Запиши '+math(a+pow('x',b)+' · '+c+'x')+' в стандартном виде.',
    monomial(a*c,b+1,0),[monomial(a*c,b,0),monomial(a+c,b+1,0),monomial(a*c,b+2,0)],
    'Перемножаем коэффициенты '+a+' и '+c+', к показателю x прибавляем 1.'),
   normalize_negative_coefficient: ({a,b,c})=>monomialSelect('Запиши '+math('(−'+a+'xy) · '+b+pow('x',c))+' в стандартном виде.',
    monomial(-a*b,c+1,1),[monomial(a*b,c+1,1),monomial(-a*b,c,1),monomial(-a*b,c+1,2)],
    'Коэффициент отрицателен: (−'+a+') · '+b+' = '+fmt(-a*b)+'. Показатель x равен '+(c+1)+'.'),
   degree_after_rearrangement: ({a,b,c})=>['Какова степень одночлена '+math('−'+a+pow('x',b)+'y · '+pow('x',c)+'y²')+'?',b+c+3,
    'У x показатель '+(b+c)+', у y показатель 3. Складываем и получаем '+(b+c+3)+'.'],
   degree_of_constant: ({a,b})=>['Чему равна степень одночлена '+math(fmt(-a*b))+'?',0,
    'У ненулевого постоянного одночлена нет букв, поэтому степень равна 0.']
  },
  {
   normalize_three_multipliers: ({a,b,c,y})=>monomialSelect('Приведи к стандартному виду '+math(a+'x · (−'+b+pow('y',c)+') · '+y+'xy')+'.',
    monomial(-a*b*y,2,c+1),[monomial(-a*b*y,1,c+1),monomial(-a*b,c+1,2),monomial(a*b*y,2,c+1)],
    'Коэффициент равен −'+a*b*y+'. Буква x встречается дважды, к показателю y прибавляем 1.'),
   fractional_coefficient: ({a,b,c})=>monomialSelect('Приведи к стандартному виду −'+frac(a,b)+math(pow('x',c)+'y · '+b+'xy')+'.',
    monomial(-a,c+1,2),[monomial(a,c+1,2),monomial(-a,c,2),monomial(-a,c+1,1)],
    'Коэффициенты дают (−'+a+' : '+b+') · '+b+' = '+fmt(-a)+'. Показатели складываем отдельно для каждой буквы.'),
   missing_exponent_for_degree: ({a,b,c})=>['Найди n, если степень одночлена '+math(a+'xⁿ'+pow('y',b))+' равна '+(b+c)+'.',c,
    'Сумма показателей равна n + '+b+'. Вычитаем '+b+' из '+(b+c)+' и получаем '+c+'.'],
   choose_equivalent_standard_form: ({a,b,c,y})=>monomialSelect('Какой одночлен тождественно равен '+math('−'+a+pow('x',b)+' · (−'+c+'x'+pow('y',y)+')')+'?',
    monomial(a*c,b+1,y),[monomial(-a*c,b+1,y),monomial(a*c,b,y),monomial(a*c,b+1,y+1)],
    'Произведение двух отрицательных коэффициентов положительно. У x показатель '+(b+1)+', у y — '+y+'.')
  }
 ],
 monomial_operations: [
  {
   product_coefficients: ({a,b})=>['Найди коэффициент произведения '+math('(−'+a+'x²) · '+b+'x³')+'.',-a*b,
    'Перемножаем числовые множители: (−'+a+') · '+b+' = '+fmt(-a*b)+'.'],
   multiply_one_variable: ({a,b})=>monomialSelect('Перемножь '+math(a+pow('x',b)+' · '+pow('x',a))+'.',
    monomial(a,a+b,0),[monomial(a,a+b+1,0),monomial(a,a*b,0),monomial(a+1,a+b,0)],
    'Числовой множитель остаётся '+a+', показатель степени x равен '+a+' + '+b+'.'),
   square_product: ({a,b})=>monomialSelect('Возведи одночлен '+math(a+pow('x',b))+' в квадрат.',
    monomial(a*a,2*b,0),[monomial(a*a,b,0),monomial(a,2*b,0),monomial(-a*a,2*b,0)],
    'Коэффициент возводим в квадрат, показатель при x удваиваем.'),
   product_degree: ({a,b})=>['Какова степень произведения '+math(pow('x',a)+'y · x'+pow('y',b))+ '?',a+b+2,
    'Показатель x равен '+(a+1)+', показатель y равен '+(b+1)+'. Складываем показатели.']
  },
  {
   multiply_two_variables: ({a,b,c})=>monomialSelect('Перемножь '+math('(−'+a+pow('x',c)+'y) · '+b+'xy²')+'.',
    monomial(-a*b,c+1,3),[monomial(a*b,c+1,3),monomial(-a*b,c,3),monomial(-a*b,c+1,2)],
    'Коэффициент (−'+a+') · '+b+'. Показатель x увеличивается на 1, показатель y равен 1 + 2.'),
   cube_negative_monomial: ({a,b})=>monomialSelect('Найди куб одночлена '+math('−'+a+'x'+pow('y',b))+'.',
    monomial(-(a**3),3,3*b),[monomial(a**3,3,3*b),monomial(-a,3,3*b),monomial(-(a**3),3,b)],
    'Куб отрицательного коэффициента отрицателен. Показатели x и y умножаем на 3.'),
   find_missing_product_coefficient: ({a,b,c})=>['Найди k в '+math('(k'+pow('x',c)+'y) · '+a+'x = '+fmt(-a*b)+pow('x',c+1)+'y')+'.',-b,
    'Сравниваем коэффициенты: '+a+'k = '+fmt(-a*b)+'. Делим на '+a+'.'],
   degree_after_power: ({a,b,c})=>['Найди степень одночлена '+math(pow('(−'+a+'x'+pow('y',b)+')',c))+'.',(b+1)*c,
    'После возведения в степень показатель x равен '+c+', показатель y равен '+b*c+'. Их сумма '+(b+1)*c+'.']
  },
  {
   combine_power_and_product: ({a,b,c})=>monomialSelect('Запиши в стандартном виде '+math('(−'+a+pow('x',b)+'y)² · (−'+c+'xy²)')+'.',
    monomial(-a*a*c,2*b+1,4),[monomial(a*a*c,2*b+1,4),monomial(-a*a*c,b+1,4),monomial(-a*a*c,2*b+1,3)],
    'Квадрат первого одночлена даёт '+a*a+pow('x',2*b)+'y². Умножение на второй даёт коэффициент '+fmt(-a*a*c)+' и показатели '+(2*b+1)+' и 4.'),
   fractional_product_power: ({a,b,c})=>{
    const coefficient=rational(a*a,b);
    return ['Найди коэффициент одночлена '+math('(')+frac(a,b)+math(pow('x',c)+'y)² · '+b+'xy')+'.',coefficient,
     'Квадрат коэффициента равен '+frac(a*a,b*b)+'. Умножаем на '+b+' и получаем '+g7FracHtml(coefficient)+'.'];
   },
   restore_base_exponent: ({a,b,c})=>['Найди n из тождества '+math('(xⁿ'+pow('y',b)+')² · '+pow('x',a)+' = '+pow('x',2*c+a)+pow('y',2*b))+'.',c,
    'Показатель x слева равен 2n + '+a+'. Справа '+(2*c+a)+'. После вычитания '+a+' и деления на 2 получаем n = '+c+'.'],
   signed_powers_degree: ({a,b,c})=>['Найди степень произведения '+math(pow('(−'+a+'x²'+pow('y',b)+')',c)+' · xy³')+'.',(2+b)*c+4,
    'У x показатель '+(2*c+1)+', у y показатель '+(b*c+3)+'. Складываем и получаем '+((2+b)*c+4)+'.']
  }
 ],
 functions_x2_x3: [
  {
   square_value: ({a})=>['Вычисли y = x² при x = '+fmt(-a)+'.',a*a,'Квадрат отрицательного аргумента положителен: (−'+a+')² = '+a*a+'.'],
   cube_value: ({a})=>['Вычисли y = x³ при x = '+fmt(-a)+'.',-(a**3),'Куб отрицательного аргумента отрицателен: (−'+a+')³ = '+fmt(-(a**3))+'.'],
   graph_identification: ({a,b})=>{
    const power=b%2===0?2:3,correct=power===2?'y = x²':'y = x³';
    return withVisual(choice('Какой из двух графиков показан?',correct,[power===2?'y = x³':'y = x²'],
     power===2?'Обе ветви находятся выше Ox и симметричны относительно Oy.':'У отрицательных x значения отрицательные, у положительных — положительные.'),powerCurve(power));
   },
   point_membership_power: ({a,b})=>{
    const x=a%4+1,truth=b%2===0,y=x*x+Number(!truth);
    return checkStatement('Точка ('+fmt(-x)+'; '+y+') принадлежит графику y = x²?',truth,'При x = '+fmt(-x)+' квадрат равен '+x*x+'. Сравниваем с '+y+'.');
   }
  },
  {
   two_square_roots: ({a})=>choice('Какие точки на графике y = x² имеют ординату '+a*a+'?',
    '('+fmt(-a)+'; '+a*a+') и ('+a+'; '+a*a+')',['Только ('+a+'; '+a*a+')','Только ('+fmt(-a)+'; '+a*a+')','(0; '+a*a+')'],
    'Из x² = '+a*a+' получаем два противоположных x: '+fmt(-a)+' и '+a+'.'),
   cube_reverse: ({a,b})=>{
    const x=b%2===0?a:-a;
    return ['На графике y = x³ ордината точки равна '+fmt(x**3)+'. Найди её абсциссу.',x,
     'Решаем x³ = '+fmt(x**3)+'. Куб '+fmt(x)+' даёт заданную ординату.'];
   },
   compare_square_and_cube: ({a,b})=>{
    const x=b%2===0?a:-a;
    return compare('Сравни x² и x³ при x = '+fmt(x)+'.',rational(x*x),rational(x**3),'Вычисляем квадрат и куб одного аргумента с учётом знака.');
   },
   graph_y_read: ({a,b})=>{
    const power=b%2===0?2:3,x=a%2===0?-2:-1;
    return withVisual(['По графику найди y при x = '+fmt(x)+'.',x**power,
     'Двигаемся вертикально от x = '+fmt(x)+' до кривой. Читаем ординату '+fmt(x**power)+'.'],powerCurve(power));
   }
  },
  {
   distance_at_square_level: ({a})=>['Две точки графика y = x² имеют ординату '+a*a+'. Найди расстояние между ними.',2*a,
    'Точки находятся на одной горизонтали с абсциссами '+fmt(-a)+' и '+a+'. Расстояние равно '+a+' − ('+fmt(-a)+') = '+2*a+'.'],
   opposite_cubic_outputs: ({a})=>['Точки графика y = x³ имеют абсциссы '+fmt(-a)+' и '+a+'. На сколько ордината второй точки больше первой?',2*a**3,
    'Ординаты противоположны: '+fmt(-(a**3))+' и '+a**3+'. Вычитаем первую из второй: '+2*a**3+'.'],
   equal_square_and_cube: ({a})=>choice('При каких x совпадают значения y = x² и y = x³?',
    '0 и 1', ['Только 0','Только 1','0 и '+a],
    'Равенство x² = x³ приводим к x²(x − 1) = 0. Подходит x = 0 или x = 1.'),
   compare_at_opposite_arguments: ({a})=>['Для f(x) = x² и g(x) = x³ найди f('+fmt(-a)+') − g('+fmt(-a)+').',a*a+a**3,
    'Квадрат равен '+a*a+', куб равен '+fmt(-(a**3))+'. Вычитание отрицательного числа заменяем сложением и получаем '+(a*a+a**3)+'.']
  }
 ],
 divisibility_factorization: [
  {
   select_prime: ({a,b})=>{
    const prime=[2,3,5,7,11,13,17,19,23,29,31][a-3],multiple=2*(b+2);
    return choice('Какое число простое?',String(prime),[String(multiple),String(multiple+2),'1'],
     'У '+prime+' ровно два натуральных делителя. Оба чётных числа в вариантах больше 2, поэтому они составные.');
   },
   classify_composite: ({a,b})=>choice('К каким числам относится '+a*b+'?', 'Составные',['Простые','Ни простые, ни составные'],
    a*b+' = '+a+' · '+b+'. Оба множителя больше 1.'),
   divisibility_by_three: ({a,b})=>{
    const number=10*a+b,truth=number%3===0,sumDigits=[...String(number)].reduce((total,digit)=>total+Number(digit),0);
    return checkStatement('Делится ли '+number+' на 3?',truth,'Сумма цифр равна '+sumDigits+' и '+(truth?'делится':'не делится')+' на 3.');
   },
   one_is_special: ({a})=>choice('Выбери число, которое не является ни простым, ни составным.', '1',[String(2*a),'2','3'],
    'У единицы один натуральный делитель. У простого числа их два, у составного больше двух.')
  },
  {
   identify_prime_factorization: ({a,b})=>{
    const n=a%3+1,m=b%3+1,value=2**n*3**m;
    const correct=math(pow(2,n)+' · '+pow(3,m));
    return choice('Выбери разложение '+value+' на простые множители.',correct,
     [math(pow(2,n+1)+' · '+pow(3,m)),math(pow(2,n)+' · '+pow(3,m+1)),math(pow(2,n)+' · '+pow(5,m))],
     'Делим '+n+' '+ruCount(n,'раз','раза','раз')+' на 2 и '+m+' '+ruCount(m,'раз','раза','раз')+' на 3, получаем 1.');
   },
   recover_from_primes: ({a,b,c})=>{
    const n=a%3+1,m=b%3+1,p=c%2+1,result=2**n*3**m*5**p;
    return ['Какое число имеет разложение '+math(pow(2,n)+' · '+pow(3,m)+' · '+pow(5,p))+'?',result,
     'Вычисляем степени и перемножаем: '+2**n+' · '+3**m+' · '+5**p+' = '+result+'.'];
   },
   factor_multiplicity: ({a,b})=>{
    const n=a%4+1,m=b%3+1,number=2**n*3**m;
    return ['Сколько двоек в разложении '+number+' на простые множители?',n,
     'Последовательно делим на 2, пока результат остаётся целым. После '+n+' делений остаётся нечётное '+3**m+'.'];
   },
   factor_missing_prime: ({a,b,c})=>{
    const prime=[5,7,11,13][c%4],n=a%3+1,m=b%3+1,known=2**n*3**m,value=known*prime;
    return ['Какой простой множитель пропущен в '+math(value+' = '+pow(2,n)+' · '+pow(3,m)+' · □')+'?',prime,
     'Делим '+value+' на произведение известных множителей '+known+'. Получаем '+prime+'.'];
   }
  },
  {
   compare_factorizations: ({a,b,c})=>{
    const n=a%3+1,m=b%3+1,p=c%3+1,first=2**n*3**m*5,second=2**n*3**p*5;
    return compare('Сравни '+math(pow(2,n)+' · '+pow(3,m)+' · 5')+' и '+math(pow(2,n)+' · '+pow(3,p)+' · 5')+'.',
     rational(first),rational(second),'Сокращаем общий положительный множитель '+(2**n*5)+'. Порядок определяется показателями степени тройки.');
   },
   divisor_count: ({a,b})=>{
    const n=a%3+1,m=b%3+1,value=2**n*3**m;
    return ['Сколько натуральных делителей у '+value+'?',(n+1)*(m+1),
     'В разложении '+math(pow(2,n)+' · '+pow(3,m))+'. Для делителя показатель двойки выбираем от 0 до '+n+', тройки — от 0 до '+m+'. Получаем '+(n+1)+' · '+(m+1)+' делителей.'];
   },
   smallest_prime_factor: ({a,b,c})=>{
    const primes=[3,5,7,11,13,17],first=c%3,second=first+1+a%3,third=b%2?second:first;
    const value=primes[first]*primes[second]*primes[third];
    return ['Найди наименьший простой делитель '+value+'.',primes[first],
     'Проверяем простые числа по возрастанию. Разложение '+value+' = '+primes[first]+' · '+primes[second]+' · '+primes[third]+'.'];
   },
   product_divisibility_via_factors: ({a,b,c})=>{
    const n=a%4+1,m=b%3+1,k=m+c%2,value=2**n*3**m*5,divisor=2**n*3**k;
    return checkStatement('Делится ли '+value+' на '+divisor+'?',m>=k,
     'Для делимости показатели простых множителей делимого должны быть не меньше показателей делителя. Двоек поровну, троек в делимом '+m+', в делителе '+k+'.');
   }
  }
 ],
 polynomial_standard_degree: [
  {
   degree_in_standard_form: ({a,b,c})=>['Найди степень '+g7PolynomialHtml(polynomial([a,b+1],[-c,1],[b,0]))+'.',b+1,
    'Степени членов: '+(b+1)+', 1 и 0. Наибольшая равна '+(b+1)+'.'],
   read_coefficient: ({a,b,c})=>['Найди коэффициент при x² в '+g7PolynomialHtml(polynomial([a,3],[-b,2],[c,0]))+'.',-b,
    'Коэффициент перед x² равен '+fmt(-b)+'.'],
   count_standard_terms: ({a,b,c})=>{
    const terms=polynomial([a,b+2],[-c,2],[b-c,1],[a-c,0]),result=g7PolynomialNormalize(terms).length;
    return ['Сколько членов в '+g7PolynomialHtml(terms)+'?',result,
     'Считаем слагаемые вместе с их знаками. Нулевые слагаемые уже убраны. Всего '+result+'.'];
   },
   identify_like_terms: ({a,b,c})=>monomialSelect('Какой член подобен '+math(a+pow('x',b)+'y')+'?',
    monomial(-c,b,1),[monomial(c,b+1,1),monomial(-c,b,2),monomial(c,b,0)],
    'Подобные члены имеют одинаковую буквенную часть '+pow('x',b)+'y.')
  },
  {
   group_degree_two: ({a,b,c})=>{
    const terms=polynomial([a,2],[b,1],[c,2],[-b,0]),result=polynomial([a+c,2],[b,1],[-b,0]);
    return polyChoice('Приведи к стандартному виду '+g7PolynomialSequenceHtml(terms)+'.',result,
     [polynomial([a+c,2],[2*b,1]),polynomial([a-c,2],[b,1],[-b,0]),polynomial([a+c,2],[b,1],[b,0])],
     'Складываем коэффициенты при x²: '+a+' + '+c+' = '+(a+c)+'. Остальные слагаемые различаются.');
   },
   cancel_leading_term: ({a,b,c})=>{
    const terms=polynomial([a,b+2],[c,b],[-a,b+2],[a,0]);
    return ['Приведи подобные и найди степень '+g7PolynomialSequenceHtml(terms)+'.',b,
     'Слагаемые степени '+(b+2)+' взаимно уничтожаются. Стандартный вид: '+g7PolynomialHtml(polynomial([c,b],[a,0]))+'.'];
   },
   degree_two_variables: ({a,b,c})=>{
    const terms=[monomial(a,b,c),monomial(-b,b+1,0),monomial(c,0,c+1)];
    return ['Найди степень '+g7PolynomialHtml(terms)+'.',b+c,'У первого члена степень '+b+' + '+c+' = '+(b+c)+'. У остальных степени '+(b+1)+' и '+(c+1)+', они меньше.'];
   },
   coefficient_after_grouping: ({a,b,c,y})=>['Найди коэффициент при x² после приведения подобного в '+g7PolynomialSequenceHtml(polynomial([a,2],[b,1],[-c,2],[y,2]))+'.',a-c+y,
    'Коэффициенты слагаемых при x²: '+a+', '+fmt(-c)+' и '+y+'. Их сумма '+fmt(a-c+y)+'.']
  },
  {
   degree_after_multiple_cancellations: ({a,b,c})=>{
    const terms=polynomial([a,b+3],[-b,b+2],[c,b],[b,b+2],[-a,b+3],[c,0]);
    return ['Приведи подобные и найди степень '+g7PolynomialSequenceHtml(terms)+'.',b,
     'Группы степеней '+(b+3)+' и '+(b+2)+' дают ноль. Остаётся '+g7PolynomialHtml(polynomial([c,b],[c,0]))+'.'];
   },
   standard_form_many_letters: ({a,b,c})=>{
    const terms=[monomial(a,2,1),monomial(-b,1,2),monomial(c,2,1),monomial(b,1,2),monomial(c,0,0)];
    return polyChoice('Приведи к стандартному виду '+g7PolynomialSequenceHtml(terms)+'.',[monomial(a+c,2,1),monomial(c,0,0)],
     [[monomial(a+c,1,2),monomial(c,0,0)],[monomial(a+c,2,1)],[monomial(a,2,1),monomial(c,0,0)]],
     'Члены при xy² сокращаются. При x²y складываем '+a+' и '+c+'. Свободный член остаётся.');
   },
   unknown_coefficient_for_degree: ({a,b,c})=>['При каком k степень '+math(pow('kx',b+2)+' − '+a+pow('x',b+2)+' + '+c+pow('x',b))+' равна '+b+'?',a,
    'Старший коэффициент k − '+a+' должен обратиться в ноль. Тогда остаётся ненулевой член степени '+b+'.'],
   nonzero_members_after_normalization: ({a,b,c})=>{
    const terms=polynomial([a,4],[c,3],[-a,4],[b,2],[-b,2],[a,1],[-c,0]);
    return ['Сколько членов останется после приведения подобных в '+g7PolynomialSequenceHtml(terms)+'?',3,
     'Члены степеней 4 и 2 взаимно уничтожаются. В стандартном виде '+g7PolynomialHtml(polynomial([c,3],[a,1],[-c,0]))+' три члена.'];
   }
  }
 ],
 polynomial_add_subtract: [
  {
   sum_two_polynomials: ({a,b,c})=>polyChoice('Найди сумму '+math('('+a+'x + '+b+') + ('+c+'x + '+a+')')+'.',polynomial([a+c,1],[a+b,0]),
    [polynomial([a+c,1],[a-b,0]),polynomial([a,1],[a+b+c,0]),polynomial([a+c+1,1],[a+b,0])],
    'Складываем отдельно коэффициенты при x и свободные члены.'),
   subtract_single_terms: ({a,b})=>['Найди коэффициент в '+math((a+b)+'x² − '+a+'x²')+'.',b,
    'Буквенная часть одинакова. Вычитаем коэффициенты: '+(a+b)+' − '+a+' = '+b+'.'],
   remove_parentheses_sum: ({a,b,c})=>simplify(a+'x + (−'+b+'x + '+c+')',a-b,c,
    'Плюс перед скобками сохраняет знаки. Коэффициент при x равен '+fmt(a-b)+', свободный член '+c+'.'),
   add_constants: ({a,b,c})=>['Чему равен свободный член суммы '+math('('+a+'x² − '+b+') + ('+c+'x + '+a+')')+'?',a-b,
    'Свободные члены −'+b+' и '+a+' складываются. Получаем '+fmt(a-b)+'.']
  },
  {
   unequal_quadratics_difference: ({a,b,c,y})=>{
    const first=polynomial([a+b,2],[c,1],[y,0]),second=polynomial([b,2],[-a,1],[c,0]);
    return polyChoice('Вычти '+math('('+g7PolynomialBodyHtml(first)+') − ('+g7PolynomialBodyHtml(second)+')')+'.',g7PolynomialAdd(first,second,-1),
     [g7PolynomialAdd(first,second),polynomial([a,2],[c-a,1],[y-c,0]),polynomial([a,2],[c+a,1],[y+c,0])],
     'Во второй скобке меняем все знаки. Коэффициенты результата: '+a+' при x², '+(c+a)+' при x, свободный член '+fmt(y-c)+'.');
   },
   highest_degree_cancels: ({a,b,c})=>['Найди степень разности '+math('('+a+'x³ + '+b+'x²) − ('+a+'x³ − '+c+'x²)')+'.',2,
    'Оба члена с x³ сокращаются. Остаётся '+(b+c)+'x².'],
   add_three_polynomials: ({a,b,c})=>['Чему равен свободный член '+math('('+a+'x² + '+b+') + ('+c+'x − '+a+') + ('+b+'x + '+c+')')+'?',b-a+c,
    'Свободные члены '+b+', −'+a+' и '+c+'. При сложении получаем '+fmt(b-a+c)+'.'],
   add_bivariate_polynomials: ({a,b,c})=>polyChoice('Найди сумму '+math('('+a+'x² − '+b+'y²) + ('+c+'x² + '+(a+b)+'y²)')+'.',
    [monomial(a+c,2,0),monomial(a,0,2)],
    [[monomial(a+c,2,0),monomial(a+2*b,0,2)],[monomial(a+c,2,0)],[monomial(a+c,0,3),monomial(a,2,0)]],
    'При x² складываем '+a+' и '+c+', при y² складываем −'+b+' и '+(a+b)+'.')
  },
  {
   nested_polynomial_difference: ({a,b,c,y})=>{
    const p=polynomial([a+b,2],[c,0]),q=polynomial([a,2],[-y,1]),r=polynomial([-b,2],[c,1]);
    const correct=g7PolynomialAdd(g7PolynomialAdd(p,q),r,-1);
    return polyChoice('Упрости '+math('('+g7PolynomialBodyHtml(p)+') − (('+g7PolynomialBodyHtml(r)+') − ('+g7PolynomialBodyHtml(q)+'))')+'.',correct,
     [g7PolynomialAdd(g7PolynomialAdd(p,q,-1),r,-1),g7PolynomialAdd(g7PolynomialAdd(p,q),r),g7PolynomialAdd(p,r,-1)],
     'Внешний минус меняет знак перед обеими скобками: получаем P − R + Q. Затем группируем подобные.');
   },
   reconstruct_missing_difference: ({a,b,c})=>['Вычли '+math('('+a+'x² − '+b+'x)')+' из многочлена и получили '+math(c+'x² + '+(a+b)+'x')+'. Найди его коэффициент при x.',a,
    'Чтобы восстановить уменьшаемое, прибавляем вычитаемое к разности. При x получаем '+(a+b)+' − '+b+' = '+a+'.'],
   diff_then_value: ({a,b,c})=>{
    const coefficient=a-b,answer=coefficient*c+c;
    return ['Упрости '+math('('+a+'x² + '+a+'x + '+c+') − ('+a+'x² + '+b+'x)')+' и вычисли при x = '+c+'.',
     answer,'Квадраты сокращаются. Получаем '+g7LinHtml(coefficient,c)+'. Подставляем '+c+' и вычисляем '+fmt(answer)+'.'];
   },
   recover_parameter_by_cancellation: ({a,b,c})=>['Найди k, при котором разность '+math('(kx³ + '+a+'x²) − ('+b+'x³ − '+c+'x²)')+' имеет степень 2.',b,
    'Коэффициент при x³ должен быть нулём: k − '+b+' = 0. Коэффициент при x² равен '+(a+c)+' и не обнуляется.']
  }
 ],
 monomial_times_polynomial: [
  {
   scale_binomial: ({a,b,c})=>simplify(a+'('+b+'x + '+c+')',a*b,a*c,
    'Умножаем на '+a+' каждое слагаемое: '+a*b+'x + '+a*c+'.'),
   multiply_by_x: ({a,b})=>polyChoice('Умножь '+math('x('+a+'x + '+b+')')+'.',polynomial([a,2],[b,1]),
    [polynomial([a,2],[b,0]),polynomial([a,1],[b,3]),polynomial([a+1,2],[b,1])],
    'В первом произведении x · x = x². Во втором x умножается на свободный член.'),
   scale_negative_binomial: ({a,b,c})=>simplify('−'+a+'('+b+'x − '+c+')',-a*b,a*c,
    'Умножаем на отрицательное число. Получаем −'+a*b+'x + '+a*c+'.'),
   constant_after_distribution: ({a,b,c})=>['Найди свободный член после раскрытия '+math(a+'('+b+'x² − '+c+')')+'.',-a*c,
    'Свободный член появляется из произведения '+a+' · (−'+c+') = '+fmt(-a*c)+'.']
  },
  {
   scale_quadratic: ({a,b,c,y})=>{
    const original=polynomial([b,2],[-c,1],[y,0]),factor=xTerm(-a,1);
    return polyChoice('Раскрой скобки: '+math('−'+a+'x('+g7PolynomialBodyHtml(original)+')')+'.',g7PolynomialScale(original,factor),
     [g7PolynomialScale(original,xTerm(a,1)),g7PolynomialScale(original,xTerm(-a,0)),polynomial([-a*b,3],[a*c,2],[-y,1])],
     'У каждого слагаемого степень x увеличивается на 1, а коэффициент умножается на −'+a+'.');
   },
   bivariate_distribution: ({a,b,c})=>polyChoice('Умножь одночлен на двучлен '+math(a+'xy('+b+'x − '+c+'y)')+'.',
    [monomial(a*b,2,1),monomial(-a*c,1,2)],
    [[monomial(a*b,2,1),monomial(a*c,1,2)],[monomial(a*b,2,1),monomial(-a*c,1,1)],[monomial(a*b,1,1),monomial(-a*c,1,2)]],
    'Отдельно умножаем xy на x и на y. Получаем x²y и xy².'),
   find_intermediate_coefficient: ({a,b,c,y})=>['Найди коэффициент при x² в произведении '+math('−'+a+'x('+b+'x² − '+c+'x + '+y+')')+'.',a*c,
    'Член при x² образуется только из (−'+a+'x) · (−'+c+'x). Получаем '+a*c+'x².'],
   degree_of_product: ({a,b,c})=>['Найди степень '+math(a+pow('x',b)+'('+c+'x² − '+b+'x + '+a+')')+' после раскрытия.',b+2,
    'Старший член получается из '+pow('x',b)+' · x², степень равна '+b+' + 2 = '+(b+2)+'.']
  },
  {
   distribute_and_cancel: ({a,b,c})=>polyChoice('Упрости '+math(a+'x('+b+'x − '+c+') − '+a*b+'x²')+'.',
    polynomial([-a*c,1]),[polynomial([a*c,1]),polynomial([-a*c,2]),polynomial([-c,1])],
    'Раскрываем скобки: '+a*b+'x² − '+a*c+'x. Квадратные члены сокращаются.'),
   recover_missing_linear_term: ({a,b,c})=>['Найди k из тождества '+math(a+'x('+b+'x + k) = '+a*b+'x² − '+a*c+'x')+'.',-c,
    'Сравниваем коэффициенты при x: '+a+'k = '+fmt(-a*c)+'. Делим на '+a+'.'],
   two_distributions: ({a,b,c,y})=>{
    const first=polynomial([a*b,2],[-a*c,1]),second=polynomial([b*c,2],[b*y,1]);
    return polyChoice('Упрости '+math(a+'x('+b+'x − '+c+') − '+b+'x('+c+'x + '+y+')')+'.',g7PolynomialAdd(first,second,-1),
     [g7PolynomialAdd(first,second),polynomial([a*b-b*c,2],[-a*c-b*y-1,1]),polynomial([a*b-b*c,2],[-a*c-b*y,0])],
     'После раскрытия квадратный коэффициент '+fmt(a*b-b*c)+', коэффициент при x равен '+fmt(-a*c-b*y)+'.');
   },
   fractional_distribution: ({a,b,c})=>['Найди коэффициент при x² после раскрытия '+frac(a,b)+math('x('+b*c+'x − '+b+')')+'.',a*c,
    'Умножаем '+frac(a,b)+'x на '+b*c+'x. Коэффициент равен '+a+' · '+c+' = '+a*c+'.']
  }
 ],
 common_factor: [
  {
   numeric_common_factor: ({a,b})=>['Найди НОД коэффициентов '+g7PolynomialHtml(polynomial([a*b,1],[a*(b+1),0]))+'.',a,
    'Числа '+b+' и '+(b+1)+' взаимно просты. Общий множитель их произведений на '+a+' равен '+a+'.'],
   common_exponent: ({a,b})=>['Какой показатель x у наибольшего общего множителя в '+g7PolynomialHtml(polynomial([a,b+1],[a,b]))+'?',b,
    'Берём меньший из показателей '+(b+1)+' и '+b+'.'],
   numeric_factoring: ({a,b,c})=>choice('Вынеси '+a+' за скобки в '+g7PolynomialHtml(polynomial([a*b,1],[-a*c,0]))+'.',
    math(a+'('+b+'x − '+c+')'),[math(a+'('+b+'x + '+c+')'),math(a+'('+b+'x − '+a*c+')'),math(a+'('+a*b+'x − '+c+')')],
    'Оба коэффициента делим на '+a+'. Получаем '+b+' и '+fmt(-c)+'.'),
   identify_outside_monomial: ({a,b})=>monomialSelect('Какой наибольший общий одночлен вынести в '+g7PolynomialHtml(polynomial([a*(b+1),2],[a*b,1]))+'?',
    xTerm(a,1),[xTerm(a,2),xTerm(a+1,2),xTerm(a*(b+1),1)],'НОД коэффициентов равен '+a+', меньший показатель x равен 1.')
  },
  {
   factor_out_variable: ({a,b,c})=>choice('Вынеси '+math(a+'x')+' за скобки в '+g7PolynomialHtml(polynomial([a*b,3],[-a*c,1]))+'.',
    math(a+'x('+b+'x² − '+c+')'),[math(a+'x('+b+'x² + '+c+')'),math(a+'x('+b+'x³ − '+c+')'),math(a+'x('+b+'x² − '+c+'x)')],
    'Разделив первое слагаемое на '+a+'x, получаем '+b+'x². Деление второго даёт −'+c+'.'),
   leading_negative_factor: ({a,b,c})=>choice('Вынеси '+math('−'+a+'x')+' за скобки в '+g7PolynomialHtml(polynomial([-a*b,2],[a*c,1]))+'.',
    math('−'+a+'x('+b+'x − '+c+')'),[math('−'+a+'x('+b+'x + '+c+')'),math('−'+a+'x(−'+b+'x − '+c+')'),math('−'+a+'x('+b+'x − '+a*c+')')],
    'После деления на отрицательный множитель знаки меняются. Первый член в скобках положительный, второй отрицательный.'),
   shared_exponents_two_letters: ({a,b,c})=>{
    const original=[monomial(a*(b+1),b+1,c),monomial(a*b,b,c+1)];
    return monomialSelect('Выбери наибольший общий множитель '+g7PolynomialHtml(original)+'.',
     monomial(a,b,c),[monomial(a,b+1,c),monomial(a,b,c+1),monomial(a*(b+1),b,c)],
     'НОД коэффициентов равен '+a+'. Меньшие показатели: '+b+' для x и '+c+' для y.');
   },
   recover_coefficient_inside: ({a,b,c})=>['Вынеси '+math(a+'x²')+' в '+g7PolynomialHtml(polynomial([a*b,3],[a*c,2]))+' и запиши свободный член выражения в скобках.',
    c,'Свободный член получается из деления '+a*c+'x² на '+a+'x². Он равен '+c+'.']
  },
  {
   factor_three_terms: ({a,b,c,y})=>{
    const factor=monomial(a,b,c),inFactor=[monomial(y,2,0),monomial(-1,1,1),monomial(2,0,0)];
    const render=inner=>g7FactorizationHtml([[factor],inner]);
    return choice('Вынеси '+g7MonomialHtml(factor)+' за скобки в '+g7PolynomialHtml(g7PolynomialScale(inFactor,factor))+'.',
     render(inFactor),[render([monomial(y,2,0),monomial(1,1,1),monomial(2,0,0)]),render([monomial(y,2,0),monomial(-1,1,1)]),render([monomial(y,1,0),monomial(-1,1,1),monomial(2,0,0)])],
     'Делим все три члена на общий множитель. У x вычитаем '+b+', у y — '+c+'.');
   },
   verify_largest_factor: ({a,b,c})=>{
    const truth=c%2===0,claimed=truth?a:a+1;
    return checkStatement('Является ли '+math(claimed+pow('x',b))+' наибольшим общим множителем в '+g7PolynomialHtml(polynomial([a*(b+1),b+1],[a*b,b]))+'?',truth,
     'НОД коэффициентов равен '+a+', минимальная степень x равна '+b+'. Поэтому наибольший общий множитель '+a+pow('x',b)+'.');
   },
   factor_then_evaluate: ({a,b,c})=>['Вынеси общий множитель и вычисли '+g7PolynomialHtml(polynomial([a*b,2],[-a*(b+1),1]))+' при x = '+c+'.',
    a*c*(b*c-b-1),'После вынесения '+a+'x остаётся '+b+'x − '+(b+1)+'. При x = '+c+' получаем '+a*c+' · '+fmt(b*c-b-1)+' = '+fmt(a*c*(b*c-b-1))+'.'],
   compare_factored_coefficients: ({a,b,c})=>['Вынесли '+math(a+'xy')+' из '+g7PolynomialHtml([monomial(a*b,2,1),monomial(-a*c,1,2)])+'. Чему равна сумма коэффициентов в скобках?',b-c,
    'После деления получаем '+math(b+'x − '+c+'y')+'. Сумма его коэффициентов '+b+' − '+c+' = '+fmt(b-c)+'.']
  }
 ],
 polynomial_times_polynomial: [
  {
   binomial_product: ({a,b})=>polyChoice('Перемножь '+math('(x + '+a+')(x + '+b+')')+'.',polynomial([1,2],[a+b,1],[a*b,0]),
    [polynomial([1,2],[a+b,1],[a*b+1,0]),polynomial([1,2],[a+b+1,1],[a*b,0]),polynomial([1,2],[a+b,1],[-a*b,0])],
    'Произведения: x², '+a+'x, '+b+'x и '+a*b+'. Складываем средние члены.'),
   constant_product: ({a,b,c})=>['Чему равен свободный член '+math('('+a+'x − '+b+')(x + '+c+')')+'?',-b*c,
    'Свободный член получается только из (−'+b+') · '+c+' = '+fmt(-b*c)+'.'],
   degree_of_two_binomials: ({a,b})=>['Найди степень произведения '+math('('+pow('x',a)+' + 1)('+pow('x',b)+' − 2)')+'.',a+b,
    'Умножаем старшие члены. Их показатели складываются: '+a+' + '+b+' = '+(a+b)+'.'],
   coefficient_of_x: ({a,b})=>['Найди коэффициент при x после раскрытия '+math('(x − '+a+')(x + '+b+')')+'.',b-a,
    'Средние произведения '+b+'x и −'+a+'x дают коэффициент '+fmt(b-a)+'.']
  },
  {
   multiply_signed_binomials: ({a,b,c})=>polyChoice('Перемножь '+math('('+a+'x − '+b+')(x − '+c+')')+'.',
    polynomial([a,2],[-a*c-b,1],[b*c,0]),
    [polynomial([a,2],[-a*c-b,1],[-b*c,0]),polynomial([a,2],[-a*c+b,1],[b*c,0]),polynomial([a,2],[-a*c,1],[b*c,0])],
    'Коэффициент при x равен −'+a*c+' − '+b+', свободный член равен (−'+b+') · (−'+c+') = '+b*c+'.'),
   multiply_using_two_variables: ({a,b})=>polyChoice('Разверни '+math('(x + '+a+'y)(x − '+b+'y)')+'.',
    [xTerm(1,2),monomial(a-b,1,1),monomial(-a*b,0,2)],
    [[xTerm(1,2),monomial(a+b,1,1),monomial(-a*b,0,2)],[xTerm(1,2),monomial(a-b,1,1),monomial(a*b,0,2)],[xTerm(1,2),monomial(a-b,1,1)]],
    'В средних произведениях получается ('+a+' − '+b+')xy, в последнем −'+a*b+'y².'),
   coefficient_of_degree_three: ({a,b,c})=>['Найди коэффициент при x³ в '+math('('+a+'x² − '+b+'x)(x² + '+c+'x + 1)')+'.',a*c-b,
    'В степень 3 дают вклад '+a+'x² · '+c+'x и −'+b+'x · x². Сумма коэффициентов '+fmt(a*c-b)+'.'],
   square_as_product: ({a,b})=>['Найди коэффициент при x в '+math('('+a+'x + '+b+')('+a+'x + '+b+')')+'.',2*a*b,
    'Перекрёстные произведения дважды дают '+a*b+'x. Складываем их коэффициенты.']
  },
  {
   product_of_quadratic_and_binomial: ({a,b,c,y})=>{
    const first=polynomial([a,2],[-b,1],[c,0]),second=polynomial([1,1],[-y,0]),right=g7PolynomialMul(first,second);
    return polyChoice('Раскрой '+math(parenthesized(first)+parenthesized(second))+'.',right,
     [g7PolynomialAdd(right,polynomial([b*y,1])),g7PolynomialAdd(right,polynomial([2*c*y,0])),g7PolynomialAdd(right,polynomial([1,2]))],
     'Умножаем каждый член первого многочлена на x и на (−'+y+'). Затем складываем подобные.');
   },
   degree_after_subtracting_product: ({a,b,c})=>['Найди степень '+math('('+a+'x² + '+b+'x)(x + '+c+') − '+a+'x³')+'.',2,
    'Кубы сокращаются. Коэффициент при x² равен '+a*c+' + '+b+' = '+(a*c+b)+' и отличен от нуля.'],
   parameter_in_product: ({a,b})=>['Найди k, если после раскрытия '+math('(x + k)('+a+'x − '+b+')')+' коэффициент при x равен нулю.',rational(b,a),
    'Коэффициент при x равен '+a+'k − '+b+'. Приравниваем его к нулю и делим '+b+' на '+a+'.'],
   evaluate_using_factors: ({a,b,c})=>['Найди значение '+math('(x − '+a+')(x + '+b+') + (x − '+a+')(x + '+c+')')+' при x = '+(a+1)+'.',
    2*(a+1)+b+c,'Общий множитель x − '+a+' равен 1. Второй множитель 2x + '+(b+c)+'. Подставляем x = '+(a+1)+' и получаем '+(2*(a+1)+b+c)+'.']
  }
 ],
 factorization_grouping: [
  {
   group_shared_binomial: ({a,b})=>choice('Разложи группировкой '+math('x² + '+a+'x + '+b+'x + '+a*b)+'.',
    math('(x + '+b+')(x + '+a+')'),[math('(x − '+b+')(x + '+a+')'),math('(x + '+(b+1)+')(x + '+a+')'),math('(x + '+b+')(x − '+a+')')],
    'Первые два члена дают x(x + '+a+'), вторые — '+b+'(x + '+a+'). Выносим одинаковую скобку.'),
   identify_shared_bracket: ({a,b})=>choice('Какую скобку вынести из '+math(a+'x(x + '+b+') − '+a+'(x + '+b+')')+'?',
    math('x + '+b),[math('x − '+b),math('x + '+(b+1)),math(a+'x − '+b)],
    'Многочлен x + '+b+' одинаков в обоих слагаемых.'),
   complete_grouping_step: ({a,b})=>['Найди k в тождестве '+math('x(x + '+a+') + k(x + '+a+') = (x + '+b+')(x + '+a+')')+'.',b,
     'При вынесении общей скобки остаётся x + k. Сравниваем с x + '+b+'.'],
   recognize_valid_pairs: ({a,b})=>choice('Как сгруппировать '+math('x² + '+a*b+' + '+a+'x + '+b+'x')+', чтобы получить общий двучлен?',
    math('(x² + '+a+'x) + ('+b+'x + '+a*b+')'),[math('(x² + '+a+'x) − ('+b+'x + '+a*b+')'),math('(x² − '+a+'x) + ('+b+'x + '+a*b+')'),math('(x² + '+a+'x) + ('+b+'x − '+a*b+')')],
    'В первой паре выносим x, во второй '+b+'. В обеих остаётся x + '+a+'.')
  },
  {
   factor_negative_group: ({a,b,c})=>choice('Разложи '+math(a+'x² + '+a*b+'x − '+c+'x − '+b*c)+' группировкой.',
    math('('+a+'x − '+c+')(x + '+b+')'),[math('('+a+'x + '+c+')(x + '+b+')'),math('('+a+'x − '+c+')(x − '+b+')'),math('('+a+'x − '+(c+1)+')(x + '+b+')')],
    'Из первых двух членов выносим '+a+'x, из последних двух −'+c+'. В обеих скобках остаётся x + '+b+'.'),
   group_two_variables: ({a,b})=>choice('Разложи '+math(a+'xy + '+a*b+'x + ' +b+'y + '+b*b)+'.',
    math('('+a+'x + '+b+')(y + '+b+')'),[math('('+a+'x − '+b+')(y + '+b+')'),math('('+a+'x + '+(b+1)+')(y + '+b+')'),math('('+a+'x + '+b+')(y − '+b+')')],
    'Из первой пары выносим '+a+'x, из второй '+b+'. Общий двучлен y + '+b+'.'),
   rearrange_scrambled_terms: ({a,b,c})=>choice('Разложи '+math(a*b+'x − '+b*c+' + '+a+'x² − '+c+'x')+'.',
    math('('+a+'x − '+c+')(x + '+b+')'),[math('('+a+'x − '+c+')(x − '+b+')'),math('('+a+'x + '+c+')(x + '+b+')'),math('('+a+'x − '+(c+1)+')(x + '+b+')')],
    'Ставим '+a+'x² рядом с '+a*b+'x. Из другой группы −'+c+'x − '+b*c+' выносим −'+c+'. Обе скобки равны x + '+b+'.'),
   signed_residual: ({a,b})=>['После группировки '+math(a+'x(x − '+b+') − '+a*b+'(x − '+b+')')+' получается '+math('(x − '+b+')('+a+'x + k)')+'. Найди k.',-a*b,
    'Общий множитель x − '+b+' оставляет '+a+'x и −'+a*b+'. Поэтому k = '+fmt(-a*b)+'.']
  },
  {
   grouping_with_second_degree: ({a,b,c})=>choice('Разложи '+math(a+'x³ − '+a*b+'x² + '+c+'x − '+b*c)+'.',
    math('('+a+'x² + '+c+')(x − '+b+')'),[math('('+a+'x² − '+c+')(x − '+b+')'),math('('+a+'x² + '+c+')(x + '+b+')'),math('('+a+'x² + '+(c+1)+')(x − '+b+')')],
    'В первой группе выносим '+a+'x², во второй '+c+'. Оставшиеся скобки равны x − '+b+'.'),
   grouping_then_value: ({a,b,c})=>['Сгруппируй члены '+math(a+'x² + '+a*b+'x + '+c+'x + '+b*c)+' и вычисли при x = '+(c+1)+'.',
    (a*(c+1)+c)*(c+1+b),'После группировки получаем ('+a+'x + '+c+')(x + '+b+'). Подставляем '+(c+1)+' и умножаем '+(a*(c+1)+c)+' на '+(c+1+b)+'.'],
   recover_missing_constant_to_group: ({a,b,c})=>['Найди k, чтобы '+math(a+'x² + '+a*b+'x − '+c+'x + k')+' раскладывался в '+math('('+a+'x − '+c+')(x + '+b+')')+'.',-b*c,
    'Первая группа уже содержит x + '+b+'. Чтобы во второй вышла такая же скобка, нужно −'+c+'(x + '+b+'). Отсюда k = '+fmt(-b*c)+'.'],
   choose_best_first_group: ({a,b,c})=>choice('Как выглядит один корректный шаг группировки '+math(a+'x² + '+a*b+'x − '+c+'x − '+b*c)+'?',
    math(a+'x(x + '+b+') − '+c+'(x + '+b+')'),[math(a+'x(x + '+b+') + '+c+'(x + '+b+')'),math(a+'x(x − '+b+') − '+c+'(x + '+b+')'),math(a+'x(x + '+b+') − '+c+'(x − '+b+')')],
    'Первые два члена дают '+a+'x(x + '+b+'), последние два дают −'+c+'(x + '+b+').')
  }
 ],
 division_with_remainder: [
  {
   read_remainder: ({a,b,c})=>{
    const d=b+2,r=1+c%(d-1),value=a*d+r;
    return ['Каков остаток от деления '+value+' на '+d+'?',r,value+' = '+d+' · '+a+' + '+r+'. Остаток меньше делителя.'];
   },
   read_quotient: ({a,b,c})=>{
    const d=b+2,r=1+c%(d-1),value=a*d+r;
    return ['Каково неполное частное при делении '+value+' на '+d+'?',a,d+' · '+a+' = '+a*d+', а следующее кратное '+d*(a+1)+' уже больше делимого.'];
   },
   rebuild_dividend: ({a,b,c})=>{
    const d=b+2,r=c%d;
    return ['Найди делимое, если делитель '+d+', неполное частное '+a+', остаток '+r+'.',a*d+r,'Умножаем '+a+' на '+d+', затем прибавляем '+r+'.'];
   },
   validate_remainder: ({a,b})=>checkStatement('При делении на '+b+' допустим остаток '+(a%2===0?b-1:b)+'?',a%2===0,
    'Остаток должен быть неотрицательным и строго меньше '+b+'.')
  },
  {
   recover_divisor: ({a,b,c})=>{
    const d=b+2,r=c%d;
    return ['При делении '+(a*d+r)+' получили неполное частное '+a+' и остаток '+r+'. Найди делитель.',d,
     'Вычитаем остаток, затем делим на неполное частное: '+a*d+' : '+a+' = '+d+'.'];
   },
   fill_last_box: ({a,b,c})=>{
    const d=b+2,r=1+c%(d-1),items=a*d+r;
    return ['В коробку входит '+d+' карандашей. Из '+items+' карандашей часть уложили в полные коробки, остальные — в последнюю. Сколько карандашей нужно добавить в последнюю коробку?',d-r,
     'В '+a+' полных коробках '+a*d+' карандашей. В последней '+r+'. Чтобы её заполнить, добавляем '+d+' − '+r+' = '+(d-r)+'.'];
   },
   remainder_conditions: ({a,b,c})=>{
    const d=b+2,r=c%d,answer=a*d+r;
    return choice('Какое число даёт неполное частное '+a+' и остаток '+r+' при делении на '+d+'?',String(answer),
     [String(answer+1),String(answer+d),String(answer-d)],'Используем равенство делимое = делитель · частное + остаток.');
   },
   next_multiple_suffix: ({a,b,c})=>{
    const d=b+2,r=c%d;
    return ['Найди ближайшее кратное '+d+', которое строго больше '+(a*d+r)+'.',d*(a+1),
     'Число находится между '+a*d+' и '+d*(a+1)+'. Если оно совпало с первым кратным, всё равно берём следующее.'];
   }
  },
  {
   sum_remainders: ({a,b,c,y})=>{
    const d=b+2,r=c%d,s=y%d;
    return ['Какой остаток при делении суммы '+(a*d+r)+' + '+((a+1)*d+s)+' на '+d+'?',(r+s)%d,
     'Кратные '+d+' дают остаток 0. Складываем '+r+' и '+s+' и находим остаток от деления их суммы на '+d+'.'];
   },
   product_remainders: ({a,b,c,y})=>{
    const d=b+2,r=c%d,s=y%d;
    return ['Найди остаток от деления произведения '+(a*d+r)+' · '+((a+1)*d+s)+' на '+d+'.',(r*s)%d,
     'При раскрытии скобок все слагаемые, кроме '+r+' · '+s+', кратны '+d+'. Остаётся найти остаток числа '+r*s+'.'];
   },
   count_valid_dividends: ({a,b})=>['Сколько натуральных чисел дают неполное частное '+a+' при делении на '+b+'?',b,
    'Делимое равно '+a*b+' + r. Допустимые r — целые числа от 0 до '+(b-1)+', их '+b+'.'],
   odd_even_remainder: ({a,b,c})=>{
    const d=2*b,r=c%d,truth=r%2===0;
    return checkStatement('Чётно ли число, которое при делении на '+d+' даёт неполное частное '+a+' и остаток '+r+'?',truth,
     'Кратное '+d+' чётно. Чётность делимого совпадает с чётностью остатка '+r+'.');
   }
  }
 ],
 square_sum_difference: [
  {
   expand_sum_square: ({a})=>polyChoice('Раскрой '+math('(x + '+a+')²')+'.',polynomial([1,2],[2*a,1],[a*a,0]),
    [polynomial([1,2],[a*a,0]),polynomial([1,2],[-2*a,1],[a*a,0]),polynomial([1,2],[a,1],[a*a,0])],
    '(x + '+a+')² = x² + 2 · x · '+a+' + '+a+'².'),
   middle_term_of_difference: ({a})=>['Найди коэффициент при x в '+math('(x − '+a+')²')+'.',-2*a,
    'Средний член равен −2 · x · '+a+' = −'+2*a+'x.'],
   free_term_of_square: ({a,b})=>['Чему равен свободный член '+math('('+a+'x − '+b+')²')+'?',b*b,
    'Свободный член — квадрат (−'+b+'), то есть '+b*b+'.'],
   leading_term_of_square: ({a,b})=>['Найди коэффициент при x² в '+math('('+a+'x + '+b+')²')+'.',a*a,
    'Член с x² получается из квадрата '+a+'x. Коэффициент равен '+a*a+'.']
  },
  {
   signed_square_choice: ({a,b})=>polyChoice('Представь многочленом '+math('(−'+a+'x + '+b+')²')+'.',
    polynomial([a*a,2],[-2*a*b,1],[b*b,0]),
    [polynomial([a*a,2],[2*a*b,1],[b*b,0]),polynomial([-a*a,2],[-2*a*b,1],[b*b,0]),polynomial([a*a,2],[-a*b,1],[b*b,0])],
    'Квадрат первого члена положителен. Средний член 2 · (−'+a+'x) · '+b+' = −'+2*a*b+'x.'),
   square_bivariate: ({a,b})=>['Найди коэффициент при xy в '+math('('+a+'x − '+b+'y)²')+'.',-2*a*b,
    'Удвоенное произведение даёт −2 · '+a+'x · '+b+'y = −'+2*a*b+'xy.'],
   convenient_square_below_round: ({a})=>['Вычисли '+math((100-a)+'²')+' по формуле квадрата разности.',(100-a)**2,
    'Представим число как 100 − '+a+'. Получаем 10 000 − '+200*a+' + '+a*a+' = '+(100-a)**2+'.'],
   detect_lost_middle: ({a,b})=>checkStatement('Верно ли тождество '+math('('+a+'x + '+b+')² = '+a*a+'x² + '+b*b)+'?',false,
    'При раскрытии получаем ещё средний член '+2*a*b+'x. Без него равенство не выполняется для всех x.')
  },
  {
   difference_of_shifted_squares: ({a,b,c})=>['Вычисли '+math('('+a+'x + '+b+')² − ('+a+'x − '+b+')²')+' при x = '+c+'.',4*a*b*c,
    'После раскрытия квадратные и свободные члены сокращаются. Остаётся '+4*a*b+'x. Подставляем '+c+' и получаем '+4*a*b*c+'.'],
   square_with_fractional_term: ({a,b,c})=>['Найди коэффициент при x после раскрытия ('+frac(a,b)+math('x − '+c+')²')+'.',rational(-2*a*c,b),
    'Средний коэффициент равен −2 · '+frac(a,b)+' · '+c+' = '+g7FracHtml(rational(-2*a*c,b))+'.'],
   recover_coefficient_in_square: ({a,b})=>['Найди k, если в '+math('('+a+'x + k)²')+' коэффициент при x равен '+fmt(-2*a*b)+'.',-b,
    'При x получается 2 · '+a+' · k. Приравниваем к '+fmt(-2*a*b)+' и делим на '+2*a+'.'],
   compare_shifts_squared: ({a,b})=>compare('Сравни '+math('('+a+' + '+b+')²')+' и '+math('('+a+' − '+b+')²')+'.',rational((a+b)**2),rational((a-b)**2),
    'При раскрытии общие квадраты сокращаются. Разность равна 4 · '+a+' · '+b+', она положительна.')
  }
 ],
 binomial_cube: [
  {
   expand_unit_cube: ({a})=>polyChoice('Раскрой '+math('(x + '+a+')³')+'.',polynomial([1,3],[3*a,2],[3*a*a,1],[a**3,0]),
    [polynomial([1,3],[a**3,0]),polynomial([1,3],[-3*a,2],[3*a*a,1],[a**3,0]),polynomial([1,3],[3*a,2],[a*a,1],[a**3,0])],
    'Применяем формулу куба суммы. Коэффициенты идут в порядке 1, 3, 3, 1.'),
   cubic_free_term: ({a,b})=>['Найди свободный член '+math('('+a+'x − '+b+')³')+'.',-(b**3),
    'Свободный член — (−'+b+')³ = '+fmt(-(b**3))+'.'],
   cubic_leading_term: ({a,b})=>['Найди коэффициент при x³ в '+math('(−'+a+'x + '+b+')³')+'.',-(a**3),
    'Куб первого слагаемого (−'+a+'x)³ даёт коэффициент '+fmt(-(a**3))+'.'],
   pick_cubic_sign_pattern: ({a})=>choice('Какие знаки по порядку имеют члены '+math('(x − '+a+')³')+' при записи от x³ до свободного члена?',
    '+ − + −',['+ + + −','+ − − +','− + − +'],'В кубе разности знаки чередуются, начиная с плюса.')
  },
  {
   quadratic_cubic_coefficient: ({a,b})=>['Найди коэффициент при x² в '+math('('+a+'x − '+b+')³')+'.',-3*a*a*b,
    'Коэффициент получается из −3 · ('+a+')² · '+b+': '+fmt(-3*a*a*b)+'.'],
   linear_cubic_coefficient: ({a,b})=>['Найди коэффициент при x в '+math('('+a+'x − '+b+')³')+'.',3*a*b*b,
    'Член с одной буквой x равен 3 · '+a+'x · '+b+'². Коэффициент '+3*a*b*b+'.'],
   cube_negative_binomial: ({a,b})=>polyChoice('Раскрой '+math('(−'+a+'x − '+b+')³')+'.',
    polynomial([-(a**3),3],[-3*a*a*b,2],[-3*a*b*b,1],[-(b**3),0]),
    [polynomial([a**3,3],[-3*a*a*b,2],[3*a*b*b,1],[-(b**3),0]),polynomial([-(a**3),3],[-(b**3),0]),polynomial([-(a**3),3],[3*a*a*b,2],[-3*a*b*b,1],[-(b**3),0])],
    'Выносим множитель −1 из скобки. Куб (−1) равен −1, поэтому меняем знаки всех членов куба суммы.'),
   compute_near_round_cube: ({a})=>['Вычисли куб числа '+(20-a)+', представив его как разность 20 и '+a+'.',(20-a)**3,
    'Формула даёт 8 000 − '+1200*a+' + '+60*a*a+' − '+a**3+' = '+(20-a)**3+'.']
  },
  {
   sum_opposite_cubes: ({a,b})=>['Найди коэффициент при x² в '+math('('+a+'x + '+b+')³ + ('+a+'x − '+b+')³')+'.',0,
    'Коэффициенты при x² равны '+3*a*a*b+' и '+fmt(-3*a*a*b)+'. Их сумма равна 0.'],
   difference_of_cubic_expansions: ({a,b})=>['Найди коэффициент при x² в '+math('('+a+'x + '+b+')³ − ('+a+'x − '+b+')³')+'.',6*a*a*b,
    'Из '+3*a*a*b+' вычитаем противоположное число. Получаем '+6*a*a*b+'.'],
   cube_of_bivariate_terms: ({a,b})=>['Найди коэффициент при xy² в '+math('('+a+'x − '+b+'y)³')+'.',3*a*b*b,
    'Здесь берём 3 · '+a+'x · ('+b+'y)². Коэффициент равен '+3*a*b*b+'.'],
   find_unknown_cubic_term: ({a,b})=>['Найди k, если при раскрытии '+math('('+a+'x + k)³')+' коэффициент при x² равен '+fmt(-3*a*a*b)+'.',-b,
    'Коэффициент при x² равен '+3*a*a+'k. Приравниваем к '+fmt(-3*a*a*b)+' и делим на '+3*a*a+'.']
  }
 ],
 perfect_square_factor: [
  {
   factor_square_sum: ({a})=>choice('Представь '+math('x² + '+2*a+'x + '+a*a)+' квадратом двучлена.',math('(x + '+a+')²'),
    [math('(x − '+a+')²'),math('(x + '+a*a+')²'),math('(x + '+(a+1)+')²')],
    'Крайние члены — x² и '+a+'². Средний член +2 · x · '+a+'.'),
   factor_square_difference: ({a})=>choice('Разложи '+math('x² − '+2*a+'x + '+a*a)+'.',math('(x − '+a+')²'),
    [math('(x + '+a+')²'),math('(x − '+a+')³'),math('(x − '+(a+1)+')²')],
    'Квадраты крайних членов дают x и '+a+'. Минус перед удвоенным произведением даёт разность.'),
   recover_middle_number: ({a})=>['Запиши коэффициент при x в '+math('x² + kx + '+a*a)+', чтобы он был квадратом суммы x и '+a+'.',2*a,
    'Слагаемое при x равно 2 · x · '+a+'. Поэтому k = '+2*a+'.'],
   identify_non_square: ({a})=>checkStatement('Можно ли записать '+math('x² + '+a*a)+' как (x + '+a+')²?',false,
    'При раскрытии (x + '+a+')² появился бы член '+2*a+'x. В исходном выражении его нет.')
  },
  {
   factor_nonunit_square: ({a,b})=>choice('Разложи '+math(a*a+'x² − '+2*a*b+'x + '+b*b)+'.',math('('+a+'x − '+b+')²'),
    [math('('+a+'x + '+b+')²'),math('('+a+'x − '+(b+1)+')²'),math('('+(a+1)+'x − '+b+')²')],
    'Крайние члены равны ('+a+'x)² и '+b+'². Средний член равен −2 · '+a+'x · '+b+'.'),
   factor_bivariate_square: ({a,b})=>choice('Разложи '+math(a*a+'x² + '+2*a*b+'xy + '+b*b+'y²')+'.',math('('+a+'x + '+b+'y)²'),
    [math('('+a+'x − '+b+'y)²'),math('('+a+'x + '+(b+1)+'y)²'),math('('+(a+1)+'x + '+b+'y)²')],
    'Крайние члены — квадраты '+a+'x и '+b+'y. Средний член их удвоенное произведение со знаком плюс.'),
   recover_constant_for_square: ({a,b})=>['Найди свободный член k, если '+math(a*a+'x² − '+2*a*b+'x + k')+' — квадрат разности.',b*b,
    'Линейный коэффициент равен −2 · '+a+' · '+b+'. Второй член двучлена '+b+', а свободный член '+b*b+'.'],
   rearrange_square_terms: ({a,b})=>choice('Представь '+math(b*b+' − '+2*a*b+'x + '+a*a+'x²')+' квадратом.',math('('+a+'x − '+b+')²'),
    [math('('+a+'x + '+b+')²'),math('('+a+'x − '+(b+1)+')²'),math('('+b+'x − '+a+')³')],
    'Сначала переставляем слагаемые по убыванию степеней. Затем узнаём квадрат разности.')
  },
  {
   factor_and_evaluate_square: ({a,b,c})=>['Разложи '+math(a*a+'x² − '+2*a*b+'x + '+b*b)+' и вычисли при x = '+c+'.',(a*c-b)**2,
    'Получаем ('+a+'x − '+b+')². Подставляем '+c+': ('+fmt(a*c-b)+')² = '+(a*c-b)**2+'.'],
   common_factor_then_square: ({a,b,c})=>choice('Разложи '+math(c*a*a+'x² + '+2*c*a*b+'x + '+c*b*b)+' на множители.',
    math(c+'('+a+'x + '+b+')²'),[math(c+'('+a+'x − '+b+')²'),math('('+(c*a)+'x + '+b+')²'),math(c+'('+a+'x + '+(b+1)+')²')],
    'Выносим '+c+'. После деления остаётся квадрат суммы '+a+'x и '+b+'.'),
   zero_of_perfect_square: ({a,b})=>['При каком x '+math(a*a+'x² − '+2*a*b+'x + '+b*b)+' равно 0?',rational(b,a),
    'Выражение равно ('+a+'x − '+b+')². Квадрат равен нулю только при '+a+'x − '+b+' = 0.'],
   factor_degree_four_square: ({a,b})=>choice('Представь '+math(a*a+'x⁴ − '+2*a*b+'x² + '+b*b)+' квадратом двучлена.',
    math('('+a+'x² − '+b+')²'),[math('('+a+'x² + '+b+')²'),math('('+a+'x − '+b+')²'),math('('+a+'x² − '+(b+1)+')²')],
    'Квадрат '+a+'x² даёт '+a*a+'x⁴. Удвоенное произведение с (−'+b+') соответствует среднему члену.')
  }
 ],
 difference_of_squares: [
  {
   expand_conjugate_pair: ({a})=>polyChoice('Раскрой '+math('(x − '+a+')(x + '+a+')')+'.',polynomial([1,2],[-a*a,0]),
    [polynomial([1,2],[a*a,0]),polynomial([1,2],[2*a,1],[-a*a,0]),polynomial([1,2],[-a,0])],
    'Средние члены −'+a+'x и '+a+'x сокращаются. Остаётся x² − '+a*a+'.'),
   constant_of_conjugates: ({a,b})=>['Найди свободный член '+math('('+a+'x + '+b+')('+a+'x − '+b+')')+'.',-b*b,
    'По формуле произведение равно ('+a+'x)² − '+b+'². Свободный член '+fmt(-b*b)+'.'],
   leading_of_conjugates: ({a,b})=>['Найди коэффициент при x² в '+math('('+a+'x − '+b+')('+a+'x + '+b+')')+'.',a*a,
    'Первый член — квадрат '+a+'x. Его коэффициент '+a*a+'.'],
   identify_conjugate_pair: ({a,b})=>choice('На какой множитель надо умножить '+math('('+a+'x − '+b+')')+', чтобы получить '+math(a*a+'x² − '+b*b)+'?',
    math('('+a+'x + '+b+')'),[math('('+a+'x − '+b+')'),math('('+a+'x + '+(b+1)+')'),math('('+a+'x − '+(b+1)+')')],
    'Первый множитель — разность '+a+'x и '+b+'. Второй — их сумма.')
  },
  {
   conjugate_two_variables: ({a,b})=>polyChoice('Умножь '+math('('+a+'x − '+b+'y)('+a+'x + '+b+'y)')+'.',
    [monomial(a*a,2,0),monomial(-b*b,0,2)],
    [[monomial(a*a,2,0),monomial(b*b,0,2)],[monomial(a*a,2,0),monomial(-b,0,2)],[monomial(a*a,2,0),monomial(-b*b,0,2),monomial(a*b,1,1)]],
    'Получаем разность квадратов '+a+'x и '+b+'y. Члены при xy сокращаются.'),
   near_round_product: ({a})=>['Вычисли '+math((100-a)+' · '+(100+a))+'.',10000-a*a,
    'Множители имеют вид 100 − '+a+' и 100 + '+a+'. Получаем 100² − '+a+'² = '+(10000-a*a)+'.'],
   coefficient_for_middle_cancellation: ({a,b})=>['При каком k в '+math('('+a+'x + '+b+')('+a+'x + k)')+' исчезает член при x?',-b,
    'Средний коэффициент '+a+'('+b+' + k). Он равен нулю, если k = '+fmt(-b)+'.'],
   conjugate_with_higher_degree: ({a,b})=>polyChoice('Раскрой '+math('('+a+'x² + '+b+')('+a+'x² − '+b+')')+'.',polynomial([a*a,4],[-b*b,0]),
    [polynomial([a*a,2],[-b*b,0]),polynomial([a*a,4],[b*b,0]),polynomial([a*a,4],[-b,0])],
    'Возводим '+a+'x² в квадрат, получаем '+a*a+'x⁴. Вычитаем '+b+'².')
  },
  {
   cancel_two_conjugate_products: ({a,b,c})=>['Упрости '+math('('+a+'x + '+b+')('+a+'x − '+b+') − ('+a+'x + '+(b+c)+')('+a+'x − '+(b+c)+')')+' и найди значение.',
    (b+c)**2-b*b,'Каждое произведение становится разностью квадратов. Члены с x² сокращаются. Остаётся '+(b+c)+'² − '+b+'² = '+((b+c)**2-b*b)+'.'],
   product_with_composite_terms: ({a,b,c})=>['Чему равен коэффициент при x в '+math('('+a+'x + '+b+' − '+c+')('+a+'x + '+b+' + '+c+')')+'?',2*a*b,
    'Общая часть равна '+a+'x + '+b+'. После применения формулы получаем ('+a+'x + '+b+')² − '+c+'². Линейный коэффициент '+2*a*b+'.'],
   numeric_conjugate_and_fraction: ({a,b})=>['Вычисли ('+a+' − '+frac(1,b)+')('+a+' + '+frac(1,b)+').',rational(a*a*b*b-1,b*b),
    'По формуле получаем '+a*a+' − '+frac(1,b*b)+' = '+g7FracHtml(rational(a*a*b*b-1,b*b))+'.'],
   evaluate_difference_of_products: ({a,b,c})=>['Вычисли '+math('('+a+' + '+b+')('+a+' − '+b+') − ('+a+' + '+c+')('+a+' − '+c+')')+'.',c*c-b*b,
    'После применения формулы квадрат '+a*a+' сокращается. Остаётся '+c*c+' − '+b*b+' = '+fmt(c*c-b*b)+'.']
  }
 ],
 factor_difference_squares: [
  {
   factor_monic_difference: ({a})=>choice('Разложи '+math('x² − '+a*a)+' на множители.',
    math('(x − '+a+')(x + '+a+')'),[math('(x − '+a+')²'),math('(x + '+a+')²'),math('(x − '+a*a+')(x + '+a*a+')')],
    'Второй член — квадрат '+a+'. Записываем произведение разности и суммы.'),
   find_square_term: ({a,b})=>['Какое положительное число B нужно взять в '+math('('+a+'x − B)('+a+'x + B) = '+a*a+'x² − '+b*b)+'?',b,
    'B² должно равняться '+b*b+'. Подходит положительный корень '+b+'.'],
   factor_nonunit_difference: ({a,b})=>choice('Разложи '+math(a*a+'x² − '+b*b)+'.',
    math('('+a+'x − '+b+')('+a+'x + '+b+')'),[math('('+a+'x − '+b+')²'),math('('+a+'x − '+b*b+')('+a+'x + '+b*b+')'),math('('+a*a+'x − '+b+')('+a*a+'x + '+b+')')],
    'Крайние квадраты имеют основания '+a+'x и '+b+'.'),
   distinguish_difference: ({a,b})=>checkStatement('Верно ли '+math(a*a+'x² + '+b*b+' = ('+a+'x − '+b+')('+a+'x + '+b+')')+'?',false,
    'При умножении правой части получается разность. Знак перед '+b*b+' должен быть минусом.')
  },
  {
   factor_bivariate_difference: ({a,b})=>choice('Разложи '+math(a*a+'x² − '+b*b+'y²')+'.',
    math('('+a+'x − '+b+'y)('+a+'x + '+b+'y)'),[math('('+a+'x − '+b+'y)²'),math('('+a+'x + '+b+'y)²'),math('('+a+'x − '+(b+1)+'y)('+a+'x + '+(b+1)+'y)')],
    'Квадратами являются ('+a+'x)² и ('+b+'y)². Берём разность и сумму этих оснований.'),
   factor_fourth_degree_difference: ({a,b})=>choice('Разложи '+math(a*a+'x⁴ − '+b*b)+'.',
    math('('+a+'x² − '+b+')('+a+'x² + '+b+')'),[math('('+a+'x − '+b+')('+a+'x + '+b+')'),math('('+a+'x² − '+b+')²'),math('('+a+'x² + '+b+')²')],
    'Квадрат '+a+'x² даёт '+a*a+'x⁴. Оба множителя содержат x².'),
   factor_to_compute: ({a,b})=>['Вычисли '+math((a+b)+'² − '+a+'²')+', разложив разность квадратов.',b*(2*a+b),
    'Разность оснований '+b+', сумма '+(2*a+b)+'. Их произведение '+b*(2*a+b)+'.'],
   root_from_factorization: ({a,b})=>choice('Какие x обращают '+math(a*a+'x² − '+a*a*b*b)+' в ноль?',
    fmt(-b)+' и '+b,[String(b),fmt(-b),'0 и '+b],
    'Разложение даёт '+a*a+'(x − '+b+')(x + '+b+'). Подходит каждое из двух противоположных значений.')
  },
  {
   common_then_conjugate: ({a,b,c})=>choice('Разложи '+math(c*a*a+'x² − '+c*b*b)+' на множители.',
    math(c+'('+a+'x − '+b+')('+a+'x + '+b+')'),
    [math(c+'('+a+'x − '+b+')²'),math(c+'('+a+'x − '+(b+1)+')('+a+'x + '+(b+1)+')'),math('('+c*a+'x − '+b+')('+c*a+'x + '+b+')')],
    'Выносим '+c+'. Внутри остаётся разность квадратов '+a+'x и '+b+'.'),
   difference_of_composite_squares: ({a,b,c})=>choice('Разложи '+math('('+a+'x + '+b+')² − '+c+'²')+'.',
    math('('+a+'x'+signed(b-c)+')('+a+'x + '+(b+c)+')'),
    [math('('+a+'x + '+(b+c)+')²'),math('('+a+'x'+signed(b-c)+')²'),math('('+a+'x + '+(b+c+1)+')('+a+'x'+signed(b-c)+')')],
    'Первое основание '+a+'x + '+b+', второе '+c+'. Вычитаем и прибавляем '+c+' к первому основанию.'),
   factor_difference_twice: ({a})=>choice('Разложи '+math('x⁴ − '+a**4)+' на множители так, чтобы множитель x² − '+a*a+' был тоже разложен.',
    math('(x − '+a+')(x + '+a+')(x² + '+a*a+')'),
    [math('(x − '+a+')(x + '+a+')(x² − '+a*a+')'),math('(x − '+a+')²(x² + '+a*a+')'),math('(x − '+a+')(x + '+a+')(x² + '+(a*a+1)+')')],
    'Сначала получаем (x² − '+a*a+')(x² + '+a*a+'). Затем раскладываем первый множитель ещё раз.'),
   combine_then_find_root: ({a,b,c})=>['Найди больший корень '+math('('+a+'x + '+b+')² − '+c*c+' = 0')+'.',rational(c-b,a),
    'Первое основание равно '+c+' или '+fmt(-c)+'. При положительном коэффициенте '+a+' больший корень получается из '+a+'x + '+b+' = '+c+'.']
  }
 ],
 sum_difference_cubes: [
  {
   identify_sum_factors: ({a})=>choice('Разложи '+math('x³ + '+a**3)+'.',
    math('(x + '+a+')(x² − '+a+'x + '+a*a+')'),
    [math('(x + '+a+')(x² + '+a+'x + '+a*a+')'),math('(x − '+a+')(x² − '+a+'x + '+a*a+')'),math('(x + '+a+')³')],
    'В первом множителе сумма. Во второй скобке средний член имеет минус, крайние члены положительны.'),
   identify_difference_factors: ({a})=>choice('Разложи '+math('x³ − '+a**3)+'.',
    math('(x − '+a+')(x² + '+a+'x + '+a*a+')'),
    [math('(x − '+a+')(x² − '+a+'x + '+a*a+')'),math('(x + '+a+')(x² + '+a+'x + '+a*a+')'),math('(x − '+a+')³')],
    'Для разности кубов в первой скобке минус, а в трёхчлене все знаки плюс.'),
   missing_base_of_cube: ({a,b})=>['Какое положительное B нужно в формуле для '+math(a**3+'x³ + '+b**3)+' в виде A³ + B³?',b,
    'Второй член равен '+b+'³. Значит, B = '+b+'.'],
   middle_sign_cubic_factor: ({a})=>['Найди коэффициент при x во втором множителе разложения '+math('x³ + '+a**3)+' по формуле суммы кубов.',-a,
    'Вторая скобка равна x² − '+a+'x + '+a*a+'. Средний коэффициент '+fmt(-a)+'.']
  },
  {
   factor_nonunit_difference_cubes: ({a,b})=>choice('Разложи '+math(a**3+'x³ − '+b**3)+'.',
    math('('+a+'x − '+b+')('+a*a+'x² + '+a*b+'x + '+b*b+')'),
    [math('('+a+'x − '+b+')('+a*a+'x² − '+a*b+'x + '+b*b+')'),math('('+a+'x + '+b+')('+a*a+'x² + '+a*b+'x + '+b*b+')'),math('('+a+'x − '+b+')³')],
    'Первый множитель '+a+'x − '+b+'. Второй содержит квадрат '+a+'x, произведение '+a+'x и '+b+', и квадрат '+b+'.'),
   factor_bivariate_sum_cubes: ({a,b})=>choice('Разложи '+math(a**3+'x³ + '+b**3+'y³')+'.',
    math('('+a+'x + '+b+'y)('+a*a+'x² − '+a*b+'xy + '+b*b+'y²)'),
    [math('('+a+'x + '+b+'y)('+a*a+'x² + '+a*b+'xy + '+b*b+'y²)'),math('('+a+'x − '+b+'y)('+a*a+'x² − '+a*b+'xy + '+b*b+'y²)'),math('('+a+'x + '+b+'y)³')],
    'A = '+a+'x, B = '+b+'y. Во втором множителе берём A² − AB + B².'),
   cubic_difference_quotient: ({a,b})=>['Вычисли '+frac(a**3+' − '+(a+b)**3,a+' − '+(a+b))+'.',a*a+a*(a+b)+(a+b)**2,
    'Делим разность кубов на разность оснований. Остаётся сумма квадратов оснований и их произведения.'],
   cubic_sum_quotient: ({a,b})=>['Вычисли '+frac(a**3+' + '+b**3,a+' + '+b)+'.',a*a-a*b+b*b,
    'Делим сумму кубов на сумму оснований. Получаем '+a*a+' − '+a*b+' + '+b*b+' = '+(a*a-a*b+b*b)+'.']
  },
  {
   factor_high_power_cubes: ({a,b})=>choice('Разложи '+math(a**3+'x⁶ − '+b**3)+'.',
    math('('+a+'x² − '+b+')('+a*a+'x⁴ + '+a*b+'x² + '+b*b+')'),
    [math('('+a+'x² + '+b+')('+a*a+'x⁴ + '+a*b+'x² + '+b*b+')'),math('('+a+'x² − '+b+')('+a*a+'x⁴ − '+a*b+'x² + '+b*b+')'),math('('+a+'x² − '+b+')³')],
    'Первое основание куба — '+a+'x². Применяем формулу разности с основаниями '+a+'x² и '+b+'.'),
   factor_after_common_cubic: ({a,b,c})=>choice('Разложи '+math(c*a**3+'x³ + '+c*b**3)+'.',
    math(c+'('+a+'x + '+b+')('+a*a+'x² − '+a*b+'x + '+b*b+')'),
    [math(c+'('+a+'x + '+b+')('+a*a+'x² + '+a*b+'x + '+b*b+')'),math(c+'('+a+'x − '+b+')('+a*a+'x² − '+a*b+'x + '+b*b+')'),math(c+'('+a+'x + '+b+')³')],
    'Выносим '+c+', затем раскладываем оставшуюся сумму кубов.'),
   infer_cubic_multiplier_coefficient: ({a,b})=>['Найди k в '+math('('+a+'x + '+b+')('+a*a+'x² + kx + '+b*b+') = '+a**3+'x³ + '+b**3)+'.',-a*b,
    'По формуле суммы кубов средний член второй скобки равен −('+a+'x) · '+b+'. Отсюда k = '+fmt(-a*b)+'.'],
   compare_cancelled_cube_quotients: ({a,b})=>{
    const first=a+b;
    return compare('Сравни '+frac(first**3+' − '+a**3,first+' − '+a)+' и '+frac(first**3+' + '+a**3,first+' + '+a)+'.',
     rational(first*first+first*a+a*a),rational(first*first-first*a+a*a),
     'В первом частном среднее слагаемое положительно, во втором оно отрицательно. Крайние квадраты совпадают.');
   }
  }
 ],
 integer_expression_transform: [
  {
   square_minus_tail: ({a,b})=>simplify('(x + '+a+')² − x² − '+b,2*a,a*a-b,
    'Раскрываем квадрат суммы. Члены x² сокращаются, остаются '+2*a+'x и '+fmt(a*a-b)+'.'),
   identify_constant_after_transform: ({a,b})=>['Найди свободный член '+math('(x − '+a+')² + '+b)+'.',a*a+b,
    'Свободный член квадрата равен '+a*a+'. Прибавляем '+b+'.'],
   cancel_middle_with_binomial: ({a,b})=>polyChoice('Упрости '+math('('+a+'x + '+b+')² − '+2*a*b+'x')+'.',polynomial([a*a,2],[b*b,0]),
    [polynomial([a*a,2],[-b*b,0]),polynomial([a,2],[b*b,0]),polynomial([a*a,2],[b*b+1,0])],
    'При раскрытии квадрата средний член равен '+2*a*b+'x. Он сокращается с вычитаемым.'),
   recognize_constant_expression: ({a,b})=>['Какое значение принимает '+math(a+'(x + '+b+') − '+a+'x')+' при любом x?',a*b,
    'Раскрываем скобки. Слагаемые '+a+'x и −'+a+'x сокращаются, остаётся '+a*b+'.']
  },
  {
   subtract_conjugate_from_square: ({a,b})=>simplify('('+a+'x + '+b+')² − ('+a+'x − '+b+')('+a+'x + '+b+')',2*a*b,2*b*b,
    'Первое выражение даёт квадрат суммы, второе — разность квадратов. Члены x² сокращаются. Остаётся '+2*a*b+'x + '+2*b*b+'.'),
   coefficient_after_cubic_cancellation: ({a,b})=>['Найди коэффициент при x в '+math('(x + '+a+')³ − x³ − '+b+'x')+'.',3*a*a-b,
    'Куб суммы даёт при x коэффициент '+3*a*a+'. Вычитаем '+b+' и получаем '+fmt(3*a*a-b)+'.'],
   simplify_for_point_value: ({a,b,c})=>['Упрости '+math('(x + '+a+')² − (x − '+a+')² − '+b+'x')+' и вычисли при x = '+c+'.',(4*a-b)*c,
    'При вычитании квадратов сокращаются x² и '+a*a+'. Остаётся '+fmt(4*a-b)+'x. Подставляем '+c+'.'],
   two_expansions: ({a,b,c})=>polyChoice('Представь многочленом '+math('(x + '+a+')(x − '+a+') + (x − '+b+')² − '+c)+'.',
    polynomial([2,2],[-2*b,1],[b*b-a*a-c,0]),
    [polynomial([2,2],[2*b,1],[b*b-a*a-c,0]),polynomial([2,2],[-2*b,1],[b*b+a*a-c,0]),polynomial([1,2],[-2*b,1],[b*b-a*a-c,0])],
    'Первое произведение даёт x² − '+a*a+', квадрат разности даёт x² − '+2*b+'x + '+b*b+'. Суммируем и вычитаем '+c+'.')
  },
  {
   transform_cube_pair: ({a,b})=>polyChoice('Упрости '+math('(x + '+a+')³ + (x − '+a+')³ − '+b+'x')+'.',
    polynomial([2,3],[6*a*a-b,1]),
    [polynomial([2,3],[3*a*a-b,1]),polynomial([2,3],[6*a*a-b+1,1]),polynomial([1,3],[6*a*a-b,1])],
    'Коэффициенты при x² и свободные члены сокращаются. Оба куба дают вклад '+3*a*a+'x.'),
   recover_for_constant: ({a,b})=>['Найди k, чтобы '+math('('+a+'x + '+b+')² − '+a*a+'x² − kx')+' принимало одно и то же значение при любом x.',2*a*b,
    'Члены x² сокращаются. Остаётся ('+2*a*b+' − k)x + '+b*b+'. Для постоянного значения нужен k = '+2*a*b+'.'],
   apply_two_formulas_then_substitute: ({a,b,c})=>['Вычисли '+math('(x + '+a+')² − (x − '+a+')² − (x + '+b+')(x − '+b+')')+' при x = '+c+'.',
    4*a*c-c*c+b*b,'Первые два квадрата дают '+4*a+'x. Последнее произведение равно x² − '+b*b+'. Получаем '+g7PolynomialHtml(polynomial([-1,2],[4*a,1],[b*b,0]))+'.'],
   detect_polynomial_identity: ({a,b,c})=>{
    const truth=c%2===0;
    return checkStatement('Верно ли тождество '+math('('+a+'x + '+b+')² − ('+a+'x − '+b+')² = '+(4*a*b+Number(!truth))+'x')+'?',
     truth,'Квадратные и свободные члены сокращаются, остаётся '+4*a*b+'x.');
   }
  }
 ],
 combined_factorization: [
  {
   extract_then_difference: ({a,b})=>choice('Укажи разложение '+math(a+'x² − '+a*b*b)+' с вынесенным коэффициентом.',
    math(a+'(x − '+b+')(x + '+b+')'),[math(a+'(x − '+b+')²'),math(a+'(x + '+b+')²'),math(a+'(x − '+(b+1)+')(x + '+(b+1)+')')],
    'Выносим '+a+', затем раскладываем x² − '+b*b+'.'),
   choose_first_step: ({a,b})=>choice('Какой наибольший общий одночлен сначала вынести из '+math(a+'x³ − '+a*b*b+'x')+'?',
    math(a+'x'),[math(a+'x²'),math((a+1)+'x'),math(a*b*b+'x')],
    'НОД коэффициентов '+a+'. Меньший показатель x равен 1.'),
   extract_then_square: ({a,b})=>choice('Разложи '+math(a+'x² + '+2*a*b+'x + '+a*b*b)+'.',math(a+'(x + '+b+')²'),
    [math(a+'(x − '+b+')²'),math(a+'(x + '+(b+1)+')²'),math((a+1)+'(x + '+b+')²')],
    'После вынесения '+a+' остаётся x² + '+2*b+'x + '+b*b+', это квадрат суммы.'),
   count_factors_from_factoring: ({a})=>['Разложи '+math('x³ − '+a*a+'x')+' по общему множителю и разности квадратов. Сколько линейных множителей получилось?',3,
    'Получаем x(x − '+a+')(x + '+a+'). Здесь три множителя первой степени.']
  },
  {
   extract_then_cube: ({a,b})=>choice('Разложи '+math(a+'x⁴ − '+a*b**3+'x')+'.',
    math(a+'x(x − '+b+')(x² + '+b+'x + '+b*b+')'),
    [math(a+'x(x + '+b+')(x² + '+b+'x + '+b*b+')'),math(a+'x(x − '+b+')³'),math(a+'x(x − '+b+')(x² − '+b+'x + '+b*b+')')],
    'Выносим '+a+'x. Для x³ − '+b**3+' применяем разность кубов.'),
   factor_after_chain_grouping: ({a,b})=>choice('Разложи '+math('x³ + '+a+'x² − '+b*b+'x − '+a*b*b)+'.',
    math('(x + '+a+')(x − '+b+')(x + '+b+')'),
    [math('(x + '+a+')(x − '+b+')²'),math('(x − '+a+')(x − '+b+')(x + '+b+')'),math('(x + '+a+')(x − '+(b+1)+')(x + '+(b+1)+')')],
    'Группируем и выносим x + '+a+'. В другой скобке остаётся x² − '+b*b+'.'),
   combine_square_and_outer_factor: ({a,b})=>['Найди больший корень '+math(a+'x(x² − '+2*b+'x + '+b*b+') = 0')+'.',b,
    'Трёхчлен равен (x − '+b+')². Подходят x = 0 и x = '+b+'. Больший корень '+b+'.'],
   spot_next_factor_step: ({a,b})=>choice('После вынесения '+a+'x получено '+math(a+'x(x² + '+2*b+'x + '+b*b+')')+'. Какой следующий шаг?',
    'Свернуть трёхчлен в квадрат суммы',['Применить разность квадратов','Применить разность кубов','Убрать множитель '+a+'x'],
    'Свободный член равен '+b+'², средний член равен 2 · x · '+b+'.')
  },
  {
   extract_double_difference: ({a,b})=>choice('Разложи '+math(a+'x⁵ − '+a*b**4+'x')+' и не оставляй разности квадратов в итоговых множителях.',
    math(a+'x(x − '+b+')(x + '+b+')(x² + '+b*b+')'),
    [math(a+'x(x − '+b+')²(x² + '+b*b+')'),math(a+'x(x − '+b+')(x + '+b+')(x² − '+b*b+')'),math(a+'x(x − '+b+')(x + '+b+')(x² + '+(b*b+1)+')')],
    'Выносим '+a+'x. Разлагаем x⁴ − '+b**4+', затем разлагаем x² − '+b*b+'.'),
   group_then_squared_binomial: ({a,b})=>{
    const terms=polynomial([1,3],[2*a+b,2],[a*a+2*a*b,1],[a*a*b,0]);
    return choice('Разложи '+g7PolynomialHtml(terms)+' так, чтобы один множитель был квадратом двучлена.',
     math('(x + '+b+')(x + '+a+')²'),
     [math('(x + '+b+')(x − '+a+')²'),math('(x + '+b+')(x + '+(a+1)+')²'),math('(x + '+(b+1)+')(x + '+a+')²')],
     'Сгруппируй как x(x² + '+2*a+'x + '+a*a+') + '+b+'(x² + '+2*a+'x + '+a*a+'). Общая скобка равна (x + '+a+')².');
   },
   solve_three_roots_by_factoring: ({a,b})=>choice('Найди все корни '+math(a+'x³ − '+a*b*b+'x = 0')+'.',
    fmt(-b)+', 0 и '+b,[fmt(-b)+' и '+b,'0 и '+b,fmt(-b)+', 0 и '+(b+1)],
    'Произведение '+a+'x(x − '+b+')(x + '+b+') равно нулю, когда нулю равен один из трёх линейных множителей.'),
   infer_unknown_after_factoring: ({a,b})=>['Найди k, если '+math(a+'x³ − kx')+' раскладывается как '+math(a+'x(x − '+b+')(x + '+b+')')+'.',a*b*b,
    'Сначала перемножаем две скобки и получаем x² − '+b*b+'. Умножаем на '+a+'x и сравниваем линейный коэффициент.']
  }
 ],
 higher_binomial_power: [
  {
   leading_fourth_term: ({a,b})=>['Найди коэффициент при x⁴ в '+math('('+a+'x + '+b+')⁴')+'.',a**4,
    'Член степени 4 получается выбором '+a+'x из каждой из четырёх скобок.'],
   constant_in_odd_power: ({a,b})=>['Найди свободный член '+math('('+a+'x − '+b+')⁵')+'.',-(b**5),
    'Чтобы не осталось x, в каждой скобке берём −'+b+'. Нечётная степень даёт отрицательный результат.'],
   fourth_power_as_repetition: ({a,b})=>choice('Как представить '+math('('+a+'x − '+b+')⁴')+' произведением двух одинаковых выражений?',
    math('('+a+'x − '+b+')² · ('+a+'x − '+b+')²'),
    [math('('+a+'x − '+b+')³ · ('+a+'x − '+b+')³'),math('('+a+'x − '+b+')² + ('+a+'x − '+b+')²'),math('('+a+'x − '+b+') · ('+a+'x − '+b+')')],
    'При умножении степеней с одинаковым основанием показатели складываются. Два квадрата дают показатель 2 + 2 = 4.'),
   fourth_power_value: ({a,b})=>['Найди значение '+math('(x + '+b+')⁴')+' при x = '+fmt(a-b)+'.',a**4,
    'Сначала подставляем x. Скобка равна '+a+', затем возводим это число в четвёртую степень.']
  },
  {
   cubic_coefficient_fourth_power: ({a,b})=>['Найди коэффициент при x³ в '+math('('+a+'x − '+b+')⁴')+'.',-4*a**3*b,
    'Свободный член выбираем из одной скобки, это можно сделать четырьмя способами. Остальные три скобки дают '+a**3+'x³.'],
   quadratic_coefficient_fourth_power: ({b})=>['Найди коэффициент при x² в '+math('(x + '+b+')⁴')+'.',6*b*b,
    'Из четырёх скобок выбираем две для x. Есть 6 пар скобок. Две оставшиеся дают '+b*b+'.'],
   first_term_lost_power: ({b})=>['Найди коэффициент при x⁴ в '+math('(x − '+b+')⁵')+'.',-5*b,
    'В четырёх скобках берём x. В одной из пяти берём −'+b+', поэтому коэффициент −'+5*b+'.'],
   all_signs_sixth_power: ({a,b})=>checkStatement('У всех ненулевых коэффициентов '+math('('+a+'x − '+b+')⁶')+' знак плюс?',false,
    'Коэффициент при x⁵ равен −6 · '+a+'⁵ · '+b+' и отрицателен.')
  },
  {
   choose_two_constants: ({a,b})=>['Найди коэффициент при x⁴ в '+math('('+a+'x − '+b+')⁶')+'.',15*a**4*b*b,
    'Выбираем две из шести скобок для −'+b+': 6 · 5 : 2 = 15 способов. Остальные дают '+a**4+'x⁴.'],
   choose_three_constants: ({a,b})=>['Найди коэффициент при x³ в '+math('('+a+'x − '+b+')⁶')+'.',-20*a**3*b**3,
    'Выбираем три из шести скобок: 6 · 5 · 4 : (3 · 2 · 1) = 20. Три минуса дают отрицательный знак.'],
   parity_cancellation: ({a,b})=>['Найди коэффициент при x³ в '+math('('+a+'x + '+b+')⁴ + ('+a+'x − '+b+')⁴')+'.',0,
    'Для x³ один свободный множитель берётся со знаком +, другой со знаком −. Слагаемые сокращаются.'],
   recover_binomial_constant: ({a,b})=>['Найди k, если в '+math('('+a+'x + k)⁵')+' коэффициент при x⁴ равен '+fmt(-5*a**4*b)+'.',-b,
    'Коэффициент при x⁴ равен 5 · '+a**4+' · k. Делим заданное число на '+(5*a**4)+' и получаем '+fmt(-b)+'.']
  }
 ],
 linear_equation_two_variables: [
  {
   check_integer_pair: ({a,b,c})=>{
    const truth=c%2===0,right=a+b+Number(!truth);
    return checkStatement('Является ли ('+a+'; '+b+') решением '+math('x + y = '+right)+'?',truth,'Слева при подстановке получаем '+a+' + '+b+' = '+(a+b)+'.');
   },
   find_y_given_x: ({a,b,c})=>['В уравнении '+math(a+'x + y = '+(a*b+c))+' известно x = '+b+'. Найди y.',c,
    'Вычитаем '+a*b+' из правой части. Получаем y = '+c+'.'],
   find_x_given_y: ({a,b,c})=>['В уравнении '+math('x − '+a+'y = '+fmt(b-a*c))+' известно y = '+c+'. Найди x.',b,
    'Прибавляем '+a*c+' к обеим частям. x = '+fmt(b-a*c)+' + '+a*c+' = '+b+'.'],
   choose_equation_pair: ({a,b})=>choice('Какая пара удовлетворяет '+math('x + y = '+(a+b))+'?',
    pair(a,b),[pair(a+1,b),pair(a,b+1),pair(a+b,1)],'Проверяем сложением координат. У верной пары сумма '+(a+b)+'.')
  },
  {
   check_signed_pair: ({a,b,c})=>{
    const truth=c%2===0,left=-a*b+c,right=left+Number(!truth);
    return checkStatement('Подходит ли '+pair(fmt(-b),c)+' для '+math(a+'x + y = '+fmt(right))+'?',truth,
     'Левая часть равна '+a+' · (−'+b+') + '+c+' = '+fmt(left)+'.');
   },
   express_y: ({a,b})=>choice('Вырази y из '+math(a+'x + '+b+'y = '+b*a)+'.',
    'y = '+frac(b*a+' − '+a+'x',b),['y = '+frac(b*a+' + '+a+'x',b),'y = '+frac(b*a+' − '+a+'x',b+1),math('y = '+b*a+' − '+a+'x')],
    'Вычитаем '+a+'x из обеих частей, затем делим на '+b+'.'),
   find_fractional_coordinate: ({a,b,c})=>['В '+math(a+'x + '+b+'y = '+(a*c+1))+' подставь x = '+c+' и найди y.',rational(1,b),
    'После вычитания '+a*c+' остаётся '+b+'y = 1. Значит, y = '+frac(1,b)+'.'],
   choose_from_two_constraints: ({a,b,c})=>choice('Какая пара удовлетворяет '+math(a+'x − y = '+fmt(a*b-c))+' и имеет x &lt; '+(b+1)+'?',
    pair(b,c),[pair(b+1,c+a),pair(b,c+1),pair(b+1,c)],
    'Проверяем обе части условия. Для ('+b+'; '+c+') уравнение верно и '+b+' меньше '+(b+1)+'.')
  },
  {
   equate_results_from_coordinates: ({a,b,c})=>['Найди k, чтобы '+pair(a,b)+' была решением '+math('kx − '+c+'y = '+a*b)+'.',rational(a*b+c*b,a),
    'Подстановка даёт '+a+'k − '+c*b+' = '+a*b+'. Прибавляем '+c*b+' и делим на '+a+'.'],
   solve_with_related_coordinates: ({a,b,c})=>{
    const right=(a+b)*c+b*a;
    return coordinates('Найди пару (x; y) для '+math(a+'x + '+b+'y = '+right)+', если y = x + '+a+'.',c,c+a,
     'Подставляем y = x + '+a+'. Получаем '+(a+b)+'x + '+b*a+' = '+right+'. Отсюда x = '+c+', y = '+(c+a)+'.');
   },
   compare_two_coordinates_conditions: ({a,b,c})=>['Найди y, если '+math(a+'x − '+b+'y = 0')+' и x = '+fmt(-c)+'.',rational(-a*c,b),
    'Переносим слагаемое: '+b+'y = '+a+'x. Подставляем x = '+fmt(-c)+' и делим на '+b+'.'],
   expression_on_solutions: ({a,b,c})=>['Вычисли '+math(2*a+'x − '+2*b+'y + '+c)+', если '+math(a+'x − '+b+'y = '+(a+b))+'.',2*(a+b)+c,
    'Первые два члена равны удвоенной левой части известного уравнения. Получаем 2 · '+(a+b)+' + '+c+' = '+(2*(a+b)+c)+'.']
  }
 ],
 linear_equation_two_variables_graph: [
  {
   y_intercept_from_equation: ({a,b,c})=>['Найди ординату пересечения с Oy графика '+math(a+'x + '+b+'y = '+b*c)+'.',c,
    'Подставляем x = 0. Получаем '+b+'y = '+b*c+', значит y = '+c+'.'],
   x_intercept_from_equation: ({a,b,c})=>['Найди абсциссу пересечения с Ox графика '+math(a+'x + '+b+'y = '+fmt(-a*c))+'.',-c,
    'Подставляем y = 0. Получаем '+a+'x = '+fmt(-a*c)+', откуда x = '+fmt(-c)+'.'],
   recognize_horizontal: ({a,b})=>choice('Как расположен график '+math(a+'y = '+a*b)+'?',
    'Горизонтальная прямая',['Вертикальная прямая','Точка на Ox','Прямая через начало координат'],
    'Из уравнения следует y = '+b+'. Абсцисса может быть любой.'),
   recognize_vertical: ({a,b})=>choice('Как расположен график '+math(a+'x = '+fmt(-a*b))+'?',
    'Вертикальная прямая',['Горизонтальная прямая','Точка на Oy','Прямая через начало координат'],
    'Из уравнения следует x = '+fmt(-b)+'. Ордината может быть любой.')
  },
  {
   intercept_from_shown_graph: ({a,b})=>{
    const b0=a%5-2,k=1+b%2;
    return withVisual(['Найди ординату точки пересечения показанной прямой с Oy.',b0,'При x = 0 на графике y = '+fmt(b0)+'.'],
     functionGraph([],{line:[k,b0]}));
   },
   choose_two_points_to_plot: ({a,b})=>choice('Какую пару точек можно использовать для построения графика '+math('x + y = '+(a+b))+'?',
    pair(a+b,0)+' и '+pair(0,a+b),[pair(a,0)+' и '+pair(0,b),pair(a+b,1)+' и '+pair(0,a+b),pair(0,0)+' и '+pair(a,b)],
    'При y = 0 получаем x = '+(a+b)+'. При x = 0 получаем y = '+(a+b)+'.'),
   convert_equation_for_graph: ({a,b,c})=>choice('Какая запись задаёт тот же график, что '+math(a+'x + '+b+'y = '+c)+'?',
    'y = '+frac(c+' − '+a+'x',b),['y = '+frac(c+' + '+a+'x',b),'y = '+frac(c+' − '+a+'x',b+1),'y = '+frac(a+'x − '+c,b)],
    'Вычитаем '+a+'x, затем делим на '+b+'.'),
   intercept_fraction_from_equation: ({a,b,c})=>['Найди абсциссу пересечения с Ox графика '+math(a+'x − '+b+'y = '+c)+'.',rational(c,a),
    'Подставляем y = 0 и делим обе части уравнения '+a+'x = '+c+' на '+a+'.']
  },
  {
   identify_equation_from_graph: ({a,b})=>{
    const k=a%3+1,offset=b%3-1,term=fmt(-k)+'x + y';
    return withVisual(choice('Какое уравнение задаёт показанную прямую?',math(term+' = '+fmt(offset)),
     [math(term+' = '+fmt(offset+1)),math(k+'x + y = '+fmt(offset)),math(term+' = '+fmt(offset-1))],
     'Читаем пересечение с Oy: '+fmt(offset)+'. При увеличении x на 1 y меняется на '+k+'. Поэтому y − '+k+'x = '+fmt(offset)+'.'),
     functionGraph([],{line:[k,offset]}));
   },
   axis_triangle_area: ({a,b})=>['Прямая '+math(b+'x + '+a+'y = '+a*b)+' и оси образуют треугольник. Найди его площадь.',rational(a*b,2),
    'Пересечения с осями имеют координаты ('+a+'; 0) и (0; '+b+'). Катеты '+a+' и '+b+', площадь равна половине их произведения.'],
   find_a_from_graph_point: ({a,b,c})=>['Прямая '+math('kx + '+b+'y = '+(a*c+b))+' проходит через '+pair(c,1)+'. Найди k.',a,
    'Подстановка даёт '+c+'k + '+b+' = '+(a*c+b)+'. Вычитаем '+b+' и делим на '+c+'.'],
   triangle_axis_lengths: ({a,b})=>['Найди сумму длин катетов треугольника, образованного координатными осями и '+math(b+'x − '+a+'y = '+a*b)+'.',a+b,
    'При y = 0 получаем x = '+a+'. При x = 0 получаем y = '+fmt(-b)+'. Длины катетов равны '+a+' и '+b+'.']
  }
 ],
 linear_system_concept: [
  {
   check_both_conditions: ({a,b,c})=>{
    const truth=c%2===0;
    return checkStatement('Является ли '+pair(a,b)+' решением '+system('x + y = '+(a+b),'x − y = '+fmt(a-b+Number(!truth)))+'?',
     truth,'Подстановка даёт x + y = '+(a+b)+' и x − y = '+fmt(a-b)+'. Сравниваем с обеими правыми частями.');
   },
   select_common_solution: ({a,b})=>choice('Какая пара решает '+system('x + y = '+(a+b),'y = '+b)+'?',
    pair(a,b),[pair(a+1,b),pair(a+1,b-1),pair(a,b+1)],'Вторая координата равна '+b+', после подстановки в первое уравнение x = '+a+'.'),
   read_system_pair: ({a,b})=>coordinates('Запиши решение '+system('x = '+fmt(-a),'y = '+b)+'.',-a,b,
    'Первое уравнение задаёт x, второе задаёт y. Обе координаты уже известны.'),
   identify_meaning_of_system: ({a,b})=>choice('Что значит решить '+system('x + y = '+(a+b),'x − y = '+fmt(a-b))+'?',
    'Найти все пары, удовлетворяющие обоим уравнениям',['Найти решения только верхнего уравнения','Найти любую пару чисел','Сравнить правые части'],
    'Одна пара должна одновременно превращать каждое уравнение в верное равенство.')
  },
  {
   rejects_one_equation_only: ({a,b})=>checkStatement('Подходит ли '+pair(a+1,b-1)+' для '+system('x + y = '+(a+b),'x = '+a)+'?',false,
    'Сумма верна, но x равно '+(a+1)+', тогда как второе уравнение требует '+a+'.'),
   find_partner_from_known_value: ({a,b,c})=>['Известно, что x = '+a+' в решении '+system('x + y = '+(a+b),c+'x + y = '+(c*a+b))+'. Найди y.',b,
    'В первом уравнении y = '+(a+b)+' − '+a+' = '+b+'. Во втором '+c+' · '+a+' + '+b+' = '+(c*a+b)+'.'],
   transformed_pair_check: ({a,b,c})=>{
    const left=a*c+b,truth=c%2===0;
    return checkStatement('Подходит ли '+pair(a,b)+' для '+system(c+'x + y = '+left,'y − x = '+fmt(b-a+Number(!truth)))+'?',truth,
     'Первая левая часть равна '+left+', вторая '+fmt(b-a)+'. Пара должна удовлетворять двум равенствам.');
   },
   equivalent_constant_system: ({a,b})=>choice('Какая система имеет то же решение, что '+system('x = '+a,'y = '+b)+'?',
    system('x + y = '+(a+b),'y = '+b),[system('x + y = '+(a+b+1),'y = '+b),system('x = 0','y = '+b),system('x = '+a,'y = '+(b+1))],
    'У второй координаты значение '+b+'. После подстановки в x + y = '+(a+b)+' первая координата равна '+a+'.')
  },
  {
   contradictory_system: ({a,b,c})=>choice('Сколько решений у '+system(a+'x + y = '+b,a+'x + y = '+(b+c))+'?',
    'Нет решений',['Одно','Два','Бесконечно много'],'У левых частей одна формула, а требуемые значения отличаются на '+c+'.'),
   same_equation_times_factor: ({a,b,c})=>choice('Сколько решений у '+system(a+'x + y = '+b,c*a+'x + '+c+'y = '+c*b)+'?',
    'Бесконечно много',['Ни одного','Одно','Два'],'Второе уравнение получается умножением первого на '+c+'. Каждая точка прямой является общим решением.'),
   recover_system_parameter: ({a,b,c})=>['Найди k, если '+pair(a,b)+' является решением '+system('x + y = '+(a+b),c+'x + ky = '+(c*a+b*b))+'.',b,
    'Подставляем координаты во второе уравнение: '+c*a+' + '+b+'k = '+(c*a+b*b)+'. Получаем '+b+'k = '+b*b+'.'],
   find_pair_from_simple_system: ({a,b,c})=>coordinates('Найди решение '+system('x + y = '+(a+b),'x − y = '+fmt(a-b))+'.',a,b,
    'Складываем: 2x = '+2*a+'. Значит, x = '+a+' и y = '+(a+b)+' − '+a+' = '+b+'.')
  }
 ],
 graphical_equations_systems: [
  {
   meaning_of_crossing: ({a,b})=>checkStatement('Если графики системы пересеклись в '+pair(a,b)+', является ли '+pair(a,b)+' решением?',true,
    'Точка пересечения принадлежит обоим графикам. Поэтому её координаты удовлетворяют обоим уравнениям.'),
   read_integer_intersection: ({a,b})=>{
    const x=a%3-1,y=b%3-1;
    return coordinates('Запиши координаты точки пересечения графиков.',x,y,
     'На рисунке прямые пересекаются в точке '+pair(fmt(x),fmt(y))+'.',systemGraph([[0,y],[1,y-x]]));
   },
   identify_parallel_graphs: ({a})=>{
    const gap=a%3+1;
    return withVisual(choice('Сколько решений у системы, показанной на графике?', 'Нет решений',['Одно','Два','Бесконечно много'],
     'Разные прямые параллельны и не пересекаются.'),systemGraph([[1,-gap],[1,gap]]));
   },
   compare_zero_intercept: ({a,b})=>{
    const k=a%2+1,c=b%3+1;
    return withVisual(['На какой высоте пересекаются прямые? Введи y точки пересечения.',c,
     'Обе прямые пересекают Oy в точке с ординатой '+c+'.'],systemGraph([[k,c],[-k,c]]));
   }
  },
  {
   count_from_different_slopes: ({a,b})=>choice('Сколько решений у '+system('y = '+a+'x + '+b,'y = '+(a+1)+'x + '+b)+'?',
    'Одно',['Ни одного','Два','Бесконечно много'],'Наклоны разные, поэтому графики пересекаются ровно один раз.'),
   count_from_same_line: ({a,b,c})=>choice('Сколько решений у '+system('y = '+a+'x + '+b,c+'y = '+c*a+'x + '+c*b)+'?',
    'Бесконечно много',['Ни одного','Одно','Два'],'Делим второе уравнение на '+c+'. Получаем первую формулу, значит графики совпадают.'),
   intersection_with_negative_coordinates: ({a,b})=>{
    const x=-(a%3+1),y=-(b%3+1);
    return coordinates('По графику найди решение системы.',x,y,
     'Проверяем обе координаты общей точки: x = '+fmt(x)+', y = '+fmt(y)+'.',systemGraph([[1,y-x],[-1,y+x]]));
   },
   find_system_at_horizontal: ({a,b})=>{
    const x=a%4-2,y=b%4+1,offset=y-x;
    return withVisual(['Найди абсциссу общей точки наклонной и горизонтальной прямых.',x,
     'Проводим вертикаль от пересечения к Ox. Его абсцисса '+fmt(x)+'.'],systemGraph([[1,offset],[0,y]]));
   }
  },
  {
   solve_for_fractional_crossing: ({a,b,c})=>{
    const coefficient=a+b,delta=2*c+1,offset=a-delta;
    const x=rational(delta,coefficient),y=rationalAdd(rationalMul(rational(a),x),rational(offset));
    return coordinates('Найди точные координаты пересечения '+system('y = '+g7LinPlain(a,offset),'y = '+g7LinPlain(-b,a))+'.',x,y,
     'Приравниваем правые части. Получаем '+coefficient+'x = '+delta+', откуда x = '+g7FracHtml(x)+'. Подставляем в одну из формул: y = '+g7FracHtml(y)+'.');
   },
   parameter_for_parallel_lines: ({a,b})=>['При каком k у '+system('y = '+a+'x + '+b,'y = kx + '+(b+1))+' нет решений?',a,
    'Нужны разные параллельные прямые. Их свободные члены различаются, а коэффициенты наклона должны совпасть, значит k = '+a+'.'],
   parameter_for_known_crossing: ({a,b,c})=>['Прямые '+system('y = '+a+'x + '+b,'y = '+(a+1)+'x + m')+' пересекаются при x = '+c+'. Найди m.',b-c,
    'В общей точке '+a*c+' + '+b+' = '+(a+1)*c+' + m. Вычисляем m = '+fmt(b-c)+'.'],
   interpret_solution_then_compute: ({a,b})=>{
    const x=a%4-2,y=b%5-2;
    return withVisual(['Найди точку пересечения на графике и вычисли сумму её координат.',x+y,
     'Общая точка '+pair(fmt(x),fmt(y))+'. Складываем координаты и получаем '+fmt(x+y)+'.'],systemGraph([[1,y-x],[-1,y+x]]));
   }
  }
 ],
 linear_system_substitution: [
  {
   substitute_known_y: ({a,b})=>coordinates('Реши подстановкой '+system('x + y = '+(a+b),'y = '+b)+'.',a,b,
    'В первое уравнение подставляем y = '+b+'. Получается x = '+(a+b)+' − '+b+' = '+a+'.'),
   substitute_known_x: ({a,b,c})=>coordinates('Реши '+system('x = '+fmt(-a),b+'x + y = '+fmt(c-a*b))+'.',-a,c,
    'Подставляем x = '+fmt(-a)+'. Уравнение становится '+fmt(-a*b)+' + y = '+fmt(c-a*b)+'. Отсюда y = '+c+'.'),
   select_substituted_equation: ({a,b,c})=>choice('Какое уравнение получается после подстановки в '+system('y = x + '+a,b+'x + y = '+((b+1)*c+a))+'?',
    math(b+'x + (x + '+a+') = '+((b+1)*c+a)),
    [math(b+'x + (x − '+a+') = '+((b+1)*c+a)),math(b+'x + '+a+' = '+((b+1)*c+a)),math(b+'(x + '+a+') + x = '+((b+1)*c+a))],
    'Во втором уравнении заменяем только y на x + '+a+'.'),
   express_first_variable: ({a,b})=>choice('Как выразить x для подстановки, если первое уравнение '+math('x − '+a+'y = '+b)+'?',
    math('x = '+b+' + '+a+'y'),[math('x = '+b+' − '+a+'y'),math('x = −'+b+' + '+a+'y'),math('x = '+(b+1)+' + '+a+'y')],
    'Прибавляем '+a+'y к обеим частям.')
  },
  {
   y_defined_by_x: ({a,b,c})=>coordinates('Реши подстановкой '+system('y = '+a+'x − '+b,'x + y = '+fmt((a+1)*c-b))+'.',c,a*c-b,
    'Заменяем y на '+a+'x − '+b+'. Получаем '+(a+1)+'x = '+(a+1)*c+'. Делим и подставляем x = '+c+'.'),
   x_defined_by_y: ({a,b,c})=>coordinates('Реши подстановкой '+system('x = '+a+' − y',b+'x − y = '+fmt(b*a-(b+1)*c))+'.',a-c,c,
    'Подставляем x = '+a+' − y. Раскрываем скобки: '+b*a+' − '+(b+1)+'y = '+fmt(b*a-(b+1)*c)+'. Получаем y = '+c+', затем x = '+fmt(a-c)+'.'),
   choose_substituted_bracket: ({a,b,c})=>choice('Какое уравнение получается из второго уравнения '+system('x = y − '+a,b+'x + y = '+c)+'?',
    math(b+'(y − '+a+') + y = '+c),[math(b+'y − '+a+' + y = '+c),math(b+'(y + '+a+') + y = '+c),math(b+'(y − '+a+') − y = '+c)],
    'Подставляем y − '+a+' вместо x целиком. Коэффициент '+b+' умножается на всю скобку.'),
   solve_after_fraction_substitution: ({a,b,c})=>{
    const x=rational(c,b+1),y=rational(a*c,b+1);
    return coordinates('Реши подстановкой '+system('y = '+a+'x',a+'x + '+b+'y = '+a*c)+'.',x,y,
     'После замены y получаем '+a*(b+1)+'x = '+a*c+'. Значит x = '+g7FracHtml(x)+', y = '+g7FracHtml(y)+'.');
   }
  },
  {
   substitute_expression_both_sides: ({a,b,c})=>{
    const y=b*c-a;
    return coordinates('Реши '+system('y = '+b+'x − '+a,a+'y + '+b+'x = '+fmt(a*y+b*c))+'.',c,y,
     'После подстановки '+a+'('+b+'x − '+a+') + '+b+'x = '+fmt(a*y+b*c)+'. Собираем: '+b*(a+1)+'x = '+b*(a+1)*c+'.');
   },
   fractional_expression_substitute: ({a,b,c})=>{
    const right=(a*b+1)*c+a,x=b*c+1;
    return coordinates('Реши '+system('y = '+frac('x − 1',b),a+'x + y = '+right)+'.',x,c,
     'Из первого уравнения выражаем x = '+b+'y + 1. Во втором получаем '+(a*b+1)+'y + '+a+' = '+right+'. Значит y = '+c+', x = '+x+'.');
   },
   spot_no_solution_after_substitution: ({a,b,c})=>choice('Сколько решений у '+system('y = '+a+'x + '+b,'y = '+a+'x + '+(b+c))+'?',
    'Нет решений',['Одно','Два','Бесконечно много'],'После подстановки '+a+'x сокращается. Остаётся '+b+' = '+(b+c)+', что невозможно.'),
   infinite_after_substitution: ({a,b,c})=>choice('Сколько решений у '+system('y = '+a+'x − '+b,c+'y = '+c*a+'x − '+c*b)+'?',
    'Бесконечно много',['Ни одного','Одно','Два'],'Подстановка y во второе уравнение превращает его в тождество. Подходит любая пара на первой прямой.')
  }
 ],
 linear_system_addition: [
  {
   opposite_y_coefficients: ({a,b})=>coordinates('Реши сложением '+system('x + y = '+(a+b),'x − y = '+fmt(a-b))+'.',a,b,
    'Складываем уравнения. Получаем 2x = '+2*a+'. Отсюда x = '+a+' и y = '+b+'.'),
   opposite_x_coefficients: ({a,b})=>coordinates('Реши сложением '+system('x + y = '+(a+b),'−x + y = '+fmt(b-a))+'.',a,b,
    'Складываем уравнения. Получаем 2y = '+2*b+'. Подставляем y = '+b+' в первое уравнение и получаем x = '+a+'.'),
   equation_sum_choice: ({a,b,c})=>choice('Что получится при сложении '+system(a+'x + y = '+b,c+'x − y = '+a)+'?',
    math((a+c)+'x = '+(a+b)),[math((a+c)+'x = '+fmt(b-a)),math((a+c)+'x + 2y = '+(a+b)),math(a+'x = '+(a+b))],
    'Слагаемые y и −y взаимно уничтожаются. Складываем коэффициенты при x и правые части.'),
   subtract_to_cancel: ({a,b,c})=>['Найди x из '+system((a+b)+'x + y = '+((a+b)*c+b),a+'x + y = '+(a*c+b))+', вычитая второе уравнение из первого.',c,
    'При вычитании одинаковые y исчезают. Остаётся '+b+'x = '+b*c+'.']
  },
  {
   multiply_one_for_elimination: ({a,b,c})=>{
    const right=b+c,y=a*b+c;
    return coordinates('Реши сложением '+system('x + y = '+(right+y),a+'x − '+a+'y = '+fmt(a*(right-y)))+'.',right,y,
     'Умножаем первое уравнение на '+a+'. Складываем, y сокращается. Получаем '+2*a+'x = '+2*a*right+'.');
   },
   eliminate_x_after_scaling: ({a,b,c})=>{
    const x=b,y=c;
    return coordinates('Реши '+system('x + y = '+(x+y),'−'+a+'x + y = '+fmt(y-a*x))+'.',x,y,
     'Умножаем первое уравнение на '+a+' и складываем. Получаем '+(a+1)+'y = '+(a+1)*y+'. Затем x = '+x+'.');
   },
   choose_scaling_multiplier: ({a,b,c})=>['На какое число умножить первое уравнение '+system('x + '+b+'y = '+a,c+'x − '+b*c+'y = '+b)+' перед сложением, чтобы y исчезло?',c,
    'Коэффициент '+b+' должен стать '+b*c+', чтобы сократиться с −'+b*c+'. Делим '+b*c+' на '+b+'.'],
   equation_after_scaling: ({a,b,c})=>choice('Что получится после умножения первого уравнения на '+c+' и сложения '+system('x + y = '+a,b+'x − '+c+'y = '+b)+'?',
    math((b+c)+'x = '+(c*a+b)),[math((b+c)+'x = '+(a+b)),math((b+c)+'x = '+(c*a-b)),math(b+'x = '+(c*a+b))],
    'Первое уравнение становится '+c+'x + '+c+'y = '+c*a+'. Складываем его со вторым.')
  },
  {
   multiply_both_equations: ({a,b,c,y})=>{
    const first=a*c+b*y,second=b*c-a*y;
    return coordinates('Реши методом сложения '+system(a+'x + '+b+'y = '+first,b+'x − '+a+'y = '+fmt(second))+'.',c,y,
     'Умножаем первое на '+a+', второе на '+b+' и складываем: '+(a*a+b*b)+'x = '+(a*a+b*b)*c+'. Подставляем x = '+c+' в первое уравнение.');
   },
   fractional_solution_after_elimination: ({a,b})=>{
    const x=rational(2*b+1,2*a),y=rational(-1,2);
    return coordinates('Реши '+system(a+'x + y = '+b,a+'x − y = '+(b+1))+'.',x,y,
     'Складываем: '+2*a+'x = '+(2*b+1)+'. Подставляем x в первое: y = '+g7FracHtml(y)+'.');
   },
   contradiction_after_addition: ({a,b,c})=>choice('Сколько решений у '+system(a+'x − '+b+'y = '+c,'−'+a+'x + '+b+'y = '+fmt(1-c))+'?',
    'Нет решений',['Одно','Два','Бесконечно много'],'Сложение даёт 0 = 1. Ни одна пара не может удовлетворить обоим уравнениям.'),
   determine_a_parameter: ({a,b,c})=>['При каком k сложение '+system(a+'x + '+b+'y = '+c,'kx − '+b+'y = '+(c+1))+' уничтожает обе переменные?',-a,
    'Коэффициенты при y уже противоположны. Для x требуется '+a+' + k = 0, поэтому k = '+fmt(-a)+'.']
  }
 ],
 linear_system_word_problems: [
  {
   sum_difference_context: ({a,b})=>['В двух корзинах '+(2*a+b)+' яблок. В первой на '+b+' яблок больше, чем во второй. Сколько в первой?',a+b,
    'Пусть x — первая корзина, y — вторая. '+system('x + y = '+(2*a+b),'x − y = '+b)+'. Складываем, получаем x = '+(a+b)+'.'],
   ticket_count_setup: ({a,b})=>choice('x — число взрослых билетов, y — число детских. Всего '+(a+b)+' билетов, взрослых '+a+'. Какая система подходит?',
    system('x + y = '+(a+b),'x = '+a),[system('x + y = '+(a+b+1),'x = '+a),system('x − y = '+(a+b),'x = '+a),system('x + y = '+(a+b),'y = '+(b+1))],
    'Сумма x и y равна общему количеству. Число взрослых уже известно.'),
   two_class_counts: ({a,b})=>['В двух группах '+(a+b)+' человек. В первой '+a+' человек. Сколько во второй?',b,
    'Пусть x и y — численности групп. '+system('x + y = '+(a+b),'x = '+a)+'. Вычитаем '+a+' из суммы.'],
   distinguish_variable_definition: ({a,b})=>choice('Две вещи стоят вместе '+(10*(a+b))+' руб. x — цена первой, y — второй. Как записать общую стоимость?',
    math('x + y = '+10*(a+b)),[math('x − y = '+10*(a+b)),math('xy = '+10*(a+b)),math('x + y = '+(a+b))],
    'Общая стоимость равна сумме цен x и y.')
  },
  {
   livestock_count: ({a,b})=>['На ферме куры и кролики. Всего '+(a+b)+' голов и '+(2*a+4*b)+' ног. Сколько кроликов?',b,
    'Пусть x — куры, y — кролики. '+system('x + y = '+(a+b),'2x + 4y = '+(2*a+4*b))+'. Удваиваем первое уравнение и вычитаем его из второго.'],
   ticket_prices: ({a,b})=>['Взрослый билет стоит 100 руб., детский 50 руб. Купили '+(a+b)+' билетов за '+(100*a+50*b)+' руб. Сколько взрослых билетов?',a,
    'Пусть x — взрослые, y — детские. '+system('x + y = '+(a+b),'100x + 50y = '+(100*a+50*b))+'. Вычитаем первое уравнение, умноженное на 50.'],
   coins_of_two_values: ({a,b})=>['Есть '+(a+b)+' монет по 5 и 10 руб. Всего '+(5*a+10*b)+' руб. Сколько пятирублёвых монет?',a,
    'Пусть x — число пятирублёвых монет. '+system('x + y = '+(a+b),'5x + 10y = '+(5*a+10*b))+'. Умножаем первое уравнение на 10 и вычитаем второе. Получаем 5x = '+5*a+'.'],
   rectangle_from_two_conditions: ({a,b})=>['Периметр прямоугольника '+2*(2*a+b)+' см. Длина на '+b+' см больше ширины. Найди ширину (в см).',a,
    'Половина периметра '+(2*a+b)+' см. Пусть x — длина, y — ширина. '+system('x + y = '+(2*a+b),'x − y = '+b)+'. Вычитаем второе уравнение из первого, получаем 2y = '+2*a+'.']
  },
  {
   prices_from_two_purchases: ({a,b,c})=>{
    const x=10*a,y=10*b,first=2*x+3*y,second=3*x+2*y;
    return ['За два карандаша и три ручки заплатили '+first+' руб., за три карандаша и две ручки — '+second+' руб. Сколько стоит одна ручка?',y,
     'Пусть x — цена карандаша, y — ручки. '+system('2x + 3y = '+first,'3x + 2y = '+second)+'. Умножаем первое на 3 и второе на 2. Вычитание даёт 5y = '+5*y+', откуда y = '+y+'.'];
   },
   boat_speed_from_two_directions: ({a,b})=>{
    const boat=a+b,river=b,down=boat+river,up=boat-river;
    return ['Лодка за 2 ч по течению прошла '+2*down+' км, а за 3 ч против течения — '+3*up+' км. Найди скорость течения (в км/ч).',river,
     'Скорость по течению '+down+', против течения '+up+'. Пусть x — скорость лодки в стоячей воде, y — течения. '+system('x + y = '+down,'x − y = '+up)+'. Вычитаем и получаем 2y = '+2*river+'.'];
   },
   worker_output_comparison: ({a,b,c})=>{
    const left=a+b,right=a,total=3*left+2*right,alternative=left+4*right;
    return ['Если первый станок работает 3 ч, а второй 2 ч, они выпускают '+total+' деталей. Если первый работает 1 ч, второй 4 ч, получается '+alternative+' деталей. Сколько деталей в час выпускает первый станок?',left,
     'Пусть x и y — выработка в час. '+system('3x + 2y = '+total,'x + 4y = '+alternative)+'. Удваиваем первое уравнение и вычитаем второе: 5x = '+5*left+'.'];
   },
   mix_two_quantities: ({a,b})=>{
    const total=a+b,solute=2*a+5*b;
    return ['Смешали растворы, содержащие 2 и 5 г соли на литр. Получилось '+total+' л смеси с '+solute+' г соли. Сколько литров взяли второго раствора?',b,
     'Пусть x и y — объёмы растворов. '+system('x + y = '+total,'2x + 5y = '+solute)+'. Вычитаем удвоенное первое из второго: 3y = '+3*b+'.'];
   }
  }
 ],
 linear_inequalities_two_variables: [
  {
   check_positive_point: ({a,b,c})=>{
    const bound=a+b+c%2,truth=a+b>=bound;
    return checkStatement('Удовлетворяет ли '+pair(a,b)+' неравенству '+math('x + y ≥ '+bound)+'?',truth,
     'При подстановке x + y = '+(a+b)+'. Сравниваем с '+bound+'.');
   },
   strict_boundary_point: ({a,b,c})=>{
    const truth=c%2===0;
    return checkStatement('Подходит ли '+pair(a,b)+' для '+math('x − y '+(truth?'≤':'&lt;')+' '+fmt(a-b))+'?',truth,
     'Точка даёт равенство левой и правой частей. Нестрогий знак допускает равенство, строгий — нет.');
   },
   smallest_x_given_y: ({a,b,c})=>['Найди наименьшее целое x, если '+math('x + '+a+'y ≥ '+(a*b+c))+' и y = '+b+'.',c,
    'Подставляем '+b+' и вычитаем '+a*b+'. Получаем x ≥ '+c+'.'],
   choose_valid_point: ({a,b})=>choice('Какая точка подходит для '+math('x + y &lt; '+(a+b))+'?',
    pair(a,b-1),[pair(a,b),pair(a+1,b),pair(a,b+1)],'У верной пары сумма равна '+(a+b-1)+' и строго меньше '+(a+b)+'.')
  },
  {
   flip_inequality_after_dividing: ({a,b,c})=>['Найди наибольшее допустимое целое y для '+math('x − '+a+'y ≥ '+fmt(b-a*c))+' при x = '+b+'.',c,
    'После подстановки получаем −'+a+'y ≥ '+fmt(-a*c)+'. Делим на отрицательное число, меняем знак и получаем y ≤ '+c+'.'],
   select_same_region: ({a,b})=>choice('Какое неравенство равносильно '+math('−'+a+'x + '+a+'y &lt; '+a*b)+'?',
    math('y &lt; x + '+b),[math('y &gt; x + '+b),math('y &lt; x − '+b),math('y ≤ x + '+b)],
    'Делим на положительное '+a+' и прибавляем x к обеим частям. Строгий знак сохраняется.'),
   two_conditions_check: ({a,b,c})=>{
    const truth=c%2===0;
    return checkStatement('Подходит ли '+pair(a,b)+' для '+system('x + y ≤ '+(a+b),'x − y &gt; '+fmt(a-b-Number(truth)))+'?',truth,
     'В первом условии равенство допустимо. Во втором сравниваем '+fmt(a-b)+' с '+fmt(a-b-Number(truth))+'.');
   },
   fractional_boundary: ({a,b,c})=>['Найди наименьшее целое x, если '+math(a+'x + y &gt; '+(a*c+b+1))+' и y = '+b+'.',c+1,
    'После подстановки x &gt; '+c+' + '+frac(1,a)+'. Следующее целое число '+(c+1)+'.']
  },
  {
   count_integer_x: ({a,b,c})=>['Сколько целых x удовлетворяет '+system('x + y ≥ '+(a+c),'x − y &lt; '+fmt(a+b-c))+' при y = '+c+'?',b,
    'После подстановки имеем x ≥ '+a+' и x &lt; '+(a+b)+'. Целые числа от '+a+' до '+(a+b-1)+', всего '+b+'.'],
   parameter_boundary_value: ({a,b,c})=>['При каком k точка '+pair(a,b)+' лежит на границе множества решений '+math('kx + '+c+'y ≤ '+(a*b+c*b))+'?',b,
    'На границе неравенство становится равенством. Получаем '+a+'k + '+c*b+' = '+(a*b+c*b)+', откуда k = '+b+'.'],
   one_pair_for_intersection: ({a,b})=>choice('Какая точка удовлетворяет обоим условиям '+system('x + y ≥ '+(a+b),'x − y &lt; '+fmt(a-b))+'?',
    pair(a,b+1),[pair(a,b),pair(a-1,b),pair(a+1,b)],'У верной пары сумма '+(a+b+1)+' и разность '+fmt(a-b-1)+'. Проверяем каждое условие.'),
   integer_band: ({a,b,c})=>['Сколько целых y удовлетворяет '+system(a+'x + y ≥ '+(a*c+b),a+'x + y ≤ '+(a*c+b+3))+' при x = '+c+'?',4,
    'Подставляем x. Получаем '+b+' ≤ y ≤ '+(b+3)+'. Обе границы включены, поэтому подходящих чисел четыре.']
  }
 ],
 fraction_word_problems: [
  {
   find_fractional_part: ({a,b})=>['На полке '+a*(b+1)+' книг. '+frac(1,b+1)+' всех книг — словари. Сколько словарей?',a,
    'Чтобы найти одну из '+(b+1)+' равных частей, делим '+a*(b+1)+' на '+(b+1)+'.'],
   recover_whole_quantity: ({a,b})=>['Выполнили '+a+' заданий, это '+frac(1,b)+' всего списка. Сколько заданий в списке?',a*b,
    'Одна доля равна '+a+'. Всего '+b+' долей, значит заданий '+a*b+'.'],
   identify_part_of_total: ({a,b})=>['Из '+(a+b)+' деталей '+a+' окрасили. Какую долю всех деталей окрасили?',rational(a,a+b),
    'Делим число окрашенных деталей на общее: '+frac(a,a+b)+' = '+g7FracHtml(rational(a,a+b))+'.'],
   find_remaining_parts: ({a,b})=>['Использовали '+frac(1,b)+' из '+a*b+' листов. Сколько листов осталось?',a*(b-1),
    'Использовали '+a+' листов. Вычитаем из исходного количества: '+a*b+' − '+a+' = '+a*(b-1)+'.']
  },
  {
   fraction_after_first_day: ({a,b})=>['В первый день прочитали '+frac(1,b+1)+' книги из '+a*(b+1)+' страниц. Во второй — ещё '+b+' страниц. Сколько осталось?',a*b-b,
    'В первый день прочли '+a+' страниц. Вычитаем оба количества: '+a*(b+1)+' − '+a+' − '+b+' = '+(a*b-b)+'.'],
   sum_fractions_of_same_whole: ({a,b})=>['Из '+10*a*b+' кг яблок '+frac(1,2)+' продали, а '+frac(1,5)+' от общего количества отправили на переработку. Сколько килограммов осталось?',3*a*b,
    'Продали '+5*a*b+' кг, переработали '+2*a*b+' кг. Осталось '+10*a*b+' − '+5*a*b+' − '+2*a*b+' = '+3*a*b+' кг.'],
   recover_from_remaining_part: ({a,b})=>['Потратили '+frac(1,b+1)+' денег. Осталось '+a*b+' руб. Сколько рублей было?',a*(b+1),
    'Осталось '+frac(b,b+1)+' суммы. Одна доля стоит '+a*b+' : '+b+' = '+a+' руб. Всего '+(b+1)+' долей.'],
   compare_fractional_parts: ({a,b})=>['Найди разность числа яблок в '+frac(3,4)+' от '+4*a*b+' яблок и в '+frac(1,2)+' от '+4*a*b+' яблок.',a*b,
    'Первая часть содержит '+3*a*b+' яблок, вторая '+2*a*b+'. Разность равна '+a*b+'.']
  },
  {
   another_fraction_of_remainder: ({a,b})=>['В баке '+12*a*b+' л. Использовали '+frac(1,3)+' воды, затем '+frac(3,4)+' остатка. Сколько литров осталось?',2*a*b,
    'После первого расхода осталось '+8*a*b+' л. После второго осталась четверть этого количества, то есть '+2*a*b+' л.'],
   rebuild_before_two_removals: ({a,b})=>['Потратили половину денег, затем '+frac(1,3)+' остатка. В кошельке осталось '+a*b+' руб. Сколько рублей было сначала?',3*a*b,
    'Осталось две трети половины, то есть треть начальной суммы. Поэтому целое равно '+3*a*b+' руб.'],
   ratio_to_initial_quantity: ({a,b})=>['От '+12*a*b+' м ткани отрезали '+frac(1,4)+', затем '+frac(1,3)+' остатка. Какую часть исходной длины составил второй отрез?',rational(1,4),
    'После первого отреза осталось '+frac(3,4)+' исходной длины. Треть этого остатка — '+frac(1,3)+' · '+frac(3,4)+' = '+frac(1,4)+'.'],
   equalize_fractional_parts: ({a,b})=>['За первый час прочитали '+frac(1,4)+' книги, за второй '+frac(1,3)+' книги. Во второй час прочитали на '+a*b+' страниц больше. Сколько страниц в книге?',12*a*b,
    'Разность долей равна '+frac(1,3)+' − '+frac(1,4)+' = '+frac(1,12)+'. Это '+a*b+' страниц, значит всего '+12*a*b+'.']
  }
 ],
 percent_fraction_conversion: [
  {
   percent_as_decimal: ({a,b})=>choice('Какая десятичная дробь равна '+(a+b)+'%?',fmt((a+b)/100),
    [fmt((a+b)/10),fmt((a+b)/1000),String(a+b)],'Проценты — сотые. Делим '+(a+b)+' на 100.'),
   decimal_as_percent: ({a,b})=>['Сколько процентов составляет число '+fmt((a*b)/100)+' от единицы?',a*b,
    'Умножаем число на 100. Получаем '+a*b+'%.'],
   fractions_of_hundred: ({a,b})=>['Сколько процентов составляют '+frac(a+b,100)+' целого?',a+b,
    'Числитель показывает количество сотых, а каждая сотая равна 1%.'],
   one_percent_conversion: ({a,b})=>choice('Какая обыкновенная дробь равна '+a*b+'%?',g7FracHtml(rational(a*b,100)),
    [g7FracHtml(rational(a*b,10)),g7FracHtml(rational(a*b,1000)),g7FracHtml(rational(a*b+1,100))],
    'Записываем '+frac(a*b,100)+' и сокращаем.')
  },
  {
   common_fraction_to_percent: ({a,b})=>['Вырази '+frac(a,20)+' в процентах. Введи число без знака %. ',5*a,
    'До знаменателя 100 домножаем на 5. Получаем '+frac(5*a,100)+' = '+5*a+'%.'],
   percent_decimals_compare: ({a,b})=>compare('Сравни '+(a+b)+'% и '+fmt((a+b-1)/100)+'.',rational(a+b,100),rational(a+b-1,100),
    'Переводим процент в десятичную дробь, деля на 100.'),
   fractional_percent: ({a,b})=>choice('Какое число равно '+fmt((a+b)/2)+'%?',fmt((a+b)/200),
    [fmt((a+b)/20),fmt((a+b)/2000),fmt((a+b)/2)],'Делим дробное число процентов на 100.'),
   percent_above_hundred: ({a,b})=>['Сколько процентов составляет '+fmt(1+(a+b)/100)+' от единицы?',100+a+b,
    'Целая единица даёт 100%, дробная часть даёт ещё '+(a+b)+'%.']
  },
  {
   compare_two_fractional_percents: ({a,b,c})=>compare('Сравни '+fmt(a/2)+'% и '+frac(b,c*100)+'.',rational(a,200),rational(b,c*100),
    'Слева делим число процентов на 100. Далее сравниваем дроби точно.'),
   percent_difference_of_fractions: ({a,b})=>['На сколько процентных пунктов '+frac(a+b,25)+' больше '+frac(a,25)+' после перевода обеих дробей в проценты?',4*b,
    'Разность дробей равна '+frac(b,25)+'. Домножаем числитель и знаменатель на 4 и находим '+4*b+' процентных пунктов.'],
   missing_numerator_from_percent: ({a,b})=>['Найди числитель n, если '+frac('n',20*b)+' = '+5*a+'%.',a*b,
    'Процентная запись равна '+frac(a,20)+'. Домножаем на '+b+', получаем числитель '+a*b+'.'],
   percent_of_a_repeating_fraction: ({a,b})=>['Вырази '+frac(a,3)+' в процентах. Запиши точное число процентов без знака %.',rational(100*a,3),
    'Умножаем на 100. Число процентов равно '+g7FracHtml(rational(100*a,3))+'.']
  }
 ],
 percent_word_problems: [
  {
   find_percent_part: ({a,b})=>['Найди '+a+'% от '+100*b+'.',a*b,'Один процент равен '+b+'. Умножаем на '+a+'.'],
   find_initial_from_percent: ({a,b})=>[a+'% от числа равны '+a*b+'. Найди число.',100*b,
    'Делим '+a*b+' на '+a+', получаем 1%. Умножаем на 100, получаем всё число.'],
   find_percent_ratio: ({a,b})=>['Сколько процентов составляет '+a*b+' от '+100*b+'? Введи число без знака %. ',a,
    'Делим '+a*b+' на '+100*b+' и умножаем на 100.'],
   discount_amount: ({a,b})=>['Товар стоил '+100*a+' руб. Скидка '+b+'%. На сколько рублей снизилась цена?',a*b,
    'Один процент от стоимости равен '+a+' руб. Размер скидки '+a+' · '+b+' = '+a*b+' руб.']
  },
  {
   price_after_discount: ({a,b})=>['Книга стоила '+100*a+' руб. и подешевела на '+b+'%. Сколько рублей она стоит теперь?',a*(100-b),
    'Новая цена составляет '+(100-b)+'% старой. Умножаем '+a+' руб. за один процент на '+(100-b)+'.'],
   original_price_after_increase: ({a,b})=>['После увеличения на '+b+'% цена стала '+a*(100+b)+' руб. Какой была цена?',100*a,
    'Новая цена соответствует '+(100+b)+'% от старой. Делим на '+(100+b)+', затем умножаем на 100.'],
   percentage_point_change: ({a,b})=>['В пробной работе доля верных ответов выросла с '+(50+a)+'% до '+(50+a+b)+'%. На сколько процентных пунктов она выросла?',b,
    'Вычитаем значения в процентах. Разность равна '+b+' процентным пунктам.'],
   compare_two_discounts: ({a,b,c})=>['На первый товар за '+100*a+' руб. дали скидку '+c+'%, на второй за '+100*(a+b)+' руб. — такую же. Насколько вторая скидка больше (в руб.)?',b*c,
    'Скидки равны '+a*c+' и '+(a+b)*c+' руб. Разность '+b*c+' руб.']
  },
  {
   successive_equal_percentage_changes: ({a})=>['Цену увеличили на '+a+'%, затем уменьшили на '+a+'% от новой цены. На сколько процентов итоговая цена ниже исходной?',rational(a*a,100),
    'Множители дают (1 + '+frac(a,100)+')(1 − '+frac(a,100)+') = 1 − '+frac(a*a,10000)+'. Снижение в процентах '+exact(rational(a*a,100))+'%.'],
   increase_then_discount: ({a,b})=>['Цена '+10000+' руб. сначала выросла на '+a+'%, затем снизилась на '+b+'%. Найди итоговую цену (в руб.).',(100+a)*(100-b),
    'Умножаем исходную цену на '+frac(100+a,100)+' и '+frac(100-b,100)+'. Получаем '+(100+a)*(100-b)+' руб.'],
   compare_percent_base: ({a,b})=>['Товар подешевел со '+100*a+' до '+(100-b)*a+' руб. Какой процент новой цены составляет снижение? Введи число без знака %. ',rational(100*b,100-b),
    'Снижение равно '+a*b+' руб. Делим его на новую цену '+(100-b)*a+' и умножаем на 100.'],
   percent_of_remaining_and_whole: ({a,b})=>['Со склада вывезли '+a+'% товара, затем '+b+'% остатка. Какой процент исходного количества вывезли всего?',rational(100*a+(100-a)*b,100),
    'Во второй раз вывезли '+frac(b,100)+' от '+(100-a)+'% исходного запаса. Складываем с первыми '+a+'%.']
  }
 ],
 direct_inverse_proportion: [
  {
   direct_price: ({a,b})=>['Купили '+a+' '+ruCount(a,'тетрадь','тетради','тетрадей')+' по '+10*b+' руб. за штуку. Сколько рублей заплатили?',10*a*b,
    'Общая стоимость прямо пропорциональна количеству. Умножаем цену одной тетради на '+a+'.'],
   direct_multiplier: ({a,b})=>['Величина y прямо пропорциональна x. При x = '+a+' имеем y = '+a*b+'. Во сколько раз y больше x?',b,
    'Коэффициент равен отношению y : x = '+a*b+' : '+a+' = '+b+'.'],
   choose_inverse_example: ({a,b})=>choice('Какая зависимость обратная при фиксированном пути '+a*b+' км?',
    'Время движения от скорости',['Путь от времени при постоянной скорости','Стоимость от количества по постоянной цене','Расход топлива от пути при одинаковом расходе на километр'],
    'При постоянном пути произведение скорости на время сохраняется. Поэтому рост скорости уменьшает время в ту же кратность.'),
   recognize_direct_formula: ({a,b})=>choice('Какая формула задаёт прямую пропорциональность?',math('y = '+a+'x'),
    ['y = '+frac(a,'x'),math('y = x + '+b),math('y = x²')],'Прямая пропорциональность имеет вид y = kx с постоянным k.')
  },
  {
   inverse_workforce: ({a,b})=>['Один и тот же заказ '+a+' рабочих выполняют за '+2*b+' ч. За сколько часов его выполнят '+2*a+' рабочих с той же производительностью?',b,
    'Количество рабочих выросло вдвое. Для того же объёма работы время уменьшится вдвое.'],
   direct_scaled_recipe: ({a,b})=>['На '+a+' порций нужно '+a*b+' г крупы. Сколько граммов нужно на '+(a+2)+' порции?',(a+2)*b,
    'На одну порцию уходит '+b+' г. Умножаем на '+(a+2)+'.'],
   find_constant_inverse: ({a,b})=>['У обратно пропорциональных x и y при x = '+a+' известно y = '+b+'. Найди постоянное произведение xy.',a*b,
    'Для обратной пропорциональности произведение постоянно. Перемножаем '+a+' и '+b+'.'],
   inverse_time_by_speed: ({a,b})=>['При '+a+' км/ч путь занимает '+3*b+' ч. За сколько часов пройдут тот же путь при '+3*a+' км/ч?',b,
    'Скорость стала втрое больше. При неизменном пути время сокращается втрое.']
  },
  {
   inverse_mixed_units: ({a,b})=>['На машине при '+10*a+' км/ч ехали '+30*b+' минут. Сколько минут занял бы тот же путь при '+15*a+' км/ч?',20*b,
    'При постоянном пути время обратно пропорционально скорости. Новое время равно '+30*b+' · '+frac(10*a,15*a)+' = '+20*b+' мин.'],
   area_under_inverse: ({a,b})=>['Площадь прямоугольника '+a*b+' см². Одну сторону увеличили с '+a+' до '+2*a+' см, сохранив площадь. Найди новую вторую сторону.',rational(b,2),
    'При фиксированной площади стороны обратно пропорциональны. Делим площадь '+a*b+' на '+2*a+'.'],
   compare_direct_and_inverse: ({a,b,c})=>['При x = '+a+' обе величины y и z равны '+b+'. y прямо пропорциональна x, z обратно пропорциональна x. На сколько y больше z при x = '+a*c+'?',rational(b*c*c-b,c),
    'x увеличилось в '+c+' раз. Поэтому y стало '+b*c+', а z стало '+frac(b,c)+'. Вычитаем.'],
   infer_workers_from_fraction_time: ({a,b})=>['За '+3*a+' дней работу выполняют '+2*b+' рабочих. Сколько рабочих нужно, чтобы закончить за '+2*a+' дней?',3*b,
    'Объём работы одинаков, поэтому число рабочих умножаем на отношение старого времени к новому: '+2*b+' · '+frac(3*a,2*a)+' = '+3*b+'.']
  }
 ],
 geo_primitives: [
  {
   one_line_through_two_points: ({a,b})=>{
    const [p,q]=geometryLabels(a,b);
    return ['Сколько прямых проходит через две различные точки '+p+' и '+q+'?',1,
     'Через две различные точки проходит одна и только одна прямая.'];
   },
   read_middle_point: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return withVisual(choice('Какая точка лежит между '+p+' и '+r+'?',q,[p,r,'Ни одна'],
     'На чертеже порядок такой: '+p+' — '+q+' — '+r+'.'),geometryLine([p,q,r]));
   },
   read_collinear_membership: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return withVisual(choice('Какая точка лежит вне прямой '+p+q+'?',s,[p,q,r],
     'Точки '+p+', '+q+' и '+r+' отмечены на прямой. Точка '+s+' находится в стороне.'),geometryLine([p,q,r],'line',s));
   },
   read_segment_endpoints: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return withVisual(choice('Как называется весь изображённый отрезок?',p+r,[p+q,q+r,q+p],
     'Концы отрезка — крайние отмеченные точки '+p+' и '+r+'.'),geometryLine([p,q,r],'segment'));
   }
  },
  {
   count_segments_from_collinear_points: ({a,b})=>{
    const n=3+a%6;
    return ['На прямой отметили '+n+' различных точек. Сколько отрезков с концами в отмеченных точках?',n*(n-1)/2,
     'Выбираем две точки для концов. Получаем '+n+' · '+(n-1)+' пар с порядком, но каждый отрезок посчитан дважды. Делим на 2.'];
   },
   two_names_of_same_segment: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Как ещё можно назвать отрезок '+p+q+'?',q+p,[p+r,q+s,r+s],
     'Если поменять местами названия концов отрезка, получится тот же отрезок.');
   },
   one_line_for_collinear_triplet: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return ['Точки '+p+', '+q+' и '+r+' лежат на одной прямой. Сколько различных прямых задают пары '+p+q+', '+p+r+' и '+q+r+'?',1,
     'Каждая из этих пар задаёт уже указанную прямую. Все три записи называют одну прямую.'];
   },
   count_intermediate_marked_points: ({a,b})=>{
    const labels=geometryLabels(a,b),from=a%2,to=3;
    return withVisual(['Сколько отмеченных точек строго между '+labels[from]+' и '+labels[to]+'?',to-from-1,
     'Идём от '+labels[from]+' до '+labels[to]+'. Крайние точки в число промежуточных не входят.'],geometryLine(labels));
   }
  },
  {
   count_lines_with_one_off_line: ({a,b})=>{
    const total=4+a%6,base=total-1;
    return ['На прямой отметили '+base+' точек, а ещё одну точку поставили вне прямой. Сколько различных прямых задают пары этих точек?',total,
     'Пары на исходной прямой дают одну прямую. Внешняя точка с каждой из '+base+' точек задаёт свою прямую. Всего '+(base+1)+'.'];
   },
   segment_contains_two_marked_points: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return withVisual(choice('Какой из отрезков содержит обе точки '+q+' и '+r+' как внутренние?',p+s,[p+r,q+s,q+r],
     'Концы нужного отрезка должны лежать левее '+q+' и правее '+r+'. На чертеже это '+p+' и '+s+'.'),geometryLine([p,q,r,s]));
   },
   count_segments_with_fixed_endpoint: ({a,b})=>{
    const n=5+a%7,[p]=geometryLabels(a,b);
    return ['На прямой '+n+' отмеченных точек, включая '+p+'. Сколько отрезков с двумя отмеченными концами имеют '+p+' одним концом?',n-1,
     'Вторым концом можно выбрать любую из остальных '+(n-1)+' точек.'];
   },
   find_total_from_segment_count: ({a})=>{
    const n=4+a%7,total=n*(n-1)/2;
    return ['На прямой отметили несколько точек. Все пары отмеченных точек задают '+total+' разных отрезков. Сколько точек отметили?',n,
     'Каждая пара даёт один отрезок. Проверяем '+n+' точек: '+n+' · '+(n-1)+' : 2 = '+total+'. При другом числе точек число пар меняется.'];
   }
  }
 ],
 geo_field_line: [
  {
   two_starting_markers: ({a,b})=>{
    const [p,q]=geometryLabels(a,b);
    return choice('Нужно разметить прямую '+p+q+' на местности. Что поставить сначала?',
     'Вехи в '+p+' и '+q,['Только веху в '+p,'Одну веху между точками','Две вехи в одной точке'],
     'Две разные исходные точки задают направление прямой.');
   },
   count_all_stakes: ({a,b})=>['Между двумя крайними вехами стоят '+a+' промежуточных. Сколько вех всего?',a+2,
    'К промежуточным прибавляем две крайние: '+a+' + 2 = '+(a+2)+'.'],
   choose_aligned_stake: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return withVisual(choice('Крайние вехи стоят в '+p+' и '+r+'. Какую отмеченную точку выбрать для промежуточной вехи?',q,[p,r,s],
     'Точка '+q+' лежит на линии визирования между исходными вехами. Точка '+s+' смещена в сторону.'),geometryLine([p,q,r],'line',s));
   },
   count_gaps: ({a})=>['Вдоль прямой выставили '+(a+1)+' вех. Сколько промежутков между соседними вехами?',a,
    'Каждый промежуток образует пара соседних вех. Их на один меньше, чем вех.']
  },
  {
   distance_given_spacing: ({a,b})=>['В ряду '+(a+1)+' вех. Между соседними '+b+' м. Найди расстояние от первой до последней (в м).',a*b,
    'Между '+(a+1)+' вехами '+a+' промежутков. Умножаем '+a+' · '+b+'.'],
   stakes_including_endpoints: ({a,b})=>['От первой вехи до последней '+a*b+' м. Вехи стоят через '+b+' м. Сколько вех вместе с крайними?',a+1,
    'Делим расстояние на шаг и получаем '+a+' промежутков. Вех на одну больше.'],
   find_spacing_on_line: ({a,b})=>['На участке длиной '+a*b+' м установили '+(a+1)+' вех, включая обе крайние. Найди равный шаг (в м).',b,
    'Между вехами '+a+' промежутков. Делим '+a*b+' на '+a+'.'],
   position_of_numbered_stake: ({a,b,c})=>['Вехи стоят через '+b+' м. На каком расстоянии от первой стоит веха № '+(a+1)+'?',a*b,
    'До вехи № '+(a+1)+' от первой '+a+' промежутков. Расстояние '+a+' · '+b+' = '+a*b+' м.']
  },
  {
   two_sections_share_stake: ({a,b,c})=>['Два соседних участка прямой дороги длиной '+a*b+' и '+c*b+' м размечают вехами через '+b+' м. В месте стыка стоит одна общая веха. Сколько вех всего, включая крайние?',a+c+1,
    'На первом участке '+a+' промежутков, на втором '+c+'. Складываем и добавляем 1 к числу промежутков.'],
   extend_and_count_new_stakes: ({a,b,c})=>['По прямой от A до B '+a*b+' м. Вехи стоят через '+b+' м. Линию продлили на '+c*b+' м за B. Сколько новых вех нужно после B, включая новый конец?',c,
    'На продолжении '+c*b+' : '+b+' = '+c+' промежутков. Веха B уже стоит, значит нужно '+c+' новых.'],
   missing_stakes_from_existing_layout: ({a,b,c})=>['На отрезке '+2*a*b+' м вехи уже поставлены через '+2*b+' м, включая крайние. Шаг уменьшают до '+b+' м. Сколько вех нужно добавить?',a,
    'В каждом из '+a+' исходных промежутков добавляем ровно одну веху посередине.'],
   two_passes_alignment: ({a,b})=>['При разбивке прямой от точки A отмерили '+a*b+' м до B, дальше ещё '+2*a*b+' м до C. Вехи считают от A с шагом '+b+' м. Какой номер имеет веха в C, если в A стоит веха № 1?',3*a+1,
    'От A до C '+3*a*b+' м, это '+3*a+' промежутков. Так как счёт начинается с 1, в C номер '+(3*a+1)+'.']
  }
 ],
 geo_rays: [
  {
   ray_start_from_name: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Какая точка является началом луча '+p+q+'?',p,[q,r,s],
     'Первая буква в названии луча обозначает его начало.');
   },
   read_ray_name: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return withVisual(choice('Как называется показанный луч?',p+q,[q+p,p+r,r+q],
     'Луч начинается в '+p+' и проходит через '+q+'. В названии начало пишем первым.'),geometryLine([p,q],'ray'));
   },
   ray_vs_segment: ({a,b})=>{
    const [p,q]=geometryLabels(a,b);
    return choice('Какое свойство верно для луча '+p+q+'?','Имеет начало и продолжается в одну сторону',
     ['Имеет два конца','Продолжается без начала в обе стороны','Состоит из двух точек'],
     'У луча есть начало '+p+'. Точка '+q+' задаёт направление.');
   },
   arrow_direction_read: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return withVisual(checkStatement('Может ли '+p+' быть началом изображённого луча?',true,
     'Слева луч начинается в '+p+', справа стрелка показывает его продолжение.'),geometryLine([p,q,r],'ray'));
   }
  },
  {
   ray_membership_on_line: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return withVisual(choice('Какая точка не принадлежит лучу '+q+r+'?',p,[q,r,s],
     'У луча '+q+r+' начало в '+q+', а направление вправо через '+r+'. Точка '+p+' лежит слева от начала.'),geometryLine([p,q,r,s]));
   },
   choose_opposite_ray: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return withVisual(choice('Какой из лучей противоположен '+q+r+'?',q+p,[q+s,p+q,r+q],
     'Противоположные лучи имеют одно начало '+q+' и идут в разные стороны.'),geometryLine([p,q,r,s]));
   },
   different_starts_are_different: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return withVisual(checkStatement('Совпадают ли лучи '+p+r+' и '+q+r+'?',false,
     'Оба идут вправо, но начала разные. Первый луч содержит '+p+', второй — нет.'),geometryLine([p,q,r]));
   },
   same_ray_different_names: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return withVisual(choice('Как ещё можно назвать луч '+p+q+'?',p+r,[q+p,r+p,q+r],
     'Оба названия начинаются с '+p+'. Точки '+q+' и '+r+' расположены справа от него.'),geometryLine([p,q,r],'ray'));
   }
  },
  {
   count_rays_from_marked_points: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return withVisual(['Сколько разных лучей с началом в отмеченных точках можно назвать, используя второй отмеченный пункт для направления?',6,
     'Из крайних точек видим по одному направлению к другой отмеченной точке. Из внутренних — по два. Получаем 1 + 2 + 2 + 1 = 6.'],geometryLine([p,q,r,s]));
   },
   intersection_of_opposite_rays: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return withVisual(choice('Какие точки общие у лучей '+q+p+' и '+q+r+'?', 'Только '+q,[p+' и '+r,q+' и '+r,'Общих точек нет'],
     'Лучи идут от '+q+' в противоположные стороны. Они имеют только одно общее начало.'),geometryLine([p,q,r]));
   },
   common_part_is_segment: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return withVisual(choice('Какова общая часть лучей '+q+r+' и '+r+q+'?', 'Отрезок '+q+r,
     ['Только '+q,'Луч '+q+r,'Вся прямая '+p+s],
     'Первый луч идёт вправо от '+q+', второй влево от '+r+'. Их общая часть включает обе границы и все точки между ними.'),geometryLine([p,q,r,s]));
   },
   common_part_is_ray: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return withVisual(choice('Какова общая часть лучей '+p+r+' и '+q+s+'?', 'Луч '+q+s,
     ['Луч '+p+r,'Отрезок '+p+q,'Только '+s],
     'Оба луча направлены вправо. Общие точки начинаются с '+q+', потому что начало второго луча правее.'),geometryLine([p,q,r,s]));
   }
  }
 ],
 geo_angle: [
  {
   vertex_of_named_angle: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b);
    return choice('Назови вершину угла ∠'+p+o+q+'.',o,[p,q,r],'В обозначении из трёх букв вершина стоит посередине.');
   },
   sides_of_named_angle: ({a,b})=>{
    const [o,p,q]=geometryLabels(a,b),correct=o+p+' и '+o+q;
    return choice('Какие лучи являются сторонами ∠'+p+o+q+'?',correct,[p+o+' и '+q+o,o+p+' и '+p+q,p+q+' и '+q+p],
     'Обе стороны начинаются в вершине '+o+'.');
   },
   read_vertex_from_diagram: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b);
    return withVisual(choice('Какая точка является вершиной отмеченного угла?',o,[p,q,r],
     'Вершина — общая начальная точка обоих лучей.'),geometryAngle([o,p,q],[0,35+5*(b%9)]));
   },
   two_names_of_angle: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b);
    return choice('Как ещё можно назвать ∠'+p+o+q+'?', '∠'+q+o+p,['∠'+o+p+q,'∠'+p+q+o,'∠'+r+o+q],
     'Поменяли местами точки на сторонах. Вершина '+o+' осталась посередине.');
   }
  },
  {
   read_middle_ray: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b);
    return withVisual(choice('Какой луч проходит внутри ∠'+p+o+r+'?',o+q,[o+p,o+r,q+o],
     'Из вершины '+o+' проведены три луча. Внутренняя сторона — '+o+q+'.'),geometryAngle([o,p,q,r],[0,25+b,70+b]));
   },
   identify_angle_from_sides: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b);
    return choice('Какой угол образуют лучи '+o+p+' и '+o+q+'?', '∠'+p+o+q,['∠'+o+p+q,'∠'+p+q+o,'∠'+p+o+r],
     'Начало обоих лучей '+o+'. Записываем эту точку в середине названия угла.');
   },
   relation_of_two_angles: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b);
    return withVisual(choice('Какой из углов содержит обе части ∠'+p+o+q+' и ∠'+q+o+r+'?','∠'+p+o+r,
     ['∠'+p+o+q,'∠'+q+o+r,'∠'+p+q+r],'Луч '+o+q+' делит угол с крайними сторонами '+o+p+' и '+o+r+'.'),
     geometryAngle([o,p,q,r],[0,28+b,80+b]));
   },
   distinguish_different_angles: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b),truth=b%2===0,last=truth?p:r;
    return withVisual(checkStatement('Одно и то же ли ∠'+p+o+q+' и ∠'+q+o+last+'?',truth,
     truth?'Да. Совпадают обе стороны, записанные в обратном порядке.':'Вершина одна, но совпадает только одна сторона. Это разные углы.'),
     geometryAngle([o,p,q,r],[0,28+b,75+b]));
   }
  },
  {
   count_unoriented_angles: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b);
    return withVisual(['Сколько разных неразвёрнутых углов образуют пары показанных лучей?',3,
     'Выбираем пары: '+o+p+' и '+o+q+', '+o+p+' и '+o+r+', '+o+q+' и '+o+r+'. Всего три угла.'],
     geometryAngle([o,p,q,r],[0,25+b,75+b]));
   },
   common_side_from_two_angle_names: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b);
    return choice('Какая сторона общая у ∠'+p+o+q+' и ∠'+r+o+q+'?',o+q,[o+p,o+r,q+o],
     'Первый угол ограничен лучами '+o+p+' и '+o+q+'. Второй — '+o+r+' и '+o+q+'.');
   },
   choose_correct_angle_statement: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b);
    return withVisual(choice('Какое утверждение верно по чертежу?',o+q+' лежит внутри ∠'+p+o+r,
     [o+p+' лежит внутри ∠'+q+o+r,o+r+' лежит внутри ∠'+p+o+q,o+q+' не имеет общей вершины с углом'],
     'Только луч '+o+q+' расположен между сторонами двух других лучей с общим началом.'),
     geometryAngle([o,p,q,r],[0,34+b,84+b]));
   },
   count_angles_with_fixed_ray: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b),last=geometryLetters[(geometryLetters.indexOf(r)+1)%geometryLetters.length];
    return withVisual(['Сколько разных углов на чертеже имеют сторону '+o+q+'?',3,
     'Объединяем эту сторону по очереди с '+o+p+', '+o+r+' и '+o+last+'. Это три разные пары.'],
     geometryAngle([o,p,q,r,last],[0,27+b,65+b,112+b]));
   }
  }
 ],
 geo_congruent_figures: [
  {
   segments_length_by_overlay: ({a,b})=>['При наложении AB и CD совпали. AB = '+(a+b)+' см. Найди CD в сантиметрах.',a+b,
    'Совпавшие при наложении отрезки имеют одинаковую длину.'],
   angles_measure_by_overlay: ({a,b})=>['Углы равны. Величина первого '+(20+3*a+b)+'°. Сколько градусов во втором?',20+3*a+b,
    'Соответствующие углы равных фигур имеют одинаковую величину.'],
   identify_congruence_meaning: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Что следует из того, что '+p+q+' полностью совместился с '+r+s+'?',p+q+' = '+r+s,
     [p+q+' вдвое длиннее '+r+s,'У отрезков одна общая точка','Отрезки обязательно лежали на одной прямой до наложения'],
     'Равенство означает, что их можно совместить. Начальное положение отрезков может быть разным.');
   },
   equal_rectangles_dimension: ({a,b})=>['Два прямоугольника совпали при наложении. У первого длинная сторона '+(a+b)+' см. Найди длинную сторону второго.',a+b,
    'Длинные стороны соответствуют друг другу, значит равны.']
  },
  {
   read_corresponding_segments: ({a,b,c})=>['При наложении AB совпал с CD. Точка M внутри AB соответствует N внутри CD. AM = '+a+' см, MB = '+b+' см. Найди CD.',a+b,
    'Второй отрезок имеет ту же длину, что AB. Складываем его части: '+a+' + '+b+'.'],
   equal_angles_find_x: ({a,b})=>['Величины равных углов равны '+a+'x° и '+a*b+'°. Найди x.',b,
    'Приравниваем: '+a+'x = '+a*b+'. Делим обе части на '+a+'.'],
   match_angle_measure: ({a,b})=>choice('Какое условие достаточно для равенства углов ∠ABC и ∠KLM?',
    'Их градусные меры равны',['Их вершины обозначены одной буквой','Обе меры меньше 90°','У них по две стороны'],
    'Для углов одинаковая градусная мера означает возможность совместить один угол с другим.'),
   put_equal_segments_on_same_ray: ({a,b})=>['От общей точки O на луче отложили равные отрезки OA и OB длиной '+(a+b)+' см. Чему равно расстояние между A и B?',0,
    'На одном луче на данном расстоянии от начала есть ровно одна точка. Поэтому A и B совпадают.']
  },
  {
   shared_angle_from_two_forms: ({a,b,c})=>['Градусные меры равных углов равны '+(a%6+2)+'x + '+c+' и '+(a%6+1)+'x + '+(c+b)+'. Найди общую градусную меру.',(a%6+2)*b+c,
    'Приравниваем выражения. После сокращения получаем x = '+b+'. Подставляем: '+(a%6+2)+' · '+b+' + '+c+' = '+((a%6+2)*b+c)+'.'],
   doubled_length_from_equality: ({a,b,c})=>['Длины равных отрезков '+a+'x + '+b+' и '+(a-1)+'x + '+(b+c)+' см. Найди удвоенную длину.',2*(a*c+b),
    'Из равенства получаем x = '+c+'. Длина одного отрезка '+(a*c+b)+' см. Удваиваем.'],
   compose_congruent_rectangles: ({a,b})=>['Два равных прямоугольника со сторонами '+(a+b)+' и '+b+' см приложили друг к другу длинными сторонами. Найди периметр нового прямоугольника.',2*(a+3*b),
    'Длина осталась '+(a+b)+' см, ширина удвоилась и стала '+2*b+' см. Складываем стороны и удваиваем.'],
   corresponding_parts_difference: ({a,b})=>['При наложении A совместилась с C, B — с D, а внутренняя точка M — с N. AM = '+a+' см, MB в '+b+' раз больше AM. Найди разность ND − CN (в см).',a*(b-1),
    'При наложении CN = AM = '+a+', а ND = MB = '+a*b+'. Вычитаем и получаем '+a*(b-1)+' см.']
  }
 ],
 geo_compare_segments_angles: [
  {
   compare_lengths_same_units: ({a,b})=>compare('Сравни длины '+a+' см и '+b+' см.',rational(a),rational(b),'Единицы одинаковы, сравниваем числовые значения.'),
   compare_aligned_segments: ({a,b})=>{
    const [o,p,q]=geometryLabels(a,b);
    return withVisual(choice('Какой из отрезков длиннее: '+o+p+' или '+o+q+'?',o+q,[o+p,'Они равны','Определить нельзя'],
     'У отрезков общее начало. Конец '+q+' дальше от '+o+', значит '+o+q+' длиннее.'),geometryLine([o,p,q],'ray'));
   },
   compare_angles_same_units: ({a,b})=>compare('Сравни углы '+(20+3*a)+'° и '+(20+3*b)+'°.',rational(20+3*a),rational(20+3*b),'Сравниваем их градусные меры.'),
   compare_aligned_angles: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b);
    return withVisual(choice('Какой угол больше: ∠'+p+o+q+' или ∠'+p+o+r+'?', '∠'+p+o+r,['∠'+p+o+q,'Углы равны','Определить нельзя'],
     'У углов общие вершина и сторона. Вторая сторона первого лежит внутри второго.'),geometryAngle([o,p,q,r],[0,32+b,78+b]));
   }
  },
  {
   compare_mixed_length_units: ({a,b})=>compare('Сравни '+a+' см '+b%10+' мм и '+(10*a+b%10-1)+' мм.',
    rational(10*a+b%10),rational(10*a+b%10-1),'Первую длину переводим в миллиметры.'),
   determine_difference_of_angles: ({a,b})=>['Один угол равен '+(20+a)+'°, другой '+(20+a+2*b)+'°. На сколько градусов второй больше?',2*b,
    'Из большей градусной меры вычитаем меньшую: '+(20+a+2*b)+' − '+(20+a)+' = '+2*b+'.'],
   segment_part_comparison: ({a,b})=>compare('Точка M внутри AB. AM = '+a+' см, MB = '+b+' см. Сравни AB и MB.',
    rational(a+b),rational(b),'Длина всего отрезка равна сумме длин частей.'),
   angle_part_comparison: ({a,b})=>compare('Луч BD проходит внутри ∠ABC. ∠ABD = '+(20+a)+'°, ∠DBC = '+(20+b)+'°. Сравни ∠ABD и ∠DBC.',
    rational(20+a),rational(20+b),'Луч делит исходный угол на две указанные части. Сравниваем их градусные меры.')
  },
  {
   compare_lengths_after_subtraction: ({a,b,c})=>compare('M внутри AB, N внутри CD. AB = '+(a+b)+' см, AM = '+a+' см, CD = '+(a+c)+' см, CN = '+a+' см. Сравни MB и ND.',
    rational(b),rational(c),'Из каждой полной длины вычитаем её первую часть.'),
   compare_subangles_from_wholes: ({a,b,c})=>compare('∠ABC = '+(20+a+b)+'°, ∠ABD = '+(20+a)+'°. D внутри угла ABC. ∠KLM = '+(20+a+c)+'°, ∠KLN = '+(20+a)+'°. N внутри KLM. Сравни ∠DBC и ∠NLM.',
    rational(b),rational(c),'Из каждого полного угла вычитаем известную часть с общей стороной.'),
   recover_equal_parts: ({a,b,c})=>['Отрезки AB и CD имеют длины '+(a+b)+' и '+(a+c)+' см. У первого отрезали '+b+' см. Сколько сантиметров отрезать у второго, чтобы остатки были равны?',c,
    'От первого осталось '+a+' см. От второго нужно отрезать '+(a+c)+' − '+a+' = '+c+' см.'],
   compare_two_angle_sums: ({a,b,c})=>compare('Сравни сумму углов '+(15+a)+'° и '+(20+b)+'° с углом '+(35+a+c)+'°.',
    rational(35+a+b),rational(35+a+c),'Сначала складываем меры двух первых углов, затем сравниваем с третьей мерой.')
  }
 ],
 geo_angle_bisector: [
  {
   divide_even_angle: ({a,b})=>['Биссектриса делит угол величиной '+2*(20+a+b)+'°. Найди величину каждой части.',20+a+b,
    'Делим градусную меру полного угла пополам: '+2*(20+a+b)+' : 2 = '+(20+a+b)+'.'],
   recover_from_half: ({a,b})=>['Одна из частей угла, разделённого биссектрисой, равна '+(20+a+b)+'°. Найди полный угол.',2*(20+a+b),
    'У частей одинаковые меры. Складываем две половины.'],
   read_marked_equal_arcs: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b),half=24+b;
    return withVisual(choice('Какой луч является биссектрисой ∠'+p+o+r+' по отмеченным равным дугам?',o+q,[o+p,o+r,q+o],
     'Две одинаковые дуги показывают, что '+o+q+' делит угол на равные части.'),geometryAngle([o,p,q,r],[0,half,2*half],{equalArcs:true}));
   },
   verify_not_half: ({a,b})=>{
    const truth=b%2===0,half=15+a,second=half+Number(!truth);
    return checkStatement('Луч делит угол на '+half+'° и '+second+'°. Является ли он биссектрисой?',truth,
     'Проверяем равенство двух частей: '+half+'° '+(truth?'равно ':'отличается от ')+second+'°.');
   }
  },
  {
   bisector_find_parameter: ({a,b})=>['Половины угла имеют меры '+a+'x + '+b+' и '+(a-1)+'x + '+(b+a)+'. Найди x.',a,
    'Биссектриса делит угол пополам. Приравниваем меры, вычитаем ('+(a-1)+')x и '+b+'. Получаем x = '+a+'.'],
   fraction_of_right_angle: ({a,b})=>['Биссектриса делит угол величиной '+(90+2*a+b%2)+'°. На сколько градусов каждая часть больше 45°?',rational(2*a+b%2,2),
    'Каждая часть равна половине полного угла. Из половины вычитаем 45° и получаем '+exact(rational(2*a+b%2,2))+'°.' ],
   compare_half_of_angles: ({a,b})=>compare('Биссектрисы проведены в углах '+2*(20+a)+'° и '+2*(20+b)+'°. Сравни величины половин.',
    rational(20+a),rational(20+b),'Делим обе исходные меры пополам.'),
   identify_part_on_marked_diagram: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b),half=25+b;
    return withVisual(['Мера ∠'+p+o+q+' равна '+half+'°. Найди ∠'+q+o+r+' по отметкам на чертеже.',half,
     'Одинаковые дуги означают равные углы. Вторая часть тоже равна '+half+'°.'],geometryAngle([o,p,q,r],[0,half,2*half],{equalArcs:true}));
   }
  },
  {
   two_successive_bisectors: ({a,b})=>['Угол '+4*(15+a+b)+'° разделили биссектрисой. Затем в одной из половин провели её биссектрису. Найди меньший угол, полученный после второго деления.',15+a+b,
    'Первым делением получаем половину, вторым — половину от половины. Делим '+4*(15+a+b)+'° на 4.'],
   bisectors_adjacent_parts: ({a,b})=>['Один внутренний луч делит угол на две части, '+2*(20+a)+'° и '+2*(20+b)+'°. Провели биссектрисы обеих частей. Найди угол между ними.',40+a+b,
    'От общего луча до первой биссектрисы '+(20+a)+'°, до второй '+(20+b)+'°. Складываем, потому что биссектрисы по разные стороны общего луча.'],
   bisector_after_angle_difference: ({a,b,c})=>['Полный угол равен '+(3*a+2*b+c)+'°. Один внутренний луч отсёк '+(a+c)+'°. Оставшуюся часть разделили пополам. Сколько градусов в каждой новой части?',a+b,
    'Вычитаем '+(a+c)+'° и получаем '+2*(a+b)+'°. Делим на 2.'],
   bisector_recover_full_by_equation: ({a,b,c})=>{
    const factor=a%4+2;
    return ['Биссектриса делит угол на части с мерами '+factor+'x + '+b+' и '+(factor-1)+'x + '+(b+c)+'. Найди полный угол.',2*(factor*c+b),
     'Из равенства частей получаем x = '+c+'. Половина угла '+(factor*c+b)+'°, удваиваем и получаем '+2*(factor*c+b)+'°.'];
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
add('alg_polynomials','division_with_remainder','Деление с остатком','Если a = bq + r, то q — неполное частное, а остаток r удовлетворяет условию 0 ≤ r < b.', null);
add('alg_formulas','binomial_cube','Куб суммы и куб разности','Раскрой три одинаковых множителя. Коэффициенты в формуле куба — 1, 3, 3, 1. В кубе разности знаки чередуются.', null);
add('alg_formulas','higher_binomial_power','Возведение двучлена в степень','Представь степень как произведение одинаковых скобок. Для каждого члена посчитай, сколько раз при умножении получается одна и та же степень x.', null);
add('alg_formulas','perfect_square_factor','Разложение по формуле квадрата двучлена','Проверь квадраты крайних членов и удвоенное произведение в середине. Знак среднего члена определяет знак в двучлене.', null);
add('alg_formulas','factor_difference_squares','Разложение разности квадратов','Разность квадратов раскладывается на произведение разности и суммы: A² − B² = (A − B)(A + B).', null);
add('alg_systems','linear_inequalities_two_variables','Неравенства с двумя переменными','Для проверки точки подставь её координаты во все неравенства. В строгом неравенстве точки на границе не входят в решение.', null);

add('geo_basics','geo_field_line','Провешивание прямой','Чтобы отметить прямую на местности, сначала поставь вехи в двух заданных точках. Затем выставляй промежуточные вехи на линии наблюдения.', null);
add('geo_basics','geo_congruent_figures','Равные геометрические фигуры','Равные фигуры совпадают при наложении. У соответствующих отрезков и углов равны длины и градусные меры.', null);
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

add('geo_basics','geo_rays','Луч',reviewedLessons.geo_rays,null);
add('geo_basics','geo_angle','Угол',reviewedLessons.geo_angle,null);
add('geo_basics','geo_compare_segments_angles','Сравнение отрезков и углов',reviewedLessons.geo_compare_segments_angles,null);

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
  const [text,answer,options,detail,attach]=build({a:ri(3,13),b:ri(2,13),c:ri(3,14),y:ri(2,13)});
  const audit={variant,level:d};
  const sig=g7QuestionSig(raw,d,variant,[text,typeof answer==='object'?JSON.stringify(answer):answer]);
  let question;
  if(Array.isArray(options))question=g7StrictChoice(text,answer,options,detail,sig,audit);
  else if(detail==='linear')question=g7LinearInput(text,answer,options,sig,audit);
  else if(detail==='coordinate')question=g6CoordinateInputQuestion(text,answer.x,answer.y,options,sig,{audit});
  else question=g7InputQuestionForRat(text,typeof answer==='number'?rational(answer):answer,options,sig,{audit,
   inputHint:'Введи точное значение. Обыкновенную дробь можно записать через /.'});
  return typeof attach==='function'?attach(question):question;
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

// The Grade 8 quiz adapters also match several unqualified Grade 7 topic names.
// Reviewed topics use their Grade 7 generator directly in normal practice.
const previousFreshQuiz=freshQuiz;
freshQuiz=function(id){
 const raw=rawCourseId(id),session=blockSession;
 if(keyGrade(id)!==7||!reviewed[raw]||session?.kind!=='g7quiz'||session.topicId!==raw||session.finished){
  return previousFreshQuiz(id);
 }
 const stage=session.stageIndex,key=raw+':'+stage;
 const history=session._g7Stage13Used||(session._g7Stage13Used={});
 const used=history[key]||(history[key]=[]);
 const signatures=new Set(used.map(entry=>entry.sig));
 const meanings=new Set(used.map(entry=>entry.semantic));
 const familyCounts=new Map();
 for(const entry of used)familyCounts.set(entry.family,(familyCounts.get(entry.family)||0)+1);
 const lowestFrequency=Math.min(...Object.keys(reviewed[raw][stage]).map(family=>familyCounts.get(family)||0));
 let best=null;
 for(let attempt=0;attempt<120;attempt++){
  const question=makeG7Question(id,stage);
  const family=question.audit.variant;
  const semantic=JSON.stringify([question.text,question.ans,question.visual?.data||null]);
  if(signatures.has(question.sig)||meanings.has(semantic))continue;
  const frequency=familyCounts.get(family)||0;
  if(!best||frequency<best.frequency)best={question,family,semantic,frequency};
  if(frequency===lowestFrequency&&!wasRecent(question.sig))break;
 }
 if(!best)return previousFreshQuiz(id);
 const {question,family,semantic}=best;
 registerSignature(question.sig);
 question._signature=question.sig;
 used.push({sig:question.sig,family,semantic});
 return question;
};

// The initial Home render precedes the external textbook scripts.
if(!currentGrade){
 const home=document.querySelector('.grade-card button[onclick="openGrade(7)"]')?.closest('.grade-card');
 const progress=home?.querySelector('.grade-summary');
 if(progress)progress.textContent='Пройдено тем: '+gradeCompletedTopics(7)+'/'+g7AllTopics().length+' • этапов: '+g7CompletedStages()+'/'+g7TotalStages();
}
})();
