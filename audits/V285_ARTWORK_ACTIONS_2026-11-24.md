# МатКвест — v285: кнопка закрытия просмотра аватара и питомца

Дата: 24 ноября 2026. PR #131 остаётся Draft, без слияния. Изменения приложения допускаются только в тестовой ветке `refactor/route-vue-actions-from-7c14ce9`.

## Актуальный CI и исходная опубликованная v284

- Начальный HEAD: `e9b2126f53280e5886e9c87b7eeaf8a6b50e9341`. Опубликована v284, кеш `matkvest-iphone-v284`, SHA256 HTML `eed085c9fd5a97d00cb3ba40f64287f33a951502f5f377631410cd09cc772416`.
- Специально запрошенный общий PWA run `45465007518` — **SUCCESS**, attempt 1. Legacy route module contracts `45465007555` — SUCCESS.
- На старте и после публикации `main`: `2985f92b6bd1a26dfcc316917f1752602b099572`. Ни production, ни backend не изменялись.

## Read-only инвентаризация

- Read-only inventory runs `45467533231` и `45467613571` — SUCCESS. Выбрана только одна независимая группа legacy UI actions в `<script id="mk30-artwork-viewer-script">`: закрытие полноэкранного увеличенного изображения аватара или питомца через кнопку.
- Код `open(item)` создавал новый viewer host при каждом открытии; HTML fallback задавал `button.onclick=close`, Vue `mountArtworkViewer(host,model,{close})`. Глобальный `close()` не проверял экземпляр host.
- Не изменялись selection, artwork model, modal markup, popstate/history/route handlers, Escape/Tab logic, оформление, профили или начисления.

## Баги воспроизведены ДО исправления

- Pre-fix browser run `45467792665` — SUCCESS как **тест воспроизведения**: Vue 390/1280 и HTML fallback 390 при недоступности Vue и legacy adapter.
- На v284 открыть первое изображение, закрыть через Escape и дождаться восстановления браузерной истории, открыть второе изображение, нажать **старую отсоединённую кнопку первого viewer**: ошибочно закрывался уже второй viewer.
- Во всех **3/3** сценариях `defectOldButton:true`. В Vue старый callback остался в размонтированном дереве; в HTML fallback он сохранился как `onclick` старой кнопки.
- Текущий профиль, маршрут, XP, монеты и история попыток не изменялись при воспроизведении. Никакие иные проблемы не объявлены подтверждёнными.

## v285: точечное исправление

- В `assets/ui/legacy-vue-actions.js` добавлен `artworkViewerActions({isCurrent,close})` со строгим guard.
- В исходном IIFE `index.html` каждый `open(item)` теперь создаёт собственную проверку `host.parentNode===popup && host.isConnected && popup.classList.contains('mk872-open')` и `viewerActions.close`. Этот callback используется как HTML fallback `onclick`, так и Vue `close` action.
- Существующий общий `close()`, native Escape/Tab, History API `popstate`, браузерное «Назад», фокус и поиск миниатюр сохранены без изменения логики.
- Версии скриптов и PWA кеш синхронизированы с v285. Без изменения схем данных, наград, профилей, баланса или backend.

## Полный регресс и публикация

- Защищённый релизный CI: https://github.com/jokino9212/matkvest/actions/runs/45468245759 — **SUCCESS**, attempt 1, job `138708850845`.
- SHA-fenced patch/PWA fingerprints: PASS, новый SHA256 HTML `e75007dd6af16c07d4b678a14f2156344b203e64c3fb23a819ffea2907739b1a`. Детерминированный Vue bundle и UI контракты v271–v285: PASS.
- Новый browser regression: Vue 390/1280, offline F5, HTML fallback 390 без Vue и adapter — **3/3 PASS**; старый detached close инертен, Enter/Space/Escape, возврат фокуса и маршрута, браузерная кнопка «Назад» и состояние наград: PASS.
- 12 независимых повторов подтверждения пропуска в HTML столбике: PASS.
- Вся ранее накопленная браузерная регрессия Vue/HTML fallback v271–v284, включая маршруты, профили, школьные тренажёры, журнал, отчёты, учителя, магазин, достижения, квесты, таблицу лидеров и справку: PASS.
- Полный PWA refresh v284→v285 online/offline F5 390 и 1280 px: PASS. Столбик +, −, ×, ÷, контрольная, работа над ошибками, прогресс и награды без повторных начислений: PASS.
- Responsive offline 320/390/768 px: **3/3 PASS**, сохранение профиля, XP/монет и магазина; кеш `matkvest-iphone-v285`.
- Только после полного CI защищённый publisher коммит `d6b67fbf93b14978cc5978bd579eecc61db368b3` записал **только** `index.html`, `sw.js`, `assets/ui/legacy-vue-actions.js` в `refactor/route-vue-actions-from-7c14ce9`.
- PR #131 остаётся Draft/unmerged; `main` `2985f92b6bd1a26dfcc316917f1752602b099572`; production и backend untouched.

## После релиза и следующий шаг

- Одноразовый v285 релизный gate перевести в режим ручного запуска без push-триггера. Служебные изменения CI/journal не должны менять опубликованные app файлы.
- Для v286 начать с CI после служебных коммитов, выполнить read-only инвентаризацию следующей маленькой группы legacy UI actions и доказать дефекты до исправлений. Vue и HTML fallback, клавиатура, offline F5, маршруты, результаты, XP/монеты без дублей; защищённая публикация только в тестовой ветке.
