# МатКвест — v283: действия справки и закрытия таблицы лидеров

Дата: 24 ноября 2026. PR #131, Draft, без слияния. Разрешена только тестовая ветка `refactor/route-vue-actions-from-7c14ce9`.

## CI и исходная опубликованная v282

- Начальный HEAD `9de86f9b36e57fbefaee5fc23a257e366e327771`; опубликованный контент — v282, PWA `matkvest-iphone-v282`, SHA256 HTML `1138afcfade8185d1aae5fd0b15162637c2e0143573a47f4385647fe368d6ea9`.
- Общий PWA run `45457948523` — **SUCCESS**, attempt 1, тот же исходный HEAD. Legacy route contracts `45457948511` — SUCCESS.
- `main` оставался `2985f92b6bd1a26dfcc316917f1752602b099572`; production/backend запрещено менять.

## Read-only аудит и воспроизведение до изменений

- Аудит `45458390752` — SUCCESS. Выбрана только узкая UI-группа `openLeaderboard()`: кнопки «Справка» и «Закрыть» в резервной HTML-разметке и соответствующие события `mountLeaderboard`.
- Предварительный Playwright `45458649169` — SUCCESS: Vue 390/1280 и HTML fallback 390 с недоступными Vue и action adapter. Enter открывает справку; Escape закрывает её и возвращает фокус на кнопку. Отсоединённые старые кнопки после открытия магазина не меняют окно; текущие ID профиля, XP/монеты и число попыток неизменны.
- **Дефект этих обработчиков не воспроизведён.** Никаких «исправлений ошибок» не приписывать. Разрешена только изолированная структурная миграция прямых HTML onclick с сохранением доказанного поведения.

## v283: изменения

- `assets/ui/legacy-vue-actions.js`: `leaderboardDialogActions({isCurrent,close,help})` ограничивает действия действующим окном и сохраняет аргумент opener для правильного восстановления фокуса после справки.
- `index.html`: две резервные inline-команды заменены на `data-leaderboard-action="help"` / `data-leaderboard-action="close"`; нативное делегирование click только для текущего HTML fallback. Vue продолжает работать через `showVueReport` и те же guarded handlers.
- Оригинальная сортировка участников, разработческие профили, стоимость коллекции, маршруты, профили, результаты, выдача XP и монет, ledger, backend — **без изменений**.
- Asset URLs синхронизированы на v283; service worker `matkvest-iphone-v283`.

## Полный релизный CI и публикация

- Gate: https://github.com/jokino9212/matkvest/actions/runs/45459248144 — **SUCCESS**, attempt 1, job `138676970853`.
- SHA-fenced source и PWA fingerprints — PASS. Контрактные тесты legacy route + UI actions v271–v283, детерминированная Vue сборка — PASS.
- Новый браузерный тест Vue 390/1280 offline F5 и HTML fallback без Vue+adapter 390: **3/3 PASS**, Enter/Space/Escape, восстановление фокуса, отсутствие inline обработчиков, stale buttons inert, rewards/profile/attempts unchanged.
- 12 независимых подтверждений пропуска HTML столбика — PASS; полная регрессия предыдущих Vue/fallback сценариев v271–v282 — PASS.
- PWA refresh v282→v283 при 390 и 1280 px online/offline F5 — PASS, школьные таблицы/quiz/столбик add/sub/mul/div, контрольные и работа над ошибками, планы, журналы, преподавательские экраны, профили, экономика магазина и награды — PASS без повторных начислений.
- Responsive offline 320/390/768 px — **3/3 PASS**. Service worker cache и bundle SHA синхронизированы.
- Защищённая публикация после CI только `index.html`, `sw.js`, `assets/ui/legacy-vue-actions.js` в тестовую ветку: коммит `b949c72a362ab899b2bfb848442f0d7c45d51163`; SHA256 HTML `7d05de5da14684d128f0ac25eaf43a96b676195c15d935f96c6f56cfd4e62789`.
- PR #131 всё ещё Draft, unmerged. `main` оставался `2985f92b6bd1a26dfcc316917f1752602b099572`. Production и backend не изменялись.

## Следующий шаг

Перевести одноразовый v283 release gate в ручной режим без автоматического повторного применения патча. v284: read-only инвентаризация одной следующей небольшой группы legacy UI actions; воспроизводить дефекты до изменений, не подменять безошибочный рефакторинг фиксом. Полные Vue/HTML fallback, клавиатура, offline F5, маршрут, результаты и награды.
