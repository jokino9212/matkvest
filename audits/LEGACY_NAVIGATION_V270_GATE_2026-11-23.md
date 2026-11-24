# МатКвест — тестовый этап v270 (23.11.2026)

## Область изменений

PR #131, только ветка `refactor/route-vue-actions-from-7c14ce9`. В production, `main` и backend изменений не вносили.

- `assets/ui/legacy-navigation-core.js`: чистая диспетчеризация экранов через внедряемые обработчики (`dispatchRoute`), выбор отложенного восстановления (`shouldDeferRestore`), свежие action-контракты для главной страницы и возврата к плану.
- `index.html`: хеш-ограниченный патч v269→v270 применён на GitHub Actions runner. Все оригинальные inline-ветви сохранены как fallback при недоступности модуля.
- `sw.js`: PWA-кеш `matkvest-iphone-v270`, новые контрольные SHA-256 HTML и скриптов.
- `audits/pwa_verified_refresh_browser.cjs`: после перехода к следующему примеру в резервном «Счёте столбиком» ждём видимую кнопку пропуска, активируем через Enter и явно проверяем отсутствие пропуска до подтверждения. Прежний Space мог попасть в момент повторного создания DOM; другие тесты отдельно проверяют Space.
- Сохранены проверки клавиатуры, Back/Forward, результата, наград, offline F5 и legacy fallback.

## Подтверждение

- Два полных успешных прогона после уточнения flaky-теста: https://github.com/jokino9212/matkvest/actions/runs/45241770765 и https://github.com/jokino9212/matkvest/actions/runs/45241918647.
- Комплексный v270-gate: https://github.com/jokino9212/matkvest/actions/runs/45243056818 — **SUCCESS**. Проверены Node-контракты, сборка Vue без изменений артефакта, Playwright (390/1280 px) с маршрутами, клавиатурой, результатами и наградами после offline F5 и заблокированным route JS; полный PWA verified refresh и stage28 offline browser.
- Итоговый SHA-256 `index.html`: `4466259120ab27c79930f317832a4aa9d57549d6bbfd5735523be0ca7b9908f6`.
- Проверенные `index.html` и `sw.js` записаны в тестовую ветку коммитом `70e882d2933f4c92d51ed35df3f1758e00e9acb8`.

## Ограничения

Это поэтапный перенос маршрутизации и первых Vue action-адаптеров, **не** удаление всех legacy-событий и не готовый backend. CI подтверждает покрытые сценарии, а не математическую правильность каждого генератора. PR остаётся draft; merge/deploy не выполнять без отдельного разрешения.
