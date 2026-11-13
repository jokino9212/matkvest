# МатКвест — контрольная точка 13.11.2026 — этап 31, v123, исправление разнообразия 5 класса

## Проверенные релизы и реальные действия
- **v122:** PR #50 https://github.com/jokino9212/matkvest/pull/50, merge SHA `8630ae4d62ec0200821b1043ac9853e3f0f0cd41`, Pages https://github.com/jokino9212/matkvest/actions/runs/43403226548 SUCCESS, production https://github.com/jokino9212/matkvest/actions/runs/43403228162 SUCCESS.
- **v123:** PR #51 https://github.com/jokino9212/matkvest/pull/51, merge SHA `c7289246357f982f71d243b7d2ba9fa7bac4b524`, Pages https://github.com/jokino9212/matkvest/actions/runs/43405693827 SUCCESS, production https://github.com/jokino9212/matkvest/actions/runs/43405694901 SUCCESS. Все 17 регрессий кандидата SUCCESS.
- v122 диагностировал критичный баг: ранние v113–v116 проверяли отдельный `g5DonorQuestion()`, но в настоящем тренажёре вызывался прежний `makeG5Question()`. Поэтому изменения уровня не попадали к ученику. `g5-live-pedagogy-v122.js` переводит 19 подготовленных генераторов в настоящий `makeG5Question`, сохраняя ответы и прогресс.
- `segments_polygons` полностью переработан: 15 когнитивно разных семейств (5×3 этапа), независимый план арифметики, граничные случаи, геометрические ограничения, проверка реально показываемых ученических вопросов и окна тренировки.
- v123 `g5-arithmetic-tiers-v123.js` переработал 8 тем: `natural_add`, `natural_subtract`, `natural_multiply`, `natural_divide`, `numeric_literal_expressions`, `number_tables`, `column_charts`, `formulas_g5`. Для среднего и мастер-уровней добавлено 80 новых семейств (5×2×8) с многошаговыми, обратными и прикладными задачами; базовые остаются простыми. Отдельный сценарий проверяет реальное `makeG5Question` (не только donor), PWA v123.
- Проверены на 320/390/768/1280 px, дополнительный чистый арифметический AST oracle прошёл 200000 случайных генераций без отрицательных или нецелых недопустимых ответов; CI и production SUCCESS.

## Граница сделанного, без приукрашивания
**28 из 74 тем** имеют подтверждённые изменения содержательного разнообразия и уровней в v122/v123.
**Остались 46 тем без полной проверки/переработки:**
- Натуральные/геометрия/дополнительные: `natural`, `coordinate`, `divisors_multiples_g5`, `divisibility_rules_g5`, `area_units_g5`, `plane_line_ray`, `area_rectangle`, `operations`, `division_remainder`, `expand_brackets`, `simplify_expressions`, `order`, `powers`, `equations`, `geometry`, `volume`, `angles`, `charts`, `units`, `word`, `frac_shapes`.
- Дроби: `frac_division`, `frac_to_mixed`, `mixed_to_frac`, `frac_equal`, `frac_reduce`, `frac_common_lcm`, `frac_compare_diff`, `frac_add_diff`, `frac_sub_diff`, `frac_mul_common`, `frac_part_number`, `frac_div_common`, `frac_restore`, `frac_word`.
- Десятичные дроби/проценты: `dec_place`, `dec_mul10`, `dec_div10`, `dec_mul_nat`, `dec_div_nat`, `dec_mul_dec`, `dec_div_dec`, `dec_to_common`, `percent`, `percent_whole`, `average`.
Часть из этих тем ранее имела самостоятельные исправления отдельных багов и форм ввода; это НЕ значит, что 15 смысловых семейств и рост сложности уже подтверждены.

## Следующая работа при сообщении «продолжи»
1. Не возвращаться к меню v117–v121 и уже выпущенным v122–v123 без нового баг-репорта.
2. Продолжить исправления реальных `makeG5Question`, а не изолированных `g5DonorQuestion`, с приоритетом `division_remainder`, `simplify_expressions`, `expand_brackets`, `area_rectangle`, `plane_line_ray`, `geometry`.
3. Затем 11 десятичных/процентных тем; затем остаток дробей и натуральных, пока покрытие не будет 74/74.
4. Для каждой — минимум 5 смысловых семейств на уровне и переход разминка → тренировка → мастер с увеличением числа операций, проверки математической правильности independent oracle и реального ученического отображения, не только шаблонов.
5. В релизе отчёт с точным числом тем, CI, PR, Pages и production. Не утверждать «весь 5 класс закончен», пока не проверено 74/74.
