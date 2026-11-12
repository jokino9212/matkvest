# МатКвест — контрольная точка этапа 16, 11.11.2026

## Текущий статус
- Этап 15 **закрыт**. PR32 merged (release `5bf6d4308477fc2ba876bb0fb9f5893335b46536`), реальный GitHub Pages и 17/17 после релиза SUCCESS.
- Production `main` на момент старта Stage16: `488b29d7a715a2d03bdbc03613d00439247752ac`. Не сливать PR32 повторно.
- Этап 16 — **педагогическое разнообразие 5 класса и каноническая запись окончательных ответов**.
- Рабочая ветка `audit/g5-pedagogy-stage16-20261111`, создана от `main`; production не менялся.

## Что реально сделано
1. Добавлен `audits/g5_stage16_pedagogy_audit.cjs` + `.github/workflows/quiz-stage16-pedagogy.yml`. Проверка реальных сгенерированных 53 × 3 × 48 × 5 = **38 160 задач**, раздельная классификация шаблона, текстовой формы и семейства.
2. GitHub Actions [43094677371](https://github.com/jokino9212/matkvest/actions/runs/43094677371) — **SUCCESS**. Среди 159 сочетаний тема×этап **0** конфигураций, в которых все 48 тренировок сводятся к одному шаблону. Ранее показатель Stage10 «45 конфигураций с одной operation-category» был **грубой классификацией** (все вычислительные действия назывались одним типом), а не доказательством однообразия шаблонов.
3. Диагностика выявила реально слабый смысловой тип `mixed_add`: во всех трёх этапах присутствуют три математически разные вычислительные схемы, но **нет сюжетных задач** (например, сложить несколько смешанных чисел без жизненного контекста). Не смешивать «операция одного вида» и «нет разнообразия».
4. В полной выборке Stage16 замечен пример для `frac_div_common`: `(9/9 : 4/8) · 2/4` возвращает `1/1` вместо удобного окончательного ответа `1`. Это **кандидат на педагогический баг формата**, математически эквивалентный ответ; недопустимо менять генератор до аудита корректности всех способов ввода, проверки и объяснений.
5. Добавлен отдельный `audits/g5_stage16_fraction_format.cjs` + `.github/workflows/quiz-stage16-fraction-format.yml`, который анализирует **27 825** реальных ответов и сортирует нетипичные финальные записи (знаменатель 1, числитель равен знаменателю и т.д.). Run 43095039711 оказался длительным; облегчили stdout и повторили как [43095295840](https://github.com/jokino9212/matkvest/actions/runs/43095295840). **Проверить точный статус и логи** прежде вывода о распространённости бага. Первый run не объявлять PASS до подтверждения.

## Следующий безопасный шаг на «Продолжи»
1. Проверить Actions 43095295840; получить `STAGE16_FRACTION_FORMAT_SUMMARY`, при необходимости job logs. Также проверить 43095039711.
2. На основе результатов определить строгое исправление канонической записи целого результата (`1/1` → `1`) **без нарушения правильного ввода дробей**; прогнать Stage14A/B/C, Stage11/10/05 и Stage12 product.
3. Затем уменьшить смысловую монотонность `mixed_add` (сюжетные задачи) без потери трёх проверенных математических подтипов и их progression; математика и ответы должны быть независимым тестом.
4. Сохранять каждый этап в audit branch и checkpoint. Только после полного Gate PR→prod, проверка GitHub Pages. Не заявлять об исправлении и релизе до реальной проверки.

## Важная дисциплина
- Не переписывать изолированные пользовательские профили, магазин, питомцев и PWA.
- Не делать изменений в `main` во время диагностических экспериментов Stage16.

## Этап 16Б — подготовлена точечная коррекция целочисленных ответов (не опубликована)
- Подтверждён по исходнику конкретный механизм: `mk5Rational` вызывает `g5NewChoiceSet`, который хранит варианты как ключи `n/d`; правильный результат с `d=1` отображается как `1/1` вместо `1`. Это **педагогический дефект оформления**, не ошибка арифметики.
- Для безопасного исправления в ветку добавлен `audits/g5_stage16_canonical_rational_fix.py` (строгое соответствие исходника, изменение **только подписей вариантов**, ключи `1/1` и внутреннее оценивание неизменны, SW fingerprint синхронизируется).
- Добавлен `audits/g5_stage16_canonical_rational_browser.cjs`: 19 875 настоящих вопросов, проверка подписей целых ответов, сохранения внутренних ключей, недопущения регрессии дробного ввода.
- Добавлен защищённый CI `.github/workflows/quiz-stage16-canonical.yml`: сначала патч в рабочей копии, независимые математические тесты Stage14A/Б/В, прогрессия и повторы Stage11/10/05, ввод дробей, попытки, PWA, и **только после PASS** commit в **audit branch**. Run https://github.com/jokino9212/matkvest/actions/runs/43097555486 — **проверить статус** (при последней проверке был QUEUED).
- Предыдущие два workflow формата дробей 43095039711/43095295840 затормозили (длительный запуск и очередь соответственно). Причина не подтверждена; не приписывать их молчание к PASS.
- В репозитории `index.html` 6.4 МБ; прямое создание нового Git blob через коннектор было предпринято после полной проверки SHA-256 первоначального HTML (`a5eeabb...`), но завершилось ошибкой HTTP/2 передачи. **ИЗМЕНЕНИЕ HTML НЕ СОХРАНЕНО**, на момент этой записи branch HEAD `fc65f9b7fed331fa17486d458570a26aa00533d7`. Следовательно нельзя утверждать, что исправление вступило в силу.
- Подготовленный математически ограниченный патч меняет визуальный label при знаменателе 1, но оставляет `g5q.correct`, `item.key`, `mk5Audit.expected` неизменными; благодаря этому правильные формы ввода и обратная совместимость защищены. Полный набор тестов всё равно обязателен.
- Следующий «Продолжи»: проверить GitHub Actions `43097555486` и прочие Stage16 runs; при PASS проверить в branch обновлённый `index.html`/SW SHA, затем провести независимую проверку по объединённому Gate. Далее отдельным маленьким этапом добавлять **сюжетное разнообразие** в `mixed_add` с сохранением шаблонов и пошаговых объяснений; не делать release, пока оба пункта не проверены.

## Продолжение 12.11 — диагностика CI
- Запуски 43097555486 и 43095295840 пока вернули пустой список jobs: PASS не подтверждён; изменение index.html не подтверждено.
- Запуск 43095039711: в логе STAGE16_FRACTION_FORMAT_AUDIT_PASS, но вся job завершилась failure при actions/upload-artifact@v4: Failed to FinalizeArtifact, HTML вместо JSON.
- Коммит a1ba53f8bcc8e9c80e7a0475727ae016391b7133 заменяет upload-artifact на локальную проверку ненулевого JSON и GitHub Step Summary. Новый CI результат ещё не подтверждён.
- Следующий шаг: дождаться реальных результатов CI, проверить SHA index.html и sw.js, лишь затем переходить к Stage16C mixed_add. Production не менять.

## Продолжение 12.11, 09:06 (этап 16C: инструментирована проверка сюжетности)
- Повторно проверены `43097555486` и `43095295840`: GitHub API по-прежнему возвращает пустые списки jobs; результаты не подтверждены. `main` остаётся на `488b29d7`, stage16 исправление `index.html` не публиковалось.
- Добавлен read-only аудит `audits/g5_stage16c_mixed_add_baseline.cjs` (commit `b350318`): 720 реальных заданий `mixed_add`, по 240 на каждую ступень; считает различимые условия, математические шаблоны и вероятные жизненные сюжеты с образцами.
- Добавлен `.github/workflows/quiz-stage16c-mixed-add.yml` (commit `49c9521`): отдельный диагностический workflow без изменения production и без загрузки артефактов. Есть строгий режим `STAGE16C_REQUIRE_STORIES=1` для будущего релизного Gate, но **пока он выключен**: аудит фиксирует исходную ситуацию, а не притворяется исправлением.
- Следующий шаг: получить CI результат baseline, проверить и скорректировать эвристику сюжетов по реальным образцам, затем внести минимальный патч в генератор `mixed_add` с независимой проверкой математических ответов. Никакого release до реального PASS.

## Этап 16C: guarded implementation prepared
- Exact source slice of the Stage18C `case 'mixed_add'` generator was extracted via `fetch_blob` from 6.4 MB `index.html` (Git blob SHA `3ad3a746fe76d579d164869e5f5f1a96dd9a6f1a`). The generator has three math modes, previously only arithmetic questions.
- `audits/g5_stage16c_mixed_add_patch.py` (commit `213fa14`) is an anchored, idempotent patch of that precise generator: keeps `sum`, denominators, answer keys, distractors, explanation text and `variant` untouched; creates 2 story phrasings + 1 arithmetic phrasing per math mode; updates `sw.js` HTML fingerprint.
- `.github/workflows/quiz-stage16c-mixed-add.yml` updated (commit `bc70053`): applies Stage16B canonical patch and Stage16C contextual patch in a working copy, checks 720 real questions with story requirement enabled, 19,875 whole-number choices, Stage14A/B/C independent math, Stage11/10/05 progress/variety and Stage01/02/03, attempt recovery, PWA. Only after PASS commits `index.html` and `sw.js` to audit branch, never production.
- Current status: candidate scripts + workflow committed, but no successful GitHub Actions run has been observed. Do **not** state that new story questions are already visible on website. `main` must not change until independent integrated PASS and release decision.
- Next `Продолжи`: inspect Stage16C Actions jobs, fix any real failures, verify branch HTML+SW hash and test evidence, then document final Gate. No repeat of completed stages; no deploy without successful gate.

## Этап 16B+16C — integrated Gate PASS (12.11.2026, UTC 06:27)
- 16B: найдено и исправлено два дефекта самих проверок: некорректный JS regexp в canonical browser audit, затем ложная проверка несуществующего `q.correct` вместо реального `q.ans`. Дополнительная защита выявила настоящее взаимодействие с Stage18: замена HTML `1/1` на `1` отключала дробный ввод. В `g5_stage16_canonical_rational_fix.py` добавлена строго ограниченная поддержка целого label в `stage18ConvertG5Fraction`, так что `answerMode: fraction`, `answerRat` и внутренние ключи сохраняются.
- 16B: workflow `43167576011` **SUCCESS** на полном наборе: 19 875 заданий, самостоятельные математические/семантические/прогрессионные проверки, ввод, пропуски, сохранение попытки и PWA. Audit-branch commit `0316dbe1e01395cd64711e03b8cbae823bdf7223`.
- 16C: baseline workflow `43166159530` **SUCCESS**: в исходных 720 заданиях `mixed_add` не было сюжетных условий ни на одной из 3 ступеней.
- Интегрированный workflow `43167878557` **SUCCESS**, все шаги зелёные: 720 задач, включая по **192 сюжетных из 240 на каждом уровне**, три математические схемы и высокая вариативность условий; 19 875 ответов и сохранение режима ввода; независимые Stage14A/B/C, Stage11/10/05; Stage01/02/03, жизненный цикл попыток и offline PWA.
- В workflow реализован fail-closed publish: после Gate заново собирает HTML+SW на актуальном HEAD audit-ветки и **проверяет побайтовую идентичность SHA-256** до commit, защищая от параллельного коммита 16B.
- Audit branch commit `990e30a98aec6b555f67ff24aef5997b06042bc6` реально содержит `index.html` и `sw.js`. PWA `APP_BUILD_HASH` = `e7def1507e770d7d5e02dc0a2ccf902b23026ef11aca886a41d229b12944ac49`; совпадает с `STAGE16C_HTML_SHA256` в успешном CI. Ветка отстоит на 28 коммитов впереди `main`, без отставания.
- На момент PASS production `main` ещё `488b29d7a715a2d03bdbc03613d00439247752ac`. **Изменения на сайте ещё не опубликованы.** Никакие пост-релизные утверждения делать до merge + Pages + 17 Gate + live smoke нельзя.
- Ссылки: https://github.com/jokino9212/matkvest/actions/runs/43167576011 ; https://github.com/jokino9212/matkvest/actions/runs/43167878557 .
- Следующий безопасный этап: подготовить PR ветка→`main` после diff review; после утверждения и merge проверить 17/17 post-release Gate и живой сайт на desktop/mobile, включая cache/PWA. Не восстанавливать предыдущую ошибочную проверку `q.correct`, не терять Stage18 fraction entry. При сбое не утверждать production SUCCESS.
