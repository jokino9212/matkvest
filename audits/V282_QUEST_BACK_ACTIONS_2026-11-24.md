# МатКвест — v282: квесты, возврат на главную, Vue и HTML fallback

Дата: 24 ноября 2026. PR #131, Draft, целевая ветка только `refactor/route-vue-actions-from-7c14ce9`; никакого merge в main, production или backend.

## Стартовое состояние

- Старт: опубликованная v281, `matkvest-iphone-v281`, SHA256 HTML `b4d818184329a2c45c2de702479c0f9389846132d9ddaa82337b3af1609c82ab`.
- Head до подготовки v282: `2ca401f32fa09af92f2809ad00cf9b077a62492c`.
- Актуальные начальные CI: общий PWA `45450779227` — SUCCESS; legacy route contracts `45450779341` — SUCCESS.
- Read-only census `45453033267` — SUCCESS. Выбрана одна узкая группа: кнопка «← Главный экран» на `questBoardFallback` и соответствующий Vue `mountQuestBoard`. Другие оставшиеся inline UI actions не переносились.

## Воспроизведение до правок

- Предварительный тест отсоединённой кнопки квестов `45453448873`, затем `45453737034`: в Vue 390/1280 и без Vue+адаптера 390 stale button **не срабатывал**. Не объявлять это багом. Старое «Понятно» информационного окна тоже не закрывало посторонний экран.
- Простой путь «Главная → Квесты → Главный экран» — PASS.
- **Подтверждённый отдельный баг:** при вложенной истории `openGrade(5) → openQuests() → Space` кнопка «← Главный экран» приводила на экран 5 класса, а не на главную. Наблюдалось в неизменённой v281: Vue 390 и 1280, HTML fallback 390. Через 1,2 секунды маршрут оставался `{screen:"grade",grade:5}` и история указывала 5 класс. Evidence: `45455371256`.
- Независимый probe `45455599666`: штатный `mk872BrandGoHome()` из этого состояния возвращал на `{screen:"home"}` в тех же трёх сценариях. Переиспользовать доказанный маршрут, не менять core dispatcher.

## Изменения — только quest back

- `assets/ui/legacy-vue-actions.js`: чистый `questBackActions({isCurrent,back})`, проверяет живой host/ревизию перед вызовом.
- `index.html`: в резервной разметке вместо inline `onclick="renderHome()"` — `data-quest-action="back"` и штатный делегированный click с guard; нативные Enter/Space сохранены.
- Vue `mountQuestBoard` получает этот же guarded `back`. Для Vue и fallback action теперь использует `mk872BrandGoHome()` вместо простого `renderHome()`: исправлен подтверждённый возврат при вложенной истории.
- `claimQuest`, `requestQuestReroll`, расчёт наград, выдача XP и монет, профиль, сохранение попыток и backend — **без изменений**. Иные UI-обработчики не переносились.
- `sw.js` и HTML asset URLs синхронизированы на v282.

## CI, fail-closed и финальная проверка

- Первые три candidate-gate `45454454920`, `45454641054`, `45454893667` остановились **до публикации**. Причины: ошибочная кратность проверочного HTML маркера; недоступность `git diff` в проверочном контейнере; затем регрессионный тест выявил подтверждённый вложенный home-route баг (который уже наблюдался в базовой v281). Для исправления логики использован отдельно проверенный `mk872BrandGoHome()`.
- Финальный полный gate: `45455847822` — **SUCCESS**; job `138664929337`.
- Контракты legacy navigation и Vue actions v271–v282, детерминированный Vue bundle — PASS.
- Специализированный Playwright quest-back: Vue 390 и 1280 (оба с offline F5), HTML без Vue+адаптера 390, Enter/Space, правильный home route, отсоединённые кнопки inert, ID/XP/coins/attempts сохранены — **3/3 PASS**.
- HTML column skip/confirm — 12 повторений PASS. Вся предыдущая браузерная регрессия v271–v281 — PASS: главная, классы, knowledge/map, планы, quick trainer, школьные таблицы/quiz/столбик, результаты, журнал, преподавательские окна/Escape, магазин, профили, достижения и награды.
- Полный PWA v281→v282 online/offline F5 — PASS на 390 и 1280, сложение/вычитание/умножение/деление столбиком, контрольная работа, работа над ошибками, XP и coin invariants.
- Responsive offline 320/390/768 — **3/3 PASS**; service worker cache `matkvest-iphone-v282`. Синхронизация хешей PWA PASS.
- Проверка версии и SHA-locked publisher выполнил атомарную публикацию **только** `index.html`, `sw.js`, `assets/ui/legacy-vue-actions.js` в тестовую ветку. Коммит релиза `85f547e6d77565eb774a08d14ea2bc72adae4242`; SHA256 HTML `1138afcfade8185d1aae5fd0b15162637c2e0143573a47f4385647fe368d6ea9`.
- `main` проверен: `2985f92b6bd1a26dfcc316917f1752602b099572`. Production/backend не менялись, PR Draft/unmerged.

## Следующее действие

Выключить авто-повторение одноразового SHA-locked gate (оставить только ручной dispatch), затем перейти к v283 — read-only инвентаризация одной новой небольшой UI-группы. Сначала воспроизведение, затем только подтверждённые исправления, отдельный Vue/fallback bridge, полная offline/keyboard/route/reward регрессия. Main и backend не трогать.
