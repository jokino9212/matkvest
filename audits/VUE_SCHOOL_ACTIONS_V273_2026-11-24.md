# МатКвест — школьные тренажёры, перенос Vue actions v273

Дата: 24 ноября 2026. PR #131, тестовая ветка `refactor/route-vue-actions-from-7c14ce9`; base `fix/vue-mount-actions-20261123`. `main`, production, backend и тарифы **не менять**.

## Исходная точка и инвентаризация

- Тестовая v272: `index.html` SHA256 `f8d63cd1a0d2a6aba96f5dc5999dafbaa7d3303005a2af25210593672c0869ed`.
- Завершённый общий CI v272 из PR: https://github.com/jokino9212/matkvest/actions/runs/45279246565 — SUCCESS. Полная предыдущая регрессия v272: https://github.com/jokino9212/matkvest/actions/runs/45276973407.
- Read-only inventory `index.html`: https://github.com/jokino9212/matkvest/actions/runs/45279584805. Повторно проверенные точные места: `module.mountQuizExercise`, `module.mountTableExercise`, `module.mountColumnExercise`, `module.mountSchoolAttemptFrame` — каждое по одному прямому обращению. `module.mountQuickExercise` относится к отдельному быстрому тренажёру. Это подсчёт прямых `module.mount*`, не всех вызовов или компонентов.
- У школьного теста и таблицы разные контракты ответа. У `renderTask` («в столбик») помимо `primary/skip` есть `inputCell`, `moveCell`, `toggleDot`, управление клетками, переносами и фокусом; этот контроллер отделён для следующего этапа.

## Реализация v273

- В независимый UMD `assets/ui/legacy-vue-actions.js` добавлены `schoolTableActions` (`primary`, `skip`) и `schoolQuizActions` (`choose`, `check`, `skip`, `next`, `keydown`).
- `schoolTableActions` учитывает актуальную попытку, показ результата и необходимость подтверждения пропуска. `schoolQuizActions` отклоняет события от неактуального вопроса/попытки, скрытой модалки и открытого подтверждающего диалога.
- Код проверки правильности, фиксации ошибок и пропусков, журнал, начисления XP/монет, статус блоков, генераторы и сохранение в профиле не переносились и не изменялись.
- Старый inline HTML fallback остался. При отсутствии внешнего `MatKvestVueActions` школьные тесты и таблица используют прежние обработчики; новые адаптеры лишь вызывают существующие функции.
- Изменение `index.html` выполнено только в SHA-fenced CI runner через `audits/legacy_school_actions_v273_patch.py`. Ресурсы и кеш синхронизированы в `matkvest-iphone-v273`.
- Для предотвращения будущего применения исторического одноразового патча workflow v273 после публикации переведён на ручной запуск. Безусловно не применять его к v273 или более поздней базе.

## Проверки и подтверждённые дефекты

В пределах v273 **не было подтверждено нового дефекта бизнес-логики**. Отдельных правок экономики, правил проверки ответов или наград не вносилось. Перенос ограничен UI callback-adapter слоем.

- Node-контракты `legacy_navigation_core`, v271, v272, v273 — PASS.
- Детерминированная сборка Vue — PASS (байтовая идентичность).
- Новые Playwright тесты v273: школьная таблица и тест на 390/1280 px с Enter/Space, offline F5, повторным восстановлением ответов, переходом на следующий вопрос без дополнительных XP/монет — PASS.
- Необязательный модуль `legacy-vue-actions.js` блокировался: HTML/Vue legacy callback fallback для теста и таблицы на 390 px — PASS.
- Регрессия маршрутов/быстрых тренажёров/результатов и учебного плана (v271/v272) — PASS.
- Полная PWA v272→v273 (390/1280 px) — PASS, включая сохранённый прогресс без интернета.
- Мобильные offline PWA 320/390/768 px — PASS, `STAGE28_OFFLINE_SUMMARY` ожидаемо 3/3, ошибок 0.
- Финальная проверка хешей SW — PASS. Полный gate и публикация: https://github.com/jokino9212/matkvest/actions/runs/45280262326 (SUCCESS).
- Выпущенный `index.html` SHA256: `967f04c84004077278020fc8090f57c0b392b15a0c2f827d35e6530abaf21065`.
- Test-only публикация: `c1fb5578f21aaf72408113daaf72fd8564e9b3f3`, только ветка `refactor/route-vue-actions-from-7c14ce9`.
- При проверке `main` оставался `2985f92b6bd1a26dfcc316917f1752602b099572`. Merge, деплоя и работы с backend не было.

## Дальнейшие этапы

v274: отдельно обработать `renderTask`/`mountSchoolColumnExercise` (арифметика столбиком): диалог пропуска, ввод клетки, движение курсора, клавиатура, варианты add/sub/mul/div, контрольное повторение и работа над ошибками; сохранить HTML fallback и тестировать двойной Enter, корректировку ошибки, награды и offline F5. В следующем небольшом этапе — `mountSchoolAttemptFrame` и журнал попыток. `main` и production не трогать.
