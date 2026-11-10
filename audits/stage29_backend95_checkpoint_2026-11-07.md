# МАТКВЕСТ — этап 29 / backend 9.5, контрольная точка 2026-11-07

**Статус: 9.5 Phase B (контракты + совместимость миграции + CSRF recovery) в отдельной рабочей сборке. Не релиз. Не объединять эту аудитную ветку с production, пока не закончены server sync и лицензирование.**

## Источники и версии

- **Frontend production:** `main` `c17dc37f1edeb9a5ac50fade2b695e441853e335`, HTML 8.77, Service Worker cache `matkvest-iphone-v77`, SHA256 HTML `2bf2729fb65cd10958e610bd2b04e0d4581c46431c1935985274fb9721e661f8`.
- **Восстановленный backend 9.4:** `/МАТКВЕСТ/matkvest_backend_9_4_final.zip`, 98 файлов. Переиспользован, не перезаписан. Исторический PostgreSQL 9.4 Gate 81/81 PASS.
- **Backend Phase A:** `/МАТКВЕСТ/matkvest_backend_9_5_phaseA_8_77_compat.zip` — только разрешение импорта backup 8.77 с тестами, 81 локальный тест PASS.
- **Последняя подготовленная серверная сборка — Phase B:** `/МАТКВЕСТ/matkvest_backend_9_5_phaseB_csrf_migration_877.zip`, SHA256 `2109ed24917cbfefeb2730df106f3ade30fde4bf475bdb39395016186eb268e4`, 101 файлов, **83 локальных SQLite/test PASS, 0 FAILED, 0 ERROR**. В этой фазе PostgreSQL 16+ Gate не выполнялся.
- Никакой VPS, боевой БД, секретов и реального API endpoint в GitHub Pages пока нет; НЕ утверждать облачную синхронизацию.

## Что уже реально сделано

1. Проверена исходная архитектура backend 9.4: `/api/v1/auth/register`, `/auth/login`, `/auth/me`, защищённые `/me/entitlements`, `/student/profiles/{profile_id}/topics/{grade}/{topic_id}/access`, `POST /student/profiles/{profile_id}/training-starts` с UUID `Idempotency-Key`. Без массового доступа к чужим данным.
2. Проведены независимые локальные регрессии: 79/79 на неизменённом backend 9.4, 83/83 после добавления 4 тестов Phase B. Прежний PostgreSQL Gate остаётся подтверждённым историческим результатом, **не новым Gate 9.5**.
3. В серверной Phase B реализован `GET /api/v1/auth/csrf` для восстановления cookie-bound CSRF без повторного логина после PWA reload. Тест: только активная сессия, неизменная session cookie, подменённый cookie — 403, `Cache-Control: no-store`.
4. `NormalizedMigrationImport.source_app_version` расширен с 8.71–8.72 до 8.71–8.77, включая 8.77; тесты проверяют сохранение XP, монет, предметов, экипировки и прогресса, идемпотентность и отказ неподдерживаемой версии 8.78. **Сам production импорт ещё отсутствует.**
5. В аудитной ветке GitHub создан `integrations/stage29_api_client.mjs`: изолированный JS клиент реального backend-API с cookie/CSRF, `cache:no-store`, запросом прав, проверкой topic access, единственным серверным training-start по детерминированному UUID на пару `server_profile_id + local_attempt_id`, CSRF recovery и отказом при недоступности сервера. **Не подключён к index.html.**
6. В аудитной ветке исправлен Service Worker: same-origin `/api/*` и `Authorization` запросы **никогда не попадают в CacheStorage**, а обычная PWA-работа офлайн сохраняется. Тестируется через реальный Chromium Service Worker. Этот SW **не опубликован**, cache-version v77 ещё не увеличен; при будущем выпуске необходим новый согласованный номер PWA cache.
7. Получен реальный frontend catalog `audits/stage29_frontend_topic_inventory.json`, нормализованный **неутверждённый** список `audits/stage29_canonical_topic_candidates.json`, и расчёт `ceil(N/4)` как предварительная оценка. Автоматически устанавливать Free-права по этому списку **запрещено**.

## Аудит каталога на текущем HTML 8.77

| Класс | Найдено UI тем / разделов | Оценка 25% по найденным записям (НЕ серверная политика) |
|---|---:|---:|
| 1 | 11 | 3 |
| 2 | 9 | 3 |
| 3 | 48 | 12 |
| 4 | 8 крупных разделов | 2 *(не применять)* |
| 5 | 53 | 14 |
| 6 | 58 | 15 |
| 7 | 107 | 27 |
| 8 | 110 | 28 |

**Всего 404 записи.** Grade 4 содержит крупные разделы (`column`, `table`, `numbers`...), а не подтверждённый набор всех практических тем. IDs в grade 5 пока короткие (`natural`, `coordinate`...), normalizer формирует `g5:natural` для API. До публикации Free/Full нужна каталогизация **реальных практических задач**, а не слепой подсчёт карточек.

## Блокеры Phase C — закрыть до подключения production frontend

- **Мультипрофильность.** В БД 9.4 `uq_student_profiles_user_id_mvp` разрешает только **один StudentProfile на учётную запись**. Во frontend пользователь может создавать несколько учеников. Нельзя тихо объединять их монеты, прогресс и попытки. Нужна модель владельцев/опекунов/репетиторов с явным выбором соответствия и новая миграция 0005 после согласования схемы.
- **Безопасный импорт** пока только dev API `/dev/migrations/normalized-profile` с `X-Dev-User-Id`. Production claim требует реальную cookie-auth, ownership, CSRF, staging/preview, проверку исходного backup, idempotent commit, rollback и запрет накрутки XP/coins.
- **Синхронизация.** Нет серверной операции сохранения и ревизий реального `attemptHistory`, `courseProgress`, `questionHistory`, черновиков, наград и коллекции. Сервер должен быть источником истины по XP/coins и не доверять локальным значениям.
- **Тарифы.** Entitlements 9.4 имеются, но в backend пустой реальный практический catalog policy; Free 25% нельзя активировать до верной классификации. 10 новых стартов/24ч обеспечивать только сервером; offline queue должна иметь стабильные idempotency keys.
- **Cookie / origin.** GitHub Pages `https://jokino9212.github.io/matkvest/` и отдельный API на другом домене несовместимы с текущими cookie `SameSite=Lax` для cross-origin fetch. Понадобится согласованный same-origin HTTPS reverse proxy / deployment (9.6) либо отдельный архитектурный пересмотр с полным security audit.
- **PWA API cache.** Промежуточную SW правку выпускать вместе с будущей интеграцией, синхронизируя cache/fingerprint; не сливать в main неконтролируемо.
- **PostgreSQL 9.5 E2E**: обязательно проверить миграции, конкурентные запросы, ownership/IDOR, race на limit, блокировку начислений/replay и полный регресс без FAILED/SKIPPED.

## Следующий исполнительный шаг

Начать Phase C с согласования схемы мультипрофильности и серверных облачных ревизий. Не публиковать JS bridge, пока нет production-safe backend API и сопоставления всех UI тем. Проводить небольшие изменения с полным Gate и отдельными PR. Сохранить рабочий frontend 8.77 и все локальные черновики неизменными.

**Актуальная ветка подготовки:** `audit/stage29-backend95-contract-20261107`. При переходе в новый чат продолжать именно с этого checkpoint, не восстанавливать backend архив заново и не просить пользователя снова его загрузить.
