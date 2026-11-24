# МатКвест — аудит и перенос Vue actions каталога/карты знаний, этап v277

Дата: 24 ноября 2026. Тестовая ветка `refactor/route-vue-actions-from-7c14ce9`, PR #131 (Draft), base `fix/vue-mount-actions-20261123`. Production, `main`, backend **не менялись**.

## Исходное состояние и инвентаризация

- Текущая стартовая сборка v276: HTML SHA256 `e89c5c30eec7cbc72f2ff542027b3ccd7273e9d4c019d441270d1bb59ed830c5`, PWA `matkvest-iphone-v276`.
- Общий CI на исходном head `4282f87c`: PWA https://github.com/jokino9212/matkvest/actions/runs/45354988844 — SUCCESS, legacy contracts https://github.com/jokino9212/matkvest/actions/runs/45354988697 — SUCCESS.
- Read-only инвентаризация: https://github.com/jokino9212/matkvest/actions/runs/45398303580 — PASS. Подсчёт в текущем `index.html` (~7,6 MB): **250** вхождений встроенных `onclick`, **6** `onkeydown`, **4** `oninput`, **5** `onchange`, **1** `onsubmit`. Это число вхождений, а не количество различных бизнес-функций.
- Инвентаризация mount-мостов показывает одновременно Vue-компоненты и резервные HTML-экраны. Уже вынесены route, header, quick setup/result, training plan, table/quiz/column, SchoolAttemptFrame, journal/review, generic report, teacher actions. Следующий ограниченный общий участок: `renderAnalyticsView`, который обслуживает `mountGradeCourse`, `mountKnowledgeMap` и `mountTopicDetail`.
- `renderAnalyticsView` до v277 защищал **асинхронное монтирование** проверкой `revision===knowledgeMapRevision`, но передавал в Vue `actions` напрямую и назначал необёрнутые `back.onclick=actions.back` и `retry.onclick=retry` в fallback. Сохранённые callbacks заменённого экрана могли выполнить уже неактуальную навигацию.
- Не пытаемся автоматически заменять все 250 обработчиков: классические HTML-ветви остаются резервом на случай отсутствия Vue.

## Исправление и границы изменения

- `assets/ui/legacy-vue-actions.js`: добавлен UI-only `analyticsViewActions({isCurrent,actions})`. Создаёт свежие callbacks для монтирования, сохраняет аргументы, возвращаемые значения и исходный `this` обработчика; игнорирует вызов, если экран сменился.
- `index.html`: SHA-fenced patch `audits/legacy_analytics_view_v277_patch.py` меняет только мост `renderAnalyticsView`. Проверяется, что host остаётся текущим дочерним элементом `mainView`, подключённым к DOM, а revision соответствует активному. Vue получает `viewActions`; при недоступном адаптере создаётся эквивалентный guarded HTML-fallback.
- Fallback-кнопка «Назад» вызывает защищённый `viewActions.back`; «Повторить» не запускает stale retry после ухода со страницы. Нативная клавиатура Enter/Space сохраняется. Поиск, сортировка, выбор класса и темы, открытие тренировок и возврат по маршрутам используют **исходные контроллеры**.
- Не изменялись учебные данные, content catalog, начисления, логика проверки ответов, `state.attemptHistory`, profile storage, backend и production.

## Зафиксированные проблемы в проверках

1. Первая версия *read-only inventory workflow* https://github.com/jokino9212/matkvest/actions/runs/45398146096 остановилась из-за неверного экранирования регулярного выражения в скрипте аудита. Исправлена; корректная инвентаризация PASS. Приложение не менялось.
2. Первые браузерные тесты v277 по основному Vue-режиму на 390/1280 px были PASS, но резервный сценарий предполагал, что HTML главного экрана после перехода содержит конкретный Vue `#homeDashboard`, а затем `.home-hero`. При отключении Vue это неверная предпосылка теста. Исправлено на проверку **семантики перехода**: `currentGrade===null` и предыдущий `#grade5Vue` удалён из DOM. После исправления тесты fallback прошли. Не подтверждён дефект самого перехода. Никакая непроверенная версия не публиковалась.
3. Подтверждён кодовый дефект защиты: `renderAnalyticsView` передавал необёрнутые действия последующим Vue-компонентам и HTML fallback без проверки `revision` в момент вызова. Исправлено; stale grade/map/detail/back/retry не меняют маршрут или профиль, результат/награды не дублируются.

## Релизный контроль

- **Полный выпускной CI**: https://github.com/jokino9212/matkvest/actions/runs/45399488279 — **SUCCESS**, включая конечный шаг branch-locked publish.
- Контракты v271–v277: PASS. Deterministic Vue bundle: PASS (байты сборки не менялись).
- Playwright v277: grade/map/detail/keyboard/stale guards — PASS 390/1280; реальный HTML fallback без Vue и адаптера — PASS 390; offline F5 в Vue — PASS.
- Все существующие маршруты, учебный план, QuickTrainer, SchoolAttemptFrame, журнал, отчёт преподавателя и резервные HTML-варианты — PASS.
- PWA v276→v277 verified refresh: PASS на 390/1280, offline/online, сохранённый профиль и результаты, без повторного начисления наград.
- Счёт столбиком: 4 операции add/sub/mul/div, контрольное повторение mul/div, работа над ошибками mul/div — PASS на 390/1280 offline.
- Responsive offline `stage28_offline_pwa_browser.cjs`: 320/390/768 — **3/3 PASS**, 0 fail; сохранены профиль, XP, монеты, магазин.
- HTML SHA256 `d6504e2c24427bfc4d80ed4f303ec824a588a0b4e365593a7123d788679f2757`, PWA `matkvest-iphone-v277`.
- Публикация только тестовой ветки: `f46971b9bbe9b0ee48d242a2bca7aa344af8ba4a`. Проверенная `main` до и после выпуска — `2985f92b6bd1a26dfcc316917f1752602b099572`. PR не сливается.

## Следующий этап

v278: последовательно классифицировать оставшиеся legacy inline handlers по реальным экранам и событиям, выбрать одну независимую группу для переноса, отдельно проверить HTML fallback, клавиатуру, сохранение результатов и offline F5. Не делать массовую замену всего `index.html`; до подтверждённого CI сохранять production без изменений.
