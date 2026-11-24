# МатКвест v279 — исходный аудит преподавательской панели (до исправлений)

Дата: 24 ноября 2026. PR #131, ветка `refactor/route-vue-actions-from-7c14ce9` (Draft), без правок `main`, production, backend.

## Исходное состояние

- v278 HTML SHA256 `9b6c8d68c94d178a69e5bad9403f7482f5dd7ebca7a2bffc081e3ee25e17c62e`, PWA `matkvest-iphone-v278`, тестовая ветка `b688efe65ad133a8af10eaf60b17a5764a6d142e`.
- Релизный CI v278 https://github.com/jokino9212/matkvest/actions/runs/45403241674 — SUCCESS; последний общий route contracts https://github.com/jokino9212/matkvest/actions/runs/45405417725 — SUCCESS; общий PWA verify на текущем PR head ещё выполнялся на момент начала v279.
- Read-only inventory https://github.com/jokino9212/matkvest/actions/runs/45405836864: `teacherDashboardHtml` содержит **5 onclick, 1 oninput, 1 onchange**. Дополнительно `teacherChoicesHtml` динамически формирует кнопки фильтра `teacherSetFilter`, `teacherRosterCardHtml` формирует `openTeacherStudentDetailById(this.dataset.profileId)`.
- Сохраняется старый компонент `mountTeacherDashboard` и общий `renderTeacherView` (адаптер `teacherViewActions` из v276).

## Зафиксированный кодовый дефект/риск

- Vue callbacks уже защищены проверкой ревизии, но HTML fallback преподавательской панели использует прямые `onclick="closeTeacherMode()"`, `onclick="openProfiles()"`, `onclick="openDataManager()"`, а также `teacherSetSearch`, `teacherSetSort`, `teacherSetFilter` и `openTeacherStudentDetailById` напрямую.
- Capture guard v276 защищает **действия внутри отсоединённого родительского host**, но не гарантирует защиту для **уже отсоединённых дочерних узлов** с собственным inline-обработчиком: click через `detachedButton.click()` не всплывает к `host`. Поэтому старая кнопка фильтра или карточки могла менять текущий экран без проверки ревизии и валидности ID.
- Переносить расчёт `teacherDashboardModel`, сортировку по сохранённым профилям, `profiles`, `state`, сохранённые результаты, историю или награды **нельзя**: меняется только интерфейсная диспетчеризация.

## Выбранное исправление и критерии

- Новый `teacherDashboardActions` в `assets/ui/legacy-vue-actions.js` для `close/search/sort/filter/open/profiles/backup`, с ревизией/живым host и whitelist текущих `sorts/filters/profileIds`.
- Нативный HTML fallback заменить с inline-действий на `data-teacher-dashboard-action` с event delegation; вызовы оборачивать теми же проверками. Общие `teacherChoicesHtml` изменить только для setter `teacherSetFilter`; другие экраны не трогать.
- Vue использует тот же адаптер, текущие Enter/Space, фокус ввода поиска, сортировки/фильтры и переходы сохраняются.
- После патча проверить с Vue на 390/1280, без Vue/адаптера на 390, отделённые кнопки, два профиля, возврат, поиск, фильтры, сортировку, отсутствие дублей XP/монет/истории после offline F5, полную регрессию и PWA. Публиковать исключительно в тестовой ветке после CI PASS.
