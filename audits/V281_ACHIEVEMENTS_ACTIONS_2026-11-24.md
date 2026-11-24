# МатКвест — v281: аудит до правок (экран достижений)

Дата: 24 ноября 2026; PR #131, Draft. Рабочая ветка строго `refactor/route-vue-actions-from-7c14ce9`, production/`main`/backend запрещено изменять.

## CI на входе
- `main` = `2985f92b6bd1a26dfcc316917f1752602b099572`; в test branch опубликована v280, PWA `matkvest-iphone-v280`, SHA HTML `7c5d047f7150f976958fa630d279e9796fe3c4b936ae3d4f0b1f0acef4653e4b`.
- Общий PWA workflow `45419343880`, attempt 1: timeout неверного ответа при вычитании столбиком 1280 px (ожидание «Пока неверно»). Attempt **2: SUCCESS**, тот же commit `2845ad8e212bd4ec0678bae99d9140f00025d28a`. Маршрутные контракты `45419343844` — SUCCESS.
- Повторный прогон без изменения кода подтверждает **нестабильность теста, но не воспроизводимый дефект проверочной/экономической логики**. Нельзя менять механизм ответов или наград без дополнительного доказательства. Этот симптом продолжить мониторить и гонять старые тесты целиком.

## Инвентаризация новой узкой UI-группы
Read-only inventory https://github.com/jokino9212/matkvest/actions/runs/45447328426; точное содержимое v280:
- `achievementCatalogHtml(model)` генерирует `onclick="achievementSetView(id)"` для кнопок «Все», «Открытые», «Не открытые», «Легендарные», а также два `onchange="achievementSetCategory(this.value)"` и `onchange="achievementSetSort(this.value)"`.
- Legacy `achievementSetView/Category/Sort` меняют глобальные фильтры и вызывают `openAchievements()`, в котором вызывается `checkAchievementRewards()` и обновляется весь modal. Старые inline-обработчики не проверяют жив ли их DOM.
- В Vue-мосте `openAchievements` передаются прямые функции `view/category/sort`, которые меняют глобальный фильтр и вызывают `mountAchievementCatalog(host,...)` без текущей проверки `host.parentNode===modal` **в момент события**. Первая async-проверка присутствует только при монтировании. Отсоединённая кнопка Vue потенциально вызывает устаревший callback.
- Вся бизнес-логика наград, выдачи достижений, профилей, расчёта прогресса, сортировки карточек и хранения остаётся исходной.

## План безопасного изменения
1. Предварительный тест на текущем v280 для detached кнопок Vue и HTML fallback, с фиксацией реального эффекта до правок.
2. UI-only `achievementFilterActions` в `assets/ui/legacy-vue-actions.js`: `isCurrent` + whitelist `views/categories/sorts`; общий защищённый вызов для Vue и fallback; сохранение нативных Enter/Space и `select`.
3. Точечный SHA-fenced патч только `achievementCatalogHtml` и `openAchievements`, события fallback через делегирование живого `host`. Существующие контроллеры `achievementSet...`, checkAchievementRewards, монеты, XP не переписывать.
4. Playwright 390/1280 с Vue + offline F5, 390 без Vue и adapter, stale-buttons, фокус, фильтры, история, текущий profile ID, XP/монеты и награды без дублей. Все старые контракты v271–v280, регрессия, общий PWA 320/390/768.
5. При полном PASS — выпуск `index.html` и `sw.js` только в test branch с защищённым publisher, без merge; затем workflow manual-only.

## Подтверждено в preflight **до модификации HTML**

Read-only Playwright на опубликованной v280: https://github.com/jokino9212/matkvest/actions/runs/45447643970 — SUCCESS, 2/2 воспроизведения.
- Vue 390: после `openShop('avatars')` старая кнопка `Открытые` отсоединена, но синхронный `oldButton.click()` меняет `achievementViewFilter` с `all` на `open`. Открытое окно магазина не меняется; глобальная фильтрация скрыто изменена.
- HTML fallback 390 (Vue и adapter недоступны): аналогичная отсоединённая кнопка меняет фильтр и повторно открывает экран `achievement-screen` вместо магазина.
- В обоих сценариях текущие `profileId`, XP и монеты неизменны. Подтверждён UI-дефект устаревшего callback и нарушение маршрута, **не** дефект экономики. Применять только scoped guard + native delegation.

## Релиз v281 — успешный полный CI

- Релизный gate: https://github.com/jokino9212/matkvest/actions/runs/45448457909 — **SUCCESS**; job `138638623191`, protected test-only publisher выполнился.
- Контрактные проверки legacy route и Vue actions v271–v281 — PASS; детерминированная пересборка `assets/ui/knowledge-map.js` — PASS.
- Новый `achievementFilterActions` только для view/category/sort с проверкой живого modal, ревизии конкретного Vue-рендера и whitelist допустимых ID. HTML fallback использует delegated native click/change; старые inline `achievementSetView/Category/Sort` из разметки удалены. При перерисовке fallback восстанавливается фокус на выбранном фильтре.
- Бизнес-правила `checkAchievementRewards`, выдачи XP/монет, хранения/восстановления наград, маршрутизации и профилей не изменены.
- Playwright новый экран 390/1280 Vue c offline F5 и 390 без Vue и adapter — **3/3 PASS**: кнопки, Enter/Space, сортировка, категории, stale detached Vue/HTML кнопки inert, сохранность ID/XP/coins/achievement ledger, без дублей.
- 12 независимых прогона skip-confirm HTML столбика — PASS. Предыдущий однократный timeout неправильного ответа в общем PWA CI `45419343880` на том же SHA не воспроизвёлся (rerun attempt 2 SUCCESS), поэтому логика проверки/награды не изменялась.
- Вся регрессия v271–v280: Vue маршруты, grade/knowledge/detail, планы, quick trainer, школьные таблицы/викторины/столбик, журнал попыток и разбор, преподавательская панель, отчёты, профили, Escape и вкладки магазина — PASS.
- PWA refresh **v280→v281** online/offline F5 390 и 1280 px — PASS с сохранением прогресса; все операции столбиком add/sub/mul/div, контрольные повторения mul/div, работа над ошибками mul/div — PASS.
- Responsive offline `320/390/768` — **3/3 PASS**, 0 ошибок; PWA-кеш, профиль, XP, coins, магазин доступны.
- Проверка синхронизации service worker и HTML SHA256 — PASS. Выпуск `d11d613b4d5f176b4e08922d983133751f9bd9c0`, cache `matkvest-iphone-v281`, HTML hash `b4d818184329a2c45c2de702479c0f9389846132d9ddaa82337b3af1609c82ab`.
- Публикация **исключительно** в test branch `refactor/route-vue-actions-from-7c14ce9`, PR #131 Draft. `main` остаётся `2985f92b6bd1a26dfcc316917f1752602b099572`; production/backend не тронуты.
- После успеха выпускной SHA-fenced workflow перевести в `workflow_dispatch` без автоматического повторного применения патча.

## Следующий этап v282

Выбирать только одну новую локальную группу UI-обработчиков. Сначала отдельный read-only аудит, фиксировать воспроизводимые дефекты до изменений, затем scoped Vue actions с рабочим HTML fallback. Полная проверка клавиатуры, Escape, UX, маршрутов, offline F5, сохранения истории и наград; не трогать производство, backend и текущие контроллеры без доказательства дефекта.
