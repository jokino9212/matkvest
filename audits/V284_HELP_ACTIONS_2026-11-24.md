# МатКвест — v284: закрытие глобальной всплывающей справки

Дата: 24 ноября 2026. PR #131 — Draft, без слияния. Единственная разрешённая ветка `refactor/route-vue-actions-from-7c14ce9`.

## Исходное состояние и актуальные CI

- На старте: опубликованная v283, тестовый HEAD `7bb8cda8cf7505bde957e10d86f877932c96baf7`, PWA `matkvest-iphone-v283`, SHA256 HTML `7d05de5da14684d128f0ac25eaf43a96b676195c15d935f96c6f56cfd4e62789`.
- Проверен запрошенный общий PWA run `45461089538` — **SUCCESS**, attempt 1; legacy route contracts `45461089455` — SUCCESS.
- `main` на исходном и финальном контроле: `2985f92b6bd1a26dfcc316917f1752602b099572`. Production и backend не изменять.

## Read-only инвентаризация

- Run `45462254698` — SUCCESS. Одна независимая группа оставшихся UI actions: `mk872HelpOpen` / `mk872HelpClose`, закрытие через кнопку и подложку всплывающей справки, совместимую с Vue `mountStoreHelpDialog` и HTML fallback.
- Выявлено, что старые обработчики вызывают глобальную `mk872HelpClose()` без проверки слоя, а fallback использует прямой `onclick`. Затронуты только UI gestures, не данные и маршруты.

## Подтверждённые дефекты ДО изменений

- Браузерный baseline `45462363738` — SUCCESS (тест воспроизведения, не утверждение исправления).
- На неизменённой v283: после открытия справки «О магазине», затем новой справки «О моей коллекции», вызов click на **отсоединённой кнопке закрытия первой справки** удаляет вторую справку.
- После открытия третьей справки «О сундуке удачи» click по **старой отсоединённой подложке** удаляет третью справку.
- Баги подтверждены: Vue 390 px, Vue 1280 px, HTML fallback при блокировке Vue и adapter 390 px — **3/3 воспроизведено**.
- ID профиля, XP, монеты, число попыток и маршрут не изменялись при воспроизведении.

## Исправление v284, строго ограниченная группа

- `assets/ui/legacy-vue-actions.js`: `helpDialogActions({isCurrent,close})`, проверяет актуальный слой перед UI-действием.
- `index.html`: `mk872HelpOpen` создаёт guard `layer.isConnected && document.getElementById('mk872-help-layer')===layer`; Vue получает `close:helpActions.close`; fallback получил нативный делегированный click через `data-mk872-help-close` вместо inline onclick. Старая подложка и старая кнопка больше не управляют новой справкой.
- Сохранены Escape, Enter, Space, Tab и восстановление фокуса существующим `mk872HelpClose`. Общий маршрутизатор, профили, экономические операции, начисления наград, результаты, backend — **без изменений**.
- HTML asset versions и SW cache обновлены только на v284.

## Полная проверка, CI и релиз

- Основной защищённый CI: https://github.com/jokino9212/matkvest/actions/runs/45462746898 — **SUCCESS**, attempt 1, job `138689477990`.
- SHA-fenced patch/PWA fingerprints — PASS; contract tests v271–v284, детерминированная Vue-сборка — PASS.
- Новый браузерный тест: Vue 390/1280 с offline F5 и HTML fallback 390 без Vue/adapter — **3/3 PASS**; old button and old backdrop inert, current close works, keyboard Enter/Space/Escape, focus restored, no inline, profile/route/XP/coins/attempts stable.
- 12 повторов HTML column skip-confirm — PASS. Полная браузерная регрессия всех предыдущих интерфейсных этапов v271–v283 — PASS (маршруты, классы, план, результаты, журнал, учитель, магазин, достижения, квесты, справка лидеров).
- PWA v283→v284 online/offline F5 на 390 и 1280 px — PASS; тесты таблицы/quiz/столбика: +, −, ×, ÷, контрольная и работа над ошибками, результаты/награды без дублей.
- Responsive offline 320/390/768 — **3/3 PASS**; cache `matkvest-iphone-v284`, сохранение ученика, XP/монет и магазина.
- Защищённый publisher создал релизный коммит **только в тестовой ветке** `9c05e8cd31ccdc71ab5c8487b8cb6c4ee0d3a156`; изменены только `index.html`, `sw.js`, `assets/ui/legacy-vue-actions.js`.
- HTML SHA256 `eed085c9fd5a97d00cb3ba40f64287f33a951502f5f377631410cd09cc772416`; проверено в `sw.js` как `APP_BUILD_HASH`.
- PR #131 остаётся Draft/unmerged. `main` сохраняет `2985f92b6bd1a26dfcc316917f1752602b099572`, production/backend не трогались.

## Следующее

Вывести одноразовый workflow релиза v284 из автоматического push-триггера (manual-only). Для v285 — очередная маленькая read-only инвентаризация legacy UI actions, доказательство дефектов до изменения, строго ограниченный UI-перенос, полная Vue/HTML/offline/keyboard/route/award регрессия; публикация только в тестовой ветке после PASS.
