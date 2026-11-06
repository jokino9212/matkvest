# МАТКВЕСТ — ПУБЛИКАЦИЯ ПРОВЕРЕННОГО FRONTEND v70 В PRODUCTION

**Дата:** 6 ноября 2026 г. **Статус:** DEPLOYED / LIVE CHECK PASS.

## Production

- Публичный сайт, полученный непосредственно от официальной настройки GitHub Pages: https://jokino9212.github.io/matkvest/
- Слияние чистого PR [#8](https://github.com/jokino9212/matkvest/pull/8): **merged**, squash commit main `930aea7a53be4d333311443beec0f81fef3a59b8`.
- В релизной ветке `release/ui-v70-20261106` относительно исходной v55 изменились **только `index.html` и `sw.js`**. Backend, пользовательские данные и исходные архивы не менялись.
- После слияния `main` содержит синхронизированный SW `matkvest-iphone-v70` с `APP_BUILD_HASH` = `c93d13aeaafdb742e3ceda0111d3242daaf19fcc3a2cdd7b90b1b4a18f0817f2`.
- Проверенный live SHA-256 HTML: **`c93d13aeaafdb742e3ceda0111d3242daaf19fcc3a2cdd7b90b1b4a18f0817f2`**.

## Подтверждённые CI/Gates

1. UI этап 19I, полный [Chromium gate](https://github.com/jokino9212/matkvest/actions/runs/42233741042): **1191/1191 PASS** плюс кроссклассные математические тесты и PWA.
2. Предрелизная проверка [v55→v70](https://github.com/jokino9212/matkvest/actions/runs/42238734888): **success**. В тесте использованы реальный старый main `318898506e150151595d01265190e0944e4c2ab0` и его `matkvest-iphone-v55`; новая версия получила те же ID незавершённой попытки, сигнатуру задания, ключ и локальные данные, без принудительного Ctrl+Shift+R. Дополнительно пройдены проверки доступности диалогов, пропусков, кошелька и магазина, математических генераторов и арифметики 4 класса.
3. [GitHub Pages build and deployment](https://github.com/jokino9212/matkvest/actions/runs/42239142188) — **success**.
4. [PWA fingerprint synchronization](https://github.com/jokino9212/matkvest/actions/runs/42239143587) — **success**.
5. [Production Chromium real-site check](https://github.com/jokino9212/matkvest/actions/runs/42239143688) — **success / PASS**: сначала сервер отдавал прежний v55 SHA в ходе распространения Pages, на **11-й попытке** HTML и SW одновременно совпали с точной v70. Затем **desktop 1440 px PASS**, **mobile 390 px PASS**, оба используют кеш v70; сохранение и восстановление незавершённой тренировки **PASS**; **0 JavaScript pageerrors**. Скриншоты и machine-readable отчет сохранены в artifact этой Actions.

## Границы приёмки

Проверка v55→v70 выполнена в изолированном браузерном профиле с тестовыми данными; реальные профили пользователей не изменялись. Проверено, что штатная онлайн-навигация и service worker обновляют приложение без hard reload; невозможно гарантировать мгновенное обновление всех открытых вкладок/устройств в мире при любом состоянии сети. GitHub Pages HTML/SW отдают Cache-Control `max-age=600`, но текущий Service Worker применяет network-first при навигации и обновление кеша.

## Следующие действия

**Production v70 — новая базовая версия.** Не возвращаться к v55 как к актуальному сайту. Для backend 20/9.5 продолжить из `audits/next_chat_checkpoint_backend20_catalog_2026-11-06.md` с поправкой на новый production SHA и commit. Backend 9.4 исходный архив остаётся в Library; не перезаписывать production/frontend при дальнейшем backend-аудите. Сначала отдельная серверная ветка, защита данных и PG Gate, затем следующая коммерческая дорожная карта.

Связанный checkpoint будет сохранён отдельно.
