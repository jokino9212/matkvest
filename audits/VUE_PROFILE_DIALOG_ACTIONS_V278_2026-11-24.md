# МатКвест — этап v278: инвентаризация inline-обработчиков и Vue actions профилей

Дата: 24 ноября 2026. Репозиторий `jokino9212/matkvest`, PR #131, **только** тестовая ветка `refactor/route-vue-actions-from-7c14ce9`, base `fix/vue-mount-actions-20261123`. Без merge, без production и backend.

## Исходное состояние и CI

- На старте: v277, PWA `matkvest-iphone-v277`, HTML SHA256 `d6504e2c24427bfc4d80ed4f303ec824a588a0b4e365593a7123d788679f2757`.
- Проверенная исходная `main`: `2985f92b6bd1a26dfcc316917f1752602b099572`.
- Релизный CI v277: https://github.com/jokino9212/matkvest/actions/runs/45399488279 — SUCCESS. Legacy route contracts на предыдущем PR head: https://github.com/jokino9212/matkvest/actions/runs/45401773943 — SUCCESS. Общий PWA CI исходного head на момент старта был in progress, но полный выпускной v277 PWA был проверен.
- Инвентаризация v278, read-only Actions: https://github.com/jokino9212/matkvest/actions/runs/45402484881 — SUCCESS; первый прогон https://github.com/jokino9212/matkvest/actions/runs/45402283593 завершился из-за неверно экранированного регулярного выражения для *списка фрагментов*. Выпускной HTML не изменялся до завершения инвентаризации.

## Классификация оставшихся inline-обработчиков

Источник: `index.html` на v277, 7 618 300 байт. **Лексический** подсчёт по регулярному выражению `\b(on(?:click|keydown|input|change|submit))\s*=`:

| Тип | Вхождений |
|---|---:|
| `onclick` | 280 |
| `onkeydown` | 18 |
| `oninput` | 6 |
| `onchange` | 5 |
| `onsubmit` | 1 |
| **Всего** | **310** |

Эти 310 — **все совпадения в исходнике**, а не 310 независимых HTML-обработчиков: среди них есть JS-присваивания вида `host.onclick=`. Ранее упоминавшиеся 250 — более узкий текстовый подсчёт. Инвентаризация определила 120 функций/областей с совпадениями. Крупнейшие группы: `showElementaryTopicSoon` (14), `quizAnswerMarkup` (12), `teacherStudentDetailHtml` (10), `openCollection` (9), `teacherDashboardHtml` (7; click/input/change), `studentReportFallback` (7; click/input/submit), `renderProfileEdit854` (7; click/input/keydown), `openProfiles` (6; 5 click и 1 keydown), `openDataManager` (4; click/change).

**Группировка по экрану/риску:**
- Образовательные задания и ранние классы: `quizAnswerMarkup`, `showElementaryTopicSoon`, генераторы G8. Высокий риск изменения прохождения, проверки ответа и начислений — не трогать массово.
- Профили и коллекция: `openProfiles`, `renderProfileEdit854`, `openCollection`. Действия уже представлены Vue, но сохраняются inline legacy fallback; требуют защиты от действий закрытого окна.
- Преподаватель и отчёты: `teacherDashboardHtml`, `teacherStudentDetailHtml`, `studentReportFallback`. Уже имеется общий `teacherViewActions` после v276; следующий перенос поэтапно и с проверкой печати и формы.
- Импорт, экспорт и резервирование: `openDataManager`, `showImportPreview`, конфликты импорта. Повышенная цена ошибки — пока не выбраны.
- Магазин, косметика и питомцы: `shopTabs`, `showStoreSurface`, `openCollection`. Проверять без изменения экономики.
- Служебные диалоги и клавиатура: PIN преподавателя, сохранение профиля, QuickTrainer, резервные ошибки. Не объединять с миграцией других групп.

**Выбранный узкий этап v278:** `openProfiles`, ровно 6 inline legacy-жестов (5 click, 1 Enter). Бизнес-функции не переносить в адаптер.

## Подтверждённый дефект/риск до исправления

В HTML fallback `openProfiles` использовались прямые `onclick="selectProfile(${i})"`, `onclick="createProfile()"` и `onkeydown` для Enter. `selectProfile` вычислял имя из глобального `window._profileNames`, который пересоздаётся при следующем открытии окна. Поэтому сохранённая кнопка отсоединённой старой карточки могла применить старый индекс **к новому списку** и переключить активного ученика — профильная навигация не проверяла актуальность окна в момент вызова. Установка защиты исключает этот сценарий. Это подтверждённое несоответствие кода требованию stale guard, без утверждения о фактическом пользовательском инциденте.

## Изменения

- `assets/ui/legacy-vue-actions.js`: новый чистый UI-адаптер `profileDialogActions` с проверками `isCurrent`, `Number.isInteger(index)`, диапазона индексов и защитой от блокирующего диалога.
- `audits/legacy_profile_dialog_v278_patch.py`: SHA-fenced точечный патч только `openProfiles`; заменяет 5 inline кликов на `data-profile-action` и Enter на `data-profile-enter`. Регистрирует один обработчик на живом `.vue-report`, игнорирует устаревший DOM и использует тот же `profileActions`, что и Vue.
- При отсутствии модуля адаптера работает эквивалентный защищённый HTML fallback; при отсутствии Vue html-список, выбор, создание, магазин/коллекция и клавиатура продолжают работать.
- `createProfile`, `selectProfile`, `save`, восстановление профиля, экономика, уровни, награды, роутинг, состояние и backend **не изменялись**.

## Результаты CI и публикация

- **Полный gate CI** https://github.com/jokino9212/matkvest/actions/runs/45403241674 — **SUCCESS**, включая protected publish.
- Контракты v271–v278, детерминированная сборка Vue, SHA-locked patch, кеш PWA — PASS.
- Playwright профили 390/1280 (Vue, offline F5) и 390 без Vue и без адаптера (HTML fallback) — PASS: Enter создаёт ровно один профиль, выбор возвращает исходный ID/XP/монеты/историю, stale select не переключает профиль, магазин/коллекция работают, повторных начислений после F5 нет.
- Регрессия предыдущих Vue-маршрутов, каталога и карты знаний, планов, школы, столбика, журнала/разбора и преподавательского отчёта — PASS.
- Verified PWA 277→278: 390 и 1280 px, online/offline F5, сохранение прогресса, попыток и наград — PASS. Все четыре операции column, controlreview mul/div, errorwork mul/div — PASS.
- Responsive offline PWA 320/390/768 — **3/3 PASS**, 0 failure; профиль, XP, монеты, магазин, контроллер SW сохранены.
- Опубликованы **только** `index.html` и `sw.js` в той же тестовой ветке: commit `1d42bf616f3b1d26413d8f9e3dca11150c6d26b9`, cache `matkvest-iphone-v278`, HTML SHA256 `9b6c8d68c94d178a69e5bad9403f7482f5dd7ebca7a2bffc081e3ee25e17c62e`.
- Общие CI, запускаемые на токеном GitHub Actions созданном коммите, могут возвращать `action_required` вследствие правил разрешений; ориентир для этого выпуска — успешный полный gate `45403241674`, а не предварительная общая PWA-сборка до HTML-публикации.
- После выпуска одноразовый gate перевести на `workflow_dispatch` без автоматического повтора устаревшего SHA-патча. PR оставить Draft; `main`, production и backend не менять.

## Следующий этап v279

Выбрать небольшой низкорисковый блок из `teacherDashboardHtml` или коллекции, сначала зафиксировать старые inline действия и конкретные сценарии fallback, затем перенести только жесты с полноценной браузерной проверкой клавиатуры, профиля, сохранённой истории, offline F5 и наград. Никакого массового удаления legacy-пути.
