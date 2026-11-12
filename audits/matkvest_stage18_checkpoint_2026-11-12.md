# МатКвест — этап 18, checkpoint (12.11.2026)

## Подтверждённая исходная точка
- Stage17 production release PR #34, release `700a08a1605b27fc5a65ec830a9ef10079ca0612` и 17/17 production workflows SUCCESS, см. `audits/matkvest_stage17_checkpoint_2026-11-12.md`.
- Актуальный main при создании этой ветки: `faf5b1a9446b1b3eb0157ea9b3e3259602df1e2f` (документационная правка поверх Stage17 release).
- Новая audit-ветка: `audit/g5-pedagogy-stage18-20261112`; **production не менялся**.

## Что сделано в Stage18
- `audits/g5_stage18_pedagogy_baseline.cjs`: read-only браузерная диагностика реальных генераций, 53 темы × 3 этапа × 20 тренировок × 5 задач = **15 900 заданий**.
- Записывает разнообразие текстовых формулировок, математических шаблонов, типы формулировок, кандидатов на сюжетность, повторы внутри тренировки, примеры фактических условий и ответов.
- `.github/workflows/quiz-stage18-pedagogy-baseline.yml`: запускает Playwright-аудит при push в audit-ветку, без записи в HTML и без прав на запись в репозиторий.
- Код и workflow действительно сохранены в GitHub, коммиты `dc08a672c7f73811ae04f4666f4efd712d7d6435` и `332b56dfa74f75980beb5d8fad05f1591adb171b`.
- **CI PASS пока не подтверждён**. Не называть рейтинг слабых тем установленным без реальных результатов и ручной проверки выборки. Дефицит сюжетов не равен математическому багу.

## Следующий «Продолжи»
1. Получить факт выполнения `quiz-stage18-pedagogy-baseline.yml`, посмотреть stdout `STAGE18_BASELINE_SUMMARY` или json report, исправить сам тест, если падение вызвано его ошибкой.
2. Выбрать реально слабые темы по примерам, не подменять смысловую проверку лексической эвристикой.
3. Писать узкий патч **одной** темы на отдельной ветке или продолжить Stage18 audit branch, независимый математический oracle + педагогика, затем Stage14A/B/C, Stage11/10/05, Grade5 fraction inputs, skip, persistence, PWA, mobile, pets and shop regression.
4. До PASS/PR/production gate ничего не сливать в main.
