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

Статус: ожидает фактический результат CI, не является утверждением PASS до проверки логов.
