# МатКвест — v286: действие закрытия окна продажи предмета

Дата: 24 ноября 2026. PR #131 остаётся Draft, без слияния. Изменения приложения допускаются только в тестовой ветке `refactor/route-vue-actions-from-7c14ce9`.

## 1. Актуальное состояние до изменений

- На старте опубликована v285: тестовый HEAD `7c95402f34c756abc94399f4cac9da4e6572b9da`, кеш `matkvest-iphone-v285`, SHA256 HTML `e75007dd6af16c07d4b678a14f2156344b203e64c3fb23a819ffea2907739b1a`.
- Запрошенный PWA CI `45470900334` и Legacy route contracts `45470900353` — **SUCCESS**, PWA attempt 1.
- Зафиксированный `main`: `2985f92b6bd1a26dfcc316917f1752602b099572`, не менялся. Production/backend не изменялись.

## 2. Read-only инвентаризация одной независимой группы

- Run `45471694546` — SUCCESS. Кандидаты осмотрены **без изменений**: учительское удаление, уведомления достижений, тренировочный диалог, информационное/экономическое окно продажи, backup диалог.
- Выбрана только небольшая независимая UI-группа: **закрыть окно продажи предмета** (`mk865SaleDialogHtml` / `mk865ShowSaleOverlay`); отсутствуют изменения транзакций, возврата средств, миссий, выбора тем.
- В исходном v285 HTML fallback использовал `onclick="mk865CloseSaleOverlay()"`; Vue `mountStoreSaleDialog(host,model,{close:mk865CloseSaleOverlay,...})`. Старый callback сохранял возможность закрыть новый модальный экземпляр при смене `host`.

## 3. Подтверждение дефекта ДО исправления

- Pre-fix browser run `45471848444` — **SUCCESS как проверка воспроизведения**, не исправления.
- Безопасные информационные модели `Первое окно — без операций` и `Второе окно — без операций`. Второе окно открыто, старый `button.mk865-sale-close` отсоединён. Вызов `oldClose.click()` ошибочно закрывал **второе** окно.
- Баг `defectOldClose:true` воспроизведён **3/3**: Vue 390/1280 px и HTML fallback без Vue/adapter 390 px.
- Во всех baseline случаях неизменны `state.profileId`, XP, монеты, число попыток, текущий маршрут. Никакая продажа/возврат не выполнялись.

## 4. Исправление v286

- `assets/ui/legacy-vue-actions.js`: узкий адаптер `saleDialogCloseActions({isCurrent,close})`, разрешает только закрытие действующего экземпляра.
- В `index.html`: `isCurrent` требует `host.parentNode===box`, `host.isConnected`, `el.classList.contains("show")`, `mk865CurrentSaleDialog===model`. Vue получает `close:closeActions.close`. HTML fallback заменяет прямой `onclick` на `data-mk865-sale-close` с делегированным native click и тем же guarded callback.
- Основные `mk865RunSaleButton`, `mk865RunSaleTopic`, `mk865SellItem`, `mk865CloseSaleOverlay`, логика сохранения, вознаграждений, тренировок и маршрутов не менялись.
- `sw.js`: только кеш `matkvest-iphone-v286` и синхронизированный HTML fingerprint. Asset URL `?v=286`.

## 5. Полный gate, тесты, публикация

- Релизный SHA-locked gate: https://github.com/jokino9212/matkvest/actions/runs/45472233133 — **SUCCESS**, attempt 1, job `138722961588`.
- Патч и PWA fingerprints — PASS, HTML SHA256 `0e4f66c7f3deb7bf297c14929deb0f25251c42ca561ab7a6cdce0b77d36051a9`.
- UI контракты v271–v286 и детерминированная Vue-сборка: PASS.
- Новый браузерный тест Vue 390/1280 при offline F5 и HTML fallback 390 без Vue/adapter: **3/3 PASS**; detached old close inert, no inline close handler, Enter, Space, Escape, backdrop, focus restoration, unchanged profile, route, XP/coins/attempts.
- 12 повторных подтверждений HTML column skip: PASS.
- Полный набор предыдущих браузерных регрессий v271–v285 (Vue, fallback, тренажёры, планы, результаты, квесты, учитель, магазин, достижения, справка, полноэкранный просмотр): PASS.
- PWA refresh v285→v286 online/offline при ширине 390 и 1280 px: PASS, F5, offline quizzes, сохранённый прогресс.
- Столбик +, −, ×, ÷, контрольная и работа над ошибками, результаты и отсутствие повторных наград: PASS.
- Responsive offline 320/390/768 px: **3/3 PASS**, профиль, XP и монеты после F5 сохранены.
- Защищённый publisher только ПОСЛЕ успешного CI записал **только** `index.html`, `sw.js`, `assets/ui/legacy-vue-actions.js` в тестовую ветку; релизный коммит `d786e1c7b7d7ea4b81d7bb00ac70b163d5173c8e`. Кеш: `matkvest-iphone-v286`.
- PR #131 Draft/unmerged; `main` сохранил `2985f92b6bd1a26dfcc316917f1752602b099572`. Production и backend не изменены.

## 6. Завершение и следующий шаг

- Одноразовый автоматический workflow v286 перевести в `workflow_dispatch`, не запускать повторное применение SHA-locked патча.
- Служебные журнал/CI-коммиты не меняют опубликованные файлы приложения.
- Для v287: актуальный CI после служебных коммитов, read-only инвентаризация одной новой небольшой группы legacy UI actions, pre-fix доказательства; разрешать только подтверждённые исправления либо изолированный UI-рефакторинг, сохранить полный PWA/HTML/Vue/keyboard/offline F5/route/progress/reward gate и запрет изменения `main`, production и backend.
