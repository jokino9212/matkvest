'use strict';
const assert = require('node:assert/strict');
const {withMatkvestBrowser} = require('./matkvest_browser_harness.cjs');

const plans = [
  {grade: 5, topic: 'frac_to_mixed', stage: 0, mode: 'fraction'},
  {grade: 6, topic: 'g6:arithmetic_mean', stage: 0, mode: 'number'},
  {grade: 7, topic: 'g7:rational_arithmetic', stage: 0, mode: 'number'},
  {grade: 8, topic: 'g8:square_root_arithmetic', stage: 1, mode: 'number'},
];
const host = '#qstage[data-v-app]';

function exerciseState(page) {
  return page.locator(host).evaluate(exercise => ({
    attempt: blockSession.attemptId,
    item: blockSession.currentItem.itemId,
    question: q.sig || q.text,
    mode: q.answerMode,
    correct: blockSession.correct,
    fields: [...exercise.querySelectorAll('input[id]:not([type="hidden"])')].map(field => ({
      key: field.id,
      value: field.value,
      readonly: field.readOnly,
    })),
  }));
}

function score(page) {
  return page.evaluate(() => ({
    correct: blockSession.correct,
    done: blockSession.done,
    xp: state.xp,
    coins: state.coins,
  }));
}

function startExercise(page, plan) {
  return page.evaluate(({grade, topic, stage}) => window['startG' + grade + 'QuizStage'](topic, stage), plan);
}

async function checkScoring(page, plan, attempt) {
  const exercise = page.locator(host);
  const check = exercise.locator('#quizCheck');
  const beforeWrong = await score(page);
  await check.click();
  assert.deepEqual(await score(page), beforeWrong, 'Invalid input credited');
  assert((await exercise.locator('#qfb').innerText()).trim(), 'Missing invalid input feedback');
  assert(await check.isVisible(), 'Invalid input advanced the exercise');

  // Start a fresh attempt to measure first-try credit after checking the restored wrong answer.
  await startExercise(page, plan);
  await check.waitFor();
  assert.notEqual((await exerciseState(page)).attempt, attempt);
  const before = await score(page);
  const solution = await page.evaluate(() => {
    const {n, d} = q.answerRat;
    if (q.answerMode === 'fraction') {
      const denominator = Number(document.getElementById('quizFracDen').value);
      const whole = Math.floor(n / d);
      const numerator = (n - whole * d) * denominator / d;
      return {quizFracWhole: String(whole), quizFracNum: String(numerator)};
    }
    return {quizInput: d === 1 ? String(n) : n + '/' + d};
  });
  for (const [key, value] of Object.entries(solution)) {
    await exercise.locator('#' + key).fill(value);
  }
  await check.click();
  await exercise.locator('#quizNext').waitFor();
  const after = await score(page);
  assert.equal(after.correct, before.correct + 1, 'Correct answer not credited in Grade ' + plan.grade);
  assert.equal(after.done, before.done + 1);
  assert.equal(await check.isVisible(), false);
  // A repeated invocation must not award credit once the Next action is visible.
  await page.evaluate(() => checkQuizInput());
  assert.deepEqual(await score(page), after, 'Repeated Check credited twice');
}

async function checkDraft(browser, url, width, plan) {
  const context = await browser.newContext({
    viewport: {width, height: 690}, isMobile: width < 500, hasTouch: width < 500,
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  try {
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.evaluate(grade => openGrade(grade), plan.grade);
    await startExercise(page, plan);
    const exercise = page.locator(host);
    const check = exercise.locator('#quizCheck');
    await check.waitFor();
    const initial = await exerciseState(page);
    const editable = initial.fields.filter(field => !field.readonly);
    assert.equal(initial.mode, plan.mode);
    assert(initial.attempt && initial.item && initial.question, 'Missing attempt or question identity');
    assert.equal(editable.length, plan.mode === 'fraction' ? 2 : 1);
    if (plan.mode === 'fraction') {
      const denominator = initial.fields.find(field => field.key === 'quizFracDen');
      assert(denominator?.readonly && Number(denominator.value) > 0, 'Expected a fixed denominator');
    }

    const values = ['-123456789', '987654321'];
    const inputs = new Map(editable.map((field, index) => [field.key, values[index]]));
    for (const [key, value] of inputs) await exercise.locator('#' + key).fill(value);
    const before = await exerciseState(page);
    assert.deepEqual(before.fields, initial.fields.map(field => ({
      ...field, value: inputs.get(field.key) ?? field.value,
    })));

    await page.waitForFunction(({attempt, fields}) => {
      const draft = mk872ReadDraft();
      return draft?.schema === 2 && draft.attemptId === attempt && fields.every(expected =>
        draft.view.fields.some(field => field.key === expected.key && field.value === expected.value));
    }, before);
    const draft = await page.evaluate(() => mk872ReadDraft());
    assert.equal(draft.values.block.currentItem.itemId, before.item);

    for (const field of editable) await exercise.locator('#' + field.key).fill('7');
    await page.evaluate(draft => mk872RestoreDraft(draft), draft);
    await check.waitFor();
    assert.deepEqual(await exerciseState(page), before, 'In-place restore changed attempt or inputs');

    await context.setOffline(true);
    await page.reload({waitUntil: 'domcontentloaded'});
    const resume = page.getByRole('alertdialog', {name: /незавершённая тренировка/});
    await resume.getByRole('button', {name: 'Продолжить', exact: true}).press('Enter');
    await check.waitFor();
    assert.deepEqual(await exerciseState(page), before, 'Offline F5 changed attempt or inputs');
    assert(await page.locator('#overlay').evaluate(overlay => overlay.classList.contains('show')));

    const layout = await exercise.evaluate(stage => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      controls: [...stage.querySelectorAll('input[id]:not([type="hidden"]),#quizCheck')].map(control => {
        const {left, right, width, height} = control.getBoundingClientRect();
        return {id: control.id, left, right, width, height};
      }),
    }));
    assert(layout.scrollWidth <= width + 2, 'Horizontal page overflow');
    assert.equal(layout.controls.length, before.fields.length + 1);
    for (const control of layout.controls) {
      assert(control.width > 0 && control.height > 0 && control.left >= -2 && control.right <= layout.width + 2,
        'Hidden or clipped control: ' + JSON.stringify(control));
    }

    await checkScoring(page, plan, before.attempt);
    assert.deepEqual(pageErrors, []);
  } finally {
    await context.close();
  }
}

withMatkvestBrowser(async (browser, url) => {
  const failures = [];
  let passed = 0;
  for (const width of [320, 390, 768]) {
    for (const plan of plans) {
      try {
        await checkDraft(browser, url, width, plan);
        passed++;
        console.log('PASS_STAGE22', width, plan.grade, plan.topic, 'schema 2 and offline F5');
      } catch (error) {
        failures.push({width, grade: plan.grade, error: error.message});
        console.error('FAIL_STAGE22', width, plan.grade, error);
      }
    }
  }
  console.log('STAGE22_SUMMARY', JSON.stringify({passed, failures: failures.length}));
  assert.equal(failures.length, 0);
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
