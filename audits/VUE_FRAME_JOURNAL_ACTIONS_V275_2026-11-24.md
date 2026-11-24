# МатКвест — Vue actions рамки задания и журнала попыток, этап v275

Дата: 24 ноября 2026. PR #131, **только тестовая ветка** `refactor/route-vue-actions-from-7c14ce9`, base `fix/vue-mount-actions-20261123`. `main`, production, backend не затрагивались.

## Исходная точка и инвентаризация

- v274 HTML SHA256 `7a8d0a205a6f8f4a6f1a84be6fdd924c86810f191c852db54a4618148483e660`, PWA `matkvest-iphone-v274`.
- Общий CI последнего v274 PR head: https://github.com/jokino9212/matkvest/actions/runs/45344176896 — SUCCESS; contracts https://github.com/jokino9212/matkvest/actions/runs/45344176930 — SUCCESS.
- Read-only инвентаризация:
  - https://github.com/jokino9212/matkvest/actions/runs/45346620023
  - https://github.com/jokino9212/matkvest/actions/runs/45346713967
- `module.mountSchoolAttemptFrame(...)` — 1 прямой вызов; `showSchoolAttempt` создаёт и обновляет рамку, `refreshBlockHead` обновляет прогресс.
- Журнал открывается через `openAttemptJournal` → обобщённый `showVueReport("mountAttemptJournal",...)`, поэтому **не является прямым** `module.mountAttemptJournal` в HTML. Разбор — `openAttemptReviewRecord` → `showVueReport("mountAttemptReview",...)`.
- `state.attemptHistory` остаётся единственным источником истории; пересчёт прогресса, начисления и сохранение профиля не передавались Vue.

## Изменения

- `assets/ui/legacy-vue-actions.js`: добавлены три чистых адаптера `schoolAttemptFrameActions`, `attemptJournalActions` и `attemptReviewActions`, блокирующие вызовы при смене экрана/диалоге. Обработчик `review` принимает только целочисленный индекс существующей записи.
- Рамка школы: `module.mountSchoolAttemptFrame` получает `frameActions`; focus-restore остаётся прежним.
- HTML fallback рамки: удалён незащищённый `onclick="closeModal()"` со старой кнопки; добавлен проверяющий актуальность делегированный обработчик. Штатные Enter/Space и подтверждение выхода через `mk872` не менялись.
- Журнал: карточки из уже существующей модели `rows`, переход на разбор, возврат и закрытие обёрнуты проверкой реального активного окна. Добавлен **рабочий HTML fallback** списка при ошибке Vue: просмотр записей с кнопками, клавиатурная навигация, возврат.
- Разбор записи: `reviewActions` охраняет close/journal/result. При отсутствии Vue отображается HTML fallback с данными ответа ученика и правильного ответа и возвратом к журналу.
- Логика начислений, результат, отчёты, журнал, контрольное повторение, маршруты и backend не менялись; адаптеры исключительно UI.

## Подтверждённый дефект и исправление

В прежнем HTML fallback рамки имелся незащищённый `onclick="closeModal()"`. Кнопка, сохранившаяся после удаления рамки из DOM, могла вызывать действие закрытия уже другого окна. Теперь callback проверяет, что старая рамка действительно является текущей, а диалог не блокирует действия. Специализированный браузерный тест с сохранённой отсоединённой кнопкой — PASS.

При первом запуске CI https://github.com/jokino9212/matkvest/actions/runs/45347245384 была **ошибка инфраструктуры теста**, не приложения: сценарий `missingModules` отключал Vue, но не отключал `legacy-vue-actions.js`, затем неверно проверял `typeof window.MatKvestVueActions === "undefined"`. При этом основная браузерная проверка 390/1280 px прошла. Тест исправлен блокировкой обоих модулей, после чего он прошёл. **Исходный патч не публиковался** до успешного повторного полного CI.

## Проверки и релиз

- Полный CI: https://github.com/jokino9212/matkvest/actions/runs/45347406123 — SUCCESS, **включая publish**.
- SHA-fenced `index.html` v274→v275, исходный хеш + точные anchors — PASS.
- Node: контракты route, Vue actions v271/272/273/274/275 — PASS; воспроизводимая Vue-сборка — PASS.
- Playwright: рамка, подтверждение выхода, продолжение попытки, сохранение черновика после offline F5; журнал → разбор → журнал → назад; read-only XP/монеты и отчёт после F5; stale/detached close — PASS на 390/1280 px.
- При недоступных `knowledge-map.js` и `legacy-vue-actions.js` — настоящий HTML fallback рамки, списка журнала и разбора, нажатия и возврат — PASS на 390 px.
- Полные регрессии прежних Vue-экранов, маршрутов, планов, школьной таблицы, тестов, четырёх действий столбиком — PASS; 16 сценариев controlreview/errorwork и column — PASS.
- PWA v274→v275: offline/online F5, профили, учебные результаты, награды без повторного начисления — PASS на 390/1280 px.
- `stage28_offline_pwa_browser.cjs`: 320/390/768 px — 3/3 PASS, 0 failures, профиль, монеты, XP и магазин сохранены.
- Итоговый HTML SHA256: `18791a0eadd7c29c925852455319ef58f2aca5c8b53e1d5c448029a20e238cf0`.
- Выпущен **только в тестовую ветку** `84b5fe51c1350c0009ccb42c6dadc90dff2d6f7f`, PWA `matkvest-iphone-v275`.
- Проверенный `main` до начала и после тестовой публикации: `2985f92b6bd1a26dfcc316917f1752602b099572`. PR остаётся Draft, нет merge и production deployment.

## Следующий этап

v276 — аудит остальных `showVueReport`/учительских отчётов и обработки отложенной навигации, по маленьким независимым группам с сохранением fallback. Проверять фокус, escape, routes/history, offline F5 и результат/экономику без дублей. Одноразовый v275 workflow после публикации перевести на `workflow_dispatch` для предотвращения повторного применения устаревшего SHA-патча.
