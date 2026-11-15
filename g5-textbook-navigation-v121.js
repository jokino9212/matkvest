/* Grade 5 v121: textbook rows directly open the native training topic dialog. */
(function () {
'use strict';
const chapters = [
 {part:1,chapter:1,title:'Натуральные числа и нуль. Шкалы',items:[
 [1,'Представление числовой информации в таблицах',['number_tables']],
 [2,'Цифры и числа',['natural']],
 [3,'Отрезок и его длина. Ломаная. Многоугольник',['segments_polygons']],
 [4,'Плоскость, прямая, луч, угол',['plane_line_ray']],
 [5,'Шкалы и координатная прямая',['coordinate']],
 [6,'Сравнение натуральных чисел',['natural_compare']],
 [7,'Представление числовой информации в столбчатых диаграммах',['column_charts']]
 ]},
 {part:1,chapter:2,title:'Сложение и вычитание натуральных чисел',items:[
 [8,'Действие сложения. Свойства сложения',['natural_add']],
 [9,'Действие вычитания. Свойства вычитания',['natural_subtract']],
 [10,'Числовые и буквенные выражения',['numeric_literal_expressions']],
 [11,'Уравнение',['equations']]
 ]},
 {part:1,chapter:3,title:'Умножение и деление натуральных чисел',items:[
 [12,'Действие умножения. Свойства умножения',['natural_multiply']],
 [13,'Действие деления',['natural_divide']],
 [14,'Деление с остатком',['division_remainder']],
 [15,'Упрощение выражений',['simplify_expressions','expand_brackets']],
 [16,'Порядок действий в вычислениях',['order']],
 [17,'Степень с натуральным показателем',['powers']],
 [18,'Делители и кратные',['divisors_multiples_g5']],
 [19,'Свойства и признаки делимости',['divisibility_rules_g5']]
 ]},
 {part:1,chapter:4,title:'Площади и объёмы',items:[
 [20,'Формулы',['formulas_g5']],
 [21,'Площадь. Формула площади прямоугольника',['area_rectangle']],
 [22,'Единицы измерения площадей',['area_units_g5']],
 [23,'Прямоугольный параллелепипед',['cuboid']],
 [24,'Объёмы. Объём прямоугольного параллелепипеда',['volume']]
 ]},
 {part:2,chapter:5,title:'Обыкновенные дроби',items:[
 [25,'Окружность, круг, шар, цилиндр',['frac_shapes']],
 [26,'Доли и дроби. Изображение дробей на координатной прямой',['frac_parts','frac_read','frac_ray']],
 [27,'Сравнение дробей',['frac_compare_den','frac_compare_num']],
 [28,'Правильные и неправильные дроби',['frac_types']],
 [29,'Сложение и вычитание дробей с одинаковыми знаменателями',['frac_add','frac_sub']],
 [30,'Деление натуральных чисел и дроби',['frac_division']],
 [31,'Смешанные числа',['frac_to_mixed','mixed_to_frac','mixed_compare']],
 [32,'Сложение и вычитание смешанных чисел',['mixed_add','mixed_sub']],
 [33,'Основное свойство дроби',['frac_equal']],
 [34,'Сокращение дробей',['frac_reduce']],
 [35,'Приведение дробей к общему знаменателю',['frac_common_lcm']],
 [36,'Сравнение, сложение и вычитание дробей с разными знаменателями',['frac_compare_diff','frac_add_diff','frac_sub_diff']],
 [37,'Умножение дробей',['frac_mul_common']],
 [38,'Нахождение части целого',['frac_part_number']],
 [39,'Деление дробей',['frac_div_common']],
 [40,'Нахождение целого по его части',['frac_restore']]
 ]},
 {part:2,chapter:6,title:'Десятичные дроби',items:[
 [41,'Десятичная запись дробей',['dec_place','dec_to_common']],
 [42,'Сравнение десятичных дробей',['dec_compare']],
 [43,'Сложение и вычитание десятичных дробей',['dec_add','dec_sub']],
 [44,'Округление чисел. Прикидка',['dec_round']],
 [45,'Умножение десятичной дроби на натуральное число',['dec_mul_nat']],
 [46,'Деление десятичной дроби на натуральное число',['dec_div_nat']],
 [47,'Умножение на десятичную дробь',['dec_mul_dec']],
 [48,'Деление на десятичную дробь',['dec_div_dec']]
 ]},
 {part:2,chapter:7,title:'Инструменты для вычислений и измерений',items:[
 [49,'Калькулятор',['calculator']],
 [50,'Виды углов. Чертёжный треугольник',['angle_types']],
 [51,'Измерение углов. Транспортир',['angles']]
 ]}
];
const expected=chapters.flatMap(c=>c.items);
if(expected.length!==51 || expected.some((e,i)=>e[0]!==i+1))throw Error('Vilenkin Grade 5 textbook numbering error');

// Vilenkin: part 1 (4th ed., 2024), part 2 (3rd ed., 2023).
// https://pubdoc.ru/doc/343703/6-klass-ch-1-vilenkin-n-ja-2024
// https://ru.djvu.online/file/BeBrv47cHVDoL
const grade6Chapters=[
 {part:1,chapter:0,title:'Повторение курса 5 класса',items:[
  [null,'Делители и кратные',['divisors_multiples','divisibility_2_5_10','divisibility_3_9']],
  [null,'Основное свойство и сокращение дроби',['fraction_properties','fraction_reduction']]
 ]},
 {part:1,chapter:1,title:'Вычисления и построения',items:[
  [1,'Среднее арифметическое',['arithmetic_mean']],
  [2,'Проценты',['percent_of_number','number_by_percent','percent_ratio','percent_word_problems']],
  [3,'Представление числовой информации в круговых диаграммах',['pie_charts']],
  [4,'Виды треугольников',['triangle_types']],
  [5,'Понятие множества',['sets_intro']]
 ]},
 {part:1,chapter:2,title:'Действия со смешанными числами',items:[
  [6,'Разложение числа на простые множители',['prime_factorization','prime_composite']],
  [7,'Наибольший общий делитель. Взаимно простые числа',['gcd','coprime']],
  [8,'Наименьшее общее кратное натуральных чисел',['lcm']],
  [9,'Приведение дробей к наименьшему общему знаменателю',['fraction_common_denominator']],
  [10,'Сравнение, сложение и вычитание обыкновенных дробей',['fraction_compare','fraction_add_subtract']],
  [11,'Действия сложения и вычитания смешанных чисел',['mixed_add_subtract']],
  [12,'Действие умножения смешанных чисел',['mixed_multiplication','fraction_multiply']],
  [13,'Нахождение дроби от числа',['fraction_of_number']],
  [14,'Применение распределительного свойства умножения',['fraction_distributive']],
  [15,'Действие деления смешанных чисел',['mixed_division','fraction_divide','mixed_multiply_divide']],
  [16,'Нахождение числа по его дроби',['fraction_restore_whole']],
  [17,'Дробные выражения',['fraction_expressions']]
 ]},
 {part:1,chapter:3,title:'Отношения и пропорции',items:[
  [18,'Отношения',['ratio','ratio_value','divide_in_ratio']],
  [19,'Пропорция',['proportion','proportion_unknown']],
  [20,'Прямая и обратная пропорциональные зависимости',['direct_proportion','inverse_proportion']],
  [21,'Масштаб',['scale']],
  [22,'Симметрии',['symmetry']],
  [23,'Длина окружности и площадь круга. Шар',['circumference','circle_area','circle','sphere']]
 ]},
 {part:2,chapter:4,title:'Действия с рациональными числами',items:[
  [24,'Положительные и отрицательные числа',['positive_negative','number_line']],
  [25,'Противоположные числа',['opposite_numbers']],
  [26,'Модуль числа',['absolute_value']],
  [27,'Сравнение положительных и отрицательных чисел',['rational_compare']],
  [28,'Изменение величин',['quantity_change']],
  [29,'Сложение положительных и отрицательных чисел с помощью координатной прямой',['line_addition']],
  [30,'Сложение отрицательных чисел',['negative_sum']],
  [31,'Сложение чисел с разными знаками',['negative_add']],
  [32,'Действие вычитания',['negative_subtract']],
  [33,'Действие умножения',['negative_multiply']],
  [34,'Действие деления',['negative_divide']],
  [35,'Рациональные числа',['rational_numbers']],
  [36,'Свойства действий с рациональными числами',['rational_expressions']]
 ]},
 {part:2,chapter:5,title:'Решение уравнений',items:[
  [37,'Раскрытие скобок',['brackets']],
  [38,'Коэффициент',['coefficient']],
  [39,'Подобные слагаемые',['like_terms','expression_simplify','expression_value']],
  [40,'Решение уравнений',['linear_equations','equation_word_problems']]
 ]},
 {part:2,chapter:6,title:'Координаты на плоскости',items:[
  [41,'Перпендикулярные прямые',['perpendicular_lines','parallel_perpendicular']],
  [42,'Параллельные прямые',['parallel_lines']],
  [43,'Координатная плоскость',['coordinate_plane','point_coordinates','plot_point']],
  [44,'Представление числовой информации на графиках',['line_graphs']]
 ]},
 {part:2,chapter:0,title:'Повторение курса 6 класса',items:[
  [null,'Таблицы и диаграммы',['tables_charts']],
  [null,'Прямоугольный параллелепипед',['prism','volume']]
 ]}
];
const grade7Chapters=[
 {part:'Алгебра',chapter:'I',title:'Выражения, тождества и уравнения',items:[
  [1,'Рациональные числа',['rational_numbers_forms','rational_arithmetic']],
  [2,'Числовые выражения',['numerical_expressions']],
  [3,'Выражения с переменными',['variables_expression_value','admissible_values']],
  [4,'Сравнение значений выражений',['compare_expression_values','rational_compare_order']],
  [5,'Свойства действий над числами',['expression_properties']],
  [6,'Тождества и преобразования выражений',['identities','brackets_like_terms']],
  [7,'Уравнение и его корни',['equation_root_equivalence']],
  [8,'Линейные уравнения с одной переменной',['linear_equation_one_variable','linear_equation_cases']],
  [9,'Задачи с линейными уравнениями',['equation_word_problems']],
  [10,'Формулы',['formulas_dependencies']]
 ]},
 {part:'Алгебра',chapter:'II',title:'Функции',items:[
  [11,'Числовые промежутки',['number_intervals','number_line_distance']],
  [12,'Понятие функции',['function_concept_values']],
  [13,'Значение функции по формуле',['function_formula_values']],
  [14,'График функции',['function_graph_reading','coordinate_plane']],
  [15,'График прямой пропорциональности',['direct_proportionality_function']],
  [16,'График линейной функции',['linear_function']],
  [17,'Кусочно-заданные функции',['piecewise_functions','absolute_value_function']]
 ]},
 {part:'Алгебра',chapter:'III',title:'Степень с натуральным показателем',items:[
  [18,'Определение степени',['natural_power_definition']],
  [19,'Произведение и частное степеней',['power_properties']],
  [20,'Степень произведения и степени',['power_product_power']],
  [21,'Стандартный вид одночлена',['monomial_standard_form']],
  [22,'Произведение и степень одночленов',['monomial_operations']],
  [23,'Графики y = x² и y = x³',['functions_x2_x3']],
  [24,'Простые и составные числа',['divisibility_factorization']]
 ]},
 {part:'Алгебра',chapter:'IV',title:'Многочлены',items:[
  [25,'Стандартный вид и степень многочлена',['polynomial_standard_degree']],
  [26,'Сумма и разность многочленов',['polynomial_add_subtract']],
  [27,'Произведение одночлена и многочлена',['monomial_times_polynomial']],
  [28,'Общий множитель за скобками',['common_factor']],
  [29,'Произведение многочленов',['polynomial_times_polynomial']],
  [30,'Разложение группировкой',['factorization_grouping']],
  [31,'Деление с остатком',['division_with_remainder']]
 ]},
 {part:'Алгебра',chapter:'V',title:'Формулы сокращённого умножения',items:[
  [32,'Квадрат и куб суммы и разности',['square_sum_difference','binomial_cube']],
  [33,'Разложение по формуле квадрата двучлена',['perfect_square_factor']],
  [34,'Произведение суммы и разности',['difference_of_squares']],
  [35,'Разложение разности квадратов',['factor_difference_squares']],
  [36,'Разложение суммы и разности кубов',['sum_difference_cubes']],
  [37,'Преобразование выражения в многочлен',['integer_expression_transform']],
  [38,'Комбинированное разложение на множители',['combined_factorization']],
  [39,'Степень двучлена',['higher_binomial_power']]
 ]},
 {part:'Алгебра',chapter:'VI',title:'Системы линейных уравнений',items:[
  [40,'Линейное уравнение с двумя переменными',['linear_equation_two_variables']],
  [41,'График уравнения с двумя переменными',['linear_equation_two_variables_graph']],
  [42,'Системы двух линейных уравнений',['linear_system_concept','graphical_equations_systems']],
  [43,'Метод подстановки',['linear_system_substitution']],
  [44,'Метод сложения',['linear_system_addition']],
  [45,'Текстовые задачи на системы',['linear_system_word_problems']],
  [46,'Линейные неравенства с двумя переменными',['linear_inequalities_two_variables']]
 ]},
 {part:'Алгебра',title:'Повторение',items:[
  [null,'Доли и дроби',['fraction_word_problems']],
  [null,'Проценты',['percent_fraction_conversion','percent_word_problems']],
  [null,'Прямая и обратная пропорциональность',['direct_inverse_proportion']]
 ]},
 {part:'Геометрия',chapter:'I',title:'Начальные геометрические сведения',items:[
  [1,'Точка, прямая, отрезок',['geo_primitives']],
  [2,'Провешивание прямой',['geo_field_line']],
  [3,'Луч',['geo_rays']],
  [4,'Угол',['geo_angle']],
  [5,'Равные фигуры',['geo_congruent_figures']],
  [6,'Сравнение отрезков и углов',['geo_compare_segments_angles','geo_angle_bisector']],
  [7,'Длина отрезка',['geo_segment_angle_measurement']],
  [8,'Единицы длины и измерительные приборы',['geo_length_units']],
  [9,'Градусная мера',['geo_angle_measure']],
  [10,'Измерение углов на местности',['geo_field_angles']],
  [11,'Смежные и вертикальные углы',['geo_adjacent_vertical_angles']],
  [12,'Перпендикулярность прямых',['geo_perpendicular_lines']],
  [13,'Прямые углы на местности',['geo_field_right_angles']]
 ]},
 {part:'Геометрия',chapter:'II',title:'Треугольники',items:[
  [14,'Элементы треугольника',['geo_triangle_elements']],
  [15,'Признак равенства по двум сторонам и углу',['geo_congruence_sas']],
  [16,'Перпендикуляр к прямой',['geo_perpendicular_oblique_distances']],
  [17,'Медианы, биссектрисы и высоты',['geo_triangle_medians_bisectors_altitudes']],
  [18,'Равнобедренный треугольник и его свойства',['geo_isosceles_properties_criteria','geo_isosceles_equilateral']],
  [19,'Признак равенства по стороне и двум углам',['geo_congruence_asa']],
  [20,'Признак равенства по трём сторонам',['geo_congruence_sss']],
  [21,'Элементы окружности',['geo_circle_chord_diameter']],
  [22,'Построения циркулем и линейкой',['geo_basic_constructions']],
  [23,'Задачи на построение отрезков и углов',['geo_constructions_lines_angles']]
 ]},
 {part:'Геометрия',chapter:'III',title:'Параллельные прямые',items:[
  [24,'Понятие параллельных прямых',['geo_parallel_perpendicular_intro']],
  [25,'Признаки параллельности',['geo_parallel_criteria','geo_transversal_angles']],
  [26,'Построение параллельных прямых',['geo_construct_parallel']],
  [27,'Аксиомы геометрии',['geo_geometry_axioms']],
  [28,'Аксиома о параллельных прямых',['geo_axiom_parallel']],
  [29,'Углы при параллельных прямых и секущей',['geo_parallel_properties']],
  [30,'Углы с параллельными или перпендикулярными сторонами',['geo_angles_matching_sides']]
 ]},
 {part:'Геометрия',chapter:'IV',title:'Стороны и углы треугольника',items:[
  [31,'Сумма углов треугольника',['geo_triangle_angle_sum','geo_exterior_triangle_angle']],
  [32,'Виды треугольников по углам',['geo_triangle_angle_types']],
  [33,'Связь сторон и углов',['geo_side_angle_relation']],
  [34,'Неравенство треугольника',['geo_triangle_inequality']],
  [35,'Свойства прямоугольных треугольников',['geo_right_triangle_properties','geo_right_triangle_30deg']],
  [36,'Равенство прямоугольных треугольников',['geo_right_triangle_congruence']],
  [37,'Расстояние до прямой и между параллельными прямыми',['geo_perpendicular_oblique_distances']],
  [38,'Построение треугольника по трём элементам',['geo_constructions_triangles']]
 ]},
 {part:'Геометрия',chapter:'V',title:'Геометрические места точек и симметрия',items:[
  [39,'Биссектриса как геометрическое место точек',['geo_angle_bisector_locus','geo_locus_points']],
  [40,'Свойства серединного перпендикуляра',['geo_perpendicular_bisector_locus']],
  [41,'Свойства хорд и диаметров',['geo_chord_properties']],
  [42,'Прямая и окружность. Касательная',['geo_line_circle_tangent_secant','geo_circle_inscribed_in_angle']],
  [43,'Вписанная и описанная окружности',['geo_incircle_triangle','geo_circumcircle_triangle']],
  [44,'Фигуры, симметричные относительно прямой',['geo_axial_symmetry']],
  [45,'Свойства осевой симметрии',['geo_axial_symmetry_properties']]
 ]},
 {part:'Геометрия',title:'Дополнительные темы',items:[
  [null,'Ломаная и многоугольник',['geo_broken_line_polygon','geo_polygon_angle_sum_intro']]
 ]},
 {part:'Вероятность и статистика',chapter:'I',title:'Представление данных',items:[
  [1,'Таблицы',['stat_tables']],
  [2,'Упорядочивание и поиск данных',['stat_data_interpretation']],
  [3,'Вычисления по таблице',['stat_table_calculations']],
  [4,'Столбчатые диаграммы',['stat_bar_charts']],
  [5,'Круговые диаграммы',['stat_pie_charts']],
  [6,'Возрастно-половые диаграммы',['stat_population_pyramid']]
 ]},
 {part:'Вероятность и статистика',chapter:'II',title:'Описательная статистика',items:[
  [7,'Среднее арифметическое',['stat_arithmetic_mean']],
  [8,'Медиана',['stat_median']],
  [9,'Минимум, максимум и размах',['stat_min_max_range']],
  [10,'Свойства среднего арифметического',['stat_mean_properties','stat_choose_characteristic']]
 ]},
 {part:'Вероятность и статистика',chapter:'III',title:'Случайная изменчивость',items:[
  [11,'Случайная изменчивость величин',['stat_random_variability']],
  [12,'Точность и погрешность',['stat_measurement_error']],
  [13,'Тенденции и отклонения',['stat_real_process_graphs']],
  [14,'Частоты значений',['stat_value_frequency']],
  [15,'Группировка данных и гистограммы',['stat_grouping_histograms']],
  [16,'Выборка',['stat_sample']],
  [17,'Оценки по выборке',['stat_sample_estimation']]
 ]},
 {part:'Вероятность и статистика',chapter:'IV',title:'Графы',items:[
  [18,'Вершины и рёбра',['graph_basics','graph_directed_modeling']],
  [19,'Степень вершины',['graph_vertex_degree_edges']],
  [20,'Пути и связность графа',['graph_connectivity_paths']],
  [21,'Эйлеровы пути и циклы',['graph_chains_cycles_euler']]
 ]},
 {part:'Вероятность и статистика',chapter:'V',title:'Логические утверждения',items:[
  [22,'Высказывания и их истинность',['logic_statements']],
  [23,'Отрицание высказывания',['logic_negation']],
  [24,'Условные утверждения',['logic_implication']],
  [25,'Обратные утверждения и равносильность',['logic_converse']],
  [26,'Контрпример и доказательство от противного',['logic_contradiction']]
 ]},
 {part:'Вероятность и статистика',chapter:'VI',title:'Случайные опыты и события',items:[
  [27,'Случайный опыт и событие',['prob_random_experiment_event']],
  [28,'Частота и вероятность события',['prob_probability_frequency']],
  [29,'Опыты с монетой и кубиком',['prob_coin_die_models']],
  [30,'Как узнать вероятность события',['prob_likelihood_methods','prob_unlikely_almost_certain']],
  [31,'Вероятность и защита от ошибок',['prob_error_protection']]
 ]},
 {part:'Вероятность и статистика',title:'Повторение',items:[
  [null,'Столбчатые и круговые диаграммы',['stat_bar_pie_charts']]
 ]}
];

const grade7Sections={
 Алгебра:{
  1:'§ 1. Числа и выражения',5:'§ 2. Преобразование выражений',7:'§ 3. Уравнения с одной переменной',
  11:'§ 4. Функции и их графики',15:'§ 5. Линейная функция',
  18:'§ 6. Степень и её свойства',21:'§ 7. Одночлены',
  25:'§ 8. Сумма и разность многочленов',27:'§ 9. Произведение одночлена и многочлена',29:'§ 10. Произведение многочленов',
  32:'§ 11. Квадрат суммы и разности',34:'§ 12. Разность квадратов. Сумма и разность кубов',37:'§ 13. Преобразование целых выражений',
  40:'§ 14. Линейные уравнения с двумя переменными и их системы',43:'§ 15. Решение систем линейных уравнений'
 },
 Геометрия:{
  1:'§ 1. Прямая и отрезок',3:'§ 2. Луч и угол',5:'§ 3. Сравнение отрезков и углов',7:'§ 4. Измерение отрезков',
  9:'§ 5. Измерение углов',11:'§ 6. Перпендикулярные прямые',
  14:'§ 1. Первый признак равенства треугольников',16:'§ 2. Медианы, биссектрисы и высоты',19:'§ 3. Второй и третий признаки равенства',21:'§ 4. Задачи на построение',
  24:'§ 1. Признаки параллельности двух прямых',27:'§ 2. Аксиома параллельных прямых',
  31:'§ 1. Сумма углов треугольника',33:'§ 2. Соотношения между сторонами и углами треугольника',35:'§ 3. Прямоугольные треугольники',37:'§ 4. Построение треугольника по трём элементам',
  39:'§ 1. Геометрические места точек',41:'§ 2. Окружность и касательная',44:'§ 3. Симметричные фигуры'
 }
};

const layouts={
 5:{chapters,catalog:g5AllTopics,card:'.g5-card',group:'.g5-group',open:id=>openG5Topic(id)},
 6:{chapters:grade6Chapters,catalog:g6AllTopics,card:'.g6-card',group:'.g6-group',open:id=>openG6Topic(id)},
 7:{chapters:grade7Chapters,sections:grade7Sections,catalog:g7AllTopics,card:'.topic.g7-card',group:'.g7-course',open:id=>openG7Topic(id)},
 8:{...window.grade8Textbook,catalog:g8AllTopics,card:'.topic.g7-card',group:'.g7-course',open:id=>openG8Topic(id)}
};
const g6Aliases={
 'g6:brackets':'раскрыть скобки',
 'g6:like_terms':'приведение подобных собрать подобные слагаемые',
 'g6:expression_simplify':'упростить выражение',
 'g6:expression_value':'подстановка в буквенное выражение',
 'g6:gcd':'нод',
 'g6:lcm':'нок'
};
let menuObserver=null;

function norm(value){
 return String(value||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
function menuStyle(){
 if(document.getElementById('mk-g5-toc-style'))return;
 const style=document.createElement('style');
 style.id='mk-g5-toc-style';
 style.textContent=[
 '.mk-g5-toc{margin:24px 0;padding:22px;border:1px solid #dbe5f3;border-radius:20px;background:var(--card,#fff);box-shadow:0 8px 30px rgba(29,59,104,.055);color:inherit}',
 '.mk-g5-toc *{box-sizing:border-box}',
 '.mk-g5-toc-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px;flex-wrap:wrap}',
 '.mk-g5-toc-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;max-width:100%}',
 '.mk-g5-toc-actions .mk-g5-toc-search{flex:1 1 230px;min-width:160px}',
 '.mk-g5-toc-toggle{min-height:46px;padding:10px 15px;border:1px solid #9fb7d9;border-radius:12px;color:inherit;font:inherit;font-size:.94rem;font-weight:750;cursor:pointer;white-space:nowrap;background:var(--bg,#f7faff)}',
 '.mk-g5-toc-toggle:hover{background:#e8f1ff}',
 '.mk-g5-toc-toggle:focus-visible{outline:3px solid #78a5ec;outline-offset:2px}',
 '.mk-g5-toc-body[hidden]{display:none!important}',
 '.mk-g5-toc-collapsed{padding-top:14px;padding-bottom:14px}',
 '.mk-g5-toc-collapsed .mk-g5-toc-head{margin-bottom:0}',
 '.mk-g5-toc h2{margin:0;font-size:clamp(1.18rem,2.3vw,1.5rem);line-height:1.25;font-weight:800;letter-spacing:-.015em}',
 '.mk-g5-toc-search{width:min(100%,340px);min-height:46px;padding:11px 14px;border:1px solid #c7d5e9;border-radius:12px;background:var(--bg,#f7faff);color:inherit;font:inherit;font-size:1rem}',
 '.mk-g5-toc-search:focus-visible{outline:3px solid #78a5ec;outline-offset:2px}',
 '.mk-g5-toc-status{margin:0 0 10px;font-size:.9rem;color:var(--muted,#617186)}',
 '.mk-g5-toc-status[hidden],.mk-g5-toc-chapter[hidden],.mk-g5-toc-part[hidden],.mk-g5-toc-list li[hidden]{display:none!important}',
 '.mk-g5-toc-part{margin:0 0 17px}',
 '.mk-g5-toc-part:last-child{margin-bottom:0}',
 '.mk-g5-toc-part-heading{display:flex;align-items:center;gap:10px;margin:0 0 10px;padding:0 2px;font-size:.98rem;font-weight:800;color:var(--text,#253e67)}',
 '.mk-g5-toc-part-heading::before{content:"";display:block;width:5px;height:20px;border-radius:5px;background:#537fe1}',
 '.mk-g5-toc-chapter{margin:9px 0;border:1px solid #dce5f2;border-radius:14px;overflow:hidden;background:var(--card,#fff)}',
 '.mk-g5-toc-chapter>summary{display:flex;align-items:center;gap:12px;list-style:none;cursor:pointer;min-height:56px;padding:14px 16px;font-weight:720;font-size:.98rem;line-height:1.4;background:var(--bg,#f7faff);color:inherit}',
 '.mk-g5-toc-chapter>summary::-webkit-details-marker{display:none}',
 '.mk-g5-toc-chapter>summary::after{content:"";flex:none;width:9px;height:9px;margin-left:auto;border-right:2px solid #58749e;border-bottom:2px solid #58749e;transform:rotate(45deg);transition:transform .15s ease}',
 '.mk-g5-toc-chapter[open]>summary::after{transform:rotate(225deg)}',
 '.mk-g5-toc-chapter>summary:hover{background:#eaf2ff}',
 '.mk-g5-toc-chapter>summary:focus-visible{outline:3px solid #78a5ec;outline-offset:-3px}',
 '.mk-g5-toc-num{display:inline-grid;place-items:center;flex:none;width:37px;min-height:27px;padding:3px 5px;border-radius:8px;background:#e2eafe;color:#3159a0;font-size:.86rem;font-weight:800;font-variant-numeric:tabular-nums}',
 '.mk-g5-toc-chapter[open]>.mk-g5-toc-list{border-top:1px solid #e2e9f3}',
 '.mk-g5-toc-list{margin:0;padding:5px 10px;list-style:none}',
 '.mk-g5-toc-list li{margin:0;padding:0;border-bottom:1px solid #e7ecf4;list-style:none}',
 '.mk-g5-toc-list li:last-child{border-bottom:0}',
 '.mk-g5-toc-list .mk-g7-toc-section{padding:10px 12px 6px;font-size:.89rem;font-weight:750;color:var(--muted,#617186)}',
 '.mk-g5-toc-link{width:100%;display:grid;grid-template-columns:33px minmax(0,1fr) 18px;align-items:center;gap:12px;min-height:55px;padding:10px 12px;border:0;border-radius:9px;background:transparent;text-align:left;cursor:pointer;color:inherit;font:inherit;font-size:.96rem;line-height:1.38;transition:background .12s ease}',
 '.mk-g5-toc-link:hover{background:#ebf3ff}',
 '.mk-g5-toc-link:focus-visible{outline:3px solid #78a5ec;outline-offset:-3px;background:#ebf3ff}',
 '.mk-g5-toc-item-title{min-width:0;overflow-wrap:break-word;font-weight:590}',
 '.mk-g5-toc-item-number{font-size:.88rem;font-weight:750;font-variant-numeric:tabular-nums;color:var(--muted,#66768b);text-align:center}',
 '.mk-g5-toc-link::after{content:"";display:block;width:9px;height:9px;border-top:2px solid #8092ab;border-right:2px solid #8092ab;transform:rotate(45deg);justify-self:center}',
 '.mk-g5-toc-extra{padding-left:23px}',
 '.mk-g5-toc-extra .mk-g5-toc-link{min-height:49px;font-size:.91rem;color:var(--muted,#586c88)}',
 '.mk-g5-toc-extra .mk-g5-toc-item-title{font-weight:500}',
 '.mk-g5-toc-extra .mk-g5-toc-item-number{font-size:1rem;color:#8aa0bd}',
 '.mk-g5-toc-missing{display:block;padding:12px;color:#a32d2d}',
 '.mk-g6-toc-unavailable{display:block;padding:10px 12px 0;line-height:1.4}',
 '.mk-g6-toc-status{display:block;padding:4px 12px 10px;color:var(--muted,#617186)}',
 '.mk-g6-toc-topic-name{display:block;margin-top:3px;color:var(--muted,#617186);font-weight:500}',
 '@media(max-width:650px){.mk-g5-toc{margin:14px 0;padding:13px;border-radius:15px}.mk-g5-toc-actions{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px}.mk-g5-toc-actions .mk-g5-toc-search{min-width:0;width:100%;font-size:.93rem}.mk-g5-toc-toggle{font-size:.86rem;padding:8px 10px;min-height:46px}.mk-g5-toc-head{align-items:stretch;flex-direction:column;gap:11px}.mk-g5-toc-search{width:100%;max-width:none}.mk-g5-toc-part{margin-bottom:16px}.mk-g5-toc-chapter>summary{min-height:54px;padding:12px;gap:9px}.mk-g5-toc-list{padding:4px}.mk-g5-toc-link{grid-template-columns:25px minmax(0,1fr) 17px;gap:8px;min-height:53px;padding:10px 8px;font-size:.92rem}.mk-g5-toc-extra{padding-left:14px}.mk-g5-toc-extra .mk-g5-toc-link{font-size:.88rem}}',
 '@media(prefers-reduced-motion:reduce){.mk-g5-toc-link,.mk-g5-toc-chapter>summary::after{transition:none}}'
 ].join('');
 document.head.append(style);
}
function mount(grade){
 const layout=layouts[grade], isGrade5=grade===5, isGrade6=grade===6, hasSubjects=grade>=7;
 const host=mainView, topics=layout.catalog();
 const cards=[...host.querySelectorAll(layout.card)],anchor=host.querySelector(layout.group);
 const rootId='mk-g'+grade+'-textbook-nav';
 let collapsed=!!layout.collapsed;
 if(!anchor||!cards.length)return;
 host.querySelector('#'+rootId)?.remove();
 const byId=new Map(topics.map(t=>[t.id,t]));
 // The existing section organizer moves cards. Match by title, preferring its own heading.
 const byTitle=new Map();
 if(isGrade5)for(const topic of topics){
  const matches=cards.filter(card=>norm(card.textContent).includes(norm(topic.title)));
  matches.sort((a,b)=>{
   const needle=norm(topic.title);
   const x=norm(a.textContent),y=norm(b.textContent);
   return x.indexOf(needle)-y.indexOf(needle)||x.length-y.length;
  });
  if(matches.length)byTitle.set(topic.id,matches[0]);
 }
 menuStyle();
 const root=document.createElement('section');root.id=rootId;root.className='mk-g5-toc';
 const head=document.createElement('div');head.className='mk-g5-toc-head';
 const heading=document.createElement('h2');heading.textContent='Темы '+grade+' класса';
 const actions=document.createElement('div');actions.className='mk-g5-toc-actions';
 const toggle=document.createElement('button');toggle.type='button';toggle.className='mk-g5-toc-toggle';
 const body=document.createElement('div');body.className='mk-g5-toc-body';body.id='mk-g'+grade+'-toc-parts';
 toggle.setAttribute('aria-controls',body.id);
 actions.append(toggle);head.append(heading,actions);root.append(head,body);
 // The native search above the menu must be the ONLY visible search.
 // For legacy/anonymous screens without it, retain the older top textbook field as fallback.
 const textbookInput=host.querySelector('#mk-textbook-search-input-'+grade);
 const textbookPanel=textbookInput?.closest('.mk-textbook-search');
 let primarySearch=null;
 const findNativeSearch=()=>!isGrade5?host.querySelector('#mk19c4-topic-tools input'):[...host.querySelectorAll('input')].find(field=>
  field!==textbookInput && !field.closest('#'+rootId) &&
  !field.closest('.mk-textbook-search') &&
  /найти тему по названию|найти тему/i.test(norm(field.placeholder))
 )||null;
 function clearActiveSearch(){
  if(primarySearch&&primarySearch.value){
   primarySearch.value='';
   primarySearch.dispatchEvent(new Event('input',{bubbles:true}));
  }
  if(textbookInput&&textbookInput.value){
   textbookInput.value='';
   textbookInput.dispatchEvent(new Event('input',{bubbles:true}));
  }
 }
 const rows=[],issues=[],parts=new Map(),details=[],sections=[];
 function visit(id){
  // This must use exactly the same entry point as the ordinary visual card.
  // Never scroll to/focus another card; open the topic's three-stage lesson dialog.
  clearActiveSearch();
  layout.open(id);
 }
 function button(text,number,secondary,id){
   const b=document.createElement('button');b.type='button';b.className='mk-g5-toc-link';b.dataset.topicId=id;
   const num=document.createElement('span');num.className='mk-g5-toc-item-number';num.textContent=secondary?'↳':number??'•';
   num.setAttribute('aria-hidden','true');
   const title=document.createElement('span');title.className='mk-g5-toc-item-title';title.textContent=text;
   b.append(num,title);
   b.addEventListener('click',()=>visit(id));
   return b;
 }
 for(const ch of layout.chapters){
  let part=parts.get(ch.part);
  if(!part){
    const container=document.createElement('div');container.className='mk-g5-toc-part';
    const label=document.createElement('h3');label.className='mk-g5-toc-part-heading';label.textContent=hasSubjects?ch.part:'Часть '+ch.part+(isGrade6?(ch.part===1?' · Смешанные числа':' · Рациональные числа'):'');
    container.append(label);body.append(container);
    part={container,chapters:[]};parts.set(ch.part,part);
  }
  const detail=document.createElement('details');detail.className='mk-g5-toc-chapter';
  const summary=document.createElement('summary');
  const ordinal=document.createElement('span');ordinal.className='mk-g5-toc-num';ordinal.textContent=(hasSubjects?'':'§ ')+ch.chapter;
  const text=document.createElement('span');text.textContent=ch.title;
  if(ch.chapter)summary.append(ordinal);
  summary.append(text);
  const list=document.createElement('ol');list.className='mk-g5-toc-list';if(ch.items[0][0]!=null)list.start=ch.items[0][0];
  detail.append(summary,list);part.container.append(detail);part.chapters.push(detail);details.push(detail);
  let section=null;
  for(const [number,title,rawIds,note] of ch.items){
   const sectionName=layout.sections?.[ch.part]?.[number];
   if(sectionName){
    const label=document.createElement('li');
    label.className='mk-g7-toc-section';
    label.textContent=sectionName;
    list.append(label);
    section={label,rows:[]};
    sections.push(section);
   }
   const ids=isGrade5?rawIds:rawIds.map(id=>'g'+grade+':'+id);
   const li=document.createElement('li');
   if(number!=null){li.value=number;li.dataset.paragraph=number;}
   let resolved=0;
   for(let i=0;i<ids.length;i++){
    const id=ids[i],topic=byId.get(id),card=byTitle.get(id);
    if(!topic||(isGrade5&&!card)){issues.push(number+': '+id);continue}
    const label=i===0?title:topic.title;
    const b=button(label,number,i>0,id);
    if(i===0&&title!==topic.title&&(hasSubjects||isGrade6&&(ids.length>1||[12,15,30,31,36,41,42].includes(number)))){
     const subtitle=document.createElement('small');
     subtitle.className='mk-g6-toc-topic-name';subtitle.textContent=topic.title;
     b.querySelector('.mk-g5-toc-item-title').append(subtitle);
    }
    if(i===0)li.append(b);
    else{
     const secondary=document.createElement('div');secondary.className='mk-g5-toc-extra';secondary.append(b);li.append(secondary);
    }
    resolved++;
   }
   if(!resolved){
    const unavailable=document.createElement('strong');
    unavailable.className=!isGrade5?'mk-g6-toc-unavailable':'mk-g5-toc-missing';
    unavailable.textContent=isGrade6&&number!=null?number+'. '+title:title;li.append(unavailable);
   }
   if(!isGrade5&&(!resolved||note)){
    const status=document.createElement('small');status.className='mk-g6-toc-status';
    status.textContent=note||'Тренажёр готовится';li.append(status);
   }
   list.append(li);
   const searchable=norm([...(!isGrade5?[number,ch.title,hasSubjects?ch.part:'']:[]),title,...ids.flatMap(id=>{
    const topic=byId.get(id);
    return !isGrade5?[topic?.title,topic?.shortTitle,g6Aliases[id]]:[topic?.title];
   })].join(' '));
   rows.push({number,ids,searchable,element:li});
   section?.rows.push(li);
  }
 }
 const previousOpen=new Map();
 let filtering=false;
 function update(){
  const query=norm(primarySearch?.value||'');
  if(query&&!filtering){
   for(const d of details)previousOpen.set(d,d.open);
   filtering=true;
  }
  let count=0;
  const terms=query.split(' ').filter(Boolean),matchingTopics=new Set();
  for(const row of rows){
   const show=!isGrade5&&/^\d+$/.test(query)?row.number===Number(query):terms.every(term=>/^\d+$/.test(term)&&hasSubjects?row.number===Number(term):row.searchable.includes(term));
   if(show)for(const id of row.ids)matchingTopics.add(id);
   row.element.hidden=!show;
   if(show)count++;
  }
  for(const detail of details){
   const show=[...detail.querySelectorAll('.mk-g5-toc-list > li:not(.mk-g7-toc-section)')].some(li=>!li.hidden);
   detail.hidden=!show;
   if(query)detail.open=show;
   else if(filtering)detail.open=previousOpen.get(detail)||false;
  }
  for(const section of sections)section.label.hidden=section.rows.every(row=>row.hidden);
  for(const part of parts.values())part.container.hidden=part.chapters.every(d=>d.hidden);
  if(!query){filtering=false;previousOpen.clear()}
  if(!isGrade5&&primarySearch){
   const tools=primarySearch.closest('#mk19c4-topic-tools');
   const status=tools?.querySelector('.mk19c4-count');
   const empty=tools?.querySelector('.mk19c4-empty');
   showCollapsed(false);
   if(status)status.textContent=query?'Найдено пунктов: '+count:'Всего тем: '+topics.length;
   if(empty)empty.dataset.visible=String(!!query&&!count);
   for(const card of cards){
    const id=card.getAttribute('onclick')?.match(/g[678]:[a-z0-9_]+/)?.[0];
    card.classList.toggle('mk19c4-filter-hidden',!!query&&!matchingTopics.has(id));
   }
   for(const section of host.querySelectorAll(hasSubjects?'.g7-course,.g7-course .g6-group':layout.group)){
    section.classList.toggle('mk19c4-filter-hidden',!!query&&!section.querySelector(layout.card+':not(.mk19c4-filter-hidden)'));
   }
  }
 }
 function synchronizeSearch(event){
  if(!isGrade5&&event?.type==='input'&&norm(primarySearch?.value)){
   collapsed=false;layout.collapsed=false;
  }
  update();
  if(isGrade5&&primarySearch && textbookInput && primarySearch!==textbookInput && textbookInput.value!==primarySearch.value){
   textbookInput.value=primarySearch.value;
   textbookInput.dispatchEvent(new Event('input',{bubbles:true}));
  }
 }
 function bindUpperSearch(){
  const native=findNativeSearch(),target=native||textbookInput;
  if(target===primarySearch)return;
  const previousQuery=primarySearch?.value;
  if(primarySearch)primarySearch.removeEventListener('input',synchronizeSearch);
  primarySearch=target;
  if(textbookPanel){
   textbookPanel.hidden=!!native;
   textbookPanel.style.display=native?'none':'';
   if(!native){
    const label=textbookPanel.querySelector('label');
    if(label)label.textContent='Найти тему';
    if(textbookInput)textbookInput.placeholder='Найти тему по названию...';
   }
  }
  if(primarySearch){
   if(previousQuery&&!primarySearch.value){
    primarySearch.value=previousQuery;
    primarySearch.dispatchEvent(new Event('input',{bubbles:true}));
   }
   primarySearch.addEventListener('input',synchronizeSearch);
   if(!isGrade5)primarySearch.closest('#mk19c4-topic-tools')?.querySelector('.mk19c4-clear')
    ?.addEventListener('click',synchronizeSearch);
  }
  synchronizeSearch();
 }
 function showCollapsed(scroll){
  body.hidden=collapsed;
  root.classList.toggle('mk-g5-toc-collapsed',collapsed);
  toggle.textContent=collapsed?'Показать разделы':'К карточкам';
  toggle.setAttribute('aria-expanded',String(!collapsed));
  if(scroll){
    const target=collapsed?host.querySelector(layout.group+':not(.mk19c4-filter-hidden)'):root;
    target?.scrollIntoView({behavior:'smooth',block:'start'});
  }
 }
 toggle.addEventListener('click',()=>{collapsed=!collapsed;layout.collapsed=collapsed;showCollapsed(true)});
 showCollapsed(false);
 anchor.insertAdjacentElement('beforebegin',root);
 if(menuObserver)menuObserver.disconnect();
 bindUpperSearch();
 // Some account-specific UI inserts the upper search after the lesson list has rendered.
 menuObserver=new MutationObserver(()=>{if(findNativeSearch()!==null&&findNativeSearch()!==primarySearch)bindUpperSearch()});
 menuObserver.observe(host,{subtree:true,childList:true});
 if(isGrade5)window.mkG5TextbookNavigation={total:rows.length,missing:issues,chapters:details.length,volumes:parts.size,version:121,refreshSearch:bindUpperSearch};
}
const previousGrade5=renderGrade5,previousGrade6=renderGrade6,previousGrade7=renderGrade7,previousGrade8=renderGrade8;
renderGrade5=function(...args){const result=previousGrade5(...args);mount(5);return result};
renderGrade6=function(...args){const result=previousGrade6(...args);mount(6);return result};
renderGrade7=function(...args){const result=previousGrade7(...args);mount(7);return result};
renderGrade8=function(...args){const result=previousGrade8(...args);mount(8);return result};
if(currentGrade===7)renderGrade7();
if(currentGrade===8)renderGrade8();
})();
