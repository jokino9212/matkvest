# МатКвест — карта ответственности HTML, Vue и будущего backend

Дата: 23 ноября 2026. Ветка: fix/vue-mount-actions-20261123, PR #130. Статус: проверенный аудит; production не изменялся.

## Измеренный охват

- index.html: 7 607 882 байт (UTF-8), 42 203 строки, 2 787 уникальных объявлений именованных функций.
- 81 файл Vue (*.vue); 66 экспортируемых mount-точек в frontend/knowledge-map/mount.js. У всех 66 есть файл компонента.
- В index.html явно упоминаются 64 mount-точки. Две без прямого упоминания — mountSchoolAttempt и mountTrainingProgress; их нельзя считать поломанными или лишними только на основании поиска по строкам. TrainingProgress используется как вложенный Vue-компонент в SchoolAttemptFrame.vue и SchoolAttempt.vue.
- Старые inline-атрибуты: 273 (257 click, 6 keydown, 5 change, 4 input, 1 submit). addEventListener: 62 вхождения. Прямые записи innerHTML: 105, insertAdjacentHTML: 9.
- Наличие inline-атрибутов в строковых HTML-шаблонах **не** означает, что все 273 активны на текущем экране после монтирования Vue.

Машинные данные: audits/VUE_LEGACY_HANDLERS_2026-11-23.json.
Читаемая таблица: audits/VUE_LEGACY_HANDLERS_2026-11-23.md.

## 1. Что уже отображается через Vue

| Зона | Vue компоненты / точка интеграции |
|---|---|
| Каркас | AppHeader, AppFooter, HomeDashboard, RewardNotice |
| Классы и темы | GradeCourse, TextbookContents, CourseTopic, KnowledgeMap, TopicDetail |
| Школьная тренировка | SchoolAttemptFrame, SchoolAttempt, QuizExercise, TableExercise, ColumnExercise, StageResult, TrainingProgress |
| Быстрые тренажёры | QuickTrainerSetup, QuickTrainerFrame, QuickExercise, QuickTrainerResult |
| Результаты и аналитика | StudentProgress, AttemptJournal, AttemptReview, TrainingHistoryReport, PracticeResult, WeakTopics |
| План и контроль | TrainingPlan, TrainingGoalPicker, ControlReview, ControlReviewResult, QuestBoard |
| Магазин и коллекция | StoreCatalog, StoreWallet, StoreTabs, StoreChest, CollectionSection, CollectionArchive, PetQuickPanel |
| Профили / учитель | StudentProfiles, StudentProfileEditor, TeacherDashboard, TeacherStudentDetail, TeacherReview, TeacherStudentReport |
| Вспомогательное | BackupDialog, AchievementCatalog, Leaderboard, LearningDialog, StorageRecovery, ArtworkViewer |

Это перенос рендера и пользовательских событий в компоненты; сами действия часто всё ещё передаются из index.html через объект actions.

## 2. Что остаётся на стороне старого index.html

| Граница | Нынешний владелец | Почему это пока сохраняем |
|---|---|---|
| Навигация и браузерная история | openGrade, renderHome, mk854Route и обёртки, showVueReport, renderAnalyticsView | Legacy задаёт маршрут, готовит модель, показывает fallback, затем монтирует Vue |
| Школьные задания | beginBlock, finishBlock, startQuizStage, startTableStage, startColumnStage, генераторы | Содержание, ответы, три уровня, критерии перехода — не шаблоны Vue |
| Быстрые тренажёры | openQuickTrainer, quickAnswer, quickNext, quickSession и расчёт наград | Генерация, сессия и подсчёт остаются JS-контроллерами |
| Прогресс и сохранение | save, persistSilently, mk872PersistDraft, mk872ReadDraft, mk872RestoreDraft | Данные пока сохраняются локально в браузере; schema 1/2 должны оставаться совместимыми |
| Экономика и профили | openShop, openCollection, award, openProfiles, операции с локальным state | Нужны транзакционный ledger и авторитетные серверные права перед переносом |
| Служебные fallback-экраны | строковые HTML-шаблоны, старые onclick, модальные retry-обработчики | Резерв на случай неудачной загрузки Vue или незавершённой миграции |

**Системный долг:** исторические обёртки переопределяют некоторые функции много раз (например, 9 найденных реализаций renderHome, 26 renderGrade8, 11 openShop). Перенос требует проверки итоговой цепочки вызовов, а не удаления старого кода по имени.

## 3. Подтверждённый и устранённый дефект

При удалении контейнера предка Vue-host старый mountView отслеживал только прямого родителя и ближайший #mainView/#modal. Вложенное Vue-приложение могло остаться смонтированным на отсоединённом DOM.

Добавлена браузерная регрессия, которая на старой сборке завершилась «Vue view leaked after ancestor container removal». Исправление наблюдает изменения прямых детей каждого предка до documentElement и удаляет Vue-app при потере соединения.

Согласованная тестовая PWA v268: 3ad96699289727defb39135ae3b8b92acee75947.
Все проверки: https://github.com/jokino9212/matkvest/actions/runs/45160250902 — SUCCESS.
Проверены grade 1–8 на 390/1280 px, offline F5, обновление v267→v268 с черновиком, награды без дублей, профили, клавиатура, teardown Vue.

Инвентаризация вместе с браузерными проверками: https://github.com/jokino9212/matkvest/actions/runs/45159829702 — SUCCESS.

## 4. Следующая безопасная декомпозиция

1. Выделить модуль маршрутизации и адаптеры Vue view-model/actions из index.html, не меняя смысл открытых экранов и не удаляя fallback.
2. Вынести генераторы и проверку ответов в тестируемые JS-модули: сначала QuickTrainer и школьную таблицу/столбик, затем другие классы. Сохранить текущие идентификаторы попыток и критерии прохождения.
3. Изолировать локальное сохранение и outbox. Сохранить offline-first, версионность schema, автоматическое сохранение и F5.
4. Подключать backend только через согласованный контракт из audits/BACKEND_OFFLINE_SYNC_CONTRACT_v1_2026-11-23.md: идемпотентные события, уникальный attempt_id, серверная экономика, авторизация, лимиты Free/Full. UI не должен требовать кнопки «Сохранить на сервере».
5. Убирать legacy HTML-рендер только по мере накопления browser+offline e2e для соответствующих экранов. Не удалять 273 события массовой заменой.

## 5. Границы готовности

- PR #130 в отдельной ветке. Код и assets/ui/knowledge-map.js, index.html, sw.js согласованы как приватная PWA v268.
- CI подтверждает текущие тестовые сценарии, но не полную правильность каждого генератора заданий.
- Подключение backend, онлайн-сверка двух устройств и проверка руками на реальном Android остаются отдельными этапами.
- Никаких платежей, заказа сервера, деплоя в main/production не выполнялось.
