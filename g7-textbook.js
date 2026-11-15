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
 geo_angle_bisector:'Биссектриса — луч, который исходит из вершины и делит угол на два равных угла. На чертеже равные части угла часто отмечают одинаковыми дугами.',
 geo_segment_angle_measurement:'Если точка M лежит между A и B, то AB = AM + MB. Чтобы найти одну часть, вычти другую из длины всего отрезка.',
 geo_length_units:'В одном сантиметре 10 миллиметров, в одном дециметре 10 сантиметров, в одном метре 100 сантиметров. Для измерения линейкой вычти отметку начала от отметки конца.',
 geo_angle_measure:'Прямой угол равен 90°, развёрнутый — 180°. Острый угол меньше 90°, тупой находится между 90° и 180°. Полный угол складывается из частей, на которые его разбивают внутренние лучи.',
 geo_field_angles:'Направления измеряют от общего нуля. На одной стороне от нуля вычитай меньший отсчёт из большего. Для круговой шкалы сравни проход через ноль с поворотом в другую сторону.',
 geo_adjacent_vertical_angles:'Смежные углы имеют общую сторону, а две другие стороны образуют прямую. Их сумма равна 180°. Вертикальные углы имеют попарно противоположные стороны и равны.',
 geo_perpendicular_lines:'Две пересекающиеся прямые перпендикулярны, если образуют прямой угол. Если один угол при пересечении равен 90°, остальные три тоже равны 90°.',
 geo_field_right_angles:'Чтобы вынести прямой угол на местность, одно направление совмещают с исходной прямой, другое — с перпендикулярным визиром. На круговой шкале поворот на 90° отсчитывают от исходного направления.',
 geo_triangle_elements:'У треугольника три вершины, три стороны, три угла. Противоположная углу сторона не проходит через его вершину. Периметр равен сумме трёх сторон.',
 geo_congruence_sas:'Для первого признака нужны две попарно равные стороны и равные углы между ними. При записи равенства треугольников соответствующие вершины ставят на одинаковые места.',
 geo_perpendicular_oblique_distances:'Расстояние от точки до прямой равно длине перпендикуляра, опущенного на неё из этой точки. Конец перпендикуляра на прямой называют его основанием.',
 geo_triangle_medians_bisectors_altitudes:'Медиана идёт к середине противоположной стороны. Биссектриса делит угол при вершине на два равных угла. Высота перпендикулярна прямой, содержащей противоположную сторону.',
 geo_isosceles_properties_criteria:'Углы при основании равнобедренного треугольника равны. Медиана, высота и биссектриса, проведённые из вершины между боковыми сторонами, совпадают.',
 geo_isosceles_equilateral:'У равнобедренного треугольника две равные боковые стороны. У равностороннего треугольника все три стороны равны.',
 geo_congruence_asa:'По второму признаку сравнивают сторону и два прилежащих к ней угла. Вершины данных углов являются концами данной стороны.',
 geo_congruence_sss:'По третьему признаку равны все три пары соответствующих сторон. Чтобы установить соответствие вершин, сопоставь концы двух сторон, сходящихся в каждой вершине.',
 geo_circle_chord_diameter:'Окружность состоит из точек на одинаковом расстоянии от центра. Радиус соединяет центр с точкой окружности. Хорда соединяет две точки окружности. Диаметр — хорда через центр и равен двум радиусам.',
 geo_basic_constructions:'Линейка проводит прямую через две точки, циркуль переносит расстояние и строит окружность или дугу. Построение объясняют свойствами полученных фигур.',
 geo_constructions_lines_angles:'Для переноса отрезка сохрани раствор циркуля. Для переноса угла используй равные радиусы и равную хорду. Серединный перпендикуляр строят по двум точкам, равноудалённым от концов.',
 geo_parallel_perpendicular_intro:'Параллельные прямые лежат в одной плоскости и не пересекаются. Совпадающие прямые имеют все точки общими, пересекающиеся — одну общую точку.'
};

function compare(prompt,left,right,explanation,suffix=''){
 const signs=['&lt;','=','&gt;'],sign=signs[rationalCmp(left,right)+1];
 return choice(prompt,sign,signs.filter(item=>item!==sign),explanation+' Получаем '+exact(left)+suffix+' '+sign+' '+exact(right)+suffix+'.');
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
function geometryCross(labels,angle,rightMarker=false){
 const data={kind:'g7-textbook-cross',labels,angle,rightMarker};
 return question=>g7GeoAttach(question,data,'Точки '+labels.join(', ')+'.');
}
const triangleVisual=(data)=>question=>g7GeoAttach(question,data,'Вершины обозначены на чертеже.');
const originalGeometrySvg=geometrySvg;
geometrySvg=function(data){
 if(data?.kind==='g7-textbook-transversal'){
  const model=g7TransversalModel(data.alpha,{parallelMark:data.parallelMark});
  const body=g7TransversalSvg(model).replace(/>([1-8])<\/text>/g,(_,digit)=>'>'+data.numbers[Number(digit)-1]+'</text>');
  return '<div class="geometry-wrap"><svg class="geometry-svg" viewBox="60 36 535 343" role="img" aria-label="Секущая пересекает две прямые. Углы пронумерованы.">'+body+'</svg></div>';
 }
 if(data?.kind==='g7-textbook-cross'){
  const center={x:320,y:150},directions=[0,data.angle,180,180+data.angle];
  const points=directions.map(degrees=>g7GeoAnglePoint(center,degrees,107));
  const edges=directions.map(degrees=>g7GeoAnglePoint(center,degrees,132));
  const lines=g6GeoLine(edges[0].x,edges[0].y,edges[2].x,edges[2].y,'geo-line')+
   g6GeoLine(edges[1].x,edges[1].y,edges[3].x,edges[3].y,'geo-line alt');
  const labels=points.map(({x,y},i)=>g6GeoPoint(x,y,data.labels[i+1],i===2?-22:8,i<2?-13:21)).join('');
  const right=data.rightMarker?g6RightAngleMarker(center,{x:1,y:0},{x:0,y:-1},24):'';
  return '<div class="geometry-wrap"><svg class="geometry-svg" viewBox="90 0 460 300" role="img" aria-label="Две пересекающиеся прямые">'+
   lines+labels+g6GeoPoint(center.x,center.y,data.labels[0],9,22)+right+'</svg></div>';
 }
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
 ],
 geo_segment_angle_measurement: [
  {
   sum_given_parts: ({a,b})=>['Точка M лежит между A и B. AM = '+a+' см, MB = '+b+' см. Найди AB в сантиметрах.',a+b,
    'Длина всего отрезка равна сумме частей: '+a+' + '+b+' = '+(a+b)+' см.'],
   whole_minus_first_part: ({a,b})=>['M лежит между A и B. AB = '+(a+b)+' см, AM = '+a+' см. Найди MB в сантиметрах.',b,
    'Вычитаем из длины AB известную часть AM: '+(a+b)+' − '+a+' = '+b+' см.'],
   formula_from_diagram: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return withVisual(choice('Какое равенство верно для длин на чертеже?',p+r+' = '+p+q+' + '+q+r,
     [p+q+' = '+p+r+' + '+q+r,q+r+' = '+p+q+' + '+p+r,p+r+' = '+p+q+' − '+q+r],
     'Средняя точка '+q+' делит весь отрезок на две части, длины которых складываются.'),geometryLine([p,q,r],'segment'));
   },
   half_segment_from_midpoint: ({a,b})=>['M — середина AB. Длина AB равна '+2*(a+b)+' см. Найди AM (в см).',a+b,
    'Середина делит отрезок на равные части. Делим '+2*(a+b)+' на 2.']
  },
  {
   three_consecutive_parts: ({a,b,c})=>['Точки A, M, N, B идут в этом порядке. AM = '+a+' см, MN = '+b+' см, NB = '+c+' см. Найди AB (в см).',a+b+c,
    'Складываем три соседних отрезка: '+a+' + '+b+' + '+c+' = '+(a+b+c)+' см.'],
   find_missing_middle_length: ({a,b,c})=>['A, M, N, B идут в этом порядке. AB = '+(a+b+c)+' см, AM = '+a+' см, NB = '+c+' см. Найди MN (в см).',b,
    'Средняя часть равна полной длине без двух крайних: '+(a+b+c)+' − '+a+' − '+c+' = '+b+' см.'],
   ratio_of_two_parts: ({a,b})=>['Длина AB равна '+a*(b+1)+' см. Точка M лежит внутри AB, а MB в '+b+' раз больше AM. Найди AM (в см).',a,
    'Если AM = x, то MB = '+b+'x. Значит, '+(b+1)+'x = '+a*(b+1)+'. Делим на '+(b+1)+'.'],
   overlapping_subsegments: ({a,b,c})=>['Точки A, M, N, B идут в этом порядке. AN = '+(a+b)+' см, MB = '+(b+c)+' см, MN = '+b+' см. Найди AB (в см).',a+b+c,
    'В сумме AN + MB отрезок MN включён дважды. Вычитаем его один раз: '+(a+b)+' + '+(b+c)+' − '+b+' = '+(a+b+c)+' см.']
  },
  {
   locate_midpoints_on_segment: ({a,b})=>['M — середина AB, N — середина AM. AB = '+4*(a+b)+' см. Найди NB (в см).',3*(a+b),
    'AN составляет четверть AB и равен '+(a+b)+' см. Тогда NB = '+4*(a+b)+' − '+(a+b)+' = '+3*(a+b)+' см.'],
   ratio_three_parts: ({a,b,c})=>['Отрезок состоит из трёх частей, длины которых относятся как 1 : '+b+' : '+c+'. Весь отрезок '+a*(1+b+c)+' см. Найди длину второй части (в см).',a*b,
    'Всего '+(1+b+c)+' долей, одна доля равна '+a+' см. Во второй части '+b+' долей, то есть '+a*b+' см.'],
   reconstruct_combined_segment: ({a,b,c})=>['A, M, N, B идут в этом порядке. AN = '+(a+b)+' см, MB = '+(b+c)+' см, AB = '+(a+b+c)+' см. Найди MN (в см).',b,
    'Сумма AN + MB равна AB + MN. Поэтому MN = '+(a+b)+' + '+(b+c)+' − '+(a+b+c)+' = '+b+' см.'],
   compare_halves_of_different_segments: ({a,b,c})=>compare('M — середина отрезка AB длиной '+2*(a+b)+' см, N — середина CD длиной '+2*(a+c)+' см. Сравни AM и CN.',
    rational(a+b),rational(a+c),'Находим половины длин обоих отрезков.',' см')
  }
 ],
 geo_length_units: [
  {
   centimetres_to_millimetres: ({a,b})=>['Вырази '+(a+b)+' см в миллиметрах.',10*(a+b),
    'В одном сантиметре 10 мм. Умножаем '+(a+b)+' на 10.'],
   decimetres_to_centimetres: ({a,b})=>['Вырази '+(a+b)+' дм в сантиметрах.',10*(a+b),
    'В одном дециметре 10 см. Умножаем '+(a+b)+' на 10.'],
   millimetres_to_centimetres: ({a,b})=>['Вырази '+(10*a+b)+' мм в сантиметрах.',rational(10*a+b,10),
    'Делим на 10: '+(10*a+b)+' мм = '+fmt((10*a+b)/10)+' см.'],
   nonzero_ruler_start: ({a,b})=>['На линейке начало отрезка у отметки '+a+' см, конец у отметки '+(a+b)+' см. Найди длину в сантиметрах.',b,
    'Вычитаем отметку начала из отметки конца: '+(a+b)+' − '+a+' = '+b+' см.']
  },
  {
   mixed_units_to_millimetres: ({a,b})=>['Вырази '+a+' см '+b%10+' мм в миллиметрах.',10*a+b%10,
    'Из '+a+' см получаем '+10*a+' мм. Прибавляем '+b%10+' мм.'],
   decimal_ruler_marks: ({a,b,c})=>['Концы отрезка на отметках '+fmt(a/10)+' и '+fmt((a+b+c)/10)+' см. Найди длину в миллиметрах.',b+c,
    'Разность показаний '+fmt((b+c)/10)+' см. Умножаем на 10 и получаем '+(b+c)+' мм.'],
   mixed_length_comparison: ({a,b})=>compare('Сравни '+a+' дм '+b+' см и '+(10*a+b+1)+' см.',
    rational(10*a+b),rational(10*a+b+1),'Переводим дециметры в сантиметры и складываем.',' см'),
   find_end_from_start: ({a,b,c})=>['Начало отрезка у отметки '+a+' см, его длина '+(10*b+c)+' мм. У какой отметки находится конец? Ответ в миллиметрах.',10*a+10*b+c,
    'Начальная отметка '+10*a+' мм. Прибавляем длину и получаем '+(10*a+10*b+c)+' мм.']
  },
  {
   sum_three_mixed_lengths: ({a,b,c})=>['Звенья ломаной имеют длины '+a+' дм, '+b+' см и '+c+' мм. Найди полную длину в миллиметрах.',100*a+10*b+c,
    'Переводим всё в миллиметры и складываем '+100*a+' + '+10*b+' + '+c+'.'],
   differences_with_all_units: ({a,b,c})=>['От '+a+' м проволоки отрезали '+b+' см и '+c+' мм. Сколько миллиметров осталось?',1000*a-10*b-c,
    'В исходной проволоке '+1000*a+' мм. Вычитаем '+10*b+' мм и '+c+' мм.'],
   combine_measured_parts_in_centimetres: ({a,b,c})=>['Первую часть отрезка измерили от отметки '+a+' см до '+(a+b)+' см. Вторая часть равна '+c+' мм. Найди длину обеих частей в сантиметрах.',rational(10*b+c,10),
    'Длина первой части '+b+' см, второй '+fmt(c/10)+' см. Складываем и получаем '+fmt(b+c/10)+' см.'],
   start_mark_from_length: ({a,b,c})=>['Конец отрезка у отметки '+(a+b+c)+' см. Длина отрезка '+(10*b+c)+' мм. У какой отметки его начало? Ответ в миллиметрах.',10*(a+b+c)-(10*b+c),
    'Конечная отметка равна '+10*(a+b+c)+' мм. Вычитаем из неё длину '+(10*b+c)+' мм.']
  }
 ],
 geo_angle_measure: [
  {
   recognize_named_angle_type: ({a,b})=>{
    const measure=[30+a,90,110+b,180][b%4],names=['Острый','Прямой','Тупой','Развёрнутый'],answer=names[b%4];
    return choice('Как называется угол '+measure+'°?',answer,names.filter(name=>name!==answer),
     'Острый угол меньше 90°, прямой равен 90°, тупой меньше 180° и больше 90°, развёрнутый равен 180°.');
   },
   add_two_angle_measures: ({a,b})=>['Внутренний луч делит угол на '+(20+a)+'° и '+(30+b)+'°. Найди весь угол в градусах.',50+a+b,
    'Складываем две части: '+(20+a)+' + '+(30+b)+' = '+(50+a+b)+'°.' ],
   subtract_piece_of_angle: ({a,b})=>['Полный угол равен '+(60+a+b)+'°, одна его часть '+(25+a)+'°. Найди вторую часть (в градусах).',35+b,
    'Вычитаем известную часть: '+(60+a+b)+' − '+(25+a)+' = '+(35+b)+'°.' ],
   amount_to_right_angle: ({a,b})=>['Сколько градусов надо прибавить к '+(45+a+b)+'°, чтобы получить прямой угол?',45-a-b,
    'Прямой угол равен 90°. Разность 90 − '+(45+a+b)+' = '+(45-a-b)+'°.' ]
  },
  {
   three_parts_total: ({a,b,c})=>['Два внутренних луча делят угол на части '+(20+a)+'°, '+(20+b)+'° и '+(20+c)+'°. Найди весь угол.',60+a+b+c,
    'Складываем три части, не считая ни одну дважды. Получаем '+(60+a+b+c)+'°.' ],
   angle_from_part_ratio: ({a,b})=>{
    const ratio=b%8+2;
    return ['Две части угла относятся как 1 : '+ratio+'. Меньшая часть равна '+a+'°. Найди полный угол.',a*(ratio+1),
     'Вторая часть равна '+a*ratio+'°. Складываем '+a+' и '+a*ratio+'.'];
   },
   angle_from_marked_parts: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b),first=20+a,total=55+b;
    return withVisual(['∠'+p+o+r+' = '+total+'°, ∠'+p+o+q+' = '+first+'°. Найди ∠'+q+o+r+' в градусах.',total-first,
     'Внутренний луч отделяет известный угол. Вычитаем '+first+'° из '+total+'° и получаем '+(total-first)+'°.' ],
     geometryAngle([o,p,q,r],[0,first,total]));
   },
   recognize_angle_after_sum: ({a,b})=>{
    const total=80+a+b,correct=total<90?'Острый':total===90?'Прямой':'Тупой';
    return choice('Внутренний луч делит угол на '+(35+a)+'° и '+(45+b)+'°. Какого вида весь угол?',correct,
     ['Острый','Прямой','Тупой','Развёрнутый'].filter(label=>label!==correct),'Сумма частей '+total+'°. Сравниваем её с 90° и 180°.');
   }
  },
  {
   recover_middle_angle_from_overlaps: ({a,b,c})=>['Лучами OA, OB, OC, OD в таком порядке ограничены части ∠AOD. ∠AOC = '+(40+a+b)+'°, ∠BOD = '+(40+b+c)+'°, ∠AOD = '+(60+a+b+c)+'°. Найди ∠BOC.',20+b,
    'В сумме ∠AOC + ∠BOD угол BOC встречается дважды. Вычитаем полный ∠AOD и получаем '+(20+b)+'°.' ],
   recover_unknown_angle_by_difference: ({a,b,c})=>{
    const factor=a%8+2,total=(factor+1)*c+b;
    return ['Внутренний луч делит угол на части x° и ('+factor+'x + '+b+')°. Полный угол '+total+'°. Найди меньшую часть.',c,
     'Сумма частей даёт '+(factor+1)+'x + '+b+' = '+total+'. Вычитаем '+b+' и делим на '+(factor+1)+'.'];
   },
   find_remainder_from_straight: ({a,b,c})=>['Три угла подряд образуют развёрнутый угол. Первый равен '+(30+a)+'°, второй на '+b+'° больше первого. Найди третий.',120-2*a-b,
    'Второй угол '+(30+a+b)+'°. Вычитаем две известные части из 180°.' ],
   compare_angle_sums: ({a,b,c})=>compare('Сравни меньший угол из пары '+(20+a)+'° и '+(20+a+b)+'° с углом, который составляет остаток от '+(55+a+c)+'° после вычитания 35°.',
    rational(20+a),rational(20+a+c),'Меньший из двух — '+(20+a)+'°. Из третьей меры вычитаем 35°.', '°')
  }
 ],
 geo_field_angles: [
  {
   difference_of_two_bearings: ({a,b})=>['Прибор показал '+(20+a)+'° на первую цель и '+(45+a+b)+'° на вторую. Каков угол между направлениями?',25+b,
    'Отсчёты с одной стороны от нуля. Вычитаем меньший: '+(45+a+b)+' − '+(20+a)+' = '+(25+b)+'°.' ],
   clockwise_turn: ({a,b})=>['Отсчёт '+a+'°. Прибор повернули в сторону увеличения на '+b+'°. Какой новый отсчёт?',a+b,
    'При повороте в сторону увеличения прибавляем величину поворота.'],
   counterclockwise_turn: ({a,b})=>['Отсчёт '+(45+a)+'° уменьшили на '+b+'°. Найди новый отсчёт.',45+a-b,
    'Вычитаем '+b+'° из '+(45+a)+'°.'],
   align_reference_zero: ({a,b})=>choice('До начала измерения ноль визира направлен на цель '+geometryLabels(a,b)[0]+'. Для отсчёта на цель '+geometryLabels(a,b)[1]+' что нужно сделать?',
    'Повернуть визир от первой цели ко второй',['Изменить расстояние между целями','Переставить прибор в точку второй цели','Сместить только отметку нуля'],
    'Искомый отсчёт показывает угловой поворот относительно первого направления.')
  },
  {
   bearings_on_opposite_sides: ({a,b})=>['Одна цель отклонена от нуля влево на '+(15+a)+'°, другая вправо на '+(20+b)+'°. Найди угол между ними.',35+a+b,
    'Нулевое направление между целями. Складываем оба отклонения.'],
   reverse_target_reading: ({a,b})=>['Первый отсчёт '+(35+a)+'°. Вторая цель правее на '+(25+b)+'°. Каков её отсчёт?',60+a+b,
    'Прибавляем угловое расстояние к первому отсчёту.'],
   sum_signed_turns: ({a,b,c})=>['Визир показывает '+(80+a)+'°. Его повернули сначала на '+b+'° в сторону уменьшения, потом на '+c+'° в сторону увеличения. Какой отсчёт получился?',80+a-b+c,
    'Сначала вычитаем '+b+', затем прибавляем '+c+'.'],
   choose_two_in_order: ({a,b,c})=>['Три цели имеют отсчёты '+a+'°, '+(a+b)+'° и '+(a+b+c)+'°. На сколько градусов угол между крайними больше угла между первой и второй?',c,
    'Между крайними угол '+(b+c)+'°. Между первыми двумя '+b+'°. Вычитаем и получаем '+c+'°.' ]
  },
  {
   shorter_wraparound_path: ({a,b})=>['Два направления имеют отсчёты '+(360-2*a)+'° и '+(15+b)+'°. Найди меньший угол между ними.',2*a+15+b,
    'От первого отсчёта до нуля '+2*a+'°, затем до второго ещё '+(15+b)+'°. Сумма меньше 180°.' ],
   compare_paths_between_same_bearings: ({a,b,c})=>['Между двумя направлениями по часовой стрелке '+(200+a+b+c)+'°. Каков меньший угол между ними?',160-a-b-c,
    'Полный оборот 360°. В противоположную сторону поворот равен 360 − '+(200+a+b+c)+' = '+(160-a-b-c)+'°.' ],
   backward_wraparound_reading: ({a,b})=>['Отсчёт '+a+'°. Визир повернули на '+(a+b)+'° в сторону уменьшения. Какой отсчёт от 0° до 359° получится?',360-b,
    'Вычитаем и получаем −'+b+'°. Прибавляем полный оборот 360°.' ],
   longest_rotation_difference: ({a,b,c})=>{
    const short=a+b+c;
    return ['Меньший поворот между двумя целями равен '+short+'°. На сколько градусов больший поворот превышает меньший?',360-2*short,
     'Больший поворот равен 360 − '+short+' = '+(360-short)+'°. Вычитаем из него меньший.'];
   }
  }
 ],
 geo_adjacent_vertical_angles: [
  {
   vertical_measure_direct: ({a,b})=>['Один из вертикальных углов равен '+(35+a+b)+'°. Найди второй.',35+a+b,
    'Вертикальные углы равны.'],
   supplementary_measure_direct: ({a,b})=>['Один из смежных углов равен '+(50+a+b)+'°. Найди второй.',130-a-b,
    'Сумма смежных углов 180°. Вычитаем известную часть.'],
   read_vertical_angle_pair: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b),s=geometryLetters[(geometryLetters.indexOf(r)+1)%geometryLetters.length];
    return withVisual(choice('Какой угол вертикален ∠'+p+o+q+'?', '∠'+r+o+s,
     ['∠'+q+o+r,'∠'+s+o+p,'∠'+p+o+r],'Для обеих сторон берём противоположные лучи.'),geometryCross([o,p,q,r,s],40+b));
   },
   read_adjacent_angle_pair: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b),s=geometryLetters[(geometryLetters.indexOf(r)+1)%geometryLetters.length];
    return withVisual(choice('Какой угол смежен с ∠'+p+o+q+' и имеет общую сторону '+o+q+'?', '∠'+q+o+r,
     ['∠'+r+o+s,'∠'+s+o+p,'∠'+p+o+r],'Сторона '+o+q+' общая, остальные стороны противоположны.'),geometryCross([o,p,q,r,s],45+b));
   }
  },
  {
   adjacent_angle_ratio: ({a,b})=>{
    const ratio=[2,3,4,5,8][b%5],answer=180/(ratio+1);
    return ['Один смежный угол в '+ratio+' раз больше другого. Найди меньший.',answer,'Сумма '+(ratio+1)+' равных долей составляет 180°. Делим на число долей.'];
   },
   find_angle_from_vertical_sum: ({a,b})=>['Сумма двух вертикальных углов равна '+2*(35+a+b)+'°. Найди каждый угол.',35+a+b,
    'Вертикальные углы равны. Делим сумму на 2.'],
   adjacent_unknown_by_difference: ({a,b})=>['Один смежный угол на '+2*(a+b)+'° больше другого. Найди больший.',90+a+b,
    'Если меньший угол равен x, то второй x + '+2*(a+b)+'. Из суммы 180° получаем больший угол '+(90+a+b)+'°.' ],
   same_pair_or_not: ({a,b})=>{
    const truth=b%2===0,first=45+a,second=truth?first:180-first;
    return checkStatement('Углы '+first+'° и '+second+'° образованы двумя пересекающимися прямыми. Могут ли они быть вертикальными?',truth,
     'Вертикальные углы должны иметь равные градусные меры.');
   }
  },
  {
   two_adjacent_expressions: ({a,b,c})=>{
    const coef=a%4+2,constant=180-(coef+1)*c-b;
    return ['Смежные углы равны ('+coef+'x + '+b+')° и (x + '+constant+')°. Найди x.',c,
     'Сумма даёт '+(coef+1)+'x + '+(b+constant)+' = 180. После вычитания и деления получаем x = '+c+'.'];
   },
   find_large_from_three: ({a,b})=>['Сумма трёх углов при пересечении двух прямых равна '+(180+40+a+b)+'°. Найди больший из четырёх углов.',140-a-b,
    'От 360° вычитаем сумму трёх углов и получаем '+(140-a-b)+'°. Этот угол тупой, а смежный с ним острый.'],
   vertical_equation_then_adjacent: ({a,b,c})=>{
    const coef=a%4+2,measure=coef*c+b;
    return ['Вертикальные углы имеют меры '+coef+'x + '+b+' и '+(coef-1)+'x + '+(b+c)+'. Найди угол, смежный с каждым из них.',180-measure,
     'Приравниваем меры и получаем x = '+c+'. Каждый вертикальный угол равен '+measure+'°. Смежный равен 180° − '+measure+'°.' ];
   },
   exterior_bisectors_measure: ({a,b})=>['Провели биссектрисы смежных углов '+(40+a+b)+'° и '+(140-a-b)+'°. Чему равен угол между биссектрисами?',90,
    'Угол между биссектрисами — сумма половин исходных углов, то есть половина 180°.' ]
  }
 ],
 geo_perpendicular_lines: [
  {
   notation_of_perpendicularity: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Как записать, что прямые '+p+q+' и '+r+s+' перпендикулярны?',p+q+' ⟂ '+r+s,
     [p+q+' ∥ '+r+s,p+q+' = '+r+s,p+r+' ⟂ '+q+s],'Символ ⟂ обозначает перпендикулярность.');
   },
   four_right_angles: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return ['Сколько прямых углов образуют две перпендикулярные прямые '+p+q+' и '+r+s+' в точке пересечения?',4,
     'Смежные с прямым равны 180° − 90° = 90°, а вертикальный тоже 90°.' ];
   },
   read_right_angle_marker: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b),s=geometryLetters[(geometryLetters.indexOf(r)+1)%geometryLetters.length];
    return withVisual(choice('Какие прямые перпендикулярны на чертеже?',p+r+' и '+q+s,
     [p+q+' и '+r+s,p+s+' и '+q+r,p+q+' и '+p+r],'Квадратная отметка при пересечении показывает прямой угол.'),
     geometryCross([o,p,q,r,s],90,true));
   },
   identify_from_measure: ({a,b})=>{
    const truth=b%2===0,angle=truth?90:90-a;
    return checkStatement('Прямые пересеклись под углом '+angle+'°. Перпендикулярны ли они?',truth,'Для перпендикулярности угол должен равняться 90°.');
   }
  },
  {
   sum_missing_for_perpendicular: ({a,b})=>['Луч делит прямой угол на части. Одна равна '+(30+a)+'°. Найди другую.',60-a,
    'Из 90° вычитаем '+(30+a)+'°.'],
   verify_adjacent_angles_equal: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b);
    return checkStatement('Смежные углы ∠'+p+o+q+' и ∠'+q+o+r+' равны. Перпендикулярны ли '+p+r+' и '+o+q+'?',true,
     'У равных смежных углов сумма 180°, значит каждый равен 90°.');
   },
   right_angle_coefficient: ({a,b})=>{
    const factor=a%4+2,x=b,constant=90-factor*x;
    return ['Угол между прямыми равен ('+factor+'x + '+constant+')°. При каком x прямые перпендикулярны?',x,
     'Приравниваем '+factor+'x + '+constant+' к 90. После вычитания '+constant+' и деления на '+factor+' получаем x = '+x+'.'];
   },
   compare_two_perpendicular_rays: ({a,b})=>['Один внутренний луч делит прямой угол на части ('+a+'x)° и ('+b+'x)°. Найди x.',rational(90,a+b),
    'Сумма частей равна 90°. Получаем '+(a+b)+'x = 90 и делим на '+(a+b)+'.']
  },
  {
   perpendicular_after_two_turns: ({a,b,c})=>['Луч повернули на '+(20+a)+'°, затем на '+(25+b)+'° в ту же сторону. Сколько градусов ещё нужно повернуть в эту сторону, чтобы получить перпендикуляр к исходному направлению?',45-a-b,
    'Первые повороты в сумме дают '+(45+a+b)+'°. До прямого угла остаётся '+(45-a-b)+'°.' ],
   algebraic_perpendicular_condition: ({a,b,c})=>{
    const factor=a%4+2;
    return ['Внутри угла между прямыми проведён луч. Части равны ('+factor+'x + '+b+')° и ('+(90-(factor+1)*c-b)+' + x)°. При каком x прямые перпендикулярны?',c,
     'Сумма частей должна быть 90°. После приведения подобных '+(factor+1)+'x = '+(factor+1)*c+'.'];
   },
   perpendicular_third_line: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Прямые '+p+' и '+q+' перпендикулярны одной прямой '+r+' в разных точках. Что верно для '+p+' и '+q+'?',
     'Они параллельны',['Они совпадают','Они перпендикулярны','Они пересекаются под углом 45°'],
     'Обе прямые образуют с третьей углы 90°. При разных точках пересечения их направления совпадают, поэтому прямые параллельны.');
   },
   angle_between_two_internal_rays: ({a,b})=>['Внутри прямого угла первый луч отстоит от одной стороны на '+(15+a)+'°, второй от другой стороны на '+(20+b)+'°. Найди угол между лучами.',55-a-b,
    'От 90° вычитаем обе крайние части: 90 − '+(15+a)+' − '+(20+b)+' = '+(55-a-b)+'°.' ]
  }
 ],
 geo_field_right_angles: [
  {
   choose_field_right_angle: ({a,b})=>{
    const [p,q]=geometryLabels(a,b);
    return ['Эккер ставят в точке '+p+' и визируют вдоль дороги на '+q+'. Сколько градусов между дорогой и вторым перпендикулярным визиром?',90,
     'Эккер помогает отложить прямой угол, то есть 90°. Если первая линия идёт по дороге, вторая перпендикулярна ей.'];
   },
   clockwise_field_right_angle: ({a,b})=>['Дорога имеет отсчёт '+(20+a+b)+'°. Поверни по часовой стрелке на прямой угол. Какой будет отсчёт?',110+a+b,
    'Прибавляем 90° к исходной отметке.'],
   counterclockwise_field_right_angle: ({a,b})=>['Начальный отсчёт '+(120+a+b)+'°. Визир повернули на 90° в сторону уменьшения. Найди результат.',30+a+b,
    'Из начального отсчёта вычитаем прямой угол.'],
   find_missing_to_right_angle: ({a,b})=>['Между дорогой и визиром '+(30+a+b)+'°. На сколько градусов нужно увеличить угол до прямого?',60-a-b,
    'Вычитаем данный угол из 90°.']
  },
  {
   compare_field_bearings: ({a,b,c})=>{
    const start=30+a+b,truth=c%2===0,finish=start+90+Number(!truth);
    return checkStatement('Отсчёты '+start+'° и '+finish+'°. Перпендикулярны ли направления?',truth,
     'Разность отсчётов равна '+(finish-start)+'°. Для прямого угла нужна разность 90°.');
   },
   subtract_from_perpendicular: ({a,b})=>['От перпендикуляра к дороге отклонились к дороге на '+(20+a+b)+'°. Найди угол нового направления с дорогой.',70-a-b,
    'Исходный угол 90°. После отклонения к дороге он уменьшается на '+(20+a+b)+'°.'],
   rotation_on_opposite_side: ({a,b})=>['От дороги начали отсчёт. Первый луч отклонён вправо на '+(20+a)+'°, второй влево на '+(30+b)+'°. Сколько градусов не хватает до прямого угла между лучами?',40-a-b,
    'Лучам соответствуют отклонения по разным сторонам. Их угол '+(50+a+b)+'°. Вычитаем его из 90°.'],
   choose_perpendicular_from_scale: ({a,b})=>{
    const start=a+b,finish=start+90;
    return choice('Какой отсчёт перпендикулярен '+start+'°?',finish+'°',[start+'°',(start+45)+'°',(start+180)+'°'],
     'Из предложенных отсчётов только '+finish+'° отличается от исходного на 90°.');
   }
  },
  {
   right_turn_wraparound: ({a,b})=>{
    const tail=a+b;
    return ['Направление дороги '+(360-tail)+'°. Какой отсчёт даст перпендикуляр после поворота по часовой стрелке на 90°?',90-tail,
     'Проходим через 360°. До нуля '+tail+'°, после нуля остаётся 90 − '+tail+' = '+(90-tail)+'°.' ];
   },
   fix_deviation_after_right_turn: ({a,b,c})=>['Изначальный отсчёт '+(30+a)+'°. Для перпендикуляра повернули на 90°, затем ошибка сместила визир на '+b+'° вперёд и '+c+'° назад. На сколько градусов текущее направление отличается от перпендикуляра?',Math.abs(b-c),
    'После правильного поворота отклонения дают '+b+' − '+c+'°. Берём модуль отклонения.'],
   two_perpendicular_directions: ({a,b})=>{
    const base=90+a+b,min=base-90,max=base+90;
    return choice('Какие два отсчёта перпендикулярны направлению '+base+'° на круговой шкале?',min+'° и '+max+'°',
     [base+'° и '+max+'°',min+'° и '+(max+1)+'°',(min-1)+'° и '+max+'°'],'Один отсчёт на 90° меньше, второй на 90° больше.');
   },
   acute_between_road_and_new_line: ({a,b})=>['Линия сначала образует с дорогой угол '+(20+a+b)+'°. Её повернули на 90° дальше в ту же сторону. Найди меньший угол новой прямой с дорогой.',70-a-b,
    'Поворот от одного направления дороги даёт '+(110+a+b)+'°. Угол с противоположным направлением дороги равен 180° минус эта величина.']
  }
 ],
 geo_triangle_elements: [
  {
   choose_opposite_side: ({a,b})=>{
    const vertices=['A','B','C'],index=(a+b)%3,vertex=vertices[index],answer=g7TriSideNameOppositeVertex(vertex);
    return withVisual(choice('Какая сторона лежит напротив вершины '+vertex+'?',answer,['AB','BC','AC'].filter(side=>side!==answer),
     'У противоположной стороны среди концов нет вершины '+vertex+'.'),triangleVisual({kind:'g7-triangle'}));
   },
   choose_opposite_vertex: ({a,b})=>{
    const side=['AB','AC','BC'][(a+b)%3],answer=g7TriVertexOppositeSide(side);
    return choice('Какая вершина треугольника ABC лежит напротив стороны '+side+'?',answer,['A','B','C'].filter(vertex=>vertex!==answer),
     'Из трёх вершин выбираем ту, которая не входит в обозначение стороны '+side+'.');
   },
   name_angle_at_vertex: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Как обозначить угол треугольника '+p+q+r+' при вершине '+q+'?','∠'+p+q+r,['∠'+q+p+r,'∠'+p+r+q],
     'В обозначении угла при '+q+' эта буква должна стоять между двумя другими.');
   },
   perimeter_from_three_sides: ({a,b})=>['Стороны треугольника равны '+(a+b)+' см, '+(a+b+1)+' см и '+(a+b+2)+' см. Найди периметр (в см).',3*(a+b+1),
    'Периметр — сумма длин всех трёх сторон.']
  },
  {
   angle_included_by_two_sides: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Какой угол лежит между сторонами '+p+q+' и '+p+r+'?', '∠'+q+p+r,['∠'+p+q+r,'∠'+p+r+q],
     'Стороны сходятся в '+p+', поэтому этот угол имеет вершину '+p+'.');
   },
   third_side_from_perimeter: ({a,b})=>['Периметр треугольника '+3*(a+b+1)+' см. Две стороны равны '+(a+b)+' и '+(a+b+2)+' см. Найди третью сторону.',a+b+1,
    'Вычитаем из периметра обе известные стороны.'],
   opposite_angles_from_side_names: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Укажи углы, противоположные сторонам '+p+q+' и '+q+r+' соответственно.',r+' и '+p,[p+' и '+r,q+' и '+p,r+' и '+q],
     'Сторона '+p+q+' не содержит вершину '+r+', а сторона '+q+r+' не содержит '+p+'.');
   },
   sum_of_incident_sides: ({a,b,c})=>['В треугольнике ABC длины AB = '+(a+b)+' см, BC = '+(a+b+1)+' см, AC = '+(a+b+2)+' см. Найди сумму длин сторон, образующих ∠ACB.',2*(a+b)+3,
    'Вершина угла C. Стороны CA и CB имеют длины '+(a+b+2)+' и '+(a+b+1)+' см. Складываем.']
  },
  {
   shared_side_perimeters: ({a,b})=>['Два треугольника с периметрами '+(3*a+3*b)+' см и '+(3*a+3*b+2)+' см приложили по общей стороне длиной '+(a+b)+' см. Найди внешний периметр (в см).',4*(a+b)+2,
    'Складываем оба периметра и дважды вычитаем общую внутреннюю сторону.'],
   recover_side_from_pair_sums: ({a,b,c})=>{
    const x=a+b+c,y=x+1,z=x+2;
    return ['В треугольнике ABC известно AB + BC = '+(x+y)+' см, BC + CA = '+(y+z)+' см, AB + CA = '+(x+z)+' см. Найди BC (в см).',y,
     'Складываем первые два равенства и вычитаем третье. Остаётся 2BC = '+2*y+'.'];
   },
   perimeter_with_parameter: ({a,b,c})=>{
    const base=a+b+c;
    return ['Стороны треугольника равны x, x + '+a+' и x + '+b+' см. Периметр равен '+(3*base+a+b)+' см. Найди x.',base,
     'Сумма длин равна 3x + '+(a+b)+'. Вычитаем '+(a+b)+' и делим на 3.'];
   },
   find_side_opposite_shared_angle: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Треугольники '+p+q+r+' и '+p+q+s+' имеют общую сторону '+p+q+'. Против каких углов в этих треугольниках она лежит?',
     r+' и '+s,[p+' и '+q,p+' и '+s,r+' и '+q],'Против общей стороны расположены вершины, которые не являются её концами.');
   }
  }
 ],
 geo_congruence_sas: [
  {
   recognize_two_sides_and_angle: ({a,b})=>{
    const i=(a+b)%3,first=['A','B','C'][i],second=['D','E','F'][i];
    const sides=[['AB = DE','AC = DF'],['BA = ED','BC = EF'],['CA = FD','CB = FE']][i];
    const options=['∠A = ∠D','∠B = ∠E','∠C = ∠F'];
    return choice('Какое условие вместе с '+sides.join(' и ')+' даёт равенство по первому признаку?',options[i],options.filter((_,index)=>index!==i),
     'Данные стороны встречаются в '+first+' и '+second+'. Между ними находятся углы при этих вершинах.');
   },
   choose_included_angle: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Какой угол заключён между '+p+q+' и '+q+r+'?', '∠'+p+q+r,['∠'+q+p+r,'∠'+p+r+q],
     'Общий конец данных сторон — '+q+'. Он стоит в середине обозначения угла.');
   },
   determine_corresponding_vertex: ({a,b})=>choice('Если △ABC = △DEF, какая вершина соответствует '+['A','B','C'][(a+b)%3]+'?',
    ['D','E','F'][(a+b)%3],['D','E','F'].filter((_,i)=>i!==(a+b)%3),
    'Сопоставляем буквы по позициям: A ↔ D, B ↔ E, C ↔ F.'),
   refuse_two_sides_alone: ({a,b})=>checkStatement('Известно только, что две стороны одного треугольника равны '+a+' и '+b+' см, и две стороны второго — такие же. Этих данных достаточно для первого признака?',false,
    'Кроме двух сторон нужен угол именно между ними. Изменение этого угла меняет форму треугольника.')
  },
  {
   read_sas_marks: ({a,b})=>{
    const first=(a+b)%2===0,answer=first?'∠A':'∠D';
    return withVisual(choice('В каком угле '+(first?'первого':'второго')+' треугольника лежат обе отмеченные стороны?',answer,
     first?['∠B','∠C','Ни в одном']:['∠E','∠F','Ни в одном'],
     'Отмеченные стороны AB и AC сходятся в A. Стороны DE и DF сходятся в D.'),triangleVisual({kind:'g7-triangle-pair',criteria:'SAS'}));
   },
   recover_third_side_after_sas: ({a,b,c})=>['AB = DE = '+(a+b)+' см, AC = DF = '+(a+b+1)+' см, ∠A = ∠D. BC = '+(a+b+2)+' см. Найди EF.',a+b+2,
    'По первому признаку △ABC = △DEF. Стороны BC и EF соответствуют друг другу.'],
   sufficient_correspondence: ({a,b})=>{
    const truth=b%2===0,vertex=truth?'D':'E';
    return checkStatement('AB = DE, AC = DF и ∠A = ∠'+vertex+'. Следует ли равенство по первому признаку?',truth,
     'В первом треугольнике нужен угол A, во втором угол D, потому что именно в D сходятся DE и DF.');
   },
   find_matching_labels: ({a,b})=>{
    const [p,q,r]=['FDE','EFD','DFE'][(a+b)%3];
    return choice('AB = '+p+q+', AC = '+p+r+' и ∠A = ∠'+p+'. Как записать равенство для △ABC?',
     '△ABC = △'+p+q+r,['△ABC = △'+p+r+q,'△ABC = △'+q+p+r,'△ABC = △'+r+q+p],
     'A соответствует '+p+', B соответствует '+q+', C соответствует '+r+'.');
   }
  },
  {
   solve_equal_side_parameter: ({a,b,c})=>['AB = DE, ∠A = ∠D. AC = '+(a*c+b)+' см, DF = '+a+'x + '+b+' см. При каком x применяется первый признак?',c,
    'Для первого признака требуется AC = DF. Приравниваем, вычитаем '+b+' и делим на '+a+'.'],
   perimeter_after_congruence: ({a,b})=>['AB = DE = '+(a+b)+' см, AC = DF = '+(a+b+1)+' см, ∠A = ∠D. Периметр ABC равен '+3*(a+b+1)+' см. Найди EF (в см).',a+b+2,
    'По первому признаку периметры равны. Вычитаем из периметра DEF известные DE и DF.'],
   point_matching_in_swapped_order: ({a,b})=>{
    const [p,q,r]=['EFD','DFE','FED'][(a+b)%3],label=(u,v,w)=>'A ↔ '+u+', B ↔ '+v+', C ↔ '+w;
    return choice('AB = '+p+q+', BC = '+q+r+', ∠ABC = ∠'+p+q+r+'. Какое соответствие верно?',
     label(p,q,r),[label(q,p,r),label(r,q,p),label(p,r,q)],
     'Общие вершины данных сторон B и '+q+' соответствуют. Затем сопоставляем A с '+p+', C с '+r+'.');
   },
   apply_sas_with_shared_side: ({a,b})=>['Треугольники ABC и ADC имеют общую сторону AC. AB = AD, ∠BAC = ∠CAD. Если BC = '+(a+b)+' см, чему равно DC?',
    a+b,'Стороны AB и AD равны, AC общая, углы между этими сторонами равны. По первому признаку BC = DC.']
  }
 ],
 geo_perpendicular_oblique_distances: [
  {
   identify_distance_on_diagram: ({a,b})=>{
    const distance=(a+b)%2===0;
    return withVisual(choice(distance?'Какой отрезок показывает расстояние от A до прямой a?':'Какой отрезок на чертеже является наклонной из A к прямой a?',
     distance?'AH':'AB',[distance?'AB':'AH','HB','Прямая a'],
     'Прямой угол у H показывает, что AH — перпендикуляр. Отрезок AB подходит к прямой под острым углом и является наклонной.'),
     triangleVisual({kind:'g7-distance',subtype:'pointLine'}));
   },
   find_distance_given_lengths: ({a,b})=>['Из A опущен перпендикуляр AH длиной '+a+' см. Наклонная AB равна '+(a+b)+' см. Чему равно расстояние от A до прямой HB?',a,
    'Нужна длина перпендикуляра AH, поэтому ответ '+a+' см.'],
   label_foot: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Из '+p+' опустили перпендикуляр '+p+q+' на прямую '+q+r+'. Как обозначено основание перпендикуляра?',q,[p,r,s],
     'Основание лежит на прямой и одновременно является концом перпендикуляра.');
   },
   distance_for_point_on_line: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return ['Точка '+p+' лежит на прямой '+q+r+'. Чему равно расстояние от точки до этой прямой?',0,
     'Уже лежащая на прямой точка находится от неё на расстоянии 0.'];
   }
  },
  {
   perpendicular_relation: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice(p+q+' ⟂ '+q+r+'. Какая градусная мера у ∠'+p+q+r+'?', '90°',['45°','60°','180°'],
     'Перпендикулярные направления образуют прямой угол.');
   },
   infer_difference_with_oblique: ({a,b})=>['Расстояние от A до прямой '+a+' см. Наклонная из A на эту прямую в '+b+' раз длиннее перпендикуляра. На сколько сантиметров наклонная длиннее?',a*(b-1),
    'Перпендикуляр равен '+a+' см, наклонная '+a*b+' см. Вычитаем.'],
   compare_two_distances: ({a,b,c})=>compare('Расстояния от A и C до одной прямой равны '+(a+b)+' см и '+(a+c)+' см. Сравни длины перпендикуляров из этих точек.',
    rational(a+b),rational(a+c),'Расстояния уже являются длинами соответствующих перпендикуляров.',' см'),
   different_feet_on_same_line: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return ['Точка '+p+' лежит вне прямой '+q+r+'. Сколько различных точек этой прямой могут быть основаниями перпендикуляра из '+p+'?',1,
     'Через '+p+' проходит единственная прямая, перпендикулярная данной прямой.'];
   }
  },
  {
   recover_two_parallel_line_gap: ({a,b})=>['Между параллельными прямыми лежит точка P. Путь от одной прямой до другой по перпендикуляру через P равен '+(a+b)+' см. От P до первой '+a+' см. Найди расстояние от P до второй.',b,
    'Две части одного перпендикуляра складываются. Вычитаем '+a+' из '+(a+b)+'.'],
   compare_points_on_perpendicular: ({a,b})=>['На перпендикуляре к прямой p точки H, P, Q идут в таком порядке. H лежит на p, HP = '+a+' см, PQ = '+b+' см. На сколько расстояние от Q до p больше расстояния от P до p?',b,
    'Расстояния измеряются тем же перпендикуляром. HQ − HP = PQ = '+b+' см.'],
   perpendicular_foot_from_shared_line: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Из '+p+' на прямую '+q+r+' опущен перпендикуляр '+p+q+'. Точка '+s+' лежит на той же прямой и отличается от '+q+'. Может ли '+p+s+' быть ещё одним перпендикуляром?',
     'Нет',['Да'],'Перпендикуляр через точку '+p+' единственный, поэтому его основание не может быть другим.');
   },
   distance_from_equation: ({a,b,c})=>{
    const right=a*c+b,oblique=right+c;
    return ['Длина перпендикуляра из A к прямой равна '+a+'x + '+b+' см, наклонная равна '+oblique+' см. Наклонная длиннее перпендикуляра на '+c+' см. Найди x.',c,
     'Длина перпендикуляра '+oblique+' − '+c+' = '+right+'. Приравниваем '+a+'x + '+b+' к '+right+' и решаем.'];
   }
  }
 ],
 geo_triangle_medians_bisectors_altitudes: [
  {
   median_definition: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('В △'+p+q+r+' точка '+s+' — середина '+q+r+'. Как называется '+p+s+'?',
     'Медиана',['Биссектриса','Высота','Сторона'],'Медиана соединяет вершину с серединой противоположной стороны.');
   },
   bisector_half_inside_triangle: ({a,b})=>['AD — биссектриса угла A. ∠A = '+2*(20+a+b)+'°. Найди ∠BAD.',20+a+b,
    'Биссектриса делит угол при A пополам.'],
   height_from_perpendicularity: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice(p+s+' ⟂ '+q+r+', причём '+s+' лежит на стороне '+q+r+' треугольника '+p+q+r+'. Как называется '+p+s+'?',
     'Высота',['Медиана','Биссектриса','Сторона'],'Высота проводится из вершины перпендикулярно прямой, содержащей противоположную сторону.');
   },
   half_side_from_median: ({a,b})=>['AM — медиана △ABC. BC = '+2*(a+b)+' см. Найди BM.',a+b,
    'Точка M делит BC на две равные части.']
  },
  {
   read_cevian_from_marks: ({a,b})=>{
    const kind=b%2===0?'median':'height',correct=kind==='median'?'Медиана':'Высота';
    return withVisual(choice('Как называется отрезок от A до отмеченной точки на BC, судя по обозначениям?',
     correct,[kind==='median'?'Высота':'Медиана','Биссектриса','Сторона'],
     kind==='median'?'Равные штрихи отмечают середину стороны.':'Квадрат у основания показывает прямой угол.'),triangleVisual(g7TriCevianData(kind)));
   },
   find_missing_side_from_half: ({a,b})=>['BN — медиана △ABC. AN = '+(a+b)+' см. Найди AC.',2*(a+b),
    'N — середина AC, поэтому AC = 2AN.'],
   height_outside_explain: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return checkStatement('В тупоугольном △'+p+q+r+' основание '+s+' высоты из '+p+' лежит на продолжении стороны '+q+r+'. Возможно ли это?',true,
     'Высота перпендикулярна прямой, содержащей сторону. Её основание может лежать на продолжении.');
   },
   recover_full_angle_from_bisector: ({a,b})=>['BE — биссектриса угла B треугольника ABC. ∠EBC = '+(18+a+b)+'°. Найди ∠ABC.',2*(18+a+b),
    'У обеих частей одинаковая мера. Удваиваем '+(18+a+b)+'°.' ]
  },
  {
   median_partition_algebra: ({a,b,c})=>{
    const left=a*c+b;
    return ['AM — медиана. BM = '+a+'x + '+b+' см, MC = '+left+' см. Найди x.',c,
     'Приравниваем части стороны BC. После вычитания '+b+' получаем '+a+'x = '+a*c+'.'];
   },
   bisector_partition_algebra: ({a,b,c})=>{
    const coefficient=2+a%4,measure=coefficient*c+b;
    return ['Луч AD — биссектриса при A. ∠BAD = ('+coefficient+'x + '+b+')°, ∠DAC = '+measure+'°. Найди x.',c,
     'Обе части угла равны. Вычитаем '+b+', делим на '+coefficient+' и получаем x = '+c+'.'];
   },
   verify_height_from_angle_difference: ({a,b})=>['Сторона BC лежит на прямой BH. ∠AHB состоит из углов '+(30+a)+'° и '+(20+b)+'°. Сколько градусов не хватает ∠AHB до прямого?',40-a-b,
    'Складываем данные углы, затем вычитаем сумму из 90°.' ],
   side_from_median_and_perimeter: ({a,b,c})=>{
    const half=a+b,median=c+half,side=half+c+1;
    return ['AM — медиана △ABC. BC = '+2*half+' см. Периметр △ABM равен '+(half+median+side)+' см, AM = '+median+' см. Найди AB (в см).',side,
     'BM = BC : 2 = '+half+' см. Из периметра △ABM вычитаем AM и BM.'];
   }
  }
 ],
 geo_isosceles_properties_criteria: [
  {
   infer_base_angles: ({a,b})=>['AB = AC, ∠B = '+(35+a+b)+'°. Найди ∠C.',35+a+b,'Углы при основании BC равны.'],
   infer_equal_sides: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('В треугольнике '+p+q+r+' углы при '+q+' и '+r+' равны. Какие стороны обязательно равны?',p+q+' и '+p+r,
     [p+q+' и '+q+r,p+r+' и '+q+r,'Никакие'],'Равным углам противолежат равные стороны.');
   },
   identify_base_after_marks: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('У двух боковых сторон '+p+q+' и '+p+r+' один конец '+p+'. Какое основание у этого равнобедренного треугольника?',q+r,
     [p+q,p+r,'Все три стороны'],'Основание лежит напротив вершины между боковыми сторонами.');
   },
   vertex_bisector_implies_median: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return checkStatement('В △'+p+q+r+' стороны '+p+q+' и '+p+r+' равны. '+p+s+' — биссектриса из '+p+'. Делит ли она основание пополам?',true,
     'Биссектриса из вершины между равными боковыми сторонами одновременно является медианой.');
   }
  },
  {
   base_from_legs_and_perimeter: ({a,b})=>['Боковые стороны равнобедренного треугольника равны '+(a+b)+' см, периметр '+(3*a+2*b)+' см. Найди основание.',a,
    'Из периметра вычитаем две боковые стороны.'],
   recover_vertex_angle: ({a,b})=>['Угол при основании равнобедренного треугольника '+(30+a+b)+'°. Найди угол при вершине между боковыми сторонами.',120-2*a-2*b,
    'Два угла основания равны. Из 180° вычитаем удвоенный угол при основании.'],
   height_to_base_gives_half: ({a,b})=>['В равнобедренном △ABC стороны AB и AC равны, AH — высота. BC = '+2*(a+b)+' см. Найди BH.',a+b,
    'Высота к основанию одновременно является медианой. Поэтому BH равен половине BC.'],
   equal_base_angles_given_relation: ({a,b,c})=>['В равнобедренном треугольнике углы при основании равны ('+(a%4+2)+'x + '+b+')° и ('+(a%4+1)+'x + '+(b+c)+')°. Найди x.',c,
    'Приравниваем меры. Вычитаем общие слагаемые, получаем x = '+c+'.']
  },
  {
   use_base_and_half_triangle_perimeter: ({a,b,c})=>{
    const scale=a%5+b%4+1,half=3*scale,leg=5*scale,height=4*scale,small=leg+half+height;
    return ['AB = AC. AM — медиана к основанию BC, BC = '+2*half+' см. Периметр △ABM равен '+small+' см, AM = '+height+' см. Найди периметр △ABC.',2*leg+2*half,
     'BM = '+half+' см. Вычитаем BM и AM из периметра △ABM и получаем AB = '+leg+' см. Тогда периметр △ABC равен 2AB + BC.'];
   },
   compare_base_angles_after_substitution: ({a,b})=>['Угол при вершине между боковыми сторонами равен '+2*(10+a+b)+'°. Биссектриса этого угла делит его пополам. На сколько градусов один угол при основании больше половины угла при вершине?',70-2*a-2*b,
    'Половина угла при вершине '+(10+a+b)+'°. Угол при основании 90° минус эта половина. Вычисляем разность.'],
   base_angle_and_exterior_angle: ({a,b})=>['Внешний угол при основании равнобедренного треугольника '+(120+a+b)+'°. Найди угол при вершине между боковыми сторонами.',60+2*a+2*b,
    'Внутренний угол у основания '+(60-a-b)+'°. Таких углов два. Вычитаем их сумму из 180°.'],
   find_total_using_congruent_halves: ({a,b})=>['AB = AC. Биссектриса AD проведена к BC. BD = '+a+' см, боковая сторона равна '+(a+b)+' см. Найди периметр △ABC.',4*a+2*b,
    'AD — также медиана, поэтому BC = '+2*a+' см. Складываем основание и две боковые стороны.']
  }
 ],
 geo_isosceles_equilateral: [
  {
   read_equal_sides: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('У равнобедренного △'+p+q+r+' основание '+q+r+'. Какие стороны боковые?',p+q+' и '+p+r,
     [p+q+' и '+q+r,p+r+' и '+q+r,'У него нет боковых сторон'],'У боковых сторон общий конец в вершине напротив основания.');
   },
   equilateral_perimeter_basic: ({a,b})=>['У равностороннего треугольника сторона '+(a+b)+' см. Найди периметр.',3*(a+b),'Все три стороны равны. Умножаем длину на 3.'],
   equilateral_side_basic: ({a,b})=>['Периметр равностороннего треугольника '+3*(a+b)+' см. Найди сторону.',a+b,'Делим периметр на 3.'],
   recognize_equilateral_from_lengths: ({a,b})=>checkStatement('Стороны треугольника '+(a+b)+', '+(a+b)+' и '+(a+b+Number(b%2===0))+' см. Равносторонний ли он?',b%2!==0,
    'Для равностороннего треугольника должны совпасть все три длины.')
  },
  {
   isosceles_perimeter_basic: ({a,b})=>['У равнобедренного треугольника боковая сторона '+(a+b)+' см, основание '+a+' см. Найди периметр.',3*a+2*b,'Складываем две одинаковые боковые стороны и основание.'],
   recover_leg_from_base: ({a,b})=>['Периметр равнобедренного треугольника '+(3*a+2*b)+' см, основание '+a+' см. Найди боковую сторону.',a+b,'Из периметра вычитаем основание, затем делим на 2.'],
   all_angles_equal: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return ['△'+p+q+r+' равносторонний. Найди угол при вершине '+p+'.',60,
     'Три равных угла в сумме дают 180°. Каждый равен 60°.' ];
   },
   determine_valid_base_from_sides: ({a,b})=>choice('Длины сторон '+(a+b)+', '+a+' и '+(a+b)+' см. Какая из них является основанием?',a+' см',
    [(a+b)+' см',(a+b+1)+' см','Определить нельзя'],'Две равные стороны по '+(a+b)+' см являются боковыми. Основание имеет длину '+a+' см.')
  },
  {
   equilateral_and_isosceles_same_perimeter: ({a,b})=>['Периметры равностороннего и равнобедренного треугольников равны. У первого сторона '+(2*a+b)+' см, у второго основание '+(2*a+b+2)+' см. Найди боковую сторону второго.',2*a+b-1,
    'Вычитаем из '+3*(2*a+b)+' см основание '+(2*a+b+2)+' см, затем делим на 2.'],
   express_leg_from_difference: ({a,b})=>['Боковая сторона на '+b+' см больше основания. Периметр '+(3*a+2*b)+' см. Найди основание.',a,
    'Если основание x, периметр равен 3x + '+2*b+'. Приравниваем к '+(3*a+2*b)+'.'],
   compare_two_perimeters: ({a,b})=>compare('Сравни периметры равностороннего треугольника со стороной '+(a+b)+' см и равнобедренного с боковой стороной '+(a+b)+' см и основанием '+a+' см.',
    rational(3*(a+b)),rational(3*a+2*b),'У треугольников две стороны попарно совпадают. Сравниваем третьи стороны.',' см'),
   equal_sides_from_polynomial_lengths: ({a,b,c})=>['Боковые стороны равнобедренного треугольника имеют длины '+a+'x + '+b+' и '+(a-1)+'x + '+(b+c)+' см. Найди сумму длин боковых сторон.',2*(a*c+b),
    'Приравняв длины, получаем x = '+c+'. Каждая боковая сторона равна '+(a*c+b)+' см.']
  }
 ],
 geo_congruence_asa: [
  {
   side_between_two_angles: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Какая сторона △'+p+q+r+' прилежит к обоим углам при '+p+' и '+q+'?',p+q,[p+r,q+r,'Все стороны'],
     'Оба конца нужной стороны — вершины указанных углов.');
   },
   choose_last_angle: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Стороны '+p+q+' и '+r+s+' равны, углы при '+p+' и '+r+' равны. Какого равенства углов не хватает для второго признака?',
     '∠'+q+' = ∠'+s,['∠'+p+' = ∠'+s,'∠'+q+' = ∠'+r,'∠'+p+' = ∠'+q],
     'После первого угла сравниваем углы при вторых концах известных сторон.');
   },
   insufficient_two_angles: ({a,b})=>checkStatement('У двух треугольников попарно равны углы '+(30+a)+'° и '+(40+b)+'°. Достаточно ли этих данных для равенства треугольников?',false,
    'Равные углы без сведений о длине стороны допускают треугольники разных размеров.'),
   identify_second_criterion: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Равны стороны '+p+q+' и '+r+s+', а также два угла при концах каждой. Какой признак применим?',
     'Второй',['Первый','Третий','Ни один'],'Это равенство по стороне и двум прилежащим углам.');
   }
  },
  {
   read_asa_marking: ({a,b})=>{
    const first=(a+b)%2===0,correct=first?'AB':'DE';
    return withVisual(choice('Какая сторона '+(first?'первого':'второго')+' треугольника соединяет вершины отмеченных углов?',correct,
     first?['AC','BC','DE']:['DF','EF','AB'],'Смотрим на концы стороны между двумя дугами.'),triangleVisual({kind:'g7-triangle-pair',criteria:'ASA'}));
   },
   side_length_after_asa: ({a,b})=>['AB = DE, ∠A = ∠D, ∠B = ∠E. Сторона BC равна '+(a+b)+' см. Найди EF.',a+b,
    'Треугольники равны по второму признаку. BC и EF — соответствующие стороны.'],
   vertices_in_changed_order: ({a,b})=>{
    const [p,q,r]=['EFD','FDE','DFE'][(a+b)%3];
    return choice('AB = '+p+q+', ∠A = ∠'+p+', ∠B = ∠'+q+'. Как записать равенство с △ABC?',
     '△ABC = △'+p+q+r,['△ABC = △'+q+p+r,'△ABC = △'+p+r+q,'△ABC = △'+r+p+q],
     'Сначала сопоставляем вершины прилежащих углов, затем оставшуюся пару вершин.');
   },
   recover_third_angle: ({a,b})=>['△ABC = △DEF по второму признаку, ∠A = '+(40+a)+'°, ∠B = '+(40+b)+'°. Найди ∠F.',100-a-b,
    '∠F соответствует ∠C. Из 180° вычитаем оба известных угла.']
  },
  {
   shared_segment_and_asa: ({a,b})=>['△ABC и △DCB имеют общую сторону BC. ∠ABC = ∠DCB, ∠ACB = ∠DBC. AB = '+(a+b)+' см. Найди DC.',a+b,
    'По общей стороне и двум прилежащим углам △ABC = △DCB. Стороны AB и DC равны.'],
   parameter_match_asa: ({a,b,c})=>{
    const factor=a%4+2,angle=factor*c+b;
    return ['AB = DE, ∠A = ∠D. ∠B = ('+factor+'x + '+b+')°, ∠E = '+angle+'°. Найди x для применения второго признака.',c,
     'Приравниваем углы при вторых концах равных сторон. Получаем '+factor+'x = '+factor*c+', поэтому x = '+c+'.'];
   },
   perimeter_using_angle_match: ({a,b})=>['AB = DE = '+(a+b)+' см, ∠A = ∠D, ∠B = ∠E. AC = '+(a+b+1)+' см, EF = '+(a+b+2)+' см. Найди периметр DEF.',3*(a+b+1),
    'По второму признаку DF = AC. Складываем DE, DF и EF.'],
   deduce_correspondence_from_asa: ({a,b})=>{
    const [p,q,r]=['DFE','EFD','FDE'][(a+b)%3];
    return choice('AB = '+p+q+', ∠A = ∠'+p+', ∠B = ∠'+q+'. Какой стороне второго треугольника равна AC?',
     p+r,[p+q,q+r,'Ни одной'],'A соответствует '+p+', C — оставшейся вершине '+r+'.');
   }
  }
 ],
 geo_congruence_sss: [
  {
   select_third_pair: ({a,b})=>{
    const [p,q,r]=['DEF','DFE','EFD'][(a+b)%3];
    return choice('AB = '+p+q+', BC = '+q+r+'. Какое равенство даст третий признак?',
     'AC = '+p+r,['AC = '+p+q,'AC = '+q+r,'AB = '+p+r],
     'Для третьего признака нужно сравнить оставшиеся стороны AC и '+p+r+'.');
   },
   choose_matching_side_triple: ({a,b})=>{
    const n=a+b;
    return choice('Стороны первого треугольника '+n+', '+(n+1)+' и '+(n+2)+' см. Какой набор сторон даёт равный треугольник?',
     (n+2)+', '+n+', '+(n+1),[n+', '+(n+1)+', '+(n+3),n+', '+n+', '+(n+2),(n+1)+', '+(n+2)+', '+(n+3)],
     'Подходит тот же набор длин. Порядок перечисления сторон можно менять.');
   },
   count_sides_needed: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return ['Из двух треугольников известно '+p+q+' = '+r+s+'. Сколько ещё пар равных сторон надо установить для третьего признака?',2,
     'Всего нужно три пары, одна уже дана.'];
   },
   reject_same_perimeter_only: ({a,b})=>checkStatement('Периметры двух треугольников равны '+3*(a+b)+' см. Обязаны ли треугольники быть равными по третьему признаку?',false,
    'Одинаковая сумма длин не гарантирует равенства каждой стороны.')
  },
  {
   read_sss_corresponding_edge: ({a,b})=>{
    const side=['AB','BC','AC'][(a+b)%3],target={AB:'DE',BC:'EF',AC:'DF'}[side];
    return withVisual(choice('Какая сторона второго треугольника отмечена так же, как '+side+'?',target,['DE','EF','DF'].filter(s=>s!==target),
     'Соответствующие стороны отмечены одинаковым числом штрихов.'),triangleVisual({kind:'g7-triangle-pair',criteria:'SSS'}));
   },
   recover_equal_angle_by_sss: ({a,b})=>['AB = DE, BC = EF, AC = DF. Если ∠C = '+(45+a+b)+'°, чему равен ∠F?',45+a+b,
    'По третьему признаку треугольники равны, вершине C соответствует F.'],
   verify_triangle_side_data: ({a,b})=>{
    const side=a+b,truth=b%2===0,end=side+2+Number(!truth);
    return checkStatement('У одного треугольника стороны '+side+', '+(side+1)+', '+(side+2)+' см, у другого '+(side+1)+', '+end+', '+side+' см. Равны ли треугольники по третьему признаку?',truth,
     'Упорядочиваем длины и сравниваем попарно. Третья пара: '+(side+2)+' см и '+end+' см.');
   },
   unknown_side_for_sss: ({a,b})=>['Стороны двух равных треугольников заданы как '+(a+b)+', '+(a+b+1)+', '+(a+b+2)+' см и '+(a+b+2)+', '+(a+b)+' см и x. Найди x.',a+b+1,
    'Сопоставляем известные длины и находим единственную оставшуюся.']
  },
  {
   map_vertices_in_scrambled_sss: ({a,b})=>{
    const [p,q,r]=['EFD','DFE','FED'][(a+b)%3];
    return choice('AB = '+p+q+', AC = '+p+r+', BC = '+q+r+'. Как подписать второй треугольник в записи △ABC = …?',
     '△'+p+q+r,['△'+q+p+r,'△'+r+p+q,'△'+p+r+q],
     'Пересечение сторон, соответствующих AB и AC, даёт вершину '+p+'. Аналогично находим оставшиеся.');
   },
   sss_with_shared_side: ({a,b})=>['△ABC и △ADC имеют общую сторону AC. AB = AD, BC = DC. Если ∠ABC = '+(40+a+b)+'°, чему равен ∠ADC?',40+a+b,
    'Три пары сторон равны, поэтому △ABC = △ADC. Вершине B соответствует D.'],
   parameter_under_sss: ({a,b,c})=>['AB = DE, AC = DF. BC = '+(a*c+b)+' см, EF = '+a+'x + '+b+' см. Найди x для применения третьего признака.',c,
    'Требуем BC = EF. Вычитаем '+b+' и делим на '+a+'.'],
   recover_perimeter_from_matching_lengths: ({a,b,c})=>{
    const base=a+b+c;
    return ['У первого треугольника длины '+base+', '+(base+1)+', '+(base+2)+' см. У второго те же длины в другом порядке. На сколько сантиметров его периметр больше наибольшей стороны?',2*base+1,
     'После вычитания наибольшей стороны остаётся сумма двух меньших: '+base+' + '+(base+1)+'.'];
   }
  }
 ],
 geo_circle_chord_diameter: [
  {
   twice_the_radius: ({a,b})=>['Радиус окружности '+(a+b)+' см. Найди диаметр.',2*(a+b),'Диаметр состоит из двух радиусов.'],
   half_of_diameter: ({a,b})=>['Диаметр окружности '+2*(a+b)+' см. Найди радиус.',a+b,'Радиус составляет половину диаметра.'],
   distinguish_radius_and_chord: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Точка '+p+' — центр окружности. Точки '+q+' и '+r+' лежат на окружности. Как называется отрезок '+q+r+'?',
     'Хорда',['Радиус','Луч','Касательная'],'У хорды оба конца лежат на окружности.');
   },
   diameter_from_center_collinearity: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return checkStatement(p+' — центр окружности. Он лежит между точками '+q+' и '+r+' окружности. Является ли '+q+r+' диаметром?',true,
     'Это хорда, проходящая через центр, то есть диаметр.');
   }
  },
  {
   read_diameter_on_drawing: ({a,b})=>{
    const dia=(a+b)%2===0;
    return withVisual(choice(dia?'Какой из показанных отрезков является диаметром?':'Какой из указанных отрезков является радиусом?',
     dia?'CD':'OA',dia?['OA','EF','OD']:['CD','EF','CE'],
     dia?'Концы C и D лежат на окружности, и отрезок проходит через центр O.':'Отрезок OA соединяет центр и точку окружности.'),
     triangleVisual({kind:'g7-circle-basic'}));
   },
   classify_point_distance: ({a,b})=>{
    const outside=b%2===0,r=2*a+b;
    return choice('Радиус окружности '+r+' см. Точка P удалена от центра на '+(outside?r+1:r-1)+' см. Где находится P?',
     outside?'Вне окружности':'Внутри окружности',[outside?'Внутри окружности':'Вне окружности','На окружности','В центре'],
     'Сравниваем расстояние OP с радиусом. На окружности лежат только точки на расстоянии, равном радиусу.');
   },
   combine_radii_on_diameter: ({a,b})=>['Точка O — центр, точки C и D — концы диаметра. CO = '+(a+b)+' см. Найди CD − OD (в см).',a+b,
    'CD = CO + OD. После вычитания OD остаётся CO, то есть '+(a+b)+' см.'],
   compare_different_circles: ({a,b})=>compare('Сравни диаметр окружности радиуса '+a+' см с диаметром окружности радиуса '+b+' см.',
    rational(2*a),rational(2*b),'Удваиваем оба радиуса.',' см')
  },
  {
   radius_from_diameter_equation: ({a,b,c})=>['Радиус окружности '+a+'x + '+b+' см, диаметр '+2*(a*c+b)+' см. Найди x.',c,
    'Половина диаметра '+(a*c+b)+' см. Приравниваем радиус к этому числу и решаем.'],
   radius_difference_between_circles: ({a,b})=>['У первой окружности диаметр '+2*(a+b)+' см, у второй радиус '+a+' см. На сколько сантиметров диаметр первой больше диаметра второй?',2*b,
    'Диаметр второй '+2*a+' см. Вычитаем '+2*a+' из '+2*(a+b)+'.'],
   distance_along_diameter_from_interior_point: ({a,b})=>['AB — диаметр, O — центр. AB = '+2*(a+b)+' см. P лежит между O и A, OP = '+a+' см. Найди PB.',2*a+b,
    'OB равен '+(a+b)+' см. O лежит между P и B, поэтому PB = OP + OB.'],
   compare_sum_of_radii_against_diameter: ({a,b,c})=>compare('Сравни сумму радиусов '+a+' см и '+b+' см с диаметром окружности радиуса '+c+' см.',
    rational(a+b),rational(2*c),'Складываем радиусы первых двух окружностей. Для третьей диаметр равен удвоенному радиусу.',' см')
  }
 ],
 geo_basic_constructions: [
  {
   instrument_for_line: ({a,b})=>{
    const [p,q]=geometryLabels(a,b);
    return choice('Чем провести прямую через '+p+' и '+q+'?', 'Линейкой',['Циркулем','Транспортиром','Нужны только отметки'],
     'Прикладываем край линейки к двум заданным точкам.');
   },
   instrument_for_circle: ({a,b})=>{
    const [p,q]=geometryLabels(a,b);
    return choice('Чем провести окружность с центром '+p+' через '+q+'?', 'Циркулем',['Линейкой','Угольником','Транспортиром'],
     'Ножку ставят в центр, вторую раскрывают до точки окружности.');
   },
   choose_compass_opening: ({a,b})=>['Окружность должна иметь диаметр '+2*(a+b)+' см. Какой раствор циркуля нужен (в см)?',a+b,
    'Раствор равен радиусу, то есть половине диаметра.'],
   identify_two_endpoints: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Нужно перенести длину '+p+q+'. Между какими точками устанавливают ножки циркуля?',p+' и '+q,
     [p+' и '+r,q+' и '+s,r+' и '+s],'Расстояние между ножками равно длине отрезка между ними.');
   }
  },
  {
   arc_intersection_property: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return checkStatement('Из '+p+' и '+q+' провели дуги одним раствором. Они пересеклись в '+r+'. Равны ли '+p+r+' и '+q+r+'?',true,
     'Оба отрезка являются радиусами дуг, построенных с одним раствором.');
   },
   right_opening_for_intersections: ({a,b})=>{
    const half=a+b;
    return choice('Центры двух окружностей удалены на '+2*half+' см. При каком одинаковом радиусе они имеют две общие точки?',(half+1)+' см',
     [half+' см',(half-1)+' см','0 см'],'Для двух пересечений сумма радиусов строго больше расстояния между центрами.');
   },
   choose_correct_circle_center: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('На луче '+p+q+' откладывают от его начала длину '+r+s+'. Где поставить ножку циркуля для засечки на луче?',p,[q,r,s],
     'Один конец построенного отрезка должен совпасть с началом луча '+p+'.');
   },
   count_intersections_touch: ({a,b})=>['Две окружности радиуса '+(a+b)+' см имеют центры на расстоянии '+2*(a+b)+' см. Сколько у них общих точек?',1,
    'Расстояние равно сумме радиусов, окружности касаются в одной точке между центрами.']
  },
  {
   radii_for_triangle_construction: ({a,b})=>{
    const n=a+b;
    return choice('Основание AB = '+(n+2)+' см. Нужны AC = '+n+' см и BC = '+(n+1)+' см. Как задать две окружности для поиска C?',
     'Центр A, радиус '+n+'; центр B, радиус '+(n+1),
     ['Центр A, радиус '+(n+1)+'; центр B, радиус '+n,'Оба радиуса '+(n+2),'Оба центра в точке A'],
     'Искомая C удалена от A и B на заданные длины соответственно.');
   },
   two_possible_vertices: ({a,b})=>['Основание AB = '+(a+b)+' см, обе боковые стороны равны '+(a+b+1)+' см. Сколько возможных положений третьей вершины по обе стороны AB?',2,
    'Две окружности с центрами A и B пересекаются в двух точках по разные стороны AB.'],
   identify_degenerate_construction: ({a,b})=>checkStatement('Можно ли построить невырожденный треугольник со сторонами '+a+', '+b+' и '+(a+b)+' см?',false,
    'Сумма двух меньших сторон равна большей. Дуги касаются на прямой основания, третья вершина лежит на ней.'),
   transfer_length_many_times: ({a,b})=>['Одним раствором циркуля подряд отложили '+a+' равных отрезков общей длиной '+a*b+' см. Какой был раствор (в см)?',b,
    'Каждая засечка добавляет одно и то же расстояние. Делим общую длину на число шагов.']
  }
 ],
 geo_constructions_lines_angles: [
  {
   transfer_segment_on_ray: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Как отложить длину '+r+s+' от начала луча '+p+q+'?', 'Взять раствор '+r+s+' и отметить луч дугой из '+p,
     ['Измерить '+p+q+' и провести дугу из '+r,'Провести дугу из '+q,'Взять вдвое больший раствор'],
     'Новый отрезок начинается в '+p+' и должен иметь такую же длину, как '+r+s+'.');
   },
   midpoint_with_congruent_arcs: ()=>withVisual(choice('Дуги из A и B пересекаются в P и Q. Какую прямую провести, чтобы разделить AB пополам?',
    'Прямую PQ',['Прямую AP','Прямую BQ'],'Точки P и Q равноудалены от A и B. Их прямая пересекает AB в середине.'),
    triangleVisual({kind:'g7-construction',subtype:'midpoint'})),
   choose_ninety_degrees_method: ({a,b})=>['На прямой выбрали две точки на одинаковом расстоянии '+(a+b)+' см от H. Через H провели серединный перпендикуляр. Какой угол он образует с прямой?',90,
    'Серединный перпендикуляр перпендикулярен исходному отрезку.'],
   copy_right_angle: ({a,b})=>['При переносе циркулем угол имел меру '+(40+a+b)+'°. Какую меру имеет построенный равный угол?',40+a+b,
    'Перенос угла сохраняет его градусную меру.']
  },
  {
   compass_chord_of_copied_angle: ({a,b})=>{
    const [o,p,q]=geometryLabels(a,b);
    return choice('Дуга из вершины '+o+' пересекла стороны угла в '+p+' и '+q+'. Какую длину переносить после построения такой же дуги в новом угле?',p+q,
     [o+p,o+q,p+p],'Нужна хорда между отметками. Она вместе с двумя равными радиусами определяет угол.');
   },
   construct_bisector_logic: ({a,b})=>{
    const [o,p,q,r]=geometryLabels(a,b);
    return choice('На сторонах угла с вершиной '+o+' отметили '+p+' и '+q+' на равном расстоянии от вершины. Дуги одного раствора из '+p+' и '+q+' пересеклись внутри угла в '+r+'. Какой луч провести?',
     o+r,[o+p,o+q,r+o],'Треугольники по обе стороны '+o+r+' равны по трём сторонам. Поэтому луч делит угол пополам.');
   },
   reproduce_midpoint_then_length: ({a,b})=>['Построили серединный перпендикуляр к отрезку '+2*(a+b)+' см. Какова длина каждой половины?',a+b,
    'Прямая проходит через середину отрезка, поэтому половины равны.'],
   angle_from_double_bisection: ({a,b})=>['Угол '+4*(14+a+b)+'° дважды делят пополам: сначала весь угол, потом одну половину. Найди меньшую часть.',14+a+b,
    'После двух делений получаем четверть исходного угла.']
  },
  {
   why_compass_copy_works: ({a,b})=>{
    const [o,p,q]=geometryLabels(a,b);
    return choice('При копировании ∠'+p+o+q+' в исходном и новом углах взяли одинаковые радиусы и одну и ту же хорду. Какой признак доказывает равенство вспомогательных треугольников?',
     'По трём сторонам',['По двум углам','По одной стороне','По равенству периметров'],'Попарно совпадают две стороны-радиусы и третья сторона-хорда.');
   },
   extended_segment_composition: ({a,b})=>['На луче от A отложили AB = '+a+' см. От B в том же направлении отложили BC = '+(a+b)+' см. Найди AC.',2*a+b,
    'Точка B между A и C. Поэтому AC = AB + BC.'],
   bisect_then_combine_with_other_angle: ({a,b})=>['Перенесли угол '+2*(20+a)+'° и провели биссектрису. К одной половине по внешней стороне приложили угол '+(20+b)+'°. Найди сумму этих двух углов.',40+a+b,
    'Половина исходного угла '+(20+a)+'°. Прибавляем '+(20+b)+'°.'],
   count_distinct_perpendiculars: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return ['Через точку '+p+' построили перпендикуляр к прямой '+q+r+' двумя разными способами. Сколько различных прямых получилось?',1,
     'Через данную точку проходит единственный перпендикуляр к данной прямой.'];
   }
  }
 ],
 geo_parallel_perpendicular_intro: [
  {
   read_parallel_symbol: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Как записать, что прямые '+p+q+' и '+r+s+' параллельны?',p+q+' ∥ '+r+s,
     [p+q+' ⟂ '+r+s,p+q+' = '+r+s,p+r+' ∥ '+q+s],'Параллельность обозначают знаком ∥.');
   },
   count_common_points_parallel: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return ['Прямые '+p+q+' и '+r+s+' параллельны. Сколько у них общих точек?',0,'По определению параллельные прямые не пересекаются.'];
   },
   perpendicular_is_intersecting: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return checkStatement('Прямые '+p+q+' и '+r+s+' пересекаются в одной точке. Могут ли они быть параллельными?',false,
     'У параллельных прямых общих точек нет.');
   },
   name_geometric_relation: ({a,b})=>{
    const type=['parallel','perpendicular','intersecting'][(a+b)%3];
    const labels={parallel:'Параллельны',perpendicular:'Перпендикулярны',intersecting:'Пересекаются под непрямым углом'};
    return withVisual(choice('Как расположены прямые a и b на чертеже?',labels[type],
     Object.keys(labels).filter(key=>key!==type).map(key=>labels[key]),
     'Параллельные прямые не пересекаются. При пересечении квадратная отметка показывает прямой угол.'),
     triangleVisual(g7SafeLineRelationModel(type)));
   }
  },
  {
   two_common_points_same_line: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Прямые '+p+q+' и '+r+s+' имеют две общие точки. Как они расположены?', 'Совпадают',
     ['Параллельны','Перпендикулярны','Пересекаются ровно в одной точке'],'Через две общие точки проходит одна и только одна прямая.');
   },
   distinguish_parallel_segments: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return checkStatement('Сами отрезки '+p+q+' и '+r+s+' не имеют общих точек. Обязательно ли параллельны прямые, на которых они лежат?',false,
     'Продолжения отрезков могут пересечься за их пределами.');
   },
   horizontal_ordinates_parallel: ({a,b})=>checkStatement('Прямые y = '+a+' и y = '+(a+b)+' различны. Параллельны ли они?',true,
    'Обе прямые горизонтальны, ординаты точек у них разные, поэтому общей точки нет.'),
   line_not_parallel_to_itself: ({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Точки '+p+', '+q+' и '+r+' лежат на одной прямой. Как расположены прямые '+p+q+' и '+q+r+'?', 'Совпадают',
     ['Параллельны','Перпендикулярны','Не имеют общих точек'],'Обе записи называют одну и ту же прямую.');
   }
  },
  {
   distance_vertical_lines: ({a,b})=>['На координатной плоскости прямые x = '+a+' и x = '+(a+b)+' параллельны. На сколько единиц они разнесены по горизонтали?',b,
    'Вычитаем абсциссы: '+(a+b)+' − '+a+' = '+b+'.'],
   distinguish_line_types_swapped: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice(p+q+' ∥ '+r+s+', точка X лежит на '+p+q+'. Какое утверждение обязательно верно?',
     'X не лежит на '+r+s,['X лежит на '+r+s,'X — точка пересечения прямых','Прямые имеют ровно одну общую точку'],
     'Если бы X лежала на обеих, у параллельных прямых была бы общая точка.');
   },
   count_pairwise_parallel_pairs: ({a,b})=>{
    const n=a%6+3;
    return ['Даны '+n+' различных попарно параллельных прямых. Сколько пар прямых можно выбрать?',n*(n-1)/2,
     'У каждой прямой '+(n-1)+' партнёров. Делим '+n+' · '+(n-1)+' на 2, поскольку каждую пару посчитали дважды.'];
   },
   no_common_points_then_relation: ({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('В одной плоскости через '+p+' и '+q+' провели прямую, а через '+r+' и '+s+' — другую. У них нет общих точек. Какое обозначение верно?',
     p+q+' ∥ '+r+s,[p+q+' ⟂ '+r+s,p+q+' = '+r+s,p+r+' = '+q+s],
     'У двух разных прямых общей плоскости нет точек пересечения. По определению они параллельны.');
   }
  }
 ]
};
Object.assign(reviewedLessons,{
 geo_transversal_angles:'Секущая пересекает две прямые в разных точках. Соответственные углы занимают одинаковое положение в обоих пересечениях. Накрест лежащие углы находятся внутри обеих прямых и по разные стороны секущей. Внутренние односторонние углы лежат по одну сторону секущей.',
 geo_parallel_criteria:'Для доказательства параллельности достаточно одного условия: равенства накрест лежащих углов, равенства соответственных углов или суммы внутренних односторонних углов 180°.',
 geo_construct_parallel:'Через точку вне прямой можно провести параллельную. Для этого перенеси соответственный угол или построй две прямые, перпендикулярные одной прямой.',
 geo_geometry_axioms:'Аксиому принимают без доказательства. Теорему доказывают, используя определения, аксиомы и ранее доказанные теоремы. Через две различные точки проходит ровно одна прямая.'
});

const transversalRelations=['corresponding','alternate','sameSide','vertical'];
const transversalNames={...G7_CRITERIA_RELATION_NAMES,vertical:'вертикальные'};
const transversalNumbers=[1,2,3,4,5,6,7,8];
function transversalDiagram(a,b,parallelMark=false){
 const offset=(a+b)%8,numbers=transversalNumbers.map(n=>(n+offset-1)%8+1);
 return question=>{
  const numbered=text=>typeof text==='string'?text.replace(/∠([1-8])/g,(_,digit)=>'∠'+numbers[Number(digit)-1]):text;
  question.text=numbered(question.text);
  question.ex=numbered(question.ex);
  for(const answer of question.choices){
   answer.label=numbered(answer.label);
   answer.key=numbered(answer.key);
  }
  question.ans=numbered(question.ans);
  question.correctLabel=numbered(question.correctLabel);
  question.correctText=numbered(question.correctText);
  question.sig+=':numbering='+offset;
  return g7GeoAttach(question,{kind:'g7-textbook-transversal',alpha:25+a+b,numbers,parallelMark},'Две прямые пересечены секущей. Углы пронумерованы.');
 };
}
const transversalPair=(relation,a,b)=>{
 const pairs=G7_TRANSVERSAL_PAIRS[relation];
 return pairs[(a+b)%pairs.length];
};
function identifyTransversal(relation,a,b){
 const selected=transversalPair(relation,a,b);
 return withVisual(choice('Как называются углы '+g7AnglePairText(selected)+'?',transversalNames[relation],
  transversalRelations.filter(key=>key!==relation).map(key=>transversalNames[key]),
  'По расположению на схеме '+g7AnglePairText(selected)+' — '+transversalNames[relation]+' углы.'),transversalDiagram(a,b));
}
function transversalPartner(relation,a,b){
 const selected=transversalPair(relation,a,b),index=b%2,from=selected[index],to=selected[1-index];
 return withVisual(choice('Укажи угол, который с ∠'+from+' образует пару «'+transversalNames[relation]+' углы».','∠'+to,
  transversalNumbers.filter(n=>n!==from&&n!==to).slice(a%4,a%4+3).map(n=>'∠'+n),
  'На схеме нужная пара — '+g7AnglePairText(selected)+'.'),transversalDiagram(a,b));
}
function namedParallelLines(a,b){
 const [p,q,r,s]=geometryLabels(a,b);
 return [p+q,r+s];
}
function criterionAt(relation,x,y){
 return relation==='sameSide'?x+y===180:x===y;
}
function requestedCriterion(relation,a,b,missing=false){
 const x=30+3*a+b,required=relation==='sameSide'?180-x:x;
 const y=required+(a%2?0:b), satisfies=criterionAt(relation,x,y);
 const [line,other]=namedParallelLines(a,b);
 const prefix='Две прямые '+line+' и '+other+' пересечены секущей. Их '+transversalNames[relation]+' углы ';
 const reason=relation==='sameSide'?'Их сумма должна быть 180°.':'Они должны быть равны.';
 if(missing)return [prefix+'образуют пару. Один угол равен '+x+'°. Найди величину второго, при которой прямые параллельны.',required,
  reason+' Получаем '+required+'°.'];
 return checkStatement(prefix+'равны '+x+'° и '+y+'°. Следует ли, что прямые параллельны?',satisfies,
  reason+' Условие '+(satisfies?'выполнено.':'не выполнено.'));
}

Object.assign(reviewed,{
 geo_transversal_angles:[
  {
   identify_corresponding_pair:({a,b})=>identifyTransversal('corresponding',a,b),
   identify_alternate_pair:({a,b})=>identifyTransversal('alternate',a,b),
   choose_same_side_partner:({a,b})=>transversalPartner('sameSide',a,b),
   distinguish_vertical_pair:({a,b})=>identifyTransversal('vertical',a,b)
  },
  {
   match_corresponding_angle:({a,b})=>transversalPartner('corresponding',a,b),
   match_alternate_angle:({a,b})=>transversalPartner('alternate',a,b),
   read_same_side_pair:({a,b})=>identifyTransversal('sameSide',a,b),
   locate_interior_angles:({a,b})=>{
    const vertex=b%2?[3,4]:[5,6],exterior=b%2?[1,2]:[7,8];
    return withVisual(choice('Какие два угла при пересечении '+(b%2?'прямой a':'прямой b')+' с секущей лежат между прямыми a и b?',
     g7AnglePairText(vertex),[g7AnglePairText(exterior),g7AnglePairText([vertex[0],exterior[0]]),g7AnglePairText([vertex[1],exterior[1]])],
     'Между прямыми находится пара '+g7AnglePairText(vertex)+'.'),transversalDiagram(a,b));
   }
  },
  {
   one_side_then_vertical:({a,b})=>{
    const [from,mid]=transversalPair('sameSide',a,b),to=G7_TRANSVERSAL_PAIRS.vertical.find(p=>p.includes(mid)).find(n=>n!==mid);
    return withVisual(choice('К углу ∠'+from+' подбери внутренний односторонний угол и затем найди угол, вертикальный к подобранному. Что получилось?',
     '∠'+to,['∠'+from,'∠'+mid,'∠'+(to===7?8:7)],'Сначала получаем ∠'+mid+', затем вертикальный к нему ∠'+to+'.'),transversalDiagram(a,b));
   },
   corresponding_then_classify:({a,b})=>{
    const from=a%2?3:4,partner=from+4,other=from===3?6:5,adjacent=from===3?5:6;
    return withVisual(choice('Укажи угол, соответственный углу ∠'+from+', и классифицируй его пару с ∠'+other+'.',
     '∠'+partner+', углы вертикальные',['∠'+partner+', углы смежные','∠'+adjacent+', углы вертикальные','∠'+adjacent+', углы смежные'],
     'Соответственный угол — ∠'+partner+'. Он расположен напротив ∠'+other+' при том же пересечении.'),transversalDiagram(a,b));
   },
   alternate_then_classify:({a,b})=>{
    const [from,partner]=transversalPair('alternate',a,b),other=from===3?6:5;
    return withVisual(choice('Найди угол, который накрест лежит с ∠'+from+'. Как этот угол расположен относительно ∠'+other+'?',
     '∠'+partner+', углы смежные',['∠'+partner+', углы вертикальные','∠'+(partner+2)+', углы смежные','∠'+(partner+2)+', углы вертикальные'],
     'Накрест лежащий угол — ∠'+partner+'. ∠5 и ∠6 имеют общую сторону, две другие стороны противоположны.'),transversalDiagram(a,b));
   },
   pair_from_two_conditions:({a,b})=>{
    const selected=transversalPair('alternate',a,b);
    return withVisual(choice('Два угла лежат между прямыми, по разные стороны секущей. Один из них ∠'+selected[1]+'. Назови второй.',
     '∠'+selected[0],['∠'+(selected[0]===3?4:3),'∠'+selected[1],'∠'+(selected[1]+2)],
     'Это накрест лежащие углы '+g7AnglePairText(selected)+'.'),transversalDiagram(a,b));
   }
  }
 ],
 geo_parallel_criteria:[
  {
   check_alternate_equality:({a,b})=>requestedCriterion('alternate',a,b),
   check_corresponding_equality:({a,b})=>requestedCriterion('corresponding',a,b),
   sum_for_same_side:({a,b})=>requestedCriterion('sameSide',a,b,true),
   reject_wrong_angle_pair:({a,b})=>{
    const [line,other]=namedParallelLines(a,b);
    return checkStatement('Секущая пересекает '+line+' и '+other+'. При одном пересечении равны вертикальные углы. Достаточно ли этого для параллельности двух прямых?',false,
     'Вертикальные углы равны при любом пересечении. Они не сравнивают направления двух прямых.');
   }
  },
  {
   classify_angles_before_proof:({a,b})=>{
    const relation=transversalRelations[(a+b)%3],selected=transversalPair(relation,a,b);
    const angle=34+2*a+b,y=relation==='sameSide'?180-angle:angle;
    return withVisual(choice(g7AnglePairText(selected)+' равны '+angle+'° и '+y+'°. По какому признаку следует a ∥ b?',
     'По углам: '+transversalNames[relation],transversalRelations.filter(key=>key!==relation).map(key=>'По углам: '+transversalNames[key]),
     'Названная пара — '+transversalNames[relation]+' углы. '+(relation==='sameSide'?'Их сумма 180°.':'Их величины равны.')),
     transversalDiagram(a,b));
   },
   assess_same_side_sum:({a,b})=>requestedCriterion('sameSide',a,b),
   missing_corresponding_by_adjacent:({a,b})=>{
    const x=30+2*a+b;
    return ['При первом пересечении угол равен '+x+'°. При втором ищем соответственный ему угол. Какой должна быть величина смежного с искомым, чтобы прямые были параллельны?',180-x,
     'Соответственный должен быть '+x+'°, значит смежный равен 180° − '+x+'°.'];
   },
   vertical_cannot_replace_criterion:({a,b})=>{
    const [line,other]=namedParallelLines(a,b);
    return choice('Для прямых '+line+' и '+other+' нашли равные углы при разных точках пересечения с секущей. Какие сведения позволяют применить признак?',
     'Эти углы соответственные',['Оба угла острые','Точки пересечения различны','Один из углов внутренний'],
     'Равенство соответственных углов — признак параллельности. Остальных условий по отдельности недостаточно.');
   }
  },
  {
   solve_alternate_equation:({a,b})=>{
    const x=5+b,offset=25+a,angle=x+offset;
    return ['Накрест лежащие углы равны (x + '+offset+')° и (2x + '+(offset-x)+')°. При каком x прямые параллельны?',x,
     'Приравниваем выражения и получаем x = '+x+'. Оба угла равны '+angle+'°.'];
   },
   solve_same_side_equation:({a,b})=>{
    const x=a+b,offset=180-3*x-b;
    return ['Внутренние односторонние углы равны (x + '+b+')° и (2x + '+offset+')°. При каком x прямые параллельны?',x,
     'Сумма углов 180°, поэтому 3x + '+(b+offset)+' = 180, откуда x = '+x+'.'];
   },
   test_corresponding_through_vertical:({a,b})=>{
    const [line,other]=namedParallelLines(a,b),x=30+3*a,y=x+b%3;
    return checkStatement('Угол при пересечении секущей с '+line+' равен '+x+'°. Угол, вертикальный к соответственному ему при пересечении с '+other+', равен '+y+'°. Параллельны ли прямые?',x===y,
     'Искомый соответственный равен вертикальному к нему, то есть '+y+'°. '+(x===y?'Равенство установлено.':'Равенства нет.'));
   },
   disprove_with_wrong_measure:({a,b})=>{
    const [line,other]=namedParallelLines(a,b),x=40+a+b;
    return choice('Один внутренний односторонний угол равен '+x+'°. Какое измерение второго опровергло бы '+line+' ∥ '+other+'?',
     (181-x)+'°',['Ровно '+(180-x)+'°','Измерение второго здесь ничего не меняет','Любой угол от 0° до 180°'],
     'При параллельных прямых сумма этих углов 180°. С '+(181-x)+'° она равна 181°.');
   }
  }
 ],
 geo_construct_parallel:[
  {
   copy_corresponding_for_construction:({a,b})=>['Чтобы провести параллельную, копируют соответственный угол. Исходный угол равен '+(36+2*a+b)+'°. Какой угол отложить?',36+2*a+b,
    'При равенстве соответственных углов прямые параллельны.'],
   two_perpendiculars:({a,b})=>{
    const [line,other]=namedParallelLines(a,b);
    return choice('Прямая '+line+' перпендикулярна '+other+'. Как провести ещё одну прямую, параллельную '+line+'?',
     'Перпендикулярно '+other,['Перпендикулярно '+line,'Через любое пересечение с '+line,'Под углом 45° к '+other],
     'Две различные прямые, перпендикулярные одной прямой, параллельны.');
   },
   ruler_and_set_square:({a,b})=>{
    const [line,other]=namedParallelLines(a,b);
    return choice('На чертеже нужно перенести направление '+line+' к прямой-направляющей '+other+' с помощью угольника. Что делать с угольником?',
     'Сдвинуть его вдоль линейки без поворота',['Повернуть его на 90°','Развернуть его другой стороной','Сдвинуть линейку и угольник независимо'],
     'При сдвиге без поворота угол между стороной угольника и линейкой остаётся тем же.');
   },
   identify_shared_transversal:({a,b})=>{
    const [line,other]=namedParallelLines(a,b);
    return choice('Нужно провести через P параллельную к '+line+'. Что можно использовать как секущую для переноса угла?',
     'Прямую '+other+' через P, пересекающую '+line,['Совпадающую с '+line+' прямую','Прямую, не проходящую через P и не пересекающую '+line,'Любую параллельную к '+line],
     'Второй угол строится в точке P, а первый берётся в точке пересечения секущей с данной прямой.');
   }
  },
  {
   establish_correct_placement:({a,b})=>{
    const [line,other]=namedParallelLines(a,b),angle=31+2*a+b;
    return choice('Прямые '+line+' и '+other+' пересеклись под углом '+angle+'°. Через P на '+other+' вне '+line+' откладывают такой же угол. Как его расположить, чтобы получить параллельную к '+line+'?',
     'В положении соответственного угла',['В положении внутреннего одностороннего угла','Как смежный к углу '+angle+'° в первом пересечении','При любой точке, кроме P'],
     'Соответственные углы должны быть равны. Для односторонних нужна сумма 180°.');
   },
   transfer_with_inside_sum:({a,b})=>requestedCriterion('sameSide',a,b,true),
   verify_turn_direction:({a,b})=>{
    const [line,other]=namedParallelLines(a,b),angle=38+2*a+b;
    return checkStatement('При построении к '+line+' через P отложили угол '+angle+'°. У пересечения '+line+' с '+other+' взяли такой же угол, и оба угла внутренние односторонние. Получилась ли параллельная?',false,
     'Их сумма '+2*angle+'°, а для внутренних односторонних необходимо 180°.');
   },
   read_correct_path:({a,b})=>{
    const [line,other]=namedParallelLines(a,b);
    return choice('Построение начинают прямой '+other+' через P, перпендикулярной '+line+'. Какой второй шаг завершает построение параллельной к '+line+' через P?',
     'Провести через P перпендикуляр к '+other,['Провести через P перпендикуляр к '+line,'Оставить только '+other,'Провести через P прямую под углом 45° к '+other],
     'Искомая прямая и '+line+' перпендикулярны одной прямой '+other+'.');
   }
  },
  {
   adjust_after_wrong_turn:({a,b})=>{
    const angle=30+2*a,observed=angle+b;
    return ['При переносе соответственного угла '+angle+'° получился угол '+observed+'°. На сколько градусов нужно уменьшить угол?',b,
     'Вычитаем '+observed+'° − '+angle+'° = '+b+'°.'];
   },
   select_supported_construction:({a,b})=>{
    const [line,other]=namedParallelLines(a,b),angle=30+a+b;
    return choice('Секущая '+other+' образует с '+line+' острый угол '+angle+'°. Какая пара измерения и положения годится для построения параллельной?',
     (180-angle)+'°, внутренний односторонний',[angle+'°, внутренний односторонний',(180-angle)+'°, соответственный',(180-angle)+'°, накрест лежащий'],
     'Сумма внутренних односторонних углов должна быть 180°.');
   },
   double_perpendicular_angle:({a,b})=>{
    const angle=33+a+b,[line,other]=namedParallelLines(a,b);
    return ['Прямые '+line+' и '+other+' получены как перпендикуляры к общей прямой. Секущая образует с первой прямой угол '+angle+'°. Найди величину угла, смежного с соответственным при втором пересечении.',180-angle,
     'Прямые параллельны, соответственный угол равен '+angle+'°, а смежный дополняет его до 180°.'];
   },
   derive_parallel_from_two_right_angles:({a,b})=>{
    const [line,other]=namedParallelLines(a,b);
    return choice('По построению '+line+' и '+other+' перпендикулярны одной прямой c. Какое доказательство параллельности годится?',
     'Секущая c образует равные соответственные углы по 90°',['Все углы между '+line+' и '+other+' прямые','При каждом пересечении с c есть вертикальные углы','Каждая прямая имеет с c одну общую точку'],
     'Равные соответственные углы при секущей c дают признак параллельности.');
   }
  }
 ],
 geo_geometry_axioms:[
  {
   name_statement_without_derivation:({a,b})=>{
    const [p,q]=geometryLabels(a,b);
    return choice('Утверждение «через различные точки '+p+' и '+q+' проходит ровно одна прямая» принято без доказательства. Как называют такое утверждение?',
     'Аксиома',['Теорема','Определение','Следствие'],'Аксиомы — исходные утверждения теории.');
   },
   count_lines_through_two:({a,b})=>{
    const [p,q]=geometryLabels(a,b);
    return ['Сколько различных прямых проходит одновременно через '+p+' и '+q+'?',1,'Через две различные точки проходит ровно одна прямая.'];
   },
   name_proved_claim:({a,b})=>{
    const [line,other]=namedParallelLines(a,b);
    return choice('Из свойств смежных углов вывели равенство вертикальных при пересечении прямых '+line+' и '+other+'. Как называется доказанное утверждение?',
     'Теорема',['Аксиома','Определение','Обозначение'],'Теорема — утверждение, которое доказывают.');
   },
   distinguish_definition:({a,b})=>{
    const [line,other]=namedParallelLines(a,b);
    return choice('Фраза «если '+line+' и '+other+' лежат в одной плоскости и не пересекаются, они называются параллельными» объясняет смысл термина. Что это?',
     'Определение',['Доказательство','Аксиома','Признак равенства'],'Определение объясняет значение термина.');
   }
  },
  {
   justify_two_shared_points:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Прямые '+p+r+' и '+q+s+' обе проходят через '+p+' и '+q+'. Какой вывод следует из аксиомы о двух точках?',
     'Прямые совпадают',['Они параллельны','Они перпендикулярны','У них ровно одна общая точка'],
     'Через '+p+' и '+q+' проходит одна прямая. Оба названия относятся к ней.');
   },
   choose_direct_axiom_application:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('По условию '+p+', '+q+' и '+r+' не лежат на одной прямой. Какой вывод непосредственно следует из аксиомы о двух точках?',
     'Прямая '+p+q+' существует и единственна',['Точки лежат на одной прямой','Прямая '+p+q+' совпадает с '+p+r,'Точки '+q+' и '+r+' совпадают'],
     'Для построения единственной прямой достаточно двух различных точек.');
   },
   check_condition_of_distinctness:({a,b})=>{
    const [p,q]=geometryLabels(a,b);
    return checkStatement('В черновике '+p+' и '+q+' обозначают одну и ту же точку. Можно ли применить аксиому о двух различных точках к этой паре?',false,
     'Для применения аксиомы нужно проверить, что точки различны.');
   },
   find_proof_premise:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('В доказательстве указали, что '+p+q+' и '+p+r+' совпадают, потому что '+q+' лежит на '+p+r+'. Какое свойство завершает рассуждение?',
     'Через две различные точки проходит только одна прямая',['Через одну точку проходит только одна прямая','Любые три точки лежат на одной прямой','Две разные прямые не могут пересечься'],
     'Обе прямые проходят через '+p+' и '+q+'. Единственность заставляет их совпасть.');
   }
  },
  {
   count_lines_from_distinct_pairs:({a,b})=>{
    const n=4+a%6;
    return ['Отмечено '+n+' точек, причём никакие три не лежат на одной прямой. Сколько различных прямых задают пары этих точек?',n*(n-1)/2,
     'Каждая пара задаёт одну прямую. Совпадение прямых двух разных пар дало бы не менее трёх точек на одной прямой. Пар '+n+' · '+(n-1)+' / 2.'];
   },
   count_lines_with_collinear_triple:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return ['Точки '+p+', '+q+' и '+r+' лежат на одной прямой, а '+s+' вне её. Сколько различных прямых задают все пары этих точек?',4,
     'Три пары точек '+p+', '+q+', '+r+' дают одну прямую. Каждая из этих точек образует с '+s+' ещё одну отличную прямую.'];
   },
   finish_uniqueness_argument:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Доказывают, что прямые '+p+q+' и '+p+r+' с различными направлениями не могут иметь вторую общую точку. Почему?',
     'Две общие точки однозначно задают одну прямую',['Ровно одна общая точка запрещена','У прямых нет точек','Любые две прямые параллельны'],
     'Если бы общих точек было две, прямые оказались бы одной и той же, вопреки условию.');
   },
   evaluate_argument_with_repeated_point:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Две прямые проходят через '+p+' и '+q+', но '+p+' и '+q+' совпадают. Какого дополнительного факта достаточно, чтобы доказать совпадение прямых?',
     r+' принадлежит обеим прямым и отличается от '+p,[r+' принадлежит только одной прямой',r+' совпадает с '+p,'Точка '+p+' принадлежит обеим прямым'],
     'Точка '+r+' даёт вторую общую точку, отличную от '+p+'. Аксиома применяется к двум различным точкам.');
   }
  }
 ]
});

Object.assign(reviewedLessons,{
 geo_axiom_parallel:'Через точку вне прямой проходит ровно одна прямая, параллельная данной. Две различные прямые, параллельные третьей, параллельны между собой.',
 geo_parallel_properties:'При пересечении параллельных прямых секущей соответственные и накрест лежащие углы равны, а сумма внутренних односторонних углов равна 180°. Смежные углы также в сумме дают 180°.',
 geo_angles_matching_sides:'Если стороны двух углов соответственно параллельны или соответственно перпендикулярны, углы равны или дают в сумме 180°. Углы одного вида равны, острый и тупой дополняют друг друга до 180°.'
});
function parallelAngleTask(relation,a,b,{chain=false,ratio=false}={}){
 const [from,to]=transversalPair(relation,a,b);
 const angle=27+2*a+b, second=relation==='sameSide'?180-angle:angle;
 const diagram=transversalDiagram(a,b,true);
 const prefix='Прямые a и b параллельны. ';
 if(ratio){
  const k=a%5+2, smaller=rational(180,k+1);
  return [prefix+'Угол ∠'+to+' в '+k+' раза больше угла ∠'+from+'. Найди ∠'+from+' в градусах.',
   smaller,'Внутренние односторонние углы в сумме дают 180°. Делим 180° на '+(k+1)+'.',null,diagram];
 }
 if(chain){
  const side=G7_TRANSVERSAL_ADJACENT.find(pair=>pair.includes(to)).find(n=>n!==to);
  return [prefix+'∠'+from+' = '+angle+'°. Найди ∠'+side+' после определения ∠'+to+'.',180-second,
   'По расположению пары '+g7AnglePairText([from,to])+' получаем ∠'+to+' = '+second+'°. ∠'+to+' и ∠'+side+' — смежные, поэтому 180° − '+second+'° = '+(180-second)+'°.',null,diagram];
 }
 return [prefix+'∠'+from+' = '+angle+'°. Найди ∠'+to+'.',second,
  g7AnglePairText([from,to])+' — '+transversalNames[relation]+' углы. '+(relation==='sameSide'?'Из 180° вычитаем '+angle+'°.':'Их величины равны.'),null,diagram];
}

Object.assign(reviewed,{
 geo_axiom_parallel:[
  {
   one_line_from_external_point:({a,b})=>['Точка P находится на расстоянии '+(a+b)+' см от прямой a. Сколько параллельных прямой a проходит через P?',1,
    'Аксиома утверждает существование и единственность такой прямой.'],
   no_parallel_from_internal_point:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return ['Точка '+p+' лежит на '+q+r+'. Сколько прямых, параллельных '+q+r+', можно провести через '+p+'?',0,
     'Любая прямая через '+p+' имеет с '+q+r+' общую точку.'];
   },
   recognize_parallel_axiom:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Какая формулировка аксиомы даёт число параллельных к '+q+r+' через точку '+p+' вне '+q+r+'?',
     'Через точку вне прямой проходит ровно одна параллельная этой прямой.',
     ['Через точку вне прямой проходят две разные параллельные.','Через любую точку прямой проходит параллельная к ней.','Любые две непересекающиеся прямые совпадают.'],
     'Условие о точке вне прямой необходимо, и параллельная единственна.');
   },
   detect_two_names_for_one_line:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Прямые '+p+q+' и '+p+r+' параллельны прямой s и проходят через '+p+'. Как они расположены?',
     'Совпадают',['Параллельны друг другу','Пересекаются в единственной точке','Перпендикулярны'],
     'Через '+p+' проходит одна параллельная к s. Обе записи называют эту прямую.');
   }
  },
  {
   derive_parallel_to_same_line:({a,b})=>{
    const [line,other]=namedParallelLines(a,b);
    return choice('Две различные прямые '+line+' и '+other+' параллельны c. Как расположены '+line+' и '+other+'?',
     'Параллельны',['Совпадают','Перпендикулярны','Могут пересечься'],
     'Если бы они пересеклись, через точку пересечения проходили бы две разные параллельные к c.');
   },
   identify_failure_in_construction:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Построили две различные прямые через '+p+' и утверждают, что обе параллельны '+q+r+'. Что следует?',
     'Хотя бы одна из двух прямых не параллельна '+q+r,
     ['Обе обязательно параллельны '+q+r,'Обе обязательно перпендикулярны '+q+r,'Точки '+q+' и '+r+' совпадают'],
     'Аксиома не допускает двух разных параллельных через одну точку.');
   },
   count_parallels_through_collinear_points:({a,b})=>['На прямой b, параллельной a, отмечено '+(a+b)+' точек. Сколько различных параллельных к a пройдёт хотя бы через одну отмеченную точку?',1,
    'Для каждой точки эта параллельная — одна и та же прямая b.'],
   one_crossing_means_other_crossing:({a,b})=>{
    const [line,other]=namedParallelLines(a,b);
    return checkStatement(line+' ∥ '+other+'. Прямая c пересекает '+line+' и отличается от '+other+'. Обязательно ли c пересекает '+other+'?',true,
     'Если бы c не пересекала '+other+', обе прямые '+line+' и c были бы параллельны '+other+' через их общую точку.');
   }
  },
  {
   count_parallel_groups:({a,b})=>{
    const n=a%5+2;
    return ['Точки отмечены на прямой a и на '+n+' различных прямых, параллельных a. На каждой отмечено по '+b+' точек. Сколько параллельных к a проходят хотя бы через одну отмеченную точку?',n,
     'Точки на a не дают параллельной. На каждой из '+n+' остальных прямых все точки дают одну и ту же параллельную.'];
   },
   prove_transversal_is_unique_candidate:({a,b})=>{
    const [line,other]=namedParallelLines(a,b);
    return choice(line+' ∥ '+other+'. Через P на '+line+' провели c, отличную от '+line+'. Как объяснить, что c пересекает '+other+'?',
     'Иначе '+line+' и c были бы двумя параллельными к '+other+' через P',
     ['Через P нельзя провести прямую','По определению '+line+' и '+other+' пересекаются','Любая прямая через P перпендикулярна '+other],
     'Предположение, что c и '+other+' не пересекаются, нарушает единственность параллельной через P.');
   },
   recover_equality_from_chain:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Прямые '+p+' и '+r+' параллельны '+q+' и проходят через точку '+s+'. Как связаны '+p+' и '+r+'?',
     'Совпадают',['Перпендикулярны','Различны и параллельны','Пересекаются только в '+s],
     'Обе параллельны '+q+' и проходят через '+s+', потому обозначают одну прямую.');
   },
   count_crossings_for_secant:({a,b})=>{
    const n=a+b;
    return ['Дано '+n+' различных попарно параллельных прямых. Прямая c пересекает одну из них. Сколько различных точек пересечения c со всеми этими прямыми?',n,
     'Секущая пересекает каждую прямую. Точки различны, поскольку параллельные прямые общих точек не имеют.'];
   }
  }
 ],
 geo_parallel_properties:[
  {
   corresponding_equal:({a,b})=>parallelAngleTask('corresponding',a,b),
   alternate_equal:({a,b})=>parallelAngleTask('alternate',a,b),
   same_side_supplement:({a,b})=>parallelAngleTask('sameSide',a,b),
   equal_relationship_rule:({a,b})=>{
    const x=30+a+b,[line,other]=namedParallelLines(a,b);
    return choice(line+' ∥ '+other+'. При секущей внутренние односторонние углы не равны. Какое утверждение верно?',
     'В сумме они дают 180°',['Оба угла по '+x+'°','Их сумма '+(160+a)+'°','Оба угла тупые'],
     'Внутренние односторонние углы между параллельными прямыми дополняют друг друга до 180°.');
   }
  },
  {
   corresponding_then_adjacent:({a,b})=>parallelAngleTask('corresponding',a,b,{chain:true}),
   same_side_then_adjacent:({a,b})=>parallelAngleTask('sameSide',a,b,{chain:true}),
   recover_small_from_difference:({a,b})=>{
    const small=36+a+b,delta=180-2*small;
    return ['Внутренние односторонние углы при параллельных прямых отличаются на '+delta+'°. Найди меньший угол.',small,
     'Вычти разность из суммы: 180° − '+delta+'°. Получится удвоенный меньший угол. Делим на 2.'];
   },
   perpendicular_to_both:({a,b})=>{
    const [line,other]=namedParallelLines(a,b);
    return ['Прямые '+line+' и '+other+' параллельны. Секущая перпендикулярна '+line+'. Какой угол она образует с '+other+'?',90,
     'Соответственный угол относительно '+other+' равен 90°.'];
   }
  },
  {
   ratio_of_same_side_angles:({a,b})=>parallelAngleTask('sameSide',a,b,{ratio:true}),
   find_parameter_from_corresponding:({a,b})=>{
    const x=a+b,constant=30+a;
    return ['Соответственные углы при параллельных прямых равны (x + '+constant+')° и (2x + '+(constant-x)+')°. Найди x.',x,
     'Приравниваем меры углов. Вычитаем x из обеих частей и получаем '+constant+' − '+(constant-x)+' = '+x+'.'];
   },
   find_parameter_from_same_side:({a,b})=>{
    const x=a+3,constant=180-3*x-b;
    return ['Внутренние односторонние углы при параллельных прямых равны (x + '+b+')° и (2x + '+constant+')°. Найди x.',x,
     'Складываем выражения и получаем 3x + '+(constant+b)+' = 180. Отсюда x = '+x+'.'];
   },
   apply_two_parallel_pairs:({a,b})=>{
    const [from,to]=transversalPair('alternate',a,b),angle=40+a+b;
    return [g7AnglePairText([from,to])+' — накрест лежащие при секущей двух параллельных прямых. Смежный с первым равен '+(180-angle)+'°. Чему равен второй?',
     angle,'Первый угол равен 180° − '+(180-angle)+'° = '+angle+'°. Накрест лежащий ему равен.'];
   }
  }
 ],
 geo_angles_matching_sides:[
  {
   two_acute_parallel_rays:({a,b})=>['Оба угла острые, стороны соответственно параллельны. Первый равен '+(32+a+b)+'°. Найди второй.',32+a+b,
    'Оба угла острые, поэтому они равны.'],
   two_obtuse_perpendicular_rays:({a,b})=>['Оба угла тупые, стороны соответственно перпендикулярны. Первый равен '+(105+a+b)+'°. Найди второй.',105+a+b,
    'Оба угла тупые, значит, они равны.'],
   acute_and_obtuse_parallel:({a,b})=>{
    const small=31+a+b;
    return ['Углы имеют соответственно параллельные стороны. Острый угол равен '+small+'°. Найди второй, если он тупой.',180-small,
     'Углы разных видов, поэтому 180° − '+small+'° = '+(180-small)+'°.'];
   },
   right_angle_remains_right:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return ['Один угол прямой. Его стороны соответственно перпендикулярны сторонам угла ∠'+p+q+r+'. Найди величину ∠'+p+q+r+'.',90,
     'И угол, равный 90°, и дополняющий его до 180° имеют величину 90°.'];
   }
  },
  {
   choose_both_possible_sizes:({a,b})=>{
    const x=31+a+b;
    return choice('Стороны углов соответственно параллельны, один угол равен '+x+'°. Какие величины возможны для другого угла?',
     x+'° или '+(180-x)+'°',[x+'° или '+(90-x)+'°',(180-x)+'° или '+(180+x)+'°','Только '+x+'°'],
     'Углы либо равны, либо дают 180° в сумме.');
   },
   recover_from_sum_of_obtuse:({a,b})=>{
    const x=100+a+b;
    return ['Два тупых угла с соответственно перпендикулярными сторонами в сумме дают '+2*x+'°. Найди один из них.',x,
     'Два тупых угла равны. Их сумму делим пополам.'];
   },
   recover_from_difference:({a,b})=>{
    const x=31+a+b,delta=180-2*x;
    return ['Стороны двух неравных углов соответственно параллельны, разность углов '+delta+'°. Найди больший угол.',180-x,
     'Углы дают 180° в сумме. Прибавляем к сумме разность и делим на 2.'];
   },
   reject_confusing_angle_types:({a,b})=>{
    const angle=40+a+b;
    return checkStatement('Два острых угла равны '+angle+'° и '+(angle+1)+'°. Могут ли их стороны быть соответственно перпендикулярными?',false,
     'Два острых угла с соответственно перпендикулярными сторонами должны быть равны.');
   }
  },
  {
   ratio_of_non_equal_angles:({a,b})=>{
    const k=a%7+2;
    return ['Неравные углы с соответственно параллельными сторонами относятся как 1 : '+k+'. Найди меньший угол в градусах.',rational(180,k+1),
     'Их сумма составляет 180°, это '+(k+1)+' одинаковых частей. Меньший угол равен одной части.'];
   },
   solve_for_two_equal_acute_angles:({a,b})=>{
    const x=4+a,constant=32+b;
    return ['Два острых угла с соответственно перпендикулярными сторонами равны (x + '+constant+')° и (2x + '+(constant-x)+')°. Найди x.',x,
     'Оба угла одного вида и равны. Приравниваем два выражения и получаем x = '+constant+' − '+(constant-x)+'.'];
   },
   solve_for_two_different_angles:({a,b})=>{
    const x=a+b,constant=180-3*x-18;
    return ['Один угол острый и равен (x + 18)°. Другой тупой и равен (2x + '+constant+')°. Стороны углов соответственно параллельны. Найди x.',x,
     'Сумма углов 180°, поэтому 3x + '+(constant+18)+' = 180.'];
   },
   perpendicularly_linked_chain:({a,b})=>{
    const x=103+a+b;
    return ['Стороны острого угла ∠1 соответственно перпендикулярны сторонам тупого ∠2. Стороны ∠2 соответственно параллельны сторонам тупого ∠3. Найди ∠1, если ∠3 = '+x+'°.',180-x,
     'Тупые ∠2 и ∠3 равны. Острый ∠1 дополняет ∠2 до 180°.'];
   }
  }
 ]
});

Object.assign(reviewedLessons,{
 geo_triangle_angle_sum:'Сумма внутренних углов любого треугольника 180°. Чтобы найти неизвестный угол, вычти остальные из 180°. В равнобедренном треугольнике сначала отметь углы при основании.',
 geo_exterior_triangle_angle:'Внешний угол треугольника смежен с внутренним при той же вершине. Он равен сумме двух внутренних углов при остальных вершинах.',
 geo_triangle_angle_types:'Смотри на наибольший угол треугольника. Если он меньше 90°, треугольник остроугольный. Если он равен 90°, треугольник прямоугольный. Если он больше 90°, треугольник тупоугольный.',
 geo_side_angle_relation:'В одном треугольнике против большей стороны лежит больший угол, а против большего угла — большая сторона. Против равных сторон лежат равные углы.'
});
const triangleKinds=['Остроугольный','Прямоугольный','Тупоугольный'];
function classifyTriangle(A,B,C){
 const max=Math.max(A,B,C);
 return max<90?triangleKinds[0]:max===90?triangleKinds[1]:triangleKinds[2];
}
function classifyTriangleTask(prompt,A,B,C){
 const kind=classifyTriangle(A,B,C);
 return choice(prompt,kind,triangleKinds.filter(option=>option!==kind),
  'Углы равны '+[A,B,C].map(x=>x+'°').join(', ')+'. Наибольший — '+Math.max(A,B,C)+'°.');
}
function labelledTriangleDiagram(A,B,C,rightAt=''){
 const model=g7TriangleAngleModel(A,B,C);
 return triangleVisual({kind:'g7-triangle',points:model.points,rightAt,aria:'Треугольник ABC'});
}
const angleSidePairs=[['∠A','BC'],['∠B','AC'],['∠C','AB']];
function findLargestByMeasure(values){
 return values.indexOf(Math.max(...values));
}
function shuffledTriangleMeasures(a,b){
 const values=[27+a,45+b,108-a-b],start=(a+b)%3;
 return values.slice(start).concat(values.slice(0,start));
}
function triangleDegreesFromPair(a,b){
 const A=28+a,B=49+b;
 return [A,B,180-A-B];
}
Object.assign(reviewed,{
 geo_triangle_angle_sum:[
  {
   find_last_angle:({a,b})=>{
    const [A,B,C]=triangleDegreesFromPair(a,b);
    return ['В треугольнике ∠A = '+A+'°, ∠B = '+B+'°. Найди ∠C.',C,'Сумма углов 180°. Вычисляем 180° − '+A+'° − '+B+'°.'];
   },
   complete_right_triangle:({a,b})=>{
    const angle=27+a+b;
    return ['В прямоугольном треугольнике один острый угол равен '+angle+'°. Найди другой.',90-angle,'Два острых угла в сумме дают 90°.'];
   },
   find_sum_of_remaining_angles:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b),angle=39+a+b;
    return ['В треугольнике '+p+q+r+' угол при '+p+' равен '+angle+'°. Чему равна сумма углов при '+q+' и '+r+'?',180-angle,
     'Вычитаем из общей суммы 180° известный угол.'];
   },
   rule_out_incompatible_pair:({a,b})=>{
    const A=90+a,B=89-a+b;
    return checkStatement('Могут ли два угла одного треугольника быть равными '+A+'° и '+B+'°?',false,
     'Их сумма '+(A+B)+'°, а вместе с третьим положительным углом должна получиться сумма 180°.');
   }
  },
  {
   base_angle_from_vertex:({a,b})=>{
    const A=36+2*(a+b),base=(180-A)/2;
    return ['В равнобедренном треугольнике угол между боковыми сторонами '+A+'°. Найди угол при основании.',base,
     'Углы при основании равны. Вычитаем '+A+'° из 180° и делим на 2.'];
   },
   find_angle_given_two_expressions:({a,b})=>{
    const A=30+a,B=A+b,C=180-A-B;
    return ['Угол A равен '+A+'°, а угол B на '+b+'° больше A. Найди угол C.',C,
     'Сначала ∠B = '+A+'° + '+b+'° = '+B+'°. Затем ∠C = 180° − '+(A+B)+'°.'];
   },
   select_valid_triple:({a,b})=>{
    const [A,B,C]=triangleDegreesFromPair(a,b),fmtTriple=c=>A+'°, '+B+'° и '+c+'°';
    return choice('Какой набор может быть углами треугольника?',fmtTriple(C),[fmtTriple(C-10),fmtTriple(C+5),fmtTriple(C+13)],
     'Только '+A+'° + '+B+'° + '+C+'° = 180°. Все три угла положительные.');
   },
   match_triangle_marking:({a,b})=>{
    const A=28+a+b,B=90-A;
    return ['На чертеже ∠A = '+A+'°. Найди ∠B, учитывая отметку у C.',B,
     'Квадратная отметка показывает, что ∠C = 90°. Вычитаем 90° и '+A+'° из 180°.',null,labelledTriangleDiagram(A,B,90,'C')];
   }
  },
  {
   ratio_all_three:({a,b})=>{
    const k=a%4+2,m=b%4+1,parts=1+k+m;
    return ['Углы треугольника относятся как 1 : '+k+' : '+m+'. Найди первый угол в градусах.',rational(180,parts),
     'На 180° приходится '+parts+' одинаковых частей. Первый угол равен 180° / '+parts+'.'];
   },
   solve_linear_from_triangle:({a,b})=>{
    const x=32+a,constant=180-4*x-b;
    return ['Углы треугольника равны x°, (x + '+b+')° и ('+sum('2x',constant)+')°. Найди x.',x,
     'Складываем меры углов: '+sum('4x',constant+b)+' = 180. Решаем и получаем x = '+x+'.'];
   },
   base_plus_vertex_difference:({a,b})=>{
    const x=65+a,vertex=180-2*x,delta=x-vertex;
    return ['В равнобедренном треугольнике угол при основании на '+delta+'° больше угла при вершине. Найди угол при вершине.',vertex,
     'Если угол при вершине x°, сумма равна x + 2(x + '+delta+') = 180. Из неё x = '+vertex+'.'];
   },
   split_angle_then_compute:({a,b})=>{
    const [A,B,C]=triangleDegreesFromPair(a,b),part=12+a;
    return ['В треугольнике ABC угол A равен '+A+'°, а B — '+B+'°. Луч из C делит ∠C на две части. Одна часть равна '+part+'°. Найди другую.',C-part,
     'Сначала ∠C = 180° − '+A+'° − '+B+'° = '+C+'°. Затем вычитаем '+part+'°.'];
   }
  }
 ],
 geo_exterior_triangle_angle:[
  {
   adjacent_to_interior:({a,b})=>{
    const [A,B,C]=triangleDegreesFromPair(a,b);
    return ['Сторона BC продолжена за C до D. ∠ACB = '+C+'°. Найди ∠ACD.',180-C,
     '∠ACB и ∠ACD смежные. Из 180° вычитаем '+C+'°.',null,triangleVisual(g7ExteriorTriangleData(g7TriangleAngleModel(A,B,C)))];
   },
   add_remote_angles:({a,b})=>{
    const [A,B]=triangleDegreesFromPair(a,b);
    return ['В треугольнике ABC углы A и B равны '+A+'° и '+B+'°. Найди внешний угол при C.',A+B,
     'Внешний угол при C равен сумме внутренних углов при A и B.'];
   },
   choose_remote_angles:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Чему равен внешний угол при '+p+' треугольника '+p+q+r+'?',
     '∠'+q+' + ∠'+r,['∠'+p+' + ∠'+r,'∠'+p+' + ∠'+q,'∠'+p],
     'Нужны внутренние углы при остальных вершинах, '+q+' и '+r+'.');
   },
   determine_adjacent_internal:({a,b})=>{
    const exterior=95+a+b;
    return ['Внешний угол при вершине B равен '+exterior+'°. Найди внутренний угол при этой вершине.',180-exterior,
     'Сумма внутреннего и внешнего углов при одной вершине 180°.'];
   }
  },
  {
   subtract_known_remote_angle:({a,b})=>{
    const [A,B]=triangleDegreesFromPair(a,b);
    return ['Внешний угол при C равен '+(A+B)+'°, угол A — '+A+'°. Найди угол B.',B,
     'Внешний угол при C равен ∠A + ∠B. Вычитаем '+A+'°.'];
   },
   check_exterior_larger_than_remote:({a,b})=>{
    const x=70+a+b;
    return checkStatement('Внешний угол при C равен '+x+'°. Может ли внутренний угол A быть равен '+(x+b)+'°?',false,
     'Внешний угол при C — сумма положительных ∠A и ∠B. Он больше каждого из них.');
   },
   find_outer_from_right_angle:({a,b})=>{
    const angle=28+a+b;
    return ['В треугольнике ABC угол A прямой, угол B равен '+angle+'°. Найди внешний угол при C.',90+angle,
     'Складываем внутренние углы при A и B: 90° + '+angle+'°.'];
   },
   recover_equal_remote_angles:({a,b})=>{
    const angle=35+a+b;
    return ['В равнобедренном треугольнике внешний угол при вершине между равными сторонами '+2*angle+'°. Чему равен каждый из углов при основании?',angle,
     'Этот внешний угол равен сумме равных углов при основании. Делим его пополам.'];
   }
  },
  {
   two_exterior_angles:({a,b})=>{
    const [A,B,C]=triangleDegreesFromPair(a,b);
    return ['Внешние углы при A и B равны '+(180-A)+'° и '+(180-B)+'°. Найди внешний угол при C.',180-C,
     'Сначала находим внутренние ∠A = '+A+'° и ∠B = '+B+'°. Их сумма '+(180-C)+'° даёт внешний угол при C.'];
   },
   exterior_angle_equation:({a,b})=>{
    const x=20+a,k=24+b;
    return ['Внутренние углы A и B равны x° и (x + '+k+')°. Внешний угол при C равен '+(2*x+k)+'°. Найди x.',x,
     'Составляем x + x + '+k+' = '+(2*x+k)+'. Решение x = '+x+'.'];
   },
   use_adjacent_then_remote:({a,b})=>{
    const [A,B,C]=triangleDegreesFromPair(a,b);
    return ['Внешний угол при A равен '+(180-A)+'°, а внешний угол при C равен '+(180-C)+'°. Найди внутренний угол B.',B,
     'Внутренний ∠A = '+A+'°. Внешний угол при C равен ∠A + ∠B. Вычитаем '+A+'°.'];
   },
   remote_difference_and_sum:({a,b})=>{
    const [A,B]=triangleDegreesFromPair(a,b);
    return ['Внешний угол при C равен '+(A+B)+'°. Внутренний угол B на '+(B-A)+'° больше угла A. Найди угол A.',A,
     'Из суммы ∠A + ∠B вычитаем разность ∠B − ∠A и делим на 2.'];
   }
  }
 ],
 geo_triangle_angle_types:[
  {
   name_acute_triangle:({a,b})=>{
    const A=47+a,B=50+b,C=180-A-B;
    return classifyTriangleTask('Углы треугольника равны '+A+'°, '+B+'° и '+C+'°. Какого он вида по углам?',A,B,C);
   },
   name_right_triangle:({a,b})=>{
    const A=27+a+b,B=90-A;
    return classifyTriangleTask('Углы треугольника равны '+A+'°, 90° и '+B+'°. Какого он вида по углам?',A,B,90);
   },
   name_obtuse_triangle:({a})=>{
    const A=90+a;
    return choice('Какого вида по углам треугольник с углом '+A+'°?','Тупоугольный',
     triangleKinds.filter(kind=>kind!=='Тупоугольный'),'Угол '+A+'° больше 90°. Наличия одного такого угла достаточно для классификации.');
   },
   count_acute_angles:({a,b})=>{
    const angle=90+a+b;
    return ['В треугольнике один угол равен '+angle+'°. Сколько в нём острых углов?',2,
     'Два оставшихся угла дают в сумме '+(180-angle)+'°, что меньше 90°. Каждый из них острый.'];
   }
  },
  {
   classify_from_two_angles:({a,b})=>{
    const A=32+a,B=36+b,C=180-A-B;
    return classifyTriangleTask('Два угла треугольника равны '+A+'° и '+B+'°. Какого он вида по углам?',A,B,C);
   },
   classify_isosceles_by_base:({a,b})=>{
    const B=39+a%7+b%4,A=180-2*B;
    return classifyTriangleTask('В равнобедренном треугольнике угол при основании '+B+'°. Какого он вида по углам?',A,B,B);
   },
   right_condition_from_sum:({a,b})=>{
    const x=90+(a%3-1)*b;
    return checkStatement('Сумма углов A и B равна '+x+'°. Является ли угол C прямым?',x===90,
     'Угол C равен 180° − '+x+'° = '+(180-x)+'°.');
   },
   classify_from_vertex:({a,b})=>{
    const A=85+a,B=28+b,C=180-A-B;
    return classifyTriangleTask('Угол A равен '+A+'°, а угол B — '+B+'°. Определи вид треугольника по углам.',A,B,C);
   }
  },
  {
   classify_from_external_and_remote:({a,b})=>{
    const A=24+a,B=42+b,C=180-A-B;
    return classifyTriangleTask('Внешний угол при C равен '+(180-C)+'°, угол A — '+A+'°. Какого вида треугольник?',A,B,C);
   },
   classify_from_angle_ratio:({a,b})=>{
    const ratios=[[2,3,4],[2,3,5],[1,2,6],[3,4,5],[3,3,6],[2,2,5]],start=(a+b)%ratios.length;
    const row=ratios[start],ordered=row.slice(a%3).concat(row.slice(0,a%3)),factor=180/ordered.reduce((x,y)=>x+y,0);
    return classifyTriangleTask('Углы треугольника относятся как '+ordered.join(' : ')+'. Какого он вида?',...ordered.map(value=>value*factor));
   },
   classify_by_difference_in_equal_sides:({a,b})=>{
    const B=53+a%7,A=180-2*B;
    return classifyTriangleTask('В равнобедренном треугольнике угол при вершине на '+(B-A>=0?B-A:A-B)+'° '+(A<=B?'меньше':'больше')+' угла при основании. Какого он вида по углам?',A,B,B);
   },
   bound_max_angle:({a,b})=>{
    const max=62+a+b;
    return ['Наибольший угол в треугольнике равен '+max+'°. Какова наименьшая возможная градусная мера другого угла?',180-2*max,
     'Чтобы третий угол был как можно меньше, второй берём равным наибольшему. Из 180° вычитаем два угла по '+max+'°.'];
   }
  }
 ],
 geo_side_angle_relation:[
  {
   opposite_side_for_given_vertex:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Какая сторона треугольника '+p+q+r+' лежит напротив угла при '+q+'?',p+r,[p+q,q+r],
     'Сторона напротив угла не содержит его вершину '+q+'.');
   },
   largest_side_from_three_angles:({a,b})=>{
    const values=shuffledTriangleMeasures(a,b),index=findLargestByMeasure(values);
    return choice('∠A = '+values[0]+'°, ∠B = '+values[1]+'°, ∠C = '+values[2]+'°. Какая сторона больше всех?',
     angleSidePairs[index][1],angleSidePairs.filter((_,i)=>i!==index).map(pair=>pair[1]),
     'Самая длинная сторона лежит напротив наибольшего угла '+angleSidePairs[index][0]+'.');
   },
   compare_angles_from_given_sides:({a,b})=>{
    const first=10+a,second=first+b;
    return choice('В ABC сторона AB = '+first+' см, AC = '+second+' см. Как сравнить ∠B и ∠C?',
     '∠B > ∠C',['∠B < ∠C','∠B = ∠C','Данных недостаточно'],
     'Угол B лежит напротив AC, а угол C — напротив AB. Сторона AC длиннее.');
   },
   equal_sides_imply_equal_angles:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('В треугольнике '+p+q+r+' стороны '+p+q+' и '+p+r+' равны. Какие углы равны?',
     '∠'+q+' и ∠'+r,['∠'+p+' и ∠'+q,'∠'+p+' и ∠'+r,'Равных углов нет'],
     'Этим сторонам противолежат соответственно ∠'+r+' и ∠'+q+'.');
   }
  },
  {
   compute_and_order_sides:({a,b})=>{
    const [A,B,C]=shuffledTriangleMeasures(a,b);
    const order=[A,B,C].map((angle,index)=>[angle,angleSidePairs[index][1]]).sort((u,v)=>u[0]-v[0]);
    const [p,q,r]=order.map(pair=>pair[1]);
    return choice('В ABC угол A равен '+A+'°, угол B — '+B+'°. Укажи порядок сторон по возрастанию.',
     [p,q,r].join(' &lt; '),[[r,q,p],[p,r,q],[q,p,r]].map(row=>row.join(' &lt; ')),
     'Сначала ∠C = '+C+'°. Затем упорядочиваем углы и выписываем стороны напротив них.');
   },
   maximum_angle_from_perimeter:({a,b})=>{
    const short=15+a,middle=short+2,long=middle+3;
    return choice('BC = '+short+' см, AB = '+middle+' см, периметр ABC равен '+(short+middle+long)+' см. Какой угол наибольший?',
     '∠B',['∠A','∠C','Все углы равны'],
     'AC = '+long+' см, это наибольшая сторона. Напротив AC лежит ∠B.');
   },
   longest_side_opposite_obtuse:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b),angle=95+a+b;
    return choice('В треугольнике '+p+q+r+' угол при '+r+' равен '+angle+'°. Какая сторона самая длинная?',
     p+q,[p+r,q+r,'Данных недостаточно'],
     'Тупой угол больше каждого из двух других, поэтому напротив него наибольшая сторона.');
   },
   reject_wrong_side_order:({a,b})=>{
    const A=31+a,B=51+b;
    return checkStatement('Если ∠A = '+A+'°, ∠B = '+B+'°, может ли выполняться BC > AC?',false,
     '∠A меньше ∠B, значит сторона BC напротив A короче стороны AC напротив B.');
   }
  },
  {
   order_sides_from_exterior_angle:({a,b})=>{
    const [A,B,C]=shuffledTriangleMeasures(a,b);
    const sorted=[A,B,C].map((angle,index)=>[angle,angleSidePairs[index][1]]).sort((u,v)=>u[0]-v[0]).map(pair=>pair[1]);
    const [p,q,r]=sorted;
    return choice('Внешний угол при C равен '+(180-C)+'°, угол B — '+B+'°. Укажи порядок сторон от большей к меньшей.',
     [r,q,p].join(' > '),[[p,q,r],[r,p,q],[q,r,p]].map(row=>row.join(' > ')),
     'Внутренний ∠C = '+C+'°, ∠A = '+A+'°. Стороны располагаем как противолежащие углы.');
   },
   reconstruct_sides_from_differences:({a,b})=>{
    const shortest=19+a,middle=shortest+b,longest=middle+2;
    return choice('В ABC сторона AB на '+b+' см длиннее AC, а BC на 2 см длиннее AB. Периметр '+(shortest+middle+longest)+' см. Какой угол наименьший?',
     '∠B',['∠A','∠C','Два угла одинаковы'],
     'AC короче AB, а AB короче BC. Наименьший угол B лежит напротив AC.');
   },
   equal_angles_checked_with_total:({a,b})=>{
    const A=35+a,B=A,C=180-2*A;
    return choice('В треугольнике ABC угол A равен '+A+'°, а внешний угол при C — '+(180-C)+'°. Какие стороны равны?',
     'BC = AC',['AB = BC','AB = AC','Все стороны различны'],
     '∠B = '+(180-C)+'° − '+A+'° = '+B+'°. Напротив равных A и B лежат BC и AC.');
   },
   rank_by_two_angle_gaps:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b),first=b+1,second=a+2;
    return choice('В треугольнике '+p+q+r+' угол '+q+' больше угла '+p+' на '+first+'°, а угол '+r+' меньше угла '+p+' на '+second+'°. Какая сторона имеет среднюю длину?',
     q+r,[p+q,p+r,'Две стороны одинаковы'],
     'Углы по возрастанию идут так: '+r+', '+p+', '+q+'. Сторона напротив среднего угла '+p+' — '+q+r+'.');
   }
  }
 ]
});

Object.assign(reviewedLessons,{
 geo_triangle_inequality:'В треугольнике каждая сторона меньше суммы двух других. Для третьей стороны c при известных a и b выполняется |a − b| < c < a + b. Границы исключены.',
 geo_right_triangle_properties:'Гипотенуза лежит напротив прямого угла и длиннее каждого катета. Катеты образуют прямой угол. Сумма острых углов 90°.',
 geo_right_triangle_30deg:'Катет напротив угла 30° равен половине гипотенузы. Если катет равен половине гипотенузы, противолежащий угол равен 30°.',
 geo_right_triangle_congruence:'Прямоугольные треугольники равны по двум катетам, по катету и острому углу при соответствующих элементах, по гипотенузе и острому углу или по гипотенузе и катету.'
});
function enoughTriangleData(a,b,c){
 return checkStatement('Можно ли построить треугольник со сторонами '+a+', '+b+' и '+c+' см?',g7TriangleExists(a,b,c),
  'Сумма двух меньших сторон должна быть строго больше самой длинной. '+[a,b,c].sort((x,y)=>x-y).slice(0,2).join(' + ')+' сравниваем с '+Math.max(a,b,c)+'.');
}
const rightDiagram=(a,b)=>labelledTriangleDiagram(27+a+b,63-a-b,90,'C');
const rightCongruenceOptions=['По двум катетам','По гипотенузе и катету','По гипотенузе и острому углу','По катету и острому углу'];
function rightCongruence(prompt,index,ex,criteria){
 const task=choice(prompt,rightCongruenceOptions[index],rightCongruenceOptions.filter((_,i)=>i!==index),ex);
 return criteria?withVisual(task,triangleVisual(g7TrianglePairData(criteria))):task;
}
Object.assign(reviewed,{
 geo_triangle_inequality:[
  {
   check_lengths_obey_rule:({a,b})=>enoughTriangleData(a,b,a+b-1),
   check_lengths_add_exactly:({a,b})=>enoughTriangleData(b,a+b,a),
   upper_bound:({a,b})=>['Две стороны треугольника равны '+a+' и '+b+' см. Укажи верхнюю границу для длины третьей, которая не входит в допустимый промежуток.',a+b,'Третья сторона строго меньше их суммы.'],
   reject_length_above_bound:({a,b})=>enoughTriangleData(a+b+2,b,a)
  },
  {
   smallest_integer_side:({a,b})=>['Стороны треугольника '+a+' см и '+(a+b)+' см. Найди наименьшую целую длину третьей стороны в сантиметрах.',b+1,'Третья сторона больше разности '+b+' см. Следующее целое число — '+(b+1)+'.'],
   largest_integer_side:({a,b})=>['Две стороны '+a+' см и '+b+' см. Найди наибольшую целую длину третьей стороны в сантиметрах.',a+b-1,'Третья сторона строго меньше '+(a+b)+' см.'],
   count_integer_sides:({a,b})=>['Две стороны равны '+a+' и '+(a+b)+' см. Сколько разных целых длин в сантиметрах возможны для третьей стороны?',2*a-1,'Между '+b+' и '+(2*a+b)+' ровно '+(2*a-1)+' целых чисел.'],
   recover_third_side_and_check:({a,b})=>{
    const c=a+b-(a%3-1);
    return checkStatement('Две стороны равны '+a+' и '+b+' см. Может ли периметр равняться '+(a+b+c)+' см?',g7TriangleExists(a,b,c),'Из периметра вычитаем известные стороны. Получаем '+c+' см и сравниваем с '+(a+b)+' см.');
   }
  },
  {
   count_bases_from_equal_sides:({a,b})=>['Боковые стороны равнобедренного треугольника по '+a+' см. Сколько возможных целых длин основания в сантиметрах не меньше '+(a+1)+' см?',a-1,'Основание меньше '+2*a+' см. Считаем от '+(a+1)+' до '+(2*a-1)+'.'],
   smallest_equal_side_with_fixed_base:({a,b})=>['Основание равнобедренного треугольника '+(2*a+b)+' см. Найди наименьшую целую длину боковой стороны в сантиметрах.',a+Math.floor(b/2)+1,'Боковая сторона должна быть строго больше половины основания.'],
   compare_two_constraints:({a,b})=>{
    const c=a+b-1;
    return choice('Какое целое c подходит для обеих троек '+a+', '+b+', c и '+(a+1)+', '+(b+1)+', c, если каждая должна образовать треугольник?',c,[a+b,a+b+1,Math.abs(a-b)],'Для первой тройки |'+a+' − '+b+'| < c < '+(a+b)+'. Этот промежуток целиком содержится в допустимом промежутке для второй тройки.');
   },
   choose_valid_perimeter_sequence:({a,b})=>{
    const s=a+b+17;
    return ['Самая длинная сторона треугольника равна '+s+' см. Какое наименьшее целое значение может иметь периметр?',2*s+1,'Периметр строго больше '+2*s+' см. Следующее целое значение — '+(2*s+1)+' см. Оно возможно, например со сторонами 1, '+s+' и '+s+' см.'];
   }
  }
 ],
 geo_right_triangle_properties:[
  {
   read_hypotenuse_from_diagram:({a,b})=>withVisual(choice('Какая сторона на чертеже — гипотенуза? Острый ∠A равен '+(27+a+b)+'°.','AB',['AC','BC'],'Гипотенуза лежит напротив прямого угла C.'),rightDiagram(a,b)),
   recognize_legs:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('В треугольнике '+p+q+r+' угол при '+q+' прямой. Какие стороны — катеты?',p+q+' и '+q+r,[p+q+' и '+p+r,p+r+' и '+q+r],'Катеты образуют прямой угол.');
   },
   calculate_missing_acute_angle:({a,b})=>['Острый угол прямоугольного треугольника '+(21+a+b)+'°. Найди второй острый угол.',69-a-b,'Два острых угла в сумме дают 90°.'],
   identify_longest_side:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('В треугольнике '+p+q+r+' угол при '+p+' равен 90°. Какая сторона самая длинная?',q+r,[p+q,p+r],'Напротив наибольшего угла лежит наибольшая сторона.');
   }
  },
  {
   difference_between_acute_angles:({a,b})=>{
    const delta=2*(a+b);
    return ['Острые углы прямоугольного треугольника отличаются на '+delta+'°. Найди меньший угол.',45-a-b,'Из суммы 90° вычитаем разность, затем делим пополам.'];
   },
   validate_acute_pair:({a,b})=>{
    const A=27+a,B=90-A+(b%3-1);
    return checkStatement('Могут ли '+A+'° и '+B+'° быть острыми углами одного прямоугольного треугольника?',A+B===90,'Их сумма '+(A+B)+'°. Для прямоугольного треугольника нужна сумма 90°.');
   },
   equal_legs_give_equal_angles:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return ['В треугольнике '+p+q+r+' угол '+q+' прямой, катеты '+p+q+' и '+q+r+' равны. Найди ∠'+p+'.',45,'Острые углы равны, а их сумма 90°.'];
   },
   exterior_at_acute_vertex:({a,b})=>{
    const A=26+a+b;
    return ['В ABC угол C прямой, угол A равен '+A+'°. Найди внешний угол при B.',90+A,'Внешний угол при B равен сумме ∠A и ∠C.'];
   }
  },
  {
   acute_angle_ratio:({a,b})=>{
    const k=a%6+2;
    return ['Отношение острых углов прямоугольного треугольника 1 : '+k+'. Найди больший угол в градусах.',rational(90*k,k+1),'На '+(k+1)+' частей приходится 90°. Большему углу соответствуют '+k+' частей.'];
   },
   equation_from_complementary_angles:({a,b})=>{
    const x=8+a,offset=90-3*x-b;
    return ['Острые углы прямоугольного треугольника равны (x + '+b+')° и (2x + '+offset+')°. Найди x.',x,'Сумма углов 90°. Решаем '+sum('3x',offset+b)+' = 90.'];
   },
   infer_legs_order_from_exterior:({a,b})=>{
    const A=22+a+b,B=90-A;
    return withVisual(choice('Внешний угол при A равен '+(180-A)+'°. Как соотносятся катеты AC и BC?',A>B?'AC &lt; BC':A<B?'AC > BC':'AC = BC',
     ['AC &lt; BC','AC > BC','AC = BC'].filter(item=>item!==(A>B?'AC &lt; BC':A<B?'AC > BC':'AC = BC')),
     '∠A = '+A+'°, ∠B = '+B+'°. Сравниваем стороны, лежащие напротив этих углов.'),labelledTriangleDiagram(A,B,90,'C'));
   },
   use_split_right_angle:({a,b})=>{
    const A=28+a+b;
    return ['Из C прямоугольного треугольника ABC опущена высота CH на гипотенузу AB. Если ∠A = '+A+'°, чему равен ∠BCH?',A,
     'Угол B равен '+(90-A)+'°. В прямоугольном треугольнике BCH его дополняет до 90° угол BCH.'];
   }
  }
 ],
 geo_right_triangle_30deg:[
  {
   half_of_hypotenuse:({a,b})=>['Гипотенуза прямоугольного треугольника равна '+2*(a+b)+' см. Найди катет напротив угла 30°.',a+b,'Этот катет равен половине гипотенузы.'],
   double_the_leg:({a,b})=>['Катет напротив угла 30° равен '+(a+b)+' см. Найди гипотенузу.',2*(a+b),'Удваиваем длину катета.'],
   choose_opposite_leg:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('В '+p+q+r+' угол '+r+' прямой, угол '+p+' равен 30°. Какой катет равен половине гипотенузы?',q+r,[p+r,p+q],'Искомый катет лежит напротив угла '+p+'.');
   },
   recognize_angle_from_half:({a,b})=>['Гипотенуза равна '+2*a+' см, катет равен '+a+' см. Найди угол напротив этого катета.',30,'Катет равен половине гипотенузы. Напротив него угол 30°.']
  },
  {
   find_short_leg_from_other_acute:({a,b})=>['Один острый угол равен 60°, гипотенуза равна '+(2*a+b)+' см. Найди меньший катет в сантиметрах.',rational(2*a+b,2),'Второй угол равен 30°. Против него лежит половина гипотенузы.'],
   restore_lengths_from_difference:({a,b})=>['Гипотенуза на '+(a+b)+' см длиннее катета напротив угла 30°. Найди гипотенузу.',2*(a+b),'Гипотенуза состоит из двух длин этого катета, поэтому разность равна длине катета.'],
   angle_next_to_half_leg:({a,b})=>['Гипотенуза '+2*(a+b)+' см, один катет '+(a+b)+' см. Найди острый угол, прилежащий к этому катету.',60,'Напротив катета угол 30°, а второй острый угол равен 60°.'],
   compare_leg_lengths_without_squaring:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('В '+p+q+r+' угол '+r+' прямой. Сторона '+p+r+' вдвое короче гипотенузы. Какой угол 60°?', '∠'+p,['∠'+q,'∠'+r],'Напротив '+p+r+' расположен угол '+q+', равный 30°. Второй острый угол '+p+' равен 60°.');
   }
  },
  {
   solve_from_sum_of_short_leg_and_hypotenuse:({a,b})=>{
    const x=a+b;
    return ['Гипотенуза и катет напротив 30° вместе составляют '+3*x+' см. Найди гипотенузу.',2*x,'Катет составляет одну часть, гипотенуза две. Делим сумму на 3 и умножаем на 2.'];
   },
   recover_equality_from_linear_expressions:({a,b})=>{
    const x=a+b,k=16+b;
    return ['Катет напротив 30° равен x + '+k+' см, гипотенуза равна 3x + '+(2*k-x)+' см. Найди x.',x,'Удваиваем катет: 2(x + '+k+') = 3x + '+(2*k-x)+'. Отсюда x = '+x+'.'];
   },
   angle_from_exterior_then_half:({a,b})=>['В ABC угол C прямой. Внешний угол при A равен 120°, AB = '+2*(a+b)+' см. Найди AC.',a+b,'∠A = 60°, а ∠B = 30°. Напротив ∠B катет AC, равный половине AB.'],
   compare_short_legs_from_two_triangles:({a,b})=>['В двух прямоугольных треугольниках есть угол 30°. Гипотенуза второго на '+2*(a+b)+' см длиннее гипотенузы первого. На сколько сантиметров длиннее меньший катет второго?',a+b,'Меньший катет у каждого равен половине гипотенузы, значит разность длин катетов вдвое меньше.']
  }
 ],
 geo_right_triangle_congruence:[
  {
   both_legs_given:({a,b})=>rightCongruence('У обоих прямоугольных треугольников катеты '+a+' и '+(a+b)+' см. По каким данным применяют признак?',0,'Попарно равны катеты двух треугольников.'),
   hypotenuse_and_leg_given:({a,b})=>rightCongruence('В обоих прямоугольных треугольниках катет '+a+' см, гипотенуза '+(a+b)+' см. Какой признак применим?',1,'Известны равные гипотенузы и соответствующие катеты.'),
   hypotenuse_and_angle_given:({a,b})=>rightCongruence('В двух прямоугольных треугольниках гипотенузы равны '+(a+b)+' см и в каждом есть угол '+(30+a)+'°. Какой признак применим?',2,'Гипотенузы и два соответствующих острых угла равны.'),
   leg_and_adjacent_angle_given:({a,b})=>rightCongruence('У двух прямоугольных треугольников совпадают катет '+(a+b)+' см и острый угол '+(30+a)+'°, прилежащий к этому катету. Какой признак применим?',3,'Дан катет и одинаковый по положению острый угол.')
  },
  {
   match_marks_before_proof:({a,b})=>{
    const x=a+b;
    return rightCongruence('На чертеже AB = DE = '+x+' см. Какие данные с отметок дают равенство треугольников?',1,'Отмечены равные гипотенузы AB и DE и катеты AC и DF.','R-hyp-leg');
   },
   compare_using_complement:({a,b})=>{
    const x=28+a+b;
    return rightCongruence('Гипотенузы двух прямоугольных треугольников равны. В первом острый угол '+x+'°, во втором '+(90-x)+'°. По какому признаку они равны?',2,'В обоих треугольниках есть угол '+x+'°: во втором это дополнение указанного угла до 90°.');
   },
   detect_only_hypotenuse:({a,b})=>checkStatement('У двух прямоугольных треугольников гипотенузы по '+(a+b)+' см. Прочих данных нет. Обязаны ли треугольники быть равными?',false,'Одинаковая гипотенуза допускает разные острые углы и разные катеты.'),
   transfer_corresponding_side:({a,b})=>{
    const [A,B,C,D,E,F]=Array.from({length:6},(_,i)=>geometryLetters[(a+b+i)%geometryLetters.length]);
    return ['Равные прямоугольные треугольники записаны как '+A+B+C+' и '+D+E+F+' в порядке соответствия вершин. '+B+C+' = '+(a+b)+' см. Найди '+E+F+'.',a+b,'Вершины '+B+' и '+C+' соответствуют '+E+' и '+F+'. Длины соответствующих сторон равны.'];
   }
  },
  {
   establish_missing_with_thirty_degrees:({a,b})=>{
    const x=a+b;
    return rightCongruence('У двух прямоугольных треугольников гипотенузы равны '+2*x+' см. У первого есть угол 30°, во втором меньшее из двух катетов равно '+x+' см. Какой признак можно применить, предварительно найдя меньший катет первого?',1,'Меньший катет первого тоже равен половине гипотенузы. Получаем равные гипотенузы и катеты.');
   },
   shared_hypotenuse_and_two_legs:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return rightCongruence('У прямоугольных '+p+r+q+' и '+p+s+q+' общая гипотенуза '+p+q+'. '+p+r+' = '+p+s+'. Какой признак использует общую сторону?',1,'Общая сторона — гипотенуза, а указанные равные стороны — катеты.');
   },
   identify_mismatched_acute_angle:({a,b})=>{
    const angle=31+a%9;
    return checkStatement('В одном прямоугольном треугольнике катет '+(a+b)+' см прилежит к углу '+angle+'°, во втором такой же катет лежит напротив угла '+angle+'°. Можно ли считать данные катеты соответствующими относительно равных углов?',false,'Относительно данного острого угла один катет прилежащий, другой противолежащий. Острые углы различны.');
   },
   use_angles_and_perimeters:({a,b})=>{
    const angle=32+a%9,length=a+b;
    return ['Два прямоугольных треугольника имеют равные гипотенузы и по острому углу '+angle+'°. Периметр первого '+(3*length+2)+' см. Найди периметр второго.',3*length+2,'Треугольники равны по гипотенузе и острому углу, поэтому суммы длин соответствующих сторон равны.'];
   }
  }
 ]
});

Object.assign(reviewedLessons,{
 geo_perpendicular_oblique_distances:'Расстояние от точки до прямой — длина перпендикуляра из этой точки. Перпендикуляр короче любой наклонной. Расстояние между параллельными прямыми измеряют по общему перпендикуляру. Оно одинаково по всей длине прямых.',
 geo_constructions_triangles:'При построении по трём сторонам найди третью вершину пересечением двух окружностей. При построении по двум сторонам и углу откладывай угол между ними. При построении по стороне и двум прилежащим углам проверь, что их сумма меньше 180°.',
 geo_angle_bisector_locus:'Любая точка биссектрисы угла равноудалена от его сторон. И наоборот, если точка внутри угла одинаково удалена от сторон, она лежит на его биссектрисе. Расстояния измеряют по перпендикулярам.',
 geo_locus_points:'Геометрическое место точек содержит все точки с указанным свойством. При проверке покажи, что каждая точка фигуры обладает свойством и любая точка с этим свойством принадлежит фигуре.'
});

Object.assign(reviewed.geo_perpendicular_oblique_distances[1],{
 perpendicular_relation:({a,b})=>{
  const [p,q,r,s]=geometryLabels(a,b),height=a+b;
  return ['Отрезки '+p+q+' и '+r+s+' перпендикулярны параллельным прямым a и b и соединяют их. '+p+q+' = '+height+' см. Найди '+r+s+'.',
   height,'Расстояние между параллельными прямыми одинаково в любой точке. Длины общих перпендикуляров равны.'];
 }
});
Object.assign(reviewed.geo_perpendicular_oblique_distances[2],{
 perpendicular_foot_from_shared_line:({a,b})=>{
  const delta=a+b;
  return ['Параллельные прямые a и b находятся на расстоянии '+a+' см. Точка P и прямая b находятся по разные стороны от a. Расстояние от P до b равно '+delta+' см. Найди расстояние от P до a.',
   delta-a,'Перпендикуляр от P до b пересекает a, поэтому расстояние от P до a равно '+delta+' − '+a+' = '+(delta-a)+' см.'];
 }
});

Object.assign(reviewed,{
 geo_constructions_triangles:[
  {
   choose_compass_centers:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Построение '+p+q+r+' по трём сторонам начинается с отрезка '+p+q+'. Где центры дуг для поиска вершины '+r+'?',p+' и '+q,
     [p+' и '+r,q+' и '+r,'В середине '+p+q],'Дуги откладывают расстояния от '+p+' и '+q+'. Их общая точка станет вершиной '+r+'.');
   },
   choose_triangle_given_elements:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Даны сторона '+p+q+' и углы при '+p+' и '+q+'. Как построить третью вершину?',
     'В пересечении лучей из концов стороны',['На середине стороны','Циркулем взять два одинаковых произвольных радиуса','Провести один луч из '+p],
     'Углы задают лучи из обоих концов стороны в одной полуплоскости. Их пересечение даёт третью вершину.');
   },
   select_angle_for_sas:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Треугольник строят по отрезкам '+p+q+' и '+p+r+' и углу между ними. Какой угол нужно отложить?',
     '∠'+q+p+r,['∠'+p+q+r,'∠'+p+r+q,'Любой острый угол'],'Общая вершина сторон — '+p+'. Она стоит в середине обозначения угла.');
   },
   verify_short_compass_opening:({a,b})=>enoughTriangleData(a,a+b,b)
  },
  {
   feasible_asa_angle:({a,b})=>{
    const x=53+a,y=49+b;
    return ['Построение по стороне и прилежащим углам '+x+'° и '+y+'° выполнимо. Найди угол при третьей вершине.',180-x-y,
     'Лучам удастся пересечься, потому что сумма известных углов меньше 180°. Третий угол равен 180° − '+x+'° − '+y+'°.'];
   },
   choose_missing_radius_for_perimeter:({a,b})=>{
    const base=a+b,other=base+2,missing=base+1;
    return ['Для построения по трём сторонам основание '+base+' см, одна дуга имеет радиус '+other+' см. Периметр будущего треугольника '+(base+other+missing)+' см. Найди радиус второй дуги.',
     missing,'Периметр — сумма основания и двух радиусов. Вычитаем '+base+' см и '+other+' см.'];
   },
   number_of_reflected_vertices:({a,b})=>['Отрезок AB = '+(a+b)+' см взят за основание. Из A и B проведены окружности радиусов '+(a+b+1)+' и '+(a+b+2)+' см. Сколько точек можно выбрать третьей вершиной, если подходят обе стороны от AB?',2,
    'Окружности пересекаются в двух точках, симметричных относительно AB. Неравенство треугольника выполняется строго.'],
   detect_wrong_ray_side:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return checkStatement('Для построения '+p+q+r+' по стороне '+p+q+' и углам при её концах лучи отложили по разные стороны от '+p+q+'. Можно ли получить пересечением этих лучей третью вершину?',false,
     'Луч из каждого конца должен уходить в одну и ту же полуплоскость относительно основания.');
   }
  },
  {
   count_allowed_third_integer_length:({a,b})=>['Фиксированы стороны '+a+' см и '+(a+b)+' см. Для скольких целых значений третьей стороны получится построить настоящий треугольник?',2*a-1,
    'Дуги пересекаются в двух точках, если третья сторона строго между '+b+' и '+(2*a+b)+' см. Внутри '+(2*a-1)+' целых значений.'],
   check_largest_allowed_asa_integer:({a,b})=>{
    const x=64+a+b;
    return ['Дано основание и прилежащий угол '+x+'°. Каков наибольший целый прилежащий угол у другого конца, при котором лучи пересекутся и образуют треугольник?',179-x,
     'Сумма двух углов строго меньше 180°. Наибольшее целое значение равно '+(180-x)+' − 1.'];
   },
   select_sound_uniqueness_argument:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Даны три длины сторон. На каждой стороне от '+p+q+' построили по треугольнику '+p+q+r+'. Почему они равны?',
     'У них попарно равны три стороны',['Их третьи вершины совпадают','У них общее основание, и этого всегда достаточно','Все треугольники с этим основанием равны'],
     'Соответствующие длины заданы одним набором. Это третий признак равенства.');
   },
   compare_two_asa_conditions:({a,b})=>{
    const x=126+a,y=180-x;
    return choice('Заданы основание и угол '+x+'° при одном конце. Для какого из указанных углов у другого конца построение возможно?',(y-1)+'°',
     [y+'°',(y+1)+'°',(y+b)+'°'],'При '+(y-1)+'° сумма углов 179°. Лучи пересекаются. При 180° или больше треугольник не получается.');
   }
  }
 ],
 geo_angle_bisector_locus:[
  {
   infer_equal_perpendiculars:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice(p+' лежит на биссектрисе. '+p+q+' и '+p+r+' — перпендикуляры к сторонам угла. Что обязательно верно?',
     p+q+' = '+p+r,[p+q+' > '+p+r,p+q+' < '+p+r,p+q+' ⟂ '+p+r],
     'Перпендикуляры измеряют равные расстояния до сторон угла.');
   },
   copy_distance_to_other_side:({a,b})=>['Расстояние от точки на биссектрисе до первой стороны '+(a+b)+' см. Чему равно расстояние до второй?',a+b,
    'Точка биссектрисы одинаково удалена от сторон угла.'],
   recognize_locus_in_given_angle:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Точка '+s+' внутри ∠'+p+q+r+' равноудалена от его сторон. Где она лежит?',
     'На биссектрисе ∠'+p+q+r,['На луче '+q+p,'На луче '+q+r,'На отрезке '+p+r+' обязательно'],
     'Внутри угла все точки с равными расстояниями до сторон лежат на биссектрисе.');
   },
   choose_what_distance_means:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Как измеряют расстояние от '+p+' до прямой '+q+r+', содержащей сторону угла?',
     'По перпендикуляру из '+p,['По наклонной из '+p,'Только до вершины угла','По лучу, параллельному '+q+r],
     'Расстояние от точки до прямой — длина перпендикуляра.');
   }
  },
  {
   derive_from_sum_of_distances:({a,b})=>['Точка лежит на биссектрисе. Сумма её расстояний до сторон угла '+2*(a+b)+' см. Чему равно одно расстояние?',a+b,
    'Расстояния одинаковы, делим сумму на 2.'],
   select_qualifying_point:({a,b})=>{
    const x=a+b;
    return choice('Все четыре точки внутри угла. Для какой пары расстояний до сторон точка лежит на биссектрисе?',
     x+' см и '+x+' см',[x+' см и '+(x+1)+' см',(x-1)+' см и '+x+' см',(x+1)+' см и '+(x+2)+' см'],
     'На биссектрисе обе длины перпендикуляров одинаковы.');
   },
   identify_unequal_from_given_expressions:({a,b})=>{
    const x=a+b,y=x+(b%3-1);
    return checkStatement('Расстояния от точки внутри угла до его сторон равны '+x+' см и '+y+' см. Она лежит на биссектрисе?',x===y,
     x===y?'При равных расстояниях точка лежит на биссектрисе.':'При разных расстояниях точка не лежит на биссектрисе.');
   },
   compare_distance_sums_of_two_points:({a,b})=>['Обе точки на биссектрисе угла. Одна удалена от его стороны на '+a+' см, другая на '+(a+b)+' см. На сколько сумма расстояний до двух сторон у второй больше?',2*b,
    'У каждой точки сумма — удвоенное расстояние до одной стороны. Удваиваем разность '+b+' см.']
  },
  {
   solve_parameter_by_equal_distances:({a,b})=>{
    const x=a+b,k=30+b;
    return ['Точка внутри угла на биссектрисе. Расстояния до сторон равны x + '+k+' и 2x + '+(k-x)+' см. Найди x.',x,
     'Приравниваем длины перпендикуляров, вычитаем x и получаем '+k+' − '+(k-x)+' = '+x+'.'];
   },
   prove_with_hypotenuse_and_leg:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Из точки '+p+' внутри угла с вершиной '+q+' опущены равные перпендикуляры '+p+r+' и '+p+s+'. Какой признак доказывает равенство двух прямоугольных треугольников?',
     'По общей гипотенузе '+p+q+' и равным катетам',['По двум равным острым углам без сторон','По одному прямому углу','По двум катетам, оба заданы в условии'],
     'У треугольников общая гипотенуза '+p+q+' и равные катеты '+p+r+' и '+p+s+'. Поэтому углы при '+q+' равны.');
   },
   rule_out_exterior_points:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Ищем внутреннюю биссектрису ∠'+p+q+r+'. Для точки '+s+' известны равные расстояния до прямых, содержащих стороны. Какое условие ещё нужно, чтобы применить обратную теорему?',
     s+' находится внутри угла',['Угол обязан быть прямым','Расстояния равны 1 см',s+' лежит на стороне угла'],
     'Теорема относится к точкам внутри данного угла. Точки вне угла могут быть равноудалены от обеих прямых.');
   },
   angle_from_equal_distances:({a,b})=>{
    const angle=34+a+b,[p,q,r,s]=geometryLabels(a,b);
    return ['Точка '+s+' внутри ∠'+p+q+r+' и одинаково удалена от его сторон. ∠'+p+q+s+' = '+angle+'°. Найди ∠'+p+q+r+'.',2*angle,
     'Луч '+q+s+' — биссектриса. Полный угол равен двум одинаковым частям.'];
   }
  }
 ],
 geo_locus_points:[
  {
   points_at_fixed_distance:({a,b})=>choice('Какую фигуру образуют точки на расстоянии ровно '+(a+b)+' см от O?','Окружность с центром O',
    ['Круг с центром O','Прямую через O','Луч из O'],'Все точки окружности находятся на одном расстоянии от центра.'),
   points_within_radius:({a,b})=>choice('Какую фигуру образуют точки на расстоянии не больше '+(a+b)+' см от O?','Круг с центром O вместе с границей',
    ['Только окружность','Одна точка O','Все точки вне окружности'],'Условие включает точки внутри окружности и на её границе.'),
   points_equidistant_from_endpoints:({a,b})=>{
    const [p,q]=geometryLabels(a,b);
    return choice('Какое множество образуют все точки, одинаково удалённые от '+p+' и '+q+'?', 'Серединный перпендикуляр к '+p+q,
     ['Весь отрезок '+p+q,'Окружность с центром '+p,'Прямая '+p+q],'У каждой такой точки равны расстояния до концов отрезка.');
   },
   points_with_zero_distance:({a,b})=>{
    const [p,q]=geometryLabels(a,b);
    return choice('Какие точки находятся на расстоянии 0 от прямой '+p+q+'?', 'Все точки самой прямой '+p+q,
     ['Только '+p,'Только '+q,'Точки ровно двух параллельных'],'Нулевое расстояние означает принадлежность прямой.');
   }
  },
  {
   identify_two_parallel_loci:({a,b})=>['Точки удалены от прямой a ровно на '+(a+b)+' см. Из скольких прямых состоит это множество?',2,
    'По одной параллельной на заданном расстоянии с каждой стороны от a.'],
   recognize_band_without_borders:({a,b})=>choice('Какие точки удалены от a строго меньше чем на '+(a+b)+' см?',
    'Внутренность полосы между двумя параллельными границами',['Только две границы полосы','Точки одной окружности','Только точки исходной прямой'],
    'Можно отойти от a в обе стороны на любое расстояние меньше заданного.'),
   test_circle_membership:({a,b})=>checkStatement('Точка O — центр окружности радиуса '+(a+b)+' см. Точка A находится на расстоянии '+a+' см от O. Лежит ли A на окружности?',false,
    'Для принадлежности окружности расстояние до центра должно равняться радиусу.'),
   test_found_figure_reverse_direction:({a,b})=>{
    const [p,q]=geometryLabels(a,b);
    return choice('Для ГМТ равноудалённых от '+p+' и '+q+' уже доказано, что каждая точка на предложенной прямой подходит. Что ещё необходимо?',
     'Доказать, что любая равноудалённая точка лежит на предложенной прямой',['Найти только одну подходящую точку','Доказать, что все точки плоскости лежат на прямой','Подставить случайное число вместо расстояния'],
     'Первый шаг исключает лишние точки, второй исключает пропущенные.');
   }
  },
  {
   intersect_two_distance_conditions:({a,b})=>{
    const x=a+b;
    return ['Отрезок AB имеет длину '+2*x+' см. Найди число точек M, для которых MA = MB = '+(x+1)+' см.',2,
     'Окружности с одинаковым радиусом и центрами A и B пересекаются дважды, потому что 0 < AB < '+2*(x+1)+' см.'];
   },
   count_single_point_of_contact:({a,b})=>{
    const x=a+b;
    return ['Отрезок AB имеет длину '+2*x+' см. Сколько точек одинаково удалены от A и B на '+x+' см?',1,
     'Две окружности касаются в середине AB. Сумма радиусов равна AB.'];
   },
   find_two_conditions_on_line:({a,b})=>{
    const x=a+b;
    return ['Точка O лежит на прямой a. Сколько точек на a удалены от O ровно на '+x+' см и при этом находятся по одну заданную сторону от O?',1,
     'На прямой две точки на заданном расстоянии. Указанная сторона от O оставляет одну.'];
   },
   rule_out_nonintersecting_loci:({a,b})=>{
    const x=a+b;
    return ['Две точки A и B на расстоянии '+(2*x+1)+' см. Сколько точек M одновременно находятся на расстоянии '+x+' см от A и '+x+' см от B?',0,
     'Сумма двух заданных расстояний меньше AB. Окружности не пересекаются.'];
   }
  }
 ]
});

Object.assign(reviewedLessons,{
 geo_perpendicular_bisector_locus:'Серединный перпендикуляр проходит через середину отрезка под углом 90°. Точка лежит на нём тогда и только тогда, когда равноудалена от обоих концов отрезка.',
 geo_chord_properties:'Диаметр — самая длинная хорда. Если диаметр перпендикулярен хорде, он делит её пополам. Прямая через центр и середину хорды, не проходящей через центр, перпендикулярна этой хорде.',
 geo_line_circle_tangent_secant:'Сравни расстояние d от центра до прямой с радиусом r. При d < r есть две общие точки, при d = r одна, при d > r общих точек нет. Радиус, проведённый в точку касания, перпендикулярен касательной.',
 geo_circle_inscribed_in_angle:'Центр окружности, касающейся сторон угла, лежит на его биссектрисе. Отрезки обеих касательных из вершины до точек касания равны. Радиусы в точках касания перпендикулярны сторонам.'
});
function interpretCircleLine(radius,distance){
 return distance===radius?'Касательная':distance<radius?'Секущая':'Прямая без общих точек';
}
const circleLineNames=['Касательная','Секущая','Прямая без общих точек'];
Object.assign(reviewed,{
 geo_perpendicular_bisector_locus:[
  {
   define_middle_and_right_angle:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Какая прямая является серединным перпендикуляром к '+p+q+'?',
     'Перпендикуляр через середину '+p+q,['Любая линия через '+p,'Любая прямая через середину '+p+q,'Параллельная '+p+q+' через '+r],
     'Нужны оба свойства: прямая проходит через середину и образует угол 90° с отрезком.');
   },
   match_distance_from_given_point:({a,b})=>['Точка M на серединном перпендикуляре к AB. MA = '+(a+b)+' см. Найди MB.',a+b,
    'У точки на этой прямой расстояния до концов отрезка равны.'],
   place_point_via_inverse_theorem:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b),x=a+b;
    return choice(p+r+' = '+q+r+' = '+x+' см. На какой прямой находится '+r+'?',
     'На серединном перпендикуляре к '+p+q,['Обязательно на '+p+q,'На касательной к отрезку '+p+q,'На параллельной '+p+q+' через его середину'],
     'Расстояния до концов '+p+' и '+q+' равны, поэтому действует обратное утверждение.');
   },
   get_half_from_midpoint:({a,b})=>['Серединный перпендикуляр пересекает отрезок AB длиной '+2*(a+b)+' см в H. Найди AH.',a+b,
    'H — середина AB, поэтому AH равно половине AB.']
  },
  {
   compare_sums_for_two_equidistant_points:({a,b})=>['M и N лежат на серединном перпендикуляре к AB. MA = '+a+' см, NA = '+(a+b)+' см. На сколько сумма NA + NB больше MA + MB?',2*b,
    'Обе суммы удвоены: 2 · '+(a+b)+' − 2 · '+a+' = '+2*b+'.'],
   find_equal_pair_with_perimeter:({a,b})=>{
    const equal=a+b,base=2*a;
    return ['M лежит на серединном перпендикуляре к AB. Периметр треугольника MAB '+(2*equal+base)+' см, AB = '+base+' см. Найди MA.',equal,
     'MA = MB. Вычитаем основание из периметра и делим остаток пополам.'];
   },
   reject_unequal_lengths:({a,b})=>{
    const x=a+b,y=x+(b%3-1);
    return checkStatement('MA = '+x+' см, MB = '+y+' см. Лежит ли M на серединном перпендикуляре к AB?',x===y,
     'Принадлежность равносильна равенству MA и MB. В условии длины '+(x===y?'равны.':'различны.'));
   },
   identify_intersection_of_perpendicular_and_segment:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b),x=a+b;
    return choice('Точки '+r+' и '+s+' различны и каждая равноудалена от '+p+' и '+q+'. Отрезок '+p+q+' имеет длину '+2*x+' см. Где прямая '+r+s+' пересекает '+p+q+'?',
     'На расстоянии '+x+' см от обоих концов',['В '+p,'В '+q,'Пересечения нет'],
     'Прямая через две равноудалённые точки совпадает с серединным перпендикуляром.');
   }
  },
  {
   set_up_equality_with_algebra:({a,b})=>{
    const x=a+b,c=30+b;
    return ['M лежит на серединном перпендикуляре к AB. MA = x + '+c+' см, MB = 2x + '+(c-x)+' см. Найди x.',x,'Приравниваем MA и MB. Вычитаем x и получаем x = '+c+' − '+(c-x)+'.'];
   },
   count_qualified_points_on_circle:({a,b})=>{
    const x=a+b;
    return ['AB = '+2*x+' см. Сколько точек на серединном перпендикуляре к AB удалены от A ровно на '+(x+2)+' см?',2,
     'Окружность с центром A и радиусом '+(x+2)+' см пересекает прямую дважды: середина AB удалена от A только на '+x+' см.'];
   },
   prove_perpendicular_from_two_points:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice(r+p+' = '+r+q+', '+s+p+' = '+s+q+'. Как расположены прямые '+r+s+' и '+p+q+'?',
     'Перпендикулярны, пересекаются в середине '+p+q,['Параллельны','Совпадают','Пересекаются обязательно в '+p],
     'Обе точки '+r+' и '+s+' принадлежат серединному перпендикуляру к '+p+q+'.');
   },
   locate_unique_closest_point:({a,b})=>{
    const x=a+b;
    return ['AB = '+2*x+' см. Найди наименьшее расстояние от A до точки на серединном перпендикуляре к AB.',x,
     'Кратчайший отрезок из A к прямой перпендикулярен этой прямой. Он оканчивается в середине AB.'];
   }
  }
 ],
 geo_chord_properties:[
  {
   name_largest_chord:({a,b})=>choice('Радиус окружности '+(a+b)+' см. Как называется её самая длинная хорда?','Диаметр',['Радиус','Касательная','Наклонная'],
    'У диаметра оба конца на окружности и он проходит через центр.'),
   half_chord_under_diameter:({a,b})=>['Диаметр пересекает хорду AB длиной '+2*(a+b)+' см под прямым углом в H. Найди AH.',a+b,'Перпендикулярный к хорде диаметр делит её пополам.'],
   compare_length_with_diameter:({a,b})=>{
    const radius=a+b,n=2*radius+(b%3-1);
    return checkStatement('При радиусе '+radius+' см может ли длина хорды равняться '+n+' см?',n<=2*radius,
     'Наибольшая длина хорды равна диаметру '+2*radius+' см.');
   },
   choose_center_and_midpoint_property:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice(p+' — центр окружности. '+s+' — середина хорды '+q+r+', не проходящей через центр. Что следует?',
     p+s+' ⟂ '+q+r,[p+s+' ∥ '+q+r,p+s+' = '+q+r,q+r+' — диаметр'],
     'Прямая из центра в середину такой хорды перпендикулярна хорде.');
   }
  },
  {
   recover_chord_from_half:({a,b})=>['Перпендикуляр из O к хорде AB пересекает её в H. AH = '+(a+b)+' см. Найди AB.',2*(a+b),'Точка H — середина хорды. Удваиваем AH.'],
   compare_equal_distance_chords:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b),x=a+b;
    return choice('В одной окружности хорды '+p+q+' и '+r+s+' удалены от центра на '+x+' см. Как соотносятся хорды?',
     'Равны',[p+q+' длиннее '+r+s,r+s+' длиннее '+p+q,'Обязательно обе — диаметры'],
     'Половины хорд — катеты равных прямоугольных треугольников с одним и тем же радиусом и одинаковыми перпендикулярами.');
   },
   find_line_with_midpoint_and_center:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Две дуги равного радиуса из концов '+p+q+' пересеклись в '+r+' и '+s+'. Через какую прямую проходит центр любой окружности, для которой '+p+q+' — хорда?',
     r+s,[p+q,p+r,q+s],'Прямая '+r+s+' — серединный перпендикуляр к хорде. Центр равноудалён от её концов.');
   },
   infer_equality_of_parts:({a,b})=>{
    const x=a+b;
    return ['OH ⟂ AB, O — центр окружности, H лежит на хорде AB. Сумма AH + HB равна '+2*x+' см. Найди HB.',x,
     'OH перпендикулярен хорде, поэтому OH проходит через её середину.'];
   }
  },
  {
   solve_length_equation_on_half_chord:({a,b})=>{
    const x=a+b,c=29+b;
    return ['Перпендикуляр из центра пересёк хорду в H. AH = x + '+c+' см и HB = 2x + '+(c-x)+' см. Найди x.',x,
     'H делит хорду пополам. Приравниваем выражения и получаем x = '+x+'.'];
   },
   prove_chord_halves_using_right_triangles:({a,b})=>{
    const [o,p,q,h]=geometryLabels(a,b);
    return choice(o+' — центр окружности. '+o+h+' — перпендикуляр к хорде '+p+q+'. По каким элементам равны прямоугольные треугольники '+o+h+p+' и '+o+h+q+'?',
     'Равные гипотенузы-радиусы и общий катет '+o+h,['Только общий прямой угол','Два общих катета','Только равенство гипотенуз'],
     'Радиусы '+o+p+' и '+o+q+' равны. Сторона '+o+h+' общая. Равенство треугольников даёт равенство половин хорды.');
   },
   derive_center_line_from_two_chords:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Где искать центр окружности, содержащей концы двух непараллельных хорд '+p+q+' и '+r+s+'?',
     'В пересечении серединных перпендикуляров к этим хордам',['В пересечении самих хорд','В середине любой хорды','В точке '+p],
     'Центр равноудалён от двух концов каждой хорды, поэтому принадлежит обеим прямым.');
   },
   reconstruct_diameter_from_radius_gap:({a,b})=>{
    const r=a+b;
    return ['Хорда равна '+2*a+' см и на '+2*b+' см короче диаметра. Найди длину радиуса.',r,
     'Диаметр равен '+2*a+' + '+2*b+' = '+2*r+' см. Делим пополам.'];
   }
  }
 ],
 geo_line_circle_tangent_secant:[
  {
   classify_tangent_from_equal_distance:({a,b})=>{
    const r=a+b;
    return ['Расстояние от центра до прямой и радиус равны '+r+' см. Сколько общих точек у прямой и окружности?',1,'Расстояние равно радиусу, значит прямая касается окружности.'];
   },
   classify_secant_from_smaller_distance:({a,b})=>{
    const r=a+b;
    return ['Радиус '+r+' см, расстояние от центра до прямой '+a+' см. Сколько точек пересечения?',2,'Прямая проходит ближе к центру, чем окружность, и пересекает её дважды.'];
   },
   classify_non_intersection:({a,b})=>['Радиус '+a+' см, расстояние от центра до прямой '+(a+b)+' см. Сколько общих точек?',0,'Ближайшая точка прямой дальше от центра, чем радиус.'],
   find_tangent_radius_angle:({a,b})=>{
    const [o,p,q]=geometryLabels(a,b);
    return ['Прямая '+p+q+' касается окружности с центром '+o+' в точке '+p+'. Найди ∠'+o+p+q+'.',90,'Радиус в точку касания перпендикулярен касательной.'];
   }
  },
  {
   classify_line_given_diameter:({a,b})=>{
    const r=a+b,d=r+(a%3-1),label=interpretCircleLine(r,d);
    return choice('Диаметр окружности '+2*r+' см. Расстояние от центра до прямой '+d+' см. Какая это прямая?',label,
     circleLineNames.filter(item=>item!==label),'Радиус '+r+' см. Сопоставляем расстояние '+d+' см и радиус.');
   },
   identify_touch_under_radius_normal:({a,b})=>{
    const [o,p,q]=geometryLabels(a,b);
    return checkStatement(p+' лежит на окружности с центром '+o+'. '+o+p+' ⟂ '+p+q+'. Является ли '+p+q+' касательной?',true,
     'Прямая, проведённая через конец радиуса перпендикулярно ему, касается окружности.');
   },
   infer_relation_from_tangent_diagram:({a,b})=>{
    const r=a+b;
    return ['Прямая a на схеме касается окружности. Радиус равен '+r+' см. Чему равно расстояние от O до a?',r,
     'Радиус к точке касания перпендикулярен a и измеряет искомое расстояние.',null,triangleVisual({kind:'g7-line-circle',mode:'tangent'})];
   },
   find_count_across_center:({a,b})=>{
    const [o,p,q]=geometryLabels(a,b);
    return ['Прямая '+p+q+' проходит через центр '+o+' окружности радиуса '+(a+b)+' см. Сколько у неё общих точек с окружностью?',2,
     'Она содержит диаметр. Два конца диаметра принадлежат окружности.'];
   }
  },
  {
   derive_tangency_parameter:({a,b})=>{
    const x=a+b,k=30+b;
    return ['Радиус x + '+k+' см. Расстояние до прямой 2x + '+(k-x)+' см. При каком x прямая касается окружности?',x,
     'При касании расстояние равно радиусу. Вычитаем x и получаем x = '+x+'.'];
   },
   two_tangents_parallel_to_given_line:({a,b})=>{
    const r=a+b;
    return ['Сколько прямых, параллельных данной прямой через центр, могут касаться окружности радиуса '+r+' см?',2,
     'Чтобы касаться окружности, параллельная должна отстоять от центра на '+r+' см. По одной с каждой стороны.'];
   },
   compare_intersections_of_two_parallel_lines:({a,b})=>{
    const r=a+b;
    return ['Параллельные прямые a и b находятся по одну сторону от центра. a касается окружности радиуса '+r+' см, b ближе к центру на '+b+' см. Сколько общих точек у b с окружностью?',2,
     'Расстояние до b равно '+r+' − '+b+' = '+a+' см, что меньше радиуса. b — секущая.'];
   },
   classify_via_diameter_and_excess:({a,b})=>{
    const r=a+b;
    return choice('Диаметр равен '+2*r+' см. Перпендикуляр от центра к прямой на '+a+' см длиннее радиуса. Сколько точек пересечения?','Ни одной',
     ['Одна','Две','Бесконечно много'],'Перпендикуляр длиннее радиуса, поэтому любая точка прямой вне окружности.');
   }
  }
 ],
 geo_circle_inscribed_in_angle:[
  {
   center_position:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Окружность касается обеих сторон ∠'+p+q+r+' изнутри. Где находится её центр?',
     'На биссектрисе угла',['На луче '+q+p,'На луче '+q+r,'Вне угла'],'Расстояния центра до обеих сторон равны одному радиусу.');
   },
   copy_tangent_segment:({a,b})=>['Из одной вершины проведены две касательные к окружности. Первый отрезок до точки касания равен '+(a+b)+' см. Найди второй.',a+b,
    'Отрезки касательных из одной точки до точек касания равны.'],
   tangent_radius_is_normal:({a,b})=>{
    const [o,p,q]=geometryLabels(a,b);
    return ['Касательная '+p+q+' касается в '+p+', '+o+' — центр окружности. Сколько градусов в ∠'+o+p+q+'?',90,'Радиус '+o+p+' перпендикулярен касательной.'];
   },
   find_second_touch_distance:({a,b})=>['Окружность касается обеих сторон угла. Центр удалён от одной стороны на '+(a+b)+' см. Чему равно расстояние до другой стороны?',a+b,'Каждое расстояние равно радиусу окружности.']
  },
  {
   compute_angle_between_side_and_center:({a,b})=>{
    const x=35+a+b;
    return ['Окружность вписана в угол '+2*x+'°. Чему равен угол между стороной и лучом из вершины через центр?',x,'Луч из вершины через центр делит угол пополам.'];
   },
   recover_tangent_segment_from_sum:({a,b})=>['Два отрезка от вершины угла до точек касания в сумме равны '+2*(a+b)+' см. Найди один из них.',a+b,'Отрезки равны. Делим сумму на 2.'],
   angle_between_two_radii_to_tangency:({a,b})=>{
    const x=55+a+b;
    return ['Окружность вписана в угол '+x+'°. Найди меньший угол между радиусами в обе точки касания.',180-x,'Четырёхугольник из вершины, двух точек касания и центра имеет два прямых угла. Остальные в сумме 180°.'];
   },
   find_radius_angle_at_touching_point:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice(s+' — центр окружности, касающейся стороны '+p+q+' в точке '+r+'. Какой отрезок измеряет расстояние от '+s+' до '+p+q+'?',
     s+r,[s+p,s+q,p+q],'Радиус к точке касания лежит на перпендикуляре к стороне.');
   }
  },
  {
   derive_vertex_angle_from_radii:({a,b})=>{
    const x=120-a-b;
    return ['Меньший угол между радиусами к двум точкам касания равен '+x+'°. Найди угол между касательными, внутри которого лежит центр.',180-x,
     'В четырёхугольнике два других угла прямые. Искомый угол равен 180° − '+x+'°.'];
   },
   use_triangle_perimeter_from_tangent_sum:({a,b})=>{
    const length=a+b,r=a;
    return ['Окружность касается сторон угла с вершиной A в P и Q. AP + AQ = '+2*length+' см, радиус '+r+' см. Найди длину ломаной A–P–O, где O — центр.',length+r,
     'AP = AQ, поэтому AP = '+length+' см. OP = '+r+' см. Складываем.'];
   },
   prove_radius_or_center_line:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Окружность с центром '+p+' касается двух сторон угла с вершиной '+q+' в '+r+' и '+s+'. Почему '+q+r+' = '+q+s+'?',
     'У двух прямоугольных треугольников общая гипотенуза '+p+q+' и равные радиусы-катеты',['Радиус равен любой касательной','Точки касания совпадают','Стороны угла параллельны'],
     'Катеты '+p+r+' и '+p+s+' равны как радиусы. Треугольники равны по гипотенузе и катету.');
   },
   infer_tangent_line_distance_from_bisector:({a,b})=>{
    const x=30+a+b;
    return ['Центр лежит на биссектрисе, которая образует со стороной угол '+x+'°. Радиус к точке касания и отрезок от центра до вершины образуют острый угол. Найди его.',90-x,
     'В треугольнике из центра, вершины и точки касания есть прямой угол. Два острых угла дополняют друг друга до 90°.'];
   }
  }
 ]
});

Object.assign(reviewedLessons,{
 geo_incircle_triangle:'Вписанная окружность касается всех сторон треугольника. Её центр — точка пересечения биссектрис. Радиус равен расстоянию от центра до любой стороны.',
 geo_circumcircle_triangle:'Описанная окружность проходит через все вершины треугольника. Её центр — точка пересечения серединных перпендикуляров. В прямоугольном треугольнике центр — середина гипотенузы.',
 geo_axial_symmetry:'Ось симметрии перпендикулярна отрезку между точкой и её отражением и проходит через его середину. Точки самой оси при отражении остаются на месте.',
 geo_axial_symmetry_properties:'Осевая симметрия сохраняет расстояния, величины углов и площади. Если при отражении фигура совпадает с собой, прямая отражения — ось симметрии этой фигуры.',
 geo_broken_line_polygon:'Ломаная состоит из последовательно соединённых отрезков. Её длина — сумма длин звеньев. У многоугольника стороны образуют замкнутую ломаную, а сумма длин сторон равна периметру.',
 geo_polygon_angle_sum_intro:'Из одной вершины выпуклый n-угольник делится диагоналями на n − 2 треугольника. Поэтому сумма его внутренних углов (n − 2) · 180°.'
});
function reflectAcrossAxis(axis,offset,x,y){
 return axis==='x'?{x:2*offset-x,y}:{x,y:2*offset-y};
}
function reflectionInput(prompt,axis,offset,x,y,ex){
 const result=reflectAcrossAxis(axis,offset,x,y);
 return coordinates(prompt,result.x,result.y,ex);
}
function sameFigureRule(kind){
 const axes={'равносторонний треугольник':3,'квадрат':4,'прямоугольник с неравными сторонами':2,'равнобедренный треугольник с неравными основанием и боковой стороной':1};
 return ['Сколько осей симметрии имеет '+kind+'?',axes[kind],'Считаем прямые, при отражении в которых фигура совпадает со своим образом.'];
}
const symmetryKinds=['равносторонний треугольник','квадрат','прямоугольник с неравными сторонами','равнобедренный треугольник с неравными основанием и боковой стороной'];
Object.assign(reviewed,{
 geo_incircle_triangle:[
  {
   find_center_lines:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Какие линии пересекаются в центре вписанной окружности треугольника '+p+q+r+'?','Биссектрисы',['Медианы','Высоты в любом треугольнике','Серединные перпендикуляры'],'Биссектрисы дают точку, равноудалённую от всех сторон.');
   },
   radius_from_center_distance:({a,b})=>['Окружность с центром I вписана в ABC. Расстояние от I до BC равно '+(a+b)+' см. Найди радиус.',a+b,'Перпендикуляр к стороне в точке касания — радиус.'],
   identify_incircle_contact:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Каким должно быть отношение вписанной окружности к сторонам '+p+q+', '+q+r+' и '+p+r+'?','Касаться каждой стороны',['Пересекать каждую сторону в двух точках','Проходить через все вершины','Касаться только одной стороны'],'Вписанная окружность по определению касается всех трёх сторон.');
   },
   read_equal_distance_to_three_sides:({a,b})=>['У вписанной в ABC окружности радиус '+(a+b)+' см. Сумма расстояний от её центра до AB, BC и CA?',3*(a+b),'Каждое расстояние равно одному радиусу.']
  },
  {
   apply_internal_angle_bisector:({a,b})=>{
    const x=27+a+b,[p,q,r,s]=geometryLabels(a,b);
    return ['Точка '+s+' — центр вписанной окружности треугольника '+p+q+r+', угол при '+p+' равен '+2*x+'°. Найди ∠'+q+p+s+'.',x,
     'Отрезок '+p+s+' лежит на биссектрисе угла '+p+'.'];
   },
   recover_contact_pair_from_side:({a,b})=>{
    const side=2*a+b;
    return ['Окружность касается AB в T. AB = '+side+' см, AT = '+a+' см. Чему равна длина отрезка второй касательной из B до точки касания?',side-a,
     'Из B равны два отрезка до точек касания. На AB такой отрезок BT = '+side+' − '+a+'.'];
   },
   locate_from_two_bisectors:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Биссектрисы при '+p+' и '+q+' пересекаются в '+s+'. Что известно о расстояниях от '+s+' до трёх сторон?',
     'Все три равны',['Равны только два расстояния','Все три различны','Одно обязательно равно нулю'],'Каждая из двух биссектрис задаёт равные расстояния до пары сторон. Одна сторона общая для этих пар.');
   },
   compute_two_halves_at_contact:({a,b})=>{
    const x=a+b;
    return ['Вписанная окружность касается двух сторон у вершины A. Длины отрезков от A до точек касания в сумме '+2*x+' см. Найди длину каждого.',x,'Касательные из одной точки дают равные отрезки.'];
   }
  },
  {
   reconstruct_tangent_piece_from_three_sides:({a,b})=>{
    const x=2+a,y=2+b,z=a+b;
    return ['Окружность вписана в ABC и касается AB в T. AB = '+(x+y)+' см, BC = '+(y+z)+' см, AC = '+(x+z)+' см. Найди AT.',x,
     'Обозначим равные отрезки касательных из A, B и C как x, y, z. Тогда AB + AC − BC = 2x. Делим '+2*x+' см пополам.'];
   },
   calculate_incenter_angle:({a,b})=>{
    const C=32+a+b;
    return ['В ABC точка I — центр вписанной окружности. Угол C равен '+C+'°. Найди ∠AIB в градусах.',rational(180+C,2),
     'В треугольнике AIB два угла при A и B составляют половину суммы ∠A + ∠B. Искомый угол равен 90° + '+C+'° / 2.'];
   },
   verify_contact_radius_consistency:({a,b})=>{
    const x=a+b;
    return checkStatement('Точка I внутри ABC удалена от AB и AC на '+x+' см, от BC на '+(x+a)+' см. Может ли I быть центром вписанной окружности?',false,
     'Все три расстояния должны быть равны радиусу. Расстояние до BC другое.');
   },
   get_perimeter_from_three_tangent_segments:({a,b})=>{
    const x=a+b,y=x+1,z=x+2;
    return ['В ABC отрезки касательных от A, B и C до точек касания равны соответственно '+x+', '+y+' и '+z+' см. Найди периметр.',2*(x+y+z),
     'От каждой вершины идут два равных отрезка касательных. На периметре каждая из трёх длин встречается дважды.'];
   }
  }
 ],
 geo_circumcircle_triangle:[
  {
   choose_equidistant_center_lines:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Какие прямые определяют центр описанной окружности треугольника '+p+q+r+'?','Серединные перпендикуляры к сторонам',
     ['Биссектрисы углов','Медианы сторон в любом треугольнике','Прямые, содержащие стороны'],'Центр равноудалён от пар вершин каждой стороны.');
   },
   transfer_radius_between_vertices:({a,b})=>['O — центр описанной около ABC окружности. OA = '+(a+b)+' см. Найди OC.',a+b,'OA и OC — радиусы одной окружности.'],
   compare_incircle_and_circumcircle_indicators:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Какие точки должна содержать окружность, описанная около треугольника '+p+q+r+'?','Все его вершины',
     ['Только середины всех его сторон','Только точки касания сторон','Все внутренние точки треугольника'],'Описанная окружность проходит через три вершины.');
   },
   radius_from_known_diameter:({a,b})=>['Диаметр окружности, описанной около треугольника, '+2*(a+b)+' см. Найди расстояние от центра до любой вершины.',a+b,'Вершины находятся на окружности. Указанное расстояние равно половине диаметра.']
  },
  {
   right_triangle_circumradius:({a,b})=>['Гипотенуза прямоугольного треугольника '+2*(a+b)+' см. Найди радиус описанной окружности.',a+b,'Центр окружности — середина гипотенузы, поэтому гипотенуза служит диаметром.'],
   identify_center_from_visual_marks:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice(r+p+' = '+r+q+' и '+r+q+' = '+r+s+'. Какую роль точка '+r+' играет для треугольника '+p+q+s+'?',
     'Центр описанной окружности',['Центр вписанной окружности обязательно','Середина одной из сторон обязательно','Одна из вершин'],'Точка '+r+' равноудалена от трёх вершин.');
   },
   choose_center_region_from_angle_kind:({a,b})=>{
    const angle=92+a;
    return choice('Один угол треугольника '+angle+'°. Где расположен центр описанной окружности?','Вне треугольника',
     ['Строго внутри треугольника','В середине стороны, противолежащей этому углу','В острой вершине'],'При тупом угле центр описанной окружности находится вне треугольника.');
   },
   infer_diameter_from_right_angle:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('В треугольнике '+p+q+r+' угол '+q+' прямой. Какой отрезок — диаметр описанной окружности?',p+r,[p+q,q+r,'Ни один из отрезков'],'Диаметр — гипотенуза напротив прямого угла '+q+'.');
   }
  },
  {
   compute_radius_from_median_difference:({a,b})=>{
    const r=a+b;
    return ['В прямоугольном треугольнике гипотенуза на '+r+' см длиннее медианы к ней. Найди радиус описанной окружности.',r,
     'Медиана к гипотенузе соединяет вершину с центром и равна радиусу. Гипотенуза равна двум радиусам, разность равна одному радиусу.'];
   },
   locate_center_after_finding_third_angle:({a,b})=>{
    const A=28+a+b,B=90-A;
    return choice('В ABC угол A равен '+A+'°, угол B — '+B+'°. Где центр описанной окружности?',
     'В середине AB',['В середине AC','В середине BC','Вне треугольника'],'Из суммы углов получаем ∠C = 90°. Центр — середина гипотенузы AB.');
   },
   prove_third_perpendicular_bisector:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice(s+' — пересечение серединных перпендикуляров к '+p+q+' и '+q+r+'. Почему '+s+' лежит на серединном перпендикуляре к '+p+r+'?',
     s+p+' = '+s+q+' = '+s+r,[s+' лежит на '+p+r,'Все три стороны равны','Оба перпендикуляра параллельны'],
     'Из двух равенств следует, что '+s+' равноудалена от '+p+' и '+r+'.');
   },
   algebraic_radius_from_two_vertices:({a,b})=>{
    const x=a+b,k=28+b;
    return ['O — центр описанной около ABC окружности. OA = x + '+k+' см, OB = 2x + '+(k-x)+' см. Найди x.',x,
     'Длины OA и OB равны одному радиусу. Приравниваем и вычитаем x.'];
   }
  }
 ],
 geo_axial_symmetry:[
  {
   reflect_in_y_axis:({a,b})=>reflectionInput('Отрази точку A'+pair(a,b)+' относительно оси Oy. Запиши координаты её образа.','x',0,a,b,'При отражении в Oy абсцисса меняет знак, ордината сохраняется.'),
   reflect_in_x_axis:({a,b})=>reflectionInput('Отрази точку A'+pair(-a,b)+' относительно оси Ox. Запиши координаты её образа.','y',0,-a,b,'При отражении в Ox ордината меняет знак, абсцисса сохраняется.'),
   identify_unmoved_point_on_axis:({a,b})=>{
    const [p,q,r]=geometryLabels(a,b);
    return choice('Точка '+p+' лежит на оси '+q+r+'. Куда она переходит при отражении?',
     'В саму точку '+p,['В '+q,'В '+r,'В середину '+q+r+' всегда'],'Все точки оси остаются на своих местах.');
   },
   two_requirements_for_reflection:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Что верно для отрезка '+p+q+', если его концы симметричны относительно '+r+s+'?',
     r+s+' — серединный перпендикуляр к '+p+q,[r+s+' параллельна '+p+q,r+s+' проходит через '+p,r+s+' совпадает с '+p+q],
     'Ось перпендикулярна отрезку и делит его на две равные части.');
   }
  },
  {
   reflect_across_shifted_vertical:({a,b})=>reflectionInput('Отрази A'+pair(a+b,2-b)+' относительно прямой x = '+a+'.','x',a,a+b,2-b,'Абсцисса на b единиц правее оси. Отражение окажется на столько же левее, ордината сохранится.'),
   reflect_across_shifted_horizontal:({a,b})=>reflectionInput('Отрази A'+pair(a-b,-a-b)+' относительно прямой y = −'+a+'.','y',-a,a-b,-a-b,'Ордината точки на '+b+' ниже оси. Образ на '+b+' выше неё.'),
   recover_vertical_axis:({a,b})=>['Точки A'+pair(a-b,3)+' и A₁'+pair(a+b,3)+' симметричны относительно прямой x = k. Найди k.',a,'k — абсцисса середины AA₁, среднее двух заданных абсцисс.'],
   count_same_side_distance:({a,b})=>['Точка P находится на расстоянии '+(a+b)+' см от оси. Найди расстояние между P и её образом.',2*(a+b),'Точки по разные стороны оси на одном перпендикуляре. Расстояние между ними вдвое больше расстояния до оси.']
  },
  {
   two_reflections_in_parallel_axes:({a,b})=>coordinates('Точку A'+pair(a,b)+' сначала отразили относительно x = 0, затем относительно x = '+(a+b)+'. Найди конечные координаты.',3*a+2*b,b,
    'Сначала абсцисса −'+a+'. При втором отражении получаем 2 · '+(a+b)+' − (−'+a+') = '+(3*a+2*b)+'. Ордината не меняется.'),
   reflect_across_both_coordinate_axes:({a,b})=>coordinates('Точку A'+pair(a,-b)+' последовательно отразили в Ox и Oy. Найди конечные координаты.',-a,b,
    'Отражение в Ox меняет знак ординаты, отражение в Oy меняет знак абсциссы.'),
   test_axis_via_midpoint_and_perpendicular:({a,b})=>{
    const x=a+b,shift=b%3-1;
    return checkStatement('A'+pair(x-b,0)+' и B'+pair(x+b,0)+'. Является ли x = '+(x+shift)+' осью симметрии этих точек?',shift===0,
     'Середина AB имеет абсциссу '+x+'. Вертикальная ось должна пройти именно через эту середину.');
   },
   find_both_axis_and_distance:({a,b})=>['A'+pair(-a,b)+' и A₁'+pair(-a,-b)+' симметричны. Найди расстояние от A до оси симметрии.',b,
    'Середина отрезка имеет ординату 0, а ось перпендикулярна вертикальному отрезку. Значит, ось — Ox.']
  }
 ],
 geo_axial_symmetry_properties:[
  {
   replicate_segment_length:({a,b})=>['Отражение переводит AB в A₁B₁. AB = '+(a+b)+' см. Найди A₁B₁.',a+b,'Осевая симметрия сохраняет расстояния.'],
   replicate_angle_measure:({a,b})=>['При осевой симметрии угол '+(32+a+b)+'° переходит в другой угол. Найди его величину.',32+a+b,'Отражение сохраняет величины углов.'],
   replicate_triangle_area:({a,b})=>['Площадь треугольника '+(a*b)+' см². Найди площадь симметричного треугольника.',a*b,'Отражённые фигуры равны, поэтому их площади совпадают.'],
   recognize_axis_of_figure:({a,b})=>sameFigureRule(symmetryKinds[(a+b)%4])
  },
  {
   compare_two_figures_axis_count:({a,b})=>{
    const kinds=symmetryKinds.slice(a%4).concat(symmetryKinds.slice(0,a%4)),first=kinds[0],second=kinds[b%3+1];
    const left=sameFigureRule(first)[1],right=sameFigureRule(second)[1];
    return ['На сколько различаются числа осей симметрии у двух фигур («'+first+'» и «'+second+'»)?',Math.abs(left-right),'У названных фигур соответственно '+left+' и '+right+' осей.'];
   },
   recover_perimeter_after_reflection:({a,b})=>{
    const x=a+b,y=x+1,z=x+2;
    return ['Стороны треугольника '+x+', '+y+' и '+z+' см. Найди периметр отражённого треугольника.',x+y+z,'Все три длины сохраняются, их сумма '+(x+y+z)+' см.'];
   },
   preserve_perpendicularity:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return checkStatement('При отражении прямые '+p+q+' и '+r+s+', образующие угол 90°, перешли в две другие прямые. Сохранилась ли их перпендикулярность?',true,'Отражение сохраняет величину угла 90°.');
   },
   restore_missing_side_from_correspondence:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return ['При отражении '+p+' переходит в '+r+', а '+q+' в '+s+'. '+r+s+' = '+(a+b)+' см. Найди '+p+q+'.',a+b,'Два конца исходного отрезка переходят в концы его образа. Длины равны.'];
   }
  },
  {
   count_axes_for_non_square_rhombus:({a,b})=>['У ромба острый угол '+(34+a+b)+'°. Сколько у него осей симметрии?',2,'Оси такого ромба — его диагонали. Другие две оси появились бы у квадрата.'],
   prove_equidistance_after_swap:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Отражение меняет местами '+p+' и '+q+', а '+r+' оставляет на месте. Что следует?',
     r+p+' = '+r+q,[r+p+' > '+r+q,r+p+' < '+r+q,r+' обязана совпадать с '+s],
     'Отрезок '+r+p+' переходит в '+r+q+', а длина сохраняется.');
   },
   calculate_area_of_two_nonoverlapping_images:({a,b})=>['Фигура площади '+(a*b)+' см² целиком лежит в одной открытой полуплоскости относительно оси. Найди площадь объединения фигуры с её отражением.',2*a*b,'Образ в другой полуплоскости не перекрывает исходную фигуру. Складываем две равные площади.'],
   recover_vertex_angle_from_symmetry:({a,b})=>{
    const x=36+a+b;
    return ['Через A проходит ось симметрии треугольника ABC. Луч оси внутри треугольника образует со стороной AB угол '+x+'°. Найди ∠BAC.',2*x,
     'Луч оси делит угол при A пополам, поскольку отражение меняет стороны AB и AC местами.'];
   }
  }
 ]
});

const polygonTaskVisual=(n,diagonal=null)=>triangleVisual({kind:'g7-polygon',
 labels:Array.from({length:n},(_,index)=>geometryLetters[index]),diagonal});
Object.assign(reviewed,{
 geo_broken_line_polygon:[
  {
   count_segments_from_vertices:({a,b})=>{
    const n=a%6+4;
    return ['Незамкнутая ломаная состоит из '+n+' вершин, которые проходят по порядку по одному разу. Сколько у неё звеньев?',n-1,'По одному звену между каждой парой соседних вершин.'];
   },
   sum_lengths_of_links:({a,b,c})=>['Три звена ломаной имеют длины '+a+', '+b+' и '+c+' см. Найди длину ломаной.',a+b+c,'Складываем длины звеньев.'],
   distinguish_closed_chain:({a,b})=>{
    const [p,q,r,s]=geometryLabels(a,b);
    return choice('Начали идти из '+p+' и последовательно прошли '+q+', '+r+', '+s+' и '+p+'. Какая получилась ломаная?','Замкнутая',['Незамкнутая','У неё только одно звено','У неё нет вершин'],'Последняя точка совпала с первой.');
   },
   read_polygon_vertices:({a,b})=>{
    const n=a%5+4;
    return ['Сколько сторон у многоугольника на чертеже?',n,'Стороны соединяют соседние вершины и замыкают контур.',null,polygonTaskVisual(n)];
   }
  },
  {
   missing_link_from_total:({a,b,c})=>['Ломаная длиной '+(a+b+c)+' см имеет три звена. Два из них '+a+' и '+b+' см. Найди третье.',c,'Из общей длины вычитаем два известных звена.'],
   perimeter_of_alternating_sides:({a,b})=>['У шестиугольника длины сторон по кругу чередуются: '+a+' и '+b+' см. Найди периметр.',3*(a+b),'Каждая из двух длин встречается три раза.'],
   count_diagonal_from_one_vertex:({a,b})=>{
    const n=a%6+5;
    return ['Сколько диагоналей можно провести из одной вершины выпуклого '+n+'-угольника?',n-3,'Исключаем саму вершину и две соседние вершины, соединённые с ней сторонами.'];
   },
   compare_open_route_and_perimeter:({a,b,c})=>['Ломаная ABCD состоит из звеньев '+a+', '+b+' и '+c+' см. Чтобы замкнуть её, добавили DA длиной '+(a+b)+' см. На сколько периметр ABCD больше длины исходной ломаной?',a+b,'При замыкании добавили только DA.']
  },
  {
   find_short_side_from_pattern:({a,b})=>{
    const x=a+b,delta=b;
    return ['У выпуклого шестиугольника три стороны по x см, остальные три на '+delta+' см длиннее. Периметр '+(6*x+3*delta)+' см. Найди x.',x,
     'Периметр равен 3x + 3(x + '+delta+'). Из него вычитаем '+3*delta+' и делим остаток на 6.'];
   },
   count_all_diagonals_of_convex_polygon:({a,b})=>{
    const n=a+b;
    return ['Сколько диагоналей у выпуклого '+n+'-угольника?',n*(n-3)/2,'Из каждой вершины выходит '+(n-3)+' диагоналей. После умножения на число вершин делим на 2, потому что у каждой диагонали два конца.'];
   },
   recover_perimeter_from_overlapping_paths:({a,b})=>{
    const shared=a+b,left=2*shared+a,right=2*shared+b;
    return ['В выпуклом ABCD длина ломаной A–B–C–D равна '+left+' см, а C–D–A — '+right+' см. CD = '+shared+' см. Найди периметр.',left+right-shared,
     'В сумме длин двух ломаных сторона CD учтена дважды, поэтому вычитаем её один раз.'];
   },
   recover_regular_polygon_from_perimeter:({a,b})=>{
    const n=a%6+5,length=b+2;
    return ['У правильного многоугольника периметр '+n*length+' см, сторона '+length+' см. Сколько диагоналей идёт из одной вершины?',n-3,
     'По отношению периметра к стороне получаем '+n+' вершин. Из одной вершины можно провести '+n+' − 3 диагоналей.'];
   }
  }
 ],
 geo_polygon_angle_sum_intro:[
  {
   total_angles_for_given_n:({a,b})=>{
    const n=a%6+4;
    return ['Найди сумму внутренних углов выпуклого '+n+'-угольника.',180*(n-2),'Из одной вершины диагонали делят его на '+(n-2)+' треугольника.'];
   },
   count_triangles_from_given_drawing:({a,b})=>{
    const n=a%6+4;
    return ['На сколько треугольников можно разделить многоугольник на чертеже диагоналями из одной вершины?',n-2,
     'Для '+n+' сторон получаем '+n+' − 2 треугольника.',null,polygonTaskVisual(n)];
   },
   quadrilateral_last_angle:({a,b})=>{
    const p=80+a,q=86+b,r=91;
    return ['Три угла выпуклого четырёхугольника равны '+p+'°, '+q+'° и '+r+'°. Найди четвёртый.',360-p-q-r,'Сумма углов четырёхугольника 360°. Вычитаем три известные величины.'];
   },
   compare_n_and_next_n_sums:({a,b})=>{
    const n=a%5+4;
    return ['На сколько градусов сумма углов выпуклого '+(n+1)+'-угольника больше суммы углов выпуклого '+n+'-угольника?',180,
     'При добавлении одной вершины число треугольников при разбиении увеличивается на один.'];
   }
  },
  {
   get_number_of_sides_from_sum:({a,b})=>{
    const n=a%7+5;
    return ['Сумма углов выпуклого многоугольника '+180*(n-2)+'°. Сколько у него сторон?',n,
     'Делим сумму на 180° и получаем '+(n-2)+' треугольника, затем прибавляем 2.'];
   },
   angle_of_regular_polygon:({a,b})=>{
    const n=a%7+4;
    return ['Найди один внутренний угол правильного '+n+'-угольника в градусах.',rational(180*(n-2),n),
     'Все углы равны. Делим их общую сумму '+180*(n-2)+'° на '+n+'.'];
   },
   test_angle_sum_exists:({a,b})=>{
    const n=a%6+5,k=b%3,angle=180*(n-2)+k*10;
    return checkStatement('Может ли сумма углов выпуклого многоугольника равняться '+angle+'°?',k===0,
     'Сумма углов кратна 180°. Делим '+angle+'° на 180° и проверяем, получается ли целое число треугольников.');
   },
   triangles_from_number_of_diagonals:({a,b})=>{
    const t=a%7+2;
    return ['Из одной вершины выпуклого многоугольника проведены все '+t+' диагонали. Найди сумму внутренних углов.',180*(t+1),
     'Каждая новая диагональ разрезает одну область на две. Получаем '+(t+1)+' треугольника.'];
   }
  },
  {
   find_sides_from_regular_interior_angle:({a,b})=>{
    const n=[5,6,8,9,10,12][(a+b)%6],angle=180-360/n;
    return ['Внутренний угол правильного многоугольника равен '+angle+'°. Сколько у него сторон?',n,
     'Внешний угол равен 180° − '+angle+'° = '+(180-angle)+'°. Сумма внешних углов 360°, делим её на '+(180-angle)+'°.'];
   },
   solve_equation_for_two_unknown_angles:({a,b})=>{
    const x=106+a,delta=b,left=108,right=111,last=540-x-(x+delta)-left-right;
    return ['У выпуклого пятиугольника углы равны '+left+'°, '+right+'°, '+last+'°, x° и (x + '+delta+')°. Найди x.',x,
     'Сумма углов пятиугольника 540°. Получаем 2x + '+(left+right+last+delta)+' = 540.'];
   },
   combine_perimeter_and_angle_count:({a,b})=>{
    const n=a%7+4,side=b+2;
    return ['У правильного многоугольника периметр '+n*side+' см и сторона '+side+' см. Найди сумму его внутренних углов.',180*(n-2),
     'Сначала находим '+n+' сторон делением периметра на сторону. Сумма углов '+(n-2)+' · 180°.'];
   },
   compare_sums_for_related_polygons:({a,b})=>{
    const n=a%5+5,k=b%4+2;
    return ['Сумма углов первого выпуклого многоугольника '+180*(n-2)+'°. Число сторон второго больше на '+k+'. Найди сумму углов второго.',180*(n+k-2),
     'Каждая дополнительная сторона увеличивает сумму углов на 180°. Прибавляем '+180*k+'°.'];
   }
  }
 ]
});

Object.assign(reviewedLessons,{
 stat_tables:'Сначала прочитай заголовки и единицы измерения. Найди нужную строку и нужный столбец. Их пересечение даёт значение показателя.',
 stat_data_interpretation:'Выбери столбец с нужным показателем, затем упорядочь или отфильтруй строки. Из данных можно вывести сравнение и изменение. Причина изменения может быть неизвестна.',
 stat_table_calculations:'Чтобы подсчитать значения, отметь каждое в своей строке. В смете стоимость каждой позиции равна количеству, умноженному на цену. Общая стоимость — сумма по строкам.'
});
const tableVisual=(headers,rows)=>question=>g6AttachTable(question,{headers,rows});
const stockNames=['Папки','Ручки','Блокноты','Линейки'];
function stockModel(a,b,c){
 const shift=(a+b)%4;
 const names=stockNames.slice(shift).concat(stockNames.slice(0,shift));
 const plan=[a+b+5,2*a+1,b+c+3,2*b+4];
 const counts=[a+b+1,b+2,c+b+6,a+c+4];
 return {names,plan,counts,visual:tableVisual(['Товар','Заказано, шт.','Получено, шт.'],names.map((name,index)=>[name,plan[index],counts[index]]))};
}
function countOccurrence(values,key){
 return values.filter(value=>value===key).length;
}
function addValues(values){
 return values.reduce((sum,value)=>sum+value,0);
}
function tableTask(model,prompt,answer,ex){
 return withVisual([prompt,answer,ex],model.visual);
}
function schedules(a,b){
 const start=8*60+5+a,rows=[['Рейс 15',start,start+22+b],['Рейс 21',start+15,start+33+b],['Рейс 27',start+28,start+51+b]];
 const clock=minutes=>Math.floor(minutes/60)+':'+String(minutes%60).padStart(2,'0');
 return {rows,clock,visual:tableVisual(['Рейс','Отправление','Прибытие'],rows.map(([name,depart,arrive])=>[name,clock(depart),clock(arrive)]))};
}
function materialEstimate(a,b,c,y){
 const products=['Краска','Кисти','Валики'],counts=[b+1,a+2,c+1],prices=[40+y,8+b,18+a];
 const costs=counts.map((count,index)=>count*prices[index]);
 return {products,counts,prices,costs,visual:tableVisual(['Материал','Количество, шт.','Цена, ₽/шт.'],products.map((name,index)=>[name,counts[index],prices[index]]))};
}
Object.assign(reviewed,{
 stat_tables:[
  {
   read_cell_by_product:args=>{
    const {a,b,c}=args,m=stockModel(a,b,c),i=a%4;
    return tableTask(m,'Сколько единиц товара «'+m.names[i]+'» получено?',m.counts[i],
     'Строка «'+m.names[i]+'», столбец «Получено, шт.» дают '+m.counts[i]+'.');
   },
   read_ordered_quantity:({a,b,c})=>{
    const m=stockModel(a,b,c),i=b%4;
    return tableTask(m,'Какое количество заказали для строки «'+m.names[i]+'»?',m.plan[i],
     'В строке «'+m.names[i]+'» смотрим столбец «Заказано, шт.».');
   },
   read_departure_time:({a,b})=>{
    const m=schedules(a,b),i=a%3,[name,depart]=m.rows[i];
    return withVisual(choice('Во сколько отправляется '+name.toLowerCase()+'?',m.clock(depart),
     m.rows.filter((_,index)=>index!==i).map(row=>m.clock(row[1])),
     'Смотрим пересечение строки «'+name+'» и столбца «Отправление». '+m.clock(depart)+'.'),m.visual);
   },
   read_selected_unit:({a,b,c,y})=>{
    const m=materialEstimate(a,b,c,y),i=a%3;
    return withVisual(choice('Какое из значений показывает цену за одну единицу в строке «'+m.products[i]+'»?',m.prices[i]+' ₽/шт.',
     [m.counts[i]+' шт.',m.costs[i]+' ₽',m.prices[i]+' шт.'],'Для цены единицы нужен столбец «Цена, ₽/шт.».'),
     m.visual);
   }
  },
  {
   compare_received_and_ordered:({a,b,c})=>{
    const m=stockModel(a,b,c),i=b%4,plan=m.plan[i],received=m.counts[i];
    return tableTask(m,'На сколько отличаются заказанное и фактически полученное количество в строке «'+m.names[i]+'»?',Math.abs(plan-received),
     'В одной строке сравниваем '+plan+' и '+received+'. Ищем абсолютную разность.');
   },
   how_many_equal_cells:({a,b,c})=>{
    const m=stockModel(a,b,c),matches=m.plan.filter((value,index)=>value===m.counts[index]).length;
    return tableTask(m,'У скольких товаров заказ и фактически полученное количество совпали?',matches,
     'Сравниваем две ячейки каждой строки. Совпадений '+matches+'.');
   },
   compute_duration_from_timetable:({a,b})=>{
    const m=schedules(a,b),i=b%3,[name,depart,arrive]=m.rows[i];
    return tableTask(m,'Сколько минут занимает поездка на рейсе '+name.slice(5)+'?',arrive-depart,
     'Из времени прибытия '+m.clock(arrive)+' вычитаем время отправления '+m.clock(depart)+'.');
   },
   infer_missing_value_in_a_row:({a,b,c,y})=>{
    const m=materialEstimate(a,b,c,y),i=a%3;
    return tableTask(m,'Сколько рублей стоит всё количество по строке «'+m.products[i]+'»?',m.costs[i],
     'Берём из одной строки количество '+m.counts[i]+' и цену '+m.prices[i]+' ₽, затем перемножаем.');
   }
  },
  {
   read_latest_arrival_before_threshold:({a,b})=>{
    const m=schedules(a,b),i=b%2,[name,,arrival]=m.rows[i],limit=arrival+3;
    return withVisual(choice('Какой рейс прибывает позже остальных рейсов, успевающих не позднее '+m.clock(limit)+'?',name,
     m.rows.filter((_,index)=>index!==i).map(row=>row[0]),'Из столбца «Прибытие» берём самое позднее время не позже '+m.clock(limit)+'. Это '+m.clock(arrival)+'.'),m.visual);
   },
   combine_shortages_only:({a,b,c})=>{
    const m=stockModel(a,b,c),shortages=m.plan.map((value,index)=>Math.max(value-m.counts[index],0));
    return tableTask(m,'Сколько единиц в сумме недопоставлено по товарам, которых получили меньше, чем заказали?',addValues(shortages),
     'В каждой строке берём положительную разность «Заказано» − «Получено». Складываем '+shortages.join(' + ')+'.');
   },
   estimate_change_from_one_row:({a,b,c,y})=>{
    const m=materialEstimate(a,b,c,y),target=a%3,extra=b+2;
    return tableTask(m,'Сколько будет стоить вся закупка, если количество в строке «'+m.products[target]+'» увеличить на '+extra+' шт.?',addValues(m.costs)+m.prices[target]*extra,
     'Сумма до изменения '+addValues(m.costs)+' ₽. Добавляем '+extra+' · '+m.prices[target]+' ₽.');
   },
   compare_plans_after_threshold:({a,b,c})=>{
    const m=stockModel(a,b,c),limit=a+b,qualified=m.counts.map((value,i)=>value>=limit?m.plan[i]:0);
    return tableTask(m,'Сколько единиц в сумме заказано по строкам, где получили не меньше '+limit+' шт.?',addValues(qualified),
     'Отбираем строки по столбцу «Получено», затем суммируем «Заказано» именно в этих строках.');
   }
  }
 ],
 stat_data_interpretation:[
  {
   identify_largest_received:({a,b,c,y})=>{
    const names=stockNames.slice(a%4).concat(stockNames.slice(0,a%4)),values=[a+3,a+b+3,a+b+c+3,a+b+c+y+3],i=b%4;
    const rows=names.map((name,index)=>[name,values[(index+i)%4]]),target=rows.find(([,value])=>value===Math.max(...values))[0];
    return withVisual(choice('Какого товара получили больше всего?',target,names.filter(name=>name!==target),
     'Наибольшее значение в столбце — '+Math.max(...values)+'.'),tableVisual(['Товар','Получено, шт.'],rows));
   },
   count_above_received_threshold:({a,b,c})=>{
    const m=stockModel(a,b,c),limit=a+b;
    return tableTask(m,'У скольких товаров значение в столбце «Получено» строго больше '+limit+'?',m.counts.filter(value=>value>limit).length,'Сравниваем каждое число столбца с '+limit+'. Равенство не учитываем.');
   },
   chronological_order_from_rows:({a,b})=>{
    const start=2019+a%5,years=[start,start+1,start+2],rows=[[years[2],12+a],[years[0],16+b],[years[1],14+a+b]];
    return withVisual(choice('Как упорядочить строки от более раннего года к более позднему?',years.join(' → '),[years.slice().reverse().join(' → '),[years[1],years[0],years[2]].join(' → ')],
     'Для хронологического порядка смотрим на год, затем выписываем годы по возрастанию.'),tableVisual(['Год','Поездки, тыс.'],rows));
   },
   choose_sort_key:({a,b,c})=>{
    const m=stockModel(a,b,c);
    return withVisual(choice('Какой столбец надо использовать для сортировки по фактической поставке строки «'+m.names[a%4]+'» и остальных?',
     'Получено, шт.',['Заказано, шт.','Товар','Номер строки'],'Фактическая поставка — это результат в столбце «Получено».'),
     m.visual);
   }
  },
  {
   ranking_by_cost_not_quantity:({a,b,c,y})=>{
    const names=['Фломастеры','Карандаши','Ластики'];
    const rank=a%3;
    const [p,q,r]=names.slice(rank).concat(names.slice(0,rank));
    const rows=[[q,a+b+7],[r,a+b+c+7],[p,a+7]];
    return withVisual(choice('В каком порядке расположить товары по возрастанию цены?', [p,q,r].join(' → '),
     [[r,q,p],[q,p,r],[r,p,q]].map(row=>row.join(' → ')),
     'Сравниваем ценники: '+(a+7)+' < '+(a+b+7)+' < '+(a+b+c+7)+'.'),tableVisual(['Товар','Цена, ₽'],rows));
   },
   when_increase_was_largest:({a,b,c})=>{
    const start=2020+a%4,values=[c,c+a,c+a+a+b,c+a+a+b+a-1];
    return withVisual(choice('По сравнению с предыдущим годом когда число участников увеличилось сильнее всего?',start+2,
     [start+1,start+3,'Во все годы одинаково'],'Приросты по порядку: '+a+', '+(a+b)+' и '+(a-1)+'. Наибольший — '+(a+b)+'.'),
     tableVisual(['Год','Участники'],values.map((value,i)=>[start+i,value])));
   },
   distinguish_record_from_assumption:({a,b,c})=>{
    const m=stockModel(a,b,c),i=a%4;
    return withVisual(choice('Какой вывод следует из таблицы сам по себе?', 'По строке «'+m.names[i]+'» получили '+m.counts[i]+' шт.',
     ['На следующей неделе количество удвоится','Недостача вызвана поломкой машины','На каждый товар спрос уменьшился'],
     'Таблица показывает фактически зафиксированное количество. Причин или прогнозов в ней нет.'),m.visual);
   },
   estimate_count_at_two_thresholds:({a,b,c})=>{
    const m=stockModel(a,b,c),lo=a+b,hi=lo+5;
    return tableTask(m,'У скольких товаров число полученных единиц от '+lo+' до '+hi+' включительно?',m.counts.filter(value=>lo<=value&&value<=hi).length,
     'Проверяем оба ограничения по столбцу получения. Границы '+lo+' и '+hi+' входят.');
   }
  },
  {
   filter_on_two_columns:({a,b,c})=>{
    const m=stockModel(a,b,c),diff=m.counts.map((count,i)=>count-m.plan[i]),target=diff.filter((delta,i)=>delta<0&&m.plan[i]>=a+b).length;
    return tableTask(m,'У скольких товаров заказали не меньше '+(a+b)+' шт. и при этом получили меньше, чем заказали?',target,
     'Проверяем два условия в каждой строке. Одновременно должны подходить «Заказано» и разность между двумя столбцами.');
   },
   fastest_route_that_departs_after:({a,b})=>{
    const m=schedules(a,b);
    return withVisual(choice('После '+m.clock(m.rows[0][1])+' остаются другие рейсы. Какой из них меньше времени проводит в пути?',
     m.rows[1][0],[m.rows[0][0],m.rows[2][0],'Два рейса идут одинаково по времени'],
     'У 21-го рейса '+(18+b)+' минут, у 27-го — '+(23+b)+' минуты. Рейс 15 отправляется в указанное время и не подходит.'),m.visual);
   },
   compare_gap_trend:({a,b,c})=>{
    const start=2020+a%4,groups=['Турнир A','Турнир B'],values=[a+b,b+c,a+c],gaps=[b,b+3,b+2];
    return withVisual(choice('В каком году разность числа участников двух турниров была наибольшей?',start+1,
     [start,start+2,'Разность не менялась'],'Вычитаем по строкам. Разности '+gaps.join(', ')+', наибольшая во второй строке.'),
     tableVisual(['Год',...groups],values.map((value,i)=>[start+i,value,value+gaps[i]])));
   },
   compare_relative_change:({a,b,c})=>{
    const left=a+b,right=c+a+3;
    return withVisual(choice('В какой группе число заявок увеличилось на больший процент?', 'Группа B',
     ['Группа A','В обеих на один процент','Процент определить нельзя'],'В A прирост составляет половину исходного значения. В B прирост равен всему исходному значению.',
    ),tableVisual(['Группа','Было','Стало'],[['Группа A',2*left,3*left],['Группа B',right,2*right]]));
   }
  }
 ],
 stat_table_calculations:[
  {
   count_category_from_unsorted_values:({a,b})=>{
    const names=['Волейбол','Шахматы','Рисование'],key=names[a%3],rows=Array.from({length:9},(_,i)=>[i+1,names[(i*i+a+i*b)%3]]);
    return withVisual(['Сколько учеников выбрали «'+key+'»?',countOccurrence(rows.map(row=>row[1]),key),
     'Просматриваем столбец выбора и считаем только строки с указанным кружком.'],tableVisual(['Ученик','Кружок'],rows));
   },
   sum_quantities_for_multiple_rows:({a,b,c,y})=>{
    const m=materialEstimate(a,b,c,y);
    return tableTask(m,'Сколько единиц всех материалов в смете?',addValues(m.counts),'Складываем столбец количества: '+m.counts.join(' + ')+'.');
   },
   calculate_position_cost:({a,b,c,y})=>{
    const m=materialEstimate(a,b,c,y),i=b%3;
    return tableTask(m,'Найди стоимость всей позиции «'+m.products[i]+'» в рублях.',m.costs[i],
     'Стоимость позиции: '+m.counts[i]+' · '+m.prices[i]+' = '+m.costs[i]+' ₽.');
   },
   find_remainder_from_given_total:({a,b,c})=>{
    const m=stockModel(a,b,c),i=a%4,rows=m.names.map((name,index)=>[name,index===i?'?':m.counts[index]]);
    return withVisual(['Всего получено '+addValues(m.counts)+' шт. Сколько получено в строке с пропуском?',m.counts[i],
     'Из общего количества вычитаем сумму трёх известных строк.'],tableVisual(['Товар','Получено, шт.'],rows));
   }
  },
  {
   compute_total_cost:({a,b,c,y})=>{
    const m=materialEstimate(a,b,c,y);
    return tableTask(m,'Найди общую стоимость сметы в рублях.',addValues(m.costs),
     'Умножаем цену на количество для каждой позиции. Стоимости '+m.costs.join(', ')+' ₽ складываем.');
   },
   compare_two_row_costs:({a,b,c,y})=>{
    const m=materialEstimate(a,b,c,y),i=a%3,j=(i+1)%3;
    return tableTask(m,'На сколько рублей отличаются стоимости строк «'+m.products[i]+'» и «'+m.products[j]+'»?',Math.abs(m.costs[i]-m.costs[j]),
     'Находим стоимости '+m.costs[i]+' и '+m.costs[j]+' ₽ как произведения количества и цены, затем берём разность.');
   },
   find_count_of_two_choices:({a,b,c})=>{
    const names=['Группа A','Группа B','Группа C'],rows=Array.from({length:9},(_,i)=>[i+1,names[(i*i+a+i*b+c)%3]]),excluded=names[a%3];
    return withVisual(['Сколько строк относятся к двум группам, кроме «'+excluded+'»?',rows.filter(row=>row[1]!==excluded).length,
     'Считаем, сколько раз встречается «'+excluded+'», и вычитаем из общего числа строк.'],tableVisual(['Запись','Группа'],rows));
   },
   average_price_per_unit_in_group:({a,b,c,y})=>{
    const m=materialEstimate(a,b,c,y),i=a%3,j=(i+1)%3;
    return tableTask(m,'Найди среднюю стоимость одной единицы для строк «'+m.products[i]+'» и «'+m.products[j]+'». Запиши точный ответ в рублях.',
     rational(m.costs[i]+m.costs[j],m.counts[i]+m.counts[j]),'Делим общую стоимость двух строк на их общее количество. Цены имеют разные веса.');
   }
  },
  {
   recover_missing_price_from_grand_total:({a,b,c,y})=>{
    const m=materialEstimate(a,b,c,y),i=a%3,rows=m.products.map((name,index)=>[name,m.counts[index],i===index?'?':m.prices[index]]);
    return withVisual(['Смета в сумме '+addValues(m.costs)+' ₽. Найди пропущенную цену за единицу.',m.prices[i],
     'Сначала вычитаем стоимости известных строк, затем делим оставшуюся стоимость на количество.'],tableVisual(['Материал','Количество, шт.','Цена, ₽/шт.'],rows));
   },
   apply_price_reduction_to_one_category:({a,b,c,y})=>{
    const m=materialEstimate(a,b,c,y),i=a%3,discount=5;
    return tableTask(m,'Цена единицы в строке «'+m.products[i]+'» снизилась на '+discount+' ₽. Какова новая общая стоимость сметы?',addValues(m.costs)-discount*m.counts[i],
     'Снижение относится к каждой из '+m.counts[i]+' единиц. Вычитаем '+discount+' · '+m.counts[i]+' ₽.');
   },
   find_quantity_change_to_fit_budget:({a,b,c,y})=>{
    const m=materialEstimate(a,b,c,y),i=0,extra=b+1,limit=addValues(m.costs)+extra*m.prices[i]+m.prices[i]-1;
    return tableTask(m,'После покупки по смете можно докупить краску по той же цене. Бюджет всей закупки '+limit+' ₽. Сколько дополнительных единиц краски можно оплатить?',extra,
     'Из бюджета вычитаем стоимость сметы. Остаток делим на цену краски и берём целую часть.');
   },
   estimate_missing_quantity_from_average:({a,b,c,y})=>{
    const m=materialEstimate(a,b,c,y),i=b%3,rows=m.products.map((name,index)=>[name,i===index?'?':m.counts[index],m.prices[index]]);
    const average=rational(addValues(m.counts),3);
    return withVisual(['В среднем на одну строку приходится '+exact(average)+' единиц. Найди пропущенное количество.',m.counts[i],
     'Умножаем среднее на число строк и вычитаем количества из двух известных строк.'],tableVisual(['Материал','Количество, шт.','Цена, ₽/шт.'],rows));
   }
  }
 ]
});

Object.assign(reviewedLessons,{
 stat_bar_charts:'Значение показывает высота столбца по вертикальной шкале. У соседних отметок шкалы одинаковая разность. Сравнивай значения на одной шкале и учитывай единицу измерения.',
 stat_pie_charts:'Весь круг — это 100% или 360°. Угол сектора равен его доле от 360°. Чтобы найти число объектов в секторе, умножь долю на общее число объектов.',
 stat_population_pyramid:'Каждая строка показывает возрастную группу. Полосы слева и справа читают от общей нулевой отметки по одной шкале. Общая численность возрастной группы — сумма обеих полос.'
});
function textbookBars(a,b,c,y){
 const labels=['Пн','Вт','Ср','Чт','Пт'];
 const ordered=[a,a+b,a+b+c+14,a+b+c+y+42,a+b+c+y+44],shift=(a+b)%5;
 const values=ordered.slice(shift).concat(ordered.slice(0,shift));
 const scale=g6ChartScale(values);
 const data={labels,values,title:'Посетители библиотеки, чел.',maxValue:scale.maxValue,step:scale.step};
 return {labels,values,scale,visual:question=>g6AttachBarChart(question,data)};
}
function textbookPie(a,b){
 const labels=['Книги','Игры','Спорт','Музыка'];
 const rows=[[10,15,25,50],[10,20,30,40],[5,25,30,40],[15,20,30,35],[5,20,25,50],[10,15,35,40]];
 const numbers=rows[(a+b)%rows.length],shift=a%4;
 const values=numbers.slice(shift).concat(numbers.slice(0,shift));
 return {labels,values,visual:question=>g7AttachPie(question,{labels,values,title:'Распределение ответов, %'})};
}
const populationAges=['0–17','18–34','35–59','60+'];
const ageGroups=['Мужчины','Женщины'];
function populationModel(a,b,c,y){
 const men=[a+4,a+c,b+c+1,y+2].map(v=>2*v),women=[b+4,b+y,a+y+1,c+2].map(v=>2*v);
 const values=[men,women];
 return {men,women,values,visual:question=>{
  question.visual={type:'g7TextbookPopulation',data:{values,ages:populationAges}};
  const rows=populationAges.map((age,i)=>age+': мужчин — '+men[i]+', женщин — '+women[i]);
  question.journalPrompt=question.text+'<br>'+rows.join('; ');
  return question;
 }};
}
function populationChart({values,ages}){
 const max=Math.ceil(Math.max(...values.flat())/4)*4,leftZero=259,rightZero=301,length=205,scale=length/max;
 const x=(side,value)=>side===0?leftZero-value*scale:rightZero+value*scale;
 const text=(x,y,label,size=15)=>'<text x="'+x+'" y="'+y+'" fill="currentColor" text-anchor="middle" font-size="'+size+'">'+label+'</text>';
 const marks=Array.from({length:max/4+1},(_,i)=>i*4);
 const yAxis=237, colors=['#83b7ee','#daa1d4'];
 const grids=values.map((_,side)=>marks.map(mark=>'<line x1="'+x(side,mark)+'" x2="'+x(side,mark)+'" y1="38" y2="'+yAxis+'" stroke="currentColor" opacity=".24"/>'+text(x(side,mark),yAxis+19,mark)).join('')).join('');
 const bars=ages.map((age,i)=>{
  const y=56+45*i;
  return text(280,y+15,age,14)+values.map((counts,side)=>{
   const number=counts[i], edge=x(side,number), start=side===0?edge:rightZero;
   return '<rect x="'+start+'" y="'+y+'" width="'+number*scale+'" height="21" rx="3" fill="'+colors[side]+'">'+
    '<title>'+ageGroups[side]+', '+age+' лет: '+number+' тыс. чел.</title></rect>'+text(edge+(side===0?-15:15),y+15,number,13);
  }).join('');
 }).join('');
 return '<div class="g7-data-title">Численность по возрасту и полу, тыс. чел.</div><svg class="g7-population-svg" viewBox="0 0 560 278" role="img" aria-label="Возрастно-половая диаграмма" style="display:block;width:100%;max-width:560px;margin:auto">'+
  text(145,22,ageGroups[0],19)+text(415,22,ageGroups[1],19)+grids+bars+'</svg>';
}
const beforePopulationVisual=quizVisualHtml;
quizVisualHtml=function(question){
 const visual=question?.visual;
 return visual?.type==='g7TextbookPopulation'?populationChart(visual.data):beforePopulationVisual(question);
};
Object.assign(reviewed,{
 stat_bar_charts:[
  {
   read_day_value:({a,b,c,y})=>{
    const m=textbookBars(a,b,c,y),i=a%5;
    return tableTask(m,'Сколько посетителей пришло в день «'+m.labels[i]+'»?',m.values[i],'Считываем высоту столбца над «'+m.labels[i]+'».');
   },
   find_label_of_largest_column:({a,b,c,y})=>{
    const m=textbookBars(a,b,c,y),i=m.values.indexOf(Math.max(...m.values));
    return withVisual(choice('В какой день было больше всего посетителей?',m.labels[i],m.labels.filter((_,j)=>j!==i).slice(0,3),
     'Самый высокий столбец — над «'+m.labels[i]+'». Его высота '+m.values[i]+'.'),m.visual);
   },
   read_highest_and_lowest_gap:({a,b,c,y})=>{
    const m=textbookBars(a,b,c,y),hi=Math.max(...m.values),lo=Math.min(...m.values);
    return tableTask(m,'На сколько человек самый высокий столбец отличается от самого низкого?',hi-lo,
     'По шкале высоты '+hi+' и '+lo+'. Разность '+(hi-lo)+'.');
   },
   identify_days_above_mark:({a,b,c,y})=>{
    const m=textbookBars(a,b,c,y),threshold=a+b+c;
    return tableTask(m,'Сколько дней было строго больше '+threshold+' посетителей?',m.values.filter(v=>v>threshold).length,
     'Считаем только столбцы выше отметки '+threshold+'.');
   }
  },
  {
   compare_sum_two_against_another:({a,b,c,y})=>{
    const m=textbookBars(a,b,c,y),[u,v,w]=m.values;
    return tableTask(m,'На сколько человек отличаются сумма за понедельник и вторник и число за среду?',Math.abs(u+v-w),
     'За два дня '+u+' + '+v+' = '+(u+v)+'. За среду '+w+'. Берём разность большего и меньшего.');
   },
   find_combined_period_total:({a,b,c,y})=>{
    const m=textbookBars(a,b,c,y),start=a%3,values=m.values.slice(start,start+3);
    return tableTask(m,'Сколько всего людей за три дня с «'+m.labels[start]+'» по «'+m.labels[start+2]+'»?',addValues(values),
     'Складываем три соответствующих значения: '+values.join(' + ')+'.');
   },
   determine_mean_of_first_three:({a,b,c,y})=>{
    const m=textbookBars(a,b,c,y),rows=m.values.slice(0,3);
    return tableTask(m,'Найди среднее число посетителей за первые три дня в точном виде.',rational(addValues(rows),3),
     'Складываем '+rows.join(', ')+' и делим сумму на три.');
   },
   read_which_day_has_largest_increase:({a,b,c,y})=>{
    const m=textbookBars(a,b,c,y),diff=m.values.slice(1).map((v,i)=>v-m.values[i]),i=diff.indexOf(Math.max(...diff));
    return withVisual(choice('В какой день прирост относительно предыдущего дня был самым большим?',m.labels[i+1],m.labels.slice(1).filter((_,j)=>i!==j),
     'Разности соседних столбцов: '+diff.join(', ')+'. Берём наибольшую.'),m.visual);
   }
  },
  {
   exact_share_of_combined_days:({a,b,c,y})=>{
    const m=textbookBars(a,b,c,y),subtotal=m.values[1]+m.values[3],total=addValues(m.values);
    return tableTask(m,'Какую долю посетителей за пять дней дали вторник и четверг? Ответ запиши дробью.',rational(subtotal,total),
     'В числителе сумма за два указанных дня, '+subtotal+'. В знаменателе сумма пяти столбцов, '+total+'.');
   },
   compute_relative_increase_from_bars:({a,b,c,y})=>{
    const m=textbookBars(a,b,c,y),min=Math.min(...m.values),max=Math.max(...m.values);
    return tableTask(m,'На сколько процентов максимальное число посетителей больше минимального? Запиши точное значение без знака процента.',rational(100*(max-min),min),
     'Находим разность '+(max-min)+'. Делим на минимум '+min+' и умножаем на 100.');
   },
   remove_one_column_and_recalculate:({a,b,c,y})=>{
    const m=textbookBars(a,b,c,y),high=Math.max(...m.values),total=addValues(m.values);
    return tableTask(m,'Из подсчёта исключили день с наибольшим числом посетителей. Найди новое среднее в точном виде.',rational(total-high,4),
     'Из общей суммы '+total+' вычитаем '+high+' и делим на четыре оставшихся дня.');
   },
   expected_extra_to_hit_daily_average:({a,b,c,y})=>{
    const m=textbookBars(a,b,c,y),total=addValues(m.values),target=Math.ceil(total/5)+a;
    return tableTask(m,'Добавили шестой день. В среднем за шесть дней получилось '+target+' посетителей в день. Сколько пришло в шестой день?',6*target-total,
     'За шесть дней получается 6 · '+target+' = '+6*target+'. Из этой суммы вычитаем '+total+' за первые пять дней.');
   }
  }
 ],
 stat_pie_charts:[
  {
   exact_share_at_sector:({a,b})=>{
    const m=textbookPie(a,b),i=a%4;
    return tableTask(m,'Какой процент соответствует сектору «'+m.labels[i]+'»?',m.values[i],'Находим сектор по легенде и читаем его долю.');
   },
   name_largest_slice:({a,b})=>{
    const m=textbookPie(a,b),i=m.values.indexOf(Math.max(...m.values));
    return withVisual(choice('К какой категории относится самый большой сектор?',m.labels[i],m.labels.filter((_,j)=>j!==i),
     'Самый большой сектор занимает '+m.values[i]+'% круга.'),m.visual);
   },
   compare_slices_in_points:({a,b})=>{
    const m=textbookPie(a,b),i=a%4,j=(i+1)%4;
    return tableTask(m,'На сколько процентных пунктов отличаются доли «'+m.labels[i]+'» и «'+m.labels[j]+'»?',Math.abs(m.values[i]-m.values[j]),
     'Берём разность большей и меньшей долей, выраженных в процентах.');
   },
   percent_outside_selected_sector:({a,b})=>{
    const m=textbookPie(a,b),i=b%4;
    return tableTask(m,'Какой процент занимают все сектора, кроме «'+m.labels[i]+'»?',100-m.values[i],'Из 100% вычитаем долю выбранного сектора.');
   }
  },
  {
   section_angle_from_share:({a,b})=>{
    const m=textbookPie(a,b),i=a%4;
    return tableTask(m,'Чему равен центральный угол сектора «'+m.labels[i]+'»?',360*m.values[i]/100,
     'Умножаем 360° на '+m.values[i]+' / 100.');
   },
   count_people_in_selected_slice:({a,b})=>{
    const m=textbookPie(a,b),i=b%4,total=20*(a+b);
    return tableTask(m,'Ответило '+total+' человек. Сколько выбрали «'+m.labels[i]+'»?',total*m.values[i]/100,
     'Берём '+m.values[i]+'% от '+total+'.');
   },
   combined_share_and_complement:({a,b})=>{
    const m=textbookPie(a,b),i=a%4,j=(i+1)%4;
    return tableTask(m,'Какой процент занимают все сектора, кроме «'+m.labels[i]+'» и «'+m.labels[j]+'»?',100-m.values[i]-m.values[j],
     'Из 100% вычитаем '+m.values[i]+'% и '+m.values[j]+'%.');
   },
   ratio_of_two_sector_angles:({a,b})=>{
    const m=textbookPie(a,b),i=a%4,j=(i+2)%4;
    return tableTask(m,'Чему равно отношение центральных углов «'+m.labels[i]+'» к «'+m.labels[j]+'»? Запиши дробью.',rational(m.values[i],m.values[j]),
     'Отношение углов равно отношению долей: '+m.values[i]+' / '+m.values[j]+'.');
   }
  },
  {
   infer_total_from_slice_count:({a,b})=>{
    const m=textbookPie(a,b),i=a%4,total=20*(a+b),n=total*m.values[i]/100;
    return tableTask(m,'«'+m.labels[i]+'» выбрали '+n+' человек. Сколько всего человек ответило?',total,
     'Число '+n+' соответствует доле '+m.values[i]+' / 100. Делим это число на долю.');
   },
   find_difference_counts_using_partial_count:({a,b})=>{
    const m=textbookPie(a,b),i=a%4,j=(i+1)%4,total=20*(a+b),n=total*m.values[i]/100;
    return tableTask(m,'«'+m.labels[i]+'» выбрали '+n+' человек. На сколько человек отличаются числа выбравших «'+m.labels[i]+'» и «'+m.labels[j]+'»?',
     total*Math.abs(m.values[i]-m.values[j])/100,
     'Сначала делим '+n+' на '+m.values[i]+' / 100, получаем '+total+' человек. Берём разность долей от этого числа.');
   },
   share_after_excluding_two_categories:({a,b})=>{
    const m=textbookPie(a,b),i=a%4,j=(i+3)%4;
    return tableTask(m,'Оставили ответы «'+m.labels[i]+'» и «'+m.labels[j]+'». Какую долю среди них занимают «'+m.labels[i]+'»?',rational(m.values[i],m.values[i]+m.values[j]),
     'В новой группе всего '+(m.values[i]+m.values[j])+' долей из исходных ста. Числитель '+m.values[i]+'.');
   },
   compare_angles_of_two_combined_groups:({a,b})=>{
    const m=textbookPie(a,b),i=a%4,j=(i+2)%4,share=m.values[i]+m.values[j];
    return tableTask(m,'Объединили «'+m.labels[i]+'» и «'+m.labels[j]+'» в сектор, все остальные — в другой. На сколько градусов отличаются их углы?',rational(18*Math.abs(2*share-100),5),
     'Доли '+share+'% и '+(100-share)+'%. Переводим разность долей в градусы: умножаем на 360° и делим на 100.');
   }
  }
 ],
 stat_population_pyramid:[
  {
   read_age_and_sex_cell:({a,b,c,y})=>{
    const m=populationModel(a,b,c,y),age=a%4,side=b%2;
    return tableTask(m,'Сколько тысяч человек в группе «'+ageGroups[side]+'», возраст '+populationAges[age]+' лет?',m.values[side][age],
     'Читаем длину полосы от нуля в нужной строке и на нужной половине.');
   },
   name_age_with_most_men:({a,b,c,y})=>{
    const m=populationModel(a,b,c,y),high=Math.max(...m.men);
    return tableTask(m,'Сколько тысяч мужчин в самой многочисленной мужской возрастной группе?',high,
     'На левой половине ищем самую длинную полосу. Её значение '+high+' тыс.');
   },
   read_more_from_one_pair:({a,b,c,y})=>{
    const m=populationModel(a,b,c,y),i=a%4,men=m.men[i],women=m.women[i];
    return withVisual(choice('Кого больше в возрастной группе '+populationAges[i]+' лет?',men>women?'Мужчин':women>men?'Женщин':'Поровну',
     ['Мужчин','Женщин','Поровну'].filter(label=>label!==(men>women?'Мужчин':women>men?'Женщин':'Поровну')),
     'Сравниваем левую и правую полосы одной строки: '+men+' и '+women+' тыс.'),m.visual);
   },
   find_gap_between_two_ages_one_sex:({a,b,c,y})=>{
    const m=populationModel(a,b,c,y),i=a%4,j=(i+1)%4;
    return tableTask(m,'На сколько тысяч различается число женщин в группах '+populationAges[i]+' и '+populationAges[j]+' лет?',Math.abs(m.women[i]-m.women[j]),
     'На правой половине читаем '+m.women[i]+' и '+m.women[j]+'. Берём разность.');
   }
  },
  {
   population_total_by_age:({a,b,c,y})=>{
    const m=populationModel(a,b,c,y),i=b%4;
    return tableTask(m,'Сколько тысяч человек в возрастной группе '+populationAges[i]+' лет вместе?',m.men[i]+m.women[i],'Складываем обе полосы в этой строке.');
   },
   sum_by_one_sex:({a,b,c,y})=>{
    const m=populationModel(a,b,c,y),i=a%2;
    return tableTask(m,'Какова общая численность группы «'+ageGroups[i]+'» в тысячах?',addValues(m.values[i]),'Складываем все четыре полосы с нужной стороны.');
   },
   compare_age_groups_total:({a,b,c,y})=>{
    const m=populationModel(a,b,c,y),i=a%4,j=(i+2)%4,p=m.men[i]+m.women[i],q=m.men[j]+m.women[j];
    return tableTask(m,'На сколько тысяч человек различаются общие размеры групп '+populationAges[i]+' и '+populationAges[j]+' лет?',Math.abs(p-q),
     'Сначала складываем обе полосы в каждой строке. Получаем '+p+' и '+q+' тыс., затем берём разность.');
   },
   filter_age_by_male_female_inequality:({a,b,c,y})=>{
    const m=populationModel(a,b,c,y);
    return tableTask(m,'В скольких возрастных группах женщин строго больше мужчин?',m.women.filter((v,i)=>v>m.men[i]).length,
     'Сравниваем полосы слева и справа в каждой строке. Равные не учитываем.');
   }
  },
  {
   compute_female_share_in_one_age:({a,b,c,y})=>{
    const m=populationModel(a,b,c,y),i=a%4;
    return tableTask(m,'Какую долю возрастной группы '+populationAges[i]+' лет составляют женщины? Запиши дробью.',rational(m.women[i],m.women[i]+m.men[i]),
     'Числитель — женщины, знаменатель — обе полосы выбранной строки в сумме.');
   },
   compute_share_of_two_age_groups:({a,b,c,y})=>{
    const m=populationModel(a,b,c,y),i=b%3,group=m.values.flatMap(row=>row.slice(i,i+2));
    return tableTask(m,'Какую долю всего населения составляют возрастные группы '+populationAges[i]+' и '+populationAges[i+1]+' лет вместе?',
     rational(addValues(group),addValues(m.values.flat())),'Суммируем обе половины в двух выбранных строках и делим на сумму всех полос.');
   },
   extended_totals_by_sex_and_age:({a,b,c,y})=>{
    const m=populationModel(a,b,c,y),men=m.men.slice(0,3),women=m.women.slice(1);
    return tableTask(m,'На сколько тысяч различаются число мужчин младше 60 лет и число женщин от 18 лет?',Math.abs(addValues(men)-addValues(women)),
     'Из мужской части берём первые три строки, из женской — последние три. Сравниваем суммы.');
   },
   compare_relative_shares_two_groups:({a,b,c,y})=>{
    const m=populationModel(a,b,c,y),i=a%4,j=(i+1)%4,left=rational(m.women[i],m.women[i]+m.men[i]),right=rational(m.women[j],m.women[j]+m.men[j]);
    return withVisual(compare('Сравни доли женщин среди всех людей в группах '+populationAges[i]+' и '+populationAges[j]+' лет. Первая доля соответствует первой группе.',left,right,
     'Для каждой возрастной группы делим длину правой полосы на сумму обеих длин.'),m.visual);
   }
  }
 ]
});

Object.assign(reviewedLessons,{
 stat_arithmetic_mean:'Среднее арифметическое — сумма всех значений, делённая на их количество. Повторяющиеся значения учитывай столько раз, сколько они встречаются.',
 stat_median:'Упорядочь значения. При нечётном их количестве медиана — центральное значение. При чётном — среднее арифметическое двух центральных.',
 stat_min_max_range:'Минимум — наименьшее значение, максимум — наибольшее. Размах равен разности максимума и минимума и всегда неотрицателен.',
 stat_mean_properties:'Если каждое значение сдвигают на одно число, среднее сдвигается на то же число. При умножении всех значений на один множитель среднее умножается на него. Для объединения наборов складывай суммы, а затем дели на суммарное количество.',
 stat_choose_characteristic:'Среднее учитывает все значения, медиана описывает середину упорядоченного набора, размах — расстояние между крайними значениями. Резко выделяющееся значение обычно сильнее влияет на среднее, чем на медиану.'
});
const dataList=values=>values.map(fmt).join(', ');
const sortedValues=values=>values.slice().sort((x,y)=>x-y);
function medianValue(values){
 const sorted=sortedValues(values),i=Math.floor(sorted.length/2);
 return sorted.length%2?rational(sorted[i]):rational(sorted[i-1]+sorted[i],2);
}
function dataMean(values){return rational(addValues(values),values.length);}
function medianTask(values,prompt='Найди медиану набора'){
 const value=medianValue(values);
 return [prompt+' '+dataList(values)+'.',value,'После сортировки получаем '+dataList(sortedValues(values))+'. Медиана — '+exact(value)+'.'];
}
function meanTask(values,prompt='Найди среднее арифметическое чисел'){
 return [prompt+' '+dataList(values)+'.',dataMean(values),'Сумма равна '+addValues(values)+'. Делим её на '+values.length+'.'];
}
const statisticNames=['Среднее арифметическое','Медиана','Размах','Максимум'];
function pickStatistic(prompt,i,ex){
 return choice(prompt,statisticNames[i],statisticNames.filter((_,j)=>j!==i),ex);
}

Object.assign(reviewed,{
 stat_arithmetic_mean:[
  {
   mean_of_two:({a,b})=>meanTask([a,b]),
   mean_of_three:({a,b,c})=>meanTask([a,b,c]),
   mean_with_zero:({a,b,c})=>meanTask([a,0,b,c]),
   mean_of_repeating_values:({a,b})=>meanTask([a,b,a,a,b])
  },
  {
   recover_sum:({a,b})=>['Среднее '+a+' чисел равно '+b+'. Найди их сумму.',a*b,'Если сумму делили на '+a+', то её можно восстановить умножением.'],
   find_missing_member:({a,b})=>['Среднее чисел '+a+', '+(a+b)+' и x равно '+(a+b)+'. Найди x.',a+2*b,'Общая сумма '+3*(a+b)+'. Вычитаем два известных числа.'],
   mean_signed:({a,b,c,y})=>meanTask([-a,b,-c,y]),
   mean_from_frequency_table:({a,b,c,y})=>{
    const values=[a,a+2,a+5],counts=[b,c,y],total=b+c+y,weighted=values.map((value,i)=>value*counts[i]);
    return withVisual(['Найди среднее значение в точном виде.',rational(addValues(weighted),total),
     'Умножаем значения на частоты, складываем произведения и делим на общую частоту '+total+'.'],tableVisual(['Значение','Частота'],values.map((value,i)=>[value,counts[i]])));
   }
  },
  {
   new_observation_from_two_means:({a,b})=>['Среднее '+a+' чисел равно '+(b+10)+', после добавления одного числа среднее стало '+(b+11)+'. Какое число добавили?',a+b+11,
    'Новая сумма ('+a+' + 1) · '+(b+11)+'. Старая сумма '+a+' · '+(b+10)+'. Вычитаем.'],
   combine_unequal_sets:({a,b,c,y})=>['У группы из '+a+' участников среднее '+b+' баллов, у группы из '+c+' участников — '+y+' баллов. Найди точное среднее обеих групп.',rational(a*b+c*y,a+c),
    'Суммарные баллы '+a+' · '+b+' + '+c+' · '+y+'. Делим на '+(a+c)+' участников.'],
   correct_one_value:({a,b,c})=>['Среднее '+a+' показаний равно '+(b+c)+'. Затем одно показание исправили, увеличив на '+c+'. Найди новое среднее.',rational(a*(b+c)+c,a),
    'К сумме '+a*(b+c)+' прибавляем '+c+' и делим на прежнее количество.'],
   solve_for_two_linked_values:({a,b})=>{
    const average=a+b,x=a+b+2;
    return ['Среднее чисел '+(a-1)+', '+(a+b-3)+', x и x + '+b+' равно '+average+'. Найди x.',x,
     'Вычитаем два известных числа и добавку '+b+' из суммы '+4*average+'. Оставшееся 2x делим на 2.'];
   }
  }
 ],
 stat_median:[
  {
   middle_of_three:({a,b,c})=>medianTask([a+b+c,a,a+b]),
   middle_of_five:({a,b,c,y})=>medianTask([c,y,a,b,a+c]),
   middle_two_of_four:({a,b,c,y})=>medianTask([b+c,b,y+a,a]),
   middle_with_repetition:({a,b})=>medianTask([a+b,a,b,a,a+b])
  },
  {
   median_of_negative_and_positive:({a,b,c,y})=>medianTask([a,-b,c,-y,-c,b]),
   median_from_frequency_table:({a,b,c})=>{
    const values=[a,a+2,a+4],counts=[c,c+1,c];
    return withVisual(['Найди медиану набора, заданного частотами.',a+2,
     'В порядке возрастания сначала идут '+c+' значений '+a+', затем '+(c+1)+' значений '+(a+2)+'. Середина попадает в этот блок.'],
     tableVisual(['Значение','Частота'],values.map((value,i)=>[value,counts[i]])));
   },
   find_middle_entry_from_median:({a,b})=>['По возрастанию записаны числа '+a+', '+(a+1)+', x, '+(a+b+4)+' и '+(a+b+6)+'. Медиана '+(a+b+2)+'. Найди x.',a+b+2,
    'У пяти упорядоченных чисел медиана — третье.'],
   compare_mean_and_median:({a,b,c})=>{
    const values=[a,a+b,a+b,a+b+c,a+b+c+1],median=medianValue(values),mean=dataMean(values);
    return compare('Сравни среднее арифметическое и медиану чисел '+dataList(values)+'.',mean,median,
     'Среднее '+exact(mean)+', медиана '+exact(median)+'.');
   }
  },
  {
   median_after_adding_new_extreme:({a,b,c})=>medianTask([a+c+3,a,a+b+c+4,a+c,a+c+1,a+b+c+6],
    'В набор добавили последнее число из списка. Найди новую медиану окончательного набора'),
   recover_unknown_adjacent_to_median:({a,b})=>{
    const x=a+2*b+2,known=a+2,median=(known+x)/2;
    return ['В порядке возрастания записаны '+a+', '+known+', x, '+(x+3)+'. Медиана '+fmt(median)+'. Найди x.',x,
     'Среднее двух центральных равно '+fmt(median)+'. Удваиваем его и вычитаем '+known+'.'];
   },
   median_after_removal_and_addition:({a,b,c})=>{
    const values=[a,a+b,a+b+2,a+b+c+3,a+b+c+5],newValues=values.slice(1).concat([a+b+c+8]),median=medianValue(newValues);
    return ['Из набора '+dataList(values)+' удалили минимум и добавили '+newValues.at(-1)+'. Найди новую медиану.',median,
     'После замены порядок '+dataList(newValues)+'. Третье значение — '+exact(median)+'.'];
   },
   evaluate_gap_between_two_medians:({a,b,c})=>{
    const first=[a,a+2,a+c+3,a+c+4],second=[a+b,a+b+2,a+b+c+3,a+b+c+4];
    return ['Первый набор '+dataList(first)+'. Второй '+dataList(second)+'. На сколько медиана второго больше медианы первого?',b,
     'Во втором наборе каждое значение больше на '+b+'. Два центральных значения и их среднее сдвигаются на ту же величину.'];
   }
  }
 ],
 stat_min_max_range:[
  {
   identify_minimum:({a,b,c})=>['Найди минимум набора '+dataList([a+b,a+c,a,a+b+c])+'.',a,'Выбираем наименьшее из значений.'],
   identify_maximum:({a,b,c})=>['Найди максимум набора '+dataList([a,a+b+c,a+b,a+c])+'.',a+b+c,'Выбираем наибольшее из значений.'],
   range_from_positive_values:({a,b,c})=>['Найди размах значений '+dataList([a+b,a,a+b+c,a+c])+'.',b+c,'Размах равен '+(a+b+c)+' − '+a+'.'],
   zero_range_of_constant_data:({a,b})=>['Все '+a+' значений набора равны '+b+'. Чему равен размах?',0,'Минимум и максимум совпадают. Их разность равна 0.']
  },
  {
   range_including_negative:({a,b,c})=>['Найди размах чисел '+dataList([c,-a,b+c,b,0])+'.',a+b+c,'Вычитаем минимум −'+a+' из максимума '+(b+c)+'.'],
   recover_minimum:({a,b,c})=>['Максимум набора равен '+(a+b)+', размах равен '+(a+b+c)+'. Найди минимум.',-c,'Минимум — максимум минус размах.'],
   recover_maximum:({a,b})=>['Минимум набора равен −'+a+', размах равен '+(a+b)+'. Найди максимум.',b,'Максимум — минимум плюс размах.'],
   compare_ranges:({a,b,c})=>{
    const first=[a,a+c,a+b+c],second=[0,b,c+2];
    return compare('Сравни размах набора '+dataList(first)+' с размахом набора '+dataList(second)+'.',rational(b+c),rational(Math.max(b,c+2)),
     'В каждом наборе отдельно вычитаем минимум из максимума.');
   }
  },
  {
   effect_removing_extreme:({a,b,c})=>{
    const values=[a,a+b,a+b+c,a+b+c+1];
    return ['Из набора '+dataList(values)+' удалили минимум. На сколько уменьшился размах?',b,
     'Максимум не изменился, а минимум вырос с '+a+' до '+(a+b)+'.'];
   },
   extrema_after_multiplying_negative:({a,b,c})=>['Минимум набора −'+a+', максимум '+b+'. Все числа умножили на −'+c+'. Найди новый размах.',(a+b)*c,
    'После умножения больший исходный элемент становится минимумом −'+b*c+', а меньший — максимумом '+a*c+'.'],
   allowable_new_value_with_range:({a,b,c})=>{
    const low=a,high=a+b,newHigh=high+c;
    return ['Минимум '+low+', максимум '+high+'. Добавили число больше максимума. Размах стал '+(b+c)+'. Найди добавленное число.',newHigh,
     'Минимум не меняется. Новый максимум '+low+' + '+(b+c)+' = '+newHigh+'.'];
   },
   merge_ranges_with_shared_marker:({a,b,c})=>['Минимум первого набора −'+a+', его размах '+(a+b)+'. Второй набор имеет минимум '+b+' и размах '+c+'. Найди размах объединения.',a+b+c,
    'Минимум объединения −'+a+', максимум '+(b+c)+'. Вычисляем их разность.']
  }
 ],
 stat_mean_properties:[
  {
   shift_all_values:({a,b})=>['Среднее равно '+a+'. Каждое значение увеличили на '+b+'. Найди новое среднее.',a+b,'Сдвиг каждого значения на '+b+' сдвигает среднее на '+b+'.'],
   scale_all_values:({a,b})=>['Среднее равно '+a+'. Каждое значение умножили на '+b+'. Найди новое среднее.',a*b,'Среднее умножается на тот же коэффициент.'],
   recover_mean_before_shift:({a,b})=>['После уменьшения каждого значения на '+b+' среднее стало '+a+'. Каким было среднее сначала?',a+b,'Для восстановления прибавляем к новому среднему величину понижения.'],
   copy_whole_data_set:({a,b})=>['В наборе '+a+' чисел, их среднее '+b+'. Каждое число записали ещё один раз. Найди среднее нового набора.',b,'Число значений и их сумма одновременно удвоились.']
  },
  {
   scale_then_translate:({a,b,c})=>['Среднее равно '+a+'. Каждое значение умножили на '+b+', затем вычли '+c+'. Найди новое среднее.',a*b-c,'Сначала умножаем среднее на '+b+', потом вычитаем '+c+'.'],
   change_only_one_observation:({a,b,c})=>['Было '+a+' значений со средним '+b+'. Только одно значение увеличили на '+c+'. Найди точное новое среднее.',rational(a*b+c,a),
    'Сумма растёт на '+c+', а среднее растёт на '+exact(rational(c,a))+'.'],
   add_observation_equal_to_mean:({a,b,c})=>['Среднее '+a+' наблюдений равнялось '+b+'. Добавили ещё '+c+' наблюдений, каждое равно '+b+'. Чему теперь равно среднее?',b,
    'И прежняя группа, и добавленная группа имеют одно среднее.'],
   recover_observation_removed:({a,b,c})=>['Среднее '+a+' значений равно '+(b+c)+'. После удаления одного значения среднее уменьшилось на '+b+'. Найди удалённое значение.',a*b+c,
    'Старая сумма '+a*(b+c)+', новая '+(a-1)*c+'. Разность даёт удалённое число.']
  },
  {
   recover_missing_group_mean:({a,b,c})=>{
    const mean=a+b+c,x=mean+a,y=mean-b;
    return ['В первой группе '+b+' человек, среднее '+x+'. Во второй '+a+' человек. Среднее обеих групп '+mean+'. Найди среднее во второй группе.',y,
     'Из общей суммы ('+a+' + '+b+') · '+mean+' вычитаем '+b+' · '+x+' и делим на '+a+'.'];
   },
   compare_same_mean_after_partial_change:({a,b,c})=>['В двух группах по '+(a+b)+' наблюдений, их средние первоначально равны. В первой группе '+a+' значений увеличили на '+c+', во второй '+b+' значений увеличили на '+c+'. На сколько отличаются новые средние?',
    rational(Math.abs(a-b)*c,a+b),'Разность приростов общих сумм равна |'+a+' − '+b+'| · '+c+'. Делим на размер группы.'],
   express_linear_change_backwards:({a,b,c})=>['Все числа умножили на '+a+' и прибавили '+b+'. Среднее стало '+(a*c+b)+'. Найди исходное среднее.',c,
    'Сначала убираем добавку '+b+', затем делим на '+a+'.'],
   weighted_average_after_replacements:({a,b,c})=>['В группе '+(a+b)+' наблюдений со средним '+c+'. У '+a+' наблюдений значения уменьшили на '+b+', у остальных увеличили на '+a+'. Каким стало среднее?',c,
    'Уменьшение суммы '+a+' · '+b+' и увеличение '+b+' · '+a+' равны. Среднее сохраняется.']
  }
 ],
 stat_choose_characteristic:[
  {
   choose_typical_middle:({a,b})=>pickStatistic('Есть '+(2*a+1)+' записей в порядке возрастания. Как называется значение ровно посередине?',1,'Медиана для нечётного числа записей — центральное значение.'),
   choose_extreme_range:({a,b})=>pickStatistic('Как называется разность между наибольшим и наименьшим показанием, если измерений '+(a+b)+'?',2,'Это размах: максимум минус минимум.'),
   choose_equal_distribution:({a,b})=>pickStatistic('У '+a+' учеников результаты хотят мысленно распределить поровну с сохранением общей суммы. Какой показатель нужен?',0,'Равная доля общей суммы — среднее арифметическое.'),
   choose_highest_record:({a,b})=>pickStatistic('На соревновании с '+(a+b)+' участниками нужно найти самое высокое число набранных очков. Какой показатель нужен?',3,'Самое большое значение — максимум.')
  },
  {
   choose_with_one_expensive_outlier:({a,b})=>pickStatistic('Среди цен '+dataList([a+b,a+b+1,a+b+2,a+b+3,10*(a+b)])+' нужно выбрать середину упорядоченного списка. Что взять?',1,
    'Дорогой крайний товар не сдвигает центральную запись в этом списке.'),
   distinguish_range_from_maximum:({a,b})=>pickStatistic('Температура опускалась до −'+a+'° и поднималась до '+b+'°. Какая характеристика отвечает на вопрос о ширине колебания?',2,'Ширину от минимума до максимума задаёт размах.'),
   reconstruct_total_using_mean:({a,b})=>pickStatistic('Известно число измерений '+(a+b)+'. Какую характеристику нужно узнать, чтобы умножением на число измерений восстановить сумму?',0,'Сумма равна среднему, умноженному на количество.'),
   choose_middle_for_ordinal_data:({a,b})=>pickStatistic('В анкете '+(2*a+1)+' ответов «низкий», «средний» и «высокий». Ответы отсортировали. Как назвать центральную категорию?',1,'Упорядоченные категории позволяют выбрать центральный ответ без вычисления среднего.')
  },
  {
   compare_responses_to_outlier:({a,b})=>{
    const values=[a,a+1,a+2,a+3,a+4],next=a+4+b;
    return withVisual(choice('В наборе заменили последнее значение на '+next+'. Какая характеристика сохранилась?', 'Медиана',
     ['Среднее арифметическое','Размах','Максимум'],'Центральное значение остаётся '+(a+2)+'. Все остальные предложенные характеристики изменились.'),
     tableVisual(['Запись','Значение'],values.map((value,i)=>[i+1,value])));
   },
   identify_what_equal_mean_does_not_fix:({a,b})=>{
    const x=a+b;
    return pickStatistic('Наборы '+dataList([x-2,x,x+2])+' и '+dataList([x-4,x,x+4])+'. Какой показатель меняется и показывает, насколько сильнее рассеяны крайние значения?',2,
     'Середины наборов и средние одинаковы, но размах первого 4, второго 8.');
   },
   select_statistic_fixed_by_extreme_swap:({a,b})=>{
    const x=a+b;
    return pickStatistic('У чисел '+dataList([x-2,x,x+2])+' минимум уменьшили на 1, максимум увеличили на 1. Какую характеристику можно проверить по неизменной общей сумме?',0,
     'Сумма сохранилась, число значений то же, поэтому среднее не меняется.');
   },
   compare_two_medians_despite_extreme:({a,b})=>{
    const aValues=[a,a+1,a+2,a+3,a+4+b],bValues=[a+1,a+3,a+4,a+5,a+6];
    return compare('Сравни медианы. Первый набор '+dataList(aValues)+', второй '+dataList(bValues)+'.',medianValue(aValues),medianValue(bValues),
     'В каждом упорядоченном наборе берём третье значение.');
   }
  }
 ]
});

Object.assign(reviewedLessons,{
 stat_random_variability:'Повторные наблюдения могут давать разные результаты даже при одинаковых условиях. Различай общий ход процесса и отдельные колебания. По одному отклонению нельзя установить его причину.',
 stat_measurement_error:'Абсолютная погрешность — модуль разности измеренного и истинного значений. Если погрешность не превышает d, истинное значение лежит от измеренного минус d до измеренного плюс d.',
 stat_real_process_graphs:'На графике проверь единицы на обеих осях. Считывай значения в заданные моменты и сравнивай изменения между ними. Общая тенденция может сохраняться при временных колебаниях.'
});
const wholeRange=values=>Math.max(...values)-Math.min(...values);
function observeProcess(values,title='Посетители, чел.'){
 const data={title,xLabel:'День',yLabel:'Число посетителей',points:values.map((value,index)=>({t:index+1,value}))};
 return {values,visual:question=>g7AttachProcess(question,data)};
}
function chooseConclusion(prompt,correct,incorrect,ex,model){
 return withVisual(choice(prompt,correct,incorrect,ex),model.visual);
}
Object.assign(reviewed,{
 stat_random_variability:[
  {
   recognize_different_repetitions:({a,b})=>checkStatement('Два ученика одного возраста пробежали одинаковую дистанцию за '+(a+b+10)+' и '+(a+b+11)+' с. Могут ли результаты повторных забегов немного различаться?',true,'Различия возможны даже у одного ученика на той же дистанции.'),
   distinguish_constant_from_variable:({a,b})=>choice('В четырёх забегах длина дорожки оставалась '+(10*(a+b))+' м, а время было разным. Какая величина менялась?','Время забега',['Длина дорожки','Обе величины','Ни одна'],'Длина дорожки фиксирована, время различается.'),
   count_records_that_match:({a,b})=>{
    const x=a+b,values=[x,x+1,x,x-1,x+2];
    return ['Записали '+dataList(values)+'. Сколько записей имеют значение '+x+'?',countOccurrence(values,x),'Считаем совпадения с '+x+'.'];
   },
   identify_same_results_in_one_series:({a,b})=>checkStatement('Повторили одно измерение четыре раза: '+dataList([a,a+b,a,a-1])+'. Все результаты совпали?',false,'Значения '+a+' и '+(a+b)+' различны.')
  },
  {
   compare_variability_by_range:({a,b})=>{
    const u=[a,a+b,a+1],v=[a,a+b+2,a+2];
    return compare('Сравни размах первой серии '+dataList(u)+' и второй '+dataList(v)+'.',rational(wholeRange(u)),rational(wholeRange(v)),'Вычисляем размах каждой серии отдельно.');
   },
   same_mean_different_variability:({a,b})=>{
    const x=a+b,values=[x-b,x,x+b];
    return ['В первой серии все результаты равны '+x+'. Во второй '+dataList(values)+'. На сколько размах второй серии больше?',2*b,'Оба средних равны, но у первой серии размах 0. У второй разность крайних значений '+2*b+'.'];
   },
   find_departure_from_reference:({a,b})=>{
    const x=a+b+5,values=[x-b,x+1,x+b+2,x];
    return ['Опорное значение '+x+'. Записи '+dataList(values)+'. Каково наибольшее отклонение по модулю?',b+2,'Берём модули разностей каждой записи с опорным значением.'];
   },
   avoid_predicting_a_single_result:({a,b})=>choice('За четыре дня в автобус сели '+dataList([a+b,a+b+1,a+b+3,a+b-1])+' пассажиров. Что можно сказать про точное число завтра?','По этим данным его нельзя установить',['Оно всегда равно последнему','Оно гарантированно равно максимуму','Оно гарантированно равно среднему'],'Изменчивость допускает другие значения. Набор описывает наблюдения за прошедшие дни.')
  },
  {
   separate_growth_from_temporary_change:({a,b})=>{
    const x=a+b,values=[x,x+4,x+3,x+7,x+9];
    return chooseConclusion('Как описать общий ход наблюдений?','Общий рост с одним снижением',['Непрерывное снижение','Рост без снижений','Все значения равны'],'Последнее значение выше первого, но между вторым и третьим днями было снижение.',observeProcess(values));
   },
   estimate_typical_value_with_symmetric_fluctuations:({a,b})=>{
    const x=20+a+b,values=[x-b,x+2,x+b,x-2,x];
    return ['Наблюдения колеблются около общего уровня: '+dataList(values)+'. Найди среднее, чтобы оценить уровень.',x,'Два положительных и два отрицательных отклонения попарно компенсируются.'];
   },
   compare_spreads_for_two_methods:({a,b})=>{
    const x=30+a+b,u=[x-2,x,x+2],v=[x-b-2,x,x+b+2];
    return ['Способ A дал '+dataList(u)+', способ B — '+dataList(v)+'. На сколько размах B больше размаха A?',2*b,'Размах A равен 4, размах B равен '+wholeRange(v)+'.'];
   },
   explain_why_no_cause_in_record:({a,b})=>chooseConclusion('В середине наблюдений было кратковременное снижение. Какой вывод обоснован?',
    'Известен размер снижения, причину надо выяснять',['Известна точная причина снижения','Снижение обязано повториться завтра','Все значения снижаются'],'График фиксирует ход наблюдений. Причина не записана.',observeProcess([a+b,a+b+3,a+1,a+b+7]))
  }
 ],
 stat_measurement_error:[
  {
   error_when_result_is_high:({a,b})=>['Истинная длина '+a+' см, измеренная '+(a+b)+' см. Найди абсолютную погрешность.',b,'Берём модуль разности измеренной и истинной длин.'],
   error_when_result_is_low:({a,b})=>['Истинная длина '+(a+b)+' см, измеренная '+a+' см. Найди абсолютную погрешность.',b,'Модуль разности не зависит от того, какая длина больше.'],
   zero_error:({a,b})=>['Измеренное и истинное значение совпадают: '+(a+b)+' г. Чему равна абсолютная погрешность?',0,'Разность одинаковых значений нулевая.'],
   upper_bound_from_reading:({a,b})=>['Запись измерения ('+(a+b)+' ± '+b+') см. Какую верхнюю границу допускает эта запись?',a+2*b,'Прибавляем предельную погрешность к результату измерения.']
  },
  {
   check_number_in_allowed_interval:({a,b})=>{
    const value=a+b,delta=b%3,actual=value+delta+(a%3-1);
    return checkStatement('Измерение записано как ('+value+' ± '+delta+') см. Допускает ли оно истинное значение '+actual+' см?',Math.abs(value-actual)<=delta,
     'Допустимы значения от '+(value-delta)+' до '+(value+delta)+' см включительно.');
   },
   get_interval_width:({a,b})=>['Измерение ('+(a+b)+' ± '+b+') см. Чему равна ширина допустимого промежутка?',2*b,'Между нижней и верхней границей две предельные погрешности.'],
   restore_midpoint_from_bounds:({a,b})=>['Истинная длина по записи прибора лежит от '+a+' до '+(a+2*b)+' см. Границы симметричны относительно показания прибора. Каково показание?',a+b,'Берём середину промежутка.'],
   compare_absolute_errors:({a,b})=>['Истинное значение '+(a+b+5)+' см. Первый прибор показал '+(a+5)+' см, второй '+(a+2*b+6)+' см. Какой прибор дал меньшую погрешность?','Первый',['Второй','Погрешности равны'],'У первого погрешность '+b+' см, у второго '+(b+1)+' см.']
  },
  {
   interval_for_sum:({a,b,c})=>['Длины отрезков записаны как ('+(a+b)+' ± '+b+') и ('+(a+c)+' ± '+c+') см. Найди наибольшую возможную сумму.',2*(a+b+c),'Берём сумму верхних границ двух измерений.'],
   bound_difference_from_two_intervals:({a,b,c})=>['Две длины записаны как ('+(2*a+2*b+c)+' ± '+b+') и ('+(a+c)+' ± '+c+') см. Найди наибольшую возможную разность первой и второй длин.',a+3*b+c,'Из верхней границы первой длины вычитаем нижнюю границу второй.'],
   recover_exact_overlap_length:({a,b})=>{
    const x=a+b+3;
    return ['Два прибора дали измерения ('+x+' ± 2) и ('+(x+1)+' ± 2) см. Какова длина общего промежутка возможных истинных значений?',3,
     'Первое измерение даёт от '+(x-2)+' до '+(x+2)+', второе от '+(x-1)+' до '+(x+3)+'. Общее от '+(x-1)+' до '+(x+2)+'.'];
   },
   distinguish_guaranteed_comparison:({a,b})=>{
    const x=a+b+3,y=x+4+(a%3-1);
    return checkStatement('Длины записаны как ('+y+' ± 2) и ('+x+' ± 2) см. Обязательно ли первая истинная длина строго больше второй?',y-2>x+2,
     'Сравниваем нижнюю границу первой '+(y-2)+' см с верхней границей второй '+(x+2)+' см.');
   }
  }
 ],
 stat_real_process_graphs:[
  {
   read_process_at_given_day:({a,b,c})=>{
    const m=observeProcess([a,a+b,a+1,a+c,a+b+c]),i=b%5;
    return tableTask(m,'Сколько посетителей было в день '+(i+1)+'?',m.values[i],'От номера дня идём к точке графика и читаем высоту.');
   },
   find_peak_day:({a,b,c})=>{
    const m=observeProcess([a+b,a+b+c,a,a+b+1]);
    return tableTask(m,'В какой по счёту день отмечено наибольшее число посетителей?',2,'Вторая точка находится выше остальных.');
   },
   check_single_increase:({a,b,c})=>{
    const m=observeProcess([a+b,a,a+c,a+c+b]),i=b%3;
    return withVisual(checkStatement('Выросло ли число посетителей от дня '+(i+1)+' к дню '+(i+2)+'?',i!==0,'Смотрим значения двух соседних дней.'),m.visual);
   },
   count_plotted_observations:({a,b,c})=>{
    const n=a%4+4,m=observeProcess(Array.from({length:n},(_,i)=>a+(i*b+c)%13));
    return tableTask(m,'За сколько дней есть отдельные наблюдения?',n,'Каждое отдельное наблюдение отмечено круглой точкой.');
   }
  },
  {
   compare_first_and_last:({a,b,c})=>{
    const m=observeProcess([a+b,a,a+b+1,a+c+b,a+b+c+1]);
    return tableTask(m,'На сколько число посетителей последнего дня больше первого?',c+1,'Вычитаем из последнего значения первое.');
   },
   count_descending_intervals:({a,b,c})=>{
    const m=observeProcess([a+b,a+b+2,a+1,a+c+2,a,a+b+1]);
    return tableTask(m,'Сколько интервалов между соседними днями отмечены снижением?',2,'Спуск от дня 2 к 3 и от 4 к 5. На остальных интервалах наблюдается рост.');
   },
   locate_unchanged_interval:({a,b,c})=>{
    const x=a+b+c,m=observeProcess([x+3,x,x,x+b,x+b+1]);
    return chooseConclusion('Между какими соседними днями число посетителей не менялось?','Между 2 и 3',['Между 1 и 2','Между 3 и 4','Между 4 и 5'],'Второе и третье наблюдения на одной высоте.',m);
   },
   compare_high_and_low_from_chart:({a,b,c})=>{
    const m=observeProcess([a+b,a,a+b+2,a+c+b,a+1]);
    return tableTask(m,'Найди размах числа посетителей за пять дней.',b+c,'Разность между наибольшим и наименьшим значениями графика.');
   }
  },
  {
   net_change_after_partial_recovery:({a,b,c})=>{
    const start=a+b+c,m=observeProcess([start,start-b,start-b+1,start+c,start+c+2]);
    return tableTask(m,'Найди итоговое изменение между первым и пятым днями, со знаком.',c+2,'Общее изменение равно последнее значение минус первое. Промежуточные спады и подъёмы уже отражены в этих точках.');
   },
   find_largest_adjacent_decrease:({a,b,c})=>{
    const x=a+b+c,m=observeProcess([x,x-1,x-1+a,x-1+a-b,x-1+a-b+c]);
    return tableTask(m,'На сколько уменьшилось число посетителей на участке с наибольшим снижением?',b,'Снижения есть от дня 1 к 2 на 1 и от дня 3 к 4 на '+b+'.');
   },
   compare_to_mean_first_three:({a,b,c})=>{
    const x=a+b+c,m=observeProcess([x-b,x+b,x,x+c]);
    return tableTask(m,'На сколько значение четвёртого дня больше среднего за первые три дня?',c,'Первые три значения суммарно дают '+3*x+', их среднее '+x+'. Вычитаем это среднее из значения четвёртого дня.');
   },
   identify_short_reversal_in_growth:({a,b,c})=>{
    const x=a+b+c,m=observeProcess([x,x+a,x+a-1,x+2*a,x+2*a+b]);
    return chooseConclusion('Где временное снижение на фоне общего роста?','Между днями 2 и 3',['Между днями 1 и 2','Между днями 3 и 4','Между днями 4 и 5'],'От второго дня к третьему высота графика уменьшилась. Все прочие соседние точки образуют рост.',m);
   }
  }
 ]
});

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
add('geo_basics','geo_length_units','Единицы длины и измерение отрезков','При измерении линейкой вычитай показание начала от показания конца. Для сравнения или сложения сначала приведи длины к одной единице.', null);
add('geo_basics','geo_field_angles','Углы на местности','При визировании направления отсчитывают от общего нуля. Для лучей по одну сторону от нуля меньший угол равен разности отсчётов.', null);
add('geo_basics','geo_field_right_angles','Прямой угол на местности','Направления взаимно перпендикулярны, если меньший угол между ними равен 90°. Углы на одной стороне прямой в сумме дают 180°.', null);
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
add('geo_circle_loci','geo_chord_properties','Свойства хорд и диаметров',reviewedLessons.geo_chord_properties,null);
add('geo_basics','geo_axial_symmetry_properties','Свойства осевой симметрии',reviewedLessons.geo_axial_symmetry_properties,null);
add('geo_parallels','geo_geometry_axioms','Аксиомы геометрии',reviewedLessons.geo_geometry_axioms,null);
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
add('geo_basics','geo_angle_measure','Градусная мера угла',reviewedLessons.geo_angle_measure,null);
add('geo_basics','geo_perpendicular_lines','Перпендикулярные прямые',reviewedLessons.geo_perpendicular_lines,null);

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
