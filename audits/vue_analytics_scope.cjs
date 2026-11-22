'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
const extract = (from, to) => {
  const start = source.indexOf(from);
  const end = source.indexOf(to, start);
  assert(start >= 0 && end > start);
  return source.slice(start, end);
};

const topics = [
  { key: 'g4:table', grade: 4, group: 'Вычисления', meaningful: 3, stages: [] },
  { key: 'g5:operations', grade: 5, group: 'Основы', meaningful: 3, stages: [] },
  { key: 'g6:divisibility', grade: 6, group: 'Делимость', meaningful: 3, stages: [] },
  { key: 'g4:order', grade: 4, group: 'Основы', meaningful: 2, stages: [] },
];
const errors = [{ grade: 4, key: 'g4:table' }, { grade: 4, key: 'g4:order' }];
const actions = { block: null, model: null };
const context = vm.createContext({
  state: {},
  errorWorkGradeFilter: 4,
  errorWorkTopicFilter: 'g4:table',
  collectErrorBacklog: () => errors,
  getStudiedTopics: (_, grade = null) => topics.filter(topic => grade === null || topic.grade === Number(grade)),
  analyticsTopicMeta: key => topics.find(topic => topic.key === key),
  sh: list => list,
  closeModal() {},
  renderHome() {},
  renderAnalyticsView({ model }) { actions.model = model; },
  startControlReviewBlock(plan, grade) { actions.block = { plan, grade }; },
  brandLogo: null,
  brandTitle: null,
  gradeBookIcon: () => '',
  document: { getElementById() { return null; } },
});
vm.runInContext(extract('function matchesErrorWorkScope(', 'function openErrorWork(grade='), context);
vm.runInContext(extract('let controlSetupGrade=', 'function startControlReviewBlock('), context);

assert.deepEqual(Array.from(context.activeErrorWorkPool(), item => item.key), ['g4:table']);
context.errorWorkTopicFilter = null;
assert.deepEqual(Array.from(context.activeErrorWorkPool(), item => item.key), ['g4:table', 'g4:order']);

context.openControlReview('mixed', 15);
assert.equal(actions.model.grade, 'mixed');
assert.equal(actions.model.studiedCount, 2);
assert.deepEqual(Array.from(actions.model.groups), ['Вычисления', 'Основы']);
context.startControlReview();
assert.equal(actions.block.grade, 'mixed');
assert.equal(actions.block.plan.length, 15);
assert.deepEqual(new Set(Array.from(actions.block.plan, item => item.key)), new Set(['g4:table', 'g5:operations']));
console.log('PASS: topic-scoped error pool and studied Grade 4 + 5 review plan');

const activeAttempt = {
  title: 'Таблица умножения',
  status: 'active',
  kind: 'controlreview',
  total: 10,
  done: 1,
  items: [{ label: 'Решённый пример', finalCorrect: true, firstTry: true, studentAnswer: 0, correctAnswer: 0 }],
  currentItem: { label: 'Следующий пример' },
};
const student = { activeAttempt };
let modal;
const reports = vm.createContext({
  state: { attemptHistory: [{ title: 'Мой журнал' }] },
  currentProfile: 'Текущий ученик',
  STAGES: [],
  normalizeReports() {},
  closeModal() {},
  showVueReport(mount, model, controls) { modal = { mount, model, controls }; },
  attemptStatusLabel: record => record.status,
  fmtDate: () => '',
  fmtDuration: () => '',
  safeAcademicHtml: value => String(value ?? ''),
  esc: value => String(value),
});
vm.runInContext(extract('function displayAttemptCorrect(', 'function rowHumanName('), reports);
vm.runInContext(extract('function reviewItemStatus(', 'const BACKUP_FORMAT='), reports);
reports.openAttemptJournal(student, 'Другой ученик', () => {});
assert.equal(modal.model.rows.length, 1);
assert.equal(modal.model.rows[0].score, '1/10');
modal.controls.review(0);
assert.equal(modal.model.items[0].studentHtml, '0');
assert.equal(modal.model.items[0].correctHtml, '0');
assert.equal(modal.model.items[1].status, '🟡 Не завершено');
assert.equal(modal.model.stats.find(stat => stat.label === 'неверно').value, 0);
modal.controls.journal();
assert.equal(modal.model.title, '📋 Журнал попыток — Другой ученик');
console.log('PASS: active report preserves zero answers and the selected student');

const stageStarts = [];
const stages = vm.createContext({
  STAGES: [
    { name: 'Разминка', count: 5, desc: 'Первый этап' },
    { name: 'Тренировка', count: 10, desc: 'Второй этап' },
    { name: 'Мастер', count: 10, desc: 'Третий этап' },
  ],
  keyGrade: () => 4,
  g4TheoryHtml: key => 'Теория ' + key,
  blockSession: {},
  progressFor: () => ({ best: [5, 0, 0] }),
  stagePassRequirement: () => '',
  stageUnlocked: (_, index) => index < 2,
  stagePassed: (_, index) => index === 0,
  completedStages: () => 1,
  closeModal() {},
  startColumnStage(id, index) { stageStarts.push([id, index]); },
  showVueReport(mount, model, controls) { modal = { mount, model, controls }; },
});
vm.runInContext(extract('const G4_COLUMN_OPERATIONS=', 'function activeDifficulty('), stages);
vm.runInContext(extract('function openTopic(id){', 'function g5WrongHint('), stages);
stages.openTopic('column');
assert.equal(modal.model.operations.length, 4);
modal.controls.operation('add');
assert.equal(modal.mount, 'mountCourseTopic');
assert.equal(modal.model.title, '＋ Сложение столбиком');
assert.equal(modal.model.stages[0].best, 5);
assert.equal(modal.model.stages[2].unlocked, false);
modal.controls.start(2);
modal.controls.start(1);
assert.deepEqual(stageStarts, [['add', 1]]);
stages.openTopic('column:div');
assert.equal(modal.model.title, '÷ Деление столбиком');
console.log('PASS: written calculation routes and stage unlock rules');
