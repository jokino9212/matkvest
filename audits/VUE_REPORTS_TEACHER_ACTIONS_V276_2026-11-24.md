# МатКвест — v276: оставшиеся общие Vue-отчёты и преподавательские действия

Дата: 24 ноября 2026. PR #131, ветка **только для тестов** `refactor/route-vue-actions-from-7c14ce9`; PR base `fix/vue-mount-actions-20261123`. `main`, production, backend не изменялись.

## Проверка исходного состояния и инвентаризация

- v275 HTML SHA256: `18791a0eadd7c29c925852455319ef58f2aca5c8b53e1d5c448029a20e238cf0`, PWA `matkvest-iphone-v275`.
- Последний общий CI по PR head v275: PWA https://github.com/jokino9212/matkvest/actions/runs/45348757525 — SUCCESS; route contracts https://github.com/jokino9212/matkvest/actions/runs/45348757547 — SUCCESS.
- Read-only инвентаризация index.html (7.6 MB): https://github.com/jokino9212/matkvest/actions/runs/45352614089 и https://github.com/jokino9212/matkvest/actions/runs/45352751659.
- Прямые и непрямые `showVueReport` охватывают журнал, разбор, PIN преподавателя, действия с профилями, диалоги и другие отчёты. `renderTeacherView` централизует `mountTeacherDashboard`, `mountTeacherStudentDetail`, `mountTeacherStudentReport`, а также экраны ошибок и список слабых тем.
- `renderStudentReport` предоставляет только UI-actions `back`, `period`, `date`, `apply`, `print`; данные профиля, `buildStudentReportData`, маршруты, расчёт статистики, обработчики печати и `state` остаются в legacy-контроллерах.
- Поэтапное решение: один адаптер для общего модального отчёта и один для экрана учителя, вместо изменения множества бизнес-контроллеров.

## Дефект и изменения

**Подтверждённый риск/дефект прежнего HTML:** общий `showVueReport` создавал закрытие через `onclick="closeModal()"`. Отсоединённая кнопка старого отчёта могла закрыть новое модальное окно. В v276 кнопка стандартного fallback помечается `data-report-close`, закрытие делегировано только живому текущему окну. Браузерный тест: сохранённая отсоединённая кнопка не закрывает новый отчёт — PASS.

- `assets/ui/legacy-vue-actions.js`: UI-only `reportSurfaceActions`, `teacherViewActions` создают свежие защищённые callbacks, сохраняют аргументы, возвращаемые значения и контекст `this`; никаких обновлений прогресса или наград внутри адаптера.
- `showVueReport`: передаёт защищённые `reportActions` в Vue-монтирование, сохраняет HTML fallback, нативные Enter/Space, ловит запоздавшие клики/ввод на старом host. Проверяет активный модальный экран и блокирующий диалог.
- `renderTeacherView`: передаёт `teacherActions`; проверяет `teacherUnlocked`, актуальность DOM и ревизии маршрута. Удерживает рабочий HTML fallback и поиск с возвратом курсора. Для старого host добавлена проверка актуальности событий клавиатуры, ввода и формы.
- `renderStudentReport`, `printStudentReport`, расчёты курсов, карты знаний и сохранение профиля не менялись. Публичный production и backend не менялись.

## CI и опубликованный тестовый снимок

- Основной полный gate: https://github.com/jokino9212/matkvest/actions/runs/45353452742 — **SUCCESS во всех шагах, включая публикацию**.
- Первый запуск https://github.com/jokino9212/matkvest/actions/runs/45353309538 был **безопасно заблокирован** SHA/anchor-проверкой: похожий `module[mount](...actions)` встретился дважды. Это ошибка слишком широкого якоря патча, не дефект пользователя. Якорь сужен до `mounting=true`; повторный полный CI успешен. На первом запуске ничего не публиковалось.
- Node: legacy route, v271–v275 action contracts, v276 report/teacher contracts — PASS. Детерминированная Vue-сборка без изменения bundle — PASS.
- Браузер `audits/legacy_reports_teacher_v276_browser.cjs`: 390/1280 px; стандартный fallback-отчёт, Enter/Space, отделённая кнопка закрытия, вход в преподавательский отчёт, период 7 дней, некорректные пользовательские даты, возврат к ученику, неизменность XP/монет/журнала и offline F5 — PASS.
- При недоступных `knowledge-map.js` и `legacy-vue-actions.js` на ширине 390 px преподавательский отчёт, выбор периода, ошибки дат, возврат и стандартный HTML fallback — PASS.
- Регрессия маршрутов, быстрых результатов, учебных планов, школьных тестов, таблицы умножения, четырёх действий столбиком, рамки и журнала v275 — PASS, без дублирования наград.
- Полная `pwa_verified_refresh_browser.cjs`: обновление v275→v276, online/offline F5, результаты и награды на 390/1280 px — PASS.
- Столбик: 8 вариантов на каждой ширине (add/sub/mul/div, controlreview mul/div, errorwork mul/div), всего **16/16 PASS**; сохранение начислений и исправлений после F5.
- `stage28_offline_pwa_browser.cjs`: 320/390/768 px, **3/3 PASS**, профили, XP, монеты, магазин и офлайн-кеш сохранены.
- Финальный HTML SHA256: `e89c5c30eec7cbc72f2ff542027b3ccd7273e9d4c019d441270d1bb59ed830c5`.
- PWA: `matkvest-iphone-v276`.
- Опубликованный коммит **только тестовой ветки**: `38c374348379e2f439eca2e0746408c941f64a03`.
- `main` сохраняет `2985f92b6bd1a26dfcc316917f1752602b099572`. PR остаётся Draft, merge не выполнялся.

## Продолжение

v277: приоритетно инвентаризировать оставшиеся разрозненные кнопки и inline-функции `showVueReport`, учительские резервные шаблоны и обработчики навигации. Убирать подтверждённые дефекты небольшими группами, не трогая вычислительные и денежные правила; повторять полную PWA-регрессию до следующей тестовой публикации. После успеха v276 разовый gate сделать `workflow_dispatch` only.
