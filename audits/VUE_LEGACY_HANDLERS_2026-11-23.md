# МатКвест: инвентаризация HTML ↔ Vue

Автоматический статический срез текущей тестовой ветки. Число упоминаний функции не доказывает, что она вызывается пользователем. Перенос шаблона в Vue не означает перенос управляющей логики.

## Сводка

| Метрика | Значение |
|---|---:|
| htmlBytes | 7607882 |
| htmlLines | 42203 |
| vueComponents | 81 |
| vueMounts | 66 |
| htmlFunctionDeclarations | 2787 |
| globalsAssigned | 27 |
| inlineEventAttributes | 273 |
| eventListeners | 62 |
| innerHTML | 105 |
| insertAdjacentHTML | 9 |
| outerHTML | 3 |
| document.write | 0 |

## Экранные Vue mount-точки

| Точка монтирования | Упоминания в index.html | Vue-файл |
|---|---:|---|
| `mountAchievementCatalog` | 2 | есть |
| `mountAppFooter` | 1 | есть |
| `mountAppHeader` | 4 | есть |
| `mountArtworkViewer` | 1 | есть |
| `mountAttemptJournal` | 1 | есть |
| `mountAttemptReview` | 1 | есть |
| `mountBackupDialog` | 1 | есть |
| `mountCollectionArchive` | 1 | есть |
| `mountCollectionNavigation` | 1 | есть |
| `mountCollectionSection` | 1 | есть |
| `mountCollectionWorth` | 1 | есть |
| `mountColumnExercise` | 1 | есть |
| `mountControlReview` | 1 | есть |
| `mountControlReviewResult` | 1 | есть |
| `mountCourseTopic` | 2 | есть |
| `mountDeveloperAccess` | 2 | есть |
| `mountDeveloperPanel` | 2 | есть |
| `mountErrorWork` | 1 | есть |
| `mountFractionMixIntro` | 1 | есть |
| `mountGradeCourse` | 1 | есть |
| `mountHomeDashboard` | 4 | есть |
| `mountKnowledgeMap` | 1 | есть |
| `mountLeaderboard` | 1 | есть |
| `mountLearningDialog` | 1 | есть |
| `mountPetQuickPanel` | 4 | есть |
| `mountPracticeResult` | 2 | есть |
| `mountProfilePreview` | 1 | есть |
| `mountQuestBoard` | 1 | есть |
| `mountQuestReplaceDialog` | 1 | есть |
| `mountQuickExercise` | 1 | есть |
| `mountQuickTrainerFrame` | 1 | есть |
| `mountQuickTrainerResult` | 1 | есть |
| `mountQuickTrainerSetup` | 1 | есть |
| `mountQuizExercise` | 3 | есть |
| `mountRewardNotice` | 4 | есть |
| `mountSchoolAttempt` | 0 | есть |
| `mountSchoolAttemptFrame` | 1 | есть |
| `mountStageResult` | 1 | есть |
| `mountStorageRecovery` | 1 | есть |
| `mountStoreCatalog` | 1 | есть |
| `mountStoreChest` | 1 | есть |
| `mountStoreChestResult` | 1 | есть |
| `mountStoreControls` | 1 | есть |
| `mountStoreHelpDialog` | 1 | есть |
| `mountStoreSaleDialog` | 1 | есть |
| `mountStoreSurfaceHeader` | 1 | есть |
| `mountStoreTabs` | 1 | есть |
| `mountStoreWallet` | 1 | есть |
| `mountStudentProfileEditor` | 1 | есть |
| `mountStudentProfiles` | 1 | есть |
| `mountStudentProgress` | 1 | есть |
| `mountTableExercise` | 3 | есть |
| `mountTeacherActionDialog` | 1 | есть |
| `mountTeacherDashboard` | 1 | есть |
| `mountTeacherPinDialog` | 3 | есть |
| `mountTeacherReview` | 1 | есть |
| `mountTeacherStudentDetail` | 1 | есть |
| `mountTeacherStudentReport` | 2 | есть |
| `mountTeacherTopicReview` | 1 | есть |
| `mountTopicDetail` | 1 | есть |
| `mountTrainingGoalPicker` | 1 | есть |
| `mountTrainingHistoryReport` | 1 | есть |
| `mountTrainingPlan` | 1 | есть |
| `mountTrainingPlanReturn` | 4 | есть |
| `mountTrainingProgress` | 0 | есть |
| `mountWeakTopics` | 1 | есть |

## Функции, сохраняющиеся в index.html

| Область | Имя | function declaration | Упоминания |
|---|---|---|---:|
| navigation_and_render | `renderHome` | да | 81 |
| navigation_and_render | `openGrade` | да | 8 |
| navigation_and_render | `openTopic` | да | 7 |
| navigation_and_render | `closeModal` | да | 166 |
| navigation_and_render | `showVueReport` | да | 21 |
| navigation_and_render | `renderAnalyticsView` | да | 7 |
| navigation_and_render | `openQuickTrainer` | да | 8 |
| navigation_and_render | `openTrainingPlan` | не обнаружено* | 0 |
| navigation_and_render | `openKnowledgeMap` | да | 5 |
| navigation_and_render | `openProfiles` | да | 12 |
| school_logic | `beginBlock` | да | 16 |
| school_logic | `finishBlock` | да | 9 |
| school_logic | `startQuizStage` | да | 3 |
| school_logic | `startTableStage` | да | 3 |
| school_logic | `startColumnStage` | да | 3 |
| school_logic | `startG5QuizStage` | да | 3 |
| school_logic | `skipNormalQuiz` | да | 2 |
| school_logic | `syncActiveAttempt` | да | 11 |
| quick_logic | `renderQuick` | не обнаружено* | 0 |
| quick_logic | `finishQuick` | не обнаружено* | 0 |
| quick_logic | `quickNext` | да | 3 |
| quick_logic | `quickAnswer` | да | 2 |
| quick_logic | `quickTrainer` | не обнаружено* | 0 |
| quick_logic | `quickSession` | не обнаружено* | 84 |
| persistence | `save` | да | 68 |
| persistence | `persistSilently` | да | 10 |
| persistence | `mk872PersistDraft` | да | 10 |
| persistence | `mk872ReadDraft` | да | 5 |
| persistence | `mk872RestoreDraft` | да | 2 |
| persistence | `mk872HasActiveLearning` | да | 12 |
| economy | `award` | да | 16 |
| economy | `grantReward` | не обнаружено* | 0 |
| economy | `openShop` | да | 52 |
| economy | `openCollection` | да | 24 |
| economy | `buyItem` | не обнаружено* | 0 |
| economy | `sellItem` | не обнаружено* | 0 |
| economy | `renderShop` | не обнаружено* | 0 |
| teacher | `openTeacherDashboard` | да | 21 |
| teacher | `openTeacherStudentDetailById` | да | 14 |
| teacher | `openAttemptJournal` | да | 7 |
| teacher | `openControlReview` | да | 7 |

* Функция также может быть стрелочной или назначаться через объект.

## Старые DOM события

| Inline-атрибут | Количество |
|---|---:|
| change | 5 |
| click | 257 |
| input | 4 |
| keydown | 6 |
| submit | 1 |

Обработчики `addEventListener`: {'click': 20, 'input': 5, 'keydown': 11, 'submit': 3, 'afterprint': 1, 'popstate': 3, 'domcontentloaded': 5, 'change': 4, 'controllerchange': 1, 'load': 1, 'visibilitychange': 1, 'focus': 1, 'pagehide': 1, 'beforeunload': 1, 'focusin': 3, 'scroll': 1}.

Примеры (первые 60)

| Строка | Event | Handler excerpt |
|---:|---|---|
| 1794 | click | `mk872BrandGoHome()` |
| 1796 | click | `openProfiles()` |
| 1798 | click | `mk19eWallet()` |
| 1801 | click | `openShop()` |
| 1802 | click | `openDataManager()` |
| 1803 | click | `openAttemptJournal()` |
| 1804 | click | `openLeaderboard()` |
| 1819 | click | `if(event.target.id==='overlay')closeModal()` |
| 10434 | click | `achievementSetView('${id}')` |
| 10440 | change | `achievementSetCategory(this.value)` |
| 10441 | change | `achievementSetSort(this.value)` |
| 10449 | click | `closeModal()` |
| 10600 | click | `openShop('collection')` |
| 10651 | click | `mk872HelpOpen('${topic}',this)` |
| 10651 | click | `closeModal()` |
| 10679 | click | `openStoreTab(\''+tab.id+'\')` |
| 10683 | change | `openStoreTab(this.value)` |
| 10688 | click | `openShop('${category}','${id}')` |
| 10744 | click | `runShopCardAction('${type}','${card.id}','${action}')` |
| 10861 | click | `toggleFavoriteSticker('${x.id}')` |
| 10865 | click | `toggleProfileBadge('${x.id}','collection')` |
| 10866 | click | `mk872HelpOpen('collection',this)` |
| 10866 | click | `closeModal()` |
| 10866 | click | `openShop('titles')` |
| 10866 | click | `openShop('backgrounds')` |
| 10866 | click | `openShop('badges')` |
| 10866 | click | `openShop('stickers')` |
| 10866 | click | `openAchievements()` |
| 11329 | click | `closeModal()` |
| 11332 | click | `exportBackup('all')` |
| 11333 | click | `exportBackup('current')` |
| 11336 | change | `readBackupFile(this.files?.[0])` |
| 11370 | click | `closeModal()` |
| 11370 | click | `openDataManager()` |
| 11454 | click | `closeModal()` |
| 11461 | click | `downloadCorruptProfiles()` |
| 11462 | click | `mergePendingImport()` |
| 11463 | click | `confirmReplaceImport()` |
| 11463 | click | `openDataManager()` |
| 11599 | click | `showImportPreview(pendingImport,pendingImportFilename)` |
| 11607 | click | `resolveImportConflict('same')` |
| 11608 | click | `resolveImportConflict('different')` |
| 11609 | click | `resolveImportConflict('skip')` |
| 11663 | click | `closeModal()` |
| 11667 | click | `openProfiles()` |
| 11667 | click | `openDataManager()` |
| 11674 | click | `closeModal()` |
| 11678 | click | `downloadCorruptProfiles()` |
| 11679 | click | `replaceWithPendingImport()` |
| 11680 | click | `showImportPreview(pendingImport,pendingImportFilename)` |
| 11815 | click | `selectProfile(${i})` |
| 11816 | click | `closeModal()` |
| 11816 | click | `openShop()` |
| 11816 | click | `openCollection()` |
| 11816 | keydown | `if(event.key==='Enter')createProfile()` |
| 11816 | click | `createProfile()` |
| 11866 | click | `mk872HelpOpen('leader',this)` |
| 11867 | click | `closeModal()` |
| 11987 | click | `${ready?'openG3Topic('${t.id}')':'showG3Pending('${t.id}')'}` |
| 11995 | click | `renderHome()` |

## Vue-события по компонентам

| Компонент | Click | Keyboard | Input | v-model |
|---|---:|---:|---:|---:|
| `AchievementCatalog` | 1 | 0 | 2 | 0 |
| `AnswerChoices` | 1 | 0 | 0 | 0 |
| `AppFooter` | 1 | 0 | 0 | 0 |
| `AppHeader` | 5 | 0 | 0 | 0 |
| `ArtworkViewer` | 1 | 0 | 0 | 0 |
| `AttemptJournal` | 2 | 0 | 0 | 0 |
| `AttemptReview` | 2 | 0 | 0 | 0 |
| `BackupDialog` | 16 | 0 | 1 | 0 |
| `CollectionArchive` | 2 | 0 | 0 | 0 |
| `CollectionNavigation` | 1 | 0 | 0 | 0 |
| `CollectionSection` | 1 | 0 | 0 | 0 |
| `CollectionWorth` | 0 | 0 | 0 | 0 |
| `ColumnCells` | 1 | 1 | 1 | 0 |
| `ColumnExercise` | 2 | 1 | 0 | 0 |
| `ControlReview` | 4 | 0 | 0 | 0 |
| `ControlReviewResult` | 6 | 0 | 0 | 0 |
| `CourseSectionProgress` | 0 | 0 | 0 | 0 |
| `CourseTopic` | 2 | 0 | 0 | 0 |
| `DeveloperAccess` | 1 | 0 | 1 | 0 |
| `DeveloperPanel` | 6 | 0 | 2 | 0 |
| `ErrorWork` | 9 | 0 | 1 | 0 |
| `FractionMixIntro` | 1 | 0 | 0 | 0 |
| `GradeCourse` | 5 | 0 | 0 | 1 |
| `GradeFilters` | 2 | 0 | 0 | 0 |
| `HomeDashboard` | 10 | 0 | 0 | 0 |
| `KnowledgeMap` | 4 | 0 | 1 | 0 |
| `Leaderboard` | 2 | 0 | 0 | 0 |
| `LearningDialog` | 1 | 0 | 0 | 0 |
| `PetQuickPanel` | 2 | 0 | 0 | 0 |
| `PracticeResult` | 3 | 0 | 0 | 0 |
| `ProfilePreview` | 0 | 0 | 0 | 0 |
| `QuestBoard` | 3 | 0 | 0 | 0 |
| `QuestReplaceDialog` | 2 | 0 | 0 | 0 |
| `QuickExercise` | 3 | 3 | 0 | 0 |
| `QuickTrainerFrame` | 1 | 0 | 0 | 0 |
| `QuickTrainerResult` | 2 | 1 | 0 | 0 |
| `QuickTrainerSetup` | 5 | 1 | 0 | 0 |
| `QuizExercise` | 3 | 4 | 0 | 0 |
| `ReportHeader` | 1 | 0 | 0 | 0 |
| `ReportStats` | 0 | 0 | 0 | 0 |
| `RewardNotice` | 0 | 0 | 0 | 0 |
| `SchoolAttempt` | 3 | 0 | 1 | 0 |
| `SchoolAttemptFrame` | 0 | 0 | 0 | 0 |
| `StageResult` | 4 | 0 | 0 | 0 |
| `StorageRecovery` | 2 | 0 | 0 | 0 |
| `StoreCatalog` | 2 | 0 | 0 | 0 |
| `StoreChest` | 2 | 0 | 0 | 0 |
| `StoreChestResult` | 3 | 0 | 0 | 0 |
| `StoreControls` | 1 | 0 | 1 | 0 |
| `StoreHelpDialog` | 1 | 0 | 0 | 0 |
| `StoreSaleDialog` | 3 | 0 | 0 | 0 |
| `StoreSurfaceHeader` | 2 | 0 | 0 | 0 |
| `StoreTabs` | 1 | 0 | 1 | 0 |
| `StoreWallet` | 2 | 0 | 0 | 0 |
| `StudentProfileEditor` | 2 | 0 | 1 | 1 |
| `StudentProfiles` | 4 | 0 | 1 | 0 |
| `StudentProgress` | 1 | 0 | 0 | 0 |
| `StudentReportDocument` | 0 | 0 | 0 | 0 |
| `StudentReportKpis` | 0 | 0 | 0 | 0 |
| `StudentReportRows` | 0 | 0 | 0 | 0 |
| `TableExercise` | 2 | 1 | 0 | 0 |
| `TeacherActionDialog` | 4 | 1 | 2 | 1 |
| `TeacherCourseProgress` | 0 | 0 | 0 | 0 |
| `TeacherDashboard` | 7 | 0 | 2 | 0 |
| `TeacherPinDialog` | 1 | 1 | 1 | 0 |
| `TeacherReview` | 4 | 0 | 0 | 0 |
| `TeacherStudentAnalytics` | 4 | 0 | 0 | 0 |
| `TeacherStudentDetail` | 11 | 0 | 0 | 0 |
| `TeacherStudentMilestones` | 0 | 0 | 0 | 0 |
| `TeacherStudentReport` | 6 | 0 | 3 | 0 |
| `TeacherTopicReview` | 1 | 0 | 0 | 0 |
| `TextbookContents` | 3 | 0 | 0 | 0 |
| `TopicCard` | 1 | 0 | 0 | 0 |
| `TopicDetail` | 4 | 0 | 0 | 0 |
| `TrainingGoalPicker` | 1 | 0 | 0 | 0 |
| `TrainingHistoryReport` | 0 | 0 | 0 | 0 |
| `TrainingHistoryRows` | 0 | 0 | 0 | 0 |
| `TrainingPlan` | 3 | 0 | 0 | 0 |
| `TrainingPlanReturn` | 1 | 0 | 0 | 0 |
| `TrainingProgress` | 0 | 0 | 0 | 0 |
| `WeakTopics` | 6 | 0 | 1 | 0 |

## Граница ответственности

- В Vue уже размещены шаблоны экрана, содержащиеся в файлах компонентов и смонтированные через mount-мост.
- В legacy HTML остаются маршрутизаторы и функции подготовки моделей, генераторы заданий, запись локальных попыток, прогресс, экономика и обработчики из таблицы — до отдельной миграции.
- Часть legacy-функций является контроллерами Vue, а не дублирующими HTML-экранами: нельзя удалять по имени без call graph и браузерной проверки.
- Нужна отдельная проверка интерактивных inline-атрибутов, динамически созданных из HTML строк, и остальных чистых JS-обработчиков.

## Проверенные границы

- Эта инвентаризация НЕ утверждает, что полный backend уже готов.
- Эта инвентаризация НЕ заменяет e2e на мобильном и настольном разрешениях и офлайн-F5.
