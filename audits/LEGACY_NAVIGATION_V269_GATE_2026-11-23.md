# Тестовый этап v269 — вынос маршрутизации

База: PR #131, 535889e. Тестовая ветка: `refactor/route-vue-actions-from-7c14ce9`. Production и main не менять.

## Способ обхода ограничения 7,6 МБ

`audits/legacy_navigation_v269_patch.py` строго проверяет SHA-256 исходного index.html v268 и применяет малый патч локально на GitHub Actions runner. Патч идемпотентен; для неизвестной базы он останавливается без записи. Только после успешного CI runner делает коммит index.html и sw.js в ту же тестовую ветку.

## Изменения и инварианты

- Подключить assets/ui/legacy-navigation-core.js?v=269 до inline-функций.
- Делегировать route/depth/sameRoute/historyWrite новому core при его наличии. Старые inline-тела остаются без изменений как fallback.
- popstate использует новый core при наличии и старое правило при отсутствии.
- v269 обновляет 26 versioned script references, а PWA snapshot проверяет и новый core.
- Отложить удаление legacy-обработчиков и любые backend/production изменения.

## Гейты

- `node audits/legacy_navigation_core.test.cjs`
- `npm run build:knowledge-map` и сравнение с committed bundle
- `python3 audits/g7_stage12_sync_pwa.py --check`
- Playwright на ширине 390 и 1280: клавиатура, маршруты/Back/Forward, offline F5, результаты и награды без дублей
- Playwright отдельным сценарием: JS-модуль заблокирован, legacy fallback продолжает маршрутизировать

## Результат фактического запуска

- GitHub Actions: https://github.com/jokino9212/matkvest/actions/runs/45226505905 — **SUCCESS**.
- Проверка Node `legacy_navigation_core.test.cjs` — **PASS**.
- Vue build: повторная сборка не меняет `assets/ui/knowledge-map.js` — **PASS**.
- PWA v269: HTML SHA-256 `388d92e221053d785e63522a4032d52225a866079ec29493eaaf91987a2690b1`, все скрипты и offline snapshot — **PASS**.
- Playwright 390/1280 px: Enter/Space, Back/Forward, offline F5, результаты и награды после обновления — **PASS**.
- Playwright при заблокированном `legacy-navigation-core.js`: исходные обработчики маршрутов продолжают работать — **PASS**.
- Пример проверенного состояния: 1 запись быстрого тренажёра, 3 XP, 6 монет; без дублей после offline F5 и переходов.
- Сгенерированная версия зафиксирована в тестовой ветке коммитом `51f8df791d608b6ef2125758cead45de04e62808`.
- Ветка `main` на момент проверки: `2985f92b6bd1a26dfcc316917f1752602b099572`. Не изменялась этой работой.

## Полная PWA-регрессия после интеграции

- Исправлен статический перечень контрольных JS-файлов в `audits/pwa_verified_refresh_browser.cjs`: туда добавлен `assets/ui/legacy-navigation-core.js` (commit `caf6957576bf86503e8a7b1ca961b2785eede566`).
- GitHub Actions: https://github.com/jokino9212/matkvest/actions/runs/45227372040 — **SUCCESS**.
- `pwa_verified_refresh_browser.cjs` — **PASS**, включая обновление **v268→v269** на 390/1280 px, offline F5, задания, результаты, навигацию, магазин, учительские экраны и восстановление прогресса.
- `stage28_offline_pwa_browser.cjs` — **PASS** на 320/390/768 px: офлайн-кеш v269, работа 6-го класса, магазина, XP и монет.
- `legacy_navigation_core.test.cjs` на `caf6957` — **PASS**: https://github.com/jokino9212/matkvest/actions/runs/45227372102.

PR #131 остаётся draft. Production/deploy/merge/backend не выполнялись. Main не затронут.
