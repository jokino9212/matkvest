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
