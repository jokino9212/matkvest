# МатКвест — 13.11.2026 — контрольная точка после v125 (этап 33)

## Подтверждённое состояние продакшена
- **v124** PR #52 https://github.com/jokino9212/matkvest/pull/52 MERGED (commit `868045f7c00f774ea2c5fe18a9192167e659b91c`).
  - GitHub Pages https://github.com/jokino9212/matkvest/actions/runs/43408718316 — SUCCESS.
  - Production verification https://github.com/jokino9212/matkvest/actions/runs/43408718340 — SUCCESS.
  - 16/16 общих регрессий — SUCCESS, отдельный Playwright gate https://github.com/jokino9212/matkvest/actions/runs/43408302118 — SUCCESS.
- **v125** PR #53 https://github.com/jokino9212/matkvest/pull/53 MERGED (commit `f81a59b69d234f00a204f07f456f68fc9ab8f35e`).
  - GitHub Pages https://github.com/jokino9212/matkvest/actions/runs/43410158567 — SUCCESS.
  - Production verification https://github.com/jokino9212/matkvest/actions/runs/43410159392 — SUCCESS.
  - 16/16 общих регрессий — SUCCESS, отдельный Playwright gate https://github.com/jokino9212/matkvest/actions/runs/43409678809 — SUCCESS.

## Фактически исправлено в этом продолжении
Ранее стадия 31 / v123 завершилась на **28/74** улучшенных темах. В этой сессии содержательно переработаны ещё **12 тем**, теперь всего **40/74**. Это не окончание полного учебника.
- v124: `division_remainder`, `simplify_expressions`, `expand_brackets`, `plane_line_ray`, `area_rectangle`, `geometry`.
  - Файл `g5-textbook-tiers-v124.js`: 6 × 3 × 5 = **90 уникальных когнитивных семейств**, пять на каждую ступень сложности каждой темы; разбор скобок, подобные, сложные задачи на остатки, прямую/луч, площадь и периметр.
  - `audits/g5_v124_real_lesson_oracle_browser.cjs`: ответы и буквенные выражения сверяются независимым вычислением, фактические `makeG5Question` и открытие реальной стадии Master, 320/390/768/1280px. Отдельно 117000 случайных генераций чистой спецификации без ошибок.
- v125: `natural`, `coordinate`, `divisors_multiples_g5`, `divisibility_rules_g5`, `area_units_g5`, `operations`.
  - Файл `g5-natural-units-v125.js`: 6 × 3 × 5 = **ещё 90 семейств**; числа/разряды/округление, координаты, делители и кратные, признаки делимости, единицы площади и четыре арифметических действия.
  - `audits/g5_v125_real_stage_oracle_browser.cjs` и 126000 чистых случайных генераций. Реальные ученические вопросы, математические ответы и мастер-стадия проверены на четырёх ширинах.
- PWA и `index.html` синхронизированы на v125. Старые ID тем, достижения, учебный прогресс и UI сохранены. Дубликат поиска и ненужный скролл к карточке не возвращались.

## Невыполненные 34 темы (полный список)
### Натуральные, задачи, геометрия — 9
`order`, `powers`, `equations`, `volume`, `angles`, `charts`, `units`, `word`, `frac_shapes`.
### Обыкновенные дроби — 14
`frac_division`, `frac_to_mixed`, `mixed_to_frac`, `frac_equal`, `frac_reduce`, `frac_common_lcm`, `frac_compare_diff`, `frac_add_diff`, `frac_sub_diff`, `frac_mul_common`, `frac_part_number`, `frac_div_common`, `frac_restore`, `frac_word`.
### Десятичные дроби и проценты — 11
`dec_place`, `dec_mul10`, `dec_div10`, `dec_mul_nat`, `dec_div_nat`, `dec_mul_dec`, `dec_div_dec`, `dec_to_common`, `percent`, `percent_whole`, `average`.
Существующие отдельные исправления конверсии смешанных дробей и старые генераторы не считать полным покрытием трёх уровней: необходимы отдельные педагогические проверки.

## Следующий «Продолжи»
Немедленно переходить к **оставшимся 34 темам**, без возвращения к UX/меню, если пользователь не предъявит новый баг. В первую очередь 9 тем натуральных/геометрии, затем 11 десятичных/процентных, потом 14 обычных дробей. Для каждого из 3 уровней — минимум пять математически/когнитивно разных семейств, реальный `makeG5Question`, независимый oracle, 4 размеров экрана, PASS основного CI и GitHub Pages/production. Контрольная точка должна обновляться после каждого пакета, не выдавать непроверенное за завершённое.
