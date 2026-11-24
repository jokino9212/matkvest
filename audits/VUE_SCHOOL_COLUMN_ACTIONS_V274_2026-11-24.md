# МатКвест — перенос обработчиков счёта столбиком, этап v274

Дата: 24 ноября 2026. PR #131, только тестовая ветка `refactor/route-vue-actions-from-7c14ce9` (base `fix/vue-mount-actions-20261123`). `main`, production и backend не менялись.

## Исходное состояние

- v273 HTML SHA256: `967f04c84004077278020fc8090f57c0b392b15a0c2f827d35e6530abaf21065`, кеш `matkvest-iphone-v273`.
- Общие CI на head v273: `PWA verified builds and F5 refresh` https://github.com/jokino9212/matkvest/actions/runs/45282201844 — SUCCESS; `Legacy route module contracts` https://github.com/jokino9212/matkvest/actions/runs/45282201629 — SUCCESS.
- Старый `renderTask` передавал inline actions `primary`, `skip`, `inputCell`, `moveCell`, `toggleDot` в `mountSchoolColumnExercise`. Контроллеры `checkColumn`, `newTask`, `columnCellInput`, `workKey`, `toggleDot` и начисления оставались в `index.html`.

## Подтверждённый дефект до исправления

В старом HTML fallback функции `primary` и `skip` проверяли актуальность модального окна (`isCurrent`), но `inputCell`, `moveCell` и `toggleDot` передавались как незащищённые ссылки. После удаления элемента из DOM запоздавший вызов `host.oninput` мог продолжить изменять ввод в отсоединённой клетке; навигация тоже оставалась доступной. В v274 эти три действия обёрнуты проверкой `isCurrent` **как в Vue, так и в HTML fallback**. Специальный тест отсоединённого старого host подтвердил отсутствие изменения значения и обработки навигации.

## Изменения

- В `assets/ui/legacy-vue-actions.js` добавлена чистая функция `schoolColumnActions`, которая возвращает `primary`, `skip`, `inputCell`, `moveCell`, `toggleDot` со свежей проверкой актуальности попытки и блокирующего диалога.
- `renderTask` в `index.html` использует адаптер по возможности; при отсутствии модуля остаётся прежний HTML fallback с новым stale-event guard.
- Функции вычислений, верность ответов, подсветка ошибок, управление клавиатурой, проверка переноса, запись журналов, XP и монеты остаются в legacy-контроллере; изменения экономики и backend **отсутствуют**.
- SHA-fenced патч `audits/legacy_school_column_v274_patch.py` разрешает изменять только точный v273 HTML в указанной тестовой ветке. PWA-ресурсы и кеш переведены на `matkvest-iphone-v274`.

## Результаты испытаний

- Полный проверочный gate + публикация: https://github.com/jokino9212/matkvest/actions/runs/45284234116 — **SUCCESS** по всем шагам.
- Node: контракты маршрутов, v271, v272, v273 и новых пяти v274 column actions — PASS.
- Повторяемость Vue build — PASS.
- Новый `audits/legacy_school_column_v274_browser.cjs`: на 390/1280 px проверены add/sub/mul/div, Enter/Space, фокус, стрелки, точки при вычитании, заполнение клеток, offline F5, прогресс/награды без дублей. При блокировке модулей на 390 px: HTML fallback, все четыре операции и detached-event guard — PASS.
- Ранее работающие Vue-маршруты, быстрые результаты, учебные планы, школьные тесты и таблица умножения — PASS (390/1280 px).
- Полная `pwa_verified_refresh_browser.cjs`: PWA v273→v274 на 390/1280 px — PASS, online/offline, сохранение прогресса, учебные задания.
- Внутри полной PWA-регрессии `checkColumnVueEvents`: 8 сценариев на **каждой** ширине 390/1280 px — столбик add/sub/mul/div, контрольное повторение mul/div, работа над ошибками mul/div. Проверены неправильная попытка, исправление, фокус, в том числе повтор Enter, пропуск и диалог подтверждения, начисления с учётом достижений, сохранение результата после F5; **16/16 PASS**.
- Старый `checkColumnExerciseFallback` — PASS; legacy HTML не теряет подтверждение пропуска.
- Мобильный offline PWA (320/390/768 px): **3/3 PASS**, 0 сбоев; сохранение профиля, монет, XP и магазина.
- Финальные PWA fingerprints — PASS. HTML v274 SHA256: `7a8d0a205a6f8f4a6f1a84be6fdd924c86810f191c852db54a4618148483e660`.
- Тестовая публикация: `6b02b9d458c24d5139530eae0c4916d1e3bc30ca`, только `refactor/route-vue-actions-from-7c14ce9`.
- Последний проверенный `main`: `2985f92b6bd1a26dfcc316917f1752602b099572`; не менялся.

## Следующее

После v274 отдельно провести инвентаризацию UI-действий общей `SchoolAttemptFrame`, затем журнала попыток, без переноса внутрь Vue экономики, сохранения профиля и правил прохождения. Тестировать клавиатуру, возвращение назад, историю/маршруты и F5 без сети. Одноразовый v274 workflow после публикации переведён на `workflow_dispatch` только для защиты от повторного применения к более поздней версии HTML.
